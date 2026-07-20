import { test } from "node:test";
import assert from "node:assert/strict";
import { QUEST_STOPS, targetsAtStop, getStop } from "../../src/data/questSequence.js";
import { isHeartTarget } from "../../src/utils/questRounds.js";
import { buildWalk, responsesInWalk, ENCOUNTERS } from "../../src/utils/questEncounters.js";
import { hasGraphemeAudio } from "../../src/utils/questAudio.js";
import { targetsForStop } from "../../src/utils/questReviewScheduler.js";
import {
  baseQuestState,
  recordQuestAttempt,
  recordStopResult,
  currentStopIndex,
  isStopUnlocked,
  availableSparks,
  totalStars,
  totalDrops
} from "../../src/utils/questProgress.js";
import { MASTERY_STATES, isMastered, countMastered } from "../../src/utils/questMastery.js";
import { starRubric } from "../../src/utils/starRubric.js";

// FULL-TRAIL SIMULATION.
//
// Unit tests prove the pieces. This walks a whole child from the egg to the Star
// Reach, 40 stops, through the real round builder, the real mastery gate and the
// real review scheduler — and asserts the two things the entire design rests on:
//
//   1. A child who reads well ends up with the sounds MARKED as learnt.
//   2. A child who reads badly is NEVER BLOCKED, and the sounds they can't do
//      keep coming back.
//
// If either of those is false, the mode is broken in a way no unit test would
// show, because every part would still work perfectly on its own.

// WALK one stop. `skill` is the probability the child gets a response right.
// `day` advances per stop so the "2 different sessions" rule can be satisfied.
//
// This mirrors the trail content exactly: three encounters and a handful of
// beats. The final encounter opens the physical gate; it does not add a separate
// boss quiz. The old version ran every shell plus six extra gate questions.
function playStop(state, stopId, { skill, day }) {
  const stop = getStop(stopId);
  const targets = targetsForStop(targetsAtStop(stopId), state.mastery, stop.index);
  const walk = buildWalk(stopId, { mastery: state.mastery, targets, seed: stop.index });

  let next = state;
  const tally = { correct: 0, total: 0, mistakes: 0 };

  const answer = (target, correct, shell) => {
    tally.total += 1;
    if (correct) tally.correct += 1;
    else tally.mistakes += 1;
    if (target == null) return;
    for (const one of Array.isArray(target) ? target : [target]) {
      if (one) {
        next = recordQuestAttempt(next, {
          target: one,
          correct,
          shell,
          stopIndex: stop.index,
          at: `2026-0${1 + (day % 9)}-${String(1 + (day % 27)).padStart(2, "0")}T10:00:00Z`
        });
      }
    }
  };

  for (const enc of walk.encounters) {
    for (const beat of enc.beats) {
      answer(beat.target, Math.random() < skill, enc.kind);
    }
  }

  const stars = starRubric({ correct: tally.correct, total: tally.total, mistakes: tally.mistakes, deaths: 0 });
  // A child who reaches the end of the path picked up every sun-drop on it.
  return { state: recordStopResult(next, stopId, stars, walk.drops.length), tally, stars, walk };
}

function walkTheTrail({ skill, passes = 1 }) {
  let state = baseQuestState();
  let day = 0;
  for (let pass = 0; pass < passes; pass += 1) {
    for (const stop of QUEST_STOPS) {
      day += 1;
      const result = playStop(state, stop.id, { skill, day });
      state = result.state;
    }
  }
  return state;
}

// ── THE RATIO. This is the test that stops it turning back into a quiz. ─────

