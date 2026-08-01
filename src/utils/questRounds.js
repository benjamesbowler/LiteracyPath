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

import { getStop, taughtThrough, wordsThrough, heartWordsThrough, blendsThrough } from "../data/questSequence.js";
import { segmentWord, isDecodable, evidenceTargetFor } from "./questSegments.js";
import { weakestTargets } from "./questMastery.js";

// Which taught BLENDS a word actually contains.
//
// A blend is two single-letter consonants sitting next to each other: "stop" has
// `st`, "hand" has `nd`, "black" has `bl`. It is not a grapheme, so it never
// appears in a segmentation — which is exactly why the blends at stops 12-15
// were, until this existed, creditable by NOTHING and therefore impossible to
// master. A child would have been stuck on every one of them forever, and
// nothing on screen would have looked broken.
//
// The evidence for a blend is a child reading or spelling a word that has one.
export function blendsIn(word, taughtBlends) {
  const planks = segmentWord(word);
  const found = [];
  for (let i = 0; i + 1 < planks.length; i += 1) {
    const pair = planks[i] + planks[i + 1];
    if (planks[i].length === 1 && planks[i + 1].length === 1 && taughtBlends.has(pair)) found.push(pair);
  }
  return [...new Set(found)];
}

// Graphemes that make the SAME phoneme — or LOOK identical on a tile. Never
// offer two members of one class against one spoken cue: both would be
// defensible, and a child marked wrong for a correct answer learns that the
// game lies. Declared as classes (one line per phoneme family) and expanded
// to the lookup below, so adding a spelling can't miss its symmetric pairs.
// The trail's own same-sound teaching stops (s26 oa/ow/oe, s27 oo/ue/ew,
// s32 or/aw/ore, s34 air/are) are exactly the families listed here.
const SAME_SOUND_CLASSES = [
  ["c", "k", "ck", "ch_k"],
  ["w", "wh"],
  ["s", "ss", "c_s"],
  ["f", "ff"],
  ["l", "ll"],
  ["z", "zz"],
  ["j", "g_j"],
  ["e", "ea_e"],
  ["ai", "ay", "a_e"],
  // "y" legitimately spells /ee/ (happy) and /igh/ (fly) once s16 teaches the
  // alternatives, so it can never stand as a distractor for either family.
  ["ee", "ea", "e_e", "y_ee", "y"],
  ["igh", "ie", "i_e", "y_ie", "y"],
  ["oi", "oy"],
  ["er", "ir", "ur"],
  ["oa", "ow", "oe", "o_e"],
  // oo_short says a different sound (book vs moon) but renders as the same
  // two letters — two identical-looking tiles is the same broken question.
  ["oo", "oo_short", "ue", "ew", "u_e"],
  ["ou", "ow", "ow_ou"],
  ["air", "are"],
  ["or", "ore", "aw"]
];

const SAME_SOUND = {};
for (const family of SAME_SOUND_CLASSES) {
  for (const grapheme of family) {
    SAME_SOUND[grapheme] = [...new Set([
      ...(SAME_SOUND[grapheme] || []),
      ...family.filter(member => member !== grapheme)
    ])];
  }
}

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
export function pickDistractors(answer, {
  known,
  mastery = {},
  count = 2,
  rng,
  avoidChoices = []
}) {
  const pool = [...known].filter(g => g !== answer && !sharesSound(answer, g));
  if (!pool.length) return [];

  const weak = new Set(weakestTargets(mastery, 8).map(w => w.target));
  const previous = new Set(avoidChoices);
  const novel = pool.filter(g => !previous.has(g));
  const reused = pool.filter(g => previous.has(g));
  const weakFirst = choices => [
    ...shuffle(choices.filter(g => weak.has(g)), rng),
    ...shuffle(choices.filter(g => !weak.has(g)), rng)
  ];
  // Every new question receives a newly selected set. Prefer options that were
  // not on the previous question, while preserving the useful weak-sound bias.
  // A four-sound first lesson cannot mathematically show three wholly new
  // labels every round, but no old answer object is retained by the runtime.
  const ordered = [...weakFirst(novel), ...weakFirst(reused)];
  return ordered.slice(0, count);
}

