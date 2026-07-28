import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";

const appSource = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
const appSurfaceSource = readFileSync(new URL("../../src/components/AppSurface.jsx", import.meta.url), "utf8");
const appRuntimeServicesSource = readFileSync(new URL("../../src/appState/appRuntimeServices.js", import.meta.url), "utf8");
const appCss = readFileSync(new URL("../../src/App.css", import.meta.url), "utf8");
const finishedReportSource = readFileSync(new URL("../../src/components/FinishedReportPage.jsx", import.meta.url), "utf8");
const reportShellSource = readFileSync(new URL("../../src/components/reports/StudentReportShell.jsx", import.meta.url), "utf8");
const reportCss = readFileSync(new URL("../../src/styles/student-reports.css", import.meta.url), "utf8");

test("explicit report entries preserve the owned class and learner route", () => {
  assert.doesNotMatch(appSource, /studentReportHash/);
  assert.match(appRuntimeServicesSource, /function teacherReportHash\(classId, learnerId, reportView\)/);
  // 2026-07-27: the two duplicate "open this student's report" handlers were
  // collapsed into one openStudentReport(learnerId, reportView), so the hash is
  // built from the learner that was actually clicked rather than the ambient one.
  assert.match(
    appSurfaceSource,
    /function openStudentReport\(learnerId, reportView = "whole-child"\)/
  );
  assert.match(
    appSurfaceSource,
    /teacherReportHash\(selectedClassId, learnerId, reportView\)/
  );
  assert.doesNotMatch(appSurfaceSource, /const nextReportView = "whole-child";/);
  assert.match(
    appSource,
    /teacherReportHash\(selectedClassId, studentId, "skills-check"\)/
  );
});

