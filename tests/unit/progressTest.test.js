import assert from "node:assert/strict";
import test from "node:test";
import { PROGRESS_BANK } from "../../src/content/assessments/v3/progressBank.generated.js";
import { PROGRESS_TEST_TRACKS } from "../../src/policy/progressTestPolicy.js";
import { beginProgressTest, commitProgressResponse, createProgressTestRun, finishProgressTest, nextProgressItem, progressAttemptFromRun } from "../../src/utils/progressTestRouter.js";
import { compactAssessmentAttemptForStorage, mergeAssessmentAttemptIntoItemMastery, normalizeAssessmentAttempt, summarizeAssessmentHistory } from "../../src/data/assessmentHistoryStore.js";
import { createReportingEvidence } from "../../src/data/reportingEvidenceModel.js";
import { progressExportSheets } from "../../src/utils/exportProgressCheck.js";
import { loadProgressRun, loadProgressRunLocal, persistProgressRun, progressDraftExtends, saveProgressRunLocal } from "../../src/data/progressTestStore.js";

const make = options => createProgressTestRun({ bank: PROGRESS_BANK, studentId: "pupil-a", teacherId: "teacher-a", classId: "class-a", planKind: "focused", trackId: "reading_stories", seed: 20, attemptId: "run-a", ...options });
const delivery = item => Object.fromEntries(Object.entries(item.audio || {}).flatMap(([role, cue]) => Array.isArray(cue) ? cue.flatMap((entry, index) => entry.required ? [[`${role}:${index}`, "completed"]] : []) : cue.required ? [[role, "completed"]] : []));
const answer = (run, correct = true, extra = {}) => commitProgressResponse(run, { itemId: run.currentItem.id, selected: correct ? run.currentItem.answer : run.currentItem.choices.find(choice => choice.id !== run.currentItem.answer).id, audioDelivery: delivery(run.currentItem), ...extra });
function complete(run, outcomes) { let index = 0; run = beginProgressTest(run); while (run.currentItem) { run = nextProgressItem(answer(run, outcomes(index++, run))); if (index > 50) throw Error("Unbounded routing"); } return run; }

