import { normalizeAudioPreferences } from "../../../utils/audio/audioPreferences.js";
import {
  createContentDeckState,
  mergeAttemptReceipts,
  mergeContentDeckState,
  normalizeAttemptReceipts,
  normalizeContentDeckCheckpoint
} from "./contentDeckState.js";
import {
  normalizeSoundSeekersEvidenceEvent
} from "./evidenceEligibility.js";
import { validContentDeckUses } from "./contentCoverage.js";
import { resolveNarrativeBranchOutcome } from "../content/sceneVisualSemantics.js";
import { createCharacterAppearance } from "../visual/characterCustomization.js";

export const SOUND_SEEKERS_SCHEMA_VERSION = 2;
export const SOUND_SEEKERS_CONTENT_VERSION = "sound-seekers-v2";
export const MAX_SOUND_SEEKERS_EVIDENCE = 1200;

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
  const audio = normalizeAudioPreferences({
    ...value,
    musicEnabled: typeof value.music === "boolean" ? value.music : value.musicEnabled
  });
  const displayMode = value.displayMode === "pixel" ? "pixel" : "auto";
  const normalized = {
    reducedMotion: Boolean(value.reducedMotion),
    highContrast: Boolean(value.highContrast),
    ...audio,
    music: audio.musicEnabled,
    displayMode,
    autoTravel: value.autoTravel === true,
    slowerMovement: value.slowerMovement === true,
    noDamageTravel: value.noDamageTravel === true,
    largerTargets: value.largerTargets === true,
    simplifiedScene: value.simplifiedScene === true,
    extendedResponse: value.extendedResponse === true
  };
  if (Object.hasOwn(value, "characterAppearance")) {
    try {
      normalized.characterAppearance = createCharacterAppearance(value.characterAppearance);
    } catch {
      // Invalid or answer-bearing cosmetic payloads are intentionally stripped.
    }
  }
  return normalized;
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

function compareCanonicalIds(left, right) {
  const leftPoints = [...left];
  const rightPoints = [...right];
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index].codePointAt(0) - rightPoints[index].codePointAt(0);
    if (difference) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function compareEventAt(left, right) {
  const leftNumber = typeof left.at === "number" && Number.isFinite(left.at) ? left.at : null;
  const rightNumber = typeof right.at === "number" && Number.isFinite(right.at) ? right.at : null;
  if (leftNumber !== null && rightNumber === null) return -1;
  if (leftNumber === null && rightNumber !== null) return 1;
  if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) return leftNumber - rightNumber;
  const leftAt = String(left.at ?? "");
  const rightAt = String(right.at ?? "");
  if (leftAt !== rightAt) return compareCanonicalIds(leftAt, rightAt);
  return compareCanonicalIds(left.id, right.id);
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
    .map(normalizeSoundSeekersEvidenceEvent)
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

const MISSION_KEYS = [
  "schemaVersion", "kind", "contentVersion", "missionId", "stopId", "journeyStep",
  "attemptId", "attemptOrdinal", "missionRevision", "seed", "replayOrdinal", "phaseId",
  "completedPhaseIds", "teach", "nextDecisionOrdinal", "activity", "activeContent",
  "connectedTextPresentation"
];

function exactKeys(value, keys) {
  return Object.keys(asObject(value)).length === keys.length
    && keys.every(key => Object.hasOwn(value, key));
}

