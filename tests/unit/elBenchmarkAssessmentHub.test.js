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

const FUNNEL_SOURCE = readFileSync(
  new URL("../../src/components/TeacherAssessmentsPage.jsx", import.meta.url),
  "utf8"
);
const SURFACE_SOURCE = readFileSync(
  new URL("../../src/components/AppSurface.jsx", import.meta.url),
  "utf8"
);

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

// Rewritten again 2026-07-29 for the v2 Assessments screen. The class question
// is gone from this page - the shared teacher context bar above it is the only
// class picker now - and the three remaining steps are DERIVED on every render
// rather than stored, so the strip is asserted through its data-state.
test("the page is three derived steps: student, assessment, run it", () => {
  const html = renderFunnel("#teacher/assessments?class=class-a&learner=student-1");
  for (const step of [
    "Choose the student",
    "Choose the assessment",
    "Run it and save"
  ]) {
    assert.match(html, new RegExp(`>${step}<`), `step "${step}" is missing`);
  }
  // The class picker belongs to the context bar, not to this page.
  assert.doesNotMatch(html, />Choose a class</);
  // Panel 2 offers every startable check from the one catalog, not a hand-built
  // grid, and the suggested one comes first.
  const labels = [
    "Skills assessment",
    "Letter names and sounds",
    "Phonics patterns",
    "Sound awareness",
    "Spelling",
    "Word reading",
    "Reading fluency"
  ];
  for (const label of labels) {
    assert.match(html, new RegExp(`<h4>${label}</h4>`), `${label} is missing from the cards`);
  }
  assert.equal((html.match(/<article class="teacher-assess-card/g) || []).length, labels.length);
  assert.ok(
    html.indexOf("<h4>Skills assessment</h4>") < html.indexOf("<h4>Letter names and sounds</h4>"),
    "the suggested assessment is not first"
  );
  assert.match(html, /harder letter patterns the student recognises and sounds out/);
  assert.doesNotMatch(html, /harder letter patterns the student already reads and spells/);
  // The accuracy-vs-status caveat closes the assessment panel.
  assert.match(
    html,
    /Answer accuracy and learning status are saved separately\. A high percentage alone does not prove that learning is secure\./
  );
});

test("previous assessments show who, what and when for the selected class", () => {
  const history = [
    {
      attemptId: "skill-completed",
      classId: "class-a",
      studentId: "student-1",
      studentName: "Ada's old name",
      assessmentType: "skill_checkpoint",
      skillName: "Initial Sounds",
      administrationStatus: "completed",
      completedAt: "2026-08-18T08:05:00.000Z"
    },
    {
      attemptId: "decoding-stopped",
      classId: "class-a",
      studentId: "student-2",
      studentName: "Bo",
      assessmentType: EL_BENCHMARK_IDS.DECODING,
      gradePath: "1",
      benchmarkWindow: "MOY",
      administrationStatus: "discontinued",
      completedAt: "2026-08-19T09:10:00.000Z"
    },
    {
      attemptId: "fluency-not-scorable",
      classId: "class-a",
      studentId: "student-3",
      studentName: "Cleo",
      assessmentType: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
      gradePath: "2",
      benchmarkWindow: "EOY",
      administrationStatus: "not_scorable",
      completedAt: "2026-08-20T10:15:00.000Z"
    },
    {
      attemptId: "partial-hidden",
      classId: "class-a",
      studentId: "student-4",
      studentName: "Partial Pat",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      administrationStatus: "partial",
      completedAt: "2026-08-20T11:15:00.000Z"
    },
    {
      attemptId: "other-class-hidden",
      classId: "class-b",
      studentId: "student-5",
      studentName: "Wrong Class",
      assessmentType: "el_letter_assessment",
      administrationStatus: "completed",
      completedAt: "2026-08-20T12:15:00.000Z"
    }
  ];
  const html = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    assessmentHistory: history,
    assessmentHistoryReadState: {
      status: "complete",
      complete: true,
      truncated: false,
      error: null
    },
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    studentRows: [
      { id: "student-1", name: "Ada Updated" },
      { id: "student-2", name: "Bo" },
      { id: "student-3", name: "Cleo" }
    ],
    routeHash: "#teacher/assessments?class=class-a&view=previous"
  }));

  assert.match(html, /<h2>Previous assessments<\/h2>/);
  assert.match(html, />Start an assessment<\/button>/);
  assert.match(html, /3 assessments for 3 students\./);
  assert.match(html, /<th scope="row">Ada Updated<\/th>/);
  assert.doesNotMatch(html, /Ada.s old name/);
  assert.match(html, /<strong>Skills assessment<\/strong><small>Initial Sounds<\/small>/);
  assert.match(html, /<strong>Word reading<\/strong><small>Grade 1 · Middle of year<\/small>/);
  assert.match(html, /<strong>Reading fluency<\/strong><small>Grade 2 · End of year<\/small>/);
  assert.match(html, /dateTime="2026-08-18T08:05:00\.000Z"/);
  assert.match(html, />Completed<\/span>/);
  assert.match(html, />Stopped early<\/span>/);
  assert.match(html, />Could not score<\/span>/);
  assert.doesNotMatch(html, /Partial Pat|Wrong Class/);
  assert.ok(
    html.indexOf("Cleo") < html.indexOf("Bo") && html.indexOf("Bo") < html.indexOf("Ada Updated"),
    "finished assessments should be newest first"
  );
  assert.match(SURFACE_SOURCE, /assessmentHistory=\{assessmentHistory\}/);
  assert.match(SURFACE_SOURCE, /assessmentHistoryReadState=\{assessmentHistoryReadState\}/);
  assert.match(SURFACE_SOURCE, /onRetryAssessmentHistory=\{retryAssessmentHistoryHydration\}/);
  assert.doesNotMatch(
    SURFACE_SOURCE,
    /assessmentHistory=\{assessmentHistory\.filter\(record => record\.studentId === studentId\)\}/
  );
});

