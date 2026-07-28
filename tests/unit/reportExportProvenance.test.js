import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExportProvenanceRows,
  exportProvenanceCsvPreamble,
  exportProvenanceTextBlock,
  REPORT_PRIVACY_CLASSIFICATION,
  REPORT_PROVENANCE_SHEET_NAME
} from "../../src/utils/exportProvenance.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";
import {
  createClassElAssessmentWorkbook,
  createStudentElAssessmentWorkbook
} from "../../src/utils/exportElAssessmentExcel.js";
import {
  createGuidedReadingCompletionWorkbook
} from "../../src/utils/exportGuidedReadingCompletionExcel.js";
import { buildReadingMasteryTextReport } from "../../src/utils/exportReadingMasteryText.js";

const GENERATED_AT = "2026-07-23T12:34:56.000Z";
const TIME_ZONE = "Australia/Sydney";
const VERSIONED_EVIDENCE = [{
  attemptId: "attempt-1",
  studentId: "student-1",
  completedAt: "2026-07-20T09:30:00.000Z",
  appVersion: "app-2026.07.23",
  assessmentVersion: "assessment-v4",
  formVersion: "form-v3",
  contentVersion: "content-v8",
  policyVersion: "policy-v6",
  scoringRuleVersion: "scoring-v5",
  administrationVersion: "admin-v2"
}];

const EXPECTED_PROVENANCE = [
  ["Report", "Student skills assessment"],
  ["School / organisation", "Harbour Primary"],
  ["Class", "Class 2B"],
  ["Student", "Aarav"],
  ["Generated at", GENERATED_AT],
  ["Time zone", TIME_ZONE],
  ["Filters", "Report view: Skills assessment; Period: Last 90 days"],
  ["Results period", "2026-07-20T09:30:00.000Z"],
  ["App version(s)", "app-2026.07.23"],
  ["Assessment version(s)", "assessment-v4, form-v3"],
  ["Content version(s)", "content-v8"],
  ["Scoring version(s)", "admin-v2, policy-v6, scoring-v5"],
  ["Definitions", "Metric definition rows are included in this file."],
  ["Privacy classification", REPORT_PRIVACY_CLASSIFICATION]
];

function provenanceEntries(rows) {
  return rows.map(row => [row.field, row.value]);
}

function worksheetProvenanceEntries(workbook) {
  const sheet = workbook.getWorksheet(REPORT_PROVENANCE_SHEET_NAME);
  assert.ok(sheet, `${REPORT_PROVENANCE_SHEET_NAME} worksheet exists`);
  return Array.from({ length: sheet.actualRowCount - 1 }, (_, index) => {
    const row = sheet.getRow(index + 2);
    return [row.getCell(1).value, row.getCell(2).value];
  });
}

test("canonical report provenance is a fixed, complete semantic snapshot", () => {
  const rows = buildExportProvenanceRows({
    reportTitle: "Student skills assessment",
    schoolName: "Harbour Primary",
    className: "Class 2B",
    learnerName: "Aarav",
    learnerId: "student-1",
    learnerCount: 1,
    generatedAt: GENERATED_AT,
    timeZone: TIME_ZONE,
    filters: {
      "Report view": "Skills assessment",
      Period: "Last 90 days"
    },
    evidenceSource: VERSIONED_EVIDENCE,
    definitions: "Metric definition rows are included in this file."
  });

  assert.deepEqual(provenanceEntries(rows), EXPECTED_PROVENANCE);
  assert.equal(new Set(rows.map(row => row.field)).size, EXPECTED_PROVENANCE.length);
});

test("large version sets use labeled deterministic compaction instead of silent truncation", () => {
  const rows = buildExportProvenanceRows({
    generatedAt: GENERATED_AT,
    timeZone: TIME_ZONE,
    evidenceSource: Array.from({ length: 30 }, (_, index) => ({
      contentVersion: `content-${String(index + 1).padStart(2, "0")}`
    }))
  });
  const contentVersions = rows.find(row => row.field === "Content version(s)")?.value;

  assert.match(
    contentVersions,
    /^30 versions included \(reference [a-f0-9]{8}\)\.$/
  );
  assert.doesNotMatch(contentVersions, /content-01/);
});

