import { CAMPAIGN_HELP_LINES } from '../content/campaignLanguage.js';
import { INITIAL_SOUND_TARGET_IDS } from '../../content/teachTargetMetadata.js';
// Sound Seekers v3 — item authoring, one builder per mechanic.
//
// Every builder returns a Beat:
//   { id, mechanic, stopId, targetIds, domain, prompt, view, key, review }
// `view` is everything the renderer/HUD may see. `key` is engine-only and is
// stripped by publicBeat() before anything reaches React or the canvas.
//
// Rules honoured here (docs/content/QUESTION_DESIGN_BIBLE.md, GAME_DESIGN_BIBLE):
//   • exactly one correct answer under the spoken + visible prompt
//   • distractors differ in SOUND (f/ff, c/k, ai/ay are never offered together)
//   • three options by default; order from a seeded shuffle, never fixed
//   • a build-the-word tile bank holds everything needed and nothing that
//     spells the word another accepted way
//   • decoding items are never solvable from a picture

import { createRng, hashSeed } from "./rng.js";
import {
  decodableWordsThrough, heartWordsKnownThrough, isSoundDistinct, phonemeAudio, soundLabel,
  targetAudio, targetInfo, targetsThrough, unitsFor, wordAudio, wordImage
} from "./lexicon.js";

export const MECHANICS = Object.freeze({
  SIGNPOST: "sound_signpost",
  ECHO_HUNT: "echo_hunt",
  SOUND_SORT: "sound_sort",
  WORD_FORGE: "word_forge",
  BLEND_BRIDGE: "blend_bridge",
  HEART_LANTERN: "heart_lantern",
  GATE_RIDDLE: "gate_riddle",
  STORY_BRIDGE: "story_bridge"
});

export const DOMAINS = Object.freeze({
  P2G: "phoneme_to_grapheme",
  G2P: "grapheme_to_phoneme",
  DECODE: "word_decoding",
  ENCODE: "word_segmentation_encoding",
  TEXT: "connected_text_transfer",
  HEART: "heart_word_mapping",
  NOVEL: "novel_decoding"
});

const SCORED_KINDS = new Set(["letter", "vowel", "double", "digraph", "split", "team", "r-controlled", "suffix", "alt"]);

function seedFor(stopId, beatTag, ordinal) {
  return hashSeed(`${stopId}|${beatTag}|${ordinal}`);
}

// ── Sound Signpost (teach) ──────────────────────────────────────────────────
// One signpost per real grapheme; blends and morphology are grouped onto one
// signpost with a card per target (each card is still its own teach event).
function signCard(targetId) {
  const info = targetInfo(targetId);
  if (!info) return null;
  const example = info.anchorWord || "";
  const alt = info.kind === "alt";
  return {
    targetId,
    grapheme: info.grapheme,
    kind: info.kind,
    soundLabel: soundLabel(targetId),
    title: info.kind === "morph" ? `${info.baseWord} → ${example}` : alt && example ? `${info.grapheme} in ${example}` : info.grapheme,
    line: info.kind === "blend"
      ? `${info.grapheme} — say it quickly: ${example}.`
      : info.kind === "morph"
        ? `${info.baseWord} → ${example}: ${info.meaning}.`
        : alt
          ? `${info.grapheme} can also say ${soundLabel(targetId)}, like in ${example}.`
          : `${info.grapheme} says ${soundLabel(targetId)}, like in ${example}.`,
    baseWord: info.baseWord || "",
    baseAudio: info.baseWord ? wordAudio(info.baseWord) : "",
    meaning: info.meaning || "",
    anchorWord: example,
    anchorImage: example ? wordImage(example) : "",
    anchorAudio: example ? wordAudio(example) : "",
    phonemeAudio: targetAudio(targetId),
    unitAudio: (info.kind === "morph" ? [] : info.units || []).map(u => ({ grapheme: u.grapheme, audio: phonemeAudio(u.soundKey, example) }))
  };
}

