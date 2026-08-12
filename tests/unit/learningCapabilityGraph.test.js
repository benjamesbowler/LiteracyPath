import assert from "node:assert/strict";
import test from "node:test";

import { listV3PublishedSkillIds } from "../../src/data/v3/v3Registry.js";
import { APPROVED_FOUNDATION_SKILL_IDS } from "../../src/maths/curriculum/mathsSkillTree.js";
import { buildLearningCapabilityGraph } from "../../tools/checkLearningCapabilityGraph.mjs";

test("every released literacy and Maths goal has a deterministic path through experience, evidence and teacher reporting", async () => {
  const graph = await buildLearningCapabilityGraph({
    now: new Date("2026-08-13T12:00:00.000Z")
  });
  const expectedGoals = listV3PublishedSkillIds().length + APPROVED_FOUNDATION_SKILL_IDS.length;

  assert.deepEqual(graph.issues, []);
  assert.equal(graph.summary.goals, expectedGoals);
  assert.equal(graph.summary.completePaths, expectedGoals);
  assert.equal(Object.keys(graph.paths).length, expectedGoals);
  for (const path of Object.values(graph.paths)) {
    assert.ok(path.length >= 4, path.join(" -> "));
    assert.match(path[0], /:goal:/);
    assert.match(path.at(-1), /:report:/);
  }
});

test("each released Maths goal reaches evidence from both a lesson and a skills check", async () => {
  const graph = await buildLearningCapabilityGraph({
    now: new Date("2026-08-13T12:00:00.000Z")
  });

  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    const evidenceId = `maths:evidence:${skillId}`;
    const incoming = graph.edges.filter(edge => edge.to === evidenceId);
    assert.deepEqual(
      incoming.map(edge => edge.from).sort(),
      [`maths:assessment:${skillId}`, `maths:lesson:${skillId}`].sort()
    );
  }
});
