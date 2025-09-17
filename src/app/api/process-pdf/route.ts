import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
}

const CATEGORIES = [
  'Living Expenses',
  'Groceries', 
  'Restaurants',
  'Car',
  'Entertainment',
  'Miscellaneous'
] as const;

export async function POST(request: NextRequest) {
  try {
    console.log('Bank Statement Processor API called');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const manualText = formData.get('manualText') as string;
    
    console.log(`Request type: ${manualText ? 'Manual text input' : 'PDF upload'}`);

    // Handle manual text input
    if (manualText && manualText.trim().length > 0) {
      console.log(`Processing manual text input: ${manualText.length} characters`);
      return await processTransactionText(manualText.trim());
    }

    // Handle PDF upload
    if (!file) {
      return NextResponse.json({ 
        error: 'No file or text provided',
        helpMessage: 'You can either upload a PDF or paste transaction text directly.',
        suggestions: [
          'Upload a PDF bank statement',
          'Or copy and paste transaction data from your online banking',
          'Or use the manual text input option'
        ]
      }, { status: 400 });
    }

    console.log(`File received: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'File must be a PDF. Received: ' + file.type 
      }, { status: 400 });
    }

    // For now, since PDF extraction is problematic, provide helpful guidance
    // and suggest alternative approaches
    return NextResponse.json({
      extractionFailed: true,
      message: 'PDF text extraction is not working reliably with your bank\'s PDF format.',
      alternativeSolutions: {
        option1: {
          title: 'Copy & Paste Method (Recommended)',
          description: 'Copy transaction data directly from your online banking and paste it below',
          instructions: [
            '1. Log into your online banking',
            '2. View your account transactions',
            '3. Select and copy the transaction data',
            '4. Use the text input option instead of PDF upload'
          ]
        },
        option2: {
          title: 'Export Different Format',
          description: 'Download your statement in CSV or Excel format',
          instructions: [
            '1. Go to your bank\'s statement download section',
            '2. Choose CSV or Excel format instead of PDF',
            '3. This app can be modified to handle these formats'
          ]
        },
        option3: {
          title: 'Manual Entry',
          description: 'Type in your transactions manually for categorization',
          instructions: [
            '1. Use the manual input form',
            '2. Enter each transaction: Date, Description, Amount',
            '3. Let AI categorize them automatically'
          ]
        }
      },
      sampleFormat: 'Expected format:\nJul 14 PREAUTHORIZED DEBIT TOYOTA FINANCE 254.18\nJul 25 E-TRANSFER Canadian National VanLine 1687.20\nJul 31 SERVICE CHARGE MONTHLY FEE 6.95',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    }, { status: 200 }); // Return 200 so frontend can handle this gracefully

  } catch (error) {
    console.error('Error in POST handler:', error);
    
    return NextResponse.json({
      error: 'Server error occurred',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Process transaction text (from manual input or successful PDF extraction)
async function processTransactionText(text: string): Promise<NextResponse> {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' 
      }, { status: 500 });
    }

    console.log('Processing transaction text with OpenAI...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a financial transaction categorization expert. Analyze the provided transaction text and extract expense transactions.

RULES:
1. Extract ONLY expense transactions (money going OUT of the account)
2. Skip deposits, credits, incoming transfers, account balances
3. Look for: purchases, payments, withdrawals, debits, fees, charges

CATEGORIES:
- Living Expenses: Utilities, rent, insurance, service charges, bank fees, phone/internet bills
- Groceries: Supermarkets, food stores, grocery chains
- Restaurants: Dining out, takeout, cafes, food delivery, coffee shops
- Car: Gas stations, car payments, auto insurance, parking, maintenance
- Entertainment: Movies, streaming services, concerts, games, sports events
- Miscellaneous: Everything else that doesn't fit above categories

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
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    console.log('Parsing AI response...');
    
    let parsedData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json({
        error: 'Failed to parse AI response',
        aiResponse: aiResponse.substring(0, 500),
        inputText: text.substring(0, 200)
      }, { status: 500 });
    }

    // Process and validate transactions
    const rawTransactions = parsedData.transactions || [];
    console.log(`AI identified ${rawTransactions.length} transactions`);

    const validTransactions: Transaction[] = [];
    
    rawTransactions.forEach((transaction: any, index: number) => {
      // Validate required fields
      if (!transaction.date || !transaction.description || typeof transaction.amount !== 'number') {
        console.log(`Skipping invalid transaction:`, transaction);
        return;
      }

      // Ensure amount is negative (expense)
      const amount = transaction.amount > 0 ? -Math.abs(transaction.amount) : transaction.amount;

      // Validate category
      let category = transaction.category;
      if (!CATEGORIES.includes(category)) {
        console.log(`Invalid category "${category}", defaulting to Miscellaneous`);
        category = 'Miscellaneous';
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(transaction.date)) {
        console.log(`Invalid date format: ${transaction.date}`);
        return;
      }

      validTransactions.push({
        id: transaction.id || `txn_${String(index + 1).padStart(3, '0')}`,
        date: transaction.date,
        description: transaction.description.trim(),
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        category: category,
        confidence: Math.min(Math.max(transaction.confidence || 0.8, 0.5), 1.0)
      });
    });

    console.log(`Successfully processed ${validTransactions.length} valid transactions`);

    // Calculate summary by category
    const summary = CATEGORIES.reduce((acc, category) => {
      acc[category] = validTransactions
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return acc;
    }, {} as ProcessedData['summary']);

    // Round summary values
    Object.keys(summary).forEach(key => {
      summary[key as keyof ProcessedData['summary']] = Math.round(summary[key as keyof ProcessedData['summary']] * 100) / 100;
    });

    const totalAmount = Math.round(validTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) * 100) / 100;

    const result: ProcessedData = {
      transactions: validTransactions,
      totalAmount,
      summary
    };

    console.log(`Processing complete: $${totalAmount} total, ${validTransactions.length} transactions`);
    console.log('Category breakdown:', summary);

    return NextResponse.json({
      ...result,
      processingInfo: {
        inputLength: text.length,
        extractedTransactions: validTransactions.length,
        processingMethod: 'AI Text Analysis'
      }
    });

  } catch (error) {
    console.error('Error processing transaction text:', error);
    
    return NextResponse.json({
      error: 'Failed to process transaction text',
      message: error instanceof Error ? error.message : 'Unknown error',
      inputPreview: text.substring(0, 200)
    }, { status: 500 });
  }
}