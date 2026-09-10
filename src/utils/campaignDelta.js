// ACK state is memory-only and scoped to a confirmed save endpoint/session.
// Durable queues always retain the complete lossless save for retries/reloads.
const equal=(a,b)=>a===b||JSON.stringify(a)===JSON.stringify(b);
const eventKey=e=>e?.missionId&&e?.attemptId&&e?.id?JSON.stringify([e.missionId,e.attemptId,e.id]):null;
const changedRecords=(next={},previous={})=>Object.fromEntries(Object.entries(next).filter(([key,value])=>!equal(value,previous[key])));
function counts(events,id){const out={independent:0,supported:0,missed:0,confusions:{}};for(const e of events){if(!e.targetIds?.includes(id))continue;const field=e.independent?'independent':'supported';out[field]++;if(e.errors>0)out.missed++;if(field==='supported'&&e.confusedWith)out.confusions[e.confusedWith]=(out.confusions[e.confusedWith]||0)+1;}return out;}
export function campaignDeltaFromAck(next,ack) {
  if(next?.v!==3||next?.campaign?.v!==1||ack?.v!==3||ack?.campaign?.v!==1)return next;
  const known=new Map((ack.evidence||[]).map(e=>[eventKey(e),e]));
  const evidence=(next.evidence||[]).filter(e=>!eventKey(e)||!equal(known.get(eventKey(e)),e));
  const identified=(next.evidence||[]).filter(eventKey), newIdentified=evidence.filter(eventKey);
  const targets=changedRecords(next.targets,ack.targets);
  // The server derives total counters from unioned immutable evidence. Sparse
  // targets must carry retained baseline + THIS delta's counts, never totals.
  for(const [id,target]of Object.entries(targets)){
    const all=counts(identified,id),part=counts(newIdentified,id),out={...target,confusions:{}};
    for(const k of ['independent','supported','missed'])out[k]=Math.max(0,(target[k]||0)-all[k])+part[k];
    for(const k of new Set([...Object.keys(target.confusions||{}),...Object.keys(part.confusions)]))out.confusions[k]=Math.max(0,(target.confusions?.[k]||0)-(all.confusions[k]||0))+(part.confusions[k]||0);
    targets[id]=out;
  }
  const campaign={...next.campaign};
  for(const key of ['checkpoints','completedMissions','repairs','storyAnchors','startedAttemptIds'])campaign[key]=changedRecords(campaign[key],ack.campaign[key]);
  campaign.attemptIds=Object.fromEntries(newIdentified.map(e=>[eventKey(e),true]));
  delete campaign.legacySave;delete campaign.legacySaves;
  return {...next,evidence,targets,completed:changedRecords(next.completed,ack.completed),campaign,
    _campaignDelta:{v:1,fullCompletionCount:Object.keys(next.campaign.completedMissions||{}).length}};
}
export function createCampaignAckTracker(){
  const acknowledgements=new Map();
  return {prepare:(scope,payload)=>campaignDeltaFromAck(payload,acknowledgements.get(scope)),acknowledge:(scope,payload)=>acknowledgements.set(scope,payload),forget:scope=>acknowledgements.delete(scope),clear:()=>acknowledgements.clear()};
}
