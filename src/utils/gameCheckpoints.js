import { validArcadeChapter } from "./arcadeJourneys.js";
import { WORD_BRIDGE_CONTENT_VERSION, WORD_BRIDGE_LEGACY_CONTENT_VERSION } from "../data/arcadeContentVersions.js";

export const validWordBridgeContentVersion = version => version === WORD_BRIDGE_CONTENT_VERSION
  || version === WORD_BRIDGE_LEGACY_CONTENT_VERSION;
// Pure reducers for arcade "resume where you left off" checkpoints. Kept free of
// localStorage/React so the level-tracking logic can be unit-tested: a checkpoint
// is stored PER game AND difficulty (easy/medium/hard are different ladders), and
// only a level > 0 counts as resumable (level 0 = start, nothing to resume).

export function applyCheckpoint(games = {}, gameId, difficulty, level, totalLevels, sessionSeed, chapter, metadata) {
  if (gameId === "word-bridge" && metadata?.contentVersion !== undefined
    && !validWordBridgeContentVersion(metadata.contentVersion)) return games;
  const key = String(difficulty || "");
  const prev = games[gameId] || {};
  const checkpoints = {
    ...(prev.checkpoints || {}),
    [key]: {
      level: Math.max(0, Number(level) || 0), totalLevels: Math.max(0, Number(totalLevels) || 0),
      ...(validArcadeChapter(chapter) ? { chapter } : {}),
      ...(gameId === "word-bridge" && validWordBridgeContentVersion(metadata?.contentVersion)
        ? { contentVersion: metadata.contentVersion } : {}),
      ...(Number.isInteger(sessionSeed) && sessionSeed >= 0 ? { sessionSeed } : {})
    }
  };
  return { ...games, [gameId]: { ...prev, checkpoints } };
}

export function removeCheckpoint(games = {}, gameId, difficulty) {
  const key = String(difficulty || "");
  const prev = games[gameId];
  if (!prev || !prev.checkpoints || !(key in prev.checkpoints)) return games;
  const checkpoints = { ...prev.checkpoints };
  delete checkpoints[key];
  return { ...games, [gameId]: { ...prev, checkpoints } };
}

// Returns { level, totalLevels } only when there is real progress to resume.
export function readCheckpoint(games = {}, gameId, difficulty) {
  const cp = games && games[gameId] && games[gameId].checkpoints
    ? games[gameId].checkpoints[String(difficulty || "")]
    : null;
  const level = cp ? Number(cp.level) || 0 : 0;
  if (gameId === "word-bridge" && cp?.contentVersion !== undefined
    && !validWordBridgeContentVersion(cp.contentVersion)) return null;
  if (level <= 0) return null;
  return {
    level, totalLevels: Math.max(0, Number(cp.totalLevels) || 0),
    ...(gameId === "word-bridge" && validWordBridgeContentVersion(cp.contentVersion)
      ? { contentVersion: cp.contentVersion } : {}),
    ...(validArcadeChapter(cp.chapter) ? { chapter: cp.chapter } : {}),
    ...(Number.isInteger(cp.sessionSeed) && cp.sessionSeed >= 0 ? { sessionSeed: cp.sessionSeed } : {})
  };
}
