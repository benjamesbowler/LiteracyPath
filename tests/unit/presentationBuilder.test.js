import test from "node:test";
import assert from "node:assert/strict";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { worldForCycle } from "../../src/utils/palWorlds.js";
import {
  presentationCycleOptions,
  buildCyclePresentation
} from "../../src/utils/present/presentationBuilder.js";

test("cycle options cover the numbered cycles", () => {
  const opts = presentationCycleOptions();
  assert.ok(opts.length >= 27);
  assert.ok(opts.every(o => o.id && o.cycleNumber && o.title));
});

test("a letter cycle deck has letter, writing, sight and poem slides", () => {
  const { html, slideCount } = buildCyclePresentation("cycle-2");
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(slideCount >= 8);
  assert.ok(html.includes("p-letter-slide"), "has a letter-sound slide");
  assert.ok(html.includes("p-writing"), "has a writing slide");
  assert.ok(html.includes("p-sight-slide"), "has a sight word slide");
});

test("PA slides teach the cycle's OWN phonemic-awareness skills", () => {
  // Cycle 2: delete FIRST part of compounds + rhyming recognition.
  const c2 = buildCyclePresentation("cycle-2").html;
  assert.ok(c2.includes("Take the first word away"), "cycle 2 compound-first slide");
  assert.ok(c2.includes("Which two words rhyme?"), "cycle 2 rhyme-identify slide");
  assert.ok(!c2.includes("Keep the first sound, change the ending"), "cycle 2 has no rime-substitution (not taught yet)");
  // Cycle 3: delete LAST part of compounds.
  const c3 = buildCyclePresentation("cycle-3").html;
  assert.ok(c3.includes("Take the last word away"), "cycle 3 compound-last slide");
  // Cycle 9: delete onset + rhyme production.
  const c9 = buildCyclePresentation("cycle-9").html;
  assert.ok(c9.includes("Take the first sound away"), "cycle 9 onset-deletion slide");
  assert.ok(c9.includes("Make a rhyme"), "cycle 9 rhyme-production slide");
  // Cycle 12: delete rime.
  const c12 = buildCyclePresentation("cycle-12").html;
  assert.ok(c12.includes("Keep only the first sound"), "cycle 12 rime-deletion slide");
  // Cycle 19: three-syllable first deletion + rime substitution.
  const c19 = buildCyclePresentation("cycle-19").html;
  assert.ok(c19.includes("Take the first part away"), "cycle 19 syllable-deletion slide");
  assert.ok(c19.includes("Keep the first sound, change the ending"), "cycle 19 rime-substitution slide");
});

test("consecutive cycles sharing a PA skill show different examples", () => {
  const c1 = buildCyclePresentation("cycle-1").html;
  const c2 = buildCyclePresentation("cycle-2").html;
  const takeWord = html => {
    const match = html.match(/Say <b>([a-z]+)<\/b>\. Now say it without/);
    return match ? match[1] : "";
  };
  assert.ok(takeWord(c1) && takeWord(c2), "both cycles have a deletion example");
  assert.notEqual(takeWord(c1), takeWord(c2), "cycle 1 and 2 use different compound words");
});

test("fluency cycle decks drill that cycle's own pattern", () => {
  const c25 = buildCyclePresentation("cycle-25").html;
  const c26 = buildCyclePresentation("cycle-26").html;
  assert.ok(!c25.includes("p-letter-slide"), "no new-letter slides on fluency cycles");
  assert.ok(c25.includes("Pattern power") && c26.includes("Pattern power"));
  assert.ok(c25.includes("end with -ay"), "cycle 25 drills -ay (day/say)");
  assert.ok(c26.includes("end with y"), "cycle 26 drills -y (by/my/why/try)");
  assert.ok(c25.includes("Word chain") && c26.includes("Word chain"));
});

test("the deck's world matches the quest map land for every cycle", () => {
  for (const cycle of elSkillsBlockCycles.filter(c => c.cycleNumber)) {
    const { html } = buildCyclePresentation(cycle.id);
    const world = worldForCycle(cycle.cycleNumber);
    assert.ok(html.includes(`/images/pals/poses/${world.id}-`), `cycle ${cycle.cycleNumber} deck uses ${world.id} art`);
  }
});

test("every numbered cycle builds a deck with a goal slide where goals exist", () => {
  for (const cycle of elSkillsBlockCycles.filter(c => c.cycleNumber)) {
    const { html, slideCount } = buildCyclePresentation(cycle.id);
    assert.ok(slideCount >= 6, `cycle ${cycle.cycleNumber} deck too short`);
    assert.equal((html.match(/class="slide /g) || []).length, slideCount);
    const goals = cycle.sections?.overview?.goals || [];
    if (goals.some(g => /^i can/i.test(g))) {
      assert.ok(html.includes("Today we learn"), `cycle ${cycle.cycleNumber} missing goal slide`);
    }
  }
});

test("deck is deterministic (same cycle = same bytes)", () => {
  assert.equal(buildCyclePresentation("cycle-10").html, buildCyclePresentation("cycle-10").html);
});

test("unknown cycle throws", () => {
  assert.throws(() => buildCyclePresentation("nope"));
});
