import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { worldForCycle } from "../../src/utils/palWorlds.js";
import {
  presentationCycleOptions,
  presentationCycleDisplayTitle,
  presentationCycleSummary,
  buildCyclePresentation,
  presentationSlideIndex,
  PRESENTATION_DAYS,
  PRESENTATION_SECTIONS
} from "../../src/utils/present/presentationBuilder.js";

// The redesigned deck sizes each grapheme against its fixed circle, so the
// letter is a styled <span>, not a bare <div>. Match on class + content and
// stay agnostic about the computed font-size.
function letterSlideFor(html, grapheme) {
  return new RegExp(`class="p-letter"[^>]*>${grapheme}</span>`).test(html);
}

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
  assert.deepEqual(
    opts.filter(option => option.type === "assessment").map(option => option.label),
    [
      "Beginning of year assessment",
      "Middle of year assessment",
      "End of year assessment"
    ]
  );
  assert.ok(opts.every(option => !/\b(?:BOY|MOY|EOY)\b/.test(option.label)));
});

test("assessment-week titles and slides never expose year-window abbreviations", () => {
  for (const id of ["boy-assessment", "moy-assessment", "eoy-assessment"]) {
    const cycle = elSkillsBlockCycles.find(row => row.id === id);
    const { html, title } = buildCyclePresentation(id);
    assert.match(presentationCycleDisplayTitle(cycle), /year assessment$/);
    assert.doesNotMatch(`${title}\n${html}`, /\b(?:BOY|MOY|EOY)\b/);
  }
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
  assert.ok(letterSlideFor(c15, "sh"), "cycle 15 has an sh slide");
  assert.ok(letterSlideFor(c15, "ch") && letterSlideFor(c15, "th"));
  const c23 = buildCyclePresentation("cycle-23").html;
  for (const pattern of ["ang", "ing", "ong", "ung"]) {
    assert.ok(letterSlideFor(c23, pattern), `cycle 23 teaches ${pattern}`);
  }
});

test("wide graphemes step their font size down so they stay inside the circle", () => {
  // Ww/Mm are ~40% wider than Bb at the same point size and used to overflow.
  const sizeFor = (html, grapheme) => {
    const match = html.match(new RegExp(`font-size:(\\d+)px">${grapheme}</span>`));
    return match ? Number(match[1]) : 0;
  };
  const c8 = buildCyclePresentation("cycle-8").html;   // teaches Bb AND Ww
  const wide = sizeFor(c8, "Ww");
  const narrow = sizeFor(c8, "Bb");
  assert.ok(wide > 0 && narrow > 0, "both graphemes carry an explicit size");
  assert.ok(wide < narrow, `Ww (${wide}px) renders smaller than Bb (${narrow}px)`);
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
  assert.ok(c2.includes("Two of these rhyme. Which one does not?"), "cycle 2 rhyme-identify slide");
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
      const clean = String(word);
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
    assert.ok(html.includes("Reading this week"), `cycle ${cycle.cycleNumber} has the books slide`);
    const rec = cycle.guidedReadingRecommendations || {};
    for (const book of [rec.fiction, rec.nonfiction].filter(Boolean)) {
      assert.ok(html.includes(book.title), `cycle ${cycle.cycleNumber} names "${book.title}"`);
    }
    const covers = [...html.matchAll(/class="p-book-cover washed" src="([^"]+)"/g)].map(m => m[1]);
    assert.ok(covers.length >= 1, `cycle ${cycle.cycleNumber} shows at least one cover`);
    for (const cover of covers) {
      assert.ok(fs.existsSync(path.join(publicDir, cover)),
        `cycle ${cycle.cycleNumber}: cover ${cover} exists on disk`);
    }
  }
});

test("every mascot pose a deck references exists on disk (the missing-point-pose fix)", () => {
  const publicDir = path.resolve("public");
  const ids = [...numberedCycles.map(c => c.id), "boy-assessment", "moy-assessment", "eoy-assessment"];
  for (const id of ids) {
    const { html } = buildCyclePresentation(id);
    const poses = [...html.matchAll(/src="(\/images\/pals\/poses\/[^"]+)"/g)].map(m => m[1]);
    assert.ok(poses.length >= 1, `${id} shows the mascot somewhere`);
    for (const pose of poses) {
      assert.ok(fs.existsSync(path.join(publicDir, pose)), `${id}: ${pose} exists on disk`);
    }
  }
});

test("the slide index mirrors the deck it was parsed from", () => {
  for (const id of ["cycle-2", "cycle-15", "cycle-26", "boy-assessment"]) {
    const { slideCount } = buildCyclePresentation(id);
    const index = presentationSlideIndex(id);
    assert.equal(index.length, slideCount, `${id}: one index entry per slide`);
    index.forEach((entry, n) => {
      assert.equal(entry.index, n, `${id}: entries are in deck order`);
      assert.ok(entry.cls, `${id}: every entry names its slide class`);
      assert.ok(entry.section === "" || PRESENTATION_SECTIONS.includes(entry.section),
        `${id}: section "${entry.section}" is in the rail vocabulary`);
    });
  }
  const monday = presentationSlideIndex("cycle-4", { day: "monday" });
  assert.equal(monday.length, buildCyclePresentation("cycle-4", { day: "monday" }).slideCount);
});

