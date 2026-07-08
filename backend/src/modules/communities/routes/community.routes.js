// backend/src/modules/communities/routes/community.routes.js
//
// NO changes to Community CRUD / Discovery / Join Requests / Feed /
// Comments sections in this pass — "/search" still stays above
// "/:communityId" (static paths before param routes in Express).
//
// ACTION ITEM (outside this file, unchanged from before): community.controller.js's
// listPublicCommunitiesController and getCommunityByIdController must
// pass `req.user?.id || null` as the service's viewerId argument for
// the isMember/joinMode fields to work. Both routes already use
// optionalAuthMiddleware, so req.user may legitimately be undefined for
// guests — the `?.` is required, not optional-chaining-for-style.
//
// UPDATED (this pass — membership section only):
// - GET "/:communityId/members" was already behind authMiddleware
//   (correct — do NOT switch this to optionalAuthMiddleware). The
//   controller now forwards req.user.id into getMembers() as viewerId,
//   which the new service signature requires to enforce PRIVATE/HIDDEN
//   visibility on the roster.
// - Added 3 new routes: unmute, ban, unban — mirroring the existing
//   mute route's middleware pattern (validateMemberParams first, then
//   a body validator where one exists).

const express = require("express");
const router = express.Router();

const { authMiddleware, optionalAuthMiddleware } = require("../../../shared/middlewares/auth.middleware");
const { communityActionLimiter } = require("../../../shared/security/rateLimiters");

const {
  validateCreateCommunity, validateUpdateCommunity,
  validateCommunityIdParam, validateListCommunitiesQuery,
  validateSearchCommunitiesQuery
} = require("../validators/community.validator");
const {
  validateChangeRole, validateTransferOwnership, validateMuteMember, validateBanMember,
  validateMemberParams, validateListMembersQuery
} = require("../validators/communityMember.validator");
const {
  validateCreateRequest, validateRejectRequest, validateRequestIdParam
} = require("../validators/communityJoinRequest.validator");
const {
  validateCreatePost, validateEditPost, validatePinPost,
  validatePostIdParam, validateFeedQuery
} = require("../validators/communityPost.validator");
const {
  validateCreateComment, validateEditComment, validateCommentIdParam,
  validatePostIdParam: validatePostIdParamForComments, validateCommentsQuery
} = require("../validators/communityComment.validator");

const {
  createCommunityController, updateCommunityController, archiveCommunityController,
  getCommunityByIdController, listPublicCommunitiesController,
  searchCommunitiesController
} = require("../controllers/community.controller");
const {
  joinCommunityController, leaveCommunityController, changeRoleController,
  transferOwnershipController, removeMemberController, muteMemberController,
  unmuteMemberController, banMemberController, unbanMemberController,
  getMembersController, getMyMembershipController
} = require("../controllers/communityMember.controller");
const {
  createRequestController, approveRequestController, rejectRequestController,
  getPendingRequestsController
} = require("../controllers/communityJoinRequest.controller");
const {
  createPostController, editPostController, deletePostController,
  pinPostController, likePostController, getFeedController, getPostByIdController
} = require("../controllers/communityPost.controller");
const {
  createCommentController, editCommentController, deleteCommentController,
  getCommentsController, getRepliesController
} = require("../controllers/communityComment.controller");

// ── Discovery (guest-friendly — public communities browsable without login) ─
router.get("/", optionalAuthMiddleware, validateListCommunitiesQuery, listPublicCommunitiesController);
// Must stay above "/:communityId" (static path, no param collision risk).
router.get("/search", optionalAuthMiddleware, validateSearchCommunitiesQuery, searchCommunitiesController);

// ── Community CRUD ────────────────────────────────────────────────
router.post("/", authMiddleware, communityActionLimiter, validateCreateCommunity, createCommunityController);
router.get("/:communityId", optionalAuthMiddleware, validateCommunityIdParam, getCommunityByIdController);
router.patch("/:communityId", authMiddleware, validateCommunityIdParam, validateUpdateCommunity, updateCommunityController);
router.delete("/:communityId", authMiddleware, validateCommunityIdParam, archiveCommunityController);

