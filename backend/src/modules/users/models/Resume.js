// backend/src/modules/users/models/Resume.js
//
// UPGRADE: parser.service.js ka rich output (highConfidenceSkills,
// lowConfidenceSkills, category+confidenceScore per skill) ab yahan
// persist hota hai. Pehle sirf flat `extractedSkills` save hota tha —
// confidence/category data upload response ke baad hamesha ke liye
// discard ho jaata tha, kabhi Search/Recommendation tak nahi pahuchta tha.
//
// REMOVED: extractedEducation/extractedExperience/extractedProjects —
// verified (grep se) ki inko poore codebase mein kahin likha ya padha
// nahi jaata. Parser in sab ko extract karta hi nahi (sirf skills +
// sections nikalta hai), isliye ye fields hamesha khali the aur
// misleading the ki "resume se education/experience bhi extract hota
// hai" — jabki hota hi nahi. Jab parser ye capability laayega, tab
// dobara add karna.

const mongoose = require("mongoose");

const PARSE_STATUS = ["pending", "processing", "completed", "failed"];

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Ek skill ke against parser ne kya-kya nikala — category + confidence.
// Isse future me Search ranking aur Recommendation scoring dono
// "high-confidence skills ko zyada weight do" jaisa logic laga sakenge.
const skillDetailSchema = new mongoose.Schema(
  {
    skill: { type: String, trim: true, lowercase: true, required: true },
    category: { type: String, trim: true, lowercase: true, default: "uncategorized" },
    confidenceLevel: { type: String, enum: ["High", "Low"], default: "Low" },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    resumeUrl: {
      type: String,
      required: true,
      match: /^https?:\/\/.+/
    },

    resumePublicId: {
      type: String,
      default: null
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },

    fileSize: {
      type: Number,
      default: 0,
      min: 0,
      max: MAX_FILE_SIZE
    },

    mimeType: {
      type: String,
      enum: ALLOWED_MIME_TYPES,
      default: "application/pdf"
    },

    resumeVersion: {
      type: Number,
      default: 1
    },

    isDefault: {
      type: Boolean,
      default: true
    },

    parseStatus: {
      type: String,
      enum: PARSE_STATUS,
      default: "pending"
    },

    // Legacy flat list — SearchProfile/UIP/Recommendation abhi bhi isi
    // se padhte hain (backward compatible), naya code neeche wale
    // richer fields use karega.
    extractedSkills: [{ type: String, trim: true, lowercase: true }],

    // NEW — parser.service.js ka rich output ab persist hota hai.
    highConfidenceSkills: [{ type: String, trim: true, lowercase: true }],
    lowConfidenceSkills: [{ type: String, trim: true, lowercase: true }],
    skillDetails: { type: [skillDetailSchema], default: [] },

    // Reserved for future — parser abhi ATS scoring nahi karta, lekin
    // field rakhne se model badalna nahi padega jab feature aayega.
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    usageCount: {
      type: Number,
      default: 0
    },

    lastUsedAt: {
      type: Date,
      default: null
    },

    parsedAt: {
      type: Date,
      default: null
    },

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
    versionKey: false
  }
);

resumeSchema.index({ userId: 1 });
resumeSchema.index({ userId: 1, resumeVersion: -1 });
resumeSchema.index({ userId: 1, isDefault: 1 });
resumeSchema.index({ parseStatus: 1 });
resumeSchema.index({ atsScore: -1 });
resumeSchema.index({ extractedSkills: 1 });
resumeSchema.index({ highConfidenceSkills: 1 });
resumeSchema.index({ isDeleted: 1 });

resumeSchema.virtual("isParsed").get(function () {
  return this.parseStatus === "completed";
});

resumeSchema.virtual("hasSkills").get(function () {
  return Array.isArray(this.extractedSkills) && this.extractedSkills.length > 0;
});

module.exports = mongoose.model("Resume", resumeSchema);