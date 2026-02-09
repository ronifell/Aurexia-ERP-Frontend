'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useNavigationStore } from '@/lib/navigationStore';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Factory, 
  QrCode, 
  Users, 
  LogOut,
  Menu,
  X,
  Warehouse
} from 'lucide-react';
import Image from 'next/image';

const Navbar = React.memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { setNavigating } = useNavigationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigation = useMemo(() => {
    const baseNav = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart },
      { name: 'Production', href: '/production', icon: Factory },
      { name: 'Part Numbers', href: '/part-numbers', icon: Package },
      { name: 'Material', href: '/inventory', icon: Warehouse },
      { name: 'QR Scanner', href: '/qr-scanner', icon: QrCode },
    ];

    if (user?.role?.name === 'Admin' || user?.role?.name === 'Management') {
      return [...baseNav, { name: 'Users', href: '/users', icon: Users }];
    }
    return baseNav;
  }, [user?.role?.name]);

  return (
    <nav className="bg-transparent border-b border-yellow-500/30 flex">
      {/* Logo Section - Fixed width to align with sidebar */}
      <div className="hidden md:flex items-center justify-center w-64 border-r border-yellow-500/15">
        <Link 
          href="/dashboard"
          onClick={() => {
            if (pathname !== '/dashboard') {
              setNavigating(true);
            }
          }}
        >
          <Image 
            src="/logo.PNG" 
            alt="Aurexia" 
            width={60} 
            height={60}
            className="brightness-110"
          />
        </Link>
      </div>

      {/* Main Navbar Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo Name - Mobile only */}
          <div className="flex items-center md:hidden">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3"
              onClick={() => {
                if (pathname !== '/dashboard') {
                  setNavigating(true);
                }
              }}
            >
              <Image 
                src="/logo.PNG" 
                alt="Aurexia" 
                width={60} 
                height={60}
                className="brightness-110"
              />
              <span className="text-2xl font-bold gold-text">AUREXIA</span>
            </Link>
          </div>

          {/* Desktop: Page title or empty space */}
          <div className="hidden md:flex items-center">
            <span className="text-2xl font-bold gold-text">AUREXIA</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-200">{user?.full_name || user?.username}</p>
              <p className="text-xs text-gray-400">{user?.role?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:bg-yellow-500/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-yellow-500/20 bg-transparent">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (!isActive) {
                      setNavigating(true);
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? 'bg-yellow-500/20 text-yellow-400'
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
      )}
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
