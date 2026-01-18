'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { shipmentsAPI } from '@/lib/api';
import { useShipments, useCustomers, usePartNumbers, useSalesOrders, useProductionOrders, useCurrentUser } from '@/lib/hooks';
import { Shipment, Customer, PartNumber, SalesOrder, ProductionOrder, User } from '@/lib/types';
import { Plus, Search, Eye, Edit, Trash2, X, Package, Truck, CheckCircle, Calendar, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShipmentItemForm {
  part_number_id: number;
  quantity: number;
  unit_price?: number;
  production_order_id?: number;
  sales_order_item_id?: number;
}

const ShipmentsPage = () => {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [canViewPrices, setCanViewPrices] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    sales_order_id: '',
    shipment_date: new Date().toISOString().split('T')[0],
    status: 'Prepared',
    tracking_number: '',
    notes: '',
  });
  const [shipmentItems, setShipmentItems] = useState<ShipmentItemForm[]>([
    { part_number_id: 0, quantity: 1, unit_price: undefined, production_order_id: undefined }
  ]);

  // Use SWR hooks for optimized data fetching with caching
  const { shipments: shipmentsData, isLoading: shipmentsLoading, refresh: refreshShipments } = useShipments();
  const { customers: customersData, isLoading: customersLoading } = useCustomers();
  const { partNumbers: partNumbersData, isLoading: partNumbersLoading } = usePartNumbers();
  const { orders: salesOrdersData, isLoading: salesOrdersLoading } = useSalesOrders();
  const { orders: productionOrdersData, isLoading: productionOrdersLoading } = useProductionOrders();
  const { user: userData, isLoading: userLoading } = useCurrentUser();

  const loading = shipmentsLoading || customersLoading || partNumbersLoading || salesOrdersLoading || productionOrdersLoading || userLoading;

  // Use refs to track previous values and prevent infinite loops
  const prevShipmentsRef = useRef<string>('');
  const prevCustomersRef = useRef<string>('');
  const prevPartNumbersRef = useRef<string>('');
  const prevSalesOrdersRef = useRef<string>('');
  const prevProductionOrdersRef = useRef<string>('');
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
    if (shipmentsData) {
      const shipmentsKey = JSON.stringify(shipmentsData);
      if (shipmentsKey !== prevShipmentsRef.current) {
        prevShipmentsRef.current = shipmentsKey;
        setShipments(shipmentsData);
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
    if (salesOrdersData) {
      const salesOrdersKey = JSON.stringify(salesOrdersData);
      if (salesOrdersKey !== prevSalesOrdersRef.current) {
        prevSalesOrdersRef.current = salesOrdersKey;
        setSalesOrders(salesOrdersData);
      }
    }
    if (productionOrdersData) {
      const productionOrdersKey = JSON.stringify(productionOrdersData);
      if (productionOrdersKey !== prevProductionOrdersRef.current) {
        prevProductionOrdersRef.current = productionOrdersKey;
        setProductionOrders(productionOrdersData);
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
  }, [shipmentsData, customersData, partNumbersData, salesOrdersData, productionOrdersData, userData]);

  const loadShipments = () => {
    refreshShipments();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate items
    const validItems = shipmentItems.filter(item => item.part_number_id > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item to the shipment');
      return;
    }

    try {
      const shipmentData = {
        ...formData,
        customer_id: parseInt(formData.customer_id),
        sales_order_id: formData.sales_order_id ? parseInt(formData.sales_order_id) : undefined,
        items: validItems,
      };

      if (editingShipment) {
        await shipmentsAPI.update(editingShipment.id, shipmentData);
        toast.success('Shipment updated successfully!');
      } else {
        await shipmentsAPI.create(shipmentData);
        toast.success('Shipment created successfully!');
      }
      
      handleCloseModal();
      loadShipments();
    } catch (error: any) {
      console.error('Error saving shipment:', error);
      toast.error(error.response?.data?.detail || 'Failed to save shipment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return;
    
    try {
      await shipmentsAPI.delete(id);
      toast.success('Shipment deleted successfully!');
      loadShipments();
    } catch (error: any) {
      console.error('Error deleting shipment:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete shipment');
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string, trackingNumber?: string) => {
    try {
      await shipmentsAPI.updateStatus(id, newStatus, trackingNumber);
      toast.success(`Shipment status updated to ${newStatus}!`);
      loadShipments();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleNewShipment = () => {
    setEditingShipment(null);
    setFormData({
      customer_id: '',
      sales_order_id: '',
      shipment_date: new Date().toISOString().split('T')[0],
      status: 'Prepared',
      tracking_number: '',
      notes: '',
    });
    setShipmentItems([{ part_number_id: 0, quantity: 1, unit_price: undefined, production_order_id: undefined }]);
    setShowModal(true);
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setFormData({
      customer_id: shipment.customer_id.toString(),
      sales_order_id: shipment.sales_order_id?.toString() || '',
      shipment_date: shipment.shipment_date,
      status: shipment.status,
      tracking_number: shipment.tracking_number || '',
      notes: shipment.notes || '',
    });
    setShipmentItems(
      shipment.items.map(item => ({
        part_number_id: item.part_number_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        production_order_id: item.production_order_id,
        sales_order_item_id: item.sales_order_item_id,
      }))
    );
    setShowModal(true);
  };

  const handleView = (shipment: Shipment) => {
    setViewingShipment(shipment);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowViewModal(false);
    setEditingShipment(null);
    setViewingShipment(null);
  };

  const addShipmentItem = () => {
    setShipmentItems([...shipmentItems, { part_number_id: 0, quantity: 1, unit_price: undefined, production_order_id: undefined }]);
  };

  const removeShipmentItem = (index: number) => {
    if (shipmentItems.length > 1) {
      setShipmentItems(shipmentItems.filter((_, i) => i !== index));
    }
  };

  const updateShipmentItem = (index: number, field: keyof ShipmentItemForm, value: any) => {
    const newItems = [...shipmentItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setShipmentItems(newItems);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      Prepared: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Shipped: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return (
      <span className={`px-2 py-1 rounded border text-xs font-medium ${statusColors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        {status}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Prepared':
        return <Package className="w-4 h-4 text-blue-400" />;
      case 'Shipped':
        return <Truck className="w-4 h-4 text-yellow-400" />;
      case 'Delivered':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  // Filter shipments
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      toast.loading('Generating Excel file...');
      
      const response = await fetch('http://localhost:8000/api/exports/shipments', {
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
      a.download = `shipments_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Shipments exported successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export shipments');
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <PageModal showSidebar={true}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading shipments...</p>
          </div>
        </div>
      </PageModal>
    );
  }

  return (
    <PageModal showSidebar={true}>
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg border border-yellow-500/30">
              <Package className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Shipping & Delivery</h1>
              <p className="text-sm text-gray-400">Manage shipments and track deliveries</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 
                       text-white font-medium rounded-lg transition-colors border border-gray-700"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleNewShipment}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 
                       text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 
                       transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
            >
              <Plus className="w-4 h-4" />
              New Shipment
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg 
                       text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white 
                     focus:outline-none focus:border-yellow-500"
          >
            <option value="">All Statuses</option>
            <option value="Prepared">Prepared</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Shipments Table */}
        <div className="flex-1 overflow-auto">
          <div className="bg-gray-900/30 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Shipment #</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Sales Order</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Tracking #</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Items</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter ? 'No shipments found matching your filters' : 'No shipments yet. Create your first shipment!'}
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => (
                    <tr 
                      key={shipment.id}
                      className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(shipment.status)}
                          <span className="text-white font-medium">{shipment.shipment_number}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {shipment.customer?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {shipment.sales_order?.po_number || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(shipment.shipment_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(shipment.status)}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {shipment.tracking_number || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {shipment.items?.length || 0} items
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(shipment)}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(shipment)}
                            className="p-1.5 text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(shipment.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingShipment ? 'Edit Shipment' : 'New Shipment'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Customer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Customer <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white 
                               focus:outline-none focus:border-yellow-500"
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.code} - {customer.name}
                        </option>
                      ))}
                    </select>
                    {formData.customer_id && (
                      <p className="mt-1 text-xs text-gray-500">
                        ✓ Selected - Sales orders will be filtered for this customer
                      </p>
                    )}
                  </div>

                  {/* Sales Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sales Order
                      <span className="ml-2 text-xs text-gray-500">(Optional - Auto-match if empty)</span>
                    </label>
                    <select
                      value={formData.sales_order_id}
                      onChange={(e) => setFormData({...formData, sales_order_id: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white 
                               focus:outline-none focus:border-yellow-500"
                    >
                      <option value="">Auto-match to customer orders (Recommended)</option>
                      {salesOrders
                        .filter(order => 
                          !formData.customer_id || 
                          order.customer_id.toString() === formData.customer_id
                        )
                        .filter(order => order.status === 'Open' || order.status === 'Partial')
                        .map(order => {
                          const totalOrdered = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                          const totalShipped = order.items?.reduce((sum, item) => sum + (item.quantity_shipped || 0), 0) || 0;
                          const remaining = totalOrdered - totalShipped;
                          return (
                            <option key={order.id} value={order.id}>
                              {order.po_number} - {order.customer?.name} (Due: {new Date(order.due_date).toLocaleDateString()}) - {remaining} units remaining
                            </option>
                          );
                        })}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      💡 Leave empty to automatically match items to customer's open orders by due date
                    </p>
                    
                    {/* Auto-match Preview */}
                    {formData.customer_id && !formData.sales_order_id && (
                      (() => {
                        const customerOrders = salesOrders
                          .filter(order => order.customer_id.toString() === formData.customer_id)
                          .filter(order => order.status === 'Open' || order.status === 'Partial')
                          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
                        
                        if (customerOrders.length > 0) {
                          return (
                            <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                              <div className="flex items-start gap-2">
                                <span className="text-blue-400 text-lg">ℹ️</span>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-blue-400 mb-1">Auto-match will prioritize:</p>
                                  <div className="space-y-1">
                                    {customerOrders.slice(0, 3).map((order, idx) => (
                                      <div key={order.id} className="text-xs text-gray-300">
                                        {idx + 1}. <span className="font-mono text-yellow-400">{order.po_number}</span>
                                        <span className="text-gray-500"> - Due: {new Date(order.due_date).toLocaleDateString()}</span>
                                      </div>
                                    ))}
                                    {customerOrders.length > 3 && (
                                      <div className="text-xs text-gray-500">
                                        ...and {customerOrders.length - 3} more order{customerOrders.length - 3 > 1 ? 's' : ''}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>

                  {/* Shipment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Shipment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.shipment_date}
                      onChange={(e) => setFormData({...formData, shipment_date: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white 
                               focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white 
                               focus:outline-none focus:border-yellow-500"
                    >
                      <option value="Prepared">Prepared</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  {/* Tracking Number */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={formData.tracking_number}
                      onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                      placeholder="Enter tracking number"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white 
                               placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      placeholder="Additional notes..."
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white 
                               placeholder-gray-500 focus:outline-none focus:border-yellow-500 resize-none"
                    />
                  </div>
                </div>

                {/* Shipment Items */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Shipment Items</h3>
                    <button
                      type="button"
                      onClick={addShipmentItem}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 
                               text-white rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {shipmentItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          {/* Part Number */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Part Number *</label>
                            <select
                              required
                              value={item.part_number_id}
                              onChange={(e) => updateShipmentItem(index, 'part_number_id', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm
                                       focus:outline-none focus:border-yellow-500"
                            >
                              <option value={0}>Select Part</option>
                              {partNumbers.map(part => (
                                <option key={part.id} value={part.id}>
                                  {part.part_number}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Quantity *</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateShipmentItem(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm
                                       focus:outline-none focus:border-yellow-500"
                            />
                          </div>

                          {/* Unit Price */}
                          {canViewPrices && (
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Unit Price</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price || ''}
                                onChange={(e) => updateShipmentItem(index, 'unit_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm
                                         placeholder-gray-600 focus:outline-none focus:border-yellow-500"
                              />
                            </div>
                          )}

                          {/* Production Order */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Production Order</label>
                            <select
                              value={item.production_order_id || ''}
                              onChange={(e) => updateShipmentItem(index, 'production_order_id', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm
                                       focus:outline-none focus:border-yellow-500"
                            >
                              <option value="">None</option>
                              {productionOrders.map(po => (
                                <option key={po.id} value={po.id}>
                                  {po.po_number}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeShipmentItem(index)}
                          disabled={shipmentItems.length === 1}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors
                                   disabled:opacity-30 disabled:cursor-not-allowed mt-5"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg 
                             transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 
                             hover:from-yellow-400 hover:to-yellow-500 text-black font-medium 
                             rounded-lg transition-all duration-200"
                  >
                    {editingShipment ? 'Update Shipment' : 'Create Shipment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingShipment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{viewingShipment.shipment_number}</h2>
                  {getStatusBadge(viewingShipment.status)}
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Shipment Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-sm text-gray-400">Customer</label>
                    <p className="text-white font-medium">{viewingShipment.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Sales Order</label>
                    <p className="text-white font-medium">{viewingShipment.sales_order?.po_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Shipment Date</label>
                    <p className="text-white font-medium">
                      {new Date(viewingShipment.shipment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Tracking Number</label>
                    <p className="text-white font-medium">{viewingShipment.tracking_number || '-'}</p>
                  </div>
                  {viewingShipment.notes && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-400">Notes</label>
                      <p className="text-white">{viewingShipment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Shipment Items */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Items ({viewingShipment.items?.length || 0})</h3>
                  <div className="bg-gray-800/30 rounded-lg border border-gray-800 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="text-left py-3 px-4 text-gray-400 text-sm">Part Number</th>
                          <th className="text-right py-3 px-4 text-gray-400 text-sm">Quantity</th>
                          {canViewPrices && (
                            <>
                              <th className="text-right py-3 px-4 text-gray-400 text-sm">Unit Price</th>
                              <th className="text-right py-3 px-4 text-gray-400 text-sm">Total</th>
                            </>
                          )}
                          <th className="text-left py-3 px-4 text-gray-400 text-sm">Production Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingShipment.items?.map((item, index) => (
                          <tr key={index} className="border-t border-gray-800">
                            <td className="py-3 px-4 text-white">
                              {item.part_number?.part_number || `ID: ${item.part_number_id}`}
                            </td>
                            <td className="py-3 px-4 text-white text-right">{item.quantity}</td>
                            {canViewPrices && (
                              <>
                                <td className="py-3 px-4 text-white text-right">
                                  {item.unit_price ? `$${item.unit_price.toFixed(2)}` : '-'}
                                </td>
                                <td className="py-3 px-4 text-white text-right font-medium">
                                  {item.unit_price ? `$${(item.quantity * item.unit_price).toFixed(2)}` : '-'}
                                </td>
                              </>
                            )}
                            <td className="py-3 px-4 text-white">
                              {item.production_order?.po_number || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Update Status</h3>
                  <div className="flex gap-3">
                    {viewingShipment.status !== 'Shipped' && (
                      <button
                        onClick={() => handleStatusUpdate(viewingShipment.id, 'Shipped')}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 
                                 text-yellow-400 border border-yellow-500/30 rounded-lg transition-colors"
                      >
                        <Truck className="w-4 h-4" />
                        Mark as Shipped
                      </button>
                    )}
                    {viewingShipment.status !== 'Delivered' && (
                      <button
                        onClick={() => handleStatusUpdate(viewingShipment.id, 'Delivered')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 
                                 text-green-400 border border-green-500/30 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageModal>
  );
};

export default ShipmentsPage;
