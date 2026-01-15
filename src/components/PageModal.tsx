'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface PageModalProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

/**
 * PageModal - A large glass-morphism container that wraps all page content
 * Creates the signature Aurexia transparent modal effect seen in the UI
 */
const PageModal: React.FC<PageModalProps> = ({ children, showSidebar = true }) => {
  return (
    <div className="h-screen w-full flex items-center justify-center p-4 md:p-6">
      <div className="page-modal-container w-full h-full flex flex-col">
        {/* Top Navbar - spans full width */}
        {showSidebar && <Navbar />}
        
        {/* Bottom section: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar Navigation */}
          {showSidebar && <Sidebar />}
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageModal;
