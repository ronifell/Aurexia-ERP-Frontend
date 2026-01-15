'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { salesOrdersAPI, customersAPI, partNumbersAPI } from '@/lib/api';
import { SalesOrder } from '@/lib/types';
import { Plus, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const SalesOrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const data = await salesOrdersAPI.getAll();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
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

  return (
    <PageModal>
      <div className="h-full overflow-hidden flex flex-col px-6">
          <div className="w-full py-4 h-full flex flex-col max-w-[2000px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold gold-text mb-1">Sales Orders</h1>
              <p className="text-gray-400 text-sm">Customer Purchase Orders</p>
            </div>
            <button className="btn-aurexia flex items-center space-x-2 text-sm px-4 py-2">
              <Plus className="w-4 h-4" />
              <span>New Order</span>
            </button>
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
          <div className="card-aurexia p-4 flex-1 min-h-0 relative">
            <div className="absolute inset-0 p-4 overflow-x-auto overflow-y-hidden">
              <table className="w-full text-sm">
                <thead className="bg-black/50 backdrop-blur-sm">
                  <tr className="border-b border-yellow-500/20">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">PO Number</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Customer</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Order Date</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Due Date</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Items</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Status</th>
                    <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        <p className="text-sm">No sales orders found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
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
                        <td className="py-2 px-3">
                          <div className="flex justify-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeClass(order.status)}`}>
                              {order.status}
                            </span>
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
      </div>
    </PageModal>
  );
};

export default SalesOrdersPage;
