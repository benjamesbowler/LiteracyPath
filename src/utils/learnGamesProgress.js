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
  window.localStorage.setItem(storageKey(progressScopeKey), JSON.stringify({
    ...baseState(),
    ...progress,
    games: progress.games || {}
  }));
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
