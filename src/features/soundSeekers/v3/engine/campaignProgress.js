import { decodeCampaignTransport } from '../../../../utils/campaignTransport.js';
import { campaignPlayTimeSnapshot, mergeCampaignPlayTime } from './campaignPlayTime.js';
// Campaign state lives inside the existing v3 journey; this module has no
// account, storage, clock or network ownership. Callers supply event IDs/time.
import { createProgress, recordEvidence } from './progress.js';

export const CAMPAIGN_PROGRESS_VERSION = 1;
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const copy = value => JSON.parse(JSON.stringify(value));
const ids = value => [...new Set((Array.isArray(value) ? value : []).filter(id => typeof id === 'string' && id.length))];
const stageById = (catalog, id) => catalog?.stages?.find(stage => stage.id === id);
const missionById = (catalog, id) => catalog?.missions?.find(mission => mission.id === id);
const validStop = id => /^s(?:[1-9]|[1-3][0-9]|40)$/.test(id);
const changed = (progress, campaign, now) => ({ ...progress, campaign, updatedAt: now });

/** Preserve the original legacy payload for recovery, never infer mastery or
 * expanded mission completion from a completed old stop. Unknown fields and
 * uncapped raw evidence survive roundtrips. Catalog removal never erases saves.
 */
export function normalizeCampaignProgress(raw, catalog = {}, fallbackHero = 'speedy') {
  const source = object(decodeCampaignTransport(raw));
  if (source.v && ![1, 2, 3].includes(source.v)) return copy(source);
  const legacy = source.v === 1 || source.v === 2;
  const base = source.v === 3 ? { ...createProgress(), ...copy(source) } : createProgress({ hero: source.hero || fallbackHero });
  const saved = object(source.campaign);
  if (saved.v && saved.v !== CAMPAIGN_PROGRESS_VERSION) {
    // A newer client owns this payload. Preserve it, but mutators below refuse
    // to interpret it rather than silently replacing a child's future save.
    return { ...base, campaign: copy(saved) };
  }
  const completedStops = ids([
    ...Object.keys(object(source.completed)).filter(id => source.completed[id]),
    ...(Array.isArray(source.trail?.stopsDone) ? source.trail.stopsDone : []),
    ...(Array.isArray(source.trail?.completedStopIds) ? source.trail.completedStopIds : []),
    ...(Array.isArray(source.completedStops) ? source.completedStops : [])
  ]).filter(validStop);
  const anchors = { ...object(saved.storyAnchors) };
  for (const stopId of completedStops) {
    const stage = catalog.stages?.find(entry => entry.legacyStopIds?.includes(stopId));
    anchors[stopId] ||= { stopId, stageId: stage?.id || null, sourceVersion: source.v, narrativeOnly: true };
    if (!anchors[stopId].stageId && stage) anchors[stopId] = { ...anchors[stopId], stageId: stage.id };
  }
  const campaign = {
    ...copy(saved),
    v: CAMPAIGN_PROGRESS_VERSION,
    contentVersion: saved.contentVersion ?? catalog.version ?? 1,
    activeMissionId: saved.activeMissionId || null,
    completedMissions: object(saved.completedMissions),
    repairs: object(saved.repairs),
    visitedStageIds: ids(saved.visitedStageIds),
    checkpoints: object(saved.checkpoints),
    attemptIds: object(saved.attemptIds),
    startedAttemptIds: { ...object(saved.startedAttemptIds), ...Object.fromEntries(Object.entries(object(saved.checkpoints)).filter(([, checkpoint]) => checkpoint?.attemptId).map(([id, checkpoint]) => [JSON.stringify([id, checkpoint.attemptId]), true])) },
    storyAnchors: anchors,
    ...(legacy && !saved.legacySave ? { legacySave: copy(source) } : {})
  };
  return { ...base, campaign };
}