// Words a child can read at this stop, decodable-only, no heart words (those
// are taught whole, not sounded out) — and containing `target` if asked.
//
// A BLEND IS NEVER A SEGMENT — that is the founding insight of this file (see
// buildStoneBridgeRound). But it means the segment filter below returns ZERO
// example words for every blend, so the guide used to introduce `st` while
// showing the child not one word containing it, across four consecutive stops
// (s12–s15, 22 blends). A blend's example words are found by the same rule
// that credits one: the word contains the two taught consonants adjacent
// (`blendsIn`), not "the word segments into it".
export function wordsForTarget(target, stopIndex, { max = 6 } = {}) {
  const known = taughtThrough(stopIndex);
  const hearts = new Set(heartWordsThrough(stopIndex).map(w => w.toLowerCase()));
  const readable = wordsThrough(stopIndex)
    .filter(w => !hearts.has(w.toLowerCase()))
    .filter(w => isDecodable(w, known));
  if (!target) return readable.slice(0, max);
  const taughtBlends = blendsThrough(stopIndex);
  if (taughtBlends.has(target)) {
    return readable.filter(w => blendsIn(w, taughtBlends).includes(target)).slice(0, max);
  }
  return readable.filter(w => segmentWord(w, { known }).includes(target)).slice(0, max);
}

// ── SOUND STONES — hear the sound, tap the letter ───────────────────────────
export function buildSoundStonesRound(target, {
  stopIndex,
  mastery,
  rng,
  choices = 3,
  avoidChoices = []
}) {
  const known = taughtThrough(stopIndex);
  const distractors = pickDistractors(target, {
    known,
    mastery,
    count: choices - 1,
    rng,
    avoidChoices
  });
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
export function buildBeastFeedRound(target, {
  stopIndex,
  mastery,
  rng,
  choices = 3,
  avoidChoices = []
}) {
  const known = taughtThrough(stopIndex);
  const distractors = pickDistractors(target, {
    known,
    mastery,
    count: choices - 1,
    rng,
    avoidChoices
  });
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
    // EVERY grapheme in the word, not just the first. A child who blends "sat"
    // correctly has demonstrated s, a AND t — crediting only `s` was throwing
    // away two thirds of the evidence, and it meant a vowel taught at a stop
    // whose only shells are Stone Bridge and Echo Cave could NEVER reach the
    // two-shell bar and so could never be mastered. The child would have been
    // stuck on it forever, through no fault of their own.
    // GRAPHEMES ONLY. Blends used to be credited here too, and chasing that was a
    // category error: a blend is not a grapheme. Letters and Sounds Phase 4 adds
    // NO new GPCs — blending `st` is just applying `s` and `t`, which this word
    // already proves. Claiming "st" as a masterable unit invented a thing that
    // needed two kinds of evidence, and the game could only ever produce one.
    // Doubled planks (pp) credit their SINGLE letter - /p/ is the sound.
    target: [...new Set(planks.map(evidenceTargetFor))],
    word,
    planks,
    tray: shuffle([...planks, ...ordered.slice(0, extras)], rng),
    answer: planks
  };
}

