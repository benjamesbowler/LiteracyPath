import test from "node:test";
import assert from "node:assert/strict";
import { detectMisconceptionSignals } from "../../src/utils/misconceptionDetective.js";

const student = { id: "s1", name: "Ari" };
function wrong(chosen, correct, day, target = "cvc_short_vowels") { return { student_id: "s1", diagnostic_target: target, chosen_answer: chosen, correct_answer: correct, is_correct: false, answered_at: `${day}T10:00:00Z` }; }

test("detects a repeated cross-day medial-vowel pattern", () => {
  const signals = detectMisconceptionSignals({ students: [student], answers: [wrong("pin", "pan", "2026-08-01"), wrong("pin", "pan", "2026-08-02"), wrong("pin", "pan", "2026-08-02")], now: new Date("2026-08-10T00:00:00Z") });
  assert.equal(signals.length, 1);
  assert.equal(signals[0].patternId, "medial_vowel_confusion");
  assert.equal(signals[0].claim, "instructional_hypothesis_not_diagnosis");
});

test("does not claim a pattern from a single occasion or correct answers", () => {
  const answers = [wrong("pin", "pan", "2026-08-01"), wrong("pin", "pan", "2026-08-01"), { ...wrong("pin", "pan", "2026-08-02"), is_correct: true }];
  assert.deepEqual(detectMisconceptionSignals({ students: [student], answers, now: new Date("2026-08-10T00:00:00Z") }), []);
});

test("four repeated same-day errors can surface but remain a hypothesis", () => {
  const answers = Array.from({ length: 4 }, () => wrong("ship", "shop", "2026-08-01", "digraphs"));
  const [signal] = detectMisconceptionSignals({ students: [student], answers, now: new Date("2026-08-10T00:00:00Z") });
  assert.equal(signal.occurrences, 4);
  assert.match(signal.hypothesis, /may be/);
});

test("uses the teacher time zone for school-day grouping and ignores stale history", () => {
  const nearMidnight = [
    wrong("pin", "pan", "2026-08-01").answered_at.replace("T10:00:00Z", "T23:30:00Z"),
    wrong("pin", "pan", "2026-08-02").answered_at.replace("T10:00:00Z", "T00:30:00Z")
  ].map(answered_at => ({ ...wrong("pin", "pan", "2026-08-01"), answered_at }));
  const answers = [...nearMidnight, ...nearMidnight, wrong("pin", "pan", "2025-01-01")];
  const [signal] = detectMisconceptionSignals({ students: [student], answers, timeZone: "America/Los_Angeles", now: new Date("2026-08-10T00:00:00Z") });
  assert.equal(signal.distinctDays, 1);
  assert.equal(signal.occurrences, 4);
});
