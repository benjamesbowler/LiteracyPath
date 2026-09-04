// Sound Seekers v3 — the lexicon boundary.
//
// Everything the game knows about sounds, letters and words comes through
// here, from the same authored sources the rest of the app uses:
//   • src/data/questSequence.js          — what is taught, when, and which words
//   • teachTargetMetadata.js             — anchor word + sound key per target
//   • pronunciationRecords.js            — authored grapheme units per word
//   • phonemeAudioBank.js / childAssets  — committed audio and pictures
// No runtime spelling-derived segmentation is used for scoring: a word with no
// authored pronunciation record is not offered in a segment/blend item.

import { QUEST_STOPS, heartWordsThrough, taughtThrough, wordsThrough } from "../../../../data/questSequence.js";
import { SOUND_SEEKERS_TEACH_TARGETS } from "../../content/teachTargetMetadata.js";
import { getPronunciation } from "../../content/pronunciationLexicon.js";
import { getPreferredPhonemeAudioPath } from "../../../../data/phonemeAudioBank.js";
import { getChildWordAsset } from "../../../../data/childAssets.js";

const SHORT_VOWEL_KEY = { a: "short_a", e: "short_e", i: "short_i", o: "short_o", u: "short_u" };

// Child-facing label for a target id (never the internal id).
const TARGET_LABELS = Object.freeze({
  y_ie: "y", y_ee: "y", oo_short: "oo", ow_ou: "ow", c_s: "c", g_j: "g", ch_k: "ch", ea_e: "ea",
  suffix_s: "-s", suffix_ing: "-ing", suffix_ed: "-ed"
});

// Child-facing sound labels where the spelling is not the sound.
const SOUND_LABELS = Object.freeze({
  y_ie: "igh", y_ee: "ee", oo_short: "oo", ow_ou: "ow", c_s: "s", g_j: "j", ch_k: "k", ea_e: "e",
  a_e: "ay", i_e: "igh", o_e: "oa", u_e: "yoo", e_e: "ee", ai: "ay", ee: "ee", ea: "ee", igh: "igh", ie: "igh",
  oa: "oa", ow: "oa", oe: "oa", oo: "oo", ue: "oo", ew: "oo", ou: "ow", oi: "oy", oy: "oy",
  ar: "ar", or: "or", aw: "or", ore: "or", er: "er", ir: "er", ur: "er", air: "air", are: "air",
  ear: "ear", ure: "ure", le: "ul", tion: "shun", qu: "kw", x: "ks", ck: "k", nk: "nk", ng: "ng", wh: "w", c: "k", k: "k", y: "y"
});

// Spoken/shown name of the sound for a target, e.g. "/m/".
export function soundLabel(targetId) {
  const info = targetInfo(targetId);
  if (!info) return "";
  if (info.kind === "morph") return info.grapheme;
  if (info.kind === "blend") return `/${info.grapheme}/`;
  return `/${SOUND_LABELS[targetId] || info.grapheme}/`;
}

export function displayGrapheme(targetId) {
  if (TARGET_LABELS[targetId]) return TARGET_LABELS[targetId];
  return String(targetId).replace(/^(.)_e$/, "$1_e");
}

const TARGET_KIND = new Map(QUEST_STOPS.flatMap(stop => stop.teach.map(t => [t.id, t])));

export function targetInfo(targetId) {
  const teach = TARGET_KIND.get(targetId);
  if (!teach) return null;
  const meta = SOUND_SEEKERS_TEACH_TARGETS[targetId] || null;
  const unit = meta?.units?.[0] || null;
  const soundKey = unit?.soundKey || SHORT_VOWEL_KEY[targetId] || targetId;
  return {
    id: targetId,
    kind: teach.kind,
    base: teach.base || null,
    grapheme: displayGrapheme(targetId),
    soundKey,
    anchorWord: meta?.word || fallbackAnchor(targetId),
    units: meta?.units || [],
    cueKey: meta?.cueKey || null
  };
}