const usable = progress => progress?.campaign?.v === CAMPAIGN_PROGRESS_VERSION;
const done = (progress, id) => own(progress?.campaign?.completedMissions, id);
const prerequisitesMet = (progress, requirements = [], catalog) => requirements.every(id => Boolean(missionById(catalog, id)) && done(progress, id));

export function isCampaignStageUnlocked(progress, stageId, catalog) {
  const stage = stageById(catalog, stageId);
  return Boolean(usable(progress) && stage && prerequisitesMet(progress, stage.prerequisiteMissionIds, catalog));
}

export function isCampaignMissionUnlocked(progress, missionId, catalog) {
  const mission = missionById(catalog, missionId);
  return Boolean(mission && isCampaignStageUnlocked(progress, mission.stageId, catalog)
    && prerequisitesMet(progress, mission.prerequisiteMissionIds, catalog));
}

export function getCampaignCheckpoint(progress, missionId) {
  const checkpoint = progress?.campaign?.checkpoints?.[missionId];
  return checkpoint ? copy(checkpoint) : null;
}

/** Supply a complete, already-authored challenge list, choice order and initial
 * authority state. Returning to a mission resumes that same attempt, including
 * after visiting another mission. Starting again cannot reroll its questions.
 */
export function beginCampaignMission(progress, missionId, checkpoint, catalog, now = 0) {
  if (!isCampaignMissionUnlocked(progress, missionId, catalog)) return progress;
  const mission = missionById(catalog, missionId);
  const saved = progress.campaign.checkpoints[missionId];
  if (!saved && (!checkpoint || typeof checkpoint.attemptId !== 'string' || !checkpoint.attemptId
    || !Array.isArray(checkpoint.challenges) || !checkpoint.challenges.length)) return progress;
  const exact = saved || { ...copy(checkpoint), missionId, contentVersion: catalog.version ?? 1,
    beatIndex: 0, beatState: copy(checkpoint.beatState || {}), playTime: campaignPlayTimeSnapshot(), completed: false, replayOrdinal: 0, startedAt: now };
  return changed(progress, { ...progress.campaign, activeMissionId: missionId,
    visitedStageIds: ids([...progress.campaign.visitedStageIds, mission.stageId]),
    startedAttemptIds: { ...progress.campaign.startedAttemptIds, [JSON.stringify([missionId, exact.attemptId])]: true },
    checkpoints: { ...progress.campaign.checkpoints, [missionId]: exact }
  }, now);
}

/** Only authority state/cursor and physical position may advance. Challenge
 * identities, choices, attempt ID and content version are immutable.
 * Within one beat, assistance and errors cannot be cleared by a stale save.
 */
export function updateCampaignCheckpoint(progress, missionId, patch, now = 0) {
  if (!usable(progress)) return progress;
  const previous = progress.campaign.checkpoints[missionId];
  if (!previous || previous.completed || !patch || patch.attemptId !== previous.attemptId) return progress;
  const index = patch.beatIndex ?? previous.beatIndex;
  if (!Number.isInteger(index) || index < previous.beatIndex || index > previous.challenges.length) return progress;
  let state = copy(patch.beatState || previous.beatState);
  if (index === previous.beatIndex) {
    const old = previous.beatState || {};
    const winner = compareRanks(authorityRank(old), authorityRank(state)) > 0 ? old : state;
    state = mergeBeatState(old, state, winner);
  }
  const next = { ...previous, beatIndex: index, beatState: state,
    ...(patch.playTime || previous.playTime ? { playTime: mergeCampaignPlayTime(previous.playTime, patch.playTime) } : {}),
    ...(patch.position ? { position: copy(patch.position) } : {}), updatedAt: now };
  return changed(progress, { ...progress.campaign, checkpoints: { ...progress.campaign.checkpoints, [missionId]: next } }, now);
}

