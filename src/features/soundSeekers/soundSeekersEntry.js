import { currentAct } from '../../../demos/sound-seekers/src/chapter/progress.js';
import { CAMPAIGN_MISSIONS, getCampaignMission } from './v3/content/campaign.js';

const MAIN_MISSION_COUNT = CAMPAIGN_MISSIONS.filter(mission => mission.kind === 'main').length;

export function woodlandReturn({ status, progress }) {
  if (status === 'unavailable') return { status, label: 'Woodland save unavailable' };
  if (progress?.complete) return {
    status: 'finished', label: 'Play Woodland Homecoming again', lastPlayedAt: Date.parse(progress.updatedAt)
  };
  const played = progress && (progress.attempts || progress.seconds || progress.fireflies.length
    || progress.mode !== 'explore' || Object.values(progress.jobs).some(job => job.act > 0 || job.round > 0));
  if (!played) return { status: 'fresh', label: 'Woodland Homecoming' };
  return {
    status: 'continue',
    label: 'Continue Woodland Homecoming',
    detail: currentAct(progress).title,
    lastPlayedAt: Date.parse(progress.updatedAt)
  };
}

export function campaignReturn({ blocked, stageName, progress, activeMission }) {
  if (blocked) return { status: 'unavailable', label: 'Start exploring' };
  const lastPlayedAt = progress.updatedAt;
  const completedMain = Object.keys(progress.campaign.completedMissions)
    .filter(id => getCampaignMission(id)?.kind === 'main').length;
  if (completedMain === MAIN_MISSION_COUNT && !activeMission) {
    return { status: 'finished', label: 'Visit your Pals', detail: stageName, lastPlayedAt };
  }
  if (activeMission) return { status: 'continue', label: 'Carry on', detail: activeMission.title, lastPlayedAt };
  const savedPlace = Number.isFinite(lastPlayedAt) && lastPlayedAt > 0
    && (progress.campaign.currentStageId || completedMain > 0
      || Object.keys(progress.campaign.gameDiscoveries).length > 0);
  return savedPlace
    ? { status: 'continue', label: `Back to ${stageName}`, lastPlayedAt }
    : { status: 'fresh', label: 'Start exploring' };
}

export function shouldLeadWithWoodland(campaign, woodland) {
  const played = choice => choice.status === 'continue' || choice.status === 'finished';
  if (!woodland || !played(woodland)) return false;
  return !played(campaign) || (Number.isFinite(woodland.lastPlayedAt)
    && (!Number.isFinite(campaign.lastPlayedAt) || woodland.lastPlayedAt > campaign.lastPlayedAt));
}
