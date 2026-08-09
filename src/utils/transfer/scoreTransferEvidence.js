import { skillBlueprints } from "../../content/blueprints/skillBlueprints.js";

export function createTransferEvidencePayload({mission,itemResults,supportState="none",mechanicRehearsalCompleted}) {
  const blueprint=skillBlueprints[mission?.targetKey];
  const formats=new Set(Object.values(blueprint?.formatsByLevel||{}).flat());
  if(!mission?.context||!mission?.targetKey||!mission?.contentVersion)throw new Error("Transfer evidence requires context, target, and content version.");
  if(!formats.has(mission.responseFormat))throw new Error("Mission format is not permitted by the skill blueprint.");
  if(!mechanicRehearsalCompleted)throw new Error("The non-scored mechanic rehearsal is required.");
  if(!Array.isArray(itemResults)||itemResults.length!==mission.items.length)throw new Error("Every mission item needs an evidence state.");
  return Object.freeze({schemaVersion:1,missionId:mission.id,context:mission.context,targetKey:mission.targetKey,responseFormat:mission.responseFormat,evidenceUnit:mission.evidenceUnit,supportState,mechanicRehearsalCompleted:true,itemResults:Object.freeze(itemResults.map(result=>Object.freeze({itemId:result.itemId,state:result.state,response:result.response}))),contentVersion:mission.contentVersion,purpose:"transfer_separate_from_mastery",masteryEligible:false});
}
