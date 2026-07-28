import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTeacherTodayBriefing,
  TEACHER_TODAY_POLICY
} from "../../src/utils/teacherTodayBriefing.js";

test("Today attention requires enough results and states the rule in plain language", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");
  const briefing = buildTeacherTodayBriefing([
    {
      id: "sparse",
      name: "Sparse",
      answered: 1,
      accuracy: 0,
      lastActive: "2026-07-26T12:00:00.000Z"
    },
    {
      id: "ready",
      name: "Ready",
      answered: 20,
      accuracy: 35,
      currentSkill: "CVC",
      lastActive: "2026-07-26T12:00:00.000Z",
      focusEvidence: {
        skill: "CVC",
        answered: 12,
        accuracy: 33,
        lastActive: "2026-07-26T12:00:00.000Z"
      }
    },
    {
      id: "secure",
      name: "Secure",
      answered: 20,
      accuracy: 90,
      lastActive: "2026-07-26T12:00:00.000Z"
    }
  ], { now });

  assert.deepEqual(briefing.attention.map(row => row.id), ["ready"]);
  assert.match(briefing.attention[0].evidence, /12 answers on CVC · 33% accuracy/);
  assert.match(briefing.attention[0].policyBasis, /after 8 current answers/);
  assert.deepEqual(
    Object.keys(briefing.attention[0].explanation),
    ["evidence", "dependency", "confidence", "unlock"]
  );
  assert.equal(briefing.insufficientEvidenceCount, 1);
});

test("Today never turns stale evidence into a needs-attention claim", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");
  const briefing = buildTeacherTodayBriefing([{
    id: "stale",
    name: "Stale",
    answered: 20,
    accuracy: 30,
    currentSkill: "CVC",
    lastActive: "2026-03-01T12:00:00.000Z",
    focusEvidence: {
      skill: "CVC",
      answered: 20,
      accuracy: 30,
      lastActive: "2026-03-01T12:00:00.000Z"
    }
  }], { now });

  assert.equal(briefing.attention.length, 0);
  assert.deepEqual(briefing.due.map(row => row.id), ["stale"]);
});

test("Today does not blame the current skill for low answers recorded elsewhere", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");
  const briefing = buildTeacherTodayBriefing([{
    id: "mixed",
    name: "Mixed",
    answered: 20,
    accuracy: 35,
    evidenceSkills: ["Initial Sounds", "Final Sounds"],
    currentSkill: "CVC",
    lastActive: "2026-07-26T12:00:00.000Z",
    focusEvidence: {
      skill: "Initial Sounds",
      answered: 12,
      accuracy: 25,
      lastActive: "2026-07-26T12:00:00.000Z"
    }
  }], { now });

  assert.equal(briefing.attention.length, 1);
  assert.equal(briefing.attention[0].focus, "Review recent results");
  assert.doesNotMatch(briefing.attention[0].evidence, /on CVC/);
  assert.doesNotMatch(briefing.attention[0].explanation.dependency, /Review CVC/);
});

test("Today suppresses suggestions when a required evidence source did not load", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");
  const briefing = buildTeacherTodayBriefing([{
    id: "partial",
    name: "Partial",
    answered: 20,
    accuracy: 20,
    currentSkill: "CVC",
    lastActive: "2026-07-01T12:00:00.000Z",
    evidenceReadStatus: "partial",
    focusEvidence: {
      skill: "CVC",
      answered: 20,
      accuracy: 20,
      lastActive: "2026-07-01T12:00:00.000Z"
    }
  }], { now });

  assert.equal(briefing.attention.length, 0);
  assert.equal(briefing.due.length, 0);
  assert.equal(briefing.insufficientEvidenceCount, 0);
});

test("Today due separates unstarted students from inactive students", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");
  const briefing = buildTeacherTodayBriefing([
    { id: "new", name: "New", answered: 0 },
    { id: "quiet", name: "Quiet", answered: 12, accuracy: 80, lastActive: "2026-07-13T12:00:00.000Z" },
    { id: "active", name: "Active", answered: 12, accuracy: 80, lastActive: "2026-07-22T12:00:00.000Z" }
  ], { now });

  assert.deepEqual(briefing.due.map(row => row.id), ["new", "quiet"]);
  assert.equal(briefing.due[0].title, "First assessment due");
  assert.match(briefing.due[1].evidence, /10 days/);
  briefing.due.forEach(row => {
    assert.deepEqual(
      Object.keys(row.explanation),
      ["evidence", "dependency", "confidence", "unlock"]
    );
  });
});

test("Today changes show current-window results beside the previous window", () => {
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
  assert.equal(briefing.changed[0].summary, "9 new answers · 2 newly secured skills");
  assert.equal(
    briefing.changed[0].comparison,
    `Previous ${TEACHER_TODAY_POLICY.changeWindowDays} days: 4 answers and 1 secure skill.`
  );
});

// 2026-07-26: day one used to print 25 identical "First check due" rows. The UI now
// collapses that to one line and one button, which needs a flag it can trust.
test("day one is reported as a single fact, not one row per student", () => {
  const wholeClass = Array.from({ length: 25 }, (_unused, index) => ({
    id: `student-${index}`,
    name: `Student ${index}`,
    answered: 0,
    accuracy: null,
    lastActive: null
  }));
  const dayOne = buildTeacherTodayBriefing(wholeClass);
  assert.equal(dayOne.due.length, 25);
  assert.equal(dayOne.allFirstCheckDue, true);

  // One student with saved answers means the list is no longer one single fact.
  const mixed = buildTeacherTodayBriefing([
    ...wholeClass.slice(0, 24),
    {
      id: "student-active",
      name: "Active",
      answered: 20,
      accuracy: 40,
      lastActive: new Date().toISOString()
    }
  ]);
  assert.equal(mixed.allFirstCheckDue, false);

  // A class with no students at all is not "everyone is due".
  assert.equal(buildTeacherTodayBriefing([]).allFirstCheckDue, false);
});
