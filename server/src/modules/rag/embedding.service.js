const axios = require("axios");

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_MODEL = "gemini-embedding-001";

/**
 * 🔥 Generate Single Embedding
 */
const generateEmbedding = async (text) => {
  try {

    if (!text || typeof text !== "string") {
      const error = new Error("Valid text is required for embedding");
      error.statusCode = 400;
      throw error;
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      const error = new Error("Gemini API key not configured");
      error.statusCode = 500;
      throw error;
    }

    const model =
      process.env.GEMINI_EMBED_MODEL || DEFAULT_MODEL;

    // Prevent extremely large text
    const safeText = text.slice(0, 8000);

    const response = await axios.post(
      `${GEMINI_BASE_URL}/${model}:embedContent?key=${API_KEY}`,
      {
        content: {
          parts: [{ text: safeText }],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const embedding = response.data?.embedding?.values;

    if (!embedding || !Array.isArray(embedding)) {
      const error = new Error("Invalid embedding response from Gemini");
      error.statusCode = 502;
      throw error;
    }

    return embedding;

  } catch (error) {

    console.error(
      "🔥 Gemini Embedding Error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 429) {
      const quotaError = new Error(
        "Embedding quota exceeded. Please try again later."
      );
      quotaError.statusCode = 429;
      throw quotaError;
    }

    if (error.response?.status === 404) {
      const modelError = new Error(
        "Embedding model not available. Check model name and API access."
      );
      modelError.statusCode = 500;
      throw modelError;
    }

    const serverError = new Error(
      error.response?.data?.error?.message ||
      "Failed to generate embedding"
    );

    serverError.statusCode = error.response?.status || 500;
    throw serverError;
  }
};


/**
 * 🔥 Generate Embeddings for Multiple Chunks
 * Memory safe + limited concurrency
 */
const generateEmbeddingsForChunks = async (chunks = []) => {

  if (!Array.isArray(chunks)) {
    const error = new Error("Chunks must be an array");
    error.statusCode = 400;
    throw error;
  }

  const results = [];

  // Limit parallel API calls
  const concurrencyLimit = parseInt(process.env.EMBED_CONCURRENCY) || 3;

  for (let i = 0; i < chunks.length; i += concurrencyLimit) {

    const batch = chunks.slice(i, i + concurrencyLimit);

    const promises = batch.map(async (chunk) => {

      if (!chunk?.text) return null;

      try {

        const embedding = await generateEmbedding(chunk.text);

        return {
          text: chunk.text,
          embedding,
        };

      } catch (err) {

        console.error("Chunk embedding failed:", err.message);
        return null;

      }

    });

    const batchResults = await Promise.all(promises);

    for (const item of batchResults) {
      if (item) results.push(item);
    }

  }

  return results;
};

module.exports = {
  generateEmbedding,
  generateEmbeddingsForChunks,
};