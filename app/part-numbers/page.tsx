'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { partNumbersAPI } from '@/lib/api';
import { usePartNumbers, useCustomers, useProcesses } from '@/lib/hooks';
import { PartNumber, Customer, Process } from '@/lib/types';
import { Plus, Search, Eye, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoutingFormData {
  process_id: number;
  sequence_number: number;
  standard_time_minutes: number;
}

const PartNumbersPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    part_number: '',
    customer_id: '',
    description: '',
    material_type: '',
    unit_price: '',
  });
  const [routings, setRoutings] = useState<RoutingFormData[]>([]);

  // Use SWR hooks for optimized data fetching with caching
  const { partNumbers, isLoading: partNumbersLoading, refresh: refreshPartNumbers } = usePartNumbers();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { processes, isLoading: processesLoading } = useProcesses();

  const loading = partNumbersLoading || customersLoading || processesLoading;

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const loadData = () => {
    refreshPartNumbers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        part_number: formData.part_number,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        description: formData.description || null,
        material_type: formData.material_type || null,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        routings: routings.map(r => ({
          process_id: r.process_id,
          sequence_number: r.sequence_number,
          standard_time_minutes: r.standard_time_minutes || null,
        })),
      };
      
      await partNumbersAPI.create(payload);
      toast.success('Part number created successfully!');
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create part number';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      part_number: '',
      customer_id: '',
      description: '',
      material_type: '',
      unit_price: '',
    });
    setRoutings([]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const addRouting = () => {
    const nextSequence = routings.length > 0 
      ? Math.max(...routings.map(r => r.sequence_number)) + 10 
      : 10;
    
    setRoutings([...routings, {
      process_id: processes[0]?.id || 0,
      sequence_number: nextSequence,
      standard_time_minutes: 0,
    }]);
  };

  const removeRouting = (index: number) => {
    setRoutings(routings.filter((_, i) => i !== index));
  };

  const updateRouting = (index: number, field: keyof RoutingFormData, value: any) => {
    const updated = [...routings];
    updated[index] = { ...updated[index], [field]: value };
    setRoutings(updated);
  };

  const moveRouting = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === routings.length - 1)
    ) {
      return;
    }

    const updated = [...routings];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    
    // Update sequence numbers
    updated.forEach((routing, i) => {
      routing.sequence_number = (i + 1) * 10;
    });
    
    setRoutings(updated);
  };

  const filteredPartNumbers = partNumbers.filter((pn: PartNumber) =>
    pn.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pn.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PageModal>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading part numbers...</p>
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
              <h1 className="text-2xl font-bold gold-text mb-1">Part Numbers</h1>
              <p className="text-gray-400 text-sm">Product catalog and routing definitions</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-aurexia flex items-center space-x-2 text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Part Number</span>
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by part number, description, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
              />
            </div>
          </div>

          {/* Part Numbers Table */}
          <div className="card-aurexia p-4 flex-1 min-h-[400px]">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
              <table className="w-full text-sm">
                <thead className="bg-black/50 backdrop-blur-sm">
                  <tr className="border-b border-yellow-500/20">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Part Number</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Description</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Customer</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Material</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Processes</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Active</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartNumbers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        <p className="text-sm">No part numbers found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPartNumbers.map((pn: PartNumber) => (
                      <tr key={pn.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                        <td className="py-2 px-3 text-gray-200 font-medium text-xs">{pn.part_number}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{pn.description || '-'}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{pn.customer?.name || '-'}</td>
                        <td className="py-2 px-3 text-center text-gray-300 text-xs">{pn.material_type || '-'}</td>
                        <td className="py-2 px-3 text-center text-gray-200 text-xs">
                          {pn.routings?.length || 0}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex justify-center">
                            <span className={`w-2 h-2 rounded-full ${pn.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex justify-center space-x-1">
                            <button className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400">
                              <Eye className="w-3.5 h-3.5" />
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

        {/* Create Part Number Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold gold-text">Create New Part Number</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Part Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.part_number}
                        onChange={(e) => setFormData({...formData, part_number: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 font-mono"
                        placeholder="PN-12345"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Customer
                      </label>
                      <select
                        value={formData.customer_id}
                        onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      >
                        <option value="">Select customer...</option>
                        {customers.map((customer: Customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.code} - {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                        placeholder="Part description..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Material Type
                      </label>
                      <input
                        type="text"
                        value={formData.material_type}
                        onChange={(e) => setFormData({...formData, material_type: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                        placeholder="e.g., Aluminum, Steel, Galvanizado"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                        className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Production Routing */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">Production Routing</h3>
                    <button
                      type="button"
                      onClick={addRouting}
                      className="btn-aurexia text-xs px-3 py-1.5 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Process</span>
                    </button>
                  </div>

                  {routings.length === 0 ? (
                    <div className="text-center py-8 bg-black/20 rounded-lg border border-gray-800">
                      <p className="text-sm text-gray-500">No processes added yet</p>
                      <p className="text-xs text-gray-600 mt-1">Click "Add Process" to define the production route</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {routings.map((routing, index) => (
                        <div key={index} className="bg-black/20 p-4 rounded-lg border border-gray-800">
                          <div className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-1">
                              <label className="block text-xs text-gray-400 mb-1">Seq</label>
                              <input
                                type="number"
                                value={routing.sequence_number}
                                onChange={(e) => updateRouting(index, 'sequence_number', parseInt(e.target.value))}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                              />
                            </div>

                            <div className="col-span-5">
                              <label className="block text-xs text-gray-400 mb-1">Process</label>
                              <select
                                value={routing.process_id}
                                onChange={(e) => updateRouting(index, 'process_id', parseInt(e.target.value))}
                                className="w-full px-3 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                              >
                                {processes.map((process: Process) => (
                                  <option key={process.id} value={process.id}>
                                    {process.name} ({process.code})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="col-span-3">
                              <label className="block text-xs text-gray-400 mb-1">Standard Time (min)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={routing.standard_time_minutes}
                                onChange={(e) => updateRouting(index, 'standard_time_minutes', parseFloat(e.target.value))}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                                placeholder="0"
                              />
                            </div>

                            <div className="col-span-3 flex space-x-1">
                              <button
                                type="button"
                                onClick={() => moveRouting(index, 'up')}
                                disabled={index === 0}
                                className="p-1.5 hover:bg-yellow-500/10 rounded text-gray-400 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveRouting(index, 'down')}
                                disabled={index === routings.length - 1}
                                className="p-1.5 hover:bg-yellow-500/10 rounded text-gray-400 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeRouting(index)}
                                className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-6 border-t border-gray-800">
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
                    Create Part Number
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

export default PartNumbersPage;
