// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AppProvider from '@/components/providers/AppProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Expense Tracker - Smart Bank Statement Processing',
  description: 'Transform your bank statements into organized expense reports with AI-powered categorization.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}