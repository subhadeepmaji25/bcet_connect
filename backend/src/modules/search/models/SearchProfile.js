// backend/src/modules/search/models/SearchProfile.js
const mongoose = require("mongoose");

const lowercaseStringArray = () => [{ type: String, lowercase: true, trim: true }];

const educationSnapshotSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true, default: "" },
    degree: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    specialization: { type: String, trim: true, default: "" },
    educationLevel: { type: String, trim: true, default: "" },
    current: { type: Boolean, default: false },
    startYear: { type: Number, default: null },
    endYear: { type: Number, default: null },
    skills: lowercaseStringArray()
  },
  { _id: false }
);

const experienceSnapshotSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    employmentType: { type: String, trim: true, default: "" },
    industry: { type: String, trim: true, default: "" },
    currentlyWorking: { type: Boolean, default: false },
    skills: lowercaseStringArray()
  },
  { _id: false }
);

const projectSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    projectType: { type: String, trim: true, default: "" },
    status: { type: String, trim: true, default: "" },
    deployed: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    projectScore: { type: Number, default: 0 },
    skills: lowercaseStringArray()
  },
  { _id: false }
);

const searchProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    username: { type: String, lowercase: true, trim: true, default: "" },
    fullName: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["student", "faculty", "alumni", "admin"], default: "student" },
    isMentor: { type: Boolean, default: false },
    mentorProfileVisibility: { type: String, enum: ["public", "private"], default: "public" },
    avatar: { type: String, trim: true, default: "" },
    headline: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    currentCompany: { type: String, trim: true, default: "" },
    currentRole: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    passoutYear: { type: Number, default: null },
    visibility: { type: String, enum: ["public", "private"], default: "public" },

    profileSkills: lowercaseStringArray(),
    verifiedSkills: lowercaseStringArray(),
    advancedSkills: lowercaseStringArray(),
    skillTags: lowercaseStringArray(),
    educationSkills: lowercaseStringArray(),
    projectSkills: lowercaseStringArray(),
    experienceSkills: lowercaseStringArray(),
    resumeSkills: lowercaseStringArray(),
    mergedSkills: lowercaseStringArray(),
    searchKeywords: lowercaseStringArray(),

    education: { type: [educationSnapshotSchema], default: [] },
    latestEducation: { type: educationSnapshotSchema, default: null },
    companies: lowercaseStringArray(),
    experiences: { type: [experienceSnapshotSchema], default: [] },
    latestExperience: { type: experienceSnapshotSchema, default: null },
    projects: { type: [projectSnapshotSchema], default: [] },

    profileCompletion: { type: Number, min: 0, max: 100, default: 0 },
    recommendationEnabled: { type: Boolean, default: false },
    searchScore: { type: Number, min: 0, max: 100, default: 0 },

    totalSkills: { type: Number, default: 0 },
    totalVerifiedSkills: { type: Number, default: 0 },
    totalAdvancedSkills: { type: Number, default: 0 },
    totalProjects: { type: Number, default: 0 },
    totalPublicProjects: { type: Number, default: 0 },
    totalDeployedProjects: { type: Number, default: 0 },
    totalFeaturedProjects: { type: Number, default: 0 },
    totalExperiences: { type: Number, default: 0 },
    totalEducation: { type: Number, default: 0 },
    resumeUploaded: { type: Boolean, default: false },
    totalResumeSkills: { type: Number, default: 0 },

    lastActiveAt: { type: Date, default: Date.now },
    generatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

searchProfileSchema.index({ visibility: 1, searchScore: -1, profileCompletion: -1, lastActiveAt: -1 });
searchProfileSchema.index({ visibility: 1, role: 1, searchScore: -1 });
searchProfileSchema.index({ visibility: 1, isMentor: 1, mentorProfileVisibility: 1, searchScore: -1 });
searchProfileSchema.index({ username: 1 });
searchProfileSchema.index({ fullName: 1 });
searchProfileSchema.index({ searchKeywords: 1 });
searchProfileSchema.index({ mergedSkills: 1 });
searchProfileSchema.index({ verifiedSkills: 1 });
searchProfileSchema.index({ advancedSkills: 1 });
searchProfileSchema.index({ companies: 1 });
searchProfileSchema.index({ branch: 1 });
searchProfileSchema.index({ role: 1 });
searchProfileSchema.index({ isMentor: 1 });
searchProfileSchema.index({ mentorProfileVisibility: 1 });
searchProfileSchema.index({ passoutYear: 1 });
searchProfileSchema.index({ recommendationEnabled: 1 });
searchProfileSchema.index({ totalDeployedProjects: -1 });
searchProfileSchema.index({ totalFeaturedProjects: -1 });

searchProfileSchema.virtual("isSearchReady").get(function () {
  return this.profileCompletion >= 60;
});

searchProfileSchema.virtual("hasSkills").get(function () {
  return Array.isArray(this.mergedSkills) && this.mergedSkills.length > 0;
});

searchProfileSchema.virtual("recommendationReady").get(function () {
  return Boolean(this.recommendationEnabled);
});

module.exports = mongoose.model("SearchProfile", searchProfileSchema);