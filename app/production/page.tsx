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
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-text mb-2">Production Orders</h1>
            <p className="text-gray-400">Manufacturing work orders and travel sheets</p>
          </div>
          <button className="btn-aurexia flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Production Order</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by PO number or part number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="card-aurexia p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yellow-500/20">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">PO Number</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Part Number</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Quantity</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Completed</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Scrap</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Priority</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                    <td className="py-3 px-4 text-gray-200 font-medium">{order.po_number}</td>
                    <td className="py-3 px-4 text-gray-300">{order.part_number?.part_number || '-'}</td>
                    <td className="py-3 px-4 text-center text-gray-200">{order.quantity}</td>
                    <td className="py-3 px-4 text-center text-green-400">{order.quantity_completed}</td>
                    <td className="py-3 px-4 text-center text-red-400">{order.quantity_scrapped}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeClass(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleGenerateTravelSheet(order.id)}
                          className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400"
                          title="Generate Travel Sheet"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No production orders found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;
