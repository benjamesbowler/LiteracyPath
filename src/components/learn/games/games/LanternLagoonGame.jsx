import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '../../../../hooks/useReducedMotion.js';
import { createLearningDwell, LEARNING_PACE } from '../../../../utils/learningPace.js';
import { createLanternVoice } from '../../../../utils/lanternLagoonVoice.js';
import { appendLanternRetry, appendLanternSupport, buildLanternLagoonDeck, isLanternSavedSessionValid, lanternChoiceDescription, lanternErrorFeedback, lanternResponse, newLanternEvidence } from '../../../../utils/lanternLagoonModel.js';
import { LANTERN_ANIMAL_ASSETS, LANTERN_ASSETS } from '../../../../data/lanternLagoonAssets.js';
import { loadPhonicsSession, phonicsSessionKey, savePhonicsSession } from './phonicsSession.js';
import { playCorrectChime } from '../../../../utils/audio/gameSfx.js';
import './LanternLagoonGame.css';

function AnimalFallback({ species, action = 'sitting' }) {
  const rabbit = species === 'rabbit', bird = species === 'duck' || species === 'hen';
  const fill = { cat: '#e5a141', dog: '#ac734b', pig: '#e9a1ae', hen: '#b77838', duck: '#ecd36a', rabbit: '#f8f6ec' }[species];
  return <svg viewBox="0 0 120 120" aria-hidden="true" className="lantern-animal-fallback">
    <ellipse cx="60" cy="112" rx="35" ry="5" fill="#172b3b" opacity=".2" />
    <g transform={action === 'sleeping' ? 'translate(0 22) scale(1 .72)' : action === 'jumping' ? 'translate(0 -12)' : undefined} fill={fill} stroke="#493e37" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M29 79 Q20 57 34 42 Q51 32 74 46 Q94 55 94 86 Q89 109 64 109 L36 109 Q18 103 29 79Z" />
      {rabbit ? <><path d="M38 45 Q17 3 29 3 Q48 10 50 46Z" /><path d="M62 42 Q69 1 82 5 Q88 16 75 49Z" /><path d="M32 15 L43 39 M78 16 L70 37" fill="none" stroke="#e7a7b0" strokeWidth="6" /></> : !bird && <><path d="M34 46 L28 18 L52 36Z" /><path d="M67 36 L91 18 L86 49Z" /></>}
      {species === 'hen' && <path d="M43 34 Q36 16 48 19 Q50 9 59 18 Q72 10 76 31" fill="#bd4937" />}
      <ellipse cx="59" cy="62" rx="30" ry="29" />
      {bird && <path d="M29 65 L10 72 L31 81Z" fill="#d88a40" />}
      {action === 'sleeping' ? <path d="M39 60 Q46 66 52 59 M66 59 Q73 65 78 58" fill="none" /> : <><ellipse cx="46" cy="59" rx="4" ry="6" fill="#27323b" /><ellipse cx="74" cy="59" rx="4" ry="6" fill="#27323b" /><circle cx="47" cy="57" r="1.4" fill="white" stroke="none" /><circle cx="75" cy="57" r="1.4" fill="white" stroke="none" /></>}
      {species === 'pig' ? <ellipse cx="60" cy="75" rx="12" ry="8" fill="#cf7d94" /> : !bird && <path d="M54 74 L60 78 L66 74 M60 78 Q58 88 51 82 M60 78 Q63 88 70 82" fill="none" />}
      <path d="M35 100 Q39 89 48 96 L50 109 L29 109Z M73 101 Q76 92 84 97 L92 109 L72 109Z" />
      {action === 'eating' && <><path d="M57 78 L68 110 L77 84Z" fill="#da8741" /><path d="M75 85 L89 70 M76 84 L85 63" fill="none" stroke="#748848" strokeWidth="4" /></>}
    </g>
  </svg>;
}
function AnimalArt({ choice }) {
  const [failed, setFailed] = useState(false);
  const src = choice.species === 'rabbit' ? LANTERN_ASSETS[`rabbit-${choice.action}`]?.path : LANTERN_ANIMAL_ASSETS[choice.species];
  return failed || !src ? <AnimalFallback species={choice.species} action={choice.action} />
    : <img className="lantern-animal-art" src={src} alt="" draggable="false" onError={() => setFailed(true)} />;
}

