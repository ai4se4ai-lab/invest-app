// src/app/dashboard/categories/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { FiPlus, FiEdit3, FiTrash2, FiSave, FiX, FiTag } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, type CategoryInput } from '@/lib/validations'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  color: string
  isDefault: boolean
  _count: {
    transactions: number
  }
}

const DEFAULT_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editValues, setEditValues] = useState<CategoryInput>({ name: '', color: '#3B82F6' })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { color: '#3B82F6' }
  })

  const watchedColor = watch('color')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CategoryInput) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const newCategory = await response.json()
        setCategories(prev => [...prev, { ...newCategory, _count: { transactions: 0 } }])
        reset()
        setShowAddForm(false)
        toast.success('Category created successfully!')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Failed to create category:', error)
      toast.error('Failed to create category')
    }
  }

  const startEdit = (category: Category) => {
    setEditingCategory(category.id)
    setEditValues({ name: category.name, color: category.color })
  }

  const saveEdit = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editValues),
      })

      if (response.ok) {
        const updatedCategory = await response.json()
        setCategories(prev => prev.map(cat => 
          cat.id === categoryId ? { ...cat, ...updatedCategory } : cat
        ))
        setEditingCategory(null)
        setEditValues({ name: '', color: '#3B82F6' })
        toast.success('Category updated successfully!')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update category')
    }
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setEditValues({ name: '', color: '#3B82F6' })
  }

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId))
        toast.success('Category deleted successfully!')
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('Failed to delete category')
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
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage your expense categories</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add Category
          </button>
        </div>

        {/* Add Category Form */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add New Category</h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  reset()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Enter category name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    {...register('color')}
                    type="color"
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          watchedColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                {errors.color && (
                  <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    reset()
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2 h-4 w-4" />
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {editingCategory === category.id ? (
                    <input
                      type="text"
                      value={editValues.name}
                      onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                      className="font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {editingCategory === category.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(category.id)}
                        className="text-green-600 hover:text-green-800 p-1"
                      >
                        <FiSave className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:text-gray-800 p-1"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(category)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <FiEdit3 className="h-4 w-4" />
                      </button>
                      {!category.isDefault && (
                        <button
                          onClick={() => deleteCategory(category.id, category.name)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {editingCategory === category.id && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editValues.color}
                      onChange={(e) => setEditValues(prev => ({ ...prev, color: e.target.value }))}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <div className="flex gap-1">
                      {DEFAULT_COLORS.slice(0, 5).map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditValues(prev => ({ ...prev, color }))}
                          className={`w-5 h-5 rounded border ${
                            editValues.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Transactions:</span>
                  <span className="font-medium">{category._count.transactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Type:</span>
                  <span className={`font-medium ${category.isDefault ? 'text-blue-600' : 'text-gray-600'}`}>
                    {category.isDefault ? 'Default' : 'Custom'}
                  </span>
                </div>
              </div>

              {category.isDefault && (
                <div className="mt-3 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <FiTag className="mr-1 h-3 w-3" />
                  Default category
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FiTag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first category</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Add Category
            </button>
          </div>
        )}

        {/* Category Statistics */}
        {categories.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {categories.length}
                </div>
                <div className="text-sm text-gray-500">Total Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {categories.filter(cat => cat.isDefault).length}
                </div>
                <div className="text-sm text-gray-500">Default Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {categories.reduce((sum, cat) => sum + cat._count.transactions, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Transactions</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}