const mongoose = require("mongoose");
const Vector = require("./vector.model");
const { generateEmbedding } = require("./embedding.service");

/**
 * 🔥 Safe Cosine Similarity
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0, len = vecA.length; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
};

/**
 * 🔥 Retrieve Top K Similar Chunks (Conversation Based)
 */
const retrieveRelevantChunks = async (
  question,
  conversationId,
  topK = 5
) => {
  try {
    if (!question) {
      console.warn("Question missing in retrieval");
      return [];
    }

    if (!conversationId) {
      const error = new Error("conversationId is required");
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      const error = new Error("Invalid conversationId format");
      error.statusCode = 400;
      throw error;
    }

    const conversationObjectId =
      new mongoose.Types.ObjectId(conversationId);

    // 🔹 Generate question embedding (SAFE MODE)
    let questionEmbedding;
    try {
      questionEmbedding = await generateEmbedding(question);
    } catch (err) {
      console.log("⚠️ Embedding failed → fallback to normal chat mode");
      return [];
    }

    if (!questionEmbedding || !Array.isArray(questionEmbedding)) {
      return [];
    }

    // 🔹 Fetch only required fields (lean for performance)
    let vectors = [];

    try {
      vectors = await Vector.find(
        { conversationId: conversationObjectId },
        { text: 1, embedding: 1 }
      )
        .limit(200)
        .lean();
    } catch (dbError) {
      console.error("Vector DB query failed:", dbError.message);
      return [];
    }

    if (!vectors.length) {
      return [];
    }

    // 🔹 Score similarity
    const scoredVectors = [];

    for (const item of vectors) {
      if (!Array.isArray(item.embedding)) continue;

      const score = cosineSimilarity(
        questionEmbedding,
        item.embedding
      );

      // Ignore useless matches
      if (score > 0.15) {
        scoredVectors.push({
          text: item.text,
          score,
        });
      }
    }

    if (!scoredVectors.length) {
      return [];
    }

    // 🔹 Sort descending
    scoredVectors.sort((a, b) => b.score - a.score);

    // 🔹 Safe TOP_K
    const envTopK = parseInt(process.env.TOP_K, 10);

    const safeTopK =
      Number.isInteger(envTopK) && envTopK > 0
        ? envTopK
        : topK;

    return scoredVectors.slice(0, safeTopK);

  } catch (error) {
    console.error("🔥 Retrieval Error:", error.message);

    const serverError = new Error(
      error.message || "Failed to retrieve relevant chunks"
    );

    serverError.statusCode = error.statusCode || 500;

    console.error("Retrieval fallback triggered");
    return [];
  }
};

module.exports = {
  retrieveRelevantChunks,
};