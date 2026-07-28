import test from "node:test";
import assert from "node:assert/strict";

import {
  buildClassReportModel,
  buildStudentReportModel,
  normalizeItemMasteryRows
} from "../../src/data/reportingSystem.js";

const benchmarkOnlyAttempt = {
  attemptId: "encoding-only",
  studentId: "student-1",
  studentName: "Ada",
  classId: "class-1",
  assessmentType: "el_encoding",
  skillId: "el_encoding",
  skillName: "EL Encoding",
  administrationStatus: "completed",
  completedAt: "2026-07-21T03:00:00.000Z",
  totalQuestions: 8,
  correctCount: 0,
  questionRecords: Array.from({ length: 8 }, (_, index) => ({
    questionId: `encoding-${index + 1}`,
    itemKey: `word-${index + 1}`,
    itemType: "encoding_feature",
    responseStatus: "incorrect",
    isCorrect: false
  }))
};

test("descriptive benchmark evidence is excluded from the legacy student mastery model", () => {
  const itemRows = normalizeItemMasteryRows({
    accidentalBenchmarkRow: {
      skillId: "el_encoding",
      itemType: "encoding_feature",
      itemKey: "ship",
      attempts: 1,
      correct: 0
    }
  }, [benchmarkOnlyAttempt]);
  assert.deepEqual(itemRows, []);

  const report = buildStudentReportModel({
    studentName: "Ada",
    assessmentHistory: [benchmarkOnlyAttempt]
  });
  assert.equal(report.snapshot.totalAnswered, 0);
  assert.equal(report.snapshot.accuracy, null);
  assert.equal(report.snapshot.currentEvidenceReady, false);
  assert.equal(report.snapshot.status.id, "not_started");
  assert.deepEqual(report.progressPoints, []);
  assert.deepEqual(report.weeklyAccuracy, []);
  assert.deepEqual(report.itemGroups, {
    mastered: [],
    developing: [],
    needsSupport: [],
    notEnoughEvidence: [],
    notAssessed: []
  });
});

test("descriptive benchmark evidence is excluded from legacy class thresholds and groups", () => {
  const report = buildClassReportModel({
    students: [{ id: "student-1", name: "Ada", class_id: "class-1" }],
    classes: [{ id: "class-1", name: "Class One" }],
    assessmentHistory: [benchmarkOnlyAttempt],
    classId: "class-1",
    teacherName: "Teacher"
  });

  assert.equal(report.snapshot.assessedStudents, 0);
  assert.equal(report.snapshot.attempts, 0);
  assert.equal(report.snapshot.averageAccuracy, null);
  assert.equal(report.snapshot.averageAccuracyReady, false);
  assert.equal(report.snapshot.needsSupport, 0);
  assert.equal(report.snapshot.totalSkillsAssessed, 0);
  assert.deepEqual(report.heatmap, []);
  assert.deepEqual(report.masteryRows, []);
  assert.deepEqual(report.focusRows, []);
  assert.deepEqual(report.weakItems, []);
  assert.deepEqual(report.groups, []);
  assert.equal(report.studentRows[0].attempts, 0);
  assert.equal(report.studentRows[0].status.id, "not_started");
});
