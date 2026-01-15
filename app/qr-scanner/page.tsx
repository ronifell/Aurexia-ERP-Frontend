'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { qrScannerAPI } from '@/lib/api';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      <div className="h-full overflow-hidden flex flex-col px-4">
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
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder="Scan operator badge..."
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Operation QR Code
                </label>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Scan operation QR code..."
                  required
                  className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                />
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
                  onClick={() => {
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
            <li>1. Scan your operator badge ID</li>
            <li>2. Scan the operation QR code from the travel sheet</li>
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
