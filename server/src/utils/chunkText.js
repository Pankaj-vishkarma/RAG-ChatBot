const chunkText = (text, chunkSize, overlap) => {
  if (!text || typeof text !== "string") {
    throw new Error("Valid text is required for chunking");
  }

  // 🔥 Use ENV values if not passed
  const size =
    parseInt(chunkSize) ||
    parseInt(process.env.CHUNK_SIZE) ||
    800;

  const chunkOverlap =
    parseInt(overlap) ||
    parseInt(process.env.CHUNK_OVERLAP) ||
    150;

  const maxChunks =
    parseInt(process.env.MAX_CHUNKS) || 100;

  if (chunkOverlap >= size) {
    throw new Error(
      "Chunk overlap must be smaller than chunk size"
    );
  }

  const chunks = [];
  let start = 0;

  while (start < text.length && chunks.length < maxChunks) {
    const end = start + size;
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start += size - chunkOverlap;
  }

  return chunks;
};

module.exports = chunkText;