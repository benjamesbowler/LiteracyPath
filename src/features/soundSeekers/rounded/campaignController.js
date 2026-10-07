import { prepareCampaignLearningRecovery } from "./campaignLearningResponse.js";
import { CAMPAIGN_VERSION, CAMPAIGN_STAGES, CAMPAIGN_MISSIONS, getCampaignMission } from '../v3/content/campaign.js';
import { buildCampaignMission, createCampaignBeatState, resolveCampaignAction } from '../v3/engine/campaignChallenges.js';
import { beginCampaignMission, restartCampaignMission, updateCampaignCheckpoint, recordCampaignEvidence, completeCampaignMission, isCampaignStageUnlocked } from '../v3/engine/campaignProgress.js';
import { recordTaught } from '../v3/engine/progress.js';
import { MECHANICS } from '../v3/engine/challenges.js';
import { getCampaignWorldLayout } from './campaignWorldLayouts.js';

export const ROUND_CAMPAIGN = Object.freeze({ version: CAMPAIGN_VERSION, stages: CAMPAIGN_STAGES, missions: CAMPAIGN_MISSIONS });
export function currentCampaignCheckpoint(progress) {
  return progress?.campaign?.checkpoints?.[progress.campaign.activeMissionId] || null;
}
export function currentCampaignBeat(progress) {
  const checkpoint = currentCampaignCheckpoint(progress);
  return checkpoint && !checkpoint.completed ? checkpoint.challenges[checkpoint.beatIndex] || null : null;
}
export function campaignResumeStage(progress) {
  const active = getCampaignMission(progress?.campaign?.activeMissionId)?.stageId;
  const saved = progress?.campaign?.currentStageId;
  return [active, saved, CAMPAIGN_STAGES[0].id].find(id => id && isCampaignStageUnlocked(progress, id, ROUND_CAMPAIGN));
}
export function enterCampaignStage(progress, stageId, now) {
  if (!isCampaignStageUnlocked(progress, stageId, ROUND_CAMPAIGN)) return progress;
  return { ...progress, updatedAt: now, campaign: { ...progress.campaign, currentStageId: stageId, activeMissionId: null } };
}
export function recordRoundedDiscovery(progress, event, now) {
  if (!progress || !isCampaignStageUnlocked(progress, event?.stageId, ROUND_CAMPAIGN)) return progress;
  const authored = getCampaignWorldLayout(event.stageId)?.discoveries.find(item => item.id === event.id && item.kind === event.kind);
  if (!authored) return progress;
  const id = `${event.stageId}:${event.id}`;
  if (progress.campaign.gameDiscoveries?.[id]) return progress;
  return { ...progress, updatedAt: now, campaign: { ...progress.campaign, gameDiscoveries: {
    ...progress.campaign.gameDiscoveries, [id]: { stageId: event.stageId, id: event.id, kind: event.kind, at: now, narrativeOnly: true }
  } } };
}
export function recordRoundedInventory(progress, { stageId, carryingId } = {}, now) {
  if (!progress || !isCampaignStageUnlocked(progress, stageId, ROUND_CAMPAIGN)) return progress;
  if (carryingId !== null && !getCampaignWorldLayout(stageId)?.discoveries.some(item => item.id === carryingId && item.kind === 'carry')) return progress;
  if ((progress.campaign.gameInventory?.[stageId]?.carryingId || null) === carryingId) return progress;
  return { ...progress, updatedAt: now, campaign: { ...progress.campaign, gameInventory: {
    ...progress.campaign.gameInventory, [stageId]: { stageId, carryingId, at: now, narrativeOnly: true }
  } } };
}
export function startRoundedMission(progress, missionId, { attemptId, now, replay = false, position } = {}) {
  const mission = getCampaignMission(missionId);
  if (!mission) return progress;
  const previous = progress.campaign.checkpoints[missionId];
  if (previous && !previous.completed) return beginCampaignMission(progress, missionId, null, ROUND_CAMPAIGN, now);
  if (previous?.completed && !replay) return progress;
  const pack = buildCampaignMission(mission, progress, { replayOrdinal: replay ? (previous?.replayOrdinal || 0) + 1 : 0 });
  const checkpoint = { attemptId, challenges: pack.beats, beatState: createCampaignBeatState(pack.beats[0]), ...(position ? { position } : {}) };
  const next = replay ? restartCampaignMission(progress, missionId, checkpoint, ROUND_CAMPAIGN, now)
    : beginCampaignMission(progress, missionId, checkpoint, ROUND_CAMPAIGN, now);
  if (next === progress) return progress;
  return { ...next, campaign: { ...next.campaign, currentStageId: mission.stageId } };
}

