import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { EL_BENCHMARK_IDS } from "../../src/data/elBenchmarkAssessments.js";

// Rewritten 2026-07-27.
//
// This file used to test a separate EL hub page. That page is gone: starting an
// EL check is step 3 and step 4 of the one Checks funnel, which has a URL and
// asks for the class and the student itself. What is tested here is unchanged
// in substance - the starting band must come from COMPLETED results and never
// from a newer partial one, and a start that deviates from the indicated band
// must still be blocked until a reason is recorded.

let TeacherAssessmentsPage;
let vite;

const COMMON = { benchmarkWindow: "MOY", gradePath: "1", studentId: "student-1" };

const HISTORY = [
  {
    ...COMMON,
    administrationStatus: "completed",
    assessmentType: EL_BENCHMARK_IDS.ENCODING,
    attemptId: "encoding-completed",
    completedAt: "2026-07-20T10:00:00.000Z",
    confirmedPlacement: { candidateMicrophase: "late_partial" }
  },
  {
    ...COMMON,
    administrationStatus: "partial",
    assessmentType: EL_BENCHMARK_IDS.ENCODING,
    attemptId: "encoding-newer-partial",
    updatedAt: "2026-07-21T10:00:00.000Z",
    confirmedPlacement: { candidateMicrophase: "middle_full" }
  },
  {
    ...COMMON,
    administrationStatus: "completed",
    assessmentType: EL_BENCHMARK_IDS.DECODING,
    attemptId: "decoding-completed",
    completedAt: "2026-07-20T11:00:00.000Z",
    fluencyStartMicrophase: { microphase: "early_full" }
  },
  {
    ...COMMON,
    administrationStatus: "partial",
    assessmentType: EL_BENCHMARK_IDS.DECODING,
    attemptId: "decoding-newer-partial",
    updatedAt: "2026-07-21T11:00:00.000Z",
    fluencyStartMicrophase: { microphase: "late_full" }
  }
];

function renderFunnel(routeHash, history = HISTORY) {
  return renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    assessmentHistory: history,
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    studentRows: [{ id: "student-1", name: "Ada" }],
    selectedStudentId: "student-1",
    selectedStudentName: "Ada",
    firstUnsecuredSkillIndex: 3,
    routeHash
  }));
}

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const module = await vite.ssrLoadModule("/src/components/TeacherAssessmentsPage.jsx");
  TeacherAssessmentsPage = module.TeacherAssessmentsPage;
});

test.after(async () => {
  await vite?.close();
});

test("the funnel is one page: class, student, assessment, starting point, Begin", () => {
  const html = renderFunnel("#teacher/assessments?class=class-a&learner=student-1");
  for (const step of [
    "Choose a class",
    "Choose a student",
    "Choose an assessment"
  ]) {
    assert.match(html, new RegExp(`>${step}<`), `step "${step}" is missing`);
  }
  // Step 3 offers every startable check from the one catalog, not a hand-built grid.
  for (const label of [
    "Skills assessment",
    "Letter names and sounds",
    "Phonics patterns",
    "Sound awareness",
    "Spelling",
    "Word reading",
    "Reading fluency"
  ]) {
    assert.match(html, new RegExp(`<strong>${label}</strong>`), `${label} is missing from step 3`);
  }
  // Steps below the current one are visible and say why they are waiting,
  // rather than disappearing.
  assert.match(html, /Choose an assessment first\./);
  assert.match(html, /Everyday assessments/);
  assert.match(html, /EL assessments/);
  assert.match(html, /harder letter patterns the student recognises and sounds out/);
  assert.doesNotMatch(html, /harder letter patterns the student already reads and spells/);
});

test("a teacher can search a long class list before choosing a student", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    studentRows: [{ id: "student-1", name: "Ada" }, { id: "student-2", name: "Bo" }],
    routeHash: "#teacher/assessments?class=class-a"
  }));
  assert.match(html, /Find a student/);
  assert.match(html, /type="search"/);
  assert.match(html, /<strong>Ada<\/strong>/);
});

test("a fixed full-set assessment does not repeat an empty start-point message", () => {
  const html = renderFunnel(
    "#teacher/assessments?class=class-a&learner=student-1&check=letter-names-and-sounds"
  );
  assert.match(html, />Ready to begin</);
  assert.match(html, /This assessment covers the full set of letters\./);
  assert.match(html, />Full set of letters</);
  assert.doesNotMatch(html, /Nothing to choose|nothing to choose|Starts at the beginning/);
});