test("previous assessments fail closed while the full archive is loading or incomplete", () => {
  const shared = {
    assessmentHistory: [{
      attemptId: "local-only",
      classId: "class-a",
      studentId: "student-1",
      studentName: "Local-only Ada",
      assessmentType: "skill_checkpoint",
      administrationStatus: "completed",
      completedAt: "2026-08-18T08:05:00.000Z"
    }],
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    routeHash: "#teacher/assessments?class=class-a&view=previous"
  };
  const loading = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    ...shared,
    assessmentHistoryReadState: {
      status: "loading",
      complete: false,
      truncated: false,
      error: null
    }
  }));
  assert.match(loading, /Loading previous assessments/);
  assert.match(loading, /aria-busy="true"/);
  assert.doesNotMatch(loading, /Local-only Ada/);

  const incomplete = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    ...shared,
    assessmentHistoryReadState: {
      status: "partial",
      complete: false,
      truncated: true,
      error: new Error("archive truncated")
    },
    onRetryAssessmentHistory: () => {}
  }));
  assert.match(incomplete, /Previous assessments could not be confirmed/);
  assert.match(incomplete, /Missing assessments are not being treated as absent/);
  assert.match(incomplete, />Try loading again<\/button>/);
  assert.doesNotMatch(incomplete, /Local-only Ada/);
});

test("an empty completed archive offers a direct route back to starting an assessment", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    assessmentHistory: [],
    assessmentHistoryReadState: {
      status: "complete",
      complete: true,
      truncated: false,
      error: null
    },
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    routeHash: "#teacher/assessments?class=class-a&view=previous"
  }));
  assert.match(html, /No previous assessments yet/);
  assert.match(html, />Start the first assessment<\/button>/);
  assert.doesNotMatch(html, /<table/);
});

test("the step strip is derived from the answers, never stored", () => {
  const noStudent = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    studentRows: [{ id: "student-1", name: "Ada" }, { id: "student-2", name: "Bo" }],
    routeHash: "#teacher/assessments?class=class-a"
  }));
  const withStudent = renderFunnel("#teacher/assessments?class=class-a&learner=student-1");
  const withCheck = renderFunnel(
    "#teacher/assessments?class=class-a&learner=student-1&check=letter-names-and-sounds"
  );

  const stateOf = (html, step) => html
    .match(new RegExp(`data-assess-step="${step}" data-state="([a-z]+)"`))?.[1];

  assert.deepEqual([1, 2, 3].map(step => stateOf(noStudent, step)),
    ["active", "waiting", "waiting"]);
  assert.deepEqual([1, 2, 3].map(step => stateOf(withStudent, step)),
    ["done", "active", "waiting"]);
  assert.deepEqual([1, 2, 3].map(step => stateOf(withCheck, step)),
    ["done", "done", "active"]);
  // Step 3 is muted only while it is more than one step away, exactly as the
  // approved design draws it.
  assert.match(noStudent, /data-assess-step="3" data-state="waiting" data-waiting-far="true"/);
  assert.doesNotMatch(withStudent, /data-waiting-far/);

  // Nothing stores a step: the page has no step state and no step setter.
  assert.doesNotMatch(FUNNEL_SOURCE, /useState\([^)]*\)[^;]*(?:Step|step)\b\s*\]/);
  assert.match(FUNNEL_SOURCE, /const assessmentStep = !hasStudent \? 1 : !entry \? 2 : 3;/);
});

