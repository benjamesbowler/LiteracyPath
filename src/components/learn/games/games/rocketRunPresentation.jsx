import { useEffect, useRef, useState } from 'react';
import { createRocketRunEngine } from './rocketRunEngine.js';
import { loadRocketRunCraft } from './rocketRunCraftData.js';
import { createRocketWorldRecordsOwner } from './rocketRunWorldRecords.js';
import './RocketRunV2.css';

function FlightControl({ action, label, children, primary, className = '', onHold, onCancel, focusPlay }) {
  const heldPointer = useRef(null);
  const pointer = (pressed, event, cancelled = false) => {
    if (pressed && event.button != null && event.button !== 0) return;
    if (!pressed && heldPointer.current !== event.pointerId) return;
    heldPointer.current = pressed ? event.pointerId : null;
    onHold(action, pressed, event.pointerType === 'touch' ? 'touch' : 'pointer', event.pointerId);
    if (pressed) { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); }
    else if (!cancelled) focusPlay();
  };
  const cancel = event => {
    if (heldPointer.current !== event.pointerId) return;
    pointer(false, event, true);
    onCancel?.();
  };
  const key = (pressed, event) => {
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    if (!event.repeat || !pressed) onHold(action, pressed, 'keyboard', event.code || event.key);
  };
  return <button type="button" className={`rocket-flight-control ${className}`} aria-label={label}
    data-child-primary={primary || undefined} onPointerDown={event => pointer(true, event)}
    onPointerUp={event => pointer(false, event)} onPointerCancel={cancel}
    onLostPointerCapture={cancel} onKeyDown={event => key(true, event)}
    onKeyUp={event => key(false, event)} onClick={event => {
      if (!event.detail) { onHold(action, true, 'assistive', 'accessible-click'); onHold(action, false, 'assistive', 'accessible-click'); focusPlay(); }
    }}>{children}</button>;
}

export function RocketFlightCompletion({ result, journey, onRequestNextLevel, onRequestReplay, onExit }) {
  const panel = useRef(null);
  useEffect(() => { panel.current?.querySelector('button')?.focus({ preventScroll: true }); }, []);
  const trapFocus = event => {
    if (event.key !== 'Tab') return;
    const buttons = [...event.currentTarget.querySelectorAll('button:not([disabled])')];
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !event.currentTarget.contains(document.activeElement))) {
      event.preventDefault(); first?.focus();
    }
  };
  const primary = onRequestNextLevel ? 'next' : onRequestReplay ? 'replay' : 'exit';
  return <div className="rocket-flight-finish-shade">
    <div ref={panel} className="rocket-flight-finish" role="alertdialog" aria-modal="true"
      aria-labelledby="rocket-flight-finish-title" onKeyDown={trapFocus}>
      <div className="rocket-flight-finish-summary">
        <h2 id="rocket-flight-finish-title">Flight complete!</h2>
        <div className="rocket-flight-finish-stars" aria-label={`${result.stars} of 3 stars`}>
          <span aria-hidden="true">{'★'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</span>
        </div>
        <p data-child-progress><b>{result.words}</b> words caught<br />{result.score} points</p>
      </div>
      <div className="rocket-flight-finish-actions" data-child-choices>
        {onRequestNextLevel && <button type="button" data-child-primary={primary === 'next' || undefined}
          onClick={onRequestNextLevel}>{journey ? 'Next trail' : 'Next level'}</button>}
        {onRequestReplay && <button type="button" data-child-primary={primary === 'replay' || undefined}
          onClick={onRequestReplay}>{journey ? 'Play this again' : 'Replay level'}</button>}
        {onExit && <button type="button" data-child-primary={primary === 'exit' || undefined}
          onClick={onExit}>Back to Arcade</button>}
      </div>
    </div>
  </div>;
}

/** This owned presentation is not yet the live registry consumer. Activation
 * follows the retained legacy baseline and actual canonical craft delivery. */
