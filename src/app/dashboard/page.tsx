// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { 
  FiFileText, 
  FiDollarSign, 
  FiTrendingDown, 
  FiCalendar,
  FiPlus,
  FiBarChart,
  FiTag
} from 'react-icons/fi'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardStats {
  totalTransactions: number
  totalExpenses: number
  categorySummary: { name: string; total: number; color: string }[]
  monthlyTrend: { month: string; amount: number }[]
  recentSessions: {
    id: string
    fileName: string
    totalAmount: number
    createdAt: string
    transactionCount: number
  }[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/categories')
      ])

      const { transactions } = await transactionsRes.json()
      const categories = await categoriesRes.json()

      // Calculate stats
      const totalTransactions = transactions.length
      const totalExpenses = transactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

      // Category summary
      const categorySummary = categories.map((cat: any) => {
        const categoryTransactions = transactions.filter((t: any) => t.categoryId === cat.id)
        const total = categoryTransactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
        return {
          name: cat.name,
          total,
          color: cat.color
        }
      }).filter((cat: any) => cat.total > 0)

      // Monthly trend (last 6 months)
      const monthlyTrend = []
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i)
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        
        const monthTransactions = transactions.filter((t: any) => {
          const transactionDate = new Date(t.date)
          return transactionDate >= monthStart && transactionDate <= monthEnd
        })
        
        const amount = monthTransactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
        
        monthlyTrend.push({
          month: format(month, 'MMM'),
          amount
        })
      }

      // Recent sessions (group by session)
      const sessionGroups = transactions.reduce((groups: any, transaction: any) => {
        const sessionId = transaction.sessionId || 'manual'
        if (!groups[sessionId]) {
          groups[sessionId] = []
        }
        groups[sessionId].push(transaction)
        return groups
      }, {})

      const recentSessions = Object.entries(sessionGroups)
        .map(([sessionId, sessionTransactions]: [string, any]) => {
          const firstTransaction = sessionTransactions[0]
          return {
            id: sessionId,
            fileName: firstTransaction.session?.fileName || 'Manual Entry',
            totalAmount: sessionTransactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0),
            createdAt: firstTransaction.session?.createdAt || firstTransaction.createdAt,
            transactionCount: sessionTransactions.length
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      setStats({
        totalTransactions,
        totalExpenses,
        categorySummary,
        monthlyTrend,
        recentSessions
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/transactions?sessionId=${sessionId}`)
      const { transactions } = await response.json()
      
      // Navigate to process page with loaded data
      const sessionData = {
        transactions,
        fileName: stats?.recentSessions.find(s => s.id === sessionId)?.fileName || 'Loaded Session'
      }
      
      // Store in sessionStorage for the process page to pick up
      sessionStorage.setItem('loadedSession', JSON.stringify(sessionData))
      window.location.href = '/dashboard/process'
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  if (loading) {
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
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-gray-600">Here&apos;s your expense overview</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiFileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiDollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats?.totalExpenses?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiTrendingDown className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.categorySummary?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/process"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FiPlus className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Process New Document</p>
                <p className="text-sm text-gray-600">Upload PDF or enter text</p>
              </div>
            </Link>

            <Link
              href="/dashboard/categories"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FiTag className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Manage Categories</p>
                <p className="text-sm text-gray-600">Add or edit categories</p>
              </div>
            </Link>

            <Link
              href="/dashboard/reports"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FiBarChart className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">View Reports</p>
                <p className="text-sm text-gray-600">Analyze your spending</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.categorySummary || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats?.categorySummary?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Processing Sessions</h2>
            <Link
              href="/dashboard/transactions"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          
          {stats?.recentSessions && stats.recentSessions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FiFileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{session.fileName}</p>
                      <p className="text-sm text-gray-600">
                        {session.transactionCount} transactions • $
                        {session.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {format(new Date(session.createdAt), 'MMM dd')}
                    </span>
                    <button
                      onClick={() => loadSession(session.id)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiFileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No processing sessions yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}