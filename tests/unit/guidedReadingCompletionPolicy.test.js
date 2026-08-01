import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { shouldShowGuidedReadingScoreSummary } from "../../src/utils/guidedReading/completionPolicy.js";

const guidedReadingPageSource = readFileSync(
  new URL("../../src/components/guided-reading/GuidedReadingPage.jsx", import.meta.url),
  "utf8"
);

test("only a teacher scoring one named student sees the end-of-book score summary", () => {
  assert.equal(shouldShowGuidedReadingScoreSummary({ mode: "teacher", studentId: "student-1" }), true);
  assert.equal(shouldShowGuidedReadingScoreSummary({ mode: "teacher", studentId: "" }), false);
  assert.equal(shouldShowGuidedReadingScoreSummary({ mode: "student", studentId: "student-1" }), false);
  assert.equal(shouldShowGuidedReadingScoreSummary({ mode: "class", studentId: "student-1" }), false);
  assert.equal(shouldShowGuidedReadingScoreSummary({ mode: "class", studentId: "" }), false);
});

test("child and whole-group completion paths close the reader instead of opening scores", () => {
  assert.match(guidedReadingPageSource, /if \(isStudentMode\) \{[\s\S]*?setShowQuiz\(true\);[\s\S]*?\} else if \(canShowScoreSummary\) \{[\s\S]*?setShowSummary\(true\);[\s\S]*?\} else \{[\s\S]*?closeReader\(\);/);
  assert.match(guidedReadingPageSource, /\} else if \(canShowScoreSummary\) \{[\s\S]*?setShowSummary\(true\);[\s\S]*?\} else \{[\s\S]*?closeReader\(\);[\s\S]*?function changeBook/);
  assert.match(guidedReadingPageSource, /readerOpen && !scoreSummaryOpen/);
  assert.match(guidedReadingPageSource, /: scoreSummaryOpen \? \(/);
});
