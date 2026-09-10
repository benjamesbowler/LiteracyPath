import test from "node:test";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import {
  acceptedRepairAnswers,
  completedSentenceForRepair,
  isAcceptedRepairAnswer,
  starGalleryLadder,
  starGalleryStars,
  starGalleryPicture
} from "../../src/utils/starGalleryRounds.js";

test("starGalleryLadder returns 10 levels for every difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    assert.equal(starGalleryLadder(difficulty).length, 10);
  }
});

test("Sentence Grove levels are winnable and have unique sentence choices", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const seen = new Set();
    for (const level of starGalleryLadder(difficulty)) {
      assert.equal(level.items.length, 4, `${difficulty}/${level.level} should have four sentence gates`);
      for (const item of level.items) {
        assert.equal(item.repairs.length, 1, `${item.id} should expose one sentence prompt`);
        const repair = item.repairs[0];
        const key = `${repair.prompt}|${repair.display}|${repair.answer}`;
        assert.ok(!seen.has(key), `${difficulty} repeated sentence prompt ${key}`);
        seen.add(key);
        assert.ok(repair.cue, `${item.id} needs a visual cue`);
        assert.ok(repair.options.includes(repair.answer), `${item.id} answer missing from options`);
        assert.equal(new Set(repair.options).size, repair.options.length, `${item.id} duplicate options`);
        assert.ok(repair.options.length >= 3, `${item.id} needs at least three choices`);
      }
    }
  }
});

test("Sentence Grove maps difficulty to arcade worlds and ramps speed", () => {
  assert.equal(starGalleryLadder("easy")[0].world, "meadow");
  assert.equal(starGalleryLadder("medium")[0].world, "dino");
  assert.equal(starGalleryLadder("hard")[0].world, "moonwood");

  for (const difficulty of ["easy", "medium", "hard"]) {
    const ladder = starGalleryLadder(difficulty);
    for (let index = 1; index < ladder.length; index += 1) {
      assert.ok(ladder[index].driftSpeed > ladder[index - 1].driftSpeed, `${difficulty} speed did not ramp`);
    }
  }
});

test("Sentence Grove gives ambiguous sound blanks a picture cue", () => {
  const firstEasyLevel = starGalleryLadder("easy")[0];
  const shipRepair = firstEasyLevel.items
    .flatMap(item => item.repairs)
    .find(repair => repair.id === "sound-ship");

  assert.equal(shipRepair.display, "sh__p");
  assert.equal(shipRepair.cue, "ship");
});

test("Sentence Grove starts with a complete sentence repair", () => {
  const firstRepair = starGalleryLadder("easy")[0].items[0].repairs[0];

  assert.equal(firstRepair.cue, "cat");
  assert.equal(firstRepair.display, "__ cat sat on the mat.");
  assert.equal(firstRepair.completedSentence, "The cat sat on the mat.");
  assert.equal(completedSentenceForRepair(firstRepair), "The cat sat on the mat.");
  assert.equal(firstRepair.answer, "The");
  assert.ok(firstRepair.options.includes("The"));
});

test("every authored repair has a valid blank, completed output, and reviewed answer set", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of starGalleryLadder(difficulty)) {
      for (const item of level.items) {
        const repair = item.repairs[0];
        assert.equal(repair.completedSentence, completedSentenceForRepair(repair), item.id);
        assert.doesNotMatch(repair.completedSentence, /__/u, `${item.id} leaves a blank in its completed output`);
        assert.ok(acceptedRepairAnswers(repair).length > 0, `${item.id} needs an accepted answer set`);
        for (const answer of acceptedRepairAnswers(repair)) {
          assert.ok(repair.options.includes(answer), `${item.id} must present accepted answer ${answer}`);
          assert.equal(isAcceptedRepairAnswer(repair, answer), true);
        }
      }
    }
  }

  const pairedQuote = starGalleryLadder("medium")[0].items
    .map(item => item.repairs[0])
    .find(repair => repair.id === "punct-quote");
  assert.deepEqual(acceptedRepairAnswers(pairedQuote), ['"', "'"]);
  assert.equal(pairedQuote.completedSentence, '"Hello!"');
  assert.equal(completedSentenceForRepair(pairedQuote, "'"), "'Hello!'");
});

