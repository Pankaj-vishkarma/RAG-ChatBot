const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    sources: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);