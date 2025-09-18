// src/app/dashboard/transactions/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { 
  FiSearch, 
  FiFilter, 
  FiCalendar, 
  FiEdit3, 
  FiTrash2, 
  FiDownload,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  confidence: number
  sourceFile: string
  categoryId: string
  category: {
    id: string
    name: string
    color: string
  }
  session: {
    id: string
    fileName: string
    createdAt: string
  } | null
}

interface Category {
  id: string
  name: string
  color: string
}

interface TransactionFilters {
  search: string
  categoryId: string
  startDate: string
  endDate: string
  page: number
  limit: number
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 })
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Transaction>>({})
  
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 25
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('page', filters.page.toString())
      params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/transactions?${params}`)
      const data = await response.json()
      
      setTransactions(data.transactions)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: keyof TransactionFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when other filters change
    }))
  }

  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction.id)
    setEditValues({
      description: transaction.description,
      categoryId: transaction.categoryId,
      amount: transaction.amount
    })
  }

  const saveEdit = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editValues),
      })

      if (response.ok) {
        const updatedTransaction = await response.json()
        setTransactions(prev => prev.map(t => 
          t.id === transactionId ? updatedTransaction : t
        ))
        setEditingTransaction(null)
        setEditValues({})
        toast.success('Transaction updated!')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to update transaction')
      }
    } catch (error) {
      console.error('Failed to update transaction:', error)
      toast.error('Failed to update transaction')
    }
  }

  const cancelEdit = () => {
    setEditingTransaction(null)
    setEditValues({})
  }

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTransactions(prev => prev.filter(t => t.id !== transactionId))
        toast.success('Transaction deleted!')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete transaction')
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }

  const exportTransactions = () => {
    // Create CSV content
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Source File']
    const rows = transactions.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      t.description,
      Math.abs(t.amount).toFixed(2),
      t.category.name,
      t.sourceFile || 'Manual Entry'
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  if (loading && transactions.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">
              {pagination.total} transactions • Total: ${totalAmount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={exportTransactions}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.categoryId}
              onChange={(e) => updateFilter('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                placeholder="Start date"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                placeholder="End date"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Clear filters button */}
          {(filters.search || filters.categoryId || filters.startDate || filters.endDate) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setFilters(prev => ({
                  ...prev,
                  search: '',
                  categoryId: '',
                  startDate: '',
                  endDate: '',
                  page: 1
                }))}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <FiFilter className="mr-1 h-3 w-3" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      {editingTransaction === transaction.id ? (
                        <input
                          type="text"
                          value={editValues.description || transaction.description}
                          onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {editingTransaction === transaction.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.amount || transaction.amount}
                          onChange={(e) => setEditValues(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        `$${Math.abs(transaction.amount).toFixed(2)}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingTransaction === transaction.id ? (
                        <select
                          value={editValues.categoryId || transaction.categoryId}
                          onChange={(e) => setEditValues(prev => ({ ...prev, categoryId: e.target.value }))}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: transaction.category.color + '20',
                            color: transaction.category.color
                          }}
                        >
                          {transaction.category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={transaction.sourceFile}>
                        {transaction.sourceFile || 'Manual Entry'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${(transaction.confidence || 0) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">
                          {Math.round((transaction.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingTransaction === transaction.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveEdit(transaction.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                          >
                            <FiEdit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900 p-1"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(transaction)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <FiEdit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-900 p-1"
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

          {/* Pagination */}
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <span>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateFilter('page', Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => updateFilter('page', Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {transactions.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="h-12 w-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiSearch className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.categoryId || filters.startDate || filters.endDate
                ? 'Try adjusting your search filters'
                : 'Start by processing your first bank statement'}
            </p>
            {!(filters.search || filters.categoryId || filters.startDate || filters.endDate) && (
              <button
                onClick={() => window.location.href = '/dashboard/process'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Process Documents
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}