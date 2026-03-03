const mongoose = require("mongoose");

const vectorSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
      maxlength: 2000, // 🔥 prevent large storage
    },

    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "Embedding must be a non-empty numeric array",
      },
    },
  },
  { timestamps: true }
);

// 🔥 Compound index for fast retrieval
vectorSchema.index({ conversationId: 1, documentId: 1 });

// 🔥 Optional: clean JSON output
vectorSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Vector", vectorSchema);