'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { dashboardAPI } from '@/lib/api';
import { DashboardStats, ProductionDashboardItem } from '@/lib/types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Factory, 
  TrendingUp,
  Calendar,
  Package
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [production, setProduction] = useState<ProductionDashboardItem[]>([]);
  const [workCenterLoad, setWorkCenterLoad] = useState<any[]>([]);
  const [dailyProduction, setDailyProduction] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const [statsData, productionData, workCenterData, dailyData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getProductionDashboard(),
        dashboardAPI.getWorkCenterLoad(),
        dashboardAPI.getDailyProduction(7),
      ]);

      setStats(statsData);
      setProduction(productionData);
      setWorkCenterLoad(workCenterData);
      setDailyProduction(dailyData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Green': return 'status-green';
      case 'Yellow': return 'status-yellow';
      case 'Red': return 'status-red';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredProduction = filterRisk
    ? production.filter(item => item.risk_status === filterRisk)
    : production;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gold-text mb-2">MOAB - Supervision Dashboard</h1>
          <p className="text-gray-400">Real-time production monitoring and control</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="card-aurexia p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Open Orders</p>
                <p className="text-2xl font-bold text-yellow-400">{stats?.total_open_orders || 0}</p>
              </div>
              <Factory className="w-8 h-8 text-yellow-500/50" />
            </div>
          </div>

          <div className="card-aurexia p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">In Production</p>
                <p className="text-2xl font-bold text-blue-400">{stats?.total_in_production || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500/50" />
            </div>
          </div>

          <div className="card-aurexia p-6 cursor-pointer hover:bg-green-500/10" onClick={() => setFilterRisk('Green')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">On Time</p>
                <p className="text-2xl font-bold text-green-400">{stats?.total_on_time || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/50" />
            </div>
          </div>

          <div className="card-aurexia p-6 cursor-pointer hover:bg-yellow-500/10" onClick={() => setFilterRisk('Yellow')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">At Risk</p>
                <p className="text-2xl font-bold text-yellow-400">{stats?.total_at_risk || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500/50" />
            </div>
          </div>

          <div className="card-aurexia p-6 cursor-pointer hover:bg-red-500/10" onClick={() => setFilterRisk('Red')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Delayed</p>
                <p className="text-2xl font-bold text-red-400">{stats?.total_delayed || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500/50" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Production Chart */}
          <div className="card-aurexia p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Daily Production (7 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyProduction}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37' }}
                />
                <Legend />
                <Bar dataKey="good" fill="#22c55e" name="Good" />
                <Bar dataKey="scrap" fill="#ef4444" name="Scrap" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Work Center Load Chart */}
          <div className="card-aurexia p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Work Center Load</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workCenterLoad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="work_center_name" stroke="#999" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37' }}
                />
                <Legend />
                <Bar dataKey="pending" stackId="a" fill="#eab308" name="Pending" />
                <Bar dataKey="in_progress" stackId="a" fill="#3b82f6" name="In Progress" />
                <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Orders Table */}
        <div className="card-aurexia p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200">Production Orders</h3>
            {filterRisk && (
              <button
                onClick={() => setFilterRisk('')}
                className="text-sm text-yellow-400 hover:text-yellow-300"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yellow-500/20">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">PO Number</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Part Number</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Quantity</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Progress</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Due Date</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProduction.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                    <td className="py-3 px-4 text-gray-200">{item.po_number}</td>
                    <td className="py-3 px-4 text-gray-300">{item.customer_name || '-'}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-gray-200">{item.part_number}</p>
                        {item.part_description && (
                          <p className="text-xs text-gray-500">{item.part_description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-200">
                      {item.quantity_completed} / {item.quantity}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-[100px] bg-black/30 backdrop-blur-sm rounded-full h-2 border border-yellow-500/20">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${item.completion_percentage}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs text-gray-400">{item.completion_percentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300">
                      {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskBadgeClass(item.risk_status)}`}>
                          {item.risk_status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProduction.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No production orders found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
