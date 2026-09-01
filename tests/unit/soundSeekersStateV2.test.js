import test from "node:test";
import assert from "node:assert/strict";
import {
  SOUND_SEEKERS_CONTENT_VERSION,
  createTeacherSoundSeekersAssignmentUpdate,
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

test("v2 keeps quiet legacy audio preferences quiet", () => {
  assert.equal(normalizeSoundSeekersState({ v: 1, settings: { quietSoundscape: true } }).settings.music, false);
  assert.equal(normalizeSoundSeekersState({ v: 1, settings: { soundEnabled: false } }).settings.musicEnabled, false);
});

test("v2 assignment needs a valid target or stop payload", () => {
  assert.equal(normalizeSoundSeekersState({ v: 1, assignment: { note: "metadata only" } }).assignment, null);
  assert.deepEqual(
    normalizeSoundSeekersState({ v: 1, assignment: { targets: [" sh "], note: "Practise" } }).assignment,
    { targets: ["sh"], note: "Practise" }
  );
});

test("teacher assignment save payload uses explicit null for a clear", () => {
  const update = createTeacherSoundSeekersAssignmentUpdate(
    [],
    "",
    "2026-09-01T10:00:00Z"
  );
  assert.deepEqual(update, { assignment: null });
});

test("teacher assignment save payload normalizes a bounded replacement", () => {
  const update = createTeacherSoundSeekersAssignmentUpdate(
    [" sh ", "ch", "sh"],
    "Friday practice",
    "2026-09-01T09:00:00Z"
  );
  assert.deepEqual(update, {
    assignment: {
      targets: ["sh", "ch"],
      note: "Friday practice",
      assignedAt: "2026-09-01T09:00:00Z",
      by: "teacher"
    }
  });
});

test("v2 evidence trims ids and orders numeric timestamps before string timestamps", () => {
  const state = normalizeSoundSeekersState({
    ...createSoundSeekersState(),
    evidence: [
      { id: " shared ", at: 2 },
      { id: "number", at: 4 },
      { id: "string", at: "a" },
      { id: "shared", at: 1 }
    ]
  });
  assert.deepEqual(state.evidence, [
    { id: "shared", at: 2 },
    { id: "number", at: 4 },
    { id: "string", at: "a" }
  ]);
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

test("v2 teacher assignment updates distinguish replace, clear, and child omission", () => {
  const assigned = {
    ...createSoundSeekersState(),
    assignment: { targets: ["sh"], assignedAt: "2026-09-01T08:00:00Z", by: "teacher" }
  };

  const replaced = mergeSoundSeekersStates(assigned, {
    assignment: { targets: ["ch", "th"], assignedAt: "2026-09-01T09:00:00Z", by: "teacher" }
  });
  assert.deepEqual(replaced.assignment, {
    targets: ["ch", "th"],
    assignedAt: "2026-09-01T09:00:00Z",
    by: "teacher"
  });

  const cleared = mergeSoundSeekersStates(replaced, { assignment: null });
  assert.equal(cleared.assignment, null);

  const invalid = mergeSoundSeekersStates(replaced, {
    assignment: { targets: [], assignedAt: "2026-09-01T10:00:00Z", by: "teacher" }
  });
  assert.deepEqual(invalid.assignment, replaced.assignment);

  const childPayload = createSoundSeekersState();
  delete childPayload.assignment;
  const preserved = mergeSoundSeekersStates(replaced, childPayload);
  assert.deepEqual(preserved.assignment, replaced.assignment);
});

test("v2 game state outranks stale v1 in either direction without losing an assignment on omission", () => {
  const v2 = {
    ...createSoundSeekersState(),
    assignment: { stopIds: ["s7"], by: "teacher" },
    evidence: [{ id: "v2-event", at: 7 }],
    trail: { ...createSoundSeekersState().trail, journeyStep: 7 }
  };
  const staleV1 = { v: 1, mastery: { sh: { correct: 99 } }, checkpoint: { stopId: "s39" } };

  for (const merged of [
    mergeSoundSeekersStates(v2, staleV1),
    mergeSoundSeekersStates(staleV1, v2)
  ]) {
    assert.equal(merged.v, 2);
    assert.deepEqual(merged.evidence, [{ id: "v2-event", at: 7 }]);
    assert.equal(merged.trail.journeyStep, 7);
    assert.deepEqual(merged.assignment, { stopIds: ["s7"], by: "teacher" });
  }
});