// ── ECHO CAVE — hear the word, tap out its sounds IN ORDER ─────────────────
// SEGMENTING: the reverse of blending, and the skill that becomes spelling.
// A child who can blend but not segment can read and not write.
//
// The keyboard offers the word's own graphemes plus decoys, exactly like the
// Stone Bridge tray — but there is no plank to show them the shape of the
// answer, so they must hold the sounds in their head. That is the whole point.
export function buildEchoCaveRound(word, { stopIndex, mastery, rng, extras = 3 }) {
  const known = taughtThrough(stopIndex);
  const sounds = segmentWord(word, { known });

  const decoyPool = [...known].filter(g => !sounds.includes(g));
  const weak = new Set(weakestTargets(mastery, 8).map(w => w.target));
  const ordered = [
    ...shuffle(decoyPool.filter(g => weak.has(g)), rng),
    ...shuffle(decoyPool.filter(g => !weak.has(g)), rng)
  ];

  return {
    shell: "echo-cave",
    // Graphemes only — same reasoning as the Stone Bridge above.
    target: [...new Set(sounds.map(evidenceTargetFor))],
    word,
    sounds,
    keys: shuffle([...new Set([...sounds, ...ordered.slice(0, extras)])], rng),
    answer: sounds
  };
}

// ── WORD BEAST — heart words, as a COLLECTION ──────────────────────────────
// Feed the Beast the right word three times and it JOINS you: the word becomes
// a creature that lives in your Den. This is a straight lift of Teach Your
// Monster's "Trickies", which is the single best sight-word mechanic in the
// category — because it makes a sight word a thing you OWN, not a flashcard you
// endure.
//
// Heart words are the ones that CANNOT be sounded out. Offering decodable
// distractors would let a child solve it by decoding, which is exactly the skill
// this is not testing — so the distractors are other heart words.
// Heart-word mastery targets are NAMESPACED ("hw:the"), and that is load-bearing,
// not tidiness. Without it, "the" enters the mastery map as a bare target, the
// review scheduler later marks it due, and it gets handed to Sound Stones — which
// would put a stone carved "the" in front of a child and ask them which one makes
// that SOUND. It would also light up as a stone on the Den wall, which is for
// sounds. Two tracks, two namespaces, no collision.
export const HEART_PREFIX = "hw:";
export const isHeartTarget = target => String(target || "").startsWith(HEART_PREFIX);
export const heartWordOf = target => String(target || "").slice(HEART_PREFIX.length);

export function buildWordBeastRound(word, { stopIndex, rng, choices = 3 }) {
  const pool = heartWordsThrough(stopIndex).filter(w => w.toLowerCase() !== word.toLowerCase());
  const distractors = shuffle(pool, rng).slice(0, choices - 1);
  return {
    shell: "word-beast",
    target: `${HEART_PREFIX}${word}`,
    word,
    choices: shuffle([word, ...distractors], rng),
    answer: word
  };
}

// ── SOUND SORT — two pens, one sound each ──────────────────────────────────
// The ONLY shell that can teach an alternative pronunciation. `snow` and `cow`
// are both spelled `ow`; `book` and `moon` are both `oo`. Looking at the letters
// tells you nothing — you have to hear it. Everything else in this game can be
// solved by matching shapes; this cannot.
export function buildSoundSortRounds(stop, { rng, itemsPerPen = 4 }) {
  const stopIndex = stop.index;
  const known = taughtThrough(stopIndex);

  // Curated pairs (alternative pronunciations) win — they cannot be derived.
  if (stop.sortPairs?.length) {
    return stop.sortPairs.map(([a, b]) => {
      const wordsA = shuffle(stop.sortWords[a] || [], rng).slice(0, itemsPerPen);
      const wordsB = shuffle(stop.sortWords[b] || [], rng).slice(0, itemsPerPen);
      return {
        shell: "sound-sort",
        target: a,
        pens: [a, b],
        items: shuffle([
          ...wordsA.map(word => ({ word, pen: a })),
          ...wordsB.map(word => ({ word, pen: b }))
        ], rng)
      };
    });
  }

  // Otherwise derive it: two of the stop's own graphemes, and the words that
  // contain each. Words are pulled from everything taught so far, not just this
  // stop, so the pens aren't obviously "the four new words vs the four old ones".
  const graphemes = stop.teach
    .filter(e => e.kind !== "blend" && e.kind !== "alt" && e.kind !== "morph")
    .map(e => e.id);
  if (graphemes.length < 2) return [];

  const pool = wordsThrough(stopIndex).filter(w => isDecodable(w, known));
  const rounds = [];
  for (let i = 0; i + 1 < graphemes.length; i += 2) {
    const [a, b] = [graphemes[i], graphemes[i + 1]];
    // A word containing BOTH pen sounds ("thing" is th|i|ng at the stop that
    // pens th against ng) has two defensible answers — and the pens shell
    // completes by counting sorted words, so a duplicated cross-pen word
    // could never be fully sorted and soft-locked the stop. Cross-pen words
    // are simply not sortable; exclude them from both pens.
    const wordsA = pool.filter(w => {
      const seg = segmentWord(w, { known });
      return seg.includes(a) && !seg.includes(b);
    });
    const wordsB = pool.filter(w => {
      const seg = segmentWord(w, { known });
      return seg.includes(b) && !seg.includes(a);
    });
    // A pen with one word in it is not a sort, it is a hint.
    if (wordsA.length < 2 || wordsB.length < 2) continue;
    rounds.push({
      shell: "sound-sort",
      target: a,
      pens: [a, b],
      items: shuffle([
        ...shuffle(wordsA, rng).slice(0, itemsPerPen).map(word => ({ word, pen: a })),
        ...shuffle(wordsB, rng).slice(0, itemsPerPen).map(word => ({ word, pen: b }))
      ], rng)
    });
  }
  return rounds;
}

