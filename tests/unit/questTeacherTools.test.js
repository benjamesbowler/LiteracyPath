import { test } from "node:test";
import assert from "node:assert/strict";
import { questHeatTiles, buildQuestMasteryReport } from "../../src/utils/questReport.js";
import { pendingAssignment, freeRoamReviewPlan } from "../../src/utils/questReviewMode.js";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { computeHydratedValue } from "../../src/utils/progressMerge.js";

// The heat map and practice-assign are the teacher-facing halves of the
// mastery gate: evidence in (tiles, honestly bucketed), action out (an
// assignment the child's Free Roam serves). These tests pin both halves.

function stateWith(mastery = {}, extra = {}) {
  return { mastery, trail: { stopsDone: [], stars: {}, routeCursor: 1 }, ...extra };
}

test("heat map: one tile per taught GPC, in curriculum order, honestly bucketed", () => {
  const tiles = questHeatTiles(stateWith({
    a: { seen: 6, correct: 6, state: "mastered", misses: 0 },
    m: { seen: 5, correct: 3, state: "learning", misses: 0 },
    t: { seen: 4, correct: 1, state: "learning", misses: 2 },
    s: { seen: 3, correct: 3, state: "retired", misses: 0 }
  }));

  const taughtCount = new Set(QUEST_STOPS.flatMap(stop => stop.teach.map(entry => entry.id))).size;
  assert.equal(tiles.length, taughtCount, "every taught sound gets a tile exactly once");

  const byId = new Map(tiles.map(tile => [tile.id, tile]));
  assert.equal(byId.get("a").bucket, "got-it");
  assert.equal(byId.get("s").bucket, "got-it", "retired still reads as known");
  assert.equal(byId.get("m").bucket, "almost");
  assert.equal(byId.get("t").bucket, "reteach", "a consecutive-miss run needs re-teaching");
  assert.equal(byId.get("sh").bucket, "unseen", "never attempted is not a failure state");
  assert.equal(byId.get("a").accuracy, 100);

  // Curriculum order: `a` (stop 1) must come before `sh` (stop 9).
  assert.ok(tiles.findIndex(t => t.id === "a") < tiles.findIndex(t => t.id === "sh"));
});

test("report carries a valid assignment through, and drops an empty one", () => {
  const withAssignment = buildQuestMasteryReport(stateWith({}, {
    assignment: { targets: ["sh", "ch"], note: "before Friday", assignedAt: "2026-07-16" }
  }));
  assert.deepEqual(withAssignment.assignment.targets, ["sh", "ch"]);

  const cleared = buildQuestMasteryReport(stateWith({}, {
    assignment: { targets: [], assignedAt: "2026-07-16" }
  }));
  assert.equal(cleared.assignment, null, "an emptied assignment reads as no assignment");
});

test("Free Roam serves the teacher's assignment when one exists", () => {
  const state = stateWith(
    { a: { seen: 8, correct: 2, state: "learning", misses: 1 } },
    { assignment: { targets: ["sh", "ch"], assignedAt: "2026-07-16" } }
  );
  const plan = freeRoamReviewPlan(state);
  assert.deepEqual(plan.targets, ["sh", "ch"], "assignment beats the automatic weakest-five");
  assert.equal(plan.title, "Practice from your teacher");
  assert.ok(plan.assignment);
  // The plan lands on a stop that actually teaches an assigned sound.
  const stop = QUEST_STOPS.find(s => s.id === plan.stopId);
  assert.ok(stop.teach.some(entry => ["sh", "ch"].includes(entry.id)));
});

test("without an assignment, Free Roam still builds the weakest-five plan", () => {
  const plan = freeRoamReviewPlan(stateWith({
    a: { seen: 8, correct: 2, state: "learning", misses: 1 }
  }));
  assert.equal(plan.assignment, null);
  assert.ok(plan.targets.includes("a"));
});

test("pendingAssignment ignores malformed payloads", () => {
  assert.equal(pendingAssignment({}), null);
  assert.equal(pendingAssignment({ assignment: { targets: [] } }), null);
  assert.equal(pendingAssignment({ assignment: { targets: "sh" } }), null);
  assert.deepEqual(pendingAssignment({ assignment: { targets: ["sh", null, "ch"] } }).targets, ["sh", "ch"]);
});

test("a hydrate can DELIVER and REPLACE an assignment, and never resurrect a cleared one over a newer write", () => {
  // Teacher assigns on their device; the child's device hydrates it in.
  const local = stateWith({ a: { seen: 2, correct: 2, state: "learning" } });
  const delivered = computeHydratedValue("phonics_quest", "__all__", local, {
    assignment: { targets: ["sh"], assignedAt: "2026-07-16" }
  });
  assert.deepEqual(delivered.assignment.targets, ["sh"], "assignment arrives via hydrate");
  assert.equal(delivered.mastery.a.seen, 2, "mastery untouched by an assignment-only row");

  // Teacher replaces it; incoming wins for unknown keys under phonics_quest.
  const replaced = computeHydratedValue("phonics_quest", "__all__", delivered, {
    assignment: { targets: ["ch", "th"], assignedAt: "2026-07-17" }
  });
  assert.deepEqual(replaced.assignment.targets, ["ch", "th"]);
});
