// backend/src/modules/resume-parser/services/pdfParser.service.js
//
// Two fixes stacked on top of each other here — both were real bugs
// hit in production testing:
//
// FIX 1 (API version): pdf-parse v2 replaced the old callable-function
// API with a class-based API (`new PDFParse(...)`, `.getText()`,
// `.getInfo()`, `.destroy()`). This file already uses the v2 shape.
//
// FIX 2 ("Cannot transfer object of unsupported type"): pdf-parse v2
// runs pdf.js in a worker thread. Passing it a Node.js `Buffer`
// (from fs.readFile) fails, because Buffer is a Uint8Array *subclass*
// that often shares memory from Node's internal pooled allocator —
// exactly the kind of object a worker's structured-clone/transfer step
// rejects. `new Uint8Array(buffer)` copies the bytes into a brand-new,
// standalone ArrayBuffer that's safe to hand to the worker.
const fs = require("fs/promises");
const { PDFParse } = require("pdf-parse");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSION = ".pdf";
const ALLOWED_MIME_TYPE = "application/pdf";

const validateFile = async (filePath, originalName, mimeType, sizeInBytes) => {
  try {
    await fs.access(filePath);
  } catch {
    throw ApiError.notFound("Uploaded resume file not found on server");
  }
  const extension = (originalName || "").toLowerCase().slice(-4);
  if (extension !== ALLOWED_EXTENSION) {
    throw ApiError.validation("Only PDF files are supported for resume upload");
  }
  if (mimeType && mimeType !== ALLOWED_MIME_TYPE) {
    throw ApiError.validation("Invalid file type. Expected application/pdf");
  }
  if (sizeInBytes && sizeInBytes > MAX_FILE_SIZE_BYTES) {
    throw ApiError.validation("Resume file must be smaller than 5MB");
  }
};

const buildParseResult = (textResult, infoResult) => {
  const rawText = textResult?.text || "";
  return {
    rawText,
    pageCount: infoResult?.total || infoResult?.numpages || 0,
    info: {
      title: infoResult?.info?.Title || null,
      author: infoResult?.info?.Author || null,
      creator: infoResult?.info?.Creator || null,
      producer: infoResult?.info?.Producer || null
    },
    characterCount: rawText.length
  };
};

const parsePdf = async (filePath, fileMeta = {}) => {
  const { originalName = "", mimeType = "", sizeInBytes = 0, userId = null } = fileMeta;

  await validateFile(filePath, originalName, mimeType, sizeInBytes);

  let buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch (err) {
    logger.error("Failed to read resume file from disk", { module: "ResumeParser", userId, error: err.message });
    throw ApiError.internal("Could not read the uploaded resume file");
  }

  let parser = null;
  let textResult;
  let infoResult;

  try {
    // FIX 2 applied here — plain Uint8Array copy, not the raw Node Buffer.
    const pdfData = new Uint8Array(buffer);
    parser = new PDFParse({ data: pdfData });

    textResult = await parser.getText();
    infoResult = await parser.getInfo();
  } catch (err) {
    logger.error("pdf-parse failed to parse PDF", { module: "ResumeParser", userId, error: err.message });
    if (/password|encrypted/i.test(err.message)) {
      throw ApiError.validation("This PDF is password protected. Please upload an unprotected file.");
    }
    throw ApiError.validation("Invalid or corrupted PDF file. Please try a different file.");
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (cleanupErr) {
        logger.warn("Failed to destroy PDFParse instance", {
          module: "ResumeParser",
          userId,
          error: cleanupErr.message
        });
      }
    }
  }

  const result = buildParseResult(textResult, infoResult);

  if (!result.rawText || result.rawText.trim().length === 0) {
    throw ApiError.validation("No extractable text found in this PDF. It may be a scanned image without OCR.");
  }

  logger.info("Resume PDF parsed successfully", {
    module: "ResumeParser",
    userId,
    pages: result.pageCount,
    characters: result.characterCount
  });

  return result;
};

module.exports = {
  parsePdf,
  validateFile,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSION,
  ALLOWED_MIME_TYPE
};