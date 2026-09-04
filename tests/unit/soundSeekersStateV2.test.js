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
import {
  deriveConfusions,
  evidenceIsIndependent
} from "../../src/features/soundSeekers/engine/evidence.js";
import { createCharacterAppearance } from "../../src/features/soundSeekers/visual/characterCustomization.js";

test("settings persist only motor assists, presentation choices, and canonical cosmetics", () => {
  const characterAppearance = createCharacterAppearance({
    schemaVersion: 1,
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "player-palette-moss",
    accessories: { back: null, head: "gear-head-leaf-cap", neck: null, held: null }
  });
  const settings = normalizeSoundSeekersState({
    ...createSoundSeekersState(),
    settings: {
      autoTravel: true,
      slowerMovement: true,
      noDamageTravel: true,
      largerTargets: true,
      simplifiedScene: true,
      extendedResponse: true,
      characterAppearance,
      answer: "sh",
      learningSupport: true,
      evidence: [{ correct: true }],
      mastery: { sh: 99 },
      telemetry: { selected: "sh" },
      timing: 1
    }
  }).settings;
  for (const key of [
    "autoTravel", "slowerMovement", "noDamageTravel", "largerTargets",
    "simplifiedScene", "extendedResponse"
  ]) assert.equal(settings[key], true, key);
  assert.deepEqual(settings.characterAppearance, characterAppearance);
  for (const forbidden of [
    "answer", "learningSupport", "evidence", "mastery", "telemetry", "timing"
  ]) assert.equal(Object.hasOwn(settings, forbidden), false, forbidden);

  const invalidAppearance = structuredClone(characterAppearance);
  invalidAppearance.answer = "sh";
  assert.equal(Object.hasOwn(normalizeSoundSeekersState({
    ...createSoundSeekersState(), settings: { characterAppearance: invalidAppearance }
  }).settings, "characterAppearance"), false);
});

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
      { id: "shared", at: 2 }
    ]
  });
  assert.deepEqual(state.evidence, [
    { id: "shared", at: 2 },
    { id: "number", at: 4 },
    { id: "string", at: "a" }
  ]);
});

test("equal-time evidence uses deterministic UTF-8 C ordering", () => {
  const state = normalizeSoundSeekersState({
    ...createSoundSeekersState(),
    evidence: ["event:z", "event:ä", "event:Z", "event:a"].map(id => ({ id, at: 1 }))
  });
  assert.deepEqual(state.evidence.map(event => event.id), [
    "event:Z", "event:a", "event:z", "event:ä"
  ]);
});

test("string-time evidence uses deterministic UTF-8 C ordering", () => {
  const state = normalizeSoundSeekersState({
    ...createSoundSeekersState(),
    evidence: ["z", "ä", "Z", "a"].map((at, index) => ({ id: `event:${index}`, at }))
  });
  assert.deepEqual(state.evidence.map(event => event.at), ["Z", "a", "z", "ä"]);
});

test("v2 evidence discards non-string event identities", () => {
  const state = normalizeSoundSeekersState({
    ...createSoundSeekersState(),
    evidence: [
      { id: 123, at: 1 },
      { id: true, at: 2 },
      { id: { forged: true }, at: 3 },
      { id: "valid", at: 4 }
    ]
  });
  assert.deepEqual(state.evidence, [{ id: "valid", at: 4 }]);
});

