'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useNavigationStore } from '@/lib/navigationStore';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Factory, 
  QrCode, 
  Users,
  Building2
} from 'lucide-react';

const Sidebar = React.memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { setNavigating } = useNavigationStore();

  const navigation = useMemo(() => {
    const baseNav = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart },
      { name: 'Customers', href: '/customers', icon: Building2 },
      { name: 'Production', href: '/production', icon: Factory },
      { name: 'Part Numbers', href: '/part-numbers', icon: Package },
      { name: 'QR Scanner', href: '/qr-scanner', icon: QrCode },
    ];

    if (user?.role?.name === 'Admin' || user?.role?.name === 'Management') {
      return [...baseNav, { name: 'Users', href: '/users', icon: Users }];
    }
    return baseNav;
  }, [user?.role?.name]);

  return (
    <div className="hidden md:block w-64 border-r border-yellow-500/30 flex-shrink-0 overflow-y-auto">
      {/* Navigation Tabs */}
      <div className="p-4 space-y-2 mt-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={() => {
                // Show loading immediately on click
                if (!isActive) {
                  setNavigating(true);
                }
              }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
