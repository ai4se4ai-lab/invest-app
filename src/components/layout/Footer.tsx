// src/components/layout/Footer.tsx
'use client';

import React from 'react';
import { FiGithub, FiMail, FiHeart } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              About INVEST
            </h3>
            <p className="text-sm text-gray-600">
              An intelligent bank statement processor that automatically categorizes your transactions 
              and provides insights into your spending patterns.
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Features
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• PDF Bank Statement Processing</li>
              <li>• Automatic Transaction Categorization</li>
              <li>• Spending Analysis & Insights</li>
              <li>• CSV Export Functionality</li>
              <li>• Multiple File Support</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Connect
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="GitHub"
              >
                <FiGithub className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Email"
              >
                <FiMail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 INVEST. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 flex items-center mt-2 md:mt-0">
              Made with <FiHeart className="h-4 w-4 text-red-500 mx-1" /> for better financial insights
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}