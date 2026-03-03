const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const chatController = require("./chat.controller");

const router = express.Router();

/**
 * GET /api/chat/my
 */
router.get("/my", authMiddleware, chatController.getMyChats);

module.exports = router;