// src/components/ui/CategoryFilter.tsx
'use client';

import React from 'react';
import { FiFilter, FiSearch, FiFile } from 'react-icons/fi';

interface CategoryFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedFile: string;
  onFileChange: (file: string) => void;
  availableFiles: string[];
}

const CATEGORIES = [
  'Living Expenses',
  'Groceries',
  'Restaurants',
  'Car',
  'Entertainment',
  'Miscellaneous'
] as const;

export default function CategoryFilter({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedFile,
  onFileChange,
  availableFiles
}: CategoryFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center mb-4">
        <FiFilter className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Transactions
          </label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search description or category..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* File Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Source
          </label>
          <div className="relative">
            <FiFile className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={selectedFile}
              onChange={(e) => onFileChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Files</option>
              {availableFiles.map(filename => (
                <option key={filename} value={filename}>
                  {filename}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(searchTerm || selectedCategory || selectedFile) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => onSearchChange('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            
            {selectedCategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Category: {selectedCategory}
                <button
                  onClick={() => onCategoryChange('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
                >
                  ×
                </button>
              </span>
            )}
            
            {selectedFile && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                File: {selectedFile}
                <button
                  onClick={() => onFileChange('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
                >
                  ×
                </button>
              </span>
            )}
            
            <button
              onClick={() => {
                onSearchChange('');
                onCategoryChange('');
                onFileChange('');
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}