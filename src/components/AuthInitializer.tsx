'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';

/**
 * AuthInitializer Component
 * Ensures user data is loaded and persisted when the app loads or navigates
 */
const AuthInitializer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const initialize = useAuthStore((state) => state.initialize);
  const hasInitialized = useRef(false);
  const isFetchingUser = useRef(false);

  useEffect(() => {
    // Skip on login page
    if (pathname === '/login') {
      return;
    }

    // Initialize store sync (only once)
    if (!hasInitialized.current) {
      initialize();
      hasInitialized.current = true;
    }

    const checkAndRestoreAuth = async () => {
      // Wait a moment for Zustand persist to hydrate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = useAuthStore.getState();
      const storedToken = localStorage.getItem('auth_token');
      
      // If we have a token but no user data, fetch it
      if (storedToken && !state.user && !isFetchingUser.current) {
        isFetchingUser.current = true;
        try {
          const userData = await authAPI.getCurrentUser();
          setAuth(userData, storedToken);
        } catch (error) {
          // Token is invalid, clear everything
          console.error('Failed to restore user session:', error);
          logout();
          router.push('/login');
        } finally {
          isFetchingUser.current = false;
        }
      } else if (!storedToken && pathname !== '/login') {
        // No token, redirect to login
        router.push('/login');
      }
    };

    checkAndRestoreAuth();
  }, [pathname, setAuth, logout, initialize, router]);

  return null;
};

export default AuthInitializer;
