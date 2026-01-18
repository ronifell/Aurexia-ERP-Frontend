'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { ProductionOrder, PartNumber, SalesOrder, TravelSheet } from '@/lib/types';
import { productionOrdersAPI } from '@/lib/api';
import { useProductionOrders, usePartNumbers, useSalesOrders } from '@/lib/hooks';
import { Plus, Search, FileText, Eye, Edit, Trash2, X, QrCode, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Lazy load QR code component
const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-[120px] h-[120px] bg-white rounded-lg animate-pulse" />
});

const ProductionPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [showTravelSheetModal, setShowTravelSheetModal] = useState(false);
  const [travelSheets, setTravelSheets] = useState<TravelSheet[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [loadingTravelSheets, setLoadingTravelSheets] = useState(false);
  const [formData, setFormData] = useState({
    sales_order_id: '',
    part_number_id: '',
    quantity: '',
    start_date: '',
    due_date: '',
    priority: 'Normal',
    status: 'Created',
  });

  // Use SWR hooks for optimized data fetching with caching
  const { orders: ordersData, isLoading: ordersLoading, refresh: refreshOrders } = useProductionOrders();
  const { partNumbers: partNumbersData, isLoading: partNumbersLoading } = usePartNumbers();
  const { orders: salesOrdersData, isLoading: salesOrdersLoading } = useSalesOrders();

  const loading = ordersLoading || partNumbersLoading || salesOrdersLoading;

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (ordersData) setOrders(ordersData);
    if (partNumbersData) setPartNumbers(partNumbersData);
    if (salesOrdersData) setSalesOrders(salesOrdersData);
  }, [ordersData, partNumbersData, salesOrdersData]);

  const loadOrders = () => {
    refreshOrders();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrder) {
        // Update: Only send fields that can be updated
        const updateData: any = {
          priority: formData.priority,
        };
        
        // Only include optional fields if they have values
        if (formData.status) {
          updateData.status = formData.status;
        }
        if (formData.start_date) {
          updateData.start_date = formData.start_date;
        }
        if (formData.due_date) {
          updateData.due_date = formData.due_date;
        }

        await productionOrdersAPI.update(editingOrder.id, updateData);
        toast.success('Production order updated successfully!');
      } else {
        // Create: Send only create-specific fields
        const createData: any = {
          part_number_id: parseInt(formData.part_number_id),
          quantity: parseInt(formData.quantity),
          priority: formData.priority,
        };
        
        // Only include optional fields if they have values
        if (formData.sales_order_id) {
          createData.sales_order_id = parseInt(formData.sales_order_id);
        }
        if (formData.due_date) {
          createData.due_date = formData.due_date;
        }

        await productionOrdersAPI.create(createData);
        toast.success('Production order created successfully!');
      }
      
      handleCloseModal();
      loadOrders();
    } catch (error: any) {
      console.error('Form submission error:', error);
      const errorMessage = error.detail || error.message || 'Failed to save production order';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (order: ProductionOrder) => {
    setEditingOrder(order);
    setFormData({
      sales_order_id: order.sales_order_id?.toString() || '',
      part_number_id: order.part_number_id.toString(),
      quantity: order.quantity.toString(),
      start_date: order.start_date?.split('T')[0] || '',
      due_date: order.due_date?.split('T')[0] || '',
      priority: order.priority,
      status: order.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, poNumber: string) => {
    if (!confirm(`Are you sure you want to delete production order "${poNumber}"?`)) {
      return;
    }
    
    try {
      await productionOrdersAPI.delete(id);
      toast.success('Production order deleted successfully!');
      loadOrders();
    } catch (error: any) {
      const errorMessage = error.detail || 'Failed to delete production order';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      sales_order_id: '',
      part_number_id: '',
      quantity: '',
      start_date: '',
      due_date: '',
      priority: 'Normal',
      status: 'Created',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    resetForm();
  };

  const handleGenerateTravelSheet = async (orderId: number) => {
    try {
      await productionOrdersAPI.generateTravelSheet(orderId);
      toast.success('Travel sheet generated successfully!');
      loadOrders();
    } catch (error: any) {
      toast.error(error.detail || 'Failed to generate travel sheet');
    }
  };

  const handleViewTravelSheets = async (order: ProductionOrder) => {
    setSelectedOrder(order);
    setLoadingTravelSheets(true);
    setShowTravelSheetModal(true);
    
    try {
      const sheets = await productionOrdersAPI.getTravelSheets(order.id);
      setTravelSheets(sheets);
    } catch (error: any) {
      toast.error(error.detail || 'Failed to load travel sheets');
      setTravelSheets([]);
    } finally {
      setLoadingTravelSheets(false);
    }
  };

  const handleCloseTravelSheetModal = () => {
    setShowTravelSheetModal(false);
    setSelectedOrder(null);
    setTravelSheets([]);
  };

  const handlePrintTravelSheet = () => {
    // Add print-specific styles before printing
    const style = document.createElement('style');
    style.id = 'print-styles-temp';
    style.innerHTML = `
      @media print {
        @page { size: A4; margin: 1.5cm; }
        body * { visibility: hidden; }
        .print-modal, .print-modal * { visibility: visible; }
        .print-modal { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    
    window.print();
    
    // Remove temporary styles after printing
    setTimeout(() => {
      const tempStyle = document.getElementById('print-styles-temp');
      if (tempStyle) tempStyle.remove();
    }, 1000);
  };

  const filteredOrders = orders.filter(order =>
    order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.part_number?.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Created': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Released': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'In Progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <PageModal>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading production orders...</p>
          </div>
        </div>
      </PageModal>
    );
  }

  return (
    <PageModal>
      <div className="min-h-full flex flex-col px-6 py-4">
          <div className="w-full py-4 flex flex-col max-w-[2000px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold gold-text mb-1">Production Orders</h1>
              <p className="text-gray-400 text-sm">Manufacturing work orders and travel sheets</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-aurexia flex items-center space-x-2 text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Production Order</span>
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by PO number or part number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="card-aurexia p-4 flex-1 min-h-[400px]">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
              <table className="w-full text-sm">
                <thead className="bg-black/50 backdrop-blur-sm">
                  <tr className="border-b border-yellow-500/20">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">PO Number</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Part Number</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Quantity</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Completed</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Scrap</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Priority</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Status</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        <p className="text-sm">No production orders found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                        <td className="py-2 px-3 text-gray-200 font-medium text-xs">{order.po_number}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{order.part_number?.part_number || '-'}</td>
                        <td className="py-2 px-3 text-center text-gray-200 text-xs">{order.quantity}</td>
                        <td className="py-2 px-3 text-center text-green-400 text-xs">{order.quantity_completed}</td>
                        <td className="py-2 px-3 text-center text-red-400 text-xs">{order.quantity_scrapped}</td>
                        <td className="py-2 px-3">
                          <div className="flex justify-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityBadgeClass(order.priority)}`}>
                              {order.priority}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex justify-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeClass(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => handleGenerateTravelSheet(order.id)}
                              className="relative p-1.5 rounded-lg text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 hover:scale-125 hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 animate-pulse-slow group overflow-hidden"
                              title="Generate Travel Sheet"
                            >
                              <span className="absolute inset-0 animate-shimmer"></span>
                              <FileText className="w-3.5 h-3.5 relative z-10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                              <span className="absolute inset-0 rounded-lg bg-yellow-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                            </button>
                            <button 
                              onClick={() => handleViewTravelSheets(order)}
                              className="p-1.5 hover:bg-purple-500/10 rounded-lg text-gray-400 hover:text-purple-400 hover:scale-110 transition-all duration-200"
                              title="View Travel Sheets"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleEdit(order)}
                              className="p-1.5 hover:bg-blue-500/10 rounded-lg text-gray-400 hover:text-blue-400 hover:scale-110 transition-all duration-200"
                              title="Edit order"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(order.id, order.po_number)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 hover:scale-110 transition-all duration-200"
                              title="Delete order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create/Edit Production Order Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">
                  {editingOrder ? 'Edit Production Order' : 'Create New Production Order'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Show PO Number only when editing (read-only) */}
                  {editingOrder && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        PO Number
                      </label>
                      <input
                        type="text"
                        disabled
                        value={editingOrder.po_number}
                        className="w-full px-4 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-400 font-mono cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">PO Number cannot be changed</p>
                    </div>
                  )}

                  {/* Sales Order - only editable when creating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sales Order (Optional)
                    </label>
                    {editingOrder ? (
                      <input
                        type="text"
                        disabled
                        value={editingOrder.sales_order_id ? 
                          salesOrders.find(so => so.id === editingOrder.sales_order_id)?.po_number || 'N/A' 
                          : 'No linked sales order'}
                        className="w-full px-4 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={formData.sales_order_id}
                        onChange={(e) => setFormData({...formData, sales_order_id: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      >
                        <option value="">No linked sales order</option>
                        {salesOrders.map(so => (
                          <option key={so.id} value={so.id}>
                            {so.po_number} - {so.customer?.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Part Number - only editable when creating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Part Number *
                    </label>
                    {editingOrder ? (
                      <input
                        type="text"
                        disabled
                        value={editingOrder.part_number?.part_number || 'N/A'}
                        className="w-full px-4 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-400 font-mono cursor-not-allowed"
                      />
                    ) : (
                      <select
                        required
                        value={formData.part_number_id}
                        onChange={(e) => setFormData({...formData, part_number_id: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      >
                        <option value="">Select part number...</option>
                        {partNumbers.map(pn => (
                          <option key={pn.id} value={pn.id}>
                            {pn.part_number} {pn.description ? `- ${pn.description}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Quantity - only editable when creating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity *
                    </label>
                    {editingOrder ? (
                      <input
                        type="text"
                        disabled
                        value={editingOrder.quantity}
                        className="w-full px-4 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                    ) : (
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                        placeholder="100"
                      />
                    )}
                  </div>

                  {/* Start Date - only editable when editing */}
                  {editingOrder && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      />
                    </div>
                  )}

                  {/* Due Date - editable in both modes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>

                  {/* Priority - always editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority *
                    </label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Status - only editable when editing */}
                  {editingOrder && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status *
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      >
                        <option value="Created">Created</option>
                        <option value="Released">Released</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Information note for editing */}
                {editingOrder && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-xs text-blue-300">
                      Note: Part Number, Quantity, and Sales Order cannot be changed after creation.
                    </p>
                  </div>
                )}

                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-aurexia py-3"
                  >
                    {editingOrder ? 'Update Order' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Travel Sheet Viewing Modal */}
        {showTravelSheetModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print-modal">
            <div className="card-aurexia p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto print-content">
              {/* Screen-only Header */}
              <div className="flex justify-between items-center mb-6 no-print">
                <div>
                  <h2 className="text-2xl font-bold text-gray-100">Travel Sheets</h2>
                  {selectedOrder && (
                    <p className="text-sm text-gray-400 mt-1">
                      Production Order: {selectedOrder.po_number} - {selectedOrder.part_number?.part_number}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrintTravelSheet}
                    className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400"
                    title="Print"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCloseTravelSheetModal}
                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Print-only Professional Header */}
              <div className="print-header">
                <div className="print-header-border">
                  <div className="print-logo">AUREXIA</div>
                  <div className="print-subtitle">Manufacturing Excellence</div>
                  <div className="print-doc-type">Production Travel Sheet</div>
                </div>
              </div>

              {/* Production Order Details Section - Enhanced for Print */}
              {selectedOrder && (
                <div className="mb-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg print-section">
                  <h3 className="text-lg font-semibold text-blue-400 mb-4 print-section-title">
                    PRODUCTION ORDER DETAILS
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <div className="print-field">
                      <p className="text-gray-500 text-xs mb-1 print-field-label">PO Number</p>
                      <p className="text-gray-200 font-mono font-medium print-field-value">{selectedOrder.po_number}</p>
                    </div>
                    <div className="print-field">
                      <p className="text-gray-500 text-xs mb-1 print-field-label">Part Number</p>
                      <p className="text-gray-200 font-mono font-medium print-field-value">{selectedOrder.part_number?.part_number || 'N/A'}</p>
                    </div>
                    <div className="print-field">
                      <p className="text-gray-500 text-xs mb-1 print-field-label">Description</p>
                      <p className="text-gray-300 print-field-value">{selectedOrder.part_number?.description || 'N/A'}</p>
                    </div>
                    <div className="print-field">
                      <p className="text-gray-500 text-xs mb-1 print-field-label">Material Type</p>
                      <p className="text-gray-300 print-field-value">{selectedOrder.part_number?.material_type || 'N/A'}</p>
                    </div>
                    <div className="print-field">
                      <p className="text-gray-500 text-xs mb-1 print-field-label">Order Quantity</p>
                      <p className="text-yellow-400 font-bold text-lg print-field-value">{selectedOrder.quantity}</p>
                    </div>
                    <div className="print-field">
                      <p className="text-gray-500 text-xs mb-1 print-field-label">Completed</p>
                      <p className="text-green-400 font-bold text-lg print-field-value">{selectedOrder.quantity_completed}</p>
                    </div>
                    <div className="print-field">
                      <p className="text-gray-500 text-xs mb-1 print-field-label">Scrapped</p>
                      <p className="text-red-400 font-bold text-lg print-field-value">{selectedOrder.quantity_scrapped}</p>
                    </div>
                    <div className="print-field">
                      <p className="text-gray-500 text-xs mb-1 print-field-label">Priority</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeClass(selectedOrder.priority)}`}>
                        {selectedOrder.priority}
                      </span>
                    </div>
                    {selectedOrder.start_date && (
                      <div className="print-field">
                        <p className="text-gray-500 text-xs mb-1 print-field-label">Start Date</p>
                        <p className="text-gray-300 print-field-value">{new Date(selectedOrder.start_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedOrder.due_date && (
                      <div className="print-field">
                        <p className="text-gray-500 text-xs mb-1 print-field-label">Due Date</p>
                        <p className="text-gray-300 print-field-value">{new Date(selectedOrder.due_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedOrder.part_number?.unit_price !== null && selectedOrder.part_number?.unit_price !== undefined && (
                      <div className="print-field">
                        <p className="text-gray-500 text-xs mb-1 print-field-label">Unit Price</p>
                        <p className="text-green-400 font-medium print-field-value">
                          ${Number(selectedOrder.part_number.unit_price).toFixed(2)}
                        </p>
                      </div>
                    )}
                    {selectedOrder.part_number?.unit_price !== null && selectedOrder.part_number?.unit_price !== undefined && selectedOrder.quantity && (
                      <div className="print-field">
                        <p className="text-gray-500 text-xs mb-1 print-field-label">Total Value</p>
                        <p className="text-green-400 font-bold text-lg print-field-value">
                          ${(Number(selectedOrder.part_number.unit_price) * Number(selectedOrder.quantity)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loadingTravelSheets ? (
                <div className="flex items-center justify-center py-12 no-print">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                    <p className="mt-4 text-gray-400">Loading travel sheets...</p>
                  </div>
                </div>
              ) : travelSheets.length === 0 ? (
                <div className="text-center py-12 text-gray-500 no-print">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">No travel sheets found</p>
                  <p className="text-sm">Generate a travel sheet first to view it here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {travelSheets.map((sheet, index) => (
                    <div key={sheet.id} className="border border-yellow-500/30 rounded-lg p-6 bg-black/20 print-travel-sheet" style={{ pageBreakBefore: index > 0 ? 'always' : 'auto', pageBreakInside: 'avoid' }}>
                      
                      {/* Travel Sheet Header - Enhanced for Print */}
                      <div className="flex items-start justify-between mb-8 print-sheet-header">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-yellow-400 mb-4 print-sheet-number">
                            {sheet.travel_sheet_number}
                          </h3>
                          <div className="grid grid-cols-2 gap-6 text-sm">
                            <div className="print-field">
                              <p className="text-gray-500 text-xs mb-1 print-field-label">Status</p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                                sheet.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                sheet.status === 'Completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                              }`}>
                                {sheet.status}
                              </span>
                            </div>
                            {sheet.batch_number && (
                              <div className="print-field">
                                <p className="text-gray-500 text-xs mb-1 print-field-label">Batch Number</p>
                                <p className="text-gray-300 font-mono font-medium print-field-value">{sheet.batch_number}</p>
                              </div>
                            )}
                            <div className="print-field">
                              <p className="text-gray-500 text-xs mb-1 print-field-label">Created Date</p>
                              <p className="text-gray-300 font-medium print-field-value">{new Date(sheet.created_at).toLocaleString()}</p>
                            </div>
                            {selectedOrder?.start_date && (
                              <div className="print-field">
                                <p className="text-gray-500 text-xs mb-1 print-field-label">Production Start</p>
                                <p className="text-gray-300 font-medium print-field-value">{new Date(selectedOrder.start_date).toLocaleDateString()}</p>
                              </div>
                            )}
                            {selectedOrder?.due_date && (
                              <div className="print-field">
                                <p className="text-gray-500 text-xs mb-1 print-field-label">Due Date</p>
                                <p className="text-gray-300 font-medium print-field-value">{new Date(selectedOrder.due_date).toLocaleDateString()}</p>
                              </div>
                            )}
                            <div className="print-field">
                              <p className="text-gray-500 text-xs mb-1 print-field-label">Total Quantity</p>
                              <p className="text-yellow-400 font-bold text-base print-field-value">{selectedOrder?.quantity || 0} units</p>
                            </div>
                          </div>
                        </div>

                        {/* Main Travel Sheet QR Code - Enhanced for Print */}
                        <div className="ml-6 text-center">
                          <div className="bg-white p-3 rounded-lg inline-block print-qr-main">
                            <QRCodeSVG value={sheet.qr_code} size={120} />
                          </div>
                          <p className="text-xs text-gray-500 mt-2 font-medium print-qr-label">SCAN TO START</p>
                        </div>
                      </div>

                      {/* Operations List - Enhanced for Print */}
                      <div className="border-t border-yellow-500/20 pt-6 no-print-operations">
                        <h4 className="text-sm font-semibold text-gray-300 mb-4 print-operations-title">Production Operations</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {sheet.operations && sheet.operations.length > 0 ? (
                            sheet.operations.map((operation) => (
                              <div 
                                key={operation.id} 
                                className="flex items-center justify-between bg-black/30 p-4 rounded-lg border border-gray-700 print-operation"
                                style={{ pageBreakInside: 'avoid' }}
                              >
                                <div className="flex items-center space-x-4 flex-1">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-bold print-operation-number">
                                    {operation.sequence_number}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-200 print-operation-name">
                                      {operation.process?.name || `Process ${operation.process_id}`}
                                    </p>
                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1 print-operation-details">
                                      <span>Good: <span className="text-green-400 font-medium">{operation.quantity_good}</span></span>
                                      <span>Scrap: <span className="text-red-400 font-medium">{operation.quantity_scrap}</span></span>
                                      {operation.quantity_pending !== null && operation.quantity_pending !== undefined && (
                                        <span>Pending: <span className="text-yellow-400 font-medium">{operation.quantity_pending}</span></span>
                                      )}
                                      {operation.start_time && (
                                        <span>Started: {new Date(operation.start_time).toLocaleString()}</span>
                                      )}
                                      {operation.end_time && (
                                        <span>Ended: {new Date(operation.end_time).toLocaleString()}</span>
                                      )}
                                      {operation.duration_minutes && (
                                        <span>Duration: {operation.duration_minutes} min</span>
                                      )}
                                      {operation.operator_id && (
                                        <span>Operator ID: {operation.operator_id}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                                      operation.status === 'Completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                      operation.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                      operation.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}>
                                      {operation.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Operation QR Code - Enhanced for Print */}
                                <div className="ml-4">
                                  <div className="bg-white p-2 rounded inline-block print-operation-qr">
                                    <QRCodeSVG value={operation.qr_code} size={60} />
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No operations defined</p>
                          )}
                        </div>
                      </div>

                      {/* Print Footer */}
                      <div className="print-footer">
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <p className="font-bold print-footer-company">AUREXIA ERP - Manufacturing Excellence</p>
                            <p className="text-xs mt-1 print-footer-timestamp">Document generated: {new Date().toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-xs">{selectedOrder?.po_number}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-yellow-500/20 flex justify-end">
                <button
                  onClick={handleCloseTravelSheetModal}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageModal>
  );
};

export default ProductionPage;
