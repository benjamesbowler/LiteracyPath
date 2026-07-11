// THE WALK — what a child actually does.
//
// THE MISTAKE THIS FILE EXISTS TO UNDO:
//
//   The first build made every stop a MENU OF SHELLS, each shell a card with a
//   prompt and three buttons, ending in a six-round Gate. That is a question
//   bank in a costume. It is not what Teach Your Monster is: there, Flower Jump
//   is JUMPING ON A FLOWER and Herding Sheep is DRIVING SHEEP INTO A PEN. The
//   phonics lives inside a physical action in a world.
//
// So: a stop is a WALK. The creature walks a path. Things are IN the path —
// a patch of flowers, a broken bridge, a hungry beast. You reach one, it
// happens, it resolves in fifteen or twenty seconds, and you walk on. The
// walking is the majority of the time, and it is the point.
//
//   - 2 to 3 encounters per stop, not five shells plus a gate.
//   - 1 to 3 beats per encounter, not ten rounds.
//   - NO GATE. Teach Your Monster doesn't have one either. Mastery accrues
//     quietly across the whole trail; it does not need a boss quiz to measure it.
//
// The learning content still comes from questRounds.js — that part was right.
// What changed is how much of it a child meets at once, and what it looks like
// when they do.

import {
  buildSoundStonesRound,
  buildBeastFeedRound,
  buildStoneBridgeRound,
  buildEchoCaveRound,
  buildSoundSortRounds,
  buildWordBeastRound,
  buildTrailSignRounds,
  buildStoryStoneRounds,
  wordsForTarget,
  makeRng
} from "./questRounds.js";
import { getStop, taughtThrough, blendsThrough, QUEST_STOPS } from "../data/questSequence.js";
import { segmentWord, isDecodable } from "./questSegments.js";

// target id -> what kind of thing it is. Static: the trail doesn't change.
const QUEST_KINDS = new Map(QUEST_STOPS.flatMap(s => s.teach.map(e => [e.id, e.kind])));

// Every encounter is a THING IN THE WORLD, not a screen.
export const ENCOUNTERS = {
  "flower-patch": { from: "sound-stones", label: "Flower patch", beats: 3 },
  "hungry-beast": { from: "beast-feed", label: "Hungry beast", beats: 2 },
  "broken-bridge": { from: "stone-bridge", label: "Broken bridge", beats: 1 },
  "echo-cave": { from: "echo-cave", label: "Echo cave", beats: 1 },
  "sheep-pens": { from: "sound-sort", label: "Sheep pens", beats: 1 },
  "word-beast": { from: "word-beast", label: "Word beast", beats: 1 },
  "signpost": { from: "trail-signs", label: "Signpost", beats: 1 },
  "story-rock": { from: "story-stones", label: "Story rock", beats: 1 }
};

// Which encounter a stop's declared shell becomes.
const FROM_SHELL = Object.fromEntries(
  Object.entries(ENCOUNTERS).map(([id, meta]) => [meta.from, id])
);

// The path is this long, in world units. At WALK_SPEED it takes about a minute
// to walk end to end — which, with three encounters at ~25s each, makes a stop
// roughly three minutes and puts the MAJORITY of that time on the walk. That
// ratio is the whole design; if it ever inverts, we're back to a quiz.
export const PATH_LENGTH = 6000;
export const WALK_SPEED = 115; // world units per second
const START_X = 200;
const END_X = PATH_LENGTH - 300;

// How many encounters a stop gets. Never more than three: past that it stops
// being a walk with things in it and goes back to being a quiz with scenery.
const MAX_ENCOUNTERS = 3;

