const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const documentRoutes = require("../modules/document/document.routes");
const ragRoutes = require("../modules/rag/rag.routes");
const chatRoutes = require("../modules/chat/chat.routes");
const conversationRoutes = require("../modules/conversation/conversation.routes");
const messageRoutes = require("../modules/message/message.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/messages", messageRoutes);
router.use("/conversations", conversationRoutes);
router.use("/rag", ragRoutes);
router.use("/chat", chatRoutes);

module.exports = router;