test("every published track supports two full capped checks with cumulative family and passage exposure exclusion", () => {
  for (const track of PROGRESS_TEST_TRACKS) for (const outcomes of [() => true, () => false, index => index % 2 === 0, index => index % 5 !== 0]) {
    const first = complete(make({ trackId: track.id }), outcomes);
    assert.equal(first.status, "completed", track.id);
    const prior = progressAttemptFromRun(first);
    const second = complete(make({ trackId: track.id, attemptId: "run-b", previousAttempts: [prior] }), outcomes);
    assert.equal(second.status, "completed", track.id);
    const used = new Set(first.responses.map(row => row.stimulusFamilyId));
    assert.ok(second.responses.every(row => !used.has(row.stimulusFamilyId)));
    const passageSources = new Set(first.responses.flatMap(row => row.itemSnapshot.media.requiredSources.filter(source => source.role === "passage").map(source => source.path)));
    assert.ok(second.responses.every(row => !row.itemSnapshot.media.requiredSources.some(source => source.role === "passage" && passageSources.has(source.path))));
  }
});
test("correct and incorrect first answers move exactly one tier and retries cannot change the receipt", () => {
  const original = beginProgressTest(make()); const correct = answer(original);
  assert.equal(correct.responses[0].routeAfter, 2); assert.equal(original.responses.length, 0);
  assert.strictEqual(commitProgressResponse(correct, { itemId: original.currentItem.id, selected: original.currentItem.choices[1].id }), correct);
  const next = nextProgressItem(correct); const wrong = answer(next, false);
  assert.equal(wrong.responses[1].routeAfter, 1);
  assert.deepEqual(next.currentItem, nextProgressItem(JSON.parse(JSON.stringify(next))).currentItem);
});
test("spoken choices remain paired with the seeded visual order and required audio must actually finish", () => {
  const run = beginProgressTest(make({ trackId: "hear_sounds" }));
  assert.deepEqual(run.currentItem.audio.choices.map(cue => cue.choiceId), run.currentItem.choices.map(choice => choice.id));
  const unheard = answer(run, true, { audioDelivery: {} });
  assert.equal(unheard.responses[0].responseStatus, "media_failed"); assert.equal(unheard.responses[0].isCorrect, null); assert.equal(unheard.tracks.hear_sounds.nextTier, 1);
});
test("skips, support, no response and failed media remain distinct and never route", () => {
  for (const [state, extra] of [["skipped", { selected: null, responseStatus: "skipped", mediaReady: false }], ["no_response", { selected: null, responseStatus: "no_response" }], ["supported", { supportUsed: true }], ["media_failed", { mediaReady: false }]]) {
    const run = answer(beginProgressTest(make()), false, extra);
    assert.equal(run.responses[0].responseStatus, state); assert.equal(run.responses[0].isCorrect, null); assert.equal(run.tracks.reading_stories.nextTier, 1);
  }
  const run = beginProgressTest(make()); assert.strictEqual(commitProgressResponse(run, { itemId: run.currentItem.id, selected: null }), run);
});
test("contradictory higher successes and lower errors continue to the cap instead of manufacturing a boundary", () => {
  const run = complete(make(), index => index % 5 !== 0);
  const contradictory = run.responses.some(lower => lower.isCorrect === false && run.responses.some(higher => higher.isCorrect === true && higher.difficultyTier > lower.difficultyTier));
  assert.equal(contradictory, true); assert.equal(run.responses.length, 16); assert.equal(run.stopReasons.reading_stories, "item_cap");
});
test("broad profile balances coverage, hard caps all presentations, and paused or partial runs cannot accept answers", () => {
  const broad = complete(make({ planKind: "broad_profile" }), () => true);
  assert.equal(broad.status, "completed"); assert.ok(PROGRESS_TEST_TRACKS.every(track => broad.responses.filter(row => row.trackId === track.id).length >= 4)); assert.ok(broad.responses.length <= 36);
  let run = beginProgressTest(make()); const paused = { ...run, pause: true }; assert.strictEqual(answer(paused), paused);
  while (run.currentItem) run = nextProgressItem(commitProgressResponse(run, { itemId: run.currentItem.id, responseStatus: "skipped" }));
  assert.equal(run.status, "partial"); assert.equal(run.responses.length, 24);
  assert.strictEqual(nextProgressItem(run), run);
  const stopped = finishProgressTest(beginProgressTest(make())); assert.equal(stopped.responses[0].responseStatus, "no_response");
});
test("all own history and known public source exposure are excluded; other learners do not contaminate the pool", () => {
  const item = PROGRESS_BANK.items.find(row => row.trackId === "listening_stories");
  const ownOld = { studentId: "pupil-a", questionRecords: [{ questionId: item.exposure.sourceItemId }] };
  const unrelated = { studentId: "pupil-b", questionRecords: PROGRESS_BANK.items.map(row => ({ stimulusFamilyId: row.stimulusFamilyId })) };
  const run = make({ trackId: "listening_stories", previousAttempts: [ownOld, unrelated] }); assert.ok(!run.pool.some(row => row.id === item.id));
  assert.throws(() => make({ bank: { ...PROGRESS_BANK, items: PROGRESS_BANK.items.filter(row => row.difficultyTier !== 2) } }), /fresh question families/);
});
test("archive round trips retain frozen questions, warmups, pauses and descriptive null score without influencing mastery", () => {
  const run = complete({ ...make(), warmupRecords: [{ correct: true, scored: false }], pauseEvents: [{ kind: "pause" }], foregroundMs: 10000 }, () => true);
  const attempt = progressAttemptFromRun(run); const normalized = normalizeAssessmentAttempt(JSON.parse(JSON.stringify(compactAssessmentAttemptForStorage(attempt))));
  assert.equal(normalized.accuracy, null); assert.equal(normalized.passed, false); assert.equal(normalized.skillPhase, 0); assert.deepEqual(normalized.questionRecords[0].itemSnapshot, attempt.questionRecords[0].itemSnapshot); assert.equal(normalized.metadata.warmupRecords[0].scored, false);
  const prior = { "word::cat": { attempts: 3, mastered: false } }; assert.deepEqual(mergeAssessmentAttemptIntoItemMastery(prior, normalized), prior);
  const summary = summarizeAssessmentHistory([normalized]); assert.equal(summary.totalQuestions, 0);
  const draft = normalizeAssessmentAttempt(progressAttemptFromRun(make())); assert.equal(draft.completedAt, null);
  const evidence = createReportingEvidence({ sourceRecordType: "adaptive_progress_test", statusCandidate: "secure" }); assert.equal(evidence.status, null); assert.equal(evidence.knowledgeEligible, false);
  const sheets = progressExportSheets([normalized]); assert.deepEqual(Object.keys(sheets), ["Cover", "Summary", "Teach next", "Item evidence", "How to read", "Data", "Provenance"]);
  assert.deepEqual(JSON.parse(sheets.Data.slice(1).map(row => row[2]).join("")), normalized);
  assert.ok(sheets.Data.slice(1).every(row => row[2].length <= 30000));
  assert.ok(sheets["Teach next"].length <= 3);
});
test("draft persistence is owner and assignment scoped, and server failure keeps the immutable local draft for retry", async () => {
  const previous = globalThis.localStorage; const values = new Map(); globalThis.localStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  try {
    const run = answer(beginProgressTest(make()));
    await assert.rejects(() => persistProgressRun(run, { client: { call: async () => ({ error: Error("offline") }) } }), /offline/);
    assert.equal(loadProgressRunLocal(run).responses[0].selected, run.responses[0].selected);
    assert.equal(loadProgressRunLocal({ ...run, studentId: "pupil-b" }), null); assert.equal(loadProgressRunLocal({ ...run, assignmentId: "other-session" }), null);
  } finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});
