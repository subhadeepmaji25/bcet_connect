const test = require("node:test");
const assert = require("node:assert/strict");
const { inspectContent } = require("./feedModeration.service");
const { MODERATION_STATUS } = require("../constants/feed.constants");

test("clean feed content is approved", () => {
  const result = inspectContent("Sharing my internship notes for Python and SQL.");
  assert.equal(result.status, MODERATION_STATUS.APPROVED);
  assert.deepEqual(result.reasons, []);
});

test("abusive feed content is blocked", () => {
  const result = inspectContent("This is shit");
  assert.equal(result.status, MODERATION_STATUS.BLOCKED);
  assert.ok(result.reasons.length > 0);
});
