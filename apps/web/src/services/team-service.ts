import { api } from '../lib/api';

export const teamService = {
  getTeam: async () => {
    const response = await api.get('/team');
    return response.data;
  },

  inviteMember: async (email: string, role: string) => {
    const response = await api.post('/team/invite', { email, role });
    return response.data;
  }
};
