// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const sessionId = searchParams.get('sessionId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: session.user.id,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (sessionId) {
      where.sessionId = sessionId
    }

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) }
    }

    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) }
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          session: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { transactions, sessionData } = body

    // Create processing session first
    const processingSession = await prisma.processingSession.create({
      data: {
        userId: session.user.id,
        fileName: sessionData.fileName,
        totalAmount: sessionData.totalAmount,
        inputMethod: sessionData.inputMethod,
        inputContent: sessionData.inputContent,
      }
    })

    // Create all transactions
    const createdTransactions = await Promise.all(
      transactions.map((transaction: any) =>
        prisma.transaction.create({
          data: {
            userId: session.user.id,
            categoryId: transaction.categoryId,
            date: new Date(transaction.date),
            description: transaction.description,
            amount: transaction.amount,
            confidence: transaction.confidence,
            sourceFile: sessionData.fileName,
            sessionId: processingSession.id,
          },
          include: {
            category: true,
            session: true,
          }
        })
      )
    )

    return NextResponse.json({
      session: processingSession,
      transactions: createdTransactions
    })
  } catch (error) {
    console.error('Transaction creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}