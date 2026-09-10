import { isIndependentOutcome } from "./outcomeIndependence.js";

export const CYCLE_ACTIVITY_REVISION = "cycle-play-cumulative-2026-09";
export const CYCLE_PRACTICE_VERSION = "cycle-practice-v2";
export const CYCLE_PRACTICE_POLICY_VERSION = "cycle-practice-policy-v2";
export const CYCLE_PRACTICE_MINIMUM_SECONDS = 1800;
// Product activity policy: credit only foreground intervals bracketed by real
// learner input; a gap over one minute is idle and earns no active time.
export const CYCLE_ACTIVITY_GAP_MS = 60_000;
const AUDIO_REQUIRED = new Set(["soundGate", "sceneHunt", "soundBoxes", "wordMachine", "wordChain", "phraseFlow"]);
export function requiresCycleAudio(round) { return round?.audioRequired === true || AUDIO_REQUIRED.has(round?.mechanicId); }

export function cycleQuestionRecord(round, outcome, { mode, attempts = 0, audioDelivery = "pending", recordedAt = new Date().toISOString() } = {}) {
  const audioRequired = requiresCycleAudio(round);
  const evidence = { ...(outcome.evidence || {}), supportLevel: Math.max(attempts, Number(outcome.evidence?.supportLevel) || 0) };
  const delivery = audioRequired ? audioDelivery : "not_required";
  const responseStatus = audioRequired && delivery !== "delivered" ? "media_failed"
    : !isIndependentOutcome({ evidence }) ? "supported" : outcome.correct ? "correct" : "incorrect";
  return {
    questionId: round.id, semanticKey: round.semanticKey || round.id, coverageTags: round.coverageTags || [],
    activityCompleted: Boolean(outcome.correct && !outcome.partial), construct: round.construct || round.mechanicId,
    evidenceConstruct: outcome.construct || round.construct || round.mechanicId,
    mechanicId: round.mechanicId, stationId: round.stationId || "",
    itemKey: String(round.itemKey || round.targetWord || round.targetGrapheme || round.toWord || round.word || round.answer || ""),
    selected: outcome.selected ?? null, evidence, audioRequired, audioDelivery: delivery,
    responseStatus, isCorrect: ["correct", "incorrect"].includes(responseStatus) ? Boolean(outcome.correct) : null,
    mode, recordedAt
  };
}
export function summarizeCycleRecords(records) {
  const scoredQuestions = records.filter(r => ["correct", "incorrect"].includes(r.responseStatus)).length;
  const correctCount = records.filter(r => r.responseStatus === "correct").length;
  return { totalQuestions: records.length, scoredQuestions, correctCount,
    supportedCount: records.filter(r => r.responseStatus === "supported").length,
    mediaFailedCount: records.filter(r => r.responseStatus === "media_failed").length,
    scorePercent: scoredQuestions ? Math.round(correctCount / scoredQuestions * 100) : null,
    status: scoredQuestions === records.length ? "completed" : "incomplete" };
}
