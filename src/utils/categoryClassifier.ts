// src/utils/categoryClassifier.ts

export function classifyTransaction(description: string): string {
  const desc = description.toLowerCase();
  
  // Groceries
  if (desc.includes('grocery') || desc.includes('supermarket') || 
      desc.includes('safeway') || desc.includes('walmart') || 
      desc.includes('costco') || desc.includes('metro') ||
      desc.includes('loblaws') || desc.includes('sobeys') ||
      desc.includes('iga') || desc.includes('no frills')) {
    return 'Groceries';
  }
  
  // Restaurants
  if (desc.includes('restaurant') || desc.includes('food') || 
      desc.includes('cafe') || desc.includes('coffee') ||
      desc.includes('pizza') || desc.includes('burger') ||
      desc.includes('mcdonald') || desc.includes('subway') ||
      desc.includes('starbucks') || desc.includes('tim hortons') ||
      desc.includes('dining') || desc.includes('takeout')) {
    return 'Restaurants';
  }
  
  // Car related
  if (desc.includes('gas') || desc.includes('fuel') || 
      desc.includes('petro') || desc.includes('shell') ||
      desc.includes('esso') || desc.includes('car') ||
      desc.includes('auto') || desc.includes('parking') ||
      desc.includes('insurance') || desc.includes('repair') ||
      desc.includes('maintenance') || desc.includes('tire')) {
    return 'Car';
  }
  
  // Entertainment
  if (desc.includes('movie') || desc.includes('theater') || 
      desc.includes('cinema') || desc.includes('game') ||
      desc.includes('entertainment') || desc.includes('concert') ||
      desc.includes('netflix') || desc.includes('spotify') ||
      desc.includes('amazon prime') || desc.includes('subscription') ||
      desc.includes('streaming') || desc.includes('music')) {
    return 'Entertainment';
  }
  
  // Living Expenses
  if (desc.includes('rent') || desc.includes('mortgage') || 
      desc.includes('utilities') || desc.includes('hydro') ||
      desc.includes('electricity') || desc.includes('water') ||
      desc.includes('internet') || desc.includes('phone') ||
      desc.includes('insurance') || desc.includes('property tax') ||
      desc.includes('maintenance fee') || desc.includes('condo fee')) {
    return 'Living Expenses';
  }
  
  // Default to Miscellaneous
  return 'Miscellaneous';
}