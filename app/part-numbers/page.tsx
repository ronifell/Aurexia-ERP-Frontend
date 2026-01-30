'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { partNumbersAPI } from '@/lib/api';
import { usePartNumbers, useCustomers, useProcesses, useMaterials } from '@/lib/hooks';
import { PartNumber, Customer, Process, Material } from '@/lib/types';
import { Plus, Search, Eye, Trash2, ArrowUp, ArrowDown, X, Package, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoutingFormData {
  process_id: number;
  sequence_number: number;
  standard_time_minutes: number;
}

interface MaterialFormData {
  material_id: number;
  quantity: number;
  unit: string;
  scrap_percentage: number;
  notes: string;
}

interface SubAssemblyFormData {
  child_part_id: number;
  quantity: number;
  unit: string;
  notes: string;
}

const PartNumbersPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPartNumber, setViewingPartNumber] = useState<PartNumber | null>(null);
  const [formData, setFormData] = useState({
    part_number: '',
    customer_id: '',
    description: '',
    material_type: '',
    unit_price: '',
  });
  const [routings, setRoutings] = useState<RoutingFormData[]>([]);
  const [materials, setMaterials] = useState<MaterialFormData[]>([]);
  const [subAssemblies, setSubAssemblies] = useState<SubAssemblyFormData[]>([]);

  // Use SWR hooks for optimized data fetching with caching
  const { partNumbers, isLoading: partNumbersLoading, refresh: refreshPartNumbers } = usePartNumbers();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { processes, isLoading: processesLoading } = useProcesses();
  const { materials: materialsList, isLoading: materialsLoading } = useMaterials();

  const loading = partNumbersLoading || customersLoading || processesLoading || materialsLoading;

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
    
    // Validate materials before submission
    const validMaterials = materials.filter(m => m.material_id > 0);
    
    // Check for duplicate materials
    const materialIds = validMaterials.map(m => m.material_id);
    if (materialIds.length !== new Set(materialIds).size) {
      toast.error('Duplicate materials are not allowed. Please remove duplicate entries.');
      return;
    }
    
    // Validate quantities
    for (const material of validMaterials) {
      if (material.quantity <= 0 || isNaN(material.quantity)) {
        const materialName = materialsList?.find((m: Material) => m.id === material.material_id)?.name || 'selected material';
        toast.error(`Material quantity must be greater than 0 for ${materialName}`);
        return;
      }
    }
    
    // Validate sub-assemblies before submission
    const validSubAssemblies = subAssemblies.filter(sa => sa.child_part_id > 0);
    
    // Check for duplicate sub-assemblies
    const childPartIds = validSubAssemblies.map(sa => sa.child_part_id);
    if (childPartIds.length !== new Set(childPartIds).size) {
      toast.error('Duplicate sub-assemblies are not allowed. Please remove duplicate entries.');
      return;
    }
    
    // Validate sub-assembly quantities
    for (const subAssembly of validSubAssemblies) {
      if (subAssembly.quantity <= 0 || isNaN(subAssembly.quantity)) {
        const partName = partNumbers.find((pn: PartNumber) => pn.id === subAssembly.child_part_id)?.part_number || 'selected part';
        toast.error(`Sub-assembly quantity must be greater than 0 for ${partName}`);
        return;
      }
    }
    
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
        materials: validMaterials.map(m => ({
          material_id: m.material_id,
          quantity: m.quantity,
          unit: m.unit || null,
          scrap_percentage: m.scrap_percentage || 0,
          notes: m.notes || null,
        })),
        sub_assemblies: validSubAssemblies.map(sa => ({
          child_part_id: sa.child_part_id,
          quantity: sa.quantity,
          unit: sa.unit || null,
          notes: sa.notes || null,
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
    setMaterials([]);
    setSubAssemblies([]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleView = async (partNumber: PartNumber) => {
    try {
      // Fetch full part number details with routings
      const fullPartNumber = await partNumbersAPI.getById(partNumber.id);
      setViewingPartNumber(fullPartNumber);
      setShowViewModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load part number details');
    }
  };

  const handleDelete = async (partNumber: PartNumber) => {
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete part number "${partNumber.part_number}"?\n\n` +
      `This action cannot be undone. If this part is referenced in sales orders, production orders, shipments, or used as a sub-assembly, the deletion will be prevented.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      await partNumbersAPI.delete(partNumber.id);
      toast.success(`Part number "${partNumber.part_number}" deleted successfully!`);
      loadData(); // Refresh the list
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete part number';
      toast.error(errorMessage);
    }
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
                            <button 
                              onClick={() => handleView(pn)}
                              className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400"
                              title="View part number details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(pn)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"
                              title="Delete part number"
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

                {/* Material Requirements (BOM) */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">Material Requirements (BOM)</h3>
                    <button
                      type="button"
                      onClick={() => setMaterials([...materials, { material_id: 0, quantity: 0.0001, unit: '', scrap_percentage: 0, notes: '' }])}
                      className="btn-aurexia text-xs px-3 py-1.5 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Material</span>
                    </button>
                  </div>

                  {materials.length === 0 ? (
                    <div className="text-center py-8 bg-black/20 rounded-lg border border-gray-800">
                      <p className="text-sm text-gray-500">No materials added yet</p>
                      <p className="text-xs text-gray-600 mt-1">Click "Add Material" to define material requirements</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {materials.map((material, index) => (
                        <div key={index} className="bg-black/20 p-4 rounded-lg border border-gray-800">
                          <div className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-3">
                              <label className="block text-xs text-gray-400 mb-1">Material *</label>
                              <select
                                required
                                value={material.material_id}
                                onChange={(e) => {
                                  const newMaterialId = parseInt(e.target.value);
                                  
                                  // Check for duplicate material
                                  const isDuplicate = materials.some((m, i) => i !== index && m.material_id === newMaterialId);
                                  if (isDuplicate && newMaterialId > 0) {
                                    toast.error('This material is already added. Please select a different material.');
                                    return;
                                  }
                                  
                                  const updated = [...materials];
                                  updated[index].material_id = newMaterialId;
                                  // Auto-fill unit from material if available
                                  const selectedMaterial = materialsList?.find((m: Material) => m.id === newMaterialId);
                                  if (selectedMaterial && selectedMaterial.unit && !updated[index].unit) {
                                    updated[index].unit = selectedMaterial.unit;
                                  }
                                  setMaterials(updated);
                                }}
                                className="w-full px-3 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                              >
                                <option value={0}>Select material...</option>
                                {materialsList && materialsList.length > 0 ? (
                                  materialsList
                                    .filter((mat: Material) => {
                                      // Don't show materials already selected in other rows
                                      return !materials.some((m, i) => i !== index && m.material_id === mat.id);
                                    })
                                    .map((mat: Material) => (
                                      <option key={mat.id} value={mat.id}>
                                        {mat.name} {mat.type ? `(${mat.type})` : ''} {mat.unit ? `- ${mat.unit}` : ''}
                                      </option>
                                    ))
                                ) : (
                                  <option value={0} disabled>No materials available</option>
                                )}
                              </select>
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs text-gray-400 mb-1">Quantity *</label>
                              <input
                                type="number"
                                required
                                step="0.0001"
                                min="0.0001"
                                value={material.quantity}
                                onChange={(e) => {
                                  const updated = [...materials];
                                  const value = parseFloat(e.target.value);
                                  // Only update if valid number, otherwise keep current value
                                  if (!isNaN(value)) {
                                    updated[index].quantity = value;
                                    setMaterials(updated);
                                  }
                                }}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                                placeholder="0"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs text-gray-400 mb-1">Unit</label>
                              <input
                                type="text"
                                value={material.unit}
                                onChange={(e) => {
                                  const updated = [...materials];
                                  updated[index].unit = e.target.value;
                                  setMaterials(updated);
                                }}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                                placeholder="kg, m, pcs..."
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs text-gray-400 mb-1">Scrap %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={material.scrap_percentage || 0}
                                onChange={(e) => {
                                  const updated = [...materials];
                                  const value = parseFloat(e.target.value) || 0;
                                  updated[index].scrap_percentage = Math.min(100, Math.max(0, value));
                                  setMaterials(updated);
                                }}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                                placeholder="0.00"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs text-gray-400 mb-1">Notes</label>
                              <input
                                type="text"
                                value={material.notes}
                                onChange={(e) => {
                                  const updated = [...materials];
                                  updated[index].notes = e.target.value;
                                  setMaterials(updated);
                                }}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                                placeholder="Optional notes..."
                              />
                            </div>

                            <div className="col-span-1">
                              <button
                                type="button"
                                onClick={() => setMaterials(materials.filter((_, i) => i !== index))}
                                className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400 mt-5"
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

                {/* Sub-Assemblies */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">Sub-Assemblies</h3>
                    <button
                      type="button"
                      onClick={() => setSubAssemblies([...subAssemblies, { child_part_id: 0, quantity: 1, unit: '', notes: '' }])}
                      className="btn-aurexia text-xs px-3 py-1.5 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Sub-Assembly</span>
                    </button>
                  </div>

                  {subAssemblies.length === 0 ? (
                    <div className="text-center py-8 bg-black/20 rounded-lg border border-gray-800">
                      <p className="text-sm text-gray-500">No sub-assemblies added yet</p>
                      <p className="text-xs text-gray-600 mt-1">Click "Add Sub-Assembly" to define part components</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subAssemblies.map((subAssembly, index) => (
                        <div key={index} className="bg-black/20 p-4 rounded-lg border border-gray-800">
                          <div className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-4">
                              <label className="block text-xs text-gray-400 mb-1">Part Number *</label>
                              <select
                                required
                                value={subAssembly.child_part_id}
                                onChange={(e) => {
                                  const newPartId = parseInt(e.target.value);
                                  
                                  // Check for duplicate sub-assembly
                                  const isDuplicate = subAssemblies.some((sa, i) => i !== index && sa.child_part_id === newPartId);
                                  if (isDuplicate && newPartId > 0) {
                                    toast.error('This part is already added as a sub-assembly. Please select a different part.');
                                    return;
                                  }
                                  
                                  const updated = [...subAssemblies];
                                  updated[index].child_part_id = newPartId;
                                  setSubAssemblies(updated);
                                }}
                                className="w-full px-3 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                              >
                                <option value={0}>Select part number...</option>
                                {partNumbers
                                  .filter((pn: PartNumber) => {
                                    // Don't show parts already selected in other rows
                                    return !subAssemblies.some((sa, i) => i !== index && sa.child_part_id === pn.id);
                                  })
                                  .map((pn: PartNumber) => (
                                    <option key={pn.id} value={pn.id}>
                                      {pn.part_number} {pn.description ? `- ${pn.description}` : ''}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs text-gray-400 mb-1">Quantity *</label>
                              <input
                                type="number"
                                required
                                step="0.0001"
                                min="0.0001"
                                value={subAssembly.quantity}
                                onChange={(e) => {
                                  const updated = [...subAssemblies];
                                  const value = parseFloat(e.target.value);
                                  // Only update if valid number, otherwise keep current value
                                  if (!isNaN(value)) {
                                    updated[index].quantity = value;
                                    setSubAssemblies(updated);
                                  }
                                }}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                                placeholder="1"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs text-gray-400 mb-1">Unit</label>
                              <input
                                type="text"
                                value={subAssembly.unit}
                                onChange={(e) => {
                                  const updated = [...subAssemblies];
                                  updated[index].unit = e.target.value;
                                  setSubAssemblies(updated);
                                }}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                                placeholder="pcs, units..."
                              />
                            </div>

                            <div className="col-span-3">
                              <label className="block text-xs text-gray-400 mb-1">Notes</label>
                              <input
                                type="text"
                                value={subAssembly.notes}
                                onChange={(e) => {
                                  const updated = [...subAssemblies];
                                  updated[index].notes = e.target.value;
                                  setSubAssemblies(updated);
                                }}
                                className="w-full px-2 py-1.5 bg-black/50 border border-yellow-500/30 rounded text-gray-100 text-sm"
                                placeholder="Optional notes..."
                              />
                            </div>

                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setSubAssemblies(subAssemblies.filter((_, i) => i !== index))}
                                className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400"
                                title="Remove Sub-Assembly"
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

        {/* View Part Number Modal */}
        {showViewModal && viewingPartNumber && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-100">
                  Part Number Details
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingPartNumber(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Part Number</p>
                    <p className="text-sm font-mono text-yellow-400 font-bold">{viewingPartNumber.part_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      viewingPartNumber.is_active 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {viewingPartNumber.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Material Type</p>
                    <p className="text-sm text-gray-300">{viewingPartNumber.material_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                    <p className="text-sm text-gray-300">
                      {viewingPartNumber.unit_price ? `$${Number(viewingPartNumber.unit_price).toFixed(2)}` : '-'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {viewingPartNumber.description && (
                  <div className="border-t border-yellow-500/20 pt-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Description</h3>
                    <p className="text-sm text-gray-300 bg-black/30 p-4 rounded-lg whitespace-pre-wrap">
                      {viewingPartNumber.description}
                    </p>
                  </div>
                )}

                {/* Customer Information */}
                {viewingPartNumber.customer && (
                  <div className="border-t border-yellow-500/20 pt-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/30 p-4 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Customer Code</p>
                        <p className="text-sm font-mono text-yellow-400">{viewingPartNumber.customer.code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Company Name</p>
                        <p className="text-sm text-gray-300">{viewingPartNumber.customer.name}</p>
                      </div>
                      {viewingPartNumber.customer.contact_person && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                          <p className="text-sm text-gray-300">{viewingPartNumber.customer.contact_person}</p>
                        </div>
                      )}
                      {viewingPartNumber.customer.email && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="text-sm text-gray-300">{viewingPartNumber.customer.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Production Routing */}
                <div className="border-t border-yellow-500/20 pt-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Production Routing
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {viewingPartNumber.routings?.length || 0} process(es) defined
                    </p>
                  </div>
                  {viewingPartNumber.routings && viewingPartNumber.routings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-black/50">
                          <tr className="border-b border-yellow-500/20">
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Sequence</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Process</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Process Code</th>
                            <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Standard Time (min)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...viewingPartNumber.routings]
                            .sort((a, b) => a.sequence_number - b.sequence_number)
                            .map((routing) => (
                              <tr key={routing.id} className="border-b border-gray-800">
                                <td className="py-2 px-3">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                                    {routing.sequence_number}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-gray-300 text-xs">
                                  {routing.process?.name || `Process ${routing.process_id}`}
                                </td>
                                <td className="py-2 px-3">
                                  <code className="text-xs bg-gray-800 text-yellow-400 px-2 py-1 rounded font-mono">
                                    {routing.process?.code || '-'}
                                  </code>
                                </td>
                                <td className="py-2 px-3 text-center text-gray-300 text-xs">
                                  {routing.standard_time_minutes ? `${routing.standard_time_minutes} min` : '-'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-black/20 rounded-lg border border-gray-800">
                      <p className="text-sm text-gray-500">No production routing defined</p>
                    </div>
                  )}
                </div>

                {/* Material Requirements (BOM) */}
                <div className="border-t border-yellow-500/20 pt-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Material Requirements (BOM)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {viewingPartNumber.materials?.length || 0} material(s) required
                    </p>
                  </div>
                  {viewingPartNumber.materials && viewingPartNumber.materials.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-black/50">
                          <tr className="border-b border-yellow-500/20">
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Material</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Type</th>
                            <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Quantity</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Unit</th>
                            <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Scrap %</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingPartNumber.materials.map((material) => (
                            <tr key={material.id} className="border-b border-gray-800">
                              <td className="py-2 px-3 text-gray-300 text-xs font-medium">
                                {material.material?.name || `Material ID: ${material.material_id}`}
                              </td>
                              <td className="py-2 px-3 text-gray-400 text-xs">
                                {material.material?.type || '-'}
                              </td>
                              <td className="py-2 px-3 text-right text-gray-200 text-xs font-medium">
                                {Number(material.quantity).toFixed(4)}
                              </td>
                              <td className="py-2 px-3 text-gray-300 text-xs">
                                {material.unit || material.material?.unit || '-'}
                              </td>
                              <td className="py-2 px-3 text-right text-gray-300 text-xs">
                                {material.scrap_percentage ? `${Number(material.scrap_percentage).toFixed(2)}%` : '0%'}
                              </td>
                              <td className="py-2 px-3 text-gray-400 text-xs">
                                {material.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-black/20 rounded-lg border border-gray-800">
                      <p className="text-sm text-gray-500">No material requirements defined</p>
                    </div>
                  )}
                </div>

                {/* Sub-Assemblies */}
                <div className="border-t border-yellow-500/20 pt-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Sub-Assemblies
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {viewingPartNumber.sub_assemblies?.length || 0} sub-assembly(ies) required
                    </p>
                  </div>
                  {viewingPartNumber.sub_assemblies && viewingPartNumber.sub_assemblies.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-black/50">
                          <tr className="border-b border-yellow-500/20">
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Part Number</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Description</th>
                            <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Quantity</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Unit</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingPartNumber.sub_assemblies.map((subAssembly) => (
                            <tr key={subAssembly.id} className="border-b border-gray-800">
                              <td className="py-2 px-3 text-gray-300 text-xs font-medium">
                                {subAssembly.child_part?.part_number || `Part ID: ${subAssembly.child_part_id}`}
                              </td>
                              <td className="py-2 px-3 text-gray-400 text-xs">
                                {subAssembly.child_part?.description || '-'}
                              </td>
                              <td className="py-2 px-3 text-right text-gray-200 text-xs font-medium">
                                {Number(subAssembly.quantity).toFixed(4)}
                              </td>
                              <td className="py-2 px-3 text-gray-300 text-xs">
                                {subAssembly.unit || '-'}
                              </td>
                              <td className="py-2 px-3 text-gray-400 text-xs">
                                {subAssembly.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-black/20 rounded-lg border border-gray-800">
                      <p className="text-sm text-gray-500">No sub-assemblies defined</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-yellow-500/20">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingPartNumber(null);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageModal>
  );
};

export default PartNumbersPage;
