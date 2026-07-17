import { QUEST_STOPS, targetsAtStop } from "../data/questSequence.js";
import { weakestTargets } from "./questMastery.js";

function stopContainsTarget(stop, target) {
  if (!stop || !target) return false;
  if (String(target).startsWith("hw:")) return (stop.heartWords || []).includes(String(target).slice(3));
  return (stop.teach || []).some(entry => entry.id === target);
}

// A teacher-set assignment (state.assignment, written by the teacher
// dashboard's heat map) takes priority over the automatic weakest-five: when
// a teacher says "practise sh and ch", Free Roam serves exactly that. The
// assignment persists until the teacher clears or replaces it — repeatable
// practice is the point, and the lifecycle stays in the teacher's hands.
export function pendingAssignment(state) {
  const assignment = state?.assignment;
  if (!assignment || !Array.isArray(assignment.targets)) return null;
  const targets = assignment.targets.filter(Boolean).slice(0, 6);
  return targets.length ? { ...assignment, targets } : null;
}

export function freeRoamReviewPlan(state, limit = 5) {
  const assignment = pendingAssignment(state);
  const weak = weakestTargets(state?.mastery || {}, limit);
  const planTargets = assignment ? assignment.targets : weak.map(row => row.target);
  const routeCursor = Math.max(1, Math.min(QUEST_STOPS.length, Number(state?.trail?.routeCursor) || 1));
  const fallbackStop = QUEST_STOPS[routeCursor - 1] || QUEST_STOPS[0];
  const targetStop = planTargets
    .map(target => QUEST_STOPS.find(stop => stopContainsTarget(stop, target)))
    .filter(Boolean)
    .sort((a, b) => b.index - a.index)[0] || fallbackStop;
  const targets = planTargets.length
    ? planTargets
    : targetsAtStop(targetStop.id).slice(0, limit);

  return {
    id: `review-${targetStop.id}`,
    stopId: targetStop.id,
    targets,
    weakest: weak,
    assignment: assignment || null,
    title: assignment
      ? "Practice from your teacher"
      : weak.length ? "Your tricky-sound trail" : "Explore today's sounds",
    description: assignment
      ? `Your teacher picked ${assignment.targets.length} sound${assignment.targets.length === 1 ? "" : "s"} to practise.`
      : weak.length
        ? `A trail built from ${weak.length} sound${weak.length === 1 ? "" : "s"} that need the most practice.`
        : "A trail using the sounds you have met most recently."
  };
}
