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
    renderClassReport: (onBack, options = {}) => React.createElement(
      "p",
      null,
      `class report${options.skillFilter ? ` filtered to ${options.skillFilter}` : ""}`
    ),
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

// A Dashboard sound-map tile is meant to land on this report already narrowed
// to the sound it was about. TeacherTodayPage does not name a skill yet, so
// what is pinned here is the receiving end: a filter that does arrive opens the
// class report straight away and reaches the report itself.
test("a sound-map skill filter opens the class report already narrowed", () => {
  const html = render("#teacher/reports?class=class-a", {
    soundMapSkillFilter: "Digraphs"
  });
  assert.match(html, /class report filtered to Digraphs<\/p>/);
});

test("no skill filter leaves the funnel exactly where it was", () => {
  const html = render("#teacher/reports?class=class-a");
  assert.doesNotMatch(html, /class report/);
  assert.match(html, /<strong>Whole class<\/strong>/);
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
  assert.match(html, /Which books has this student read/);
  assert.match(html, /What has this student done in the games and story worlds\?/);
  assert.match(html, /Reading and practice detail/);
  assert.match(html, /aria-label="Main reports"/);
});

test("the student choice is searchable without hiding the whole-class report", () => {
  const html = render("#teacher/reports?class=class-a");
  assert.match(html, /Find a student/);
  assert.match(html, /type="search"/);
  assert.match(html, /<strong>Whole class<\/strong>/);
});

test("a bare Reports route still renders the class and student recovery steps", () => {
  const html = render("#teacher/reports?group=all", {
    selectedClassId: "",
    className: "",
    selectedStudentId: "",
    selectedStudentName: "",
    reportView: "whole-child"
  });
  assert.match(html, /Choose a class/);
  assert.match(html, /Whole class, or one student/);
  assert.match(html, /Choose the whole class or one student first\./);
  assert.doesNotMatch(html, /student report: whole-child/);
  assert.doesNotMatch(html, /No progress results yet/);
});

test("stale student route state never renders an empty student report", () => {
  const html = render(
    "#teacher/reports?class=class-a&learner=missing&report=whole-child&show=1",
    {
      selectedStudentId: "missing",
      selectedStudentName: "",
      reportView: "whole-child"
    }
  );
  assert.match(html, /Whole class, or one student/);
  assert.doesNotMatch(html, /student report: whole-child/);
  assert.doesNotMatch(html, /· Summary/);
});

test("a deep link restores the exact report the teacher was reading", () => {
  const html = render(
    "#teacher/reports?class=class-a&learner=student-1&report=hfw&show=1",
    { selectedStudentId: "student-1", selectedStudentName: "Ada", reportView: "hfw" }
  );
  assert.match(html, /Ada · High-frequency words/);
  assert.match(html, /student report: hfw<\/p>/);
});

test("an individual report deep link waits for complete saved evidence", () => {
  const html = render(
    "#teacher/reports?class=class-a&learner=student-1&report=whole-child&show=1",
    {
      selectedStudentId: "student-1",
      selectedStudentName: "Ada",
      reportView: "whole-child",
      studentEvidenceReady: false,
      studentEvidenceStatus: "error",
      onRetryStudentEvidence: () => {}
    }
  );

  assert.match(html, /Some report information could not be loaded/);
  assert.match(html, /Missing students and results are not counted as zero/);
  assert.match(html, /Try loading again/);
  assert.doesNotMatch(html, /student report: whole-child/);
});

test("a class report deep link cannot reuse incomplete class evidence", () => {
  const html = render(
    "#teacher/reports?class=class-a&who=class&show=1",
    {
      classReportEvidenceReady: false,
      classReportEvidenceLoading: false,
      onRetryClassReportEvidence: () => {}
    }
  );

  assert.match(html, /Some report information could not be loaded/);
  assert.match(html, /roster and every saved class result have been confirmed/);
  assert.doesNotMatch(html, /class report<\/p>/);
});

test("earlier answers stay visible and changeable, later steps say why they wait", () => {
  const html = render("#teacher/reports?class=class-a");
  assert.match(html, /<p class="teacher-funnel-step-answer">Audit Class A<\/p>/);
  assert.match(html, />Change<\/button>/);
  assert.match(html, /Choose the whole class or one student first\./);
});

test("both chooser pages keep their answers addressable and their focus honest", () => {
  const checks = readFileSync(
    new URL("../../src/components/TeacherAssessmentsPage.jsx", import.meta.url),
    "utf8"
  );
  const reports = readFileSync(
    new URL("../../src/components/TeacherReportsHubPage.jsx", import.meta.url),
    "utf8"
  );
  // 2026-07-29: Assessments is the v2 two-panel screen and no longer stacks
  // numbered TeacherFunnelStep cards; Reports still does, so the component and
  // its shared styling stay. What both must keep is the behaviour underneath.
  assert.match(reports, /import \{ TeacherFunnelStep \} from ".\/TeacherFunnelStep.jsx"/);
  assert.doesNotMatch(checks, /TeacherFunnelStep/);
  for (const source of [checks, reports]) {
    // Every answer goes into the URL, so a refresh mid-flow keeps its place.
    assert.match(source, /writeTeacherFunnelParams\(\{/);
    // A step that unlocks takes focus, or a keyboard user never learns it did.
    assert.match(source, /\w+\?\.current\?\.focus\(\{ preventScroll: true \}\)/);
  }
});

test("opening a report focuses a visible heading with a visible focus ring", () => {
  const css = readFileSync(
    new URL("../../src/App.css", import.meta.url),
    "utf8"
  );
  const openReportHeadingRule = css.match(
    /\.teacher-funnel-page\.report-open \.teacher-funnel-report > h3 \{([^}]*)\}/
  )?.[1] || "";
  const focusRule = css.match(
    /\.teacher-funnel-report > h3:focus \{([^}]*)\}/
  )?.[1] || "";

  assert.ok(openReportHeadingRule, "open report heading rule is missing");
  assert.doesNotMatch(openReportHeadingRule, /clip(?:-path)?:|position:\s*absolute|height:\s*1px/);
  assert.match(focusRule, /outline:\s*3px/);
  assert.doesNotMatch(focusRule, /outline:\s*0/);
});
