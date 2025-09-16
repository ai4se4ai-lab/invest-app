// src/app/api/process-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { Transaction } from '@/types';
import { classifyTransaction } from '@/utils/categoryClassifier';
import { parseTransactionText } from '@/utils/transactionProcessor';
import { aiClassifier } from '@/lib/ai/classifier';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    console.log(`Processing PDF: ${file.name} (${file.size} bytes)`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF with options for better text extraction
    const pdfData = await pdfParse(buffer, {
      // Options for better parsing
      max: 0, // No page limit
      version: 'v2.0.550', // Use specific version
    });
    
    const text = pdfData.text;
    console.log(`Extracted text length: ${text.length} characters`);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content found in PDF' },
        { status: 400 }
      );
    }

    // Process transactions from text
    const rawTransactions = parseTransactionText(text);
    console.log(`Found ${rawTransactions.length} raw transactions`);

    if (rawTransactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found in the PDF. Please ensure this is a valid bank statement.' },
        { status: 400 }
      );
    }

    // Classify each transaction using AI
    const classifiedTransactions = rawTransactions.map((transaction, index) => {
      const classification = aiClassifier.classifyTransaction(transaction.description);
      
      return {
        ...transaction,
        id: `${file.name.replace(/[^a-zA-Z0-9]/g, '_')}-${index}`,
        category: classification.category,
        confidence: classification.confidence
      } as Transaction;
    });

    console.log(`Classified ${classifiedTransactions.length} transactions`);

    // Calculate summary by category
    const summary = classifiedTransactions.reduce((acc, transaction) => {
      const category = transaction.category as keyof typeof acc;
      // Only count expenses (negative amounts) for summary
      if (transaction.amount < 0) {
        acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      }
      return acc;
    }, {
      'Living Expenses': 0,
      'Groceries': 0,
      'Restaurants': 0,
      'Car': 0,
      'Entertainment': 0,
      'Miscellaneous': 0
    });

    // Calculate total amount (expenses only)
    const totalAmount = classifiedTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const response = {
      fileName: file.name,
      transactions: classifiedTransactions,
      totalAmount,
      summary,
      metadata: {
        totalTransactions: classifiedTransactions.length,
        expenseTransactions: classifiedTransactions.filter(t => t.amount < 0).length,
        incomeTransactions: classifiedTransactions.filter(t => t.amount >= 0).length,
        averageConfidence: classifiedTransactions.reduce((sum, t) => sum + t.confidence, 0) / classifiedTransactions.length,
        processingTime: Date.now()
      }
    };

    console.log(`Successfully processed ${file.name}: ${classifiedTransactions.length} transactions, $${totalAmount.toFixed(2)} total expenses`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('PDF processing error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process PDF';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        errorMessage = 'Invalid PDF file. Please ensure the file is not corrupted.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password-protected PDFs are not supported.';
      } else if (error.message.includes('ENOENT')) {
        errorMessage = 'File not found. Please try uploading again.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}