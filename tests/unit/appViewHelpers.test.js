import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { APP_VIEWS } from "../../src/appState/appViews.js";
import {
  STUDENT_ALLOWED_VIEWS,
  isStudentAllowedView,
  isFocusedAssessmentView,
  shouldShowFooterUtilityActions,
  elBenchmarkAssessmentHash,
  getRestoredAppView,
  getPersistedAppView,
  parseElBenchmarkAssessmentHash,
  restoreElBenchmarkSessionFromHash,
  teacherIntentHash
} from "../../src/appState/appViewHelpers.js";

// ── THE REGRESSION THIS FILE EXISTS FOR ─────────────────────────────────────
//
// Sound Seekers shipped with a Student Home button that opened the mode and
// then bounced straight back to the home screen — "I tap it and it flashes".
//
// Cause: App.jsx runs a guard in STUDENT MODE ONLY that force-redirects any
// appView not on an allowlist. The allowlist was a private Set inside an
// 8,400-line file, and the new view wasn't on it. A teacher previewing the exact
// same screen saw nothing wrong, because the guard doesn't run for teachers — so
// the bug was invisible to every check we had, and only a child could find it.
//
// The list is exported now, and this test holds it against the views the Student
// Home actually links to. Add a student-facing view and forget the allowlist,
// and this goes red instead of a five-year-old finding it.

test("EVERY view the Student Home links to is on the student allowlist", () => {
  // Read the real component rather than trusting a hand-kept list here — a
  // second hand-kept list would rot exactly like the first one did.
  const source = fs.readFileSync("src/App.jsx", "utf8");

  // Each onOpenX handler on <StudentHomePage> sets an appView. Pull them out.
  const homeProps = source.match(/<StudentHomePage[\s\S]*?\n\s{10}\/>/);
  assert.ok(homeProps, "could not find the StudentHomePage element in App.jsx");

  const views = [...homeProps[0].matchAll(/setAppView\(APP_VIEWS\.([A-Z_]+)\)/g)].map(m => m[1]);
  assert.ok(views.length >= 5, `only found ${views.length} navigation targets on the Student Home — the regex has drifted`);

  for (const name of views) {
    const view = APP_VIEWS[name];
    assert.ok(view, `Student Home navigates to APP_VIEWS.${name}, which does not exist`);
    assert.ok(
      isStudentAllowedView(view),
      `Student Home has a button to APP_VIEWS.${name}, but it is NOT in STUDENT_ALLOWED_VIEWS — a student who taps it will be bounced straight back to the home screen ("the page just flashes")`
    );
  }
});

test("Sound Seekers specifically is reachable by a student", () => {
  // The exact bug, pinned. Named so a failure reads as itself.
  assert.ok(isStudentAllowedView(APP_VIEWS.PHONICS_QUEST));
});

test("the allowlist only contains real views", () => {
  const all = new Set(Object.values(APP_VIEWS));
  for (const view of STUDENT_ALLOWED_VIEWS) {
    assert.ok(all.has(view), `STUDENT_ALLOWED_VIEWS contains "${view}", which is not an APP_VIEW`);
  }
});

test("teacher-only views are NOT on the student allowlist", () => {
  // The allowlist is a security boundary as well as a navigation one. Widening
  // it carelessly is how a child ends up in the teacher dashboard.
  for (const view of [
    APP_VIEWS.TEACHER_DASHBOARD,
    APP_VIEWS.TEACHER_CLASSES,
    APP_VIEWS.TEACHER_ASSESS,
    APP_VIEWS.TEACHER_PROGRESS,
    APP_VIEWS.TEACHER_RESOURCES,
    APP_VIEWS.ADMIN_DASHBOARD,
    APP_VIEWS.REPORTS,
    APP_VIEWS.WORKSHEETS,
    APP_VIEWS.PRESENT
  ]) {
    assert.equal(isStudentAllowedView(view), false, `${view} must not be reachable by a student`);
  }
});

// ── The rest of the module ──────────────────────────────────────────────────

test("focused assessment views are recognised", () => {
  assert.equal(isFocusedAssessmentView(APP_VIEWS.ASSESSMENT), true);
  assert.equal(isFocusedAssessmentView(APP_VIEWS.EL_BENCHMARK), true);
  assert.equal(isFocusedAssessmentView(APP_VIEWS.STUDENT_HOME), false);
});

test("EL benchmark runner is a real persisted teacher view", () => {
  assert.equal(getPersistedAppView({ studentId: "s1", appView: APP_VIEWS.EL_BENCHMARK }), APP_VIEWS.EL_BENCHMARK);
  assert.equal(isStudentAllowedView(APP_VIEWS.EL_BENCHMARK), false);
});

