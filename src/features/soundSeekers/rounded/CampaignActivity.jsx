import { soundSeekersRoundedCssVariables } from '../visual/visualTokens.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CAST } from '../v3/content/cast.js';
import { campaignQuestionImage } from './campaignQuestionArt.js';
import {
  campaignFamily, campaignDisplayChoices, campaignSlots, campaignSceneDescriptor,
  campaignInstructionText, campaignMotion, CAMPAIGN_ACTIVITY_MECHANICS
} from './campaignPresentation.js';
import CampaignActivityScene from './CampaignActivityScene.jsx';
import './campaign-activity.css';
import './campaign-activity-scene.css';

function Speaker() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></svg>;
}

function PaintedQuestionImage({ descriptor, delivered = false, revision = 0, failureId, onMediaState }) {
  const imageRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const source = campaignQuestionImage(descriptor);
  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth) onMediaState?.(failureId, true);
  }, [source, revision, failureId, onMediaState]);
  return <>
    <img key={`${source}:${revision}:${attempt}`} ref={imageRef} src={source} alt="" aria-hidden="true"
      className="rounded-prop-art" width="480" height="400" draggable="false"
      data-prop-kind={descriptor.kind} data-question-art="painted" data-delivered={delivered ? 'true' : 'false'}
      data-scene-attributes={JSON.stringify(descriptor.appearance || {})}
      style={failed ? { visibility: 'hidden' } : undefined}
      onLoad={() => { setFailed(false); onMediaState?.(failureId, true); }}
      onError={() => { setFailed(true); onMediaState?.(failureId, false); }} />
    {failed && !failureId && <button type="button" onClick={() => setAttempt(value => value + 1)}>Try the picture again</button>}
  </>;
}

function PropArt(props) {
  const caption = {past:'Yesterday',present:'Today'}[props.descriptor.appearance?.temporal];
  return caption ? <figure className="rounded-prop-figure"><PaintedQuestionImage {...props} /><figcaption>{caption}</figcaption></figure>
    : <PaintedQuestionImage {...props} />;
}

export { PropArt as CampaignPropArt };

export function CampaignPracticeChoice({ descriptor, label, onChoose, disabled, failureId, revision, onMediaState, onRetry, paused }) {
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const report = useCallback((id, loaded) => { setReady(loaded); setFailed(!loaded); onMediaState?.(id, loaded); }, [onMediaState]);
  return <div className="rounded-learning-choice">
    <button type="button" className="learning-guided-action has-picture" aria-label={`Choose ${label}`} disabled={disabled || !ready} onClick={onChoose}>
      <PropArt descriptor={descriptor} failureId={failureId} revision={revision} onMediaState={report} /><span>{label}</span>
    </button>
    {failed && <button type="button" className="rounded-practice-retry" disabled={paused} onClick={onRetry}>Try pictures again</button>}
  </div>;
}

function PictureCue({ cue, onShown }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <div className="rounded-picture-cue">
    <img key={attempt} src={cue.image} alt="Sound picture. Tap Hear for its name." onLoad={() => { setFailed(false); onShown?.(); }} onError={() => { setFailed(true); }} />
    {failed && <button type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Try the picture again</button>}
  </div>;
}

function TeachingCards({ beat, state, onOptionAudio, teachingTarget }) {
  return <div className="rounded-teaching-cards" role="group" aria-label="Meet the sounds">
    {(beat.view.cards || []).map(card => <button key={card.targetId} type="button" className="rounded-teaching-card" data-teaching-target={card.targetId} aria-current={teachingTarget === card.targetId ? 'step' : undefined}
      aria-label={`Hear ${card.title || card.grapheme} and its example`}
      onClick={() => onOptionAudio?.([card.phonemeAudio, ...(card.unitAudio || []).map(unit => unit.audio), card.baseAudio !== card.anchorAudio ? card.baseAudio : '', card.anchorAudio].filter(Boolean), { kind: 'teach', targetId: card.targetId })}>
      <strong className="rounded-teaching-grapheme">{card.title || card.grapheme}</strong>
      {card.anchorImage && <img src={card.anchorImage} alt={card.anchorWord || ''} />}
      <span className="rounded-teaching-line">{card.line}</span>
      <span className="rounded-teaching-replay"><Speaker /> {state.cardsHeard?.includes(card.targetId) ? 'Hear again' : 'Hear the sound'}</span>
    </button>)}
  </div>;
}

