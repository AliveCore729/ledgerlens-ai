import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'CR' | 'DR' | 'All';
  category?: string;
  search?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  statementId?: string | null;
  minAmount?: string;
  maxAmount?: string;
  needsReview?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  time: string | null;
  narration: string;
  vendor: string | null;
  amount: number;
  type: 'CR' | 'DR';
  category: string;
  subcategory: string | null;
  confidence: number;
  needsReview: boolean;
  statementId: string;
}

interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useTransactions = (filters: TransactionFilters, isProcessing?: boolean) => {
  return useQuery<TransactionsResponse>({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      // Clean up filters to remove empty strings, 'All', or null IDs
      const cleanFilters = { ...filters };
      if (cleanFilters.type === 'All') delete cleanFilters.type;
      if (cleanFilters.category === 'All Categories') delete cleanFilters.category;
      if (!cleanFilters.search) delete cleanFilters.search;
      if (!cleanFilters.startDate) delete cleanFilters.startDate;
      if (!cleanFilters.endDate) delete cleanFilters.endDate;
      if (!cleanFilters.minAmount) delete cleanFilters.minAmount;
      if (!cleanFilters.maxAmount) delete cleanFilters.maxAmount;
      if (cleanFilters.needsReview === false) delete cleanFilters.needsReview;
      
      // 🔥 The Fix: Ensure null/empty statement IDs aren't sent to the backend
      if (!cleanFilters.statementId || cleanFilters.statementId === 'null') {
        delete cleanFilters.statementId;
      }

      const { data } = await api.get('/transactions', { params: cleanFilters });
      return data;
    },
    refetchInterval: isProcessing ? 3000 : false,
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const { data } = await api.patch(`/transactions/${id}/category`, { category });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] }); // Keep dashboard in sync
    },
  });
};

export const useBulkUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, category }: { ids: string[]; category: string }) => {
      // Execute sequentially or via a new bulk endpoint if it existed.
      // Assuming no bulk endpoint exists in API yet, we can map over patch requests
      await Promise.all(
        ids.map((id) => api.patch(`/transactions/${id}/category`, { category }))
      );
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const exportTransactions = async (filters: TransactionFilters) => {
  const cleanFilters = { ...filters };
  if (cleanFilters.type === 'All') delete cleanFilters.type;
  if (cleanFilters.category === 'All Categories') delete cleanFilters.category;
  if (!cleanFilters.search) delete cleanFilters.search;
  if (!cleanFilters.startDate) delete cleanFilters.startDate;
  if (!cleanFilters.endDate) delete cleanFilters.endDate;
  if (!cleanFilters.minAmount) delete cleanFilters.minAmount;
  if (!cleanFilters.maxAmount) delete cleanFilters.maxAmount;
  if (cleanFilters.needsReview === false) delete cleanFilters.needsReview;
  if (!cleanFilters.statementId || cleanFilters.statementId === 'null') {
    delete cleanFilters.statementId;
  }
  
  const response = await api.get('/transactions/export', {
    params: cleanFilters,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'transactions.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const useTransactionsReview = () => {
  return useQuery<Transaction[]>({
    queryKey: ['transactions-review'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/review');
      return data;
    },
  });
};

export interface CategorizationSummary {
  category: string;
  totalSpend: number;
  transactionCount: number;
  transactions: Transaction[];
}

export const useCategorizationSummary = () => {
  return useQuery<CategorizationSummary[]>({
    queryKey: ['categorization-summary'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/categorization-summary');
      return data;
    },
  });
};

export const useReviewTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, category }: { id: string; category?: string }) => {
      const { data } = await api.patch(`/transactions/${id}/review`, { category });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-review'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useBulkReviewTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      const { data } = await api.post('/transactions/bulk-review', { ids });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-review'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};