import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { SOUND_SAFARI_WORDS } from "../../src/data/soundSafariWords.js";
import { SOUND_SAFARI_WORDS as ROUND_WORDS, soundSafariLadder, soundSafariAudioCoverage } from "../../src/utils/soundSafariRounds.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { SOUND_KEY_ARPABET } from "../../tools/soundSeekersPronunciationAudit.mjs";
import { AUDIO_QUEST_PATHS } from "../../src/data/generated/audioQuestPaths.generated.js";
import { KNOWN_BAD_AUDIO_PATHS, KNOWN_BAD_WORD_AUDIO } from "../../src/data/knownBadWordAudio.js";
import {
  SOUND_SAFARI_PRONUNCIATIONS,
  SOUND_SAFARI_PRONUNCIATION_SUPPLEMENT,
  composeSoundSafariPronunciations,
  getSoundSafariPronunciation,
  soundSafariUnitAudio,
  soundSafariWordAudio,
  soundSafariSoundsEquivalent,
  soundSafariSoundClass,
  soundSafariOptionsForUnit,
  soundSafariDecoyUnits,
  SOUND_SAFARI_OPTION_BANK
} from "../../src/data/soundSafariPronunciations.js";

const words = Object.values(SOUND_SAFARI_WORDS).flat();
const projection = units => units.map(({ grapheme, soundKey, letterIndices }) => [grapheme, soundKey, letterIndices]);
const phones = units => units.flatMap(unit => {
  assert.ok(SOUND_KEY_ARPABET[unit.soundKey], `unknown reference sound ${unit.soundKey}`);
  return SOUND_KEY_ARPABET[unit.soundKey];
}).join(" ");

// Literal audit fixtures from the pinned source inspected for this lane.
// dog/log/moss deliberately retain the authorized US instructional short-o
// variant; rabbit selects rabbit(2). These are not recording-listening results.
const SUPPLEMENT_PHONES = {
  sun: "S AH N", mop: "M AA P", log: "L AA G", dog: "D AA G", wet: "W EH T",
  bug: "B AH G", web: "W EH B", hen: "HH EH N", top: "T AA P", mud: "M AH D",
  plant: "P L AE N T", crisp: "K R IH S P", brush: "B R AH SH", splash: "S P L AE SH",
  track: "T R AE K", clock: "K L AA K", snail: "S N EY L", brain: "B R EY N",
  sleep: "S L IY P", float: "F L OW T", thread: "TH R EH D", string: "S T R IH NG",
  spring: "S P R IH NG", twist: "T W IH S T", shark: "SH AA R K", three: "TH R IY",
  prize: "P R AY Z", sunlight: "S AH N L AY T", rainbow: "R EY N B OW",
  meadow: "M EH D OW", forest: "F AO R AH S T", river: "R IH V ER",
  rabbit: "R AE B IH T", silver: "S IH L V ER", owl: "AW L", glow: "G L OW",
  badger: "B AE JH ER", thunder: "TH AH N D ER", glimmer: "G L IH M ER",
  squirrel: "S K W ER AH L", acorn: "EY K AO R N", mist: "M IH S T", oak: "OW K",
  butterfly: "B AH T ER F L AY", moss: "M AA S", woodland: "W UH D L AE N D",
  mushroom: "M AH SH R UW M", glowing: "G L OW IH NG", stream: "S T R IY M",
  shining: "SH AY N IH NG", sunset: "S AH N S EH T"
};

test("the registry composes 39 canonical records and 51 disjoint authored supplements", () => {
  assert.strictEqual(ROUND_WORDS, SOUND_SAFARI_WORDS);
  assert.equal(words.length, 90);
  assert.equal(new Set(words).size, 90);
  assert.deepEqual(Object.keys(SOUND_SAFARI_PRONUNCIATIONS).sort(), [...words].sort());
  assert.deepEqual(Object.keys(SOUND_SAFARI_PRONUNCIATION_SUPPLEMENT).sort(), Object.keys(SUPPLEMENT_PHONES).sort());
  let canonicalCount = 0;
  for (const word of words) {
    const actual = getSoundSafariPronunciation(word);
    const canonical = getPronunciation(word);
    assert.equal(actual.id, word);
    assert.equal(actual.word, word);
    assert.equal(actual.audit.listening, "not-performed");
    if (canonical) {
      canonicalCount += 1;
      assert.equal(actual.provenance.kind, "canonical");
      assert.deepEqual(projection(actual.units), projection(canonical.units), word);
      assert.equal(Object.hasOwn(SOUND_SAFARI_PRONUNCIATION_SUPPLEMENT, word), false);
    } else {
      assert.equal(actual.provenance.kind, "safari-supplement");
      assert.match(actual.provenance.sourceUrl, /cmusphinx\/cmudict\/74790861f652b15e4ac49015a90074ad62a27690\/cmudict\.dict$/);
      assert.equal(Object.hasOwn(actual, "taughtAt"), false);
      assert.equal(actual.units.some(unit => Object.hasOwn(unit, "evidenceTargetId")), false);
      assert.equal(phones(actual.units), SUPPLEMENT_PHONES[word], word);
    }
  }
  assert.equal(canonicalCount, 39);
  assert.equal(getSoundSafariPronunciation("unlistedword"), null);
  assert.equal(getSoundSafariPronunciation("forest", "unreviewed-guess"), null);
});

