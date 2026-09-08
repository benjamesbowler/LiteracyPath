import { useEffect, useMemo, useRef, useState } from 'react';
import { buildRacerMission, createRacerState, currentRacerRound, reduceRacerIntent, racerEvidence } from '../../utils/soundRacerMission.js';
import { createRacerSimulation, advanceRacerFrame } from '../../utils/soundRacerSimulation.js';
import { loadThree, hasSeenOnboarding, markOnboardingSeen } from '../../components/learn/games/shared/threeShell.js';
import { isInteractiveKeyTarget } from '../../utils/interactiveEventTarget.js';
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare } from '../../utils/audio/gameSfx.js';
import { createRacerScene } from './scene.js';
import { SOUND_RACER_SCENE_KIT as KIT } from './sceneKit.js';
import { playRacerTarget, prewarmRacerTarget, playRacerExample, playRacerInstruction } from './audio.js';
import RacerFallback from './RacerFallback.jsx';
import './sound-racer.css';

export default function RacerSession(props) {
  const { difficulty = 'easy', startLevel = 0 } = props;
  const [trackIndex, setTrackIndex] = useState(Math.max(0, Math.min(9, startLevel)));
  const [replay, setReplay] = useState(0);
  const results = useRef(new Map());
  const callbacks = useRef(props);
  useEffect(() => { callbacks.current = props; });
  const diagnostics = import.meta.env.DEV ? props.diagnostics : undefined;
  const mission = useMemo(() => buildRacerMission({
    difficulty, trackIndex, seed: `${diagnostics?.seed ?? trackIndex}:${replay}`
  }), [difficulty, trackIndex, replay, diagnostics?.seed]);
  const previousScore = () => [...results.current].filter(([index]) => index !== trackIndex).reduce((sum, [, result]) => sum + result.score, 0);
  return <RacerMission key={`${mission.id}:${replay}`} mission={mission} diagnostics={diagnostics}
    isSoundEnabled={props.isSoundEnabled !== false} onExit={props.onExit}
    onEngineReady={props.onEngineReady}
    onScore={score => callbacks.current.onScoreUpdate?.(previousScore() + score)}
    onBegin={() => {
      callbacks.current.onCheckpoint?.(trackIndex, mission.trackCount);
      callbacks.current.onProgressUpdate?.(trackIndex, mission.trackCount);
    }}
    onFinish={result => {
      results.current.set(trackIndex, result);
      callbacks.current.onProgressUpdate?.(trackIndex + 1, mission.trackCount);
      if (trackIndex === mission.trackCount - 1) {
        const all = [...results.current.values()];
        callbacks.current.onComplete?.(
          Math.round(all.reduce((sum, item) => sum + item.stars, 0) / all.length),
          all.reduce((sum, item) => sum + item.score, 0),
          all.reduce((sum, item) => sum + item.completedPractice, 0)
        );
      }
    }}
    onNext={() => setTrackIndex(index => index + 1)}
    onReplay={() => setReplay(value => value + 1)} />;
}

