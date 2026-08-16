import assert from "node:assert/strict";
import test from "node:test";

import { listV3PublishedSkillIds } from "../../src/data/v3/v3Registry.js";
import { buildLearningCapabilityGraph } from "../../tools/checkLearningCapabilityGraph.mjs";

test("every released literacy goal has a deterministic path through experience, evidence and teacher reporting", async () => {
  const graph = await buildLearningCapabilityGraph({
    now: new Date("2026-08-13T12:00:00.000Z")
  });
  const expectedGoals = listV3PublishedSkillIds().length;

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
