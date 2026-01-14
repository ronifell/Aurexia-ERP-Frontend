/**
 * API Client Configuration
 */
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      console.log('[API Interceptor] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
      console.log('[API Interceptor] Request URL:', config.url);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API Interceptor] Authorization header set');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('[API Response Interceptor] Success:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('[API Response Interceptor] Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // Only clear token on 401 if we're not on the login page and the error is not from /api/auth/me during login
    if (error.response?.status === 401) {
      console.log('[API Response Interceptor] 401 Unauthorized detected');
      // Don't clear token during login flow
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        console.log('[API Response Interceptor] Clearing tokens and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        console.log('[API Response Interceptor] On login page, not clearing tokens');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI: {
  login: (username: string, password: string) => Promise<any>;
  getCurrentUser: () => Promise<any>;
  logout: () => void;
} = {
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    console.log('[getCurrentUser] === START ===');
    
    // Wait a tick to ensure localStorage is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify token exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log('[getCurrentUser] Token retrieved:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    console.log('[getCurrentUser] Token full length:', token?.length);
    
    if (!token) {
      console.error('[getCurrentUser] ERROR: No token found!');
      throw new Error('No authentication token found');
    }
    
    try {
      console.log('[getCurrentUser] Making request to /api/auth/me...');
      
      // Use the api instance which has the interceptor that adds the Authorization header
      const response = await api.get('/api/auth/me');
      
      console.log('[getCurrentUser] ✓ Success! User data received:', response.data);
      console.log('[getCurrentUser] === END SUCCESS ===');
      return response.data;
    } catch (error: any) {
      console.error('[getCurrentUser] === ERROR ===');
      console.error('[getCurrentUser] Error details:', error);
      console.error('[getCurrentUser] Error response:', error.response);
      console.error('[getCurrentUser] Error status:', error.response?.status);
      console.error('[getCurrentUser] Error data:', error.response?.data);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },
  
  create: async (userData: any) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },
  
  update: async (id: number, userData: any) => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  getAll: async () => {
    const response = await api.get('/api/customers');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/api/customers/${id}`);
    return response.data;
  },
  
  create: async (customerData: any) => {
    const response = await api.post('/api/customers', customerData);
    return response.data;
  },
  
  update: async (id: number, customerData: any) => {
    const response = await api.put(`/api/customers/${id}`, customerData);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/api/customers/${id}`);
    return response.data;
  },
};

// Part Numbers API
export const partNumbersAPI = {
  getAll: async () => {
    const response = await api.get('/api/part-numbers');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/api/part-numbers/${id}`);
    return response.data;
  },
  
  create: async (partNumberData: any) => {
    const response = await api.post('/api/part-numbers', partNumberData);
    return response.data;
  },
  
  update: async (id: number, partNumberData: any) => {
    const response = await api.put(`/api/part-numbers/${id}`, partNumberData);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/api/part-numbers/${id}`);
    return response.data;
  },
};

// Sales Orders API
export const salesOrdersAPI = {
  getAll: async () => {
    const response = await api.get('/api/sales-orders');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/api/sales-orders/${id}`);
    return response.data;
  },
  
  create: async (orderData: any) => {
    const response = await api.post('/api/sales-orders', orderData);
    return response.data;
  },
  
  update: async (id: number, orderData: any) => {
    const response = await api.put(`/api/sales-orders/${id}`, orderData);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/api/sales-orders/${id}`);
    return response.data;
  },
};

// Production Orders API
export const productionOrdersAPI = {
  getAll: async () => {
    const response = await api.get('/api/production-orders');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/api/production-orders/${id}`);
    return response.data;
  },
  
  create: async (orderData: any) => {
    const response = await api.post('/api/production-orders', orderData);
    return response.data;
  },
  
  update: async (id: number, orderData: any) => {
    const response = await api.put(`/api/production-orders/${id}`, orderData);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/api/production-orders/${id}`);
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },
  
  getProductionStatus: async () => {
    const response = await api.get('/api/dashboard/production-status');
    return response.data;
  },
  
  getRecentOrders: async () => {
    const response = await api.get('/api/dashboard/recent-orders');
    return response.data;
  },
};

// QR Scanner API
export const qrScannerAPI = {
  scan: async (qrCode: string) => {
    const response = await api.post('/api/qr/scan', { qr_code: qrCode });
    return response.data;
  },
};

export default api;
