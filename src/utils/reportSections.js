// Pure helpers behind the teacher's individual student report
// (src/components/FinishedReportPage.jsx). Plain data in, plain data out —
// no React, no localStorage, no browser APIs — so tests/unit/reportSections.test.js
// can exercise the report's math directly under node.
//
// Contract highlights (enforced by tests):
// - Percentages are always 0-100 and always use real denominators; a zero
//   denominator yields 0, never NaN or a divide-by-zero.
// - The sounds chart derives its Level 1 / Level 2 totals from the generated
//   item universe (src/data/generated/itemUniverse.generated.js), clamped
//   with Math.max(total, mastered) so the bar can hit exactly 100%.
// - Story Quest star sums count RECORDED stars only; completed quests with
//   no recorded star data are reported as such, never invented as "1 star".

import { getMasteryRule } from "../masterySystem.js";
import { formatItemLabel } from "../data/reportingSystem.js";
import { LEARNING_EVIDENCE_POLICY } from "../policy/learningPolicy.js";

export const SOUND_LEVEL1_ITEM_TYPES = ["initial_sound", "rhyming_family", "short_vowel"];
export const SOUND_LEVEL2_ITEM_TYPES = ["final_sound", "letter_sound", "phonics_pattern", "letter_name"];

export const RETAKE_HINT_TEXT = "Retested today - consider waiting before another retake.";

export const REPORT_STATUS_LEGEND =
  "Secure = current evidence meets the published accuracy and evidence policy. " +
  `Developing = ${LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum}-${LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum - 1}%. ` +
  `Needs support = below ${LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum}%. ` +
  `Not enough evidence = fewer than ${LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses} scored responses, or evidence outside the recency window.`;

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

// ── Sounds chart denominators (real item universe, never constants) ─────────

function sumUniverse(universeCounts = {}, itemTypes = []) {
  return itemTypes.reduce(
    (sum, itemType) => sum + Math.max(0, Math.floor(Number(universeCounts?.[itemType]) || 0)),
    0
  );
}

export function buildSoundsProgress(masteredRows = [], universeCounts = {}) {
  const buildLevel = itemTypes => {
    const mastered = (masteredRows || []).filter(row => itemTypes.includes(row?.itemType)).length;
    // Safety clamp: the universe is derived from the same banks and the same
    // key inference as the mastered rows, but if the two ever disagree the
    // bar must still top out at exactly 100%, never above it.
    const total = Math.max(sumUniverse(universeCounts, itemTypes), mastered);
    return {
      mastered,
      total,
      percent: total ? clampPercent((mastered / total) * 100) : 0
    };
  };

  return {
    level1: buildLevel(SOUND_LEVEL1_ITEM_TYPES),
    level2: buildLevel(SOUND_LEVEL2_ITEM_TYPES)
  };
}

// ── Pass rules (masterySystem is the single source of truth) ────────────────

export function getPassRule(skillLabel = "") {
  const rule = getMasteryRule(skillLabel);
  return {
    passScore: rule.passScore,
    roundLength: rule.roundLength,
    text: `Pass: ${rule.passScore} of ${rule.roundLength}`
  };
}

// ── Same-day retake hint ────────────────────────────────────────────────────

