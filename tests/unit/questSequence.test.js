import { test } from "node:test";
import assert from "node:assert/strict";
import {
  QUEST_STOPS,
  QUEST_ACTS,
  QUEST_SHELL_IDS,
  TOTAL_STOPS,
  getStop,
  stopsForAct,
  targetsAtStop,
  taughtThrough,
  heartWordsThrough,
  wordsThrough,
  NEEDS_AUDIO
} from "../../src/data/questSequence.js";
import { isDecodable, untaughtGraphemes } from "../../src/utils/questSegments.js";

test("the trail is 40 stops across 3 acts, indexed 1..40 with no gaps", () => {
  assert.equal(TOTAL_STOPS, 40);
  assert.equal(QUEST_ACTS.length, 3);
  QUEST_STOPS.forEach((stop, i) => {
    assert.equal(stop.index, i + 1, `stop ${stop.id} is out of order`);
  });
  assert.equal(stopsForAct(1).length, 8);
  assert.equal(stopsForAct(2).length, 9);
  assert.equal(stopsForAct(3).length, 23);
});

test("stop ids and names are unique", () => {
  const ids = QUEST_STOPS.map(s => s.id);
  const names = QUEST_STOPS.map(s => s.name);
  assert.equal(new Set(ids).size, ids.length, "duplicate stop id");
  assert.equal(new Set(names).size, names.length, "duplicate stop name");
});

test("no sound is taught twice", () => {
  const seen = new Map();
  for (const stop of QUEST_STOPS) {
    for (const entry of stop.teach) {
      assert.ok(!seen.has(entry.id), `${entry.id} taught at both ${seen.get(entry.id)} and ${stop.id}`);
      seen.set(entry.id, stop.id);
    }
  }
});

test("EVERY word at EVERY stop is decodable with only the sounds taught so far", () => {
  // This is the check that stops a designer sneaking `ai` into stop 3. It is the
  // single most important assertion in the content layer: a word a child cannot
  // sound out is not practice, it is a guessing game.
  for (const stop of QUEST_STOPS) {
    const known = taughtThrough(stop.index);
    for (const word of stop.words) {
      assert.ok(
        isDecodable(word, known),
        `${stop.id} "${stop.name}": "${word}" needs ${untaughtGraphemes(word, known).join(", ")} which is not taught by stop ${stop.index}`
      );
    }
  }
});

test("every stop offers at least minWords words", () => {
  for (const stop of QUEST_STOPS) {
    assert.ok(
      stop.words.length >= stop.minWords,
      `${stop.id} has ${stop.words.length} words, needs ${stop.minWords}`
    );
  }
});

test("heart words are NOT required to be decodable — that is what makes them heart words", () => {
  // "the" is only a heart word because th isn't taught until stop 10. If this
  // ever became decodable-by-rule, we'd be teaching it in the wrong place.
  const knownAtStop3 = taughtThrough(3);
  assert.equal(isDecodable("the", knownAtStop3), false);
  assert.ok(heartWordsThrough(3).includes("the"));
});

test("blends and alt pronunciations add NOTHING to the decodable set", () => {
  // A blend is two letters the child already owns; an alt is a second sound for
  // a spelling they already own. Neither unlocks a new spelling, so neither may
  // widen what counts as decodable — or "spin" would look legal before `s`.
  const before = taughtThrough(11); // last stop before the blend runs
  const afterBlends = taughtThrough(15);
  assert.deepEqual([...before].sort(), [...afterBlends].sort(), "blend stops must not add graphemes");

  const beforeAlt = taughtThrough(15);
  const afterAlt = taughtThrough(16); // s16 teaches y as /ie/ and y as /ee/
  assert.deepEqual([...beforeAlt].sort(), [...afterAlt].sort(), "alt stops must not add graphemes");
});

test("the taught set grows monotonically and never loses a sound", () => {
  let previous = new Set();
  for (let i = 1; i <= TOTAL_STOPS; i += 1) {
    const known = taughtThrough(i);
    for (const g of previous) {
      assert.ok(known.has(g), `stop ${i} lost the sound ${g}`);
    }
    previous = known;
  }
  // a-z + qu + the doubles by the end of Act I. `q` is deliberately NOT taught
  // on its own: q never appears without u in English, so the grapheme is `qu`.
  const actI = taughtThrough(8);
  for (const letter of "abcdefghijklmnoprstuvwxyz") {
    assert.ok(actI.has(letter), `Act I should teach ${letter}`);
  }
  assert.equal(actI.has("q"), false, "q is never taught alone — the grapheme is qu");
  assert.ok(actI.has("qu") && actI.has("ff") && actI.has("ll") && actI.has("ss") && actI.has("zz"));
});

