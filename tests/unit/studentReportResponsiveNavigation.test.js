import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  STUDENT_REPORT_VIEWS
} from "../../src/components/reports/studentReportUiUtils.js";

const reportCss = readFileSync(
  new URL("../../src/styles/student-reports.css", import.meta.url),
  "utf8"
);

let StudentReportShell;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  StudentReportShell = (await vite.ssrLoadModule(
    "/src/components/reports/StudentReportShell.jsx"
  )).StudentReportShell;
});

test.after(async () => {
  await vite?.close();
});

test("desktop links and the compact report picker expose the same report destinations", () => {
  const html = renderToStaticMarkup(React.createElement(StudentReportShell, {
    activeView: "hfw",
    buildViewHref: viewId => `#report=${viewId}`,
    headingLabel: "High-frequency words",
    onViewChange() {},
    studentName: "Aarav"
  }, React.createElement("p", null, "Report body")));

  assert.match(html, /<nav class="lg-report-nav" aria-label="Student reports">/);
  assert.match(
    html,
    /<label class="lg-report-mobile-select"><span>Choose a report<\/span><select>/
  );
  for (const view of STUDENT_REPORT_VIEWS) {
    assert.match(html, new RegExp(`href="#report=${view.id}"`));
    assert.match(html, new RegExp(`<option value="${view.id}"`));
  }
  assert.equal((html.match(/href="#report=/g) || []).length, STUDENT_REPORT_VIEWS.length);
  assert.equal((html.match(/<option value=/g) || []).length, STUDENT_REPORT_VIEWS.length);
  assert.match(html, /<h1 tabindex="-1">High-frequency words<\/h1>/);
});

test("the compact breakpoint replaces hidden report links with the reachable select", () => {
  assert.match(
    reportCss,
    /@media \(max-width: 880px\) \{[\s\S]*?\.lg-report-nav-intro,\s*\.lg-report-nav-links,\s*\.lg-report-nav-more\s*\{\s*display: none;/
  );
  assert.match(
    reportCss,
    /@media \(max-width: 880px\) \{[\s\S]*?\.lg-report-mobile-select\s*\{\s*display: grid;/
  );
  assert.match(
    reportCss,
    /\.lg-report-main h1:focus\s*\{[\s\S]*?outline: 3px solid/
  );
});
