import assert from "node:assert/strict";
import test from "node:test";

import { createReplayVariant } from "../../src/features/soundSeekers/engine/replayDeck.js";

const deck = Object.freeze({
  targetId: "sh",
  pronunciation: Object.freeze({ key: "sh", ipa: "/ʃ/" }),
  variants: Object.freeze([
    Object.freeze({
      contentId: "ship",
      candidatePositions: Object.freeze([0, 1, 2]),
      routeId: "river",
      recipientId: "moss",
      setPieceVariant: "lantern"
    }),
    Object.freeze({
      contentId: "shop",
      candidatePositions: Object.freeze([1, 2, 0]),
      routeId: "fern",
      recipientId: "bouncy",
      setPieceVariant: "bridge"
    }),
    Object.freeze({
      contentId: "shed",
      candidatePositions: Object.freeze([2, 0, 1]),
      routeId: "meadow",
      recipientId: "clucky",
      setPieceVariant: "gate"
    })
  ])
});

test("replay is deterministic for one integer seed and ordinal", () => {
  assert.deepEqual(createReplayVariant(deck, 19, 2), createReplayVariant(deck, 19, 2));
  assert.equal(Object.isFrozen(createReplayVariant(deck, 19, 2)), true);
  assert.equal(Object.isFrozen(createReplayVariant(deck, 19, 2).pronunciation), true);
});

test("replay exhausts every audited variant before repeating", () => {
  const firstCycle = deck.variants.map((_, ordinal) => createReplayVariant(deck, 7, ordinal));
  assert.equal(new Set(firstCycle.map(item => item.contentId)).size, deck.variants.length);
  assert.equal(createReplayVariant(deck, 7, deck.variants.length).contentId, firstCycle[0].contentId);
});

test("replay holds target and pronunciation invariant while remixing only audited fields", () => {
  const results = deck.variants.map((_, ordinal) => createReplayVariant(deck, 23, ordinal));
  for (const result of results) {
    assert.equal(result.targetId, "sh");
    assert.deepEqual(result.pronunciation, { key: "sh", ipa: "/ʃ/" });
    assert.deepEqual(Object.keys(result).sort(), [
      "candidatePositions", "contentId", "pronunciation", "recipientId", "routeId",
      "setPieceVariant", "targetId"
    ]);
  }
  assert.throws(() => createReplayVariant({
    ...deck,
    variants: [{ ...deck.variants[0], expectedToken: "sh" }]
  }, 1, 0), /audited replay field/i);
  assert.throws(() => createReplayVariant(deck, 1.5, 0), /integer seed/i);
});

test("replay rejects unsafe identities, pronunciation values, and candidate position shapes", () => {
  for (const malformed of [
    { ...deck, targetId: "" },
    { ...deck, expectedToken: "sh" },
    { ...deck, pronunciation: { key: "", ipa: "/ʃ/" } },
    { ...deck, pronunciation: { key: "sh", expectedToken: "sh" } },
    { ...deck, pronunciation: { key: "sh", nested: { value: undefined } } },
    { ...deck, pronunciation: new Date("2026-09-01T00:00:00.000Z") },
    { ...deck, variants: [{ ...deck.variants[0], contentId: "" }] },
    { ...deck, variants: [{ ...deck.variants[0], routeId: 7 }] },
    { ...deck, variants: [{ ...deck.variants[0], candidatePositions: [0, 0, 2] }] },
    { ...deck, variants: [{ ...deck.variants[0], candidatePositions: [0, 1.5, 2] }] },
    { ...deck, variants: [deck.variants[0], { ...deck.variants[1], candidatePositions: [0, 1] }] }
  ]) assert.throws(() => createReplayVariant(malformed, 4, 0), /replay|pronunciation|position|id/i);
});

test("replay rejects duplicate effective variants before selection", () => {
  assert.throws(() => createReplayVariant({
    ...deck,
    variants: [deck.variants[0], { ...deck.variants[0] }]
  }, 4, 0), /duplicate replay variant/i);
});
