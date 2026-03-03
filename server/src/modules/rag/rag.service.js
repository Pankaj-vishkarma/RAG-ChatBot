const axios = require("axios");
const { retrieveRelevantChunks } = require("./retrieval.service");
const { buildPrompt } = require("./prompt.service");

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_CHAT_MODEL = "gemini-1.5-flash";

const askQuestion = async (
  question,
  conversationId,
  previousMessages = []
) => {
  try {
    if (!question) {
      const error = new Error("Question is required");
      error.statusCode = 400;
      throw error;
    }

    if (!conversationId) {
      const error = new Error("conversationId is required");
      error.statusCode = 400;
      throw error;
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      const error = new Error("Gemini API key not configured");
      error.statusCode = 500;
      throw error;
    }

    const CHAT_MODEL =
      process.env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL;

    // 🔹 Safe retrieval (fallback if fails)
    let retrievedChunks = [];
    try {
      retrievedChunks = await retrieveRelevantChunks(
        question,
        conversationId,
        parseInt(process.env.TOP_K) || 5
      );
    } catch (err) {
      console.log("⚠️ Retrieval failed → continuing without RAG");
      retrievedChunks = [];
    }

    // 🔹 Limit conversation history (token protection)
    const limitedMessages = Array.isArray(previousMessages)
      ? previousMessages.slice(-10)
      : [];

    const conversationHistory = limitedMessages
      .map((msg) => `${msg.role?.toUpperCase()}: ${msg.content}`)
      .join("\n");

    // 🔹 Build prompt safely
    const prompt = buildPrompt({
      question,
      retrievedChunks,
      conversationHistory,
    });

    if (!prompt) {
      const error = new Error("Prompt generation failed");
      error.statusCode = 500;
      throw error;
    }

    // 🔹 Gemini API Call
    const response = await axios.post(
      `${GEMINI_BASE_URL}/${CHAT_MODEL}:generateContent`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature:
            parseFloat(process.env.GEMINI_TEMPERATURE) || 0.4,
          maxOutputTokens:
            parseInt(process.env.GEMINI_MAX_TOKENS) || 800,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        timeout: 20000,
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      const error = new Error("AI returned empty response");
      error.statusCode = 502;
      throw error;
    }

    return {
      answer: text.trim(),
      sources: retrievedChunks.length
        ? retrievedChunks.map((chunk) => chunk.text)
        : [],
    };
  } catch (error) {
    console.error(
      "🔥 Gemini RAG Error:",
      error.response?.data || error.message
    );

    const status = error.response?.status || error.statusCode;

    if (status === 429) {
      const quotaError = new Error(
        "AI quota exceeded. Please try again later."
      );
      quotaError.statusCode = 429;
      throw quotaError;
    }

    if (status === 401) {
      const authError = new Error("Invalid Gemini API key.");
      authError.statusCode = 401;
      throw authError;
    }

    const serverError = new Error(
      error.message || "Failed to process Gemini RAG request"
    );

    serverError.statusCode = status || 500;

    throw serverError;
  }
};

const generateTitle = async (question) => {
  try {
    if (!question) return "New Chat";

    const API_KEY = process.env.GEMINI_API_KEY;
    const CHAT_MODEL =
      process.env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL;

    const prompt = `
Generate a very short and concise chat title (max 5 words).
Only return the title. No quotes. No extra text.

User Query:
${question}
`;

    const response = await axios.post(
      `${GEMINI_BASE_URL}/${CHAT_MODEL}:generateContent`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 20,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        timeout: 15000,
      }
    );

    const title =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return title || "New Chat";
  } catch (error) {
    console.error(
      "🔥 Title Generation Error:",
      error.response?.data || error.message
    );
    return "New Chat";
  }
};

module.exports = {
  askQuestion,
  generateTitle,
};