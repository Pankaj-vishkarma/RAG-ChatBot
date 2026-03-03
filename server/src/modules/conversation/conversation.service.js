const mongoose = require("mongoose");
const Conversation = require("./conversation.model");
const Message = require("../message/message.model");
const Document = require("../document/document.model");
const Vector = require("../rag/vector.model");
const fs = require("fs");
const path = require("path");

/* ================= CREATE CONVERSATION ================= */
const createConversation = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw { status: 400, message: "Invalid userId" };
  }

  return await Conversation.create({ userId });
};

/* ================= GET USER CONVERSATIONS ================= */
const getUserConversations = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw { status: 400, message: "Invalid userId" };
  }

  return await Conversation.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
};

/* ================= DELETE CONVERSATION (TRANSACTION SAFE) ================= */
const deleteConversation = async (conversationId, userId) => {
  if (
    !mongoose.Types.ObjectId.isValid(conversationId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    throw { status: 400, message: "Invalid ID format" };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    }).session(session);

    if (!conversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    const documents = await Document.find({
      conversationId,
    }).session(session);

    // Delete files from disk
    for (const doc of documents) {
      const filePath = path.join(
        __dirname,
        "../../uploads",
        doc.fileName
      );

      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("File deletion error:", err.message);
      }
    }

    await Vector.deleteMany({ conversationId }).session(session);
    await Document.deleteMany({ conversationId }).session(session);
    await Message.deleteMany({ conversationId }).session(session);
    await Conversation.deleteOne({ _id: conversationId }).session(session);

    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/* ================= UPDATE TITLE ================= */
const updateConversationTitle = async (conversationId, title) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw { status: 400, message: "Invalid conversationId" };
  }

  if (!title || typeof title !== "string") {
    return null; // silently ignore bad titles
  }

  const cleanTitle = title.trim().slice(0, 50);

  return await Conversation.findByIdAndUpdate(
    conversationId,
    { 
      title: cleanTitle,
      updatedAt: new Date()
    },
    { returnDocument: "after" } // mongoose v8 safe
  );
};

module.exports = {
  createConversation,
  getUserConversations,
  deleteConversation,
  updateConversationTitle,
};