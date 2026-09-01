import assert from "node:assert/strict";
import test from "node:test";
import {
  appendEvidence,
  createLiteracyDecision,
  deriveConfusions,
  evidenceIsIndependent
} from "../../src/features/soundSeekers/engine/evidence.js";
import {
  EVIDENCE_DOMAINS,
  toChildChallengeView,
  validateQuestChallenge
} from "../../src/features/soundSeekers/engine/challengeContract.js";
import {
  QUEST_PRACTICE_THRESHOLDS,
  practiceReadinessFor
} from "../../src/utils/questMastery.js";

function challenge(overrides = {}) {
  return {
    attemptId: "attempt-sh-1",
    targetId: "sh",
    recordsDomain: EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME,
    expectedToken: "sh",
    powerId: "echo-cave",
    requiresAudio: true,
    ...overrides
  };
}

function decision(overrides = {}) {
  return createLiteracyDecision({
    challenge: challenge(),
    response: { kind: "literacy-answer", token: "sh" },
    support: { level: 0 },
    audio: { status: "completed" },
    journeyStep: 4,
    ordinal: 1,
    at: "2026-09-01T10:00:00.000Z",
    ...overrides
  });
}

test("movement and reward inputs emit no learning event; one answer emits one immutable event", () => {
  assert.equal(createLiteracyDecision({ action: { type: "move", x: 1 } }), null);
  assert.equal(createLiteracyDecision({ response: { kind: "reward" } }), null);
  assert.equal(createLiteracyDecision({ response: { kind: "timing" } }), null);
  assert.equal(createLiteracyDecision({ response: { kind: "collection" } }), null);

  const event = decision();
  assert.equal(event.evidenceKind, "practice");
  assert.equal(Object.isFrozen(event), true);
  assert.equal(appendEvidence([event], event).length, 1);
  assert.equal(appendEvidence([], event).length, 1);
});

test("a completed word has one decision event, never component-target fan-out", () => {
  const event = decision({
    challenge: challenge({
      attemptId: "word-ship",
      targetId: "word:ship",
      recordsDomain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING,
      expectedToken: "ship",
      wordId: "ship"
    }),
    response: { kind: "literacy-answer", token: "ship" }
  });
  assert.deepEqual(appendEvidence([], event).map(item => item.target), ["word:ship"]);
  assert.equal(event.word, "ship");
});

test("support, reveal, and incomplete required audio cannot become independent", () => {
  assert.equal(evidenceIsIndependent(decision({ support: { level: 1 } })), false);
  assert.equal(evidenceIsIndependent(decision({ support: { level: 0, revealed: true } })), false);
  assert.equal(evidenceIsIndependent(decision({ audio: { status: "started" } })), false);
  assert.equal(evidenceIsIndependent(decision({ audio: { status: "interrupted" } })), false);
  assert.equal(evidenceIsIndependent(decision({ audio: { status: "failed" } })), false);
  assert.equal(evidenceIsIndependent(decision({ audio: { status: "completed" } })), true);
});

test("challenge validation closes the domain and answer boundary before evidence is recorded", () => {
  assert.equal(validateQuestChallenge(challenge()).valid, true);
  assert.equal(validateQuestChallenge(challenge({ recordsDomain: "reskinned_echo" })).valid, false);
  assert.equal(createLiteracyDecision({
    challenge: challenge({ recordsDomain: "reskinned_echo" }),
    response: { kind: "literacy-answer", token: "sh" }
  }), null);

  const view = toChildChallengeView(challenge());
  assert.equal("expectedToken" in view, false);
  assert.equal("isCorrect" in view, false);
  assert.equal("recordsDomain" in view, true);
});

test("a wrong literacy decision records only its own truthful confusion", () => {
  const miss = decision({
    response: { kind: "literacy-answer", token: "ch" },
    ordinal: 2
  });
  const correct = decision({ ordinal: 3 });
  assert.equal(miss.correct, false);
  assert.equal(miss.confusion, "ch");
  assert.equal(correct.confusion, null);
  assert.deepEqual(deriveConfusions([miss, correct]), { "sh:ch": 1 });
});

test("two reskins of one mapping domain do not satisfy domain diversity", () => {
  const echo = decision({ ordinal: 1, at: "2026-09-01T10:00:00.000Z" });
  const secondEcho = decision({
    challenge: challenge({ attemptId: "attempt-sh-2", powerId: "flower-jump" }),
    ordinal: 1,
    at: "2026-09-02T10:00:00.000Z"
  });
  const result = practiceReadinessFor("sh", [echo, secondEcho]);
  assert.equal(result.ready, false);
  assert.deepEqual(result.domains, ["phoneme_to_grapheme"]);
  assert.equal(result.state, "building");
  assert.equal(result.evidenceKind, "practice");
  assert.equal(QUEST_PRACTICE_THRESHOLDS.minDomains > 1, true);
});

test("unrecognised domains cannot be smuggled into practice readiness", () => {
  const forged = Object.freeze({
    ...decision(),
    id: "forged-domain",
    domain: "echo_reskin"
  });
  const result = practiceReadinessFor("sh", [forged]);
  assert.equal(result.attempts, 0);
  assert.equal(result.state, "exposure");
});

test("practice readiness requires independent, spaced, diverse recent literacy evidence and never claims Secure", () => {
  const domains = [
    EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME,
    EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME,
    EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME,
    EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME
  ];
  const evidence = domains.map((recordsDomain, index) => decision({
    challenge: challenge({ attemptId: `attempt-sh-${index}`, recordsDomain }),
    ordinal: 1,
    at: `2026-09-0${index < 2 ? 1 : 2}T10:00:00.000Z`
  }));
  const result = practiceReadinessFor("sh", evidence);
  assert.equal(result.ready, true);
  assert.equal(result.state, "ready_for_teaching_check");
  assert.equal("SECURE" in result, false);
  assert.equal(result.formalStatus, undefined);
});
