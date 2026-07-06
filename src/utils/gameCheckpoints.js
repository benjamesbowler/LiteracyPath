// Pure reducers for arcade "resume where you left off" checkpoints. Kept free of
// localStorage/React so the level-tracking logic can be unit-tested: a checkpoint
// is stored PER game AND difficulty (easy/medium/hard are different ladders), and
// only a level > 0 counts as resumable (level 0 = start, nothing to resume).

export function applyCheckpoint(games = {}, gameId, difficulty, level, totalLevels) {
  const key = String(difficulty || "");
  const prev = games[gameId] || {};
  const checkpoints = {
    ...(prev.checkpoints || {}),
    [key]: { level: Math.max(0, Number(level) || 0), totalLevels: Math.max(0, Number(totalLevels) || 0) }
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
  if (level <= 0) return null;
  return { level, totalLevels: Math.max(0, Number(cp.totalLevels) || 0) };
}
