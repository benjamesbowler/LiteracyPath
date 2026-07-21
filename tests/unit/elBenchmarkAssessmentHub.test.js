import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { EL_BENCHMARK_IDS } from "../../src/data/elBenchmarkAssessments.js";

let ELAssessmentsPage;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const module = await vite.ssrLoadModule("/src/components/AppPages.jsx");
  ELAssessmentsPage = module.ELAssessmentsPage;
});

test.after(async () => {
  await vite?.close();
});

function selectedValueForLabel(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const select = html.match(new RegExp(`<label>\\s*${escaped}\\s*<select[\\s\\S]*?<\\/select>`))?.[0] || "";
  return select.match(/<option value="([^"]+)" selected="">/)?.[1] || "";
}

test("the hub derives Decoding and Fluency starts from completed evidence, never newer partials", () => {
  const common = {
    benchmarkWindow: "MOY",
    gradePath: "1",
    studentId: "student-1"
  };
  const history = [
    {
      ...common,
      administrationStatus: "completed",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      attemptId: "encoding-completed",
      completedAt: "2026-07-20T10:00:00.000Z",
      confirmedPlacement: { candidateMicrophase: "late_partial" }
    },
    {
      ...common,
      administrationStatus: "partial",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      attemptId: "encoding-newer-partial",
      updatedAt: "2026-07-21T10:00:00.000Z",
      confirmedPlacement: { candidateMicrophase: "middle_full" }
    },
    {
      ...common,
      administrationStatus: "completed",
      assessmentType: EL_BENCHMARK_IDS.DECODING,
      attemptId: "decoding-completed",
      completedAt: "2026-07-20T11:00:00.000Z",
      fluencyStartMicrophase: { microphase: "early_full" }
    },
    {
      ...common,
      administrationStatus: "partial",
      assessmentType: EL_BENCHMARK_IDS.DECODING,
      attemptId: "decoding-newer-partial",
      updatedAt: "2026-07-21T11:00:00.000Z",
      fluencyStartMicrophase: { microphase: "late_full" }
    }
  ];

  const html = renderToStaticMarkup(React.createElement(ELAssessmentsPage, {
    assessmentHistory: history,
    elBenchmarkDraft: {
      assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      grade: "1",
      window: "MOY"
    },
    studentId: "student-1",
    studentName: "Ada"
  }));

  assert.equal(selectedValueForLabel(html, "Decoding start"), "late_partial");
  assert.equal(selectedValueForLabel(html, "Fluency start"), "early_full");
  assert.match(html, /Preselected from the latest completed Decoding fluency handoff/);
  assert.doesNotMatch(html, /value="middle_full" selected/);
  assert.doesNotMatch(html, /value="late_full" selected/);
});

test("a candidate-only Encoding indication is visibly provisional and is never treated as confirmed provenance", () => {
  const html = renderToStaticMarkup(React.createElement(ELAssessmentsPage, {
    assessmentHistory: [{
      administrationStatus: "completed",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      attemptId: "encoding-candidate-only",
      benchmarkWindow: "MOY",
      candidatePlacement: { candidateMicrophase: "late_partial", requiresTeacherConfirmation: true },
      completedAt: "2026-07-20T10:00:00.000Z",
      gradePath: "1",
      scoreStatus: "scored",
      studentId: "student-1"
    }],
    elBenchmarkDraft: {
      assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      grade: "1",
      window: "MOY"
    },
    studentId: "student-1",
    studentName: "Ada"
  }));

  assert.equal(selectedValueForLabel(html, "Decoding start"), "late_partial");
  assert.match(html, /Preselected from a provisional Encoding indication; review and justify this start before Decoding/);
  assert.match(html, /Sequence review required before starting/);

  const componentSource = ELAssessmentsPage.toString();
  assert.match(componentSource, /decodingStartSource === "confirmed_encoding_placement"/);
  assert.match(componentSource, /decodingStart === confirmedEncodingIndication/);
  assert.match(componentSource, /teacherConfirmed: teacherReviewed/);
  assert.match(componentSource, /reviewedAt: teacherReviewed \?/);
});
