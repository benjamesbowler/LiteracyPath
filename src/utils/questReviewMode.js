import { QUEST_STOPS, targetsAtStop } from "../data/questSequence.js";
import { weakestTargets } from "./questMastery.js";

function stopContainsTarget(stop, target) {
  if (!stop || !target) return false;
  if (String(target).startsWith("hw:")) return (stop.heartWords || []).includes(String(target).slice(3));
  return (stop.teach || []).some(entry => entry.id === target);
}

export function freeRoamReviewPlan(state, limit = 5) {
  const weak = weakestTargets(state?.mastery || {}, limit);
  const routeCursor = Math.max(1, Math.min(QUEST_STOPS.length, Number(state?.trail?.routeCursor) || 1));
  const fallbackStop = QUEST_STOPS[routeCursor - 1] || QUEST_STOPS[0];
  const targetStop = weak
    .map(row => QUEST_STOPS.find(stop => stopContainsTarget(stop, row.target)))
    .filter(Boolean)
    .sort((a, b) => b.index - a.index)[0] || fallbackStop;
  const targets = weak.length
    ? weak.map(row => row.target)
    : targetsAtStop(targetStop.id).slice(0, limit);

  return {
    id: `review-${targetStop.id}`,
    stopId: targetStop.id,
    targets,
    weakest: weak,
    title: weak.length ? "Your sound practice trail" : "Explore and practise",
    description: weak.length
      ? `A free-roam trail built from ${weak.length} sound${weak.length === 1 ? "" : "s"} that need the most practice.`
      : "A free-roam trail using the sounds you have met most recently."
  };
}
