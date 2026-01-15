'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Factory, 
  QrCode, 
  Users
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Debug logging
  React.useEffect(() => {
    console.log('=== SIDEBAR DEBUG ===');
    console.log('User object:', user);
    console.log('User role:', user?.role);
    console.log('Role name:', user?.role?.name);
    console.log('Should show Users:', user?.role?.name === 'Admin' || user?.role?.name === 'Management');
    console.log('====================');
  }, [user]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart },
    { name: 'Production', href: '/production', icon: Factory },
    { name: 'Part Numbers', href: '/part-numbers', icon: Package },
    { name: 'QR Scanner', href: '/qr-scanner', icon: QrCode },
  ];

  if (user?.role?.name === 'Admin' || user?.role?.name === 'Management') {
    console.log('✓ Adding Users menu to sidebar');
    navigation.push({ name: 'Users', href: '/users', icon: Users });
  } else {
    console.log('✗ NOT adding Users menu. Role:', user?.role?.name || 'undefined');
  }

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
};

export default Sidebar;
