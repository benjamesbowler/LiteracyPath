import assert from "node:assert/strict";
import test from "node:test";
import {
  activityIsAtLeastDaysOld,
  buildTeacherStudentRows,
  formatLastActive
} from "../../src/components/teacher/teacherClassModel.js";

test("quiet-student checks use real elapsed time rather than the display label", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");

  assert.equal(activityIsAtLeastDaysOld("2026-07-26T12:00:00.000Z", 7, now), false);
  assert.equal(activityIsAtLeastDaysOld("2026-07-20T12:00:00.000Z", 7, now), true);
  assert.equal(activityIsAtLeastDaysOld("2026-06-01T12:00:00.000Z", 7, now), true);
  assert.equal(activityIsAtLeastDaysOld("not-a-date", 7, now), false);
});

test("a student without a completed dashboard read stays unknown", () => {
  const [row] = buildTeacherStudentRows({
    studentList: [{
      id: "new-student",
      name: "New Student",
      created_at: "2026-07-27T09:00:00.000Z",
      updated_at: "2026-07-27T09:00:00.000Z"
    }],
    classDashboard: []
  });

  assert.equal(row.lastActive, null);
  assert.equal(formatLastActive(row.lastActive), "No activity yet");
  assert.equal(row.evidenceReadStatus, "incomplete");
  assert.deepEqual(row.evidenceMissingSources, ["dashboard"]);
  assert.equal(row.learningConclusion.ready, false);
  assert.equal(row.learningConclusion.status.label, "Not enough results");
  assert.match(row.learningConclusion.reason, /could not be loaded/);
});

test("a genuine new student is Not checked only after a complete zero-result read", () => {
  const [row] = buildTeacherStudentRows({
    studentList: [{
      id: "new-student",
      name: "New Student"
    }],
    classDashboard: [{
      id: "new-student",
      answered: 0,
      correct: 0,
      accuracy: 0,
      evidenceSkills: [],
      currentAnswered: 0,
      currentCorrect: 0,
      currentAccuracy: null,
      currentEvidenceSkills: [],
      currentLastActive: null,
      currentSkill: "Initial Sounds",
      evidenceReadStatus: "complete"
    }]
  });

  assert.equal(row.evidenceReadStatus, "complete");
  assert.equal(row.learningConclusion.ready, false);
  assert.equal(row.learningConclusion.status.label, "Not checked");
});

test("renaming a student cannot replace the latest real learning activity", () => {
  const [row] = buildTeacherStudentRows({
    studentList: [{
      id: "renamed-student",
      name: "Corrected Name",
      created_at: "2026-07-01T09:00:00.000Z",
      updated_at: "2026-07-27T09:00:00.000Z"
    }],
    classDashboard: [{
      id: "renamed-student",
      answered: 12,
      accuracy: 75,
      evidenceSkills: ["Initial Sounds"],
      currentSkill: "Initial Sounds",
      lastActive: "2026-07-20T09:00:00.000Z"
    }]
  });

  assert.equal(row.lastActive, "2026-07-20T09:00:00.000Z");
  assert.notEqual(row.lastActive, "2026-07-27T09:00:00.000Z");
});

test("current conclusions use the 90-day summary while lifetime activity stays visible", () => {
  const [row] = buildTeacherStudentRows({
    studentList: [{ id: "student", name: "Student" }],
    classDashboard: [{
      id: "student",
      answered: 30,
      correct: 29,
      accuracy: 97,
      evidenceSkills: ["Initial Sounds", "Final Sounds", "CVC Words"],
      lastActive: "2026-07-20T09:00:00.000Z",
      currentAnswered: 8,
      currentCorrect: 2,
      currentAccuracy: 25,
      currentEvidenceSkills: ["CVC Words"],
      currentLastActive: "2026-07-20T09:00:00.000Z",
      currentSkill: "CVC Words",
      evidenceReadStatus: "complete"
    }]
  });

  assert.equal(row.answered, 30);
  assert.equal(row.accuracy, 97);
  assert.equal(row.learningConclusion.attempts, 8);
  assert.equal(row.learningConclusion.accuracy, 25);
  assert.equal(row.learningConclusion.status.label, "Not enough results");
  assert.match(row.learningConclusion.reason, /required skills/i);
});

test("an incomplete dashboard read cannot become a learning conclusion", () => {
  const [row] = buildTeacherStudentRows({
    studentList: [{ id: "partial-student", name: "Partial Student" }],
    classDashboard: [{
      id: "partial-student",
      answered: 20,
      accuracy: 20,
      evidenceSkills: ["Initial Sounds"],
      currentSkill: "Initial Sounds",
      lastActive: new Date().toISOString(),
      evidenceReadStatus: "partial",
      evidenceMissingSources: ["answers"]
    }]
  });

  assert.equal(row.evidenceReadStatus, "partial");
  assert.deepEqual(row.evidenceMissingSources, ["answers"]);
  assert.equal(row.learningConclusion.ready, false);
  assert.equal(row.learningConclusion.status.label, "Not enough results");
  assert.match(row.learningConclusion.reason, /could not be loaded/);
});
