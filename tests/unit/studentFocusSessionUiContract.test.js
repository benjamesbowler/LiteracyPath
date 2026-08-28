import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const appSurface = fs.readFileSync(
  new URL("../../src/components/AppSurface.jsx", import.meta.url),
  "utf8"
);
const assessment = fs.readFileSync(
  new URL("../../src/components/AppPages.jsx", import.meta.url),
  "utf8"
);
const library = fs.readFileSync(
  new URL("../../src/components/StudentBooksPage.jsx", import.meta.url),
  "utf8"
);
const letters = fs.readFileSync(
  new URL("../../src/components/learn/phonics/PhonicsLearnTab.jsx", import.meta.url),
  "utf8"
);
const assessmentController = fs.readFileSync(
  new URL("../../src/appState/assessmentRoundController.js", import.meta.url),
  "utf8"
);

test("teacher pages expose the unified Student Sessions launcher and live controls", () => {
  assert.match(appSurface, /<StudentSessionSetup/);
  assert.match(appSurface, /<StudentSessionBar/);
  assert.match(appSurface, /onStartGuidedReading=\{\(\) => setReadingSetupOpen\(true\)\}/);
});

test("student focus mode removes escape navigation from the shared shell and library", () => {
  assert.match(appSurface, /tabs=\{isStudentFocusLocked \? \[\] : STUDENT_TAB_BAR\}/);
  assert.match(appSurface, /showGrownUps=\{!isStudentFocusLocked\}/);
  assert.match(library, /tabs=\{focusLocked \? \[\] : undefined\}/);
  assert.match(library, /\{!focusLocked && \([\s\S]*Story Quests/);
});

test("independent assessment saves neutral feedback without revealing correctness", () => {
  assert.match(assessment, /independentAssessment \? "Answer saved"/);
  assert.match(assessment, /!independentAssessment && <p>\{feedback\.explanation\}<\/p>/);
  assert.match(assessment, /!independentAssessment && onChangeSkillLevel/);
  assert.match(assessment, /!independentAssessment && \([\s\S]*End assessment/);
  assert.doesNotMatch(assessmentController, /saveAssessmentAttemptLocal/);
});

test("letters-only mode hides Words and rejects non-letter island changes", () => {
  assert.match(letters, /if \(lockedToLetters && island !== "letters"\) return/);
  assert.match(letters, /\{!lockedToLetters && \([\s\S]*aria-label=\{wordsUnlocked \? "Words"/);
});