/** Store only judged literacy actions, never movement or completion rewards.
 * This is formative practice, never a formal assessment or mastery decision.
 * IDs are scoped to an immutable mission attempt, and duplicate delivery is a
 * no-op even if the retry tries to change its answer/support classification.
 */
export function recordCampaignEvidence(progress, missionId, event, catalog, now = 0) {
  if (!usable(progress) || !missionById(catalog, missionId) || !event || typeof event.id !== 'string' || !event.id) return progress;
  const checkpoint = progress.campaign.checkpoints[missionId];
  if (!checkpoint || checkpoint.completed || event.attemptId !== checkpoint.attemptId) return progress;
  const eventKey = JSON.stringify([missionId, event.attemptId, event.id]);
  if (own(progress.campaign.attemptIds, eventKey)) return progress;
  const supportUsed = ids([...(event.supportUsed || []), ...(checkpoint.beatState?.supportUsed || [])]);
  const errors = Math.max(event.errors || 0, checkpoint.beatState?.errors || 0);
  const independent = event.independent === true && !supportUsed.length && !errors
    && !checkpoint.beatState?.modelShown && event.audioSupport !== true;
  const entry = { ...copy(event), missionId, contentVersion: checkpoint.contentVersion,
    kind: 'practice', evidenceType: 'formative', targetIds: ids(event.targetIds), supportUsed, errors, independent };
  const updated = recordEvidence(progress, entry, now);
  // Preserve existing evidence instead of silently dropping it at the old 600
  // event UI-log cap. Retention/acknowledged compaction belongs to storage.
  updated.evidence = [...(progress.evidence || []), { ...entry, journeyStep: progress.journeyStep, at: now }];
  return changed(updated, { ...progress.campaign, attemptIds: { ...progress.campaign.attemptIds, [eventKey]: true } }, now);
}

/** Called only after the authority has completed every challenge. Repairs and
 * narrative access do not modify target ledgers or manufacture learning events.
 */
export function completeCampaignMission(progress, missionId, catalog, now = 0) {
  if (!isCampaignMissionUnlocked(progress, missionId, catalog)) return progress;
  const checkpoint = progress.campaign.checkpoints[missionId];
  if (!checkpoint || checkpoint.completed || checkpoint.beatIndex < checkpoint.challenges.length) return progress;
  const mission = missionById(catalog, missionId);
  const repairId = mission.outcome?.repairId;
  return { ...changed(progress, { ...progress.campaign,
    activeMissionId: progress.campaign.activeMissionId === missionId ? null : progress.campaign.activeMissionId,
    completedMissions: { ...progress.campaign.completedMissions, [missionId]: progress.campaign.completedMissions[missionId] || { at: now, attemptId: checkpoint.attemptId, contentVersion: checkpoint.contentVersion, ...(checkpoint.playTime ? { playTime: campaignPlayTimeSnapshot(checkpoint.playTime) } : {}) } },
    repairs: { ...progress.campaign.repairs, ...(repairId ? { [repairId]: progress.campaign.repairs[repairId] || { missionId, stageId: mission.stageId, at: now } } : {}) },
    checkpoints: { ...progress.campaign.checkpoints, [missionId]: { ...checkpoint, completed: true } }
  }, now), journeyStep: progress.journeyStep + (done(progress, missionId) ? 0 : 1) };
}

/** Explicit replay is allowed only after resolution. An unfinished replay is
 * resumed unchanged; an already-used attempt ID can never earn credit twice.
 */