test("v2 structural state normalizes all five deck categories, receipts, and exact pending descriptors", () => {
  const base = createSoundSeekersState();
  assert.deepEqual(Object.keys(base.contentDecks), [
    "heartWords", "stories", "alternatives", "morphology", "transfer"
  ]);
  assert.deepEqual(base.attemptReceipts, {});
  for (const category of Object.keys(base.contentDecks)) {
    assert.deepEqual(base.contentDecks[category], { visits: {}, uses: {} });
  }

  const visitId = "visit:s16-alternative";
  const alternatives = {
    visits: {
      [visitId]: {
        kind: "visit", visitId,
        contentInstanceId: "alternatives-content-instance:alternative-slot-s16",
        visitOwnerId: "s16-alternative", ownerActionUseId: "s16-alternative:content-use",
        category: "alternatives", slotId: "alternative-slot-s16",
        recordId: "alternative:s16", contentId: "alternative:s16",
        targetId: null, wordId: null, stopId: "s16", journeyStep: 16
      }
    },
    uses: {}
  };
  const malformed = normalizeSoundSeekersState({
    ...base,
    contentDecks: { ...base.contentDecks, alternatives },
    checkpoint: {
      contentVersion: SOUND_SEEKERS_CONTENT_VERSION,
      contentPlacement: {
        kind: "content_placement", placementId: "s16-alternative", category: "alternatives",
        visitId, stopId: "s16", journeyStep: 16,
        stage: "response_pending", targetOrdinal: 0, attemptOrdinal: 0,
        attemptId: "content-placement-attempt:visit:s16-alternative:s16-alternative:0:0",
        expectedToken: "forbidden", correction: { answer: "forbidden" }
      }
    }
  });
  assert.equal(Object.hasOwn(malformed.checkpoint.contentPlacement, "expectedToken"), false);
  assert.equal(Object.hasOwn(malformed.checkpoint.contentPlacement, "correction"), false);
  assert.deepEqual(Object.keys(malformed.checkpoint.contentPlacement).sort(), [
    "attemptId", "attemptOrdinal", "category", "journeyStep", "kind", "placementId",
    "stage", "stopId", "targetOrdinal", "visitId"
  ]);
  const orphaned = normalizeSoundSeekersState({
    ...base,
    checkpoint: malformed.checkpoint
  });
  assert.equal(orphaned.checkpoint.contentPlacement, undefined,
    "a pending descriptor without its structural visit is not resumable");
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

test("identical evidence retries remain one normal immutable event", () => {
  const base = createSoundSeekersState();
  const event = {
    id: "same-attempt:1",
    at: "2026-09-01T10:00:00.000Z",
    evidenceKind: "practice",
    target: "sh",
    domain: "phoneme_to_grapheme",
    correct: true,
    supportLevel: 0,
    revealed: false,
    audioRequired: false
  };
  const merged = mergeSoundSeekersStates(
    { ...base, evidence: [event] },
    { ...base, evidence: [{ ...event }] }
  );

  assert.deepEqual(merged.evidence, [event]);
  assert.equal(evidenceIsIndependent(merged.evidence[0]), true);
});

test("a conflicting evidence id becomes one absorbing no-credit marker in either merge direction", () => {
  const base = createSoundSeekersState();
  const accepted = {
    id: "conflicted-attempt:2",
    at: 11,
    evidenceKind: "practice",
    target: "sh",
    domain: "phoneme_to_grapheme",
    correct: true,
    supportLevel: 0,
    revealed: false,
    audioRequired: false
  };
  const conflicting = { ...accepted, at: 12, correct: false, confusion: "ch" };
  const expected = {
    id: "conflicted-attempt:2",
    at: 12,
    evidenceKind: "conflict",
    conflicted: true
  };
  const left = { ...base, evidence: [accepted] };
  const right = { ...base, evidence: [conflicting] };

  const forward = mergeSoundSeekersStates(left, right);
  const reverse = mergeSoundSeekersStates(right, left);
  assert.deepEqual(forward.evidence, [expected]);
  assert.deepEqual(reverse.evidence, [expected]);
  assert.deepEqual(forward, reverse);
  assert.equal(evidenceIsIndependent(expected), false);
  assert.deepEqual(deriveConfusions([expected]), {});

  const retried = mergeSoundSeekersStates(forward, left);
  assert.deepEqual(retried.evidence, [expected], "a later clean retry cannot resurrect learning credit");
});

test("conflicting evidence merge is associative and keeps the latest deterministic sort timestamp", () => {
  const base = createSoundSeekersState();
  const a = { ...base, evidence: [{ id: "assoc:1", at: 1, evidenceKind: "practice", target: "sh", domain: "phoneme_to_grapheme", correct: true }] };
  const b = { ...base, evidence: [{ id: "assoc:1", at: 2, evidenceKind: "practice", target: "sh", domain: "phoneme_to_grapheme", correct: false }] };
  const c = { ...base, evidence: [{ id: "assoc:1", at: 3, evidenceKind: "practice", target: "ch", domain: "phoneme_to_grapheme", correct: true }] };
  const leftGrouped = mergeSoundSeekersStates(mergeSoundSeekersStates(a, b), c);
  const rightGrouped = mergeSoundSeekersStates(a, mergeSoundSeekersStates(b, c));

  assert.deepEqual(leftGrouped, rightGrouped);
  assert.deepEqual(leftGrouped.evidence, [{
    id: "assoc:1",
    at: 3,
    evidenceKind: "conflict",
    conflicted: true
  }]);
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
