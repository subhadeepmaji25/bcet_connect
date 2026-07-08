// backend/src/shared/middleware/upload.middleware.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const ApiError = require("../errors/ApiError");
const logger = require("../logger/logger");
const { MEDIA_ALLOWED_MIME_TYPES, MEDIA_MAX_SIZE_BYTES } = require("../media/media.constants");

const TEMP_UPLOAD_DIR = path.join(os.tmpdir(), "bcet-connect-uploads");
fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const memoryStorage = multer.memoryStorage();

let fileTypeModulePromise = null;
const getFileTypeModule = () => {
  if (!fileTypeModulePromise) {
    fileTypeModulePromise = import("file-type").catch((err) => {
      fileTypeModulePromise = null;
      throw err;
    });
  }
  return fileTypeModulePromise;
};

const LEGACY_DOC_CONTAINER_MIME = "application/x-cfb";

const verifyFileSignature = async (fileSource, allowedMimeTypes, isBuffer) => {
  const { fileTypeFromBuffer, fileTypeFromFile } = await getFileTypeModule();
  const detected = isBuffer ? await fileTypeFromBuffer(fileSource) : await fileTypeFromFile(fileSource);
  if (!detected) {
    return { status: "unverifiable", detectedMime: null };
  }
  if (allowedMimeTypes.includes(detected.mime)) {
    return { status: "verified", detectedMime: detected.mime };
  }
  if (detected.mime === LEGACY_DOC_CONTAINER_MIME && allowedMimeTypes.includes("application/msword")) {
    return { status: "unverifiable", detectedMime: detected.mime };
  }
  return { status: "mismatch", detectedMime: detected.mime };
};

const createUploadMiddleware = (mediaType, { storage = "memory", fieldName = "file", verifySignature = true } = {}) => {
  const allowedMimeTypes = MEDIA_ALLOWED_MIME_TYPES[mediaType];
  const maxSize = MEDIA_MAX_SIZE_BYTES[mediaType];
  if (!allowedMimeTypes || !maxSize) {
    throw new Error(`createUploadMiddleware: unknown media type "${mediaType}"`);
  }
  const upload = multer({
    storage: storage === "disk" ? diskStorage : memoryStorage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(ApiError.validation(`Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`));
      }
      cb(null, true);
    }
  }).single(fieldName);
  return (req, res, next) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(ApiError.validation(`File too large. Max size: ${Math.round(maxSize / (1024 * 1024))}MB`));
        }
        return next(ApiError.validation(err.message));
      }
      if (err) return next(err);
      if (!req.file) {
        return next(ApiError.validation("No file uploaded"));
      }
      if (!verifySignature) {
        return next();
      }
      try {
        const isBuffer = storage !== "disk";
        const fileSource = isBuffer ? req.file.buffer : req.file.path;
        const { status, detectedMime } = await verifyFileSignature(fileSource, allowedMimeTypes, isBuffer);
        if (status === "mismatch") {
          logger.warn("File signature mismatch — possible spoofed upload", {
            module: "Media",
            mediaType,
            claimedMimeType: req.file.mimetype,
            detectedMime,
            userId: req.user?.id
          });
          if (storage === "disk" && req.file.path) {
            fs.promises.unlink(req.file.path).catch(() => {});
          }
          return next(ApiError.validation("This file's actual content does not match its claimed type. Upload rejected for security reasons."));
        }
        if (status === "unverifiable") {
          logger.info("File signature unverifiable — allowed with reduced confidence", {
            module: "Media",
            mediaType,
            claimedMimeType: req.file.mimetype,
            detectedMime
          });
        }
        next();
      } catch (signatureErr) {
        logger.error("File signature verification threw an error — rejecting upload", {
          module: "Media",
          mediaType,
          error: signatureErr.message,
          hint: signatureErr.code === "MODULE_NOT_FOUND" || /Cannot find package/i.test(signatureErr.message) ? "Run `npm install file-type` — package is required but not installed." : undefined
        });
        if (storage === "disk" && req.file.path) {
          fs.promises.unlink(req.file.path).catch(() => {});
        }
        next(ApiError.validation("File security verification failed. Please try again with a valid file."));
      }
    });
  };
};

module.exports = { createUploadMiddleware, TEMP_UPLOAD_DIR };
