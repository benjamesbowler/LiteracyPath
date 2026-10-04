import { createLearningDwell, LEARNING_PACE } from "../../../../utils/learningPace.js";
import { WordPicture, PhonicsTargetHint } from "./PhonicsPlayShared.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SOUNDKEY_PROFILES, buildSoundKeySession } from "../../../../features/soundkeys/content.js";
import { resolveTokenForNote } from "../../../../features/soundkeys/engine.js";
import { connectWebMidi, createComputerKeyboardProvider } from "../../../../features/soundkeys/inputProviders.js";
import { createSoundKeysInstrument, phonemeForSoundKey, trySoundKey } from "../../../../features/soundkeys/instrument.js";
import { speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { createSoundKeysWorld } from './soundKeysWorld.js';
import { createSoundKeysCueQueue } from '../../../../utils/audio/soundKeysCueQueue.js';
import { SOUNDKEYS_CONTENT_VERSION, SOUNDKEYS_CONSTRUCT, newSoundKeysEvidence, soundKeysResponse, completeSoundKeysWord, loadSoundKeysSession, saveSoundKeysSession } from '../../../../utils/soundKeysSession.js';
import { phonicsTargetHint } from '../../../../utils/phonicsTargetPresentation.js';
import "./SoundKeysGame.css";

const ROUNDS = 24;
const ALL_KEYS = [...SOUNDKEY_PROFILES.cvc, ...SOUNDKEY_PROFILES.digraphs];
const DEFAULT_MAPPING = Object.fromEntries(ALL_KEYS.map((token, index) => [String(48 + index), token]));
const BANDS = ["Meadow duet", "Dino trio", "Moonwood ensemble"];

export default function SoundKeysGame({ difficulty = "easy", sessionSeed = 0, journey = null, seed = sessionSeed, startLevel = 0, progressScopeKey, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, onSessionStart, isSoundEnabled = true }) {
  const rounds = useMemo(() => buildSoundKeySession(difficulty, seed, ROUNDS), [difficulty, seed]);
  const initialRound = Math.max(0, Math.min(Number(startLevel) || 0, ROUNDS - 1));
  const restored = useMemo(() => loadSoundKeysSession(progressScopeKey, difficulty, { seed, round: initialRound, journeyIndex: journey?.index || 0, rounds }), [difficulty, initialRound, journey?.index, progressScopeKey, rounds, seed]);
  const [round, setRound] = useState(() => Math.max(0, Math.min(Number(startLevel) || 0, ROUNDS - 1)));
  const [tokens, setTokens] = useState(restored?.prefix || []);
  const [hintMistakes, setHintMistakes] = useState(restored?.roundMistakes || 0);
  const [feedback, setFeedback] = useState("");
  const [freePlay, setFreePlay] = useState(restored?.freePlay || false);
  const [voice, setVoice] = useState(restored?.voice || (journey?.variation === 1 ? "reeds" : "bells"));
  const [bank, setBank] = useState(restored?.bank || 0);
  const [pressed, setPressed] = useState([]);
  const [celebrating, setCelebrating] = useState(restored?.celebrating || false);
  const [midiMessage, setMidiMessage] = useState("");
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiConnecting, setMidiConnecting] = useState(false);
  const [mapping] = useState(() => { try { return { ...DEFAULT_MAPPING, ...JSON.parse(window.localStorage.getItem("soundkeys-mapping") || "{}") }; } catch { return DEFAULT_MAPPING; } });
  const [initialState] = useState(() => ({ tokens: restored?.prefix || [], round, score: restored?.score || 0, mistakes: restored?.mistakes || 0, roundMistakes: restored?.roundMistakes || 0,
    originRound: restored?.originRound ?? initialRound, evidence: restored?.evidence || newSoundKeysEvidence(), supportReasons: [...new Set([...(restored?.supportReasons || []), ...(restored ? ['saved-phrase-replay'] : initialRound ? ['resume-without-support-record'] : [])])],
    elapsed: restored?.elapsed || 0, epoch: performance.now() - (restored?.elapsed || 0) * 1000,
    lastPress: null, hoverIndex: null, errorAt: -Infinity, completedAt: -Infinity,
    freePlay: restored?.freePlay || false, voice: restored?.voice || (journey?.variation === 1 ? 'reeds' : 'bells'), bank: restored?.bank || 0, celebrating: restored?.celebrating || false,
    paused: false, committed: restored?.celebrating || false, complete: false, mounted: true, remaining: 0, timer: null }));
  const state = useRef(initialState);
  const field = useRef(null), world = useRef(null), persistRef = useRef(null), roundsRef = useRef(rounds), finishRef = useRef(null);
  useEffect(() => { roundsRef.current = rounds; }, [rounds]);
  const [artEpoch, setArtEpoch] = useState(0), [delivery, setDelivery] = useState(null), [settings, setSettings] = useState(false), [saveError, setSaveError] = useState(false);
  const clock = useCallback(() => state.current.paused ? state.current.elapsed : (performance.now() - state.current.epoch) / 1000, []);
  const soundRef = useRef(isSoundEnabled);
  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);
  const cue = useRef(null);
  const instrument = useRef(null);
  const held = useRef(new Map());
  const keyboardKeys = useRef([]);
  const handler = useRef(null);
  const midiCleanup = useRef(null);
  const midiAttempt = useRef(0);
  const callbacks = useRef({ onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint });
  useEffect(() => { callbacks.current = { onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint }; }, [onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint]);
  const target = rounds[round];
  const availableKeys = difficulty === "easy" ? SOUNDKEY_PROFILES.cvc : ALL_KEYS;
  const banks = Math.ceil(availableKeys.length / 8);
  const visibleKeys = availableKeys.slice(bank * 8, bank * 8 + 8);
  useEffect(() => { keyboardKeys.current = visibleKeys; }, [visibleKeys]);
  const band = Math.min(2, Math.floor(round / 8));
  useEffect(() => { state.current.freePlay = freePlay; state.current.voice = voice; state.current.bank = bank; state.current.celebrating = celebrating; }, [bank, celebrating, freePlay, voice]);
  const markSupported = reason => { state.current.supportReasons = [...new Set([...state.current.supportReasons, reason])]; };
  const persist = useCallback(() => {
    const s = state.current;
    const saved = saveSoundKeysSession(progressScopeKey, difficulty, { seed, journeyIndex: journey?.index || 0, originRound: s.originRound,
      round: s.round, word: roundsRef.current[s.round].id, prefix: [...s.tokens], bank: s.bank, voice: s.voice, freePlay: s.freePlay,
      celebrating: s.celebrating, score: s.score, mistakes: s.mistakes, roundMistakes: s.roundMistakes, elapsed: clock(),
      supportReasons: [...s.supportReasons], evidence: structuredClone(s.evidence) });
    let failed = !saved.localSaved; try { callbacks.current.onCheckpoint?.(s.round, ROUNDS); } catch { failed = true; }
    if (s.mounted) setSaveError(failed);
  }, [clock, difficulty, journey?.index, progressScopeKey, seed]);
  useEffect(() => { persistRef.current = persist; }, [persist]);

  const ensureCue = useCallback(() => {
    if (cue.current && !cue.current.inspect().disposed) return cue.current;
    cue.current = createSoundKeysCueQueue({ play: (request, options) => {
    const opts = { ...options, onEnd: src => {
      const s = state.current;
      if (!s.mounted || s.paused || request.round !== s.round) return;
      s.evidence.audioReceipts.push({ round: request.round, word: request.word, kind: request.kind, token: request.token || null, unit: request.unit ?? null, src, at: clock() });
      persistRef.current?.();
    } };
    return request.kind === 'unit' ? speakPhoneme(request.value, opts) : speakWord(request.value, opts);
    }, onPending: pending => instrument.current?.setDucked?.(pending) });
    return cue.current;
  }, [clock]);
  const stopSounds = useCallback(() => { cue.current?.cancel(); instrument.current?.stop(); held.current.clear(); setPressed([]); }, []);
  const speak = useCallback((value, phoneme = false, options = {}) => {
    if (!soundRef.current || state.current.paused) return;
    const s = state.current;
    if (options.manual) s.supportReasons = [...new Set([...s.supportReasons, 'word-replay'])];
    const queue = ensureCue();
    queue.request({ kind: options.blend ? 'blend' : phoneme ? 'unit' : 'target', value,
      round: s.round, word: roundsRef.current[s.round].id, token: phoneme ? options.token || value : null, unit: phoneme ? s.tokens.length : null }, options);
    const promise = queue.whenIdle();
    state.current.latestVoice = promise;
    if (state.current.dwell?.active) state.current.dwell.waitFor(promise);
    return promise;
  }, [ensureCue]);
  useEffect(() => {
    if (!freePlay) speak(target.id);
    return () => cue.current?.cancel();
  }, [freePlay, speak, target.id]);
  const advance = useCallback(() => {
    const s = state.current;
    s.timer = null;
    if (!s.mounted || s.paused) return;
    s.round += 1; s.tokens = []; s.roundMistakes = 0; s.committed = false; s.celebrating = false; s.supportReasons = []; s.lastPress = null;
    setTokens([]); setHintMistakes(0); setRound(s.round); setCelebrating(false); setFeedback("");
  }, []);
  const pause = useCallback(() => {
    const s = state.current; if (s.paused) return;
    s.elapsed = (performance.now() - s.epoch) / 1000;
    s.dwell?.pause(); s.paused = true; stopSounds(); persistRef.current?.();
  }, [stopSounds]);
  const resume = useCallback(() => {
    const s = state.current; if (!s.paused) return; s.epoch = performance.now() - s.elapsed * 1000; s.paused = false;
    if (!s.freePlay) speak(rounds[s.round].id, false, { blend: s.celebrating });
    s.dwell?.resume();
  }, [rounds, speak]);
  useEffect(() => { callbacks.current.onProgressUpdate?.(round, ROUNDS); persistRef.current?.(); }, [round]);
  useEffect(() => { if (!isSoundEnabled) { state.current.supportReasons = [...new Set([...state.current.supportReasons, 'sound-disabled'])]; cue.current?.cancel(); instrument.current?.stop(); persistRef.current?.(); } }, [isSoundEnabled]);

  const release = useCallback(id => {
    held.current.delete(id); instrument.current?.release(id);
    setPressed([...held.current.values()]);
  }, []);
  const play = useCallback((token, id, commit = true, audible = true, source = 'computer') => {
    const s = state.current, activeTarget = roundsRef.current[s.round];
    if (s.paused || s.complete || held.current.has(id)) return;
    const all = difficulty === 'easy' ? SOUNDKEY_PROFILES.cvc : ALL_KEYS;
    const keyIndex = all.indexOf(token);
    if (keyIndex < 0) return;
    held.current.set(id, token); setPressed([...held.current.values()]);
    if (keyIndex >= 0 && source !== 'pointer') { s.bank = Math.floor(keyIndex / 8); setBank(s.bank); }
    s.lastPress = { token, index: Math.max(0, keyIndex) % 8, at: (performance.now() - s.epoch) / 1000, source, knownKey: keyIndex >= 0 };
    if (soundRef.current && audible) {
      instrument.current ||= createSoundKeysInstrument();
      instrument.current.setDucked?.(Boolean(cue.current?.pending()));
      instrument.current.play(id, 60 + ALL_KEYS.indexOf(token) % 12, s.voice);
      if (!s.committed) speak(phonemeForSoundKey(token, s.freePlay ? null : activeTarget), true, { token });
    }
    if (!commit || s.freePlay || s.committed) return;
    const receipt = [...s.evidence.audioReceipts].reverse().find(row => row.kind === 'target' && row.round === s.round && row.word === activeTarget.id);
    s.evidence = soundKeysResponse(s.evidence, activeTarget, { round: s.round, unit: s.tokens.length, selected: token, source,
      at: (performance.now() - s.epoch) / 1000, supportReasons: s.supportReasons, receipt }).evidence;
    const result = trySoundKey(s.tokens, token, activeTarget.tokens);
    if (!result.correct) {
      s.mistakes += 1; s.roundMistakes += 1;
      s.supportReasons = [...new Set([...s.supportReasons, 'spelling-retry'])]; s.errorAt = (performance.now() - s.epoch) / 1000;
      setHintMistakes(s.roundMistakes);
      setFeedback("That part does not fit here. Your sounds are saved.");
      persistRef.current?.();
      return;
    }
    s.tokens = result.prefix; setTokens(result.prefix); setFeedback("");
    if (!result.complete) { persistRef.current?.(); return; }
    s.committed = true; s.celebrating = true; s.completedAt = (performance.now() - s.epoch) / 1000;
    s.evidence = completeSoundKeysWord(s.evidence, activeTarget, s.round, s.supportReasons);
    s.score = s.evidence.completions.reduce((sum, row) => sum + row.points, 0);
    callbacks.current.onScoreUpdate?.(s.score); setCelebrating(true);
    setFeedback(`${activeTarget.display}! Your band is growing.`);
    // Let the final key finish its phoneme. The word replay remains available;
    // a queued reward must not interrupt that sound or speak over the next key.
    speak(activeTarget.id, false, { blend: true });
    finishRef.current();
    persistRef.current?.();
  }, [difficulty, speak]);
  const finishWord = useCallback(() => {
    const s = state.current, last = s.round + 1 === ROUNDS;
    if (last) { s.complete = true; callbacks.current.onProgressUpdate?.(ROUNDS, ROUNDS); }
    s.dwell?.cancel();
    s.dwell = createLearningDwell({ minimumMs: LEARNING_PACE.word, onAdvance: () => {
      if (!s.mounted) return;
      if (last) callbacks.current.onComplete?.(s.mistakes === 0 ? 3 : s.mistakes <= 2 ? 2 : 1, s.score, s.evidence.completions.length,
        { contentVersion: SOUNDKEYS_CONTENT_VERSION, sessionSeed: seed, journeyIndex: journey?.index || 0, construct: SOUNDKEYS_CONSTRUCT,
          practiceOnly: true, formalAssessment: false, masteryClaim: false, motorCreatesEvidence: false, originRound: s.originRound,
          firstResponses: structuredClone(s.evidence.firstResponses), assistedRetries: structuredClone(s.evidence.assistedRetries),
          acceptedResponses: structuredClone(s.evidence.acceptedResponses), completions: structuredClone(s.evidence.completions) });
      else advance();
    } });
    s.dwell.waitFor(s.latestVoice);
  }, [advance, journey?.index, seed]);
  useEffect(() => { finishRef.current = finishWord; }, [finishWord]);
  const undo = useCallback(() => {
    const s = state.current; if (s.paused || s.committed || freePlay) return;
    s.tokens = s.tokens.slice(0, -1); setTokens(s.tokens); setFeedback("");
    s.supportReasons = [...new Set([...s.supportReasons, 'undo'])]; persistRef.current?.();
  }, [freePlay]);
  useEffect(() => { handler.current = event => {
    if (!state.current.mounted) return;
    if (event.type === 'token' || event.type === 'control') {
      const active = document.activeElement, host = field.current?.closest('.lg-game-player-main');
      if (!active || !(active === host || active === field.current || active.closest?.('.soundkeys-keyboard') && field.current?.contains(active))) return;
    }
    if (event.type === "midi-status") { setMidiConnected(Boolean(event.connected)); setMidiMessage(event.connected ? `${event.inputNames?.join(", ")} connected` : "Plug in your MIDI keyboard"); }
    else if (event.type === "midi-error") setMidiMessage(event.message || "Use the sound keys below");
    else if (event.type === "release-all") stopSounds();
    else if (event.type === "release") release(event.note != null ? `midi:${event.source}:${event.note}` : `key:${event.key}`);
    else if (event.type === "control") undo();
    else if (event.type === "midi") { const token = resolveTokenForNote(event.note, mapping); if (token) play(token, `midi:${event.source}:${event.note}`, true, true, 'midi'); }
    else if (event.type === "token") play(event.token, `key:${event.key || event.token}`);
  }; }, [mapping, play, release, stopSounds, undo]);
  useEffect(() => {
    state.current.mounted = true;
    const cleanup = createComputerKeyboardProvider(event => handler.current?.(event), { resolveKey: key => /^[1-8]$/.test(key) ? keyboardKeys.current[Number(key) - 1] : null, acceptTarget: (target, key) => Boolean(target?.closest?.('.soundkeys-keyboard button')) && (/^[1-8a-z]$/.test(key) || key === 'backspace') });
    if (restored?.celebrating) { state.current.completedAt = state.current.elapsed; finishRef.current(); if (state.current.freePlay) state.current.dwell.pause(); }
    const hide = () => { if (document.hidden) pause(); };
    const pageHide = () => pause();
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', pageHide);
    onSessionStart?.();
    onEngineReady?.({ pause, resume, markSupported(reason) { state.current.supportReasons = [...new Set([...state.current.supportReasons, reason])]; persistRef.current?.(); },
      debugSnapshot({ includeFrames = false } = {}) { const s = state.current; return structuredClone({ round: s.round, originRound: s.originRound, target: roundsRef.current[s.round], tokens: s.tokens,
        paused: s.paused, score: s.score, mistakes: s.mistakes, roundMistakes: s.roundMistakes, freePlay: s.freePlay, bank: s.bank, voice: s.voice,
        pressed: [...held.current.values()], complete: s.complete, celebrating: s.celebrating, evidence: s.evidence, supportReasons: s.supportReasons,
        cueQueue: cue.current?.inspect(), performance: world.current?.inspect({ includeFrames }), clock: s.paused ? s.elapsed : (performance.now() - s.epoch) / 1000 }); } });
    const s = state.current;
    const heldKeys = held.current;
    return () => { s.dwell?.cancel(); s.mounted = false; window.clearTimeout(s.timer); cleanup(); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', pageHide); midiAttempt.current += 1; midiCleanup.current?.(); cue.current?.dispose(); instrument.current?.dispose(); instrument.current = null; heldKeys.clear(); };
    // The host receives stable controls. Its changing callback must not restart the instrument.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pause, resume]);
  useEffect(() => {
    if (!field.current) return;
    world.current = createSoundKeysWorld(field.current, { getState() {
      const s = state.current;
      return { ...s, elapsed: s.paused ? s.elapsed : (performance.now() - s.epoch) / 1000,
        band: Math.min(2, Math.floor(s.round / 8)), pressed: [...held.current.values()], visibleKeys: keyboardKeys.current };
    }, getKeys() {
      const bounds = field.current?.getBoundingClientRect(); if (!bounds) return [];
      return [...field.current.querySelectorAll('.soundkeys-keyboard button')].map(button => {
        const rect = button.getBoundingClientRect();
        return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height };
      });
    }, onDelivery(value) { if (state.current.mounted) setDelivery(value); } });
    return () => { world.current?.dispose(); world.current = null; };
  }, [artEpoch]);
  async function connectMidi() {
    const attempt = ++midiAttempt.current;
    midiCleanup.current?.(); setMidiConnecting(true);
    try {
      const cleanup = await connectWebMidi(event => handler.current?.(event));
      if (!state.current.mounted || attempt !== midiAttempt.current) { cleanup(); return; }
      midiCleanup.current = cleanup;
    } catch { if (state.current.mounted) setMidiMessage("MIDI is unavailable. These keys still play."); }
    finally { if (state.current.mounted && attempt === midiAttempt.current) setMidiConnecting(false); }
  }

  const changeBank = direction => {
    stopSounds(); state.current.bank = (bank + direction + banks) % banks;
    state.current.lastPress = null; setBank(state.current.bank); persistRef.current?.(); field.current?.focus({ preventScroll: true });
  };
  return <section ref={field} tabIndex={-1} className={`soundkeys-game sk-stage band-${band}${celebrating ? ' is-celebrating' : ''}`}
    aria-label="SoundKeys instrument" data-child-surface="soundkeys" data-round={round} data-target={target.id}>
    <div className="sk-cue">
      <button type="button" className="sk-picture-replay" aria-label={isSoundEnabled ? 'Hear target word again' : 'Word replay unavailable while sound is off'}
        disabled={!isSoundEnabled || freePlay} onClick={() => { speak(target.id, false, { manual: true }); persistRef.current?.(); field.current?.focus({ preventScroll: true }); }}>
        <WordPicture key={target.id} word={target.id} className="sk-word-image" answerNeutral={!celebrating} /><span>{isSoundEnabled ? 'Hear' : 'Sound off'}</span>
      </button>
      <div className="sk-cue-copy">
        <div className="sk-progress" data-child-progress><strong>{freePlay ? 'Free play' : `${round + 1} / ${ROUNDS}`}</strong><span>{BANDS[band]}</span></div>
        <h2 data-child-instruction><span className="sk-instruction-long">{freePlay ? 'Play your own music' : celebrating ? target.display : 'Play sounds. Build the word.'}</span><span className="sk-instruction-short">{freePlay ? 'Play music.' : celebrating ? target.display : hintMistakes ? 'Try again.' : 'Build word.'}{!freePlay && !celebrating && hintMistakes >= 2 && <> <strong aria-label="Spelling hint" data-phonics-hint="">{phonicsTargetHint(target.id, hintMistakes)}</strong></>}</span></h2>
        <div className="soundkeys-token-row" aria-label="Sounds selected">{target.tokens.map((token, i) => <span key={i} className={tokens[i] ? 'is-filled' : i === tokens.length ? 'is-next' : ''}>{tokens[i] || '·'}</span>)}</div>
        <PhonicsTargetHint word={target.id} mistakes={hintMistakes} solved={celebrating || freePlay} />
      </div>
    </div>
    <div className="sk-feedback" role="status">{feedback || midiMessage || (freePlay ? 'Your word is saved. Explore every sound.' : `Keys ${bank * 8 + 1}–${Math.min((bank + 1) * 8, availableKeys.length)} · Type letters or press 1–8`)}</div>
    <div className="soundkeys-keyboard" role="group" aria-label="Onscreen sound keys" data-child-choices data-child-primary>{visibleKeys.map((token, i) => <button type="button" key={token}
      className={pressed.includes(token) ? 'is-down' : ''} aria-label={`Play ${token}`} data-token={token}
      onPointerEnter={() => { state.current.hoverIndex = i; }} onPointerLeave={() => { state.current.hoverIndex = null; }}
      onFocus={() => { state.current.hoverIndex = i; }} onBlur={() => { state.current.hoverIndex = null; }}
      onPointerDown={event => { if (state.current.paused) return; event.currentTarget.setPointerCapture(event.pointerId); play(token, `pointer:${event.pointerId}`, false, true, 'pointer'); }}
      onPointerUp={event => { const id = `pointer:${event.pointerId}`, wasHeld = held.current.has(id); release(id); const rect = event.currentTarget.getBoundingClientRect();
        if (wasHeld && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) { play(token, id, true, false, 'pointer'); release(id); } }}
      onPointerCancel={event => release(`pointer:${event.pointerId}`)} onLostPointerCapture={event => release(`pointer:${event.pointerId}`)}
      onClick={event => { if (event.detail === 0) { play(token, `assistive:${token}`, true, true, 'assistive'); release(`assistive:${token}`); } }}><span>{token}</span><small>{i + 1}</small></button>)}</div>
    <div className="sk-actions" role="group" aria-label="Instrument controls">
      <button type="button" aria-label="Previous sound keys" onClick={() => changeBank(-1)}><b aria-hidden="true">‹</b><span>Prev</span></button>
      <button type="button" aria-label="Next sound keys" onClick={() => changeBank(1)}><b aria-hidden="true">›</b><span>Next</span></button>
      <button type="button" onClick={() => { undo(); field.current?.focus({ preventScroll: true }); }} aria-label="Undo last sound" disabled={freePlay || celebrating || !tokens.length}><b aria-hidden="true">↶</b><span>Undo</span></button>
      <button type="button" aria-pressed={freePlay} onClick={() => { stopSounds(); markSupported('free-play-return'); state.current.freePlay = !freePlay;
        if (!freePlay) state.current.dwell?.pause(); else state.current.dwell?.resume();
        setFreePlay(!freePlay); setFeedback(''); persistRef.current?.(); field.current?.focus({ preventScroll: true }); }}><b aria-hidden="true">♫</b><span>{freePlay ? 'Words' : 'Free play'}</span></button>
      <button type="button" aria-expanded={settings} aria-controls="sk-instrument-settings" onClick={() => { stopSounds(); setSettings(value => !value); }}><b aria-hidden="true">⚙</b><span>Band</span></button>
    </div>
    {settings && <div className="sk-settings" id="sk-instrument-settings" role="group" aria-label="Band settings">
      <p>Choose your instrument</p><div className="sk-voice-choices">{['bells', 'reeds'].map(value => <button key={value} type="button" aria-pressed={voice === value}
        onClick={() => { stopSounds(); state.current.voice = value; setVoice(value); persistRef.current?.(); }}>{value === 'bells' ? 'Bells ♫' : 'Reeds ♬'}</button>)}</div>
      <button type="button" onClick={connectMidi} disabled={midiConnecting} aria-label="Connect MIDI keyboard">{midiConnecting ? 'Connecting…' : midiConnected ? 'MIDI connected ✓' : 'Connect MIDI keyboard'}</button>
      <button type="button" onClick={() => { setSettings(false); field.current?.focus({ preventScroll: true }); }}>Back to keys</button>
    </div>}
    {saveError && <button type="button" className="sk-save-retry" onClick={() => persistRef.current?.()}>Try saving again</button>}
    {delivery && [...Object.values(delivery.assets || {}), ...Object.values(delivery.actions || {})].includes('unavailable') && <button type="button" className="sk-art-retry" onClick={() => setArtEpoch(value => value + 1)}>Reload stage art</button>}
  </section>;
}
