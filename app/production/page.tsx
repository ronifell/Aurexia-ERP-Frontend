'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { productionOrdersAPI } from '@/lib/api';
import { ProductionOrder } from '@/lib/types';
import { Plus, Search, FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductionPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
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
      const data = await productionOrdersAPI.getAll();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load production orders');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTravelSheet = async (orderId: number) => {
    try {
      await productionOrdersAPI.generateTravelSheet(orderId);
      toast.success('Travel sheet generated successfully!');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate travel sheet');
    }
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

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Navbar />
      
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold gold-text mb-1">Production Orders</h1>
              <p className="text-gray-400 text-sm">Manufacturing work orders and travel sheets</p>
            </div>
            <button className="btn-aurexia flex items-center space-x-2 text-sm px-4 py-2">
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
          <div className="card-aurexia p-4 flex-1 flex flex-col min-h-0">
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-black/50 backdrop-blur-sm">
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
                  {filteredOrders.map((order) => (
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
                            className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400"
                            title="Generate Travel Sheet"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No production orders found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;
