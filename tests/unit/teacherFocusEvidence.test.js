import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTeacherStudentRows,
  rosterMatchesStatusFilter,
  soundSeekersPracticeSummary
} from "../../src/components/teacher/teacherClassModel.js";
import {
  buildTeacherFocusPracticeRecommendation,
  buildTeacherTodayBriefing
} from "../../src/utils/teacherTodayBriefing.js";
import { buildClassAccuracySummary } from "../../src/utils/teacherProgressOverview.js";
import { buildClassReportModel } from "../../src/data/reportingSystem.js";

const now = new Date("2026-09-30T08:00:00.000Z");
const observedAt = "2026-09-29T08:00:00.000Z";
const student = { id: "learner", name: "Learner", class_id: "class-1" };
const dashboard = {
  id: student.id,
  answered: 28,
  correct: 12,
  accuracy: 43,
  currentAnswered: 28,
  currentCorrect: 12,
  currentAccuracy: 43,
  currentSkill: "Initial Sounds",
  currentEvidenceSkills: ["Initial Sounds"],
  currentLastActive: observedAt,
  lastActive: observedAt,
  evidenceReadStatus: "complete",
  focusEvidence: { skill: "Initial Sounds", answered: 28, accuracy: 43, lastActive: observedAt }
};

function teacherRow(changes = {}) {
  return buildTeacherStudentRows({
    studentList: [student],
    classDashboard: [{ ...dashboard, ...changes }],
    now
  })[0];
}

test("one ready skill agrees on Today and the roster without becoming a whole-learner judgement", () => {
  const row = teacherRow();
  const briefing = buildTeacherTodayBriefing([row], { now });
  assert.equal(row.focusLearningConclusion.status.label, "Needs support");
  assert.equal(row.focusLearningConclusion.accuracy, 43);
  assert.equal(row.focusLearningConclusion.scope, "skill");
  assert.equal(rosterMatchesStatusFilter(row, "needs-attention"), true);
  assert.equal(briefing.attention[0].id, row.id);
  assert.equal(briefing.attention[0].focus, row.currentSkill);
  assert.equal(row.learningConclusion.ready, false);
  assert.equal(row.learningConclusion.status.label, "Not enough results");
  assert.equal(row.learningConclusion.scope, "general");
  const accuracy = buildClassAccuracySummary([{ ...row, conclusion: row.learningConclusion }]);
  assert.equal(accuracy.policyReadyLearnerCount, 0);
  assert.equal(accuracy.headlineAccuracy, null);

  const report = buildClassReportModel({
    students: [student],
    classes: [{ id: "class-1", name: "Class" }],
    classId: "class-1",
    assessmentHistory: [{
      attemptId: "sitting",
      studentId: student.id,
      classId: "class-1",
      assessmentType: "skill_checkpoint",
      skillId: "initial_sounds",
      skillName: "Initial Sounds",
      administrationStatus: "completed",
      completedAt: observedAt,
      totalQuestions: 28,
      correctCount: 12,
      questionRecords: Array.from({ length: 28 }, (_, index) => ({
        questionId: `question-${index}`,
        itemType: "initial_sound",
        itemKey: "m",
        formatType: "INITIAL_SOUND",
        responseStatus: index < 12 ? "correct" : "incorrect",
        timestamp: observedAt
      }))
    }],
    now
  });
  assert.equal(report.studentRows[0].status.label, "Not enough results");
  assert.deepEqual(report.studentRows[0].supportSkills, ["Initial Sounds"]);
  assert.equal(report.snapshot.policyReadyStudents, 0);
  assert.equal(report.snapshot.needsSupport, 0);
});

test("sparse, stale, misaligned and unread focus evidence never create a focused support group", () => {
  const rows = [
    teacherRow({ focusEvidence: { ...dashboard.focusEvidence, answered: 9 } }),
    teacherRow({ focusEvidence: { ...dashboard.focusEvidence, lastActive: "2026-01-01" } }),
    teacherRow({ focusEvidence: { ...dashboard.focusEvidence, skill: "Final Sounds" } }),
    teacherRow({ evidenceReadStatus: "partial" })
  ];
  for (const row of rows) {
    assert.equal(row.focusLearningConclusion.ready, false);
    assert.equal(rosterMatchesStatusFilter(row, "needs-attention"), false);
    assert.equal(buildTeacherTodayBriefing([row], { now }).attention.length, 0);
  }
});

test("the practice shortcut preserves the named learner/skill and leaves assessment saving separate", () => {
  const attention = buildTeacherTodayBriefing([teacherRow()], { now }).attention[0];
  const seed = buildTeacherFocusPracticeRecommendation(attention);
  assert.deepEqual(seed.studentIds, [student.id]);
  assert.equal(seed.focus, "Initial Sounds");
  assert.match(seed.activity, /Model Initial Sounds/);
  assert.match(seed.activity, /separately from the next Skills check/);
  assert.equal(buildTeacherFocusPracticeRecommendation({ ...attention, focus: "Review recent results" }), null);
});

test("current Sound Seekers participation is labelled practice with catalog totals, ahead of earlier trails", () => {
  assert.deepEqual(soundSeekersPracticeSummary({
    stopsCompleted: 40,
    woodland: { projectsCompleted: 2, totalProjects: 5, attempts: 14, lastActiveAt: observedAt }
  }), { label: "Woodland practice", progress: "2 of 5 projects", responses: 14, lastActiveAt: observedAt });
  assert.equal(soundSeekersPracticeSummary({
    campaign: { stagesCompleted: 3, totalStages: 30, missionsCompleted: 15, totalMissions: 150, attempts: 45 }
  }).progress, "3 of 30 stages · 15 of 150 missions");
  assert.equal(soundSeekersPracticeSummary({ campaign: { lastActiveAt: observedAt } }).lastActivityLabel,
    "Last reported practice answer");
  assert.equal(soundSeekersPracticeSummary({ campaign: { stagesCompleted: 3, missionsCompleted: 15 } }).progress,
    "3 stages completed · 15 missions completed");
  assert.equal(soundSeekersPracticeSummary({ stopsCompleted: 40 }), null);
});
