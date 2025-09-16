// src/components/ui/SummaryCard.tsx
'use client';

import React from 'react';
import { FiDollarSign, FiTrendingDown, FiPieChart } from 'react-icons/fi';

interface SummaryCardProps {
  summary: {
    'Living Expenses': number;
    'Groceries': number;
    'Restaurants': number;
    'Car': number;
    'Entertainment': number;
    'Miscellaneous': number;
  };
  totalAmount: number;
}

const CATEGORY_COLORS = {
  'Living Expenses': 'bg-blue-500',
  'Groceries': 'bg-green-500',
  'Restaurants': 'bg-orange-500',
  'Car': 'bg-purple-500',
  'Entertainment': 'bg-pink-500',
  'Miscellaneous': 'bg-gray-500'
};

export default function SummaryCard({ summary, totalAmount }: SummaryCardProps) {
  const sortedCategories = Object.entries(summary)
    .filter(([_, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  const maxAmount = Math.max(...Object.values(summary));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiPieChart className="h-5 w-5 mr-2" />
          Spending Summary
        </h3>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            ${totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedCategories.map(([category, amount]) => {
          const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
          const categoryPercentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
          
          return (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {category}
                </span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    ${amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({categoryPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {sortedCategories.length === 0 && (
        <div className="text-center py-8">
          <FiDollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No expense data available</p>
        </div>
      )}

      {sortedCategories.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Top Category: {sortedCategories[0][0]}
            </span>
            <span className="font-medium text-gray-900">
              ${sortedCategories[0][1].toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}