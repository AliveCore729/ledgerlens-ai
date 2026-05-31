'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Download, Search, X, Edit2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { useStatements } from '@/hooks/useStatements';
import { useTransactions, useUpdateCategory, exportTransactions, TransactionFilters } from '@/hooks/useTransactions';
import TransactionRowSkeleton from '@/components/dashboard/transaction-row-skeleton';
import { formatCurrency } from '@/lib/utils';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const CATEGORIES = [
  "Income", "Food & Dining", "Travel & Transportation", 
  "Software & Subscriptions", "Utilities & Bills", "Rent & Housing", 
  "Salary & Payroll", "Office Supplies", "Marketing & Advertising", 
  "Bank Fees & Charges", "Transfers & Investments", "Healthcare & Insurance", 
  "Shopping & Retail", "Entertainment & Leisure", "Taxes & Fines", "Misc"
];

const CATEGORY_COLORS: Record<string, string> = {
  "Income": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Food & Dining": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  "Travel & Transportation": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Software & Subscriptions": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "Utilities & Bills": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Rent & Housing": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Salary & Payroll": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Office Supplies": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Marketing & Advertising": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "Bank Fees & Charges": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Transfers & Investments": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Healthcare & Insurance": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  "Shopping & Retail": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
  "Entertainment & Leisure": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  "Taxes & Fines": "bg-slate-700 text-slate-100 dark:bg-slate-300 dark:text-slate-900",
  "Misc": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
};

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const statementId = searchParams.get('statementId');
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
    type: 'All',
    category: 'All Categories',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
    statementId: statementId
  });

  const [searchInput, setSearchInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: statements } = useStatements();
  const isProcessing = statements?.some((s) => s.status === 'PROCESSING' || s.status === 'PENDING');

  const { data, isLoading, isError, isFetching } = useTransactions(filters, isProcessing);
  const { mutate: updateCategory } = useUpdateCategory();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.type !== 'All' ||
      filters.category !== 'All Categories' ||
      filters.search !== '' ||
      filters.startDate !== '' ||
      filters.endDate !== ''
    );
  }, [filters]);

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: filters.limit,
      type: 'All',
      category: 'All Categories',
      search: '',
      sortBy: 'date',
      sortOrder: 'desc',
      startDate: '',
      endDate: '',
    });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportTransactions(filters);
      toast.success('Export successful');
    } catch (error) {
      toast.error('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCategoryUpdate = (id: string, newCategory: string) => {
    updateCategory(
      { id, category: newCategory },
      {
        onSuccess: () => {
          toast.success('Category updated successfully');
          setEditingId(null);
        },
        onError: () => {
          toast.error('Failed to update category');
        },
      }
    );
  };

  // Compute summary stats for current page
  const summary = useMemo(() => {
    if (!data?.data) return { credits: 0, debits: 0 };
    return data.data.reduce(
      (acc, tx) => {
        if (tx.type === 'CR') acc.credits += tx.amount;
        if (tx.type === 'DR') acc.debits += tx.amount;
        return acc;
      },
      { credits: 0, debits: 0 }
    );
  }, [data]);

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-background text-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">View, filter, and categorize your ledger entries.</p>
      </div>

      {isProcessing && (
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="font-medium">Our AI is currently extracting transactions from your statement. They will appear here automatically when ready...</p>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search narration or vendor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.type}
            onValueChange={(val: any) => setFilters((f) => ({ ...f, type: val, page: 1 }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="CR">Credit (CR)</SelectItem>
              <SelectItem value="DR">Debit (DR)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category}
            onValueChange={(val) => setFilters((f) => ({ ...f, category: val, page: 1 }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Categories">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 items-center">
            <Input
              type="date"
              className="w-full"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value, page: 1 }))}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="date"
              className="w-full"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value, page: 1 }))}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <div>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-sm h-8 px-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" /> Clear filters
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || isLoading}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* SUMMARY ROW */}
      {!isLoading && !isError && data && (
        <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
          <p>
            Showing {data.data.length} of {data.total} transactions
            {isFetching && <span className="ml-2 text-primary animate-pulse">Updating...</span>}
          </p>
          <div className="flex gap-4">
            <span>Total credits: <strong className="text-emerald-500 font-medium">{formatCurrency(summary.credits)}</strong></span>
            <span>Total debits: <strong className="text-red-500 font-medium">{formatCurrency(summary.debits)}</strong></span>
          </div>
        </div>
      )}

      {/* TRANSACTIONS TABLE */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-30">Date</TableHead>
                <TableHead className="min-w-75">Narration</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="w-15"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => <TransactionRowSkeleton key={i} />)
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-destructive">
                    Failed to load transactions. Please try again.
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                    {hasActiveFilters ? (
                      <div className="flex flex-col items-center gap-2">
                        <p>No transactions match your filters.</p>
                        <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                      </div>
                    ) : (
                      <p>No transactions found. Upload a statement to get started.</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>
                          {tx.date && !isNaN(new Date(tx.date).getTime())
                            ? format(new Date(tx.date), 'dd MMM yyyy')
                            : tx.date || 'Unknown'}
                        </span>
                        {tx.time && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {tx.time}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="text-left cursor-help truncate max-w-70 block">
                            {tx.narration.length > 35 ? `${tx.narration.substring(0, 35)}...` : tx.narration}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{tx.narration}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                    <TableCell>
                      {tx.vendor ? <Badge variant="secondary">{tx.vendor}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={tx.type === 'CR' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30'}>
                        {tx.type}
                      </Badge>
                    </TableCell>

                    <TableCell className={`text-right font-semibold ${tx.type === 'CR' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type === 'CR' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>

                    <TableCell>
                      {editingId === tx.id ? (
                        <Select
                          defaultValue={tx.category}
                          onValueChange={(val) => handleCategoryUpdate(tx.id, val)}
                          onOpenChange={(open) => !open && setEditingId(null)}
                        >
                          <SelectTrigger className="w-35 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`border-none ${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Misc}`}>
                          {tx.category}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-medium ${tx.confidence >= 0.9 ? 'text-emerald-500' :
                            tx.confidence >= 0.7 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                          {Math.round(tx.confidence * 100)}%
                        </span>
                        {tx.confidence < 0.7 && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingId(tx.id)}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* PAGINATION */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Rows per page</p>
            <Select
              value={filters.limit?.toString()}
              onValueChange={(val) => setFilters((f) => ({ ...f, limit: Number(val), page: 1 }))}
            >
              <SelectTrigger className="w-17.5 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <span>Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                disabled={data.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setFilters((f) => ({ ...f, page: Math.min(data.totalPages, (f.page || 1) + 1) }))}
                disabled={data.page === data.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}