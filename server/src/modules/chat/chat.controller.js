const chatService = require("./chat.service");

/**
 * Get logged-in user's chat history
 */
const getMyChats = async (req, res, next) => {
  try {
    const chats = await chatService.getUserChats(req.user.id);

    res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyChats,
};