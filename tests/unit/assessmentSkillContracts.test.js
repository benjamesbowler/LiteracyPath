import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSESSMENT_CONTRACT_ROUND_SIZE,
  assessmentSkillContracts
} from "../../src/data/assessmentSkillContracts.js";
import { assessmentReleaseStandard } from "../../src/content/releaseStandard.js";
import { hfwApprovedWordsBySkill } from "../../src/data/generated/hfwEligibilityKeys.generated.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { isQuestionBlockedByMediaQa } from "../../src/data/mediaQaManifest.js";
import { managedAssessmentSkillDepthConfig } from "../../src/data/skillLevelDepthConfig.js";

test("assessment contracts cover the canonical 30 skills and four live path steps", () => {
  assert.equal(
    ASSESSMENT_CONTRACT_ROUND_SIZE,
    assessmentReleaseStandard.defaults.questionCount.phaseSize
  );
  assert.deepEqual(
    assessmentSkillContracts.map(contract => contract.skillId),
    managedAssessmentSkillDepthConfig.map(config => config.skillId)
  );
  assert.equal(assessmentSkillContracts.length, 30);

  for (const contract of assessmentSkillContracts) {
    assert.equal(contract.status, "complete", contract.skillId);
    assert.deepEqual(
      Object.keys(contract.phases),
      ["L1P1", "L1P2", "L2P1", "L2P2"],
      contract.skillId
    );
    for (const phase of Object.values(contract.phases)) {
      assert.equal(phase.roundSize, ASSESSMENT_CONTRACT_ROUND_SIZE, contract.skillId);
      assert.ok(phase.allowedFormats.length > 0, contract.skillId);
    }
  }
});

test("HFW contracts use the generated word bands enforced by runtime eligibility", () => {
  for (const contract of assessmentSkillContracts.filter(item =>
    item.skillId.startsWith("hfw_")
  )) {
    assert.deepEqual(
      contract.requiredLevelTargets[1],
      hfwApprovedWordsBySkill[contract.skillId],
      contract.skillId
    );
    assert.deepEqual(
      contract.requiredLevelTargets[2],
      hfwApprovedWordsBySkill[contract.skillId],
      contract.skillId
    );
  }
});

test("published digraph and vowel-team regression items contain no blocked effective media", async () => {
  // Digraphs ships the v3 rebuild bank (per-skill cutover), so the guarantee is
  // asserted over EVERY published digraph item instead of one legacy id.
  const digraphQuestions = await loadAssessmentSkillBank("digraphs");
  assert.ok(digraphQuestions.length >= 40, "digraphs published bank present");
  for (const question of digraphQuestions) {
    assert.equal(isQuestionBlockedByMediaQa(question), false, `digraphs:${question.id}`);
  }

  // vowel_teams is still on the legacy bank until its rebuild wave lands.
  const vowelTeamQuestion = (await loadAssessmentSkillBank("vowel_teams"))
    .find(item => item.id === "vowel_teams_l2_variety_06_igh_light");
  assert.ok(vowelTeamQuestion, "vowel_teams:vowel_teams_l2_variety_06_igh_light");
  assert.equal(isQuestionBlockedByMediaQa(vowelTeamQuestion), false, "vowel_teams legacy regression item");
});
