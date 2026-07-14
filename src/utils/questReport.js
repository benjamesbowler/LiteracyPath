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

export function buildQuestMasteryReport(state = {}) {
  const mastery = state?.mastery || {};
  const weak = weakestTargets(mastery, 5);
  const telemetry = questTelemetryTotals(state?.telemetry);
  const attempts = Object.values(mastery).reduce((sum, row) => sum + (Number(row?.seen) || 0), 0);
  const correct = Object.values(mastery).reduce((sum, row) => sum + (Number(row?.correct) || 0), 0);
  const developing = Object.values(mastery).filter(row => ["learning", "practising", "at-risk"].includes(row?.state)).length;
  const stopped = new Set(state?.trail?.stopsDone || []);

  return {
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
