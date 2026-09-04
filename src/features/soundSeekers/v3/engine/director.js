// Sound Seekers v3 — the director. Builds the beat list for a stop.
//
// Order at every stop:
//   1. Sound Signposts for the NEW targets (teach before any scoring). Real
//      graphemes get a signpost each; blends / morphology share one signpost
//      with a card per target.
//   2. practice on the new targets — Echo Hunt per target, one Sound Sort when
//      two new targets contrast, Word Forge + Blend Bridge on this stop's words
//   3. Heart Word Lantern for each heart word introduced here
//   4. one review beat on the most useful due target, in a different mechanic
//   5. Gate Riddle (logic) on review stops / when there is room
//   6. Story Bridge (connected text) when the stop has a decodable line
//   7. boss stops end on a repair Word Forge
//
// Signposts do not count against the puzzle budget (MAX_SCORED).

import { createRng, hashSeed } from "./rng.js";
import { targetInfo } from "./lexicon.js";
import {
  MECHANICS,
  buildBlendBridge, buildEchoHunt, buildGateRiddle, buildHeartLantern, buildSignpost,
  buildSoundSort, buildStoryBridge, buildWordForge, pickBuildWords
} from "./challenges.js";

export const MAX_SCORED = 8;
const SCORABLE = new Set(["letter", "vowel", "double", "digraph", "split", "team", "r-controlled", "suffix", "alt"]);

// Which earlier target most deserves a review right now.
export function pickReviewTarget(stop, progress) {
  const targets = progress?.targets || {};
  const journeyStep = progress?.journeyStep || 0;
  const candidates = Object.entries(targets)
    .filter(([id, t]) => !id.startsWith("hw:") && t.taught && !stop.teach.some(x => x.id === id) && SCORABLE.has(targetInfo(id)?.kind))
    .map(([id, t]) => {
      const age = journeyStep - (t.lastSeenStep ?? -99);
      const confusion = (t.missed || 0) + (t.supported || 0) * 0.5;
      const shaky = confusion > 0 ? 3 : 0;
      const underEvidenced = (t.independent || 0) < 2 ? 2 : 0;
      return { id, priority: shaky + underEvidenced + Math.min(age, 6) * 0.5 + Math.min(confusion, 4) };
    })
    .sort((a, b) => b.priority - a.priority);
  return candidates[0]?.id || null;
}

export function buildMission(stop, progress = {}, { replayOrdinal = 0 } = {}) {
  const stopIndex = stop.index;
  const rng = createRng(hashSeed(`${stop.id}|mission|${replayOrdinal}`));
  const ordinal = replayOrdinal;
  const beats = [];
  const scoredCount = () => beats.filter(b => b.mechanic !== MECHANICS.SIGNPOST).length;
  const add = beat => {
    if (!beat) return false;
    if (beat.mechanic !== MECHANICS.SIGNPOST && scoredCount() >= MAX_SCORED) return false;
    beats.push(beat);
    return true;
  };
  const newTargets = stop.teach.map(t => t.id);
  // Alternative pronunciations are practised by READING and sorting (the
  // curated sort lists), never by "find the letter" — the letter is ambiguous.
  const scoredNew = newTargets.filter(id => SCORABLE.has(targetInfo(id)?.kind) && targetInfo(id).kind !== "alt");

  // 1. teach — real graphemes individually, blends/morphs grouped
  const grouped = newTargets.filter(id => ["blend", "morph"].includes(targetInfo(id)?.kind));
  const single = newTargets.filter(id => !grouped.includes(id));
  single.forEach((targetId, index) => add(buildSignpost({ stopId: stop.id, targetIds: [targetId], ordinal, index })));
  if (grouped.length) add(buildSignpost({ stopId: stop.id, targetIds: grouped, ordinal, index: single.length }));

  // 2. practice on new targets
  const heartCount = Math.min(stop.heartWords.length, 2);
  const echoBudget = Math.max(1, Math.min(scoredNew.length, 3 - (heartCount ? 1 : 0)));
  for (const targetId of scoredNew.slice(0, echoBudget)) add(buildEchoHunt({ stopId: stop.id, stopIndex, targetId, ordinal }));
  if (stop.sortPairs?.length) {
    for (const [a, b] of stop.sortPairs.slice(0, 2)) {
      add(buildSoundSort({ stopId: stop.id, stopIndex, stop, targetA: a, targetB: b, ordinal }));
    }
  } else if (scoredNew.length >= 2) {
    add(buildSoundSort({ stopId: stop.id, stopIndex, stop, targetA: scoredNew[0], targetB: scoredNew[1], ordinal }));
  }
  // the blend word prefers a word with a clean picture so the meaning step can
  // be picture-based; the forge word is chosen from what is left
  const [blendWord] = pickBuildWords({ stop, stopIndex, newTargets, rng, count: 1, preferPicture: true });
  const [forgeWord] = pickBuildWords({ stop, stopIndex, newTargets, rng, count: 1, exclude: [blendWord] });
  const buildWords = [forgeWord, blendWord].filter(Boolean);
  if (forgeWord) add(buildWordForge({ stopId: stop.id, stopIndex, word: forgeWord, ordinal }));
  if (blendWord) add(buildBlendBridge({ stopId: stop.id, stopIndex, word: blendWord, ordinal }));

  // 3. heart words
  for (const word of stop.heartWords.slice(0, 2)) add(buildHeartLantern({ stopId: stop.id, stopIndex, word, ordinal }));

  // 4. review (one beat, different mechanic where possible)
  const reviewTarget = pickReviewTarget(stop, progress);
  if (reviewTarget && scoredCount() < MAX_SCORED - 1) {
    if (rng.next() < 0.5) add(buildEchoHunt({ stopId: stop.id, stopIndex, targetId: reviewTarget, ordinal, review: true }));
    else {
      const [w] = pickBuildWords({ stop, stopIndex, newTargets: [reviewTarget], rng, count: 1, exclude: buildWords });
      if (w) add(buildWordForge({ stopId: stop.id, stopIndex, word: w, ordinal, review: true }));
    }
  }

  // 5. logic puzzle — always on review stops, otherwise when there is room
  if (newTargets.length === 0 || scoredCount() <= MAX_SCORED - 2) {
    add(buildGateRiddle({ stopId: stop.id, stopIndex, ordinal, preferTargets: newTargets }));
  }

  // 6. connected text
  if (stop.story) add(buildStoryBridge({ stopId: stop.id, story: stop.story, ordinal }));

  // 7. boss: end on a repair Word Forge of a fresh word
  if (stop.boss) {
    const [w] = pickBuildWords({ stop, stopIndex, newTargets, rng, count: 1, exclude: buildWords });
    if (w) {
      if (scoredCount() >= MAX_SCORED) beats.splice(beats.findIndex(b => b.mechanic === MECHANICS.GATE_RIDDLE) >>> 0, 1);
      add(buildWordForge({ stopId: stop.id, stopIndex, word: w, ordinal: ordinal + 100 }));
    }
  }

  // The mission must end on something the world responds to (never a signpost).
  while (beats.length && beats[beats.length - 1].mechanic === MECHANICS.SIGNPOST) beats.pop();
  if (!beats.some(b => b.mechanic !== MECHANICS.SIGNPOST)) {
    add(buildGateRiddle({ stopId: stop.id, stopIndex, ordinal: ordinal + 7 }));
  }
  return { stopId: stop.id, replayOrdinal, beats, seed: rng.next() };
}
