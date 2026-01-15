'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <PageModal showSidebar={false}>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    </PageModal>
  );
}