function assertLetterCoverage(record) {
  const indices = [];
  const ids = new Set();
  for (const unit of record.units) {
    assert.equal(unit.grapheme.replace(/_/g, ""), unit.letterIndices.map(i => record.word[i]).join(""), `${record.id}:${unit.grapheme}`);
    assert.ok(unit.letterIndices.length > 0);
    assert.ok(unit.letterIndices.every(i => Number.isInteger(i) && i >= 0 && i < record.word.length));
    indices.push(...unit.letterIndices);
    assert.equal(ids.has(unit.occurrenceId), false, unit.occurrenceId);
    ids.add(unit.occurrenceId);
  }
  assert.deepEqual(indices.sort((a, b) => a - b), [...record.word].map((_, i) => i), record.id);
}

test("every default and optional variant covers every printed letter once", () => {
  for (const word of words) {
    const record = getSoundSafariPronunciation(word);
    assertLetterCoverage(record);
    for (const variant of record.variants) assertLetterCoverage(getSoundSafariPronunciation(word, variant.id));
  }
});

test("composition rejects overlapping authors, omitted words, extra words and broken alignment", () => {
  const supplement = SOUND_SAFARI_PRONUNCIATION_SUPPLEMENT;
  assert.throws(() => composeSoundSafariPronunciations({ supplement: { ...supplement, cat: supplement.sun } }), /overlap.*cat/i);
  const missing = { ...supplement };
  delete missing.sun;
  assert.throws(() => composeSoundSafariPronunciations({ supplement: missing }), /missing.*sun/i);
  assert.throws(() => composeSoundSafariPronunciations({ supplement: { ...supplement, unrelated: supplement.sun } }), /outside.*unrelated/i);
  const broken = { ...supplement.sun, units: supplement.sun.units.slice(1) };
  assert.throws(() => composeSoundSafariPronunciations({ supplement: { ...supplement, sun: broken } }), /letter.*sun|sun.*letter/i);
});

test("split vowels and doubled consonants retain their actual printed positions", () => {
  for (const [word, vowel] of [["stone", "o_e"], ["flame", "a_e"], ["smile", "i_e"], ["slide", "i_e"], ["prize", "i_e"]]) {
    const unit = getSoundSafariPronunciation(word).units.find(u => u.grapheme === vowel);
    assert.deepEqual(unit.letterIndices, [2, 4], word);
  }
  for (const [word, grapheme, soundKey, indices] of [
    ["rabbit", "bb", "b", [2, 3]], ["glimmer", "mm", "m", [3, 4]],
    ["butterfly", "tt", "t", [2, 3]], ["moss", "ss", "s", [2, 3]],
    ["badger", "dg", "g_j", [2, 3]], ["squirrel", "irr", "er", [3, 4, 5]]
  ]) {
    const unit = getSoundSafariPronunciation(word).units.find(u => u.grapheme === grapheme);
    assert.deepEqual([unit.soundKey, unit.letterIndices], [soundKey, indices], word);
  }
});

test("repeated occurrences survive even when their labels or sounds match", () => {
  for (const [word, label, count] of [["twist", "t", 2], ["woodland", "d", 2], ["mushroom", "m", 2], ["sunset", "s", 2], ["shining", "i", 2]]) {
    const units = getSoundSafariPronunciation(word).units.filter(unit => unit.grapheme === label);
    assert.equal(units.length, count, word);
    assert.equal(new Set(units.map(unit => unit.occurrenceId)).size, count);
  }
  assert.deepEqual(getSoundSafariPronunciation("shining").units.filter(u => u.grapheme === "i").map(u => [u.soundKey, u.letterIndices]), [["i_e", [2]], ["short_i", [4]]]);
});

