import assert from "node:assert/strict";
import test from "node:test";

import { getAssessmentCheckpointProgression } from "../../src/appState/assessmentRuntime.js";

function progression(level, phase, passedKeys) {
  return getAssessmentCheckpointProgression({
    currentStep: { level, phase },
    passedKeys,
    nextSkillLabel: "Final Sounds"
  });
}

test("Phase 1 Round 1 only opens Phase 1 Round 2", () => {
  const result = progression(1, 1, ["L1P1"]);

  assert.equal(result.nextActionLabel, "Continue Phase 1 Round 2");
  assert.equal(result.nextSkillUnlocked, false);
  assert.equal(result.level2Unlocked, false);
});

test("Phase 1 Round 2 opens either the next skill or Phase 2 Round 1", () => {
  const result = progression(1, 2, ["L1P1", "L1P2"]);

  assert.equal(result.nextActionLabel, "Move to next skill or try Phase 2 Round 1");
  assert.equal(result.nextSkillUnlocked, true);
  assert.equal(result.level2Unlocked, true);
});

test("choosing Phase 2 Round 1 only opens Phase 2 Round 2", () => {
  const result = progression(2, 1, ["L1P1", "L1P2", "L2P1"]);

  assert.equal(result.nextActionLabel, "Continue Phase 2 Round 2");
  assert.equal(result.nextSkillUnlocked, false);
  assert.equal(result.finalStepComplete, false);
});

test("Phase 2 Round 2 opens the next skill", () => {
  const result = progression(2, 2, ["L1P1", "L1P2", "L2P1", "L2P2"]);

  assert.equal(result.nextActionLabel, "Move to next skill");
  assert.equal(result.nextSkillUnlocked, true);
  assert.equal(result.finalStepComplete, true);
});
