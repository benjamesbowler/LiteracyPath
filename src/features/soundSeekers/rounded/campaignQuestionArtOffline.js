import { getCampaignMission } from '../v3/content/campaign.js';
import { campaignDisplayChoices, campaignSceneDescriptor } from './campaignPresentation.js';
import { campaignQuestionImage } from './campaignQuestionArt.js';
import sceneArt from './campaignSceneArt.generated.json' with {type:'json'};

// Warm one immutable active pack and the small shared banner-prop bank.
// The full question-image corpus and private answer keys are never traversed.
export function collectCampaignQuestionArt({missionId, challenges = []} = {}) {
  if (!getCampaignMission(missionId)) return [];
  const beats = challenges.filter(beat => beat.missionId === missionId);
  if (!beats.length) return [];
  const urls = new Set(Object.values(sceneArt).map(prop => prop.source));
  for (const beat of beats) {
    if (beat.view?.objectId) urls.add(campaignQuestionImage({kind:beat.view.objectId}));
    for (const choice of campaignDisplayChoices(beat)) {
      const descriptor = campaignSceneDescriptor(beat, choice);
      if (descriptor) urls.add(campaignQuestionImage(descriptor));
    }
    if(beat.mechanic==='sound_sort') urls.add(campaignQuestionImage({kind:'basket'}));
    const landscape = beat.familyId === 'lantern-search' ? 'night' : ['sound-steps','rescue-bridge','river-route'].includes(beat.familyId) ? 'river' : 'day';
    urls.add(`/game-assets/sound-seekers/question-art/landscape-${landscape}.webp`);
  }
  return [...urls].filter(Boolean).sort();
}
