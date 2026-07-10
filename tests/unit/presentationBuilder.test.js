import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { worldForCycle } from "../../src/utils/palWorlds.js";
import {
  presentationCycleOptions,
  presentationCycleSummary,
  buildCyclePresentation,
  PRESENTATION_DAYS
} from "../../src/utils/present/presentationBuilder.js";

const numberedCycles = elSkillsBlockCycles.filter(c => c.cycleNumber);
const isFluency = cycle => (cycle.cycleNumber || 0) >= 25;

// Mirror of the builder's focus-card expansion, derived from the raw data:
// how many letter-sound slides each cycle's focusLetters should produce.
function expandedFocusCount(cycle) {
  let count = 0;
  for (const card of cycle.focusLetters || []) {
    const spelling = String(card.spelling || "").toLowerCase();
    const parts = spelling.split(/[\s/,+]+/).filter(p => /^[a-z]{1,3}$/.test(p));
    if (parts.length > 1) count += parts.length;
    else if (/^[a-z]{1,3}$/.test(spelling)) count += 1;
  }
  return count;
}

function taughtSinglesThrough(cycleNumber) {
  const taught = new Set();
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > cycleNumber) continue;
    for (const card of cycle.focusLetters || []) {
      const spelling = String(card.spelling || "").toLowerCase();
      if (/^[a-z]$/.test(spelling)) taught.add(spelling);
    }
  }
  return taught;
}

test("cycle options cover the numbered cycles and the assessment weeks", () => {
  const opts = presentationCycleOptions();
  assert.ok(opts.filter(o => o.cycleNumber).length >= 27, "all 27 numbered cycles listed");
  for (const id of ["boy-assessment", "moy-assessment", "eoy-assessment"]) {
    assert.ok(opts.some(o => o.id === id && o.type === "assessment"), `${id} exposed in the picker`);
  }
  assert.ok(opts.every(o => o.id && o.title && o.label), "every option has id, title and label");
});

test("a letter cycle deck has letter, writing, sight and poem slides", () => {
  const { html, slideCount } = buildCyclePresentation("cycle-2");
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(slideCount >= 8);
  assert.ok(html.includes("p-letter-slide"), "has a letter-sound slide");
  assert.ok(html.includes("p-writing"), "has a writing slide");
  assert.ok(html.includes("p-sight-slide"), "has a sight word slide");
});

test("every focus grapheme gets a letter-sound and writing slide (digraphs and patterns included)", () => {
  // Hard cases first: 15 (sh/ch/th), 16 (a + all), 23 (ng/ang/ing/ong/ung),
  // 24 (the fizzle letters row "ff ss zz ll" splits into four cards).
  const expected = { 15: 3, 16: 2, 17: 1, 23: 5, 24: 4 };
  for (const cycle of numberedCycles) {
    if (isFluency(cycle) || !(cycle.focusLetters || []).length) continue;
    const { html } = buildCyclePresentation(cycle.id);
    const letterSlides = (html.match(/class="slide p-letter-slide"/g) || []).length;
    const writingSlides = (html.match(/class="slide p-writing"/g) || []).length;
    const want = expandedFocusCount(cycle);
    assert.equal(letterSlides, want, `cycle ${cycle.cycleNumber}: one letter-sound slide per focus card`);
    assert.equal(writingSlides, want, `cycle ${cycle.cycleNumber}: one writing slide per focus card`);
    if (expected[cycle.cycleNumber] !== undefined) {
      assert.equal(letterSlides, expected[cycle.cycleNumber], `cycle ${cycle.cycleNumber} exact card count`);
    }
  }
  const c15 = buildCyclePresentation("cycle-15").html;
  assert.ok(c15.includes('<div class="p-letter">sh</div>'), "cycle 15 has an sh slide");
  assert.ok(c15.includes('<div class="p-letter">ch</div>') && c15.includes('<div class="p-letter">th</div>'));
  const c23 = buildCyclePresentation("cycle-23").html;
  for (const pattern of ["ang", "ing", "ong", "ung"]) {
    assert.ok(c23.includes(`<div class="p-letter">${pattern}</div>`), `cycle 23 teaches ${pattern}`);
  }
});

