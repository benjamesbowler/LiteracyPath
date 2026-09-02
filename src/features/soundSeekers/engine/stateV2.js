import {
  createContentDeckState,
  mergeAttemptReceipts,
  mergeContentDeckState,
  normalizeAttemptReceipts,
  normalizeContentDeckCheckpoint
} from "./contentDeckState.js";
import {
  EVIDENCE_DOMAINS,
  normalizeHeartWordActivityType
} from "./evidenceEligibility.js";

export const SOUND_SEEKERS_SCHEMA_VERSION = 2;
export const SOUND_SEEKERS_CONTENT_VERSION = "sound-seekers-v2";
export const MAX_SOUND_SEEKERS_EVIDENCE = 1200;

function trimAsciiSpaces(value) {
  return value.replace(/^ +| +$/g, "");
}

const DEFAULT_SETTINGS = Object.freeze({
  reducedMotion: false,
  highContrast: false,
  soundEnabled: true,
  music: true,
  musicEnabled: true,
  displayMode: "auto"
});

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function boundedInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function uniqueStrings(value) {
  return [...new Set((Array.isArray(value) ? value : [])
    .map(item => typeof item === "string" ? item.trim() : "")
    .filter(Boolean))];
}

function normalizeIdList(value) {
  return uniqueStrings(value).sort();
}

export function normalizeAllowlistedSettings(raw = {}) {
  const value = asObject(raw);
  const quietLegacyAudio = value.quietSoundscape === true || value.soundEnabled === false;
  const music = typeof value.music === "boolean"
    ? value.music
    : typeof value.musicEnabled === "boolean"
      ? value.musicEnabled
      : quietLegacyAudio ? false : DEFAULT_SETTINGS.music;
  const displayMode = value.displayMode === "pixel" ? "pixel" : "auto";
  return {
    reducedMotion: Boolean(value.reducedMotion),
    highContrast: Boolean(value.highContrast),
    soundEnabled: value.soundEnabled !== false,
    music,
    musicEnabled: music,
    displayMode
  };
}

function normalizeAssignment(raw) {
  const value = asObject(raw);
  const next = {};
  const stopIds = uniqueStrings(value.stopIds);
  const targets = uniqueStrings(value.targets);
  if (!stopIds.length && !targets.length) return null;
  if (stopIds.length) next.stopIds = stopIds;
  if (targets.length) next.targets = targets.slice(0, 6);
  if (typeof value.note === "string") next.note = value.note.slice(0, 120);
  if (typeof value.assignedAt === "string") next.assignedAt = value.assignedAt;
  if (typeof value.by === "string") next.by = value.by;
  return Object.keys(next).length ? next : null;
}

export function createTeacherSoundSeekersAssignmentUpdate(targets = [], note = "", assignedAt = "") {
  return {
    assignment: normalizeAssignment({ targets, note, assignedAt, by: "teacher" })
  };
}

function mergeTeacherAssignment(existing, incoming) {
  const stored = normalizeAssignment(existing);
  if (!Object.prototype.hasOwnProperty.call(asObject(incoming), "assignment")) return stored;
  if (incoming.assignment === null) return null;
  return normalizeAssignment(incoming.assignment) || stored;
}

function normalizeEvent(event) {
  const value = asObject(event);
  const id = typeof value.id === "string" ? trimAsciiSpaces(value.id) : "";
  if (!id) return null;
  const at = typeof value.at === "number" && Number.isFinite(value.at)
    ? value.at
    : typeof value.at === "string" && trimAsciiSpaces(value.at)
      ? trimAsciiSpaces(value.at)
      : 0;
  const normalized = { ...value, id, at };
  delete normalized.activityType;
  const activityType = value.domain === EVIDENCE_DOMAINS.HEART_WORD_MAPPING
    ? normalizeHeartWordActivityType(value.activityType)
    : null;
  if (activityType) normalized.activityType = activityType;
  return Object.freeze(normalized);
}

function compareEventAt(left, right) {
  const leftNumber = typeof left.at === "number" && Number.isFinite(left.at) ? left.at : null;
  const rightNumber = typeof right.at === "number" && Number.isFinite(right.at) ? right.at : null;
  if (leftNumber !== null && rightNumber === null) return -1;
  if (leftNumber === null && rightNumber !== null) return 1;
  if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) return leftNumber - rightNumber;
  const leftAt = String(left.at ?? "");
  const rightAt = String(right.at ?? "");
  if (leftAt !== rightAt) return leftAt < rightAt ? -1 : 1;
  return left.id.localeCompare(right.id);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalJson(value[key])]));
}

