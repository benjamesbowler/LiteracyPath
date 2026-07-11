import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyRecord,
  recordAttempt,
  meetsMasteryBar,
  masteryState,
  isMastered,
  weakestTargets,
  retire,
  MASTERY_STATES,
  MASTERY_RULES
} from "../../src/utils/questMastery.js";

// Helper: run n attempts through the gate.
function run(record, attempts) {
  return attempts.reduce((acc, a) => recordAttempt(acc, a), record);
}

const hits = (n, shell, day) =>
  Array.from({ length: n }, () => ({ correct: true, shell, at: `${day}T10:00:00.000Z` }));

test("a fresh record is not-started", () => {
  assert.equal(emptyRecord().state, MASTERY_STATES.NOT_STARTED);
  assert.equal(masteryState({}, "sh"), MASTERY_STATES.NOT_STARTED);
});

test("one attempt moves a sound to learning, never to mastered", () => {
  const r = recordAttempt(emptyRecord(), { correct: true, shell: "stones", at: "2026-07-11T10:00:00Z" });
  assert.equal(r.state, MASTERY_STATES.LEARNING);
  assert.equal(r.correct, 1);
  assert.equal(r.seen, 1);
});

// ── THE FOUR NEGATIVE CASES. These are the tests that matter. ───────────────

test("CRAMMING IS NOT MASTERY: 10/10 correct in one sitting is still `learning`", () => {
  // Two shells, but all on ONE day. Condition 4 (>= 2 sessions) fails.
  const r = run(emptyRecord(), [
    ...hits(5, "stones", "2026-07-11"),
    ...hits(5, "bridge", "2026-07-11")
  ]);
  assert.equal(r.correct, 10);
  assert.equal(r.sessions.length, 1);
  assert.equal(r.state, MASTERY_STATES.LEARNING, "a child who crammed it today has not learnt it");
  assert.equal(meetsMasteryBar(r), false);
});

test("ONE SHELL IS NOT MASTERY: 10/10 in a single game, over two days, is still `learning`", () => {
  // Condition 3 (>= 2 shells) fails. A child who has learnt "the sh stone is
  // always the third one" has learnt the game, not the sound.
  const r = run(emptyRecord(), [
    ...hits(5, "stones", "2026-07-11"),
    ...hits(5, "stones", "2026-07-12")
  ]);
  assert.equal(r.shells.length, 1);
  assert.equal(r.state, MASTERY_STATES.LEARNING);
});

test("BEING WRONG IN A NEW SHELL IS NOT EVIDENCE", () => {
  // Nine right in one shell, then WRONG in a second shell on a second day.
  // That must not tick conditions 3 and 4 — only a correct answer is evidence.
  const r = run(emptyRecord(), [
    ...hits(9, "stones", "2026-07-11"),
    { correct: false, shell: "bridge", at: "2026-07-12T10:00:00Z" }
  ]);
  assert.deepEqual(r.shells, ["stones"]);
  assert.deepEqual(r.sessions, ["2026-07-11"]);
  assert.equal(r.state, MASTERY_STATES.LEARNING);
});

test("A SHORT HISTORY IS NOT MASTERY: 8/8 across 2 shells and 2 days is not yet enough", () => {
  // Correct >= 8, shells >= 2, sessions >= 2 — but only 8 attempts, so the
  // 10-attempt accuracy window isn't full. We do not claim mastery on 8 data
  // points; we wait two more.
  const r = run(emptyRecord(), [
    ...hits(4, "stones", "2026-07-11"),
    ...hits(4, "bridge", "2026-07-12")
  ]);
  assert.equal(r.correct, 8);
  assert.equal(r.window.length, 8);
  assert.equal(r.state, MASTERY_STATES.LEARNING);
});

// ── THE POSITIVE CASE ───────────────────────────────────────────────────────

