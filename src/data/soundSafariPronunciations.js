import { getPronunciation } from "../features/soundSeekers/content/pronunciationLexicon.js";
import { SOUND_SAFARI_WORDS } from "./soundSafariWords.js";
import { getPreferredPhonemeAudioPath } from "./phonemeAudioBank.js";
import { getLedaWordAudioPath, normalizeLedaAudioText } from "./ledaProductionAudio.js";
import { AUDIO_QUEST_PATHS } from "./generated/audioQuestPaths.generated.js";
import { hasKnownBadWordAudio, isKnownBadAudioPath } from "./knownBadWordAudio.js";

const CMU_SOURCE = "https://raw.githubusercontent.com/cmusphinx/cmudict/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict";

// These are grapheme units, not a promise of one phoneme per unit: canonical
// x, qu and r-controlled spellings keep their existing curriculum convention.
// Tuples explicitly author [printed letters, sound key, letter indices, stress].
// No spelling segmenter, inferred silent letters or assessed teaching provenance.
function unitsFor(word, tuples, variantId = "default") {
  return Object.freeze(tuples.map(([grapheme, soundKey, letterIndices, stress], index) => Object.freeze({
    grapheme,
    soundKey,
    letterIndices: Object.freeze([...letterIndices]),
    occurrenceId: `${word}:${variantId}:${index}`,
    ...(stress ? { stress } : {})
  })));
}

function authored(word, tuples, {
  sourceKey = word,
  referenceStatus = "matched",
  uncertainties = [],
  note = "",
  variants = []
} = {}) {
  return Object.freeze({
    id: word,
    word,
    variantId: "default",
    units: unitsFor(word, tuples),
    provenance: Object.freeze({ kind: "safari-supplement", sourceUrl: CMU_SOURCE, sourceKey }),
    audit: Object.freeze({
      referenceStatus,
      // Reference comparison ignores stress, as the existing authoring audit
      // does. A reference match never establishes a recording's pronunciation.
      stressPolicy: "reference-comparison-ignores-stress",
      listening: "not-performed",
      uncertainties: Object.freeze([...uncertainties]),
      note
    }),
    variants: Object.freeze(variants.map(variant => Object.freeze({
      id: variant.id,
      sourceKey: variant.sourceKey,
      units: unitsFor(word, variant.units, variant.id)
    })))
  });
}

const SHORT_O_VARIANT = Object.freeze({
  referenceStatus: "instruction-variant",
  uncertainties: ["accent-sensitive-vowel"],
  note: "Retain the authorized existing US instructional short-o. The pinned entry uses AO; the recording's accent has not been heard in this audit."
});
const UNSTRESSED_ER = Object.freeze({
  uncertainties: ["unstressed-er-recording-context"],
  note: "The canonical er key is retained for the unstressed unit. Its shared recording is available, but contextual listening is unverified."
});

