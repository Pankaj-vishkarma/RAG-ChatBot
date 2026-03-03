const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../../middleware/auth.middleware");
const documentController = require("./document.controller");

const router = express.Router();

/* ================= ENSURE UPLOAD FOLDER EXISTS ================= */
const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

/* ================= FILE FILTER ================= */
const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(
      new Error("Only PDF files are allowed"),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize:
      parseInt(process.env.MAX_FILE_SIZE) ||
      5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

/* ================= UPLOAD ================= */
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  documentController.uploadDocument
);

/* ================= GET DOCUMENTS ================= */
router.get(
  "/:conversationId",
  authMiddleware,
  documentController.getConversationDocuments
);

/* ================= DELETE DOCUMENT ================= */
router.delete(
  "/:documentId",
  authMiddleware,
  documentController.deleteDocument
);

module.exports = router;