test("student CSV provenance survives row export and RFC-style CSV escaping", () => {
  const workspace = {
    generatedAt: GENERATED_AT,
    student: { id: "student-1", name: "Aarav" },
    skillsCheck: {
      attempts: VERSIONED_EVIDENCE,
      skills: [{
        skillName: "Initial Sounds",
        currentStatus: "Mastered",
        attemptCount: 1,
        latestCorrectCount: 1,
        latestTotalQuestions: 1,
        accuracy: 100,
        latestAt: VERSIONED_EVIDENCE[0].completedAt
      }]
    }
  };
  const rows = buildStudentWorkspaceCsvRows("skills-check", workspace, {
    reportTitle: "Student skills assessment",
    schoolName: "Harbour Primary",
    className: "Class 2B",
    learnerName: "Aarav",
    learnerId: "student-1",
    generatedAt: GENERATED_AT,
    timeZone: TIME_ZONE,
    filters: {
      "Report view": "skills-check",
      Period: "Last 90 days"
    },
    evidenceSource: VERSIONED_EVIDENCE
  });
  const provenance = rows.filter(row => row["Row type"] === "Report detail");

  assert.equal(provenance.length, EXPECTED_PROVENANCE.length - 4);
  assert.equal(provenance.find(row => row.Field === "Privacy classification").Value, REPORT_PRIVACY_CLASSIFICATION);
  assert.equal(provenance.some(row => /version/i.test(row.Field)), false);

  const preamble = exportProvenanceCsvPreamble(
    provenance.map(row => ({ field: row.Field, value: row.Value }))
  );
  assert.match(preamble, /^"Section","Field","Value"/);
  assert.match(preamble, /"About this report","Filters","Report view: Skills assessment; Period: Last 90 days"/);
  assert.match(preamble, new RegExp(REPORT_PRIVACY_CLASSIFICATION));
});

test("plain-text report provenance keeps every canonical field visible", () => {
  const rows = buildExportProvenanceRows({
    reportTitle: "Reading Mastery Report",
    schoolName: "Harbour Primary",
    className: "Class 2B",
    learnerName: "Aarav",
    learnerId: "student-1",
    generatedAt: GENERATED_AT,
    timeZone: TIME_ZONE,
    evidenceSource: VERSIONED_EVIDENCE
  });
  const textBlock = exportProvenanceTextBlock(rows);

  assert.match(textBlock, /^About this report\n\n/);
  for (const row of rows) {
    assert.ok(textBlock.includes(`${row.field}: ${row.value}`));
  }
  assert.equal(textBlock.split("\n").length, rows.length + 2);
});

test("plain-text report keeps complete question evidence with provenance", () => {
  const answerHistory = Array.from({ length: 520 }, (_, index) => ({
    stage: "Initial Sounds",
    diagnosticTarget: `sound-${index}`,
    question: `Question ${index + 1}`,
    chosen: `Choice ${index + 1}`,
    correct: `Choice ${index + 1}`,
    isCorrect: true,
    date: new Date(Date.parse(GENERATED_AT) - (520 - index) * 1000).toISOString(),
    contentVersion: `content-${index + 1}`
  }));
  const report = buildReadingMasteryTextReport({
    accuracy: 100,
    answerHistory,
    className: "Class 2B",
    correctAnswered: 520,
    currentStage: { id: "initial_sounds", label: "Initial Sounds" },
    generatedAt: GENERATED_AT,
    mastery: { initial_sounds: { mastered: true } },
    passScore: 8,
    roundLength: 10,
    skillTree: [{ id: "initial_sounds", label: "Initial Sounds" }],
    studentId: "student-1",
    studentName: "Aarav",
    totalAnswered: 520
  });

  assert.match(report, /About this report/);
  assert.match(report, /Privacy classification: CONFIDENTIAL/);
  assert.match(report, /1\. Skill: Initial Sounds\nQuestion: Question 1/);
  assert.match(report, /520\. Skill: Initial Sounds\nQuestion: Question 520/);
  assert.doesNotMatch(report, /Recent Question Evidence/);
});