test("A STOP IS A WALK, NOT A QUIZ: at most 3 encounters and 8 responses", () => {
  // The first build asked ~20 questions per stop — five shells plus a six-round
  // boss Gate — and it played like a worksheet with scenery. If anyone ever
  // "adds one more mini-game to stop 7", this goes red and tells them why.
  for (const stop of QUEST_STOPS) {
    const walk = buildWalk(stop.id, { seed: stop.index });
    assert.ok(walk.encounters.length >= 1, `${stop.id} has nothing in the path at all`);
    assert.ok(
      walk.encounters.length <= 3,
      `${stop.id} has ${walk.encounters.length} encounters — past three it stops being a walk with things in it and becomes a quiz with scenery`
    );
    const responses = responsesInWalk(walk);
    assert.ok(
      responses <= 8,
      `${stop.id} asks for ${responses} responses. A five-year-old walked here to explore, not to sit an exam.`
    );
  }

  const avg = QUEST_STOPS.reduce((n, s) => n + responsesInWalk(buildWalk(s.id, { seed: s.index })), 0) / QUEST_STOPS.length;
  assert.ok(avg <= 7, `averaging ${avg.toFixed(1)} responses a stop — the walk is being crowded out`);
});

test("the trail gate adds no extra boss quiz", () => {
  // The route now ends at a gate, but the last planned encounter is what opens
  // it. Keeping `gate` out of the encounter list proves no extra assessment was
  // smuggled into every stop.
  for (const stop of QUEST_STOPS) {
    const walk = buildWalk(stop.id, { seed: stop.index });
    for (const enc of walk.encounters) {
      assert.ok(enc.kind !== "gate", `${stop.id} has a gate`);
      assert.ok(enc.beats.length <= 3, `${stop.id}: "${enc.kind}" has ${enc.beats.length} beats — an encounter is a moment, not a round of questions`);
    }
  }
});

test("every stop has real walking in it, and things to find along the way", () => {
  for (const stop of QUEST_STOPS) {
    const walk = buildWalk(stop.id, { seed: stop.index });
    assert.ok(walk.length >= 5000, `${stop.id}: the path is only ${walk.length} long — that's a corridor, not a walk`);
    assert.ok(walk.drops.length >= 8, `${stop.id}: only ${walk.drops.length} sun-drops — the path between encounters is empty`);
    // Encounters must be spread out, not bunched at the start.
    const xs = walk.encounters.map(e => e.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i += 1) {
      assert.ok(xs[i] - xs[i - 1] >= 800, `${stop.id}: two encounters only ${xs[i] - xs[i - 1]} apart — no walking between them`);
    }
  }
});

// The sounds we ever CLAIM. Blends ("st"), morphology ("suffix_ing") and
// alternative pronunciations ("oo_short") are taught and practised, but never
// claimed as mastered — the walk cannot produce two-different-kinds-of-evidence
// for them without turning back into a quiz, and a claim you can't back is worse
// than no claim. A blend isn't a grapheme anyway: Letters and Sounds Phase 4 adds
// no new GPCs, because blending `st` is just applying `s` and `t`.
const GRAPHEMES = [...new Set(
  QUEST_STOPS.flatMap(s => s.teach.filter(e => !["blend", "morph", "alt"].includes(e.kind)).map(e => e.id))
)];

test("one walk of the trail teaches a lot, and does NOT pretend to have taught everything", () => {
  // A child does not master seventy letter-sounds in one two-hour walk, and a
  // game that says they did is lying to a parent. ~250 responses across ~70
  // sounds is three each; the bar needs four, in two kinds, on two days.
  const state = walkTheTrail({ skill: 1, passes: 1 });

  assert.equal(state.trail.stopsDone.length, 40, "did not finish the trail");
  assert.equal(currentStopIndex(state), 40);

  const mastered = GRAPHEMES.filter(t => isMastered(state.mastery, t));
  assert.ok(mastered.length >= 20, `only ${mastered.length} sounds mastered in a full perfect walk — the walk is too thin to teach anything`);
  assert.ok(mastered.length < GRAPHEMES.length, "one walk claimed EVERY sound — the bar has gone soft");
  assert.ok(availableSparks(state) > 0, "no sparks earned for a perfect run");
});

