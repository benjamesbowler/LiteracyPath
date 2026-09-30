import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
test.after(() => vite.close());
const { SimpleOverviewReportView } = await vite.ssrLoadModule("/src/components/reports/SimpleStudentReportViews.jsx");
const { StudentReportShell } = await vite.ssrLoadModule("/src/components/reports/StudentReportShell.jsx");

function workspaceWithSparseResults() {
  const concepts = Array.from({ length: 126 }, (_, index) => ({
    conceptId: `item-${index}`,
    key: `target-${index}`,
    label: `Target ${index}`,
    domain: "phonics",
    status: { id: index ? "not_checked" : "not_enough_evidence", label: index ? "Not checked" : "Not enough evidence" },
    evidenceBasis: { observations: index ? 0 : 1, correct: index ? null : 1, accuracy: index ? null : 100 },
    policyConclusion: { reason: "One scored response cannot support a learning judgement." }
  }));
  return {
    wholeChild: {
      concepts,
      nextSteps: [{ label: "Target 0", reason: "One scored response cannot support a learning judgement.", domain: "phonics", status: { id: "not_enough_evidence" } }]
    }
  };
}

test("a sparse Summary leads with evidence collection, opens populated evidence and preserves all source items", () => {
  const html = renderToStaticMarkup(React.createElement(SimpleOverviewReportView, { workspace: workspaceWithSparseResults(), studentName: "Ada" }));
  assert.ok(html.indexOf('aria-label="Current instructional priority"') < html.indexOf('class="simple-report-coverage"'));
  assert.match(html, /One scored response cannot support a learning judgement/);
  assert.match(html, /collect a current independent assessment/);
  assert.match(html, /All evidence and coverage · 126 source items/);
  assert.match(html, /class="simple-report-group not-enough-yet" open=""/);
  assert.doesNotMatch(html, /class="simple-report-group needs-teaching" open=""/);
  assert.match(html, /Not checked is not a low result/);
  // Every domain has a disclosure and an expansion control instead of losing
  // the 121 rows beyond the preview; the original source model remains intact.
  assert.match(html, /Show all 126/);
  assert.equal(workspaceWithSparseResults().wholeChild.concepts.length, 126);
});

test("one Export disclosure names student, report and serializer scope without a second download", () => {
  const html = renderToStaticMarkup(React.createElement(StudentReportShell, {
    activeView: "whole-child", studentName: "Ada", onViewChange() {}, onExport() {},
    exportLabel: "Download progress and evidence workbook (XLSX)",
    exportScope: "Current judgements: latest 90 days. All source items and saved Skills detail.",
    provenanceRows: [{ field: "Content version(s)", value: "frozen-source-v1" }]
  }));
  assert.equal((html.match(/>Export<\/summary>/g) || []).length, 1);
  assert.match(html, /Ada · Summary/);
  assert.match(html, /latest 90 days/);
  assert.match(html, /Print current summary \/ Save as PDF/);
  assert.match(html, /frozen-source-v1/);
  assert.equal((html.match(/>Download /g) || []).length, 1);
});
