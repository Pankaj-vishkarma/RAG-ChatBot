const express = require("express");
const { askQuestion } = require("./rag.service");
const authMiddleware = require("../../middleware/auth.middleware");
const chatService = require("../chat/chat.service");

const router = express.Router();

/**
 * @route   POST /api/rag/ask
 * @desc    Ask question to RAG system
 * @access  Private
 */
router.post("/ask", authMiddleware, async (req, res, next) => {
  try {
    const { question, conversationId } = req.body;

    // ✅ Validate question
    if (!question || typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Valid question is required",
      });
    }

    // ✅ Validate conversationId
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "conversationId is required",
      });
    }

    // ✅ Call RAG service with proper params
    const result = await askQuestion(
      question.trim(),
      conversationId
    );

    // ✅ Safety check
    if (!result || !result.answer) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate answer",
      });
    }

    // 🔥 Save chat in DB (conversation based)
    await chatService.saveChat({
      userId: req.user.id,
      conversationId,
      question: question.trim(),
      answer: result.answer,
      sources: result.sources || [],
    });

    // ✅ Send response
    return res.status(200).json({
      success: true,
      data: {
        answer: result.answer,
        sources: result.sources || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;