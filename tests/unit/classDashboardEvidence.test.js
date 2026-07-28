import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCurrentSkillEvidence,
  buildIncompleteClassDashboardRows,
  countFirstSecureTransitions,
  currentAnswerEvidence,
  firstSecureTransitionsBySkill,
  incompleteClassDashboardSources,
  verifiedSecureSkillIds
} from "../../src/appState/classDashboardEvidence.js";

test("every failed or truncated required source makes the class evidence incomplete", () => {
  const sourceNames = [
    "answers",
    "mastery",
    "assessmentAttempts",
    "soundSeekers",
    "profiles"
  ];

  sourceNames.forEach(source => {
    const errorResults = Object.fromEntries(
      sourceNames.map(name => [name, name === source ? { error: new Error("read failed") } : {}])
    );
    assert.deepEqual(incompleteClassDashboardSources(errorResults), [source]);

    const truncatedResults = Object.fromEntries(
      sourceNames.map(name => [name, name === source ? { truncated: true } : {}])
    );
    assert.deepEqual(incompleteClassDashboardSources(truncatedResults), [source]);
  });
});

test("an incomplete refresh preserves earlier figures and never invents zeros for a new student", () => {
  const rows = buildIncompleteClassDashboardRows(
    [
      { id: "known", name: "Renamed" },
      { id: "new", name: "New learner" }
    ],
    [{
      id: "known",
      name: "Old name",
      answered: 12,
      accuracy: 75,
      currentSkill: "Initial Sounds",
      evidenceReadStatus: "complete"
    }],
    ["answers"]
  );

  assert.deepEqual(rows[0], {
    id: "known",
    name: "Renamed",
    answered: 12,
    accuracy: 75,
    currentSkill: "Initial Sounds",
    evidenceReadStatus: "incomplete",
    evidenceMissingSources: ["answers"]
  });
  assert.deepEqual(rows[1], {
    id: "new",
    name: "New learner",
    evidenceReadStatus: "incomplete",
    evidenceMissingSources: ["answers"]
  });
  assert.equal("answered" in rows[1], false);
  assert.equal("accuracy" in rows[1], false);
});

test("only a skill's first secure transition counts as newly secured", () => {
  const rows = [
    {
      skill_id: "initial_sounds",
      mastered: true,
      updated_at: "2026-07-01T09:00:00.000Z"
    },
    {
      skill_id: "initial_sounds",
      mastered: true,
      updated_at: "2026-07-25T09:00:00.000Z"
    },
    {
      skill_id: "final_sounds",
      mastered: false,
      updated_at: "2026-07-10T09:00:00.000Z"
    },
    {
      skill_id: "final_sounds",
      mastered: true,
      updated_at: "2026-07-25T10:00:00.000Z"
    },
    {
      skill_id: "final_sounds",
      mastered: true,
      updated_at: "2026-07-26T10:00:00.000Z"
    }
  ];
  const recentStart = new Date("2026-07-20T00:00:00.000Z").getTime();
  const recentEnd = new Date("2026-07-27T00:00:00.000Z").getTime();

  const transitions = firstSecureTransitionsBySkill(rows);
  assert.equal(
    transitions.get("initial_sounds"),
    new Date("2026-07-01T09:00:00.000Z").getTime()
  );
  assert.equal(
    transitions.get("final_sounds"),
    new Date("2026-07-25T10:00:00.000Z").getTime()
  );
  assert.equal(countFirstSecureTransitions(rows, recentStart, recentEnd), 1);
});

test("secure-transition windows use distinct skills and exclude missing dates", () => {
  const rows = [
    { skill_id: "one", mastered: true, updated_at: "2026-07-12T10:00:00.000Z" },
    { skill_id: "one", mastered: true, updated_at: "2026-07-13T10:00:00.000Z" },
    { skill_id: "two", mastered: true, updated_at: "2026-07-19T10:00:00.000Z" },
    { skill_id: "three", mastered: true, updated_at: null },
    { skill_id: "four", mastered: false, updated_at: "2026-07-18T10:00:00.000Z" }
  ];

  assert.equal(
    countFirstSecureTransitions(
      rows,
      new Date("2026-07-10T00:00:00.000Z").getTime(),
      new Date("2026-07-17T00:00:00.000Z").getTime()
    ),
    1
  );
  assert.equal(
    countFirstSecureTransitions(
      rows,
      new Date("2026-07-17T00:00:00.000Z").getTime(),
      new Date("2026-07-24T00:00:00.000Z").getTime()
    ),
    1
  );
});

