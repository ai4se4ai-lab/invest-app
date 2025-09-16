// src/utils/csvExporter.ts
import { Transaction } from '@/types';

export function exportToCSV(transactions: Transaction[], filename: string = 'transactions.csv'): void {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Confidence'];
  
  const csvContent = [
    headers.join(','),
    ...transactions.map(transaction => [
      transaction.date,
      `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes in description
      transaction.amount.toFixed(2),
      transaction.category,
      (transaction.confidence * 100).toFixed(1) + '%'
    ].join(','))
  ].join('\n');

  downloadCSV(csvContent, filename);
}

export function exportSummaryToCSV(summary: Record<string, number>, filename: string = 'summary.csv'): void {
  const headers = ['Category', 'Total Amount'];
  
  const csvContent = [
    headers.join(','),
    ...Object.entries(summary).map(([category, amount]) => [
      category,
      amount.toFixed(2)
    ].join(','))
  ].join('\n');

  downloadCSV(csvContent, filename);
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}