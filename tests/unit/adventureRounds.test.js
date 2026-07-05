import test from "node:test";
import assert from "node:assert/strict";
import { buildRescueRounds, buildSortRounds, buildGardenRounds, adventureStars, GARDEN_FLOWERS } from "../../src/utils/adventureRounds.js";

const tiers = ["easy", "medium", "hard"];

test("Word Rescue: every round is winnable with the target among 3 choices", () => {
  for (const tier of tiers) {
    for (let i = 0; i < 5; i += 1) {
      const rounds = buildRescueRounds(tier);
      assert.equal(rounds.length, 6, `${tier}: expected 6 planks`);
      for (const r of rounds) {
        assert.ok(r.choices.includes(r.word), `${tier}: "${r.word}" missing from choices`);
        assert.equal(new Set(r.choices).size, r.choices.length, `${tier}: duplicate choices`);
        assert.ok(r.choices.length >= 2);
      }
    }
  }
});

test("Sound Sort: every item belongs to exactly one bin, decidable by spelling", () => {
  for (const tier of tiers) {
    for (let i = 0; i < 20; i += 1) {
      const sort = buildSortRounds(tier);
      assert.ok(sort.items.length >= 4, `${tier}: too few items`);
      // Both bins must actually receive words - a sort with an empty bin is a
      // broken game (the child sees two bins but everything goes in one).
      const inA = sort.items.filter(it => it.bin === sort.binA).length;
      const inB = sort.items.filter(it => it.bin === sort.binB).length;
      assert.ok(inA > 0 && inB > 0,
        `${tier}: "${sort.binA}"/"${sort.binB}" round has an empty bin (A=${inA}, B=${inB})`);
      for (const item of sort.items) {
        assert.ok([sort.binA, sort.binB].includes(item.bin));
        assert.ok(item.word.startsWith(item.bin), `${tier}: "${item.word}" does not start with its bin "${item.bin}"`);
        // Decidability = longest match wins. A word may only sit in the shorter
        // bin if it does NOT also start with the longer (more specific) bin.
        const other = item.bin === sort.binA ? sort.binB : sort.binA;
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
      assert.equal(rounds.length, 5, `${tier}: expected 5 flowers`);
      for (const r of rounds) {
        for (const letter of new Set([...r.word])) {
          assert.ok(r.bank.includes(letter), `${tier}: bank for "${r.word}" missing "${letter}"`);
        }
        assert.equal(new Set(r.bank).size, r.bank.length, `${tier}: duplicate bank letters`);
        assert.ok(GARDEN_FLOWERS.includes(r.flower));
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
