import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";


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

test("Reports opens the owned class summary without setup steps", () => {
  const html = render("#teacher/reports?class=class-a&who=class&learner=student-1", {
    selectedStudentId: "student-1", selectedStudentName: "Ada"
  });
  assert.match(html, /class report<\/p>/);
  assert.match(html, /Report for/);
  assert.match(html, /<option value="class" selected="">Whole class<\/option>/);
  assert.match(html, /<option value="student-1">Ada<\/option>/);
  assert.doesNotMatch(html, /Show the report|teacher-funnel-step|Choose a report style/);
});

test("batch EL downloads remain beside the report chooser", () => {
  const html = render("#teacher/reports?class=class-a");
  assert.match(html, /Multiple student EL reports/);
  assert.match(html, /aria-expanded="false"/);
});

test("saved progress checks remain available as collapsed detail for the chosen class", () => {
  const html = render("#teacher/reports?class=class-a", {
    assessmentHistory: [{
      assessmentType: "adaptive_progress_test", classId: "class-a", studentId: "student-1",
      studentName: "Ada", attemptId: "progress-1", completedAt: "2026-10-13T01:00:00Z",
      administrationStatus: "completed"
    }, {
      assessmentType: "adaptive_progress_test", classId: "other-class", studentId: "other-student",
      studentName: "Other child", attemptId: "progress-2", completedAt: "2026-10-13T01:00:00Z"
    }]
  });
  assert.match(html, /<details class="teacher-report-detail"><summary>Progress check results<\/summary>/);
  assert.match(html, /Ada ·/);
  assert.doesNotMatch(html, /Other child/);
});

test("class ownership and roster completeness are required before a summary opens", () => {
  assert.doesNotMatch(render("#teacher/reports?class=unknown", {
    selectedClassId: "unknown"
  }), /class report<\/p>/);
  assert.doesNotMatch(render("#teacher/reports?class=class-a", {
    studentListReadState: { status: "error", classId: "class-a", error: "Unavailable" }
  }), /class report<\/p>/);
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

test("a student link opens Summary without choosing a report style", () => {
  const html = render("#teacher/reports?class=class-a&learner=student-1", {
    selectedStudentId: "student-1", selectedStudentName: "Ada"
  });
  assert.match(html, /Ada · Summary/);
  assert.match(html, /student report: whole-child<\/p>/);
  assert.doesNotMatch(html, /Show the report|Choose a report style/);
});

test("a bare Reports route offers class recovery instead of rendering stale results", () => {
  const html = render("#teacher/reports?group=all", {
    selectedClassId: "", className: "", selectedStudentId: "",
    selectedStudentName: "", reportView: "whole-child"
  });
  assert.match(html, /Choose a class/);
  assert.doesNotMatch(html, /student report:|class report<\/p>/);
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
  assert.match(html, /Choose a student from this class/);
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

test("the report retains URL recovery and focuses its visible result heading", () => {
  const source = readFileSync(new URL("../../src/components/TeacherReportsHubPage.jsx", import.meta.url), "utf8");
  assert.match(source, /writeTeacherFunnelParams\(\{/);
  assert.match(source, /window.addEventListener\("popstate"/);
  assert.match(source, /reportHeadingRef.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(source, /TeacherFunnelStep|showButtonRef/);
});

test('confirmed class reports offer direct access to saved Mock MAP results', () => {
  const html = render('#teacher/reports?class=class-a', { onOpenMockResults: () => {} });
  assert.match(html, /Mock MAP results/);
  assert.doesNotMatch(render('#teacher/reports', { classList: [], onOpenMockResults: () => {} }), /Mock MAP results/);
});
