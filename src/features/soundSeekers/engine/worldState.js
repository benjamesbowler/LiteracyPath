import { getCastRelationshipBeat } from "../content/castArcs.js";
import { getBiomeKit } from "../content/biomeKits.js";
import { SOUND_SEEKERS_EXPEDITIONS, getExpedition } from "../content/expeditions.js";
import { resolveNarrativeBranchOutcome } from "../content/sceneVisualSemantics.js";
import { validContentDeckUses } from "./contentCoverage.js";
import { isSoundSeekersV2 } from "./stateV2.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function assertCampaign(campaign) {
  if (!isSoundSeekersV2(campaign)) throw new Error("world derivation needs canonical Sound Seekers state");
}

function canonicalBranchUse(campaign, sceneId) {
  const expedition = SOUND_SEEKERS_EXPEDITIONS.find(candidate => candidate.connectedTextId === sceneId);
  if (!expedition?.transfer.boss) return null;
  const uses = validContentDeckUses(campaign, "stories")
    .filter(use => use.visitOwnerId === `${expedition.stopId}-story`
      && typeof use.narrativeChoiceToken === "string")
    .sort((left, right) => right.journeyStep - left.journeyStep
      || right.transactionId.localeCompare(left.transactionId));
  return uses[0] || null;
}

export function deriveNarrativeBranchState(campaign, sceneId) {
  assertCampaign(campaign);
  const use = canonicalBranchUse(campaign, sceneId);
  if (!use) return null;
  const outcome = resolveNarrativeBranchOutcome(sceneId, use.narrativeChoiceToken);
  if (!outcome || campaign.trail.storyOutcomes?.[sceneId] !== outcome.storyOutcomeId) return null;
  return deepFreeze({
    sceneId,
    token: outcome.token,
    storyOutcomeId: outcome.storyOutcomeId,
    postDecisionSemanticId: outcome.postDecisionSemanticId
  });
}

export function deriveResidentRequest(campaign, stopId) {
  assertCampaign(campaign);
  const expedition = getExpedition(stopId);
  const beat = expedition && getCastRelationshipBeat(expedition.payoff.relationshipBeatId);
  if (!beat || !beat.callbackRepairIds.length
    || beat.callbackRepairIds.some(repairId => campaign.trail.repairs?.[repairId] !== true)
    || beat.callbackLines.some(line => campaign.trail.repairs?.[line.repairId] !== true)) return null;
  return deepFreeze({
    stopId: expedition.stopId,
    residentId: beat.residentId,
    relationshipBeatId: beat.id,
    callbackRepairIds: [...beat.callbackRepairIds],
    callbackLines: beat.callbackLines.map(line => ({ repairId: line.repairId, text: line.text }))
  });
}

export function deriveWorldState(campaign, biomeKit) {
  assertCampaign(campaign);
  if (!biomeKit || getBiomeKit(biomeKit.id) !== biomeKit) {
    throw new Error("world derivation needs a canonical biome kit");
  }
  const repairs = SOUND_SEEKERS_EXPEDITIONS
    .filter(expedition => expedition.chapterId === biomeKit.id
      && campaign.trail.completedStopIds.includes(expedition.stopId)
      && campaign.trail.repairs?.[expedition.payoff.repairId] === true)
    .map(expedition => ({
      stopId: expedition.stopId,
      repairId: expedition.payoff.repairId,
      consequenceId: expedition.payoff.consequenceId,
      relationshipBeatId: expedition.payoff.relationshipBeatId
    }));
  const storyOutcomes = Object.fromEntries(SOUND_SEEKERS_EXPEDITIONS
    .filter(expedition => expedition.chapterId === biomeKit.id)
    .map(expedition => deriveNarrativeBranchState(campaign, expedition.connectedTextId))
    .filter(Boolean)
    .map(branch => [branch.sceneId, branch]));
  return deepFreeze({
    kind: "sound_seekers_world_state",
    chapterId: biomeKit.id,
    biomeId: biomeKit.id,
    paletteTokenId: biomeKit.paletteTokenId,
    lightingTokenId: biomeKit.lightingTokenId,
    wonderEffectId: biomeKit.wonderEffectId,
    repairs,
    storyOutcomes
  });
}
