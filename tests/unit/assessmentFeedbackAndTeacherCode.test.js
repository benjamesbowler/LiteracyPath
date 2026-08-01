import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appPagesSource = readFileSync(
  new URL("../../src/components/AppPages.jsx", import.meta.url),
  "utf8"
);
const teacherContextSource = readFileSync(
  new URL("../../src/components/teacher/TeacherContextBar.jsx", import.meta.url),
  "utf8"
);
const appSurfaceSource = readFileSync(
  new URL("../../src/components/AppSurface.jsx", import.meta.url),
  "utf8"
);

test("assessment feedback is concise and has no extra-click controls", () => {
  assert.match(appPagesSource, /feedback\.isCorrect \? "Correct" : "Incorrect"/);
  assert.match(appPagesSource, /<p>\{feedback\.explanation\}<\/p>/);
  assert.match(appPagesSource, /feedback-auto-advance">Next question…/);
  assert.match(appPagesSource, /actions\.setFeedback\(null\);\s*actions\.pickQuestion\(\);/);
  assert.doesNotMatch(appPagesSource, /← Change my answer/);
});

test("teacher context bar keeps the student sign-in code beside the class", () => {
  assert.match(teacherContextSource, /School and class/);
  assert.match(teacherContextSource, /Student sign-in code/);
  assert.match(teacherContextSource, /Copy student sign-in code \$\{classCode\}/);
  assert.match(appSurfaceSource, /access_code/);
  assert.match(appSurfaceSource, /accessCode/);
});
