import assert from "node:assert/strict";
import test from "node:test";
import {
  attachInstructionalGroupReviews,
  buildInstructionalGroupComparison,
  buildInstructionalGroupMovement,
  buildInstructionalGroupSnapshot,
  criterionFromSuggestion
} from "../../src/utils/teacherInstructionalGroups.js";

const rows = [
  {
    id: "aisha",
    name: "Aisha",
    answered: 20,
    accuracy: 30,
    evidenceSkills: ["Initial Sounds", "Final Sounds"],
    evidence: {
      ready: true,
      attempts: 20,
      recency: "2026-07-23T09:00:00.000Z",
      support: { recorded: 12, supported: 2 }
    }
  },
  {
    id: "camila",
    name: "Camila",
    answered: 12,
    accuracy: 75,
    evidenceSkills: ["Initial Sounds", "CVC Short Vowels"],
    evidence: {
      ready: true,
      attempts: 12,
      recency: "2026-07-22T09:00:00.000Z",
      support: { recorded: 8, supported: 0 }
    }
  },
  {
    id: "aarav",
    name: "Aarav",
    answered: 4,
    accuracy: 100,
    evidenceSkills: ["CVC Short Vowels"],
    evidence: {
      ready: false,
      attempts: 4,
      recency: "2026-07-21T09:00:00.000Z",
      support: { recorded: 0, supported: 0 }
    }
  }
];

const suggestion = {
  id: "sound:m",
  label: "m re-teaching",
  basis: "Shared Sound Seekers re-teaching evidence",
  learners: [
    { id: "aisha", name: "Aisha" },
    { id: "camila", name: "Camila" }
  ]
};

function savedGroup({
  id = "group-1",
  sourceId = "sound:m",
  studentIds = ["aisha", "aarav"],
  evidenceSnapshot = {
    schemaVersion: 1,
    capturedAt: "2026-07-20T09:00:00.000Z",
    memberCount: 2,
    policyReadyMembers: 1,
    attempts: 24,
    skillDiversity: 3,
    latestEvidenceAt: "2026-07-20T09:00:00.000Z",
    averageAccuracy: 65,
    supportRecorded: 12,
    supportUsed: 2
  }
} = {}) {
  return {
    id,
    name: `Saved ${id}`,
    criteria: {
      sourceId,
      kind: "shared-exact-reteaching-evidence",
      label: "m re-teaching",
      basis: "Shared Sound Seekers re-teaching evidence",
      policy: "Three independent attempts."
    },
    reviews: [{
      id: `${id}-review`,
      student_ids: studentIds,
      evidence_snapshot: evidenceSnapshot,
      reviewed_at: "2026-07-20T09:00:00.000Z"
    }]
  };
}

test("saved criteria preserve the exact transparent source and policy", () => {
  assert.deepEqual(criterionFromSuggestion(suggestion), {
    schemaVersion: 1,
    sourceId: "sound:m",
    kind: "shared-exact-reteaching-evidence",
    label: "m re-teaching",
    basis: "Shared Sound Seekers re-teaching evidence",
    policy: "These students recently needed the same item taught again."
  });
  assert.equal(criterionFromSuggestion({ id: "", label: "", basis: "" }), null);
});

test("group comparison uses immutable captured evidence and policy-ready denominators", () => {
  const snapshot = buildInstructionalGroupSnapshot(
    rows,
    ["aisha", "camila", "aarav"],
    "2026-07-23T10:00:00.000Z"
  );
  assert.deepEqual(snapshot, {
    schemaVersion: 1,
    capturedAt: "2026-07-23T10:00:00.000Z",
    memberCount: 3,
    policyReadyMembers: 2,
    attempts: 36,
    skillDiversity: 3,
    latestEvidenceAt: "2026-07-23T09:00:00.000Z",
    averageAccuracy: 52.5,
    supportRecorded: 20,
    supportUsed: 2
  });

  const comparison = buildInstructionalGroupComparison([
    savedGroup({
      id: "one",
      studentIds: ["aisha", "camila"],
      evidenceSnapshot: snapshot
    }),
    savedGroup({
      id: "two",
      studentIds: ["aarav"],
      evidenceSnapshot: {
        ...snapshot,
        memberCount: 1,
        policyReadyMembers: 0,
        attempts: 4,
        skillDiversity: 1,
        averageAccuracy: null,
        supportRecorded: 0,
        supportUsed: 0
      }
    })
  ]);
  assert.deepEqual(comparison.map(group => group.snapshot.memberCount), [3, 1]);
  assert.equal(comparison[0].snapshot.averageAccuracy, 52.5);
  assert.equal(comparison[1].snapshot.averageAccuracy, null);
});

test("missing captured comparison evidence stays unavailable instead of becoming current or zero", () => {
  const comparison = buildInstructionalGroupComparison([
    savedGroup({ evidenceSnapshot: null })
  ]);
  assert.equal(comparison[0].snapshot, null);
});

test("movement reports stayed, joined, and left alphabetically without a public rank", () => {
  const movement = buildInstructionalGroupMovement(savedGroup(), [suggestion], rows);
  assert.equal(movement.criterionAvailable, true);
  assert.deepEqual(movement.stayed.map(row => row.name), ["Aisha"]);
  assert.deepEqual(movement.joined.map(row => row.name), ["Camila"]);
  assert.deepEqual(movement.left.map(row => row.name), ["Aarav"]);
  assert.deepEqual(movement.currentIds, ["aisha", "camila"]);
});

test("missing current criteria preserve the last review instead of inventing movement", () => {
  const movement = buildInstructionalGroupMovement(
    savedGroup({ sourceId: "focus:retired" }),
    [suggestion],
    rows
  );
  assert.equal(movement.criterionAvailable, false);
  assert.deepEqual(movement.currentIds, ["aisha", "aarav"]);
  assert.deepEqual(movement.joined, []);
  assert.deepEqual(movement.left, []);
});

test("review attachment orders immutable snapshots newest first", () => {
  const groups = attachInstructionalGroupReviews(
    [{ id: "group-1" }],
    [
      { id: "older", group_id: "group-1", reviewed_at: "2026-07-20T09:00:00.000Z" },
      { id: "newer", group_id: "group-1", reviewed_at: "2026-07-22T09:00:00.000Z" }
    ]
  );
  assert.deepEqual(groups[0].reviews.map(review => review.id), ["newer", "older"]);
});
