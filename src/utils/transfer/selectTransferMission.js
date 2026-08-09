import { TRANSFER_WORKLOAD_POLICY } from "../../content/transfer/transferContextPolicy.js";

export function selectTransferMission({candidateMissions=[],taughtTargetKeys=[],completedMissionIds=[],supportedFormats=[],offeredToday=0,recentContexts=[]}) {
  if(offeredToday>=TRANSFER_WORKLOAD_POLICY.maxOffersPerDay)return null;
  const taught=new Set(taughtTargetKeys),completed=new Set(completedMissionIds),formats=new Set(supportedFormats);
  const eligible=candidateMissions.filter(mission=>mission.prerequisiteKeys.every(key=>taught.has(key))&&formats.has(mission.responseFormat)&&!completed.has(mission.id)&&mission.review?.status==="approved");
  return eligible.find(mission=>!recentContexts.includes(mission.context))||eligible[0]||null;
}
