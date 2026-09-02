import test from "node:test";
import assert from "node:assert/strict";
import { stationsForCycle, sharesSound, onsetGrapheme } from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { strokesForChar } from "../../src/data/letterStrokes.js";
import { CVC_WORDS, RHYMING_PAIRS, SIGHT_WORDS, WORD_FAMILIES, SENTENCE_FIX, SENTENCES } from "../../src/data/learnGamesData.js";

const cycles = elSkillsBlockCycles.filter(c => c.cycleNumber);

// ── Quest: simulate building every station's rounds and assert each round
//    is WINNABLE and well-formed (a child can always finish). ─────────────
test("every quest round in every cycle is winnable and well-formed", () => {
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      for (let pass = 0; pass < 3; pass += 1) {
        const rounds = station.build(cycle);
        assert.ok(rounds.length > 0, `${cycle.id}/${station.id} built no rounds`);
        for (const round of rounds) {
          const where = `${cycle.id}/${station.id}/${round.mechanicId}`;
          if (round.mechanicId === "soundBoxes" || round.mechanicId === "heartWord") {
            assert.match(round.word, /^[a-z]{2,6}$/, `${where} bad build word "${round.word}"`);
            assert.equal(round.graphemes.join(""), round.word, `${where} grapheme boxes do not rebuild the word`);
            continue;
          }
          if (round.mechanicId === "letterTrace") {
            for (const ch of String(round.letter)) {
              assert.ok(strokesForChar(ch), `${where} no strokes for "${ch}"`);
            }
            continue;
          }
          if (round.mechanicId === "patternSort") {
            const fits = (round.items || []).filter(item => item.fits);
            const decoys = (round.items || []).filter(item => !item.fits);
            assert.ok(fits.length >= 2 && decoys.length >= 1, `${where} unsortable pattern round`);
            continue;
          }
          if (round.mechanicId === "wordChain") {
            assert.ok(round.choices.includes(round.answer), `${where} chain answer missing from choices`);
            continue;
          }
          if (round.mechanicId === "phraseFlow") {
            assert.ok(round.phraseChunks.length >= 2, `${where} has no phrase trail`);
            continue;
          }
          if (round.mechanicId === "poemSpotlight") {
            const token = round.tokens[round.targetToken.lineIndex]?.[round.targetToken.tokenIndex];
            assert.equal(token?.normalized, round.answer, `${where} poem target is not in the poem`);
            continue;
          }
          if (round.mechanicId === "coverClue") {
            assert.ok(round.covers.length >= 2, `${where} needs a book rack`);
            assert.equal(round.covers.filter(cover => cover.matches).length, 1, `${where} needs one matching cover`);
            continue;
          }
          if (round.mechanicId === "sceneHunt") {
            assert.ok(round.objects.length >= 3, `${where} needs at least three picture objects`);
            assert.ok(round.objects.some(object => object.matches), `${where} has no object to find`);
            continue;
          }
          // Generic choice rounds: answer present, no duplicate choices,
          // at least 2 choices so it is a real question.
          assert.ok(Array.isArray(round.choices) && round.choices.length >= 2, `${where} too few choices`);
          assert.ok(round.choices.includes(round.answer), `${where} answer "${round.answer}" not in choices ${round.choices}`);
          assert.equal(new Set(round.choices).size, round.choices.length, `${where} duplicate choices ${round.choices}`);
          if (round.prompt) assert.ok(!String(round.prompt).includes('""'), `${where} empty word in prompt: ${round.prompt}`);
        }
      }
    }
  }
});

// ── Arcade data integrity: the pools every game draws from ─────────────────
test("rhyming pairs actually satisfy the game's matching rule", () => {
  for (const [a, b] of RHYMING_PAIRS) {
    assert.ok(a !== b, `pair with itself: ${a}`);
    assert.equal(a.slice(-2), b.slice(-2), `"${a}"/"${b}" do not match on the game's last-2-letters rule`);
  }
});

test("word families: every member ends with its family rime", () => {
  for (const [familyId, words] of Object.entries(WORD_FAMILIES)) {
    const rime = familyId.slice(1).toLowerCase();
    for (const word of words) {
      const lower = word.toLowerCase();
      assert.ok(lower.endsWith(rime), `"${word}" not in family ${familyId}`);
      // Blend & Build derives each word's onset with word.replace(rime, ""),
      // which only works if the rime appears ONCE, at the end. Guard that so a
      // future word like "tartan" in "-an" can't produce a wrong onset.
      assert.ok(!lower.slice(0, lower.length - rime.length).includes(rime),
        `"${word}" repeats rime "${rime}" - onset extraction would be ambiguous`);
    }
  }
});