test("the trail reaches the whole advanced code", () => {
  const end = taughtThrough(TOTAL_STOPS);
  for (const g of ["a_e", "i_e", "o_e", "u_e", "e_e"]) assert.ok(end.has(g), `missing split digraph ${g}`);
  for (const g of ["ai", "ay", "ee", "ea", "igh", "oa", "oo", "ou", "oi", "oy"]) assert.ok(end.has(g), `missing vowel team ${g}`);
  for (const g of ["ar", "or", "er", "ir", "ur"]) assert.ok(end.has(g), `missing r-controlled ${g}`);
  for (const g of ["le", "tion"]) assert.ok(end.has(g), `missing grapheme ${g}`);

  // Morphology is taught, but it is NOT a grapheme — so it must not appear in
  // the decodable set. -s, -ing and -ed add no new spelling.
  const targets = new Set(QUEST_STOPS.flatMap(s => s.teach.map(e => e.id)));
  for (const m of ["suffix_s", "suffix_ing", "suffix_ed"]) {
    assert.ok(targets.has(m), `missing morphology target ${m}`);
    assert.equal(end.has(m), false, `${m} must not widen the decodable set`);
  }
});

test("every stop names real shells, and every shell is used somewhere", () => {
  const used = new Set();
  for (const stop of QUEST_STOPS) {
    assert.ok(stop.shells.length >= 3, `${stop.id} has too few shells`);
    for (const shell of stop.shells) {
      assert.ok(QUEST_SHELL_IDS.includes(shell), `${stop.id} names unknown shell "${shell}"`);
      used.add(shell);
    }
  }
  for (const shell of QUEST_SHELL_IDS) {
    assert.ok(used.has(shell), `shell "${shell}" is never used by any stop`);
  }
});

test("teach entries are well-formed and alts name a base that was taught earlier", () => {
  const kinds = new Set(["letter", "vowel", "double", "digraph", "split", "team", "r-controlled", "suffix", "blend", "alt", "morph"]);
  for (const stop of QUEST_STOPS) {
    for (const entry of stop.teach) {
      assert.ok(entry.id, `${stop.id} has a teach entry with no id`);
      assert.ok(kinds.has(entry.kind), `${stop.id}: unknown kind "${entry.kind}"`);
      if (entry.kind === "alt") {
        assert.ok(entry.base, `${stop.id}: alt "${entry.id}" names no base grapheme`);
        assert.ok(
          taughtThrough(stop.index - 1).has(entry.base),
          `${stop.id}: alt "${entry.id}" re-teaches "${entry.base}", which has not been taught yet`
        );
      }
    }
  }
});

test("targetsAtStop returns the mastery targets, not the graphemes", () => {
  assert.deepEqual(targetsAtStop("s1"), ["a", "m", "t", "s"]);
  assert.deepEqual(targetsAtStop("s16"), ["y_ie", "y_ee"]);
  assert.deepEqual(targetsAtStop("s8"), [], "a boss stop teaches nothing new");
});

test("the boss stops are where they should be", () => {
  const bosses = QUEST_STOPS.filter(s => s.boss).map(s => s.id);
  assert.deepEqual(bosses, ["s8", "s17", "s40"]);
});

test("the word pool only ever grows", () => {
  assert.ok(wordsThrough(8).length > wordsThrough(4).length);
  assert.ok(wordsThrough(40).length > wordsThrough(17).length);
  assert.ok(getStop("s1").words.every(w => wordsThrough(40).includes(w)));
});

test("NEEDS_AUDIO only lists sounds the trail actually teaches", () => {
  const taught = new Set(QUEST_STOPS.flatMap(s => s.teach.map(e => e.id)));
  for (const g of NEEDS_AUDIO) {
    assert.ok(taught.has(g), `NEEDS_AUDIO lists "${g}", which no stop teaches`);
  }
});
