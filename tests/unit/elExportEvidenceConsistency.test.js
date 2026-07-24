import assert from "node:assert/strict";
import test from "node:test";

import { buildStudentReportingWorkspaceModel } from "../../src/data/studentReportingWorkspaceModel.js";
import {
  buildStudentElAssessmentExportReport,
  createStudentElAssessmentWorkbook,
  EL_EMPTY_STUDENT_REPORT_SHEETS,
  EL_STUDENT_REPORT_SHEETS,
  getStudentElReportEvidenceCount,
  hasResolvedElExportScope
} from "../../src/utils/exportElAssessmentExcel.js";
import { getStudentElExportEntryDecision } from "../../src/utils/elAssessmentExportPolicy.js";

const student = { id: "student-aaron", name: "Aaron", classId: "class-one" };
const classes = [{ id: "class-one", name: "Class One" }];
const explicitScope = {
  grade: "K",
  benchmarkWindow: "BOY"
};
const syncedAt = "2026-07-23T11:06:00.000Z";

function worksheetRows(sheet) {
  const headers = sheet.getRow(1).values.slice(1);
  const rows = [];
  for (let index = 2; index <= sheet.rowCount; index += 1) {
    const values = sheet.getRow(index).values.slice(1);
    rows.push(Object.fromEntries(headers.map((header, offset) => [header, values[offset] ?? ""])));
  }
  return rows;
}

function skillsCheckLetterAttempt() {
  return {
    attemptId: "skills-check-letters-2026-06-12",
    assessmentType: "skill_checkpoint",
    skillId: "letter_names_and_sounds",
    skillName: "Letter names and sounds",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    teacherId: "teacher-one",
    administrationStatus: "completed",
    completedAt: "2026-06-12T09:00:00.000Z",
    updatedAt: "2026-06-12T09:01:00.000Z",
    totalQuestions: 4,
    correctCount: 3,
    passed: true,
    questionRecords: [
      {
        questionId: "m-uppercase-name",
        itemType: "letter_name",
        itemKey: "m",
        targetLetter: "M",
        responseStatus: "correct",
        isCorrect: true,
        timestamp: "2026-06-12T09:00:10.000Z"
      },
      {
        questionId: "m-uppercase-sound",
        itemType: "letter_sound",
        itemKey: "m",
        targetLetter: "M",
        responseStatus: "correct",
        isCorrect: true,
        timestamp: "2026-06-12T09:00:20.000Z"
      },
      {
        questionId: "m-lowercase-name",
        itemType: "letter_name",
        itemKey: "m",
        targetLetter: "m",
        responseStatus: "correct",
        isCorrect: true,
        timestamp: "2026-06-12T09:00:30.000Z"
      },
      {
        questionId: "m-lowercase-sound",
        itemType: "letter_sound",
        itemKey: "m",
        targetLetter: "m",
        responseStatus: "incorrect",
        isCorrect: false,
        timestamp: "2026-06-12T09:00:40.000Z"
      }
    ]
  };
}

test("D-001: Whole Child and focused EL export read the same Skills Check letter spine", async () => {
  const assessmentHistory = [skillsCheckLetterAttempt()];
  const evidenceReadState = {
    completedAt: syncedAt,
    syncStatus: "complete",
    sources: {
      assessmentAttempts: { lastSyncedAt: syncedAt, syncStatus: "complete" },
      itemMastery: { lastSyncedAt: syncedAt, syncStatus: "complete" },
      skillMastery: { lastSyncedAt: syncedAt, syncStatus: "complete" }
    }
  };
  const workspace = buildStudentReportingWorkspaceModel({
    student,
    assessmentHistory,
    evidenceReadState
  });
  const report = buildStudentElAssessmentExportReport({
    assessmentHistory,
    students: [student],
    classes,
    studentId: student.id,
    classId: student.classId,
    benchmarkScope: explicitScope,
    evidenceReadState
  });

  const wholeChildByConcept = new Map(
    workspace.wholeChild.concepts.map(row => [row.conceptId, row.status.id])
  );
  const letterM = report.formalAssessments.individualLetterMatrix.find(row => row.letter === "m");
  assert.equal(wholeChildByConcept.get("alphabet_knowledge::letter_name::m::uppercase"), "secure");
  assert.equal(wholeChildByConcept.get("alphabet_knowledge::letter_sound::m::lowercase"), "needs_teaching");
  assert.equal(letterM.uppercaseName.status, "mastered");
  assert.equal(letterM.lowercaseSound.status, "needs_support");
  assert.equal(letterM.uppercaseName.reconciledFromSkillSpine, true);
  assert.equal(letterM.uppercaseName.details[0].sourceLabel, "Skills Check");
  assert.equal(report.evidenceSourceReads.find(row => row.store === "assessment_attempts").lastSyncedAt, syncedAt);
  assert.equal(report.evidenceSourceReads.find(row => row.store === "assessment_attempts").recordCount, 1);

  const workbook = await createStudentElAssessmentWorkbook(report);
  assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), EL_STUDENT_REPORT_SHEETS);
  const letterRows = worksheetRows(workbook.getWorksheet("Letter Names & Sounds"));
  const exportedM = letterRows.find(row => row["Letter pair"] === "M/m");
  assert.equal(exportedM["Uppercase name result"], "Mastered");
  assert.equal(exportedM["Lowercase sound result"], "Needs Support");
  assert.match(exportedM["Uppercase name evidence provenance"], /Source: Skills Check/);
  const summaryText = workbook.getWorksheet("Student Summary").getColumn(2).values.join(" ");
  assert.match(summaryText, /assessment_attempts: 1 row/);
  assert.match(summaryText, /2026-07-23 19:06/);
});

