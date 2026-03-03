import axiosInstance from "./axiosInstance";

export const askQuestion = (data) => {
  return axiosInstance.post("/rag/ask", data);
};