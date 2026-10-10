import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { buildLiteracyMockReport } from "../../src/utils/literacyMockReport.js";

let vite;
let panel;
let reportComponent;
test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ TeacherLiteracyMockPanel: panel } = await vite.ssrLoadModule("/src/components/progress/TeacherLiteracyMockPanel.jsx"));
  ({ LiteracyMockReport: reportComponent } = await vite.ssrLoadModule("/src/components/progress/LiteracyMockReport.jsx"));
});
test.after(async () => { await vite?.close(); });

test("teacher preparation exposes full and individual options with honest time-window copy", () => {
  const html = renderToStaticMarkup(React.createElement(panel, { classId: "c", students: [{ id: "s", name: "Alex" }], initialStudentIds: ["s"] }));
  assert.match(html, /teacher-product-page literacy-mock-teacher/);
  assert.match(html, /Full mock · 43 questions/);
  assert.match(html, /Short mock · 24 questions/);
  assert.match(html, /Individual or selected students/);
  assert.match(html, /Actual MAP Growth is untimed/);
  assert.match(html, /Loading session history/);
  assert.doesNotMatch(html, /Start assessment/);
  assert.match(renderToStaticMarkup(React.createElement(panel, {})), /Choose a class/);
});

test("teacher report retains neutral missing samples and individual report has semantic tables", () => {
  const report = buildLiteracyMockReport({ session: { mock: { item_count: 43 } }, members: [{ student_id: "s", run: null }] }, { students: [{ id: "s", name: "Alex" }] });
  const classHtml = renderToStaticMarkup(React.createElement(reportComponent, { report }));
  assert.match(classHtml, /Responses for teacher review/);
  assert.match(classHtml, /Alex: no independent sample/);
  assert.doesNotMatch(classHtml, /Secure<|Needs support</);
  const pupilHtml = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: "s" }));
  assert.match(pupilHtml, /role="region" aria-label="Alex: four literacy areas" tabindex="0"/);
  assert.match(pupilHtml, /All 47 skills and next steps/);
  assert.match(pupilHtml, /Questions not reached/);
  assert.match(pupilHtml, /No recorded offer — not a weakness/);
  assert.doesNotMatch(pupilHtml, /NaN|undefined/);
});

test("teacher media log is separate from answer evidence and does not imply failed literacy", () => {
  const report = buildLiteracyMockReport({ session: { mock: { item_count: 24 } }, members: [{ student_id: "s", run: {
    plan: { itemIds: Array.from({ length: 24 }, (_, index) => `q${index}`) }, responses: [],
    mediaFailures: [{ questionId: "failed", skillId: "rhyming", level: 1, itemSnapshot: { prompt: "Choose the two pictures that rhyme." }, failedMediaPaths: ["/audio/shared.mp3"], responseStatus: "media_failed", isCorrect: null }]
  } }] }, { students: [{ id: "s", name: "Alex" }] });
  const html = renderToStaticMarkup(React.createElement(reportComponent, { report, initialStudentId: "s" }));
  assert.match(html, /Media availability log \(1\)/);
  assert.match(html, /Question-by-question evidence \(0\)/);
  assert.match(html, /These events did not use an answer slot or create a skill result/);
  assert.match(html, /No independent errors recorded/);
  assert.doesNotMatch(html, /\/audio\/shared\.mp3/);
});

test("a sparse error appears only in an unselected review list with its exact access conditions", () => {
  const report = buildLiteracyMockReport({ members: [{ student_id: "s", run: { plan: { itemIds: ["q"] }, responses: [{
    questionId: "q", skillId: "key_details", level: 1, responseStatus: "answered", isCorrect: false, evidenceType: "independent", supportUsed: false,
    serverReceivedAt: new Date().toISOString(), itemSnapshot: { prompt: "Choose.", passage: "Text", passageAccess: "text_and_audio", constructClaim: "key_details" }
  }] } }] }, { students: [{ id: "s", name: "Alex" }] });
  const html = renderToStaticMarkup(React.createElement(reportComponent, { report }));
  assert.equal(report.groups.length, 0);
  assert.match(html, /0 selected for teacher review/);
  assert.match(html, /Text and audio comprehension/);
  assert.match(html, /Not enough comparable evidence for a teaching-group suggestion/);
  assert.doesNotMatch(html, /checked=""/);
});
