import assert from "node:assert/strict";
import test from "node:test";

import {
  computeSkillStatus,
  computeUnitStates,
  SKILL_STATUS_IDS,
  UNIT_STATE_IDS,
  unitStateEvidenceKey
} from "../../src/policy/skillStatusPolicy.js";
import { getSkillBlueprint, RETENTION_RULE } from "../../src/content/blueprints/skillBlueprints.js";

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-08-03T02:00:00Z"); // 10:00 Asia/Shanghai
const NOW = T0 + 30 * DAY;

function attempt({ unit, item, day, correct = true, level = 1, phase = 1, format = "F1", mode = "formal", sitting, state, supported }) {
  return {
    itemId: item,
    itemKey: unit,
    itemType: "phonics_pattern",
    level,
    phase,
    formatType: format,
    isCorrect: correct,
    responseState: state || (correct ? "correct" : "incorrect"),
    supported: Boolean(supported),
    mode,
    sittingId: sitting || `s${day}-L${level}`,
    timestamp: T0 + day * DAY
  };
}

// Build a full clean run for a discrete D-small skill (digraphs blueprint:
// 6 units, both levels, rule 4 attempts / 3 correct / 2 items / 2 days / 2 formats).
function perfectRun(blueprint) {
  const ledger = [];
  for (const level of [1, 2]) {
    const units = blueprint.unitsByLevel[level];
    for (let pass = 0; pass < 4; pass++) {
      const day = level * 10 + pass; // distinct days per level pass
      for (let slot = 0; slot < blueprint.sitting; slot++) {
        const unit = units[slot % units.length];
        ledger.push(attempt({
          unit,
          item: `it-${unit}-L${level}-v${pass}-s${slot}`,
          day,
          level,
          phase: pass % 2 + 1,
          format: pass % 2 === 0 ? "FMT_A" : "FMT_B",
          sitting: `sit-L${level}-${pass}`
        }));
      }
    }
  }
  return ledger;
}

test("perfect responder reaches Level 2 passed, then Secure after retention", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = perfectRun(blueprint);
  const beforeRetention = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(beforeRetention.status, SKILL_STATUS_IDS.LEVEL_2_PASSED);
  assert.equal(beforeRetention.needsReview, false);
  assert.ok(beforeRetention.whyNot.join(" ").includes("Retention"));

  for (let i = 0; i < RETENTION_RULE.items; i++) {
    ledger.push(attempt({
      unit: blueprint.unitsByLevel[2][i % 6],
      item: `ret-${i}`,
      day: 27,
      level: 2,
      mode: "retention",
      sitting: "retention-1"
    }));
  }
  const after = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(after.status, SKILL_STATUS_IDS.SECURE);
  assert.equal(after.whyNot.length, 0);
});

test("both Level 1 phases at 70% unlock the next skill while Level 2 stays optional", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = [];
  for (const phase of [1, 2]) {
    for (let index = 0; index < blueprint.sitting; index++) {
      ledger.push(attempt({
        unit: blueprint.unitsByLevel[1][index % blueprint.unitsByLevel[1].length],
        item: `l1-p${phase}-${index}`,
        day: phase,
        level: 1,
        phase,
        correct: index < Math.ceil(blueprint.sitting * 0.7),
        sitting: `l1-p${phase}`
      }));
    }
  }

  const result = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(result.status, SKILL_STATUS_IDS.LEVEL_1_PASSED);
  assert.equal(result.level1.phases[1].passed, true);
  assert.equal(result.level1.phases[2].passed, true);
  assert.equal(result.nextSkillUnlocked, true);
  assert.equal(result.level2Unlocked, true);
  assert.equal(result.level2.passed, false);
  assert.equal(result.progressionRule.level2Optional, true);
});

test("one Level 1 phase is not enough to unlock the next skill", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = Array.from({ length: blueprint.sitting }, (_, index) => attempt({
    unit: blueprint.unitsByLevel[1][index % blueprint.unitsByLevel[1].length],
    item: `only-p1-${index}`,
    day: 1,
    level: 1,
    phase: 1,
    correct: index < Math.ceil(blueprint.sitting * 0.7),
    sitting: "only-p1"
  }));

  const result = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(result.level1.phases[1].passed, true);
  assert.equal(result.level1.phases[2].passed, false);
  assert.equal(result.nextSkillUnlocked, false);
  assert.equal(result.status, SKILL_STATUS_IDS.IN_PROGRESS);
});

test("a 60% phase does not pass but a 70% phase does", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const phaseLedger = (correctCount, sitting) => Array.from({ length: 10 }, (_, index) => attempt({
    unit: blueprint.unitsByLevel[1][index % blueprint.unitsByLevel[1].length],
    item: `${sitting}-${index}`,
    day: sitting === "six" ? 1 : 2,
    phase: 1,
    correct: index < correctCount,
    sitting
  }));

  const failed = computeSkillStatus(phaseLedger(6, "six"), blueprint, { now: NOW });
  assert.equal(failed.level1.phases[1].passed, false);
  const passed = computeSkillStatus(phaseLedger(7, "seven"), blueprint, { now: NOW });
  assert.equal(passed.level1.phases[1].passed, true);
});

