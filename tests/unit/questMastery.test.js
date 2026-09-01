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
  MASTERY_RULES,
  QUEST_PRACTICE_THRESHOLDS,
  BLEND_RULES,
  RETIRE_REVIEW_GAP
} from "../../src/utils/questMastery.js";
import { BOX_INTERVALS } from "../../src/utils/questReviewScheduler.js";

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

test("legacy rules remain numerically aligned with the v2 practice authority", () => {
  assert.equal(MASTERY_RULES.minCorrect, QUEST_PRACTICE_THRESHOLDS.minCorrect);
  assert.equal(MASTERY_RULES.minAccuracy, QUEST_PRACTICE_THRESHOLDS.minAccuracy);
  assert.equal(MASTERY_RULES.accuracyWindow, QUEST_PRACTICE_THRESHOLDS.accuracyWindow);
  assert.equal(MASTERY_RULES.minShells, QUEST_PRACTICE_THRESHOLDS.minDomains);
  assert.equal(MASTERY_RULES.minSessions, QUEST_PRACTICE_THRESHOLDS.minSessions);
});

test("one attempt moves a sound to learning, never to mastered", () => {
  const r = recordAttempt(emptyRecord(), { correct: true, shell: "stones", at: "2026-07-11T10:00:00Z" });
  assert.equal(r.state, MASTERY_STATES.LEARNING);
  assert.equal(r.correct, 1);
  assert.equal(r.seen, 1);
  assert.equal(r.independentSeen, 1);
  assert.equal(r.box, 2, "one clean recall starts the spaced-review interval");
});

