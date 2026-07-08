// backend/src/modules/users/models/Project.js

const mongoose = require("mongoose");

const PROJECT_TYPES = [
  "academic", "personal", "hackathon",
  "freelance", "research", "open-source", "other"
];

const PROJECT_STATUS = ["planned", "in-progress", "completed"];

const PROJECT_VISIBILITY = ["public", "private"];

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ─────────────────────────────────────────
    // Basic Info
    // ─────────────────────────────────────────

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      maxlength: 5000
    },

    projectType: {
      type: String,
      enum: PROJECT_TYPES,
      default: "personal"
    },

    status: {
      type: String,
      enum: PROJECT_STATUS,
      default: "completed"
    },

    visibility: {
      type: String,
      enum: PROJECT_VISIBILITY,
      default: "public"
    },

    // ─────────────────────────────────────────
    // Technical
    // ─────────────────────────────────────────

    techStack: [{ type: String, trim: true, lowercase: true }],

    // FIX: Service layer se set hoga — model merge nahi karega
    // Isse duplicate merge aur AI extraction conflict avoid hoga
    skillsExtracted: [{ type: String, trim: true, lowercase: true }],

    // ─────────────────────────────────────────
    // Team
    // ─────────────────────────────────────────

    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    teamSize: {
      type: Number,
      min: 1,
      default: 1
    },

    achievements: [{ type: String, trim: true, maxlength: 300 }],

    // ─────────────────────────────────────────
    // Links
    // ─────────────────────────────────────────

    githubUrl: {
      type: String,
      default: null,
      match: [/^https?:\/\/.+/, "Invalid GitHub URL"]
    },

    demoUrl: {
      type: String,
      default: null,
      match: [/^https?:\/\/.+/, "Invalid demo URL"]
    },

    // ─────────────────────────────────────────
    // Media
    // ─────────────────────────────────────────

    thumbnail: {
      type: String,
      default: null
    },

    thumbnailPublicId: {
      type: String,
      default: null  // FIX: null instead of ""
    },

    gallery: {
      type: [mediaSchema],
      default: []
    },

    // ─────────────────────────────────────────
    // Timeline
    // ─────────────────────────────────────────

    startDate: { type: Date },
    endDate: { type: Date },

    // ─────────────────────────────────────────
    // Scoring & Discovery
    // ─────────────────────────────────────────

    featured: {
      type: Boolean,
      default: false
    },

    deployed: {
      type: Boolean,
      default: false
    },

    starsCount: {
      type: Number,
      default: 0
    },

    projectScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    searchScore: {
      type: Number,
      default: 0
    },

    // ─────────────────────────────────────────
    // Soft Delete
    // ─────────────────────────────────────────

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ─────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────

projectSchema.index({ userId: 1 });
projectSchema.index({ userId: 1, slug: 1 }, { unique: true, sparse: true }); // FIX: unique slug per user
projectSchema.index({ title: "text", description: "text" });
projectSchema.index({ techStack: 1 });
projectSchema.index({ skillsExtracted: 1 });
projectSchema.index({ projectType: 1 });
projectSchema.index({ featured: 1 });
projectSchema.index({ deployed: 1 });
projectSchema.index({ visibility: 1 });
projectSchema.index({ isDeleted: 1 });
projectSchema.index({ userId: 1, featured: -1 });

// ─────────────────────────────────────────
// Pre-save Hook
//
// FIX: skillsExtracted merge logic HATAYA
// Reason: Service layer already techStack ko
// skillsExtracted mein merge karta hai.
// Model mein karna = double merge = duplicates
//
// Sirf ye kaam karta hai:
// 1. Date validation
// 2. Slug generation (sirf naye project ke liye)
// ─────────────────────────────────────────

projectSchema.pre("save", function () {
  // Date validation
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    throw new Error("End date cannot be before start date");
  }

  // Slug generate karo — sirf naye project ke liye
  if (this.isNew && this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // FIX REMOVED: techStack → skillsExtracted merge
  // Yeh ab project.service.js mein hoga
});

// ─────────────────────────────────────────
// Virtuals
// ─────────────────────────────────────────

projectSchema.virtual("isPublished").get(function () {
  return this.status === "completed";
});

projectSchema.virtual("isTeamProject").get(function () {
  return this.teamSize > 1;
});

module.exports = mongoose.model("Project", projectSchema);