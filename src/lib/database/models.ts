// src/lib/database/models.ts

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankStatement {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  totalTransactions: number;
  totalAmount: number;
}

export interface TransactionRecord {
  id: string;
  bankStatementId: string;
  date: Date;
  description: string;
  originalDescription: string;
  amount: number;
  category: string;
  originalCategory?: string;
  confidence: number;
  isManuallyEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  userId?: string; // null for system categories
  createdAt: Date;
}

export interface ProcessingJob {
  id: string;
  userId: string;
  bankStatementId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  defaultCategories: string[];
  autoClassificationEnabled: boolean;
  confidenceThreshold: number;
  notificationsEnabled: boolean;
  exportFormat: 'csv' | 'json' | 'excel';
  updatedAt: Date;
}

// Database interface (for future implementation)
export interface DatabaseAdapter {
  // Users
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Bank Statements
  createBankStatement(statement: Omit<BankStatement, 'id' | 'uploadedAt'>): Promise<BankStatement>;
  getBankStatementById(id: string): Promise<BankStatement | null>;
  getBankStatementsByUserId(userId: string): Promise<BankStatement[]>;
  updateBankStatement(id: string, updates: Partial<BankStatement>): Promise<BankStatement>;
  deleteBankStatement(id: string): Promise<void>;
  
