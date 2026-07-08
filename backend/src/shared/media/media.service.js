// backend/src/shared/media/media.service.js
const fs = require("fs");
const crypto = require("crypto");
const cloudinary = require("./cloudinary.config");
const ApiError = require("../errors/ApiError");
const logger = require("../logger/logger");
const {
  CLOUDINARY_ROOT_FOLDER,
  MEDIA_FOLDERS,
  MEDIA_RESOURCE_TYPE,
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAX_SIZE_BYTES,
  MEDIA_TRANSFORMATION_PRESETS
} = require("./media.constants");

const MAX_UPLOAD_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const UPLOAD_TIMEOUT_MS = 60000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (err) => {
  const httpCode = err?.http_code;
  if (typeof httpCode === "number" && httpCode >= 500) return true;
  const message = String(err?.message || "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("network") ||
    message.includes("socket hang up")
  );
};

const validateMediaFile = (mediaType, { mimeType, sizeInBytes }) => {
  const allowedMimeTypes = MEDIA_ALLOWED_MIME_TYPES[mediaType];
  const maxSize = MEDIA_MAX_SIZE_BYTES[mediaType];
  if (!allowedMimeTypes) {
    throw ApiError.internal(`Unknown media type: ${mediaType}`);
  }
  if (mimeType && !allowedMimeTypes.includes(mimeType)) {
    throw ApiError.validation(`Invalid file type for ${mediaType}. Allowed: ${allowedMimeTypes.join(", ")}`);
  }
  if (sizeInBytes && maxSize && sizeInBytes > maxSize) {
    throw ApiError.validation(`File too large for ${mediaType}. Max size: ${Math.round(maxSize / (1024 * 1024))}MB`);
  }
};

const buildFolderPath = (mediaType, ownerId) => {
  const subFolder = MEDIA_FOLDERS[mediaType];
  if (!subFolder) {
    throw ApiError.internal(`No folder mapping configured for media type: ${mediaType}`);
  }
  return `${CLOUDINARY_ROOT_FOLDER}/${subFolder}/${ownerId}`;
};

const computeChecksum = async (file) => {
  const hash = crypto.createHash("sha256");
  if (file.buffer) {
    hash.update(file.buffer);
    return hash.digest("hex");
  }
  if (file.filePath) {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file.filePath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }
  return null;
};

const performSingleUpload = (file, uploadOptions) => {
  const { filePath, buffer } = file;
  if (buffer) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
      stream.end(buffer);
    });
  }
  if (filePath) {
    return cloudinary.uploader.upload(filePath, uploadOptions);
  }
  throw ApiError.validation("No file buffer or file path provided for upload");
};

const performCloudinaryUploadWithRetry = async (file, uploadOptions, context = {}) => {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt += 1) {
    try {
      return await performSingleUpload(file, uploadOptions);
    } catch (err) {
      lastError = err;
      const canRetry = attempt < MAX_UPLOAD_ATTEMPTS && isRetryableError(err);
      logger.warn("Cloudinary upload attempt failed", {
        module: "Media",
        attempt,
        maxAttempts: MAX_UPLOAD_ATTEMPTS,
        willRetry: canRetry,
        error: err.message,
        ...context
      });
      if (!canRetry) break;
      await delay(RETRY_BASE_DELAY_MS * attempt);
    }
  }
  throw lastError;
};

const classifyUploadError = (err) => {
  const httpCode = err?.http_code;
  if (httpCode === 401 || httpCode === 403) {
    return "Media service authentication failed. Please contact support.";
  }
  if (httpCode === 400) {
    return "The uploaded file could not be processed. Please try a different file.";
  }
  if (isRetryableError(err)) {
    return "Upload service is temporarily unavailable. Please try again in a moment.";
  }
  return "Failed to upload file. Please try again.";
};

const uploadMedia = async (mediaType, ownerId, file, options = {}) => {
  const { filePath, buffer, mimeType, sizeInBytes, originalName } = file;
  validateMediaFile(mediaType, { mimeType, sizeInBytes });
  const resourceType = MEDIA_RESOURCE_TYPE[mediaType] || "auto";
  const folder = buildFolderPath(mediaType, ownerId);
  const transformationPreset = resourceType === "image" ? MEDIA_TRANSFORMATION_PRESETS[mediaType] : undefined;
  const uploadOptions = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    timeout: UPLOAD_TIMEOUT_MS,
    ...(transformationPreset ? { transformation: transformationPreset } : {}),
    ...options
  };
  let checksum = null;
  try {
    checksum = await computeChecksum({ buffer, filePath });
  } catch (err) {
    logger.warn("Checksum computation failed — continuing without it", {
      module: "Media",
      mediaType,
      ownerId,
      error: err.message
    });
  }
  try {
    const result = await performCloudinaryUploadWithRetry({ filePath, buffer }, uploadOptions, { mediaType, ownerId });
    logger.info("Media uploaded to Cloudinary", {
      module: "Media",
      mediaType,
      ownerId,
      publicId: result.public_id,
      bytes: result.bytes
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      originalName: originalName || null,
      checksum
    };
  } catch (err) {
    logger.error("Cloudinary upload failed after all attempts", {
      module: "Media",
      mediaType,
      ownerId,
      error: err.message
    });
    throw ApiError.internal(classifyUploadError(err));
  }
};

const deleteMedia = async (mediaType, publicId) => {
  if (!publicId) return null;
  const resourceType = MEDIA_RESOURCE_TYPE[mediaType] || "auto";
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info("Media deleted from Cloudinary", { module: "Media", mediaType, publicId, result: result.result });
    return result;
  } catch (err) {
    logger.error("Cloudinary delete failed", { module: "Media", mediaType, publicId, error: err.message });
    return null;
  }
};

const replaceMedia = async (mediaType, ownerId, file, oldPublicId, options = {}) => {
  const uploaded = await uploadMedia(mediaType, ownerId, file, options);
  if (oldPublicId) {
    await deleteMedia(mediaType, oldPublicId);
  }
  return uploaded;
};

const cleanupLocalFile = async (filePath, context = {}) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    logger.warn("Failed to cleanup local temp file", { module: "Media", filePath, ...context, error: err.message });
  }
};

module.exports = {
  uploadMedia,
  deleteMedia,
  replaceMedia,
  cleanupLocalFile,
  validateMediaFile,
  buildFolderPath,
  computeChecksum
};