export function buildSignpost({ stopId, targetIds, ordinal = 0, index }) {
  const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
  const cards = ids.map(signCard).filter(Boolean);
  if (!cards.length) return null;
  const first = cards[0];
  const grouped = cards.length > 1;
  return {
    id: `${stopId}-teach-${ids.join("+")}`,
    mechanic: MECHANICS.SIGNPOST,
    stopId,
    targetIds: ids,
    domain: null,
    review: false,
    prompt: {
      text: grouped
        ? `Meet ${cards.map(c => c.grapheme).join(", ")}.`
        : INITIAL_SOUND_TARGET_IDS.includes(first.targetId) ? `${first.grapheme} · ${first.anchorWord.charAt(0).toUpperCase()+first.anchorWord.slice(1)} starts with ${first.soundLabel}.` : first.kind === "morph" ? `Meet ${first.title}.` : `Meet ${first.title}. It says ${first.soundLabel}.`,
      cues: [
        first.phonemeAudio ? { kind: "phoneme", src: first.phonemeAudio } : null,
        first.baseAudio ? { kind: "word", src: first.baseAudio, text: first.baseWord } : null,
        first.anchorAudio ? { kind: "word", src: first.anchorAudio, text: first.anchorWord } : null
      ].filter(Boolean)
    },
    view: { cards, grouped, position: index },
    key: null,
    seed: seedFor(stopId, `teach-${ids.join("+")}`, ordinal)
  };
}

// ── Echo Hunt (hear a sound → pick its letter) ──────────────────────────────
export function buildEchoHunt({ stopId, stopIndex, targetId, ordinal = 0, review = false }) {
  const info = targetInfo(targetId);
  if (!info || !SCORED_KINDS.has(info.kind)) return null;
  const rng = createRng(seedFor(stopId, `echo-${targetId}`, ordinal));
  const pool = targetsThrough(stopIndex)
    .filter(id => id !== targetId && SCORED_KINDS.has(targetInfo(id)?.kind) && isSoundDistinct(targetId, id));
  const uniqueByGrapheme = [];
  const seen = new Set([info.grapheme]);
  for (const id of rng.shuffle(pool)) {
    const g = targetInfo(id).grapheme;
    if (seen.has(g)) continue;
    seen.add(g);
    uniqueByGrapheme.push(id);
    if (uniqueByGrapheme.length === 2) break;
  }
  if (uniqueByGrapheme.length < 2) return null;
  const options = rng.shuffle([targetId, ...uniqueByGrapheme]).map((id, i) => ({
    id: `opt${i}`,
    targetId: id,
    grapheme: targetInfo(id).grapheme,
    soundLabel: soundLabel(id),
    audio: targetAudio(id)
  }));
  const correct = options.find(o => o.targetId === targetId);
  return {
    id: `${stopId}-echo-${targetId}-${ordinal}`,
    mechanic: MECHANICS.ECHO_HUNT,
    stopId,
    targetIds: [targetId],
    domain: DOMAINS.P2G,
    review,
    prompt: {
      text: `Find ${soundLabel(targetId)}.`,
      cues: targetAudio(targetId) ? [{ kind: "phoneme", src: targetAudio(targetId) }] : []
    },
    view: {
      target: { soundLabel: soundLabel(targetId), audio: targetAudio(targetId), anchorWord: info.anchorWord, anchorAudio: wordAudio(info.anchorWord) },
      options: options.map(o => ({ id: o.id, grapheme: o.grapheme, audio: o.audio, soundLabel: o.soundLabel }))
    },
    key: { optionId: correct.id, optionTargets: Object.fromEntries(options.map(o => [o.id, o.targetId])) },
    seed: rng.next()
  };
}

// ── Sound Sort (two bins, four items) ───────────────────────────────────────
function firstUnit(word) {
  const units = unitsFor(word);
  return units?.[0] || null;
}

