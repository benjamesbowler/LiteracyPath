// Rewritten 2026-07-27.
//
// The class report is no longer a route. It is what the Reports funnel shows
// when the answer to "whole class, or one student?" is the whole class, so the
// class picker has gone because the funnel already asked that question. Once
// an open report hides the settled funnel, the report keeps one explicit Back
// action so the teacher can change that choice without browser navigation.
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

test("the class report is the whole-class answer inside the Reports funnel", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: HISTORY,
    classList: CLASS_LIST,
    onBack: () => {},
    selectedClassId: "class-a",
    students: STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(html, /<h2>Class report<\/h2>/);
  // It points back to the funnel rather than at a page somewhere else.
  assert.match(html, /Use Back to reports to choose one student instead/);
  // The questions the funnel already asked must not be asked twice.
  assert.match(html, />Back to reports<\/button>/);
  assert.doesNotMatch(html, /<select[^>]*>\s*<option value="class-a"/);
  // The removed per-student landing must not creep back in.
  assert.doesNotMatch(html, /Open Skills check/);
  assert.doesNotMatch(html, /Results available/);
});

test("the class report keeps its own assessment period and print action", () => {
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
  assert.match(html, /Answers in period<\/dt><dd>8<\/dd>/);
  assert.match(html, />Print or save PDF<\/button>/);
  assert.match(html, /<details class="class-report-formal-tools">/);
  assert.doesNotMatch(html, /class-report-formal-tools screen-only/);
});

test("the class report degrades to a named empty state when the teacher has no classes", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: [],
    classList: [],
    students: [],
    teacherName: "Ms Bell"
  }));

  assert.match(html, /<h2>Class report<\/h2>/);
  assert.match(html, /No classes yet/);
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
  assert.match(html, /Print or save PDF<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Print or save PDF<\/button>/);
  assert.doesNotMatch(html, /Answers in period<\/dt>/);
  assert.doesNotMatch(html, /No shared class priority is ready yet/);
});