// Disjoint supplement only. Canonical words are composed below, never copied
// into this authoring list. Variants are explicit review choices, not automatic
// audio-availability fallbacks; in particular schwa must never become short-u.
export const SOUND_SAFARI_PRONUNCIATION_SUPPLEMENT = Object.freeze(Object.fromEntries([
  authored("sun", [["s", "s", [0]], ["u", "short_u", [1]], ["n", "n", [2]]]),
  authored("mop", [["m", "m", [0]], ["o", "short_o", [1]], ["p", "p", [2]]]),
  authored("log", [["l", "l", [0]], ["o", "short_o", [1]], ["g", "g", [2]]], SHORT_O_VARIANT),
  authored("dog", [["d", "d", [0]], ["o", "short_o", [1]], ["g", "g", [2]]], SHORT_O_VARIANT),
  authored("wet", [["w", "w", [0]], ["e", "short_e", [1]], ["t", "t", [2]]]),
  authored("bug", [["b", "b", [0]], ["u", "short_u", [1]], ["g", "g", [2]]]),
  authored("web", [["w", "w", [0]], ["e", "short_e", [1]], ["b", "b", [2]]]),
  authored("hen", [["h", "h", [0]], ["e", "short_e", [1]], ["n", "n", [2]]]),
  authored("top", [["t", "t", [0]], ["o", "short_o", [1]], ["p", "p", [2]]]),
  authored("mud", [["m", "m", [0]], ["u", "short_u", [1]], ["d", "d", [2]]]),
  authored("plant", [["p", "p", [0]], ["l", "l", [1]], ["a", "short_a", [2]], ["n", "n", [3]], ["t", "t", [4]]]),
  authored("crisp", [["c", "c", [0]], ["r", "r", [1]], ["i", "short_i", [2]], ["s", "s", [3]], ["p", "p", [4]]]),
  authored("brush", [["b", "b", [0]], ["r", "r", [1]], ["u", "short_u", [2]], ["sh", "sh", [3, 4]]]),
  authored("splash", [["s", "s", [0]], ["p", "p", [1]], ["l", "l", [2]], ["a", "short_a", [3]], ["sh", "sh", [4, 5]]]),
  authored("track", [["t", "t", [0]], ["r", "r", [1]], ["a", "short_a", [2]], ["ck", "ck", [3, 4]]]),
  authored("clock", [["c", "c", [0]], ["l", "l", [1]], ["o", "short_o", [2]], ["ck", "ck", [3, 4]]]),
  authored("snail", [["s", "s", [0]], ["n", "n", [1]], ["ai", "ai", [2, 3]], ["l", "l", [4]]]),
  authored("brain", [["b", "b", [0]], ["r", "r", [1]], ["ai", "ai", [2, 3]], ["n", "n", [4]]]),
  authored("sleep", [["s", "s", [0]], ["l", "l", [1]], ["ee", "ee", [2, 3]], ["p", "p", [4]]]),
  authored("float", [["f", "f", [0]], ["l", "l", [1]], ["oa", "oa", [2, 3]], ["t", "t", [4]]]),
  authored("thread", [["th", "th", [0, 1]], ["r", "r", [2]], ["ea", "ea_e", [3, 4]], ["d", "d", [5]]]),
  authored("string", [["s", "s", [0]], ["t", "t", [1]], ["r", "r", [2]], ["i", "short_i", [3]], ["ng", "ng", [4, 5]]]),
  authored("spring", [["s", "s", [0]], ["p", "p", [1]], ["r", "r", [2]], ["i", "short_i", [3]], ["ng", "ng", [4, 5]]]),
  authored("twist", [["t", "t", [0]], ["w", "w", [1]], ["i", "short_i", [2]], ["s", "s", [3]], ["t", "t", [4]]]),
  authored("shark", [["sh", "sh", [0, 1]], ["ar", "ar", [2, 3]], ["k", "k", [4]]]),
  authored("three", [["th", "th", [0, 1]], ["r", "r", [2]], ["ee", "ee", [3, 4]]]),
  authored("prize", [["p", "p", [0]], ["r", "r", [1]], ["i_e", "i_e", [2, 4]], ["z", "z", [3]]]),
  authored("sunlight", [["s", "s", [0]], ["u", "short_u", [1]], ["n", "n", [2]], ["l", "l", [3]], ["igh", "igh", [4, 5, 6]], ["t", "t", [7]]]),
  authored("rainbow", [["r", "r", [0]], ["ai", "ai", [1, 2]], ["n", "n", [3]], ["b", "b", [4]], ["ow", "ow", [5, 6]]]),
  authored("meadow", [["m", "m", [0]], ["ea", "ea_e", [1, 2]], ["d", "d", [3]], ["ow", "ow", [4, 5]]]),
  authored("forest", [["f", "f", [0]], ["or", "or", [1, 2]], ["e", "schwa", [3], "unstressed"], ["s", "s", [4]], ["t", "t", [5]]], {
    uncertainties: ["recorded-vowel-variant"],
    note: "Default follows forest; forest(2) uses short-i. Select a variant only after checking the word recording, never to avoid unavailable schwa audio.",
    variants: [{ id: "short-i", sourceKey: "forest(2)", units: [["f", "f", [0]], ["or", "or", [1, 2]], ["e", "short_i", [3], "unstressed"], ["s", "s", [4]], ["t", "t", [5]]] }]
  }),
  authored("river", [["r", "r", [0]], ["i", "short_i", [1]], ["v", "v", [2]], ["er", "er", [3, 4], "unstressed"]], UNSTRESSED_ER),
  authored("rabbit", [["r", "r", [0]], ["a", "short_a", [1]], ["bb", "b", [2, 3]], ["i", "short_i", [4], "unstressed"], ["t", "t", [5]]], {
    sourceKey: "rabbit(2)",
    uncertainties: ["recorded-vowel-variant"],
    variants: [{ id: "reduced", sourceKey: "rabbit", units: [["r", "r", [0]], ["a", "short_a", [1]], ["bb", "b", [2, 3]], ["i", "schwa", [4], "unstressed"], ["t", "t", [5]]] }]
  }),
  authored("silver", [["s", "s", [0]], ["i", "short_i", [1]], ["l", "l", [2]], ["v", "v", [3]], ["er", "er", [4, 5], "unstressed"]], UNSTRESSED_ER),
  authored("owl", [["ow", "ow_ou", [0, 1]], ["l", "l", [2]]]),
  authored("glow", [["g", "g", [0]], ["l", "l", [1]], ["ow", "ow", [2, 3]]]),
  authored("badger", [["b", "b", [0]], ["a", "short_a", [1]], ["dg", "g_j", [2, 3]], ["er", "er", [4, 5], "unstressed"]], UNSTRESSED_ER),
  authored("thunder", [["th", "th", [0, 1]], ["u", "short_u", [2]], ["n", "n", [3]], ["d", "d", [4]], ["er", "er", [5, 6], "unstressed"]], UNSTRESSED_ER),
  authored("glimmer", [["g", "g", [0]], ["l", "l", [1]], ["i", "short_i", [2]], ["mm", "m", [3, 4]], ["er", "er", [5, 6], "unstressed"]], UNSTRESSED_ER),
  authored("squirrel", [["s", "s", [0]], ["qu", "qu", [1, 2]], ["irr", "er", [3, 4, 5]], ["e", "schwa", [6], "unstressed"], ["l", "l", [7]]], {
    uncertainties: ["recorded-vowel-variant"],
    note: "Uses the pinned North American squirrel entry. irr covers both r letters once; the final reduced vowel requires its own approved schwa cue."
  }),
  authored("acorn", [["a", "a_e", [0]], ["c", "c", [1]], ["or", "or", [2, 3]], ["n", "n", [4]]]),
  authored("mist", [["m", "m", [0]], ["i", "short_i", [1]], ["s", "s", [2]], ["t", "t", [3]]]),
  authored("oak", [["oa", "oa", [0, 1]], ["k", "k", [2]]]),
  authored("butterfly", [["b", "b", [0]], ["u", "short_u", [1]], ["tt", "t", [2, 3]], ["er", "er", [4, 5], "unstressed"], ["f", "f", [6]], ["l", "l", [7]], ["y", "y_ie", [8]]], UNSTRESSED_ER),
  authored("moss", [["m", "m", [0]], ["o", "short_o", [1]], ["ss", "s", [2, 3]]], SHORT_O_VARIANT),
  authored("woodland", [["w", "w", [0]], ["oo", "oo_short", [1, 2]], ["d", "d", [3]], ["l", "l", [4]], ["a", "short_a", [5]], ["n", "n", [6]], ["d", "d", [7]]], {
    uncertainties: ["recorded-vowel-variant"],
    note: "The default second vowel follows woodland; woodland(2) is reduced. Both use short-oo, never the moon recording.",
    variants: [{ id: "reduced", sourceKey: "woodland(2)", units: [["w", "w", [0]], ["oo", "oo_short", [1, 2]], ["d", "d", [3]], ["l", "l", [4]], ["a", "schwa", [5], "unstressed"], ["n", "n", [6]], ["d", "d", [7]]] }]
  }),
  authored("mushroom", [["m", "m", [0]], ["u", "short_u", [1]], ["sh", "sh", [2, 3]], ["r", "r", [4]], ["oo", "oo", [5, 6]], ["m", "m", [7]]]),
  authored("glowing", [["g", "g", [0]], ["l", "l", [1]], ["ow", "ow", [2, 3]], ["i", "short_i", [4]], ["ng", "ng", [5, 6]]]),
  authored("stream", [["s", "s", [0]], ["t", "t", [1]], ["r", "r", [2]], ["ea", "ea", [3, 4]], ["m", "m", [5]]]),
  authored("shining", [["sh", "sh", [0, 1]], ["i", "i_e", [2]], ["n", "n", [3]], ["i", "short_i", [4]], ["ng", "ng", [5, 6]]]),
  authored("sunset", [["s", "s", [0]], ["u", "short_u", [1]], ["n", "n", [2]], ["s", "s", [3]], ["e", "short_e", [4]], ["t", "t", [5]]])
].map(record => [record.word, record])));

