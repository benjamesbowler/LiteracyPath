// THE ENCOUNTER RUN-LOOP, AS ONE PURE STATE MACHINE.
//
// The orchestration that writes a child's mastery — corrections ladder,
// review queue, first-attempt star tally, answer fan-out, checkpoint shape —
// existed as three hand-copied implementations (QuestTrail2D, QuestPixelWorld,
// QuestHub). The copies diverged once and corrupted mastery keys ("s,a,t" —
// see the comment in QuestTrail2D.answer), and none of the three had a single
// unit test. This module is the single source of truth, DOM-free and
// reducer-shaped so the whole loop is testable as data.
//
// PORT PLAN (the renderers still hold their — now individually fixed —
// copies): each renderer replaces its answer/miss/checkpoint bookkeeping with
//   runRef.current = encounterRunReducer(runRef.current, action)
// and reads corrections/tally/reviewQueue from runRef, keeping its own
// rendering, timers and audio exactly where they are. The RAF loops keep
// refs; only the BOOKKEEPING moves here. Ported last, renderer by renderer,
// with the playthrough sims as the net.
//
// Every transition returns a NEW state plus an `events` list the caller
// replays into onAnswer — the reducer never calls anything.

import { correctionKey, recordCorrectionMiss, completeTeachBack, promptLevelForMode } from "./questCorrection.js";

export function createEncounterRun({ encounterId = "enc", beatCount = 1 } = {}) {
  return {
    encounterId,
    beatCount,
    beatIndex: 0,
    stageIndex: 0,
    corrections: {},        // correctionKey -> correction record
    reviewQueue: [],        // beat indexes that earned a re-visit (3+ misses)
    reviewedBeats: [],
    remediationBeat: null,
    firstTally: {},         // correctionKey -> first attempt correctness
    tally: { total: 0, correct: 0, mistakes: 0 },
    events: []              // answer events from the LAST transition only
  };
}

// The exact evidence events a renderer must emit for one attempt. Array
// targets fan out to ONE EVENT PER SOUND — never a joined "s,a,t" key: that
// single rule is the regression this module exists to make untestable-to-
// reintroduce.
export function answerEvents({ correct, target, shell = "trail", promptLevel = 0 }) {
  if (target == null) return [];
  const targets = Array.isArray(target) ? target : [target];
  return targets.filter(Boolean).map(one => ({
    kind: "answer",
    target: one,
    correct: Boolean(correct),
    shell,
    meta: { promptLevel }
  }));
}

export function encounterRunReducer(state, action) {
  const run = state || createEncounterRun();
  switch (action?.type) {
    case "attempt": {
      const key = action.key
        || correctionKey({ id: run.encounterId }, run.beatIndex, run.stageIndex);
      const preMode = run.corrections[key]?.mode;
      const promptLevel = action.promptLevel ?? promptLevelForMode(preMode);
      const correct = Boolean(action.correct);

      // First attempt per beat is what stars score; the ladder is teaching.
      const firstTally = { ...run.firstTally };
      const tally = { ...run.tally };
      if (!(key in firstTally)) {
        firstTally[key] = correct;
        tally.total += 1;
        if (correct) tally.correct += 1;
        else tally.mistakes += 1;
      }

      const corrections = { ...run.corrections };
      const reviewQueue = [...run.reviewQueue];
      if (!correct) {
        const next = recordCorrectionMiss(corrections[key], action.choiceId ?? null);
        corrections[key] = next;
        if (next.misses >= 3 && !reviewQueue.includes(run.beatIndex)) {
          reviewQueue.push(run.beatIndex);
        }
      }

      return {
        ...run,
        corrections,
        reviewQueue,
        firstTally,
        tally,
        events: answerEvents({
          correct,
          target: action.target,
          shell: action.shell,
          promptLevel
        })
      };
    }

    case "teach-back": {
      const key = action.key
        || correctionKey({ id: run.encounterId }, run.beatIndex, run.stageIndex);
      if (!run.corrections[key]) return { ...run, events: [] };
      return {
        ...run,
        corrections: { ...run.corrections, [key]: completeTeachBack(run.corrections[key]) },
        events: []
      };
    }

    case "advance-beat": {
      const beatIndex = Math.min(run.beatCount - 1, Math.max(0, action.beatIndex ?? run.beatIndex + 1));
      return {
        ...run,
        beatIndex,
        stageIndex: 0,
        remediationBeat: action.remediation ?? null,
        events: []
      };
    }

    case "advance-stage":
      return { ...run, stageIndex: Math.max(0, action.stageIndex ?? run.stageIndex + 1), events: [] };

    case "restore": {
      const checkpoint = action.checkpoint || {};
      return {
        ...run,
        beatIndex: Math.max(0, Number(checkpoint.beatIndex) || 0),
        stageIndex: Math.max(0, Number(checkpoint.fieldStage) || 0),
        corrections: checkpoint.corrections && typeof checkpoint.corrections === "object" ? { ...checkpoint.corrections } : {},
        reviewQueue: Array.isArray(checkpoint.reviewQueue) ? [...checkpoint.reviewQueue] : [],
        reviewedBeats: Array.isArray(checkpoint.reviewedBeats) ? [...checkpoint.reviewedBeats] : [],
        remediationBeat: Number.isInteger(checkpoint.remediationBeat) ? checkpoint.remediationBeat : null,
        tally: checkpoint.tally && typeof checkpoint.tally === "object"
          ? { total: 0, correct: 0, mistakes: 0, ...checkpoint.tally }
          : run.tally,
        events: []
      };
    }

    default:
      return { ...run, events: [] };
  }
}

// The exact resume payload every renderer checkpoints — one shape, one place.
export function encounterRunCheckpoint(run) {
  return {
    beatIndex: run.beatIndex,
    fieldStage: run.stageIndex,
    corrections: run.corrections,
    reviewQueue: run.reviewQueue,
    reviewedBeats: run.reviewedBeats,
    remediationBeat: run.remediationBeat,
    tally: run.tally
  };
}
