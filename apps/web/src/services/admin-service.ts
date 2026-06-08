import { api } from '../lib/api';

export const adminService = {
  getMetrics: async () => {
    const response = await api.get('/admin/metrics');
    return response.data;
  },

  getOrganizations: async () => {
    const response = await api.get('/admin/organizations');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  }
};
