'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { customersAPI } from '@/lib/api';
import { useCustomers } from '@/lib/hooks';
import { Customer } from '@/lib/types';
import { Plus, Search, Edit, Trash2, Users, Mail, Phone, MapPin, Calendar, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomersPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    contact_person: '',
    phone: '',
    email: '',
    delivery_frequency: '',
  });

  // Use SWR hook for optimized data fetching with caching
  const { customers, isLoading: loading, refresh: refreshCustomers } = useCustomers();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const loadCustomers = () => {
    refreshCustomers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
        toast.success('Customer updated successfully!');
      } else {
        await customersAPI.create(formData);
        toast.success('Customer created successfully!');
      }
      
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save customer';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      code: customer.code,
      name: customer.name,
      address: customer.address || '',
      contact_person: customer.contact_person || '',
      phone: customer.phone || '',
      email: customer.email || '',
      delivery_frequency: customer.delivery_frequency || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) {
      return;
    }
    
    try {
      await customersAPI.delete(id);
      toast.success('Customer deleted successfully!');
      loadCustomers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete customer';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      address: '',
      contact_person: '',
      phone: '',
      email: '',
      delivery_frequency: '',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    resetForm();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCustomers = customers.filter(c => c.is_active).length;
  const inactiveCustomers = customers.length - activeCustomers;

  if (loading) {
    return (
      <PageModal>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading customers...</p>
          </div>
        </div>
      </PageModal>
    );
  }

  return (
    <PageModal>
      <div className="min-h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold gold-text mb-2">Customer Management</h1>
              <p className="text-gray-400">Manage your customer database</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-aurexia flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Customer</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card-aurexia p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Customers</p>
                  <p className="text-3xl font-bold text-yellow-400">{customers.length}</p>
                </div>
                <Building2 className="w-12 h-12 text-yellow-500 opacity-50" />
              </div>
            </div>
            
            <div className="card-aurexia p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Active Customers</p>
                  <p className="text-3xl font-bold text-green-400">{activeCustomers}</p>
                </div>
                <Users className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </div>
            
            <div className="card-aurexia p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Inactive Customers</p>
                  <p className="text-3xl font-bold text-red-400">{inactiveCustomers}</p>
                </div>
                <Users className="w-12 h-12 text-red-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by code, name, contact person, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="card-aurexia p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-yellow-500/20">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Code</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Contact Person</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Delivery Freq.</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                      <td className="py-3 px-4">
                        <code className="text-sm bg-gray-800 text-yellow-400 px-2 py-1 rounded font-mono">
                          {customer.code}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-200 font-medium">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {customer.contact_person || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {customer.phone ? (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span>{customer.phone}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {customer.email ? (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">{customer.email}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {customer.delivery_frequency ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {customer.delivery_frequency}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <span className={`w-3 h-3 rounded-full ${customer.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => handleEdit(customer)}
                            className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors"
                            title="Edit customer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">No customers found</p>
                  <p className="text-sm">
                    {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first customer'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create/Edit Customer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">
                {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Customer Code *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingCustomer}
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="CUST001"
                    />
                    {editingCustomer && (
                      <p className="text-xs text-gray-500 mt-1">Customer code cannot be changed</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="Acme Corporation"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="123 Main St, City, Country"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Delivery Frequency
                    </label>
                    <select
                      value={formData.delivery_frequency}
                      onChange={(e) => setFormData({...formData, delivery_frequency: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    >
                      <option value="">Select frequency...</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="as-needed">As Needed</option>
                    </select>
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
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
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

export default CustomersPage;
