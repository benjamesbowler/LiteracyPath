import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

// ── WHAT THIS FILE PINS ─────────────────────────────────────────────────────
//
// One rule, four surfaces: a number the app has not read yet is never shown as
// a zero, and "you have nothing" is never said before the request that would
// prove it has come back.
//
// Each of these was a real defect. Today cleared its student list on a class
// change and immediately reported "No student needs a review". The Checks and
// Reports funnels read an empty class list on a fresh sign-in as "make your
// class first". The intervention panel started with loading already false, so
// a failed read looked exactly like a teacher who had planned nothing.

let TeacherAssessmentsPage;
let TeacherIntentPage;
let TeacherReportsHubPage;
let TeacherTodayPage;
let InterventionLoop;
let TeacherActivitySyncHealth;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  TeacherAssessmentsPage = (await vite.ssrLoadModule(
    "/src/components/TeacherAssessmentsPage.jsx"
  )).TeacherAssessmentsPage;
  TeacherReportsHubPage = (await vite.ssrLoadModule(
    "/src/components/TeacherReportsHubPage.jsx"
  )).TeacherReportsHubPage;
  TeacherIntentPage = (await vite.ssrLoadModule(
    "/src/components/teacher/TeacherIntentPage.jsx"
  )).TeacherIntentPage;
  TeacherTodayPage = (await vite.ssrLoadModule(
    "/src/components/TeacherTodayPage.jsx"
  )).TeacherTodayPage;
  InterventionLoop = (await vite.ssrLoadModule(
    "/src/components/teacher/InterventionLoop.jsx"
  )).InterventionLoop;
  TeacherActivitySyncHealth = (await vite.ssrLoadModule(
    "/src/components/teacher/TeacherActivitySyncHealth.jsx"
  )).TeacherActivitySyncHealth;
});

test.after(async () => {
  await vite?.close();
});

// A fresh sign-in: the class request is in flight, so there is no class list and
// no selected class yet. That is not the same as having no classes.
test("the checks funnel waits instead of telling a teacher to make their first class", () => {
  const loading = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: true,
    routeHash: "#teacher/checks"
  }));
  assert.match(loading, /data-teacher-state="loading"/);
  assert.doesNotMatch(loading, /Make your class first/);

  const settled = renderToStaticMarkup(React.createElement(TeacherAssessmentsPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: false,
    routeHash: "#teacher/checks"
  }));
  assert.match(settled, /data-teacher-state="empty"/);
  assert.match(settled, /Make your class first/);
});

test("the reports funnel waits instead of reporting no classes", () => {
  const loading = renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: true,
    routeHash: "#teacher/reports",
    renderStudentReport: () => null,
    renderClassReport: () => null
  }));
  assert.match(loading, /data-teacher-surface="progress"/);
  assert.match(loading, /data-teacher-state="loading"/);

  const settled = renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
    classList: [],
    selectedClassId: "",
    loadingClasses: false,
    routeHash: "#teacher/reports",
    renderStudentReport: () => null,
    renderClassReport: () => null
  }));
  assert.match(settled, /data-teacher-state="empty"/);
});

test("the resources page uses the same loading signal as the two funnels", () => {
  const loading = renderToStaticMarkup(React.createElement(TeacherIntentPage, {
    intent: "resources",
    classList: [],
    selectedClassId: "",
    loadingClasses: true
  }));
  assert.match(loading, /data-teacher-surface="resources"/);
  assert.match(loading, /data-teacher-state="loading"/);

  const settled = renderToStaticMarkup(React.createElement(TeacherIntentPage, {
    intent: "resources",
    classList: [],
    selectedClassId: "",
    loadingClasses: false
  }));
  assert.doesNotMatch(settled, /data-teacher-state="loading"/);
});

test("Today shows the loading state rather than a briefing full of zeros", () => {
  const shared = {
    classList: [{ id: "class-a", name: "Audit Class A" }],
    selectedClassId: "class-a",
    studentList: [],
    classDashboard: []
  };

  const loading = renderToStaticMarkup(React.createElement(TeacherTodayPage, {
    ...shared,
    loadingStudents: true
  }));
  assert.match(loading, /data-teacher-surface="today"/);
  assert.match(loading, /data-teacher-state="loading"/);
  assert.match(loading, /aria-busy="true"/);
  assert.doesNotMatch(loading, /No student needs a review/);
  assert.doesNotMatch(loading, /Today&#x27;s class briefing|Today's class briefing/);
  // The class picker survives the loading state, so the teacher keeps context.
  assert.match(loading, /Audit Class A/);

  const settled = renderToStaticMarkup(React.createElement(TeacherTodayPage, {
    ...shared,
    loadingStudents: false
  }));
  assert.doesNotMatch(settled, /data-teacher-state="loading"/);
  assert.match(settled, /No student needs a review/);
});

test("the intervention panel does not claim an empty plan list before it has read one", () => {
  const html = renderToStaticMarkup(React.createElement(InterventionLoop, {
    supabase: {},
    teacherId: "teacher-1",
    classId: "class-a",
    className: "Audit Class A",
    rows: []
  }));
  assert.match(html, /Loading your teaching plans/);
  assert.doesNotMatch(html, /No interventions planned for this class/);
});

test("saving and syncing shows no counts while it is still checking", () => {
  const html = renderToStaticMarkup(React.createElement(TeacherActivitySyncHealth, {
    supabase: {},
    classId: "class-a",
    className: "Audit Class A"
  }));
  assert.match(html, /Checking whether results are reaching your dashboard/);
  // "Saved 0 of 0" under a "Checking" header reads as a confirmed zero.
  assert.doesNotMatch(html, /<dl>/);
  assert.doesNotMatch(html, /0 of 0/);
});