test("current-skill evidence contains only answers for that exact focus", () => {
  const evidence = buildCurrentSkillEvidence([
    {
      skill: "Initial Sounds",
      is_correct: false,
      answered_at: "2026-07-20T09:00:00.000Z"
    },
    {
      skill: "CVC Words",
      is_correct: true,
      answered_at: "2026-07-21T09:00:00.000Z"
    },
    {
      skill: "cvc_words",
      is_correct: false,
      answered_at: "2026-07-22T09:00:00.000Z"
    },
    {
      skill: "CVC Words",
      is_correct: true,
      answered_at: "2026-07-23T09:00:00.000Z"
    }
  ], {
    id: "cvc_words",
    label: "CVC Words"
  }, {
    now: new Date("2026-07-27T00:00:00.000Z")
  });

  assert.deepEqual(evidence, {
    skill: "CVC Words",
    answered: 3,
    correct: 2,
    accuracy: 67,
    lastActive: "2026-07-23T09:00:00.000Z"
  });
});

test("current conclusions exclude answers older than the canonical 90-day window", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");
  const evidence = currentAnswerEvidence([
    {
      skill: "Initial Sounds",
      is_correct: true,
      answered_at: "2026-01-01T09:00:00.000Z"
    },
    {
      skill: "Final Sounds",
      is_correct: false,
      answered_at: "2026-07-20T09:00:00.000Z"
    },
    {
      skill: "Final Sounds",
      is_correct: true,
      answered_at: "2026-07-21T09:00:00.000Z"
    }
  ], { now });

  assert.equal(evidence.answered, 2);
  assert.equal(evidence.correct, 1);
  assert.equal(evidence.accuracy, 50);
  assert.deepEqual(evidence.evidenceSkills, ["Final Sounds"]);
  assert.equal(evidence.lastActive, "2026-07-21T09:00:00.000Z");
});

test("current-skill evidence cannot reuse a stale lifetime success", () => {
  assert.deepEqual(
    buildCurrentSkillEvidence([
      {
        skill: "CVC Words",
        is_correct: true,
        answered_at: "2026-01-01T09:00:00.000Z"
      }
    ], {
      id: "cvc_words",
      label: "CVC Words"
    }, {
      now: new Date("2026-07-27T00:00:00.000Z")
    }),
    {
      skill: "CVC Words",
      answered: 0,
      correct: 0,
      accuracy: null,
      lastActive: null
    }
  );
});

test("an unseen current skill stays honest instead of becoming zero-percent evidence", () => {
  assert.deepEqual(
    buildCurrentSkillEvidence([], { id: "cvc_words", label: "CVC Words" }),
    {
      skill: "CVC Words",
      answered: 0,
      correct: 0,
      accuracy: null,
      lastActive: null
    }
  );
  assert.equal(buildCurrentSkillEvidence([], null), null);
});

test("a same-sitting mastery fallback cannot enter roster or class Secure counts", () => {
  const masteryRows = [{
    student_id: "student-1",
    skill_id: "initial_sounds",
    mastered: true,
    attempts: 4,
    updated_at: "2026-07-27T09:00:00.000Z"
  }];
  const oneSitting = [{
    attempt_id: "attempt-one",
    student_id: "student-1",
    skill_id: "initial_sounds",
    completed_at: "2026-07-27T09:00:00.000Z",
    total_questions: 12,
    correct_count: 12,
    administration_status: "completed"
  }];

  assert.deepEqual(
    [...verifiedSecureSkillIds(
      masteryRows,
      oneSitting,
      "student-1",
      { now: new Date("2026-07-28T00:00:00.000Z") }
    )],
    [],
    "four repeated observations in one immutable sitting are still one sitting"
  );

  const threeSittings = [1, 2, 3].map(index => ({
    ...oneSitting[0],
    attempt_id: `attempt-${index}`,
    completed_at: `2026-07-2${index}T09:00:00.000Z`
  }));
  assert.deepEqual(
    [...verifiedSecureSkillIds(
      masteryRows,
      threeSittings,
      "student-1",
      { now: new Date("2026-07-28T00:00:00.000Z") }
    )],
    ["initial_sounds"]
  );
});
