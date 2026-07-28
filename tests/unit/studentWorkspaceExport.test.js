import assert from "node:assert/strict";
import test from "node:test";

import { buildStudentReportingWorkspaceModel } from "../../src/data/studentReportingWorkspaceModel.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";

const HIGH_VOLUME_COUNT = 520;
const student = {
  id: "40000000-0000-4000-8000-000000000001",
  name: "Aarav",
  classId: "30000000-0000-4000-8000-000000000001"
};

function seededHighVolumeAttempt(index) {
  const number = String(index + 1).padStart(4, "0");
  const skillId = ["final_sounds", "cvc_short_vowels", "initial_sounds"][index % 3];
  const skillName = {
    initial_sounds: "Initial Sounds",
    final_sounds: "Final Sounds",
    cvc_short_vowels: "CVC Short Vowels"
  }[skillId];
  const completedAt = new Date(Date.UTC(2026, 6, 23) - index * 86_400_000).toISOString();
  return {
    attemptId: `audit-long-history-${number}`,
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    teacherId: "10000000-0000-4000-8000-000000000001",
    assessmentType: "skill_checkpoint",
    skillId,
    skillName,
    administrationStatus: "completed",
    completedAt,
    updatedAt: completedAt,
    totalQuestions: 1,
    correctCount: 1,
    accuracy: 100,
    status: "passed",
    questionRecords: [{
      questionId: `audit-item-${index + 1}`,
      itemType: "audit_item",
      itemKey: `audit-item-${index + 1}`,
      responseStatus: "correct",
      isCorrect: true,
      timestamp: completedAt
    }]
  };
}

test("the seeded 520-item skills assessment export keeps every summary, attempt, and question row", () => {
  const assessmentHistory = Array.from(
    { length: HIGH_VOLUME_COUNT },
    (_, index) => seededHighVolumeAttempt(index)
  );
  const workspace = buildStudentReportingWorkspaceModel({
    student,
    assessmentHistory
  });

  assert.equal(workspace.skillsCheck.attempts.length, HIGH_VOLUME_COUNT);
  assert.equal(workspace.skillsCheck.items.length, HIGH_VOLUME_COUNT);

  const rows = buildStudentWorkspaceCsvRows("skills-check", workspace);
  const skillSummaries = rows.filter(row => row["Row type"] === "Skill summary");
  const itemSummaries = rows.filter(row => row["Row type"] === "Item summary");
  const attempts = rows.filter(row => row["Row type"] === "Assessment attempt");
  const questions = rows.filter(row => row["Row type"] === "Question result");

  assert.equal(skillSummaries.length, 3);
  assert.equal(itemSummaries.length, HIGH_VOLUME_COUNT);
  assert.equal(attempts.length, HIGH_VOLUME_COUNT);
  assert.equal(questions.length, HIGH_VOLUME_COUNT);
  assert.ok(skillSummaries.every(row => row.Section === "Summary"));
  assert.ok([...itemSummaries, ...attempts, ...questions].every(row => row.Section === "Result details"));
  assert.equal(attempts.length, HIGH_VOLUME_COUNT);
  assert.equal(questions.length, HIGH_VOLUME_COUNT);
  assert.ok(attempts.every(row => !Object.hasOwn(row, "Attempt ID")));
  assert.ok(questions.every(row => !Object.hasOwn(row, "Question ID")));
  assert.equal(new Set(questions.map(row => row.Question)).size, 1);
});
