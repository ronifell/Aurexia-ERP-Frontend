'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '8px',
          padding: '16px',
        },
        // Success styles
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#D4AF37',
            secondary: '#000',
          },
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          },
        },
        // Error styles
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#000',
          },
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.5)',
          },
        },
      }}
    />
  );
}