test("EVERY DECLARED SHELL HAS A MAPPING AND BUILDS — nothing is silently dropped", () => {
  // `trail-run` was declared at ~15 stops for the mode's whole life while
  // FROM_SHELL had no key for it, so `.filter(Boolean)` swallowed it and the
  // only automaticity mechanic never ran. This test makes that class of bug
  // impossible to reintroduce: every shell a stop declares must map to an
  // encounter, and every mapped kind must actually build somewhere on the trail.
  for (const stop of QUEST_STOPS) {
    for (const shell of stop.shells) {
      if (shell === "knowledge-tree") continue; // the guide page, not an encounter
      assert.ok(
        Object.values(ENCOUNTERS).some(meta => meta.from === shell),
        `${stop.id} declares shell '${shell}' and no encounter maps to it — it would be silently dropped`
      );
    }
  }

  const built = new Set();
  for (const stop of QUEST_STOPS) {
    const walk = buildWalk(stop.id, { seed: stop.index });
    for (const enc of walk.encounters) built.add(enc.kind);
  }
  assert.ok(built.has("trail-run"), "trail-run is declared but never builds — fluency is silently gone again");
});

test("A MUTE SOUND-SORT NEVER SHIPS — pens are gated on their audio actually resolving", () => {
  // The sort's own premise (questSequence): "no amount of looking at the
  // letters tells you which sound they make". A pen with no sound is therefore
  // unsolvable BY DESIGN. s16 sorts y-as-/ie/ from y-as-/ee/; while those alt
  // clips are missing the pens must not build, and the moment the recordings
  // land in the manifest they must come back with no code change.
  const s16 = QUEST_STOPS.find(stop => stop.index === 16);
  const walk = buildWalk(s16.id, { seed: 16 });
  const hasPens = walk.encounters.some(enc => enc.kind === "sheep-pens");
  const altsAudible = hasGraphemeAudio("y_ie") && hasGraphemeAudio("y_ee");
  assert.equal(
    hasPens,
    altsAudible,
    altsAudible
      ? "alt clips are recorded but the sort still does not build"
      : "the sort shipped with silent pens — a child is being asked to sort by a sound that never plays"
  );
});

test("a crowded teaching stop covers every new grapheme before reserving a review beat", () => {
  // s7 has six new graphemes, three letter beats and three word beats. Due
  // review for r/u must not displace one of ff/ll/ss/zz from its only first
  // exposure; an unseen target cannot be selected by the later scheduler.
  const walk = buildWalk("s7", {
    targets: ["j", "z", "ff", "ll", "ss", "zz", "r", "u"],
    seed: 7
  });
  const encountered = new Set(walk.encounters.flatMap(encounter => (
    encounter.beats.flatMap(beat => Array.isArray(beat.target) ? beat.target : [beat.target])
  )));
  for (const target of ["j", "z", "ff", "ll", "ss", "zz"]) {
    assert.ok(encountered.has(target), `${target} was announced as new but never encountered at s7`);
  }
});

test("KEEP WALKING AND EVERY SOUND IS REACHABLE — there is no ceiling", () => {
  // The important one. A slow climb is fine; a CEILING is a bug. There was one:
  // the new sounds filled every slot in the flower patch, so a sound from an
  // earlier stop could never get a second KIND of encounter — and mastery needs
  // two. Walking the trail six times over left fourteen sounds and thirteen
  // blends permanently stuck, and no child would ever have known why.
  //
  // Six passes is not a play prediction. It is a proof that nothing is walled off.
  const state = walkTheTrail({ skill: 1, passes: 6 });
  const stuck = GRAPHEMES.filter(t => !isMastered(state.mastery, t));
  assert.deepEqual(stuck, [], `these sounds can NEVER be mastered, however well the child reads: ${stuck.join(", ")}`);
  assert.ok(countMastered(state.mastery) >= GRAPHEMES.length);
});

test("mastery climbs steadily with play — no plateau", () => {
  // A plateau means something is structurally unreachable. Catch it as a shape,
  // not as a specific number, so this survives tuning.
  const counts = [1, 2, 4].map(passes => {
    const state = walkTheTrail({ skill: 1, passes });
    return GRAPHEMES.filter(t => isMastered(state.mastery, t)).length;
  });
  assert.ok(counts[1] > counts[0], `mastery stalled between 1 and 2 walks (${counts.join(" -> ")})`);
  assert.ok(counts[2] > counts[1], `mastery stalled between 2 and 4 walks (${counts.join(" -> ")})`);
});

