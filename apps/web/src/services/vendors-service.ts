import { api } from '../lib/api';

export const vendorsService = {
  getVendors: async () => {
    const response = await api.get('/vendors');
    return response.data;
  },

  updateCategory: async (vendorId: string, category: string) => {
    const response = await api.patch(`/vendors/${vendorId}/category`, { category });
    return response.data;
  }
};
