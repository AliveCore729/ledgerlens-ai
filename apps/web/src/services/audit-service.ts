import { api } from "../lib/api";

export const auditService = {
  getLogs: async () => {
    const response = await api.get("/audit");
    return response.data;
  },
};
