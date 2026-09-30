import { CAMPAIGN_VERSION, CAMPAIGN_STAGES, CAMPAIGN_MISSIONS, getCampaignMission, getCampaignStage } from '../v3/content/campaign.js';
import { isCampaignMissionUnlocked, isCampaignStageUnlocked } from '../v3/engine/campaignProgress.js';

export const CAMPAIGN_PROGRESS_ROW = 'sound_seekers_v3';
// This projection never downloads a private challenge, answer, target ledger or
// per-response body into the teacher dashboard. Challenge transport may change
// without changing these canonical JSON fields.
export const CAMPAIGN_PARTICIPATION_SELECT = 'student_id, key, progressVersion:payload->v, campaignVersion:payload->campaign->v, completedMissions:payload->campaign->completedMissions, attemptIds:payload->campaign->attemptIds, participation:payload->campaign->participation, currentStageId:payload->campaign->currentStageId';

const catalog = { version: CAMPAIGN_VERSION, stages: CAMPAIGN_STAGES, missions: CAMPAIGN_MISSIONS };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value || {}, key);
const main = CAMPAIGN_MISSIONS.filter(mission => mission.kind === 'main');
const optional = CAMPAIGN_MISSIONS.filter(mission => mission.kind === 'optional');
const totals = { totalMissions: main.length, totalOptionalMissions: optional.length, totalStages: CAMPAIGN_STAGES.length };
const completed = (saved, id) => own(saved, id) && record(saved[id]);
function completionSummary(saved = {}) {
  return {
    ...totals,
    missionsCompleted: main.filter(mission => completed(saved, mission.id)).length,
    optionalMissionsCompleted: optional.filter(mission => completed(saved, mission.id)).length,
    stagesCompleted: CAMPAIGN_STAGES.filter(stage => stage.missionIds.every(id => completed(saved, id))).length
  };
}
const validReceipt = key => {
  try {
    const ids = JSON.parse(key);
    return Array.isArray(ids) && ids.length === 3 && ids.every(id => typeof id === 'string' && id.length > 0)
      && Boolean(getCampaignMission(ids[0]));
  } catch { return false; }
};
function dateMs(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value))) return null;
  const ms = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) && ms > 0 && ms <= 8.64e15 ? ms : null;
}

/** The authenticated cloud copy stores only this derived cache. Its dates come
 * from actual formative responses, never settings, movement or sync timestamps.
 * The deployed merge unions receipts but selects unknown cache fields from one
 * snapshot: this cache can remain stale until a merged learner save is queued.
 */
export function campaignParticipationCache(progress) {
  const events = new Map();
  for (const event of Array.isArray(progress?.evidence) ? progress.evidence : []) {
    if (event?.kind !== 'practice' || event.evidenceType !== 'formative') continue;
    const key = JSON.stringify([event.missionId, event.attemptId, event.id]);
    if (!validReceipt(key)) continue;
    const at = dateMs(event.at);
    // Duplicate delivery cannot add a response or move its original date.
    if (!events.has(key) || at !== null && (events.get(key) === null || at < events.get(key))) events.set(key, at);
  }
  const last = [...events.values()].reduce((latest, at) => Math.max(latest, at || 0), 0);
  return { v: 1, attempts: events.size, lastAnsweredAt: last ? new Date(last).toISOString() : '' };
}

/** Home is narrative practice guidance. Historical s1–s40 teaching anchors and
 * optional quests never complete or gate the thirty main stages.
 */
export function campaignHomeSummary(progress) {
  if (progress?.v !== 3 || progress?.campaign?.v !== 1 || !record(progress.campaign.completedMissions)) {
    return { practiceOnly: true, available: false, status: 'unavailable', ...totals, next: null };
  }
  const campaign = progress.campaign;
  const counts = completionSummary(campaign.completedMissions);
  const active = getCampaignMission(campaign.activeMissionId);
  const checkpoint = campaign.checkpoints?.[active?.id];
  const resume = Boolean(active && record(checkpoint) && checkpoint.completed === false
    && isCampaignMissionUnlocked(progress, active.id, catalog));
  const stage = (resume && getCampaignStage(active.stageId))
    || (isCampaignStageUnlocked(progress, campaign.currentStageId, catalog) && getCampaignStage(campaign.currentStageId))
    || CAMPAIGN_STAGES.find(item => isCampaignStageUnlocked(progress, item.id, catalog)
      && item.missionIds.some(id => !completed(campaign.completedMissions, id)))
    || CAMPAIGN_STAGES[0];
  const nextMission = resume ? active : CAMPAIGN_MISSIONS.find(mission => mission.stageId === stage.id
    && mission.kind === 'main' && !completed(campaign.completedMissions, mission.id)
    && isCampaignMissionUnlocked(progress, mission.id, catalog));
  return {
    practiceOnly: true, available: true, ...counts,
    status: counts.missionsCompleted === totals.totalMissions ? 'complete' : resume ? 'resume' : 'explore',
    started: Object.keys(campaign.checkpoints || {}).length > 0 || counts.missionsCompleted > 0 || counts.optionalMissionsCompleted > 0,
    activeMissionId: resume ? active.id : null,
    currentStageId: stage.id, stageName: stage.name,
    next: { stageId: stage.id, stageName: stage.name, missionId: nextMission?.id || null,
      label: nextMission?.title || stage.name, action: resume ? 'resume' : 'explore', resume }
  };
}

/** Consume only the teacher projection above. Receipt unions supply known
 * response totals; an older cache cannot invent dates for unseen responses.
 * No narrative repair or response count is an assessment/mastery conclusion.
 */
export function campaignParticipationSummary(projection) {
  if (projection?.progressVersion !== 3 || projection?.campaignVersion !== 1
    || !record(projection.completedMissions) || !record(projection.attemptIds)) return null;
  const attempts = Object.entries(projection.attemptIds).filter(([key, value]) => value === true && validReceipt(key)).length;
  const cache = projection.participation;
  const validCache = cache?.v === 1 && Number.isSafeInteger(cache.attempts) && cache.attempts >= 0 && cache.attempts <= attempts;
  const at = validCache && cache.attempts > 0 ? dateMs(cache.lastAnsweredAt) : null;
  return {
    practiceOnly: true, label: 'Campaign practice', ...completionSummary(projection.completedMissions), attempts,
    currentStageId: getCampaignStage(projection.currentStageId)?.id || null,
    lastActiveAt: at !== null ? new Date(at).toISOString() : '',
    lastActivityLabel: 'Last reported practice answer',
    activityDateScope: 'last-reported-formative-answer',
    participationCacheCurrent: Boolean(validCache && cache.attempts === attempts)
  };
}