// ── TRAIL RUN — the same recognition, but FAST ─────────────────────────────
// Fluency is not knowing a sound; it is knowing it without stopping to think.
// This is Sound Stones on a timer: the fork rushes toward you and you take the
// one signed with the sound you just heard. Same question, different pressure —
// which is also why it counts as a SECOND SHELL toward mastery.
export function buildTrailRunRound(target, {
  stopIndex,
  mastery,
  rng,
  choices = 3,
  seconds = 6,
  avoidChoices = []
}) {
  const known = taughtThrough(stopIndex);
  const distractors = pickDistractors(target, {
    known,
    mastery,
    count: choices - 1,
    rng,
    avoidChoices
  });
  return {
    shell: "trail-run",
    target,
    cue: { kind: "phoneme", grapheme: target },
    choices: shuffle([target, ...distractors], rng),
    answer: target,
    seconds
  };
}

// ── TRAIL SIGNS — reading with a CONSEQUENCE ──────────────────────────────
// A sign says "Tap the red rock." You do it, or you don't. There is no score to
// game and nothing to match: the only way through is to read the words.
const SIGN_THINGS = [
  { id: "rock", word: "rock" },
  { id: "log", word: "log" },
  { id: "bug", word: "bug" },
  { id: "cup", word: "cup" },
  { id: "fish", word: "fish" },
  { id: "nut", word: "nut" },
  { id: "cake", word: "cake" }
];
const SIGN_COLOURS = [
  { id: "red", word: "red" },
  { id: "green", word: "green" },
  { id: "black", word: "black" }
];
const SIGN_SIZES = [
  { id: "big", word: "big" },
  { id: "small", word: "small" }
];

// These authored moments guarantee memorable read-and-act tasks while the
// surrounding rounds remain seeded and varied. Every word is decodable here.
const SIGN_FEATURES = {
  s35: { thing: "cake", colour: "green" },
  s38: { thing: "fish", size: "big" }
};

