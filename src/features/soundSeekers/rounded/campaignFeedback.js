import { campaignInstructionPlan } from '../v3/engine/campaignInstructions.js';

/** Recorded correction uses the selected sound and the current instruction.
 * Answer/model audio is added only after the authority explicitly supplies a
 * model. This selector never records exposure or judges another response. */
export function campaignFeedbackSources(beat, state, action, outcome, retryAudio) {
  if (!beat || !['incorrect', 'model'].includes(outcome?.type)) return [];
  const selectedId = action?.optionId || action?.tileId || action?.binId || action?.choiceId;
  const choices = [...(beat.view.options || []), ...(beat.view.tiles || []), ...(beat.view.bins || []), ...(beat.view.choices || [])];
  const selected = choices.find(choice => choice.id === selectedId);
  const model = state.modelShown && outcome.revealId ? choices.find(choice => choice.id === outcome.revealId) : null;
  const instruction = campaignInstructionPlan(beat, state).flatMap(step => step.sources);
  return [
    ...(outcome.type === 'incorrect' && selected?.audio ? [selected.audio] : []),
    ...(outcome.type === 'incorrect' && retryAudio ? [retryAudio] : []),
    ...instruction,
    ...(model?.audio ? [model.audio] : [])
  ];
}