test("every slide that declares a timer renders its thinking-time dial", () => {
  for (const cycle of numberedCycles) {
    const { html } = buildCyclePresentation(cycle.id);
    const timerSlides = (html.match(/data-timer="/g) || []).length;
    const dials = (html.match(/data-timer-start/g) || []).length;
    assert.equal(dials, timerSlides,
      `cycle ${cycle.cycleNumber}: ${timerSlides} timer slide(s) need ${timerSlides} dial(s), found ${dials}`);
    if ((cycle.phonemicAwareness || []).length) {
      assert.ok(timerSlides >= 1, `cycle ${cycle.cycleNumber}: warm-ups carry thinking time`);
    }
  }
});

test("teaching decks carry the everyone-together call-and-response slide", () => {
  for (const id of ["cycle-2", "cycle-10", "cycle-26"]) {
    const { html } = buildCyclePresentation(id);
    assert.ok(html.includes("p-together"), `${id} has the together slide`);
    assert.ok(html.includes("Everyone together"), `${id} labels it for the class`);
  }
  // Different days pick different call-and-response lines where the cycle has
  // more than one - Monday and Tuesday must not chant the same prompt.
  const monday = buildCyclePresentation("cycle-2", { day: "monday" }).html;
  const tuesday = buildCyclePresentation("cycle-2", { day: "tuesday" }).html;
  const prompt = html => /p-h1-invert">([^<]+)</.exec(html)?.[1] || "";
  assert.ok(prompt(monday), "Monday has a together prompt");
  assert.notEqual(prompt(monday), prompt(tuesday), "Tuesday rotates to the next prompt");
});

test("assessment weeks build routine decks", () => {
  const expectations = {
    "boy-assessment": "NWEA MAP beginning of year",
    "moy-assessment": "NWEA MAP middle of year",
    "eoy-assessment": "NWEA MAP end of year"
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
  assert.ok(letterSlideFor(monday, "Ff"), "Monday teaches Ff");
  assert.ok(!letterSlideFor(monday, "Dd"), "Monday does not reveal Tuesday's Dd");
  assert.ok(letterSlideFor(tuesday, "Dd"), "Tuesday teaches Dd");
  assert.ok(!letterSlideFor(tuesday, "Ff"), "Tuesday does not repeat Monday's Ff");
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
  assert.ok(letterSlideFor(c11Wed, "Xx"), "cycle 11 Wednesday teaches Xx");
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

test("decks contain no emoji, make no Google font request, and keep offline font fallbacks", () => {
  const emoji = /[\u{1F000}-\u{1FAFF}]|\u{FE0F}|[\u{25B6}\u{270F}\u{1F4A1}\u{1F50A}]/u;
  for (const id of ["cycle-2", "cycle-15", "cycle-25", "boy-assessment"]) {
    const { html } = buildCyclePresentation(id);
    assert.ok(!emoji.test(html), `${id} deck is emoji-free`);
    assert.ok(html.includes("'Arial Rounded MT Bold'"), `${id} deck has a system-font fallback stack`);
    assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html), `${id} deck is offline-safe`);
  }
});

test("the picker summary line is built from the cycle's own data", () => {
  const summary = presentationCycleSummary("cycle-4");
  assert.ok(summary.includes("Cycle 4"), "names the cycle");
  assert.ok(summary.includes("Ff") && summary.includes("Dd"), "names the graphemes");
  assert.ok(summary.includes("2 sight words"), "counts the sight words");
  assert.ok(summary.includes("poem:"), "names the poem");
});


test("all 135 daily lessons have five activity budgets totalling 15 minutes", () => {
  for (const cycle of numberedCycles) {
    for (const day of PRESENTATION_DAYS.filter(d => d.value)) {
      const { html, lessonPlan } = buildCyclePresentation(cycle.id, { day: day.value });
      assert.equal(lessonPlan.minutes, 15);
      assert.equal(lessonPlan.blocks.reduce((sum, b) => sum + b.minutes, 0), 15);
      assert.equal((html.match(/data-block-start="1"/g) || []).length, 5, `${cycle.id} ${day.value}`);
      assert.match(html, /p-word-recall/);
      assert.match(html, /p-exit-check/);
      assert.equal(presentationSlideIndex(cycle.id, { day: day.value }).length, (html.match(/<section /g) || []).length);
    }
  }
});

test("warm-ups vary across the week and spelling answers stay hidden until requested", () => {
  const monday = buildCyclePresentation("cycle-3", { day: "monday" }).html;
  const thursday = buildCyclePresentation("cycle-3", { day: "thursday" }).html;
  const keys = html => [...html.matchAll(/data-pa-key="([^"]+)"/g)].map(m => m[1]);
  assert.notDeepEqual(keys(monday), keys(thursday));
  assert.match(thursday, /p-answer \{ visibility: hidden/);
  assert.match(thursday, /Say the word. Stretch it. Write it./);
  assert.match(thursday, /Tiny can rest in the/);
  assert.match(buildCyclePresentation("cycle-1", { day: "tuesday" }).html, /class="p-sight">I</);
});

test("day plans retain assigned new-letter days and do not turn assessment weeks into lessons", () => {
  for (const cycle of numberedCycles) {
    const week = PRESENTATION_DAYS.filter(d => d.value).map(d => buildCyclePresentation(cycle.id, { day: d.value }).html).join("\n");
    for (const word of cycle.highFrequencyWords) assert.ok(week.includes(`<div class="p-sight">${word}</div>`));
  }
  assert.equal(buildCyclePresentation("boy-assessment", { day: "monday" }).lessonPlan, null);
});


test("pattern lessons practise their own spellings and shared writing reveals a complete model", () => {
  for (const [cycle, word] of [[15, "ship"], [16, "ball"], [21, "when"], [22, "sink"], [23, "bang"], [24, "will"]]) {
    const html = buildCyclePresentation(`cycle-${cycle}`, { day: "thursday" }).html;
    assert.ok(html.includes(`data-pattern-word="${word}"`), `cycle ${cycle} reads ${word}`);
  }
  const html = buildCyclePresentation("cycle-15", { day: "thursday" }).html;
  assert.match(html, /Honky dreams about a ship\./);
  assert.doesNotMatch(html, /Honky dreams about a a ship/);
});
