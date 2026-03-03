import axiosInstance from "./axiosInstance";

export const uploadDocument = (formData) => {
  return axiosInstance.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};