// backend/src/modules/search/routes/search.routes.js
//
// FIX applied in this version:
// Added GET /stats, wired to the new getSearchStatsController. This
// is a static path (no ":param" segments anywhere else in this file
// that could collide with it), so no route-ordering concerns.

const express = require("express");
const authMiddleware = require("../../../shared/middlewares/auth.middleware");
const {
  searchUsersController,
  searchAllController,
  searchEventsController,
  searchBySkillController,
  searchByBranchController,
  searchByRoleController,
  searchByCompanyController,
  searchSuggestionsController,
  getMySearchProfileController,
  rebuildMySearchProfileController,
  getSearchStatsController
} = require("../controllers/search.controller");

const router = express.Router();

router.get("/users", authMiddleware, searchUsersController);
router.get("/all", authMiddleware, searchAllController);
// Static segment — must come BEFORE /skills/:skill, /branches/:branch, etc.
// so Express never confuses "events" for a :param value.
router.get("/events", authMiddleware, searchEventsController);
router.get("/skills/:skill", authMiddleware, searchBySkillController);
router.get("/branches/:branch", authMiddleware, searchByBranchController);
router.get("/roles/:role", authMiddleware, searchByRoleController);
router.get("/companies/:company", authMiddleware, searchByCompanyController);
router.get("/suggestions", authMiddleware, searchSuggestionsController);
router.get("/me", authMiddleware, getMySearchProfileController);
router.post("/rebuild", authMiddleware, rebuildMySearchProfileController);

// NEW — closes the "/search/stats 404" gap seen in the logs.
router.get("/stats", authMiddleware, getSearchStatsController);

module.exports = router;