export function buildSoundSort({ stopId, stopIndex, stop, targetA, targetB, ordinal = 0, review = false }) {
  const a = targetInfo(targetA);
  const b = targetInfo(targetB);
  if (!a || !b) return null;
  const curated = Boolean(stop?.sortWords?.[targetA] && stop?.sortWords?.[targetB]);
  // A curated pair is the SAME spelling with two sounds (y in by / happy) — that
  // is the lesson, so the distinct-spelling check does not apply to it.
  if (!curated && !isSoundDistinct(targetA, targetB)) return null;
  const rng = createRng(seedFor(stopId, `sort-${targetA}-${targetB}`, ordinal));
  let itemsA;
  let itemsB;
  let mode = "initial";
  if (curated) {
    // Alternative pronunciation stop: read the word, decide the sound.
    mode = "read";
    itemsA = stop.sortWords[targetA];
    itemsB = stop.sortWords[targetB];
  } else {
    const pool = [...new Set([...(stop?.words || []), ...decodableWordsThrough(stopIndex)])]
      .filter(word => unitsFor(word));
    const g = info => info.grapheme.replace(/_e$/, "");
    const hasSound = (word, info) => unitsFor(word).some(u => u.grapheme === g(info) && u.role !== "irregular");
    const startsWith = (word, info) => {
      const u = firstUnit(word);
      return u && u.grapheme === g(info) && u.role !== "irregular";
    };
    // Prefer initial-sound items; fall back to "has the sound" as long as a
    // word never carries both sounds (that would make the item ambiguous).
    const onlyA = word => hasSound(word, a) && !hasSound(word, b);
    const onlyB = word => hasSound(word, b) && !hasSound(word, a);
    itemsA = pool.filter(word => startsWith(word, a) && onlyA(word));
    itemsB = pool.filter(word => startsWith(word, b) && onlyB(word));
    if (itemsA.length < 2 || itemsB.length < 2) {
      mode = "contains";
      itemsA = pool.filter(onlyA);
      itemsB = pool.filter(onlyB);
    }
  }
  itemsA = rng.shuffle(itemsA).slice(0, 2);
  itemsB = rng.shuffle(itemsB).slice(0, 2);
  if (itemsA.length < 2 || itemsB.length < 2) return null;
  const bins = rng.shuffle([
    { id: "binA", targetId: targetA, grapheme: a.grapheme, soundLabel: soundLabel(targetA), audio: targetAudio(targetA), anchorWord: a.anchorWord, anchorAudio: wordAudio(a.anchorWord) },
    { id: "binB", targetId: targetB, grapheme: b.grapheme, soundLabel: soundLabel(targetB), audio: targetAudio(targetB), anchorWord: b.anchorWord, anchorAudio: wordAudio(b.anchorWord) }
  ]);
  const binFor = t => bins.find(x => x.targetId === t).id;
  const items = rng.shuffle([
    ...itemsA.map(word => ({ word, bin: binFor(targetA) })),
    ...itemsB.map(word => ({ word, bin: binFor(targetB) }))
  ]).map((item, i) => ({ id: `item${i}`, ...item }));
  return {
    id: `${stopId}-sort-${targetA}-${targetB}-${ordinal}`,
    mechanic: MECHANICS.SOUND_SORT,
    stopId,
    targetIds: [targetA, targetB],
    domain: mode === "read" ? DOMAINS.G2P : DOMAINS.P2G,
    review,
    prompt: {
      text: mode === "read"
        ? `Read it. Like ${a.anchorWord} or like ${b.anchorWord}?`
        : mode === "contains"
          ? `Listen. Which sound is inside: ${soundLabel(targetA)} or ${soundLabel(targetB)}?`
          : `Listen. First sound: ${soundLabel(targetA)} or ${soundLabel(targetB)}?`,
      cues: mode === "read" ? [{ kind: "instruction", src: CAMPAIGN_HELP_LINES["read-sound-group"].audio }] : []
    },
    view: {
      mode,
      bins: bins.map(({ id, grapheme, soundLabel: s, audio, anchorWord, anchorAudio }) => ({ id, grapheme, soundLabel: s, audio, anchorWord: mode === "read" ? anchorWord : "", anchorAudio: mode === "read" ? anchorAudio : "" })),
      items: items.map(({ id, word }) => ({ id, word, audio: wordAudio(word), image: mode === "read" ? "" : wordImage(word) }))
    },
    key: { bins: Object.fromEntries(items.map(i => [i.id, i.bin])), binTargets: Object.fromEntries(bins.map(b => [b.id, b.targetId])) },
    seed: rng.next()
  };
}

