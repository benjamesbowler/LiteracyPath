import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyElQuestProgress,
  mergeElQuestProgress,
  normalizeElQuestProgress
} from "../../src/utils/adventureMapProgress.js";

test("empty Adventure Map progress is a fresh v2 epoch", () => {
  const first = emptyElQuestProgress();
  const second = emptyElQuestProgress();
  assert.deepEqual(first, { schemaVersion: 2, progressEpoch: 2, cycles: {} });
  assert.notEqual(first, second);
  assert.notEqual(first.cycles, second.cycles);
});

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

test("cycle bests merge forward while latest run evidence stays internally consistent", () => {
  const older = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {
      cycle1: {
        stars: 3,
        bestScore: 100,
        bestIndependent: 10,
        plays: 4,
        recoveries: 0,
        sampledConstructs: ["visual_letter_identity"],
        lastIndependent: 10,
        lastTotal: 10,
        lastPlayedAt: "2026-09-02T09:00:00.000Z"
      }
    }
  };
  const newer = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {
      cycle1: {
        stars: 1,
        bestScore: 40,
        bestIndependent: 4,
        plays: 5,
        recoveries: 6,
        sampledConstructs: ["heard_phoneme_grapheme_mapping", "orthographic_memory"],
        lastIndependent: 4,
        lastTotal: 10,
        lastPlayedAt: "2026-09-02T10:00:00.000Z"
      }
    }
  };

  const expectedCycle = {
    stars: 3,
    bestScore: 100,
    bestIndependent: 10,
    plays: 5,
    recoveries: 6,
    sampledConstructs: ["heard_phoneme_grapheme_mapping", "orthographic_memory"],
    lastIndependent: 4,
    lastTotal: 10,
    lastPlayedAt: "2026-09-02T10:00:00.000Z"
  };

  assert.deepEqual(mergeElQuestProgress(older, newer).cycles.cycle1, expectedCycle);
  assert.deepEqual(mergeElQuestProgress(newer, older).cycles.cycle1, expectedCycle);
});

test("cycle station completion still merges forward around latest run evidence", () => {
  const left = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {
      cycle2: {
        stations: { letters: true },
        recoveries: 2,
        sampledConstructs: ["older"],
        lastPlayedAt: "2026-09-02T11:00:00.000Z"
      }
    }
  };
  const right = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {
      cycle2: {
        stations: { sounds: true },
        recoveries: 1,
        sampledConstructs: ["stale"],
        lastPlayedAt: "2026-09-02T10:00:00.000Z"
      }
    }
  };

  assert.deepEqual(mergeElQuestProgress(left, right).cycles.cycle2, {
    stations: { letters: true, sounds: true },
    recoveries: 2,
    sampledConstructs: ["older"],
    lastPlayedAt: "2026-09-02T11:00:00.000Z"
  });
});
