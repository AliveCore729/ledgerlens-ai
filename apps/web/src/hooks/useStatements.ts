import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
  });
};