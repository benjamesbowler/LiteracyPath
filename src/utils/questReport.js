import { QUEST_STOPS } from "../data/questSequence.js";
import { countMastered, weakestTargets } from "./questMastery.js";
import { totalStars, unlockedChapterRewards } from "./questProgress.js";
import { questTelemetryTotals } from "./questTelemetry.js";

// "y_ie" renders as "y" — same rule the sheep pens use. Local copy rather than
// importing the shell contract, which drags browser audio modules into node.
function tileLabel(id) {
  return String(id || "").split("_")[0];
}

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

export function buildQuestMasteryReport(state = {}) {
  const mastery = state?.mastery || {};
  const weak = weakestTargets(mastery, 5);
  const telemetry = questTelemetryTotals(state?.telemetry);
  const attempts = Object.values(mastery).reduce((sum, row) => sum + (Number(row?.seen) || 0), 0);
  const correct = Object.values(mastery).reduce((sum, row) => sum + (Number(row?.correct) || 0), 0);
  const developing = Object.values(mastery).filter(row => ["learning", "practising", "at-risk"].includes(row?.state)).length;
  const stopped = new Set(state?.trail?.stopsDone || []);

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
    lastActiveAt: telemetry.lastActiveAt,
    currentFocus: weak.map(row => row.target),
    runtime: {
      sampledFrames: telemetry.sampledFrames,
      averageFrameMs: Math.round(telemetry.averageFrameMs * 10) / 10,
      longFrameRate: Math.round(telemetry.longFrameRate * 1000) / 10,
      qualityTransitions: telemetry.qualityTransitions,
      contextLosses: telemetry.contextLosses,
      fallbackSessions: telemetry.fallbackSessions
    }
  };
}