test("Sentence Grove capital and sentence-starter prompts use whole-word blanks", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of starGalleryLadder(difficulty)) {
      for (const item of level.items) {
        const repair = item.repairs[0];
        if (repair.category !== "capital" && !/sentence starter/i.test(repair.prompt)) continue;

        assert.notEqual(repair.prompt, "Choose the capital letter", `${item.id} should not ask for a bare partial-letter fix`);
        if (repair.display.includes("__")) {
          assert.match(repair.display, /__\s/, `${item.id} should blank a whole word, not part of a word`);
          assert.doesNotMatch(repair.display, /__\p{L}/u, `${item.id} leaves an ambiguous partial-word blank`);
          const completed = repair.display.replace("__", repair.answer);
          assert.match(completed, /^[A-Z]/, `${item.id} should complete to a capitalised sentence`);
          assert.match(completed, /[.!?]$/, `${item.id} should complete to a punctuated sentence`);
        }
      }
    }
  }
});

test("Sentence Grove does not overuse The in easy starter rounds", () => {
  const starterAnswers = starGalleryLadder("easy")
    .map(level => level.items[0].repairs[0].answer);
  const counts = starterAnswers.reduce((totals, answer) => {
    totals[answer] = (totals[answer] || 0) + 1;
    return totals;
  }, {});

  assert.ok(new Set(starterAnswers).size >= 5, "easy starter answers should feel varied");
  assert.ok((counts.The || 0) <= 2, "easy starter rounds should not keep asking for The");
  for (const [answer, count] of Object.entries(counts)) {
    assert.ok(count <= 3, `${answer} is overused in easy starter rounds`);
  }
});

test("starGalleryStars follows the shared star rubric", () => {
  assert.equal(starGalleryStars({ correct: 0, total: 8, mistakes: 0 }), 0);
  assert.equal(starGalleryStars({ correct: 8, total: 8, mistakes: 0 }), 3);
  assert.equal(starGalleryStars({ correct: 6, total: 8, mistakes: 4 }), 2);
  assert.equal(starGalleryStars({ correct: 2, total: 8, mistakes: 7 }), 1);
});

test("Sentence Grove punctuation specifies the intended tone or mark across the ladder", () => {
  const repairs = ["easy", "medium", "hard"].flatMap(difficulty =>
    starGalleryLadder(difficulty).flatMap(level => level.items.flatMap(item => item.repairs))
  ).filter(repair => repair.category === "punctuation");
  const endings = repairs.filter(repair => repair.options.every(option => [".", "?", "!"].includes(option)));
  assert.ok(endings.length > 0);
  for (const repair of endings) {
    const intended = repair.answer === "?" ? /question/i
      : repair.answer === "!" ? /strong feeling.*exclamation/i
        : /calm (?:telling sentence|command)/i;
    assert.match(repair.prompt, intended, repair.id);
  }
  for (const id of ["punct-read", "punct-home"]) {
    assert.match(repairs.find(repair => repair.id === id).prompt, /calm command/i);
  }
  assert.match(repairs.find(repair => repair.id === "semicolon").prompt, /semicolon/i);
  const quoteOpen = repairs.find(repair => repair.id === "quote-open");
  assert.match(quoteOpen.prompt, /match the closing/i);
  assert.equal(completedSentenceForRepair(quoteOpen), '"I found it!"');
  const pairedQuotes = repairs.find(repair => repair.id === "punct-quote");
  assert.deepEqual(acceptedRepairAnswers(pairedQuotes), ['"', "'"]);
});


test("Sentence Grove pictures resolve committed word assets without token URLs or unrelated fallbacks", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of starGalleryLadder(difficulty)) for (const item of level.items) for (const repair of item.repairs) {
      const picture = starGalleryPicture(repair);
      if (repair.category === "short vowel") assert.ok(picture, repair.id);
      if (picture) {
        assert.ok(picture.src.startsWith("/"), repair.id);
        assert.ok(existsSync(`public${picture.src}`), `${repair.id}: ${picture.src}`);
        assert.ok(picture.alt && !picture.alt.startsWith("/"), repair.id);
      }
    }
  }
  assert.equal(starGalleryPicture({ cue: "not-an-authored-word" }), null);
  assert.match(starGalleryPicture({ cue: "cat" }).src, /cat\.webp$/);
});
