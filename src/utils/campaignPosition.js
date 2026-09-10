import { mergeCampaignPlayTime } from '../features/soundSeekers/v3/engine/campaignPlayTime.js';
export const campaignPositionKey = canonicalKey => `${canonicalKey}:position-v1`;
export function applyCampaignPositions(progress, journal) {
  if (!journal) return progress;
  if(journal.v!==1||!journal.positions||typeof journal.positions!=='object'||Array.isArray(journal.positions))throw new Error('unreadable');
  const checkpoints={...progress.campaign.checkpoints};let updatedAt=progress.updatedAt;
  for(const [id,p] of Object.entries(journal.positions)) {
    if(!p||typeof p.attemptId!=='string'||!Number.isFinite(p.updatedAt)||!Number.isSafeInteger(p.beatIndex))throw new Error('unreadable');
    const pos=p.position;
    if(pos&&(!['x','y','vx','vy','facing','recoveries'].every(k=>Number.isFinite(pos[k]))||pos.v!==1||![-1,1].includes(pos.facing)||!Number.isSafeInteger(pos.recoveries)||pos.recoveries<0||(pos.lastCheckpointId!==null&&typeof pos.lastCheckpointId!=='string')))throw new Error('unreadable');
    const t=p.playTime;
    if(t&&(t.v!==1||![t.estimatedActiveMs,t.estimatedHelpMs].every(n=>Number.isSafeInteger(n)&&n>=0)||t.estimatedHelpMs>t.estimatedActiveMs))throw new Error('unreadable');
    const cp=checkpoints[id];if(!cp||cp.attemptId!==p.attemptId)continue;
    const current=cp.beatIndex===p.beatIndex&&!cp.completed&&p.updatedAt>=(cp.updatedAt||0);
    checkpoints[id]={...cp,playTime:mergeCampaignPlayTime(cp.playTime,p.playTime),...(current?{position:pos,updatedAt:p.updatedAt}:{})};
    updatedAt=Math.max(updatedAt,p.updatedAt);
  }
  return {...progress,updatedAt,campaign:{...progress.campaign,checkpoints}};
}