function assertAlignment(word, units) {
  const claimed = new Set();
  const occurrences = new Set();
  if (!units?.length) throw new Error(`Missing units for ${word}`);
  for (const unit of units) {
    if (!unit.soundKey || !unit.grapheme || !unit.letterIndices?.length
      || !unit.occurrenceId || occurrences.has(unit.occurrenceId)) {
      throw new Error(`Invalid unit or occurrence for ${word}`);
    }
    occurrences.add(unit.occurrenceId);
    if (unit.grapheme.replace(/_/g, "") !== unit.letterIndices.map(i => word[i]).join("")) {
      throw new Error(`Letter alignment mismatch for ${word}:${unit.grapheme}`);
    }
    for (const index of unit.letterIndices) {
      if (!Number.isInteger(index) || index < 0 || index >= word.length || claimed.has(index)) {
        throw new Error(`Invalid or repeated letter index for ${word}`);
      }
      claimed.add(index);
    }
  }
  if (claimed.size !== word.length) throw new Error(`Missing letter coverage for ${word}`);
}

// Composition validates the boundary, including future canonical additions.
// If a supplement word becomes canonical, its local authoring must be removed.
export function composeSoundSafariPronunciations({
  wordBanks = SOUND_SAFARI_WORDS,
  canonicalLookup = getPronunciation,
  supplement = SOUND_SAFARI_PRONUNCIATION_SUPPLEMENT
} = {}) {
  const words = Object.values(wordBanks).flat();
  const ids = new Set(words);
  if (ids.size !== words.length) throw new Error("Duplicate authored Safari word IDs");
  for (const word of Object.keys(supplement)) {
    if (canonicalLookup(word)) throw new Error(`Author overlap for ${word}`);
    if (!ids.has(word)) throw new Error(`Supplement word outside Safari: ${word}`);
  }
  return Object.freeze(Object.fromEntries(words.map(word => {
    const canonical = canonicalLookup(word);
    const record = canonical ? Object.freeze({
      id: word,
      word,
      variantId: "default",
      units: unitsFor(word, canonical.units.map(unit => [unit.grapheme, unit.soundKey, unit.letterIndices])),
      provenance: Object.freeze({ kind: "canonical", sourceUrl: CMU_SOURCE, sourceKey: word, recordId: canonical.id }),
      audit: Object.freeze({ referenceStatus: "canonical-record", listening: "not-performed", uncertainties: Object.freeze([]) }),
      variants: Object.freeze([])
    }) : supplement[word];
    if (!record) throw new Error(`Missing pronunciation for ${word}`);
    if (record.id !== word || record.word !== word) throw new Error(`Word identity mismatch for ${word}`);
    assertAlignment(word, record.units);
    const variantIds = new Set(["default"]);
    for (const variant of record.variants) {
      if (!variant.id || variantIds.has(variant.id)) throw new Error(`Duplicate variant for ${word}`);
      variantIds.add(variant.id);
      assertAlignment(word, variant.units);
    }
    return [word, record];
  })));
}

