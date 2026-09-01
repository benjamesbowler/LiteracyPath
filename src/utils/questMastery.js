import {
  evidenceIsIndependent,
  isValidSessionDay,
  localSessionDayFor
} from "../features/soundSeekers/engine/evidence.js";
import { validateEvidencePath } from "../features/soundSeekers/engine/evidenceEligibility.js";

// Sound Seekers legacy mastery rules. The currently mounted QuestRoot still
// relies on this API; v2 readiness is added below without changing its calls.
//
//   1. >= 4 correct responses
//   2. >= 75% accuracy over the LAST 4 attempts (not lifetime — a child who
//      has learnt it should not be punished for the day they hadn't)
//   3. proved in >= 2 DIFFERENT mini-game shells  (kills shell-specific
//      pattern-matching: "I know it's the third stone")
//   4. proved on >= 2 DIFFERENT days               (kills same-sitting cramming)
// A mastered sound falls back to `learning` if it is missed twice in a row.
//
// NOTHING NARRATIVE IS GATED BY THIS. The child always finishes the stop, always
// gets the cosmetic, always moves on. This only decides what the review
// scheduler serves next, and what colour the stone is on the Den wall.
//
// DOM-free and deterministic — unit-tested in tests/unit/questMastery.test.js.

// The current walk format supplies about five responses per stop, so the rule
// requires evidence the live game can actually produce. Different days prevent
// same-sitting cramming; different encounters prevent shell-specific guessing.
export const QUEST_PRACTICE_THRESHOLDS = Object.freeze({
  minCorrect: 4,
  minAccuracy: 0.75,
  accuracyWindow: 4,
  minDomains: 2,
  minSessions: 2,
  conclusionWindowDays: 90
});

export const MASTERY_RULES = Object.freeze({
  minCorrect: QUEST_PRACTICE_THRESHOLDS.minCorrect,
  minAccuracy: QUEST_PRACTICE_THRESHOLDS.minAccuracy,
  accuracyWindow: QUEST_PRACTICE_THRESHOLDS.accuracyWindow,
  minShells: QUEST_PRACTICE_THRESHOLDS.minDomains,
  minSessions: QUEST_PRACTICE_THRESHOLDS.minSessions,
  demoteAfterConsecutiveMisses: 2
});

// Blends use word-reading or spelling evidence rather than grapheme-choice
// evidence. Two correct responses in the three-response window meet 0.66;
// evidence must still span two task types and two days.
export const BLEND_RULES = Object.freeze({
  minCorrect: 3,
  minAccuracy: 0.66,
  accuracyWindow: 3,
  minShells: 2,
  minSessions: 2,
  demoteAfterConsecutiveMisses: 2
});

// HEART WORDS GET THEIR OWN BAR for the same honest reason blends do.
// A sight word is taught whole and practised in exactly ONE shell — the word
// beast — so a `minShells: 2` bar is a bar no heart word can ever clear.
// Under the general rules every met heart word sat permanently in "needs
// re-teaching" on the teacher's screen and stole review slots from sounds
// that actually needed them. One shell is legitimate here; two different
// days still guards against same-sitting cramming.
export const HEART_RULES = Object.freeze({
  minCorrect: 3,
  minAccuracy: 0.75,
  accuracyWindow: 3,
  minShells: 1,
  minSessions: 2,
  demoteAfterConsecutiveMisses: 2
});

export const MASTERY_STATES = Object.freeze({
  NOT_STARTED: "not-started",
  LEARNING: "learning",
  MASTERED: "mastered",
  RETIRED: "retired"
});

// One full box-4 interval. Must equal BOX_INTERVALS[4] in questReviewScheduler
// (which imports from this file, so importing it back would be a cycle) — a
// unit test asserts the two numbers agree.
export const RETIRE_REVIEW_GAP = 12;

export function emptyRecord() {
  return {
    seen: 0,
    independentSeen: 0, // denominator for knowledge accuracy; help/timeouts are exposure only
    correct: 0,
    streak: 0,
    misses: 0,          // consecutive misses, reset by any correct
    window: [],         // last N results as 1/0, newest last
    shells: [],         // distinct shell ids the child has been right in
    sessions: [],       // distinct YYYY-MM-DD days the child has been right on
    state: MASTERY_STATES.NOT_STARTED,
    box: 1,             // Leitner box, owned by questReviewScheduler
    evidenceEpoch: 0,   // increments when demotion invalidates the old proof set
    lastAt: "",
    lastStop: 0         // trail position of the last attempt (review gaps)
  };
}

