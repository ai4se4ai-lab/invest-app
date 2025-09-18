// src/app/api/process-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's categories
    const userCategories = await prisma.category.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true }
    })

    const categoryNames = userCategories.map(cat => cat.name)
    const categoryMap = Object.fromEntries(
      userCategories.map(cat => [cat.name, cat.id])
    )

    const formData = await request.formData()
    const file = formData.get('file') as File
    const manualText = formData.get('manualText') as string

    let text = ''
    let fileName = ''
    let inputMethod = ''

    if (file) {
      fileName = file.name
      inputMethod = 'pdf'
      
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Please upload a PDF file' },
          { status: 400 }
        )
      }

      // For this example, we'll use a simple PDF text extraction
      // In production, you might want to use a more robust PDF parser
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)
      
      // Simple PDF text extraction (you may want to improve this)
      text = new TextDecoder().decode(uint8Array)
      
      if (!text || text.length < 50) {
        return NextResponse.json({
          extractionFailed: true,
          message: 'Could not extract text from PDF. Please try manual text input.',
          fileName: file.name
        })
      }
    } else if (manualText) {
      text = manualText
      fileName = 'Manual Input'
      inputMethod = 'text'
    } else {
      return NextResponse.json(
        { error: 'Please provide either a PDF file or manual text input' },
        { status: 400 }
      )
    }

    console.log(`Processing ${inputMethod} input with ${text.length} characters...`)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze the provided transaction text and extract expense transactions.

RULES:
1. Extract ONLY expense transactions (money going OUT of the account)
2. Skip deposits, credits, incoming transfers, account balances
3. Look for: purchases, payments, withdrawals, debits, fees, charges

CATEGORIES:
${categoryNames.map(name => `- ${name}`).join('\n')}

TRANSACTION PATTERNS TO RECOGNIZE:
- "Jul 14 MERCHANT NAME 123.45"
- "2025-07-14 Description $123.45"
- "DEBIT MERCHANT 123.45"
- "PREAUTHORIZED PAYMENT COMPANY 123.45"

DATE HANDLING:
- Convert all dates to YYYY-MM-DD format
- "Jul 14" → "2025-07-14"
- "14/07" → "2025-07-14"
- If no year specified, assume 2025

RESPONSE FORMAT:
{
  "transactions": [
    {
      "id": "txn_001",
      "date": "YYYY-MM-DD",
      "description": "Clean merchant/service name",
      "amount": -123.45,
      "category": "Category Name",
      "confidence": 0.95
    }
  ]
}

IMPORTANT:
- ALL expense amounts must be NEGATIVE (-123.45)
- Generate sequential IDs (txn_001, txn_002, etc.)
- Clean descriptions but keep key merchant info
- Confidence: 0.9+ for clear matches, 0.7+ for likely matches, 0.5+ for uncertain
- If no expenses found, return empty transactions array`
        },
        {
          role: 'user',
          content: `Extract and categorize expense transactions from this text:\n\n${text}`
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('Parsing AI response...')
    
    let parsedData
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        parsedData = JSON.parse(aiResponse)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse)
      return NextResponse.json({
        error: 'Failed to parse AI response',
        aiResponse: aiResponse.substring(0, 500),
        inputText: text.substring(0, 200)
      }, { status: 500 })
    }

    // Process and validate transactions
    const rawTransactions = parsedData.transactions || []
    console.log(`AI identified ${rawTransactions.length} transactions`)

    const validTransactions: any[] = []
    
    rawTransactions.forEach((transaction: any, index: number) => {
      // Validate required fields
      if (!transaction.date || !transaction.description || typeof transaction.amount !== 'number') {
        console.log(`Skipping invalid transaction:`, transaction)
        return
      }

      // Ensure amount is negative (expense)
      const amount = transaction.amount > 0 ? -transaction.amount : transaction.amount

      // Map category name to category ID
      const categoryId = categoryMap[transaction.category] || categoryMap['Miscellaneous']
      
      if (!categoryId) {
        console.log(`Skipping transaction with invalid category: ${transaction.category}`)
        return
      }

      validTransactions.push({
        id: transaction.id || `txn_${String(index + 1).padStart(3, '0')}`,
        date: transaction.date,
        description: transaction.description.trim(),
        amount: amount,
        categoryId: categoryId,
        category: transaction.category,
        confidence: transaction.confidence || 0.5
      })
    })

    if (validTransactions.length === 0) {
      return NextResponse.json({
        transactions: [],
        totalAmount: 0,
        summary: Object.fromEntries(categoryNames.map(name => [name, 0])),
        fileName,
        processingInfo: {
          inputLength: text.length,
          extractedTransactions: 0,
          processingMethod: inputMethod
        }
      })
    }

    // Calculate totals
    const totalAmount = validTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    // Calculate summary by category
    const summary: Record<string, number> = {}
    categoryNames.forEach(name => {
      summary[name] = validTransactions
        .filter(t => t.category === name)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    })

    console.log(`Successfully processed ${validTransactions.length} transactions`)

    return NextResponse.json({
      transactions: validTransactions,
      totalAmount,
      summary,
      fileName,
      processingInfo: {
        inputLength: text.length,
        extractedTransactions: validTransactions.length,
        processingMethod: inputMethod
      },
      sessionData: {
        fileName,
        totalAmount,
        inputMethod,
        inputContent: inputMethod === 'text' ? text : undefined
      }
    })

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process input' },
      { status: 500 }
    )
  }
}