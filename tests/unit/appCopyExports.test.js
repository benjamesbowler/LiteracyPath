import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import {
  applyTeacherFacingWorkbookCopy,
  createClassElAssessmentWorkbook,
  createStudentElAssessmentWorkbook
} from "../../src/utils/exportElAssessmentExcel.js";
import {
  buildPresetExportProvenanceRows,
  exportProvenanceTextBlock
} from "../../src/utils/exportProvenance.js";
import { buildReadingMasteryTextReport } from "../../src/utils/exportReadingMasteryText.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";

const BANNED_TEACHER_COPY = /\b(?:child|children|checks?|evidence|learners?|policy|logins?|BOY|MOY|EOY|provenance)\b/i;
const BANNED_FORMAL_EL_SYSTEM_COPY = /\b(?:microphase|route decision|route judgment|benchmark scope)\b/i;
const RAW_FIXTURE_VALUE = /(?:student_internal_42|attempt_internal_99|benchmark-form-v7|policy-v12|not_assessed)/i;

function workbookText(workbook) {
  const values = [];
  workbook.worksheets.forEach(sheet => {
    values.push(sheet.name);
    sheet.eachRow(row => {
      row.eachCell(cell => values.push(String(cell.value ?? "")));
    });
  });
  return values.join("\n");
}

test("teacher-facing workbooks remove internal columns, version rows, raw values, and banned copy", () => {
  const workbook = new ExcelJS.Workbook();
  const results = workbook.addWorksheet("Assessment Evidence");
  results.addRow([
    "Attempt ID",
    "Student Name",
    "Administration status",
    "Result",
    "Form version"
  ]);
  results.addRow([
    "attempt_internal_99",
    "Aarav",
    "not_assessed",
    "3/5",
    "benchmark-form-v7"
  ]);
  results.addRow([
    "",
    "Mina",
    "Not checked yet",
    "1/2",
    ""
  ]);

  const details = workbook.addWorksheet("About this report");
  details.addRow(["Field", "Value"]);
  details.addRow(["App version(s)", "app-internal-v3"]);
  details.addRow(["Policy version(s)", "policy-v12"]);
  details.addRow(["Child", "Aarav"]);

  applyTeacherFacingWorkbookCopy(workbook);

  const text = workbookText(workbook);
  assert.doesNotMatch(text, BANNED_TEACHER_COPY);
  assert.doesNotMatch(text, RAW_FIXTURE_VALUE);
  assert.doesNotMatch(text, /\b\d+\s*\/\s*\d+\b/);
  assert.match(text, /Assessment Results/);
  assert.match(text, /Student Name/);
  assert.match(text, /Not checked/);
  assert.doesNotMatch(text, /Not (?:assessed|checked) yet/);
  assert.doesNotMatch(text, /yet yet/);
  assert.match(text, /3 of 5/);
});

test("student report CSV rows use friendly labels and never include internal record identifiers", () => {
  const generatedAt = "2026-07-25T12:00:00.000Z";
  const workspace = {
    generatedAt,
    student: { id: "student_internal_42", name: "Aarav" },
    skillsCheck: {
      skills: [{
        skillName: "Initial sounds",
        currentStatus: "not_assessed",
        attemptCount: 1,
        latestCorrectCount: 3,
        latestTotalQuestions: 5,
        accuracy: 60,
        latestAt: generatedAt
      }],
      attempts: [{
        attemptId: "attempt_internal_99",
        studentId: "student_internal_42",
        formVersion: "benchmark-form-v7",
        policyVersion: "policy-v12",
        completedAt: generatedAt
      }]
    }
  };

  const rows = buildStudentWorkspaceCsvRows("skills-check", workspace, {
    reportTitle: "Student Skills Check",
    learnerId: "student_internal_42",
    filters: { "Report view": "skills-check" },
    generatedAt
  });
  const text = JSON.stringify(rows);

  assert.match(text, /Skills assessment/);
  assert.match(text, /Student Skills Assessment/);
  assert.doesNotMatch(text, RAW_FIXTURE_VALUE);
  assert.doesNotMatch(text, BANNED_TEACHER_COPY);
  assert.equal(rows.some(row => /version/i.test(String(row.Field || ""))), false);
  assert.equal(rows.some(row => Object.hasOwn(row, "Attempt ID")), false);
});

test("every teacher download preset uses student and assessment terminology", () => {
  for (const presetId of ["letter", "pattern", "reading-csv", "reading-text", "guided-reading"]) {
    const text = exportProvenanceTextBlock(buildPresetExportProvenanceRows(presetId, {
      generatedAt: "2026-07-25T12:00:00.000Z",
      learnerName: "Aarav"
    }));
    assert.doesNotMatch(text, BANNED_TEACHER_COPY, `${presetId} provenance uses current teacher wording`);
    assert.match(text, /Student: Aarav/);
  }
});

test("plain-text reading reports use student and assessment terminology throughout", () => {
  const report = buildReadingMasteryTextReport({
    accuracy: 50,
    answerHistory: [{
      stage: "Initial sounds",
      question: "Which word starts with m?",
      chosen: "sun",
      correct: "moon",
      isCorrect: false,
      date: "2026-07-25T12:00:00.000Z"
    }],
    className: "Class 2B",
    correctAnswered: 0,
    currentStage: { id: "initial-sounds", label: "Initial sounds" },
    generatedAt: "2026-07-25T12:00:00.000Z",
    mastery: {},
    roundLength: 1,
    skillTree: [{ id: "initial-sounds", label: "Initial sounds" }],
    studentName: "Aarav",
    totalAnswered: 1
  });

  assert.doesNotMatch(report, BANNED_TEACHER_COPY);
  assert.match(report, /Student: Aarav/);
  assert.match(report, /Student answered: sun/);
  assert.match(report, /Status: current working skill/);
  assert.match(report, /Result: Needs another look/);
});

test("generated EL downloads use current teacher terminology in every visible cell", async () => {
  const report = {
    generatedAt: "2026-07-25T12:00:00.000Z",
    reportType: "individual",
    studentName: "Aarav",
    className: "Class 2B",
    formalAssessments: {}
  };
  const workbooks = [
    await createStudentElAssessmentWorkbook(report, { teacherFacing: true }),
    await createClassElAssessmentWorkbook({
      ...report,
      reportType: "whole_class",
      studentName: "",
      studentRows: []
    }, { teacherFacing: true })
  ];

  workbooks.forEach(workbook => {
    assert.doesNotMatch(workbookText(workbook), BANNED_TEACHER_COPY);
  });
});

test("formal EL workbook presentation uses teacher language for stages and next-step decisions", () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Benchmark Scope");
  sheet.addRow([
    "EL Benchmark Scope",
    "Microphase",
    "Route judgment usable",
    "Route decision"
  ]);
  sheet.addRow([
    "Grade 1 · MOY",
    "Middle partial",
    "Yes",
    "Continue to the next passage"
  ]);

  applyTeacherFacingWorkbookCopy(workbook);

  const text = workbookText(workbook);
  assert.doesNotMatch(text, BANNED_FORMAL_EL_SYSTEM_COPY);
  assert.doesNotMatch(text, /\bMOY\b/);
  assert.match(text, /EL grade and time of year/);
  assert.match(text, /Reading stage/);
  assert.match(text, /Next-step decision available/);
  assert.match(text, /Next-step decision/);
});