// First curriculum word that uses the target, for targets without an authored anchor.
const ANCHOR_CACHE = new Map();
function fallbackAnchor(targetId) {
  if (ANCHOR_CACHE.has(targetId)) return ANCHOR_CACHE.get(targetId);
  let found = "";
  for (const stop of QUEST_STOPS) {
    if (!stop.teach.some(t => t.id === targetId)) continue;
    for (const word of stop.words || []) {
      const units = getPronunciation(word)?.units || [];
      if (units.some(u => u.evidenceTargetId === targetId)) { found = word; break; }
    }
    if (found) break;
  }
  ANCHOR_CACHE.set(targetId, found);
  return found;
}

export function targetAudio(targetId) {
  const info = targetInfo(targetId);
  if (!info) return "";
  if (info.kind === "blend" || info.kind === "morph") return "";
  return getPreferredPhonemeAudioPath(info.cueKey || info.soundKey, { anchor: info.anchorWord }) || "";
}

export function phonemeAudio(soundKey, anchor = "") {
  return getPreferredPhonemeAudioPath(soundKey, { anchor }) || "";
}

export function wordAudio(word) {
  return getChildWordAsset(word)?.audio || "";
}

// Only clean, single-object pictures may stand for a word in a choice: the
// classroom-scene vocabulary illustrations are busy and some carry the printed
// word, which would answer the item for the child.
const CLEAN_PICTURE = /^\/images\/(child-mode|cvc|objects|short-[aeiou])\//;
export function wordImage(word) {
  const asset = getChildWordAsset(word);
  const candidates = [asset?.image, asset?.fallbackImage].filter(Boolean);
  return candidates.find(src => CLEAN_PICTURE.test(src)) || "";
}

// Authored units for a word: [{ grapheme, soundKey, role }]. Null when the
// corpus has no record (the game then does not offer the word in build/blend).
// Some corpus units carry no evidenceTargetId; infer it from the grapheme +
// sound so evidence still lands on the right curriculum target.
const TARGET_BY_GRAPHEME = new Map();
for (const stop of QUEST_STOPS) {
  for (const t of stop.teach) {
    const info = { id: t.id, kind: t.kind };
    const g = displayGrapheme(t.id);
    if (!TARGET_BY_GRAPHEME.has(g)) TARGET_BY_GRAPHEME.set(g, []);
    TARGET_BY_GRAPHEME.get(g).push(info);
  }
}
function inferTarget(grapheme, soundKey) {
  const list = TARGET_BY_GRAPHEME.get(grapheme) || TARGET_BY_GRAPHEME.get(grapheme.replace(/-/, "_"));
  if (!list?.length) return null;
  if (list.length === 1) return list[0].id;
  const bySound = list.find(t => normalizeKey(targetInfo(t.id)?.soundKey) === normalizeKey(soundKey));
  return (bySound || list.find(t => t.kind !== "alt") || list[0]).id;
}

export function unitsFor(word) {
  const record = getPronunciation(word);
  if (!record?.units?.length) return null;
  return record.units.map(unit => ({
    grapheme: unit.grapheme,
    soundKey: unit.soundKey,
    role: unit.role || "regular",
    targetId: unit.evidenceTargetId || (unit.role === "irregular" ? null : inferTarget(unit.grapheme, unit.soundKey))
  }));
}

export function soundKeysDiffer(a, b) {
  return normalizeKey(a) !== normalizeKey(b);
}

function normalizeKey(key) {
  const k = String(key || "").toLowerCase();
  return k.replace(/^short_/, "");
}

// Spellings that make the same sound (in the app's accent) — never offered
// against each other when the prompt names a sound.
const SOUND_CLASSES = [
  ["c", "k", "ck", "ch_k"], ["f", "ff"], ["l", "ll"], ["s", "ss", "c_s"], ["z", "zz"], ["j", "g_j"],
  ["a_e", "ai", "ay"], ["e_e", "ee", "ea", "y_ee"], ["i_e", "igh", "ie", "y_ie"], ["o_e", "oa", "ow", "oe"],
  ["u_e", "oo", "ue", "ew"], ["ou", "ow_ou"], ["oi", "oy"], ["er", "ir", "ur"], ["air", "are"], ["or", "aw", "ore"],
  ["e", "ea_e"], ["oo_short"], ["ear"], ["ure"]
];
const SOUND_CLASS_OF = new Map(SOUND_CLASSES.flatMap((group, i) => group.map(id => [id, `class${i}`])));