function WordAssembly({ beat, state, feedback, onAction }) {
  const choices = campaignDisplayChoices(beat, state);
  const slots = campaignSlots(beat, state);
  const sentence = beat.mechanic === 'sentence_build';
  const replacing = beat.view.workshop?.mode === 'replace';
  return <div className={`rounded-assembly${sentence ? ' is-sentence' : ''}${replacing ? ' is-replacement' : ''}`}>
    <div className="rounded-built-message">
      {beat.view.context && <p className="rounded-sentence-context">{beat.view.context}</p>}
      <div className="rounded-ordered-slots" data-drop-zone="assembly" role="group" aria-label={replacing ? 'Word with a marked part to change' : sentence ? 'Message in order' : 'Word in order'}>
        {slots.map((slot, index) => <span key={slot.id} className={`rounded-word-slot${slot.marked ? ' is-marked' : ''}${slot.filled ? ' is-filled' : ''}`} data-settled={slot.filled ? 'true' : 'false'} data-slot-index={index} data-placed-tile={slot.tileId || ''}>
          <span>{slot.label || <span aria-hidden="true">·</span>}</span>
          <span className="rounded-sr-only">{slot.label ? `Piece ${index + 1}: ${slot.label}` : `Empty place ${index + 1}`}{slot.marked ? ', change this part' : ''}</span>
        </span>)}
      </div>
      {sentence && state.done && <p className="rounded-sentence-result" role="status">{slots.map(slot => slot.label).join(' ')}</p>}
      {replacing && <span className="rounded-assembly-mode">Keep the other parts.</span>}
      {beat.view.workshop?.mode === 'assembly' && <span className="rounded-assembly-mode">Build the whole word.</span>}
    </div>
    <div className="rounded-tile-bank" role="group" aria-label={sentence ? 'Message word pieces' : 'Sound pieces'}>
      {choices.map((choice, index) => <button key={choice.id} type="button" className={`rounded-piece${choice.used ? ' is-used' : ''}${feedback?.revealId === choice.id ? ' is-modelled' : ''}${feedback?.type === 'incorrect' && feedback.action?.tileId === choice.id ? ' is-retry' : ''}`}
        disabled={choice.used || state.done || state.paused || feedback?.locked} data-choice-id={choice.id} aria-label={`Place ${choice.label}, piece ${index + 1}`}
        onClick={() => onAction?.(choice.action)}><span>{choice.label}</span>{choice.used && <span className="rounded-piece-used" aria-hidden="true">✓</span>}</button>)}
    </div>
  </div>;
}