export function buildTrailSignRounds(stop, { rng, count = 4 }) {
  const stopIndex = stop.index;
  const known = taughtThrough(stopIndex);
  const hearts = heartWordsThrough(stopIndex).map(w => w.toLowerCase());

  // Only things and descriptors the child can actually READ.
  const things = SIGN_THINGS.filter(t => isDecodable(t.word, known));
  const colours = SIGN_COLOURS.filter(c => isDecodable(c.word, known));
  const sizes = SIGN_SIZES.filter(size => isDecodable(size.word, known));
  const canSayThe = hearts.includes("the");
  if (things.length < 3 || !canSayThe) return [];

  const rounds = [];
  for (let i = 0; i < count; i += 1) {
    const feature = i === 0 ? SIGN_FEATURES[stop.id] : null;
    const featuredThing = feature ? things.find(thing => thing.id === feature.thing) : null;
    const randomThings = shuffle(things.filter(thing => thing.id !== featuredThing?.id), rng);
    const picked = featuredThing ? [featuredThing, ...randomThings.slice(0, 2)] : randomThings.slice(0, 3);
    const answer = picked[0];
    const colour = colours.length ? pickOne(colours, rng) : null;
    const size = sizes.length ? pickOne(sizes, rng) : null;
    const featuredColour = feature?.colour ? colours.find(item => item.id === feature.colour) : null;
    const featuredSize = feature?.size ? sizes.find(item => item.id === feature.size) : null;
    const useColour = featuredColour || (i % 2 === 1 ? colour : null);
    const useSize = featuredSize || (!useColour && i % 2 === 0 ? size : null);
    const descriptor = useColour?.word || useSize?.word || null;

    // EVERY thing gets a descriptor, and the named one is SHARED by the
    // answer and one decoy — colour alone can never solve the sign, the
    // child must read the thing word too. (It used to decorate only the
    // answer: solvable as odd-one-out without reading a letter.)
    const otherColours = colours.filter(item => item.id !== useColour?.id);
    const otherSize = useSize ? sizes.find(item => item.id !== useSize.id) : null;
    const dressed = picked.map((thing, position) => ({
      ...thing,
      colour: useColour
        ? (position <= 1 ? useColour.id : (otherColours.length ? otherColours[position % otherColours.length].id : useColour.id))
        : (colours.length ? colours[position % colours.length].id : null),
      size: useSize ? (position <= 1 ? useSize.id : (otherSize?.id || useSize.id)) : null
    }));
    rounds.push({
      shell: "trail-signs",
      // Namespaced COMPREHENSION evidence: sign: records can never be served
      // by a sound shell (the review scheduler skips them), never light a
      // stone, and render as "reading signs" on teacher surfaces. Left as a
      // bare word it would have become a Sound Stones question; left null it
      // produced no evidence at all.
      target: "sign:read",
      text: descriptor ? `Tap the ${descriptor} ${answer.word}.` : `Tap the ${answer.word}.`,
      answer: answer.id,
      colour: useColour?.id || null,
      size: useSize?.id || null,
      things: shuffle(dressed, rng)
    });
  }
  return rounds;
}