function canonicalConnectedTextCheckpoint(raw) {
  if (raw === null) return null;
  const value = asObject(raw);
  if (!exactKeys(value, ["schemaVersion", "kind", "sceneId", "transactionId", "history"])
    || value.schemaVersion !== 1 || value.kind !== "connected_text_presentation_checkpoint"
    || typeof value.sceneId !== "string" || !value.sceneId
    || typeof value.transactionId !== "string" || !value.transactionId
    || !Array.isArray(value.history)) return undefined;
  const validEvent = event => {
    if (event?.type === "decision_committed") return exactKeys(event, ["type", "reducerRevision", "evidenceEventId"])
      && Number.isSafeInteger(event.reducerRevision) && event.reducerRevision >= 0
      && typeof event.evidenceEventId === "string" && Boolean(event.evidenceEventId);
    if (event?.type === "action_completed") return exactKeys(event, ["type", "reducerRevision"])
      && Number.isSafeInteger(event.reducerRevision) && event.reducerRevision >= 0;
    if (event?.type === "meaning_requested") return exactKeys(event, ["type", "reducerRevision", "meaningSemanticId"])
      && Number.isSafeInteger(event.reducerRevision) && event.reducerRevision >= 0
      && typeof event.meaningSemanticId === "string" && Boolean(event.meaningSemanticId);
    return false;
  };
  if (value.history.some((event, index) => !validEvent(event) || event.reducerRevision !== index)) return undefined;
  return structuredClone(value);
}

function canonicalPowerCheckpoint(raw) {
  if (raw === null) return null;
  const value = asObject(raw);
  const common = ["kind", "powerId", "challengeId", "instructionId", "expectedAction",
    "recordsDomain", "interactionContextId", "status", "revision", "semanticSteps", "correction"];
  const extras = {
    echo_search: ["candidates", "foundCandidateId", "sourceRevealed"],
    contrast_sort: ["items", "bins", "placements"],
    word_forge: ["slots", "rack", "sweep", "morphology"],
    blend_bridge: ["segments", "nextSegmentIndex", "sweepComplete", "choices"],
    memory_delivery: ["cueReceived", "cueVisible", "replayCount", "routeProgress", "arrived", "recipients"],
    story_power: ["textRead", "choices", "narrativeChoiceToken"]
  }[value.powerId];
  const exactRecords = (records, keys, validate) => Array.isArray(records)
    && records.every(record => exactKeys(record, keys) && validate(record));
  const idLabel = record => typeof record.id === "string" && Boolean(record.id)
    && typeof record.label === "string" && Boolean(record.label);
  const extraShapeIsValid = (() => {
    if (value.powerId === "echo_search") return exactRecords(value.candidates,
      ["id", "label", "revealed"], record => idLabel(record) && typeof record.revealed === "boolean")
      && (value.foundCandidateId === null || typeof value.foundCandidateId === "string")
      && typeof value.sourceRevealed === "boolean";
    if (value.powerId === "contrast_sort") return exactRecords(value.items, ["id", "label"], idLabel)
      && exactRecords(value.bins, ["id", "label"], idLabel)
      && asObject(value.placements) === value.placements
      && Object.entries(value.placements).every(([itemId, binId]) => itemId && typeof binId === "string" && binId);
    if (value.powerId === "word_forge") {
      const morphology = value.morphology;
      const validMorphology = morphology === null || (exactKeys(morphology,
        ["kind", "baseWord", "ending", "derivedWord", "meaning"])
        && morphology.kind === "morphology_introduction"
        && ["baseWord", "ending", "derivedWord", "meaning"]
          .every(key => typeof morphology[key] === "string" && Boolean(morphology[key]))
        && `${morphology.baseWord}${morphology.ending}` === morphology.derivedWord);
      return exactRecords(value.slots, ["id", "tileId"], record => typeof record.id === "string" && Boolean(record.id)
        && (record.tileId === null || (typeof record.tileId === "string" && Boolean(record.tileId))))
        && exactRecords(value.rack, ["id", "label", "placed"], record => idLabel(record)
          && typeof record.placed === "boolean")
        && ["not_ready", "meaning_ready"].includes(value.sweep) && validMorphology;
    }
    if (value.powerId === "blend_bridge") return exactRecords(value.segments,
      ["id", "label", "active"], record => idLabel(record) && typeof record.active === "boolean")
      && exactRecords(value.choices, ["id", "label"], idLabel)
      && Number.isSafeInteger(value.nextSegmentIndex) && value.nextSegmentIndex >= 0
      && typeof value.sweepComplete === "boolean";
    if (value.powerId === "memory_delivery") return exactRecords(value.recipients,
      ["id", "label"], idLabel)
      && ["cueReceived", "cueVisible", "arrived"].every(key => typeof value[key] === "boolean")
      && ["replayCount", "routeProgress"].every(key => Number.isSafeInteger(value[key]) && value[key] >= 0);
    if (value.powerId === "story_power") return exactRecords(value.choices, ["id", "label"], idLabel)
      && typeof value.textRead === "boolean" && value.narrativeChoiceToken === null;
    return false;
  })();
  const forbiddenKeys = new Set([
    "answer", "expectedToken", "response", "responseIntent", "responseIntents",
    "capability", "commitResult", "presentationTransition", "evidence"
  ]);
  const hasForbiddenAuthority = candidate => Boolean(candidate && typeof candidate === "object"
    && Object.entries(candidate).some(([key, item]) => forbiddenKeys.has(key)
      || hasForbiddenAuthority(item)));
  if (!extras || !exactKeys(value, [...common, ...extras])
    || value.kind !== `${value.powerId}_state`
    || !["active", "awaiting_mission_commit", "model_pending"].includes(value.status)
    || !Number.isSafeInteger(value.revision) || value.revision < 0
    || !Array.isArray(value.semanticSteps) || value.semanticSteps.length !== value.revision
    || value.semanticSteps.some(step => typeof step !== "string" || !step)
    || value.correction !== null
    || typeof value.challengeId !== "string" || !value.challengeId
    || typeof value.instructionId !== "string" || !value.instructionId
    || typeof value.expectedAction !== "string" || !value.expectedAction
    || (value.recordsDomain !== null && typeof value.recordsDomain !== "string")
    || (value.interactionContextId !== null && typeof value.interactionContextId !== "string")
    || !extraShapeIsValid || hasForbiddenAuthority(value)) return undefined;
  return structuredClone(value);
}