test("local recovery accepts only genuine frozen prefixes and cannot prefer divergent or completed server drafts", () => {
  const initial = beginProgressTest(make()); const local = answer(initial);
  assert.equal(progressDraftExtends(initial, local), true);
  assert.equal(progressDraftExtends(initial, { ...local, seed: local.seed + 1 }), false);
  assert.equal(progressDraftExtends(local, { ...local, responses: [{ ...local.responses[0], selected: "forged" }] }), false);
  const terminal = finishProgressTest(local); assert.equal(progressDraftExtends(terminal, { ...terminal, foregroundMs: 999 }), false);
});
test("recent comparable strand evidence seeds a start; stale or different-version evidence does not", () => {
  const finished = complete(make({ at: "2026-10-01T10:00:00Z" }), () => true);
  const attempt = { ...progressAttemptFromRun(finished), completedAt: "2026-10-01T10:10:00Z" };
  assert.equal(make({ previousAttempts: [attempt], at: "2026-10-02T10:00:00Z" }).startingPoints.reading_stories.source, "recent_comparable_check");
  assert.equal(make({ previousAttempts: [{ ...attempt, completedAt: "2026-01-01T10:00:00Z" }], at: "2026-10-02T10:00:00Z" }).startingPoints.reading_stories.source, "default_middle_tier");
  assert.equal(make({ previousAttempts: [{ ...attempt, contentVersion: "old" }], at: "2026-10-02T10:00:00Z" }).startingPoints.reading_stories.source, "default_middle_tier");
});
test("recovery keeps a newer valid server prefix silently and warns only for a divergent device draft", async () => {
  const previous = globalThis.localStorage, values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  try {
    const initial = beginProgressTest(make()), remote = answer(initial);
    const client = { call: async () => ({ data: { ok: true, run: remote, history: [] } }) };
    saveProgressRunLocal(initial);
    const restored = await loadProgressRun({ client, ...initial });
    assert.deepEqual(restored.run, remote); assert.equal(restored.conflict, undefined);
    saveProgressRunLocal({ ...remote, seed: 777 });
    const conflict = await loadProgressRun({ client, ...initial });
    assert.deepEqual(conflict.run, remote); assert.match(conflict.conflict, /did not match/);
  } finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});