function pickOne(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

// ── STORY STONES — a real page, read for meaning ──────────────────────────
// The payoff. Every word is decodable by this stop or a heart word already
// taught, and the content check fails the build otherwise — which is the only
// thing between "a page" and "a page the child cannot read".
export function buildStoryStoneRounds(stop) {
  return (stop.pages || []).map((page, i) => ({
    shell: "story-stones",
    target: null,          // reading a page is not a GPC response; it scores no mastery
    page: i,
    text: page.text,
    choices: page.choices
  }));
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
    // A heart word is not a sound. It arrives here only because the review
    // scheduler brought it back, and it must NEVER reach a letter-choice shell.
    .filter(t => !isHeartTarget(t))
    // A blend/morph target has no single grapheme to tap either, so the
    // letter-choice shells skip it. The guard belongs here, not in a shell.
    .filter(t => {
      const entry = stop.teach.find(e => e.id === t);
      return !entry || (entry.kind !== "blend" && entry.kind !== "morph");
    });

  const known = taughtThrough(stopIndex);
  const taughtBlends = blendsThrough(stopIndex);
  const decodable = stop.words.filter(w => isDecodable(w, known));

  // Words are chosen to COVER what the stop teaches, not just taken off the top.
  //
  // Taking the first four words of stop 12 gives you `and, hand, land, sand` —
  // every one of them the `nd` blend, and not a single `st`, `mp` or `ft`. Those
  // three blends would then be credited by nothing, and could never be mastered.
  // A greedy cover run separately for each shell guarantees every new sound and
  // every new blend shows up in BOTH Stone Bridge and Echo Cave — which is also
  // what gets them over the two-different-shells bar.
  const newTargets = stop.teach
    .filter(e => e.kind !== "alt" && e.kind !== "morph")
    .map(e => e.id);

  // HOW A BLEND IS REVIEWED.
  //
  // A blend can't be a letter-choice question — "which stone says /st/" is not a
  // real question, because /st/ isn't one sound. So the letter shells skip them,
  // which meant a blend was ONLY ever credited by the two words at its own stop:
  // four attempts in a lifetime, against a mastery bar that needs a ten-attempt
  // window. Even a PERFECT reader could never master `sn`, `sk`, `sm`, `sw`, `sl`
  // or `pr`. The full-trail simulation caught it; no unit test could have.
  //
  // The right way to review a blend is to make the child READ A WORD WITH IT.
  // So when the scheduler says a blend is due, it steers the Stone Bridge and
  // Echo Cave word choice — and the words can come from ANY earlier stop, not
  // just this one.
  const dueBlends = (targets || []).filter(t => taughtBlends.has(t) && !newTargets.includes(t));
  const coverTargets = [...newTargets, ...dueBlends];

  const coveredBy = word => new Set([...segmentWord(word), ...blendsIn(word, taughtBlends)]);

  const pickCovering = (pool, need) => {
    const chosen = [];
    const left = new Set(coverTargets);
    for (const word of pool) {
      if (chosen.length >= need) break;
      const covers = coveredBy(word);
      if ([...left].some(t => covers.has(t))) {
        chosen.push(word);
        for (const t of covers) left.delete(t);
      }
    }
    for (const word of pool) {
      if (chosen.length >= need) break;
      if (!chosen.includes(word)) chosen.push(word);
    }
    return chosen;
  };

  // Enough words to cover everything the stop teaches AND everything due back. A
  // stop that teaches SEVEN r-blends cannot demonstrate them all in four words,
  // and the ones that fall off the end are credited by nothing.
  const need = Math.max(4, coverTargets.length);

  // This stop's own words first (they're the point of the stop), then anything
  // the child can already read — which is where a due blend's word comes from.
  const wider = wordsThrough(stopIndex).filter(w => isDecodable(w, known) && !decodable.includes(w));
  const pool = [...decodable, ...wider];

  const bridgeWords = pickCovering(pool, need);
  // Echo Cave takes DIFFERENT words where it can. Making a child segment the same
  // words they just blended teaches them to remember the answer, not to hear the
  // sounds — but it still has to cover the same targets.
  const echoPool = pool.filter(w => !bridgeWords.includes(w));
  const echoWords = echoPool.length >= 3 ? pickCovering(echoPool, need) : bridgeWords;

  // Word Beast needs a heart word from THIS stop; a stop with none skips it.
  const hearts = stop.heartWords || [];

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
      "trail-run": list.map(t => buildTrailRunRound(t, { stopIndex, mastery, rng })),
      "stone-bridge": bridgeWords.map(w => buildStoneBridgeRound(w, { stopIndex, mastery, rng })),
      "echo-cave": echoWords.map(w => buildEchoCaveRound(w, { stopIndex, mastery, rng })),
      "word-beast": hearts.map(w => buildWordBeastRound(w, { stopIndex, rng })),
      "sound-sort": buildSoundSortRounds(stop, { rng }),
      "trail-signs": buildTrailSignRounds(stop, { rng }),
      "story-stones": buildStoryStoneRounds(stop),
      gate: buildGateRounds(list, { stopIndex, mastery, rng })
    }
  };
}

