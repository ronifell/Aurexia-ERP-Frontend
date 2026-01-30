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
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
  (response) => response,
  (error) => {
    // Only clear token on 401 if we're not on the login page
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI: {
  login: (username: string, password: string) => Promise<any>;
  getCurrentUser: () => Promise<any>;
  updateProfile: (profileData: { email?: string; full_name?: string; badge_id?: string; password?: string }) => Promise<any>;
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  updateProfile: async (profileData: { email?: string; full_name?: string; badge_id?: string; password?: string }) => {
    const response = await api.put('/api/users/me', profileData);
    return response.data;
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
  
  getRoles: async () => {
    const response = await api.get('/api/users/roles/');
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
