'use client';

import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
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

// Import Recharts components directly (lazy loading entire module causes type issues)
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

const DashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [production, setProduction] = useState<ProductionDashboardItem[]>([]);
  const [workCenterLoad, setWorkCenterLoad] = useState<any[]>([]);
  const [dailyProduction, setDailyProduction] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadDashboardData();
    // Refresh every 60 seconds (reduced from 30 for better performance)
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, [router]);

  const loadDashboardData = async () => {
    try {
      // Progressive loading: Load critical data first
      const [statsData, productionData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getProductionDashboard(),
      ]);

      setStats(statsData);
      setProduction(productionData);
      setLoading(false);

      // Load chart data separately (non-blocking)
      Promise.all([
        dashboardAPI.getWorkCenterLoad(),
        dashboardAPI.getDailyProduction(7),
      ]).then(([workCenterData, dailyData]) => {
        setWorkCenterLoad(workCenterData);
        setDailyProduction(dailyData);
        setChartsLoading(false);
      }).catch(error => {
        console.error('Error loading charts:', error);
        setChartsLoading(false);
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
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

  // Memoize filtered and paginated production data
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredProduction = useMemo(() => {
    return filterRisk
      ? production.filter(item => item.risk_status === filterRisk)
      : production;
  }, [production, filterRisk]);

  const paginatedProduction = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProduction.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProduction, currentPage]);

  const totalPages = Math.ceil(filteredProduction.length / itemsPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRisk]);

  if (loading) {
    return (
      <PageModal>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </PageModal>
    );
  }

  return (
    <PageModal>
      <div className="h-full overflow-hidden flex flex-col px-6">
          <div className="w-full py-4 h-full flex flex-col max-w-[2000px] mx-auto">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold gold-text mb-1">MOAB - Supervision Dashboard</h1>
            <p className="text-gray-400 text-sm">Real-time production monitoring and control</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div className="card-aurexia p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Open Orders</p>
                <p className="text-xl font-bold text-yellow-400">{stats?.total_open_orders || 0}</p>
              </div>
              <Factory className="w-6 h-6 text-yellow-500/50" />
            </div>
          </div>

          <div className="card-aurexia p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">In Production</p>
                <p className="text-xl font-bold text-blue-400">{stats?.total_in_production || 0}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-blue-500/50" />
            </div>
          </div>

          <div className="card-aurexia p-4 cursor-pointer hover:bg-green-500/10" onClick={() => setFilterRisk('Green')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">On Time</p>
                <p className="text-xl font-bold text-green-400">{stats?.total_on_time || 0}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500/50" />
            </div>
          </div>

          <div className="card-aurexia p-4 cursor-pointer hover:bg-yellow-500/10" onClick={() => setFilterRisk('Yellow')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">At Risk</p>
                <p className="text-xl font-bold text-yellow-400">{stats?.total_at_risk || 0}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-500/50" />
            </div>
          </div>

          <div className="card-aurexia p-4 cursor-pointer hover:bg-red-500/10" onClick={() => setFilterRisk('Red')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Delayed</p>
                <p className="text-xl font-bold text-red-400">{stats?.total_delayed || 0}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500/50" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          {/* Daily Production Chart */}
          <div className="card-aurexia p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Daily Production (7 days)</h3>
            {chartsLoading ? (
              <div className="h-[180px] flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
              <Suspense fallback={<div className="h-[180px] flex items-center justify-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div></div>}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailyProduction} barCategoryGap="30%" barGap={50}>
                    <defs>
                      <linearGradient id="goodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#86efac" stopOpacity={1} />
                        <stop offset="20%" stopColor="#4ade80" stopOpacity={1} />
                        <stop offset="40%" stopColor="#22c55e" stopOpacity={0.95} />
                        <stop offset="60%" stopColor="#16a34a" stopOpacity={0.8} />
                        <stop offset="80%" stopColor="#15803d" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#14532d" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="scrapGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fca5a5" stopOpacity={1} />
                        <stop offset="20%" stopColor="#f87171" stopOpacity={1} />
                        <stop offset="40%" stopColor="#ef4444" stopOpacity={0.95} />
                        <stop offset="60%" stopColor="#dc2626" stopOpacity={0.8} />
                        <stop offset="80%" stopColor="#b91c1c" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#991b1b" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#999" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar 
                      dataKey="good" 
                      fill="url(#goodGradient)" 
                      name="Good" 
                      fillOpacity={0.9}
                      stroke="#22c55e"
                      strokeWidth={2}
                      barSize={105}
                      radius={[6, 6, 0, 0]}
                      activeBar={{ fill: 'url(#goodGradient)', fillOpacity: 1, stroke: '#86efac', strokeWidth: 3 }} 
                    >
                      <LabelList 
                        dataKey="good" 
                        position="top" 
                        fill="#86efac"
                        fontSize={11}
                        fontWeight="bold"
                        formatter={(value: number) => value > 0 ? value : ''}
                      />
                    </Bar>
                    <Bar 
                      dataKey="scrap" 
                      fill="url(#scrapGradient)" 
                      name="Scrap" 
                      fillOpacity={0.9}
                      stroke="#ef4444"
                      strokeWidth={2}
                      barSize={105}
                      radius={[6, 6, 0, 0]}
                      activeBar={{ fill: 'url(#scrapGradient)', fillOpacity: 1, stroke: '#fca5a5', strokeWidth: 3 }} 
                    >
                      <LabelList 
                        dataKey="scrap" 
                        position="top" 
                        fill="#fca5a5"
                        fontSize={11}
                        fontWeight="bold"
                        formatter={(value: number) => value > 0 ? value : ''}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            )}
          </div>

          {/* Work Center Load Chart */}
          <div className="card-aurexia p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Work Center Load</h3>
            {chartsLoading ? (
              <div className="h-[180px] flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
              <Suspense fallback={<div className="h-[180px] flex items-center justify-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div></div>}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={workCenterLoad}>
                    <defs>
                      <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fde047" stopOpacity={1} />
                        <stop offset="20%" stopColor="#facc15" stopOpacity={1} />
                        <stop offset="40%" stopColor="#eab308" stopOpacity={0.95} />
                        <stop offset="60%" stopColor="#ca8a04" stopOpacity={0.8} />
                        <stop offset="80%" stopColor="#a16207" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#854d0e" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="inProgressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#93c5fd" stopOpacity={1} />
                        <stop offset="20%" stopColor="#60a5fa" stopOpacity={1} />
                        <stop offset="40%" stopColor="#3b82f6" stopOpacity={0.95} />
                        <stop offset="60%" stopColor="#2563eb" stopOpacity={0.8} />
                        <stop offset="80%" stopColor="#1d4ed8" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#1e40af" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#86efac" stopOpacity={1} />
                        <stop offset="20%" stopColor="#4ade80" stopOpacity={1} />
                        <stop offset="40%" stopColor="#22c55e" stopOpacity={0.95} />
                        <stop offset="60%" stopColor="#16a34a" stopOpacity={0.8} />
                        <stop offset="80%" stopColor="#15803d" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#14532d" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="work_center_name" stroke="#999" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                    <YAxis stroke="#999" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar 
                      dataKey="pending" 
                      fill="url(#pendingGradient)" 
                      name="Pending" 
                      fillOpacity={0.9}
                      stroke="#eab308"
                      strokeWidth={2}
                      barSize={40}
                      radius={[6, 6, 0, 0]}
                      activeBar={{ fill: 'url(#pendingGradient)', fillOpacity: 1, stroke: '#fde047', strokeWidth: 3 }} 
                    >
                      <LabelList 
                        dataKey="pending" 
                        position="top" 
                        fill="#fde047"
                        fontSize={10}
                        fontWeight="bold"
                        formatter={(value: number) => value > 0 ? value : ''}
                      />
                    </Bar>
                    <Bar 
                      dataKey="in_progress" 
                      fill="url(#inProgressGradient)" 
                      name="In Progress" 
                      fillOpacity={0.9}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      barSize={40}
                      radius={[6, 6, 0, 0]}
                      activeBar={{ fill: 'url(#inProgressGradient)', fillOpacity: 1, stroke: '#93c5fd', strokeWidth: 3 }} 
                    >
                      <LabelList 
                        dataKey="in_progress" 
                        position="top" 
                        fill="#93c5fd"
                        fontSize={10}
                        fontWeight="bold"
                        formatter={(value: number) => value > 0 ? value : ''}
                      />
                    </Bar>
                    <Bar 
                      dataKey="completed" 
                      fill="url(#completedGradient)" 
                      name="Completed" 
                      fillOpacity={0.9}
                      stroke="#22c55e"
                      strokeWidth={2}
                      barSize={40}
                      radius={[6, 6, 0, 0]}
                      activeBar={{ fill: 'url(#completedGradient)', fillOpacity: 1, stroke: '#86efac', strokeWidth: 3 }} 
                    >
                      <LabelList 
                        dataKey="completed" 
                        position="top" 
                        fill="#86efac"
                        fontSize={11}
                        fontWeight="bold"
                        formatter={(value: number) => value > 0 ? value : ''}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            )}
          </div>
        </div>

        {/* Production Orders Table */}
        <div className="card-aurexia p-4 flex-1 min-h-0 relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-200">Production Orders</h3>
            {filterRisk && (
              <button
                onClick={() => setFilterRisk('')}
                className="text-xs text-yellow-400 hover:text-yellow-300"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="absolute inset-0 pt-12 px-4 pb-16 overflow-x-auto overflow-y-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/50 backdrop-blur-sm">
                <tr className="border-b border-yellow-500/20">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">PO Number</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Customer</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Part Number</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Quantity</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Progress</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Due Date</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProduction.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                    <td className="py-2 px-3 text-gray-200 text-xs">{item.po_number}</td>
                    <td className="py-2 px-3 text-gray-300 text-xs">{item.customer_name || '-'}</td>
                    <td className="py-2 px-3">
                      <div>
                        <p className="text-gray-200 text-xs">{item.part_number}</p>
                        {item.part_description && (
                          <p className="text-[10px] text-gray-500">{item.part_description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-200 text-xs">
                      {item.quantity_completed} / {item.quantity}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-[80px] bg-black/30 backdrop-blur-sm rounded-full h-1.5 border border-yellow-500/20">
                          <div
                            className="bg-yellow-500 h-1.5 rounded-full"
                            style={{ width: `${item.completion_percentage}%` }}
                          />
                        </div>
                        <span className="ml-2 text-[10px] text-gray-400">{item.completion_percentage}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-300 text-xs">
                      {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex justify-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getRiskBadgeClass(item.risk_status)}`}>
                          {item.risk_status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedProduction.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No production orders found</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="text-xs text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProduction.length)} of {filteredProduction.length} orders
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs rounded bg-black/30 border border-yellow-500/20 text-gray-300 hover:bg-yellow-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center px-3 text-xs text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs rounded bg-black/30 border border-yellow-500/20 text-gray-300 hover:bg-yellow-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </PageModal>
  );
};

export default DashboardPage;
