'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { qrScannerAPI } from '@/lib/api';
import { QrCode, CheckCircle, XCircle, Camera, CameraOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

const QRScannerPage = () => {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [operationId, setOperationId] = useState<number | null>(null);
  const [quantityGood, setQuantityGood] = useState('');
  const [quantityScrap, setQuantityScrap] = useState('');
  const [quantityPending, setQuantityPending] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [machineId, setMachineId] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeField, setActiveField] = useState<'badge' | 'qr' | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const badgeScannerRef = useRef<HTMLDivElement>(null);
  const qrScannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Stop scanning when component unmounts
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignore errors when stopping
        });
      }
    };
  }, []);

  const startScanning = async (field: 'badge' | 'qr') => {
    // Stop any existing scanner first
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (error) {
        // Ignore errors when stopping
      }
      scannerRef.current = null;
    }

    setActiveField(field);
    setIsScanning(true);
    
    const scannerElementId = field === 'badge' ? 'badge-scanner' : 'qr-scanner';
    
    // Wait for the DOM element to be available (React needs time to render)
    let element: HTMLElement | null = null;
    let retries = 0;
    const maxRetries = 20; // Increased retries for slower devices
    
    while (!element && retries < maxRetries) {
      element = document.getElementById(scannerElementId);
      if (!element) {
        retries++;
        if (retries >= maxRetries) {
          const error = new Error(`HTML Element with id=${scannerElementId} not found`);
          console.error('Error starting scanner:', error);
          toast.error('Failed to start scanner. Please try again.');
          setIsScanning(false);
          setActiveField(null);
          return;
        }
        // Wait a bit before retrying (React needs time to render)
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    try {
      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned
          if (field === 'badge') {
            setBadgeId(decodedText);
          } else {
            setQrCode(decodedText);
          }
          stopScanning();
          toast.success('QR code scanned successfully!');
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent and expected)
        }
      );
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      toast.error('Failed to start camera. Please check permissions.');
      setIsScanning(false);
      setActiveField(null);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (error) {
        // Ignore errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setActiveField(null);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Stop scanning before submitting
    if (scannerRef.current) {
      await stopScanning();
    }
    
    try {
      const result = await qrScannerAPI.scan(qrCode, badgeId);
      setScanResult(result);
      
      if (result.success) {
        toast.success(result.message);
        
        if (result.status === 'awaiting_completion') {
          setOperationId(result.operation_id);
          setShowCompletionForm(true);
        } else {
          // Operation started successfully
          setQrCode('');
          setBadgeId('');
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Scan failed');
    }
  };

  const handleCompleteOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!operationId) return;

    try {
      const result = await qrScannerAPI.completeOperation(operationId, {
        quantity_good: parseInt(quantityGood),
        quantity_scrap: parseInt(quantityScrap),
        quantity_pending: parseInt(quantityPending),
        operator_notes: operatorNotes,
        machine_id: machineId ? parseInt(machineId) : undefined,
      });

      toast.success('Operation completed successfully!');
      
      // Reset form
      setShowCompletionForm(false);
      setOperationId(null);
      setQuantityGood('');
      setQuantityScrap('');
      setQuantityPending('');
      setOperatorNotes('');
      setMachineId('');
      setQrCode('');
      setBadgeId('');
      setScanResult(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to complete operation');
    }
  };

  return (
    <PageModal>
      <div className="h-full overflow-y-auto flex flex-col px-4">
          <div className="max-w-4xl mx-auto py-6">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <QrCode className="w-12 h-12 text-yellow-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold gold-text mb-1">QR Scanner</h1>
            <p className="text-gray-400 text-sm">Scan operator badge and process QR codes</p>
          </div>

        {!showCompletionForm ? (
          /* Scan Form */
          <div className="card-aurexia p-6 max-w-2xl mx-auto">
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Operator Badge ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="Scan operator badge..."
                    required
                    autoFocus
                    className="w-full px-4 py-3 pr-12 bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => activeField === 'badge' ? stopScanning() : startScanning('badge')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
                    title={activeField === 'badge' ? 'Stop camera' : 'Start camera scanner'}
                  >
                    {activeField === 'badge' ? (
                      <CameraOff className="w-5 h-5" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {/* Camera scanner container for badge */}
                {activeField === 'badge' && (
                  <div className="mt-3">
                    <div id="badge-scanner" ref={badgeScannerRef} className="w-full max-w-md mx-auto rounded-lg overflow-hidden border border-yellow-500/30"></div>
                    <p className="text-xs text-gray-400 text-center mt-2">Point camera at operator badge QR code</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Operation QR Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Scan operation QR code..."
                    required
                    className="w-full px-4 py-3 pr-12 bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => activeField === 'qr' ? stopScanning() : startScanning('qr')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
                    title={activeField === 'qr' ? 'Stop camera' : 'Start camera scanner'}
                  >
                    {activeField === 'qr' ? (
                      <CameraOff className="w-5 h-5" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {/* Camera scanner container for QR code */}
                {activeField === 'qr' && (
                  <div className="mt-3">
                    <div id="qr-scanner" ref={qrScannerRef} className="w-full max-w-md mx-auto rounded-lg overflow-hidden border border-yellow-500/30"></div>
                    <p className="text-xs text-gray-400 text-center mt-2">Point camera at operation QR code</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn-aurexia py-2 text-sm font-semibold"
              >
                Scan QR Code
              </button>
            </form>

            {scanResult && scanResult.success && scanResult.status !== 'awaiting_completion' && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium">{scanResult.message}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Process: {scanResult.process_name || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {scanResult && !scanResult.success && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm">{scanResult.message}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Completion Form */
          <div className="card-aurexia p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-100 mb-4 text-center">
              Complete Operation
            </h2>
            <p className="text-center text-gray-400 mb-4 text-sm">
              Process: <span className="text-yellow-400">{scanResult?.process_name}</span>
            </p>

            <form onSubmit={handleCompleteOperation} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Good Quantity
                  </label>
                  <input
                    type="number"
                    value={quantityGood}
                    onChange={(e) => setQuantityGood(e.target.value)}
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-green-500/30 rounded-lg focus:outline-none focus:border-green-500 text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scrap Quantity
                  </label>
                  <input
                    type="number"
                    value={quantityScrap}
                    onChange={(e) => setQuantityScrap(e.target.value)}
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-red-500/30 rounded-lg focus:outline-none focus:border-red-500 text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pending Quantity
                  </label>
                  <input
                    type="number"
                    value={quantityPending}
                    onChange={(e) => setQuantityPending(e.target.value)}
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Machine ID (Optional)
                </label>
                <input
                  type="text"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  placeholder="Machine ID"
                  className="w-full px-3 py-2 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Notes / Comments
                </label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  rows={2}
                  placeholder="Any notes or comments..."
                  className="w-full px-3 py-2 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={async () => {
                    // Stop scanning if active
                    if (scannerRef.current) {
                      await stopScanning();
                    }
                    setShowCompletionForm(false);
                    setOperationId(null);
                    setScanResult(null);
                    setQrCode('');
                    setBadgeId('');
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-black/30 backdrop-blur-sm hover:bg-black/40 text-gray-100 font-semibold rounded-lg border border-gray-500/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-aurexia py-2 text-sm font-semibold"
                >
                  Complete Operation
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 card-aurexia p-4 max-w-2xl mx-auto">
          <h3 className="text-sm font-semibold text-gray-200 mb-2">Instructions</h3>
          <ol className="space-y-1 text-xs text-gray-400">
            <li>1. Click the camera icon to scan your operator badge ID or enter manually</li>
            <li>2. Click the camera icon to scan the operation QR code from the travel sheet or enter manually</li>
            <li>3. If starting an operation, it will be marked as "In Progress"</li>
            <li>4. Scan again to complete the operation and enter quantities</li>
            <li>5. Enter good, scrap, and pending quantities</li>
            <li>6. Add any notes or comments and submit</li>
          </ol>
        </div>
          </div>
      </div>
    </PageModal>
  );
};

export default QRScannerPage;