test("report exporters propagate failure instead of announcing false success", () => {
  const propagatedFailures = appSource.match(/setMessage\("Could not export[^\n]+\n\s*throw error;/g) || [];
  assert.equal(propagatedFailures.length, 2);
});

test("the new report shell and collapsed evidence are printable", () => {
  assert.match(appCss, /\.lg-report-shell,\s*\.lg-report-shell \*\s*\{\s*visibility: visible;/);
  assert.match(reportCss, /\.lg-report-main details:not\(\[open\]\) > :not\(summary\)\s*\{\s*display: block !important;/);
});

test("the report action bar stacks from its real sidebar-constrained width", () => {
  assert.match(
    reportCss,
    /\.lg-report-shell\s*\{[\s\S]*?container-name: student-report-shell;[\s\S]*?container-type: inline-size;/,
  );
  assert.match(
    reportCss,
    /@container student-report-shell \(max-width: 1180px\) \{[\s\S]*?\.lg-report-topbar\s*\{[\s\S]*?display: grid;/,
  );
  assert.match(
    reportCss,
    /@container student-report-shell \(max-width: 1180px\)[\s\S]*?\.lg-report-actions\s*\{[\s\S]*?justify-content: flex-start;[\s\S]*?flex-wrap: wrap;/,
  );
});

test("report back actions name their actual destination", () => {
  assert.match(reportShellSource, /backLabel = "Back"/);
  assert.match(reportShellSource, /\{backLabel\}/);
  assert.match(finishedReportSource, /backLabel = "Back to dashboard"/);
  assert.match(appSurfaceSource, /backLabel=\{options\.onBack \? "Back to reports" : "Back to dashboard"\}/);
});

test("standalone reports focus their visible heading without stealing focus inside the report funnel", () => {
  assert.match(reportShellSource, /focusHeadingOnMount = false/);
  assert.match(
    reportShellSource,
    /if \(!focusHeadingOnMount\) return;\s*headingRef\.current\?\.focus\(\{ preventScroll: true \}\);/
  );
  assert.match(finishedReportSource, /focusHeadingOnMount=\{focusHeadingOnMount\}/);
  assert.match(
    appSurfaceSource,
    /focusHeadingOnMount=\{options\.focusHeadingOnMount \?\? !options\.onBack\}/
  );
});

test("report actions stay specific to their evidence area", () => {
  // 2026-07-27: renamed with the section - assessments have their own funnel now.
  assert.match(finishedReportSource, /Open assessments/);
  assert.match(finishedReportSource, /Start an assessment/);
  assert.match(finishedReportSource, /Download practice data/);
  const rows = buildStudentWorkspaceCsvRows("whole-child", {
    wholeChild: {
      descriptiveAssessments: [{
        title: "EL Encoding",
        interpretation: "Descriptive evidence only."
      }]
    }
  });
  const descriptiveAssessment = rows.find(
    row => row["Row type"] === "Descriptive assessment summary"
  );
  assert.equal(descriptiveAssessment?.Status, "Descriptive results (not a pass rating)");
});

test("formal report actions wait for every saved evidence source", () => {
  assert.match(appSurfaceSource, /selectedStudentEvidenceReadState, selectedStudentEvidenceReady/);
  assert.match(appSurfaceSource, /evidenceReady=\{selectedStudentEvidenceReady\}/);
  assert.match(finishedReportSource, /printDisabled=\{!evidenceReady\}/);
  assert.match(finishedReportSource, /onExport=\{exportConfig\.enabled \|\| !evidenceReady \? exportActiveReport : null\}/);
  assert.match(
    finishedReportSource,
    /Some saved results could not be confirmed\. This report may be incomplete, so printing and downloads are paused\./
  );
  assert.match(finishedReportSource, /disabled=\{!evidenceReady \|\| !scopeReady \|\| exporting\}/);
  assert.match(finishedReportSource, /\{evidenceReady && \(\s*<>/);
  assert.match(finishedReportSource, /Saved results unavailable/);
  assert.match(finishedReportSource, /Missing results are not shown as zero or as not yet assessed/);
});

test("saved answer history reaches the report model and export provenance", () => {
  assert.match(appSource, /allowPassageAudio, answerHistory, answerQuestion/);
  assert.match(appSurfaceSource, /allowPassageAudio, answerHistory, answerQuestion/);
  assert.match(appSurfaceSource, /answerHistory=\{answerHistory\}/);
  assert.match(
    finishedReportSource,
    /buildStudentReportingWorkspaceModel\(\{[\s\S]*?assessmentHistory,\s*answerHistory,/
  );
  assert.match(
    finishedReportSource,
    /const reportEvidenceSource = useMemo\(\(\) => \[\s*\.\.\.assessmentHistory,\s*\.\.\.answerHistory,/
  );
});

test("high-frequency-word reports group tasks and cap each visible preview", () => {
  const reportViewSource = readFileSync(
    new URL("../../src/components/reports/SimpleStudentReportViews.jsx", import.meta.url),
    "utf8"
  );

  for (const heading of [
    "Reading words on their own",
    "Choosing words in a sentence",
    "Spelling words in a sentence"
  ]) {
    assert.match(reportViewSource, new RegExp(heading));
  }
  assert.match(reportViewSource, /previewSize=\{12\}/);
  assert.match(reportViewSource, /visibleSeenRows = showAllSeen \? seenRows : seenRows\.slice\(0, previewSize\)/);
  assert.match(reportViewSource, /visibleUnseenRows = showAllUnseen \? unseenRows : unseenRows\.slice\(0, previewSize\)/);
  assert.match(reportViewSource, /aria-expanded=\{showAllSeen\}/);
  assert.match(reportViewSource, /aria-expanded=\{showAllUnseen\}/);
});

test("overview groups keep the teacher's disclosure choice after showing more rows", () => {
  const reportViewSource = readFileSync(
    new URL("../../src/components/reports/SimpleStudentReportViews.jsx", import.meta.url),
    "utf8"
  );

  assert.match(reportViewSource, /useState\(Boolean\(group\.defaultOpen\)\)/);
  assert.doesNotMatch(reportViewSource, /open=\{group\.defaultOpen\}/);
  assert.match(reportViewSource, /open=\{isOpen\}/);
  assert.match(
    reportViewSource,
    /onToggle=\{event => setIsOpen\(event\.currentTarget\.open\)\}/
  );
  assert.match(reportViewSource, /onClick=\{\(\) => setExpanded\(value => !value\)\}/);
});
