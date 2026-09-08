import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAssessmentAttempt, summarizeAssessmentHistory, exportAssessmentAttemptsCsv, extractMasteryFromAssessmentAttempt } from "../../src/data/assessmentHistoryStore.js";

const item = (id, more = {}) => ({ questionId: id, mechanicId: "letterPair", construct: "letter_match", evidenceConstruct: "letter_match", selected: "a", evidence: {}, audioRequired: false, audioDelivery: "not_required", responseStatus: "correct", isCorrect: true, ...more });
const attempt = (records, extra = {}) => ({ attemptId: "cycle-report", studentId: "synthetic", assessmentType: "cycle_practice_check", contentVersion: "cycle-practice-v2", assessmentVersion: "cycle-practice-v2", policyVersion: "cycle-practice-policy-v2", correctCount: 999, totalQuestions: 999, accuracy: 100, passed: true, questionRecords: records, ...extra });
test("Cycle report preserves support and media, using only independent denominator", () => {
  const result = normalizeAssessmentAttempt(attempt([
    item("a"), item("b", { responseStatus: "incorrect", isCorrect: false }),
    item("c", { mechanicId: "letterTrace", evidence: { supportLevel: 1 }, responseStatus: "supported", isCorrect: null }),
    item("d", { mechanicId: "soundGate", audioRequired: true, audioDelivery: "unavailable", responseStatus: "media_failed", isCorrect: null })
  ]));
  assert.equal(result.totalQuestions, 4);
  assert.equal(result.scoredQuestions, 2);
  assert.equal(result.correctCount, 1);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.accuracy, 50);
  assert.equal(result.supportedCount, 1);
  assert.equal(result.mediaFailedCount, 1);
  assert.equal(result.status, "incomplete");
  assert.equal(result.passed, false);
  assert.deepEqual(result.questionRecords[2].evidence, { supportLevel: 1 });
  assert.equal(result.questionRecords[2].isCorrect, null);
  assert.equal(result.questionRecords[3].audioDelivery, "unavailable");
  const rerun = normalizeAssessmentAttempt(result);
  assert.equal(rerun.accuracy, 50);
  assert.equal(rerun.supportedCount, 1);
  const csv = exportAssessmentAttemptsCsv([result]);
  assert.match(csv, /"scoredQuestions","supportedCount","mediaFailedCount"/);
  assert.match(csv, /"cycle_practice_check","2","1","1"/);
});
test("Legacy and unavailable-only check report missing accuracy, never zero literacy", () => {
  const legacy = normalizeAssessmentAttempt(attempt([item("a")], { contentVersion: "cycle-practice-v1", practiceSeconds: 1800 }));
  assert.equal(legacy.scoredQuestions, 0);
  assert.equal(legacy.accuracy, null);
  assert.equal(legacy.practiceSeconds, null);
  const unavailable = normalizeAssessmentAttempt(attempt([item("b", { mechanicId: "soundGate", audioDelivery: "unavailable" })]));
  assert.equal(unavailable.accuracy, null);
  assert.equal(unavailable.mediaFailedCount, 1);
});
test("Cycle practice never contributes formal assessment aggregate or item placement", () => {
  const record = attempt([item("a", { itemKey: "a", itemType: "letter" })]);
  const summary = summarizeAssessmentHistory([record]);
  assert.equal(summary.totalQuestions, 0);
  assert.equal(summary.correctCount, 0);
  assert.equal(summary.cyclePracticeAttempts.length, 1);
  assert.equal(summary.skills.length, 0);
  assert.deepEqual(extractMasteryFromAssessmentAttempt(record).masteredItems, []);
});

test("Teacher session export preserves null score and separate durations", async () => {
  const { cycleResultSummary, cycleDurationSummary, exportCycleSessionResultsCsv } = await import("../../src/utils/cyclePracticeReporting.js");
  const result = { attemptId: "attempt", totalQuestions: 4, scoredQuestions: 0, correctCount: 0, accuracy: null,
    supportedCount: 2, mediaFailedCount: 2, practiceSeconds: 1810, sessionElapsedSeconds: 2000, checkSeconds: 40, status: "incomplete" };
  assert.match(cycleResultSummary(result), /No independent score/);
  assert.match(cycleResultSummary(result), /2 supported; 2 unavailable media/);
  assert.match(cycleDurationSummary(result), /Active practice 1810s · Check 40s · Session 2000s/);
  const csv = exportCycleSessionResultsCsv([{ student_id: "s", cycle_practice_result: result }], [{ id: "s", name: "=formula" }]);
  assert.match(csv, /"'=formula"/);
  assert.match(csv, /"4","0","0","","2","2","1810","40","2000"/);
});

test("Practise next preserves first response and excludes correct mappings", async () => {
  const { cyclePracticeNextRows } = await import("../../src/utils/cyclePracticeReporting.js");
  const result = { questionRecords: [item("correct", { itemKey: "a" }), item("miss", { itemKey: "m", selected: "n", responseStatus: "incorrect" }), item("support", { itemKey: "s", responseStatus: "supported" }), item("media", { itemKey: "t", selected: null, responseStatus: "media_failed" })] };
  const original = JSON.stringify(result);
  const rows = cyclePracticeNextRows(result);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].target, "m");
  assert.equal(rows[0].selected, "Response: n");
  assert.equal(JSON.stringify(result), original);
});
