import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTeacherTodayBriefing,
  TEACHER_TODAY_POLICY
} from "../../src/utils/teacherTodayBriefing.js";

test("Today attention requires enough evidence and states the policy basis", () => {
  const briefing = buildTeacherTodayBriefing([
    { id: "sparse", name: "Sparse", answered: 1, accuracy: 0 },
    { id: "ready", name: "Ready", answered: 20, accuracy: 35, currentSkill: "CVC" },
    { id: "secure", name: "Secure", answered: 20, accuracy: 90 }
  ]);

  assert.deepEqual(briefing.attention.map(row => row.id), ["ready"]);
  assert.match(briefing.attention[0].evidence, /20 responses · 35% accuracy/);
  assert.match(briefing.attention[0].policyBasis, /at least 8 responses/);
  assert.equal(briefing.insufficientEvidenceCount, 1);
});

test("Today due separates unstarted learners from inactive learners", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");
  const briefing = buildTeacherTodayBriefing([
    { id: "new", name: "New", answered: 0 },
    { id: "quiet", name: "Quiet", answered: 12, accuracy: 80, lastActive: "2026-07-13T12:00:00.000Z" },
    { id: "active", name: "Active", answered: 12, accuracy: 80, lastActive: "2026-07-22T12:00:00.000Z" }
  ], { now });

  assert.deepEqual(briefing.due.map(row => row.id), ["new", "quiet"]);
  assert.equal(briefing.due[0].title, "First checkpoint due");
  assert.match(briefing.due[1].evidence, /10 days/);
});

test("Today changes show current-window evidence beside the prior window", () => {
  const briefing = buildTeacherTodayBriefing([
    {
      id: "moving",
      name: "Moving",
      recentAnswers: 9,
      previousAnswers: 4,
      recentMastered: 2,
      previousMastered: 1
    },
    { id: "still", name: "Still", recentAnswers: 0, recentMastered: 0 }
  ]);

  assert.deepEqual(briefing.changed.map(row => row.id), ["moving"]);
  assert.equal(briefing.changed[0].summary, "9 new responses · 2 newly secured skills");
  assert.equal(
    briefing.changed[0].comparison,
    `Prior ${TEACHER_TODAY_POLICY.changeWindowDays} days: 4 responses and 1 secured skill.`
  );
});
