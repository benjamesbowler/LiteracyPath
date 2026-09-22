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

test("Level 1 Phase 1 only opens Level 1 Phase 2", () => {
  const result = progression(1, 1, ["L1P1"]);

  assert.equal(result.nextActionLabel, "Continue Level 1 Phase 2");
  assert.equal(result.nextSkillUnlocked, false);
  assert.equal(result.level2Unlocked, false);
});

test("Level 1 Phase 2 opens either the next skill or Level 2 Phase 1", () => {
  const result = progression(1, 2, ["L1P1", "L1P2"]);

  assert.equal(result.nextActionLabel, "Move to next skill or try optional Level 2 Phase 1");
  assert.equal(result.nextSkillUnlocked, true);
  assert.equal(result.level2Unlocked, true);
});

test("choosing Level 2 Phase 1 only opens Level 2 Phase 2", () => {
  const result = progression(2, 1, ["L1P1", "L1P2", "L2P1"]);

  assert.equal(result.nextActionLabel, "Continue Level 2 Phase 2");
  assert.equal(result.nextSkillUnlocked, false);
  assert.equal(result.finalStepComplete, false);
});

test("Level 2 Phase 2 opens the next skill", () => {
  const result = progression(2, 2, ["L1P1", "L1P2", "L2P1", "L2P2"]);

  assert.equal(result.nextActionLabel, "Move to next skill");
  assert.equal(result.nextSkillUnlocked, true);
  assert.equal(result.finalStepComplete, true);
});