test("student and class EL Excel snapshots contain the canonical provenance block", async () => {
  const shared = {
    generatedAt: GENERATED_AT,
    timeZone: TIME_ZONE,
    className: "Class 2B",
    dateRange: {
      start: VERSIONED_EVIDENCE[0].completedAt,
      end: VERSIONED_EVIDENCE[0].completedAt
    },
    assessmentWindow: "All included evidence",
    benchmarkScope: { label: "Grade 2 · Window 1" },
    sourceSnapshot: { records: VERSIONED_EVIDENCE },
    exportVersionSummary: {
      appVersions: ["app-2026.07.23"],
      assessmentVersions: ["assessment-v4", "form-v3"],
      contentVersions: ["content-v8"],
      policyVersions: ["admin-v2", "policy-v6", "scoring-v5"]
    },
    summary: { totalStudents: 2 },
    formalAssessments: {}
  };
  const studentWorkbook = await createStudentElAssessmentWorkbook({
    ...shared,
    reportType: "individual",
    studentId: "student-1",
    studentName: "Aarav"
  });
  const classWorkbook = await createClassElAssessmentWorkbook({
    ...shared,
    reportType: "whole_class",
    studentRows: [{ studentId: "student-1" }, { studentId: "student-2" }]
  });

  for (const workbook of [studentWorkbook, classWorkbook]) {
    const entries = new Map(worksheetProvenanceEntries(workbook));
    assert.equal(entries.get("Generated at"), GENERATED_AT);
    assert.equal(entries.get("Time zone"), TIME_ZONE);
    assert.equal(entries.get("App version(s)"), "app-2026.07.23");
    assert.equal(entries.get("Assessment version(s)"), "assessment-v4, form-v3");
    assert.equal(entries.get("Content version(s)"), "content-v8");
    assert.equal(entries.get("Scoring version(s)"), "admin-v2, policy-v6, scoring-v5");
    assert.equal(entries.get("Privacy classification"), REPORT_PRIVACY_CLASSIFICATION);
    assert.match(entries.get("Definitions"), /How figures are worked out sheet/);
  }
});

test("Guided Reading Excel snapshot labels non-versioned evidence honestly", async () => {
  const { workbook } = await createGuidedReadingCompletionWorkbook({
    generatedAt: GENERATED_AT,
    timeZone: TIME_ZONE,
    classes: [{ id: "class-2b", name: "Class 2B" }],
    students: [{ id: "student-1", name: "Aarav", class_id: "class-2b" }],
    guidedReadingRecordsByStudent: [{
      studentId: "student-1",
      records: {
        "book-1": {
          title: "A Small Boat",
          level: "B",
          completed: true,
          completedAt: "2026-07-21T10:00:00.000Z",
          lastReadAt: "2026-07-21T10:05:00.000Z",
          readCount: 1
        }
      }
    }]
  });
  const entries = new Map(worksheetProvenanceEntries(workbook));

  assert.equal(entries.get("Generated at"), GENERATED_AT);
  assert.equal(entries.get("Time zone"), TIME_ZONE);
  assert.equal(entries.get("Results period"), "2026-07-21T10:00:00.000Z to 2026-07-21T10:05:00.000Z");
  assert.equal(entries.get("Content version(s)"), "No content version details included");
  assert.equal(entries.get("Scoring version(s)"), "No scoring version details included");
  assert.equal(entries.get("Privacy classification"), REPORT_PRIVACY_CLASSIFICATION);
});
