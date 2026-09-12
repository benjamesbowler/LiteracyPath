import test from "node:test";
import assert from "node:assert/strict";
import { stationsForCycle, sharesSound, onsetGrapheme } from "../../src/components/elQuest/elQuestEngine.js";
import {
  chooseSimpleAnswer,
  collectTarget,
  createCollection,
  createMemory,
  flipMemoryCard
} from "../../src/components/elQuest/mechanics/simpleMechanicState.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
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
          if (["letterGrid", "sceneHunt", "pictureSearch"].includes(round.mechanicId)) {
            const items = round.cells || round.objects;
            assert.ok(items.length >= 3, `${where} needs a searchable set`);
            assert.ok(items.some(item => !item.matches), `${where} has no distractor`);
            const targets = items.filter(item => item.matches);
            assert.ok(targets.length > 0, `${where} has no target to find`);
            let state = createCollection();
            let outcome;
            for (const item of targets) {
              ({ state, outcome } = collectTarget(state, round, String(item.id ?? item.word)));
            }
            assert.equal(state.complete, true, `${where} cannot finish its collection`);
            assert.equal(outcome?.correct, true, `${where} never records the finished collection`);
            continue;
          }
          if (round.mechanicId === "wordMemory") {
            assert.ok(round.cards.length >= 4, `${where} needs at least two pairs`);
            const pairs = new Map();
            for (const card of round.cards) {
              pairs.set(card.word, [...(pairs.get(card.word) || []), card.id]);
            }
            let state = createMemory();
            let outcome;
            for (const [word, cardIds] of pairs) {
              assert.equal(cardIds.length, 2, `${where} has an unmatched ${word} card`);
              for (const id of cardIds) ({ state, outcome } = flipMemoryCard(state, round, id));
            }
            assert.equal(state.complete, true, `${where} cannot finish its pairs`);
            assert.equal(outcome?.correct, true, `${where} never records the completed game`);
            continue;
          }
          assert.ok(["letterPair", "soundChoice", "missingLetter", "rhymePair", "rhymeOdd", "compoundPicture"].includes(round.mechanicId),
            `${where} uses an unsupported mechanic`);
          assert.ok(Array.isArray(round.choices) && round.choices.length >= 2, `${where} too few choices`);
          assert.equal(new Set(round.choices).size, round.choices.length, `${where} duplicate choices`);
          const answer = round.mechanicId === "missingLetter" ? round.missingGrapheme : round.answer;
          for (const target of Array.isArray(answer) ? answer : [answer]) {
            assert.ok(round.choices.includes(target), `${where} answer "${target}" is missing from choices`);
          }
          assert.equal(chooseSimpleAnswer(round, answer).correct, true, `${where} cannot accept its answer`);
          if (round.prompt) assert.ok(!String(round.prompt).includes('""'), `${where} empty word in prompt`);
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

test("missing-letter rounds rebuild their pictured word with one direct choice", () => {
  let checked = 0;
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      for (const round of station.build?.(cycle) || []) {
        if (round.mechanicId !== "missingLetter") continue;
        const where = `${cycle.id}/${station.id}`;
        assert.match(round.word, /^[a-z]{3}$/, `${where} must use a CVC word`);
        assert.ok([0, 2].includes(round.missingIndex), `${where} must practise the start or end sound`);
        assert.equal(round.graphemes.join(""), round.word);
        assert.equal(round.missingGrapheme, round.graphemes[round.missingIndex]);
        assert.equal(chooseSimpleAnswer(round, round.missingGrapheme).correct, true);
        const wrong = round.choices.find(choice => choice !== round.missingGrapheme);
        assert.equal(chooseSimpleAnswer(round, wrong).correct, false);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 0, "the active curriculum must include CVC completion");
});

test("Sound Match never marks an equivalent spelling wrong", () => {
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      for (let pass = 0; pass < 8; pass += 1) {
        for (const round of station.build(cycle)) {
          if (round.mechanicId !== "soundChoice") continue;
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

test("sound-picture games label every picture by their declared rule", () => {
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      for (let pass = 0; pass < 8; pass += 1) {
        for (const round of station.build(cycle)) {
          if (!["sceneHunt", "pictureSearch"].includes(round.mechanicId)) continue;
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
