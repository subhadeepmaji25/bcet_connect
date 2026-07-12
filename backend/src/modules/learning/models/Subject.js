// backend/src/modules/learning/models/Subject.js
const mongoose = require("mongoose");
const { SEMESTER_MIN, SEMESTER_MAX, CREDITS_MIN, CREDITS_MAX } = require("../constants/subject.constants");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
  department: { type: String, required: true, trim: true, index: true },
  semester: { type: Number, required: true, min: SEMESTER_MIN, max: SEMESTER_MAX, index: true },
  credits: { type: Number, min: CREDITS_MIN, max: CREDITS_MAX, default: 4 },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  resourceCount: { type: Number, default: 0, min: 0 },
  isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true, versionKey: false });

subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ code: 1, department: 1 }, { unique: true });
subjectSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Subject", subjectSchema);