export function independentAttemptCount(record) {
  if (!record || typeof record !== "object") return 0;
  if (Object.prototype.hasOwnProperty.call(record, "independentSeen")) {
    const independent = Math.max(0, Number(record.independentSeen) || 0);
    // Defensive migration for hand-built/partially migrated records: a positive
    // independent-correct counter cannot coexist with zero independent attempts.
    if (independent === 0 && (Number(record.correct) || 0) > 0) {
      return Math.max(0, Number(record.seen) || Number(record.correct) || 0);
    }
    return independent;
  }
  // Legacy saves predate the split and cannot distinguish assistance. Preserve
  // their historical denominator; all newly recorded attempts are exact.
  return Math.max(0, Number(record.seen) || 0);
}

// The "different days" anti-cram rule counts days in the CHILD'S life, not
// UTC's. Slicing the ISO string meant any child west of Greenwich crossed a
// "day" mid-evening — 23:30Z and 00:30Z, one sitting, satisfied minSessions.
function dayOf(at) {
  const date = new Date(at || "");
  if (Number.isNaN(date.getTime())) return String(at || "").slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function windowAccuracy(window) {
  if (!window.length) return 0;
  const hits = window.reduce((sum, v) => sum + (v ? 1 : 0), 0);
  return hits / window.length;
}

// Does this record meet all four conditions RIGHT NOW?
// Exported so the tests can assert each condition in isolation.
export function meetsMasteryBar(record, rules = MASTERY_RULES) {
  const r = { ...emptyRecord(), ...(record || {}) };
  if (r.correct < rules.minCorrect) return false;
  if (r.shells.length < rules.minShells) return false;
  if (r.sessions.length < rules.minSessions) return false;
  // Accuracy is measured over the last N attempts, and we need a full window
  // before we will claim mastery — 3/3 correct is not yet a full window of proof.
  if (r.window.length < rules.accuracyWindow) return false;
  return windowAccuracy(r.window) >= rules.minAccuracy;
}

// Record ONE response. `shell` is the mini-game it happened in, `at` an ISO
// timestamp, `stopIndex` where on the trail it happened (the review scheduler
// needs that to know how long ago the child last saw this sound).
//
// promptLevel is the assistance the child had WHEN answering:
//   0 = independent   (discover / retry — no help shown)
//   1 = narrowed      (choices reduced for them)
//   2 = guided        (the answer was shown — post-teach re-ask)
// Only INDEPENDENT answers are mastery evidence: a tap on the glowing answer
// proves compliance, not knowledge. Assisted attempts still count exposure
// (seen) and misses (a miss WITH help is real struggle), but never fill the
// accuracy window, correct count, shells or sessions.
//
// reason:"timeout" (Trail Run's clock expiring) is a FLUENCY event, not a
// knowledge failure: slow-but-accurate children must not accrue mastery
// misses for hesitation. Exposure only.
//
// Pure: returns a new record, mutates nothing.
export function recordAttempt(record, { correct = false, shell = "", at = "", stopIndex = 0, rules = MASTERY_RULES, promptLevel = 0, reason = "" } = {}) {
  const stored = record && typeof record === "object" ? record : {};
  const prev = {
    ...emptyRecord(),
    ...stored,
    independentSeen: independentAttemptCount(stored)
  };
  const day = dayOf(at);
  const timeout = reason === "timeout";
  const independent = promptLevel === 0 && !timeout;

  const next = {
    ...prev,
    seen: prev.seen + 1,
    independentSeen: prev.independentSeen + (independent ? 1 : 0),
    correct: prev.correct + (correct && independent ? 1 : 0),
    streak: independent ? (correct ? prev.streak + 1 : 0) : prev.streak,
    misses: timeout ? prev.misses : (correct ? 0 : prev.misses + 1),
    window: independent
      ? [...prev.window, correct ? 1 : 0].slice(-rules.accuracyWindow)
      : [...prev.window],
    shells: [...prev.shells],
    sessions: [...prev.sessions],
    lastAt: at || prev.lastAt,
    // THE sound was practised HERE. This is the only place lastStop should be
    // written — see the note in questProgress.recordStopResult.
    lastStop: timeout ? (prev.lastStop || 0) : (stopIndex || prev.lastStop || 0)
  };

  // Only an INDEPENDENT correct answer is evidence. Being wrong in a second
  // shell on a second day proves nothing — and being RIGHT with the answer
  // glowing proves nothing either.
  if (correct && independent) {
    if (shell && !next.shells.includes(shell)) next.shells.push(shell);
    if (day && !next.sessions.includes(day)) next.sessions.push(day);
  }

  next.state = nextState(prev, next, rules);

  // RETIREMENT — the transition the review scheduler was built around and that,
  // until 2026-07-15, nothing in production ever performed (retire() was only
  // called by tests, so box 5's "sampled 1-in-10, nothing rots" promise was
  // dead). A mastered sound that comes back on review at least one full box-4
  // interval later and is answered CORRECTLY has survived spaced recall — that
  // is the definition of retired. It stays sampled 1-in-10 by the scheduler and
  // can still be demoted by two consecutive misses like any mastered sound.
  if (
    correct &&
    prev.state === MASTERY_STATES.MASTERED &&
    next.state === MASTERY_STATES.MASTERED &&
    stopIndex > 0 &&
    stopIndex - (Number(prev.lastStop) || 0) >= RETIRE_REVIEW_GAP
  ) {
    next.state = MASTERY_STATES.RETIRED;
  }

  // One clean independent recall advances the Leitner interval. A miss always
  // returns immediately to box 1, including the first miss of a still-mastered
  // sound. Assisted/timeout events do not move the knowledge schedule.
  if (independent) {
    if (!correct) next.box = 1;
    else if (next.state === MASTERY_STATES.RETIRED) next.box = 5;
    else if (next.state === MASTERY_STATES.MASTERED) next.box = 4;
    else next.box = Math.min(3, Math.max(1, Number(prev.box) || 1) + 1);
  }

  // Forgetting invalidates the evidence set that supported the old claim.
  // Re-mastery must again be shown in two shells on two days, rather than
  // borrowing shells/sessions banked before the child was demonstrably stuck.
  if (
    (prev.state === MASTERY_STATES.MASTERED || prev.state === MASTERY_STATES.RETIRED)
    && next.state === MASTERY_STATES.LEARNING
  ) {
    next.correct = 0;
    next.independentSeen = 0;
    next.streak = 0;
    next.window = [];
    next.shells = [];
    next.sessions = [];
    next.box = 1;
    next.evidenceEpoch = (Number(prev.evidenceEpoch) || 0) + 1;
  }
  return next;
}

function nextState(prev, next, rules = MASTERY_RULES) {
  const wasMastered = prev.state === MASTERY_STATES.MASTERED || prev.state === MASTERY_STATES.RETIRED;

  // Demote: a sound you can't do any more is a sound you don't know.
  if (wasMastered && next.misses >= rules.demoteAfterConsecutiveMisses) {
    return MASTERY_STATES.LEARNING;
  }
  if (wasMastered) return prev.state;

  if (meetsMasteryBar(next, rules)) return MASTERY_STATES.MASTERED;
  return next.seen > 0 ? MASTERY_STATES.LEARNING : MASTERY_STATES.NOT_STARTED;
}

// Promote a mastered sound to `retired` once it survives a spaced review far
// enough downstream. Retired sounds are still sampled ~1-in-10 so nothing rots.
export function retire(record) {
  const r = { ...emptyRecord(), ...(record || {}) };
  if (r.state !== MASTERY_STATES.MASTERED) return r;
  return { ...r, state: MASTERY_STATES.RETIRED };
}

export function masteryState(mastery, target) {
  return mastery?.[target]?.state || MASTERY_STATES.NOT_STARTED;
}

export function isMastered(mastery, target) {
  const state = masteryState(mastery, target);
  return state === MASTERY_STATES.MASTERED || state === MASTERY_STATES.RETIRED;
}

export function countMastered(mastery) {
  return Object.keys(mastery || {}).filter(target => isMastered(mastery, target)).length;
}

function compareEvidence(left, right) {
  const leftAt = String(left?.at ?? "");
  const rightAt = String(right?.at ?? "");
  if (leftAt !== rightAt) return leftAt.localeCompare(rightAt);
  return String(left?.id ?? "").localeCompare(String(right?.id ?? ""));
}

function evidenceSessionDay(event) {
  if (Object.prototype.hasOwnProperty.call(event || {}, "sessionDay")) {
    return isValidSessionDay(event.sessionDay) ? event.sessionDay : "";
  }
  // v2 events written before sessionDay existed may use their actual local
  // timestamp day. Invalid timestamps cannot manufacture spacing proof.
  return localSessionDayFor(event?.at) || "";
}

function evidenceTime(event) {
  try {
    const date = event?.at instanceof Date ? new Date(event.at.getTime()) : new Date(event?.at);
    const time = date.getTime();
    return Number.isNaN(time) ? null : time;
  } catch {
    return null;
  }
}

function readinessNow(now) {
  try {
    const date = now instanceof Date ? new Date(now.getTime()) : new Date(now ?? Date.now());
    const time = date.getTime();
    return Number.isNaN(time) ? null : time;
  } catch {
    return null;
  }
}

function isCurrentEvidence(event, nowTime) {
  const time = evidenceTime(event);
  if (time === null || nowTime === null || time > nowTime) return false;
  return nowTime - time <= QUEST_PRACTICE_THRESHOLDS.conclusionWindowDays * 24 * 60 * 60 * 1000;
}

// v2 is guided practice, not an assessment. This result may guide the next
// teaching check, but intentionally has no formal-status or Secure pathway.
export function practiceReadinessFor(targetId, events, { now } = {}) {
  const deduped = [];
  const ids = new Set();
  for (const event of Array.isArray(events) ? events : []) {
    if (
      event?.evidenceKind === "practice"
      && event.target === targetId
      && validateEvidencePath({
        targetId: event.target,
        domain: event.domain,
        wordId: event.word,
        position: event.position,
        activityType: event.activityType,
        connectedTextId: event.connectedTextId,
        bossTransferId: event.bossTransferId
      }).valid
      && typeof event.correct === "boolean"
      && typeof event.id === "string"
      && event.id
      && !ids.has(event.id)
    ) {
      ids.add(event.id);
      deduped.push(event);
    }
  }
  const independent = deduped.filter(evidenceIsIndependent).sort(compareEvidence);
  const independentCorrect = independent.filter(event => event.correct === true);
  const nowTime = readinessNow(now);
  const current = deduped.filter(event => isCurrentEvidence(event, nowTime));
  const currentIndependent = current.filter(evidenceIsIndependent).sort(compareEvidence);
  const currentIndependentCorrect = currentIndependent.filter(event => event.correct === true);
  const recent = currentIndependent.slice(-QUEST_PRACTICE_THRESHOLDS.accuracyWindow);
  const recentAccuracy = recent.length
    ? recent.filter(event => event.correct === true).length / recent.length
    : 0;
  const domains = [...new Set(currentIndependentCorrect.map(event => event.domain))].sort();
  const sessions = [...new Set(currentIndependentCorrect.map(evidenceSessionDay).filter(Boolean))].sort();
  const ready = currentIndependentCorrect.length >= QUEST_PRACTICE_THRESHOLDS.minCorrect
    && recent.length === QUEST_PRACTICE_THRESHOLDS.accuracyWindow
    && recentAccuracy >= QUEST_PRACTICE_THRESHOLDS.minAccuracy
    && domains.length >= QUEST_PRACTICE_THRESHOLDS.minDomains
    && sessions.length >= QUEST_PRACTICE_THRESHOLDS.minSessions;

  return Object.freeze({
    target: targetId,
    evidenceKind: "practice",
    attempts: deduped.length,
    independentAttempts: independent.length,
    correct: independentCorrect.length,
    currentAttempts: current.length,
    currentIndependentAttempts: currentIndependent.length,
    currentCorrect: currentIndependentCorrect.length,
    recentAccuracy,
    domains: Object.freeze(domains),
    sessions: Object.freeze(sessions),
    ready,
    state: ready ? "ready_for_teaching_check" : currentIndependent.length ? "building" : "exposure"
  });
}

// The n sounds this child is worst at — powers the teacher dashboard's
// "weakest five" and the Free Roam review mode. Sounds never attempted are not
// "weak", they are simply not met yet, so they are excluded.
export function weakestTargets(mastery, n = 5) {
  return Object.entries(mastery || {})
    .filter(([, r]) =>
      (independentAttemptCount(r) > 0 || (Number(r?.misses) || 0) > 0)
      && r?.state !== MASTERY_STATES.RETIRED)
    .map(([target, r]) => ({
      target,
      accuracy: independentAttemptCount(r)
        ? Math.max(0, Math.min(1, r.correct / independentAttemptCount(r)))
        : 0,
      seen: r.seen,
      independentSeen: independentAttemptCount(r),
      state: r.state
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.seen - a.seen || a.target.localeCompare(b.target))
    .slice(0, n);
}
