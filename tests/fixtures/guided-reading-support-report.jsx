import React from "react";
import { createRoot } from "react-dom/client";

import "../../src/App.css";
import "../../src/styles/student-reports.css";
import { GuidedReadingReportView } from "../../src/components/reports/StudentReportViews.jsx";
import { buildGuidedReadingReportModel } from "../../src/data/studentReportingWorkspaceModel.js";

const occurredAt = "2026-07-23T09:00:00.000Z";
const supportUseEvents = [
  {
    eventId: "audit-night-whole-word",
    stage: "whole_word_audio",
    word: "night",
    wordIndex: 7,
    pageNumber: 1,
    occurredAt,
    segments: ["n", "igh", "t"],
    audioAvailable: true
  },
  {
    eventId: "audit-night-segmented",
    stage: "segmented_phonemes",
    word: "night",
    wordIndex: 7,
    pageNumber: 1,
    occurredAt,
    segments: ["n", "igh", "t"],
    audioAvailable: true
  },
  {
    eventId: "audit-night-reread",
    stage: "reread_prompt",
    word: "night",
    wordIndex: 7,
    pageNumber: 1,
    occurredAt,
    segments: ["n", "igh", "t"],
    audioAvailable: false
  }
];

const report = buildGuidedReadingReportModel({
  student: { id: "audit-aarav", name: "Aarav" },
  guidedReadingRecords: {
    "moonwood-tales-c-25": {
      bookId: "moonwood-tales-c-25",
      title: "One Night in the Deep Dark",
      type: "fiction",
      level: "C",
      completed: true,
      completedAt: occurredAt,
      lastReadAt: occurredAt,
      completedPages: 12,
      totalPages: 12,
      readCount: 1,
      pages: {
        0: {
          wordTexts: ["It", "was", "the", "deepest", "part", "of", "the", "night"],
          wordMarks: { 7: "support" },
          supportUseEvents,
          updatedAt: occurredAt
        }
      }
    }
  }
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <main className="lg-report-main" style={{ maxWidth: 980, margin: "32px auto", padding: 20 }}>
      <h1>Aarav · Guided Reading</h1>
      <GuidedReadingReportView report={report} />
    </main>
  </React.StrictMode>
);