function canonicalActiveContent(raw) {
  if (raw === null) return null;
  const value = asObject(raw);
  const keys = value.kind === "heart"
    ? ["kind", "category", "visitId", "actionUseId"]
    : value.kind === "placement" ? ["kind", "placementId", "visitId"]
      : value.kind === "story_transfer" ? ["kind", "transactionId"] : null;
  if (!keys || !exactKeys(value, keys)
    || Object.values(value).some(item => typeof item !== "string" || !item)) return undefined;
  return { ...value };
}

function normalizeMissionCheckpoint(raw) {
  const value = asObject(raw);
  const missionMatch = /^mission:([1-9][0-9]*):(s(?:[1-9]|[1-3][0-9]|40)):([0-9]+):(-?[0-9]+)$/u
    .exec(value.missionId || "");
  if (!exactKeys(value, MISSION_KEYS)
    || value.schemaVersion !== 1 || value.kind !== "sound_seekers_mission"
    || value.contentVersion !== SOUND_SEEKERS_CONTENT_VERSION
    || !missionMatch
    || !/^s(?:[1-9]|[1-3][0-9]|40)$/u.test(value.stopId || "")
    || !Number.isSafeInteger(value.journeyStep) || value.journeyStep < 1
    || !Number.isSafeInteger(value.attemptOrdinal) || value.attemptOrdinal < 0
    || !Number.isSafeInteger(value.missionRevision) || value.missionRevision < 0
    || !Number.isSafeInteger(value.seed) || !Number.isSafeInteger(value.replayOrdinal) || value.replayOrdinal < 0
    || typeof value.phaseId !== "string" || !value.phaseId
    || typeof value.attemptId !== "string" || !value.attemptId
    || Number(missionMatch?.[1]) !== value.journeyStep
    || missionMatch?.[2] !== value.stopId
    || Number(missionMatch?.[3]) !== value.replayOrdinal
    || Number(missionMatch?.[4]) !== value.seed
    || !Array.isArray(value.completedPhaseIds) || value.completedPhaseIds.some(item => typeof item !== "string" || !item)
    || new Set(value.completedPhaseIds).size !== value.completedPhaseIds.length
    || !exactKeys(value.teach, ["teachIndex", "teachTargetId"])
    || !Number.isSafeInteger(value.teach.teachIndex) || value.teach.teachIndex < 0
    || (value.teach.teachTargetId !== null && (typeof value.teach.teachTargetId !== "string" || !value.teach.teachTargetId))
    || !Number.isSafeInteger(value.nextDecisionOrdinal) || value.nextDecisionOrdinal < 0
    || !exactKeys(value.activity, ["kind", "actionId", "challengeId", "powerCheckpoint"])
    || typeof value.activity.kind !== "string" || !value.activity.kind
    || typeof value.activity.actionId !== "string" || !value.activity.actionId
    || (value.activity.challengeId !== null && (typeof value.activity.challengeId !== "string" || !value.activity.challengeId))) return null;
  const powerCheckpoint = canonicalPowerCheckpoint(value.activity.powerCheckpoint);
  const activeContent = canonicalActiveContent(value.activeContent);
  const connectedTextPresentation = canonicalConnectedTextCheckpoint(value.connectedTextPresentation);
  if (powerCheckpoint === undefined
    || activeContent === undefined || connectedTextPresentation === undefined) return null;
  return {
    ...structuredClone(value),
    completedPhaseIds: uniqueStrings(value.completedPhaseIds),
    activity: { ...structuredClone(value.activity), powerCheckpoint },
    activeContent,
    connectedTextPresentation
  };
}

