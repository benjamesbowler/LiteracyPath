// Rewritten 2026-07-29 for the approved teacher-area redesign (phase 5).
//
// The class report screen is now the v2 Reports design: an export header, a
// five-way status split over students, one skills table where answer accuracy
// and class learning status are SEPARATE columns, and the EL-benchmark caveat
// as a footer strip. The three things this file has always been for are
// unchanged and still pinned below:
//
//   1. the class report is the whole-class answer inside the Reports funnel,
//      not a second destination with its own class picker;
//   2. it keeps its own assessment period and its own export actions;
//   3. unconfirmed evidence hides figures instead of printing zeros.
//
// Previous note, still true about what this file is NOT testing:
//
// Rewritten 2026-07-26.
//
// This file used to test a per-student "report landing" screen that offered
// "Open Skills check" / "Open Guided reading" buttons and a "Results available"
// / "Loading the complete child results" status line. That screen no longer
// exists: the Reports route is now a whole-class report, and a single student's
// report opens directly from the Student panel (TeacherStudentsPage ->
// onOpenReport -> FinishedReportPage). The two helpers this file also covered
// (getGuidedReadingLandingMeta / getSkillsCheckLandingMeta) fed only that
// removed screen and have been deleted with it.
//
// These tests now pin the behaviour the route actually has.

import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let TeacherReportsPage;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const module = await vite.ssrLoadModule("/src/components/AppPages.jsx");
  TeacherReportsPage = module.TeacherReportsPage;
});

test.after(async () => {
  await vite?.close();
});

const CLASS_LIST = [{ id: "class-a", name: "Audit Class A" }];
const STUDENTS = [{ id: "student-1", name: "Ada", classId: "class-a" }];
const HISTORY = [{
  attemptId: "old-failed-checkpoint",
  studentId: "student-1",
  studentName: "Ada",
  classId: "class-a",
  assessmentType: "skill_checkpoint",
  skillId: "initial_sounds",
  skillName: "Initial Sounds",
  completedAt: "2020-01-01T09:00:00.000Z",
  totalQuestions: 8,
  correctCount: 2,
  passed: false,
  status: "needs_support"
}];

// Two students, two skills, enough recent scored answers on each skill for the
// class comparability check to pass. This is the only fixture shape that can
// produce a real class percentage, so it is the one that proves accuracy and
// learning status are reported as two different things.
const COMPARABLE_STUDENTS = [
  { id: "student-1", name: "Ada", classId: "class-a" },
  { id: "student-2", name: "Bo", classId: "class-a" }
];

function comparableHistory() {
  const completedAt = new Date().toISOString();
  return COMPARABLE_STUDENTS.flatMap((student, index) => ([
    {
      attemptId: `initial-${index}`,
      studentId: student.id,
      studentName: student.name,
      classId: "class-a",
      assessmentType: "skill_checkpoint",
      skillId: "initial_sounds",
      skillName: "Initial Sounds",
      completedAt,
      totalQuestions: 10,
      correctCount: 9,
      passed: true,
      status: "on_track"
    },
    {
      attemptId: `digraphs-${index}`,
      studentId: student.id,
      studentName: student.name,
      classId: "class-a",
      assessmentType: "skill_checkpoint",
      skillId: "digraphs",
      skillName: "Digraphs",
      completedAt,
      totalQuestions: 10,
      correctCount: 3,
      passed: false,
      status: "needs_support"
    }
  ]));
}

test("the class report is the whole-class answer inside the Reports funnel", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: HISTORY,
    classList: CLASS_LIST,
    onBack: () => {},
    selectedClassId: "class-a",
    students: STUDENTS,
    teacherName: "Ms Bell"
  }));

  // The heading names the class the report is about, the way the design does.
  assert.match(html, /<h2>Audit Class A report<\/h2>/);
  // It points back to the funnel rather than at a page somewhere else.
  assert.match(html, /Use Back to reports to choose one student instead/);
  // The questions the funnel already asked must not be asked twice.
  assert.match(html, />Back to reports<\/button>/);
  assert.doesNotMatch(html, /<select[^>]*>\s*<option value="class-a"/);
  // The removed per-student landing must not creep back in.
  assert.doesNotMatch(html, /Open Skills check/);
  assert.doesNotMatch(html, /Results available/);
});

test("the class report keeps its own assessment period and export actions", () => {
  const currentHistory = HISTORY.map(record => ({
    ...record,
    attemptId: "current-checkpoint",
    completedAt: new Date().toISOString()
  }));
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: currentHistory,
    classList: CLASS_LIST,
    selectedClassId: "class-a",
    students: STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(html, /Audit Class A/);
  assert.match(html, /Class assessment period/);
  assert.match(html, /<option value="last90"[^>]*>Last 90 days<\/option>/);
  // The selected period still drives the figures: eight saved answers in the
  // window show up as this skill's answer count.
  assert.match(html, /<td>8<\/td>/);
  assert.match(html, />Export spreadsheet<\/button>/);
  assert.match(html, />Export PDF<\/button>/);
  assert.match(html, /<details class="class-report-formal-tools">/);
  assert.doesNotMatch(html, /class-report-formal-tools screen-only/);
});

