import { useEffect, useRef, useState } from 'react';
import { CAST } from '../v3/content/cast.js';
import { campaignDisplayChoices, campaignMotion } from './campaignPresentation.js';
import { campaignLayoutSeed, campaignMotorDrop, campaignPlayfieldLandscape, CAMPAIGN_PLAY } from './campaignPlayfield.js';
import sceneArt from './campaignSceneArt.generated.json';
import { projectCampaignScene } from './campaignActivitySceneState.js';
import './campaign-activity-scene.css';

function Prop({ kind, className = '' }) {
  const prop = sceneArt[kind];
  return prop ? <img className={`campaign-stage-prop ${className}`} src={prop.source} style={{ aspectRatio: prop.aspect }} alt="" draggable="false" /> : null;
}

/** The playfield consumes public choices and settled state. Aiming, dragging,
 * opening lanterns and carrying are forgiving motor actions, never responses.
 * Only a deliberate target selection sends the existing semantic action. */
export default function CampaignActivityScene({ beat, state = {}, feedback, reducedMotion, residentId, missionStep, onAction, children }) {
  const sceneRef = useRef(null), drag = useRef(null), suppressClick = useRef(false);
  const [pointer, setPointer] = useState(null), [aim, setAim] = useState(null), [landing, setLanding] = useState(null);
  const play = CAMPAIGN_PLAY[beat.familyId] || CAMPAIGN_PLAY['story-rescue'];
  const choices = campaignDisplayChoices(beat, state);
  const scene = projectCampaignScene(beat, state, feedback), motion = campaignMotion(beat, state, feedback);
  const seed = campaignLayoutSeed(beat);
  const assembly = ['word_forge', 'sentence_build'].includes(beat.mechanic);
  const paused = state.paused || false;
  const carry = ['deliver', 'route', 'sail', 'place'].includes(play.action) && !assembly && beat.mechanic !== 'sound_signpost';
  const resident = CAST[residentId] || CAST.bouncy;
  const opened = state.playfield?.opened || [];
  const carrying = state.playfield?.carrying || play.action === 'sail' || play.action === 'route';
  const fraction = missionStep ? (missionStep.index + scene.fraction) / Math.max(1, missionStep.total) : scene.fraction;
  const heroX = motion.accepted && !assembly ? landing?.id === motion.choiceId ? landing.x : 28 + motion.fraction * 50 : assembly && state.done ? 84 : 12;
  const heroLift = play.action === 'climb' ? Math.min(48, fraction * 48) : 0;
  const heroState = scene.accepted ? ({ hop: 'hop', aim: 'celebrate', build: state.done ? 'travel' : 'point', climb: 'hop', deliver: 'travel', route: 'point', sail: 'sail', couple: 'point', change: 'point', place: 'point', search: 'celebrate', resolve: 'celebrate' })[play.action] : feedback?.type === 'incorrect' ? 'think' : 'idle';
  useEffect(() => {
    const freeze = () => sceneRef.current?.getAnimations({ subtree: true }).forEach(animation => paused || document.hidden ? animation.pause() : animation.play());
    const cancel = () => { if (drag.current) drag.current.cancelled = true; setPointer(null); };
    const visibility = () => { freeze(); if (document.hidden) cancel(); };
    if (paused && drag.current) drag.current.cancelled = true;
    freeze(); document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', cancel);
    return () => { cancel(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', cancel); };
  }, [paused, scene.key]);
  function cancelGesture() { if (drag.current) drag.current.cancelled = true; setPointer(null); }
  function locate(event) {
    const box = sceneRef.current.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }
  function pickTarget(x, y) {
    return document.elementFromPoint(x, y)?.closest('[data-choice-id],[data-drop-zone]');
  }
  function rememberLanding(target) {
    if (!target?.dataset.choiceId) return;
    const box = sceneRef.current.getBoundingClientRect(), rect = target.getBoundingClientRect();
    setLanding({ id: target.dataset.choiceId, x: (rect.left - box.left + rect.width * .28) / box.width * 100,
      bottom: box.height - (rect.bottom - box.top) + 8 });
  }
  function start(event) {
    if (paused || state.done || event.button !== 0 || feedback?.locked) return;
    const source = event.target.closest('[data-choice-id],[data-carry-source]');
    if (!source || source.disabled) return;
    // Auditory replay is a stimulus action, never an aimed response.
    if (event.target.closest('.rounded-hear-choice')) return;
    setPointer(null);
    drag.current = { beatId: beat.id, sourceId: source.dataset.choiceId || 'carrier', x: event.clientX, y: event.clientY, moved: false };
    source.setPointerCapture?.(event.pointerId);
  }
  function move(event) {
    if (paused || state.done) return;
    const point = locate(event);
    if (play.action === 'aim') {
      const target = pickTarget(event.clientX, event.clientY);
      setAim({ ...point, angle: Math.max(-45, Math.min(45, (point.x / Math.max(1, sceneRef.current.clientWidth) - .5) * 80)), id: target?.dataset.choiceId || '' });
    }
    if (!drag.current || drag.current.cancelled) return;
    if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) < 12) return;
    drag.current.moved = true;
    setPointer({ ...point, label: choices.find(choice => choice.id === drag.current.sourceId)?.label || '' });
  }
  function finish(event) {
    const active = drag.current; drag.current = null; setPointer(null);
    if (!active || !active.moved && !active.cancelled) return;
    suppressClick.current = true;
    // Prevent the native synthetic click after a drag; the drop itself owns
    // exactly one response. Cancelled/outside drops produce no evidence.
    const target = pickTarget(event.clientX, event.clientY);
    const action = campaignMotorDrop({ sourceId: active.sourceId, targetId: target?.dataset.choiceId || target?.dataset.dropZone, choices, assembly, search: play.action === 'search', opened });
    if (action && active.beatId === beat.id && !active.cancelled && !paused && !state.done && !feedback?.locked) { rememberLanding(target); onAction?.(action); }
    requestAnimationFrame(() => { suppressClick.current = false; });
  }
  return <div ref={sceneRef} className="rounded-family-scene campaign-activity-scene campaign-playfield"
    data-family={beat.familyId} data-play-action={play.action} data-layout={seed % 3} data-scene-progress={scene.progress} data-scene-total={scene.total}
    data-paused={paused ? 'true' : 'false'} data-reduced-motion={reducedMotion ? 'true' : 'false'} data-motion={scene.accepted ? 'accepted' : 'idle'} data-aimed-choice={aim?.id || ''}
    onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancelGesture} onLostPointerCapture={cancelGesture}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) cancelGesture(); }}
    onClickCapture={event => { rememberLanding(event.target.closest('[data-choice-id]')); if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); } }}>
    <img className="campaign-scene-landscape" src={campaignPlayfieldLandscape(beat)} alt="" draggable="false" />
    <div className="campaign-stage-set" aria-hidden="true"><Prop kind={play.tool} className="campaign-stage-landmark" /><Prop kind={seed % 2 ? 'hedge' : 'tree'} className="campaign-stage-edge" /></div>
    <div className="campaign-scene-pal campaign-stage-hero" data-action-state={heroState} style={{ '--hero-x': `${heroX}%`, '--hero-lift': `${heroLift}%`, ...(scene.accepted && !assembly && landing?.id === motion.choiceId ? { bottom: landing.bottom } : {}) }} aria-hidden="true">{play.action === 'sail' && <Prop kind="raft" className="campaign-hero-raft" />}<img src={CAST.bouncy.sprite} alt="" draggable="false" />{carrying && ['deliver', 'place'].includes(play.action) && <Prop kind={sceneArt[beat.view.objectId] ? beat.view.objectId : 'scene-parcel'} className="campaign-hero-parcel" />}</div>
    {residentId && residentId !== 'bouncy' && <div className="campaign-scene-pal campaign-stage-resident" aria-hidden="true"><img src={resident.sprite} alt="" draggable="false" /></div>}
    <div className="campaign-stage-content">{children}</div>
    {play.action === 'search' && beat.mechanic !== 'sound_signpost' && <div className="campaign-search-controls" role="group" aria-label="Explore the lanterns">
      {choices.map((choice, index) => <button type="button" key={choice.id} data-lantern={choice.id} aria-label={`Open lantern ${index + 1}`} aria-pressed={opened.includes(choice.id)} disabled={paused || state.done || feedback?.locked}
        onClick={() => onAction?.({ type: 'PLAYFIELD', openId: choice.id })}><Prop kind="lantern" /><span>{opened.includes(choice.id) ? 'Open' : 'Look'} {index + 1}</span></button>)}
    </div>}
    {carry && <button type="button" className="campaign-carrier" data-carry-source="" aria-label={play.action === 'sail' ? 'Move the raft' : 'Pick up the parcel'} aria-pressed={Boolean(carrying)} disabled={paused || state.done || feedback?.locked}
      onClick={() => onAction?.({ type: 'PLAYFIELD', carrying: !carrying })}><Prop kind={play.action === 'sail' ? 'raft' : beat.view.objectId && sceneArt[beat.view.objectId] ? beat.view.objectId : 'scene-parcel'} /><span>{play.action === 'sail' ? 'Sail' : carrying ? 'Carrying' : 'Pick up'}</span></button>}
    {play.action === 'aim' && <div className="campaign-aim-tool" aria-hidden="true"><Prop kind="scene-bubble-machine" /><span className="campaign-nozzle" style={{ transform: `rotate(${aim?.angle || 0}deg)` }} /></div>}
    {pointer && !paused && <div className="campaign-drag-ghost" aria-hidden="true" style={{ left: pointer.x, top: pointer.y }}>{pointer.label || <Prop kind={play.action === 'sail' ? 'raft' : 'scene-parcel'} />}</div>}
    <div className="campaign-stage-repair" aria-hidden="true" style={{ '--repair-progress': fraction }} />
    <p className="campaign-motor-hint">{beat.mechanic === 'sound_signpost' ? 'Meet the sound. Tap to hear it again.' : play.hint}</p>
  </div>;
}
