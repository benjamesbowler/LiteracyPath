import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceJourney,
  dueAtJourneyStep
} from "../../src/features/soundSeekers/engine/journeyClock.js";

test("review becomes due across the physical route wrap", () => {
  assert.equal(dueAtJourneyStep("sh", { journeyStep: 39 }, 3, 42), true);
  const trail = advanceJourney({ routeCursor: 40, journeyStep: 40, repairs: { mill: true } }, "s40");
  assert.equal(trail.routeCursor, 1);
  assert.equal(trail.journeyStep, 41);
  assert.deepEqual(trail.repairs, { mill: true });
});

test("a future or missing journey observation is not due", () => {
  assert.equal(dueAtJourneyStep("sh", { journeyStep: 43 }, 3, 42), false);
  assert.equal(dueAtJourneyStep("sh", null, 3, 42), false);
});

test("invalid review gaps never become immediately due", () => {
  for (const gap of [undefined, null, -1, 1.5, Number.NaN, "three"]) {
    assert.equal(dueAtJourneyStep("sh", { journeyStep: 39 }, gap, 42), false, String(gap));
  }
  assert.equal(dueAtJourneyStep("sh", { journeyStep: 39 }, 0, 39), true);
});
