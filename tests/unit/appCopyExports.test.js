import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import { applyTeacherFacingWorkbookCopy } from "../../src/utils/exportElAssessmentExcel.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";

// 2026-07-26: "student" removed — see tools/checkAppCopy.js. Teachers say students.
const BANNED_TEACHER_COPY = /\b(?:assessment|evidence|learner|policy|login|BOY|MOY|EOY|provenance)\b/i;
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
  assert.match(text, /Check Results/);
  assert.match(text, /Student Name/);
  assert.match(text, /Not checked/);
  assert.match(text, /3 of 5/);
});

test("child report CSV rows use friendly labels and never include internal record identifiers", () => {
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

  assert.match(text, /Skills check/);
  assert.match(text, /Student Skills Check/);
  assert.doesNotMatch(text, RAW_FIXTURE_VALUE);
  // 2026-07-26: teacher exports now say Student. "Learner" stays banned.
  assert.doesNotMatch(text, /\bLearner\b/);
  assert.equal(rows.some(row => /version/i.test(String(row.Field || ""))), false);
  assert.equal(rows.some(row => Object.hasOwn(row, "Attempt ID")), false);
});
