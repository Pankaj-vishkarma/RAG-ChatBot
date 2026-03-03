const axios = require("axios");

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models"; // ✅ FIXED (added /models)

const DEFAULT_MODEL = "gemini-embedding-001";

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

    console.log("Using Embed Model:", model);

    const response = await axios.post(
      `${GEMINI_BASE_URL}/${model}:embedContent?key=${API_KEY}`, // ✅ Now correct endpoint
      {
        content: {
          parts: [{ text }],
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

    console.log("✅ Embedding generated. Length:", embedding.length);

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

const generateEmbeddingsForChunks = async (chunks = []) => {
  if (!Array.isArray(chunks)) {
    const error = new Error("Chunks must be an array");
    error.statusCode = 400;
    throw error;
  }

  const results = [];

  for (const chunk of chunks) {
    if (!chunk?.text) continue;

    try {
      const embedding = await generateEmbedding(chunk.text);

      results.push({
        text: chunk.text,
        embedding,
      });

    } catch (err) {
      console.error("Chunk embedding failed:", err.message);
    }
  }

  return results;
};

module.exports = {
  generateEmbedding,
  generateEmbeddingsForChunks,
};