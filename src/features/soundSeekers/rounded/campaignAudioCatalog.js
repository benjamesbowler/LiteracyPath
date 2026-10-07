import { campaignActionSound } from './campaignPlayfield.js';
import { CAMPAIGN_MISSIONS, getCampaignMission, getCampaignStage } from '../v3/content/campaign.js';
import { CAMPAIGN_STAGE_NARRATION, CAMPAIGN_FAMILY_NARRATION, CAMPAIGN_MISSION_NARRATION } from '../v3/content/campaignNarration.js';

export const CAMPAIGN_OFFLINE_AUDIO_PREFIXES = Object.freeze([
  '/audio/sound-seekers/campaign/',
  '/audio/sound-seekers/actions/',
  '/audio/phonemes/',
  '/audio/production/en-US/isolated_word/',
  '/audio/production/en-US/supplemental/',
  '/audio/production/en-US/pattern/'
]);

// Register only recorded same-origin clips explicitly referenced by the active
// authored pack. Loading a stage never downloads the entire campaign bank.
export function registerCampaignAudio(catalog, ...sources) {
  const visit = value => {
    if (typeof value === 'string' && /^\/[a-zA-Z0-9_./-]+\.(mp3|wav)$/.test(value) && !value.includes('..')) catalog[value] = value;
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  sources.forEach(visit);
  return catalog;
}

/** Warm the currently entered stage's narration or one immutable mission pack.
 * This never visits the global recording manifest or builds other missions.
 * Option replay is cached, but warming does not play audio or credit exposure.
 */
export function collectCampaignOfflineAudio({ stageId, missionId, challenges = [] } = {}) {
  const mission = getCampaignMission(missionId);
  const stage = getCampaignStage(mission?.stageId || stageId);
  if (!stage || missionId && !mission) return [];
  const urls = new Set();
  const visit = value => {
    if (typeof value === 'string') {
      if (/^\/[a-zA-Z0-9_./-]+\.(mp3|wav)$/.test(value) && !value.includes('..')
        && CAMPAIGN_OFFLINE_AUDIO_PREFIXES.some(prefix => value.startsWith(prefix))) urls.add(value);
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(CAMPAIGN_STAGE_NARRATION[stage.id]);
  const missions = mission ? [mission] : CAMPAIGN_MISSIONS.filter(item => item.stageId === stage.id);
  for (const item of missions) {
    visit(campaignActionSound(item.familyId));
    visit(CAMPAIGN_MISSION_NARRATION[item.id]);
    for (const family of item.families) {
      visit(CAMPAIGN_FAMILY_NARRATION[family]);
      visit(campaignActionSound(family));
    }
  }
  if (mission && Array.isArray(challenges)) {
    for (const beat of challenges) {
      if (beat?.missionId !== mission.id) continue;
      visit(campaignActionSound(beat.familyId));
      visit(beat.prompt);
      visit(beat.view);
      visit(beat.support);
    }
  }
  return [...urls].sort();
}
