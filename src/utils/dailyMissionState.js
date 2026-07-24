export const DAILY_MISSION_KINDS = Object.freeze(["quest", "book", "game"]);

export function normalizeMissionCelebratedSteps(
  value,
  done = {},
  { missionAlreadyCelebrated = false } = {}
) {
  const raw = Array.isArray(value)
    ? value
    : missionAlreadyCelebrated
      ? DAILY_MISSION_KINDS.filter(kind => done[kind])
      : [];
  return DAILY_MISSION_KINDS.filter(kind => raw.includes(kind) && done[kind]);
}

export function firstUncelebratedMissionStep(done = {}, celebratedSteps = []) {
  const celebrated = new Set(celebratedSteps);
  return DAILY_MISSION_KINDS.find(kind => done[kind] && !celebrated.has(kind)) || "";
}

export function withMissionStepCelebrated(state = {}, kind) {
  if (!DAILY_MISSION_KINDS.includes(kind) || !state.done?.[kind]) return state;
  const celebratedSteps = normalizeMissionCelebratedSteps(
    [...(state.celebratedSteps || []), kind],
    state.done
  );
  return { ...state, celebratedSteps };
}
