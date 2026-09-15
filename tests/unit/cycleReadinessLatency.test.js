import test from "node:test";
import assert from "node:assert/strict";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { buildCyclePracticePlan, cyclePracticeReadiness } from "../../src/components/cycle-practice/cyclePracticeContent.js";

test("answer readiness reuses the authored coverage prepared by the initial plan", () => {
  const cycle = { ...elSkillsBlockCycles.find(item => item.id === "cycle-27") };
  const plan = buildCyclePracticePlan(cycle, "readiness-response");
  Object.defineProperty(cycle, "highFrequencyWords", {
    get() { throw new Error("The answer callback must not rebuild curriculum pools"); }
  });
  assert.equal(cyclePracticeReadiness(cycle, [], 1).ready, false);
  const completed = plan.rounds.map(round => ({ semanticKey: round.semanticKey, activityCompleted: true }));
  assert.equal(cyclePracticeReadiness(cycle, completed, 1799).ready, false);
  assert.equal(cyclePracticeReadiness(cycle, completed, 1800).ready, true);
});
