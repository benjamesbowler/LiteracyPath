import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  getPronunciation,
  getWordMeaning,
  SOUND_SEEKERS_WORDS,
  assertShippingPronunciationLexicon
} from "../../src/features/soundSeekers/content/pronunciationLexicon.js";

const reachableWords = new Set(
  QUEST_STOPS.flatMap(stop => [
    ...stop.words,
    ...stop.heartWords,
    ...(stop.pages || []).flatMap(page => [page.text, ...(page.choices || [])]
      .flatMap(text => String(text).toLowerCase().match(/[a-z']+/g) || [])
      .map(word => word.replace(/'s$/, "")))
  ])
    .map(word => word.toLowerCase())
);

test("word-workbench fixtures have explicit sound boxes", () => {
  assert.deepEqual(getPronunciation("ship").units.map(unit => unit.grapheme), ["sh", "i", "p"]);
  assert.deepEqual(getPronunciation("moon").units.map(unit => unit.grapheme), ["m", "oo", "n"]);
  assert.deepEqual(getPronunciation("cake").units.map(unit => unit.grapheme), ["c", "a_e", "k"]);
  assert.deepEqual(getPronunciation("pop").units.map(unit => unit.grapheme), ["p", "o", "p"]);
});

test("reviewed en-US regression words keep their complete sound-box alignments", () => {
  assert.deepEqual(
    getPronunciation("go").units.map(({ grapheme, soundKey, letterIndices }) => ({ grapheme, soundKey, letterIndices })),
    [
      { grapheme: "g", soundKey: "g", letterIndices: [0] },
      { grapheme: "o", soundKey: "ow", letterIndices: [1] }
    ]
  );
  assert.deepEqual(
    getPronunciation("bridge").units.map(({ grapheme, soundKey, letterIndices }) => ({ grapheme, soundKey, letterIndices })),
    [
      { grapheme: "b", soundKey: "b", letterIndices: [0] },
      { grapheme: "r", soundKey: "r", letterIndices: [1] },
      { grapheme: "i", soundKey: "short_i", letterIndices: [2] },
      { grapheme: "dge", soundKey: "g_j", letterIndices: [3, 4, 5] }
    ]
  );
  assert.deepEqual(
    getPronunciation("table").units.map(({ grapheme, soundKey, letterIndices }) => ({ grapheme, soundKey, letterIndices })),
    [
      { grapheme: "t", soundKey: "t", letterIndices: [0] },
      { grapheme: "a", soundKey: "a_e", letterIndices: [1] },
      { grapheme: "b", soundKey: "b", letterIndices: [2] },
      { grapheme: "le", soundKey: "le", letterIndices: [3, 4] }
    ]
  );
});

test("shipping records represent contextual pronunciations explicitly", () => {
  for (const fixture of ["thin", "this", "new", "grew", "cats", "dogs", "wanted", "jumped", "city", "giant"]) {
    assert.ok(getPronunciation(fixture), fixture);
  }
  assert.doesNotThrow(() => assertShippingPronunciationLexicon(SOUND_SEEKERS_WORDS));
});

test("shipping units persist explicit canonical evidence target metadata", () => {
  for (const record of SOUND_SEEKERS_WORDS) {
    for (const unit of record.units) {
      assert.equal(Object.hasOwn(unit, "evidenceTargetId"), true, `${record.id}:${unit.grapheme}`);
    }
  }

  assert.deepEqual(
    getPronunciation("ship").units.map(unit => unit.evidenceTargetId),
    ["sh", "i", "p"]
  );
  assert.deepEqual(
    getPronunciation("cake").units.map(unit => unit.evidenceTargetId),
    ["c", "a_e", "k"]
  );
  assert.deepEqual(
    getPronunciation("cats").units.map(unit => unit.evidenceTargetId),
    ["c", "a", "t", "suffix_s"]
  );
  assert.deepEqual(
    getPronunciation("table").units.map(unit => unit.evidenceTargetId),
    ["t", "a_e", "b", "le"]
  );
  assert.equal(
    getPronunciation("a").units[0].evidenceTargetId,
    null,
    "schwa must not claim evidence for the taught short-a target"
  );
});

test("the validator requires known evidence targets for assessed v2 words", () => {
  const ship = getPronunciation("ship");
  assert.doesNotThrow(() => assertShippingPronunciationLexicon([ship], {
    requiredEvidenceWordIds: ["ship"]
  }));

  assert.throws(
    () => assertShippingPronunciationLexicon([{
      ...ship,
      units: ship.units.map((unit, index) => index === 1
        ? { ...unit, evidenceTargetId: null }
        : unit)
    }], { requiredEvidenceWordIds: ["ship"] }),
    /ship.*evidence target/i
  );
  assert.throws(
    () => assertShippingPronunciationLexicon([{
      ...ship,
      units: ship.units.map((unit, index) => index === 1
        ? { ...unit, evidenceTargetId: "not-a-curriculum-target" }
        : unit)
    }]),
    /unknown evidence target/i
  );
});

test("the shipping lexicon covers every reachable word exactly once", () => {
  assert.equal(new Set(QUEST_STOPS.flatMap(stop => stop.words.map(word => word.toLowerCase()))).size, 431);
  assert.equal(new Set(QUEST_STOPS.flatMap(stop => stop.heartWords.map(word => word.toLowerCase()))).size, 60);
  assert.equal(reachableWords.size, 530);
  assert.equal(SOUND_SEEKERS_WORDS.length, reachableWords.size + 1);
  const shippingIds = new Set(SOUND_SEEKERS_WORDS.map(record => record.id));
  for (const word of reachableWords) assert.ok(shippingIds.has(word), word);
  assert.ok(shippingIds.has("pop"), "the required repeated-grapheme workbench fixture must ship");
});

test("contextual values, suffix allomorphs, and exceptions are not collapsed", () => {
  assert.equal(getPronunciation("thin").units[0].soundKey, "th");
  assert.equal(getPronunciation("this").units[0].soundKey, "th_voiced");
  assert.equal(getPronunciation("few").units.find(unit => unit.grapheme === "ew").soundKey, "ew_yoo");
  assert.equal(getPronunciation("grew").units.find(unit => unit.grapheme === "ew").soundKey, "ew");
  assert.deepEqual(
    [getPronunciation("cats"), getPronunciation("dogs")].map(record => {
      const suffix = record.units.at(-1);
      return [suffix.grapheme, suffix.soundKey, suffix.role];
    }),
    [["s", "s", "suffix-plural-unvoiced"], ["s", "z", "suffix-plural-voiced"]]
  );
  assert.deepEqual(
    [getPronunciation("jumped"), getPronunciation("landed"), getPronunciation("wanted")].map(record => {
      const suffix = record.units.at(-1);
      return [suffix.grapheme, suffix.soundKey, suffix.role];
    }),
    [
      ["ed", "t", "suffix-past-unvoiced"],
      ["ed", "ed_id", "suffix-past-syllabic"],
      ["ed", "ed_id", "suffix-past-syllabic"]
    ]
  );
  assert.equal(getPronunciation("city").units[0].soundKey, "c_s");
  assert.equal(getPronunciation("giant").units[0].soundKey, "g_j");
  assert.equal(getPronunciation("cake").units.find(unit => unit.grapheme === "a_e").letterIndices.join(","), "1,3");
  assert.equal(getPronunciation("table").units.at(-1).soundKey, "le");
});

test("word-workbench words have complete child-safe meaning actions", () => {
  assert.equal(getPronunciation("ship").meaningId, "ship-vessel");
  assert.equal(getWordMeaning(getPronunciation("bridge").meaningId).sense, "a structure that carries a path over a gap");
  for (const record of SOUND_SEEKERS_WORDS.filter(item => item.tags.includes("decodable"))) {
    const meaning = getWordMeaning(record.meaningId);
    assert.ok(meaning, record.word);
    assert.ok(meaning.sense.length >= 8, record.word);
    assert.doesNotMatch(meaning.sense, /everyday child-safe meaning/i, record.word);
    assert.ok(meaning.actionCue.length >= 8, record.word);
    assert.ok(meaning.partOfSpeech, record.word);
    assert.match(meaning.ageBand, /^5-8$/);
    assert.ok(meaning.reference?.id, record.word);
    assert.ok(["image", "action"].includes(meaning.reference?.kind), record.word);
  }
});

test("the validator rejects every unsafe shipping fallback class", () => {
  const ship = getPronunciation("ship");
  const rejects = [
    [{ ...ship, units: [] }, /units/i],
    [{ ...ship, units: ship.units.map((unit, index) => index === 1 ? { ...unit, letterIndices: [1, 2] } : unit) }, /overlap/i],
    [{ ...ship, units: ship.units.map((unit, index) => index === 1 ? { ...unit, letterIndices: [] } : unit) }, /letter indices|uncovered/i],
    [{ ...ship, units: ship.units.map((unit, index) => index === 1 ? { ...unit, soundKey: "not-a-real-sound" } : unit) }, /audio|sound key/i],
    [{ ...ship, meaningId: "missing-meaning" }, /meaning/i],
    [{ ...ship, generatedFallback: true }, /fallback/i]
  ];

  for (const [record, expected] of rejects) {
    assert.throws(() => assertShippingPronunciationLexicon([record]), expected);
  }
  assert.throws(() => assertShippingPronunciationLexicon([ship, { ...ship }]), /duplicate/i);
});

test("audio blocker status is closed and release validation fails while blockers remain", () => {
  const ship = getPronunciation("ship");
  const unknownUnit = { ...ship.units[0], soundKey: "not-a-real-sound" };
  assert.throws(
    () => assertShippingPronunciationLexicon([{ ...ship, units: [{ ...unknownUnit, releaseBlockingStatus: "approved" }, ...ship.units.slice(1)] }]),
    /release blocker|audio|sound key/i
  );

  const explicitlyBlocked = {
    ...ship,
    units: [{
      ...unknownUnit,
      releaseBlockingStatus: "release_blocked_missing_instructional_audio"
    }, ...ship.units.slice(1)]
  };
  assert.doesNotThrow(() => assertShippingPronunciationLexicon([explicitlyBlocked]));
  assert.throws(
    () => assertShippingPronunciationLexicon([explicitlyBlocked], { release: true }),
    /ship.*not-a-real-sound|release blocker/i
  );
});
