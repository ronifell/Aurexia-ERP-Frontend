/**
 * API Client for Aurexia ERP
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance for regular API calls
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for login (no default headers, no interceptors)
const loginApi = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
    // Use URLSearchParams and convert to string manually
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const formDataString = params.toString();
    
    console.log('Login request:', { username, passwordLength: password.length, formDataString });
    
    // Use the loginApi instance (no interceptors, no default headers)
    try {
      const response = await loginApi.post(
        '/auth/login',
        formDataString, // Send as string
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          transformRequest: [(data) => data], // Don't transform the data
        }
      );
      console.log('Login response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        request: error.request ? 'Request made but no response' : null,
      });
      
      // Handle axios errors properly
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.detail || error.response.data?.message || 'Login failed';
        const axiosError = new Error(errorMessage) as any;
        axiosError.response = error.response;
        throw axiosError;
      } else if (error.request) {
        // Request made but no response (network/CORS error)
        throw new Error('Network error. Please check if the server is running and CORS is configured correctly.');
      } else {
        // Something else happened
        throw new Error(error.message || 'Login failed');
      }
    }
  },
  
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (profileData: { email?: string; full_name?: string; badge_id?: string; password?: string }) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/customers/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/customers/', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};

// Part Numbers API
export const partNumbersAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/part-numbers/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/part-numbers/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/part-numbers/', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/part-numbers/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/part-numbers/${id}`);
    return response.data;
  },
};

// Sales Orders API
export const salesOrdersAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/sales-orders/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/sales-orders/', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/sales-orders/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/sales-orders/${id}`);
    return response.data;
  },
};

// Production Orders API
export const productionOrdersAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/production-orders/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/production-orders/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/production-orders/', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/production-orders/${id}`, data);
    return response.data;
  },
  
  generateTravelSheet: async (id: number) => {
    const response = await api.post(`/production-orders/${id}/generate-travel-sheet`);
    return response.data;
  },
  
  getTravelSheets: async (id: number) => {
    const response = await api.get(`/production-orders/${id}/travel-sheets`);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/production-orders/${id}`);
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  
  getProductionDashboard: async (params?: any) => {
    const response = await api.get('/dashboard/production', { params });
    return response.data;
  },
  
  getWorkCenterLoad: async () => {
    const response = await api.get('/dashboard/work-center-load');
    return response.data;
  },
  
  getDailyProduction: async (days?: number) => {
    const response = await api.get('/dashboard/daily-production', { params: { days } });
    return response.data;
  },
};

// QR Scanner API
export const qrScannerAPI = {
  scan: async (qrCode: string, badgeId: string) => {
    const response = await api.post('/qr-scanner/scan', { qr_code: qrCode, badge_id: badgeId });
    return response.data;
  },
  
  completeOperation: async (operationId: number, data: any) => {
    const response = await api.put(`/qr-scanner/operations/${operationId}/complete`, data);
    return response.data;
  },
  
  getOperationDetails: async (operationId: number) => {
    const response = await api.get(`/qr-scanner/operations/${operationId}`);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  
  getRoles: async () => {
    const response = await api.get('/users/roles/');
    return response.data;
  },
};

// Processes API
export const processesAPI = {
  getAll: async () => {
    const response = await api.get('/processes/');
    return response.data;
  },
};

// Materials API
export const materialsAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/materials/list', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },
};

// Quality Inspections API
export const qualityInspectionsAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/quality-inspections/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/quality-inspections/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/quality-inspections/', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/quality-inspections/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/quality-inspections/${id}`);
    return response.data;
  },
  
  getPendingInspections: async (productionOrderId: number) => {
    const response = await api.get(`/quality-inspections/production-order/${productionOrderId}/pending`);
    return response.data;
  },
};

// Shipments API
export const shipmentsAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/shipments/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/shipments/', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/shipments/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/shipments/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: number, status: string, trackingNumber?: string) => {
    const response = await api.patch(`/shipments/${id}/status`, null, {
      params: { status, tracking_number: trackingNumber },
    });
    return response.data;
  },
  
  getApprovedQuantities: async (salesOrderId: number) => {
    const response = await api.get(`/shipments/sales-order/${salesOrderId}/approved-quantities`);
    return response.data;
  },
};
