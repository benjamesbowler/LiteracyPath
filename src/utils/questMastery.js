// THE MASTERY GATE — the whole reason Sound Seekers exists.
//
// Teach Your Monster has no mastery gate. Their own post-mortem (Mar 2026):
// "we couldn't be certain that a letter sound was actually learnt, or simply
// seen." A child there can be pushed into digraphs while still failing `s`.
//
// Here, mastery is a CLAIM ABOUT THE CHILD, and claims must be earned.
// The live bar (MASTERY_RULES below — this summary MUST match the code):
//
//   1. >= 4 correct responses
//   2. >= 75% accuracy over the LAST 4 attempts (not lifetime — a child who
//      has learnt it should not be punished for the day they hadn't)
//   3. proved in >= 2 DIFFERENT mini-game shells  (kills shell-specific
//      pattern-matching: "I know it's the third stone")
//   4. proved on >= 2 DIFFERENT days               (kills same-sitting cramming)
//
// (The bar was 8-correct/85%-of-10 in the v1 quiz build; the "why it changed"
// note above MASTERY_RULES tells that story.)
//
// A mastered sound falls back to `learning` if it is missed twice in a row.
//
// NOTHING NARRATIVE IS GATED BY THIS. The child always finishes the stop, always
// gets the cosmetic, always moves on. This only decides what the review
// scheduler serves next, and what colour the stone is on the Den wall.
//
// DOM-free and deterministic — unit-tested in tests/unit/questMastery.test.js.

// THE BAR HAS TO FIT THE GAME THE CHILD IS ACTUALLY PLAYING.
//
// It used to be 8 correct across a 10-attempt window. That was tuned for the
// first build, where every stop was a five-shell quiz plus a six-round Gate —
// about twenty questions a stop. That game was joyless and it is gone.
//
// A stop is now a WALK: three things happen in the path, about five responses in
// total, and most of the time is spent walking. Ten attempts per sound is simply
// more evidence than this game will ever produce for a sound taught late on the
// trail, so the bar would have quietly become unreachable — a child could read
// perfectly and still watch the last stones stay dark forever.
//
// Four correct, 75% over the last four, in TWO DIFFERENT ENCOUNTERS, on TWO
// DIFFERENT DAYS.
//
// The two conditions that carry the honesty are untouched, and they are the only
// two that ever mattered:
//   - two different days  -> you cannot cram it in one sitting
//   - two different things -> you cannot fake it by learning one mini-game
// The raw count was never the honest part. Demanding ten attempts of a game that
// only ever offers four is not rigour; it is a bar nobody can clear, and the
// child gets the blame.
export const MASTERY_RULES = Object.freeze({
  minCorrect: 4,
  minAccuracy: 0.75,
  accuracyWindow: 4,
  minShells: 2,
  minSessions: 2,
  demoteAfterConsecutiveMisses: 2
});

// BLENDS GET THEIR OWN BAR, and this is not a fudge to make a test pass.
//
// A blend is not a grapheme. `st` is s and t said quickly — there is no such
// thing as "the /st/ stone", so a blend can never be a letter-choice question.
// The only evidence for it is a child reading or spelling a word that contains
// one, which means it gets ~2 exposures per stop against a bar that demands a
// TEN-attempt window. A full-trail simulation showed the consequence: even a
// PERFECT reader could never master sn, sk, sm, sw, sl or pr. Not "found it
// hard" — could not, ever, by construction.
//
// Three correct reads, across two different task types, on two different days,
// is real evidence for a unit this size. Demanding ten was demanding evidence
// the game structurally cannot produce.
//
// The window arithmetic matters and once shipped wrong: a 3-attempt window at
// 0.75 means 2/3 (= 0.667) FAILS, so a blend needed a PERFECT 3-of-3 — a
// stricter bar than a grapheme's 3-of-4, the exact opposite of this comment's
// argument. 0.66 makes 2-of-3 pass: one slip in three reads does not un-know
// a blend.
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
    correct: 0,
    streak: 0,
    misses: 0,          // consecutive misses, reset by any correct
    window: [],         // last N results as 1/0, newest last
    shells: [],         // distinct shell ids the child has been right in
    sessions: [],       // distinct YYYY-MM-DD days the child has been right on
    state: MASTERY_STATES.NOT_STARTED,
    box: 1,             // Leitner box, owned by questReviewScheduler
    lastAt: ""
  };
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
// Pure: returns a new record, mutates nothing.
export function recordAttempt(record, { correct = false, shell = "", at = "", stopIndex = 0, rules = MASTERY_RULES } = {}) {
  const prev = { ...emptyRecord(), ...(record || {}) };
  const day = dayOf(at);

  const next = {
    ...prev,
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak: correct ? prev.streak + 1 : 0,
    misses: correct ? 0 : prev.misses + 1,
    window: [...prev.window, correct ? 1 : 0].slice(-rules.accuracyWindow),
    shells: [...prev.shells],
    sessions: [...prev.sessions],
    lastAt: at || prev.lastAt,
    // THE sound was practised HERE. This is the only place lastStop should be
    // written — see the note in questProgress.recordStopResult.
    lastStop: stopIndex || prev.lastStop || 0
  };

  // Only a CORRECT answer is evidence. Being wrong in a second shell on a
  // second day proves nothing, and must not count toward conditions 3 and 4.
  if (correct) {
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

// The n sounds this child is worst at — powers the teacher dashboard's
// "weakest five" and the Free Roam review mode. Sounds never attempted are not
// "weak", they are simply not met yet, so they are excluded.
export function weakestTargets(mastery, n = 5) {
  return Object.entries(mastery || {})
    .filter(([, r]) => (r?.seen || 0) > 0 && r?.state !== MASTERY_STATES.RETIRED)
    .map(([target, r]) => ({
      target,
      accuracy: r.seen ? r.correct / r.seen : 0,
      seen: r.seen,
      state: r.state
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.seen - a.seen || a.target.localeCompare(b.target))
    .slice(0, n);
}