test("the footer stays out of the way on full-screen child surfaces", () => {
  assert.equal(shouldShowFooterUtilityActions({ appView: APP_VIEWS.PHONICS_QUEST }), false);
  assert.equal(shouldShowFooterUtilityActions({ appView: APP_VIEWS.SKILLS_BLOCK_QUEST }), false);
});

test("an unknown stored view falls back rather than crashing", () => {
  assert.equal(getRestoredAppView({ restoredStudentId: "s1", storedAppView: "nonsense" }), APP_VIEWS.OVERVIEW);
  assert.equal(getRestoredAppView({ restoredStudentId: "", storedAppView: APP_VIEWS.LEARN }), APP_VIEWS.SELECT);
  assert.equal(getPersistedAppView({ studentId: "s1", appView: APP_VIEWS.PHONICS_QUEST }), APP_VIEWS.PHONICS_QUEST);
  assert.equal(getPersistedAppView({ studentId: "", appView: APP_VIEWS.PHONICS_QUEST }), APP_VIEWS.SELECT);
});

test("restored module-shaped teacher routes redirect to the five-intention IA", () => {
  const redirects = new Map([
    [APP_VIEWS.STUDENT_HOME, APP_VIEWS.TEACHER_CLASSES],
    [APP_VIEWS.OVERVIEW, APP_VIEWS.TEACHER_ASSESS],
    [APP_VIEWS.EL_ASSESSMENTS, APP_VIEWS.TEACHER_ASSESS],
    [APP_VIEWS.REPORTS, APP_VIEWS.TEACHER_PROGRESS],
    [APP_VIEWS.GUIDED_READING, APP_VIEWS.TEACHER_RESOURCES],
    [APP_VIEWS.LEARN, APP_VIEWS.TEACHER_RESOURCES],
    [APP_VIEWS.WORKSHEETS, APP_VIEWS.TEACHER_RESOURCES],
    [APP_VIEWS.PRESENT, APP_VIEWS.TEACHER_RESOURCES]
  ]);

  for (const [legacyView, intentionView] of redirects) {
    assert.equal(
      getRestoredAppView({ restoredStudentId: "s1", storedAppView: legacyView }),
      intentionView,
      `${legacyView} should restore through ${intentionView}`
    );
  }
});

test("all five teacher intentions expose an honest class, group, and learner hash", () => {
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_DASHBOARD,
      classId: "class-a",
      groupId: "attention",
      learnerId: "learner-a"
    }),
    "#teacher/today?class=class-a"
  );
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_CLASSES,
      classId: "class-a",
      groupId: "attention",
      learnerId: "learner-a"
    }),
    "#teacher/classes?class=class-a&group=attention&learner=learner-a"
  );
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_ASSESS,
      classId: "class-a",
      learnerId: "learner-a"
    }),
    "#teacher/assess?class=class-a&group=all&learner=learner-a"
  );
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_PROGRESS,
      classId: "class-a",
      groupId: "all",
      learnerId: "learner-a"
    }),
    "#teacher/progress?class=class-a&group=all&learner=learner-a"
  );
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_RESOURCES,
      classId: "class-a",
      learnerId: "learner-a"
    }),
    "#teacher/resources?class=class-a&group=all&learner=learner-a"
  );
  assert.equal(teacherIntentHash({ appView: APP_VIEWS.REPORTS }), "");
});

test("an EL benchmark URL names the live session and restores its exact item", () => {
  const session = {
    assessmentId: "el_encoding",
    currentItemIndex: 3,
    sessionId: "session-123",
    studentId: "learner-a"
  };
  const hash = elBenchmarkAssessmentHash({
    classId: "class-a",
    learnerId: "learner-a",
    session
  });
  assert.equal(
    hash,
    "#teacher/assess/el-benchmark?class=class-a&learner=learner-a&assessment=el_encoding&session=session-123&item=4"
  );
  assert.deepEqual(parseElBenchmarkAssessmentHash(hash), {
    classId: "class-a",
    learnerId: "learner-a",
    assessmentId: "el_encoding",
    sessionId: "session-123",
    currentItemIndex: 3
  });
  assert.equal(
    restoreElBenchmarkSessionFromHash({
      hash: hash.replace("item=4", "item=6"),
      session,
      studentId: "learner-a"
    }).currentItemIndex,
    5
  );
  assert.equal(
    restoreElBenchmarkSessionFromHash({
      hash: hash.replace("learner-a", "learner-b"),
      session,
      studentId: "learner-a"
    }),
    null
  );
});
