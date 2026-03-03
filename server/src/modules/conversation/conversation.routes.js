const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const {
  createConversation,
  getUserConversations,
  deleteConversation,
} = require("./conversation.service");

const router = express.Router();

// Create new conversation
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const conversation = await createConversation(req.user.id);

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
});

// Get user conversations
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const conversations = await getUserConversations(req.user.id);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
});

// Delete conversation
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    await deleteConversation(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: "Conversation deleted",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;