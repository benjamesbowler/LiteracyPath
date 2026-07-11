// SOUND SEEKERS — the round builder.
//
// Turns a stop's targets + words into the actual questions each shell asks.
// Pure and seeded: the same seed always produces the same rounds, so a bug is
// reproducible and a test can assert a real playthrough rather than a shrug.
//
// THE THREE FAIRNESS RULES, all enforced here and all unit-tested. Get any of
// them wrong and the child can win without reading:
//
//   1. NO GIVEAWAY DISTRACTORS. A wrong answer must be a plausible wrong answer.
//      If the cue is /sh/ and the choices are `sh`, `m`, `t`, a child who knows
//      nothing can still guess by shape. Distractors are drawn from sounds the
//      child HAS been taught, preferring ones they are currently weak at.
//
//   2. NO SAME-SOUND CHOICES. `c` and `k` both say /k/; `w` and `wh` both say
//      /w/. Offer both against a single spoken cue and BOTH answers are correct
//      — the child is right and the game says they're wrong. (elQuestEngine
//      already learned this; we reuse its rule.)
//
//   3. NOTHING AHEAD OF THE CURRICULUM. Every word, every distractor, every
//      grapheme comes from what has been taught by this stop. Never a sneak
//      preview of a sound the child has not met.

import { getStop, taughtThrough, wordsThrough, heartWordsThrough } from "../data/questSequence.js";
import { segmentWord, isDecodable } from "./questSegments.js";
import { weakestTargets, MASTERY_STATES } from "./questMastery.js";

// Graphemes that make the SAME phoneme. Never offer two of these against one
// spoken cue — both would be correct.
const SAME_SOUND = {
  c: ["k", "ck"],
  k: ["c", "ck"],
  ck: ["c", "k"],
  w: ["wh"],
  wh: ["w"],
  s: ["ss"],
  ss: ["s"],
  f: ["ff"],
  ff: ["f"],
  l: ["ll"],
  ll: ["l"],
  z: ["zz"],
  zz: ["z"],
  ai: ["ay"],
  ay: ["ai"],
  ee: ["ea"],
  ea: ["ee"],
  igh: ["ie"],
  ie: ["igh"],
  oi: ["oy"],
  oy: ["oi"],
  er: ["ir", "ur"],
  ir: ["er", "ur"],
  ur: ["er", "ir"]
};

export function sharesSound(a, b) {
  const x = String(a || "").toLowerCase();
  const y = String(b || "").toLowerCase();
  return x === y || (SAME_SOUND[x] || []).includes(y);
}

