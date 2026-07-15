import { QUEST_STOPS } from "../data/questSequence.js";
import { countMastered, weakestTargets } from "./questMastery.js";
import { totalStars, unlockedChapterRewards } from "./questProgress.js";
import { questTelemetryTotals } from "./questTelemetry.js";

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
    currentFocus: weak.map(row => row.target)
  };
}
