// Deliberately synthetic starting positions for the isolated preview entry.
// Never imported by the child route or used as learning evidence.
import { CAMPAIGN_VERSION,CAMPAIGN_STAGES,CAMPAIGN_MISSIONS } from '../v3/content/campaign.js';
import { normalizeCampaignProgress } from '../v3/engine/campaignProgress.js';
import { recordTaught } from '../v3/engine/progress.js';

export function createCampaignPreviewProgress(stageId='meadow-01') {
  const index=CAMPAIGN_STAGES.findIndex(stage=>stage.id===stageId);
  if(index<0)throw new RangeError(`Unknown campaign stage: ${stageId}`);
  const catalog={version:CAMPAIGN_VERSION,stages:CAMPAIGN_STAGES,missions:CAMPAIGN_MISSIONS};
  let progress=normalizeCampaignProgress(null,catalog);
  for(const stage of CAMPAIGN_STAGES.slice(0,index)){
    for(const id of stage.missionIds){
      const mission=CAMPAIGN_MISSIONS.find(m=>m.id===id);
      progress=recordTaught(progress,mission.curriculum.targetIds||[]);
      progress.campaign.completedMissions[id]={at:0,previewFixture:true};
    }
  }
  progress.campaign.visitedStageIds=[stageId];
  progress.campaign.currentStageId=stageId;
  progress.previewFixture={synthetic:true,stageId};
  return progress;
}