function ChoiceActivities({ beat, state, feedback, onAction, onOptionAudio, onPictureShown, pictureCue, mediaRevision, onMediaState, unavailable }) {
  const choices = campaignDisplayChoices(beat, state);
  const letterSounds = beat.mechanic === 'echo_hunt' && beat.view.direction === 'letter-to-sound';
  const sorting = beat.mechanic === 'sound_sort';
  const currentItem = sorting ? beat.view.items?.[state.itemIndex || 0] : null;
  const motion = campaignMotion(beat, state, feedback);
  const textRecovery = unavailable && state.supportUsed?.includes('text-support');
  return <div className={`rounded-choice-activity${sorting ? ' is-sorting' : ''}${letterSounds ? ' is-sound-choice' : ''}`}>
    {beat.view.text && ['word_decoding','connected_text_transfer','text_comprehension'].includes(beat.domain) && <p className="rounded-scene-clue">{beat.view.text}</p>}
    {(letterSounds || currentItem || pictureCue || (beat.view.objectId && beat.view.phase !== 'pickup')) && <div className="rounded-current-object">
      {letterSounds && <strong className="rounded-target-grapheme">{beat.view.target.grapheme}</strong>}
      {pictureCue && <PictureCue key={`${beat.id}:${pictureCue.image}`} cue={pictureCue} onShown={onPictureShown} />}
      {currentItem && <>
        {beat.view.mode === 'read' ? <strong className="rounded-sort-word">{currentItem.word}</strong>
          : currentItem.image ? <img src={currentItem.image} alt={currentItem.word} /> : <PropArt descriptor={{ kind: 'parcel' }} />}
        <span className="rounded-item-count">{Math.min((state.itemIndex || 0) + 1, beat.view.items.length)} of {beat.view.items.length}</span>
      </>}
      {!currentItem && !letterSounds && beat.view.objectId && beat.view.phase !== 'pickup' && <PropArt key={`${beat.id}:carrying`} descriptor={{ kind: beat.view.objectId }} failureId={`${beat.id}:carrying`} revision={mediaRevision} onMediaState={onMediaState} />}
    </div>}
    <div className="rounded-choices" role="group" style={{ '--choice-count': Math.min(choices.length, 4) }} data-choice-count={choices.length} aria-label={sorting ? 'Sound baskets' : letterSounds ? 'Hear and choose a sound' : 'Choose a place to help'}>
      {choices.map((choice, index) => {
        const descriptor = campaignSceneDescriptor(beat, choice);
        const delivered = motion.accepted && motion.choiceId === choice.id && state.done;
        const retryId = feedback?.action?.choiceId || feedback?.action?.optionId || feedback?.action?.binId;
        const description = descriptor?.label || choice.label || `sound ${index + 1}`;
        const closedLantern = beat.familyId === 'lantern-search' && !state.playfield?.opened?.includes(choice.id);
        return <div key={choice.id} className={`rounded-choice-pair${state.playfield?.opened?.includes(choice.id) ? ' is-open' : ''}`}>
          {letterSounds && <button type="button" className="rounded-hear-choice" aria-label={`Hear sound choice ${index + 1}`} onClick={() => onOptionAudio?.([choice.audio].filter(Boolean), { kind: 'option', optionId: choice.id })}><Speaker /><span>Hear {index + 1}</span></button>}
          <button type="button" className={`rounded-physical-choice${beat.familyId === 'word-pop' ? ' campaign-scene-bubble-target' : ''}${feedback?.revealId === choice.id ? ' is-modelled' : ''}${feedback?.type === 'incorrect' && retryId === choice.id ? ' is-retry' : ''}${delivered ? ' is-settled' : ''}`}
            disabled={state.done || state.paused || feedback?.locked || (unavailable && !textRecovery)} data-choice-id={choice.id} aria-label={closedLantern ? `Look inside lantern ${index + 1}` : letterSounds ? `Choose sound ${index + 1}` : sorting ? `Send to ${description} basket` : `Choose ${description}`}
            onClick={() => onAction?.(closedLantern ? { type: 'PLAYFIELD', openId: choice.id } : choice.action)}>
            {descriptor ? <PropArt key={`${beat.id}:${choice.id}`} descriptor={descriptor} delivered={delivered} revision={mediaRevision} failureId={`${beat.id}:${choice.id}`} onMediaState={onMediaState} />
              : sorting ? <><PropArt descriptor={{ kind: 'basket' }} /><strong>{choice.label}</strong></>
                : letterSounds ? <><strong className="rounded-choice-number">{index + 1}</strong><span className="rounded-choice-action">Choose</span></>
                  : <strong>{choice.label || index + 1}</strong>}
            {unavailable && descriptor && <span className="rounded-missing-picture">{textRecovery ? descriptor.label : 'Picture unavailable'}</span>}
          </button>
        </div>;
      })}
    </div>
  </div>;
}

