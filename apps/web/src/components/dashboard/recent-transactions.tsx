'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  date: string;
  time: string | null;
  narration: string;
  vendor: string | null;
  amount: number;
  type: 'CR' | 'DR';
  category: string;
}

interface RecentTransactionsProps {
  data?: Transaction[];
  isLoading: boolean;
}

export default function RecentTransactions({ data, isLoading }: RecentTransactionsProps) {
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Transactions
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="hidden md:flex">
          <Link href="/dashboard/transactions">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Narration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading State: 5 Skeleton Rows
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !data || data.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No recent transactions found. Upload a statement to get started.
                </TableCell>
              </TableRow>
            ) : (
              // Data State
              data.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {tx.date && !isNaN(new Date(tx.date).getTime())
                      ? format(new Date(tx.date), 'dd MMM yyyy')
                      : tx.date || 'Unknown'}
                  </TableCell>
                  <TableCell className="max-w-50 truncate" title={tx.narration}>
                    {tx.vendor || tx.narration}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={tx.type === 'CR' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-red-500 text-red-600 bg-red-50'}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">
                      {tx.category ? tx.category.charAt(0).toUpperCase() + tx.category.slice(1).toLowerCase() : 'Uncategorized'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${tx.type === 'CR' ? 'text-emerald-500' : 'text-foreground'}`}>
                    {tx.type === 'CR' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="mt-4 flex justify-center md:hidden">
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/dashboard/transactions">View All Transactions</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}