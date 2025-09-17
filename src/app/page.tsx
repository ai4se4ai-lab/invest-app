'use client';

import React, { useState, useCallback } from 'react';
import { FiUpload, FiFileText, FiTrash2, FiEdit3, FiCopy } from 'react-icons/fi';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
}

interface ProcessedData {
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
  fileName?: string;
  processingInfo?: {
    inputLength: number;
    extractedTransactions: number;
    processingMethod: string;
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

export default function BankStatementProcessor() {
  const [files, setFiles] = useState<File[]>([]);
  const [manualText, setManualText] = useState('');
  const [inputMode, setInputMode] = useState<'pdf' | 'text'>('pdf');
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState('');

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    const pdfFiles = uploadedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== uploadedFiles.length) {
      setError('Please only upload PDF files');
      return;
    }
    
    setFiles(prev => [...prev, ...pdfFiles]);
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processInput = async () => {
    if (inputMode === 'pdf' && files.length === 0) {
      setError('Please upload at least one PDF file');
      return;
    }

    if (inputMode === 'text' && !manualText.trim()) {
      setError('Please enter transaction text');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (inputMode === 'text') {
        // Process manual text input
        const formData = new FormData();
        formData.append('manualText', manualText.trim());

        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to process text');
        }

        setProcessedData([{
          fileName: 'Manual Input',
          ...result
        }]);
      } else {
        // Process PDF files
        const results: ProcessedData[] = [];

        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/process-pdf', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (result.extractionFailed) {
            // Handle extraction failure guidance
            setError(`PDF extraction failed for ${file.name}. ${result.message}`);
            console.log('Alternative solutions:', result.alternativeSolutions);
            return;
          }

          if (!response.ok) {
            throw new Error(result.error || `Failed to process ${file.name}`);
          }

          results.push({
            fileName: file.name,
            ...result
          });
        }

        setProcessedData(results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing');
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
          const summary = CATEGORIES.reduce((acc, category) => {
            acc[category] = updatedTransactions
              .filter(t => t.category === category)
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

  const clearAll = () => {
    setFiles([]);
    setManualText('');
    setProcessedData([]);
    setError(null);
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedFile('');
  };

  // Filter transactions based on search and category
  const filteredTransactions = processedData.flatMap((data, dataIndex) => 
    data.transactions
      .filter(t => {
        const matchesSearch = !searchTerm || 
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.date.includes(searchTerm);
        const matchesCategory = !selectedCategory || t.category === selectedCategory;
        const matchesFile = selectedFile === '' || data.fileName === selectedFile;
        return matchesSearch && matchesCategory && matchesFile;
      })
      .map(t => ({ ...t, fileName: data.fileName, dataIndex }))
  );

  const totalSummary = processedData.reduce((acc, data) => {
    CATEGORIES.forEach(cat => {
      acc[cat] = (acc[cat] || 0) + data.summary[cat];
    });
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = Object.values(totalSummary).reduce((sum, val) => sum + val, 0);

  const sampleText = `Jul 11 INTERNET TRANSFER 000000129961 118.21
Jul 14 PREAUTHORIZED DEBIT TOYOTA FINANCE 254.18
Jul 25 E-TRANSFER Canadian National VanLine 1687.20
Jul 28 PREAUTHORIZED DEBIT TOYOTA FINANCE 254.18
Jul 31 SERVICE CHARGE MONTHLY FEE 6.95`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bank Statement Processor
          </h1>
          <p className="text-gray-600">
            Upload PDF statements or paste transaction data for automatic categorization
          </p>
        </div>

        {/* Input Mode Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setInputMode('pdf')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputMode === 'pdf' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FiUpload className="inline mr-2" />
              Upload PDF
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputMode === 'text' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FiEdit3 className="inline mr-2" />
              Paste Text
            </button>
          </div>

          {inputMode === 'pdf' ? (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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

              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Uploaded Files ({files.length})</h3>
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
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label htmlFor="manual-text" className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Transaction Data
                </label>
                <textarea
                  id="manual-text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste your transaction data here..."
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Expected Format:</h4>
                <pre className="text-sm text-blue-800 bg-blue-100 p-2 rounded overflow-x-auto">
                  {sampleText}
                </pre>
                <button
                  onClick={() => setManualText(sampleText)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FiCopy className="mr-1" />
                  Use Sample Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Process Button */}
        <div className="text-center mb-6">
          <button
            onClick={processInput}
            disabled={loading || (inputMode === 'pdf' && files.length === 0) || (inputMode === 'text' && !manualText.trim())}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </>
            ) : (
              `Process ${inputMode === 'pdf' ? 'PDF' : 'Text'}`
            )}
          </button>
          
          {(files.length > 0 || manualText || processedData.length > 0) && (
            <button
              onClick={clearAll}
              className="ml-4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-400">⚠️</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700 whitespace-pre-line">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {processedData.length > 0 && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {CATEGORIES.map(category => (
                <div key={category} className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-500 truncate">{category}</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(totalSummary[category] || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Total Expenses: ${grandTotal.toFixed(2)}
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredTransactions.length} transactions
                </span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {processedData.length > 1 && (
                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Files</option>
                    {processedData.map((data, index) => (
                      <option key={index} value={data.fileName}>{data.fileName}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      {processedData.length > 1 && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <select
                            value={transaction.category}
                            onChange={(e) => updateTransactionCategory(transaction.dataIndex, transaction.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${transaction.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">
                              {(transaction.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        {processedData.length > 1 && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.fileName}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No transactions match your current filters.
                </div>
              )}
            </div>

            {/* Processing Info */}
            {processedData.some(data => data.processingInfo) && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Processing Information</h3>
                {processedData.map((data, index) => 
                  data.processingInfo && (
                    <div key={index} className="text-sm text-blue-800">
                      <strong>{data.fileName}:</strong> {data.processingInfo.processingMethod} - 
                      Processed {data.processingInfo.inputLength} characters, 
                      found {data.processingInfo.extractedTransactions} transactions
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        {processedData.length === 0 && !loading && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📄 PDF Upload</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Upload PDF bank statements</li>
                  <li>• Works best with text-based PDFs (not scanned images)</li>
                  <li>• Multiple files supported</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✏️ Manual Text Input</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Copy transaction data from online banking</li>
                  <li>• Paste CSV data or formatted text</li>
                  <li>• More reliable than PDF extraction</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Tip</h4>
              <p className="text-sm text-yellow-700">
                If PDF upload doesn't work, try the manual text input option. 
                Simply copy your transaction data from your online banking and paste it here 
                for automatic categorization.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}