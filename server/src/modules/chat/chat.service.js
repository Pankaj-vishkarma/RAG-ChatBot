const Chat = require("./chat.model");

/**
 * Save chat
 */
const saveChat = async (data) => {
  return await Chat.create(data);
};

/**
 * Get user chat history
 */
const getUserChats = async (userId) => {
  return await Chat.find({ userId }).sort({ createdAt: -1 });
};

module.exports = {
  saveChat,
  getUserChats,
};