test("mastery: 10 attempts, >=8 correct, >=85%, 2 shells, 2 days", () => {
  const r = run(emptyRecord(), [
    ...hits(5, "stones", "2026-07-11"),
    ...hits(5, "bridge", "2026-07-12")
  ]);
  assert.equal(r.window.length, MASTERY_RULES.accuracyWindow);
  assert.equal(r.shells.length, 2);
  assert.equal(r.sessions.length, 2);
  assert.equal(r.state, MASTERY_STATES.MASTERED);
  assert.equal(isMastered({ sh: r }, "sh"), true);
});

test("accuracy is measured over the LAST 10, so an early bad day doesn't haunt them", () => {
  const shaky = run(emptyRecord(), [
    { correct: false, shell: "stones", at: "2026-07-01T10:00:00Z" },
    { correct: false, shell: "stones", at: "2026-07-01T10:01:00Z" },
    { correct: false, shell: "stones", at: "2026-07-01T10:02:00Z" }
  ]);
  const r = run(shaky, [
    ...hits(5, "stones", "2026-07-11"),
    ...hits(5, "bridge", "2026-07-12")
  ]);
  assert.equal(r.correct, 10);
  assert.equal(r.seen, 13);
  assert.equal(r.state, MASTERY_STATES.MASTERED, "lifetime accuracy is 77% — window accuracy is 100%");
});

// ── DEMOTION ────────────────────────────────────────────────────────────────

test("a mastered sound missed TWICE IN A ROW falls back to learning", () => {
  const mastered = run(emptyRecord(), [
    ...hits(5, "stones", "2026-07-11"),
    ...hits(5, "bridge", "2026-07-12")
  ]);
  assert.equal(mastered.state, MASTERY_STATES.MASTERED);

  const once = recordAttempt(mastered, { correct: false, shell: "runner", at: "2026-08-01T10:00:00Z" });
  assert.equal(once.state, MASTERY_STATES.MASTERED, "one bad answer is a slip, not a collapse");

  const twice = recordAttempt(once, { correct: false, shell: "runner", at: "2026-08-01T10:01:00Z" });
  assert.equal(twice.state, MASTERY_STATES.LEARNING, "mastery is a claim, and claims get retested");
});

test("a correct answer resets the miss counter, so misses must be CONSECUTIVE", () => {
  const mastered = run(emptyRecord(), [
    ...hits(5, "stones", "2026-07-11"),
    ...hits(5, "bridge", "2026-07-12")
  ]);
  const r = run(mastered, [
    { correct: false, shell: "runner", at: "2026-08-01T10:00:00Z" },
    { correct: true, shell: "runner", at: "2026-08-01T10:01:00Z" },
    { correct: false, shell: "runner", at: "2026-08-01T10:02:00Z" }
  ]);
  assert.equal(r.misses, 1);
  assert.equal(r.state, MASTERY_STATES.MASTERED);
});

test("retire only applies to a mastered sound", () => {
  assert.equal(retire(emptyRecord()).state, MASTERY_STATES.NOT_STARTED);
  const mastered = run(emptyRecord(), [
    ...hits(5, "stones", "2026-07-11"),
    ...hits(5, "bridge", "2026-07-12")
  ]);
  assert.equal(retire(mastered).state, MASTERY_STATES.RETIRED);
  assert.equal(isMastered({ x: retire(mastered) }, "x"), true);
});

// ── WEAKEST ─────────────────────────────────────────────────────────────────

test("weakestTargets ranks by accuracy and ignores sounds never met", () => {
  const mastery = {
    sh: { seen: 10, correct: 9, state: MASTERY_STATES.LEARNING },
    th: { seen: 10, correct: 3, state: MASTERY_STATES.LEARNING },
    ch: { seen: 10, correct: 6, state: MASTERY_STATES.LEARNING },
    ng: { seen: 0, correct: 0, state: MASTERY_STATES.NOT_STARTED }
  };
  const weak = weakestTargets(mastery, 3).map(w => w.target);
  assert.deepEqual(weak, ["th", "ch", "sh"]);
  assert.ok(!weak.includes("ng"), "a sound you have never met is not a sound you are weak at");
});
