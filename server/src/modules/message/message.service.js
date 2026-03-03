const Message = require("./message.model");

const saveMessage = async (data) => {
  return await Message.create(data);
};

const getConversationMessages = async (conversationId) => {
  return await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();
};

module.exports = {
  saveMessage,
  getConversationMessages,
};