export function buildWalk(stopId, { mastery = {}, targets, seed = 1 } = {}) {
  const stop = getStop(stopId);
  if (!stop) return null;

  const rng = makeRng(seed);
  const stopIndex = stop.index;
  const known = taughtThrough(stopIndex);
  const taughtBlends = blendsThrough(stopIndex);

  // WHAT CAN GO IN A LETTER ENCOUNTER.
  //
  // Only real graphemes. Blends can't ("which flower says /st/" is not a
  // question), morphology can't, heart words can't — and neither can an
  // ALTERNATIVE PRONUNCIATION, which is a bug I nearly shipped: `g_j` would have
  // grown a flower labelled "g", standing next to a distractor flower ALSO
  // labelled "g". Two identical flowers, one of them wrong. Alts belong in the
  // sheep pens, which is the only encounter that can teach them, because sorting
  // by SOUND is the only way to tell `snow` from `cow`.
  const allTargets = targets && targets.length ? targets : stop.teach.map(t => t.id);
  const kindOf = t => QUEST_KINDS.get(t) || "letter";
  const list = allTargets
    .filter(t => !t.startsWith("hw:"))
    .filter(t => !["blend", "morph", "alt"].includes(kindOf(t)));

  const decodable = stop.words.filter(w => isDecodable(w, known));

  // Words for the bridge / cave. Chosen to cover what the stop teaches, so the
  // blends still get their evidence (see blendsIn in questRounds.js).
  const newTargets = stop.teach.filter(e => e.kind !== "alt" && e.kind !== "morph").map(e => e.id);
  const dueBlends = (targets || []).filter(t => taughtBlends.has(t) && !newTargets.includes(t));
  const coverTargets = [...newTargets, ...dueBlends];
  const covers = w => new Set([...segmentWord(w), ...blendsIn(w, taughtBlends)]);

  const pickCovering = (pool, need, want = coverTargets) => {
    const chosen = [];
    const left = new Set(want);
    for (const word of pool) {
      if (chosen.length >= need) break;
      const c = covers(word);
      if ([...left].some(t => c.has(t))) {
        chosen.push(word);
        for (const t of c) left.delete(t);
      }
    }
    for (const word of pool) {
      if (chosen.length >= need) break;
      if (!chosen.includes(word)) chosen.push(word);
    }
    return chosen;
  };

  // The stop declares which shells it wants; we turn them into world objects and
  // keep at most three.
  //
  // BUT NOT THE FIRST THREE. Taking them in order silently dropped the Broken
  // Bridge from most stops — and the bridge is where a sound gets credited for
  // being READ IN A WORD rather than tapped as a letter. Without it, a sound like
  // `sh` earned two credits in its whole life and could never be mastered, no
  // matter how well the child read.
  //
  // So: one thing where you HEAR a sound and find it, one where you BUILD a word
  // out of sounds, and one that is neither. That is a better walk anyway — three
  // flower patches in a row is not a journey.
  const wanted = stop.shells
    .filter(s => s !== "knowledge-tree")
    .map(s => FROM_SHELL[s])
    .filter(Boolean);

  const LETTER = ["flower-patch", "hungry-beast"];
  const WORD = ["broken-bridge", "echo-cave"];

  // BOTH BUCKETS ALTERNATE ALONG THE TRAIL, and this is load-bearing.
  //
  // Mastery needs a sound proved in TWO DIFFERENT KINDS OF THING. Pick the flower
  // patch every time and every sound is only ever proved in a flower patch — one
  // kind, forever, so nothing masters. That is exactly what happened: `w`, `v`,
  // `ff` and most of the alphabet had five clean correct answers each and sat at
  // "learning" for the entire game.
  //
  // Alternating by stop means a sound met in a flower patch gets fed to a beast
  // when review brings it back a stop or two later. Two kinds, honestly earned.
  const even = stopIndex % 2 === 0;
  const letterFirst = even ? LETTER : [...LETTER].reverse();
  const wordFirst = even ? WORD : [...WORD].reverse();
  const first = pool => pool.map(k => wanted.find(w => w === k)).find(Boolean);

  const chosen = [
    first(letterFirst),
    first(wordFirst),
    wanted.find(k => !LETTER.includes(k) && !WORD.includes(k))
  ].filter(Boolean);

  for (const kind of wanted) {
    if (chosen.length >= MAX_ENCOUNTERS) break;
    if (!chosen.includes(kind)) chosen.push(kind);
  }

  // WHO SHOWS WHAT.
  //
  // A stop that teaches six sounds cannot show them all in a flower patch that
  // holds three. Before this, `j` was taught at stop 7 and then appeared in NOT
  // ONE encounter — zero credits, in the whole game. It could never be mastered
  // and nothing looked broken.
  //
  // So the new sounds are DEALT OUT: the flower patch takes the first three, the
  // beast the next two, and whatever is left over must be covered by the words in
  // the bridge or the cave. Nothing taught goes unmet.
  const newHere = newTargets.filter(t => list.includes(t));

  // Review targets are dealt to the encounter they have NOT been proved in yet.
  //
  // Only one letter-encounter runs per stop (a flower patch OR a beast — two in a
  // row is a quiz, not a walk). So a sound met in flowers needs a BEAST later to
  // clear the two-different-things bar, and the only way that happens is if the
  // walk deliberately hands it to one. Left to chance it never does: on a perfect
  // playthrough, `w` was answered right five times, every one in a flower patch,
  // and stayed "learning" for the whole game.
  const letterKind = chosen.find(k => LETTER.includes(k)) || "flower-patch";
  const proven = t => (mastery[t]?.shells || []).includes(letterKind);
  const review = list
    .filter(t => !newHere.includes(t))
    .sort((a, b) => Number(proven(a)) - Number(proven(b))); // unproven-in-this-kind first

  // A LETTER SLOT IS ALWAYS RESERVED FOR REVIEW.
  //
  // This was the hard ceiling. The new sounds filled every slot in the flower
  // patch, so a sound from an earlier stop could NEVER get a second kind of
  // encounter — and mastery needs two. It didn't make mastery slow; it made it
  // impossible. Walking the whole trail six times over left 14 sounds and 13
  // blends permanently stuck, and the child would have had no idea why.
  //
  // Now: most of the slots go to what the stop teaches, and at least one goes to
  // something old that needs proving in a different way.
  const letterSlots = letterKind === "flower-patch" ? 3 : 2;
  const keepForReview = review.length ? 1 : 0;
  const newSlots = Math.max(1, letterSlots - keepForReview);
  const letterTargets = [
    ...newHere.slice(0, newSlots),
    ...review.slice(0, letterSlots - Math.min(newSlots, newHere.length))
  ].slice(0, letterSlots);

  const flowerTargets = letterKind === "flower-patch" ? letterTargets : [];
  const beastTargets = letterKind === "hungry-beast" ? letterTargets : [];
  const shown = new Set(letterTargets);
  const mustCoverInWords = [...coverTargets.filter(t => !shown.has(t))];

  const built = [];
  for (const kind of chosen.slice(0, MAX_ENCOUNTERS)) {
    const encounter = buildEncounter(kind, {
      stop, stopIndex, mastery, rng, list, decodable, pickCovering,
      flowerTargets, beastTargets, mustCoverInWords, coverTargets
    });
    if (encounter) built.push(encounter);
  }

  // Never let a stop be a walk with NOTHING in it.
  if (!built.length && list.length) {
    built.push(buildEncounter("flower-patch", { stop, stopIndex, mastery, rng, list, decodable, pickCovering }));
  }

  // Space them along the path with real walking in between — that gap IS the
  // game. Roughly 25-30 seconds of walking between things.
  const span = END_X - START_X;
  const placed = built.filter(Boolean).map((enc, i) => ({
    ...enc,
    id: `${stopId}-${i}`,
    x: Math.round(START_X + (span * (i + 1)) / (built.length + 1))
  }));

  // Sun-drops: things to pick up while walking, so the path is never empty.
  // They are pure delight AND they count — see trail.drops in questProgress.
  const drops = [];
  for (let x = START_X + 160; x < END_X; x += 260) {
    if (placed.some(e => Math.abs(e.x - x) < 220)) continue;
    drops.push({ id: `d${x}`, x, y: 0.18 + rng() * 0.3 });
  }

  return {
    stopId,
    stopIndex,
    stop,
    world: stop.world,
    length: PATH_LENGTH,
    startX: START_X,
    endX: END_X,
    teach: stop.teach.map(entry => ({
      ...entry,
      examples: wordsForTarget(entry.id, stopIndex, { max: 3 })
    })),
    encounters: placed,
    drops
  };
}