export function soundClass(targetId) {
  if (SOUND_CLASS_OF.has(targetId)) return SOUND_CLASS_OF.get(targetId);
  const audio = targetAudio(targetId);
  if (audio) return `audio:${audio}`;
  const info = targetInfo(targetId);
  return info ? `key:${normalizeKey(info.soundKey)}` : `id:${targetId}`;
}

export function isSoundDistinct(targetId, candidateId) {
  const a = targetInfo(targetId);
  const b = targetInfo(candidateId);
  if (!a || !b) return false;
  if (a.grapheme === b.grapheme) return false;
  if (soundClass(targetId) === soundClass(candidateId)) return false;
  if (!soundKeysDiffer(a.soundKey, b.soundKey)) return false;
  // doubled vs single letter of the same sound (l / ll, s / ss)
  if (b.grapheme.length === 2 && b.grapheme[0] === b.grapheme[1] && b.grapheme[0] === a.grapheme) return false;
  if (a.grapheme.length === 2 && a.grapheme[0] === a.grapheme[1] && a.grapheme[0] === b.grapheme) return false;
  return true;
}

// Everything taught up to and including a stop index, in teaching order.
export function targetsThrough(stopIndex) {
  return QUEST_STOPS.filter(stop => stop.index <= stopIndex).flatMap(stop => stop.teach.map(t => t.id));
}

export function graphemesThrough(stopIndex) {
  return taughtThrough(stopIndex);
}

export function decodableWordsThrough(stopIndex) {
  return wordsThrough(stopIndex);
}

export function heartWordsKnownThrough(stopIndex) {
  return heartWordsThrough(stopIndex);
}

const NAME_WHITELIST = new Set([
  "muddy", "woolly", "clucky", "splashy", "bouncy", "brave", "giggly", "hungry", "cuddly", "noisy",
  "grumpy", "sleepy", "shy", "tiny", "speedy", "chompy", "sunny", "dozy", "bossy", "wiggly", "zippy",
  "honky", "cheeky", "fancy", "pip", "wren", "flint", "spark", "burrow", "luna", "glimmer", "stone",
  "sam", "pam", "bob", "nan", "roy", "pete", "eve"
]);

// Greedy longest-match check that a word can be read with the graphemes taught
// by `stopIndex` (plus taught heart words and cast names). Used by the content
// test for Story Bridge lines, never for scoring.
export function isReadableAt(word, stopIndex) {
  const w = String(word || "").toLowerCase().replace(/[^a-z']/g, "");
  if (!w) return true;
  if (NAME_WHITELIST.has(w)) return true;
  if (heartWordsThrough(stopIndex).map(x => x.toLowerCase()).includes(w)) return true;
  if (wordsThrough(stopIndex).includes(w)) return true;
  const known = new Set([...taughtThrough(stopIndex)].map(g => g.replace(/_e$/, "")));
  const splits = [...taughtThrough(stopIndex)].filter(g => /_e$/.test(g)).map(g => g[0]);
  const stopsSoFar = QUEST_STOPS.filter(s => s.index <= stopIndex);
  const morphs = stopsSoFar.some(s => s.teach.some(t => t.kind === "morph"));
  const suffixes = morphs ? ["ing", "ed", "s"] : [];
  // strip an allowed suffix
  const base = suffixes.reduce((acc, suf) => (acc.endsWith(suf) && acc.length > suf.length + 1 ? acc.slice(0, -suf.length) : acc), w);
  return canSegment(base, known, splits);
}

function canSegment(word, known, splits) {
  const n = word.length;
  const ok = new Array(n + 1).fill(false);
  ok[0] = true;
  for (let i = 0; i < n; i += 1) {
    if (!ok[i]) continue;
    for (let len = 4; len >= 1; len -= 1) {
      const piece = word.slice(i, i + len);
      if (piece.length === len && known.has(piece)) ok[i + len] = true;
    }
    // split digraph: vowel + consonant + e
    if (i + 3 <= n && splits.includes(word[i]) && word[i + 2] === "e" && /[bcdfghjklmnpqrstvwxyz]/.test(word[i + 1]) && known.has(word[i + 1])) {
      ok[i + 3] = true;
    }
  }
  return ok[n];
}