export function restartCampaignMission(progress, missionId, checkpoint, catalog, now = 0) {
  if (!usable(progress) || !done(progress, missionId)) return progress;
  const previous = progress.campaign.checkpoints[missionId];
  if (!previous?.completed) return beginCampaignMission(progress, missionId, checkpoint, catalog, now);
  if (!checkpoint?.attemptId || checkpoint.attemptId === previous.attemptId
    || own(progress.campaign.startedAttemptIds, JSON.stringify([missionId, checkpoint.attemptId]))
    || Object.keys(progress.campaign.attemptIds).some(key => JSON.parse(key)[1] === checkpoint.attemptId)
    || Object.values(progress.campaign.completedMissions).some(entry => entry.attemptId === checkpoint.attemptId)) return progress;
  const checkpoints = { ...progress.campaign.checkpoints };
  delete checkpoints[missionId];
  const candidate = beginCampaignMission({ ...progress, campaign: { ...progress.campaign, checkpoints } }, missionId, checkpoint, catalog, now);
  if (!candidate.campaign.checkpoints[missionId]) return progress;
  candidate.campaign.checkpoints[missionId].replayOrdinal = (previous.replayOrdinal || 0) + 1;
  return candidate;
}

const eventIdentity = event => event?.missionId && event?.attemptId && event?.id
  ? JSON.stringify([event.missionId, event.attemptId, event.id]) : null;
const stable = value => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const earliest = (a, b) => !a ? b : !b ? a
  : (a.at ?? Infinity) < (b.at ?? Infinity) ? a
    : (a.at ?? Infinity) > (b.at ?? Infinity) ? b : stable(a) <= stable(b) ? a : b;
const unionRecords = (a, b) => Object.fromEntries(ids([...Object.keys(a || {}), ...Object.keys(b || {})])
  .sort().map(id => [id, copy(earliest(a?.[id], b?.[id]))]));

function campaignEvents(progress) {
  const events = new Map();
  for (const event of progress.evidence || []) {
    const key = eventIdentity(event);
    if (key) events.set(key, earliest(events.get(key), event));
  }
  for (const key of Object.keys(progress.campaign.attemptIds)) {
    if (!events.has(key)) throw new Error('Cannot merge campaign evidence after unacknowledged or unsupported compaction');
  }
  return events;
}

function retainedTargets(progress, events) {
  let counted = { ...createProgress(), evidence: [] };
  for (const event of events.values()) counted = recordEvidence(counted, event, event.at);
  const retained = copy(progress.targets || {});
  for (const [id, target] of Object.entries(retained)) {
    const counts = counted.targets[id] || {};
    for (const field of ['independent', 'supported', 'missed']) target[field] = Math.max(0, (target[field] || 0) - (counts[field] || 0));
    target.confusions = Object.fromEntries(Object.entries(target.confusions || {}).map(([key, count]) => [key, Math.max(0, count - (counts.confusions?.[key] || 0))]));
  }
  return retained;
}

function mergeTargets(a, b) {
  const targets = {};
  for (const id of ids([...Object.keys(a), ...Object.keys(b)]).sort()) {
    const left = a[id] || {}, right = b[id] || {};
    const confusionIds = ids([...Object.keys(left.confusions || {}), ...Object.keys(right.confusions || {})]);
    targets[id] = { ...left, ...right, taught: Boolean(left.taught || right.taught),
      independent: Math.max(left.independent || 0, right.independent || 0),
      supported: Math.max(left.supported || 0, right.supported || 0),
      missed: Math.max(left.missed || 0, right.missed || 0),
      lastSeenStep: Math.max(left.lastSeenStep ?? -1, right.lastSeenStep ?? -1) < 0 ? null : Math.max(left.lastSeenStep ?? -1, right.lastSeenStep ?? -1),
      confusions: Object.fromEntries(confusionIds.map(key => [key, Math.max(left.confusions?.[key] || 0, right.confusions?.[key] || 0)])) };
  }
  return targets;
}

