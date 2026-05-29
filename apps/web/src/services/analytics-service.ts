import { api } from "@/lib/axios";

export const analyticsService = {
  async getSummary() {
    const response =
      await api.get(
        "/analytics/summary",
      );

    return response.data;
  },
};