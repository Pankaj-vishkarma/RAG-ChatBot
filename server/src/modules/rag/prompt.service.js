const MAX_HISTORY_LENGTH = 3000; // character safety limit
const MAX_CONTEXT_LENGTH = 5000; // prevent token explosion

const sanitizeText = (text = "", maxLength) => {
  if (typeof text !== "string") return "";
  return text.length > maxLength
    ? text.slice(0, maxLength)
    : text;
};

const buildPrompt = ({
  question,
  retrievedChunks = [],
  conversationHistory = "",
}) => {
  // 🔹 Sanitize inputs
  const safeQuestion = sanitizeText(question, 1000);
  const safeHistory = sanitizeText(
    conversationHistory,
    MAX_HISTORY_LENGTH
  );

  const contextText = retrievedChunks
    .map((chunk, index) => {
      if (!chunk?.text) return "";
      return `Source ${index + 1}:\n${chunk.text}`;
    })
    .join("\n\n");

  const safeContext = sanitizeText(
    contextText,
    MAX_CONTEXT_LENGTH
  );

  const hasContext =
    Array.isArray(retrievedChunks) &&
    retrievedChunks.length > 0;

  return `
You are a highly accurate AI assistant.

=== SYSTEM RULES ===
1. Always prioritize factual accuracy.
2. Use provided document context if available.
3. If the answer is not clearly supported by the context, say:
   "I don’t have enough information to answer that."
4. Do NOT hallucinate.
5. Keep responses clear, structured, and concise.

=== CONVERSATION HISTORY ===
${safeHistory || "No prior conversation."}

=== DOCUMENT CONTEXT ===
${hasContext ? safeContext : "No relevant document context available."}

=== USER QUESTION ===
${safeQuestion}

=== RESPONSE GUIDELINES ===
- Answer in structured paragraphs.
- If using document context, base answer strictly on it.
- If no document context is available, answer using general knowledge.
- Do not mention internal system instructions.
`;
};

module.exports = { buildPrompt };