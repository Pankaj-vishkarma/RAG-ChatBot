const express = require("express");
const axios = require("axios");
const authMiddleware = require("../../middleware/auth.middleware");
const { askQuestion } = require("./rag.service");
const { retrieveRelevantChunks } = require("./retrieval.service");
const { buildPrompt } = require("./prompt.service");
const {
  saveMessage,
  getConversationMessages,
} = require("../message/message.service");
const {
  updateConversationTitle,
} = require("../conversation/conversation.service");
const Conversation = require("../conversation/conversation.model");

const router = express.Router();

/* ===========================
   STREAMING (ChatGPT Style)
=========================== */
router.post("/stream", authMiddleware, async (req, res) => {
  try {
    const { question, conversationId } = req.body;

    if (!question || !conversationId) {
      return res.status(400).json({
        success: false,
        message: "Question and conversationId required",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // 🔹 Setup SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    req.on("close", () => {
      console.log("Client disconnected from stream");
    });

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    /* 1️⃣ Save User Message */
    await saveMessage({
      conversationId,
      role: "user",
      content: question,
    });

    const previousMessages =
      await getConversationMessages(conversationId);

    /* 2️⃣ Title Generation (NO AI CALL – Production Safe) */
    if (
      previousMessages.length === 1 &&
      conversation.title === "New Chat"
    ) {
      const newTitle = question
        .split(" ")
        .slice(0, 6)
        .join(" ")
        .slice(0, 40);

      await updateConversationTitle(conversationId, newTitle);
    }

    /* 3️⃣ Retrieve RAG Context */
    const retrievedChunks =
      await retrieveRelevantChunks(question, conversationId, 5);

    const conversationHistory = previousMessages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");

    const prompt = buildPrompt({
      question,
      retrievedChunks,
      conversationHistory,
    });

    /* 4️⃣ Gemini Call */
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        timeout: 60000
      }
    );

    let fullText = "";

    for (const chunk of response.data || []) {
      const text =
        chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (text) {
        fullText += text;
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
    }

    /* 5️⃣ Save Assistant Message */
    if (fullText.trim()) {
      try {
        await saveMessage({
          conversationId,
          role: "assistant",
          content: fullText,
          sources: retrievedChunks.map((c) => c.text),
        });
      } catch (err) {
        console.error("Message save failed:", err.message);
      }
    }

    if (!res.writableEnded) {
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  } catch (error) {

    /* 🔥 RATE LIMIT HANDLING */
    if (error.response?.status === 429) {
      if (!res.writableEnded) {

        res.write(
          `data: ${JSON.stringify({
            text: "⚠️ Server busy. Please try again in a few seconds.",
          })}\n\n`
        );

        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    }

    console.error("Streaming error:", error);

    if (!res.writableEnded) {

      res.write(
        `data: ${JSON.stringify({
          text: "⚠️ Something went wrong. Please try again.",
        })}\n\n`
      );

      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

module.exports = router;