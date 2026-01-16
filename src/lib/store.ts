/**
 * Zustand Store for Global State Management
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: {
    id: number;
    name: string;
    can_view_prices: boolean;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => {
        // Store token in localStorage for API interceptor compatibility
        localStorage.setItem('auth_token', token);
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      initialize: () => {
        // Sync token from localStorage to store (for API interceptor compatibility)
        // The persist middleware already handles user data persistence
        const token = localStorage.getItem('auth_token');
        const state = get();
        if (token && token !== state.token) {
          set({ token, isAuthenticated: !!state.user && !!token });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