function LanternArt() {
  const [failed, setFailed] = useState(false);
  return failed ? <svg className="lantern-prop-fallback" viewBox="0 0 90 120" aria-hidden="true">
    <path d="M16 62V26Q16 7 45 7T74 26V62" fill="none" stroke="#b6803d" strokeWidth="5" />
    <path d="M30 26H60L65 40H25Z M22 92H68L64 108H26Z" fill="#315b8c" stroke="#253e62" strokeWidth="3" />
    <path d="M28 42H62L68 89Q45 104 22 89Z" fill="#df9c43" stroke="#315b8c" strokeWidth="5" />
    <path d="M31 50H59L61 82L45 91L29 82Z" fill="#f3d37a" />
    <path d="M26 46L62 90M64 46L28 90" stroke="#355c87" strokeWidth="4" />
    <path d="M35 20H55" stroke="#29476f" strokeWidth="7" strokeLinecap="round" />
  </svg> : <img src={LANTERN_ASSETS.lantern.path} alt="" onError={() => setFailed(true)} />;
}

function Bridge({ mini = false }) {
  const [failed, setFailed] = useState(false);
  // The paired older message uses a compact semantic module with a wider
  // arch, so the full equal-size duck remains visibly under the deck even
  // in the short-landscape three-scene layout.
  if (mini) return <div className="lantern-mini-bridge" aria-hidden="true"><svg viewBox="0 0 160 180" preserveAspectRatio="none">
    <path d="M2 49L19 45V175L1 179ZM141 45L158 49L159 179L141 175Z" fill="#9b8a74" stroke="#554d43" strokeWidth="3" />
    <path d="M1 84L19 82M1 116L19 114M1 147L19 149M142 81L159 85M142 116L159 115M142 149L159 146" stroke="#c2b397" strokeWidth="5" />
    <path d="M0 45Q80 -5 160 45V66Q80 18 0 66Z" fill="#b98f5e" stroke="#624b35" strokeWidth="3" />
    <path d="M0 59Q80 11 160 59" fill="none" stroke="#d0ab78" strokeWidth="3" />
    {[25, 50, 75, 100, 125, 150].map(x => <path key={x} d={`M${x} ${20 + Math.abs(x - 80) * .25}V${40 + Math.abs(x - 80) * .25}`} stroke="#816345" strokeWidth="2" />)}
    <path d="M14 48V7M146 48V7M14 14Q80 -5 146 14" fill="none" stroke="#967044" strokeWidth="5" strokeLinecap="round" />
  </svg></div>;
  return <div className={mini ? 'lantern-mini-bridge' : 'lantern-bridge'} aria-hidden="true">{!failed ? <img src={LANTERN_ASSETS.bridge.path} alt="" onError={() => setFailed(true)} /> : <svg viewBox="0 0 600 260" preserveAspectRatio="none">
    <path d="M8 57 L592 57 L592 254 L487 254 Q465 103 300 103 Q135 103 113 254 L8 254Z" fill="#926f4e" stroke="#554a40" strokeWidth="8" />
    <path d="M0 35 L600 35 L600 75 L0 75Z" fill="#bb9669" stroke="#64523d" strokeWidth="7" />
    {[75, 150, 225, 300, 375, 450, 525].map(x => <path key={x} d={`M${x} 37 L${x} 73`} stroke="#8e6f4b" strokeWidth="4" />)}
    <path d="M35 31 L35 3 M565 31 L565 3" stroke="#795d40" strokeWidth="20" />
    <path d="M9 157 L84 147 M505 151 L593 166 M26 211 L99 200 M510 209 L579 228" stroke="#b29872" strokeWidth="13" />
  </svg>}</div>;
}
function ObjectArt({ object, relation }) {
  if (object === 'bridge') return <Bridge mini />;
  if (object === 'box') return <svg viewBox="0 0 140 110" className="lantern-object-art" aria-hidden="true"><path d="M9 31 L52 8 L131 24 L91 57Z" fill={relation === 'on' ? '#c8a371' : '#694d35'} stroke="#b98d58" strokeWidth="8" /><path d="M9 32 L91 56 L91 108 L9 77Z" fill="#b58a59" stroke="#74543b" strokeWidth="3" /><path d="M91 57 L132 24 L132 77 L91 108Z" fill="#91663d" stroke="#74543b" strokeWidth="3" /><path d="M17 53 L83 73 M102 64 L126 44" stroke="#cfaa79" strokeWidth="4" /></svg>;
  if (object === 'log') return <svg viewBox="0 0 150 80" className="lantern-object-art" aria-hidden="true"><path d="M24 11 L127 8 Q153 40 127 72 L24 75Z" fill="#976d42" stroke="#5d493a" strokeWidth="3" /><ellipse cx="25" cy="43" rx="23" ry="32" fill="#c9ad78" stroke="#5d493a" strokeWidth="3" /><ellipse cx="25" cy="43" rx="15" ry="23" fill="none" stroke="#a68a58" strokeWidth="3" /><path d="M59 26 L128 22 M56 51 L135 50" stroke="#6b5136" strokeWidth="5" /></svg>;
  if (object === 'bed') return <svg viewBox="0 0 150 90" className="lantern-object-art" aria-hidden="true"><path d="M12 6 L12 86 M138 31 L138 86 M12 74 L138 74" stroke="#926d49" strokeWidth="12" /><path d="M18 30 L138 40 L138 70 L18 65Z" fill="#4868a4" stroke="#31466a" strokeWidth="3" /><path d="M20 21 L60 24 L60 41 L20 39Z" fill="#f9f1d7" stroke="#bda982" strokeWidth="3" /></svg>;
  if (object === 'pen') return <svg viewBox="0 0 160 110" className="lantern-object-art" aria-hidden="true"><path d="M13 82 L13 25 L56 10 L148 25 L148 87" fill="#b8ba80" stroke="#8b704f" strokeWidth="7" /><path d="M13 57 L148 57 M13 34 L148 34" stroke="#a3865f" strokeWidth="6" />{[15, 48, 82, 115, 148].map(x => <path key={x} d={`M${x} 25 L${x} 93`} stroke="#785f45" strokeWidth="8" />)}</svg>;
  if (object === 'mud') return <svg viewBox="0 0 160 90" className="lantern-object-art" aria-hidden="true"><path d="M7 57 Q-1 28 40 30 Q66 0 92 25 Q142 13 151 52 Q167 90 102 86 Q54 103 23 81Z" fill="#906953" stroke="#594e42" strokeWidth="3" /><path d="M35 56 Q63 47 79 56 M101 61 Q128 48 139 57" fill="none" stroke="#b39578" strokeWidth="4" /></svg>;
  if (object === 'grass') return null;
  return <svg viewBox="0 0 160 80" className="lantern-object-art" aria-hidden="true"><path d="M14 9 L151 14 L141 74 L5 66Z" fill="#c7ac79" stroke="#846848" strokeWidth="4" /><path d="M27 10 L19 68 M48 11 L40 69 M70 12 L62 71 M92 13 L84 72 M113 14 L105 73 M134 15 L126 74 M11 31 L149 36 M8 51 L146 56" stroke="#a28961" strokeWidth="3" /></svg>;
}

