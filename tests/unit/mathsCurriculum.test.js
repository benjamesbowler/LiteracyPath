import assert from "node:assert/strict";
import test from "node:test";

import {
  APPROVED_FOUNDATION_SKILL_IDS,
  approvedMathsSkills,
  mathsSkillById,
  mathsSkillTree,
  mathsSkillsForYear
} from "../../src/maths/curriculum/mathsSkillTree.js";
import {
  mathsCycleForSkill,
  mathsCycles,
  mathsCyclesForYear
} from "../../src/maths/curriculum/mathsCycles.js";

test("the Maths registry contains the complete F–2 spine with only the approved slice released", () => {
  assert.equal(mathsSkillTree.length, 48);
  assert.equal(mathsSkillsForYear("F").length, 15);
  assert.equal(mathsSkillsForYear("1").length, 17);
  assert.equal(mathsSkillsForYear("2").length, 16);
  assert.deepEqual(
    approvedMathsSkills().map(skill => skill.id),
    APPROVED_FOUNDATION_SKILL_IDS
  );
  assert.equal(mathsSkillsForYear("F", { includePlanned: false }).length, 8);
  assert.equal(mathsSkillsForYear("1", { includePlanned: false }).length, 0);
});
test("released Maths skills expose classroom-ready curriculum metadata", () => {
  for (const skill of approvedMathsSkills()) {
    assert.equal(skill.subject, "maths");
    assert.ok(skill.representations.length >= 2, `${skill.id} representations`);
    assert.ok(skill.assessmentBlueprintIds.length >= 1, `${skill.id} blueprint`);
    assert.ok(skill.nextActions.length >= 2, `${skill.id} next actions`);
    assert.ok(skill.standards.length >= 1, `${skill.id} standards`);
    assert.ok(Object.isFrozen(skill));
    assert.ok(Object.isFrozen(skill.representations));
  }
});

test("six ordered cycles cover every skill in each year", () => {
  assert.equal(mathsCycles.length, 18);
  for (const year of ["F", "1", "2"]) {
    const cycles = mathsCyclesForYear(year);
    assert.deepEqual(cycles.map(cycle => cycle.number), [1, 2, 3, 4, 5, 6]);
  }
  for (const skill of mathsSkillTree) {
    const cycle = mathsCycleForSkill(skill.id);
    assert.ok(cycle, `${skill.id} cycle`);
    assert.equal(cycle.year, skill.year);
    assert.equal(mathsSkillById[skill.id], skill);
  }
});
