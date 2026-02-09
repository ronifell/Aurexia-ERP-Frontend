'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { Plus, Search, Edit, Trash2, X, Package, Truck as TruckIcon, Box, ArrowDownUp } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Material {
  id: number;
  name: string;
  type: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  is_active: boolean;
}

interface Supplier {
  id: number;
  code: string;
  name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface InventoryBatch {
  id: number;
  batch_number: string;
  material_id: number;
  supplier_id?: number;
  heat_number?: string;
  lot_number?: string;
  quantity: number;
  remaining_quantity: number;
  unit: string;
  received_date?: string;
}

interface InventoryMovement {
  id: number;
  movement_type: string;
  material_id: number;
  batch_id?: number;
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: string;
}

const InventoryPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'materials' | 'suppliers' | 'batches' | 'movements'>('materials');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Materials state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    type: '',
    unit: '',
    minimum_stock: ''
  });
  const [materialTypeOther, setMaterialTypeOther] = useState(false);
  const [customMaterialType, setCustomMaterialType] = useState('');

  // Predefined material types
  const materialTypes = ['Aluminio', 'Galvanizado', 'Acero', 'Stainless Steel', 'Other'];

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    code: '',
    name: '',
    address: '',
    contact_person: '',
    phone: '',
    email: ''
  });

  // Batches state
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    batch_number: '',
    material_id: '',
    supplier_id: '',
    heat_number: '',
    lot_number: '',
    quantity: '',
    unit: '',
    received_date: new Date().toISOString().split('T')[0]
  });

  // Movements state
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      if (activeTab === 'materials') {
        const res = await fetch(`${API_BASE_URL}/materials/list`, { headers });
        const data = await res.json();
        setMaterials(data);
      } else if (activeTab === 'suppliers') {
        const res = await fetch(`${API_BASE_URL}/materials/suppliers/list`, { headers });
        const data = await res.json();
        setSuppliers(data);
      } else if (activeTab === 'batches') {
        const res = await fetch(`${API_BASE_URL}/materials/batches/list`, { headers });
        const data = await res.json();
        setBatches(data);
      } else if (activeTab === 'movements') {
        const res = await fetch(`${API_BASE_URL}/materials/movements/list`, { headers });
        const data = await res.json();
        setMovements(data);
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Material handlers
  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingMaterial
        ? `${API_BASE_URL}/materials/${editingMaterial.id}`
        : `${API_BASE_URL}/materials/`;
      
      const res = await fetch(url, {
        method: editingMaterial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...materialForm,
          minimum_stock: parseFloat(materialForm.minimum_stock)
        })
      });

      if (!res.ok) throw new Error('Failed to save material');
      
      toast.success(`Material ${editingMaterial ? 'updated' : 'created'} successfully!`);
      setShowMaterialModal(false);
      setEditingMaterial(null);
      setMaterialForm({ name: '', type: '', unit: '', minimum_stock: '' });
      setMaterialTypeOther(false);
      setCustomMaterialType('');
      loadData();
    } catch (error) {
      toast.error('Failed to save material');
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Material deleted successfully!');
      loadData();
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  // Supplier handlers
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingSupplier
        ? `${API_BASE_URL}/materials/suppliers/${editingSupplier.id}`
        : `${API_BASE_URL}/materials/suppliers/`;
      
      const res = await fetch(url, {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supplierForm)
      });

      if (!res.ok) throw new Error('Failed to save supplier');
      
      toast.success(`Supplier ${editingSupplier ? 'updated' : 'created'} successfully!`);
      setShowSupplierModal(false);
      setEditingSupplier(null);
      setSupplierForm({ code: '', name: '', address: '', contact_person: '', phone: '', email: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/materials/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Supplier deleted successfully!');
      loadData();
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  // Batch handlers
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/materials/batches/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...batchForm,
          material_id: parseInt(batchForm.material_id),
          supplier_id: batchForm.supplier_id ? parseInt(batchForm.supplier_id) : undefined,
          quantity: parseFloat(batchForm.quantity)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to create batch');
      }
      
      toast.success('Batch created successfully!');
      setShowBatchModal(false);
      setBatchForm({
        batch_number: '',
        material_id: '',
        supplier_id: '',
        heat_number: '',
        lot_number: '',
        quantity: '',
        unit: '',
        received_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create batch');
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBatches = batches.filter(b =>
    b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.heat_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PageModal>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading inventory...</p>
          </div>
        </div>
      </PageModal>
    );
  }

  return (
    <PageModal>
      <div className="min-h-full flex flex-col px-6 py-4">
        <div className="w-full py-4 flex flex-col max-w-[2000px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold gold-text mb-1">Inventory Management</h1>
              <p className="text-gray-400 text-sm">Materials, suppliers, and inventory tracking</p>
            </div>
            <button 
              onClick={() => {
                if (activeTab === 'materials') setShowMaterialModal(true);
                else if (activeTab === 'suppliers') setShowSupplierModal(true);
                else if (activeTab === 'batches') setShowBatchModal(true);
              }}
              className="btn-aurexia flex items-center space-x-2 text-sm px-4 py-2"
              disabled={activeTab === 'movements'}
            >
              <Plus className="w-4 h-4" />
              <span>New {activeTab === 'materials' ? 'Material' : activeTab === 'suppliers' ? 'Supplier' : 'Receipt'}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-yellow-500/20">
            {/* Only showing Materials tab - other tabs (suppliers, batches, movements) are hidden but code remains intact */}
            {['materials'/*, 'suppliers', 'batches', 'movements'*/].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-yellow-400 border-b-2 border-yellow-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          {activeTab !== 'movements' && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="card-aurexia p-4 flex-1 min-h-[400px]">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
              
              {/* Materials Table */}
              {activeTab === 'materials' && (
                <table className="w-full text-sm">
                  <thead className="bg-black/50 backdrop-blur-sm">
                    <tr className="border-b border-yellow-500/20">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Name</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Type</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Unit</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Current Stock</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Min Stock</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Status</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => {
                      const isLowStock = material.current_stock < material.minimum_stock;
                      return (
                        <tr key={material.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                          <td className="py-2 px-3 text-gray-200 font-medium text-xs">{material.name}</td>
                          <td className="py-2 px-3 text-gray-300 text-xs">{material.type || '-'}</td>
                          <td className="py-2 px-3 text-center text-gray-300 text-xs">{material.unit || '-'}</td>
                          <td className={`py-2 px-3 text-right text-xs font-medium ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
                            {material.current_stock}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-300 text-xs">{material.minimum_stock}</td>
                          <td className="py-2 px-3 text-center">
                            {isLowStock && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-red-500/20 text-red-400 border-red-500/30">
                                Low Stock
                              </span>
                            )}
                            {!isLowStock && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                                OK
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex justify-center space-x-1">
                              <button 
                                onClick={() => {
                                  setEditingMaterial(material);
                                  const materialType = material.type || '';
                                  const isOtherType = materialType && !materialTypes.slice(0, -1).includes(materialType);
                                  setMaterialTypeOther(isOtherType);
                                  setCustomMaterialType(isOtherType ? materialType : '');
                                  setMaterialForm({
                                    name: material.name,
                                    type: materialType,
                                    unit: material.unit || '',
                                    minimum_stock: material.minimum_stock?.toString() || ''
                                  });
                                  setShowMaterialModal(true);
                                }}
                                className="p-1.5 hover:bg-blue-500/10 rounded-lg text-gray-400 hover:text-blue-400 hover:scale-110 transition-all duration-200"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 hover:scale-110 transition-all duration-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Suppliers Table */}
              {activeTab === 'suppliers' && (
                <table className="w-full text-sm">
                  <thead className="bg-black/50 backdrop-blur-sm">
                    <tr className="border-b border-yellow-500/20">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Code</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Name</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Contact</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Phone</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Email</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                        <td className="py-2 px-3 text-gray-200 font-medium text-xs">{supplier.code}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{supplier.name}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{supplier.contact_person || '-'}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{supplier.phone || '-'}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{supplier.email || '-'}</td>
                        <td className="py-2 px-3">
                          <div className="flex justify-center space-x-1">
                            <button 
                              onClick={() => {
                                setEditingSupplier(supplier);
                                setSupplierForm({
                                  code: supplier.code,
                                  name: supplier.name,
                                  address: supplier.address || '',
                                  contact_person: supplier.contact_person || '',
                                  phone: supplier.phone || '',
                                  email: supplier.email || ''
                                });
                                setShowSupplierModal(true);
                              }}
                              className="p-1.5 hover:bg-blue-500/10 rounded-lg text-gray-400 hover:text-blue-400 hover:scale-110 transition-all duration-200"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 hover:scale-110 transition-all duration-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Batches Table */}
              {activeTab === 'batches' && (
                <table className="w-full text-sm">
                  <thead className="bg-black/50 backdrop-blur-sm">
                    <tr className="border-b border-yellow-500/20">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Batch Number</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Heat Number</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Lot Number</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Quantity</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Remaining</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Unit</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((batch) => (
                      <tr key={batch.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                        <td className="py-2 px-3 text-gray-200 font-medium text-xs">{batch.batch_number}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{batch.heat_number || '-'}</td>
                        <td className="py-2 px-3 text-gray-300 text-xs">{batch.lot_number || '-'}</td>
                        <td className="py-2 px-3 text-right text-gray-300 text-xs">{batch.quantity}</td>
                        <td className="py-2 px-3 text-right text-green-400 text-xs font-medium">{batch.remaining_quantity}</td>
                        <td className="py-2 px-3 text-center text-gray-300 text-xs">{batch.unit}</td>
                        <td className="py-2 px-3 text-center text-gray-300 text-xs">
                          {batch.received_date ? new Date(batch.received_date).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Movements Table */}
              {activeTab === 'movements' && (
                <table className="w-full text-sm">
                  <thead className="bg-black/50 backdrop-blur-sm">
                    <tr className="border-b border-yellow-500/20">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Date</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Type</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Quantity</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Reference</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                        <td className="py-2 px-3 text-gray-300 text-xs">
                          {new Date(movement.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            movement.movement_type === 'Receipt' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            movement.movement_type === 'Issue' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {movement.movement_type}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-right text-xs font-medium ${
                          movement.movement_type === 'Issue' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {movement.movement_type === 'Issue' ? '-' : '+'}{movement.quantity}
                        </td>
                        <td className="py-2 px-3 text-gray-300 text-xs">
                          {movement.reference_type ? `${movement.reference_type} #${movement.reference_id}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-gray-400 text-xs">{movement.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Material Modal */}
        {showMaterialModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">
                  {editingMaterial ? 'Edit Material' : 'Create New Material'}
                </h2>
                <button
                  onClick={() => {
                    setShowMaterialModal(false);
                    setEditingMaterial(null);
                    setMaterialForm({ name: '', type: '', unit: '', minimum_stock: '' });
                    setMaterialTypeOther(false);
                    setCustomMaterialType('');
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleMaterialSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={materialForm.name}
                      onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      value={materialTypeOther ? 'Other' : materialForm.type}
                      onChange={(e) => {
                        if (e.target.value === 'Other') {
                          setMaterialTypeOther(true);
                          setMaterialForm({...materialForm, type: customMaterialType});
                        } else {
                          setMaterialTypeOther(false);
                          setCustomMaterialType('');
                          setMaterialForm({...materialForm, type: e.target.value});
                        }
                      }}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    >
                      <option value="">Select type...</option>
                      {materialTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {materialTypeOther && (
                      <input
                        type="text"
                        value={customMaterialType}
                        onChange={(e) => {
                          setCustomMaterialType(e.target.value);
                          setMaterialForm({...materialForm, type: e.target.value});
                        }}
                        placeholder="Enter custom material type..."
                        className="w-full mt-2 px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Unit</label>
                    <input
                      type="text"
                      value={materialForm.unit}
                      onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="e.g., kg, pcs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Stock</label>
                    <input
                      type="number"
                      step="0.01"
                      value={materialForm.minimum_stock}
                      onChange={(e) => setMaterialForm({...materialForm, minimum_stock: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaterialModal(false);
                      setEditingMaterial(null);
                      setMaterialForm({ name: '', type: '', unit: '', minimum_stock: '' });
                      setMaterialTypeOther(false);
                      setCustomMaterialType('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-aurexia py-3"
                  >
                    {editingMaterial ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Supplier Modal - Similar structure */}
        {showSupplierModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">
                  {editingSupplier ? 'Edit Supplier' : 'Create New Supplier'}
                </h2>
                <button
                  onClick={() => {
                    setShowSupplierModal(false);
                    setEditingSupplier(null);
                    setSupplierForm({ code: '', name: '', address: '', contact_person: '', phone: '', email: '' });
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Code *</label>
                    <input
                      type="text"
                      required
                      value={supplierForm.code}
                      onChange={(e) => setSupplierForm({...supplierForm, code: e.target.value})}
                      disabled={!!editingSupplier}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 disabled:bg-black/30 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={supplierForm.address}
                      onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person</label>
                    <input
                      type="text"
                      value={supplierForm.contact_person}
                      onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="text"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupplierModal(false);
                      setEditingSupplier(null);
                      setSupplierForm({ code: '', name: '', address: '', contact_person: '', phone: '', email: '' });
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-aurexia py-3"
                  >
                    {editingSupplier ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Batch Modal */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">Material Receipt</h2>
                <button
                  onClick={() => {
                    setShowBatchModal(false);
                    setBatchForm({
                      batch_number: '',
                      material_id: '',
                      supplier_id: '',
                      heat_number: '',
                      lot_number: '',
                      quantity: '',
                      unit: '',
                      received_date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleBatchSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Batch Number *</label>
                    <input
                      type="text"
                      required
                      value={batchForm.batch_number}
                      onChange={(e) => setBatchForm({...batchForm, batch_number: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Received Date *</label>
                    <input
                      type="date"
                      required
                      value={batchForm.received_date}
                      onChange={(e) => setBatchForm({...batchForm, received_date: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Material *</label>
                    <select
                      required
                      value={batchForm.material_id}
                      onChange={(e) => setBatchForm({...batchForm, material_id: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    >
                      <option value="">Select Material</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Supplier</label>
                    <select
                      value={batchForm.supplier_id}
                      onChange={(e) => setBatchForm({...batchForm, supplier_id: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantity *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={batchForm.quantity}
                      onChange={(e) => setBatchForm({...batchForm, quantity: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Unit *</label>
                    <input
                      type="text"
                      required
                      value={batchForm.unit}
                      onChange={(e) => setBatchForm({...batchForm, unit: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="kg, pcs, etc"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Heat Number (Colada)</label>
                    <input
                      type="text"
                      value={batchForm.heat_number}
                      onChange={(e) => setBatchForm({...batchForm, heat_number: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Lot Number</label>
                    <input
                      type="text"
                      value={batchForm.lot_number}
                      onChange={(e) => setBatchForm({...batchForm, lot_number: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBatchModal(false);
                      setBatchForm({
                        batch_number: '',
                        material_id: '',
                        supplier_id: '',
                        heat_number: '',
                        lot_number: '',
                        quantity: '',
                        unit: '',
                        received_date: new Date().toISOString().split('T')[0]
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-aurexia py-3"
                  >
                    Create Receipt
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

export default InventoryPage;