test("variant choices retain provenance and never assert that recordings were heard", () => {
  for (const word of ["dog", "log", "moss"]) {
    const record = getSoundSafariPronunciation(word);
    assert.equal(record.units.find(u => u.grapheme === "o").soundKey, "short_o");
    assert.equal(record.audit.referenceStatus, "instruction-variant");
    assert.ok(record.audit.uncertainties.includes("accent-sensitive-vowel"));
  }
  for (const [word, variantId, expected] of [
    ["forest", "short-i", "F AO R IH S T"],
    ["woodland", "reduced", "W UH D L AH N D"],
    ["rabbit", "reduced", "R AE B AH T"]
  ]) {
    const variant = getSoundSafariPronunciation(word, variantId);
    assert.equal(phones(variant.units), expected);
    assert.equal(variant.audit.listening, "not-performed");
    assert.equal(variant.variantId, variantId);
  }
  for (const word of ["river", "silver", "badger", "thunder", "glimmer", "butterfly"]) {
    const record = getSoundSafariPronunciation(word);
    assert.equal(record.units.find(u => u.soundKey === "er").stress, "unstressed");
    assert.ok(record.audit.uncertainties.includes("unstressed-er-recording-context"));
  }
});

test("audio is resolved from soundKey, never the printed label", () => {
  for (const [word, grapheme, expected] of [
    ["thread", "ea", "reviewed/short-e"], ["meadow", "ea", "reviewed/short-e"],
    ["owl", "ow", "reviewed/ow-cow"], ["acorn", "a", "reviewed/long-a"],
    ["rabbit", "bb", "reviewed/b"], ["badger", "dg", "reviewed/j-soft-g"],
    ["butterfly", "y", "reviewed/long-i"], ["woodland", "oo", "reviewed/short-oo"]
  ]) {
    const unit = getSoundSafariPronunciation(word).units.find(u => u.grapheme === grapheme);
    assert.equal(soundSafariUnitAudio(unit, word).path, `/audio/phonemes/${expected}.mp3`, word);
  }
  assert.deepEqual(soundSafariUnitAudio({ grapheme: "ea" }, "thread"), { path: "", available: false, status: "unavailable" });
  for (const key of ["schwa", "ed_id", "nonexistent_sound"]) {
    assert.deepEqual(soundSafariUnitAudio({ grapheme: "u", soundKey: key }), { path: "", available: false, status: "unavailable" });
  }
});

test("current word and available unit files exist and audio quarantine is respected", () => {
  for (const word of words) {
    const record = getSoundSafariPronunciation(word);
    const wordAudio = soundSafariWordAudio(word);
    assert.equal(wordAudio.available, true, word);
    for (const audio of [wordAudio, ...record.units.map(u => soundSafariUnitAudio(u, word))]) {
      if (!audio.available) continue;
      const file = new URL(`../../public${audio.path}`, import.meta.url);
      assert.ok(AUDIO_QUEST_PATHS.has(audio.path));
      assert.ok(existsSync(file), audio.path);
      assert.ok(statSync(file).size > 0, audio.path);
    }
  }
  const unit = getSoundSafariPronunciation("thread").units[2];
  const path = soundSafariUnitAudio(unit, "thread").path;
  KNOWN_BAD_AUDIO_PATHS.add(path);
  try {
    assert.equal(soundSafariUnitAudio(unit, "thread").available, false);
  } finally {
    KNOWN_BAD_AUDIO_PATHS.delete(path);
  }
  const wordPath = soundSafariWordAudio("cat").path;
  KNOWN_BAD_AUDIO_PATHS.add(wordPath);
  try {
    assert.deepEqual(soundSafariWordAudio("cat"), { path: "", available: false, status: "unavailable" });
    assert.equal(getSoundSafariPronunciation("cat").word, "cat");
  } finally {
    KNOWN_BAD_AUDIO_PATHS.delete(wordPath);
  }
  assert.deepEqual(soundSafariWordAudio("unrecorded-safari-fixture"), { path: "", available: false, status: "unavailable" });
});

