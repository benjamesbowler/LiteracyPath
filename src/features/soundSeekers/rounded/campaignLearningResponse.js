import { selectFreshLearningTransfer, createLearningResponseEpisode, commitLearningResponse, startLearningWithModel } from '../../../utils/learningResponseState.js';
import { buildCampaignMission, campaignTextSupport, createCampaignBeatState, resolveCampaignAction } from '../v3/engine/campaignChallenges.js';
import { recordCampaignEvidence, updateCampaignCheckpoint } from '../v3/engine/campaignProgress.js';
import { campaignDisplayChoices, campaignSceneDescriptor } from './campaignPresentation.js';
import { currentCampaignBeat, currentCampaignCheckpoint, ROUND_CAMPAIGN } from './campaignController.js';
import { getCampaignMission } from '../v3/content/campaign.js';
import { campaignInstructionPlan } from '../v3/engine/campaignInstructions.js';

export function campaignLearningTask(beat, state = {}) {
  const choices = campaignDisplayChoices(beat, state);
  if (!choices.length || beat.mechanic === 'sound_signpost') return null;
  const build = ['word_forge', 'sentence_build'].includes(beat.mechanic);
  const item = beat.mechanic === 'sound_sort' ? beat.view.items[state.itemIndex || 0] : null;
  const expected = build ? beat.key.sequence : item ? beat.key.bins[item.id] : beat.key.choiceId || beat.key.optionId || beat.key.keyId;
  if (expected === undefined) return null;
  const id = `${beat.id}:${item?.id || 'response'}`;
  return { question: { id, formatType: `${beat.mechanic}:${beat.domain}`, construct: beat.supportContext?.construct || beat.domain,
    mechanicId: build ? 'wordBuild' : beat.mechanic, word: item?.word || beat.key.word || beat.key.supportText || beat.view.target?.grapheme || beat.targetIds?.join(' '),
    sentence: beat.mechanic === 'sentence_build' ? beat.key.supportText : undefined,
    prompt: beat.prompt.text, image: item?.image || beat.view.image, targetDisplay: beat.view.workshop?.baseWord, baseWord: beat.view.workshop?.baseWord, hideEncodingTarget: beat.mechanic === 'word_forge',
    answerOptions: choices.map((choice, index) => ({ id: choice.id, label: campaignSceneDescriptor(beat, choice)?.label || choice.label || `Sound ${index + 1}`, audio: choice.audio })),
    authoredBeat: beat, authoredState: Object.fromEntries(['beatId','mechanic','placed','itemIndex','heard','modelShown','errors','slotErrors','supportUsed','cardsHeard','phase','wordUnits'].filter(key => state[key] !== undefined).map(key => [key, state[key]])), explanation: campaignTextSupport(beat, state) }, expected };
}
export function prepareCampaignLearningRecovery(progress, action) {
  const cp = currentCampaignCheckpoint(progress), beat = currentCampaignBeat(progress), state = cp.beatState;
  const task = campaignLearningTask(beat, state);
  if (!task) return null;
  const selected = action.tileId || action.binId || action.choiceId || action.optionId || action.keyId;
  const selectedResponse = Array.isArray(task.expected) ? [...(state.placed || []), selected] : selected;
  let candidates = [];
  try {
    candidates = buildCampaignMission(getCampaignMission(cp.missionId), progress, { replayOrdinal: (cp.replayOrdinal || 0) + 1 }).beats
      .flatMap(candidate => candidate.mechanic === 'sound_sort' ? candidate.view.items.map((_, itemIndex) => campaignLearningTask(candidate, { ...createCampaignBeatState(candidate), itemIndex })) : [campaignLearningTask(candidate, createCampaignBeatState(candidate))]).filter(Boolean);
  } catch { /* No eligible reserve is a disclosed supported finish, never a fabricated item. */ }
  const seen = cp.beatState.learningResponses || [];
  const used = seen.flatMap(episode => [episode.firstQuestion, episode.transfer?.question].filter(Boolean));
  const eligible = candidates.filter(candidate => !used.some(question => question.word === candidate.question.word && question.formatType === candidate.question.formatType));
  const transferQuestion = selectFreshLearningTransfer(task.question, eligible.map(candidate => candidate.question));
  const transfer = eligible.find(candidate => candidate.question.id === transferQuestion?.id) || null;
  const id = `${cp.attemptId}:learning:${task.question.id}`;
  const created = createLearningResponseEpisode({ id, instrument: 'sound_seekers_campaign', slotId: task.question.id, ...task, transfer });
  const episode = action.type === 'MODEL_NEXT' ? startLearningWithModel(created) : commitLearningResponse(created, {
    selected: selectedResponse ?? null, correct: selected ? false : null, responseStatus: selected ? 'answered' : 'supported', supported: true,
    supportUsed: [...state.supportUsed, ...(selected ? [] : ['requested_model'])], media: { targetDelivery: state.heard ? 'delivered' : 'not_played' } });
  return { id, ...task, transfer, selected: selectedResponse ?? null, task: { episode, draft: state.placed || [], delivery: state.heard ? 'delivered' : 'not_played' } };
}
export function saveCampaignLearningTask(progress, task, now) {
  const cp = currentCampaignCheckpoint(progress), recovery = cp?.beatState.learningRecovery;
  if (!recovery || task.episode.id !== recovery.id) return progress;
  let next = progress;
  const last = task.episode.events.at(-1);
  if (last) next = recordCampaignEvidence(next, cp.missionId, { id: `${recovery.id}:transition:${task.episode.events.length}`, attemptId: cp.attemptId,
    targetIds: currentCampaignBeat(progress).targetIds, independent: false, supportUsed: ['learning-response'], learningEpisode: task.episode,
    firstResponse: task.episode.firstResponse, evidenceUse: 'supported_practice', errors: cp.beatState.errors }, ROUND_CAMPAIGN, now);
  return updateCampaignCheckpoint(next, cp.missionId, { attemptId: cp.attemptId,
    beatState: { ...cp.beatState, learningRecovery: { ...recovery, task }, actionRevision: (cp.beatState.actionRevision || 0) + 1 } }, now);
}
export function completeCampaignLearningTask(progress, episode, now) {
  const cp = currentCampaignCheckpoint(progress), beat = currentCampaignBeat(progress), recovery = cp?.beatState.learningRecovery;
  if (!recovery || episode.id !== recovery.id || episode.phase !== 'complete' || !episode.completion?.completed) return progress;
  let state = { ...cp.beatState, modelShown: true, supportUsed: [...new Set([...cp.beatState.supportUsed, 'worked-model'])] };
  const originalExpected = recovery.expected;
  const actions = Array.isArray(originalExpected) ? originalExpected.slice((state.placed || []).length).map(tileId => ({ type: 'PLACE_TILE', tileId }))
    : beat.mechanic === 'sound_sort' ? [{ type: 'PLACE', itemId: beat.view.items[state.itemIndex].id, binId: originalExpected }]
      : [{ type: 'CHOOSE', ...(beat.mechanic === 'echo_hunt' ? { optionId: originalExpected } : { choiceId: originalExpected }) }];
  for (const action of actions) state = resolveCampaignAction(beat, state, action).state;
  state = { ...state, learningRecovery: null, learningResponses: [...(cp.beatState.learningResponses || []), episode],
    actionRevision: (cp.beatState.actionRevision || 0) + 1, heard: false };
  let next = updateCampaignCheckpoint(progress, cp.missionId, { attemptId: cp.attemptId, beatState: state }, now);
  if (episode.completion.unresolved && !state.done) {
    const model = prepareCampaignLearningRecovery(next, { type: 'MODEL_NEXT' });
    if (model) next = updateCampaignCheckpoint(next, cp.missionId, { attemptId: cp.attemptId, beatState: { ...state, learningRecovery: model } }, now);
  }
  return next;
}
export function campaignLearningSources(question, modeled = false) {
  const beat = question.authoredBeat, state = question.authoredState;
  const sources = campaignInstructionPlan(beat, state).flatMap(step => step.sources);
  if (!modeled) return sources;
  const task = campaignLearningTask(beat, state), expected = Array.isArray(task.expected) ? task.expected : [task.expected];
  return [...sources, ...expected.map(value => question.answerOptions.find(option => option.id === value)?.audio).filter(Boolean)];
}
