import test from "node:test";
import assert from "node:assert/strict";
import { stationsForCycle } from "../../src/components/elQuest/elQuestEngine.js";
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
          const where = `${cycle.id}/${station.id}/${round.type}`;
          if (round.type === "build") {
            assert.match(round.word, /^[a-z]{2,6}$/, `${where} bad build word "${round.word}"`); // Word Build is 2-5 (own test); Spell It allows 6
            assert.ok(round.audio, `${where} build round without audio for "${round.word}"`);
            continue;
          }
          if (round.type === "trace") {
            for (const ch of String(round.letter)) {
              assert.ok(strokesForChar(ch), `${where} no strokes for "${ch}"`);
            }
            continue;
          }
          if (round.type === "pattern") {
            const fits = (round.items || []).filter(item => item.fits);
            const decoys = (round.items || []).filter(item => !item.fits);
            assert.ok(fits.length >= 2 && decoys.length >= 1, `${where} unsortable pattern round`);
            continue;
          }
          if (round.type === "chain") {
            assert.ok(round.choices.includes(round.answer), `${where} chain answer missing from choices`);
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
      assert.ok(word.toLowerCase().endsWith(rime), `"${word}" not in family ${familyId}`);
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
    for (const w of words) assert.match(w, /^[a-zA-Z]{1,8}$/, `bad sight word "${w}" in ${level}`);
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
