import assert from "node:assert/strict";
import test from "node:test";

import {
  buildIndividualElFormalAssessmentReport
} from "../../src/data/elFormalAssessmentReportBuilder.js";
import {
  buildStudentElAssessmentReportData
} from "../../src/data/elAssessmentReportStore.js";
import {
  buildElExportProvenanceRows,
  buildStudentElAssessmentExportReport,
  createStudentElAssessmentWorkbook
} from "../../src/utils/exportElAssessmentExcel.js";

const NOW = "2026-07-27T12:00:00.000Z";
const student = { id: "student-one", name: "Aaron", classId: "class-one" };
const classes = [{ id: "class-one", name: "Class One" }];
const benchmarkScope = { grade: "K", benchmarkWindow: "BOY" };

function letterAttempt({
  attemptId = "letter-old",
  completedAt = "2026-03-01T09:00:00.000Z"
} = {}) {
  return {
    attemptId,
    assessmentType: "el_letter_assessment",
    skillId: "el_letter_assessment",
    skillName: "Letter Names and Sounds",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    administrationStatus: "completed",
    completedAt,
    totalQuestions: 3,
    correctCount: 3,
    accuracy: 100,
    questionRecords: [0, 1, 2].map(index => ({
      questionId: `uppercase-a-name-${index}`,
      itemType: "uppercase_letter_name",
      targetLetter: "A",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: new Date(new Date(completedAt).getTime() + index * 1000).toISOString()
    }))
  };
}

function advancedAttempt({
  attemptId = "advanced-current",
  completedAt = "2026-07-20T09:00:00.000Z",
  readingCount = 2,
  soundCount = 1
} = {}) {
  const reading = Array.from({ length: readingCount }, (_, index) => ({
    questionId: `ai-reading-${index}`,
    itemType: "word_reading",
    targetPattern: "ai",
    targetWord: "rain",
    responseStatus: "correct",
    isCorrect: true,
    timestamp: new Date(new Date(completedAt).getTime() + index * 1000).toISOString()
  }));
  const sound = Array.from({ length: soundCount }, (_, index) => ({
    questionId: `ai-sound-${index}`,
    itemType: "pattern_sound",
    targetPattern: "ai",
    responseStatus: "correct",
    isCorrect: true,
    timestamp: new Date(
      new Date(completedAt).getTime() + (readingCount + index) * 1000
    ).toISOString()
  }));
  return {
    attemptId,
    assessmentType: "advanced_phonics_patterns",
    skillId: "advanced_phonics_patterns",
    skillName: "Advanced Phonics Patterns",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    administrationStatus: "completed",
    completedAt,
    totalQuestions: readingCount + soundCount,
    correctCount: readingCount + soundCount,
    accuracy: 100,
    questionRecords: [...reading, ...sound]
  };
}

function oldSkillsLetterAttempts() {
  return [0, 1, 2].map(index => ({
    attemptId: `old-skills-letter-${index}`,
    assessmentType: "skill_checkpoint",
    skillId: "letter_names_and_sounds",
    skillName: "Letter names and sounds",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    administrationStatus: "completed",
    completedAt: `2026-03-0${index + 1}T09:00:00.000Z`,
    totalQuestions: 1,
    correctCount: 1,
    accuracy: 100,
    questionRecords: [{
      questionId: `old-skills-uppercase-a-${index}`,
      itemType: "letter_name",
      itemKey: "a",
      targetLetter: "A",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: `2026-03-0${index + 1}T09:00:01.000Z`
    }]
  }));
}

function worksheetRows(sheet) {
  const headers = sheet.getRow(1).values.slice(1);
  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const values = sheet.getRow(rowNumber).values.slice(1);
    rows.push(Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    ));
  }
  return rows;
}

test("old literal EL observations remain visible as Yes without being treated as longitudinal mastery", async () => {
  const assessmentHistory = [letterAttempt()];
  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory,
    now: NOW
  });
  const uppercaseName = formal.individualLetterMatrix.find(row => row.letter === "a").uppercaseName;

  assert.equal(uppercaseName.evidenceCount, 3);
  assert.equal(uppercaseName.selectedPeriodAttempts, 3);
  assert.equal(uppercaseName.staleEvidenceCount, 3);
  assert.equal(uppercaseName.attempts, 1);
  assert.equal(uppercaseName.status, "mastered");
  assert.equal(uppercaseName.statusLabel, "Yes");
  assert.ok(uppercaseName.details.every(detail => detail.withinCurrentWindow === false));

  const stored = buildStudentElAssessmentReportData({
    assessmentHistory,
    students: [student],
    classes,
    studentId: student.id,
    benchmarkScope,
    now: NOW
  });
  const skill = stored.skillRows.find(row => row.skillName === "Letter Names and Sounds");
  assert.equal(skill.masteryStatus, "Yes");
  assert.equal(skill.attempts, 1);
  assert.equal(skill.selectedPeriodAttempts, 1);
  assert.equal(stored.reportingPeriods.currentConclusions.days, 90);

  const exported = buildStudentElAssessmentExportReport({
    assessmentHistory,
    students: [student],
    classes,
    studentId: student.id,
    benchmarkScope,
    now: NOW
  });
  const exportedCell = exported.formalAssessments.individualLetterMatrix
    .find(row => row.letter === "a").uppercaseName;
  assert.equal(exportedCell.statusLabel, "Yes");

  const workbook = await createStudentElAssessmentWorkbook(exported);
  const letterRow = worksheetRows(workbook.getWorksheet("Letter Names & Sounds"))
    .find(row => row["Letter pair"] === "A/a");
  assert.equal(letterRow["Uppercase name result"], "Yes");
});

