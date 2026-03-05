const mongoose = require("mongoose");
const documentService = require("./document.service");
const chunkText = require("../../utils/chunkText");
const { generateEmbeddingsForChunks } = require("../rag/embedding.service");
const Vector = require("../rag/vector.model");
const Document = require("./document.model");
const fs = require("fs");
const path = require("path");

/* ================= UPLOAD ================= */
const uploadDocument = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    if (!req.file) {
      const error = new Error("No file uploaded");
      error.statusCode = 400;
      throw error;
    }

    const { conversationId } = req.body;

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

    const filePath = req.file.path;

    const extractedText =
      await documentService.extractTextFromFile(filePath);

    if (!extractedText || extractedText.trim().length === 0) {
      const error = new Error("No text found in document");
      error.statusCode = 400;
      throw error;
    }

    /**
     * 🔥 Safe chunk configuration
     */
    const chunksArray = chunkText(
      extractedText,
      parseInt(process.env.CHUNK_SIZE) || 800,
      parseInt(process.env.CHUNK_OVERLAP) || 150
    );

    const maxChunks = parseInt(process.env.MAX_CHUNKS) || 100;
    const limitedChunks = chunksArray.slice(0, maxChunks);

    const formattedChunks = limitedChunks.map((chunk) => ({
      text: chunk,
    }));

    /**
     * 🔥 Create document
     */
    const document = await documentService.createDocument(
      {
        conversationId: conversationObjectId,
        title: req.file.originalname,
        fileName: req.file.filename,
        preview: extractedText.substring(0, 2000),
        totalChunks: limitedChunks.length,
        uploadedBy: req.user.id,
      },
      session
    );

    /**
     * 🔥 Generate embeddings safely
     * If embedding fails → fallback (no crash)
     */
    let embeddings = [];

    try {
      embeddings = await generateEmbeddingsForChunks(formattedChunks);
    } catch (embeddingError) {
      console.error("⚠️ Embedding generation failed:", embeddingError.message);
      embeddings = [];
    }

    /**
     * 🔥 Prepare vector data
     */
    const vectorData = embeddings.map((item) => ({
      conversationId: conversationObjectId,
      documentId: document._id,
      text: item.text,
      embedding: item.embedding,
    }));

    /**
     * 🔥 Insert vectors in batches
     */
    const batchSize = 50;

    for (let i = 0; i < vectorData.length; i += batchSize) {
      await Vector.insertMany(
        vectorData.slice(i, i + batchSize),
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        documentId: document._id,
        totalChunks: limitedChunks.length,
      },
    });

  } catch (error) {

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error("🔥 Upload Error:", error.message);
    next(error);
  }
};


/* ================= GET DOCUMENTS ================= */
const getConversationDocuments = async (req, res, next) => {
  try {

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      const error = new Error("Invalid conversationId format");
      error.statusCode = 400;
      throw error;
    }

    const documents = await Document.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: documents,
    });

  } catch (error) {
    next(error);
  }
};


/* ================= DELETE DOCUMENT ================= */
const deleteDocument = async (req, res, next) => {
  try {

    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      const error = new Error("Invalid documentId format");
      error.statusCode = 400;
      throw error;
    }

    const document = await Document.findById(documentId);

    if (!document) {
      const error = new Error("Document not found");
      error.statusCode = 404;
      throw error;
    }

    /**
     * 🔥 Delete vectors first
     */
    await Vector.deleteMany({
      documentId: document._id,
    });

    /**
     * 🔥 Safe file delete
     */
    const filePath = path.resolve(
      __dirname,
      "../../uploads",
      document.fileName
    );

    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
    } catch {}

    await Document.deleteOne({ _id: documentId });

    res.json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error) {

    console.error("🔥 Delete Error:", error.message);
    next(error);

  }
};

module.exports = {
  uploadDocument,
  getConversationDocuments,
  deleteDocument,
};