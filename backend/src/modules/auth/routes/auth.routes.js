// backend/src/modules/auth/routes/auth.routes.js

const express = require("express");

const { registerController } = require("../controllers/register.controller");
const { loginController } = require("../controllers/login.controller");
const { logoutController } = require("../controllers/logout.controller");
const { changePasswordController } = require("../controllers/changePassword.controller");
const { resetPasswordController } = require("../controllers/resetPassword.controller");

const { registerValidator } = require("../validators/register.validator");
const { loginValidator } = require("../validators/login.validator");
const { changePasswordValidator } = require("../validators/changePassword.validator");
const { resetPasswordValidator } = require("../validators/resetPassword.validator");

const authMiddleware = require("../../../shared/middlewares/auth.middleware");

const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter
} = require("../../../shared/security/rateLimiters");

const router = express.Router();

// ─────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────

router.post(
  "/register",
  registerLimiter,       // IP level protection
  registerValidator,     // Input validation
  registerController     // Business logic
);

router.post(
  "/login",
  loginLimiter,
  loginValidator,
  loginController
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  resetPasswordValidator,
  resetPasswordController
);

// ─────────────────────────────────────────
// Protected Routes (JWT required)
// ─────────────────────────────────────────

router.post(
  "/logout",
  authMiddleware,
  logoutController
);

router.patch(
  "/change-password",
  authMiddleware,
  changePasswordValidator,
  changePasswordController
);

module.exports = router;