function eventFingerprint(event) {
  return JSON.stringify(canonicalJson(event));
}

function isConflictMarker(event) {
  return event?.evidenceKind === "conflict" && event?.conflicted === true;
}

function conflictMarkerFor(events) {
  const latest = [...events].sort(compareEventAt).at(-1);
  return Object.freeze({
    id: latest.id,
    at: latest.at,
    evidenceKind: "conflict",
    conflicted: true
  });
}

function normalizeEvidence(value) {
  const byId = new Map();
  for (const event of (Array.isArray(value) ? value : [])
    .map(normalizeEvent)
    .filter(Boolean)) {
    const matches = byId.get(event.id) || [];
    matches.push(event);
    byId.set(event.id, matches);
  }
  return [...byId.values()]
    .map(events => {
      const distinctPayloads = new Set(events.map(eventFingerprint));
      return events.some(isConflictMarker) || distinctPayloads.size > 1
        ? conflictMarkerFor(events)
        : events[0];
    })
    .sort(compareEventAt)
    .slice(-MAX_SOUND_SEEKERS_EVIDENCE);
}

function normalizeBooleanMap(value) {
  return Object.fromEntries(Object.entries(asObject(value))
    .filter(([key, enabled]) => key && enabled === true));
}

function normalizeNumberMap(value) {
  return Object.fromEntries(Object.entries(asObject(value))
    .map(([key, amount]) => [key, boundedInteger(amount)])
    .filter(([key, amount]) => key && amount > 0));
}

function normalizeJournal(value) {
  const journal = asObject(value);
  return {
    words: normalizeIdList(journal.words),
    scenes: normalizeIdList(journal.scenes),
    stickers: normalizeIdList(journal.stickers)
  };
}

function normalizeCheckpoint(value, contentDecks) {
  const checkpoint = asObject(value);
  return checkpoint.contentVersion === SOUND_SEEKERS_CONTENT_VERSION
    ? normalizeContentDeckCheckpoint(checkpoint, contentDecks)
    : null;
}

export function isSoundSeekersV2(raw) {
  const state = asObject(raw);
  const reset = state.reset;
  const trail = state.trail;
  return Boolean(state.v === SOUND_SEEKERS_SCHEMA_VERSION
    && state.contentVersion === SOUND_SEEKERS_CONTENT_VERSION
    && reset && typeof reset === "object" && !Array.isArray(reset)
    && trail && typeof trail === "object" && !Array.isArray(trail)
    && Array.isArray(state.evidence)
    && state.settings && typeof state.settings === "object" && !Array.isArray(state.settings));
}

export function createSoundSeekersState(seed = {}) {
  const value = asObject(seed);
  const contentDecks = createContentDeckState(value.contentDecks);
  return {
    v: SOUND_SEEKERS_SCHEMA_VERSION,
    contentVersion: SOUND_SEEKERS_CONTENT_VERSION,
    reset: { epoch: boundedInteger(value.reset?.epoch), at: typeof value.reset?.at === "string" ? value.reset.at : null },
    trail: { routeCursor: 1, journeyStep: 1, completedStopIds: [], repairs: {}, chapterCoverage: {} },
    evidence: normalizeEvidence(value.evidence),
    confusions: normalizeNumberMap(value.confusions),
    contentDecks,
    attemptReceipts: normalizeAttemptReceipts(value.attemptReceipts),
    journal: normalizeJournal(value.journal),
    rewards: { claimedIds: normalizeIdList(value.rewards?.claimedIds) },
    checkpoint: normalizeCheckpoint(value.checkpoint, contentDecks),
    assignment: normalizeAssignment(value.assignment),
    settings: normalizeAllowlistedSettings(value.settings)
  };
}

