import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { APP_VIEWS } from "../../src/appState/appViews.js";
import {
  STUDENT_ALLOWED_VIEWS,
  isStudentAllowedView,
  isFocusedAssessmentView,
  isSameTeacherRoute,
  shouldShowDashboardSummary,
  shouldShowFooterUtilityActions,
  elBenchmarkAssessmentHash,
  getRestoredAppView,
  getPersistedAppView,
  parseElBenchmarkAssessmentHash,
  restoreElBenchmarkSessionFromHash,
  teacherIntentHash
} from "../../src/appState/appViewHelpers.js";
import { parse as parseTeacherRouteHash } from "../../src/appState/routes.js";
import { STUDENT_REPORT_VIEWS } from "../../src/components/reports/studentReportUiUtils.js";

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
  const source = fs.readFileSync("src/components/AppSurface.jsx", "utf8");

  // Each onOpenX handler on <StudentHomePage> sets an appView. Pull them out.
  const homeProps = source.match(/<StudentHomePage[\s\S]*?\n\s{10}\/>/);
  assert.ok(homeProps, "could not find the StudentHomePage element in AppSurface.jsx");

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
    APP_VIEWS.ASSESSMENTS,
    APP_VIEWS.TEACHER_RESOURCES,
    APP_VIEWS.TEACHER_SETTINGS,
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
  assert.equal(getRestoredAppView({ restoredStudentId: "s1", storedAppView: "nonsense" }), APP_VIEWS.TEACHER_CLASSES);
  assert.equal(getRestoredAppView({ restoredStudentId: "", storedAppView: APP_VIEWS.LEARN }), APP_VIEWS.SELECT);
  assert.equal(getPersistedAppView({ studentId: "s1", appView: APP_VIEWS.PHONICS_QUEST }), APP_VIEWS.PHONICS_QUEST);
  assert.equal(getPersistedAppView({ studentId: "", appView: APP_VIEWS.PHONICS_QUEST }), APP_VIEWS.SELECT);
});

test("teacher intentions persist and restore without requiring a selected learner", () => {
  for (const view of [
    APP_VIEWS.TEACHER_DASHBOARD,
    APP_VIEWS.TEACHER_CLASSES,
    // Both funnels open on step 1, so neither needs a student to be restorable.
    APP_VIEWS.ASSESSMENTS,
    APP_VIEWS.REPORTS,
    APP_VIEWS.TEACHER_RESOURCES,
    APP_VIEWS.TEACHER_SETTINGS
  ]) {
    assert.equal(getPersistedAppView({ studentId: "", appView: view }), view);
    assert.equal(getRestoredAppView({ restoredStudentId: "", storedAppView: view }), view);
  }
});

test("restored module-shaped teacher routes redirect to the focused teacher IA", () => {
  const redirects = new Map([
    [APP_VIEWS.STUDENT_HOME, APP_VIEWS.TEACHER_CLASSES],
    // "overview" and "teacherAssess" are retired names still sitting in older
    // saved sessions: a check now starts from the roster, so they land there.
    ["overview", APP_VIEWS.TEACHER_CLASSES],
    // 2026-07-27: checks have their own section again, so the two retired check
    // view names land there instead of on the roster, and the retired report
    // picker lands on the Reports funnel that replaced it.
    ["teacherAssess", APP_VIEWS.ASSESSMENTS],
    ["elAssessments", APP_VIEWS.ASSESSMENTS],
    ["teacherProgress", APP_VIEWS.REPORTS],
    ["tools", APP_VIEWS.TEACHER_CLASSES],
    // REPORTS is no longer redirected: it is the Reports funnel itself.
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

test("all teacher sections expose an honest class, group, and learner hash", () => {
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_DASHBOARD,
      classId: "class-a",
      groupId: "attention",
      learnerId: "learner-a"
    }),
    "#teacher/dashboard?class=class-a"
  );
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_CLASSES,
      classId: "class-a",
      groupId: "attention",
      learnerId: "learner-a"
    }),
    "#teacher/children?class=class-a&group=attention&learner=learner-a"
  );
  // 2026-07-27: Reports is the funnel, so #teacher/reports carries the student
  // the teacher picked at step 2 rather than being a class-only page.
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.REPORTS,
      classId: "class-a",
      groupId: "all",
      learnerId: "learner-a"
    }),
    "#teacher/reports?class=class-a&group=all&learner=learner-a"
  );
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.ASSESSMENTS,
      classId: "class-a",
      groupId: "all",
      learnerId: "learner-a"
    }),
    "#teacher/assessments?class=class-a&group=all&learner=learner-a"
  );
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_RESOURCES,
      classId: "class-a",
      learnerId: "learner-a"
    }),
    "#teacher/resources?class=class-a&group=all&learner=learner-a"
  );
  assert.equal(
    teacherIntentHash({
      appView: APP_VIEWS.TEACHER_SETTINGS,
      classId: "class-a"
    }),
    "#teacher/settings?class=class-a"
  );
});

test("the old class-report link still lands on the funnel that absorbed it", () => {
  // The class report is the "Whole class" answer to step 2 now, not a separate
  // destination. Bookmarks of the old address must still open Reports.
  assert.deepEqual(parseTeacherRouteHash("#teacher/reports/class?class=class-a"), {
    appView: APP_VIEWS.REPORTS,
    classId: "class-a",
    groupId: "all",
    learnerId: "",
    reportView: ""
  });
  assert.equal(
    getRestoredAppView({ restoredStudentId: "", storedAppView: APP_VIEWS.REPORTS }),
    APP_VIEWS.REPORTS
  );
});

