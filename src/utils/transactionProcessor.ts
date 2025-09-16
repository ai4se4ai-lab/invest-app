// src/utils/transactionProcessor.ts

export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
}

export function parseTransactionText(text: string): RawTransaction[] {
  const lines = text.split('\n');
  const transactions: RawTransaction[] = [];
  
  // Common patterns for bank statement parsing
  const transactionPattern = /(\d{1,2}\s+\w{3}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/;
  const amountPattern = /[\$]?[\d,]+\.\d{2}/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.includes('Date') || line.includes('Description') || line.includes('Balance')) {
      continue;
    }
    
    // Look for date patterns
    const dateMatch = line.match(transactionPattern);
    if (dateMatch) {
      const date = parseBankDate(dateMatch[0]);
      
      // Extract description and amount from the line
      const { description, amount } = extractDescriptionAndAmount(line);
      
      if (description && amount !== null) {
        transactions.push({
          date,
          description: cleanDescription(description),
          amount
        });
      }
    }
  }
  
  return transactions.filter(t => t.amount !== 0); // Filter out zero amounts
}

function parseBankDate(dateStr: string): string {
  // Handle different date formats
  if (dateStr.includes('-')) {
    return dateStr; // Already in YYYY-MM-DD format
  }
  
  if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Handle "7 Jul" format
  const parts = dateStr.split(' ');
  if (parts.length === 2) {
    const [day, month] = parts;
    const currentYear = new Date().getFullYear();
    const monthNum = getMonthNumber(month);
    return `${currentYear}-${monthNum.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
}

function getMonthNumber(monthStr: string): number {
  const months = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  return months[monthStr as keyof typeof months] || 1;
}

function extractDescriptionAndAmount(line: string): { description: string; amount: number } {
  // Remove common prefixes and clean the line
  let cleanLine = line
    .replace(/^\d{1,2}\s+\w{3}/, '') // Remove date
    .replace(/^\d{4}-\d{2}-\d{2}/, '') // Remove ISO date
    .replace(/^\d{2}\/\d{2}\/\d{4}/, '') // Remove MM/DD/YYYY date
    .trim();
  
  // Extract amounts (look for patterns like $123.45, 123.45, 1,234.56)
  const amountMatches = cleanLine.match(/[\d,]+\.\d{2}/g);
  
  let amount = 0;
  let description = cleanLine;
  
  if (amountMatches && amountMatches.length > 0) {
    // Use the last amount found (usually the transaction amount)
    const amountStr = amountMatches[amountMatches.length - 1];
    amount = parseFloat(amountStr.replace(/,/g, ''));
    
    // Remove amount from description
    description = cleanLine.replace(amountStr, '').trim();
    
    // Check if this is a withdrawal (negative amount)
    if (cleanLine.includes('Withdrawal') || cleanLine.includes('Debit') || 
        cleanLine.includes('Purchase') || cleanLine.includes('Payment')) {
      amount = -amount;
    }
  }
  
  return { description, amount };
}

function cleanDescription(description: string): string {
  return description
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^(e:|Contactless Interac purchase|Visa Debit purchase|Misc Payment|Online Banking payment|Transfer sent|Payroll Deposit)/i, '') // Remove common prefixes
    .replace(/\d{4}$/, '') // Remove trailing reference numbers
    .trim();
}