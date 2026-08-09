import test from "node:test";
import assert from "node:assert/strict";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { buildLessonComponentRegistry, lessonTargetsForCycle } from "../../src/content/lessons/lessonComponentRegistry.js";
import { buildSmallGroupLesson } from "../../src/utils/lessons/buildSmallGroupLesson.js";
import { createLessonRecipe } from "../../src/utils/lessons/validateLessonRecipe.js";

function build(cycleId, durationMinutes, learnerIds = ["learner-1"]) {
  const target = lessonTargetsForCycle(cycleId)[0];
  const registry = buildLessonComponentRegistry({ cycleId, targetKey: target.key, durationMinutes });
  const recipe = createLessonRecipe({ recipeId: `${cycleId}:${durationMinutes}`, durationMinutes, cycleId, targetKey: target.key, learnerIds, componentIds: Object.values(registry.components).map(({ id, role }) => ({ id, role })), contentVersion: registry.contentVersion });
  return buildSmallGroupLesson({ recipe, componentRegistry: registry.components });
}

test("every teachable phonics cycle builds all three deterministic lesson durations", () => {
  for (const cycle of elSkillsBlockCycles.filter(item => item.type === "cycle" && lessonTargetsForCycle(item.id).length)) {
    for (const duration of [8, 12, 20]) {
      const first = build(cycle.id, duration);
      const second = build(cycle.id, duration);
      assert.deepEqual(first, second);
      assert.deepEqual(first.steps.filter(step => ["retrieve", "model", "guide", "apply", "observe"].includes(step.role)).map(step => step.role), ["retrieve", "model", "guide", "apply", "observe"]);
      assert.equal(first.evidencePurpose, "practice");
      assert.match(first.evidenceLimit, /does not update mastery/i);
      first.steps.forEach(step => assert.ok(step.teacherText && step.learnerTask));
    }
  }
});

test("a recipe cannot omit a mandatory teaching phase or all learners", () => {
  assert.throws(() => build("cycle-3", 12, []), /at least one learner/i);
  const registry = buildLessonComponentRegistry({ cycleId: "cycle-3", targetKey: "grapheme:n", durationMinutes: 12 });
  assert.throws(() => createLessonRecipe({ recipeId: "bad", durationMinutes: 12, cycleId: "cycle-3", targetKey: "grapheme:n", learnerIds: ["learner-1"], componentIds: Object.values(registry.components).filter(component => component.role !== "apply"), contentVersion: registry.contentVersion }), /missing the apply/i);
});
