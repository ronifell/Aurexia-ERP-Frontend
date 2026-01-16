'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationStore } from '@/lib/navigationStore';

/**
 * Navigation Handler
 * Automatically clears navigation loading state when route changes complete
 */
const NavigationHandler: React.FC = () => {
  const pathname = usePathname();
  const { setNavigating } = useNavigationStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear loading state after a small delay to ensure smooth transition
    // This allows the page to start rendering before hiding the loader
    timeoutRef.current = setTimeout(() => {
      setNavigating(false);
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, setNavigating]);

  return null;
};

export default NavigationHandler;
