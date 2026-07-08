// backend/src/modules/auth/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// FIX: LOGIN_LOCK_TIME=15 means 15 minutes, not 15ms
const LOGIN_LOCK_TIME =
  (Number(process.env.LOGIN_LOCK_TIME) || 15) * 60 * 1000;

const MAX_LOGIN_ATTEMPTS = 5;

const USER_ROLES = ["student", "faculty", "alumni", "admin"];

const ACCOUNT_STATUS = ["pending", "active", "rejected", "suspended"];

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      index: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9._]{3,30}$/
    },

    searchUsername: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/
    },

    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    identityId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },

    profileCreated: {
      type: Boolean,
      default: false
    },

    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      default: null
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUS,
      default: "pending"
    },

    tokenVersion: {
      type: Number,
      default: 0
    },

    passwordChangedAt: {
      type: Date,
      default: null
    },

    loginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date,
      default: null
    },

    lastLoginAt: {
      type: Date,
      default: null
    },

    lastSeenAt: {
      type: Date,
      default: Date.now
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: {
      type: Date,
      default: null
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound index for role-based queries
userSchema.index({ role: 1, accountStatus: 1 });

// ─────────────────────────────────────────
// Instance Methods
// ─────────────────────────────────────────

userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
  this.passwordChangedAt = new Date();
};

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.isActive = function () {
  return this.accountStatus === "active";
};

userSchema.methods.isPending = function () {
  return this.accountStatus === "pending";
};

userSchema.methods.isRejected = function () {
  return this.accountStatus === "rejected";
};

userSchema.methods.isSuspended = function () {
  return this.accountStatus === "suspended";
};

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.markLoginSuccess = async function () {
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();
  this.lastSeenAt = new Date();
  return this.save();
};

userSchema.methods.markLoginFailure = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOGIN_LOCK_TIME);
  }
  return this.save();
};

userSchema.methods.invalidateSessions = async function () {
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  return this.save();
};

// ─────────────────────────────────────────
// Static Methods
// ─────────────────────────────────────────

userSchema.statics.findByIdentifier = function (identifier) {
  const normalized = identifier.trim();
  return this.findOne({
    isDeleted: false,
    $or: [
      { email: normalized.toLowerCase() },
      { username: normalized.toLowerCase() },
      { identityId: normalized.toUpperCase() }
    ]
  }).select("+passwordHash");
};

module.exports = mongoose.model("User", userSchema);
