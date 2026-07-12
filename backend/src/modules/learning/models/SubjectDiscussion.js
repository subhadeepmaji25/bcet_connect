// backend/src/modules/learning/models/SubjectDiscussion.js
//
// NEW MODULE — Learning (Academic Learning domain, Phase 5).
//
// The brainstorm doc asked for "Stack Overflow style, not Telegram
// style" — Question -> Answers -> Faculty Answer -> Pinned -> Solved.
// Deliberately modeled as ONE flat-threaded collection (question =
// parentCommentId: null, answer = parentCommentId: <questionId>), the
// EXACT same shape ResourceComment.js/CommunityComment.js/FeedComment.js
// already use — NOT a separate Question/Answer two-collection split.
// Every other discussion surface in this codebase (Resource comments,
// Community posts+comments, Feed comments) uses this single-collection-
// with-parentCommentId convention; inventing a two-collection Question/
// Answer schema here would be the only inconsistent one in the entire
// backend for zero functional benefit — everything a Q&A UI needs
// (accepted answer, faculty badge, pinned question) fits as extra
// fields on this same flat shape.
//
// Scoped to subjectId (NOT resourceId) — this is the genuinely new
// piece Problem 7 in the review correctly flagged: ResourceComment.js
// only lets you discuss ONE specific uploaded file; a student asking
// "can someone explain normalization in general" has no home without
// this file, since it isn't about any single resource.

const mongoose = require("mongoose");

// Local, unexported enum — same restraint LearningProgress.js/
// ResourceComment.js already show for their own small status fields.
const DISCUSSION_STATUS_VALUES = Object.freeze(["active", "removed"]);

const subjectDiscussionSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    content: { type: String, trim: true, required: true, maxlength: 2000 },

    // null = top-level question, set = an answer to that question.
    // Same convention as ResourceComment.js's identical field — only
    // ONE level of nesting is allowed (an answer cannot itself have a
    // parentCommentId pointing at another answer), enforced in the
    // future subjectDiscussion.service.js the same way
    // resourceEngagement.service.js's createComment() already enforces
    // it for ResourceComment.
    parentDiscussionId: { type: mongoose.Schema.Types.ObjectId, ref: "SubjectDiscussion", default: null, index: true },

    // Title only makes sense on a top-level question (like a Stack
    // Overflow question title) — null/empty for answers. Not enforced
    // at schema level (Mongoose conditional-required across a
    // parentDiscussionId branch is brittle, same reasoning
    // LearningResource.js's file/externalUrl split already documents),
    // the validator layer is the real gate.
    title: { type: String, trim: true, maxlength: 200, default: "" },

    // Denormalized — true when authorId's role was "faculty" or "admin"
    // AT THE TIME OF POSTING. Computed once at creation by the service
    // layer (reads req.user.role, never re-derived on every read), same
    // "snapshot at write time" discipline UPLOADER_ROLE already follows
    // on LearningResource — a Faculty member who later loses faculty
    // status shouldn't retroactively un-badge their past answers.
    isFacultyAnswer: { type: Boolean, default: false },

    // Only meaningful on a top-level question (parentDiscussionId ===
    // null) — which ONE answer's _id the question-author (or Faculty/
    // Admin) marked as accepted. null means still open/unsolved.
    acceptedAnswerId: { type: mongoose.Schema.Types.ObjectId, ref: "SubjectDiscussion", default: null },

    // Only meaningful on a top-level question too — Faculty/Admin can
    // pin a particularly useful thread to the top of a subject's
    // discussion list, same "pinned" concept CommunityPost.js already
    // has (pinned/pinnedAt pair), reused here rather than reinvented.
    pinned: { type: Boolean, default: false },
    pinnedAt: { type: Date, default: null },

    // Denormalized reaction cache — same likedBy-array pattern
    // ResourceComment.js already uses (see that file's header for why
    // a full FeedReaction-style collection is overkill here).
    likeCount: { type: Number, default: 0, min: 0 },
    likedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },

    // Denormalized — how many replies a top-level question has. Zero
    // for answers themselves (an answer doesn't have replies of its
    // own, per the single-level-nesting rule above). Mirrors
    // CommunityPost.commentCount / FeedPost.commentCount exactly.
    answerCount: { type: Number, default: 0, min: 0 },

    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    status: { type: String, enum: DISCUSSION_STATUS_VALUES, default: "active" }
  },
  { timestamps: true, versionKey: false }
);

// Subject's discussion list — pinned questions first, then newest.
// Mirrors CommunityPost.js's { communityId, pinned:-1, pinnedAt:-1 }
// index exactly, same reasoning: pinned-vs-normal query split happens
// at the service layer, this index just makes both halves fast.
subjectDiscussionSchema.index({ subjectId: 1, parentDiscussionId: 1, pinned: -1, pinnedAt: -1, createdAt: -1 });
// Answers under one specific question, oldest first (natural
// conversation order) — same shape ResourceComment.js's
// { resourceId, parentCommentId } index already serves.
subjectDiscussionSchema.index({ subjectId: 1, parentDiscussionId: 1, createdAt: 1 });
// "My discussion activity" — a student's own questions/answers across
// all subjects.
subjectDiscussionSchema.index({ authorId: 1, createdAt: -1 });

subjectDiscussionSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("SubjectDiscussion", subjectDiscussionSchema);