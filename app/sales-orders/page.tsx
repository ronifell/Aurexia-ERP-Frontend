'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { salesOrdersAPI } from '@/lib/api';
import { useSalesOrders, useCustomers, usePartNumbers, useCurrentUser } from '@/lib/hooks';
import { SalesOrder, Customer, PartNumber, User } from '@/lib/types';
import { Plus, Search, Eye, Edit, Trash2, X, ShoppingCart, Calendar, Package, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface OrderItem {
  part_number_id: number;
  quantity: number;
  unit_price?: number;
}

const SalesOrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [canViewPrices, setCanViewPrices] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [formData, setFormData] = useState({
    po_number: '',
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'Open',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { part_number_id: 0, quantity: 1, unit_price: undefined }
  ]);

  // Use SWR hooks for optimized data fetching with caching
  const { orders: ordersData, isLoading: ordersLoading, refresh: refreshOrders } = useSalesOrders();
  const { customers: customersData, isLoading: customersLoading } = useCustomers();
  const { partNumbers: partNumbersData, isLoading: partNumbersLoading } = usePartNumbers();
  const { user: userData, isLoading: userLoading } = useCurrentUser();

  const loading = ordersLoading || customersLoading || partNumbersLoading || userLoading;

  // Use refs to track previous values and prevent infinite loops
  const prevOrdersRef = useRef<string>('');
  const prevCustomersRef = useRef<string>('');
  const prevPartNumbersRef = useRef<string>('');
  const prevUserRef = useRef<string>('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    // Only update if data has actually changed (using JSON.stringify for deep comparison)
    if (ordersData) {
      const ordersKey = JSON.stringify(ordersData);
      if (ordersKey !== prevOrdersRef.current) {
        prevOrdersRef.current = ordersKey;
        setOrders(ordersData);
      }
    }
    if (customersData) {
      const customersKey = JSON.stringify(customersData);
      if (customersKey !== prevCustomersRef.current) {
        prevCustomersRef.current = customersKey;
        setCustomers(customersData);
      }
    }
    if (partNumbersData) {
      const partNumbersKey = JSON.stringify(partNumbersData);
      if (partNumbersKey !== prevPartNumbersRef.current) {
        prevPartNumbersRef.current = partNumbersKey;
        setPartNumbers(partNumbersData);
      }
    }
    if (userData) {
      const userKey = JSON.stringify(userData);
      if (userKey !== prevUserRef.current) {
        prevUserRef.current = userKey;
        setCurrentUser(userData);
        const hasPermission = userData?.role?.can_view_prices || false;
        setCanViewPrices(hasPermission);
      }
    }
  }, [ordersData, customersData, partNumbersData, userData]);

  const loadOrders = () => {
    refreshOrders();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate items
    const validItems = orderItems.filter(item => item.part_number_id > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    try {
      const orderData = {
        ...formData,
        customer_id: parseInt(formData.customer_id),
        items: validItems,
      };

      if (editingOrder) {
        await salesOrdersAPI.update(editingOrder.id, orderData);
        toast.success('Sales order updated successfully!');
      } else {
        await salesOrdersAPI.create(orderData);
        toast.success('Sales order created successfully!');
      }
      
      handleCloseModal();
      loadOrders();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save sales order';
      toast.error(errorMessage);
    }
  };

  const handleView = async (order: SalesOrder) => {
    try {
      const fullOrder = await salesOrdersAPI.getById(order.id);
      setViewingOrder(fullOrder);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  const handleEdit = (order: SalesOrder) => {
    setEditingOrder(order);
    setFormData({
      po_number: order.po_number,
      customer_id: order.customer_id.toString(),
      order_date: order.order_date.split('T')[0],
      due_date: order.due_date.split('T')[0],
      status: order.status,
      notes: order.notes || '',
    });
    setOrderItems(order.items.map(item => ({
      part_number_id: item.part_number_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })));
    setShowModal(true);
  };

  const handleDelete = async (id: number, poNumber: string) => {
    if (!confirm(`Are you sure you want to delete order "${poNumber}"?`)) {
      return;
    }
    
    try {
      await salesOrdersAPI.delete(id);
      toast.success('Sales order deleted successfully!');
      loadOrders();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete sales order';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      po_number: '',
      customer_id: '',
      order_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'Open',
      notes: '',
    });
    setOrderItems([{ part_number_id: 0, quantity: 1, unit_price: undefined }]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    resetForm();
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { part_number_id: 0, quantity: 1, unit_price: undefined }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      const newItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(newItems);
    }
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill unit price from part number if not manually set
    if (field === 'part_number_id') {
      const partNumber = partNumbers.find(p => p.id === parseInt(value));
      if (partNumber && partNumber.unit_price && !newItems[index].unit_price) {
        newItems[index].unit_price = partNumber.unit_price;
      }
    }
    
    setOrderItems(newItems);
  };

  const filteredOrders = orders.filter(order =>
    order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Partial': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const calculateOrderTotal = (order: SalesOrder): number => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
      const price = item.total_price ? Number(item.total_price) : 0;
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  };

  const calculateTotalShipped = (order: SalesOrder): number => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
      return sum + (item.quantity_shipped || 0);
    }, 0);
  };

  const calculateTotalOrdered = (order: SalesOrder): number => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);
  };

  const calculateCurrentOrderTotal = (): number => {
    return orderItems.reduce((sum, item) => {
      if (item.part_number_id > 0 && item.quantity > 0 && item.unit_price) {
        const itemTotal = item.quantity * item.unit_price;
        return sum + itemTotal;
      }
      return sum;
    }, 0);
  };

  const getItemTotal = (item: OrderItem): number => {
    if (item.quantity > 0 && item.unit_price) {
      return item.quantity * item.unit_price;
    }
    return 0;
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      toast.loading('Generating Excel file...');
      
      const response = await fetch(`${API_BASE_URL}/exports/sales-orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_orders_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Sales orders exported successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export sales orders');
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <PageModal>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading sales orders...</p>
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold gold-text mb-1">Sales Orders</h1>
                {currentUser && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    canViewPrices 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {canViewPrices ? '💰 Price Access' : '🔒 No Price Access'}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">Customer Purchase Orders</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                className="flex items-center space-x-2 text-sm px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition-colors"
                title="Export to Excel"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="btn-aurexia flex items-center space-x-2 text-sm px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Order</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by PO number or customer..."
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
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Customer</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Order Date</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Due Date</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Items</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Qty Ordered</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Qty Shipped</th>
                    {canViewPrices && (
                      <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Total Amount</th>
                    )}
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Status</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={canViewPrices ? 10 : 9} className="text-center py-8 text-gray-500">
                        <p className="text-sm">No sales orders found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const totalAmount = calculateOrderTotal(order);
                      const totalShipped = calculateTotalShipped(order);
                      const totalOrdered = calculateTotalOrdered(order);
                      return (
                        <tr key={order.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                          <td className="py-2 px-3 text-gray-200 font-medium text-xs">{order.po_number}</td>
                          <td className="py-2 px-3 text-gray-300 text-xs">{order.customer?.name || '-'}</td>
                          <td className="py-2 px-3 text-center text-gray-300 text-xs">
                            {new Date(order.order_date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-300 text-xs">
                            {new Date(order.due_date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-200 text-xs">
                            {order.items?.length || 0}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-200 text-xs">
                            {totalOrdered}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-200 text-xs">
                            <span className={`font-medium ${totalShipped > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                              {totalShipped}
                            </span>
                          </td>
                          {canViewPrices && (
                            <td className="py-2 px-3 text-right text-gray-200 font-medium text-xs">
                              {totalAmount > 0 ? (
                                <span className="text-green-400">
                                  ${totalAmount.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          )}
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
                                onClick={() => handleView(order)}
                                className="p-1.5 hover:bg-blue-500/10 rounded-lg text-gray-400 hover:text-blue-400"
                                title="View order"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleEdit(order)}
                                className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400"
                                title="Edit order"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(order.id, order.po_number)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"
                                title="Delete order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create/Edit Order Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">
                {editingOrder ? 'Edit Sales Order' : 'Create New Sales Order'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      PO Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.po_number}
                      onChange={(e) => setFormData({...formData, po_number: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 font-mono"
                      placeholder="PO-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Customer *
                    </label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    >
                      <option value="">Select customer...</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.code} - {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Order Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.order_date}
                      onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    />
                  </div>

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
                      <option value="Open">Open</option>
                      <option value="Partial">Partial</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="Additional notes or instructions..."
                  />
                </div>

                {/* Order Items */}
                <div className="border-t border-yellow-500/20 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-200">Order Items</h3>
                      {!canViewPrices && (
                        <p className="text-xs text-gray-500 mt-1">
                          🔒 Price fields are hidden based on your role permissions
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addOrderItem}
                      className="text-sm px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {orderItems.map((item, index) => {
                      const lineTotal = getItemTotal(item);
                      return (
                        <div key={index} className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Part Number *
                            </label>
                            <select
                              required
                              value={item.part_number_id}
                              onChange={(e) => updateOrderItem(index, 'part_number_id', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 text-sm"
                            >
                              <option value="0">Select part number...</option>
                              {partNumbers.map(part => (
                                <option key={part.id} value={part.id}>
                                  {part.part_number} {part.description ? `- ${part.description}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-32">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 text-sm"
                            />
                          </div>

                          {canViewPrices && (
                            <>
                              <div className="w-32">
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                  Unit Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unit_price || ''}
                                  onChange={(e) => updateOrderItem(index, 'unit_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full px-3 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100 text-sm"
                                  placeholder="Auto"
                                />
                              </div>
                              <div className="w-32">
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                  Total
                                </label>
                                <div className="px-3 py-2 bg-black/30 border border-yellow-500/20 rounded-lg text-gray-100 text-sm text-right font-medium">
                                  {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : '-'}
                                </div>
                              </div>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => removeOrderItem(index)}
                            disabled={orderItems.length === 1}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Total Summary */}
                  {canViewPrices && (
                    <div className="mt-6 pt-4 border-t border-yellow-500/20">
                      <div className="flex justify-end">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-6 py-3">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-300 font-medium">Order Total:</span>
                            <span className="text-2xl font-bold text-yellow-400">
                              ${calculateCurrentOrderTotal().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-6 border-t border-yellow-500/20">
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

        {/* View Order Modal */}
        {showViewModal && viewingOrder && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-100">
                  Order Details
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">PO Number</p>
                    <p className="text-sm font-mono text-yellow-400">{viewingOrder.po_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(viewingOrder.status)}`}>
                      {viewingOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order Date</p>
                    <p className="text-sm text-gray-300">{new Date(viewingOrder.order_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="text-sm text-gray-300">{new Date(viewingOrder.due_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border-t border-yellow-500/20 pt-4">
                  <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/30 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Customer Code</p>
                      <p className="text-sm font-mono text-yellow-400">{viewingOrder.customer?.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company Name</p>
                      <p className="text-sm text-gray-300">{viewingOrder.customer?.name}</p>
                    </div>
                    {viewingOrder.customer?.contact_person && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                        <p className="text-sm text-gray-300">{viewingOrder.customer.contact_person}</p>
                      </div>
                    )}
                    {viewingOrder.customer?.email && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm text-gray-300">{viewingOrder.customer.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-yellow-500/20 pt-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order Items
                    </h3>
                    {!canViewPrices && (
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        🔒 Price information is hidden based on your role permissions
                      </p>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-black/50">
                        <tr className="border-b border-yellow-500/20">
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Part Number</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Description</th>
                          <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Quantity</th>
                          {canViewPrices && (
                            <>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Unit Price</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium text-xs">Total</th>
                            </>
                          )}
                          <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingOrder.items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-800">
                            <td className="py-2 px-3">
                              <code className="text-xs bg-gray-800 text-yellow-400 px-2 py-1 rounded font-mono">
                                {item.part_number?.part_number}
                              </code>
                            </td>
                            <td className="py-2 px-3 text-gray-300 text-xs">
                              {item.part_number?.description || '-'}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-300 text-xs">
                              {item.quantity}
                            </td>
                            {canViewPrices && (
                              <>
                                <td className="py-2 px-3 text-right text-gray-300 text-xs">
                                  {item.unit_price ? `$${item.unit_price.toFixed(2)}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-gray-300 text-xs">
                                  {item.total_price ? `$${item.total_price.toFixed(2)}` : '-'}
                                </td>
                              </>
                            )}
                            <td className="py-2 px-3">
                              <div className="flex justify-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeClass(item.status)}`}>
                                  {item.status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {viewingOrder.notes && (
                  <div className="border-t border-yellow-500/20 pt-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Notes</h3>
                    <p className="text-sm text-gray-400 bg-black/30 p-4 rounded-lg whitespace-pre-wrap">
                      {viewingOrder.notes}
                    </p>
                  </div>
                )}

                {/* Production Status */}
                <div className="border-t border-yellow-500/20 pt-4">
                  <h3 className="text-lg font-semibold text-gray-200 mb-3">Production Status</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {viewingOrder.items.map((item) => (
                      <div key={item.id} className="bg-black/30 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">{item.part_number?.part_number}</p>
                        <div className="flex justify-between text-xs mt-2">
                          <span className="text-gray-400">Produced:</span>
                          <span className="text-green-400 font-medium">{item.quantity_produced}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-400">Shipped:</span>
                          <span className="text-blue-400 font-medium">{item.quantity_shipped}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-400">Remaining:</span>
                          <span className="text-yellow-400 font-medium">{item.quantity - item.quantity_produced}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-yellow-500/20">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(viewingOrder);
                    }}
                    className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Order</span>
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
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

export default SalesOrdersPage;