test("cvc + sight word pools are clean lowercase words with no duplicates", () => {
  for (const [tier, words] of Object.entries(CVC_WORDS)) {
    assert.equal(new Set(words).size, words.length, `duplicates in CVC ${tier}`);
    for (const w of words) assert.match(w, /^[a-z]{2,7}$/, `bad CVC word "${w}" in ${tier}`);
  }
  for (const [level, words] of Object.entries(SIGHT_WORDS)) {
    assert.equal(new Set(words).size, words.length, `duplicates in sight ${level}`);
    for (const w of words) assert.match(w, /^[a-z']{1,20}$/, `bad sight word "${w}" in ${level}`);
  }
});

test("sentence pools: every sentence splits into at least 3 orderable words", () => {
  for (const [level, sentences] of Object.entries(SENTENCES)) {
    for (const s of sentences) {
      const words = s.replace(/[.?!]/g, "").split(/\s+/).filter(Boolean);
      assert.ok(words.length >= 3, `too-short sentence in ${level}: "${s}"`);
    }
  }
});

test("sentence-fix rounds have exactly one marked fix that exists in options", () => {
  for (const [tier, fixes] of Object.entries(SENTENCE_FIX)) {
    for (const fix of fixes) {
      assert.ok(fix.options?.includes(fix.answer), `${tier}: answer "${fix.answer}" not in options`);
      assert.equal(new Set(fix.options).size, fix.options.length, `${tier}: duplicate options`);
    }
  }
});

// ── Curriculum-order rules locked in as tests ─────────────────────────────
import { LETTER_EXAMPLES } from "../../src/data/elSkillsBlockCycles.js";

function taughtSinglesThrough(n) {
  const taught = new Set();
  for (const c of cycles) {
    if (c.cycleNumber > n) continue;
    for (const item of c.focusLetters || []) {
      const raw = (item.spelling || "").toLowerCase();
      for (const part of raw.split(/[\s/,+]+/)) {
        if (/^[a-z]$/.test(part)) taught.add(part);
      }
    }
  }
  return taught;
}

test("word build prefers taught-letter words whenever enough exist", () => {
  for (const cycle of cycles) {
    const taught = taughtSinglesThrough(cycle.cycleNumber);
    const station = stationsForCycle(cycle).find(s => s.id === "build");
    if (!station?.build) continue;
    // Recreate the engine's own precondition: were >=2 taught-only,
    // audio-backed candidates available? Only then is the rule binding
    // (otherwise the engine's documented fallback keeps the station alive).
    const focusParts = (cycle.focusLetters || []).flatMap(item =>
      String(item.spelling || "").toLowerCase().split(/[\s/,+]+/).filter(x => /^[a-z]{1,3}$/.test(x)));
    const pool = focusParts.flatMap(part => (LETTER_EXAMPLES[part] || []).slice(0, 4))
      .filter(w => /^[a-z]{2,5}$/.test(w));
    const taughtOnly = pool.filter(w => [...w].every(l => taught.has(l)));
    if (taughtOnly.length < 2) continue;
    for (let i = 0; i < 3; i += 1) {
      for (const round of station.build(cycle)) {
        const untaught = [...round.word].filter(l => !taught.has(l));
        assert.equal(untaught.length, 0,
          `cycle ${cycle.cycleNumber} builds "${round.word}" using untaught: ${untaught}`);
      }
    }
  }
});

// ── Answer-integrity rules: every round has EXACTLY ONE correct answer ─────
// (These would fail before the phonics-correctness fixes: change-first-sound
//  decoys sharing a rime, c/k and w/wh homophones sharing a sound, and Sound
//  Hunt offering non-initial example words like "six"/"teeth".)

test("Word Play 'change the first sound' rounds have exactly one valid answer", () => {
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      for (let pass = 0; pass < 8; pass += 1) {
        for (const round of station.build(cycle)) {
          if (round.type !== "play" || !/Change the first sound/.test(round.prompt || "")) continue;
          const rime = round.beforeGraphemes.slice(1).join("");
          const sameRime = round.choiceGraphemes.filter(choice => (
            choice.word !== round.beforeWord
            && choice.graphemes.slice(1).join("") === rime
          ));
          assert.equal(sameRime.length, 1,
            `${cycle.id}: "${round.beforeWord}" -> ${sameRime.length} same-rime answers in ${JSON.stringify(round.choices)}`);
        }
      }
    }
  }
});

test("Sound Gate never marks an equivalent spelling wrong", () => {
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      for (let pass = 0; pass < 8; pass += 1) {
        for (const round of station.build(cycle)) {
          if (round.type !== "sound" || round.choiceStyle !== "letter") continue;
          const rejectedEquivalents = round.choices.filter(choice => (
            sharesSound(choice, round.targetGrapheme)
            && !round.acceptedAnswers.includes(choice)
          ));
          assert.equal(rejectedEquivalents.length, 0,
            `${cycle.id}: sound "${round.targetGrapheme}" rejects ${JSON.stringify(rejectedEquivalents)}`);
        }
      }
    }
  }
});

test("Sound Hunt and Sound Sort label every picture by their declared rule", () => {
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      for (let pass = 0; pass < 8; pass += 1) {
        for (const round of station.build(cycle)) {
          if (round.type !== "hunt") continue;
          const expected = round.objects.filter(object => round.variant === "soundSort"
            ? object.word.endsWith(round.targetGrapheme)
            : sharesSound(onsetGrapheme(object.word), round.targetGrapheme));
          assert.ok(expected.length >= 1, `${cycle.id}: ${round.construct} has no correct object`);
          for (const object of round.objects) {
            const shouldMatch = expected.some(item => item.word === object.word);
            assert.equal(object.matches, shouldMatch, `${cycle.id}: ${object.word} is mislabeled`);
          }
        }
      }
    }
  }
});

test("child-facing prompts use consistent 'tap' language, never click/select/press", () => {
  const banned = /\b(click|select|press)\b/i;
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      for (const round of station.build(cycle)) {
        assert.ok(!banned.test(round.prompt || ""),
          `${cycle.id}/${station.id} prompt uses banned verb: "${round.prompt}"`);
      }
    }
  }
});
