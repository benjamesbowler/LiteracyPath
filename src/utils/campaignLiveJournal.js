// One bounded active-mission journal overlays an immutable canonical snapshot.
// Mission changes compact it; movement has its own smaller position journal.
export const campaignLiveKey = canonical => `${canonical}:live-v1`;
export function campaignBaseSignature(bytes){let a=2166136261,b=5381;for(let i=0;i<bytes.length;i++){const n=bytes.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b,33)^n;}return `${bytes.length}:${a>>>0}:${b>>>0}`;}
const mapDiff=(a={},b={})=>Object.fromEntries(Object.entries(b).filter(([k,v])=>a[k]!==v));
export function buildCampaignLiveJournal(base,next,signature){
  if(base.evidence.length>next.evidence.length||!base.evidence.every((e,i)=>e===next.evidence[i]))throw new Error('unsupported journal history');
  const top={...next};delete top.evidence;delete top.campaign;delete top.targets;
  const campaign={...next.campaign};
  for(const key of ['checkpoints','completedMissions','repairs','attemptIds','startedAttemptIds','storyAnchors'])campaign[key]=mapDiff(base.campaign[key],next.campaign[key]);
  campaign.checkpoints=Object.fromEntries(Object.entries(campaign.checkpoints).map(([id,cp])=>{if(cp.challenges!==base.campaign.checkpoints[id]?.challenges)throw new Error('unsupported journal challenge');const mutable={...cp};delete mutable.challenges;return[id,mutable];}));
  delete campaign.legacySave;delete campaign.legacySaves;
  return {v:1,baseSignature:signature,top,targets:mapDiff(base.targets,next.targets),campaign,evidence:next.evidence.slice(base.evidence.length)};
}
export function applyCampaignLiveJournal(base,journal,signature){
  if(!journal)return base;
  if(journal.top?.v!==3||journal.campaign?.v!==1||journal.v!==1||journal.baseSignature!==signature||!Array.isArray(journal.evidence)||!journal.campaign||!journal.top||!journal.targets)throw new Error('unreadable');
  const campaign={...base.campaign,...journal.campaign};
  for(const key of ['checkpoints','completedMissions','repairs','attemptIds','startedAttemptIds','storyAnchors'])campaign[key]={...base.campaign[key],...journal.campaign[key]};
  for(const [id,cp]of Object.entries(journal.campaign.checkpoints||{})){const previous=base.campaign.checkpoints[id];if(!previous||previous.attemptId!==cp.attemptId)throw new Error('unreadable');campaign.checkpoints[id]={...cp,challenges:previous.challenges};}
  return {...base,...journal.top,targets:{...base.targets,...journal.targets},campaign,evidence:[...base.evidence,...journal.evidence]};
}
