import assert from "node:assert/strict";
import test from "node:test";

import {
  PHASE_PASS_RULE,
  skillBlueprints
} from "../../src/content/blueprints/skillBlueprints.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { listV3PublishedSkillIds } from "../../src/data/v3/v3Registry.js";
import { DEFAULT_PHASE_PASS_RATE, getMasteryRule } from "../../src/masterySystem.js";

test("the 30 current blueprints are the only assessment contracts", () => {
  const skillIds = Object.keys(skillBlueprints);
  assert.equal(skillIds.length, 30);
  assert.deepEqual([...listV3PublishedSkillIds()].sort(), [...skillIds].sort());
  assert.equal(PHASE_PASS_RULE.accuracyMin, 0.7);
  assert.equal(DEFAULT_PHASE_PASS_RATE, PHASE_PASS_RULE.accuracyMin);

  for (const [skillId, blueprint] of Object.entries(skillBlueprints)) {
    assert.ok(blueprint.sitting > 0, skillId);
    assert.ok(blueprint.unitsByLevel?.[1]?.length, skillId);
    assert.ok(blueprint.unitsByLevel?.[2]?.length, skillId);
    const rule = getMasteryRule(skillId);
    assert.equal(rule.roundLength, blueprint.sitting, skillId);
    assert.equal(rule.passScore, Math.ceil(blueprint.sitting * PHASE_PASS_RULE.accuracyMin), skillId);
  }
});

test("every published current bank is selectable and excludes retention reserves", async () => {
  for (const skillId of listV3PublishedSkillIds()) {
    const questions = await loadAssessmentSkillBank(skillId);
    assert.ok(questions.length > 0, skillId);
    assert.ok(questions.every(question => question.source === "skills_rebuild_v3_2026_08"), skillId);
    assert.ok(questions.every(question => !question.retentionOnly), skillId);
  }
});
