import { api } from "@/lib/api";

export const authService = {
  async login(data: {
    email: string;

    password: string;
  }) {
    const response =
      await api.post(
        "/auth/login",
        data,
      );

    return response.data;
  },

  async register(data: {
    email: string;

    password: string;
  }) {
    const response =
      await api.post(
        "/auth/register",
        data,
      );

    return response.data;
  },
};