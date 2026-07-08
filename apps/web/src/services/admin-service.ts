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
  },

  activateSubscription: async (orgId: string, paymentReference?: string) => {
    // Expires 1 month from now by default
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    const response = await api.patch(`/admin/organizations/${orgId}/activate-subscription`, {
      paymentReference: paymentReference || 'Manual',
      expiresAt: expiresAt.toISOString()
    });
    return response.data;
  },

  getMaintenanceMode: async () => {
    const response = await api.get('/admin/settings/maintenance');
    return response.data;
  },

  setMaintenanceMode: async (enabled: boolean) => {
    const response = await api.post('/admin/settings/maintenance', { enabled });
    return response.data;
  }
};
