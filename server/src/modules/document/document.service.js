const fs = require("fs");
const pdfParse = require("pdf-parse");
const Document = require("./document.model");

const extractTextFromFile = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const createDocument = async (data) => {
  return await Document.create(data);
};

module.exports = {
  extractTextFromFile,
  createDocument,
};