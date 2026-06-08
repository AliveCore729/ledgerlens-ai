import { api } from "@/lib/api";

export const authService = {
  async google(credential: string) {
    const response = await api.post("/auth/google", { credential });
    return response.data;
  },
};