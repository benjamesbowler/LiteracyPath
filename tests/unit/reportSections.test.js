// Contracts for the student report's pure helpers (src/utils/reportSections.js):
// pass rules read from masterySystem with a default fallback, same-day retake
// detection, per-question rollups, Story Quest star sums that never invent
// stars, checks-based EL totals, engagement empty states, and guided-reading
// summary rows (books by level, quiz scores, most recent book).
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAttemptReviewRows,
  buildElChecksSummary,
  buildGuidedReadingReportRows,
  buildGuidedReadingSummary,
  buildQuestionRollup,
  buildSoundsProgress,
  getPassRule,
  getStoryQuestStarInfo,
  hasEngagementSignal,
  shouldShowRollup,
  summarizeStoryQuestStars,
  wasRetestedToday
} from "../../src/utils/reportSections.js";
import { buildEngagementRow } from "../../src/utils/exportReportSections.js";

// ── Pass rules ───────────────────────────────────────────────────────────────

test("getPassRule reads the tuned rule for configured skills", () => {
  const rule = getPassRule("Initial Sounds");
  assert.equal(rule.passScore, 7);
  assert.equal(rule.roundLength, 10);
  assert.equal(rule.text, "Pass: 7 of 10");
});

test("getPassRule falls back to the default rule for unlisted skills", () => {
  const rule = getPassRule("Completely Unlisted Skill");
  assert.equal(rule.roundLength, 10);
  assert.equal(rule.passScore, 7); // ceil(10 * 0.7)
  assert.equal(rule.text, "Pass: 7 of 10");
});

// ── Same-day retake hint ─────────────────────────────────────────────────────

test("wasRetestedToday is true only for a failure stamped on the same local day", () => {
  const now = new Date();
  assert.equal(wasRetestedToday({ lastRetakeFailedAt: now.toISOString() }, now), true);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  assert.equal(wasRetestedToday({ lastRetakeFailedAt: yesterday.toISOString() }, now), false);
  assert.equal(wasRetestedToday({}, now), false);
  assert.equal(wasRetestedToday({ lastRetakeFailedAt: "not-a-date" }, now), false);
});

// ── Sounds chart (empty state never divides by zero) ─────────────────────────

test("buildSoundsProgress with no data and no universe yields calm zeros", () => {
  const progress = buildSoundsProgress([], {});
  assert.deepEqual(progress.level1, { mastered: 0, total: 0, percent: 0 });
  assert.deepEqual(progress.level2, { mastered: 0, total: 0, percent: 0 });
});

// ── Per-question review + rollup ─────────────────────────────────────────────

test("buildAttemptReviewRows normalizes prompts, answers, and order", () => {
  const rows = buildAttemptReviewRows({
    questionRecords: [
      { prompt: "Which word starts with /m/?", selectedAnswer: "sun", correctAnswer: "moon", isCorrect: false, order: 1 },
      { targetWord: "cat", correctAnswer: "cat", selectedAnswer: "cat", isCorrect: true }
    ]
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].prompt, "Which word starts with /m/?");
  assert.equal(rows[0].isCorrect, false);
  assert.equal(rows[0].selectedAnswer, "sun");
  assert.equal(rows[0].correctAnswer, "moon");
  assert.equal(rows[1].order, 2);
  assert.equal(rows[1].prompt.includes("cat"), true); // fallback description
});

test("buildQuestionRollup groups by diagnostic target and reports misses", () => {
  const records = [
    { itemType: "short_vowel", itemKey: "short_i", isCorrect: false },
    { itemType: "short_vowel", itemKey: "short_i", isCorrect: false },
    { itemType: "short_vowel", itemKey: "short_i", isCorrect: false },
    { itemType: "short_vowel", itemKey: "short_i", isCorrect: true },
    { itemType: "short_vowel", itemKey: "short_a", isCorrect: true }
  ];
  const rollup = buildQuestionRollup(records);
  assert.equal(rollup.length, 2);
  assert.equal(rollup[0].summary.startsWith("Missed 3 of 4"), true);
  assert.equal(rollup[0].missed, 3);
  assert.equal(rollup[0].total, 4);
  assert.equal(shouldShowRollup(rollup), true);
});

test("rollup stays hidden when no target was asked more than once", () => {
  const rollup = buildQuestionRollup([
    { targetPattern: "sh", isCorrect: true },
    { targetPattern: "ch", isCorrect: false }
  ]);
  assert.equal(shouldShowRollup(rollup), false);
});

test("questions without any target are excluded from the rollup", () => {
  assert.deepEqual(buildQuestionRollup([{ prompt: "?", isCorrect: true }]), []);
});

// ── Story Quest stars: recorded only, nothing invented ───────────────────────

test("completed quests without recorded stars are labelled, not given 1 star", () => {
  const info = getStoryQuestStarInfo({ completed: true }, {});
  assert.equal(info.recordedStars, null);
  assert.equal(info.display, "completed (stars not recorded)");
});