function authorityRank(state = {}) {
  return [Number(Boolean(state.done)), state.itemIndex || 0,
    Array.isArray(state.placed) ? state.placed.length : 0, state.cardsHeard?.length || 0];
}
function compareRanks(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  return 0;
}
function mergeBeatState(a, b, winner) {
  if (Array.isArray(a.placed) && Array.isArray(b.placed)
    && a.placed.slice(0, Math.min(a.placed.length, b.placed.length)).some((id, i) => id !== b.placed[i])) {
    throw new Error('Conflicting immutable campaign placement sequence');
  }
  const result = copy(winner);
  result.supportUsed = ids([...(a.supportUsed || []), ...(b.supportUsed || [])]).sort();
  result.errors = Math.max(a.errors || 0, b.errors || 0);
  result.modelShown = Boolean(a.modelShown || b.modelShown);
  result.done = Boolean(a.done || b.done);
  for (const field of ['heardSources', 'cardsHeard']) {
    if (a[field] || b[field]) result[field] = ids([...(a[field] || []), ...(b[field] || [])]).sort();
  }
  if ('heard' in a || 'heard' in b) result.heard = Boolean(a.heard || b.heard);
  if ('slotErrors' in a || 'slotErrors' in b) result.slotErrors = Math.max(a.slotErrors || 0, b.slotErrors || 0);
  if (a.sceneRepairs || b.sceneRepairs) result.sceneRepairs = unionRecords(a.sceneRepairs, b.sceneRepairs);
  if (a.itemErrors || b.itemErrors) result.itemErrors = Object.fromEntries(ids([...Object.keys(a.itemErrors || {}), ...Object.keys(b.itemErrors || {})]).map(id => [id, Math.max(a.itemErrors?.[id] || 0, b.itemErrors?.[id] || 0)]));
  if (a.placed && b.placed && !Array.isArray(a.placed) && !Array.isArray(b.placed)) {
    for (const key of Object.keys(a.placed)) if (own(b.placed, key) && a.placed[key] !== b.placed[key]) throw new Error('Conflicting immutable campaign sorted placement');
    result.placed = { ...a.placed, ...b.placed };
  }
  return result;
}

export function mergeCheckpoint(a, b) {
  if (!a || !b) return copy(a || b);
  if (a.attemptId !== b.attemptId) {
    // A newer replay supersedes a finished one. Concurrent equal-generation
    // attempts retain both evidence histories but choose a stable active task.
    const rank = value => [value.replayOrdinal || 0, value.startedAt || 0, value.attemptId];
    const left = rank(a), right = rank(b);
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return copy(left[i] > right[i] ? a : b);
  }
  if (a.challenges !== b.challenges && stable(a.challenges) !== stable(b.challenges)) throw new Error('Conflicting immutable campaign challenge checkpoint');
  const authority = compareRanks([a.beatIndex, ...authorityRank(a.beatState)], [b.beatIndex, ...authorityRank(b.beatState)]);
  const winner = authority > 0 ? a : authority < 0 ? b
    : (a.updatedAt || 0) > (b.updatedAt || 0) ? a : (a.updatedAt || 0) < (b.updatedAt || 0) ? b
      : stable(a) <= stable(b) ? a : b;
  const result = Object.isFrozen(winner.challenges) ? { ...copy({ ...winner, challenges: undefined }), challenges: winner.challenges } : copy(winner);
  result.completed = Boolean(a.completed || b.completed);
  if (a.playTime || b.playTime) result.playTime = mergeCampaignPlayTime(a.playTime, b.playTime);
  if (a.beatIndex === b.beatIndex) result.beatState = mergeBeatState(a.beatState, b.beatState, winner.beatState);
  return result;
}

/** Merge only envelopes already associated with the SAME explicit learner.
 * Old cumulative targets lack immutable IDs: retain their per-target maxima,
 * never sum them. Campaign contributions are rebuilt from the event union.
 * Missing event bodies fail closed; storage must not compact these bodies
 * without implementing an acknowledged contribution ledger first.
 */