test("the starting band comes from completed results, never from a newer partial one", () => {
  const html = renderFunnel(
    "#teacher/assessments?class=class-a&learner=student-1&check=el_decoding&grade=1&time=MOY"
  );
  assert.match(html, /Set from this student&#x27;s last confirmed spelling result\./);
  assert.match(html, /<option value="late_partial" selected="">Late Partial<\/option>/);
  assert.doesNotMatch(html, /<option value="middle_full" selected="">/);

  const fluency = renderFunnel(
    "#teacher/assessments?class=class-a&learner=student-1&check=el_oral_reading_fluency&grade=1&time=MOY"
  );
  assert.match(fluency, /Set from this student&#x27;s last completed word reading result\./);
  assert.match(fluency, /<option value="early_full" selected="">Early Full<\/option>/);
});

test("a spelling result that was never confirmed is shown as provisional", () => {
  const html = renderFunnel(
    "#teacher/assessments?class=class-a&learner=student-1&check=el_decoding&grade=1&time=MOY",
    [{
      ...COMMON,
      administrationStatus: "completed",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      attemptId: "encoding-candidate-only",
      completedAt: "2026-07-20T10:00:00.000Z",
      candidatePlacement: { candidateMicrophase: "late_partial" }
    }]
  );
  assert.match(html, /has not been confirmed yet/);
});

test("the skills check opens on the child's next skill and can be changed before it starts", () => {
  // The only way to change this used to be a picker INSIDE the running check.
  const html = renderFunnel(
    "#teacher/assessments?class=class-a&learner=student-1&check=skills-check"
  );
  assert.match(html, /Skill this assessment starts on/);
  assert.match(html, /<option value="3" selected="">CVC and Short Vowels<\/option>/);
});

test("assessment choices and starting points fail closed until every saved-result source loads", () => {
  const shared = {
    assessmentHistory: HISTORY,
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    studentRows: [{ id: "student-1", name: "Ada" }],
    selectedStudentId: "student-1",
    selectedStudentName: "Ada",
    firstUnsecuredSkillIndex: 3,
    studentEvidenceReady: false,
    routeHash: "#teacher/assessments?class=class-a&learner=student-1&check=skills-check"
  };
  const loading = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    ...shared,
    studentEvidenceReadState: { syncStatus: "loading" }
  }));
  assert.match(loading, /Getting Ada.s saved results/);
  assert.match(loading, /aria-busy="true"/);
  assert.doesNotMatch(loading, /Skill this assessment starts on/);
  assert.doesNotMatch(loading, />Begin Skills assessment</);

  const partial = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    ...shared,
    studentEvidenceReadState: { syncStatus: "partial" }
  }));
  assert.match(partial, /We couldn&#x27;t load all of Ada.s saved results/);
  assert.match(partial, /Nothing is being counted as zero/);
  assert.match(partial, />Try again</);
  assert.doesNotMatch(partial, /Skill this assessment starts on/);
  assert.doesNotMatch(partial, />Begin Skills assessment</);
});

test("deviating from the indicated band still requires a recorded reason", () => {
  const startPointSource = readFileSync(
    new URL("../../src/components/assessment/elBenchmarkStartPoint.js", import.meta.url),
    "utf8"
  );
  const reviewSource = readFileSync(
    new URL("../../src/components/assessment/ELAssessmentsPage.jsx", import.meta.url),
    "utf8"
  );
  const funnelSource = readFileSync(
    new URL("../../src/components/TeacherAssessmentsPage.jsx", import.meta.url),
    "utf8"
  );

  assert.match(startPointSource, /teacher_changed_confirmed_encoding_start/);
  assert.match(startPointSource, /teacher_changed_decoding_fluency_handoff/);
  assert.match(startPointSource, /teacherConfirmed: teacherReviewed/);
  assert.match(startPointSource, /reviewedAt: teacherReviewed \?/);
  // A start that matches the child's own confirmed result keeps the engine's
  // own provenance instead of recording an override that never happened.
  assert.match(startPointSource, /keepEngineProvenance/);

  assert.match(reviewSource, /EL_PREREQUISITE_REASON_OPTIONS\.map/);
  assert.match(reviewSource, /disabled=\{!reasonText\}/);

  // Begin routes through the gate rather than around it.
  assert.match(funnelSource, /elStartPoint\.needsRecordedReason\) \{\s*\n\s*setAwaitingReason\(true\)/);
  assert.match(funnelSource, /standalone EL report/);
});

test("an unfinished saved check is offered for resuming and blocks a second start", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    assessmentHistory: [],
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    studentRows: [{ id: "student-1", name: "Ada" }],
    selectedStudentId: "student-1",
    selectedStudentName: "Ada",
    elBenchmarkDraft: {
      assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      grade: "1",
      window: "MOY"
    },
    routeHash: "#teacher/assessments?class=class-a&learner=student-1"
  }));
  assert.match(html, /has an unfinished assessment saved on this device/);
  assert.match(html, />Carry on with it</);
  assert.match(html, />Clear saved draft…</);
});

test("unfinished manual assessments show truthful counts and a Resume action", () => {
  const props = {
    assessmentHistory: [],
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    studentRows: [{ id: "student-1", name: "Ada" }],
    selectedStudentId: "student-1",
    selectedStudentName: "Ada",
    letterAssessmentDraft: {
      completedItems: 12,
      plannedItems: 52
    },
    phonicsPatternAssessmentDraft: {
      completedItems: 3,
      plannedItems: 9
    }
  };
  const hubHtml = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    ...props,
    routeHash: "#teacher/assessments?class=class-a&learner=student-1"
  }));
  const selectedHtml = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    ...props,
    routeHash: "#teacher/assessments?class=class-a&learner=student-1&check=letter-names-and-sounds"
  }));

  assert.match(hubHtml, /Ada has an unfinished letter name and sound assessment/);
  assert.match(hubHtml, /12 of 52 letters saved/);
  assert.match(hubHtml, /Resume letter name and sound assessment/);
  assert.match(hubHtml, /Ada has an unfinished phonics pattern assessment/);
  assert.match(hubHtml, /3 of 9 patterns saved/);
  assert.match(selectedHtml, /Letter names and sounds · 12 of 52 saved/);
  assert.match(selectedHtml, />Resume Letter names and sounds</);
  assert.doesNotMatch(selectedHtml, />Begin Letter names and sounds</);
});
