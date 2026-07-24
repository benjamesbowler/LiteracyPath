import assert from "node:assert/strict";
import test from "node:test";
import {
  LEARNING_EVIDENCE_POLICY,
  LEARNING_POLICY_VERSION,
  LEARNING_STATUS_IDS,
  evaluateClassComparability,
  evaluateLearningConclusion,
  isLearningEvidenceRecent,
  meetsLearningProgressionRule,
  rawLearningStatus
} from "../../src/policy/learningPolicy.js";

const NOW = new Date("2026-07-24T12:00:00.000Z");

test("learning policy publishes one versioned threshold and evidence contract", () => {
  assert.equal(LEARNING_EVIDENCE_POLICY.version, LEARNING_POLICY_VERSION);
  assert.deepEqual(LEARNING_EVIDENCE_POLICY.accuracyPercent, {
    secureMinimum: 85,
    developingMinimum: 70,
    intensiveSupportMaximum: 50
  });
  assert.equal(LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses, 8);
  assert.equal(LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts, 3);
  assert.equal(LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays, 90);
  assert.deepEqual(LEARNING_EVIDENCE_POLICY.comparison, {
    classOutlierPercentagePoints: 15,
    classFocusProportion: 0.3,
    minimumPolicyReadyLearners: 2,
    minimumPolicyReadyProportion: 0.7,
    maximumResponseImbalanceRatio: 4
  });
});

test("accuracy bands use the canonical Secure, Developing, and Needs support vocabulary", () => {
  assert.equal(rawLearningStatus(100), LEARNING_STATUS_IDS.SECURE);
  assert.equal(rawLearningStatus(85), LEARNING_STATUS_IDS.SECURE);
  assert.equal(rawLearningStatus(84), LEARNING_STATUS_IDS.DEVELOPING);
  assert.equal(rawLearningStatus(70), LEARNING_STATUS_IDS.DEVELOPING);
  assert.equal(rawLearningStatus(69), LEARNING_STATUS_IDS.NEEDS_SUPPORT);
});

test("a perfect sparse sample cannot create an accuracy conclusion", () => {
  const conclusion = evaluateLearningConclusion({
    accuracy: 100,
    attempts: 1,
    skillDiversity: 1,
    observedAt: "2026-07-23T12:00:00.000Z",
    now: NOW
  });

  assert.equal(conclusion.ready, false);
  assert.equal(conclusion.status.id, LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  assert.equal(conclusion.status.label, "Not enough evidence");
  assert.equal(conclusion.policyVersion, LEARNING_POLICY_VERSION);
  assert.equal(conclusion.confidence.policyVersion, LEARNING_POLICY_VERSION);
});

test("reteach conclusions require sufficient, recent evidence", () => {
  const recent = evaluateLearningConclusion({
    accuracy: 45,
    attempts: 12,
    skillDiversity: 3,
    observedAt: "2026-07-23T12:00:00.000Z",
    now: NOW
  });
  const stale = evaluateLearningConclusion({
    accuracy: 45,
    attempts: 12,
    skillDiversity: 3,
    observedAt: "2026-01-01T12:00:00.000Z",
    now: NOW
  });

  assert.equal(recent.ready, true);
  assert.equal(recent.status.id, LEARNING_STATUS_IDS.NEEDS_SUPPORT);
  assert.equal(stale.ready, false);
  assert.equal(stale.status.id, LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  assert.match(stale.reason, /older than 90 days/);
  assert.equal(isLearningEvidenceRecent("2026-07-23T12:00:00.000Z", { now: NOW }), true);
});

test("class comparability requires enough ready learners, coverage, and balanced responses", () => {
  const comparable = evaluateClassComparability({
    totalLearners: 4,
    policyReadyLearners: 3,
    responseCounts: [20, 20, 12]
  });
  const weakCoverage = evaluateClassComparability({
    totalLearners: 4,
    policyReadyLearners: 2,
    responseCounts: [20, 20]
  });
  const imbalanced = evaluateClassComparability({
    totalLearners: 2,
    policyReadyLearners: 2,
    responseCounts: [8, 40]
  });

  assert.equal(comparable.comparable, true);
  assert.equal(comparable.policyVersion, LEARNING_POLICY_VERSION);
  assert.equal(weakCoverage.comparable, false);
  assert.match(weakCoverage.reason, /50% of learners are policy-ready; 70% required/);
  assert.equal(imbalanced.comparable, false);
  assert.match(imbalanced.reason, /5:1 response imbalance; 4:1 maximum/);
});

test("item progression requires the item minimum, recency, accuracy, and correct count", () => {
  const sparse = meetsLearningProgressionRule({
    accuracy: 100,
    attempts: 2,
    correct: 2,
    observedAt: "2026-07-23T12:00:00.000Z",
    now: NOW
  });
  const secure = meetsLearningProgressionRule({
    accuracy: 100,
    attempts: 3,
    correct: 3,
    observedAt: "2026-07-23T12:00:00.000Z",
    now: NOW
  });

  assert.equal(sparse.progresses, false);
  assert.equal(sparse.status.id, LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  assert.equal(secure.progresses, true);
  assert.equal(secure.policyVersion, LEARNING_POLICY_VERSION);
});
