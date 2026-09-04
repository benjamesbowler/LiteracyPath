import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyElQuestProgress,
  hasCanonicalElQuestCycles,
  isCurrentElQuestProgress,
  isMalformedCurrentElQuestProgress,
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

test("current Adventure Map progress requires canonical cycle and station record objects", () => {
  const valid = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {
      cycle1: { stars: 2 },
      cycle2: { stations: { letters: true } }
    }
  };
  assert.equal(hasCanonicalElQuestCycles(valid), true);
  assert.equal(isCurrentElQuestProgress(valid), true);
  assert.equal(isMalformedCurrentElQuestProgress(valid), false);

  for (const cycles of [null, [], { cycle1: null }, { cycle1: [] }, { cycle1: { stations: [] } }]) {
    const malformed = { schemaVersion: 2, progressEpoch: 2, cycles };
    assert.equal(hasCanonicalElQuestCycles(malformed), false);
    assert.equal(isCurrentElQuestProgress(malformed), false);
    assert.equal(isMalformedCurrentElQuestProgress(malformed), true);
  }
});

test("non-object Adventure Map payloads normalize to a canonical empty record", () => {
  assert.deepEqual(normalizeElQuestProgress(["not", "a", "progress", "object"]), {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {}
  });
  assert.deepEqual(normalizeElQuestProgress("not a progress object"), {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {}
  });
});

test("a future Adventure Map schema at the current epoch stays opaque during normalisation", () => {
  const future = {
    schemaVersion: 3,
    progressEpoch: 2,
    cycles: { futureCycle: { stars: 1 } },
    futureOnly: { checkpoint: "keep-exactly" }
  };

  assert.deepEqual(normalizeElQuestProgress(future), future);
});

test("epoch 2 beats stale legacy progress in either orientation", () => {
  const current = { schemaVersion: 2, progressEpoch: 2, cycles: {} };
  const legacy = { v: 1, cycles: { cycle1: { stars: 3 } } };
  assert.deepEqual(mergeElQuestProgress(current, legacy), current);
  assert.deepEqual(mergeElQuestProgress(legacy, current), current);
});

test("a future Adventure Map schema wins current progress in either merge orientation", () => {
  const current = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: { currentCycle: { stars: 3 } }
  };
  const future = {
    schemaVersion: 3,
    progressEpoch: 2,
    cycles: { futureCycle: { stars: 1 } },
    futureOnly: { checkpoint: "keep-exactly" }
  };

  assert.deepEqual(mergeElQuestProgress(future, current), future);
  assert.deepEqual(mergeElQuestProgress(current, future), future);
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
        lastRunSeed: "older-seed",
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
        lastRunSeed: "newer-seed",
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
    lastRunSeed: "newer-seed",
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
