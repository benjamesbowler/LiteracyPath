import { getCastRelationshipBeat } from "../content/castArcs.js";
import { getBiomeKit } from "../content/biomeKits.js";
import { SOUND_SEEKERS_EXPEDITIONS, getExpedition } from "../content/expeditions.js";
import {
  resolveNarrativeBranchOutcome,
  resolveSceneVisualSemantic
} from "../content/sceneVisualSemantics.js";
import { SOUND_SEEKERS_CHARACTER_VISUALS } from "../visual/characterCatalog.js";
import {
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  SOUND_SEEKERS_ROUTE_SPECS,
  resolveSceneVisual,
  resolveSemanticVisual
} from "../visual/sceneVisualCatalog.js";
import { validContentDeckUses } from "./contentCoverage.js";
import { isSoundSeekersV2 } from "./stateV2.js";

const derivedWorldStates = new WeakSet();
const derivedWorldStateMetadata = new WeakMap();
const worldScenePresentations = new WeakSet();
const worldScenePresentationMetadata = new WeakMap();

const landmarkByStopId = new Map(SOUND_SEEKERS_LANDMARK_BINDINGS
  .map(landmark => [landmark.stopId, landmark]));
const routeByStopId = new Map(SOUND_SEEKERS_ROUTE_SPECS
  .map(route => [route.stopId, route]));
const characterById = new Map(SOUND_SEEKERS_CHARACTER_VISUALS
  .map(character => [character.characterId, character]));

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
  const worldState = deepFreeze({
    kind: "sound_seekers_world_state",
    chapterId: biomeKit.id,
    biomeId: biomeKit.id,
    paletteTokenId: biomeKit.paletteTokenId,
    lightingTokenId: biomeKit.lightingTokenId,
    wonderEffectId: biomeKit.wonderEffectId,
    repairs,
    storyOutcomes
  });
  derivedWorldStates.add(worldState);
  derivedWorldStateMetadata.set(worldState, Object.freeze({
    chapterId: biomeKit.id,
    biomeKit
  }));
  return worldState;
}

function requireDerivedWorldState(worldState) {
  const metadata = worldState && typeof worldState === "object"
    ? derivedWorldStateMetadata.get(worldState)
    : null;
  if (!metadata || !derivedWorldStates.has(worldState)
    || worldState.kind !== "sound_seekers_world_state"
    || worldState.chapterId !== metadata.chapterId
    || worldState.biomeId !== metadata.chapterId
    || getBiomeKit(metadata.chapterId) !== metadata.biomeKit) {
    throw new TypeError("World presentation requires an exact derived world state authority");
  }
  return metadata;
}

function canonicalWorldJoin(worldState, stopId) {
  const expedition = getExpedition(stopId);
  const landmark = expedition ? landmarkByStopId.get(expedition.stopId) : null;
  const route = expedition ? routeByStopId.get(expedition.stopId) : null;
  if (!expedition || expedition.chapterId !== worldState.chapterId) {
    throw new TypeError("World presentation stop is outside the derived chapter");
  }
  if (!landmark || !route
    || landmark.stopId !== expedition.stopId
    || route.stopId !== expedition.stopId
    || landmark.sceneId !== expedition.connectedTextId
    || landmark.chapterId !== expedition.chapterId
    || route.chapterId !== expedition.chapterId
    || landmark.repairId !== expedition.payoff.repairId) {
    throw new TypeError("World presentation canonical route and landmark join failed");
  }
  return { expedition, landmark, route };
}

function persistedLandmarkBinding(worldState, expedition, landmark) {
  const repairs = worldState.repairs.filter(repair => repair.stopId === expedition.stopId);
  if (repairs.length === 0) return null;
  if (repairs.length !== 1) {
    throw new TypeError("World presentation has conflicting persisted repairs");
  }
  const repair = repairs[0];
  if (repair.repairId !== expedition.payoff.repairId
    || repair.relationshipBeatId !== expedition.payoff.relationshipBeatId
    || repair.consequenceId !== expedition.payoff.consequenceId) {
    throw new TypeError("World presentation persisted repair is not canonical");
  }
  if (!expedition.transfer.boss) {
    const candidates = landmark.postDecisionBindings.filter(binding => (
      binding.storyOutcomeId === null
        && binding.consequenceId === repair.consequenceId
    ));
    if (candidates.length !== 1) {
      throw new TypeError("World presentation repaired landmark join failed");
    }
    return candidates[0];
  }

  const branch = worldState.storyOutcomes[landmark.sceneId];
  const candidates = landmark.postDecisionBindings.filter(binding => branch
    && branch.sceneId === landmark.sceneId
    && binding.storyOutcomeId === branch.storyOutcomeId
    && binding.postDecisionSemanticId === branch.postDecisionSemanticId);
  if (candidates.length !== 1) {
    throw new TypeError("World presentation needs the exact persisted boss branch");
  }
  return candidates[0];
}

