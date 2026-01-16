'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PageModal from '@/components/PageModal';
import { 
  useDashboardStats, 
  useProductionDashboard, 
  useWorkCenterLoad, 
  useDailyProduction 
} from '@/lib/hooks';
import { ProductionDashboardItem } from '@/lib/types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Factory, 
  TrendingUp,
  Package
} from 'lucide-react';

// Lazy load chart components for better performance
const DailyProductionChart = dynamic(
  () => import('@/components/charts/DailyProductionChart'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[180px] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }
);

const WorkCenterLoadChart = dynamic(
  () => import('@/components/charts/WorkCenterLoadChart'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[180px] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }
);

const DashboardPage = () => {
  const router = useRouter();
  const [filterRisk, setFilterRisk] = useState<string>('');

  // Use SWR hooks for optimized data fetching with caching
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { production, isLoading: productionLoading } = useProductionDashboard();
  const { workCenterLoad, isLoading: workCenterLoading } = useWorkCenterLoad();
  const { dailyProduction, isLoading: dailyProductionLoading } = useDailyProduction(7);

  const loading = statsLoading || productionLoading;
  const chartsLoading = workCenterLoading || dailyProductionLoading;

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

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
    if (!production || production.length === 0) return [];
    return filterRisk
      ? production.filter((item: ProductionDashboardItem) => item.risk_status === filterRisk)
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
              <DailyProductionChart data={dailyProduction} />
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
              <WorkCenterLoadChart data={workCenterLoad} />
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
                {paginatedProduction.map((item: ProductionDashboardItem) => (
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
