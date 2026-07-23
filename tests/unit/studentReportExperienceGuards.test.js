import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
const appCss = readFileSync(new URL("../../src/App.css", import.meta.url), "utf8");
const finishedReportSource = readFileSync(new URL("../../src/components/FinishedReportPage.jsx", import.meta.url), "utf8");
const reportCss = readFileSync(new URL("../../src/styles/student-reports.css", import.meta.url), "utf8");

test("explicit report entries replace a stale report hash", () => {
  assert.match(appSource, /studentReportHash\(nextReportView\)/);
  assert.match(appSource, /studentReportHash\("skills-check"\)/);
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
  assert.match(finishedReportSource, /Open EL assessments/);
  assert.match(finishedReportSource, /Start Skills Check/);
  assert.match(finishedReportSource, /Download practice data/);
  assert.match(finishedReportSource, /Descriptive evidence \(not a mastery rating\)/);
});
