import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
let vite, Overview, Responses;
test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ SimpleOverviewReportView: Overview } = await vite.ssrLoadModule("/src/components/reports/SimpleStudentReportViews.jsx"));
  ({ SavedAssessmentResponses: Responses } = await vite.ssrLoadModule("/src/components/reports/TeacherActivityHistory.jsx"));
});
test.after(() => vite?.close());
function renderPriority({ ready, status }) {
  const concept = { conceptId: "initial-s", label: "Initial s", domain: "phonological_awareness", status: { id: status }, policyConclusion: { ready }, evidenceBasis: { observations: 12, correct: 5 }, evidence: [] };
  return renderToStaticMarkup(React.createElement(Overview, { workspace: { wholeChild: { concepts: [concept], nextSteps: [concept] } }, studentName: "Ada", onTeachPriority() {}, onStartAssessment() {} }));
}
test("a report offers focused practice only after the evidence owner confirms sufficiency", () => {
  assert.match(renderPriority({ ready: true, status: "needs_support" }), />Plan focused practice<\/button>/);
  const sparse = renderPriority({ ready: false, status: "needs_support" });
  assert.match(sparse, />Start assessment<\/button>/);
  assert.doesNotMatch(sparse, />Plan focused practice<\/button>/);
});
test("mixed report evidence leads to review rather than another generic assessment", () => {
  const mixed = renderPriority({ ready: true, status: "mixed_evidence" });
  assert.match(mixed, />Review results<\/button>/);
  assert.doesNotMatch(mixed, />Plan focused practice<\/button>/);
});
test("original response detail preserves false and zero without inventing outcome or support", () => {
  const html = renderToStaticMarkup(React.createElement(Responses, { record: { questionRecords: [{ prompt: "Original wording", selectedAnswer: false, expectedResponse: 0 }] } }));
  assert.match(html, /Original wording/);
  assert.match(html, /<td>false<\/td><td>0<\/td><td>Not recorded<\/td><td>Not recorded<\/td>/);
  assert.doesNotMatch(html, /Secure|Incorrect|Correct recorded/);
});