test("D-002: zero saved EL evidence enters an explicit warning path", () => {
  const blocked = getStudentElExportEntryDecision({
    scope: {},
    savedElAssessmentCount: 0,
    studentName: "Aaron"
  });
  assert.equal(blocked.action, "block");
  assert.match(blocked.message, /Choose a grade and assessment window/);

  const warned = getStudentElExportEntryDecision({
    scope: explicitScope,
    savedElAssessmentCount: 0,
    studentName: "Aaron"
  });
  assert.equal(warned.action, "warn");
  assert.equal(warned.emptyReport, true);
  assert.match(warned.message, /Nothing to report for Aaron/);
  assert.match(warned.message, /no saved EL evidence/);

  const ready = getStudentElExportEntryDecision({
    scope: explicitScope,
    savedElAssessmentCount: 1,
    studentName: "Aaron"
  });
  assert.equal(ready.action, "export");
  assert.equal(ready.emptyReport, false);

  const reconciled = getStudentElExportEntryDecision({
    scope: explicitScope,
    savedElAssessmentCount: 0,
    reconciledEvidenceCount: 4,
    studentName: "Aaron"
  });
  assert.equal(reconciled.action, "warn");
  assert.equal(reconciled.emptyReport, false);
});

test("D-002: empty workbook has one banner, no filler sheets, and a clean filename", async () => {
  const report = buildStudentElAssessmentExportReport({
    assessmentHistory: [],
    students: [student],
    classes,
    studentId: student.id,
    classId: student.classId,
    benchmarkScope: explicitScope,
    evidenceReadState: {
      completedAt: syncedAt,
      syncStatus: "complete"
    }
  });
  assert.equal(hasResolvedElExportScope(report), true);
  assert.equal(getStudentElReportEvidenceCount(report), 0);
  assert.doesNotMatch(report.fileName, /not[-_\s]*recorded/i);

  const workbook = await createStudentElAssessmentWorkbook(report);
  assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), EL_EMPTY_STUDENT_REPORT_SHEETS);
  const summaryRows = worksheetRows(workbook.getWorksheet("Student Summary"));
  assert.equal(summaryRows[0].Field, "Nothing to report");
  assert.match(summaryRows[0].Value, /no saved EL or reconciled Skills Check evidence/i);
  assert.equal(summaryRows.filter(row => row.Field === "Nothing to report").length, 1);
  assert.equal(workbook.getWorksheet("Letter Names & Sounds"), undefined);
  assert.equal(workbook.getWorksheet("Advanced Phonics Patterns"), undefined);
  assert.doesNotMatch(JSON.stringify(summaryRows), /Not assessed ×|0 attempts|No saved evidence|0\/6/i);
});

test("D-002: unresolved report filenames use a neutral scope-required token", () => {
  const report = buildStudentElAssessmentExportReport({
    assessmentHistory: [],
    students: [student],
    classes,
    studentId: student.id,
    classId: student.classId
  });
  assert.equal(hasResolvedElExportScope(report), false);
  assert.match(report.fileName, /scope-required/);
  assert.doesNotMatch(report.fileName, /not[-_\s]*recorded/i);
});
