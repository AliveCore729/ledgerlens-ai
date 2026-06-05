import { api } from '../lib/api';

export const billingService = {
  getSubscription: async () => {
    const response = await api.get('/billing/subscription');
    return response.data;
  }
};
