import { finishArcadeChapter, validArcadeChapter } from "./arcadeJourneys.js";
import { queueProgressSave } from "./progressSync.js";
import { applyCheckpoint, removeCheckpoint, readCheckpoint } from "./gameCheckpoints.js";
import { normalizeAudioPreferences } from "./audio/audioPreferences.js";
import { mergePracticeProgressRecords } from "./practiceCompletionRecords.js";
import { sanitizeCloudProgressPayload } from "./progressMerge.js";
import { DRUM_TRAIL_CONTENT_VERSION, LANTERN_LAGOON_VERSION, TOWER_TUMBLE_CONTENT_VERSION, RALLY_PALS_CONTENT_VERSION, BURROW_BUILDERS_CONTENT_VERSION, SOUND_BEAT_CONTENT_VERSION, LETTER_LEAP_CONTENT_VERSION, SOUND_RACER_CONTENT_VERSION, SPELL_SKATE_CONTENT_VERSION } from "../data/arcadeContentVersions.js";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";

function authoredCompletionContext(gameId, evidence, chapter) {
  const physicalVersion = { "tower-tumble": TOWER_TUMBLE_CONTENT_VERSION, "rally-pals": RALLY_PALS_CONTENT_VERSION, "burrow-builders": BURROW_BUILDERS_CONTENT_VERSION }[gameId];
  const upgraded = {
    "sound-beat": { version: SOUND_BEAT_CONTENT_VERSION, construct: "recorded-unit-rhythmic-segmentation" },
    "letter-leap": { version: LETTER_LEAP_CONTENT_VERSION, construct: "heard-word-grapheme-encoding" },
    "sound-racer": { version: SOUND_RACER_CONTENT_VERSION, construct: "grapheme-phoneme-onset-recognition" },
    "grammar-grind": { version: SPELL_SKATE_CONTENT_VERSION, construct: "picture-audio-ordered-grapheme-encoding" }
  }[gameId];
  const version = gameId === "drum-trail" ? DRUM_TRAIL_CONTENT_VERSION
    : gameId === "lantern-lagoon" ? LANTERN_LAGOON_VERSION
      : upgraded?.version || physicalVersion || null;
  if (!version || (evidence?.contentVersion || evidence?.version) !== version
    || !Number.isSafeInteger(evidence.sessionSeed) || evidence.sessionSeed < 0
    || !validArcadeChapter(chapter) || evidence.journeyIndex !== chapter) return null;
  const context = { sessionSeed: evidence.sessionSeed, journeyIndex: chapter, formalAssessment: false, masteryClaim: false };
  if (upgraded) {
    if (evidence.construct !== upgraded.construct || evidence.practiceOnly !== true) return null;
    return { contentVersion: version, practiceContext: { ...context,
      construct: upgraded.construct, motorCreatesEvidence: false } };
  }
  if (physicalVersion) return { contentVersion: version, practiceContext: { ...context,
    construct: { "tower-tumble": "heard-word-grapheme-encoding", "rally-pals": "phoneme-grapheme-and-spoken-rime-shot-intent", "burrow-builders": "picture-audio-encoding-and-spatial-reading" }[gameId],
    motorCreatesEvidence: false } };
  if (gameId === "drum-trail") return { contentVersion: version, practiceContext: { ...context, construct: "oral-whole-word-syllable-count" } };
  if (!["reading", "listening", "together"].includes(evidence.mode)) return null;
  const taughtCycle = Number.isInteger(evidence.taughtCycle) && elSkillsBlockCycles.some(cycle => cycle.cycleNumber === evidence.taughtCycle)
    ? evidence.taughtCycle : null;
  if (evidence.mode === "reading" && taughtCycle === null) return null;
  return { contentVersion: version, practiceContext: { ...context, mode: evidence.mode, taughtCycle } };
}

const STORAGE_PREFIX = "literacy-guide-learn-games";
const DEFAULT_SCOPE = "default";

let activeProgressScope = DEFAULT_SCOPE;

function storageKey(progressScopeKey = DEFAULT_SCOPE) {
  return `${STORAGE_PREFIX}:${progressScopeKey || DEFAULT_SCOPE}`;
}

function baseState() {
  return {
    difficulty: "easy",
    ...normalizeAudioPreferences(),
    games: {}
  };
}

export function loadLearnGamesProgress(progressScopeKey = DEFAULT_SCOPE) {
  if (typeof window === "undefined") return baseState();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(progressScopeKey)) || "null");
    const source = parsed && typeof parsed === "object" ? parsed : {};
    return {
      ...baseState(),
      ...source,
      ...normalizeAudioPreferences(source),
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
    ...normalizeAudioPreferences(progress),
    games: progress.games || {}
  };
  window.localStorage.setItem(storageKey(progressScopeKey), JSON.stringify(next));
  // Local storage is the durable commit. Expose that outcome if subsequent
  // queue bookkeeping throws, so recovery can enqueue without saving twice.
  try {
    queueLearnGamesProgress(progressScopeKey, next);
  } catch (cause) {
    const error = new Error("Game saved locally; progress sync needs retry", { cause });
    error.savedProgress = next;
    throw error;
  }
}

export function queueLearnGamesProgress(progressScopeKey, progress) {
  // A false admission already retains the entry in progressSync's volatile
  // recovery and emits its shared notice. Do not make a second queue for it.
  return queueProgressSave("learn_games", "__all__", sanitizeCloudProgressPayload("learn_games", { v: 1, ...progress }), { scopeKey: progressScopeKey });
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

export function saveLearnGameResult(progressScopeKey = DEFAULT_SCOPE, gameId, stars = 0, score = 0, wordsCompleted = 0, evidence = null, difficulty, chapter) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const previous = getLearnGameProgress(current, gameId);
  let nextGame = {
    ...previous,
    stars: Math.max(previous.stars || 0, stars || 0),
    highScore: Math.max(previous.highScore || 0, score || 0),
    wordsCompleted: Math.max(previous.wordsCompleted || 0, wordsCompleted || 0),
    plays: (previous.plays || 0) + 1,
    lastPlayedAt: new Date().toISOString()
  };
  if (evidence?.firstResponses?.length) {
    nextGame.practiceRecord = mergePracticeProgressRecords(previous.practiceRecord, {
      v: 3,
      status: "completed",
      completions: [{
        id: globalThis.crypto.randomUUID(),
        contentVersion: "learn-game-practice-v1",
        ...authoredCompletionContext(gameId, evidence, chapter),
        completedAt: nextGame.lastPlayedAt,
        gameId,
        practiceOnly: true,
        independent: false,
        steps: evidence.firstResponses,
        assistedRetries: evidence.assistedRetries || []
      }]
    });
  }
  nextGame = finishArcadeChapter(nextGame, gameId, difficulty, chapter);
  const games = { ...current.games, [gameId]: nextGame };
  // Omitted difficulty preserves the legacy utility contract. Player saves
  // retire only the finished ladder in the SAME write as its result/evidence.
  const next = { ...current, games: difficulty === undefined ? games : removeCheckpoint(games, gameId, difficulty) };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

// --- Resume checkpoints: remember which ladder level a child reached, per game
// AND difficulty, so a long 5-round / 10-stage session can be picked back up. ---
export function loadGameCheckpoint(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty) {
  return readCheckpoint(loadLearnGamesProgress(progressScopeKey).games, gameId, difficulty);
}

export function saveGameCheckpoint(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty, level = 0, totalLevels = 0, sessionSeed, chapter) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const next = { ...current, games: applyCheckpoint(current.games, gameId, difficulty, level, totalLevels, sessionSeed, chapter) };
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