export default function RocketRunPresentation({ difficulty = 'easy', sessionSeed = 0, journey = null, startLevel = 0,
  progressScopeKey, craftRecords, isSoundEnabled = true, onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete,
  onEngineReady, onSessionStart, onRequestNextLevel, onRequestReplay, onExit, completionPresentedByPlayer = false }) {
  const mount = useRef(null), engine = useRef(null), sound = useRef(isSoundEnabled);
  const [hud, setHud] = useState(null), [delivery, setDelivery] = useState(null);
  const [recordStatus, setRecordStatus] = useState({ status: 'waiting' });
  const callbacks = useRef({ onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onEngineReady, onSessionStart });
  useEffect(() => { callbacks.current = { onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onEngineReady, onSessionStart }; },
    [onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onEngineReady, onSessionStart]);
  useEffect(() => { sound.current = isSoundEnabled; engine.current?.soundChanged(isSoundEnabled); }, [isSoundEnabled]);
  useEffect(() => {
    const current = createRocketWorldRecordsOwner({ difficulty,
      loadWorld: craftRecords ? async () => craftRecords : loadRocketRunCraft,
      onStatus: setRecordStatus,
      createEngine: recordsOptions => createRocketRunEngine(mount.current, { difficulty, sessionSeed, journey, startLevel, progressScopeKey,
      ...recordsOptions, getSound: () => sound.current, onHud: setHud, onDelivery: setDelivery,
      onScoreUpdate: (...args) => callbacks.current.onScoreUpdate?.(...args),
      onProgressUpdate: (...args) => callbacks.current.onProgressUpdate?.(...args),
      onCheckpoint: (...args) => callbacks.current.onCheckpoint?.(...args),
      onComplete: (...args) => callbacks.current.onComplete?.(...args), onSessionStart: () => callbacks.current.onSessionStart?.() }) });
    engine.current = current;
    callbacks.current.onEngineReady?.({ pause: current.pause, resume: current.resume, markSupported: current.markSupported,
      debugSnapshot: current.debugSnapshot });
    void current.start();
    return () => { current.destroy(); engine.current = null; };
  }, [difficulty, sessionSeed, journey, startLevel, progressScopeKey, craftRecords]);
  const focusPlay = () => mount.current?.closest('.lg-game-player-main')?.focus({ preventScroll: true });
  const hold = (...args) => engine.current?.hold(...args);
  const cancelControl = () => engine.current?.release();
  const unavailable = delivery && (delivery.model.delivery.some(row => row.status === 'failed' || row.status === 'unavailable')
    || Object.values(delivery.actions).includes('unavailable') || Object.values(delivery.sky).includes('unavailable')
    || Object.values(delivery.route || {}).includes('unavailable'));
  const cue = hud?.layout?.cue;
  const coach = hud?.layout?.coach;
  const inlineCoach = hud?.layout?.portrait;
  const feedback = <div className={`rocket-flight-coach ${inlineCoach ? 'rocket-flight-coach-inline' : ''}`} role="status"
    style={!inlineCoach && coach ? { left: coach.x, top: coach.y, width: coach.right - coach.x,
      height: coach.bottom - coach.y, right: 'auto', bottom: 'auto' } : undefined}>{hud?.coach}</div>;
  return <section ref={mount} className={`rocket-v2 rocket-v2-${difficulty}`} aria-label="Rocket Run word courier flight" data-child-real-play>
    {recordStatus.status !== 'ready' && <div className="rocket-world-loading" role="status">
      <b>{recordStatus.status === 'failed' ? 'Flight could not load' : 'Loading flight'}</b>
      <span>{recordStatus.status === 'failed' ? 'Your caught words are kept.' : 'Preparing your ship and flight world.'}</span>
      {recordStatus.status === 'failed' && <button type="button" data-child-primary
        onClick={() => { void engine.current?.start(); focusPlay(); }}>Reload flight</button>}
    </div>}
    {recordStatus.status === 'ready' && hud && !hud.complete && <>
      <div className="rocket-flight-cue" data-child-instruction style={cue ? { left: cue.x, top: cue.y,
        width: cue.right - cue.x, height: cue.bottom - cue.y } : undefined}>
        <div className="rocket-target-copy"><span>Catch</span><b data-rocket-target>{hud.target}</b><span>words</span></div>
        <button type="button" className="rocket-hear" aria-label="Hear the target sound again" disabled={!isSoundEnabled}
          onClick={() => { engine.current?.replay(); focusPlay(); }}>{isSoundEnabled ? 'Hear' : 'Sound off'}</button>
        <div className="rocket-flight-progress" data-child-progress><b>{hud.round + 1} / {hud.totalRounds}</b>
          <span>{hud.caught} / {hud.needed} caught</span></div>
        {inlineCoach && feedback}
      </div>
      <div className="rocket-word-controls" role="group" aria-label="Approaching readable words" data-child-choices>
        {hud.choices.map(row => <button type="button" key={row.flightId} data-rocket-courier={row.flightId}
          className="rocket-word-control" aria-label={`Choose word ${row.word}`} style={{ left: row.rect.x,
            top: row.rect.y - 11, width: row.rect.width, height: 56 }} onClick={event => {
            engine.current?.choose(event.detail ? 'pointer' : 'assistive', row.trialId); focusPlay();
          }} />)}
      </div>
      <div className="rocket-flight-shield" aria-label={`${hud.hearts} lives${hud.protected ? '; shield protecting the ship' : ''}`}>
        <span aria-hidden="true">{'♥'.repeat(hud.hearts)}{'♡'.repeat(3 - hud.hearts)}</span>
        {hud.protected && <b>Shield on</b>}
      </div>
      {!inlineCoach && feedback}
      <div className="rocket-flight-actions" role="group" aria-label="Flight controls">
        <FlightControl action="left" label="Steer spaceship left" onHold={hold} onCancel={cancelControl} focusPlay={focusPlay}>‹</FlightControl>
        <FlightControl action="right" label="Steer spaceship right" onHold={hold} onCancel={cancelControl} focusPlay={focusPlay}>›</FlightControl>
        <FlightControl action="catch" label={`Catch the selected readable word; ${hud.caught} of ${hud.needed} words caught; ${hud.hearts} lives${hud.protected ? '; shield on' : ''}`} primary={!hud.contextRecovery && !hud.stopped} className="rocket-catch"
          onHold={hold} onCancel={cancelControl} focusPlay={focusPlay}><span>Catch<span className="rocket-control-caught" data-child-progress
            aria-label={`${hud.caught} of ${hud.needed} words caught`}> {hud.caught}/{hud.needed}</span></span><small className="rocket-control-lives" aria-hidden="true">{hud.protected ? 'Shield on' : '♥'.repeat(hud.hearts) + '♡'.repeat(3 - hud.hearts)}</small></FlightControl>
        <FlightControl action="boost" label="Hold to boost the spaceship" onHold={hold} onCancel={cancelControl} focusPlay={focusPlay}>Boost</FlightControl>
      </div>
      {hud.contextRecovery && <div className="rocket-flight-retry" role="status"><b>Flight paused</b><span>Your caught words are kept.</span>
        <button type="button" data-child-primary disabled={!hud.playable} onClick={() => { engine.current?.resumeContext(); focusPlay(); }}>
          {hud.playable ? 'Continue flight' : 'Loading ship'}</button></div>}
      {hud.stopped && !hud.contextRecovery && <div className="rocket-flight-retry" role="status"><b>Shield empty</b><span>Your caught words stay saved.</span>
        <button type="button" data-child-primary onClick={() => { engine.current?.retryFlight(); focusPlay(); }}>Retry flight</button></div>}
      {(hud.saveError || unavailable) && <button type="button" className="rocket-recovery" aria-label={hud.saveError ? 'Retry saving flight' : 'Reload spaceship art'}
        onClick={() => { if (hud.saveError) engine.current?.retrySave(); else engine.current?.retryArt(); focusPlay(); }}>
        {hud.saveError ? 'Save again' : 'Reload art'}</button>}
      {hud.celebrating && <div className="rocket-round-reward" role="status">Sound sector complete!</div>}
    </>}
    {hud?.complete && hud.result && !completionPresentedByPlayer && <RocketFlightCompletion result={hud.result}
      journey={journey} onRequestNextLevel={onRequestNextLevel} onRequestReplay={onRequestReplay} onExit={onExit} />}
  </section>;
}
