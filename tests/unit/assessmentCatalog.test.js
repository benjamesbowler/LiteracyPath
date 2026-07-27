import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSESSMENT_CATALOG,
  ASSESSMENT_GRADE_OPTIONS,
  ASSESSMENT_STARTERS,
  ASSESSMENT_START_POINT_KINDS,
  ASSESSMENT_TIME_OF_YEAR_OPTIONS,
  defaultStartPointSelection,
  describeStartPointSelection,
  formatEstimatedMinutes,
  getAssessmentCatalogEntry,
  isAssessmentCatalogId,
  isStartPointSatisfied,
  listBandStartPoints,
  listSkillStartPoints
} from "../../src/data/assessmentCatalog.js";
import { skillTree } from "../../src/skillTree.js";
import { EL_BENCHMARK_CATALOG } from "../../src/data/elBenchmarkAssessments.js";

// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
//
// The Checks funnel reads step 3 from this one list and dispatches step 5 from
// it too. A catalog entry that asks for a start point nobody can satisfy, or
// names a starter nobody implements, is a Begin button that does nothing - and
// it would only show up when a teacher had already picked a class, a student
// and a check. These tests hold both halves of that promise.

test("the catalog covers every check a teacher can start, and nothing twice", () => {
  const ids = ASSESSMENT_CATALOG.map(entry => entry.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate id in the catalog");
  assert.deepEqual(ids.slice(0, 3), [
    "skills-check",
    "letter-names-and-sounds",
    "phonics-patterns"
  ]);
  // The four EL domains are composed from their own catalog, not retyped here.
  assert.deepEqual(ids.slice(3), EL_BENCHMARK_CATALOG.map(entry => entry.id));
  for (const entry of ASSESSMENT_CATALOG) {
    assert.equal(isAssessmentCatalogId(entry.id), true);
    assert.equal(getAssessmentCatalogEntry(entry.id), entry);
  }
  assert.equal(getAssessmentCatalogEntry("not-a-check"), null);
});

test("every entry is described in teacher English with a cost and a way to give it", () => {
  for (const entry of ASSESSMENT_CATALOG) {
    assert.ok(entry.label && !/_/.test(entry.label), `${entry.id} needs a plain label`);
    assert.match(entry.description, /\.$/, `${entry.id} needs a one-sentence description`);
    assert.ok(entry.administration.length > 10, `${entry.id} needs an administration note`);
    assert.notEqual(formatEstimatedMinutes(entry), "Teacher paced", `${entry.id} needs a time estimate`);
  }
});

test("every start-point descriptor is satisfiable from its own defaults", () => {
  for (const entry of ASSESSMENT_CATALOG) {
    const selection = defaultStartPointSelection(entry, { firstUnsecuredSkillIndex: 4 });
    assert.equal(
      isStartPointSatisfied(entry, selection),
      true,
      `${entry.id} opens step 4 on a selection it then rejects`
    );
    assert.ok(
      describeStartPointSelection(entry, selection).length > 0,
      `${entry.id} cannot say back what was chosen`
    );
    for (const field of entry.startPoint.fields) {
      assert.ok(field in selection, `${entry.id} asks for ${field} but never defaults it`);
    }
  }
});

test("a start point stays satisfiable for every grade and time of year it claims to support", () => {
  for (const entry of ASSESSMENT_CATALOG) {
    if (entry.startPoint.kind === ASSESSMENT_START_POINT_KINDS.NONE) continue;
    if (entry.startPoint.kind === ASSESSMENT_START_POINT_KINDS.SKILL) continue;
    for (const grade of ASSESSMENT_GRADE_OPTIONS.map(row => row.value)) {
      for (const time of ASSESSMENT_TIME_OF_YEAR_OPTIONS.map(row => row.value)) {
        const selection = defaultStartPointSelection(entry, { grade, timeOfYear: time });
        assert.equal(
          isStartPointSatisfied(entry, selection),
          true,
          `${entry.id} has no usable start point at ${grade}/${time}`
        );
        if (entry.startPoint.fields.includes("band")) {
          assert.ok(
            listBandStartPoints({ grade, timeOfYear: time }).length > 0,
            `${entry.id} asks for a band at ${grade}/${time} but offers none`
          );
        }
      }
    }
  }
});

test("the skills check start point is the 30 skills, defaulting to the child's next one", () => {
  const options = listSkillStartPoints();
  assert.equal(options.length, skillTree.length);
  assert.deepEqual(options.map(option => option.skillId), skillTree.map(skill => skill.id));
  const entry = getAssessmentCatalogEntry("skills-check");
  assert.deepEqual(
    defaultStartPointSelection(entry, { firstUnsecuredSkillIndex: 7 }),
    { skillIndex: 7 }
  );
  // Out-of-range numbers are clamped rather than starting a check on nothing.
  assert.deepEqual(
    defaultStartPointSelection(entry, { firstUnsecuredSkillIndex: 900 }),
    { skillIndex: skillTree.length - 1 }
  );
  assert.equal(isStartPointSatisfied(entry, { skillIndex: skillTree.length }), false);
  assert.equal(isStartPointSatisfied(entry, {}), false);
});

test("every id dispatches to a starter the funnel actually implements", () => {
  // Stand-in for the funnel's dispatch table: one branch per starter, no default.
  const dispatch = {
    [ASSESSMENT_STARTERS.SKILL_CHECK]: selection => ({ ran: "skill", at: selection.skillIndex }),
    [ASSESSMENT_STARTERS.LETTER_CHECK]: () => ({ ran: "letters" }),
    [ASSESSMENT_STARTERS.PHONICS_PATTERN_CHECK]: () => ({ ran: "patterns" }),
    [ASSESSMENT_STARTERS.EL_BENCHMARK]: (selection, entry) => ({
      ran: "benchmark",
      benchmarkId: entry.benchmarkId,
      grade: selection.grade
    })
  };
  const starters = new Set(Object.values(ASSESSMENT_STARTERS));
  for (const entry of ASSESSMENT_CATALOG) {
    assert.ok(starters.has(entry.starter), `${entry.id} names an unknown starter`);
    const run = dispatch[entry.starter];
    assert.equal(typeof run, "function", `${entry.id} has no dispatch branch`);
    const result = run(defaultStartPointSelection(entry, { firstUnsecuredSkillIndex: 2 }), entry);
    assert.ok(result.ran, `${entry.id} dispatched to nothing`);
    if (entry.starter === ASSESSMENT_STARTERS.EL_BENCHMARK) {
      assert.equal(result.benchmarkId, entry.id, "an EL entry must carry the id its starter needs");
    }
  }
});

test("an unsatisfied start point keeps Begin shut", () => {
  const wordReading = getAssessmentCatalogEntry("el_decoding");
  assert.equal(isStartPointSatisfied(wordReading, { grade: "1", timeOfYear: "MOY" }), false);
  assert.equal(
    isStartPointSatisfied(wordReading, { grade: "1", timeOfYear: "MOY", band: "late_consolidated" }),
    false,
    "a band outside the chosen grade and time of year is not a valid start"
  );
  assert.equal(
    isStartPointSatisfied(wordReading, { grade: "1", timeOfYear: "MOY", band: "middle_full" }),
    true
  );
  const letters = getAssessmentCatalogEntry("letter-names-and-sounds");
  assert.equal(isStartPointSatisfied(letters, {}), true);
  assert.equal(isStartPointSatisfied(null, {}), false);
});
