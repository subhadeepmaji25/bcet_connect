// backend/src/shared/media/media.constants.js
const CLOUDINARY_ROOT_FOLDER = process.env.CLOUDINARY_ROOT_FOLDER || "bcet-connect";

const MEDIA_TYPES = Object.freeze({
  RESUME: "resume",
  AVATAR: "avatar",
  FEED_IMAGE: "feed_image",
  PROJECT_THUMBNAIL: "project_thumbnail",
  COMMUNITY_COVER: "community_cover",
  EVENT_BANNER: "event_banner",
  CHAT_ATTACHMENT: "chat_attachment",
  // New — separate media types (not folded into CHAT_ATTACHMENT) because
  // video/audio need very different size limits than image/document.
  // Keeping them distinct means a future size-limit change for one
  // never accidentally loosens the other.
  CHAT_VOICE_NOTE: "chat_voice_note",
  CHAT_VIDEO: "chat_video",
  CERTIFICATE: "certificate"
});

const MEDIA_FOLDERS = Object.freeze({
  [MEDIA_TYPES.RESUME]: "resumes",
  [MEDIA_TYPES.AVATAR]: "avatars",
  [MEDIA_TYPES.FEED_IMAGE]: "feed",
  [MEDIA_TYPES.PROJECT_THUMBNAIL]: "projects",
  [MEDIA_TYPES.COMMUNITY_COVER]: "communities",
  [MEDIA_TYPES.EVENT_BANNER]: "events",
  [MEDIA_TYPES.CHAT_ATTACHMENT]: "chat",
  [MEDIA_TYPES.CHAT_VOICE_NOTE]: "chat/voice",
  [MEDIA_TYPES.CHAT_VIDEO]: "chat/video",
  [MEDIA_TYPES.CERTIFICATE]: "certificates"
});

const MEDIA_RESOURCE_TYPE = Object.freeze({
  [MEDIA_TYPES.RESUME]: "raw",
  [MEDIA_TYPES.AVATAR]: "image",
  [MEDIA_TYPES.FEED_IMAGE]: "image",
  [MEDIA_TYPES.PROJECT_THUMBNAIL]: "image",
  [MEDIA_TYPES.COMMUNITY_COVER]: "image",
  [MEDIA_TYPES.EVENT_BANNER]: "image",
  [MEDIA_TYPES.CHAT_ATTACHMENT]: "auto",
  [MEDIA_TYPES.CHAT_VOICE_NOTE]: "video", // Cloudinary treats audio under the "video" resource type
  [MEDIA_TYPES.CHAT_VIDEO]: "video",
  [MEDIA_TYPES.CERTIFICATE]: "raw"
});

const ALLOWED_MIME_TYPES = Object.freeze({
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  // New — kept as their own named groups so callers/validators can be
  // explicit about which they mean, same convention as document/image.
  audio: ["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav"],
  video: ["video/mp4", "video/webm", "video/quicktime"]
});

const MEDIA_ALLOWED_MIME_TYPES = Object.freeze({
  [MEDIA_TYPES.RESUME]: ALLOWED_MIME_TYPES.document,
  [MEDIA_TYPES.AVATAR]: ALLOWED_MIME_TYPES.image,
  [MEDIA_TYPES.FEED_IMAGE]: ALLOWED_MIME_TYPES.image,
  [MEDIA_TYPES.PROJECT_THUMBNAIL]: ALLOWED_MIME_TYPES.image,
  [MEDIA_TYPES.COMMUNITY_COVER]: ALLOWED_MIME_TYPES.image,
  [MEDIA_TYPES.EVENT_BANNER]: ALLOWED_MIME_TYPES.image,
  [MEDIA_TYPES.CHAT_ATTACHMENT]: [...ALLOWED_MIME_TYPES.document, ...ALLOWED_MIME_TYPES.image],
  [MEDIA_TYPES.CHAT_VOICE_NOTE]: ALLOWED_MIME_TYPES.audio,
  [MEDIA_TYPES.CHAT_VIDEO]: ALLOWED_MIME_TYPES.video,
  [MEDIA_TYPES.CERTIFICATE]: ALLOWED_MIME_TYPES.document
});

const MB = 1024 * 1024;

const MEDIA_MAX_SIZE_BYTES = Object.freeze({
  [MEDIA_TYPES.RESUME]: 5 * MB,
  [MEDIA_TYPES.AVATAR]: 2 * MB,
  [MEDIA_TYPES.FEED_IMAGE]: 5 * MB,
  [MEDIA_TYPES.PROJECT_THUMBNAIL]: 5 * MB,
  [MEDIA_TYPES.COMMUNITY_COVER]: 5 * MB,
  [MEDIA_TYPES.EVENT_BANNER]: 5 * MB,
  [MEDIA_TYPES.CHAT_ATTACHMENT]: 10 * MB,
  // Kept deliberately small — a voice note is a short clip, not a
  // podcast; a chat video is a quick clip, not a movie. Free-tier
  // Cloudinary bandwidth/storage makes generous limits risky here.
  [MEDIA_TYPES.CHAT_VOICE_NOTE]: 5 * MB,
  [MEDIA_TYPES.CHAT_VIDEO]: 25 * MB,
  [MEDIA_TYPES.CERTIFICATE]: 5 * MB
});

const MEDIA_TRANSFORMATION_PRESETS = Object.freeze({
  [MEDIA_TYPES.AVATAR]: [
    { width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }
  ],
  [MEDIA_TYPES.PROJECT_THUMBNAIL]: [
    { width: 800, height: 450, crop: "fill", quality: "auto" }
  ],
  [MEDIA_TYPES.COMMUNITY_COVER]: [
    { width: 1200, height: 400, crop: "fill", quality: "auto" }
  ],
  [MEDIA_TYPES.EVENT_BANNER]: [
    { width: 1200, height: 630, crop: "fill", quality: "auto" }
  ],
  [MEDIA_TYPES.FEED_IMAGE]: [
    { width: 1080, crop: "limit", quality: "auto" }
  ]
});

module.exports = {
  CLOUDINARY_ROOT_FOLDER,
  MEDIA_TYPES,
  MEDIA_FOLDERS,
  MEDIA_RESOURCE_TYPE,
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAX_SIZE_BYTES,
  MEDIA_TRANSFORMATION_PRESETS
};