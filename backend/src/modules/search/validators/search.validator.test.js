const test = require("node:test");
const assert = require("node:assert/strict");

const { validateSearchAllQuery } = require("./search.validator");

test("validateSearchAllQuery normalizes global search filters", () => {
  const filters = validateSearchAllQuery({
    q: "React",
    includeUsers: "false",
    includeLearning: "true",
    includeEvents: "1",
    contentType: "resource",
    semester: "4",
    type: "pdf",
    difficulty: "beginner",
    skill: "Node.js",
    tag: "Backend",
    category: "workshop",
    page: "2",
    limit: "25"
  });

  assert.equal(filters.q, "React");
  assert.equal(filters.includeUsers, false);
  assert.equal(filters.includeLearning, true);
  assert.equal(filters.includeEvents, true);
  assert.equal(filters.contentType, "resource");
  assert.equal(filters.semester, 4);
  assert.equal(filters.type, "pdf");
  assert.equal(filters.difficulty, "beginner");
  assert.equal(filters.skill, "node.js");
  assert.equal(filters.tag, "backend");
  assert.equal(filters.category, "workshop");
  assert.equal(filters.page, 2);
  assert.equal(filters.limit, 25);
});

test("validateSearchAllQuery rejects invalid learning filters", () => {
  assert.throws(
    () => validateSearchAllQuery({ contentType: "course" }),
    /Invalid contentType filter/
  );

  assert.throws(
    () => validateSearchAllQuery({ semester: "11" }),
    /semester must be between 1 and 8/
  );
});