function RacerMission({ mission, diagnostics, isSoundEnabled, onEngineReady, onBegin, onScore, onFinish, onNext, onReplay, onExit }) {
  const [view, setView] = useState(() => createRacerState(mission));
  const state = useRef(view);
  const sim = useRef(createRacerSimulation());
  const frameSnapshot = useRef(null);
  const [fallbackSnapshot, setFallbackSnapshot] = useState({ distance: 0, lateral: 0, phase: 'approach', roundIndex: 0, lane: 1 });
  const [started, setStarted] = useState(() => hasSeenOnboarding('sound-racer'));
  const startedRef = useRef(started);
  const sound = useRef(isSoundEnabled);
  const alive = useRef(true);
  const cueSerial = useRef(0);
  const cuePlayback = useRef(null);
  const guidanceActive = useRef(false);
  const guidanceOwner = useRef(0);
  const pauseReasons = useRef({ local: false, external: false, hidden: document.hidden });
  const dialog = useRef(null);
  const graphics = useRef(null);
  const sceneMount = useRef(null);
  const [graphicsStatus, setGraphicsStatus] = useState(diagnostics?.fallback ? 'fallback' : 'loading');
  const graphicsStatusRef = useRef(graphicsStatus);
  const [reduceMotion, setReduceMotion] = useState(() => Boolean(diagnostics?.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const [finishedResult, setFinishedResult] = useState(null);
  const finished = useRef(false);
  const primary = useRef(null);
  const lastPublishedFrame = useRef(0);
  const callbacks = useRef({ onBegin, onScore, onFinish });
  useEffect(() => { callbacks.current = { onBegin, onScore, onFinish }; });

  function publish(next) {
    if (!alive.current || next === state.current) return;
    state.current = next;
    setView(next);
    callbacks.current.onScore?.(racerEvidence(next).score);
  }
  function send(type, detail = {}) {
    const current = state.current;
    const round = currentRacerRound(current);
    publish(reduceRacerIntent(current, {
      type, revision: current.revision, missionId: mission.id, roundId: round?.id, ...detail
    }));
  }
  function stopVoice() { guidanceActive.current = false; guidanceOwner.current += 1; cuePlayback.current?.(); cuePlayback.current = null; }
  function hearTarget() {
    const current = state.current;
    const round = currentRacerRound(current);
    if (!round || !sound.current || current.paused || !['approach', 'decision', 'retry'].includes(current.phase)) return;
    stopVoice();
    const cueId = `${round.id}:cue:${++cueSerial.current}`;
    send('CUE_REQUEST', { cueId });
    cuePlayback.current = playRacerTarget(mission.target, {
      cueId,
      isCurrent: () => alive.current && sound.current && !state.current.paused
        && currentRacerRound(state.current)?.id === round.id && state.current.cue.id === cueId,
      onDelivery: ({ audioDelivery: status }) => {
        const latest = state.current;
        publish(reduceRacerIntent(latest, { type: 'CUE_RESULT', revision: current.revision,
          missionId: mission.id, roundId: round.id, cueId, status }));
      }
    });
  }
  function hearInstructions(thenTarget = false) {
    if (!sound.current || state.current.paused) return;
    stopVoice();
    guidanceActive.current = true;
    const owner = ++guidanceOwner.current;
    cuePlayback.current = playRacerInstruction({
      cueId: `${mission.id}:instructions:${++cueSerial.current}`,
      isCurrent: () => alive.current && sound.current && !state.current.paused && guidanceOwner.current === owner,
      onDelivery: ({ audioDelivery }) => {
        if (audioDelivery === 'pending') return;
        guidanceActive.current = false;
        if (thenTarget && ['delivered', 'unavailable'].includes(audioDelivery)) {
          // A missing/blocked instruction may finish before its cancellation
          // function returns. Start the target only after that owner is stored.
          queueMicrotask(() => {
            if (alive.current && guidanceOwner.current === owner) hearTarget();
          });
        }
      }
    });
  }
  function setPauseReason(reason, paused) {
    pauseReasons.current[reason] = paused;
    if (Object.values(pauseReasons.current).some(Boolean)) { stopVoice(); send('PAUSE'); }
    else send('RESUME');
  }
  function pause() { setPauseReason('local', true); }
  function resume() { setPauseReason('local', false); }
  function selectLane(lane) { if (startedRef.current) send('SELECT_LANE', { lane }); }
  function commit() {
    if (!startedRef.current) return;
    const before = state.current;
    send('COMMIT');
    if (before === state.current) return;
    stopVoice();
    if (sound.current) (state.current.phase === 'transition' ? playCorrectChime : playSoftBuzz)();
  }
  function begin() {
    markOnboardingSeen('sound-racer');
    send('REQUEST_HELP');
    startedRef.current = true;
    setStarted(true);
    if (sound.current) hearInstructions(true);
  }

  useEffect(() => {
    sound.current = isSoundEnabled;
    if (!isSoundEnabled) { stopVoice(); send('USE_PRINTED'); }
    else if (startedRef.current && !state.current.paused && !state.current.cue.id && !guidanceActive.current) hearTarget();
    // Keep a gesture-started current cue; only a new owner or sound change may
    // request another one. Recovery never recreates the mission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSoundEnabled, view.index, started]);
  useEffect(() => prewarmRacerTarget(mission.target), [mission.target]);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduceMotion(Boolean(diagnostics?.reducedMotion || query.matches));
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, [diagnostics?.reducedMotion]);

  useEffect(() => {
    if (diagnostics?.fallback) return;
    graphicsStatusRef.current = 'loading';
    const abort = new AbortController();
    let owner = null;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setGraphicsStatus('loading'); });
    const fail = () => {
      if (cancelled) return;
      graphicsStatusRef.current = 'fallback';
      setGraphicsStatus('fallback');
      abort.abort();
      owner?.dispose();
      graphics.current = null;
    };
    const timeout = window.setTimeout(fail, 15000);
    loadThree().then(THREE => {
      if (cancelled || abort.signal.aborted) return null;
      if (diagnostics?.assetFailure) throw new Error('Preview asset failure');
      return createRacerScene(THREE, sceneMount.current, {
        mission, signal: abort.signal, reducedMotion: reduceMotion,
        quality: diagnostics?.quality, onFailure: fail
      });
    }).then(api => {
      window.clearTimeout(timeout);
      if (!api) return;
      if (cancelled || abort.signal.aborted) { api.dispose(); return; }
      owner = api; graphics.current = api;
      graphicsStatusRef.current = 'ready'; setGraphicsStatus('ready');
    }).catch(() => { window.clearTimeout(timeout); fail(); });
    return () => { cancelled = true; window.clearTimeout(timeout); abort.abort(); owner?.dispose(); graphics.current = null; };
  }, [mission, diagnostics?.fallback, diagnostics?.assetFailure, diagnostics?.quality, reduceMotion]);

  useEffect(() => {
    alive.current = true;
    callbacks.current.onBegin?.();
    onEngineReady?.({
      pause: () => setPauseReason('external', true),
      resume: () => setPauseReason('external', false),
      teardown: () => setPauseReason('external', true)
    });
    let last = performance.now(), frame = 0;
    const loop = now => {
      if (!alive.current) return;
      const elapsed = now - last;
      last = now;
      if (startedRef.current) {
        const next = advanceRacerFrame(sim.current, state.current, elapsed);
        sim.current = next.sim;
        publish(next.state);
      }
      const current = state.current;
      const snapshot = { ...sim.current, phase: current.phase, roundIndex: current.index, lane: current.lane, feedback: current.feedback };
      frameSnapshot.current = snapshot;
      graphics.current?.render(snapshot, current.paused ? 0 : elapsed / 1000);
      if (graphicsStatusRef.current !== 'ready' && now - lastPublishedFrame.current > 80) {
        lastPublishedFrame.current = now;
        setFallbackSnapshot(snapshot);
      }
      if (current.phase === 'finished' && !finished.current) {
        finished.current = true;
        stopVoice();
        const result = racerEvidence(current, { timeMs: sim.current.timeSeconds * 1000 });
        setFinishedResult(result);
        callbacks.current.onFinish?.(result);
        if (sound.current) playCelebrationFanfare();
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const hidden = () => {
      if (document.hidden && startedRef.current && !finished.current) pause();
      setPauseReason('hidden', document.hidden);
    };
    const blur = () => { if (startedRef.current && !finished.current) pause(); };
    const key = event => {
      const nativeTarget = isInteractiveKeyTarget(event.target);
      const steerControl = event.target?.closest?.('[data-sr-driving-control]');
      if (nativeTarget && !steerControl) return;
      if (state.current.paused || !startedRef.current) return;
      const direction = ['ArrowLeft', 'a', 'A'].includes(event.key) ? -1
        : ['ArrowRight', 'd', 'D'].includes(event.key) ? 1 : 0;
      if (direction) {
        event.preventDefault();
        selectLane(Math.max(0, Math.min(2, state.current.lane + direction)));
      } else if (!nativeTarget && [' ', 'Enter'].includes(event.key)) {
        event.preventDefault(); if (!event.repeat) commit();
      }
    };
    window.addEventListener('keydown', key);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', hidden);
    const diagnostic = () => structuredClone({ state: state.current, simulation: sim.current,
      graphics: graphicsStatusRef.current, started: startedRef.current });
    if (import.meta.env.DEV && diagnostics) window.__SOUND_RACER__ = { snapshot: diagnostic };
    return () => {
      alive.current = false; stopVoice(); cancelAnimationFrame(frame);
      window.removeEventListener('keydown', key); window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hidden);
      if (import.meta.env.DEV && window.__SOUND_RACER__?.snapshot === diagnostic) delete window.__SOUND_RACER__;
    };
    // One lifetime owns callbacks and intent refs; parent chrome updates do not
    // recreate the frame loop or silently reset the current mission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = dialog.current;
    if (!root) return;
    const controls = () => [...root.querySelectorAll('button:not(:disabled)')];
    controls().at(-1)?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const buttons = controls();
      if (!buttons.length) return;
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    };
    root.addEventListener('keydown', trap);
    return () => root.removeEventListener('keydown', trap);
  }, [started, view.paused, finishedResult]);

  const exampleWord = mission.exampleWord;
  function hearExample() {
    if (!sound.current) return;
    stopVoice(); send('REQUEST_HELP');
    cuePlayback.current = playRacerExample(exampleWord, {
      cueId: `${mission.id}:example:${++cueSerial.current}`,
      isCurrent: () => alive.current && sound.current && !startedRef.current,
      onDelivery: () => {}
    });
  }
  const round = currentRacerRound(view);
  const choice = round?.choices.find(item => item.id === view.selectedChoiceId);
  const completed = view.evidence.filter(item => item.completed).length;
  const showDecisions = started && !view.paused && !finishedResult;
  const canCommit = view.phase === 'decision' && Boolean(choice);
  const cueFailed = ['unavailable', 'interrupted'].includes(view.cue.status);
  return <section className={`sr-mission sr-${mission.difficulty}${reduceMotion ? ' sr-reduced-motion' : ''}`}
    aria-label="Sound Racer rally" data-sr-phase={view.phase} data-sound-racer-lane={view.lane}>
    <div ref={sceneMount} className={`sr-scene ${graphicsStatus !== 'ready' ? 'sr-scene-hidden' : ''}`} />
    {graphicsStatus !== 'ready' && <div className="sr-fallback"><RacerFallback mission={mission} snapshot={fallbackSnapshot} reducedMotion={reduceMotion} /></div>}
    <div className="sound-racer-hud sr-hud" data-sound-racer-lane={view.lane}>
      <header className="sr-dashboard" inert={!started || view.paused || finishedResult ? true : undefined}>
        <div className="sr-mission-target" data-sr-panel="target">
          <img src={KIT.driver.image} alt="Muddy" width="56" height="56" />
          <div><span className="sr-eyebrow">Muddy's rally · Track {mission.trackIndex + 1}</span><strong>Find a word starting with <b data-sr="target">{mission.target}</b></strong></div>
        </div>
        <div className="sr-dashboard-actions">
          <span className="sr-progress" aria-label={`${completed} of ${mission.needed} road signs`}>{completed}<span> / {mission.needed}</span><small>road signs</small></span>
          {isSoundEnabled && <button type="button" className="sr-round-button" data-sr="hear-target" aria-label={`Hear ${mission.target.toUpperCase()} sound again`} onClick={hearTarget}>♪<span>Hear sound</span></button>}
          {started && !finishedResult && <button type="button" className="sr-round-button" aria-label={view.paused ? 'Resume driving' : 'Pause driving'} onClick={view.paused ? resume : pause}>{view.paused ? '▶' : 'Ⅱ'}<span>{view.paused ? 'Resume' : 'Pause'}</span></button>}
        </div>
      </header>
      {showDecisions && <div className="sr-play-area">
        <div className="sr-route-cue" aria-live="polite">
          {view.phase === 'approach' ? 'Choose your next road.' : view.phase === 'decision' ? 'Take your time. Which word fits?' : view.phase === 'retry' ? 'Keep this sign. Try another road.' : 'Road open! Here we go.'}
          <span>{isSoundEnabled ? (cueFailed ? 'Sound could not finish. Read the target or hear it again.' : view.cue.status === 'pending' ? 'Sound is loading. You can use the printed target.' : '') : 'Use the printed sound to choose.'}</span>
        </div>
        <div className="sr-road-signs" role="group" aria-label="Choose a road">
          {round?.choices.map(item => <button type="button" key={item.id} className={`sr-road-sign${choice?.id === item.id ? ' selected' : ''}`}
            aria-pressed={choice?.id === item.id} aria-label={`Choose ${item.word}, ${['left', 'middle', 'right'][item.lane]} road`}
            disabled={!['approach', 'decision'].includes(view.phase)} onClick={() => selectLane(item.lane)}>
            <span className="sr-sign-direction" aria-hidden="true">{['↖', '↑', '↗'][item.lane]}</span><strong>{item.word}</strong><small>{['Left road', 'Middle road', 'Right road'][item.lane]}</small>
          </button>)}
        </div>
        <div className="sr-feedback" data-sr="banner" role="status" aria-live="polite" aria-atomic="true">
          {view.feedback && <><strong>{view.feedback.kind === 'correct' ? '✓ Road open' : 'Try another road'}</strong><span>{view.feedback.word} starts with {view.feedback.onset?.toUpperCase() || 'another sound'}. {view.feedback.kind !== 'correct' && `Find ${mission.target.toUpperCase()}.`}</span></>}
        </div>
        <div className="sr-driving-controls">
          <button type="button" data-sr="left-control" data-sr-driving-control className="sr-steer" aria-label="Steer left" disabled={!['approach', 'decision'].includes(view.phase)} onClick={() => selectLane(Math.max(0, view.lane - 1))}>←</button>
          {view.phase === 'retry' ? <button ref={primary} type="button" className="sr-primary" onClick={() => send('RETRY')}>Try another road</button>
            : <button ref={primary} type="button" className="sr-primary" disabled={!canCommit} onClick={commit}>{view.phase === 'transition' ? 'Driving through…' : choice ? `Drive through ${choice.word}` : 'Choose a road above'}</button>}
          <button type="button" data-sr="right-control" data-sr-driving-control className="sr-steer" aria-label="Steer right" disabled={!['approach', 'decision'].includes(view.phase)} onClick={() => selectLane(Math.min(2, view.lane + 1))}>→</button>
        </div>
      </div>}
      {!started && <div className="sr-dialog-wrap" data-sr="overlay"><div ref={dialog} className="sr-dialog" role="dialog" aria-modal="true" aria-label="Start Sound Racer">
        <span className="sr-eyebrow">Muddy's village rally</span><h1>Every sound opens a road.</h1>
        <div className="sr-tutorial-example" role="region" aria-label="Sound example"><b data-sr="tutorial-target">{mission.target}</b><div><strong data-sr="tutorial-word">{exampleWord}</strong> starts with {mission.target}.<br />{isSoundEnabled ? <button type="button" onClick={hearExample} aria-label={`Hear ${mission.target.toUpperCase()} in ${exampleWord}`}>Hear an example</button> : 'You can use the printed target.'}</div></div>
        <div role="region" aria-label="How to steer"><p>Choose a word on a road sign.<br />Then press <strong>Drive through</strong> to open the road.</p><p className="sr-control-tip">← → or A / D chooses · Space drives<br />Touch: tap a sign, then Drive through.</p></div>
        {isSoundEnabled && <button type="button" onClick={() => hearInstructions()}>Hear how to play</button>}<button type="button" className="sr-primary" onClick={begin}>Tap to play</button>
      </div></div>}
      {view.paused && started && !finishedResult && <div className="sr-dialog-wrap"><div ref={dialog} className="sr-dialog" role="dialog" aria-modal="true" aria-label="Rally paused"><h2>Parked for a moment.</h2><p>Your road signs are still here.</p><button type="button" className="sr-primary" onClick={resume}>Keep driving</button></div></div>}
      {finishedResult && <div className="sr-dialog-wrap" data-sr="overlay"><div ref={dialog} className="sr-dialog sr-result" role="dialog" aria-modal="true" aria-label="Sound Racer track complete">
        <span className="sr-eyebrow">Finish line · Track {mission.trackIndex + 1}</span><h2>Every road is open!</h2>
        <div className="sr-result-stars" aria-label={`${finishedResult.stars} out of 3 stars`}>{'★'.repeat(finishedResult.stars)}</div>
        <p>You opened {finishedResult.completedPractice} roads.</p><p>{finishedResult.correct} first choices matched the target.{finishedResult.supportedPractice > 0 && ' You used support along the way.'}</p>
        <div className="sr-result-actions">{mission.trackIndex + 1 < mission.trackCount && <button type="button" className="sr-primary" onClick={onNext}>Next rally</button>}
          <button type="button" onClick={onReplay}>Drive this track again</button>{onExit && <button type="button" onClick={onExit}>Back to Arcade</button>}</div>
      </div></div>}
    </div>
  </section>;
}
