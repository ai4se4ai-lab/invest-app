// src/components/layout/Header.tsx
'use client';

import React from 'react';
import { FiDollarSign, FiBarChart, FiSettings } from 'react-icons/fi';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="bg-blue-600 rounded-lg p-2 mr-3">
                <FiDollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  INVEST
                </h1>
                <p className="text-xs text-gray-500">
                  Bank Statement Processor
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a
              href="#"
              className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <FiBarChart className="h-4 w-4 mr-1" />
              Dashboard
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <FiSettings className="h-4 w-4 mr-1" />
              Settings
            </a>
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">Welcome</span>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">U</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}