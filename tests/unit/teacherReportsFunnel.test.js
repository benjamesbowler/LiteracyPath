import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { STUDENT_REPORT_VIEWS } from "../../src/components/reports/studentReportUiUtils.js";

// ── WHAT THIS FILE PINS ─────────────────────────────────────────────────────
//
// Reports used to be two destinations: a student picker on one route and a
// whole-class report on another, with the teacher expected to know which one
// they wanted before they got there. It is one page now - class, who, style,
// report - and the whole class is simply the first answer to "who".
//
// It is also deliberately the same shape as the Checks funnel, so the two are
// tested for the same things.

let TeacherReportsHubPage;
let vite;

const BASE = {
  classList: [{ id: "class-a", name: "Audit Class A" }],
  className: "Audit Class A",
  selectedClassId: "class-a",
  studentRows: [{ id: "student-1", name: "Ada" }, { id: "student-2", name: "Bo" }],
  selectedStudentId: "",
  selectedStudentName: "",
  reportView: ""
};

function render(routeHash, extra = {}) {
  return renderToStaticMarkup(React.createElement(TeacherReportsHubPage, {
    ...BASE,
    routeHash,
    renderStudentReport: view => React.createElement("p", null, `student report: ${view}`),
    renderClassReport: () => React.createElement("p", null, "class report"),
    ...extra
  }));
}

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const module = await vite.ssrLoadModule("/src/components/TeacherReportsHubPage.jsx");
  TeacherReportsHubPage = module.TeacherReportsHubPage;
});

test.after(async () => {
  await vite?.close();
});

test("the whole class is the first answer to step 2, not a second destination", () => {
  const html = render("#teacher/reports?class=class-a");
  const wholeClassAt = html.indexOf("<strong>Whole class</strong>");
  const firstStudentAt = html.indexOf("<strong>Ada</strong>");
  assert.ok(wholeClassAt > 0, "Whole class is not offered at step 2");
  assert.ok(wholeClassAt < firstStudentAt, "Whole class must come before the students");
  // The old separate entry point is gone.
  assert.doesNotMatch(html, /Open class report/);
});

test("choosing the whole class leads to the class report on the same page", () => {
  const html = render("#teacher/reports?class=class-a&who=class&show=1");
  assert.match(html, />Whole class<\/p>|Whole class<\/p>/);
  assert.match(html, /<p class="teacher-funnel-step-answer">Class summary<\/p>/);
  assert.match(html, /class report<\/p>/);
});

test("step 3 lists every report style with the question it answers", () => {
  const html = render(
    "#teacher/reports?class=class-a&learner=student-1",
    { selectedStudentId: "student-1", selectedStudentName: "Ada" }
  );
  assert.equal(STUDENT_REPORT_VIEWS.length, 6);
  for (const view of STUDENT_REPORT_VIEWS) {
    assert.match(
      html,
      new RegExp(`<strong>${view.label.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}</strong>`),
      `${view.id} is missing from step 3`
    );
  }
  // Two of these silently opened the overview instead until the deep-link
  // whitelist was derived from this same list.
  assert.match(html, /Which books has this child read/);
  assert.match(html, /What has this child done in the games and story worlds\?/);
});

test("a deep link restores the exact report the teacher was reading", () => {
  const html = render(
    "#teacher/reports?class=class-a&learner=student-1&report=hfw&show=1",
    { selectedStudentId: "student-1", selectedStudentName: "Ada", reportView: "hfw" }
  );
  assert.match(html, /Ada · High-frequency words/);
  assert.match(html, /student report: hfw<\/p>/);
});

test("earlier answers stay visible and changeable, later steps say why they wait", () => {
  const html = render("#teacher/reports?class=class-a");
  assert.match(html, /<p class="teacher-funnel-step-answer">Audit Class A<\/p>/);
  assert.match(html, />Change<\/button>/);
  assert.match(html, /Choose the whole class or one student first\./);
});

test("both funnels use the same step component, so the pattern is learned once", () => {
  const checks = readFileSync(
    new URL("../../src/components/TeacherAssessmentsPage.jsx", import.meta.url),
    "utf8"
  );
  const reports = readFileSync(
    new URL("../../src/components/TeacherReportsHubPage.jsx", import.meta.url),
    "utf8"
  );
  for (const source of [checks, reports]) {
    assert.match(source, /import \{ TeacherFunnelStep \} from ".\/TeacherFunnelStep.jsx"/);
    // Every answer goes into the URL, so a refresh mid-flow keeps its place.
    assert.match(source, /writeTeacherFunnelParams\(\{/);
    // A step that unlocks takes focus, or a keyboard user never learns it did.
    assert.match(source, /target\?\.current\?\.focus\(\{ preventScroll: true \}\)/);
  }
});
