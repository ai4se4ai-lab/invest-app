// src/components/ui/TransactionTable.tsx
'use client';

import React from 'react';
import { Transaction } from '@/types';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';

interface TransactionTableProps {
  transactions: Transaction[];
  searchTerm: string;
  selectedCategory: string;
  selectedFile: string;
  onCategoryChange?: (transactionId: string, newCategory: string) => void;
}

const CATEGORIES = [
  'Living Expenses',
  'Groceries', 
  'Restaurants',
  'Car',
  'Entertainment',
  'Miscellaneous'
] as const;

const CATEGORY_COLORS = {
  'Living Expenses': 'bg-blue-100 text-blue-800 border-blue-200',
  'Groceries': 'bg-green-100 text-green-800 border-green-200',
  'Restaurants': 'bg-orange-100 text-orange-800 border-orange-200',
  'Car': 'bg-purple-100 text-purple-800 border-purple-200',
  'Entertainment': 'bg-pink-100 text-pink-800 border-pink-200',
  'Miscellaneous': 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function TransactionTable({ 
  transactions, 
  searchTerm, 
  selectedCategory, 
  selectedFile,
  onCategoryChange 
}: TransactionTableProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
    const matchesFile = !selectedFile || transaction.id.startsWith(selectedFile);
    
    return matchesSearch && matchesCategory && matchesFile;
  });

  const formatAmount = (amount: number): string => {
    const color = amount >= 0 ? 'text-green-600' : 'text-red-600';
    const prefix = amount >= 0 ? '+' : '';
    return `<span class="${color}">${prefix}$${Math.abs(amount).toFixed(2)}</span>`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const handleCategoryEdit = (transactionId: string, newCategory: string) => {
    if (onCategoryChange) {
      onCategoryChange(transactionId, newCategory);
    }
    setEditingId(null);
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            {onCategoryChange && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredTransactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(transaction.date)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                <div className="truncate" title={transaction.description}>
                  {transaction.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === transaction.id ? (
                  <div className="flex items-center space-x-2">
                    <select
                      defaultValue={transaction.category}
                      onChange={(e) => handleCategoryEdit(transaction.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    CATEGORY_COLORS[transaction.category as keyof typeof CATEGORY_COLORS]
                  }`}>
                    {transaction.category}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${transaction.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">
                    {(transaction.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              {onCategoryChange && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId !== transaction.id && (
                    <button
                      onClick={() => setEditingId(transaction.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}