import test from "node:test";
import assert from "node:assert/strict";
import {
  SOUND_SEEKERS_CONTENT_VERSION,
  createSoundSeekersState,
  isSoundSeekersV2,
  mergeSoundSeekersStates,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";

test("v1 learning starts a fresh v2 game while allowlisted preferences survive", () => {
  const next = normalizeSoundSeekersState({
    v: 1,
    mastery: { sh: { correct: 99 } },
    checkpoint: { stopId: "s39" },
    settings: { reducedMotion: true, music: false },
    assignment: { stopIds: ["s4"] }
  });
  assert.equal(next.v, 2);
  assert.deepEqual(next.evidence, []);
  assert.equal(next.checkpoint, null);
  assert.equal(next.trail.journeyStep, 1);
  assert.deepEqual(next.assignment, { stopIds: ["s4"] });
  assert.equal(next.settings.reducedMotion, true);
  assert.equal(next.settings.music, false);
});

test("v2 merge unions immutable events, monotonic repairs, and reset ancestry", () => {
  const base = createSoundSeekersState();
  const a = { ...base, evidence: [{ id: "a", at: 1 }], trail: { ...base.trail, journeyStep: 41, repairs: { mill: true } } };
  const b = { ...base, evidence: [{ id: "b", at: 2 }], trail: { ...base.trail, journeyStep: 42, repairs: { bridge: true } } };
  const merged = mergeSoundSeekersStates(a, b);
  assert.deepEqual(merged.evidence.map(event => event.id), ["a", "b"]);
  assert.equal(merged.trail.journeyStep, 42);
  assert.deepEqual(merged.trail.repairs, { mill: true, bridge: true });
});

test("v2 state keeps only a compatible local checkpoint and server-owned assignment", () => {
  const local = {
    ...createSoundSeekersState(),
    assignment: { stopIds: ["s2"] },
    checkpoint: { stopId: "s2", contentVersion: SOUND_SEEKERS_CONTENT_VERSION }
  };
  const remote = {
    ...createSoundSeekersState(),
    assignment: { stopIds: ["s5"] },
    checkpoint: { stopId: "s5", contentVersion: "stale-content" }
  };
  const merged = mergeSoundSeekersStates(local, remote);
  assert.deepEqual(merged.assignment, { stopIds: ["s5"] });
  assert.deepEqual(merged.checkpoint, local.checkpoint);
  assert.equal(isSoundSeekersV2(merged), true);
});