function normalizeCheckpoint(value, contentDecks) {
  const checkpoint = asObject(value);
  if (checkpoint.contentVersion !== SOUND_SEEKERS_CONTENT_VERSION) return null;
  const deck = normalizeContentDeckCheckpoint(checkpoint, contentDecks);
  const normalized = { contentVersion: SOUND_SEEKERS_CONTENT_VERSION };
  if (typeof checkpoint.stopId === "string" && checkpoint.stopId.trim()) {
    normalized.stopId = checkpoint.stopId.trim();
  }
  if (deck?.contentPlacement) normalized.contentPlacement = deck.contentPlacement;
  if (deck?.storyTransfer) normalized.storyTransfer = deck.storyTransfer;
  if (checkpoint.mission !== undefined) {
    const mission = normalizeMissionCheckpoint(checkpoint.mission);
    if (mission) normalized.mission = mission;
  }
  return normalized;
}

function deriveStoryOutcomes(state) {
  const winners = new Map();
  for (const use of validContentDeckUses(state, "stories")) {
    const match = /^story-transfer:(\d+):(s(?:[1-9]|[1-3][0-9]|40))$/u.exec(use.transactionId || "");
    if (!match || typeof use.narrativeChoiceToken !== "string") continue;
    const sceneId = `scene-${match[2]}`;
    const outcome = resolveNarrativeBranchOutcome(sceneId, use.narrativeChoiceToken);
    if (!outcome) continue;
    const prior = winners.get(sceneId);
    if (!prior || use.journeyStep > prior.journeyStep
      || (use.journeyStep === prior.journeyStep
        && use.transactionId.localeCompare(prior.transactionId) > 0)) {
      winners.set(sceneId, { journeyStep: use.journeyStep, transactionId: use.transactionId, outcome });
    }
  }
  return Object.fromEntries([...winners].map(([sceneId, entry]) => [sceneId, entry.outcome.storyOutcomeId]));
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
  const state = {
    v: SOUND_SEEKERS_SCHEMA_VERSION,
    contentVersion: SOUND_SEEKERS_CONTENT_VERSION,
    reset: { epoch: boundedInteger(value.reset?.epoch), at: typeof value.reset?.at === "string" ? value.reset.at : null },
    trail: { routeCursor: 1, journeyStep: 1, completedStopIds: [], repairs: {}, chapterCoverage: {}, storyOutcomes: {} },
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
  state.trail.storyOutcomes = deriveStoryOutcomes(state);
  return state;
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
  const normalized = {
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
      chapterCoverage: normalizeNumberMap(trail.chapterCoverage),
      storyOutcomes: {}
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
  normalized.trail.storyOutcomes = deriveStoryOutcomes(normalized);
  return normalized;
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
      chapterCoverage: mergeNumberMaps(localState.trail.chapterCoverage, remoteState.trail.chapterCoverage),
      storyOutcomes: {}
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
