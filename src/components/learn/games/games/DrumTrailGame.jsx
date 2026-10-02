import { useEffect, useMemo, useRef, useState } from 'react';
import { Howler } from 'howler';
import { SpeakerHigh, HandPalm, ArrowClockwise } from '@phosphor-icons/react';
import { getLedaWordAudioPath, getLedaInstructionAudioPath } from '../../../../data/ledaProductionAudio.js';
import { DRUM_TRAIL_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { buildDrumTrailRounds, commitDrumTrailAnswer, drumTrailActor, drumTrailFeedback, newDrumTrailEvidence } from '../../../../utils/drumTrailRules.js';
import { loadDrumTrailSession, saveDrumTrailSession } from '../../../../utils/drumTrailSession.js';
import { createDrumTrailVoice } from '../../../../utils/drumTrailVoice.js';
import { createLearningDwell, LEARNING_PACE } from '../../../../utils/learningPace.js';
import './DrumTrailGame.css';

const ART = '/images/arcade/drum-trail/';
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four'];
const DRUM_TAP_AUDIO = '/audio/ui/tap.mp3';
const IDLE = { x: 10, y: 85, frame: 0, facing: 1 };

function initialState(rounds, difficulty, seed, startLevel, scope, resumedCheckpoint) {
  const restored = loadDrumTrailSession(scope, difficulty, seed, startLevel, rounds);
  if (restored) return { ...restored, phase: restored.phase === 'correct' ? 'correct' : 'ready',
    delivery: restored.delivery === 'delivered' ? 'delivered' : 'pending', saveError: false };
  const index = Math.min(Math.max(0, startLevel), rounds.length - 1);
  // A legacy/checkpoint-only resume does not invent evidence for skipped work.
  return { seed, index, cursor: startLevel, roundId: rounds[index].roundId, phase: 'ready',
    delivery: 'pending', supportReasons: resumedCheckpoint || startLevel ? ['resume_without_support_record'] : [],
    modelUsed: false, selected: null, score: 0, evidence: newDrumTrailEvidence(), saveError: false };
}

export default function DrumTrailGame({ difficulty = 'easy', sessionSeed = 0, journey,
  startLevel = 0, progressScopeKey = 'default', isSoundEnabled = true,
  resumedCheckpoint = false,
  onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onSessionStart,
  onEngineReady, onRequestReplay, completionPresentedByPlayer = false }) {
  const rounds = useMemo(() => buildDrumTrailRounds(difficulty, sessionSeed, 16, journey?.index || 0), [difficulty, sessionSeed, journey?.index]);
  const [game, setGame] = useState(() => initialState(rounds, difficulty, sessionSeed, startLevel, progressScopeKey, resumedCheckpoint));
  const [paused, setPaused] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [propsReady, setPropsReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false);
  const controllerRef = useRef(null), actorRef = useRef(null), routeRefs = useRef([]);
  const pictureDeliveryRef = useRef({ itemId: rounds[game.index].id, status: 'pending' });
  const handlers = useRef(null);
  useEffect(() => { handlers.current = { onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onSessionStart, onEngineReady, onRequestReplay }; },
    [onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onSessionStart, onEngineReady, onRequestReplay]);
  useEffect(() => {
    const image = new Image(); image.onload = () => setPropsReady(true); image.onerror = () => setPropsReady(false);
    image.src = `${ART}props.webp`;
    return () => { image.onload = null; image.onerror = null; };
  }, []);

  useEffect(() => {
    let state = initialState(rounds, difficulty, sessionSeed, startLevel, progressScopeKey, resumedCheckpoint);
    let disposed = false, enginePaused = false, playerPaused = false, hidden = document.hidden;
    let sound = isSoundEnabled, generation = 0, dwell = null, raf = null, animation = null, completed = false;
    let reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    const voice = createDrumTrailVoice({ enabled: () => sound });
    const round = () => rounds[state.index];
    const publish = next => { state = next; if (!disposed) setGame({ ...next }); };
    const drawActor = pose => {
      const element = actorRef.current;
      if (!element) return;
      element.style.left = `${pose.x}%`; element.style.top = `${pose.y}%`;
      element.style.setProperty('--drum-facing', pose.facing);
      element.style.backgroundPosition = `${pose.frame % 2 ? 100 : 0}% ${pose.frame >= 2 ? 100 : 0}%`;
    };
    const persist = (next = state, checkpoint = false) => {
      const saved = saveDrumTrailSession(progressScopeKey, difficulty, {
        seed: sessionSeed, index: next.index, cursor: next.cursor, roundId: rounds[next.index].roundId,
        phase: next.phase === 'correct' ? 'correct' : next.phase === 'retry' ? 'retry' : 'ready',
        delivery: next.delivery, supportReasons: next.supportReasons, modelUsed: next.modelUsed,
        selected: next.selected, score: next.score, evidence: next.evidence,
      });
      if (!saved.localSaved) { publish({ ...next, saveError: true }); return false; }
      if (checkpoint) {
        try { handlers.current.onCheckpoint?.(next.cursor, rounds.length); }
        catch { publish({ ...next, saveError: true }); return false; }
      }
      return true;
    };
    const markSupported = (reason = 'mission-help') => {
      if (disposed) return;
      const next = { ...state, supportReasons: [...new Set([...state.supportReasons, reason])] };
      publish(next); persist(next);
    };
    const stopAnimation = () => { cancelAnimationFrame(raf); raf = null; animation?.resolve?.(); animation = null; };
    const animateFrame = at => {
      if (!animation || disposed || enginePaused) return;
      const dt = Math.min(100, Math.max(0, at - animation.last)); animation.last = at;
      animation.elapsed = Math.min(animation.duration, animation.elapsed + dt);
      const t = animation.elapsed / animation.duration;
      drawActor(drumTrailActor(animation.route, t, animation.correct, reduce));
      if (t >= 1) { const done = animation.resolve; animation = null; raf = null; done(); }
      else raf = requestAnimationFrame(animateFrame);
    };
    const travel = (route, correct, elapsed = 0) => {
      stopAnimation();
      return new Promise(resolve => {
        const duration = correct ? 1400 : 1100;
        if (elapsed >= duration) { drawActor(drumTrailActor(route, 1, correct, reduce)); resolve(); return; }
        animation = { route, correct, resolve, duration, elapsed, last: performance.now() };
        if (!enginePaused) raf = requestAnimationFrame(animateFrame);
      });
    };
    const updatePause = () => {
      if (disposed) return;
      const next = playerPaused || hidden;
      if (next === enginePaused) return;
      enginePaused = next; setPaused(next);
      if (next) { dwell?.pause(); voice.pause(); cancelAnimationFrame(raf); raf = null; }
      else { dwell?.resume(); voice.resume(); if (animation) { animation.last = performance.now(); raf = requestAnimationFrame(animateFrame); } }
    };
    const cancelTimeline = () => { generation++; dwell?.cancel(); dwell = null; voice.cancel(); stopAnimation(); };
    const playBeats = async (count, ticket) => {
      if (!sound || disposed || ticket !== generation) return;
      for (let i = 0; i < count; i++) {
        const result = await voice.play(DRUM_TAP_AUDIO, { onStart: () => {
          if (!disposed && ticket === generation) publish({ ...state, beatIndex: i, beatCount: count });
        } });
        if (disposed || ticket !== generation) return;
        if (result.status !== 'delivered') break;
      }
      if (!disposed && ticket === generation) publish({ ...state, beatIndex: null, beatCount: null });
    };
    const feedbackVoice = async (item, reveal, ticket) => {
      // Once a cue is unavailable, keep the supported route fully playable;
      // do not make each feedback retry a broken network request. Hear is the
      // child's explicit retry. This branch makes no audio-delivery claim.
      if (!sound || state.delivery === 'unavailable') return;
      if (state.phase === 'retry') await voice.play(getLedaInstructionAudioPath('Try again'));
      if (ticket !== generation || disposed) return;
      const result = await voice.play(item.audio);
      if (ticket !== generation || disposed) return;
      if (result.status === 'delivered') { publish({ ...state, delivery: 'delivered' }); persist(); }
      else if (result.status === 'unavailable') { publish({ ...state, delivery: 'unavailable', supportReasons: [...new Set([...state.supportReasons, sound ? 'audio-unavailable' : 'sound-disabled'])] }); persist(); }
      if (reveal && result.status === 'delivered') await voice.play(getLedaWordAudioPath(NUMBER_WORDS[item.syllables]));
      if (ticket === generation && !disposed && state.phase === 'retry' && state.modelUsed) await playBeats(item.syllables, ticket);
    };
    const complete = () => {
      if (completed || disposed) return; completed = true;
      publish({ ...state, phase: 'complete' });
      const evidence = { ...state.evidence, contentVersion: DRUM_TRAIL_CONTENT_VERSION,
        sessionSeed, journeyIndex: journey?.index || 0,
        construct: 'multimodal-whole-word-syllable-count', presentationVersion: 2, practiceOnly: true,
        independentFirstCorrect: state.evidence.firstResponses.filter(row => row.correct && row.independentOralPractice).length };
      handlers.current.onComplete?.(3, state.score, state.evidence.completions.length, evidence);
    };
    const prompt = async () => {
      const ticket = ++generation;
      // Replay never erases a genuinely delivered stimulus, nor existing help.
      const result = await voice.play(round().audio);
      if (disposed || ticket !== generation || state.phase !== 'ready') return;
      if (result.status === 'delivered') { publish({ ...state, delivery: 'delivered' }); persist(); }
      else if (result.status === 'unavailable') {
        publish({ ...state, delivery: 'unavailable', supportReasons: [...new Set([...state.supportReasons, sound ? 'audio-unavailable' : 'sound-disabled'])] }); persist();
      }
    };
    const onward = () => {
      if (disposed || enginePaused || state.saveError) return;
      if (state.index + 1 >= rounds.length) { complete(); return; }
      const index = state.index + 1;
      publish({ ...state, index, cursor: index, roundId: rounds[index].roundId, phase: 'ready',
        delivery: 'pending', modelUsed: false, supportReasons: [], selected: null, beatIndex: null, beatCount: null });
      setImageFailed(false); drawActor(IDLE); const saved = persist(state, true);
      pictureDeliveryRef.current = { itemId: rounds[index].id, status: 'pending' };
      handlers.current.onProgressUpdate?.(state.evidence.completions.length, rounds.length);
      if (saved) prompt();
    };
    const hold = ({ correct, route, replay = false }) => {
      const elapsed = replay ? (animation?.elapsed ?? (correct ? 1400 : 1100)) : 0;
      cancelTimeline();
      publish({ ...state, beatIndex: null, beatCount: null });
      const item = round(), ticket = generation;
      dwell = createLearningDwell({ minimumMs: LEARNING_PACE.word, onAdvance: () => {
        if (ticket !== generation || disposed || state.saveError) return;
        if (correct) onward();
        else { publish({ ...state, phase: 'ready' }); persist(); }
      } });
      if (enginePaused) dwell.pause();
      // Audio and scene are separate gates. Reduced motion keeps the same dwell.
      const feedback = async () => {
        await playBeats(route.drums, ticket);
        if (ticket !== generation || disposed) return;
        await feedbackVoice(item, correct || state.modelUsed, ticket);
      };
      dwell.waitFor(Promise.all([feedback(),
        travel(route, correct, elapsed)]));
    };
    const choose = route => {
      if (enginePaused || disposed || state.phase !== 'ready' || state.saveError) return;
      const item = round(), deliveryAtResponse = state.delivery;
      const owned = item.routes.find(candidate => candidate.id === route?.id && candidate.drums === route?.drums);
      if (!owned) return;
      route = owned;
      const supportReasons = [...state.supportReasons];
      if (deliveryAtResponse !== 'delivered') supportReasons.push(deliveryAtResponse === 'pending' ? 'answered-before-whole-word-ended' : 'undelivered-word');
      const result = commitDrumTrailAnswer(state.evidence, item, route.drums, {
        delivery: deliveryAtResponse, supportReasons, modelUsed: state.modelUsed, wordVisible: true,
        pictureDelivery: pictureDeliveryRef.current.itemId === item.id ? pictureDeliveryRef.current.status : 'pending',
      });
      const attempts = result.evidence.assistedRetries.filter(row => row.roundId === item.roundId).length + 1;
      const modelUsed = state.modelUsed || (!result.correct && attempts >= 2);
      const next = { ...state, phase: result.correct ? 'correct' : 'retry', selected: route.drums,
        modelUsed, supportReasons: [...new Set([...supportReasons, ...(modelUsed ? ['syllable-model'] : [])])],
        cursor: state.index, score: state.score + result.awarded, evidence: result.evidence };
      publish(next);
      // Commit before animation/feedback; duplicate taps cannot award twice.
      const saved = persist(next, true);
      handlers.current.onScoreUpdate?.(next.score);
      handlers.current.onProgressUpdate?.(next.evidence.completions.length, rounds.length);
      hold({ correct: result.correct, route });
      if (!saved) publish({ ...state, saveError: true });
    };
    const replay = () => {
      if (enginePaused || disposed || state.phase === 'complete') return;
      Howler.ctx?.resume?.().catch(() => {});
      if (state.phase === 'ready') prompt();
      else hold({ correct: state.phase === 'correct', route: round().routes.find(r => r.drums === state.selected), replay: true });
    };
    const showModel = () => {
      if (disposed || enginePaused || state.phase !== 'ready' || state.saveError) return;
      publish({ ...state, modelUsed: true, supportReasons: [...new Set([...state.supportReasons, 'syllable-model'])] }); persist();
      cancelTimeline();
      const ticket = generation, item = round();
      const modelVoice = async () => {
        const result = await voice.play(item.audio);
        if (ticket !== generation || disposed) return;
        if (result.status === 'delivered') { publish({ ...state, delivery: 'delivered' }); persist(); }
        else if (result.status === 'unavailable') { publish({ ...state, delivery: 'unavailable', supportReasons: [...new Set([...state.supportReasons, sound ? 'audio-unavailable' : 'sound-disabled'])] }); persist(); }
        await playBeats(item.syllables, ticket);
        if (ticket === generation && !disposed && result.status === 'delivered') await voice.play(getLedaWordAudioPath(NUMBER_WORDS[item.syllables]));
      };
      modelVoice();
    };
    const api = {
      pause() { playerPaused = true; updatePause(); }, resume() { playerPaused = false; updatePause(); },
      markSupported, choose, replay, showModel,
      soundEnabled(value) {
        if (disposed) return;
        if (sound === value) return;
        sound = value;
        if (!value) { voice.cancel(); markSupported('sound-disabled'); publish({ ...state, delivery: 'unavailable' }); persist(); }
        else if (state.phase === 'ready' && !enginePaused) prompt();
      },
      retrySave() {
        if (disposed || enginePaused) return;
        const next = { ...state, saveError: false };
        if (!persist(next, true)) return;
        publish(next);
        if (next.phase === 'correct') hold({ correct: true, route: round().routes.find(r => r.drums === next.selected), replay: true });
        else { publish({ ...next, phase: 'ready' }); prompt(); }
      },
      ...(import.meta.env.DEV ? { debugSnapshot: () => ({ game: 'drum-trail', index: state.index, cursor: state.cursor,
        phase: state.phase, word: round().word, syllables: round().syllables, routes: round().routes,
        score: state.score, delivery: state.delivery, modelUsed: state.modelUsed, supportReasons: state.supportReasons, beatIndex: state.beatIndex ?? null, beatCount: state.beatCount ?? null,
        evidence: structuredClone(state.evidence), paused: enginePaused, sceneElapsed: animation?.elapsed ?? null,
      }) } : {}),
    };
    controllerRef.current = api;
    const visibility = () => { hidden = document.hidden; updatePause(); };
    document.addEventListener('visibilitychange', visibility);
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const motion = event => { reduce = event.matches; setReducedMotion(reduce); };
    motionQuery?.addEventListener('change', motion);
    handlers.current.onSessionStart?.();
    handlers.current.onEngineReady?.(api);
    handlers.current.onScoreUpdate?.(state.score);
    handlers.current.onProgressUpdate?.(state.evidence.completions.length, rounds.length);
    updatePause();
    const begin = requestAnimationFrame(() => {
      drawActor(IDLE);
      if (state.phase === 'correct') hold({ correct: true, route: round().routes.find(r => r.drums === state.selected) || round().routes.find(r => r.drums === round().syllables) });
      else prompt();
    });
    return () => {
      disposed = true; cancelAnimationFrame(begin); cancelTimeline(); voice.dispose();
      document.removeEventListener('visibilitychange', visibility); motionQuery?.removeEventListener('change', motion);
      if (controllerRef.current === api) controllerRef.current = null;
    };
  // GamePlayer remounts a run for difficulty/seed changes. Latest callbacks are
  // separately owned; changing score callbacks must not restart a question.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, difficulty, sessionSeed, startLevel, progressScopeKey, resumedCheckpoint]);

  useEffect(() => { controllerRef.current?.soundEnabled(isSoundEnabled); }, [isSoundEnabled]);
  const item = rounds[game.index];
  const supported = game.delivery === 'unavailable' || !isSoundEnabled;
  const ready = game.phase === 'ready' && !paused && !game.saveError;
  const correctShown = game.phase === 'correct' || game.phase === 'complete';
  const model = game.modelUsed || correctShown;
  const feedback = game.selected == null ? (game.modelUsed ? drumTrailFeedback(item, 0, { modelUsed: true }) : 'Hear the word. Choose its drum path.')
    : drumTrailFeedback(item, game.selected, { correct: correctShown, modelUsed: game.modelUsed });
  const keyboard = (event, index) => {
    if (event.repeat && ['Enter',' '].includes(event.key)) { event.preventDefault(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd'].includes(event.key)) return;
    event.preventDefault();
    const delta = ['ArrowLeft', 'ArrowUp', 'a'].includes(event.key) ? -1 : 1;
    routeRefs.current[(index + delta + item.routes.length) % item.routes.length]?.focus();
  };
  return <section className={`drum-trail ${reducedMotion ? 'drum-trail--reduced' : ''}`}
    aria-label="Drum Trail syllable crossing" data-phase={game.phase} data-paused={paused} data-props-ready={propsReady}>
    <div className="drum-trail__instruction">
      <div className="drum-trail__picture">{!imageFailed ? <img key={item.id} src={item.image} alt={item.word}
        onLoad={() => { pictureDeliveryRef.current = { itemId: item.id, status: 'delivered' }; }}
        onError={() => { pictureDeliveryRef.current = { itemId: item.id, status: 'unavailable' }; setImageFailed(true); }} />
        : <span className="drum-trail__picture-missing">Picture unavailable</span>}</div>
      <div className="drum-trail__prompt"><strong className="drum-trail__supported-word">{item.word}</strong>
        <span>Count the word’s parts. Choose a drum path.</span>
        {supported && <small>Read the word or ask someone to say it.</small>}</div>
      <button type="button" className="drum-trail__hear" aria-label="Hear the whole word again" disabled={paused || game.phase === 'complete'} onClick={() => controllerRef.current?.replay()}><SpeakerHigh size={26} /><span>Hear</span></button>
      <button type="button" className="drum-trail__landscape-model" aria-label="Show the word parts — supported practice" disabled={!ready} onClick={() => controllerRef.current?.showModel()}><HandPalm size={24} /><span>Show parts</span></button>
    </div>
    <div className="drum-trail__scene">
      <div className="drum-trail__world" style={{ backgroundImage: `url(${ART}world.webp)` }}>
        <svg className="drum-trail__bridges" viewBox="0 0 1000 563" aria-hidden="true">
          <defs><pattern id="drum-trail-wood" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#d7ae72" /><path d="M0 1H16M1 0V16" stroke="#8e6844" strokeWidth="1.2" /><path d="M4 5H12M6 9H14" stroke="#bc905b" strokeWidth=".7" /></pattern></defs>
          {item.routes.map(route => <path key={route.id} d={`M 100 478.55 Q ${route.x * 7} 460 ${route.x * 10} ${route.y * 5.63 + 24}`} className={game.selected === route.drums ? 'is-chosen' : ''} />)}
        </svg>
        {item.routes.map((route, index) => <button key={route.id} type="button" ref={element => { routeRefs.current[index] = element; }}
          className={`drum-trail__route ${game.selected === route.drums ? 'is-selected' : ''} ${model && route.drums === item.syllables ? 'is-model' : ''}`}
          style={{ left: `${route.x}%`, top: `${route.y}%` }} aria-label={`Choose the path with ${route.drums} ${route.drums === 1 ? 'drum' : 'drums'}`}
          disabled={!ready} onKeyDown={event => keyboard(event, index)} onClick={() => controllerRef.current?.choose(route)}>
          <span className="drum-trail__drums" aria-hidden="true">{Array.from({ length: route.drums }, (_, n) => <span key={n} className={`drum-trail__drum ${game.beatCount === route.drums && game.beatIndex === n ? 'is-sounding' : ''}`}>
            <svg className="drum-trail__drum-vector" viewBox="0 0 48 48" focusable="false"><path d="M6 14L9 39Q24 46 39 39L42 14" fill="#d5a86e" stroke="#76543c" strokeWidth="2" /><path d="M9 17L19 40L29 17L39 39" fill="none" stroke="#f6e4bd" strokeWidth="2" /><ellipse cx="24" cy="14" rx="18" ry="8" fill="#eee0bd" stroke="#3157c8" strokeWidth="3" /></svg>
            <span className="drum-trail__drum-art" />
          </span>)}</span>
        </button>)}
        <div ref={actorRef} className="drum-trail__bouncy" role="img" aria-label="Bouncy, the spring-legged lamb" />
        <span className="drum-trail__place" aria-hidden="true">{game.index + 1} / {rounds.length}</span>
        {paused && <div className="drum-trail__paused"><HandPalm size={32} /><strong>Paused</strong></div>}
      </div>
    </div>
    <div className="drum-trail__feedback">
      <div role="status" aria-live="polite"><span>{feedback}</span>
        {model && <div className="drum-trail__parts" aria-label={`${item.syllables} word parts`}>{item.parts.map((part, i) => <span key={i}>{part}</span>)}</div>}
        {game.saveError && <span className="drum-trail__save-error">Your place could not be saved. Try saving again.</span>}
      </div>
      {game.saveError ? <button type="button" disabled={paused} onClick={() => controllerRef.current?.retrySave()}>Retry save</button>
        : game.phase === 'complete' && !completionPresentedByPlayer ? <button type="button" onClick={() => handlers.current.onRequestReplay?.()}><ArrowClockwise size={24} />Play again</button>
          : <button type="button" className="drum-trail__footer-model" aria-label="Show the word parts — supported practice" disabled={!ready} onClick={() => controllerRef.current?.showModel()}><HandPalm size={24} /><span>Show parts</span></button>}
    </div>
  </section>;
}
