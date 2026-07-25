import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";

const appSource = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
const appSurfaceSource = readFileSync(new URL("../../src/components/AppSurface.jsx", import.meta.url), "utf8");
const appRuntimeServicesSource = readFileSync(new URL("../../src/appState/appRuntimeServices.js", import.meta.url), "utf8");
const appCss = readFileSync(new URL("../../src/App.css", import.meta.url), "utf8");
const finishedReportSource = readFileSync(new URL("../../src/components/FinishedReportPage.jsx", import.meta.url), "utf8");
const reportCss = readFileSync(new URL("../../src/styles/student-reports.css", import.meta.url), "utf8");

test("explicit report entries preserve the owned class and learner route", () => {
  assert.doesNotMatch(appSource, /studentReportHash/);
  assert.match(appRuntimeServicesSource, /function teacherReportHash\(classId, learnerId, reportView\)/);
  assert.match(
    appSurfaceSource,
    /teacherReportHash\(selectedClassId, studentId, nextReportView\)/
  );
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

test("report actions stay specific to their evidence area", () => {
  assert.match(finishedReportSource, /Open EL checks/);
  assert.match(finishedReportSource, /Start a check/);
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
    row => row["Row type"] === "Descriptive check summary"
  );
  assert.equal(descriptiveAssessment?.Status, "Descriptive results (not a pass rating)");
});
