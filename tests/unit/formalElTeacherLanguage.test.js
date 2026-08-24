import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("formal EL panel and PDF do not contain system-facing route or microphase copy", () => {
  const panel = source("../../src/components/reports/ElFormalAssessmentsPanel.jsx");
  const document = source("../../src/components/reports/ElClassReportDocument.jsx");

  for (const [name, component] of Object.entries({ panel, document })) {
    assert.doesNotMatch(
      component,
      /\b(?:EL route|included attempts?|candidate microphases?|assessment routes?|provisional microphase|teacher-confirmed microphase)\b/i,
      `${name} must use teacher-facing grade, time-of-year, saved-result and reading-stage language`
    );
  }
});

test("formal EL reporting offers one-action downloads for selected student reports", () => {
  const picker = source("../../src/components/reports/ElStudentBatchReportPicker.jsx");
  const exporter = source("../../src/utils/exportElAssessmentExcel.js");

  assert.match(picker, /Download student EL reports/);
  assert.match(picker, /Download selected reports/);
  assert.match(picker, /exportStudentElAssessmentBatch/);
  assert.match(exporter, /new JSZip\(\)/);
  assert.match(exporter, /student-letter-reports/);
});

test("formal EL assessment runner labels its sequence as an assessment plan", () => {
  const assessment = source(
    "../../src/components/assessment/ELBenchmarkAssessmentPage.jsx"
  );

  assert.doesNotMatch(assessment, /aria-label="Assessment route and progress"/);
  assert.doesNotMatch(assessment, />\s*Assessment route\s*</);
  assert.doesNotMatch(assessment, /content and routing are provisional/);
  assert.doesNotMatch(assessment, /this assessment(?:'|’|&apos;)s route/);
  assert.doesNotMatch(assessment, /\b(?:passage route|decoding band)\b/i);
  assert.match(
    assessment,
    /TEACHER_COPY\.formalEl\.assessmentPlanAriaLabel/
  );
  assert.match(
    assessment,
    /TEACHER_COPY\.formalEl\.assessmentPlanLabel/
  );
});

test("individual EL report presents reading stages and next-step decisions in teacher language", () => {
  const report = source("../../src/components/FinishedReportPage.jsx");

  assert.doesNotMatch(
    report,
    /["'`](?:Microphase|Route decision|Route judgment usable)["'`]/
  );
  assert.match(report, /TEACHER_COPY\.formalEl\.readingStageLabel/);
  assert.match(report, /TEACHER_COPY\.formalEl\.nextStepDecisionLabel/);
  assert.match(report, /TEACHER_COPY\.formalEl\.suggestedReadingStage/);
  assert.match(report, /TEACHER_COPY\.formalEl\.confirmedReadingStage/);
});