export function normalizeSoundSeekersState(raw, carry = {}) {
  const source = asObject(raw);
  const preserved = asObject(carry);
  if (!isSoundSeekersV2(source)) {
    return createSoundSeekersState({
      assignment: source.assignment ?? preserved.assignment,
      settings: source.settings ?? preserved.settings
    });
  }
  const base = createSoundSeekersState({
    assignment: source.assignment ?? preserved.assignment,
    settings: source.settings ?? preserved.settings
  });
  const trail = asObject(source.trail);
  const rewards = asObject(source.rewards);
  return {
    ...base,
    reset: {
      epoch: boundedInteger(source.reset?.epoch),
      at: typeof source.reset?.at === "string" ? source.reset.at : null
    },
    trail: {
      routeCursor: Math.max(1, boundedInteger(trail.routeCursor, 1)),
      journeyStep: Math.max(1, boundedInteger(trail.journeyStep, 1)),
      completedStopIds: normalizeIdList(trail.completedStopIds),
      repairs: normalizeBooleanMap(trail.repairs),
      chapterCoverage: normalizeNumberMap(trail.chapterCoverage)
    },
    evidence: normalizeEvidence(source.evidence),
    confusions: normalizeNumberMap(source.confusions),
    contentDecks: createContentDeckState(source.contentDecks),
    attemptReceipts: normalizeAttemptReceipts(source.attemptReceipts),
    journal: normalizeJournal(source.journal),
    rewards: { claimedIds: normalizeIdList(rewards.claimedIds) },
    checkpoint: normalizeCheckpoint(source.checkpoint, source.contentDecks),
    assignment: normalizeAssignment(source.assignment ?? preserved.assignment),
    settings: normalizeAllowlistedSettings(source.settings ?? preserved.settings)
  };
}

function mergeNumberMaps(local, remote) {
  const result = { ...normalizeNumberMap(local) };
  for (const [key, amount] of Object.entries(normalizeNumberMap(remote))) {
    result[key] = Math.max(result[key] || 0, amount);
  }
  return result;
}

function mergeBooleanMaps(local, remote) {
  return { ...normalizeBooleanMap(local), ...normalizeBooleanMap(remote) };
}

function mergeIds(local, remote) {
  return normalizeIdList([...(Array.isArray(local) ? local : []), ...(Array.isArray(remote) ? remote : [])]);
}

function mergeEvidence(local, remote) {
  return normalizeEvidence([...(local.evidence || []), ...(remote.evidence || [])]);
}

export function mergeSoundSeekersStates(local, remote) {
  const localRaw = asObject(local);
  const remoteRaw = asObject(remote);
  const localIsV2 = isSoundSeekersV2(localRaw);
  const remoteIsV2 = isSoundSeekersV2(remoteRaw);
  const localState = normalizeSoundSeekersState(localRaw, remoteIsV2 ? {} : remoteRaw);
  const remoteState = normalizeSoundSeekersState(remoteRaw, localIsV2 ? {} : localRaw);
  const assignment = mergeTeacherAssignment(localRaw.assignment, remoteRaw);

  if (localIsV2 !== remoteIsV2) {
    const winner = localIsV2 ? localState : remoteState;
    return normalizeSoundSeekersState({
      ...winner,
      assignment,
      settings: winner.settings
    });
  }

  const localEpoch = localState.reset.epoch;
  const remoteEpoch = remoteState.reset.epoch;
  if (localEpoch !== remoteEpoch) {
    const winner = localEpoch > remoteEpoch ? localState : remoteState;
    return normalizeSoundSeekersState({
      ...winner,
      assignment,
      settings: localState.settings
    });
  }

  return normalizeSoundSeekersState({
    ...localState,
    reset: {
      epoch: localEpoch,
      at: String(localState.reset.at || "") >= String(remoteState.reset.at || "")
        ? localState.reset.at
        : remoteState.reset.at
    },
    trail: {
      routeCursor: localState.trail.routeCursor,
      journeyStep: Math.max(localState.trail.journeyStep, remoteState.trail.journeyStep),
      completedStopIds: mergeIds(localState.trail.completedStopIds, remoteState.trail.completedStopIds),
      repairs: mergeBooleanMaps(localState.trail.repairs, remoteState.trail.repairs),
      chapterCoverage: mergeNumberMaps(localState.trail.chapterCoverage, remoteState.trail.chapterCoverage)
    },
    evidence: mergeEvidence(localState, remoteState),
    confusions: mergeNumberMaps(localState.confusions, remoteState.confusions),
    contentDecks: mergeContentDeckState(localState.contentDecks, remoteState.contentDecks),
    attemptReceipts: mergeAttemptReceipts(localState.attemptReceipts, remoteState.attemptReceipts),
    journal: {
      words: mergeIds(localState.journal.words, remoteState.journal.words),
      scenes: mergeIds(localState.journal.scenes, remoteState.journal.scenes),
      stickers: mergeIds(localState.journal.stickers, remoteState.journal.stickers)
    },
    rewards: { claimedIds: mergeIds(localState.rewards.claimedIds, remoteState.rewards.claimedIds) },
    checkpoint: localState.checkpoint,
    assignment,
    settings: localState.settings
  });
}
