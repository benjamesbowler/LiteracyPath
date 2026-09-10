import test from "node:test";
import assert from "node:assert/strict";
import {
  adventureStars,
  buildAdventureRoundSet,
  buildGardenRounds,
  buildRescueRounds,
  buildSortRounds,
  GARDEN_FLOWERS,
  pickRescueFoils
} from "../../src/utils/adventureRounds.js";

import { hasWordAudio } from "../../src/utils/questAudio.js";

const tiers = ["easy", "medium", "hard"];

test("Word Rescue: every round is winnable with the target among 3 choices", () => {
  for (const tier of tiers) {
    for (let i = 0; i < 5; i += 1) {
      const rounds = buildRescueRounds(tier);
      assert.equal(rounds.length, 36, `${tier}: expected 36 distinct planks`);
      assert.equal(new Set(rounds.map(round => round.word)).size, rounds.length);
      for (const r of rounds) {
        assert.ok(r.choices.includes(r.word), `${tier}: "${r.word}" missing from choices`);
        assert.equal(new Set(r.choices).size, r.choices.length, `${tier}: duplicate choices`);
        assert.ok(r.choices.length >= 2);
      }
    }
  }
});

test("Word Rescue: at least one foil per round is a lookalike (length or first letter)", () => {
  // Random foils could be eliminated by length or first letter, giving the
  // answer away. Every tier's pool is dense enough that at least one of the
  // two foils can always share the target's length or initial.
  for (const tier of tiers) {
    for (let i = 0; i < 10; i += 1) {
      const rounds = buildRescueRounds(tier);
      for (const r of rounds) {
        const foils = r.choices.filter(w => w !== r.word);
        assert.ok(
          foils.some(f => f.length === r.word.length || f[0] === r.word[0]),
          `${tier}: foils ${foils} are all strangers to "${r.word}"`
        );
      }
    }
  }
});

test("Word Rescue: foil picker prefers minimal pairs, then lookalikes", () => {
  // "cap"/"can" are minimal pairs for "cat"; "cow" shares length+initial;
  // "dog" shares only length; "coconut" shares only the initial; "elephant"
  // is a stranger. The two best foils must always win.
  const pool = ["cat", "cap", "can", "cow", "dog", "coconut", "elephant"];
  for (let i = 0; i < 10; i += 1) {
    const foils = pickRescueFoils("cat", pool, 2);
    assert.equal(foils.length, 2);
    assert.ok(foils.every(f => ["cap", "can"].includes(f)), `expected minimal-pair foils, got ${foils}`);
  }
  // With no minimal pairs available, the best remaining lookalikes win.
  const foils = pickRescueFoils("cat", ["cat", "cow", "dog", "elephant"], 2);
  assert.deepEqual(new Set(foils), new Set(["cow", "dog"]));
});

test("Word Rescue: foil picker falls back to strangers so choices are always full", () => {
  const foils = pickRescueFoils("cat", ["cat", "dog", "sun"], 2);
  assert.deepEqual(new Set(foils), new Set(["dog", "sun"]));
  assert.ok(!foils.includes("cat"));
});

test("Sound Sort: every item belongs to exactly one bin, decidable by spelling", () => {
  for (const tier of tiers) {
    for (let i = 0; i < 20; i += 1) {
      const sort = buildSortRounds(tier);
      assert.ok(sort.items.length >= 4, `${tier}: too few items`);
      // Both bins must actually receive words - a sort with an empty bin is a
      // broken game (the child sees two bins but everything goes in one).
      assert.equal(sort.shifts, { easy: 12, medium: 17, hard: 19 }[tier]);
      assert.ok(sort.items.length >= 80);
      for (let shift = 0; shift < sort.shifts; shift++) {
        const items = sort.items.filter(item => item.shift === shift);
        assert.ok(items.some(item => item.bin === item.binA));
        assert.ok(items.some(item => item.bin === item.binB));
        assert.equal(new Set(items.map(item => item.word)).size, items.length);
      }
      for (const item of sort.items) {
        assert.ok(hasWordAudio(item.word), `${item.word}: missing recorded model`);
        assert.ok([item.binA, item.binB].includes(item.bin));
        assert.ok(item.word.startsWith(item.bin), `${tier}: "${item.word}" does not start with its bin "${item.bin}"`);
        // Decidability = longest match wins. A word may only sit in the shorter
        // bin if it does NOT also start with the longer (more specific) bin.
        const other = item.bin === item.binA ? item.binB : item.binA;
        if (other.length > item.bin.length) {
          assert.ok(!item.word.startsWith(other),
            `${tier}: "${item.word}" in bin "${item.bin}" also starts with longer bin "${other}"`);
        }
      }
    }
  }
});

test("Letter Garden: banks always contain every needed letter exactly once each", () => {
  for (const tier of tiers) {
    for (let i = 0; i < 5; i += 1) {
      const rounds = buildGardenRounds(tier);
      assert.equal(rounds.length, GARDEN_FLOWERS.length * 2, `${tier}: every reviewed flower belongs to the outing`);
      assert.equal(new Set(rounds.map(round => round.word)).size, rounds.length);
      for (const r of rounds) {
        assert.ok(r.sourceWord, `${tier}: every round starts from a known word`);
        assert.notEqual(r.sourceWord, r.word, `${tier}: garden must transform the known word`);
        assert.equal([...r.sourceWord].filter((letter, index) => letter !== r.word[index]).length, 1,
          `${tier}: garden transformation changes one letter only`);
        assert.equal(r.changeIndex, [...r.sourceWord].findIndex((letter, index) => letter !== r.word[index]));
        for (const letter of new Set([...r.word])) {
          assert.ok(r.bank.includes(letter), `${tier}: bank for "${r.word}" missing "${letter}"`);
        }
        assert.equal(new Set(r.bank).size, r.bank.length, `${tier}: duplicate bank letters`);
        assert.ok(GARDEN_FLOWERS.includes(r.flower));
        assert.ok(r.plantName, `${tier}: grown plant has a live label`);
      }
    }
  }
});

test("adventure stars follow the 3/2/1/0 rule", () => {
  assert.equal(adventureStars(6, 6, 0), 3);
  assert.equal(adventureStars(6, 6, 2), 2);
  assert.equal(adventureStars(3, 6, 1), 1);
  assert.equal(adventureStars(0, 6, 4), 0);
});

test("restarting an adventure creates a versioned round set for the active mode", () => {
  const first = buildAdventureRoundSet("garden", "easy", 0);
  const restarted = buildAdventureRoundSet("garden", "easy", 1);

  assert.equal(first.version, 0);
  assert.equal(restarted.version, 1);
  assert.equal(first.garden.length, GARDEN_FLOWERS.length * 2);
  assert.equal(restarted.garden.length, GARDEN_FLOWERS.length * 2);
  assert.deepEqual(first.rescue, []);
  assert.equal(first.sort, null);
});