// Seeded PRNG. Deterministic on purpose — see the header.
export function makeRng(seed = 1) {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Pick `count` distractors for a cue. Prefers sounds the child is WEAK at (a
// distractor they can already reject teaches nothing), never a same-sound
// grapheme, never anything untaught.
export function pickDistractors(answer, { known, mastery = {}, count = 2, rng }) {
  const pool = [...known].filter(g => g !== answer && !sharesSound(answer, g));
  if (!pool.length) return [];

  const weak = new Set(weakestTargets(mastery, 8).map(w => w.target));
  const preferred = pool.filter(g => weak.has(g));
  const rest = pool.filter(g => !weak.has(g));

  const ordered = [...shuffle(preferred, rng), ...shuffle(rest, rng)];
  return ordered.slice(0, count);
}

// Words a child can read at this stop, decodable-only, no heart words (those
// are taught whole, not sounded out) — and containing `target` if asked.
export function wordsForTarget(target, stopIndex, { max = 6 } = {}) {
  const known = taughtThrough(stopIndex);
  const hearts = new Set(heartWordsThrough(stopIndex).map(w => w.toLowerCase()));
  return wordsThrough(stopIndex)
    .filter(w => !hearts.has(w.toLowerCase()))
    .filter(w => isDecodable(w, known))
    .filter(w => !target || segmentWord(w, { known }).includes(target))
    .slice(0, max);
}

// ── SOUND STONES — hear the sound, tap the letter ───────────────────────────
export function buildSoundStonesRound(target, { stopIndex, mastery, rng, choices = 3 }) {
  const known = taughtThrough(stopIndex);
  const distractors = pickDistractors(target, { known, mastery, count: choices - 1, rng });
  return {
    shell: "sound-stones",
    target,
    cue: { kind: "phoneme", grapheme: target },
    choices: shuffle([target, ...distractors], rng),
    answer: target
  };
}

// ── BEAST FEED — see the letter, tap the creature that SAYS it ─────────────
// The reverse direction of Sound Stones. This is what makes mastery rule 3
// (">= 2 different shells") actually bite: a child who has memorised "the sh
// stone is the third one" cannot fake this.
export function buildBeastFeedRound(target, { stopIndex, mastery, rng, choices = 3 }) {
  const known = taughtThrough(stopIndex);
  const distractors = pickDistractors(target, { known, mastery, count: choices - 1, rng });
  return {
    shell: "beast-feed",
    target,
    cue: { kind: "grapheme", grapheme: target },
    choices: shuffle([target, ...distractors], rng),
    answer: target
  };
}

// ── STONE BRIDGE — hear the word, lay one plank per grapheme, in order ──────
export function buildStoneBridgeRound(word, { stopIndex, mastery, rng, extras = 2 }) {
  const known = taughtThrough(stopIndex);
  const planks = segmentWord(word, { known });

  // The tray holds the word's graphemes plus a few decoys. Decoys must be
  // taught, and must not duplicate a plank (a duplicate plank is not a wrong
  // answer — it is the right answer twice, and the child gets marked wrong).
  const decoyPool = [...known].filter(g => !planks.includes(g));
  const weak = new Set(weakestTargets(mastery, 8).map(w => w.target));
  const ordered = [
    ...shuffle(decoyPool.filter(g => weak.has(g)), rng),
    ...shuffle(decoyPool.filter(g => !weak.has(g)), rng)
  ];

  return {
    shell: "stone-bridge",
    target: planks[0],
    word,
    planks,
    tray: shuffle([...planks, ...ordered.slice(0, extras)], rng),
    answer: planks
  };
}

// ── THE GATE — the mastery check. No hints, no retries, mixed shells. ───────
// 6 items drawn across BOTH directions, because a gate that only ever asks one
// way is a gate that measures one thing.
export function buildGateRounds(targets, { stopIndex, mastery, rng, items = 6 }) {
  const list = targets.length ? targets : [];
  if (!list.length) return [];

  const rounds = [];
  for (let i = 0; i < items; i += 1) {
    const target = list[i % list.length];
    const builder = i % 2 === 0 ? buildSoundStonesRound : buildBeastFeedRound;
    rounds.push({ ...builder(target, { stopIndex, mastery, rng, choices: 4 }), gate: true });
  }
  return rounds;
}

// ── The whole stop ─────────────────────────────────────────────────────────
// One call returns everything Stop N needs. The runner never has to know how a
// round is made, and the shells never have to know what a stop is.
export function buildStop(stopId, { mastery = {}, targets, seed = 1 } = {}) {
  const stop = getStop(stopId);
  if (!stop) return null;

  const rng = makeRng(seed);
  const stopIndex = stop.index;
  const list = (targets && targets.length ? targets : stop.teach.map(t => t.id))
    // A blend/morph target has no single grapheme to tap, so the letter-choice
    // shells skip it. (Slice 1 only reaches stop 1, which is all letters — but
    // the guard belongs here, not in a shell.)
    .filter(t => {
      const entry = stop.teach.find(e => e.id === t);
      return !entry || (entry.kind !== "blend" && entry.kind !== "morph");
    });

  const known = taughtThrough(stopIndex);
  const bridgeWords = stop.words.filter(w => isDecodable(w, known)).slice(0, 4);

  return {
    stopId,
    stopIndex,
    stop,
    targets: list,
    teach: stop.teach.map(entry => ({
      ...entry,
      examples: wordsForTarget(entry.id, stopIndex, { max: 3 })
    })),
    rounds: {
      "sound-stones": list.map(t => buildSoundStonesRound(t, { stopIndex, mastery, rng })),
      "beast-feed": list.map(t => buildBeastFeedRound(t, { stopIndex, mastery, rng })),
      "stone-bridge": bridgeWords.map(w => buildStoneBridgeRound(w, { stopIndex, mastery, rng })),
      gate: buildGateRounds(list, { stopIndex, mastery, rng })
    }
  };
}

export const MASTERY_STATES_REF = MASTERY_STATES;
