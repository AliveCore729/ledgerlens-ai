import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import QueryProvider from '@/providers/query-provider';

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
        {/* 2. Wrap children and Toaster with the QueryProvider */}
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" /> 
        </QueryProvider>
      </body>
    </html>
  );
}