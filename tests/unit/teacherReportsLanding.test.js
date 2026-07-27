// Rewritten 2026-07-27.
//
// The class report is no longer a route. It is what the Reports funnel shows
// when the answer to "whole class, or one student?" is the whole class, so the
// class picker and the "back to reports" button it used to carry have gone -
// the funnel above it already asked those questions.
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
    selectedClassId: "class-a",
    students: STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(html, /<h2>Class report<\/h2>/);
  // It points back up the funnel rather than at a page somewhere else.
  assert.match(html, /Choose one student at step 2 above/);
  // The questions the funnel already asked must not be asked twice.
  assert.doesNotMatch(html, /Back to reports/);
  assert.doesNotMatch(html, /<select[^>]*>\s*<option value="class-a"/);
  // The removed per-student landing must not creep back in.
  assert.doesNotMatch(html, /Open Skills check/);
  assert.doesNotMatch(html, /Results available/);
});

test("the class report keeps its own check period and print action", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    allAssessmentHistory: HISTORY,
    classList: CLASS_LIST,
    selectedClassId: "class-a",
    students: STUDENTS,
    teacherName: "Ms Bell"
  }));

  assert.match(html, /Audit Class A/);
  assert.match(html, /Class check period/);
  assert.match(html, /<option value="last90"[^>]*>Last 90 days<\/option>/);
  assert.match(html, />Export Class PDF<\/button>/);
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
