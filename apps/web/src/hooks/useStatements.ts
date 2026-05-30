import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface Statement {
  id: string;
  originalName: string;
  filename: string;
  status: string;
  uploadedAt: string;
  _count: {
    transactions: number;
  };
}

export const useStatements = () => {
  return useQuery<Statement[]>({
    queryKey: ['statements'],
    queryFn: async () => {
      const { data } = await api.get('/statements');
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.some((s) => s.status === 'PROCESSING' || s.status === 'PENDING')) {
        return 3000;
      }
      return false;
    },
  });
};

export const useDeleteStatement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statementId: string) => {
      await api.delete(`/statements/${statementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Statement deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete statement:', error);
      toast.error('Failed to delete statement');
    },
  });
};