test("both funnels round-trip through their own hash", () => {
  for (const [view, path] of [
    [APP_VIEWS.ASSESSMENTS, "assessments"],
    [APP_VIEWS.REPORTS, "reports"]
  ]) {
    const hash = teacherIntentHash({
      appView: view,
      classId: "class-a",
      groupId: "all",
      learnerId: "learner-a"
    });
    assert.equal(hash, `#teacher/${path}?class=class-a&group=all&learner=learner-a`);
    assert.deepEqual(parseTeacherRouteHash(hash), {
      appView: view,
      classId: "class-a",
      groupId: "all",
      learnerId: "learner-a",
      reportView: ""
    });
  }
  // The names the two sections used to answer to still resolve.
  assert.equal(parseTeacherRouteHash("#teacher/checks?class=c")?.appView, APP_VIEWS.ASSESSMENTS);
  assert.equal(parseTeacherRouteHash("#teacher/assess?class=c")?.appView, APP_VIEWS.ASSESSMENTS);
  assert.equal(parseTeacherRouteHash("#teacher/progress?class=c")?.appView, APP_VIEWS.REPORTS);
});

test("a funnel's remaining steps survive a re-render of the same section", () => {
  // The appView -> URL mirror used to overwrite the whole hash on every render,
  // which wiped the chosen check and starting point and made a mid-flow refresh
  // land back on step 1.
  assert.equal(
    isSameTeacherRoute(
      "#teacher/assessments?class=class-a&group=all&learner=learner-a&check=el_decoding&band=middle_full",
      "#teacher/assessments?class=class-a&group=all&learner=learner-a"
    ),
    true
  );
  assert.equal(
    isSameTeacherRoute(
      "#teacher/assessments?class=class-a&group=all&learner=learner-a&check=el_decoding",
      "#teacher/assessments?class=class-a&group=all&learner=learner-b"
    ),
    false,
    "a different student is a different place and must be rewritten"
  );
  assert.equal(isSameTeacherRoute("#teacher/reports?class=a", "#teacher/children?class=a"), false);
  assert.equal(isSameTeacherRoute("", "#teacher/reports?class=a"), false);
});

test("EVERY report style a teacher can open round-trips through a deep link", () => {
  // The whitelist behind this was hand-kept at four while the report page
  // offered six, so guided-reading and other-learning were silently rewritten
  // to whole-child: the teacher opened a link to one report and got another.
  for (const style of STUDENT_REPORT_VIEWS.map(view => view.id)) {
    const hash = teacherIntentHash({
      appView: APP_VIEWS.FINISHED,
      classId: "class-a",
      learnerId: "learner-a",
      reportView: style
    });
    assert.equal(
      parseTeacherRouteHash(hash)?.reportView,
      style,
      `${style} does not survive a reload`
    );
  }
  assert.equal(STUDENT_REPORT_VIEWS.length, 6);
});

test("the live-session strip is allow-listed, not gated by omission", () => {
  // It reports this sitting on this device only, so it must never sit above a
  // saved report - which is exactly what "show it unless listed" produced.
  assert.equal(shouldShowDashboardSummary({ appView: APP_VIEWS.FINISHED }), false);
  assert.equal(shouldShowDashboardSummary({ appView: APP_VIEWS.REPORTS }), false);
  assert.equal(shouldShowDashboardSummary({ appView: APP_VIEWS.ASSESSMENTS }), false);
  assert.equal(shouldShowDashboardSummary({ appView: "a-view-invented-tomorrow" }), false);
  assert.equal(shouldShowDashboardSummary({}), false);
  assert.equal(shouldShowDashboardSummary({ appView: APP_VIEWS.CHECKPOINT }), true);
});

test("teacher intention and report URLs parse into restorable owned context", () => {
  assert.deepEqual(
    parseTeacherRouteHash(
      "#teacher/reports?class=class-a&group=attention&learner=learner-a"
    ),
    {
      appView: APP_VIEWS.REPORTS,
      classId: "class-a",
      groupId: "attention",
      learnerId: "learner-a",
      reportView: ""
    }
  );
  const reportHash = teacherIntentHash({
    appView: APP_VIEWS.FINISHED,
    classId: "class-a",
    learnerId: "learner-a",
    reportView: "skills-check"
  });
  assert.equal(
    reportHash,
    "#teacher/reports/report?class=class-a&learner=learner-a&report=skills-check"
  );
  assert.deepEqual(parseTeacherRouteHash(reportHash), {
    appView: APP_VIEWS.FINISHED,
    classId: "class-a",
    groupId: "all",
    learnerId: "learner-a",
    reportView: "skills-check"
  });
  assert.equal(teacherIntentHash({ appView: APP_VIEWS.FINISHED, classId: "class-a" }), "");
  assert.equal(parseTeacherRouteHash("#teacher/progress/report?class=class-a"), null);
  assert.equal(parseTeacherRouteHash("#student-report=skills-check"), null);
});

test("teacher route parsing rejects unknown paths and normalizes report views", () => {
  assert.equal(parseTeacherRouteHash("#teacher/unknown?class=class-a"), null);
  assert.deepEqual(
    parseTeacherRouteHash(
      "#teacher/progress/report?class=class-a&learner=learner-a&report=unknown"
    ),
    {
      appView: APP_VIEWS.FINISHED,
      classId: "class-a",
      groupId: "all",
      learnerId: "learner-a",
      reportView: "whole-child"
    }
  );
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
    "#teacher/checks/el-benchmark?class=class-a&learner=learner-a&assessment=el_encoding&session=session-123&item=4"
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
