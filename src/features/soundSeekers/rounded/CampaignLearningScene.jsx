import CampaignActivity from './CampaignActivity.jsx';
import { publicBeat } from '../v3/engine/challenges.js';
import { campaignDisplayChoices, campaignSceneDescriptor } from './campaignPresentation.js';

// The shared response owner supplies its held cursor and callbacks. This view
// never judges an answer, creates evidence or advances the episode itself.
export default function CampaignLearningScene({ question, phase, role, draft, response, explanation, encodingHint,
  modelValues, onChoose, onReplay, onOptionAudio, paused, residentId, reducedMotion, missionStep, presentation = {}, onPresentationChange }) {
  const authored = question.authoredBeat;
  const beat = { ...publicBeat(authored), view: { ...authored.view } };
  const order = new Map((question.answerOptions || []).map((option, index) => [option.id, index]));
  for (const field of ['options', 'choices', 'tiles', 'bins']) if (beat.view[field]) beat.view[field] = [...beat.view[field]].sort((a, b) => order.get(a.id) - order.get(b.id));
  const teaching = ['teaching', 'finish_teaching'].includes(phase);
  const assembly = ['word_forge', 'sentence_build'].includes(beat.mechanic);
  const state = { ...question.authoredState, placed: assembly ? draft || [] : question.authoredState.placed,
    done: phase === 'complete' || phase === 'receipt' && response?.observedCorrect === true,
    modelShown: question.authoredState.modelShown || teaching, paused, playfield: { ...question.authoredState.playfield, ...presentation,
      opened: teaching || phase === 'complete' ? (question.answerOptions || []).map(choice => choice.id)
        : presentation.opened || question.authoredState.playfield?.opened || [] } };
  const current = modelValues[assembly ? (draft || []).length : 0];
  const choices = campaignDisplayChoices(beat, state);
  const selectedId = Array.isArray(response?.selected) ? response.selected.at(-1) : response?.selected;
  const chosen = choices.find(choice => choice.id === selectedId);
  const chosenLabel = chosen && (campaignSceneDescriptor(beat, chosen)?.label || chosen.label);
  const incorrect = phase === 'receipt' && response?.observedCorrect === false;
  const line = phase === 'receipt' ? response?.observedCorrect === true ? 'That worked. Your friend is ready.'
    : incorrect ? chosenLabel ? `You chose ${chosenLabel}. Let's check the clue together.` : 'Listen again. Keep the pieces that already fit.'
      : "Let's look together."
    : teaching ? assembly ? `${question.hideEncodingTarget ? 'Listen again. Keep the pieces that fit.' : 'Fit the marked piece.'}${encodingHint ? ` Hint: ${encodingHint}` : ''}` : explanation
      : role === 'transfer' ? 'Try a new one with your friend.' : '';
  return <CampaignActivity beat={beat} state={state} residentId={residentId} reducedMotion={reducedMotion} paused={paused}
    missionStep={missionStep} recovery onReplay={onReplay}
    pictureCue={state.modelShown ? question.supportPicture : null}
    onOptionAudio={onOptionAudio} supportText={teaching && (!assembly || beat.mechanic === 'sentence_build') ? explanation : ''}
    feedback={{ type: incorrect ? 'incorrect' : phase === 'receipt' && response?.observedCorrect ? 'correct' : 'support', action: chosen?.action,
      line, revealId: teaching && !question.hideEncodingTarget ? current : '', locked: phase === 'receipt' || phase === 'complete' }}
    onAction={action => {
      if (action.type === 'PLAYFIELD' && typeof action.carrying === 'boolean') {
        onPresentationChange?.({ ...presentation, carrying: action.carrying }); return;
      }
      if (action.type === 'PLAYFIELD' && choices.some(choice => choice.id === action.openId)) {
        onPresentationChange?.({ ...presentation, opened: [...new Set([...state.playfield.opened, action.openId])] }); return;
      }
      if (!['CHOOSE', 'PLACE', 'PLACE_TILE'].includes(action.type)) return;
      onChoose(action.tileId || action.binId || action.choiceId || action.optionId);
    }} />;
}