test("old reconciled Skills evidence stays separate from the literal EL observation grid", () => {
  const report = buildStudentElAssessmentExportReport({
    assessmentHistory: oldSkillsLetterAttempts(),
    students: [student],
    classes,
    studentId: student.id,
    benchmarkScope,
    now: NOW
  });
  const cell = report.formalAssessments.individualLetterMatrix
    .find(row => row.letter === "a").uppercaseName;

  assert.equal(cell.evidenceCount, 3);
  assert.equal(cell.selectedPeriodAttempts, 3);
  assert.equal(cell.currentEvidenceCount, 0);
  assert.equal(cell.staleEvidenceCount, 3);
  assert.equal(cell.attempts, 0);
  assert.equal(cell.statusLabel, "Not enough results");
  assert.ok(cell.details.every(detail => detail.withinCurrentWindow === false));
});

test("Advanced Phonics reports the latest reading and sound observations literally", async () => {
  const splitEvidence = advancedAttempt({ readingCount: 2, soundCount: 1 });
  const formal = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [splitEvidence],
    now: NOW
  });
  const ai = formal.individualAdvancedPhonicsMatrix.find(row => row.pattern === "ai");

  assert.equal(ai.attempts, 2);
  assert.equal(ai.accuracy, 100);
  assert.equal(ai.readingResult.status, "mastered");
  assert.equal(ai.soundResult.status, "mastered");
  assert.equal(ai.status, "mastered");
  assert.equal(ai.statusLabel, "Yes");

  const stored = buildStudentElAssessmentReportData({
    assessmentHistory: [splitEvidence],
    students: [student],
    classes,
    studentId: student.id,
    benchmarkScope,
    now: NOW
  });
  const advancedSkill = stored.skillRows.find(
    row => row.skillName === "Advanced Phonics Patterns"
  );
  const pattern = stored.patternDetailRows.find(row => row.pattern === "ai");
  assert.equal(advancedSkill.masteryStatus, "Yes");
  assert.equal(pattern.status, "Yes");
  assert.equal(pattern.readingStatus, "Yes");
  assert.equal(pattern.soundStatus, "Yes");

  const exported = buildStudentElAssessmentExportReport({
    assessmentHistory: [splitEvidence],
    students: [student],
    classes,
    studentId: student.id,
    benchmarkScope,
    now: NOW
  });
  const exportedPattern = exported.formalAssessments.individualAdvancedPhonicsMatrix
    .find(row => row.pattern === "ai");
  assert.equal(exportedPattern.statusLabel, "Yes");
  const workbook = await createStudentElAssessmentWorkbook(exported);
  const workbookPattern = worksheetRows(workbook.getWorksheet("Advanced Phonics Patterns"))
    .find(row => row.Pattern === "ai");
  assert.equal(workbookPattern.Status, "Yes");

  const independentlySecure = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: [advancedAttempt({
      attemptId: "advanced-both-secure",
      readingCount: 3,
      soundCount: 3
    })],
    now: NOW
  }).individualAdvancedPhonicsMatrix.find(row => row.pattern === "ai");
  assert.equal(independentlySecure.readingResult.status, "mastered");
  assert.equal(independentlySecure.soundResult.status, "mastered");
  assert.equal(independentlySecure.status, "mastered");
});

test("EL export provenance separates descriptive results from current conclusions", () => {
  const report = buildStudentElAssessmentExportReport({
    assessmentHistory: [letterAttempt()],
    students: [student],
    classes,
    studentId: student.id,
    benchmarkScope,
    now: NOW
  });
  const provenanceRows = buildElExportProvenanceRows(report, "individual");
  const filters = provenanceRows.find(row => row.field === "Filters")?.value || "";
  const definitions = provenanceRows.find(row => row.field === "Definitions")?.value || "";

  assert.match(filters, /Descriptive results included:/);
  assert.match(filters, /Beginning of year|BOY/);
  assert.match(filters, /Current status window: Latest 90 days/);
  assert.match(definitions, /latest 90 days/);
  assert.match(definitions, /benchmark period remains descriptive/);
});
