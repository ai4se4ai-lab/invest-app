// src/app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { categorySchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color } = categorySchema.parse(body)

    // Check if category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if another category with same name exists
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        name: name,
        id: { not: params.id }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: { name, color },
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if category belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion of default categories that have transactions
    if (category.isDefault && category._count.transactions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete default category with existing transactions' },
        { status: 400 }
      )
    }

    // If category has transactions, we need to handle them
    if (category._count.transactions > 0) {
      // Get the miscellaneous category to reassign transactions
      const miscCategory = await prisma.category.findFirst({
        where: {
          userId: session.user.id,
          name: 'Miscellaneous'
        }
      })

      if (miscCategory) {
        // Reassign all transactions to miscellaneous
        await prisma.transaction.updateMany({
          where: { categoryId: params.id },
          data: { categoryId: miscCategory.id }
        })
      }
    }

    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}