  // Transactions
  createTransaction(transaction: Omit<TransactionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransactionRecord>;
  createTransactionsBatch(transactions: Omit<TransactionRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TransactionRecord[]>;
  getTransactionById(id: string): Promise<TransactionRecord | null>;
  getTransactionsByBankStatementId(bankStatementId: string): Promise<TransactionRecord[]>;
  getTransactionsByUserId(userId: string, filters?: TransactionFilters): Promise<TransactionRecord[]>;
  updateTransaction(id: string, updates: Partial<TransactionRecord>): Promise<TransactionRecord>;
  deleteTransaction(id: string): Promise<void>;
  
  // Categories
  getCategories(userId?: string): Promise<Category[]>;
  createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Processing Jobs
  createProcessingJob(job: Omit<ProcessingJob, 'id'>): Promise<ProcessingJob>;
  getProcessingJobById(id: string): Promise<ProcessingJob | null>;
  updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  categoryBreakdown: Record<string, {
    count: number;
    amount: number;
    percentage: number;
  }>;
  monthlyBreakdown: Record<string, number>;
  averageTransaction: number;
}

// Mock implementation for development
export class MockDatabase implements DatabaseAdapter {
  private users: User[] = [];
  private bankStatements: BankStatement[] = [];
  private transactions: TransactionRecord[] = [];
  private categories: Category[] = [
    {
      id: '1',
      name: 'Living Expenses',
      color: '#3B82F6',
      isDefault: true,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Groceries',
      color: '#10B981',
      isDefault: true,
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Restaurants',
      color: '#F59E0B',
      isDefault: true,
      createdAt: new Date()
    },
    {
      id: '4',
      name: 'Car',
      color: '#8B5CF6',
      isDefault: true,
      createdAt: new Date()
    },
    {
      id: '5',
      name: 'Entertainment',
      color: '#EC4899',
      isDefault: true,
      createdAt: new Date()
    },
    {
      id: '6',
      name: 'Miscellaneous',
      color: '#6B7280',
      isDefault: true,
      createdAt: new Date()
    }
  ];
  private processingJobs: ProcessingJob[] = [];
  private userPreferences: UserPreferences[] = [];

  // Users
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.users[userIndex];
  }

  // Bank Statements
  async createBankStatement(statement: Omit<BankStatement, 'id' | 'uploadedAt'>): Promise<BankStatement> {
    const newStatement: BankStatement = {
      ...statement,
      id: Date.now().toString(),
      uploadedAt: new Date()
    };
    this.bankStatements.push(newStatement);
    return newStatement;
  }

  async getBankStatementById(id: string): Promise<BankStatement | null> {
    return this.bankStatements.find(s => s.id === id) || null;
  }

  async getBankStatementsByUserId(userId: string): Promise<BankStatement[]> {
    return this.bankStatements.filter(s => s.userId === userId);
  }

  async updateBankStatement(id: string, updates: Partial<BankStatement>): Promise<BankStatement> {
    const statementIndex = this.bankStatements.findIndex(s => s.id === id);
    if (statementIndex === -1) throw new Error('Bank statement not found');
    
    this.bankStatements[statementIndex] = {
      ...this.bankStatements[statementIndex],
      ...updates
    };
    return this.bankStatements[statementIndex];
  }

  async deleteBankStatement(id: string): Promise<void> {
    this.bankStatements = this.bankStatements.filter(s => s.id !== id);
    this.transactions = this.transactions.filter(t => t.bankStatementId !== id);
  }

  // Transactions
  async createTransaction(transaction: Omit<TransactionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransactionRecord> {
    const newTransaction: TransactionRecord = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async createTransactionsBatch(transactions: Omit<TransactionRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TransactionRecord[]> {
    const newTransactions = transactions.map((t, index) => ({
      ...t,
      id: (Date.now() + index).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    this.transactions.push(...newTransactions);
    return newTransactions;
  }

  async getTransactionById(id: string): Promise<TransactionRecord | null> {
    return this.transactions.find(t => t.id === id) || null;
  }

  async getTransactionsByBankStatementId(bankStatementId: string): Promise<TransactionRecord[]> {
    return this.transactions.filter(t => t.bankStatementId === bankStatementId);
  }

  async getTransactionsByUserId(userId: string, filters?: TransactionFilters): Promise<TransactionRecord[]> {
    const userStatements = await this.getBankStatementsByUserId(userId);
    const statementIds = userStatements.map(s => s.id);
    
    let userTransactions = this.transactions.filter(t => statementIds.includes(t.bankStatementId));
    
    if (filters) {
      if (filters.startDate) {
        userTransactions = userTransactions.filter(t => t.date >= filters.startDate!);
      }
      if (filters.endDate) {
        userTransactions = userTransactions.filter(t => t.date <= filters.endDate!);
      }
      if (filters.categories?.length) {
        userTransactions = userTransactions.filter(t => filters.categories!.includes(t.category));
      }
      if (filters.minAmount !== undefined) {
        userTransactions = userTransactions.filter(t => t.amount >= filters.minAmount!);
      }
      if (filters.maxAmount !== undefined) {
        userTransactions = userTransactions.filter(t => t.amount <= filters.maxAmount!);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        userTransactions = userTransactions.filter(t => 
          t.description.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term)
        );
      }
      if (filters.limit) {
        userTransactions = userTransactions.slice(filters.offset || 0, (filters.offset || 0) + filters.limit);
      }
    }
    
    return userTransactions;
  }

  async updateTransaction(id: string, updates: Partial<TransactionRecord>): Promise<TransactionRecord> {
    const transactionIndex = this.transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) throw new Error('Transaction not found');
    
    this.transactions[transactionIndex] = {
      ...this.transactions[transactionIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.transactions[transactionIndex];
  }

  async deleteTransaction(id: string): Promise<void> {
    this.transactions = this.transactions.filter(t => t.id !== id);
  }

  // Categories
  async getCategories(userId?: string): Promise<Category[]> {
    return this.categories.filter(c => c.isDefault || c.userId === userId);
  }

  async createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const categoryIndex = this.categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) throw new Error('Category not found');
    
    this.categories[categoryIndex] = {
      ...this.categories[categoryIndex],
      ...updates
    };
    return this.categories[categoryIndex];
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories = this.categories.filter(c => c.id !== id);
  }

  // Processing Jobs
  async createProcessingJob(job: Omit<ProcessingJob, 'id'>): Promise<ProcessingJob> {
    const newJob: ProcessingJob = {
      ...job,
      id: Date.now().toString()
    };
    this.processingJobs.push(newJob);
    return newJob;
  }

  async getProcessingJobById(id: string): Promise<ProcessingJob | null> {
    return this.processingJobs.find(j => j.id === id) || null;
  }

  async updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob> {
    const jobIndex = this.processingJobs.findIndex(j => j.id === id);
    if (jobIndex === -1) throw new Error('Processing job not found');
    
    this.processingJobs[jobIndex] = {
      ...this.processingJobs[jobIndex],
      ...updates
    };
    return this.processingJobs[jobIndex];
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return this.userPreferences.find(p => p.userId === userId) || null;
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const existingIndex = this.userPreferences.findIndex(p => p.userId === userId);
    
    if (existingIndex === -1) {
      const newPreferences: UserPreferences = {
        id: Date.now().toString(),
        userId,
        defaultCategories: ['Living Expenses', 'Groceries', 'Restaurants', 'Car', 'Entertainment', 'Miscellaneous'],
        autoClassificationEnabled: true,
        confidenceThreshold: 0.7,
        notificationsEnabled: true,
        exportFormat: 'csv',
        updatedAt: new Date(),
        ...preferences
      };
      this.userPreferences.push(newPreferences);
      return newPreferences;
    }
    
    this.userPreferences[existingIndex] = {
      ...this.userPreferences[existingIndex],
      ...preferences,
      updatedAt: new Date()
    };
    return this.userPreferences[existingIndex];
  }
}

// Export singleton instance
export const mockDb = new MockDatabase();