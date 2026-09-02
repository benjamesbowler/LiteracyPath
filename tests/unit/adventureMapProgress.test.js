import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeElQuestProgress,
  normalizeElQuestProgress
} from "../../src/utils/adventureMapProgress.js";

test("v1 Adventure Map progress resets only its cycle records", () => {
  assert.deepEqual(normalizeElQuestProgress({
    v: 1,
    cycles: { cycle1: { stars: 3, stations: { letters: true } } },
    unrelatedMarker: "keep"
  }), {
    v: 1,
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {},
    unrelatedMarker: "keep"
  });
});

test("v2 Adventure Map progress survives normalisation", () => {
  const current = { schemaVersion: 2, progressEpoch: 2, cycles: { cycle1: { stars: 2 } } };
  assert.deepEqual(normalizeElQuestProgress(current), current);
});

test("epoch 2 beats stale legacy progress in either orientation", () => {
  const current = { schemaVersion: 2, progressEpoch: 2, cycles: {} };
  const legacy = { v: 1, cycles: { cycle1: { stars: 3 } } };
  assert.deepEqual(mergeElQuestProgress(current, legacy), current);
  assert.deepEqual(mergeElQuestProgress(legacy, current), current);
});
