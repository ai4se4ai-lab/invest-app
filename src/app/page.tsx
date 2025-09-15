'use client';

import React, { useState, useCallback } from 'react';
import { FiUpload, FiDownload, FiLoader, FiFileText, FiDollarSign, FiTrash2, FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';
import Papa from 'papaparse';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
}

interface ProcessedData {
  fileName: string;
  transactions: Transaction[];
  totalAmount: number;
  summary: {
    'Living Expenses': number;
    'Groceries': number;
    'Restaurants': number;
    'Car': number;
    'Entertainment': number;
    'Miscellaneous': number;
  };
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

export default function BankStatementProcessor() {
  const [files, setFiles] = useState<File[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    const pdfFiles = uploadedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== uploadedFiles.length) {
      setError('Please upload only PDF files');
      return;
    }
    
    setFiles(prev => [...prev, ...pdfFiles]);
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processFiles = async () => {
    if (files.length === 0) {
      setError('Please upload at least one PDF file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results: ProcessedData[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to process ${file.name}`);
        }

        const result = await response.json();
        results.push({
          fileName: file.name,
          ...result
        });
      }

      setProcessedData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing files');
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionCategory = (fileIndex: number, transactionId: string, newCategory: string) => {
    setProcessedData(prev => 
      prev.map((data, index) => {
        if (index === fileIndex) {
          const updatedTransactions = data.transactions.map(t =>
            t.id === transactionId ? { ...t, category: newCategory } : t
          );
          
          // Recalculate summary
          const summary = CATEGORIES.reduce((acc, cat) => {
            acc[cat] = updatedTransactions
              .filter(t => t.category === cat)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            return acc;
          }, {} as ProcessedData['summary']);

          return {
            ...data,
            transactions: updatedTransactions,
            summary
          };
        }
        return data;
      })
    );
  };

  const downloadCSV = () => {
    if (processedData.length === 0) return;

    const allTransactions = processedData.flatMap(data => 
      data.transactions.map(t => ({
        'File': data.fileName,
        'Date': t.date,
        'Description': t.description,
        'Amount': t.amount,
        'Category': t.category,
        'Confidence': t.confidence
      }))
    );

    const csv = Papa.unparse(allTransactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = `bank_statements_categorized_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredTransactions = processedData.flatMap(data =>
    data.transactions
      .filter(t => {
        const matchesSearch = searchTerm === '' || 
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.date.includes(searchTerm);
        const matchesCategory = selectedCategory === '' || t.category === selectedCategory;
        const matchesFile = selectedFile === '' || data.fileName === selectedFile;
        return matchesSearch && matchesCategory && matchesFile;
      })
      .map(t => ({ ...t, fileName: data.fileName }))
  );

  const totalSummary = processedData.reduce((acc, data) => {
    CATEGORIES.forEach(cat => {
      acc[cat] = (acc[cat] || 0) + data.summary[cat];
    });
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = Object.values(totalSummary).reduce((sum, val) => sum + val, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bank Statement Processor
          </h1>
          <p className="text-gray-600">
            Upload your bank statement PDFs and automatically categorize transactions
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8 mb-6">
          <div className="text-center">
            <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900">Upload PDF Files</span>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
            <p className="text-gray-500 mt-2">Select one or more PDF bank statements</p>
          </div>
        </div>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Uploaded Files ({files.length})</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FiFileText className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="text-center mb-6">
          <button
            onClick={processFiles}
            disabled={loading || files.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </>
            ) : (
              'Process Bank Statements'
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {processedData.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {CATEGORIES.map(category => (
                <div key={category} className="bg-white rounded-lg shadow-sm p-4 border">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-700 text-sm mb-2">{category}</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      ${totalSummary[category]?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Total Expenses</h3>
                <p className="text-3xl font-bold text-blue-600">${grandTotal.toFixed(2)}</p>
                <p className="text-gray-600 mt-2">
                  Across {processedData.length} statement{processedData.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Filters and Export */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Files</option>
                    {processedData.map(data => (
                      <option key={data.fileName} value={data.fileName}>{data.fileName}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={downloadCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold inline-flex items-center"
                >
                  <FiDownload className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transactions ({filteredTransactions.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction, index) => {
                      const fileIndex = processedData.findIndex(d => d.fileName === transaction.fileName);
                      return (
                        <tr key={`${transaction.fileName}-${transaction.id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.fileName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.date}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                              ${Math.abs(transaction.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={transaction.category}
                              onChange={(e) => updateTransactionCategory(fileIndex, transaction.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[transaction.category as keyof typeof CATEGORY_COLORS]}`}
                            >
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${transaction.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{(transaction.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}