// ── word helpers ────────────────────────────────────────────────────────────
function regularWord(word) {
  const units = unitsFor(word);
  return units && units.length >= 2 && units.every(u => u.role !== "irregular");
}

export function pickBuildWords({ stop, stopIndex, newTargets, rng, count = 2, exclude = [], preferPicture = false }) {
  const targetSet = new Set(newTargets);
  const scored = [...new Set(stop.words)]
    .filter(word => regularWord(word) && !exclude.includes(word))
    .map(word => {
      const units = unitsFor(word);
      const hits = units.filter(u => u.targetId && targetSet.has(u.targetId)).length;
      const size = units.length;
      const picture = preferPicture && wordImage(word) ? 6 : 0;
      return { word, score: hits * 10 + picture + (size === 3 ? 4 : size === 2 ? 2 : size === 4 ? 1 : 0) + rng.next() };
    })
    .sort((x, y) => y.score - x.score);
  const chosen = scored.slice(0, count).map(s => s.word);
  if (chosen.length < count) {
    for (const word of rng.shuffle(decodableWordsThrough(stopIndex))) {
      if (chosen.length >= count) break;
      if (!chosen.includes(word) && regularWord(word) && !exclude.includes(word)) chosen.push(word);
    }
  }
  return chosen;
}

// ── Word Forge (hear the word → build it) ───────────────────────────────────
export function buildWordForge({ stopId, stopIndex, word, ordinal = 0, review = false, novel = false }) {
  const units = unitsFor(word);
  if (!units || units.length < 2) return null;
  const rng = createRng(seedFor(stopId, `forge-${word}`, ordinal));
  const used = new Set(units.map(u => u.grapheme));
  const usedSounds = new Set(units.map(u => u.soundKey));
  // distractor tiles: taught graphemes with a different sound from every unit
  const pool = targetsThrough(stopIndex)
    .map(targetInfo)
    .filter(info => info && SCORED_KINDS.has(info.kind))
    .map(info => ({ grapheme: info.grapheme.replace(/_e$/, ""), soundKey: info.soundKey, targetId: info.id }))
    .filter(t => !used.has(t.grapheme) && !usedSounds.has(t.soundKey) && !/_/.test(t.grapheme));
  const distinctPool = [];
  const seen = new Set();
  for (const t of rng.shuffle(pool)) {
    if (seen.has(t.grapheme) || seen.has(t.soundKey)) continue;
    // never offer a doubled letter beside its single or vice-versa
    if ([...used].some(g => g.length === 2 && g[0] === g[1] && g[0] === t.grapheme)) continue;
    if (t.grapheme.length === 2 && t.grapheme[0] === t.grapheme[1] && used.has(t.grapheme[0])) continue;
    seen.add(t.grapheme); seen.add(t.soundKey);
    distinctPool.push(t);
    if (distinctPool.length === 2) break;
  }
  const tiles = rng.shuffle([
    ...units.map((u, i) => ({ id: `u${i}`, grapheme: u.grapheme, soundKey: u.soundKey, unitIndex: i })),
    ...distinctPool.map((t, i) => ({ id: `d${i}`, grapheme: t.grapheme, soundKey: t.soundKey, unitIndex: -1 }))
  ]).map(t => ({ ...t, audio: phonemeAudio(t.soundKey, word) }));
  return {
    id: `${stopId}-forge-${word}-${ordinal}`,
    mechanic: MECHANICS.WORD_FORGE,
    stopId,
    targetIds: [...new Set(units.map(u => u.targetId).filter(Boolean))],
    domain: novel ? DOMAINS.NOVEL : DOMAINS.ENCODE,
    review,
    prompt: { text: `Build ${word}.`, cues: wordAudio(word) ? [{ kind: "word", src: wordAudio(word), text: word }] : [] },
    view: {
      word,
      wordAudio: wordAudio(word),
      image: wordImage(word),
      slots: units.length,
      tiles: tiles.map(({ id, grapheme, audio }) => ({ id, grapheme, audio })),
      novel
    },
    key: {
      sequence: units.map((u, i) => tiles.find(t => t.unitIndex === i).id),
      tileSounds: Object.fromEntries(tiles.map(t => [t.id, t.soundKey]))
    },
    seed: rng.next()
  };
}

