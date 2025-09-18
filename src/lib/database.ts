// src/lib/database.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Default categories that will be created for new users
export const DEFAULT_CATEGORIES = [
  { name: 'Living Expenses', color: '#EF4444', isDefault: true },
  { name: 'Groceries', color: '#10B981', isDefault: true },
  { name: 'Restaurants', color: '#F59E0B', isDefault: true },
  { name: 'Car', color: '#3B82F6', isDefault: true },
  { name: 'Entertainment', color: '#8B5CF6', isDefault: true },
  { name: 'Miscellaneous', color: '#6B7280', isDefault: true },
]

// Create default categories for a user
export async function createDefaultCategories(userId: string) {
  try {
    const categories = await Promise.all(
      DEFAULT_CATEGORIES.map(category =>
        prisma.category.create({
          data: {
            userId,
            ...category,
          },
        })
      )
    )
    return categories
  } catch (error) {
    console.error('Error creating default categories:', error)
    throw error
  }
}