test("recorded stars are displayed and counted", () => {
  const info = getStoryQuestStarInfo({ completed: true }, { stars: 3 });
  assert.equal(info.recordedStars, 3);
  assert.equal(info.display, "3 stars");
});

test("star sums exclude completed quests with no recorded stars", () => {
  const rows = [
    { questId: "q1", completed: true },
    { questId: "q2", completed: true },
    { questId: "q3", completed: false }
  ];
  const totals = summarizeStoryQuestStars(rows, { q2: { stars: 2 } });
  assert.equal(totals.recordedStars, 2);
  assert.equal(totals.questsWithStars, 1);
  assert.equal(totals.completedWithoutStars, 1);
});

// ── EL checks-based totals ───────────────────────────────────────────────────

test("EL pattern totals count checks in both numerator and denominator", () => {
  const summary = buildElChecksSummary(
    [
      { pattern: "sh", soundCorrect: true, wordCorrect: false },
      { pattern: "ch", soundCorrect: true, wordCorrect: false }
    ],
    item => [item.soundCorrect, item.wordCorrect]
  );
  assert.equal(summary.checksCorrect, 2);
  assert.equal(summary.checksTotal, 4);
  assert.equal(summary.percent, 50);
  assert.equal(summary.fullyCorrectCount, 0);
});

test("EL checks summary is calm on empty input", () => {
  const summary = buildElChecksSummary([], item => [item.soundCorrect]);
  assert.equal(summary.percent, 0);
  assert.equal(summary.checksTotal, 0);
});

// ── Engagement ───────────────────────────────────────────────────────────────

test("engagement row builder handles an empty scope without throwing", () => {
  const row = buildEngagementRow({ studentName: "Test Student", areas: {} });
  assert.equal(row.missionStreak, 0);
  assert.equal(row.gamesPlayed, 0);
  // hollowEconomy grants a 100-coin welcome gift to every scope; that alone
  // must not read as engagement activity.
  assert.equal(row.coinsEarned, 100);
  assert.equal(row.lastActiveAt, "");
  assert.equal(hasEngagementSignal(row), false);
});

test("hasEngagementSignal turns on with any real activity", () => {
  assert.equal(hasEngagementSignal({}), false);
  assert.equal(hasEngagementSignal({ missionStreak: 1 }), true);
  assert.equal(hasEngagementSignal({ lastActiveAt: "2026-07-01" }), true);
});

// ── Guided reading rows + summary ────────────────────────────────────────────

const STUB_GUIDED_READING_MODULE = {
  guidedReadingBooks: [
    { id: "b1", title: "The Red Hen", level: "A", pages: [{}, {}, {}] },
    { id: "b2", title: "Fox and Frog", level: "B", pages: [{}, {}] }
  ],
  getGuidedReadingProgress: (book, record) => ({
    completed: Boolean(record.completed || record.completedAt),
    readCount: Number(record.readCount || 0),
    lastReadAt: record.lastReadAt || record.completedAt || "",
    completedPages: Number(record.completedPages || 0),
    level: book.level || ""
  }),
  summarizeGuidedReadingRecord: () => ({})
};

test("guided reading rows carry completion and quiz scores from the record", () => {
  const rows = buildGuidedReadingReportRows({
    b1: { completed: true, completedAt: "2026-07-01T10:00:00Z", readCount: 2, completedPages: 3, quizScore: 4, quizTotal: 5, lastReadAt: "2026-07-02T10:00:00Z" },
    b2: { readCount: 1, completedPages: 1, lastReadAt: "2026-06-20T10:00:00Z" }
  }, STUB_GUIDED_READING_MODULE);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].bookId, "b1"); // most recent first
  assert.equal(rows[0].completed, true);
  assert.equal(rows[0].quizScore, 4);
  assert.equal(rows[0].quizTotal, 5);
  assert.equal(rows[1].quizScore, null);
});

test("guided reading summary counts completed books by level and finds the latest book", () => {
  const rows = buildGuidedReadingReportRows({
    b1: { completed: true, completedAt: "2026-07-01T10:00:00Z", readCount: 1, completedPages: 3, quizScore: 4, quizTotal: 5, lastReadAt: "2026-07-02T10:00:00Z" },
    b2: { readCount: 1, completedPages: 1, lastReadAt: "2026-06-20T10:00:00Z" }
  }, STUB_GUIDED_READING_MODULE);
  const summary = buildGuidedReadingSummary(rows);

  assert.equal(summary.totalCompleted, 1);
  assert.deepEqual(summary.byLevel, [{ level: "A", count: 1 }]);
  assert.equal(summary.mostRecent.title, "The Red Hen");
  assert.equal(summary.quizRows.length, 1);
  assert.equal(summary.quizRows[0].percent, 80);
});

test("guided reading summary is calm on empty rows", () => {
  const summary = buildGuidedReadingSummary([]);
  assert.equal(summary.totalCompleted, 0);
  assert.deepEqual(summary.byLevel, []);
  assert.equal(summary.mostRecent, null);
  assert.deepEqual(summary.quizRows, []);
});
