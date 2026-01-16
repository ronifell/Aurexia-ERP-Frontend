/**
 * Global Navigation Loading Store
 * Provides immediate loading feedback when navigating between pages
 */
import { create } from 'zustand';

interface NavigationState {
  isNavigating: boolean;
  setNavigating: (isNavigating: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isNavigating: false,
  setNavigating: (isNavigating: boolean) => set({ isNavigating }),
}));
