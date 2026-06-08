import { api } from "../lib/api";

export const settingsService = {
  updateProfile: async (data: { firstName: string; lastName: string }) => {
    const response = await api.patch("/users/profile", data);
    return response.data;
  },
  
  updateWorkspace: async (data: { name: string }) => {
    const response = await api.patch("/team/organization", data);
    return response.data;
  },
};
