import { queueProgressSave } from "./progressSync.js";
import { applyCheckpoint, removeCheckpoint, readCheckpoint } from "./gameCheckpoints.js";

const STORAGE_PREFIX = "literacy-guide-learn-games";
const DEFAULT_SCOPE = "default";

let activeProgressScope = DEFAULT_SCOPE;

function storageKey(progressScopeKey = DEFAULT_SCOPE) {
  return `${STORAGE_PREFIX}:${progressScopeKey || DEFAULT_SCOPE}`;
}

function baseState() {
  return {
    difficulty: "easy",
    soundEnabled: true,
    games: {}
  };
}

export function loadLearnGamesProgress(progressScopeKey = DEFAULT_SCOPE) {
  if (typeof window === "undefined") return baseState();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(progressScopeKey)) || "null");
    return {
      ...baseState(),
      ...(parsed && typeof parsed === "object" ? parsed : {}),
      games: parsed?.games && typeof parsed.games === "object" ? parsed.games : {}
    };
  } catch {
    return baseState();
  }
}

export function saveLearnGamesProgress(progressScopeKey = DEFAULT_SCOPE, progress = baseState()) {
  if (typeof window === "undefined") return;
  const next = {
    ...baseState(),
    ...progress,
    games: progress.games || {}
  };
  window.localStorage.setItem(storageKey(progressScopeKey), JSON.stringify(next));
  queueProgressSave("learn_games", "__all__", { v: 1, ...next }, { scopeKey: progressScopeKey });
}

export function saveLearnGamesSettings(progressScopeKey = DEFAULT_SCOPE, settings = {}) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const next = { ...current, ...settings, games: current.games };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

export function getLearnGameProgress(progress, gameId) {
  return progress?.games?.[gameId] || {
    stars: 0,
    highScore: 0,
    wordsCompleted: 0,
    plays: 0
  };
}

export function getLearnGameBestSplit(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty, levelIndex) {
  const progress = loadLearnGamesProgress(progressScopeKey);
  const splits = progress?.games?.[gameId]?.bestSplits?.[String(difficulty || "")];
  const value = splits?.[String(levelIndex)];
  return value && typeof value === "object" ? value : null;
}

export function saveLearnGameBestSplit(
  progressScopeKey = DEFAULT_SCOPE,
  gameId,
  difficulty,
  levelIndex,
  split = {}
) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const previous = getLearnGameProgress(current, gameId);
  const difficultyKey = String(difficulty || "");
  const levelKey = String(levelIndex);
  const existing = previous.bestSplits?.[difficultyKey]?.[levelKey] || {};
  const next = {
    ...current,
    games: {
      ...current.games,
      [gameId]: {
        ...previous,
        bestSplits: {
          ...(previous.bestSplits || {}),
          [difficultyKey]: {
            ...(previous.bestSplits?.[difficultyKey] || {}),
            [levelKey]: { ...existing, ...split }
          }
        }
      }
    }
  };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

export function saveLearnGameResult(progressScopeKey = DEFAULT_SCOPE, gameId, stars = 0, score = 0, wordsCompleted = 0) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const previous = getLearnGameProgress(current, gameId);
  const nextGame = {
    ...previous,
    stars: Math.max(previous.stars || 0, stars || 0),
    highScore: Math.max(previous.highScore || 0, score || 0),
    wordsCompleted: Math.max(previous.wordsCompleted || 0, wordsCompleted || 0),
    plays: (previous.plays || 0) + 1,
    lastPlayedAt: new Date().toISOString()
  };
  const next = {
    ...current,
    games: {
      ...current.games,
      [gameId]: nextGame
    }
  };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

// --- Resume checkpoints: remember which ladder level a child reached, per game
// AND difficulty, so a long 5-round / 10-stage session can be picked back up. ---
export function loadGameCheckpoint(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty) {
  return readCheckpoint(loadLearnGamesProgress(progressScopeKey).games, gameId, difficulty);
}

export function saveGameCheckpoint(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty, level = 0, totalLevels = 0) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const next = { ...current, games: applyCheckpoint(current.games, gameId, difficulty, level, totalLevels) };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

export function clearGameCheckpoint(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const games = removeCheckpoint(current.games, gameId, difficulty);
  if (games === current.games) return current;
  const next = { ...current, games };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

export function setActiveLearnGamesProgressScope(progressScopeKey = DEFAULT_SCOPE) {
  activeProgressScope = progressScopeKey || DEFAULT_SCOPE;
}

export function clearActiveLearnGamesProgressScope() {
  activeProgressScope = DEFAULT_SCOPE;
}

export function saveProgress(gameId, stars = 0, score = 0, wordsCompleted = 0) {
  return saveLearnGameResult(activeProgressScope, gameId, stars, score, wordsCompleted);
}

export function loadProgress(gameId) {
  return getLearnGameProgress(loadLearnGamesProgress(activeProgressScope), gameId);
}