function ordinaryCharacters(renderSpec) {
  return renderSpec.characterBindings.map(binding => {
    const visual = characterById.get(binding.characterId);
    if (!visual) throw new TypeError("World presentation character join failed");
    return {
      characterId: binding.characterId,
      pose: binding.poseByPhase.pre_choice,
      visual
    };
  });
}

export function resolveWorldScenePresentation({ worldState, stopId } = {}) {
  requireDerivedWorldState(worldState);
  const { expedition, landmark, route } = canonicalWorldJoin(worldState, stopId);
  const renderSpec = resolveSceneVisual(landmark.sceneId);
  const preChoice = renderSpec
    ? resolveSceneVisualSemantic(renderSpec.preChoiceSemanticId)
    : null;
  if (!renderSpec || renderSpec.chapterId !== expedition.chapterId
    || !preChoice || preChoice.sceneId !== landmark.sceneId
    || preChoice.chapterId !== expedition.chapterId) {
    throw new TypeError("World presentation scene semantic join failed");
  }
  const persistedBinding = persistedLandmarkBinding(worldState, expedition, landmark);
  const setting = resolveSemanticVisual(preChoice.settingId);
  const focalProps = preChoice.neutralPropIds.map(resolveSemanticVisual);
  if (!setting || focalProps.some(visual => !visual)) {
    throw new TypeError("World presentation neutral visual join failed");
  }
  const presentation = deepFreeze({
    kind: "sound_seekers_world_scene_presentation",
    stopId: expedition.stopId,
    sceneId: landmark.sceneId,
    chapterId: expedition.chapterId,
    scenePhase: "world",
    visualStateId: persistedBinding?.consequenceId ?? landmark.initialStateId,
    kitId: expedition.chapterId,
    setting,
    characters: ordinaryCharacters(renderSpec),
    focalProps,
    selectedOptionVisualId: null,
    options: [],
    meaningVisual: null,
    route,
    landmark
  });
  worldScenePresentations.add(presentation);
  worldScenePresentationMetadata.set(presentation, Object.freeze({
    worldState,
    chapterId: expedition.chapterId,
    stopId: expedition.stopId,
    sceneId: landmark.sceneId,
    visualStateId: presentation.visualStateId,
    route,
    landmark
  }));
  return presentation;
}

export function validateWorldScenePresentation(presentation, expected = {}) {
  const metadata = presentation && typeof presentation === "object"
    ? worldScenePresentationMetadata.get(presentation)
    : null;
  if (!metadata || !worldScenePresentations.has(presentation)
    || !derivedWorldStates.has(metadata.worldState)
    || presentation.kind !== "sound_seekers_world_scene_presentation"
    || presentation.chapterId !== metadata.chapterId
    || presentation.kitId !== metadata.chapterId
    || presentation.stopId !== metadata.stopId
    || presentation.sceneId !== metadata.sceneId
    || presentation.scenePhase !== "world"
    || presentation.visualStateId !== metadata.visualStateId
    || presentation.route !== metadata.route
    || presentation.landmark !== metadata.landmark
    || presentation.selectedOptionVisualId !== null
    || !Array.isArray(presentation.options) || presentation.options.length !== 0
    || presentation.meaningVisual !== null) return false;
  if (expected && typeof expected === "object") {
    if (expected.chapterId !== undefined && expected.chapterId !== metadata.chapterId) return false;
    if (expected.stopId !== undefined && expected.stopId !== metadata.stopId) return false;
    if (expected.sceneId !== undefined && expected.sceneId !== metadata.sceneId) return false;
    if (expected.stateId !== undefined && expected.stateId !== metadata.visualStateId) return false;
    if (expected.route !== undefined && expected.route !== metadata.route) return false;
    if (expected.landmark !== undefined && expected.landmark !== metadata.landmark) return false;
  }
  return true;
}
