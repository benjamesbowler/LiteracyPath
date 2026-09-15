import { CONTENT_DECK_PLACEMENT_SPECS } from "./contentDeckPlacementSpecs.js";
import { CONTENT_DECK_RECORDS } from "./contentDeckRecords.js";
import {
  SOUND_SEEKERS_EXPEDITIONS,
  validateBoundContentDecisionSource
} from "./expeditions.js";
import { HEART_WORD_RECORDS } from "./heartWordRecords.js";

export { validateBoundContentDecisionSource };

const heartBindings = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition =>
  expedition.heartWordOpportunities.map(opportunity => opportunity.contentBinding));
const sharedHeartBinding = SOUND_SEEKERS_EXPEDITIONS
  .flatMap(expedition => expedition.phases)
  .find(phase => phase.id === "s6-primary")?.contentBinding;
if (!sharedHeartBinding || HEART_WORD_RECORDS.length !== 60) {
  throw new Error("Sound Seekers heart deck authority is incomplete");
}

function nonHeartBinding(record, consumerId, visitOwnerId) {
  const slotId = record.slotIds[0];
  return Object.freeze({
    actionUseId: `${visitOwnerId}:content-use`,
    category: record.category,
    consumerId,
    contentInstanceId: `${record.category}-content-instance:${slotId}`,
    isVisitOwner: true,
    slotId,
    visitOwnerId
  });
}

const storyBindings = CONTENT_DECK_RECORDS.stories.map((record, index) =>
  nonHeartBinding(record, "story_power", `${SOUND_SEEKERS_EXPEDITIONS[index].stopId}-story`));
const alternativeBindings = CONTENT_DECK_RECORDS.alternatives.map(record => {
  const stopId = record.recordId.slice("alternative:".length);
  return nonHeartBinding(record, "contrast_sort", `${stopId}-alternative`);
});
const morphologyBindings = CONTENT_DECK_RECORDS.morphology.map(record =>
  nonHeartBinding(record, "word_forge", "s38-morphology"));
const transferBindings = CONTENT_DECK_RECORDS.transfer.map((record, index) => {
  const expedition = SOUND_SEEKERS_EXPEDITIONS[index];
  const action = expedition.phases.find(phase => phase.id === `${expedition.stopId}-transfer`);
  if (!action || action.powerId !== record.powerId) throw new Error(`${record.recordId}: transfer binding mismatch`);
  return nonHeartBinding(record, action.powerId, action.id);
});

export const CONTENT_DECK_BINDINGS = Object.freeze([
  ...heartBindings,
  sharedHeartBinding,
  ...storyBindings,
  ...alternativeBindings,
  ...morphologyBindings,
  ...transferBindings
]);

export function getContentDeckOwnerBinding(category, slotId) {
  return CONTENT_DECK_BINDINGS.find(binding => binding.category === category
    && binding.slotId === slotId && binding.isVisitOwner) || null;
}

export function getContentDeckActionBindings(category, contentInstanceId) {
  return Object.freeze(CONTENT_DECK_BINDINGS.filter(binding =>
    binding.category === category && binding.contentInstanceId === contentInstanceId));
}

export const CONTENT_DECK_PLACEMENTS = Object.freeze(CONTENT_DECK_PLACEMENT_SPECS.map(({
  placementId, category, slotId, challengeTargetIds, instructionId, powerId,
  expectedAction, recordsDomain, masteryCredit
}) => {
  const stopId = placementId.slice(0, placementId.indexOf("-"));
  const contentBinding = getContentDeckOwnerBinding(category, slotId);
  return Object.freeze({
    afterPhaseId: `${stopId}-teach`,
    category,
    challengeTargetIds: Object.freeze(challengeTargetIds),
    contentBinding,
    expectedAction,
    instructionId,
    masteryCredit,
    order: 1,
    placementId,
    powerId,
    recordsDomain,
    slotId,
    stopId
  });
}));

export function getContentDeckPlacements(stopId) {
  return Object.freeze(CONTENT_DECK_PLACEMENTS.filter(item => item.stopId === stopId)
    .sort((left, right) => left.afterPhaseId.localeCompare(right.afterPhaseId)
      || left.order - right.order || left.placementId.localeCompare(right.placementId)));
}