test("changing the student re-scopes the page instead of navigating away", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    studentRows: [{ id: "student-1", name: "Ada" }, { id: "student-2", name: "Bo" }],
    selectedStudentId: "student-1",
    selectedStudentName: "Ada",
    routeHash: "#teacher/assessments?class=class-a&learner=student-1"
  }));
  // One scoped select naming the class, every student in it, and the promise
  // printed next to it.
  assert.match(html, /<span>Student in Audit Class A<\/span>/);
  assert.match(html, /<option value="student-1" selected="">Ada<\/option>/);
  assert.match(html, /<option value="student-2">Bo<\/option>/);
  assert.match(html, /Changing student here does not leave the page\. You stay in Audit Class A\./);

  // The only thing the select does is load the student in place. Nothing on
  // this page sets a view, and the surface hands it the non-navigating loader.
  assert.match(FUNNEL_SOURCE, /onChange=\{event => chooseStudent\(event\.target\.value\)\}/);
  assert.match(FUNNEL_SOURCE, /function chooseStudent\([\s\S]*?onSelectStudent\?\.\(row\.id, row\.name\);\s*\}/);
  assert.doesNotMatch(FUNNEL_SOURCE, /setAppView|goToTeacherIntent|APP_VIEWS|location\.assign/);
  assert.match(
    SURFACE_SOURCE,
    /<TeacherAssessmentsPage[\s\S]*?onSelectStudent=\{loadSelectedClassStudent\}/
  );
  assert.match(
    SURFACE_SOURCE,
    /async function loadSelectedClassStudent[\s\S]*?loadStudentProgress\(student\.id, student\.name \|\| name, \{ navigate: false \}\)/
  );
});

test("a fixed full-set assessment does not repeat an empty start-point message", () => {
  const html = renderFunnel(
    "#teacher/assessments?class=class-a&learner=student-1&check=letter-names-and-sounds"
  );
  assert.match(html, /3 · Ready to begin</);
  assert.match(html, /This assessment covers the full set of letters\./);
  assert.match(html, />Full set of letters</);
  assert.doesNotMatch(html, /Nothing to choose|nothing to choose|Starts at the beginning/);
  // How the assessment is given moved out of the card and next to Begin, where
  // the teacher is about to give it.
  assert.match(html, /You show each letter and tap whether the name and the sound were right\./);
});

test("the suggestion names the real next skill and only claims evidence it read", () => {
  const base = {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    className: "Audit Class A",
    selectedClassId: "class-a",
    selectedStudentId: "student-1",
    selectedStudentName: "Ada Smith",
    firstUnsecuredSkillIndex: 3,
    routeHash: "#teacher/assessments?class=class-a&learner=student-1"
  };
  const withEvidence = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    ...base,
    studentRows: [{
      id: "student-1",
      name: "Ada",
      evidenceReadStatus: "complete",
      focusEvidence: {
        skill: "CVC and Short Vowels",
        answered: 18,
        correct: 7,
        accuracy: 39
      }
    }]
  }));
  assert.match(withEvidence, /Suggested for Ada/);
  assert.match(withEvidence, /CVC and Short Vowels — Skills assessment/);
  assert.match(withEvidence, /7 of 18 answers correct in the last 90 days\./);

  // An unconfirmed read never becomes a number. It says what the suggestion is
  // based on instead.
  const withoutEvidence = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    ...base,
    studentRows: [{
      id: "student-1",
      name: "Ada",
      evidenceReadStatus: "incomplete",
      focusEvidence: {
        skill: "CVC and Short Vowels",
        answered: 18,
        correct: 7
      }
    }]
  }));
  assert.match(withoutEvidence, /This is the first skill this student has not secured yet\./);
  assert.doesNotMatch(withoutEvidence, /7 of 18 answers correct/);
  assert.doesNotMatch(withoutEvidence, /0%/);
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
  assert.match(html, />Change assessment</);
  assert.doesNotMatch(html, /aria-label="Start Skills assessment"/);
});

test("choosing an assessment reveals its start controls instead of leaving them below the cards", () => {
  assert.match(FUNNEL_SOURCE, /scrollIntoView\(\{/);
  assert.match(FUNNEL_SOURCE, /block: "start"/);
  assert.match(FUNNEL_SOURCE, /prefers-reduced-motion: reduce/);
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
