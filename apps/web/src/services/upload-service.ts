import { api } from "@/lib/api";

export const uploadService = {
  async uploadStatement(
    file: File, 
    onUploadProgress?: (progressEvent: any) => void
  ) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post("/uploads/statement", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });

    return response.data;
  },

  async checkStatus(statementId: string) {
    const response = await api.get(`/statements/${statementId}`);
    return response.data;
  }
};