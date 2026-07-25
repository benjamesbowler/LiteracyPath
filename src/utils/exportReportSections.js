// Shared row-building helpers for the teacher-facing Excel exports.
//
// Everything row-shaped in here is pure (plain data in, plain rows out) so
// node:test can exercise it directly (tests/unit/exportShapes.test.js). The
// only browser-touching code is the localStorage fallback collectors, and
// those are guarded so importing this module under node stays safe.
//
// Terminology contract: the child currency is COINS and the brand is
// "Literacy Guide"; older wordings must not appear in any exported label
// (tests/unit/exportShapes.test.js enforces this).

import { computeTreasuryFromAreas } from "./treasureTrail.js";
import { earnedCoins } from "./hollowEconomy.js";
import { localProgressStorageKey } from "./progressKeys.js";

export const REPORT_INFO_SHEET_NAME = "Report summary";
export const STORY_QUEST_SHEET_NAME = "Story Quests";
export const ENGAGEMENT_SHEET_NAME = "Engagement";

export const STORY_QUEST_HEADERS = [
  "Child Name",
  "Quest Title",
  "Level",
  "Series",
  "Status",
  "Stars",
  "Words Found",
  "Words Found Count",
  "Target Word Count",
  "Pages Visited",
  "Completed Date",
  "Last Activity Date"
];

export const ENGAGEMENT_HEADERS = [
  "Child Name",
  "Class Name",
  "Daily Mission Streak",
  "Last Mission Completed",
  "Games Played",
  "Game Stars",
  "Quest Stars",
  "Sound Seekers Stars",
  "Story Quests Completed",
  "Books Read",
  "Coins Earned",
  "Coins Spent",
  "Coins Balance",
  "Daily Chests",
  "Last Active Date"
];

// ── Timestamps ───────────────────────────────────────────────────────────────

export function formatExportDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

// Local date and time ("YYYY-MM-DD HH:MM") so the header reads in the
// teacher's own timezone, unlike the date-only cells which stay ISO/UTC.
export function formatExportDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ── Report context header ────────────────────────────────────────────────────

// Field/value rows for a "Report Info" sheet or summary header. Only rows
// with a value are emitted, but "Generated At" is always present.
export function buildReportContextRows({
  reportTitle = "",
  generatedAt = new Date(),
  studentName = "",
  className = "",
  classNames = [],
  studentCount = null,
  extraRows = []
} = {}) {
  const rows = [];
  if (reportTitle) rows.push({ field: "Report", value: reportTitle });
  rows.push({ field: "Generated At", value: formatExportDateTime(generatedAt) || formatExportDateTime(new Date()) });
  if (studentName) rows.push({ field: "Child", value: studentName });
  if (className) rows.push({ field: "Class", value: className });
  const classList = (classNames || []).filter(Boolean);
  if (classList.length) rows.push({ field: "Classes Covered", value: classList.join(", ") });
  if (Number.isFinite(Number(studentCount)) && studentCount !== null) {
    rows.push({ field: "Children covered", value: Number(studentCount) });
  }
  (extraRows || []).forEach(row => {
    if (row && row.field) rows.push({ field: row.field, value: row.value ?? "" });
  });
  return rows;
}

// ── Comparison gating ────────────────────────────────────────────────────────

// A comparison section is only meaningful when a previous snapshot really
// exists; the report store returns a placeholder comparison otherwise.
export function hasPreviousComparison(comparison = {}) {
  return Boolean(comparison && (comparison.previousReportId || comparison.previousGeneratedAt));
}

// ── Story Quests ─────────────────────────────────────────────────────────────

// progress shape (see src/utils/storyQuestProgress.js): a map of questId to
// { completed, completedAt, updatedAt, wordsFound, wordsFoundCount,
//   targetWordCount, visitedPageCount, lastPageId }.
export function buildStoryQuestRows({ studentName = "", studentId = "", progress = {}, quests = [] } = {}) {
  const questById = new Map((quests || []).map(quest => [quest.id, quest]));
  return Object.entries(progress || {})
    .map(([questId, row = {}]) => {
      const quest = questById.get(questId) || {};
      const completed = Boolean(row.completed);
      const words = Array.isArray(row.wordsFound) && row.wordsFound.length
        ? row.wordsFound.filter(Boolean)
        : Array.isArray(row.wordsEncountered)
          ? row.wordsEncountered.filter(Boolean)
          : [];
      const wordCount = Number.isFinite(Number(row.wordsFoundCount)) ? Number(row.wordsFoundCount) : words.length;
      // Match the report page: never invent stars. A completed quest with no
      // recorded star count exports as blank, not a made-up 1.
      const recordedStars = Number(row.stars ?? row.starCount ?? 0);
      const stars = recordedStars > 0 ? recordedStars : null;
      return {
        studentName,
        studentId,
        questId,
        title: quest.title || row.title || questId,
        level: quest.level || row.level || "",
        series: quest.series || row.series || "",
        status: completed ? "Completed" : "In progress",
        completed,
        stars,
        words,
        wordCount,
        targetWordCount: Number.isFinite(Number(row.targetWordCount))
          ? Number(row.targetWordCount)
          : Array.isArray(quest.targetWords) ? quest.targetWords.length : 0,
        visitedPageCount: Number.isFinite(Number(row.visitedPageCount)) ? Number(row.visitedPageCount) : 0,
        completedAt: row.completedAt || "",
        lastActivityAt: row.updatedAt || row.completedAt || ""
      };
    })
    .filter(row => row.completed || row.lastActivityAt || row.wordCount > 0 || row.visitedPageCount > 0)
    .sort((a, b) =>
      String(a.studentName).localeCompare(String(b.studentName)) ||
      String(b.lastActivityAt || "").localeCompare(String(a.lastActivityAt || ""))
    );
}