function Actor({ choice, selected, result, modelled, onChoose, onAim, disabled, actorRef, onKeyDown, className = '' }) {
  return <button type="button" ref={actorRef} className={`lantern-actor ${className}${selected ? ' is-aimed' : ''}${result === 'correct' ? ' is-lit' : ''}${modelled ? ' is-modelled' : ''}`}
    aria-label={lanternChoiceDescription(choice)} disabled={disabled} onClick={() => onChoose(choice.id)} onFocus={() => onAim(choice.id)} onKeyDown={onKeyDown}
    data-choice-id={choice.id}>
    <AnimalArt choice={choice} />
    {selected && <span className="lantern-choice-mark" aria-hidden="true">{result === 'correct' ? '✓' : '↻'}</span>}
  </button>;
}

export default function LanternLagoonGame(props) {
  const { difficulty = 'easy', startLevel = 0, resumedCheckpoint = false, sessionSeed = 0, journey, taughtCycle, mode = 'reading', progressScopeKey = 'default', isSoundEnabled = true,
    completionPresentedByPlayer = false, onRequestReplay, onRequestNextLevel, onExit } = props;
  const callbacks = useRef(props);
  useLayoutEffect(() => { callbacks.current = props; }, [props]);
  const sessionKey = phonicsSessionKey(progressScopeKey, 'lantern-lagoon', difficulty);
  const [initial] = useState(() => {
    const fresh = buildLanternLagoonDeck({ difficulty, taughtCycle, mode, sessionSeed, journey });
    const saved = loadPhonicsSession(sessionKey, Number(startLevel) || 0);
    const valid = isLanternSavedSessionValid(saved?.gameState, { difficulty, taughtCycle, sessionSeed, journey, startLevel });
    return valid ? saved.gameState : { deck: fresh, seed: sessionSeed, journeyIndex: journey?.index || 0, round: Math.min(Number(startLevel) || 0, Math.max(0, fresh.rounds.length - 1)), phase: 'active', attempts: 0,
      selectedId: null, support: resumedCheckpoint || Number(startLevel) > 0 ? ['resume_without_support_record'] : [], modelled: false, audioDelivery: 'not_requested', evidence: newLanternEvidence(fresh, sessionSeed, Number(startLevel) || 0), score: 0 };
  });
  const [state, setState] = useState(initial);
  const stateRef = useRef(state);
  useLayoutEffect(() => { stateRef.current = state; }, [state]);
  const [paused, setPaused] = useState(false);
  const pausedSources = useRef({ external: false, hidden: typeof document !== 'undefined' && document.hidden });
  const pauseRef = useRef(false);
  const mounted = useRef(true);
  const dwell = useRef(null), voice = useRef(null), actorRefs = useRef([]), resultReceipt = useRef(null), roundAudioStarted = useRef('');
  const reducedMotion = useReducedMotion();
  const current = state.deck.rounds[state.round];
  const update = patch => { const previous = stateRef.current; const next = typeof patch === 'function' ? patch(previous) : { ...previous, ...patch }; stateRef.current = next; setState(next); };

  function cancelVoice() { voice.current?.cancel(); voice.current = null; }
  function stopRound() { dwell.current?.cancel(); dwell.current = null; cancelVoice(); }
  function persist(snapshot = stateRef.current) {
    if (snapshot.phase === 'complete') { savePhonicsSession(sessionKey, null); return; }
    savePhonicsSession(sessionKey, { round: snapshot.round, gameState: { ...snapshot, remainingMs: dwell.current?.active ? dwell.current.remainingMs : null } });
  }
  function syncPause() {
    const next = pausedSources.current.external || pausedSources.current.hidden;
    pauseRef.current = next; setPaused(next);
    if (next) { dwell.current?.pause(); voice.current?.pause(); persist(); }
    else { voice.current?.resume(); dwell.current?.resume(); }
  }
  function markSupported(reason = 'mission-help') {
    const value = stateRef.current;
    if (!current || value.phase === 'complete') return;
    update({ support: [...new Set([...value.support, reason])], evidence: appendLanternSupport(value.evidence,
      { round: value.deck.rounds[value.round].id, kind: reason, beforeFirstResponse: value.attempts === 0 }) });
  }
  function readSentence({ feedback = false } = {}) {
    const value = stateRef.current, round = value.deck.rounds[value.round];
    if (!round || pauseRef.current || value.phase === 'complete') return Promise.resolve('cancelled');
    cancelVoice();
    if (!callbacks.current.isSoundEnabled || !round.audioPath) {
      if (!feedback) update({ audioDelivery: callbacks.current.isSoundEnabled ? 'unavailable' : 'sound_off' });
      return Promise.resolve(callbacks.current.isSoundEnabled ? 'unavailable' : 'sound_off');
    }
    const beforeRetry = feedback && value.phase !== 'correct';
    if (!feedback || beforeRetry) update({ support: [...new Set([...value.support, feedback ? 'feedback_sentence' : 'sentence_replay'])], audioDelivery: 'requested' });
    const roundId = round.id;
    voice.current = createLanternVoice(round.audioPath, { onDelivery(status) {
      if (!mounted.current || stateRef.current.deck.rounds[stateRef.current.round]?.id !== roundId) return;
      update(previous => ({ ...previous, ...(!feedback || beforeRetry ? { audioDelivery: status } : {}), evidence: appendLanternSupport(previous.evidence,
        { round: roundId, kind: feedback ? 'result_readback' : 'sentence_audio', delivery: status }) }));
    } });
    if (pauseRef.current) voice.current.pause();
    const promise = voice.current.promise;
    if (dwell.current?.active) dwell.current.waitFor(promise);
    return promise;
  }

  const engineApi = useMemo(() => ({
    pause() { pausedSources.current.external = true; syncPause(); },
    resume() { pausedSources.current.external = false; syncPause(); },
    markSupported(reason) { markSupported(reason); },
    replayPrompt() { return readSentence(); },
    debugSnapshot() { return { ...stateRef.current, paused: pauseRef.current, remainingMs: dwell.current?.remainingMs ?? null }; },
  // The API owns current refs; GamePlayer receives a stable identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  useEffect(() => { callbacks.current.onEngineReady?.(engineApi); }, [engineApi]);
  useEffect(() => {
    function visibility() { pausedSources.current.hidden = document.hidden; syncPause(); }
    mounted.current = true; document.addEventListener('visibilitychange', visibility); visibility();
    return () => { mounted.current = false; document.removeEventListener('visibilitychange', visibility); persist(); stopRound(); };
    // The lifetime belongs to this mounted run, not a current round closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!isSoundEnabled && voice.current?.active) { cancelVoice(); update({ audioDelivery: 'sound_off' }); }
  }, [isSoundEnabled]);
  useEffect(() => {
    persist(); callbacks.current.onCheckpoint?.(state.round, state.deck.rounds.length);
    callbacks.current.onProgressUpdate?.(state.round, state.deck.rounds.length);
    callbacks.current.onScoreUpdate?.(state.score);
    // Only semantic state changes publish progress; parent callback churn does
    // not reset or reshuffle the live message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  useEffect(() => {
    const round = stateRef.current.deck.rounds[stateRef.current.round];
    if (!round || state.phase !== 'active' || round.mode !== 'listening' || pauseRef.current || roundAudioStarted.current === round.id) return;
    roundAudioStarted.current = round.id;
    readSentence();
    // Listening starts once per real scene, never on an unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.round, state.deck, state.phase, paused]);

  function finish() {
    if (resultReceipt.current) return;
    stopRound();
    const value = stateRef.current;
    const evidence = structuredClone({ ...value.evidence, journeyIndex: value.journeyIndex, completedRounds: value.deck.rounds.length, participation: true, masteryClaim: false });
    const receipt = Object.freeze([3, value.score, value.deck.rounds.length, evidence]); resultReceipt.current = receipt;
    update({ phase: 'complete' }); savePhonicsSession(sessionKey, null);
    callbacks.current.onResultReady?.(...receipt);
    callbacks.current.onComplete?.(...receipt);
  }
  function advance() {
    if (pauseRef.current || stateRef.current.phase !== 'correct') return;
    const value = stateRef.current;
    if (value.round + 1 === value.deck.rounds.length) { finish(); return; }
    cancelVoice();
    update({ round: value.round + 1, phase: 'active', selectedId: null, attempts: 0, support: [], modelled: false, audioDelivery: 'not_requested', remainingMs: null });
  }
  useEffect(() => {
    if (state.phase !== 'correct' && state.phase !== 'model') return;
    const model = state.phase === 'model';
    dwell.current?.cancel();
    dwell.current = createLearningDwell({ minimumMs: state.remainingMs ?? LEARNING_PACE.sentence, onAdvance: () => {
      if (model) update({ phase: 'active', selectedId: null }); else advance();
    } });
    if (current.audioPath && isSoundEnabled) dwell.current.waitFor(readSentence({ feedback: true }));
    if (pauseRef.current) { dwell.current.pause(); voice.current?.pause(); }
    return () => { dwell.current?.cancel(); dwell.current = null; };
    // Result state owns the dwell; delivery/evidence updates must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.round, state.deck]);

  function choose(id) {
    const value = stateRef.current, round = value.deck.rounds[value.round];
    if (pauseRef.current || !round || value.phase !== 'active') return;
    const choice = round.choices.find(item => item.id === id); if (!choice) return;
    const response = lanternResponse(round, id, { attempt: value.attempts, audioDelivery: value.audioDelivery,
      replayUsed: value.support.includes('sentence_replay'), modelUsed: value.modelled, supportUsed: value.support });
    let evidence = { ...value.evidence, firstResponses: [...value.evidence.firstResponses], assistedRetries: [...value.evidence.assistedRetries] };
    if (value.attempts === 0) evidence.firstResponses.push({ ...response, supportUsed: [...new Set([...response.supportUsed, ...value.support])] });
    else evidence = appendLanternRetry(evidence, response);
    const correct = response.correct;
    update({ selectedId: id, attempts: value.attempts + 1, evidence, phase: correct ? 'correct' : value.attempts >= 1 ? 'model' : 'active',
      modelled: value.modelled || (!correct && value.attempts >= 1), score: value.score + (correct ? 10 : 0), remainingMs: null });
    if (correct && isSoundEnabled) playCorrectChime();
    // The first error keeps its specific visible scene description and
    // rereads the supplied whole message. Later modelling owns the same
    // actual recording through its dwell; neither can change first evidence.
    if (!correct && value.attempts === 0 && isSoundEnabled) readSentence({ feedback: true });
  }
  function switchMode() {
    if (pauseRef.current || stateRef.current.phase === 'correct' || stateRef.current.phase === 'model' || stateRef.current.phase === 'complete') return;
    stopRound();
    const nextMode = stateRef.current.deck.mode === 'together' ? mode : 'together';
    const deck = buildLanternLagoonDeck({ difficulty, taughtCycle, mode: nextMode, sessionSeed, journey });
    roundAudioStarted.current = ''; resultReceipt.current = null;
    callbacks.current.onSessionStart?.();
    update({ deck, seed: sessionSeed, journeyIndex: journey?.index || 0, round: 0, phase: 'active', attempts: 0, selectedId: null, modelled: false, support: [], audioDelivery: 'not_requested',
      evidence: appendLanternSupport(newLanternEvidence(deck, sessionSeed), { kind: 'mode_change', previousMode: stateRef.current.deck.mode, mode: deck.mode }), score: 0 });
  }
  function aim(id) { if (!pauseRef.current) update({ aimedId: id }); }
  function arrowAim(event, index) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + 3) % 3;
    actorRefs.current[next]?.focus();
  }
  if (!current) return <div className="lantern-lagoon"><p>No supported messages are available. Return to Games and try again.</p><button type="button" onClick={onExit}>Games</button></div>;
  const selected = current.choices.find(choice => choice.id === state.selectedId);
  const feedback = state.phase === 'complete' ? 'Your lagoon trail is lit!' : state.phase === 'correct' ? `Yes. ${current.sentence}` : state.phase === 'model' ? `Watch this friend. ${current.sentence} Then try it yourself.`
    : selected ? lanternErrorFeedback(selected) : current.choices.some(choice => choice.companion) ? 'Tap the scene the message describes.' : 'Tap the friend the message describes.';
  const unavailable = ['unavailable', 'sound_off'].includes(state.audioDelivery) && state.deck.mode === 'listening';
  const actorProps = (choice, index) => ({ choice, selected: state.selectedId === choice.id, result: state.phase === 'correct' ? 'correct' : null,
    modelled: state.modelled && state.phase === 'model' && choice.id === current.answerId, onChoose: choose, onAim: aim,
    disabled: paused || ['correct', 'model', 'complete'].includes(state.phase), actorRef: node => { actorRefs.current[index] = node; }, onKeyDown: event => arrowAim(event, index) });
  return <div className="lantern-lagoon-frame"><section className={`lantern-lagoon${current.clauses ? ' has-compound-message' : ''}${reducedMotion ? ' has-reduced-motion' : ''}${paused ? ' is-paused' : ''}${state.phase === 'correct' ? ' route-open' : ''}`}
    aria-label="Lantern Lagoon" data-mode={state.deck.mode} data-phase={state.phase} data-round={state.round}>
    <div className="lantern-message">
      <span className="lantern-mode">{state.deck.mode === 'reading' ? 'Read' : state.deck.mode === 'listening' ? 'Listen' : 'Read together'}</span>
      <p className="lantern-sentence">{current.clauses ? current.clauses.map((clause, index) => <span key={clause}>{index ? ' ' : ''}{clause}</span>) : current.sentence}</p>
      <div className="lantern-message-actions">
        {current.audioPath && <button type="button" className="lantern-hear" disabled={paused || !isSoundEnabled || state.phase === 'complete'} onClick={() => readSentence()} aria-label="Hear the whole sentence again">◖))<span>Hear</span></button>}
        <button type="button" className="lantern-together" disabled={paused || ['correct', 'model', 'complete'].includes(state.phase)} onClick={switchMode}
          aria-label={state.deck.mode === 'together' ? 'Back to my messages' : 'Read richer messages with a grown-up'}>▤<span>{state.deck.mode === 'together' ? 'Back' : 'Together'}</span></button>
      </div>
      {unavailable && <p className="lantern-audio-notice" role="status">{state.audioDelivery === 'sound_off' ? 'Sound is off.' : 'The sentence could not play.'} Try Hear, or read together with a grown-up.</p>}
    </div>
    <div className={`lantern-world${current.layout === 'bridge' ? ' is-bridge-scene' : ''}`}>
      <div className="lantern-horizon" aria-hidden="true" />
      <svg className="lantern-water" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H1000V600H0Z" fill="#52758b" /><path d="M0 80 Q250 30 500 100 T1000 80 M0 190 Q250 145 500 195 T1000 185 M0 310 Q250 255 500 305 T1000 300 M0 435 Q250 380 500 425 T1000 430" stroke="#a4b7b5" strokeWidth="4" opacity=".55" fill="none" /></svg>
      {current.layout === 'bridge' ? <div className={`lantern-bridge-stage${current.mirrored ? ' is-mirrored' : ''}${current.choices.filter(item => item.relation === 'under').length === 2 ? ' has-multiple-under' : ''}`}>
        <div className="lantern-left-bank" aria-hidden="true" /><div className="lantern-right-bank" aria-hidden="true" /><Bridge />
        {current.choices.map((choice, index) => <Actor key={choice.id} {...actorProps(choice, index)} className={`at-${choice.relation}${current.choices.filter(item => item.relation === 'under').length === 2 && choice.relation === 'under' ? ` under-pair-${current.choices.filter(item => item.relation === 'under').findIndex(item => item.id === choice.id)}` : ''}`} />)}
      </div> : <div className={`lantern-islands${current.choices.some(choice => choice.companion) ? ' has-paired-scenes' : ''}`} aria-label="Three lagoon scenes">
        {current.choices.map((choice, index) => <div key={choice.id} className={`lantern-island relation-${choice.relation}${choice.companion ? ' has-companion' : ''}`} data-object={choice.object}>
          <span className="lantern-island-ground" aria-hidden="true" />
          <div className="lantern-landmark"><ObjectArt object={choice.object} relation={choice.relation} /></div>
          <Actor {...actorProps(choice, index)} />
          {choice.relation === 'in' && ['box', 'pen'].includes(choice.object) && <div className={`lantern-front-${choice.object}`} aria-hidden="true" />}
          {choice.companion && <div className={`lantern-companion relation-${choice.companion.relation}`} aria-hidden="true"><ObjectArt object={choice.companion.object} /><AnimalArt choice={choice.companion} /></div>}
        </div>)}
      </div>}
      <div className="lantern-traveller" aria-hidden="true"><LanternArt /></div>
      <div className="lantern-stepping-route" aria-hidden="true">{Array.from({ length: state.deck.rounds.length }, (_, index) => <i key={index} className={index <= state.round && state.phase === 'correct' || index < state.round ? 'is-open' : ''} />)}</div>
      {paused && <div className="lantern-pause-state" role="status">Paused</div>}
      {state.phase === 'complete' && <div className="lantern-completion">
        <LanternArt /><h2>Your lagoon trail is lit!</h2><p>You helped {state.deck.rounds.length} friends.</p>
        {!completionPresentedByPlayer && <div className="lantern-completion-actions">{onRequestNextLevel && <button type="button" onClick={onRequestNextLevel}>Another trail</button>}{onRequestReplay && <button type="button" onClick={onRequestReplay}>Play again</button>}{onExit && <button type="button" onClick={onExit}>Games</button>}</div>}
      </div>}
    </div>
    <div className="lantern-feedback" role="status" aria-live="polite"><p>{feedback}</p><span>{Math.min(state.round + 1, state.deck.rounds.length)} of {state.deck.rounds.length} friends</span></div>
  </section></div>;
}