// ── Membership ────────────────────────────────────────────────────
// FIX (kept from earlier pass): join/leave/members must stay behind
// authMiddleware, not optionalAuthMiddleware — getMembers() needs a real
// req.user.id to check PRIVATE/HIDDEN membership; a guest has none.
router.post("/:communityId/join", authMiddleware, communityActionLimiter, validateCommunityIdParam, joinCommunityController);
router.delete("/:communityId/leave", authMiddleware, validateCommunityIdParam, leaveCommunityController);
router.get("/:communityId/members", authMiddleware, validateCommunityIdParam, validateListMembersQuery, getMembersController);
router.get("/:communityId/members/me", authMiddleware, validateCommunityIdParam, getMyMembershipController);

router.patch(
  "/:communityId/members/:userId/role",
  authMiddleware,
  validateMemberParams,
  validateChangeRole,
  changeRoleController
);
router.patch(
  "/:communityId/transfer-ownership",
  authMiddleware,
  validateCommunityIdParam,
  validateTransferOwnership,
  transferOwnershipController
);
router.delete(
  "/:communityId/members/:userId",
  authMiddleware,
  validateMemberParams,
  removeMemberController
);
router.patch(
  "/:communityId/members/:userId/mute",
  authMiddleware,
  validateMemberParams,
  validateMuteMember,
  muteMemberController
);
// NEW — counterpart to /mute, no body required.
router.patch(
  "/:communityId/members/:userId/unmute",
  authMiddleware,
  validateMemberParams,
  unmuteMemberController
);
// NEW — makes the previously-dead isBanned field real.
router.patch(
  "/:communityId/members/:userId/ban",
  authMiddleware,
  validateMemberParams,
  validateBanMember,
  banMemberController
);
// NEW — counterpart to /ban, no body required.
router.patch(
  "/:communityId/members/:userId/unban",
  authMiddleware,
  validateMemberParams,
  unbanMemberController
);

// ── Join Requests (private communities, and now also PUBLIC
//    communities with settings.requireApproval === true) ────────────
router.post(
  "/:communityId/join-requests",
  authMiddleware,
  communityActionLimiter,
  validateCommunityIdParam,
  validateCreateRequest,
  createRequestController
);
router.get(
  "/:communityId/join-requests",
  authMiddleware,
  validateCommunityIdParam,
  getPendingRequestsController
);
router.patch(
  "/join-requests/:requestId/approve",
  authMiddleware,
  validateRequestIdParam,
  approveRequestController
);
router.patch(
  "/join-requests/:requestId/reject",
  authMiddleware,
  validateRequestIdParam,
  validateRejectRequest,
  rejectRequestController
);

// ── Feed (Posts) ──────────────────────────────────────────────────
router.get(
  "/:communityId/feed",
  optionalAuthMiddleware, // public communities' feed viewable by guests
  validateCommunityIdParam,
  validateFeedQuery,
  getFeedController
);
router.post(
  "/:communityId/posts",
  authMiddleware,
  communityActionLimiter,
  validateCommunityIdParam,
  validateCreatePost,
  createPostController
);
router.get("/posts/:postId", optionalAuthMiddleware, validatePostIdParam, getPostByIdController);
router.patch("/posts/:postId", authMiddleware, validatePostIdParam, validateEditPost, editPostController);
router.delete("/posts/:postId", authMiddleware, validatePostIdParam, deletePostController);
router.patch("/posts/:postId/pin", authMiddleware, validatePostIdParam, validatePinPost, pinPostController);
router.post("/posts/:postId/like", authMiddleware, validatePostIdParam, likePostController);

// ── Comments ──────────────────────────────────────────────────────
router.get(
  "/posts/:postId/comments",
  optionalAuthMiddleware,
  validatePostIdParamForComments,
  validateCommentsQuery,
  getCommentsController
);
router.post(
  "/posts/:postId/comments",
  authMiddleware,
  validatePostIdParamForComments,
  validateCreateComment,
  createCommentController
);
router.patch("/comments/:commentId", authMiddleware, validateCommentIdParam, validateEditComment, editCommentController);
router.delete("/comments/:commentId", authMiddleware, validateCommentIdParam, deleteCommentController);
router.get("/comments/:commentId/replies", optionalAuthMiddleware, validateCommentIdParam, getRepliesController);

module.exports = router;