export function mergeCampaignProgress(left, right, catalog) {
  if (typeof left?.scopeKey !== 'string' || !left.scopeKey.trim() || left.scopeKey !== right?.scopeKey) {
    throw new Error('Campaign progress scope mismatch');
  }
  const a = normalizeCampaignProgress(left.progress, catalog);
  const b = normalizeCampaignProgress(right.progress, catalog);
  if (!usable(a) || !usable(b)) throw new Error('Unsupported campaign progress version');
  const aEvents = campaignEvents(a), bEvents = campaignEvents(b);
  const events = new Map(aEvents);
  for (const [key, event] of bEvents) events.set(key, earliest(events.get(key), event));
  const orderedEvents = [...events.entries()].sort(([aKey], [bKey]) => aKey < bKey ? -1 : aKey > bKey ? 1 : 0).map(([, event]) => copy(event));
  const recent = a.updatedAt > b.updatedAt ? a : a.updatedAt < b.updatedAt ? b : stable(a) <= stable(b) ? a : b;
  let merged = { ...copy(recent), targets: mergeTargets(retainedTargets(a, aEvents), retainedTargets(b, bEvents)), evidence: [] };
  for (const event of orderedEvents) {
    const previousStep = merged.journeyStep;
    merged = recordEvidence({ ...merged, journeyStep: event.journeyStep ?? previousStep }, event, event.at);
    merged.journeyStep = previousStep;
  }
  // Legacy records may have no IDs and can contain legitimate identical
  // entries. Keep the larger observed multiplicity, rather than erasing repeats
  // with a Set or adding the same shared history twice.
  for (const [id, target] of Object.entries(merged.targets)) {
    const seen = Math.max(a.targets?.[id]?.lastSeenStep ?? -1, b.targets?.[id]?.lastSeenStep ?? -1);
    target.lastSeenStep = seen < 0 ? null : seen;
  }
  const legacyEvents = new Map();
  for (const progress of [a, b]) {
    const counts = new Map();
    for (const event of progress.evidence || []) if (!eventIdentity(event)) {
      const key = stable(event);
      counts.set(key, (counts.get(key) || 0) + 1);
      const old = legacyEvents.get(key);
      legacyEvents.set(key, { event, count: Math.max(old?.count || 0, counts.get(key)) });
    }
  }
  merged.evidence = [...[...legacyEvents.entries()].sort(([x], [y]) => x < y ? -1 : x > y ? 1 : 0)
    .flatMap(([, { event, count }]) => Array.from({ length: count }, () => copy(event))), ...orderedEvents];
  const checkpoints = {};
  for (const id of ids([...Object.keys(a.campaign.checkpoints), ...Object.keys(b.campaign.checkpoints)]).sort()) {
    checkpoints[id] = mergeCheckpoint(a.campaign.checkpoints[id], b.campaign.checkpoints[id]);
  }
  const completedMissions = unionRecords(a.campaign.completedMissions, b.campaign.completedMissions);
  const previousStorySteps = Math.max(0, a.journeyStep - Object.keys(a.campaign.completedMissions).length,
    b.journeyStep - Object.keys(b.campaign.completedMissions).length);
  merged.journeyStep = previousStorySteps + Object.keys(completedMissions).length;
  merged.completed = unionRecords(a.completed, b.completed);
  merged.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  merged.campaign = { ...merged.campaign, completedMissions,
    repairs: unionRecords(a.campaign.repairs, b.campaign.repairs),
    storyAnchors: unionRecords(a.campaign.storyAnchors, b.campaign.storyAnchors),
    visitedStageIds: ids([...a.campaign.visitedStageIds, ...b.campaign.visitedStageIds]).sort(),
    startedAttemptIds: { ...a.campaign.startedAttemptIds, ...b.campaign.startedAttemptIds },
    ...(a.campaign.legacySave || b.campaign.legacySave ? { legacySave: copy(earliest(a.campaign.legacySave, b.campaign.legacySave)) } : {}),
    checkpoints, attemptIds: Object.fromEntries([...events.keys()].sort().map(key => [key, true])) };
  return { scopeKey: left.scopeKey, progress: merged };
}