export const SOUND_SAFARI_PRONUNCIATIONS = composeSoundSafariPronunciations();

export function getSoundSafariPronunciation(word, variantId = "default") {
  const key = String(word || "").trim().toLowerCase();
  const record = Object.hasOwn(SOUND_SAFARI_PRONUNCIATIONS, key) ? SOUND_SAFARI_PRONUNCIATIONS[key] : null;
  if (!record || variantId === "default") return record;
  const variant = record.variants.find(item => item.id === variantId);
  return variant ? Object.freeze({
    ...record,
    variantId,
    units: variant.units,
    provenance: Object.freeze({ ...record.provenance, sourceKey: variant.sourceKey })
  }) : null;
}

function availableAudio(path) {
  const selected = path && AUDIO_QUEST_PATHS.has(path) && !isKnownBadAudioPath(path) ? path : "";
  return { path: selected, available: Boolean(selected), status: selected ? "available" : "unavailable" };
}

export function soundSafariWordAudio(word) {
  // Word quarantine blocks every recording, using the lookup's normalization.
  if (hasKnownBadWordAudio(normalizeLedaAudioText(word))) return availableAudio("");
  // Same preference order and exact path as learnGamesAudio.speakWord().
  return availableAudio(getLedaWordAudioPath(word));
}

export function soundSafariUnitAudio(unit, word = "") {
  // Never use grapheme as an audio key: ea, ow, i, bb and dg demonstrate why.
  return availableAudio(unit?.soundKey ? getPreferredPhonemeAudioPath(unit.soundKey, { anchor: word }) : "");
}