export function storyQuestRowToCells(row = {}) {
  return {
    "Child Name": row.studentName || "",
    "Quest Title": row.title || "",
    "Level": row.level || "",
    "Series": row.series || "",
    "Status": row.status || "",
    "Stars": row.stars == null ? "" : Number(row.stars) || 0,
    "Words Found": (row.words || []).join(", "),
    "Words Found Count": Number(row.wordCount) || 0,
    "Target Word Count": Number(row.targetWordCount) || 0,
    "Pages Visited": Number(row.visitedPageCount) || 0,
    "Completed Date": formatExportDate(row.completedAt),
    "Last Activity Date": formatExportDate(row.lastActivityAt)
  };
}

export function emptyStoryQuestCells(message = "No Story Quest records yet") {
  return {
    "Child Name": message,
    "Quest Title": "",
    "Level": "",
    "Series": "",
    "Status": "Not started",
    "Stars": 0,
    "Words Found": "",
    "Words Found Count": 0,
    "Target Word Count": 0,
    "Pages Visited": 0,
    "Completed Date": "",
    "Last Activity Date": ""
  };
}

// ── Engagement ───────────────────────────────────────────────────────────────

// areas: the per-student progress areas the app already stores and syncs
// (see src/utils/progressKeys.js): { mission, games, quest, stories, reading, hollow }.
export function buildEngagementRow({ studentName = "", studentId = "", className = "", areas = {} } = {}) {
  const mission = areas.mission && typeof areas.mission === "object" ? areas.mission : {};
  const treasury = computeTreasuryFromAreas({
    quest: areas.quest,
    games: areas.games,
    soundSeekers: areas.soundSeekers,
    stories: areas.stories,
    reading: areas.reading
  });
  const hollow = areas.hollow && typeof areas.hollow === "object" ? areas.hollow : {};
  const chests = Array.isArray(hollow.chests) ? hollow.chests : [];
  const purchases = Array.isArray(hollow.purchases) ? hollow.purchases : [];
  const coinsEarned = earnedCoins(treasury.breakdown, chests.length);
  const coinsSpent = purchases.reduce((total, purchase) => total + Math.max(0, Number(purchase?.cost) || 0), 0);

  const gameRows = Object.values(areas.games?.games || {}).filter(game => game && typeof game === "object");
  const gamesPlayed = gameRows.reduce((total, game) => total + (Number(game.plays) || 0), 0);
  const lastGamePlayedAt = gameRows.map(game => game.lastPlayedAt).filter(Boolean).sort().at(-1) || "";
  const storyRows = Object.values(areas.stories || {}).filter(row => row && typeof row === "object");
  const lastStoryActivityAt = storyRows.map(row => row.updatedAt || row.completedAt).filter(Boolean).sort().at(-1) || "";
  const readingRows = Object.values(areas.reading || {}).filter(row => row && typeof row === "object");
  const lastReadAt = readingRows.map(row => row.lastReadAt || row.completedAt || row.updatedAt).filter(Boolean).sort().at(-1) || "";
  // Day keys ("YYYY-MM-DD") and ISO datetimes compare correctly as strings.
  const soundSeekersLastActiveAt = areas.soundSeekers?.telemetry?.sessions
    ?.map(session => session?.endedAt || session?.lastActiveAt)
    .filter(Boolean)
    .sort()
    .at(-1) || "";
  const lastActiveAt = [lastGamePlayedAt, lastStoryActivityAt, lastReadAt, soundSeekersLastActiveAt, mission.lastCompletedDay || ""]
    .filter(Boolean)
    .sort()
    .at(-1) || "";

  return {
    studentName,
    studentId,
    className,
    missionStreak: Number(mission.streak) || 0,
    lastMissionCompletedDay: mission.lastCompletedDay || "",
    gamesPlayed,
    gameStars: treasury.breakdown.gameStars,
    questStars: treasury.breakdown.questStars,
    soundSeekerStars: treasury.breakdown.soundSeekerStars,
    storyQuestsCompleted: treasury.breakdown.storiesDone,
    booksRead: treasury.breakdown.booksRead,
    coinsEarned,
    coinsSpent,
    coinsBalance: Math.max(0, coinsEarned - coinsSpent),
    chestCount: chests.length,
    lastActiveAt
  };
}

