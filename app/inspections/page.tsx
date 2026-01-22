'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { QualityInspection, ProductionOrder } from '@/lib/types';
import { qualityInspectionsAPI, productionOrdersAPI } from '@/lib/api';
import { Plus, Search, Edit, Trash2, X, ClipboardCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const InspectionsPage = () => {
  const router = useRouter();
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInspection, setEditingInspection] = useState<QualityInspection | null>(null);
  const [formData, setFormData] = useState({
    production_order_id: '',
    travel_sheet_id: '',
    status: 'Released',
    quantity_inspected: '',
    quantity_approved: '',
    quantity_rejected: '',
    rejection_reason: '',
    notes: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [inspectionsData, ordersData] = await Promise.all([
          qualityInspectionsAPI.getAll(),
          productionOrdersAPI.getAll(),
        ]);
        setInspections(inspectionsData);
        setProductionOrders(ordersData);
      } catch (error: any) {
        toast.error('Failed to load data');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspectionsData, ordersData] = await Promise.all([
        qualityInspectionsAPI.getAll(),
        productionOrdersAPI.getAll(),
      ]);
      setInspections(inspectionsData);
      setProductionOrders(ordersData);
    } catch (error: any) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (field: 'quantity_inspected' | 'quantity_approved' | 'quantity_rejected', value: string) => {
    const numValue = parseInt(value) || 0;
    const newFormData = { ...formData };
    newFormData[field] = value;

    // Get current values from formData (before updating the changed field)
    const currentInspected = parseInt(formData.quantity_inspected) || 0;
    const currentApproved = parseInt(formData.quantity_approved) || 0;
    const currentRejected = parseInt(formData.quantity_rejected) || 0;

    // Get the new value of the field being changed
    const newValue = numValue;

    // Auto-calculate the third field based on the relationship: Inspected = Approved + Rejected
    if (field === 'quantity_inspected') {
      // If inspected changes, recalculate based on which of approved/rejected exists
      if (currentApproved > 0 && currentRejected === 0) {
        // We have approved, calculate rejected
        const calculatedRejected = Math.max(0, newValue - currentApproved);
        newFormData.quantity_rejected = calculatedRejected.toString();
      } else if (currentRejected > 0 && currentApproved === 0) {
        // We have rejected, calculate approved
        const calculatedApproved = Math.max(0, newValue - currentRejected);
        newFormData.quantity_approved = calculatedApproved.toString();
      } else if (currentApproved > 0 && currentRejected > 0) {
        // Both exist - don't auto-calculate, let user decide
      }
    } else if (field === 'quantity_approved') {
      // If approved changes, and we have inspected, always calculate rejected
      if (currentInspected > 0) {
        const calculatedRejected = Math.max(0, currentInspected - newValue);
        newFormData.quantity_rejected = calculatedRejected.toString();
      }
      // If approved changes and we have rejected but no inspected, calculate inspected
      else if (currentRejected > 0 && currentInspected === 0) {
        const calculatedInspected = newValue + currentRejected;
        newFormData.quantity_inspected = calculatedInspected.toString();
      }
    } else if (field === 'quantity_rejected') {
      // If rejected changes, and we have inspected, always calculate approved
      if (currentInspected > 0) {
        const calculatedApproved = Math.max(0, currentInspected - newValue);
        newFormData.quantity_approved = calculatedApproved.toString();
      }
      // If rejected changes and we have approved but no inspected, calculate inspected
      else if (currentApproved > 0 && currentInspected === 0) {
        const calculatedInspected = currentApproved + newValue;
        newFormData.quantity_inspected = calculatedInspected.toString();
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate quantities
    const inspected = parseInt(formData.quantity_inspected) || 0;
    const approved = parseInt(formData.quantity_approved) || 0;
    const rejected = parseInt(formData.quantity_rejected) || 0;

    // If any quantity is provided, validate the relationship
    if (inspected > 0 || approved > 0 || rejected > 0) {
      if (inspected > 0 && approved + rejected !== inspected) {
        toast.error(`Quantity mismatch: Approved (${approved}) + Rejected (${rejected}) must equal Inspected (${inspected})`);
        return;
      }
      if (inspected === 0 && approved > 0 && rejected > 0) {
        // Auto-calculate inspected if both approved and rejected are provided
        const calculatedInspected = approved + rejected;
        formData.quantity_inspected = calculatedInspected.toString();
        toast.success(`Auto-calculated Inspected quantity: ${calculatedInspected}`);
      }
    }

    try {
      const payload: any = {
        production_order_id: parseInt(formData.production_order_id),
        status: formData.status,
      };

      // Add optional fields if they have values
      if (formData.travel_sheet_id) {
        payload.travel_sheet_id = parseInt(formData.travel_sheet_id);
      }
      if (formData.quantity_inspected) {
        payload.quantity_inspected = parseInt(formData.quantity_inspected);
      }
      if (formData.quantity_approved) {
        payload.quantity_approved = parseInt(formData.quantity_approved);
      }
      if (formData.quantity_rejected) {
        payload.quantity_rejected = parseInt(formData.quantity_rejected);
      }
      if (formData.rejection_reason) {
        payload.rejection_reason = formData.rejection_reason;
      }
      if (formData.notes) {
        payload.notes = formData.notes;
      }

      if (editingInspection) {
        await qualityInspectionsAPI.update(editingInspection.id, payload);
        toast.success('Inspection updated successfully!');
      } else {
        await qualityInspectionsAPI.create(payload);
        toast.success('Inspection created successfully!');
      }
      
      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error('Form submission error:', error);
      const errorMessage = error.response?.data?.detail || error.detail || error.message || 'Failed to save inspection';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (inspection: QualityInspection) => {
    setEditingInspection(inspection);
    setFormData({
      production_order_id: inspection.production_order_id.toString(),
      travel_sheet_id: inspection.travel_sheet_id?.toString() || '',
      status: inspection.status,
      quantity_inspected: inspection.quantity_inspected?.toString() || '',
      quantity_approved: inspection.quantity_approved?.toString() || '',
      quantity_rejected: inspection.quantity_rejected?.toString() || '',
      rejection_reason: inspection.rejection_reason || '',
      notes: inspection.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inspection?')) {
      return;
    }
    
    try {
      await qualityInspectionsAPI.delete(id);
      toast.success('Inspection deleted successfully!');
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete inspection';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      production_order_id: '',
      travel_sheet_id: '',
      status: 'Released',
      quantity_inspected: '',
      quantity_approved: '',
      quantity_rejected: '',
      rejection_reason: '',
      notes: '',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInspection(null);
    resetForm();
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      inspection.production_order?.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.production_order?.part_number?.part_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || inspection.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Released':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'On Hold':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <ClipboardCheck className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Released':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'On Hold':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <PageModal>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading inspections...</p>
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
              <h1 className="text-2xl font-bold gold-text mb-1">Quality Inspections</h1>
              <p className="text-gray-400 text-sm">Quality control and final release inspections</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-aurexia flex items-center space-x-2 text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Inspection</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by PO number or part number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
            >
              <option value="">All Statuses</option>
              <option value="Released">Released</option>
              <option value="Rejected">Rejected</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Inspections Table */}
          <div className="card-aurexia p-4 flex-1 min-h-[400px]">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
              <table className="w-full text-sm">
                <thead className="bg-black/50 backdrop-blur-sm">
                  <tr className="border-b border-yellow-500/20">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Inspection Date</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">PO Number</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Part Number</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Inspected</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Approved</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Rejected</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Status</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No inspections found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.map((inspection) => (
                      <tr key={inspection.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                        <td className="py-2 px-3 text-gray-300 text-xs">
                          {new Date(inspection.inspection_date).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-gray-200 font-medium text-xs font-mono">
                          {inspection.production_order?.po_number || 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-gray-300 text-xs">
                          {inspection.production_order?.part_number?.part_number || 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-200 text-xs">
                          {inspection.quantity_inspected || '-'}
                        </td>
                        <td className="py-2 px-3 text-center text-green-400 text-xs font-medium">
                          {inspection.quantity_approved || '-'}
                        </td>
                        <td className="py-2 px-3 text-center text-red-400 text-xs font-medium">
                          {inspection.quantity_rejected || '-'}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex justify-center items-center space-x-1">
                            {getStatusIcon(inspection.status)}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeClass(inspection.status)}`}>
                              {inspection.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex justify-center space-x-1">
                            <button 
                              onClick={() => handleEdit(inspection)}
                              className="p-1.5 hover:bg-blue-500/10 rounded-lg text-gray-400 hover:text-blue-400 hover:scale-110 transition-all duration-200"
                              title="Edit inspection"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(inspection.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 hover:scale-110 transition-all duration-200"
                              title="Delete inspection"
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

        {/* Create/Edit Inspection Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">
                  {editingInspection ? 'Edit Inspection' : 'Create New Inspection'}
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
                  {/* Production Order */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Production Order *
                    </label>
                    <select
                      required
                      value={formData.production_order_id}
                      onChange={(e) => {
                        const orderId = e.target.value;
                        const selectedOrder = productionOrders.find(order => order.id === parseInt(orderId));
                        setFormData({
                          ...formData,
                          production_order_id: orderId,
                          quantity_inspected: selectedOrder ? selectedOrder.quantity.toString() : formData.quantity_inspected
                        });
                        if (selectedOrder) {
                          toast.success(`Auto-filled Quantity Inspected: ${selectedOrder.quantity}`);
                        }
                      }}
                      disabled={!!editingInspection}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 disabled:bg-black/30 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="">Select production order...</option>
                      {productionOrders.map(order => (
                        <option key={order.id} value={order.id}>
                          {order.po_number} - {order.part_number?.part_number} (Qty: {order.quantity})
                        </option>
                      ))}
                    </select>
                    {editingInspection && (
                      <p className="text-xs text-gray-500 mt-1">Production Order cannot be changed</p>
                    )}
                    {formData.production_order_id && !editingInspection && (
                      <p className="text-xs text-gray-400 mt-1">
                        Quantity Inspected auto-filled from Production Order
                      </p>
                    )}
                  </div>

                  {/* Status */}
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
                      <option value="Released">Released</option>
                      <option value="Rejected">Rejected</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  {/* Quantity Inspected */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity Inspected
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity_inspected}
                      onChange={(e) => handleQuantityChange('quantity_inspected', e.target.value)}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="0"
                    />
                    {(() => {
                      const inspected = parseInt(formData.quantity_inspected) || 0;
                      const approved = parseInt(formData.quantity_approved) || 0;
                      const rejected = parseInt(formData.quantity_rejected) || 0;
                      if (inspected > 0 && approved + rejected !== inspected) {
                        return (
                          <p className="text-xs text-red-400 mt-1">
                            ⚠️ Approved ({approved}) + Rejected ({rejected}) = {approved + rejected}, but Inspected = {inspected}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Quantity Approved */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity Approved
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity_approved}
                      onChange={(e) => handleQuantityChange('quantity_approved', e.target.value)}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="0"
                    />
                    {(() => {
                      const inspected = parseInt(formData.quantity_inspected) || 0;
                      const approved = parseInt(formData.quantity_approved) || 0;
                      const rejected = parseInt(formData.quantity_rejected) || 0;
                      if (inspected > 0 && approved > 0 && rejected === 0 && inspected >= approved) {
                        return (
                          <p className="text-xs text-green-400 mt-1">
                            ✓ Rejected auto-calculated: {Math.max(0, inspected - approved)}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Quantity Rejected */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity Rejected
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity_rejected}
                      onChange={(e) => handleQuantityChange('quantity_rejected', e.target.value)}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="0"
                    />
                    {(() => {
                      const inspected = parseInt(formData.quantity_inspected) || 0;
                      const approved = parseInt(formData.quantity_approved) || 0;
                      const rejected = parseInt(formData.quantity_rejected) || 0;
                      if (inspected > 0 && rejected > 0 && approved === 0 && inspected >= rejected) {
                        return (
                          <p className="text-xs text-green-400 mt-1">
                            ✓ Approved auto-calculated: {Math.max(0, inspected - rejected)}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Rejection Reason (shown when status is Rejected) */}
                  {formData.status === 'Rejected' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={formData.rejection_reason}
                        onChange={(e) => setFormData({...formData, rejection_reason: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 min-h-[80px]"
                        placeholder="Describe the reason for rejection..."
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 min-h-[80px]"
                      placeholder="Additional inspection notes..."
                    />
                  </div>
                </div>

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
                    {editingInspection ? 'Update Inspection' : 'Create Inspection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageModal>
  );
};

export default InspectionsPage;
