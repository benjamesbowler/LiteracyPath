// The Daily Mission: one quest station, one book, one game per school day,
// chosen from the student's own progress. Completing all three advances a
// streak. Streaks are kind: weekends never break them, and one missed
// school day per week is auto-covered by a "streak shield".
import { queueProgressSave, logStudentActivity } from "./progressSync.js";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";
import { GUIDED_READING_BOOK_INDEX } from "../data/generated/guidedReadingBookIndex.generated.js";
import { GAME_LIST } from "../data/learnGamesData.js";

const MISSION_KINDS = ["quest", "book", "game"];

function storageKey(scope) {
  return `lp-daily-mission:${scope || "default"}`;
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function previousSchoolDay(dayKey) {
  const date = new Date(`${dayKey}T12:00:00`);
  do {
    date.setDate(date.getDate() - 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  return todayKey(date);
}

function isoWeekKey(dayKey) {
  const date = new Date(`${dayKey}T12:00:00`);
  const jan = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil((((date - jan) / 86400000) + jan.getDay() + 1) / 7);
  return `${date.getFullYear()}-w${week}`;
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000000007;
  }
  return Math.abs(hash);
}

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadMissionState(scope) {
  const state = readJson(storageKey(scope), null);
  const base = { streak: 0, lastCompletedDay: "", shieldWeek: "", day: "", done: {}, celebratedDay: "" };
  if (!state || typeof state !== "object") return base;
  const merged = { ...base, ...state };
  // New day: reset the per-day checklist but keep streak metadata.
  if (merged.day !== todayKey()) {
    merged.day = todayKey();
    merged.done = {};
  }
  return merged;
}

function persist(scope, state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(scope), JSON.stringify(state));
  } catch {
    // Best effort - cloud sync still queues below.
  }
  queueProgressSave("daily_mission", "__all__", { v: 1, ...state }, { scopeKey: scope });
}

export function markMissionDone(scope, kind) {
  if (!MISSION_KINDS.includes(kind)) return null;
  const state = loadMissionState(scope);
  if (state.done[kind]) return state;
  state.done = { ...state.done, [kind]: true };

  const today = todayKey();
  const complete = MISSION_KINDS.every(item => state.done[item]);
  if (complete && state.lastCompletedDay !== today) {
    const previous = state.lastCompletedDay;
    if (previous === previousSchoolDay(today)) {
      state.streak += 1;
    } else if (
      previous &&
      previous === previousSchoolDay(previousSchoolDay(today)) &&
      state.shieldWeek !== isoWeekKey(today)
    ) {
      // One missed school day this week - the shield covers it.
      state.shieldWeek = isoWeekKey(today);
      state.streak += 1;
    } else {
      state.streak = 1;
    }
    state.lastCompletedDay = today;
  }

  persist(scope, state);
  return state;
}

/* Marks a mission item done and, if it was NEWLY completed, tells the app
   (after a beat, so stars/celebrations can land) to return the child to
   the mission screen. App.jsx listens for this event in student mode. */
export function notifyMissionTaskDone(scope, kind) {
  const before = loadMissionState(scope);
  if (before.done?.[kind]) return false;
  const after = markMissionDone(scope, kind);
  // Engagement logging (fire-and-forget): one event per newly-finished task,
  // plus a mission_complete event carrying the streak when all three are done.
  logStudentActivity("mission", kind, "task_done");
  if (after && MISSION_KINDS.every(item => after.done?.[item])) {
    logStudentActivity("mission", "all", "mission_complete", { streak: after.streak });
  }
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("lp-mission-task-done", { detail: { kind } }));
    }, 1600);
  }
  return true;
}

export function markMissionCelebrated(scope) {
  const state = loadMissionState(scope);
  state.celebratedDay = todayKey();
  persist(scope, state);
  return state;
}

export function getMissionStatus(scope) {
  const state = loadMissionState(scope);
  const doneCount = MISSION_KINDS.filter(kind => state.done[kind]).length;
  return {
    ...state,
    doneCount,
    missionComplete: doneCount === MISSION_KINDS.length,
    needsCelebration: doneCount === MISSION_KINDS.length && state.celebratedDay !== todayKey()
  };
}

// ── Today's tiles, picked from the student's own data ──────────────────────

function currentQuestCycle(scope) {
  const quest = readJson(`lp-el-quest:${scope}`, { cycles: {} });
  const playable = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
  return playable.find(cycle => !(quest.cycles?.[cycle.id]?.stars > 0)) || playable[0];
}

function nextBook(scope) {
  const records = readJson(`literacyPath.guidedReadingRecords.${encodeURIComponent(scope)}`, {});
  const ordered = [...GUIDED_READING_BOOK_INDEX].sort((a, b) =>
    String(a.level).localeCompare(String(b.level)) || String(a.id).localeCompare(String(b.id))
  );
  const unread = ordered.filter(book => !records[book.id]?.completed);
  const pool = unread.length ? unread : ordered;
  // Stay at the child's working level: the lowest level that still has
  // unread books. Never hand a Level A reader a Level C book.
  const workingLevel = pool[0]?.level;
  const levelPool = pool.filter(book => book.level === workingLevel);
  const finalPool = levelPool.length ? levelPool : pool;
  return finalPool[hashString(todayKey() + scope) % finalPool.length];
}

function todaysGame(scope, cycle) {
  const games = readJson(`literacy-guide-learn-games:${scope}`, { games: {} });
  // Daily Challenge uses the practice (worksheet-style) games; the arcade-tier
  // games live in the Arcade. Arcade games are tagged with surfaces:["arcade"].
  const dailyGames = GAME_LIST.filter(game => !(game.surfaces || []).includes("arcade"));
  const unstarred = dailyGames.filter(game => (games.games?.[game.id]?.stars || 0) < 3);
  const pool = unstarred.length ? unstarred : dailyGames;
  const game = pool[hashString(todayKey() + scope + "game") % pool.length];
  const letters = (cycle?.focusLetters || []).map(item => item.grapheme).join(" and ");
  return { game, why: letters ? `Practise your ${letters} sounds while you play.` : "A fresh game for today." };
}

export function buildDailyMission(scope) {
  const cycle = currentQuestCycle(scope) || {};
  const book = nextBook(scope);
  const gamePick = todaysGame(scope, cycle) || {};
  const game = gamePick.game || {};

  return {
    quest: {
      title: cycle.cycleNumber ? `Cycle ${cycle.cycleNumber}` : "Your next station",
      detail: (cycle.focusLetters || []).map(item => item.grapheme).join(" ") || "Review",
      why: cycle.childFriendlyGoal || "Play your next station."
    },
    book: {
      title: book?.title || "Pick a book",
      detail: book ? `Level ${book.level}` : "",
      why: book ? `A Level ${book.level} book picked for you today.` : "Choose any book you like.",
      bookId: book?.id || ""
    },
    game: {
      title: game.title || "Play a game",
      detail: game.skill || "",
      why: gamePick.why || "A fresh game for today.",
      gameId: game.id || ""
    }
  };
}