test("A CHILD WHO GETS EVERYTHING WRONG IS NEVER BLOCKED", () => {
  // The central promise of the whole mode. The story never waits. This child
  // answers every single question wrong, 40 stops in a row, and still sees the
  // Star Reach — because being bad at reading is the reason they are here.
  const state = walkTheTrail({ skill: 0 });

  assert.equal(state.trail.stopsDone.length, 40, "a struggling child got stuck");
  for (const stop of QUEST_STOPS) {
    assert.ok(isStopUnlocked(state, stop.id), `${stop.id} was never reachable`);
  }

  // …and nothing is claimed on their behalf. Not one stone lights up.
  assert.deepEqual(state.stones, [], "a child who got everything wrong has 'mastered' something");
  assert.equal(countMastered(state.mastery), 0);

  // They still earn something, and that is DELIBERATE: they walked the whole
  // trail and picked up every sun-drop on it. Walking is worth something on its
  // own, or the walk is just the gap between questions — which is the trap this
  // whole rebuild exists to climb out of.
  //
  // But they earn it from WALKING, not from reading: zero stars, so zero of the
  // star payout. Reading well is worth six times more per unit. The economy
  // rewards effort; it cannot be farmed by failing.
  assert.equal(totalStars(state), 0, "a child who got everything wrong earned a star");
  assert.ok(totalDrops(state) > 0, "walking the whole trail earned nothing at all");
  assert.equal(availableSparks(state), totalDrops(state) * 2, "sparks came from somewhere other than the sun-drops");
});

test("the sounds a struggling child cannot do KEEP COMING BACK", () => {
  // The other half of the promise: not blocked, but not abandoned either.
  const state = walkTheTrail({ skill: 0 });

  // `a`, taught at stop 1, must still have been served late in the trail.
  const a = state.mastery.a;
  assert.ok(a, "the sound `a` was never even recorded");
  // Seedwake deliberately removes repeated early bridge words. Seeing the sound
  // every 2-3 stops still proves recurrence without rebuilding that quiz.
  // (Floor recalibrated 18 -> 16 when the pronunciation-honesty pass reshaped
  // the s21/s36/s40 word pools; the guarantee itself is now asserted DIRECTLY
  // below: the sound was still being served at the very end of the trail.)
  assert.ok(a.seen >= 16, `a struggling child saw \`a\` only ${a.seen} times across 40 stops — it stopped coming back`);
  assert.ok(Number(a.lastStop) >= 35, `\`a\` was last served at stop ${a.lastStop} — review abandoned it before the trail's end`);
  assert.equal(a.state, MASTERY_STATES.LEARNING);
  assert.equal(a.box, 1, "a sound the child keeps missing must stay in the most-frequent review box");
});

test("a middling child ends up somewhere in between, and nothing throws", () => {
  const state = walkTheTrail({ skill: 0.75, passes: 2 });
  assert.equal(state.trail.stopsDone.length, 40);
  const mastered = countMastered(state.mastery);
  assert.ok(mastered > 0, "a 75% reader mastered nothing");
  // Heart words are namespaced and must never be counted as sounds on the wall.
  for (const stone of state.stones) {
    assert.ok(!isHeartTarget(stone), `"${stone}" is a heart word and must not be a stone`);
    assert.ok(!stone.includes(":"), `"${stone}" is not a sound`);
  }
});

test("every stop on the trail can be played end to end without throwing", () => {
  let state = baseQuestState();
  for (const [i, stop] of QUEST_STOPS.entries()) {
    const result = playStop(state, stop.id, { skill: 0.8, day: i + 1 });
    assert.ok(result.tally.total > 0, `${stop.id} "${stop.name}" served ZERO questions — an empty stop`);
    assert.ok(result.stars >= 0 && result.stars <= 3);
    state = result.state;
  }
});
