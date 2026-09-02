export const EL_QUEST_SCHEMA_VERSION = 2;
export const EL_QUEST_PROGRESS_EPOCH = 2;

export function emptyElQuestProgress() {
  return {
    schemaVersion: EL_QUEST_SCHEMA_VERSION,
    progressEpoch: EL_QUEST_PROGRESS_EPOCH,
    cycles: {}
  };
}

export function isCurrentElQuestProgress(value) {
  return Number(value?.schemaVersion) === EL_QUEST_SCHEMA_VERSION
    && Number(value?.progressEpoch) === EL_QUEST_PROGRESS_EPOCH;
}

export function normalizeElQuestProgress(value) {
  const source = value && typeof value === "object" ? value : {};
  if (Number(source.progressEpoch) > EL_QUEST_PROGRESS_EPOCH) return source;
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

export function mergeElQuestProgress(existing, incoming) {
  const existingEpoch = sourceEpoch(existing);
  const incomingEpoch = sourceEpoch(incoming);
  if (existingEpoch > EL_QUEST_PROGRESS_EPOCH || incomingEpoch > EL_QUEST_PROGRESS_EPOCH) {
    if (existingEpoch > incomingEpoch) return existing;
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
    cycles: mergeForward(local.cycles, cloud.cycles)
  };
}