export function engagementRowToCells(row = {}) {
  return {
    "Child Name": row.studentName || "",
    "Class Name": row.className || "",
    "Daily Mission Streak": Number(row.missionStreak) || 0,
    "Last Mission Completed": formatExportDate(row.lastMissionCompletedDay),
    "Games Played": Number(row.gamesPlayed) || 0,
    "Game Stars": Number(row.gameStars) || 0,
    "Quest Stars": Number(row.questStars) || 0,
    "Sound Seekers Stars": Number(row.soundSeekerStars) || 0,
    "Story Quests Completed": Number(row.storyQuestsCompleted) || 0,
    "Books Read": Number(row.booksRead) || 0,
    "Coins Earned": Number(row.coinsEarned) || 0,
    "Coins Spent": Number(row.coinsSpent) || 0,
    "Coins Balance": Number(row.coinsBalance) || 0,
    "Daily Chests": Number(row.chestCount) || 0,
    "Last Active Date": formatExportDate(row.lastActiveAt)
  };
}

export function emptyEngagementCells(message = "No engagement records yet") {
  return {
    "Child Name": message,
    "Class Name": "",
    "Daily Mission Streak": 0,
    "Last Mission Completed": "",
    "Games Played": 0,
    "Game Stars": 0,
    "Quest Stars": 0,
    "Sound Seekers Stars": 0,
    "Story Quests Completed": 0,
    "Books Read": 0,
    "Coins Earned": 0,
    "Coins Spent": 0,
    "Coins Balance": 0,
    "Daily Chests": 0,
    "Last Active Date": ""
  };
}

// ── Collectors (browser localStorage fallback, override-friendly) ────────────

// The student side scopes every progress area by studentId (falling back to
// the student name), matching App.jsx's progressScopeKey.
export function studentProgressScopeKey(student = {}) {
  return student.id || student.name || "default";
}

function readLocalArea(area, scopeKey) {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(localProgressStorageKey(area, scopeKey)) || "null");
  } catch {
    return null;
  }
}

function byStudentLookup(source) {
  if (!source) return () => null;
  if (typeof source.get === "function") return id => (id ? source.get(id) || null : null);
  if (typeof source === "object") return id => (id ? source[id] || null : null);
  return () => null;
}

function uniqueStudents(students = []) {
  const seen = new Set();
  return (students || []).filter(student => {
    const key = student?.id || student?.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveClassName(student = {}, classes = []) {
  if (student.className) return student.className;
  const classId = student.classId || student.class_id || "";
  return (classes || []).find(row => row.id === classId)?.name || "Unknown Class";
}

// override wins; otherwise read this browser's localStorage for the student.
export function collectStudentEngagementAreas(student = {}, override = null) {
  if (override && typeof override === "object") return override;
  const scope = studentProgressScopeKey(student);
  return {
    mission: readLocalArea("daily_mission", scope),
    games: readLocalArea("learn_games", scope),
    quest: readLocalArea("el_quest", scope),
    soundSeekers: readLocalArea("phonics_quest", scope),
    stories: readLocalArea("story_quests", scope),
    reading: readLocalArea("guided_reading", scope),
    hollow: readLocalArea("hollow", scope)
  };
}

export function collectStoryQuestProgressForStudent(student = {}, override = null) {
  if (override && typeof override === "object") return override;
  return readLocalArea("story_quests", studentProgressScopeKey(student)) || {};
}

export function buildEngagementRows({ students = [], classes = [], engagementByStudent = null } = {}) {
  const lookup = byStudentLookup(engagementByStudent);
  return uniqueStudents(students)
    .map(student => buildEngagementRow({
      studentName: student.name || "Unknown child",
      studentId: student.id || "",
      className: resolveClassName(student, classes),
      areas: collectStudentEngagementAreas(student, lookup(student.id))
    }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export function collectStoryQuestRowsForStudents({ students = [], storyQuestProgressByStudent = null, quests = [] } = {}) {
  const lookup = byStudentLookup(storyQuestProgressByStudent);
  return uniqueStudents(students).flatMap(student => buildStoryQuestRows({
    studentName: student.name || "Unknown child",
    studentId: student.id || "",
    progress: collectStoryQuestProgressForStudent(student, lookup(student.id)),
    quests
  }));
}