// ── Blend Bridge (tap the stones → blend → pick the meaning) ────────────────
export function buildBlendBridge({ stopId, stopIndex, word, ordinal = 0, review = false }) {
  const units = unitsFor(word);
  if (!units || units.length < 2) return null;
  const rng = createRng(seedFor(stopId, `blend-${word}`, ordinal));
  const image = wordImage(word);
  const pictureOthers = image
    ? rng.shuffle(decodableWordsThrough(stopIndex).filter(w => w !== word && wordImage(w) && regularWord(w))).slice(0, 2)
    : [];
  let options;
  let mode;
  if (image && pictureOthers.length === 2) {
    mode = "picture";
    options = rng.shuffle([word, ...pictureOthers]).map((w, i) => ({ id: `opt${i}`, word: w, image: wordImage(w), audio: wordAudio(w) }));
  } else {
    mode = "print";
    const others = rng.shuffle(decodableWordsThrough(stopIndex).filter(w => w !== word && regularWord(w) && Math.abs(w.length - word.length) <= 1))
      .slice(0, 2);
    if (others.length < 2) return null;
    options = rng.shuffle([word, ...others]).map((w, i) => ({ id: `opt${i}`, word: w, image: "", audio: wordAudio(w) }));
  }
  const correct = options.find(o => o.word === word);
  return {
    id: `${stopId}-blend-${word}-${ordinal}`,
    mechanic: MECHANICS.BLEND_BRIDGE,
    stopId,
    targetIds: [...new Set(units.map(u => u.targetId).filter(Boolean))],
    domain: DOMAINS.DECODE,
    review,
    prompt: { text: "Tap each sound. Then blend.", cues: [] },
    view: {
      word: null, // the word is revealed only after the blend
      stones: units.map((u, i) => ({ id: `s${i}`, grapheme: u.grapheme, audio: phonemeAudio(u.soundKey, word) })),
      wordAudio: wordAudio(word),
      mode,
      options: options.map(o => ({ id: o.id, word: mode === "print" ? o.word : null, image: o.image, audio: mode === "picture" ? "" : o.audio }))
    },
    key: { optionId: correct.id, word, optionWords: Object.fromEntries(options.map(o => [o.id, o.word])) },
    seed: rng.next()
  };
}