test("clean learning recalls advance through Leitner boxes and a miss resets immediately", () => {
  const first = recordAttempt(emptyRecord(), {
    correct: true, shell: "stones", at: "2026-07-11T10:00:00Z", stopIndex: 1
  });
  const second = recordAttempt(first, {
    correct: true, shell: "stones", at: "2026-07-11T10:01:00Z", stopIndex: 3
  });
  assert.equal(first.box, 2);
  assert.equal(second.box, 3);

  const missed = recordAttempt(second, {
    correct: false, shell: "bridge", at: "2026-07-11T10:02:00Z", stopIndex: 8
  });
  assert.equal(missed.box, 1);
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

test("A SHORT HISTORY IS NOT MASTERY: too few attempts is still `learning`", () => {
  // Shells >= 2, sessions >= 2 — but the accuracy window isn't full yet. We do
  // not claim mastery on a handful of data points.
  const r = run(emptyRecord(), [
    ...hits(1, "flower-patch", "2026-07-11"),
    ...hits(1, "hungry-beast", "2026-07-12")
  ]);
  assert.equal(r.correct, 2);
  assert.ok(r.window.length < MASTERY_RULES.accuracyWindow);
  assert.equal(r.state, MASTERY_STATES.LEARNING);
});

// ── THE POSITIVE CASE ───────────────────────────────────────────────────────

test("mastery: the current four-response window passes across 2 shells and 2 days", () => {
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

test("accuracy is measured over the current last-four window, so an early bad day doesn't haunt them", () => {
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
  assert.equal(twice.correct, 0, "old correct evidence cannot remaster the sound immediately");
  assert.equal(twice.independentSeen, 0);
  assert.deepEqual(twice.window, []);
  assert.deepEqual(twice.shells, []);
  assert.deepEqual(twice.sessions, []);
  assert.equal(twice.box, 1);
  assert.equal(twice.evidenceEpoch, 1);

  const sameDayRecall = recordAttempt(twice, {
    correct: true, shell: "runner", at: "2026-08-01T10:02:00Z"
  });
  assert.equal(sameDayRecall.state, MASTERY_STATES.LEARNING, "re-mastery must prove two shells and two days again");
  assert.deepEqual(sameDayRecall.shells, ["runner"]);
  assert.deepEqual(sameDayRecall.sessions, ["2026-08-01"]);
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

// ── Retirement: live in production via recordAttempt, not just via retire() ──

function masteredRecord() {
  // Mastered honestly: two shells, two days, clean window; last practised stop 1.
  return run(emptyRecord(), [
    { correct: true, shell: "stones", at: "2026-07-11T10:00:00Z", stopIndex: 1 },
    { correct: true, shell: "stones", at: "2026-07-11T10:01:00Z", stopIndex: 1 },
    { correct: true, shell: "bridge", at: "2026-07-12T10:00:00Z", stopIndex: 1 },
    { correct: true, shell: "bridge", at: "2026-07-12T10:01:00Z", stopIndex: 1 }
  ]);
}

test("RETIRE_REVIEW_GAP matches the scheduler's box-4 interval (the numbers must agree)", () => {
  assert.equal(RETIRE_REVIEW_GAP, BOX_INTERVALS[4]);
});

test("a mastered sound that survives review one full interval later is RETIRED", () => {
  const m = masteredRecord();
  assert.equal(m.state, MASTERY_STATES.MASTERED);
  const reviewed = recordAttempt(m, {
    correct: true, shell: "cave", at: "2026-07-20T10:00:00Z", stopIndex: 1 + RETIRE_REVIEW_GAP
  });
  assert.equal(reviewed.state, MASTERY_STATES.RETIRED, "survived spaced recall => retired");
  assert.equal(isMastered({ x: reviewed }, "x"), true, "retired still counts as known");
});

test("a correct review INSIDE the interval keeps `mastered` — retirement needs distance", () => {
  const m = masteredRecord();
  const early = recordAttempt(m, {
    correct: true, shell: "cave", at: "2026-07-13T10:00:00Z", stopIndex: 1 + RETIRE_REVIEW_GAP - 1
  });
  assert.equal(early.state, MASTERY_STATES.MASTERED);
});

test("a MISS at review distance does not retire — and two misses demote even a retired sound", () => {
  const m = masteredRecord();
  const missed = recordAttempt(m, { correct: false, shell: "cave", at: "2026-07-20T10:00:00Z", stopIndex: 13 });
  assert.equal(missed.state, MASTERY_STATES.MASTERED, "one miss never demotes or retires");
  const retired = recordAttempt(m, { correct: true, shell: "cave", at: "2026-07-20T10:00:00Z", stopIndex: 13 });
  const twoMisses = run(retired, [
    { correct: false, shell: "pens", at: "2026-07-25T10:00:00Z", stopIndex: 20 },
    { correct: false, shell: "pens", at: "2026-07-25T10:01:00Z", stopIndex: 20 }
  ]);
  assert.equal(twoMisses.state, MASTERY_STATES.LEARNING, "retired is a claim too, and claims get retested");
});

// ── Blend bar arithmetic: one slip in three reads must not block a blend ─────

test("BLEND_RULES: 2-of-3 in the current window passes", () => {
  const blend = run(emptyRecord(), [
    { correct: true, shell: "bridge", at: "2026-07-11T10:00:00Z", stopIndex: 12, rules: BLEND_RULES },
    { correct: false, shell: "cave", at: "2026-07-12T10:00:00Z", stopIndex: 13, rules: BLEND_RULES },
    { correct: true, shell: "cave", at: "2026-07-12T10:01:00Z", stopIndex: 13, rules: BLEND_RULES },
    { correct: true, shell: "bridge", at: "2026-07-12T10:02:00Z", stopIndex: 13, rules: BLEND_RULES }
  ]);
  assert.equal(blend.correct >= BLEND_RULES.minCorrect, true);
  assert.equal(blend.state, MASTERY_STATES.MASTERED, "3 correct, one slip, two shells, two days = mastered");
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

test("timeout-only exposure is neutral in weakest-target rankings", () => {
  const timeoutOnly = run(emptyRecord(), [
    { correct: false, reason: "timeout", at: "2026-01-01T10:00:00Z", stopIndex: 4 },
    { correct: false, reason: "timeout", at: "2026-01-01T10:01:00Z", stopIndex: 4 }
  ]);
  const realMiss = recordAttempt(emptyRecord(), {
    correct: false, shell: "stones", at: "2026-01-01T10:02:00Z", stopIndex: 4
  });
  assert.deepEqual(weakestTargets({ slow: timeoutOnly, struggling: realMiss }, 5).map(entry => entry.target), ["struggling"]);
});

// ── Assisted vs independent evidence (the promptLevel contract) ─────────────

test("a guided tap on the shown answer is compliance, not evidence", () => {
  // promptLevel 2 = the answer was glowing. The child tapping it proves they
  // can follow a light, not that they know the sound.
  const guided = run(emptyRecord(), [
    { correct: true, shell: "flowers", at: "2026-01-01T10:00:00Z", promptLevel: 2 },
    { correct: true, shell: "beast", at: "2026-01-02T10:00:00Z", promptLevel: 2 },
    { correct: true, shell: "flowers", at: "2026-01-03T10:00:00Z", promptLevel: 2 },
    { correct: true, shell: "beast", at: "2026-01-04T10:00:00Z", promptLevel: 2 }
  ]);
  assert.equal(guided.seen, 4, "exposure still counts");
  assert.equal(guided.independentSeen, 0, "assistance never widens the knowledge-accuracy denominator");
  assert.equal(guided.correct, 0, "no independent corrects");
  assert.deepEqual(guided.shells, [], "no shell evidence");
  assert.deepEqual(guided.sessions, [], "no session evidence");
  assert.deepEqual(guided.window, [], "accuracy window untouched");
  assert.equal(guided.state, MASTERY_STATES.LEARNING);
  assert.ok(!meetsMasteryBar(guided), "a child can NEVER master a sound on guided answers alone");
});

test("an assisted MISS still counts as struggle; a timeout counts as nothing but exposure", () => {
  const assisted = recordAttempt(emptyRecord(), { correct: false, promptLevel: 1, at: "2026-01-01T10:00:00Z" });
  assert.equal(assisted.misses, 1, "missing WITH narrowed choices is real struggle");
  assert.deepEqual(assisted.window, [], "but it does not pollute the accuracy window");

  const before = run(emptyRecord(), [
    { correct: true, shell: "flowers", at: "2026-01-01T10:00:00Z" },
    { correct: true, shell: "flowers", at: "2026-01-01T10:01:00Z" }
  ]);
  const timeout = recordAttempt(before, { correct: false, reason: "timeout", at: "2026-01-01T10:02:00Z" });
  assert.equal(timeout.seen, before.seen + 1, "exposure recorded");
  assert.equal(timeout.independentSeen, before.independentSeen, "timeouts do not depress knowledge accuracy");
  assert.equal(timeout.misses, 0, "hesitation is not a knowledge miss");
  assert.equal(timeout.streak, before.streak, "a slow child keeps their streak");
  assert.equal(timeout.lastStop, before.lastStop, "a timeout does not postpone the next real review");
  assert.deepEqual(timeout.window, before.window, "the window never sees fluency events");
});

test("two attempts in the same sitting are one session day", () => {
  const record = run(emptyRecord(), [
    { correct: true, shell: "flowers", at: "2026-01-01T10:00:00Z" },
    { correct: true, shell: "beast", at: "2026-01-01T10:30:00Z" }
  ]);
  assert.equal(record.sessions.length, 1, "same local day = one session, however many answers");
});
