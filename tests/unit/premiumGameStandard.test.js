import test from "node:test";
import assert from "node:assert/strict";

import {
  hasCompletePremiumSetpieceSet,
  laneDirectionForKey,
  premiumSetpieceBudget
} from "../../src/components/learn/games/shared/premiumGameStandard.js";

test("premium 3D setpiece budgets scale up without burdening the low tier", () => {
  const low = premiumSetpieceBudget("low");
  const medium = premiumSetpieceBudget("medium");
  const high = premiumSetpieceBudget("high");

  assert.deepEqual(low, { setpieceKinds: 0, setpieceCopies: 0 });
  assert.ok(medium.setpieceKinds > low.setpieceKinds);
  assert.ok(high.setpieceKinds > medium.setpieceKinds);
  assert.ok(high.setpieceCopies > medium.setpieceCopies);
  assert.equal(premiumSetpieceBudget("unknown"), medium);
});

test("premium scenery replaces the complete fallback only after its whole tier set loads", () => {
  const medium = premiumSetpieceBudget("medium");
  assert.equal(hasCompletePremiumSetpieceSet(medium.setpieceCopies, medium), true);
  assert.equal(hasCompletePremiumSetpieceSet(medium.setpieceCopies - 1, medium), false);
  assert.equal(hasCompletePremiumSetpieceSet(4, premiumSetpieceBudget("low")), false);
});

test("premium lane controls keep arrows and WASD in parity", () => {
  assert.equal(laneDirectionForKey("ArrowLeft"), -1);
  assert.equal(laneDirectionForKey("a"), -1);
  assert.equal(laneDirectionForKey("A"), -1);
  assert.equal(laneDirectionForKey("ArrowRight"), 1);
  assert.equal(laneDirectionForKey("d"), 1);
  assert.equal(laneDirectionForKey("D"), 1);
  assert.equal(laneDirectionForKey("Enter"), 0);
});
