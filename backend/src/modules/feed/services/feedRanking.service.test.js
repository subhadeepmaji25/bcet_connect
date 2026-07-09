const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateEngagementScore,
  calculatePlatformBoost,
  rankFeedPosts
} = require("./feedRanking.service");

test("engagement score weighs comments more than likes", () => {
  assert.ok(calculateEngagementScore(0, 2) > calculateEngagementScore(2, 0));
});

test("pinned faculty/admin content gets a platform boost", () => {
  const boosted = calculatePlatformBoost({
    isPinned: true,
    authorId: { role: "faculty" }
  });
  const normal = calculatePlatformBoost({
    isPinned: false,
    authorId: { role: "student" }
  });

  assert.ok(boosted > normal);
});

test("rankFeedPosts keeps higher scored posts first", () => {
  const now = Date.now();
  const posts = [
    { _id: "a", authorId: { _id: "author-a", role: "student" }, createdAt: now - 1000 * 60 * 60, likeCount: 0, commentCount: 0 },
    { _id: "b", authorId: { _id: "author-b", role: "faculty" }, createdAt: now, likeCount: 0, commentCount: 0, isPinned: true }
  ];
  const sourceFlags = new Map([
    ["author-a", { isConnection: true }],
    ["author-b", { isCommunity: true }]
  ]);

  assert.equal(rankFeedPosts(posts, sourceFlags, now)[0]._id, "b");
});
