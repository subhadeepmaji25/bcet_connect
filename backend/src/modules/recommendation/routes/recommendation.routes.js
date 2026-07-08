// backend/src/modules/recommendation/routes/recommendation.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../shared/middlewares/auth.middleware");
const { allowRoles } = require("../../../shared/middlewares/roleMiddleware");
const { validateRecommendationQuery } = require("../validators/recommendation.validator");

const {
  getRecommendedJobsController,
  getJobMatchController
} = require("../controllers/recommendation.controller");

// Sirf student/alumni ko recommendations milengi — same roles jo jobs apply kar sakte hain.
router.get(
  "/jobs",
  authMiddleware,
  allowRoles("student", "alumni"),
  validateRecommendationQuery,
  getRecommendedJobsController
);

router.get(
  "/jobs/:jobId",
  authMiddleware,
  allowRoles("student", "alumni"),
  getJobMatchController
);

module.exports = router;