function actionIsAvailable(beat, state, action) {
  if (!action || typeof action.type !== 'string' || state.done) return false;
  if (['REQUEST_MODEL', 'REQUEST_TEXT_SUPPORT', 'PICTURE_CUE_SHOWN', 'PLAYFIELD'].includes(action.type)) return true;
  if (action.type === 'HEARD_CARD') return beat.mechanic === MECHANICS.SIGNPOST && beat.view.cards.some(card => card.targetId === action.targetId);
  if (action.type === 'FINISH') return beat.mechanic === MECHANICS.SIGNPOST && beat.view.cards.every(card => state.cardsHeard.includes(card.targetId));
  if (action.type === 'REMOVE_LAST') return Array.isArray(state.placed) && state.placed.length > 0;
  if (action.type === 'PLACE_TILE') return beat.view.tiles?.some(tile => tile.id === action.tileId);
  if (action.type === 'PLACE') return beat.view.items?.[state.itemIndex]?.id === action.itemId && beat.view.bins?.some(bin => bin.id === action.binId);
  if (action.type === 'CHOOSE') {
    const choices = beat.view.choices || beat.view.options || beat.view.keys || [];
    return choices.some(choice => choice.id === (action.choiceId || action.optionId || action.keyId));
  }
  return false;
}

/** Only this controller receives private keys. Input, support and actual cue
 * delivery share the immutable saved attempt. Scene motion has no authority. */
export function judgeRoundedAction(progress, action, now) {
  const checkpoint = currentCampaignCheckpoint(progress), beat = currentCampaignBeat(progress);
  if (beat && action?.type === 'HEARD_PROMPT' && !checkpoint.beatState.done) {
    return { progress: updateCampaignCheckpoint(progress, checkpoint.missionId, { attemptId: checkpoint.attemptId, beatState: { ...checkpoint.beatState, heard: true, actionRevision: (checkpoint.beatState.actionRevision || 0) + 1 } }, now), outcome: { type: 'heard' } };
  }
  if (!beat || checkpoint.beatState.learningRecovery || !actionIsAvailable(beat, checkpoint.beatState, action)) return { progress, outcome: { type: 'ignored' } };
  const result = resolveCampaignAction(beat, checkpoint.beatState, action);
  if (result.outcome.type === 'ignored') return { progress, outcome: result.outcome };
  let next = progress;
  if (result.outcome.evidence) {
    const reading = ['word_decoding', 'connected_text_transfer', 'spelling_pattern_sort', 'grapheme_to_phoneme'].includes(beat.domain)
      || beat.mechanic === MECHANICS.SOUND_SORT && beat.view.mode === 'read';
    const unheard = !reading && beat.prompt.cues.length > 0 && !checkpoint.beatState.heard;
    next = recordCampaignEvidence(next, checkpoint.missionId, {
      ...result.outcome.evidence,
      ...(unheard ? { independent: false, audioSupport: true, supportUsed: [...result.outcome.evidence.supportUsed, 'unheard-prompt'] } : {}),
      id: `${beat.id}:${result.outcome.itemId || 'response'}`,
      attemptId: checkpoint.attemptId,
    }, ROUND_CAMPAIGN, now);
  }
  if (result.outcome.taught) next = recordTaught(next, result.outcome.taught, now);
  let nextState = beat.mechanic === MECHANICS.SOUND_SORT && result.state.itemIndex !== checkpoint.beatState.itemIndex
    ? { ...result.state, heard: false } : result.state;
  if (result.outcome.type === 'incorrect' || ['REQUEST_MODEL', 'REQUEST_TEXT_SUPPORT'].includes(action.type) && beat.mechanic !== MECHANICS.SIGNPOST) {
    const recovery = prepareCampaignLearningRecovery(progress, action);
    if (recovery) nextState = { ...nextState, learningRecovery: recovery };
  }
  next = updateCampaignCheckpoint(next, checkpoint.missionId, { attemptId: checkpoint.attemptId, beatState: { ...nextState, actionRevision: (checkpoint.beatState.actionRevision || 0) + 1 } }, now);
  return { progress: next, outcome: result.outcome };
}
export function advanceRoundedMission(progress, now) {
  const checkpoint = currentCampaignCheckpoint(progress);
  if (!checkpoint || checkpoint.completed || !checkpoint.beatState.done) return progress;
  const beatIndex = checkpoint.beatIndex + 1;
  const nextBeat = checkpoint.challenges[beatIndex];
  const next = updateCampaignCheckpoint(progress, checkpoint.missionId, {
    attemptId: checkpoint.attemptId, beatIndex,
    beatState: nextBeat ? createCampaignBeatState(nextBeat) : checkpoint.beatState,
  }, now);
  if (nextBeat && checkpoint.beatState.learningResponses?.at(-1)?.completion?.unresolved) {
    const recovery = prepareCampaignLearningRecovery(next, { type: 'MODEL_NEXT' });
    if (recovery) return updateCampaignCheckpoint(next, checkpoint.missionId, { attemptId: checkpoint.attemptId, beatState: { ...currentCampaignCheckpoint(next).beatState, learningRecovery: recovery } }, now);
  }
  return nextBeat ? next : completeCampaignMission(next, checkpoint.missionId, ROUND_CAMPAIGN, now);
}
export function roundedPosition(snapshot) {
  return { v: 1, x: snapshot.x, y: snapshot.z, vx: 0, vy: 0, facing: 1, recoveries: 0, lastCheckpointId: `rounded3d:${snapshot.stageId}` };
}
export function restoreRoundedPosition(position, stageId) {
  return position?.v === 1 && position.lastCheckpointId === `rounded3d:${stageId}` && Number.isFinite(position.x) && Number.isFinite(position.y)
    ? { x: position.x, z: position.y } : null;
}
