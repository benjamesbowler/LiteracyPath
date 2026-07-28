import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  printTeacherDocument,
  TEACHER_PRINT_TARGETS
} from "../../src/utils/teacherPrintTarget.js";

let ElClassReportDocument;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ ElClassReportDocument } = await vite.ssrLoadModule(
    "/src/components/reports/ElClassReportDocument.jsx"
  ));
});

test.after(async () => {
  await vite?.close();
});

const report = {
  className: "Willow Class",
  generatedAt: "2026-07-27T12:00:00.000Z",
  benchmarkScope: {
    grade: "1",
    benchmarkWindow: "MOY",
    label: "Grade 1 · MOY",
    matchingAttemptCount: 2
  },
  selectedDatePeriod: { label: "All time" },
  summary: { totalStudents: 2 },
  sourceAttemptIds: ["pa-1", "decoding-1"],
  dateRange: {
    start: "2026-07-20T09:00:00.000Z",
    end: "2026-07-27T09:00:00.000Z"
  },
  assessmentWindow: "Selected EL route only.",
  schemaVersion: 7,
  formalAssessments: {
    classBenchmarkDomainSummaries: [
      {
        domainKey: "phonologicalAwareness",
        domainLabel: "Phonological and Phonemic Awareness",
        studentsWithSavedEvidence: 1,
        studentsWithScoredEvidence: 1,
        totalStudents: 2,
        metrics: { averageAccuracyRate: 75 }
      },
      {
        domainKey: "decoding",
        domainLabel: "Decoding and Automaticity",
        studentsWithSavedEvidence: 1,
        studentsWithScoredEvidence: 1,
        totalStudents: 2,
        metrics: { averageAccuracyRate: 80, averageAutomaticityRate: 60 }
      }
    ],
    classBenchmarkMatrix: [
      {
        studentId: "student-a",
        studentName: "Aarav",
        cells: {
          phonologicalAwareness: {
            domainKey: "phonologicalAwareness",
            hasSavedEvidence: true,
            administrationStatusLabel: "Assessment completed",
            metrics: { accuracyRate: 75 }
          },
          decoding: {
            domainKey: "decoding",
            hasSavedEvidence: true,
            administrationStatusLabel: "Partly completed",
            metrics: { accuracyRate: 80, automaticityRate: 60 },
            candidatePlacement: { candidateMicrophase: 4 }
          }
        }
      },
      {
        studentId: "student-b",
        studentName: "Aisha",
        cells: {
          phonologicalAwareness: {
            domainKey: "phonologicalAwareness",
            hasSavedEvidence: false
          },
          decoding: {
            domainKey: "decoding",
            hasSavedEvidence: false
          }
        }
      }
    ]
  }
};

test("the printable EL class document contains its selected period and actual EL results", () => {
  const html = renderToStaticMarkup(
    React.createElement(ElClassReportDocument, { report })
  );

  assert.match(html, /Formal EL assessment record/);
  assert.match(html, /Willow Class/);
  assert.match(html, /Grade 1 · Middle of year/);
  assert.match(html, /Phonological and Phonemic Awareness/);
  assert.match(html, /Decoding and Automaticity/);
  assert.match(html, /Aarav/);
  assert.match(html, /accuracy 75%/);
  assert.match(html, /Suggested reading stage: 4 \(not yet confirmed\)/);
  assert.match(html, /Aisha/);
  assert.match(html, /Not checked/);
  assert.match(html, /Grade and time of year/);
  assert.match(html, /Saved EL assessments included/);
  assert.match(html, /A suggested reading stage is provisional until a teacher confirms it/);
  assert.doesNotMatch(html, /\bMOY\b/);
  assert.doesNotMatch(
    html,
    /\b(?:EL route|included attempts?|candidate microphases?|assessment routes?|provisional microphase|teacher-confirmed microphase)\b/i
  );
  assert.doesNotMatch(html, /undefined|null%|NaN%/i);
});

test("the EL print action exposes the EL target only while the print snapshot is taken", () => {
  const originalDocument = globalThis.document;
  const body = { dataset: {} };
  globalThis.document = { body };
  let targetDuringPrint = "";
  try {
    printTeacherDocument(TEACHER_PRINT_TARGETS.EL_CLASS, () => {
      targetDuringPrint = body.dataset.teacherPrintTarget;
    });
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  }

  assert.equal(targetDuringPrint, "el-class");
  assert.equal(body.dataset.teacherPrintTarget, undefined);
});
