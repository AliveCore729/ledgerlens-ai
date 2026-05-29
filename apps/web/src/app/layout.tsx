import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import QueryProvider from '@/providers/query-provider'; // <-- 1. Import the provider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LedgerLens AI',
  description: 'Enterprise fintech SaaS for bank statement analysis',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {/* 2. Wrap children and Toaster with the QueryProvider */}
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" /> 
        </QueryProvider>
      </body>
    </html>
  );
}