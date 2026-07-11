// SPACED REVIEW — how old sounds come back.
//
// A stop teaches up to 4 new sounds. It also drags back up to 4 OLD ones that
// are due, chosen by how badly the child is doing with them. This is the
// mechanism that makes the mastery gate actually bite: an unmastered sound is
// not "failed", it is simply scheduled again, in a different game, later.
//
// Leitner-lite, 5 boxes:
//
//   box 1  due now          new, or just missed
//   box 2  due in  2 stops  1 correct
//   box 3  due in  5 stops  2 correct
//   box 4  due in 12 stops  mastered
//   box 5  sampled 1-in-10  retired (nothing is ever allowed to rot)
//
// DOM-free and deterministic (the 1-in-10 sample is index-based, not random),
// so it is unit-testable — tests/unit/questReviewScheduler.test.js.

import { MASTERY_STATES, emptyRecord } from "./questMastery.js";

export const BOX_INTERVALS = Object.freeze({ 1: 0, 2: 2, 3: 5, 4: 12, 5: 30 });
export const MAX_BOX = 5;
export const MAX_REVIEW_PER_STOP = 4;
export const MAX_TARGETS_PER_STOP = 8;

export function promote(record) {
  const r = { ...emptyRecord(), ...(record || {}) };
  return { ...r, box: Math.min(MAX_BOX, (r.box || 1) + 1) };
}

// A miss sends a sound straight back to box 1 — not one box back. Half-knowing
// a sound is the state we are trying to eliminate; drip-feeding it every 5
// stops is how a child stays half-knowing it for a term.
export function demote(record) {
  const r = { ...emptyRecord(), ...(record || {}) };
  return { ...r, box: 1 };
}

// Update the box for one target after a stop, from its mastery record.
export function boxAfterStop(record) {
  const r = { ...emptyRecord(), ...(record || {}) };
  if (r.state === MASTERY_STATES.RETIRED) return 5;
  if (r.state === MASTERY_STATES.MASTERED) return 4;
  if (r.misses > 0) return 1;
  return Math.min(3, Math.max(1, r.box || 1));
}

function isDue(record, stopIndex) {
  const r = { ...emptyRecord(), ...(record || {}) };
  const box = Math.min(MAX_BOX, Math.max(1, r.box || 1));
  const lastStop = Number(r.lastStop) || 0;
  const gap = stopIndex - lastStop;

  // Box 5 (retired) is never "due" in the normal sense — it is sampled, so a
  // child still sees `s` occasionally in year two. Index-based, not random, so
  // two devices agree and the test can assert it.
  if (box === MAX_BOX) return stopIndex % 10 === 0;
  return gap >= BOX_INTERVALS[box];
}

// How badly does this child need to see this sound again? Higher = sooner.
// errorRate dominates; a long gap since we last saw it nudges it up.
export function reviewWeight(record, stopIndex) {
  const r = { ...emptyRecord(), ...(record || {}) };
  if (!r.seen) return 0;
  const errorRate = 1 - r.correct / r.seen;
  const gap = Math.max(0, stopIndex - (Number(r.lastStop) || 0));
  const recency = Math.min(1, gap / 12);
  return errorRate * 2 + recency;
}

// The review items due at this stop, worst-first, capped.
export function dueTargets(mastery, stopIndex, limit = MAX_REVIEW_PER_STOP) {
  return Object.entries(mastery || {})
    .filter(([, record]) => (record?.seen || 0) > 0 && isDue(record, stopIndex))
    .map(([target, record]) => ({ target, weight: reviewWeight(record, stopIndex) }))
    .sort((a, b) => b.weight - a.weight || a.target.localeCompare(b.target))
    .slice(0, limit)
    .map(entry => entry.target);
}

// The full target list for a stop: what it teaches, plus what is due back.
// Capped at MAX_TARGETS_PER_STOP so a struggling child never faces a wall —
// the sounds that don't fit are not lost, they are simply due at the next stop.
export function targetsForStop(newTargets, mastery, stopIndex) {
  const fresh = [...new Set(newTargets || [])];
  const review = dueTargets(mastery, stopIndex).filter(t => !fresh.includes(t));
  const room = Math.max(0, MAX_TARGETS_PER_STOP - fresh.length);
  return [...fresh, ...review.slice(0, room)];
}
