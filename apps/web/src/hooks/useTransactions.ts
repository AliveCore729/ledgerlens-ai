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
}

export interface Transaction {
  id: string;
  date: string;
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

export const exportTransactions = async (filters: TransactionFilters) => {
  const cleanFilters = { ...filters };
  if (cleanFilters.type === 'All') delete cleanFilters.type;
  if (cleanFilters.category === 'All Categories') delete cleanFilters.category;
  if (!cleanFilters.search) delete cleanFilters.search;
  if (!cleanFilters.startDate) delete cleanFilters.startDate;
  if (!cleanFilters.endDate) delete cleanFilters.endDate;
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