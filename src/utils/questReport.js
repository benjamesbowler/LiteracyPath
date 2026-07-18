import { QUEST_STOPS } from "../data/questSequence.js";
import { countMastered, weakestTargets } from "./questMastery.js";
import { totalStars, unlockedChapterRewards } from "./questProgress.js";
import { questTelemetryTotals } from "./questTelemetry.js";

import { graphemeLabel } from "./questLabels.js";

// One label rule everywhere: "a_e" tiles read "a–e" (not a bare "a" colliding
// with short a), alts keep their base letter, morphs read "–s".
const tileLabel = graphemeLabel;

export function formatQuestDuration(milliseconds = 0) {
  const minutes = Math.round(Math.max(0, Number(milliseconds) || 0) / 60000);
  if (minutes < 1) return "Under 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

// The teacher-facing sort language — "Got it / Almost there / Needs
// re-teaching" — is the exit-ticket vocabulary from the published
// Anthropic / Learning Commons K-2 materials (tools/rubrics/). It maps onto
// the mastery model honestly:
//   got it          proved by the four-condition gate (mastered or retired)
//   almost there    learning, with real evidence banked (>= 2 correct)
//   needs re-teach  attempted but struggling (< 2 correct, or currently on
//                   a consecutive-miss run)
export function sortBuckets(mastery = {}) {
  const rows = Object.values(mastery).filter(row => (Number(row?.seen) || 0) > 0);
  const gotIt = rows.filter(row => ["mastered", "retired"].includes(row?.state)).length;
  const needsReteaching = rows.filter(row =>
    !["mastered", "retired"].includes(row?.state)
    && ((Number(row?.correct) || 0) < 2 || (Number(row?.misses) || 0) >= 2)).length;
  return { gotIt, almostThere: Math.max(0, rows.length - gotIt - needsReteaching), needsReteaching };
}

// THE HEAT MAP — every sound the trail teaches, one tile per GPC, in the
// order the child meets them. This is the report the whole mode exists to
// produce: not "played for 20 minutes" but "these exact sounds are proven,
// these are close, these need re-teaching, these are not met yet" — per
// child, backed by the four-condition mastery gate.
//
//   bucket: "got-it" | "almost" | "reteach" | "unseen"
//
// Buckets reuse sortBuckets' honest mapping; "unseen" means the trail has
// simply not reached that sound yet (not a failure state).
export function questHeatTiles(state = {}) {
  const mastery = state?.mastery || {};
  const seenOrder = [];
  const seenIds = new Set();
  for (const stop of QUEST_STOPS) {
    for (const entry of stop.teach || []) {
      if (seenIds.has(entry.id)) continue;
      seenIds.add(entry.id);
      seenOrder.push({ id: entry.id, kind: entry.kind, stopIndex: stop.index, stopName: stop.name });
    }
  }
  return seenOrder.map(entry => {
    const record = mastery[entry.id];
    const seen = Number(record?.seen) || 0;
    const correct = Number(record?.correct) || 0;
    const mastered = ["mastered", "retired"].includes(record?.state);
    const bucket = !seen
      ? "unseen"
      : mastered
        ? "got-it"
        : (correct < 2 || (Number(record?.misses) || 0) >= 2)
          ? "reteach"
          : "almost";
    return {
      id: entry.id,
      label: tileLabel(entry.id),
      kind: entry.kind,
      stopIndex: entry.stopIndex,
      stopName: entry.stopName,
      bucket,
      seen,
      accuracy: seen ? Math.round((correct / seen) * 100) : null
    };
  });
}

// THE CLASS HEAT MAP (REVIEW.md, Educator #7). Each child already carries a
// full curriculum-ordered heat array; stacking them gives the teacher the
// class truth per sound: how many have proven it, how many are close, how
// many need re-teaching — and, the actionable part, WHICH children to sit
// together. Grouping hints are the top sounds with >= 2 strugglers, so the
// teacher gets "these four need sh" rather than a wall of tiles.
export function classHeatSummary(students = []) {
  const byId = new Map();
  let studentsWithEvidence = 0;

  // A child's furthest evidenced stop — group practice sheets print at the
  // LOWEST member's stop so every word is decodable for the whole group.
  function furthestStop(heat) {
    let furthest = 0;
    for (const tile of heat) {
      if (tile.bucket !== "unseen" && (Number(tile.stopIndex) || 0) > furthest) furthest = Number(tile.stopIndex);
    }
    return furthest;
  }

  for (const student of students) {
    const heat = student?.report?.heat;
    if (!Array.isArray(heat) || !heat.length) continue;
    const stop = furthestStop(heat);
    if (stop > 0) studentsWithEvidence += 1;
    for (const tile of heat) {
      let row = byId.get(tile.id);
      if (!row) {
        row = {
          id: tile.id,
          label: tile.label,
          kind: tile.kind,
          stopIndex: tile.stopIndex,
          stopName: tile.stopName,
          gotIt: 0,
          almost: 0,
          reteach: 0,
          unseen: 0,
          strugglers: [],
          strugglerStops: []
        };
        byId.set(tile.id, row);
      }
      if (tile.bucket === "got-it") row.gotIt += 1;
      else if (tile.bucket === "almost") row.almost += 1;
      else if (tile.bucket === "reteach") {
        row.reteach += 1;
        row.strugglers.push(String(student.name || "Student"));
        row.strugglerStops.push(stop);
      } else row.unseen += 1;
    }
  }

  // Maps preserve insertion order and every heat array shares the same full
  // curriculum ordering, so a stable sort by stopIndex keeps trail order.
  const tiles = [...byId.values()].sort((a, b) => a.stopIndex - b.stopIndex);
  for (const tile of tiles) {
    tile.met = tile.gotIt + tile.almost + tile.reteach;
    tile.reteachShare = tile.met ? tile.reteach / tile.met : 0;
  }

  const groups = tiles
    .filter(tile => tile.reteach >= 2)
    .sort((a, b) => b.reteach - a.reteach || a.stopIndex - b.stopIndex)
    .slice(0, 3)
    .map(tile => {
      const memberStops = tile.strugglerStops.filter(stop => stop > 0);
      return {
        id: tile.id,
        label: tile.label,
        students: tile.strugglers.slice(0, 8),
        count: tile.reteach,
        stopIndex: memberStops.length ? Math.min(...memberStops) : tile.stopIndex
      };
    });

  return { tiles, groups, studentsWithEvidence };
}

export function questEvidenceGuidance({
  attempts = 0,
  sessions = 0,
  highControlLoad = false,
  highLearningLoad = false,
  weakest = []
} = {}) {
  const responseCount = Math.max(0, Number(attempts) || 0);
  const sessionCount = Math.max(0, Number(sessions) || 0);
  const focus = weakest.slice(0, 2).map(row => tileLabel(row.target)).filter(Boolean);
  if (responseCount < 10 || sessionCount < 2) {
    return {
      strength: "Early evidence",
      nextAction: "Keep normal play going. Wait for at least two sessions and ten responses before changing teaching."
    };
  }
  if (highControlLoad && !highLearningLoad) {
    return {
      strength: responseCount >= 30 && sessionCount >= 4 ? "Stable pattern" : "Developing evidence",
      nextAction: "Compare one accessible 2D session before changing phonics teaching; movement or timing may be adding load."
    };
  }
  if (highLearningLoad && focus.length) {
    return {
      strength: responseCount >= 30 && sessionCount >= 4 ? "Stable pattern" : "Developing evidence",
      nextAction: `Re-teach ${focus.join(" and ")} explicitly, then use a short free-roam review to check transfer.`
    };
  }
  if (focus.length) {
    return {
      strength: responseCount >= 30 && sessionCount >= 4 ? "Stable pattern" : "Developing evidence",
      nextAction: `Use the next free-roam review for ${focus.join(" and ")}; keep the main trail moving.`
    };
  }
  return {
    strength: responseCount >= 30 && sessionCount >= 4 ? "Stable pattern" : "Developing evidence",
    nextAction: "Continue the next trail and review the report again after another session."
  };
}

export function buildQuestMasteryReport(state = {}) {
  const mastery = state?.mastery || {};
  const weak = weakestTargets(mastery, 5);
  const telemetry = questTelemetryTotals(state?.telemetry);
  const attempts = Object.values(mastery).reduce((sum, row) => sum + (Number(row?.seen) || 0), 0);
  const correct = Object.values(mastery).reduce((sum, row) => sum + (Number(row?.correct) || 0), 0);
  const developing = Object.values(mastery).filter(row => ["learning", "practising", "at-risk"].includes(row?.state)).length;
  const stopped = new Set(state?.trail?.stopsDone || []);
  const interactionEvidence = telemetry.responses;
  const highControlLoad = interactionEvidence >= 5
    && telemetry.motorRetries >= 3
    && telemetry.motorRetryRate >= 0.2;
  const highLearningLoad = interactionEvidence >= 5
    && telemetry.correctionMisses >= 3
    && (telemetry.correctionMisses / interactionEvidence) >= 0.3;
  const interactionInterpretation = interactionEvidence < 5
    ? "More play is needed before separating sound knowledge from control difficulty."
    : highControlLoad && !highLearningLoad
      ? "Timing or movement retries may be slowing play more than sound knowledge."
      : highLearningLoad && !highControlLoad
        ? "Sound choices caused more difficulty than timing or movement controls."
        : highControlLoad && highLearningLoad
          ? "Both sound choices and timing or movement controls affected this session."
          : "Responses were completed without a strong control or re-teaching signal.";
  const guidance = questEvidenceGuidance({
    attempts: Math.max(attempts, interactionEvidence),
    sessions: telemetry.sessions,
    highControlLoad,
    highLearningLoad,
    weakest: weak
  });

  return {
    buckets: sortBuckets(mastery),
    heat: questHeatTiles(state),
    // A teacher-set practice assignment rides inside the phonics_quest payload
    // (unknown keys are incoming-wins in both the client hydrate and the
    // server merge, so a teacher can upsert { assignment } alone without
    // touching the child's mastery). Surfaced here so the dashboard can show
    // and clear it.
    assignment: state?.assignment && Array.isArray(state.assignment.targets) && state.assignment.targets.length
      ? {
        targets: state.assignment.targets.slice(0, 6),
        note: typeof state.assignment.note === "string" ? state.assignment.note : "",
        assignedAt: state.assignment.assignedAt || ""
      }
      : null,
    stopsCompleted: stopped.size,
    stopsTotal: QUEST_STOPS.length,
    stars: totalStars(state),
    stonesLit: countMastered(mastery),
    relicsUnlocked: unlockedChapterRewards(state).length,
    soundsDeveloping: developing,
    attempts,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
    weakest: weak,
    activeMs: telemetry.activeMs,
    timeOnTask: formatQuestDuration(telemetry.activeMs),
    sessions: telemetry.sessions,
    reviewSessions: telemetry.reviewSessions,
    shortcutSessions: telemetry.shortcutSessions,
    lastActiveAt: telemetry.lastActiveAt,
    currentFocus: weak.map(row => row.target),
    interaction: {
      prompts: telemetry.prompts,
      responses: telemetry.responses,
      averageResponseMs: Math.round(telemetry.averageResponseMs),
      slowResponseRate: Math.round(telemetry.slowResponseRate * 1000) / 10,
      motorRetries: telemetry.motorRetries,
      motorRetryRate: Math.round(telemetry.motorRetryRate * 1000) / 10,
      correctionMisses: telemetry.correctionMisses,
      teachBacks: telemetry.teachBacks,
      trailFinds: telemetry.drops,
      pacingAdaptations: telemetry.pacingAdaptations,
      deferredBeats: telemetry.deferredBeats,
      optionalRouteVisits: telemetry.optionalRouteVisits,
      optionalDiscoveries: telemetry.optionalDiscoveries,
      restoredFriendsMet: telemetry.restoredFriendsMet,
      accessibleTimingSupports: telemetry.accessibleTimingSupports,
      accessibleSessions: telemetry.accessibleSessions,
      promptCompletionRate: Math.round(telemetry.promptCompletionRate * 1000) / 10,
      highControlLoad,
      highLearningLoad,
      interpretation: interactionInterpretation,
      evidenceStrength: guidance.strength,
      nextAction: guidance.nextAction
    },
    runtime: {
      sampledFrames: telemetry.sampledFrames,
      averageFrameMs: Math.round(telemetry.averageFrameMs * 10) / 10,
      longFrameRate: Math.round(telemetry.longFrameRate * 1000) / 10,
      qualityTransitions: telemetry.qualityTransitions,
      contextLosses: telemetry.contextLosses,
      fallbackSessions: telemetry.fallbackSessions,
      sceneStarts: telemetry.sceneStarts,
      averageSceneLoadMs: Math.round(telemetry.averageSceneLoadMs),
      slowSceneStarts: telemetry.slowSceneStarts,
      slowSceneStartRate: Math.round(telemetry.slowSceneStartRate * 1000) / 10,
      averageSceneAssetRequests: Math.round(telemetry.averageSceneAssetRequests),
      averageSceneAssetBytes: Math.round(telemetry.averageSceneAssetBytes),
      peakSceneAssetRequests: telemetry.peakSceneAssetRequests,
      peakSceneAssetBytes: telemetry.peakSceneAssetBytes,
      healthSamples: telemetry.healthSamples,
      peakDisplayObjects: telemetry.peakDisplayObjects,
      peakTweens: telemetry.peakTweens,
      peakTextures: telemetry.peakTextures,
      peakActiveChoices: telemetry.peakActiveChoices,
      networkInterruptions: telemetry.networkInterruptions,
      syncDeferrals: telemetry.syncDeferrals,
      syncRecoveries: telemetry.syncRecoveries,
      offlineShellReady: telemetry.offlineShellReady,
      offlineColdStarts: telemetry.offlineColdStarts,
      offlineWarmups: telemetry.offlineWarmups,
      offlineWarmupFailures: telemetry.offlineWarmupFailures,
      offlineShellErrors: telemetry.offlineShellErrors,
      offlineUpdates: telemetry.offlineUpdates,
      offlineUpdatesApplied: telemetry.offlineUpdatesApplied,
      lastOfflineWarmAt: telemetry.lastOfflineWarmAt,
      lastOfflineUpdateAt: telemetry.lastOfflineUpdateAt,
      lastOfflineBuildId: telemetry.lastOfflineBuildId,
      syncPending: telemetry.syncPending,
      lastSyncRecoveredAt: telemetry.lastSyncRecoveredAt
    }
  };
}
