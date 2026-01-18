/**
 * Optimized API Hooks with SWR for caching and prefetching
 */
import useSWR from 'swr';
import { 
  dashboardAPI, 
  salesOrdersAPI, 
  customersAPI, 
  partNumbersAPI, 
  productionOrdersAPI,
  authAPI,
  processesAPI,
  shipmentsAPI
} from './api';

// Dashboard Hooks
export const useDashboardStats = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'dashboard/stats',
    () => dashboardAPI.getStats(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );
  return { stats: data, error, isLoading, refresh: mutate };
};

export const useProductionDashboard = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'dashboard/production',
    () => dashboardAPI.getProductionDashboard(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );
  return { production: data || [], error, isLoading, refresh: mutate };
};

export const useWorkCenterLoad = () => {
  const { data, error, isLoading } = useSWR(
    'dashboard/work-center-load',
    () => dashboardAPI.getWorkCenterLoad(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
  return { workCenterLoad: data || [], error, isLoading };
};

export const useDailyProduction = (days: number = 7) => {
  const { data, error, isLoading } = useSWR(
    `dashboard/daily-production-${days}`,
    () => dashboardAPI.getDailyProduction(days),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  );
  return { dailyProduction: data || [], error, isLoading };
};

// Sales Orders Hooks
export const useSalesOrders = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'sales-orders',
    () => salesOrdersAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Cache for 10 seconds
    }
  );
  return { orders: data || [], error, isLoading, refresh: mutate };
};

export const useSalesOrder = (id: number | null) => {
  const { data, error, isLoading } = useSWR(
    id ? `sales-orders/${id}` : null,
    () => id ? salesOrdersAPI.getById(id) : null,
    {
      revalidateOnFocus: false,
    }
  );
  return { order: data, error, isLoading };
};

// Customers Hooks
export const useCustomers = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'customers',
    () => customersAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
  return { customers: data || [], error, isLoading, refresh: mutate };
};

// Part Numbers Hooks
export const usePartNumbers = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'part-numbers',
    () => partNumbersAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  );
  return { partNumbers: data || [], error, isLoading, refresh: mutate };
};

// Production Orders Hooks
export const useProductionOrders = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'production-orders',
    () => productionOrdersAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );
  return { orders: data || [], error, isLoading, refresh: mutate };
};

export const useProductionOrder = (id: number | null) => {
  const { data, error, isLoading } = useSWR(
    id ? `production-orders/${id}` : null,
    () => id ? productionOrdersAPI.getById(id) : null,
    {
      revalidateOnFocus: false,
    }
  );
  return { order: data, error, isLoading };
};

// User Hooks
export const useCurrentUser = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'auth/me',
    () => authAPI.getCurrentUser(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );
  return { user: data, error, isLoading, refresh: mutate };
};

// Processes Hooks
export const useProcesses = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'processes',
    () => processesAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // Cache for 5 minutes (processes don't change often)
    }
  );
  return { processes: data || [], error, isLoading, refresh: mutate };
};

// Shipments Hooks
export const useShipments = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'shipments',
    () => shipmentsAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Cache for 10 seconds
    }
  );
  return { shipments: data || [], error, isLoading, refresh: mutate };
};

export const useShipment = (id: number | null) => {
  const { data, error, isLoading } = useSWR(
    id ? `shipments/${id}` : null,
    () => id ? shipmentsAPI.getById(id) : null,
    {
      revalidateOnFocus: false,
    }
  );
  return { shipment: data, error, isLoading };
};