function buildEncounter(kind, ctx) {
  const {
    stop, stopIndex, mastery, rng, decodable, pickCovering,
    flowerTargets, beastTargets, mustCoverInWords, coverTargets
  } = ctx;

  switch (kind) {
    case "flower-patch": {
      // THREE flowers, one after another. Not "question 1 of 3" — a patch of
      // flowers you walk into, and each one opens when you find its sound.
      if (!flowerTargets?.length) return null;
      return {
        kind,
        beats: flowerTargets.map(t => buildSoundStonesRound(t, { stopIndex, mastery, rng, choices: 3 }))
      };
    }

    case "hungry-beast": {
      if (!beastTargets?.length) return null;
      return {
        kind,
        beats: beastTargets.map(t => buildBeastFeedRound(t, { stopIndex, mastery, rng, choices: 3 }))
      };
    }

    // The word encounters carry the coverage load: one word credits every sound
    // AND every blend inside it, so two words can catch what the flowers missed.
    case "broken-bridge": {
      const words = wordsFor(mustCoverInWords, coverTargets, decodable, pickCovering);
      if (!words.length) return null;
      return { kind, beats: words.map(w => buildStoneBridgeRound(w, { stopIndex, mastery, rng })) };
    }

    case "echo-cave": {
      const words = wordsFor(mustCoverInWords, coverTargets, decodable, pickCovering);
      if (!words.length) return null;
      return { kind, beats: words.map(w => buildEchoCaveRound(w, { stopIndex, mastery, rng })) };
    }

    case "sheep-pens": {
      const rounds = buildSoundSortRounds(stop, { rng, itemsPerPen: 3 });
      if (!rounds.length) return null;
      return { kind, beats: [rounds[0]] };
    }

    case "word-beast": {
      const hearts = stop.heartWords || [];
      if (!hearts.length) return null;
      return { kind, beats: [buildWordBeastRound(hearts[0], { stopIndex, rng })] };
    }

    case "signpost": {
      const rounds = buildTrailSignRounds(stop, { rng, count: 2 });
      if (!rounds.length) return null;
      return { kind, beats: rounds };
    }

    case "story-rock": {
      const rounds = buildStoryStoneRounds(stop);
      if (!rounds.length) return null;
      return { kind, beats: [rounds[0]] };
    }

    default:
      return null;
  }
}

// Words for a bridge or a cave: cover what the flowers and the beast missed
// first, then everything else the stop teaches. Two words, sometimes three when
// there is more to catch — never more, because an encounter is a moment.
function wordsFor(mustCover, coverTargets, decodable, pickCovering) {
  const need = mustCover.length ? Math.min(3, Math.max(2, mustCover.length)) : 2;
  const covering = pickCovering(decodable, need, mustCover.length ? mustCover : coverTargets);
  return covering.slice(0, 3);
}

// Local copy so this module doesn't import questRounds' internals circularly.
function blendsIn(word, taughtBlends) {
  const planks = segmentWord(word);
  const found = [];
  for (let i = 0; i + 1 < planks.length; i += 1) {
    const pair = planks[i] + planks[i + 1];
    if (planks[i].length === 1 && planks[i + 1].length === 1 && taughtBlends.has(pair)) found.push(pair);
  }
  return [...new Set(found)];
}

// How many responses a stop asks for. The whole point of the rebuild is that
// this number is SMALL — a test asserts it.
export function responsesInWalk(walk) {
  return (walk?.encounters || []).reduce((n, e) => n + e.beats.length, 0);
}
