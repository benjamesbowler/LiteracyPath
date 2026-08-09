import assert from "node:assert/strict";
import test from "node:test";
import {
  ROSTER_INACTIVE_DAYS,
  activityDaysAgo,
  activityIsAtLeastDaysOld,
  activityIsFromToday,
  buildStudentSkillEvidence,
  buildTeacherStudentRows,
  formatLastActive,
  rosterMatchesStatusFilter,
  summariseSkillStatuses
} from "../../src/components/teacher/teacherClassModel.js";

test("quiet-student checks use real elapsed time rather than the display label", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");

  assert.equal(activityIsAtLeastDaysOld("2026-07-26T12:00:00.000Z", 7, now), false);
  assert.equal(activityIsAtLeastDaysOld("2026-07-20T12:00:00.000Z", 7, now), true);
  assert.equal(activityIsAtLeastDaysOld("2026-06-01T12:00:00.000Z", 7, now), true);
  assert.equal(activityIsAtLeastDaysOld("not-a-date", 7, now), false);
});

// THE FAULT THIS REPLACES: the roster's inactivity filter compared the rendered
// label, and formatLastActive only says "N days ago" for the first week. A child
// last seen three weeks ago formats as a plain date, so the filter silently
// dropped exactly the quiet children Today's briefing still listed.
test("the roster's quiet-student filter catches a child the label test could not", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");
  const quietChild = {
    id: "quiet",
    name: "Quiet Child",
    symbol_password: "123",
    answered: 14,
    evidenceReadStatus: "complete",
    lastActive: "2026-06-27T09:00:00.000Z"
  };

  // The old comparison could not see this child at all.
  assert.equal(formatLastActive(quietChild.lastActive, now).includes("days ago"), false);
  // The numeric one does, from the same saved timestamp Today counts.
  assert.equal(activityDaysAgo(quietChild.lastActive, now), 30);
  assert.equal(ROSTER_INACTIVE_DAYS, 7);
  assert.equal(
    rosterMatchesStatusFilter(quietChild, "no-recent-activity", { now }),
    true
  );
  // A child seen yesterday is not quiet, and a roster row whose results did not
  // load is never claimed to be quiet either.
  assert.equal(
    rosterMatchesStatusFilter(
      { ...quietChild, lastActive: "2026-07-26T09:00:00.000Z" },
      "no-recent-activity",
      { now }
    ),
    false
  );
  assert.equal(
    rosterMatchesStatusFilter(
      { ...quietChild, evidenceReadStatus: "incomplete" },
      "no-recent-activity",
      { now }
    ),
    false
  );
});

test("played today is counted from the timestamp, not from the word Today", () => {
  // Local calendar days, so the boundary case is the same in every timezone.
  const now = new Date(2026, 6, 27, 12, 0, 0);
  const earlierToday = new Date(2026, 6, 27, 8, 0, 0).toISOString();
  const lateYesterday = new Date(2026, 6, 26, 23, 59, 0).toISOString();

  assert.equal(activityIsFromToday(earlierToday, now), true);
  assert.equal(activityIsFromToday(lateYesterday, now), false);
  assert.equal(activityIsFromToday(null, now), false);
  // The label and the filter are the same reading, so they cannot disagree.
  assert.equal(formatLastActive(earlierToday, now), "Today");
  assert.equal(formatLastActive(lateYesterday, now), "Yesterday");
});

test("per-skill rows keep accuracy and learning status separate", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");
  const rows = buildStudentSkillEvidence([
    ...Array.from({ length: 10 }, (_unused, index) => ({
      skill: "Initial Sounds",
      isCorrect: index > 0,
      answeredAt: "2026-07-26T09:00:00.000Z"
    })),
    { skill: "Rhyming", isCorrect: true, answeredAt: "2026-07-20T09:00:00.000Z" },
    { skill: "", isCorrect: true, answeredAt: "2026-07-20T09:00:00.000Z" }
  ], { now });

  assert.deepEqual(rows.map(row => row.skill), ["Initial Sounds", "Rhyming"]);
  assert.equal(rows[0].accuracy, 90);
  assert.equal(rows[0].conclusion.ready, true);
  assert.equal(rows[0].conclusion.status.label, "Secure");
  // One answer is a count, never a 100% claim.
  assert.equal(rows[1].answered, 1);
  assert.equal(rows[1].conclusion.ready, false);
  assert.equal(rows[1].conclusion.status.label, "Not enough results");
  assert.deepEqual(
    summariseSkillStatuses(rows),
    { secure: 1, developing: 0, needsSupport: 0 }
  );
  assert.deepEqual(
    summariseSkillStatuses(buildStudentSkillEvidence(undefined, { now })),
    { secure: 0, developing: 0, needsSupport: 0 }
  );
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
      currentAnswered: 10,
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
  assert.equal(row.learningConclusion.attempts, 10);
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
