const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    fileName: {
      type: String,
      required: true,
    },

    // 🔥 Store only preview instead of full content
    preview: {
      type: String,
      maxlength: 2000,
    },

    totalChunks: {
      type: Number,
      default: 0,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// 🔥 Compound index for faster queries
documentSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);