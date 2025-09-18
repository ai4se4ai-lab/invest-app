// src/app/dashboard/process/page.tsx
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { FiUpload, FiFileText, FiTrash2, FiEdit3, FiCopy, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  categoryId: string
  category: string
  confidence: number
}

interface ProcessedData {
  transactions: Transaction[]
  totalAmount: number
  summary: Record<string, number>
  fileName?: string
  processingInfo?: {
    inputLength: number
    extractedTransactions: number
    processingMethod: string
  }
  sessionData?: {
    fileName: string
    totalAmount: number
    inputMethod: string
    inputContent?: string
  }
}

interface Category {
  id: string
  name: string
  color: string
}

export default function ProcessPage() {
  const [files, setFiles] = useState<File[]>([])
  const [manualText, setManualText] = useState('')
  const [inputMode, setInputMode] = useState<'pdf' | 'text'>('pdf')
  const [processedData, setProcessedData] = useState<ProcessedData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedFile, setSelectedFile] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Transaction>>({})

  useEffect(() => {
    fetchCategories()
    checkForLoadedSession()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const checkForLoadedSession = () => {
    const loadedSession = sessionStorage.getItem('loadedSession')
    if (loadedSession) {
      try {
        const sessionData = JSON.parse(loadedSession)
        const processedSessionData = {
          transactions: sessionData.transactions,
          totalAmount: sessionData.transactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0),
          summary: calculateSummary(sessionData.transactions),
          fileName: sessionData.fileName,
          processingInfo: {
            inputLength: 0,
            extractedTransactions: sessionData.transactions.length,
            processingMethod: 'loaded'
          }
        }
        setProcessedData([processedSessionData])
        sessionStorage.removeItem('loadedSession')
        toast.success('Session loaded successfully!')
      } catch (error) {
        console.error('Failed to load session:', error)
        sessionStorage.removeItem('loadedSession')
      }
    }
  }

  const calculateSummary = (transactions: Transaction[]) => {
    const summary: Record<string, number> = {}
    categories.forEach(cat => {
      summary[cat.name] = transactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    })
    return summary
  }

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || [])
    const pdfFiles = uploadedFiles.filter(file => file.type === 'application/pdf')
    
    if (pdfFiles.length !== uploadedFiles.length) {
      setError('Please only upload PDF files')
      toast.error('Please only upload PDF files')
      return
    }
    
    setFiles(prev => [...prev, ...pdfFiles])
    setError(null)
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const processInput = async () => {
    if (inputMode === 'pdf' && files.length === 0) {
      setError('Please upload at least one PDF file')
      toast.error('Please upload at least one PDF file')
      return
    }

    if (inputMode === 'text' && !manualText.trim()) {
      setError('Please enter transaction text')
      toast.error('Please enter transaction text')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (inputMode === 'text') {
        // Process manual text input
        const formData = new FormData()
        formData.append('manualText', manualText.trim())

        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to process text')
        }

        setProcessedData([{
          fileName: 'Manual Input',
          ...result
        }])
        toast.success('Text processed successfully!')
      } else {
        // Process PDF files
        const results: ProcessedData[] = []

        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/process-pdf', {
            method: 'POST',
            body: formData,
          })

          const result = await response.json()

          if (result.extractionFailed) {
            toast.error(`PDF extraction failed for ${file.name}. Try manual text input.`)
            continue
          }

          if (!response.ok) {
            throw new Error(result.error || `Failed to process ${file.name}`)
          }

          results.push({
            fileName: file.name,
            ...result
          })
        }

        setProcessedData(results)
        if (results.length > 0) {
          toast.success(`Successfully processed ${results.length} file(s)!`)
        }
      }
    } catch (error) {
      console.error('Processing error:', error)
      setError(error instanceof Error ? error.message : 'Failed to process input')
      toast.error('Failed to process input')
    } finally {
      setLoading(false)
    }
  }

  const saveToDatabase = async () => {
    if (processedData.length === 0) {
      toast.error('No data to save')
      return
    }

    setLoading(true)
    try {
      for (const data of processedData) {
        if (data.sessionData) {
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactions: data.transactions,
              sessionData: data.sessionData
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to save transactions')
          }
        }
      }

      toast.success('All transactions saved successfully!')
      // Clear processed data after saving
      setProcessedData([])
      setFiles([])
      setManualText('')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save transactions')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction.id)
    setEditValues({
      description: transaction.description,
      categoryId: transaction.categoryId,
      amount: transaction.amount
    })
  }

  const saveEdit = (transactionId: string) => {
    setProcessedData(prev => prev.map(data => ({
      ...data,
      transactions: data.transactions.map(t =>
        t.id === transactionId
          ? {
              ...t,
              description: editValues.description || t.description,
              categoryId: editValues.categoryId || t.categoryId,
              category: categories.find(c => c.id === (editValues.categoryId || t.categoryId))?.name || t.category,
              amount: editValues.amount || t.amount
            }
          : t
      )
    })))
    
    setEditingTransaction(null)
    setEditValues({})
    toast.success('Transaction updated!')
  }

  const cancelEdit = () => {
    setEditingTransaction(null)
    setEditValues({})
  }

  const deleteTransaction = (transactionId: string) => {
    setProcessedData(prev => prev.map(data => ({
      ...data,
      transactions: data.transactions.filter(t => t.id !== transactionId)
    })))
    toast.success('Transaction deleted!')
  }

  // Filter transactions for display
  const allTransactions = processedData.flatMap((data, dataIndex) =>
    data.transactions.map(transaction => ({
      ...transaction,
      sourceIndex: dataIndex,
      sourceFile: data.fileName
    }))
  )

  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || 
      transaction.category === selectedCategory
    
    const matchesFile = !selectedFile || 
      transaction.sourceFile === selectedFile

    return matchesSearch && matchesCategory && matchesFile
  })

  const grandTotal = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Process Documents</h1>
          <p className="text-gray-600">Upload bank statements or enter transaction text</p>
        </div>

        {/* Input Mode Toggle */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setInputMode('pdf')}
              className={`px-4 py-2 rounded-lg font-medium ${
                inputMode === 'pdf'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiUpload className="inline mr-2" />
              Upload PDF
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-lg font-medium ${
                inputMode === 'text'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiFileText className="inline mr-2" />
              Manual Text
            </button>
          </div>

          {inputMode === 'pdf' ? (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Upload PDF Bank Statements
                  </p>
                  <p className="text-gray-500">
                    Click to browse or drag and drop your PDF files here
                  </p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FiFileText className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
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
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Text
              </label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste your bank statement text here..."
              />
              <p className="mt-2 text-sm text-gray-500">
                Paste transaction text from your bank statement or account summary
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={processInput}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Process Input'
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {processedData.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Total Expenses: ${grandTotal.toFixed(2)}
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {filteredTransactions.length} transactions
                  </span>
                  <button
                    onClick={saveToDatabase}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <FiSave className="mr-2 h-4 w-4" />
                    Save All
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 mt-4">
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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {editingTransaction === transaction.id ? (
                          <input
                            type="text"
                            value={editValues.description || transaction.description}
                            onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          transaction.description
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {editingTransaction === transaction.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.amount || transaction.amount}
                            onChange={(e) => setEditValues(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          `$${Math.abs(transaction.amount).toFixed(2)}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingTransaction === transaction.id ? (
                          <select
                            value={editValues.categoryId || transaction.categoryId}
                            onChange={(e) => setEditValues(prev => ({ ...prev, categoryId: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: categories.find(c => c.id === transaction.categoryId)?.color + '20',
                              color: categories.find(c => c.id === transaction.categoryId)?.color
                            }}
                          >
                            {transaction.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(transaction.confidence || 0) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {Math.round((transaction.confidence || 0) * 100)}%
                          </span>
                        </div>
                      </td>
                      {processedData.length > 1 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.sourceFile}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingTransaction === transaction.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEdit(transaction.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(transaction)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FiEdit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}