// ── Heart Word Lantern (sight / high-frequency words) ───────────────────────
const PHRASES = Object.freeze({
  the: ["the {noun}"], a: ["a {noun}"], i: ["I {verb}"], is: ["it is {adj}"], to: ["go to the {noun}"],
  and: ["{noun} and {noun2}"], go: ["go, {noun}, go"], my: ["my {noun}"], he: ["he {verb}"], she: ["she {verb}"],
  we: ["we {verb}"], me: ["{verb} me"], be: ["be {adj}"], was: ["it was {adj}"], no: ["no, {noun}, no"],
  you: ["you {verb}"], they: ["they {verb}"], her: ["her {noun}"], all: ["all the {noun}s"], are: ["we are {adj}"],
  said: ["\"{verb}!\" said {noun}"], so: ["so {adj}"], have: ["I have a {noun}"], like: ["I like the {noun}"],
  some: ["some {noun}s"], come: ["come, {noun}"], were: ["we were {adj}"], there: ["there is a {noun}"],
  little: ["a little {noun}"], one: ["one {noun}"], do: ["do it, {noun}"], when: ["when I {verb}"], out: ["get out, {noun}"],
  what: ["what a {noun}!"], oh: ["oh, my {noun}"], their: ["their {noun}"], people: ["the people {verb}"],
  looked: ["I looked at the {noun}"], called: ["I called the {noun}"], asked: ["I asked the {noun}"], your: ["your {noun}"],
  water: ["the water is {adj}"], where: ["where is the {noun}?"], who: ["who has the {noun}?"], again: ["{verb} again"],
  thought: ["I thought of a {noun}"], through: ["run through the {noun}"], work: ["we work"], any: ["any {noun}"],
  many: ["many {noun}s"], laughed: ["we laughed"], because: ["because it is {adj}"], different: ["a different {noun}"],
  eyes: ["big eyes"], friends: ["my friends"], once: ["once, a {noun}"], please: ["please, {noun}"], could: ["I could {verb}"],
  would: ["I would {verb}"], should: ["I should {verb}"]
});
const NOUNS = ["mat", "cat", "hat", "man", "dad", "pig", "cup", "bun", "dog", "hen", "fox", "net", "bed", "sun", "bus", "log", "frog", "ship", "fish", "duck", "tree", "boat", "king", "bag", "pot", "pen", "rat", "lid", "bin", "web", "map", "van", "box"];
const VERBS = ["sit", "sat", "ran", "hop", "run", "dig", "nap", "hug", "jog", "win", "hum", "tap", "skip", "jump", "sing", "look", "wait", "read"];
const ADJS = ["hot", "wet", "big", "sad", "mad", "fat", "red", "fun", "soft", "glad", "quick", "bright", "cool"];

