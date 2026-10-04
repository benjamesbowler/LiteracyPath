import { useEffect, useRef, useState } from 'react';
import { createRhymePopEngine } from './rhymePopEngine.js';
import './RhymePopGame.css';

export default function RhymePopPresentation({ difficulty = 'easy', sessionSeed = 0, journey = null, startLevel = 0,
  progressScopeKey, isSoundEnabled = true, onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onEngineReady, onSessionStart }) {
  const mount = useRef(null), engine = useRef(null), sound = useRef(isSoundEnabled), choices = useRef(new Map());
  const [hud, setHud] = useState(null), [delivery, setDelivery] = useState(null), [artEpoch, setArtEpoch] = useState(0);
  const callbacks = useRef({ onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onEngineReady, onSessionStart });
  useEffect(() => { callbacks.current = { onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onEngineReady, onSessionStart }; },
    [onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onEngineReady, onSessionStart]);
  useEffect(() => { sound.current = isSoundEnabled; engine.current?.soundChanged(isSoundEnabled); }, [isSoundEnabled]);
  useEffect(() => {
    const choiceMap = choices.current;
    const current = createRhymePopEngine(mount.current, { difficulty, sessionSeed, journey, startLevel, progressScopeKey,
      getSound: () => sound.current, onHud: setHud, onDelivery: setDelivery,
      onChoicePositions: rows => { for (const row of rows) {
        const button = choiceMap.get(row.id); if (!button) continue;
        button.style.transform = `translate(${row.x-row.r}px,${row.y-row.r}px)`; button.style.width = `${row.r*2}px`; button.style.height = `${row.r*2}px`;
      } },
      onScoreUpdate: score => callbacks.current.onScoreUpdate?.(score),
      onProgressUpdate: (done, total) => callbacks.current.onProgressUpdate?.(done, total),
      onCheckpoint: (index, total) => callbacks.current.onCheckpoint?.(index, total),
      onComplete: (...args) => callbacks.current.onComplete?.(...args), onSessionStart: () => callbacks.current.onSessionStart?.() });
    engine.current = current;
    // QA can inspect physical state, pause or mark support, but cannot select
    // an answer or advance an encounter through the published controller.
    callbacks.current.onEngineReady?.({ pause: current.pause, resume: current.resume, markSupported: current.markSupported, debugSnapshot: current.debugSnapshot });
    return () => { current.destroy(); engine.current = null; choiceMap.clear(); };
  }, [difficulty, sessionSeed, journey, startLevel, progressScopeKey, artEpoch]);
  const focusPlay = () => mount.current?.closest('.lg-game-player-main')?.focus({ preventScroll: true });
  const unavailable = delivery && [...Object.values(delivery.assets || {}), ...Object.values(delivery.actions || {})].includes('unavailable');
  return <section ref={mount} className={`rp-stage${unavailable ? ' is-art-unavailable' : ''}`} aria-label="Rhyme Pop festival" data-child-real-play>
    {hud && <>
      <div className="rp-cue" data-child-instruction>
        <button type="button" className="rp-hear" aria-label="Hear rhyme clue again" disabled={!isSoundEnabled}
          onClick={() => { engine.current?.replay(); focusPlay(); }}>
          {hud.picture.image && <img src={hud.picture.image} alt={hud.picture.kind === 'meaning-context' ? 'Meaning scene. Hear the clue.' : 'Clue picture. Hear its name.'} />}
          <span>{isSoundEnabled ? 'Hear' : 'Sound off'}</span>
        </button>
        <div><div className="rp-progress" data-child-progress><strong>{hud.stage+1} / {hud.totalStages}</strong><span>Wind {hud.act+1}</span></div>
          <h2>{hud.celebrating ? hud.target : hud.hintMistakes ? 'Try again. Pop rhymes.' : 'Pop rhyming words.'}</h2>
          <div className="rp-family-progress" aria-label={`${hud.accepted} rhymes found of ${hud.totalRhymes}`}>
            {Array.from({ length: hud.totalRhymes }, (_, index) => <span key={index} className={index < hud.accepted ? 'is-found' : ''} aria-hidden="true" />)}
            <b>{hud.accepted} / {hud.totalRhymes}</b>
          </div>
          {!hud.celebrating && hud.hintMistakes >= 2 && <small role="status" data-rhyme-hint>Listen to the ending sound.</small>}
        </div>
      </div>
      <div role="group" aria-label="Drifting word balloons" data-child-choices>{hud.choices.map(row => <button type="button" key={row.id}
        ref={element => { if (element) choices.current.set(row.id, element); else choices.current.delete(row.id); }}
        className="rp-balloon-control" aria-label={`Aim and fire at ${row.word}`} data-rhyme-balloon={row.id}
        onClick={event => { const rect = mount.current.getBoundingClientRect();
          engine.current?.aimWord(row.id, event.detail ? 'pointer' : 'assistive', event.detail ? { x: event.clientX-rect.left, y: event.clientY-rect.top } : null); focusPlay(); }} />)}</div>
      <div className="rp-feedback" role="status">{hud.coach || (hud.focusedWord ? `Aim: ${hud.focusedWord}` : 'Aim at a balloon. Fire!')}</div>
      <div className="rp-aim-controls" role="group" aria-label="Launcher controls">
        <button type="button" aria-label="Aim at previous balloon" onClick={() => { engine.current?.select(-1); focusPlay(); }}>‹</button>
        <button type="button" aria-label="Aim at next balloon" onClick={() => { engine.current?.select(1); focusPlay(); }}>›</button>
      </div>
      <button type="button" className="rp-fire" data-child-primary onClick={() => { engine.current?.fire(); focusPlay(); }} aria-label="Fire foam orb">Fire</button>
      {hud.saveError && <button type="button" className="rp-save-retry" onClick={() => engine.current?.retrySave()}>Try saving again</button>}
      {unavailable && <button type="button" className="rp-art-retry" aria-label="Reload festival art"
        onClick={() => { engine.current?.pause(); setArtEpoch(value => value+1); }}><span>Reload</span><span>art</span></button>}
    </>}
  </section>;
}
