import axiosInstance from "./axiosInstance";

/**
 * Create new conversation
 */
export const createConversation = async () => {
  return await axiosInstance.post("/conversations");
};

/**
 * Get all conversations of logged-in user
 */
export const getUserConversations = async () => {
  return await axiosInstance.get("/conversations");
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId) => {
  return await axiosInstance.delete(`/conversations/${conversationId}`);
};