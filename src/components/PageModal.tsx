'use client';

import React from 'react';

interface PageModalProps {
  children: React.ReactNode;
}

/**
 * PageModal - A large glass-morphism container that wraps all page content
 * Creates the signature Aurexia transparent modal effect seen in the UI
 */
const PageModal: React.FC<PageModalProps> = ({ children }) => {
  return (
    <div className="h-screen w-full flex items-center justify-center p-4 md:p-6">
      <div className="page-modal-container w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default PageModal;
