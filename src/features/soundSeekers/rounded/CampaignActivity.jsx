import { SOUND_SEEKERS_ROUNDED_PALETTE, soundSeekersRoundedCssVariables } from '../visual/visualTokens.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CAST } from '../v3/content/cast.js';
import {
  drawCampaignProp, campaignRelationPlacement, drawCampaignRelationForeground
} from '../v3/render/campaignProps.js';
import { LEARNING_SPRITES, PUZZLE_SPRITES } from '../v3/render/puzzleSprites.js';
import { getImage, preload, retryFailedImages } from '../v3/render/sprites.js';
import {
  campaignFamily, campaignDisplayChoices, campaignSlots, campaignSceneDescriptor,
  campaignDestinationAppearance, campaignPropAppearance, campaignInstructionText, campaignMotion, CAMPAIGN_ACTIVITY_MECHANICS
} from './campaignPresentation.js';
import './campaign-activity.css';

function Speaker() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></svg>;
}

function requiredCast(descriptor) {
  const ids = [descriptor.residentId, descriptor.appearance?.residentId, descriptor.appearance?.landmark?.residentId];
  if (['cat', 'kitten'].includes(descriptor.kind)) ids.push('cuddly');
  if (descriptor.kind === 'chick') ids.push('brave');
  return [...new Set(ids)].filter(id => CAST[id]);
}

function drawPropScene(context, descriptor, delivered) {
  if (!context) return false;
  const x = 132, y = 282, size = 140;
  const { appearance = {}, kind, carriedKind, destination } = descriptor;
  context.clearRect(0, 0, 340, 320);
  for (const prop of appearance.scenery || []) {
    drawCampaignProp(context, prop.kind, x + (prop.x || 0), y + (prop.y || 0), { ...prop });
  }
  let drawn;
  if (destination && carriedKind && appearance.relation && appearance.landmark) {
    const placement = campaignRelationPlacement({ ...campaignPropAppearance(kind, campaignDestinationAppearance(descriptor)), size, objectKind: carriedKind });
    const host = placement.landmark, object = placement.object;
    drawn = drawCampaignProp(context, host.kind, x + host.x, y + host.y, { ...host });
    if (delivered) {
      drawn = drawCampaignProp(context, carriedKind, x + object.x, y + object.y, {
        size: object.size, relation: null, landmark: null
      }) && drawn;
      drawCampaignRelationForeground(context, placement, x, y);
    } else {
      // The empty place shows exactly on/in/under, without choosing for a child.
      context.save(); context.strokeStyle = SOUND_SEEKERS_ROUNDED_PALETTE['385744']; context.lineWidth = 4;
      context.setLineDash([7, 7]); context.beginPath();
      context.ellipse(x + object.x, y + object.y, Math.max(18, object.size * .55), Math.max(10, object.size * .22), 0, 0, Math.PI * 2);
      context.stroke(); context.restore();
    }
  } else {
    drawn = drawCampaignProp(context, kind, x, y, { size, ...campaignPropAppearance(kind, appearance) });
    if (drawn && delivered && destination && carriedKind) {
      drawn = drawCampaignProp(context, carriedKind, x + 38, y - 22, { size: 58 }) && drawn;
    }
  }
  // The same canonical portrait distinguishes destinations owned by residents.
  const resident = descriptor.residentId && getImage(CAST[descriptor.residentId]?.sprite);
  if (resident) {
    const height = 78, width = height * resident.naturalWidth / resident.naturalHeight;
    context.drawImage(resident, 267 - width / 2, 195 - height, width, height);
  }
  return drawn;
}