function fill(template, decodable, rng) {
  const pick = (list, exclude = []) => {
    const ok = list.filter(w => decodable.has(w) && !exclude.includes(w));
    return ok.length ? rng.pick(ok) : null;
  };
  const noun = pick(NOUNS);
  const noun2 = pick(NOUNS, [noun]);
  const verb = pick(VERBS);
  const adj = pick(ADJS);
  const out = template
    .replace("{noun2}", noun2 || "")
    .replace("{noun}", noun || "")
    .replace("{verb}", verb || "")
    .replace("{adj}", adj || "");
  if (/\{|\s{2,}|^\s|,\s*,/.test(out) || (!noun && /noun/.test(template)) || (!verb && /verb/.test(template)) || (!adj && /adj/.test(template))) return null;
  return out.trim();
}

export function buildHeartLantern({ stopId, stopIndex, word, ordinal = 0, review = false }) {
  const units = unitsFor(word);
  const rng = createRng(seedFor(stopId, `heart-${word}`, ordinal));
  const heartIndices = units ? units.map((u, i) => (u.role === "irregular" ? i : -1)).filter(i => i >= 0) : [];
  const lower = word.toLowerCase();
  const known = heartWordsKnownThrough(stopIndex).map(w => w.toLowerCase()).filter(w => w !== lower);
  const lookalikes = rng.shuffle(known.filter(w => w[0] === lower[0] || w.length === lower.length));
  const others = [...lookalikes, ...rng.shuffle(known.filter(w => !lookalikes.includes(w)))].slice(0, 2);
  if (others.length < 2) {
    for (const w of rng.shuffle(decodableWordsThrough(stopIndex))) {
      if (others.length >= 2) break;
      if (w !== lower && Math.abs(w.length - lower.length) <= 1 && !others.includes(w)) others.push(w);
    }
  }
  if (others.length < 2) return null;
  const display = w => (w === "i" ? "I" : w);
  const options = rng.shuffle([lower, ...others]).map((w, i) => ({ id: `opt${i}`, word: display(w), audio: wordAudio(w) }));
  const decodable = new Set([...decodableWordsThrough(stopIndex), ...heartWordsKnownThrough(stopIndex).map(w => w.toLowerCase()), lower]);
  const phraseTemplates = PHRASES[lower] || [];
  let phrase = null;
  for (const t of rng.shuffle(phraseTemplates)) {
    phrase = fill(t, decodable, rng);
    if (phrase) break;
  }
  const correct = options.find(o => o.word.toLowerCase() === lower);
  return {
    id: `${stopId}-heart-${lower}-${ordinal}`,
    mechanic: MECHANICS.HEART_LANTERN,
    stopId,
    targetIds: [`hw:${lower}`],
    domain: DOMAINS.HEART,
    review,
    prompt: { text: `Find ${display(lower)}.`, cues: wordAudio(lower) ? [{ kind: "word", src: wordAudio(lower), text: display(lower) }] : [] },
    view: {
      word: display(lower),
      letters: display(lower).split(""),
      heartLetterIndices: units ? heartIndices.flatMap(i => (units[i]?.grapheme ? rangeOf(units, i) : [])) : [],
      wordAudio: wordAudio(lower),
      options: options.map(o => ({ id: o.id, word: o.word, audio: o.audio })),
      phrase: phrase ? { text: phrase, words: phrase.split(/\s+/).map(w => ({ text: w, audio: wordAudio(w.replace(/[^a-z']/gi, "")) })) } : null
    },
    key: { optionId: correct.id, optionWords: Object.fromEntries(options.map(o => [o.id, o.word.toLowerCase()])) },
    seed: rng.next()
  };
}

function rangeOf(units, unitIndex) {
  // letter indices covered by unit i (graphemes are contiguous)
  let start = 0;
  for (let i = 0; i < unitIndex; i += 1) start += units[i].grapheme.length;
  const len = units[unitIndex].grapheme.length;
  return Array.from({ length: len }, (_, k) => start + k);
}

// ── Gate Riddle (logic puzzle: apply a sound rule to three keys) ────────────
const RULES = ["starts_like", "ends_like", "rhymes_with", "sound_count"];

export function buildGateRiddle({ stopId, stopIndex, ordinal = 0, review = false, preferTargets = [] }) {
  const rng = createRng(seedFor(stopId, "gate", ordinal));
  const words = decodableWordsThrough(stopIndex).filter(w => regularWord(w) && wordAudio(w));
  if (words.length < 6) return null;
  const withUnits = words.map(w => ({ word: w, units: unitsFor(w) }));
  const prefer = new Set(preferTargets);
  const scoreWord = w => w.units.some(u => prefer.has(u.targetId)) ? 1 : 0;
  for (const rule of rng.shuffle(RULES)) {
    const built = tryRule(rule, withUnits, rng, scoreWord);
    if (built) {
      const { text, anchor, keys, correct, targets } = built;
      const options = rng.shuffle(keys).map((w, i) => ({ id: `key${i}`, word: w, audio: wordAudio(w) }));
      return {
        id: `${stopId}-gate-${ordinal}`,
        mechanic: MECHANICS.GATE_RIDDLE,
        stopId,
        targetIds: targets,
        domain: DOMAINS.DECODE,
        review,
        prompt: { text, cues: anchor && wordAudio(anchor) ? [{ kind: "word", src: wordAudio(anchor), text: anchor }] : [] },
        view: {
          rule,
          ruleText: text,
          anchor: anchor ? { word: anchor, audio: wordAudio(anchor), image: wordImage(anchor) } : null,
          keys: options.map(o => ({ id: o.id, word: o.word, audio: o.audio }))
        },
        key: { keyId: options.find(o => o.word === correct).id, optionWords: Object.fromEntries(options.map(o => [o.id, o.word])) },
        seed: rng.next()
      };
    }
  }
  return null;
}

function tryRule(rule, withUnits, rng, scoreWord) {
  const shuffled = rng.shuffle(withUnits).sort((a, b) => scoreWord(b) - scoreWord(a) + (rng.next() - 0.5) * 0.5);
  const first = w => w.units[0].soundKey;
  const last = w => w.units[w.units.length - 1].soundKey;
  const rime = w => w.units.slice(1).map(u => u.soundKey).join("-");
  for (const anchor of shuffled) {
    let matcher; let text;
    if (rule === "starts_like") { matcher = w => first(w) === first(anchor); text = `The gate opens for a word that starts like ${anchor.word}.`; }
    else if (rule === "ends_like") { matcher = w => last(w) === last(anchor); text = `The gate opens for a word that ends like ${anchor.word}.`; }
    else if (rule === "rhymes_with") { matcher = w => rime(w) === rime(anchor) && first(w) !== first(anchor); text = `The gate opens for a word that rhymes with ${anchor.word}.`; }
    else { matcher = null; }
    if (rule === "sound_count") {
      const n = anchor.units.length;
      if (n < 2 || n > 4) continue;
      const yes = shuffled.filter(w => w.units.length === n);
      const no = shuffled.filter(w => w.units.length !== n && Math.abs(w.units.length - n) === 1);
      if (yes.length < 1 || no.length < 2) continue;
      const correct = yes[0].word;
      const keys = [correct, no[0].word, no[1].word];
      return { text: `The gate opens for a word with ${n} sounds.`, anchor: null, keys, correct, targets: [...new Set(yes[0].units.map(u => u.targetId).filter(Boolean))] };
    }
    const yes = shuffled.filter(w => w.word !== anchor.word && matcher(w));
    const no = shuffled.filter(w => w.word !== anchor.word && !matcher(w) && (rule !== "rhymes_with" || last(w) !== last(anchor)));
    if (yes.length < 1 || no.length < 2) continue;
    const correct = yes[0].word;
    return { text, anchor: anchor.word, keys: [correct, no[0].word, no[1].word], correct, targets: [...new Set(yes[0].units.map(u => u.targetId).filter(Boolean))] };
  }
  return null;
}

// ── Story Bridge (read a decodable line → choose the matching action) ───────
export function buildStoryBridge({ stopId, story, ordinal = 0 }) {
  if (!story?.text || !Array.isArray(story.choices) || story.choices.length < 2) return null;
  const rng = createRng(seedFor(stopId, "story", ordinal));
  const choices = rng.shuffle(story.choices).map((c, i) => ({ id: `c${i}`, label: c.label, icon: c.icon, correct: Boolean(c.correct) }));
  const correct = choices.find(c => c.correct);
  if (!correct) return null;
  const words = story.text.split(/\s+/).map(text => ({ text, audio: wordAudio(text.replace(/[^a-z']/gi, "")) }));
  return {
    id: `${stopId}-story-${ordinal}`,
    mechanic: MECHANICS.STORY_BRIDGE,
    stopId,
    targetIds: [],
    domain: DOMAINS.TEXT,
    review: false,
    prompt: { text: "Read the note. Then choose.", cues: [] },
    view: { text: story.text, words, choices: choices.map(({ id, label, icon }) => ({ id, label, icon })) },
    key: { choiceId: correct.id },
    seed: rng.next()
  };
}

// ── Public projection ───────────────────────────────────────────────────────
const FORBIDDEN = /answer|correct|expected|evidence|score/i;

export function publicBeat(beat) {
  if (!beat) return null;
  const rest = { ...beat };
  delete rest.key;
  const json = JSON.stringify(rest.view);
  if (FORBIDDEN.test(Object.keys(rest.view).join(" ")) || /"(expected|correct|answerId)":/.test(json)) {
    throw new Error(`Beat ${beat.id} leaks answer information into its view`);
  }
  return rest;
}