test("review cycles get a tap-to-hear sound wall instead of doubled-letter reteaching", () => {
  for (const id of ["cycle-7", "cycle-14"]) {
    const { html } = buildCyclePresentation(id);
    assert.ok(html.includes("p-sound-review"), `${id} has the sound review wall`);
    assert.ok(!html.includes("p-letter-slide"), `${id} does not re-teach letter slides`);
    assert.ok(!html.includes(">aa<"), `${id} never shows a doubled 'aa' grapheme`);
  }
  const c7 = buildCyclePresentation("cycle-7").html;
  assert.ok(c7.includes(">Aa</button>"), "cycle 7 review wall shows Aa");
});

test("no declared PA skill is ever dropped and no PA example repeats in a deck", () => {
  for (const cycle of numberedCycles) {
    const { html } = buildCyclePresentation(cycle.id);
    const skillIdx = [...new Set([...html.matchAll(/data-pa-skill="(\d+)"/g)].map(m => Number(m[1])))];
    const declared = (cycle.phonemicAwareness || []).length;
    assert.equal(skillIdx.length, declared,
      `cycle ${cycle.cycleNumber}: all ${declared} declared PA skills contribute slides`);
    for (let i = 0; i < declared; i += 1) {
      assert.ok(skillIdx.includes(i), `cycle ${cycle.cycleNumber}: PA skill ${i} present`);
    }
    const keys = [...html.matchAll(/data-pa-key="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(keys).size, keys.length,
      `cycle ${cycle.cycleNumber}: no duplicate PA example (${keys.join(", ")})`);
  }
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
  // Cycle 13 declares TWO skills; the old global cap used to drop the second.
  const c13 = buildCyclePresentation("cycle-13").html;
  assert.ok(c13.includes("Keep only the first sound"), "cycle 13 rime-deletion slide");
  assert.ok(c13.includes("Rhyme time") || c13.includes("Make a rhyme"), "cycle 13 rhyme-review slide survives the cap");
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

test("all of a cycle's high-frequency words get sight-word slides", () => {
  for (const cycle of numberedCycles) {
    const { html } = buildCyclePresentation(cycle.id);
    for (const word of cycle.highFrequencyWords || []) {
      const clean = String(word).toLowerCase();
      assert.ok(html.includes(`<div class="p-sight">${clean}</div>`),
        `cycle ${cycle.cycleNumber}: sight word "${clean}" has a slide`);
    }
  }
  // Regression: cycles with more than 4 HFW used to be truncated. If the
  // curriculum ever declares 5+, they must ALL still appear (checked above);
  // today the largest list is 4 (cycle 26).
  const c26 = buildCyclePresentation("cycle-26").html;
  for (const word of ["by", "my", "why", "try"]) {
    assert.ok(c26.includes(`<div class="p-sight">${word}</div>`), `cycle 26 keeps "${word}"`);
  }
});

test("blend-with-me slides use only letters taught by that cycle", () => {
  for (const cycle of numberedCycles) {
    const { html } = buildCyclePresentation(cycle.id);
    const words = [...html.matchAll(/data-blend-word="([a-z]+)"/g)].map(m => m[1]);
    if (isFluency(cycle)) {
      assert.equal(words.length, 0, `fluency cycle ${cycle.cycleNumber} has no blend slides`);
      continue;
    }
    if (cycle.cycleNumber >= 2) {
      assert.ok(words.length >= 1, `cycle ${cycle.cycleNumber} has at least one blend slide`);
    }
    const taught = taughtSinglesThrough(cycle.cycleNumber);
    for (const word of words) {
      assert.ok([...word].every(letter => taught.has(letter)),
        `cycle ${cycle.cycleNumber}: blend word "${word}" only uses taught letters`);
    }
  }
});

test("every cycle deck shows this cycle's guided-reading books with covers that exist on disk", () => {
  const publicDir = path.resolve("public");
  for (const cycle of numberedCycles) {
    const { html } = buildCyclePresentation(cycle.id);
    assert.ok(html.includes("Our books this cycle"), `cycle ${cycle.cycleNumber} has the books slide`);
    const rec = cycle.guidedReadingRecommendations || {};
    for (const book of [rec.fiction, rec.nonfiction].filter(Boolean)) {
      assert.ok(html.includes(book.title), `cycle ${cycle.cycleNumber} names "${book.title}"`);
    }
    const covers = [...html.matchAll(/class="p-book-cover" src="([^"]+)"/g)].map(m => m[1]);
    assert.ok(covers.length >= 1, `cycle ${cycle.cycleNumber} shows at least one cover`);
    for (const cover of covers) {
      assert.ok(fs.existsSync(path.join(publicDir, cover)),
        `cycle ${cycle.cycleNumber}: cover ${cover} exists on disk`);
    }
  }
});

test("assessment weeks build routine decks", () => {
  const expectations = {
    "boy-assessment": "NWEA MAP BOY",
    "moy-assessment": "NWEA MAP MOY",
    "eoy-assessment": "NWEA MAP EOY"
  };
  for (const [id, routine] of Object.entries(expectations)) {
    const { html, slideCount, title } = buildCyclePresentation(id);
    assert.ok(slideCount >= 3, `${id} builds a deck`);
    assert.ok(html.includes("p-routines"), `${id} lists the week's routines`);
    assert.ok(html.includes(routine), `${id} names its benchmark (${routine})`);
    assert.ok(title.length > 0 && !title.includes("null"), `${id} has a clean title`);
  }
});

test("day decks filter to that day's teaching", () => {
  assert.ok(PRESENTATION_DAYS.some(d => d.value === "" ), "whole-cycle stays the default option");
  const monday = buildCyclePresentation("cycle-4", { day: "monday" }).html;
  const tuesday = buildCyclePresentation("cycle-4", { day: "tuesday" }).html;
  assert.ok(monday.includes('<div class="p-letter">Ff</div>'), "Monday teaches Ff");
  assert.ok(!monday.includes('<div class="p-letter">Dd</div>'), "Monday does not reveal Tuesday's Dd");
  assert.ok(tuesday.includes('<div class="p-letter">Dd</div>'), "Tuesday teaches Dd");
  assert.ok(!tuesday.includes('<div class="p-letter">Ff</div>'), "Tuesday does not repeat Monday's Ff");
  assert.ok(monday.includes('data-pa-skill="0"'), "Monday carries a PA warm-up");
  assert.ok(tuesday.includes('data-pa-skill="1"'), "Tuesday warms up the second PA skill");

  const wednesday = buildCyclePresentation("cycle-4", { day: "wednesday" }).html;
  const thursday = buildCyclePresentation("cycle-4", { day: "thursday" }).html;
  for (const [name, html] of [["Wednesday", wednesday], ["Thursday", thursday]]) {
    assert.ok(html.includes("p-sight-slide"), `${name} practises sight words`);
    assert.ok(html.includes("data-blend-word"), `${name} includes blending review`);
    assert.ok(!html.includes("p-letter-slide"), `${name} teaches no new letter (cycle 4 has none that day)`);
  }

  // Cycle 3's Friday is "Cycle Check": quiz prompts, no new teaching.
  const fridayCheck = buildCyclePresentation("cycle-3", { day: "friday" }).html;
  assert.ok(fridayCheck.includes("p-sound-review"), "Cycle Check Friday quizzes sounds");
  assert.ok(!fridayCheck.includes("p-writing"), "Cycle Check Friday has no writing demo");
  assert.ok(!fridayCheck.includes("p-poem-slide"), "Cycle Check Friday has no new teaching");
  // Cycle 4's Friday is "Cycle Practice": mixed replay including the poem.
  const fridayPractice = buildCyclePresentation("cycle-4", { day: "friday" }).html;
  assert.ok(fridayPractice.includes("p-letter-slide"), "Cycle Practice Friday replays the sounds");
  assert.ok(fridayPractice.includes("p-poem-slide"), "Cycle Practice Friday replays the poem");

  // Cycle 11 teaches a third grapheme on Wednesday - the Wednesday deck carries it.
  const c11Wed = buildCyclePresentation("cycle-11", { day: "wednesday" }).html;
  assert.ok(c11Wed.includes('<div class="p-letter">Xx</div>'), "cycle 11 Wednesday teaches Xx");
});

test("the deck's world matches the quest map land for every cycle", () => {
  for (const cycle of numberedCycles) {
    const { html } = buildCyclePresentation(cycle.id);
    const world = worldForCycle(cycle.cycleNumber);
    assert.ok(html.includes(`/images/pals/poses/${world.id}-`), `cycle ${cycle.cycleNumber} deck uses ${world.id} art`);
  }
});

test("every numbered cycle builds a deck with a goal slide where goals exist", () => {
  for (const cycle of numberedCycles) {
    const { html, slideCount } = buildCyclePresentation(cycle.id);
    assert.ok(slideCount >= 6, `cycle ${cycle.cycleNumber} deck too short`);
    assert.equal((html.match(/class="slide /g) || []).length, slideCount);
    const goals = cycle.sections?.overview?.goals || [];
    if (goals.some(g => /^i can/i.test(g))) {
      assert.ok(html.includes("Today we learn"), `cycle ${cycle.cycleNumber} missing goal slide`);
    }
  }
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

test("deck is deterministic (same cycle + same day = same bytes)", () => {
  assert.equal(buildCyclePresentation("cycle-10").html, buildCyclePresentation("cycle-10").html);
  assert.equal(
    buildCyclePresentation("cycle-10", { day: "monday" }).html,
    buildCyclePresentation("cycle-10", { day: "monday" }).html
  );
  // Building another world's deck in between must not contaminate the next
  // build (the world is threaded as a parameter, not module state).
  const before = buildCyclePresentation("cycle-2").html;
  buildCyclePresentation("cycle-20");
  assert.equal(buildCyclePresentation("cycle-2").html, before);
});

test("unknown cycle or day throws", () => {
  assert.throws(() => buildCyclePresentation("nope"));
  assert.throws(() => buildCyclePresentation("cycle-2", { day: "someday" }), /Unknown presentation day/);
});

test("decks contain no emoji and keep offline font fallbacks", () => {
  const emoji = /[\u{1F000}-\u{1FAFF}]|\u{FE0F}|[\u{25B6}\u{270F}\u{1F4A1}\u{1F50A}]/u;
  for (const id of ["cycle-2", "cycle-15", "cycle-25", "boy-assessment"]) {
    const { html } = buildCyclePresentation(id);
    assert.ok(!emoji.test(html), `${id} deck is emoji-free`);
    assert.ok(html.includes("'Arial Rounded MT Bold'"), `${id} deck has a system-font fallback stack`);
    assert.ok(html.includes("fonts.googleapis.com"), `${id} deck keeps the webfont as enhancement`);
  }
});

test("the picker summary line is built from the cycle's own data", () => {
  const summary = presentationCycleSummary("cycle-4");
  assert.ok(summary.includes("Cycle 4"), "names the cycle");
  assert.ok(summary.includes("Ff") && summary.includes("Dd"), "names the graphemes");
  assert.ok(summary.includes("2 sight words"), "counts the sight words");
  assert.ok(summary.includes("poem:"), "names the poem");
});
