import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInsightActionSnapshot,
  buildInsightPracticeTargets,
  defaultInsightPracticeTargetIds,
  insightPracticeStopIndex,
  insightResourceName,
  normalizeTeacherInsight
} from "../../src/utils/teacherInsightActions.js";

const rows = [
  {
    id: "learner-b",
    name: "Ben",
    itemEvidence: [
      { id: "s", label: "s", bucket: "almost", independentSeen: 3 },
      { id: "m", label: "m", bucket: "reteach", independentSeen: 4 }
    ],
    soundSeekers: {
      heat: [
        { id: "s", bucket: "almost", stopIndex: 3 },
        { id: "m", bucket: "reteach", stopIndex: 2 }
      ]
    }
  },
  {
    id: "learner-a",
    name: "Aisha",
    itemEvidence: [
      { id: "m", label: "m", bucket: "reteach", independentSeen: 5 },
      { id: "a", label: "a", bucket: "got-it", independentSeen: 8 }
    ],
    soundSeekers: {
      heat: [
        { id: "m", bucket: "reteach", stopIndex: 4 },
        { id: "a", bucket: "got-it", stopIndex: 5 }
      ]
    }
  }
];

const insight = {
  key: "sound:m",
  kind: "instructional-group",
  label: "m re-teaching",
  focus: "Shared exact re-teaching evidence",
  reason: "Two learners meet the exact re-teaching policy.",
  criterion: {
    type: "exact-sound-item",
    minimumIndependentAttempts: 3
  },
  evidence: {
    independentAttempts: 9,
    policyReady: true
  },
  learners: [
    { id: "learner-b", name: "Ben" },
    { id: "learner-a", name: "Aisha" },
    { id: "learner-a", name: "Duplicate must be removed" }
  ]
};

test("insight normalization preserves an exact transparent source and unique learners", () => {
  const normalized = normalizeTeacherInsight(insight);
  assert.equal(normalized.schemaVersion, 1);
  assert.deepEqual(normalized.learners, [
    { id: "learner-a", name: "Aisha" },
    { id: "learner-b", name: "Ben" }
  ]);
  assert.deepEqual(buildInsightActionSnapshot(insight), {
    schemaVersion: 1,
    key: "sound:m",
    kind: "instructional-group",
    label: "m re-teaching",
    focus: "Shared exact re-teaching evidence",
    reason: "Two learners meet the exact re-teaching policy.",
    criterion: {
      type: "exact-sound-item",
      minimumIndependentAttempts: 3
    },
    evidence: {
      independentAttempts: 9,
      policyReady: true
    }
  });
  assert.equal(normalizeTeacherInsight({ key: "", learners: [] }), null);
});

test("exact shared targets lead practice before other current needs", () => {
  const targets = buildInsightPracticeTargets(insight, rows);
  assert.deepEqual(targets.map(target => target.id), ["m", "s", "a"]);
  assert.equal(targets[0].memberCount, 2);
  assert.equal(targets[0].attempts, 9);
  assert.deepEqual(defaultInsightPracticeTargetIds(insight, rows), ["m", "s"]);
});

test("group print resources use the lowest member curriculum stop", () => {
  assert.equal(insightPracticeStopIndex(insight, rows), 3);
  assert.equal(insightResourceName(insight), "m re-teaching group");
  assert.equal(insightResourceName({
    ...insight,
    learners: [{ id: "learner-a", name: "Aisha" }]
  }), "Aisha");
});

test("missing exact evidence stays unavailable instead of inventing targets or a stop", () => {
  assert.deepEqual(buildInsightPracticeTargets(insight, []), []);
  assert.deepEqual(defaultInsightPracticeTargetIds(insight, []), []);
  assert.equal(insightPracticeStopIndex(insight, []), null);
});

test("a secure curriculum-focus insight uses current exact evidence when no weak target exists", () => {
  const secureRows = [{
    id: "learner-a",
    name: "Aisha",
    itemEvidence: [
      { id: "a", label: "a", bucket: "got-it", independentSeen: 8 }
    ],
    soundSeekers: {
      heat: [{ id: "a", bucket: "got-it", stopIndex: 5 }]
    }
  }];
  assert.deepEqual(defaultInsightPracticeTargetIds({
    key: "focus:initial-sounds",
    kind: "instructional-group",
    label: "Initial Sounds",
    focus: "Shared current curriculum focus",
    learners: [{ id: "learner-a", name: "Aisha" }]
  }, secureRows), ["a"]);
});
