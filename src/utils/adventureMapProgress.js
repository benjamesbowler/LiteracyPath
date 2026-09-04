export const EL_QUEST_SCHEMA_VERSION = 2;
export const EL_QUEST_PROGRESS_EPOCH = 2;

export function emptyElQuestProgress() {
  return {
    schemaVersion: EL_QUEST_SCHEMA_VERSION,
    progressEpoch: EL_QUEST_PROGRESS_EPOCH,
    cycles: {}
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCanonicalCycleRecord(value) {
  if (!isRecord(value)) return false;
  return !Object.prototype.hasOwnProperty.call(value, "stations")
    || isRecord(value.stations);
}

export function hasCanonicalElQuestCycles(value) {
  if (!isRecord(value?.cycles)) return false;
  return Object.values(value.cycles).every(isCanonicalCycleRecord);
}

function claimsCurrentElQuestVersion(value) {
  return Number(value?.schemaVersion) === EL_QUEST_SCHEMA_VERSION
    && Number(value?.progressEpoch) === EL_QUEST_PROGRESS_EPOCH;
}

export function isCurrentElQuestProgress(value) {
  return claimsCurrentElQuestVersion(value) && hasCanonicalElQuestCycles(value);
}

export function isMalformedCurrentElQuestProgress(value) {
  return claimsCurrentElQuestVersion(value) && !hasCanonicalElQuestCycles(value);
}

export function normalizeElQuestProgress(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  if (
    Number(source.schemaVersion) > EL_QUEST_SCHEMA_VERSION
    || Number(source.progressEpoch) > EL_QUEST_PROGRESS_EPOCH
  ) return source;
  if (isCurrentElQuestProgress(source)) return { cycles: {}, ...source };
  return {
    ...source,
    ...emptyElQuestProgress()
  };
}

function mergeForward(left, right) {
  if (left === undefined || left === null) return right;
  if (right === undefined || right === null) return left;
  if (typeof left === "number" && typeof right === "number") return Math.max(left, right);
  if (typeof left === "boolean" && typeof right === "boolean") return left || right;
  if (Array.isArray(left) || Array.isArray(right)) {
    const merged = [];
    const seen = new Set();
    for (const item of [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])]) {
      const identity = item && typeof item === "object" ? JSON.stringify(item) : `${typeof item}:${item}`;
      if (seen.has(identity)) continue;
      seen.add(identity);
      merged.push(item);
    }
    return merged;
  }
  if (typeof left === "object" && typeof right === "object") {
    const merged = { ...left };
    for (const key of Object.keys(right)) merged[key] = mergeForward(left[key], right[key]);
    return merged;
  }
  return right;
}

function sourceEpoch(value) {
  return Number(value?.progressEpoch) || 0;
}

function sourceSchema(value) {
  return Number(value?.schemaVersion) || 0;
}

export function isFutureElQuestProgress(value) {
  return sourceSchema(value) > EL_QUEST_SCHEMA_VERSION
    || sourceEpoch(value) > EL_QUEST_PROGRESS_EPOCH;
}

const LATEST_RUN_FIELDS = Object.freeze([
  "recoveries",
  "sampledConstructs",
  "lastRunSeed",
  "lastIndependent",
  "lastTotal"
]);

function playedAt(value) {
  const timestamp = Date.parse(String(value?.lastPlayedAt || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function latestCycleRun(left = {}, right = {}) {
  const leftTime = playedAt(left);
  const rightTime = playedAt(right);
  if (leftTime !== rightTime) return rightTime > leftTime ? right : left;
  const leftPlays = Number(left?.plays) || 0;
  const rightPlays = Number(right?.plays) || 0;
  return rightPlays >= leftPlays ? right : left;
}

function mergeCycleRecord(left, right) {
  if (left === undefined || left === null) return right;
  if (right === undefined || right === null) return left;
  const merged = mergeForward(left, right);
  const latest = latestCycleRun(left, right);

  // Bests, stars, completed stations and play counts move only forward. These
  // fields describe one particular latest run, so keep them as one coherent
  // snapshot instead of maxing numbers or unioning construct manifests.
  for (const field of LATEST_RUN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(latest, field)) merged[field] = latest[field];
    else delete merged[field];
  }
  if (Object.prototype.hasOwnProperty.call(latest, "lastPlayedAt")) {
    merged.lastPlayedAt = latest.lastPlayedAt;
  } else {
    delete merged.lastPlayedAt;
  }
  return merged;
}

function mergeCycles(left = {}, right = {}) {
  const merged = {};
  for (const cycleId of new Set([...Object.keys(left || {}), ...Object.keys(right || {})])) {
    merged[cycleId] = mergeCycleRecord(left?.[cycleId], right?.[cycleId]);
  }
  return merged;
}

export function mergeElQuestProgress(existing, incoming) {
  const existingEpoch = sourceEpoch(existing);
  const incomingEpoch = sourceEpoch(incoming);
  const existingSchema = sourceSchema(existing);
  const incomingSchema = sourceSchema(incoming);
  const existingIsFuture = isFutureElQuestProgress(existing);
  const incomingIsFuture = isFutureElQuestProgress(incoming);
  if (existingIsFuture || incomingIsFuture) {
    if (!incomingIsFuture) return existing;
    if (!existingIsFuture) return incoming;
    if (existingEpoch !== incomingEpoch) return existingEpoch > incomingEpoch ? existing : incoming;
    if (existingSchema > incomingSchema) return existing;
    return incoming;
  }

  if (isCurrentElQuestProgress(existing) && !isCurrentElQuestProgress(incoming)) return existing;
  if (!isCurrentElQuestProgress(existing) && isCurrentElQuestProgress(incoming)) return incoming;

  const local = normalizeElQuestProgress(existing);
  const cloud = normalizeElQuestProgress(incoming);
  return {
    ...local,
    ...cloud,
    schemaVersion: EL_QUEST_SCHEMA_VERSION,
    progressEpoch: EL_QUEST_PROGRESS_EPOCH,
    cycles: mergeCycles(local.cycles, cloud.cycles)
  };
}
