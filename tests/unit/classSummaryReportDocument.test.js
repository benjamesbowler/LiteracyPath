import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let ClassSummaryReportDocument;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ClassSummaryReportDocument = (await vite.ssrLoadModule(
    "/src/components/reports/ClassSummaryReportDocument.jsx"
  )).ClassSummaryReportDocument;
});

test.after(async () => {
  await vite?.close();
});

test("the everyday class download is a one-page planning summary, not a second formal report", () => {
  const html = renderToStaticMarkup(
    React.createElement(ClassSummaryReportDocument, {
      model: {
        className: "Willow Class",
        teacherName: "Ms Taylor",
        generatedAt: "2026-07-27T09:00:00.000Z",
        snapshot: {
          totalStudents: 24,
          policyReadyStudents: 18,
          averageAccuracy: 76
        },
        focusRows: [
          { skill: "Initial sounds", classAccuracy: 45, suggestedAction: "Sort picture cards by first sound." },
          { skill: "Blending", classAccuracy: 52, suggestedAction: "Blend three-sound words together." },
          { skill: "Final sounds", classAccuracy: 58, suggestedAction: "Listen for the final sound." },
          { skill: "Should not print", classAccuracy: 10 }
        ],
        groups: [
          { focus: "Initial sounds", students: ["Ava", "Ben"], suggestedActivity: "Picture sort" }
        ],
        masteryRows: [{ skill: "Rhyming" }]
      },
      provenanceOptions: {
        filters: { "Assessment period": "Last 30 days" }
      }
    })
  );

  assert.equal((html.match(/class="formal-class-report-page /g) || []).length, 1);
  assert.match(html, /data-report-detail="concise"/);
  assert.match(html, /What to teach next|Teach next/);
  assert.match(html, /Suggested groups/);
  assert.match(html, /How to read this/);
  assert.match(html, /Last 30 days/);
  assert.doesNotMatch(html, /Should not print/);
  assert.doesNotMatch(html, /Student progress|Reading summary|assessment attempt/i);
});

test("missing accuracy is never turned into a confident zero", () => {
  const html = renderToStaticMarkup(
    React.createElement(ClassSummaryReportDocument, {
      model: {
        className: "New Class",
        snapshot: {
          totalStudents: 1,
          policyReadyStudents: 0,
          averageAccuracy: null
        },
        focusRows: [],
        groups: [],
        masteryRows: []
      }
    })
  );

  assert.match(html, /Not enough results/);
  assert.doesNotMatch(html, />0%<|0% across/);
});
