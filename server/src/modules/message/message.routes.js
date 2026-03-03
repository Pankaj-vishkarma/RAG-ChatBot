const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const {
  getConversationMessages,
} = require("./message.service");

const router = express.Router();

// Get messages of a conversation
router.get("/:conversationId", authMiddleware, async (req, res, next) => {
  try {
    const messages = await getConversationMessages(
      req.params.conversationId
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;