import { api } from "@/lib/axios";

export const uploadService = {
  async uploadStatement(file: File) {
    const formData = new FormData();

    formData.append("file", file);

    const response =
      await api.post(
        "/uploads/statement",
        formData,
      );

    return response.data;
  },
};