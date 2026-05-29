import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Accept an optional statementId parameter
export const useAnalytics = (statementId?: string | null) => {
  return useQuery({
    // Add statementId to the queryKey so it refetches when the ID changes
    queryKey: ['analytics', statementId],
    queryFn: async () => {
      // Pass the ID to the NestJS backend as a query parameter
      const params = statementId ? { statementId } : {};
      const { data } = await api.get('/analytics/summary', { params });
      return data;
    },
    staleTime: 30000,
  });
};