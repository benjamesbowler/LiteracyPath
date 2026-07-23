import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  getGuidedReadingLandingMeta,
  getSkillsCheckLandingMeta
} from "../../src/components/reports/studentReportUiUtils.js";

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

test("report landing helpers distinguish load failure, attempts, and mastery", () => {
  assert.equal(
    getGuidedReadingLandingMeta({ loadStatus: "error" }),
    "Reading summary unavailable"
  );
  assert.equal(
    getGuidedReadingLandingMeta({ progress: { totalBooksRead: 1 }, loadStatus: "ready" }),
    "1 completed book"
  );
  assert.equal(
    getSkillsCheckLandingMeta({ attemptCount: 2, skillMasterySummary: [] }),
    "2 checkpoint attempts saved"
  );
  assert.equal(
    getSkillsCheckLandingMeta({
      attemptCount: 2,
      skillMasterySummary: [{ masteredCount: 1 }]
    }),
    "Checkpoint evidence available"
  );
});

test("student report availability uses full history and treats a failed checkpoint as evidence", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    studentName: "Ada",
    viewFinishedReport: () => {},
    assessmentHistory: [{
      attemptId: "old-failed-checkpoint",
      studentId: "student-1",
      studentName: "Ada",
      assessmentType: "skill_checkpoint",
      skillId: "initial_sounds",
      skillName: "Initial Sounds",
      completedAt: "2020-01-01T09:00:00.000Z",
      totalQuestions: 8,
      correctCount: 2,
      passed: false,
      status: "needs_support"
    }],
    skillMasterySummary: []
  }));

  assert.match(html, /Evidence available/);
  assert.match(html, /1 checkpoint attempt saved/);
  assert.doesNotMatch(html, /Ready for first evidence/);
  assert.doesNotMatch(html, /No passed checkpoints/);
});

test("report choices wait for the complete selected-learner evidence record", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherReportsPage, {
    studentName: "Ada",
    viewFinishedReport: () => {},
    evidenceReady: false
  }));

  assert.match(html, /Loading the complete learner evidence record/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Open Skills Check<\/button>/);
});