export default function CampaignActivity({
  beat, state = {}, residentId, onAction, onReplay, onOptionAudio, onPictureShown,
  missionStep, recovery = false, pictureCue = null, supportText = '', feedback = null, speaking = false, reducedMotion = false, teachingTarget = '', paused = false
}) {
  const [mediaFailures, setMediaFailures] = useState([]);
  const [mediaRevision, setMediaRevision] = useState(0);
  const onMediaState = useCallback((id, ready) => {
    if (!id) return;
    setMediaFailures(previous => {
      const current = previous.filter(value => value.startsWith(`${beat?.id}:`));
      return ready ? current.filter(value => value !== id)
        : current.includes(id) ? current : [...current, id];
    });
  }, [beat?.id]);
  const family = campaignFamily(beat);
  if (!beat || !family || !CAMPAIGN_ACTIVITY_MECHANICS.includes(beat.mechanic)) {
    return <section style={soundSeekersRoundedCssVariables()} className="rounded-activity rounded-activity-unavailable" role="alert"><p>This activity could not open.</p><button type="button" onClick={onReplay}>Try again</button></section>;
  }
  const teaching = beat.mechanic === 'sound_signpost';
  const assembly = ['word_forge', 'sentence_build'].includes(beat.mechanic);
  const failed = mediaFailures.some(id => id.startsWith(`${beat.id}:`));
  const motion = campaignMotion(beat, state, feedback);
  const resident = CAST[residentId];
  const hasUndo = assembly && beat.view.workshop?.mode !== 'replace';
  const canUndo = hasUndo && !state.done && (state.placed || []).length > 0;
  return <section style={soundSeekersRoundedCssVariables()} className="rounded-activity" data-mechanic={beat.mechanic} data-family={beat.familyId} data-paused={paused ? 'true' : 'false'} data-reduced-motion={reducedMotion ? 'true' : 'false'} aria-label={family.title}>
    <header className="rounded-activity-header">
      <div className="rounded-activity-heading">
        {resident && <img className="rounded-resident-portrait" src={resident.sprite} alt={resident.name} />}
        <div><h2>{family.title}</h2><p className={supportText ? 'rounded-written-support' : undefined} role={supportText ? 'status' : undefined} data-child-instruction="">{supportText || campaignInstructionText(beat)}</p></div>
      </div>
      <button type="button" className="rounded-replay" onClick={onReplay} aria-label="Hear the instruction again" data-speaking={speaking ? 'true' : 'false'}><Speaker /></button>
    </header>
    <div className={`rounded-activity-body${pictureCue ? ' has-picture-help' : ''}`}>
      <CampaignActivityScene beat={beat} state={{ ...state, paused }} feedback={feedback} reducedMotion={reducedMotion} residentId={residentId} missionStep={missionStep} onAction={onAction}>
      {teaching ? <TeachingCards beat={beat} state={state} onOptionAudio={onOptionAudio} teachingTarget={teachingTarget} />
        : assembly ? <WordAssembly beat={beat} state={state} feedback={feedback} onAction={onAction} />
          : <ChoiceActivities beat={beat} state={state} feedback={feedback} onAction={onAction} onOptionAudio={onOptionAudio} onPictureShown={onPictureShown} pictureCue={pictureCue} mediaRevision={mediaRevision} onMediaState={onMediaState} unavailable={failed} />}
      </CampaignActivityScene>
    </div>
    <p className="rounded-activity-feedback" role={failed ? 'alert' : 'status'} aria-live="polite" data-result={feedback?.type || ''}>
      {feedback?.line || (failed ? 'The pictures could not open. Retry or read the clue.' : motion.accepted ? family.success : state.done ? 'Ready for the next part.' : '')}
    </p>
    <footer className="rounded-activity-support" data-teaching={teaching ? 'true' : 'false'} data-has-undo={hasUndo ? 'true' : 'false'}>
      {!teaching && (failed ? <button type="button" onClick={() => setMediaRevision(value => value + 1)}>Try pictures again</button>
        : !recovery && <button type="button" onClick={() => onAction?.({ type: 'REQUEST_MODEL' })} disabled={state.done || paused}>Show me</button>)}
      {!recovery && <button type="button" onClick={() => onAction?.({ type: 'REQUEST_TEXT_SUPPORT' })} disabled={state.done || paused}>Read the clue</button>}
      {hasUndo && !recovery && <button type="button" className="rounded-undo" onClick={() => onAction?.({ type: 'REMOVE_LAST' })} disabled={!canUndo} aria-label="Remove the last piece"><span aria-hidden="true">↶</span></button>}
    </footer>
  </section>;
}
