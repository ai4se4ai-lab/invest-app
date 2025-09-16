// src/lib/ai/classifier.ts

export interface ClassificationResult {
  category: string;
  confidence: number;
  reasoning?: string;
}

export interface TrainingData {
  description: string;
  category: string;
  keywords: string[];
}

// Enhanced training data for better classification
const TRAINING_DATA: TrainingData[] = [
  // Living Expenses
  { description: "rent payment", category: "Living Expenses", keywords: ["rent", "rental", "apartment", "condo"] },
  { description: "mortgage payment", category: "Living Expenses", keywords: ["mortgage", "home loan", "property payment"] },
  { description: "hydro bill", category: "Living Expenses", keywords: ["hydro", "electricity", "electric", "power"] },
  { description: "internet service", category: "Living Expenses", keywords: ["internet", "wifi", "broadband", "rogers", "bell", "telus"] },
  { description: "phone bill", category: "Living Expenses", keywords: ["phone", "mobile", "cellular", "wireless"] },
  { description: "insurance premium", category: "Living Expenses", keywords: ["insurance", "premium", "coverage"] },
  { description: "property tax", category: "Living Expenses", keywords: ["property tax", "municipal tax", "real estate tax"] },

  // Groceries
  { description: "supermarket purchase", category: "Groceries", keywords: ["supermarket", "grocery", "food store"] },
  { description: "safeway", category: "Groceries", keywords: ["safeway", "sobeys", "metro", "loblaws"] },
  { description: "walmart groceries", category: "Groceries", keywords: ["walmart", "costco", "no frills", "freshco"] },
  { description: "farmers market", category: "Groceries", keywords: ["farmers market", "fresh produce", "organic"] },

  // Restaurants
  { description: "restaurant dinner", category: "Restaurants", keywords: ["restaurant", "dining", "cafe", "bistro"] },
  { description: "fast food", category: "Restaurants", keywords: ["mcdonald", "burger king", "subway", "kfc"] },
  { description: "coffee shop", category: "Restaurants", keywords: ["starbucks", "tim hortons", "coffee", "cafe"] },
  { description: "food delivery", category: "Restaurants", keywords: ["uber eats", "doordash", "skip dishes", "delivery"] },
  { description: "takeout", category: "Restaurants", keywords: ["takeout", "take-out", "pickup", "order"] },

  // Car
  { description: "gas station", category: "Car", keywords: ["gas", "fuel", "petrol", "gasoline"] },
  { description: "shell", category: "Car", keywords: ["shell", "esso", "petro-canada", "chevron"] },
  { description: "car insurance", category: "Car", keywords: ["auto insurance", "car insurance", "vehicle insurance"] },
  { description: "car repair", category: "Car", keywords: ["auto repair", "mechanic", "garage", "service"] },
  { description: "parking", category: "Car", keywords: ["parking", "meter", "garage parking", "lot"] },
  { description: "car wash", category: "Car", keywords: ["car wash", "auto wash", "detailing"] },

  // Entertainment
  { description: "movie theater", category: "Entertainment", keywords: ["cinema", "movie", "theater", "film"] },
  { description: "streaming service", category: "Entertainment", keywords: ["netflix", "spotify", "amazon prime", "disney"] },
  { description: "concert tickets", category: "Entertainment", keywords: ["concert", "show", "tickets", "event"] },
  { description: "gaming", category: "Entertainment", keywords: ["steam", "playstation", "xbox", "nintendo"] },
  { description: "books", category: "Entertainment", keywords: ["bookstore", "kindle", "chapters", "library"] },

  // Miscellaneous
  { description: "atm withdrawal", category: "Miscellaneous", keywords: ["atm", "cash", "withdrawal"] },
  { description: "bank fee", category: "Miscellaneous", keywords: ["fee", "charge", "service charge", "overdraft"] },
  { description: "transfer", category: "Miscellaneous", keywords: ["transfer", "e-transfer", "wire"] },
  { description: "pharmacy", category: "Miscellaneous", keywords: ["pharmacy", "drugstore", "prescription", "medical"] }
];

export class AIClassifier {
  private trainingData: TrainingData[];

  constructor() {
    this.trainingData = TRAINING_DATA;
  }

  /**
   * Classify a transaction description using keyword matching and fuzzy logic
   */
  classifyTransaction(description: string): ClassificationResult {
    const normalizedDesc = description.toLowerCase().trim();
    const words = normalizedDesc.split(/\s+/);
    
    const categoryScores = new Map<string, number>();
    const categoryReasons = new Map<string, string[]>();

    // Score each category based on keyword matches
    for (const training of this.trainingData) {
      const category = training.category;
      
      if (!categoryScores.has(category)) {
        categoryScores.set(category, 0);
        categoryReasons.set(category, []);
      }

      let score = 0;
      const reasons: string[] = [];

      // Exact phrase matching (higher weight)
      if (normalizedDesc.includes(training.description.toLowerCase())) {
        score += 0.9;
        reasons.push(`exact match: "${training.description}"`);
      }

      // Keyword matching
      for (const keyword of training.keywords) {
        if (normalizedDesc.includes(keyword.toLowerCase())) {
          score += 0.7;
          reasons.push(`keyword: "${keyword}"`);
        }
      }

      // Partial word matching (lower weight)
      for (const word of words) {
        for (const keyword of training.keywords) {
          if (keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())) {
            score += 0.3;
            reasons.push(`partial match: "${word}" ~ "${keyword}"`);
          }
        }
      }

      if (score > 0) {
        categoryScores.set(category, categoryScores.get(category)! + score);
        categoryReasons.get(category)!.push(...reasons);
      }
    }

    // Find the category with the highest score
    let bestCategory = 'Miscellaneous';
    let bestScore = 0;
    let bestReasons: string[] = [];

    for (const [category, score] of categoryScores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
        bestReasons = categoryReasons.get(category) || [];
      }
    }

    // Calculate confidence (normalize score to 0-1 range)
    const maxPossibleScore = 2.0; // Theoretical maximum score
    const confidence = Math.min(bestScore / maxPossibleScore, 1.0);
    
    // Ensure minimum confidence for good matches
    const finalConfidence = confidence > 0.5 ? 
      Math.max(confidence, 0.7) : 
      Math.max(confidence, 0.4);

    return {
      category: bestCategory,
      confidence: finalConfidence,
      reasoning: bestReasons.slice(0, 3).join(', ') // Limit reasoning length
    };
  }

  /**
   * Add new training data to improve classification
   */
  addTrainingData(data: TrainingData): void {
    this.trainingData.push(data);
  }

  /**
   * Get suggestions for improving classification of a specific description
   */
  getSuggestions(description: string): string[] {
    const result = this.classifyTransaction(description);
    const suggestions: string[] = [];

    if (result.confidence < 0.6) {
      suggestions.push("Consider adding more specific keywords for better classification");
    }

    if (result.confidence < 0.4) {
      suggestions.push("This transaction might need manual categorization");
    }

    return suggestions;
  }

  /**
   * Batch classify multiple transactions
   */
  classifyBatch(descriptions: string[]): ClassificationResult[] {
    return descriptions.map(desc => this.classifyTransaction(desc));
  }
}

// Export a singleton instance
export const aiClassifier = new AIClassifier();