// Sound collision classes, not audio aliases. In particular schwa is kept
// conservatively non-contrasting with short-u but cannot borrow its recording.
// Unknown keys have no class and cannot be invented as contrasting choices.
const SOUND_CLASSES = [
  ["a", "short_a"], ["e", "short_e", "ea_e"], ["i", "short_i"], ["o", "short_o"], ["u", "short_u", "schwa"],
  ["b", "bb"], ["c", "k", "ck", "ch_k"], ["d", "dd"], ["f", "ff", "ph"], ["g", "gg"], ["h"],
  ["j", "g_j"], ["l", "ll"], ["m", "mm"], ["n", "nn"], ["p", "pp"], ["r", "rr"],
  ["s", "ss", "c_s"], ["t", "tt"], ["v"], ["w", "wh"], ["x"], ["y"], ["z", "zz"],
  ["sh"], ["ch"], ["th"], ["th_voiced"], ["ng"], ["qu"],
  ["a_e", "ai", "ay"], ["e_e", "ee", "ea", "y_ee"], ["i_e", "igh", "ie", "y_ie"],
  ["o_e", "oa", "ow", "oe"], ["oo", "ue", "ew"], ["u_e", "ew_yoo"], ["oo_short"],
  ["ar"], ["or", "ore"], ["aw"], ["er", "ir", "ur"], ["air", "are"], ["ear"],
  ["ou", "ow_ou"], ["oi", "oy"]
];
const SOUND_CLASS_BY_KEY = new Map(SOUND_CLASSES.flatMap(group => group.map(key => [key, group[0]])));

export function soundSafariSoundClass(unitOrKey) {
  const key = typeof unitOrKey === "string" ? unitOrKey : unitOrKey?.soundKey;
  return SOUND_CLASS_BY_KEY.get(String(key || "").trim().toLowerCase()) || "";
}

export function soundSafariSoundsEquivalent(left, right) {
  const sound = soundSafariSoundClass(left);
  return Boolean(sound && sound === soundSafariSoundClass(right));
}

export const SOUND_SAFARI_OPTION_BANK = Object.freeze([
  ["a", "short_a"], ["e", "short_e"], ["i", "short_i"], ["o", "short_o"], ["u", "short_u"],
  ["sh", "sh"], ["ch", "ch"], ["th", "th"], ["ai", "ai"], ["ee", "ee"], ["oa", "oa"], ["oo", "oo"],
  ["ar", "ar"], ["or", "or"], ["b", "b"], ["c", "c"], ["d", "d"], ["f", "f"], ["g", "g"],
  ["h", "h"], ["j", "j"], ["l", "l"], ["m", "m"], ["n", "n"], ["p", "p"], ["r", "r"],
  ["s", "s"], ["t", "t"], ["v", "v"], ["w", "w"], ["z", "z"], ["ng", "ng"]
].map(([grapheme, soundKey]) => Object.freeze({ grapheme, soundKey })));

function integer(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function rotate(values, seed) {
  if (!values.length) return [];
  const offset = ((integer(seed) % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function asRecord(wordOrRecord) {
  return typeof wordOrRecord === "string" ? getSoundSafariPronunciation(wordOrRecord) : wordOrRecord;
}

export function soundSafariDecoyUnits(wordOrRecord, seed = 0, count = 7) {
  const record = asRecord(wordOrRecord);
  const limit = Math.max(0, Math.min(7, integer(count, 7)));
  if (!record?.units?.length || limit === 0) return [];
  const labels = new Set(record.units.map(unit => unit.grapheme));
  const sounds = new Set(record.units.map(soundSafariSoundClass));
  const selected = [];
  for (const candidate of rotate(SOUND_SAFARI_OPTION_BANK, seed)) {
    const sound = soundSafariSoundClass(candidate);
    const audio = soundSafariUnitAudio(candidate);
    if (!sound || !audio.available || labels.has(candidate.grapheme) || sounds.has(sound)) continue;
    selected.push({
      ...candidate,
      occurrenceId: `${record.word}:${record.variantId}:decoy:${candidate.soundKey}`,
      audio
    });
    labels.add(candidate.grapheme);
    sounds.add(sound);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function soundSafariOptionsForUnit(wordOrRecord, unitIndex, { seed = 0, count = 8 } = {}) {
  const record = asRecord(wordOrRecord);
  const unit = Number.isInteger(unitIndex) && unitIndex >= 0 ? record?.units?.[unitIndex] : null;
  if (!unit || !soundSafariSoundClass(unit)) return [];
  const size = Math.max(4, Math.min(8, integer(count, 8)));
  const decoys = soundSafariDecoyUnits(record, integer(seed) + unitIndex, size - 1);
  const target = { ...unit, audio: soundSafariUnitAudio(unit, record.word) };
  return rotate([target, ...decoys], integer(seed) + unitIndex);
}
