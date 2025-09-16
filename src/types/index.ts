// src/types/index.ts

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
}

export interface ProcessedData {
  fileName: string;
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

export type CategoryType = 
  | 'Living Expenses'
  | 'Groceries'
  | 'Restaurants'
  | 'Car'
  | 'Entertainment'
  | 'Miscellaneous';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

export interface ApiError {
  error: string;
  details?: string;
}