const sceneFrames = new Map();
function commonSceneFrame(descriptors, revision) {
  const key = `${revision}:${JSON.stringify(descriptors)}`;
  if (sceneFrames.has(key)) return sceneFrames.get(key);
  const buffer = document.createElement('canvas'); buffer.width = 680; buffer.height = 640;
  const context = buffer.getContext('2d', { willReadFrequently: true });
  let left = 680, top = 640, right = 0, bottom = 0;
  for (const descriptor of descriptors) {
    context.clearRect(0, 0, 680, 640);
    context.save(); context.translate(170, 160);
    drawPropScene(context, descriptor, true); context.restore();
    const pixels = context.getImageData(0, 0, 680, 640).data;
    for (let y = 0; y < 640; y++) for (let x = 0; x < 680; x++) {
      if (pixels[(y * 680 + x) * 4 + 3] > 12) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  const frame = { left, top, width: Math.max(1, right - left + 1), height: Math.max(1, bottom - top + 1) };
  // A bounded working set follows the current encounter; this never warms
  // thousands of authored scenes or changes a comparison's relative scale.
  if (sceneFrames.size >= 96) sceneFrames.delete(sceneFrames.keys().next().value);
  sceneFrames.set(key, frame);
  return frame;
}

function PropArt({ descriptor, framingDescriptors = null, delivered = false, revision = 0, failureId, onMediaState }) {
  const canvasRef = useRef(null);
  const description = JSON.stringify(descriptor);
  const framing = JSON.stringify(framingDescriptors || [descriptor]);
  useEffect(() => {
    let disposed = false;
    const visual = JSON.parse(description);
    const frames = JSON.parse(framing);
    const cast = [...new Set(frames.flatMap(requiredCast))];
    const sources = [LEARNING_SPRITES, PUZZLE_SPRITES, ...cast.map(id => CAST[id].sprite)];
    if (revision) retryFailedImages(sources);
    void preload(sources).then(() => {
      if (disposed) return;
      const context = canvasRef.current?.getContext('2d');
      const hasRequiredArt = cast.every(id => Boolean(getImage(CAST[id].sprite)));
      let drawn = false;
      if (context && hasRequiredArt) {
        const buffer = document.createElement('canvas'); buffer.width = 680; buffer.height = 640;
        const painter = buffer.getContext('2d'); painter.translate(170, 160);
        drawn = drawPropScene(painter, visual, delivered);
        const frame = commonSceneFrame(frames, revision);
        context.clearRect(0, 0, 340, 320);
        const scale = Math.min(324 / frame.width, 304 / frame.height);
        const width = frame.width * scale, height = frame.height * scale;
        context.drawImage(buffer, frame.left, frame.top, frame.width, frame.height, (340 - width) / 2, (320 - height) / 2, width, height);
      }
      onMediaState?.(failureId, Boolean(drawn));
    });
    return () => { disposed = true; };
  }, [description, framing, delivered, revision, failureId, onMediaState]);
  return <canvas ref={canvasRef} className="rounded-prop-art" width="340" height="320" aria-hidden="true" data-prop-kind={descriptor.kind} data-scene-attributes={JSON.stringify(descriptor.appearance || {})} />;
}

export { PropArt as CampaignPropArt };

function PictureCue({ cue, onShown }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <div className="rounded-picture-cue">
    <img key={attempt} src={cue.image} alt={loaded ? cue.word : ''} onLoad={() => { setLoaded(true); setFailed(false); onShown?.(); }} onError={() => { setFailed(true); setLoaded(false); }} />
    {loaded && <span>{cue.word}</span>}
    {failed && <button type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Try the picture again</button>}
  </div>;
}

function FamilyMovement({ beat, state, feedback, family }) {
  const motion = campaignMotion(beat, state, feedback);
  const traveler = beat.familyId === 'river-route' ? 'raft'
    : ['sentence-express', 'sound-herd'].includes(beat.familyId) ? 'cart'
      : ['pals-post', 'garden-kitchen', 'story-rescue'].includes(beat.familyId) ? beat.view.objectId || 'parcel'
        : beat.familyId === 'fix-it-workshop' ? 'tool'
          : beat.familyId === 'rescue-bridge' ? 'plank' : '';
  return <div className="rounded-family-scene" aria-hidden="true" data-motion={motion.accepted ? 'accepted' : 'idle'}>
    <div className="rounded-family-landmark"><PropArt descriptor={{ kind: family.prop }} /></div>
    <div key={motion.key} className={`rounded-traveler${motion.accepted ? ' is-moving' : ''}`} style={{ '--arrival': `${12 + motion.fraction * 65}%` }}>
      {traveler ? <PropArt descriptor={{ kind: traveler }} /> : <img src={CAST.bouncy.sprite} alt="" />}
    </div>
    <span className="rounded-path-piece" /><span className="rounded-path-piece" /><span className="rounded-path-piece" />
  </div>;
}

function TeachingCards({ beat, state, onOptionAudio }) {
  return <div className="rounded-teaching-cards" role="group" aria-label="Meet the sounds">
    {(beat.view.cards || []).map(card => <button key={card.targetId} type="button" className="rounded-teaching-card" data-teaching-target={card.targetId}
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
      <div className="rounded-ordered-slots" role="group" aria-label={replacing ? 'Word with a marked part to change' : sentence ? 'Message in order' : 'Word in order'}>
        {slots.map((slot, index) => <span key={slot.id} className={`rounded-word-slot${slot.marked ? ' is-marked' : ''}${slot.filled ? ' is-filled' : ''}`} data-slot-index={index} data-placed-tile={slot.tileId || ''}>
          <span>{slot.label || <span aria-hidden="true">·</span>}</span>
          <span className="rounded-sr-only">{slot.label ? `Piece ${index + 1}: ${slot.label}` : `Empty place ${index + 1}`}{slot.marked ? ', change this part' : ''}</span>
        </span>)}
      </div>
      {replacing && <span className="rounded-assembly-mode">Keep the other parts.</span>}
      {beat.view.workshop?.mode === 'assembly' && <span className="rounded-assembly-mode">Build the whole word.</span>}
    </div>
    <div className="rounded-tile-bank" role="group" aria-label={sentence ? 'Message word pieces' : 'Sound pieces'}>
      {choices.map((choice, index) => <button key={choice.id} type="button" className={`rounded-piece${choice.used ? ' is-used' : ''}${feedback?.revealId === choice.id ? ' is-modelled' : ''}${feedback?.type === 'incorrect' && feedback.action?.tileId === choice.id ? ' is-retry' : ''}`}
        disabled={choice.used || state.done} data-choice-id={choice.id} aria-label={`Place ${choice.label}, piece ${index + 1}`}
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
  const framingDescriptors = choices.map(choice => campaignSceneDescriptor(beat, choice)).filter(Boolean);
  return <div className={`rounded-choice-activity${sorting ? ' is-sorting' : ''}${letterSounds ? ' is-sound-choice' : ''}`}>
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
    <div className="rounded-choices" role="group" aria-label={sorting ? 'Sound baskets' : letterSounds ? 'Hear and choose a sound' : 'Choose a place to help'}>
      {choices.map((choice, index) => {
        const descriptor = campaignSceneDescriptor(beat, choice);
        const delivered = motion.accepted && motion.choiceId === choice.id && state.done;
        const retryId = feedback?.action?.choiceId || feedback?.action?.optionId || feedback?.action?.binId;
        const description = descriptor?.label || choice.label || `sound ${index + 1}`;
        return <div key={choice.id} className="rounded-choice-pair">
          {letterSounds && <button type="button" className="rounded-hear-choice" aria-label={`Hear sound choice ${index + 1}`} onClick={() => onOptionAudio?.([choice.audio].filter(Boolean), { kind: 'option', optionId: choice.id })}><Speaker /><span>Hear {index + 1}</span></button>}
          <button type="button" className={`rounded-physical-choice${feedback?.revealId === choice.id ? ' is-modelled' : ''}${feedback?.type === 'incorrect' && retryId === choice.id ? ' is-retry' : ''}${delivered ? ' is-settled' : ''}`}
            disabled={state.done || (unavailable && !textRecovery)} data-choice-id={choice.id} aria-label={letterSounds ? `Choose sound ${index + 1}` : sorting ? `Send to ${description} basket` : `Choose ${description}`}
            onClick={() => onAction?.(choice.action)}>
            {descriptor ? <PropArt key={`${beat.id}:${choice.id}`} descriptor={descriptor} framingDescriptors={framingDescriptors} delivered={delivered} revision={mediaRevision} failureId={`${beat.id}:${choice.id}`} onMediaState={onMediaState} />
              : sorting ? <><PropArt descriptor={{ kind: 'basket' }} /><strong>{choice.label}</strong></>
                : <strong>{choice.label || (letterSounds ? `Choose ${index + 1}` : index + 1)}</strong>}
            {unavailable && descriptor && <span className="rounded-missing-picture">{textRecovery ? descriptor.label : 'Picture unavailable'}</span>}
          </button>
        </div>;
      })}
    </div>
  </div>;
}

export default function CampaignActivity({
  beat, state = {}, residentId, onAction, onReplay, onOptionAudio, onPictureShown,
  pictureCue = null, supportText = '', feedback = null, speaking = false, reducedMotion = false
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
  return <section style={soundSeekersRoundedCssVariables()} className="rounded-activity" data-mechanic={beat.mechanic} data-family={beat.familyId} data-reduced-motion={reducedMotion ? 'true' : 'false'} aria-label={family.title}>
    <header className="rounded-activity-header">
      <div className="rounded-activity-heading">
        {resident && <img className="rounded-resident-portrait" src={resident.sprite} alt={resident.name} />}
        <div><h2>{family.title}</h2><p className={supportText ? 'rounded-written-support' : undefined} role={supportText ? 'status' : undefined} data-child-instruction="">{supportText || campaignInstructionText(beat)}</p></div>
      </div>
      <button type="button" className="rounded-replay" onClick={onReplay} aria-label="Hear the instruction again" data-speaking={speaking ? 'true' : 'false'}><Speaker /></button>
    </header>
    <div className={`rounded-activity-body${pictureCue ? ' has-picture-help' : ''}`}>
      <FamilyMovement beat={beat} state={state} feedback={feedback} family={family} />
      {teaching ? <TeachingCards beat={beat} state={state} onOptionAudio={onOptionAudio} />
        : assembly ? <WordAssembly beat={beat} state={state} feedback={feedback} onAction={onAction} />
          : <ChoiceActivities beat={beat} state={state} feedback={feedback} onAction={onAction} onOptionAudio={onOptionAudio} onPictureShown={onPictureShown} pictureCue={pictureCue} mediaRevision={mediaRevision} onMediaState={onMediaState} unavailable={failed} />}
    </div>
    <p className="rounded-activity-feedback" role={failed ? 'alert' : 'status'} aria-live="polite" data-result={feedback?.type || ''}>
      {feedback?.line || (failed ? 'The pictures could not open. Retry or read the clue.' : motion.accepted ? family.success : state.done ? 'Ready for the next part.' : '')}
    </p>
    <footer className="rounded-activity-support" data-teaching={teaching ? 'true' : 'false'} data-has-undo={hasUndo ? 'true' : 'false'}>
      {!teaching && (failed ? <button type="button" onClick={() => setMediaRevision(value => value + 1)}>Try pictures again</button>
        : <button type="button" onClick={() => onAction?.({ type: 'REQUEST_MODEL' })} disabled={state.done}>Show me</button>)}
      <button type="button" onClick={() => onAction?.({ type: 'REQUEST_TEXT_SUPPORT' })} disabled={state.done}>Read the clue</button>
      {hasUndo && <button type="button" className="rounded-undo" onClick={() => onAction?.({ type: 'REMOVE_LAST' })} disabled={!canUndo} aria-label="Remove the last piece"><span aria-hidden="true">↶</span></button>}
    </footer>
  </section>;
}
