import { QUEST_STOPS, targetsAtStop } from "../data/questSequence.js";
import { QUEST_CHAPTERS } from "../data/questChapters.js";
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
      : weak.length ? "Your sound practice trail" : "Explore today's sounds",
    description: assignment
      ? `Your teacher picked ${assignment.targets.length} sound${assignment.targets.length === 1 ? "" : "s"} to practise.`
      : weak.length
        ? `A trail built from ${weak.length} sound${weak.length === 1 ? "" : "s"} that need the most practice.`
        : "A trail using the sounds you have met most recently."
  };
}

export function chapterShortcutReviewPlan(state, chapterId, limit = 5) {
  const chapter = QUEST_CHAPTERS.find(candidate => candidate.id === chapterId);
  if (!chapter) return null;
  const completed = new Set(state?.trail?.stopsDone || []);
  if (!chapter.stopIds.every(stopId => completed.has(stopId))) return null;

  const chapterStops = chapter.stopIds
    .map(stopId => QUEST_STOPS.find(stop => stop.id === stopId))
    .filter(Boolean);
  const weak = weakestTargets(state?.mastery || {}, 20)
    .filter(row => chapterStops.some(stop => stopContainsTarget(stop, row.target)));
  const targets = weak.slice(0, limit).map(row => row.target);
  const fallbackStop = chapterStops.at(-1);
  const targetStop = targets
    .map(target => chapterStops.find(stop => stopContainsTarget(stop, target)))
    .filter(Boolean)
    .sort((a, b) => b.index - a.index)[0] || fallbackStop;
  const planTargets = targets.length
    ? targets
    : targetsAtStop(targetStop.id).slice(0, limit);

  return {
    id: `shortcut-${chapter.id}`,
    chapterId: chapter.id,
    stopId: targetStop.id,
    targets: planTargets,
    weakest: weak.slice(0, limit),
    title: chapter.shortcut.label,
    description: chapter.shortcut.effect,
    source: "chapter-shortcut"
  };
}