test("the five-way status split names every state and never invents a sixth", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: comparableHistory(),
    classList: CLASS_LIST,
    selectedClassId: "class-a",
    students: COMPARABLE_STUDENTS,
    teacherName: "Ms Bell"
  }));

  const labels = [...html.matchAll(
    /<span class="teacher-class-report-split-label">([^<]+)<\/span>/g
  )].map(match => match[1]);
  assert.deepEqual(labels, [
    "Needs support",
    "Developing",
    "Secure",
    "Not enough results",
    "Not checked"
  ]);
  // Insufficient data is its own named state with its own note, never a score.
  assert.match(html, /Some answers, but not enough for a judgement\./);
  assert.match(html, /These students have not been assessed yet\./);
  assert.match(html, /students have saved answers\. Every student appears in exactly one group\./);
});

test("accuracy and class learning status stay in separate columns", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: comparableHistory(),
    classList: CLASS_LIST,
    selectedClassId: "class-a",
    students: COMPARABLE_STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(html, /<th scope="col">Accuracy<\/th><th scope="col">Class status<\/th>/);
  // 9 of 10 for both students is a secure class judgement; 3 of 10 is not.
  assert.match(
    html,
    /<th scope="row">Initial Sounds<\/th><td>2 of 2<\/td><td>20<\/td><td class="teacher-class-report-accuracy">90%<\/td><td><span class="teacher-class-report-pill secure">Secure<\/span>/
  );
  assert.match(
    html,
    /<th scope="row">Digraphs<\/th><td>2 of 2<\/td><td>20<\/td><td class="teacher-class-report-accuracy">30%<\/td><td><span class="teacher-class-report-pill needs-support">Needs support<\/span>/
  );
  // The caveat that keeps EL benchmarks out of these totals rides the table.
  assert.match(
    html,
    /EL benchmark assessments are reported separately\. They do not change the Secure, Developing or Not checked totals\./
  );
});

test("a skill with too little evidence shows an em dash, never nought per cent", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: HISTORY.map(record => ({
      ...record,
      completedAt: new Date().toISOString()
    })),
    classList: CLASS_LIST,
    selectedClassId: "class-a",
    students: STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(
    html,
    /<td class="teacher-class-report-accuracy"><span aria-hidden="true">—<\/span><small>No class accuracy figure yet\.<\/small><\/td>/
  );
  assert.match(html, /<span class="teacher-class-report-pill not-enough">Not enough results<\/span>/);
  assert.doesNotMatch(html, /teacher-class-report-accuracy">0%/);
});

test("a sound-map skill filter narrows the table and offers the way back", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: comparableHistory(),
    classList: CLASS_LIST,
    selectedClassId: "class-a",
    skillFilter: "Digraphs",
    students: COMPARABLE_STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(html, /Showing Digraphs/);
  assert.match(html, />Show all skills<\/button>/);
  assert.match(html, /<th scope="row">Digraphs<\/th>/);
  assert.doesNotMatch(html, /<th scope="row">Initial Sounds<\/th>/);
});

test("an unmatched skill filter says so rather than quietly showing everything", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: comparableHistory(),
    classList: CLASS_LIST,
    selectedClassId: "class-a",
    skillFilter: "Vowel teams",
    students: COMPARABLE_STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(html, /No saved class results for Vowel teams yet\./);
  assert.doesNotMatch(html, /<th scope="row">Digraphs<\/th>/);
});

test("the class report degrades to a named empty state when the teacher has no classes", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: [],
    classList: [],
    students: [],
    teacherName: "Ms Bell"
  }));

  assert.match(html, /<h2>No classes yet<\/h2>/);
});

test("incomplete class evidence suppresses zero figures while exports stay locked", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: [],
    allAnswerHistory: [],
    assessmentHistoryReadState: {
      status: "error",
      complete: false,
      truncated: false,
      error: { message: "read failed" }
    },
    answerHistoryReadState: {
      status: "error",
      complete: false,
      truncated: false,
      error: { message: "read failed" }
    },
    classList: CLASS_LIST,
    onRetryAssessmentHistory: () => {},
    onRetryAnswerHistory: () => {},
    selectedClassId: "class-a",
    studentListReadState: {
      status: "complete",
      classId: "class-a",
      lastCompleteClassId: "class-a",
      error: null,
      truncated: false
    },
    students: STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(html, /Some report information could not be loaded/);
  assert.match(html, /Try loading the class report again/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Export PDF<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Export spreadsheet<\/button>/);
  // A failed read must never look like an assessed class with nothing in it:
  // no split counts, no skills table, no reconciliation sentence.
  assert.doesNotMatch(html, /teacher-class-report-split/);
  assert.doesNotMatch(html, /teacher-class-report-skills/);
  assert.doesNotMatch(html, /students have saved answers/);
});
