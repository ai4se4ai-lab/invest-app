import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Note: You'll need to install pdf-parse: npm install pdf-parse @types/pdf-parse
const pdfParse = require('pdf-parse');

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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Extract text from PDF
    const buffer = await file.arrayBuffer();
    const pdfData = await pdfParse(Buffer.from(buffer));
    const pdfText = pdfData.text;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Use GPT-4o to extract and categorize transactions
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting and categorizing financial transactions from bank statements. 

Your task is to:
1. Extract all transactions from the provided bank statement text
2. Categorize each transaction into one of these categories: Living Expenses, Groceries, Restaurants, Car, Entertainment, Miscellaneous
3. Provide a confidence score (0-1) for each categorization

Guidelines for categorization:
- Living Expenses: Rent, utilities (electricity, gas, water, internet, phone bills), insurance, subscriptions
- Groceries: Supermarkets, food stores, grocery chains
- Restaurants: Dining out, takeout, cafes, bars, food delivery
- Car: Gas stations, parking, car maintenance, car payments, tolls
- Entertainment: Movies, concerts, games, streaming services, sports events
- Miscellaneous: Everything else that doesn't fit the above categories

Return your response as a JSON object with this structure:
{
  "transactions": [
    {
      "id": "unique_id",
      "date": "YYYY-MM-DD",
      "description": "cleaned transaction description",
      "amount": -123.45,
      "category": "category_name",
      "confidence": 0.95
    }
  ]
}

Important notes:
- Only include actual expense transactions (negative amounts or debits)
- Skip payments, transfers, credits, and account fees
- Use negative amounts for expenses
- Extract the date in YYYY-MM-DD format
- Clean up the description to be readable
- Be consistent with your categorization logic
- Don't include duplicate transactions`
        },
        {
          role: 'user',
          content: `Please extract and categorize all expense transactions from this bank statement text:\n\n${pdfText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Failed to parse AI response');
    }

    const transactions: Transaction[] = parsedResponse.transactions || [];

    // Generate unique IDs for transactions if not provided
    transactions.forEach((transaction, index) => {
      if (!transaction.id) {
        transaction.id = `txn_${Date.now()}_${index}`;
      }
    });

    // Calculate summary by category
    const summary = CATEGORIES.reduce((acc, category) => {
      acc[category] = transactions
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return acc;
    }, {} as ProcessedData['summary']);

    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const result: ProcessedData = {
      transactions,
      totalAmount,
      summary
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}