function localDayKey(value) {
  const date = value instanceof Date ? value : new Date(value || "");
  if (!Number.isFinite(date.getTime())) return "";
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function wasRetestedToday(masteryRow = {}, now = new Date()) {
  const stamp = masteryRow?.lastRetakeFailedAt;
  if (!stamp) return false;
  const day = localDayKey(stamp);
  return Boolean(day) && day === localDayKey(now);
}

// ── Per-question checkpoint review ──────────────────────────────────────────

function describeQuestionFallback(record = {}) {
  const target = record.targetWord || record.targetPattern || record.targetSound ||
    record.targetLetter || record.itemKey || "";
  return target ? `Question on "${target}"` : "Question";
}

export function buildAttemptReviewRows(attempt = {}) {
  const records = Array.isArray(attempt.questionRecords) ? attempt.questionRecords : [];
  return records.map((record, index) => ({
    order: Number(record.order) || index + 1,
    prompt: String(record.prompt || "").trim() || describeQuestionFallback(record),
    selectedAnswer: String(record.selectedAnswer ?? "").trim(),
    correctAnswer: String(record.correctAnswer ?? "").trim(),
    isCorrect: Boolean(record.isCorrect),
    targetWord: String(record.targetWord || "").trim()
  }));
}

function rollupTarget(record = {}) {
  if (record.itemType && record.itemKey) {
    return {
      key: `${record.itemType}::${record.itemKey}`,
      label: formatItemLabel(record.itemType, record.itemKey)
    };
  }
  const target = String(
    record.diagnosticTarget || record.targetPattern || record.pattern ||
    record.targetSound || record.targetLetter || ""
  ).trim();
  return target ? { key: target.toLowerCase(), label: target } : null;
}

// Groups an attempt's questions by their diagnostic target (itemType+itemKey
// when present, otherwise the recorded pattern/sound/letter target) so the
// teacher sees rollups like "Missed 3 of 4 Short /i/ items".
export function buildQuestionRollup(questionRecords = []) {
  const groups = new Map();
  (questionRecords || []).forEach(record => {
    const target = rollupTarget(record);
    if (!target) return;
    const group = groups.get(target.key) || {
      key: target.key,
      label: target.label,
      total: 0,
      missed: 0,
      correct: 0
    };
    group.total += 1;
    if (record.isCorrect) group.correct += 1;
    else group.missed += 1;
    groups.set(target.key, group);
  });

  return Array.from(groups.values())
    .map(group => ({
      ...group,
      summary: group.missed
        ? `Missed ${group.missed} of ${group.total} ${group.label} item${group.total === 1 ? "" : "s"}`
        : `All ${group.total} ${group.label} item${group.total === 1 ? "" : "s"} correct`
    }))
    .sort((a, b) => b.missed - a.missed || b.total - a.total || a.label.localeCompare(b.label));
}

// A rollup only earns its space when at least one target was asked twice.
export function shouldShowRollup(rollupRows = []) {
  return (rollupRows || []).some(row => row.total >= 2);
}

// ── Story Quest stars (recorded stars only, no invented numbers) ────────────

export function getStoryQuestStarInfo(row = {}, rawRow = {}) {
  const recorded = Number(rawRow?.stars ?? rawRow?.starCount ?? row?.stars ?? row?.starCount);
  if (Number.isFinite(recorded) && recorded > 0) {
    return { recordedStars: recorded, display: `${recorded} star${recorded === 1 ? "" : "s"}` };
  }
  if (row?.completed) return { recordedStars: null, display: "completed (stars not recorded)" };
  return { recordedStars: null, display: "no stars yet" };
}

export function summarizeStoryQuestStars(rows = [], rawProgress = {}) {
  return (rows || []).reduce((acc, row) => {
    const info = getStoryQuestStarInfo(row, rawProgress?.[row.questId] || {});
    if (info.recordedStars !== null) {
      acc.recordedStars += info.recordedStars;
      acc.questsWithStars += 1;
    } else if (row.completed) {
      acc.completedWithoutStars += 1;
    }
    return acc;
  }, { recordedStars: 0, questsWithStars: 0, completedWithoutStars: 0 });
}

// ── EL assessments: one consistent checks-based numerator/denominator ───────

// getChecks(item) returns the item's boolean checks (e.g. [soundCorrect,
// wordCorrect]), so the numerator (checks correct) and denominator (checks
// asked) always count the same thing.
export function buildElChecksSummary(records = [], getChecks = () => []) {
  const rows = Array.isArray(records) ? records : [];
  let checksCorrect = 0;
  let checksTotal = 0;
  let fullyCorrectCount = 0;

  rows.forEach(item => {
    const checks = (getChecks(item) || []).map(Boolean);
    checksTotal += checks.length;
    const correct = checks.filter(Boolean).length;
    checksCorrect += correct;
    if (checks.length && correct === checks.length) fullyCorrectCount += 1;
  });

  return {
    itemCount: rows.length,
    checksCorrect,
    checksTotal,
    fullyCorrectCount,
    percent: checksTotal ? clampPercent((checksCorrect / checksTotal) * 100) : 0
  };
}

// ── Engagement ──────────────────────────────────────────────────────────────

// True when a buildEngagementRow(...) result carries any real activity; an
// empty scope (fresh device) renders a calm empty state instead. coinsEarned
// is deliberately NOT a signal: hollowEconomy grants a 100-coin welcome gift
// to every scope, so a brand-new student already "earned" 100 coins. Real
// earning always shows up in stars/books/quests/chests, and spending
// (coinsSpent) requires real use.
export function hasEngagementSignal(row = {}) {
  return Boolean(
    Number(row?.missionStreak) > 0 ||
    Number(row?.gamesPlayed) > 0 ||
    Number(row?.gameStars) > 0 ||
    Number(row?.questStars) > 0 ||
    Number(row?.soundSeekerStars) > 0 ||
    Number(row?.storyQuestsCompleted) > 0 ||
    Number(row?.booksRead) > 0 ||
    Number(row?.coinsSpent) > 0 ||
    Number(row?.chestCount) > 0 ||
    row?.lastActiveAt
  );
}

// ── Guided reading rows and summary ─────────────────────────────────────────

export function getGuidedReadingNoteRows(summary = {}) {
  return [
    summary.wholeBookNote ? { label: "Book", note: summary.wholeBookNote } : null,
    ...(summary.pageNotes || []).map(item => ({
      label: `Page ${item.page}`,
      note: item.note
    }))
  ].filter(item => item?.note?.trim());
}

// The guidedReadingBooks module is injected (the component lazy-imports it),
// so this stays pure and node-testable with a stub module.
export function buildGuidedReadingReportRows(records = {}, module = {}) {
  const summariesByBook = new Map(
    (module.summarizeGuidedReadingRecords?.(records) || []).map(summary => [summary.bookId, summary])
  );
  const books = module.guidedReadingBooks || [];

  return Object.entries(records || {})
    .map(([bookId, record = {}]) => {
      const book = books.find(item => item.id === bookId) || {};
      const progress = module.getGuidedReadingProgress?.(book, { ...record, bookId }) || {};
      const summary = summariesByBook.get(bookId) || module.summarizeGuidedReadingRecord?.(record) || {};
      const readCount = Math.max(Number(progress.readCount || record.readCount || 0), progress.completed ? 1 : 0);
      const quizTotal = Number(record.quizTotal);
      const quizScore = Number(record.quizScore);
      const hasQuiz = Number.isFinite(quizScore) && Number.isFinite(quizTotal) && quizTotal > 0;

      return {
        bookId,
        title: book.title || record.title || bookId,
        level: book.level || record.level || progress.level || "",
        lastReadAt: progress.lastReadAt || record.lastReadAt || record.completedAt || record.updatedAt || "",
        readCount,
        completed: Boolean(progress.completed || record.completed || record.completedAt),
        quizScore: hasQuiz ? Math.max(0, quizScore) : null,
        quizTotal: hasQuiz ? quizTotal : null,
        latestAccuracy: Number(summary.accuracy || 0),
        supportWords: summary.supportWords || [],
        correctWords: summary.correctWords || [],
        notes: getGuidedReadingNoteRows(summary),
        pagesRead: Number(progress.completedPages || record.completedPages || 0),
        attempted: Number(summary.attempted || 0)
      };
    })
    .filter(row =>
      row.pagesRead > 0 ||
      row.readCount > 0 ||
      row.attempted > 0 ||
      row.correctWords.length > 0 ||
      row.supportWords.length > 0 ||
      row.notes.length > 0
    )
    .sort((a, b) =>
      String(b.lastReadAt).localeCompare(String(a.lastReadAt)) ||
      a.title.localeCompare(b.title)
    );
}

export function buildGuidedReadingSummary(rows = []) {
  const allRows = Array.isArray(rows) ? rows : [];
  const completedRows = allRows.filter(row => row.completed);
  const byLevelMap = new Map();
  completedRows.forEach(row => {
    const level = row.level || "Unlevelled";
    byLevelMap.set(level, (byLevelMap.get(level) || 0) + 1);
  });
  const byLevel = Array.from(byLevelMap.entries())
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => a.level.localeCompare(b.level));
  const mostRecent = allRows
    .filter(row => row.lastReadAt)
    .sort((a, b) => String(b.lastReadAt).localeCompare(String(a.lastReadAt)))[0] || null;
  const quizRows = allRows
    .filter(row => row.quizScore !== null && row.quizTotal)
    .map(row => ({
      bookId: row.bookId,
      title: row.title,
      level: row.level,
      quizScore: row.quizScore,
      quizTotal: row.quizTotal,
      percent: clampPercent((row.quizScore / row.quizTotal) * 100)
    }));

  return {
    totalCompleted: completedRows.length,
    byLevel,
    mostRecent: mostRecent
      ? { bookId: mostRecent.bookId, title: mostRecent.title, level: mostRecent.level, lastReadAt: mostRecent.lastReadAt }
      : null,
    quizRows
  };
}
