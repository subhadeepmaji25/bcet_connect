// backend/src/shared/media/cloudinary.config.js
const cloudinary = require("cloudinary").v2;
const logger = require("../logger/logger");

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

const hasCredentials = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

if (!hasCredentials) {
  logger.warn("Cloudinary credentials missing in .env — media upload/delete will fail", {
    module: "Media"
  });
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

const verifyCloudinaryConnection = async () => {
  if (!hasCredentials) {
    logger.warn("Skipping Cloudinary health check — credentials not configured", {
      module: "Media"
    });
    return { connected: false, reason: "missing_credentials" };
  }
  try {
    const result = await cloudinary.api.ping();
    logger.info("Cloudinary connection verified", {
      module: "Media",
      status: result?.status || "ok"
    });
    return { connected: true, reason: null };
  } catch (err) {
    logger.error("Cloudinary health check failed — check API credentials/network", {
      module: "Media",
      error: err.message
    });
    return { connected: false, reason: err.message };
  }
};

cloudinary.verifyConnection = verifyCloudinaryConnection;

module.exports = cloudinary;