test("word quarantine overrides existing clips for normalized input without removing authored words", () => {
  const unavailable = { path: "", available: false, status: "unavailable" };
  const original = soundSafariWordAudio("cat");
  const inputs = ["cat", "CAT", "  Cat  ", "CAT!?", "hfw:cat", "HFW:ＣＡＴ!"];
  assert.equal(original.available, true);
  assert.equal(KNOWN_BAD_AUDIO_PATHS.has(original.path), false);
  for (const input of inputs) assert.deepEqual(soundSafariWordAudio(input), original, input);

  const wasBlocked = KNOWN_BAD_WORD_AUDIO.has("cat");
  KNOWN_BAD_WORD_AUDIO.add("cat");
  try {
    for (const input of inputs) assert.deepEqual(soundSafariWordAudio(input), unavailable, input);
    assert.equal(soundSafariWordAudio("sun").available, true);
    assert.equal(getSoundSafariPronunciation("cat").word, "cat");
    const rounds = soundSafariLadder("easy").flatMap(level => level.words);
    assert.deepEqual(rounds.map(record => record.word), SOUND_SAFARI_WORDS.easy);
    assert.deepEqual(rounds.find(record => record.word === "cat").wordAudio, unavailable);
    assert.ok(soundSafariAudioCoverage().easy.missing.includes("cat"));
  } finally {
    if (!wasBlocked) KNOWN_BAD_WORD_AUDIO.delete("cat");
  }
  assert.deepEqual(soundSafariWordAudio("cat"), original);
});

test("sound equivalence is semantic, contextual and independent of printed labels", () => {
  for (const pair of [["c", "ck"], ["k", "ck"], ["b", "bb"], ["s", "ss"], ["ea_e", "short_e"], ["ea", "ee"], ["ow", "oa"], ["a_e", "ai"], ["i_e", "y_ie"], ["er", "ir"]]) {
    assert.equal(soundSafariSoundsEquivalent(...pair), true, pair.join("/"));
  }
  for (const pair of [["oo", "oo_short"], ["ow", "ow_ou"], ["ea", "ea_e"], ["i_e", "short_i"], ["th", "th_voiced"], ["or", "aw"], ["u_e", "oo"]]) {
    assert.equal(soundSafariSoundsEquivalent(...pair), false, pair.join("/"));
  }
  assert.equal(soundSafariSoundClass("unknown"), "");
  assert.equal(soundSafariSoundClass({ grapheme: "a" }), "");
  assert.equal(soundSafariSoundsEquivalent({ grapheme: "a", soundKey: "a_e" }, { grapheme: "ai", soundKey: "ai" }), true);
});

test("deterministic options keep one occurrence-specific target and only safe distinct distractors", () => {
  let moved = false;
  for (const word of words) {
    const record = getSoundSafariPronunciation(word);
    for (const [index, unit] of record.units.entries()) {
      for (const count of [4, 8, 100]) {
        const options = soundSafariOptionsForUnit(record, index, { seed: 4, count });
        assert.deepEqual(options, soundSafariOptionsForUnit(record, index, { seed: 4, count }));
        assert.ok(options.length >= 4 && options.length <= 8, word);
        const target = options.filter(o => o.occurrenceId === unit.occurrenceId);
        assert.equal(target.length, 1);
        assert.equal(target[0].soundKey, unit.soundKey);
        assert.equal(target[0].grapheme, unit.grapheme);
        for (const [i, option] of options.entries()) for (const other of options.slice(i + 1)) {
          assert.notEqual(option.grapheme, other.grapheme, word);
          assert.equal(soundSafariSoundsEquivalent(option, other), false, `${word}: ${option.soundKey}/${other.soundKey}`);
        }
        if (unit.soundKey === "schwa") assert.equal(target[0].audio.available, false);
      }
      const position = seed => soundSafariOptionsForUnit(record, index, { seed }).findIndex(o => o.occurrenceId === unit.occurrenceId);
      moved ||= position(1) !== position(2);
    }
  }
  assert.equal(moved, true);
  assert.deepEqual(soundSafariOptionsForUnit("missing", 0), []);
  assert.deepEqual(soundSafariOptionsForUnit("cat", -1), []);
});

test("zero requested decoys stays empty and scarce audio never invents extra safe choices", () => {
  assert.deepEqual(soundSafariDecoyUnits("cat", 0, 0), []);
  assert.deepEqual(soundSafariDecoyUnits("cat", 0, -2), []);
  const blocked = new Set(SOUND_SAFARI_OPTION_BANK
    .filter(unit => !["p", "t"].includes(unit.soundKey))
    .map(unit => soundSafariUnitAudio(unit).path).filter(Boolean));
  for (const path of blocked) KNOWN_BAD_AUDIO_PATHS.add(path);
  try {
    const record = getSoundSafariPronunciation("cat");
    const options = soundSafariOptionsForUnit(record, 0);
    assert.equal(options.length, 2);
    assert.deepEqual(new Set(options.map(unit => unit.soundKey)), new Set(["c", "p"]));
    assert.equal(options.find(unit => unit.soundKey === "c").audio.available, false);
  } finally {
    for (const path of blocked) KNOWN_BAD_AUDIO_PATHS.delete(path);
  }
});
