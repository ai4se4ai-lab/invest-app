// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'INVEST - Bank Statement Processor',
  description: 'Intelligent bank statement processor with automated transaction categorization and spending analysis.',
  keywords: ['bank statement', 'transaction analysis', 'financial insights', 'expense categorization'],
  authors: [{ name: 'INVEST Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}