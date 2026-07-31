import assert from "node:assert/strict";
import test from "node:test";

import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { listV3PublishedSkillIds } from "../../src/data/v3/v3Registry.js";
import { loadPublishedV3QuestionPool } from "../../tools/v3AssessmentQuestionPool.js";

test("strict release audit uses the same published v3 questions as student runtime", async () => {
  const auditPool = loadPublishedV3QuestionPool().filter(question => !question.retentionOnly);
  const publishedSkillIds = listV3PublishedSkillIds();

  assert.equal(publishedSkillIds.length, 30);
  for (const skillId of publishedSkillIds) {
    const runtimeBank = await loadAssessmentSkillBank(skillId);
    const auditIds = auditPool
      .filter(question => question.assessmentSkillId === skillId)
      .map(question => String(question.id || question.questionId || ""))
      .sort();
    const runtimeIds = runtimeBank
      .map(question => String(question.id || question.questionId || ""))
      .sort();

    assert.deepEqual(
      auditIds,
      runtimeIds,
      `${skillId} strict-audit exposure must exactly match student runtime`
    );
  }
});