test("mastery is never sticky: a later miss drops the unit and flags review", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = perfectRun(blueprint);
  const passed = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(passed.status, SKILL_STATUS_IDS.LEVEL_2_PASSED);

  ledger.push(attempt({ unit: "ch", item: "late-miss", day: 28, level: 2, correct: false }));
  const after = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(after.unitStates.get(unitStateEvidenceKey(2, "ch")).state, UNIT_STATE_IDS.REVIEW);
  // History is kept (high-water status) but honestly flagged, never silently secure.
  assert.equal(after.status, SKILL_STATUS_IDS.LEVEL_2_PASSED);
  assert.equal(after.needsReview, true);
  assert.ok(after.whyNot.join(" ").includes("ch"));
});

test("a failed retention check blocks Secure and flags review", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = perfectRun(blueprint);
  for (let i = 0; i < RETENTION_RULE.items; i++) {
    ledger.push(attempt({
      unit: blueprint.unitsByLevel[2][i % 6],
      item: `ret-${i}`,
      day: 27,
      level: 2,
      correct: i < 4, // 4/8 — fail
      mode: "retention",
      sitting: "retention-1"
    }));
  }
  const result = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.notEqual(result.status, SKILL_STATUS_IDS.SECURE);
  assert.equal(result.needsReview, true);
});

test("skipped and supported answers never count toward accuracy or mastery", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = [
    attempt({ unit: "ch", item: "a", day: 1 }),
    { ...attempt({ unit: "ch", item: "b", day: 1 }), responseState: "skipped", isCorrect: false },
    attempt({ unit: "ch", item: "c", day: 2, supported: true })
  ];
  const states = computeUnitStates(ledger, blueprint, { now: NOW });
  const ch = states.get(unitStateEvidenceKey(1, "ch"));
  assert.equal(ch.attempts, 1); // only the scored formal attempt
  const status = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(status.evidence.scored, 1);
  assert.equal(status.evidence.skipped, 1);
  assert.equal(status.evidence.supported, 1);
});

test("single-day cramming cannot pass a unit (two-day rule)", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = [0, 1, 2, 3].map(i =>
    attempt({ unit: "sh", item: `it-${i}`, day: 5, format: i % 2 ? "FMT_A" : "FMT_B" })
  );
  const states = computeUnitStates(ledger, blueprint, { now: NOW });
  assert.equal(states.get(unitStateEvidenceKey(1, "sh")).state, UNIT_STATE_IDS.WORKING);
  assert.ok(states.get(unitStateEvidenceKey(1, "sh")).blockers.join(" ").includes("different days"));
});

test("evidence for the same unit is isolated by level", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = [0, 1, 2, 3].map(i =>
    attempt({
      unit: "ch",
      item: `l2-ch-${i}`,
      day: 5 + i,
      level: 2,
      format: i % 2 ? "FMT_A" : "FMT_B"
    })
  );
  const states = computeUnitStates(ledger, blueprint, { now: NOW });
  assert.equal(states.get(unitStateEvidenceKey(1, "ch")).state, UNIT_STATE_IDS.NOT_SEEN);
  assert.equal(states.get(unitStateEvidenceKey(2, "ch")).state, UNIT_STATE_IDS.PASSED);
});

test("retention taken before the three-day wait cannot make a skill Secure", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const ledger = perfectRun(blueprint);
  for (let i = 0; i < RETENTION_RULE.items; i++) {
    ledger.push(attempt({
      unit: blueprint.unitsByLevel[2][i % 6],
      item: `early-ret-${i}`,
      day: 24,
      level: 2,
      mode: "retention",
      sitting: "early-retention"
    }));
  }
  const result = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(result.status, SKILL_STATUS_IDS.LEVEL_2_PASSED);
  assert.equal(result.retention.passed, false);
  assert.match(result.retention.blockers.join(" "), /before the 3-day wait/i);
});

test("cell-family skills use the distributed rule and pass with full cell coverage", () => {
  const blueprint = getSkillBlueprint("main_idea");
  const ledger = [];
  for (const level of [1, 2]) {
    const cells = blueprint.unitsByLevel[level];
    for (let pass = 0; pass < 6; pass++) {
      for (let slot = 0; slot < blueprint.sitting; slot++) {
        const cell = cells[slot % cells.length];
        ledger.push({
          ...attempt({
            unit: cell,
            item: `p-${cell}-${pass}-${slot}`,
            day: level * 10 + pass,
            level,
            phase: pass % 2 + 1,
            format: "COMPREHENSION",
            sitting: `sit-L${level}-${pass}`
          }),
          itemType: "main_idea_cell"
        });
      }
    }
  }
  const result = computeSkillStatus(ledger, blueprint, { now: NOW });
  assert.equal(result.status, SKILL_STATUS_IDS.LEVEL_2_PASSED);
});

test("statuses are always provisional and carry evidence counts", () => {
  const blueprint = getSkillBlueprint("digraphs");
  const result = computeSkillStatus(perfectRun(blueprint), blueprint, { now: NOW });
  assert.equal(result.provisional, true);
  assert.ok(result.evidence.scored > 0);
  assert.ok(result.evidence.days >= 2);
});
