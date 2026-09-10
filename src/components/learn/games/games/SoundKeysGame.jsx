import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SOUNDKEY_PROFILES, buildSoundKeySession } from "../../../../features/soundkeys/content.js";
import { resolveTokenForNote } from "../../../../features/soundkeys/engine.js";
import { connectWebMidi, createComputerKeyboardProvider } from "../../../../features/soundkeys/inputProviders.js";
import { createSoundKeysInstrument, phonemeForSoundKey, trySoundKey } from "../../../../features/soundkeys/instrument.js";
import { speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import "./SoundKeysGame.css";

const ROUNDS = 10;
const ALL_KEYS = [...SOUNDKEY_PROFILES.cvc, ...SOUNDKEY_PROFILES.digraphs];
const DEFAULT_MAPPING = Object.fromEntries(ALL_KEYS.map((token, index) => [String(48 + index), token]));
const BANDS = ["Meadow duet", "Hollow trio", "Moonwood ensemble"];

export default function SoundKeysGame({ difficulty = "easy", seed = 0, startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const rounds = useMemo(() => buildSoundKeySession(difficulty, seed, ROUNDS), [difficulty, seed]);
  const [round, setRound] = useState(() => Math.max(0, Math.min(Number(startLevel) || 0, ROUNDS - 1)));
  const [tokens, setTokens] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [freePlay, setFreePlay] = useState(false);
  const [voice, setVoice] = useState("bells");
  const [bank, setBank] = useState(0);
  const [pressed, setPressed] = useState([]);
  const [celebrating, setCelebrating] = useState(false);
  const [playingPulse, setPlayingPulse] = useState(false);
  const pulseTimer = useRef(null);
  const [midiMessage, setMidiMessage] = useState("");
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiConnecting, setMidiConnecting] = useState(false);
  const [mapping] = useState(() => { try { return { ...DEFAULT_MAPPING, ...JSON.parse(window.localStorage.getItem("soundkeys-mapping") || "{}") }; } catch { return DEFAULT_MAPPING; } });
  const state = useRef({ tokens: [], round, score: 0, mistakes: 0, roundMistakes: 0, paused: false, committed: false, complete: false, mounted: true, remaining: 0, timer: null });
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
  const band = Math.min(2, Math.floor(round / 4));
  const cast = band === 0 ? [CAST.speedy, CAST.clucky] : band === 1 ? [CAST.chompy, CAST.sunny, CAST.dozy] : [CAST.pip, CAST.wren, CAST.fern];

  const stopSounds = useCallback(() => { cue.current?.abort(); cue.current = null; instrument.current?.stop(); held.current.clear(); window.clearTimeout(pulseTimer.current); setPlayingPulse(false); setPressed([]); }, []);
  const speak = useCallback((value, phoneme = false) => {
    cue.current?.abort();
    if (!soundRef.current || state.current.paused) return;
    const controller = new AbortController(); cue.current = controller;
    const promise = phoneme ? speakPhoneme(value, { signal: controller.signal }) : speakWord(value, { signal: controller.signal });
    promise?.catch?.(() => {});
  }, []);
  useEffect(() => {
    if (!freePlay) speak(target.id);
    return () => cue.current?.abort();
  }, [freePlay, speak, target.id]);
  const advance = useCallback(() => {
    const s = state.current;
    s.timer = null;
    if (!s.mounted || s.paused) return;
    s.round += 1; s.tokens = []; s.roundMistakes = 0; s.committed = false;
    setTokens([]); setRound(s.round); setCelebrating(false); setFeedback("");
  }, []);
  const armAdvance = useCallback(() => {
    const s = state.current; s.started = Date.now(); s.timer = window.setTimeout(advance, s.remaining);
  }, [advance]);
  const pause = useCallback(() => {
    const s = state.current; if (s.paused) return;
    s.paused = true;
    if (s.timer) { window.clearTimeout(s.timer); s.timer = null; s.remaining = Math.max(0, s.remaining - (Date.now() - s.started)); }
    stopSounds();
  }, [stopSounds]);
  const resume = useCallback(() => {
    const s = state.current; if (!s.paused) return; s.paused = false;
    if (s.committed && !s.complete) armAdvance();
  }, [armAdvance]);
  useEffect(() => { callbacks.current.onProgressUpdate?.(round, ROUNDS); callbacks.current.onCheckpoint?.(round, ROUNDS); }, [round]);
  useEffect(() => { if (!isSoundEnabled) { cue.current?.abort(); instrument.current?.stop(); } }, [isSoundEnabled]);

  const release = useCallback(id => {
    held.current.delete(id); instrument.current?.release(id);
    setPressed([...held.current.values()]);
  }, []);
  const play = useCallback((token, id, commit = true, audible = true) => {
    const s = state.current;
    if (s.paused || s.complete || held.current.has(id)) return;
    held.current.set(id, token); setPressed([...held.current.values()]);
    setPlayingPulse(true); window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => { if (s.mounted) setPlayingPulse(false); }, 180);
    if (soundRef.current && audible) {
      instrument.current ||= createSoundKeysInstrument();
      instrument.current.play(id, 60 + ALL_KEYS.indexOf(token) % 12, voice);
      speak(phonemeForSoundKey(token, freePlay ? null : target), true);
    }
    if (!commit || freePlay || s.committed) return;
    const result = trySoundKey(s.tokens, token, target.tokens);
    if (!result.correct) {
      s.mistakes += 1; s.roundMistakes += 1;
      setFeedback(`Keep ${s.tokens.join(" · ") || "your place"}. Try the next sound in ${target.display}.`);
      return;
    }
    s.tokens = result.prefix; setTokens(result.prefix); setFeedback("");
    if (!result.complete) return;
    s.committed = true; s.score += Math.max(20, 100 - s.roundMistakes * 20);
    callbacks.current.onScoreUpdate?.(s.score); setCelebrating(true);
    setFeedback(`${target.display}! Your band is growing.`);
    // Let the final key finish its phoneme. The word replay remains available;
    // a queued reward must not interrupt that sound or speak over the next key.
    if (s.round + 1 === ROUNDS) {
      s.complete = true; callbacks.current.onProgressUpdate?.(ROUNDS, ROUNDS);
      callbacks.current.onComplete?.(s.mistakes === 0 ? 3 : s.mistakes <= 2 ? 2 : 1, s.score, ROUNDS);
    } else { s.remaining = 850; armAdvance(); }
  }, [armAdvance, freePlay, speak, target, voice]);
  const undo = useCallback(() => {
    const s = state.current; if (s.paused || s.committed || freePlay) return;
    s.tokens = s.tokens.slice(0, -1); setTokens(s.tokens); setFeedback("");
  }, [freePlay]);
  useEffect(() => { handler.current = event => {
    if (!state.current.mounted) return;
    if (event.type === "midi-status") { setMidiConnected(Boolean(event.connected)); setMidiMessage(event.connected ? `${event.inputNames?.join(", ")} connected` : "Plug in your MIDI keyboard"); }
    else if (event.type === "midi-error") setMidiMessage(event.message || "Use the sound keys below");
    else if (event.type === "release-all") stopSounds();
    else if (event.type === "release") release(event.note != null ? `midi:${event.source}:${event.note}` : `key:${event.key}`);
    else if (event.type === "control") undo();
    else if (event.type === "midi") { const token = resolveTokenForNote(event.note, mapping); if (token) play(token, `midi:${event.source}:${event.note}`); }
    else if (event.type === "token") play(event.token, `key:${event.key || event.token}`);
  }; }, [mapping, play, release, stopSounds, undo]);
  useEffect(() => {
    state.current.mounted = true;
    const cleanup = createComputerKeyboardProvider(event => handler.current?.(event), { resolveKey: key => /^[1-8]$/.test(key) ? keyboardKeys.current[Number(key) - 1] : null, acceptTarget: (target, key) => /^[1-8]$/.test(key) && Boolean(target?.closest?.(".sk-console button")) });
    onEngineReady?.({ pause, resume });
    const s = state.current;
    const heldKeys = held.current;
    return () => { s.mounted = false; window.clearTimeout(s.timer); window.clearTimeout(pulseTimer.current); cleanup(); midiAttempt.current += 1; midiCleanup.current?.(); cue.current?.abort(); instrument.current?.dispose(); instrument.current = null; heldKeys.clear(); };
    // The host receives stable controls. Its changing callback must not restart the instrument.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pause, resume]);
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

  return <section className={`soundkeys-game sk-stage band-${band}${celebrating ? " is-celebrating" : ""}${pressed.length || playingPulse ? " is-playing" : ""}`} aria-label="SoundKeys instrument" data-child-surface="soundkeys" data-round={round} data-target={target.id}>
    <header className="sk-top"><div className="soundkeys-game-progress"><strong>{freePlay ? "Free play" : `${round + 1} / ${ROUNDS}`}</strong><span>{BANDS[band]}</span></div><button type="button" aria-pressed={freePlay} onClick={() => { stopSounds(); setFreePlay(value => !value); setFeedback(""); }}>{freePlay ? "Build words" : "Free play"}</button><button type="button" onClick={() => setVoice(value => value === "bells" ? "reeds" : "bells")} aria-label={`Instrument: ${voice}. Change instrument`}>{voice === "bells" ? "Bells ♫" : "Reeds ♬"}</button><button type="button" onClick={connectMidi} disabled={midiConnecting} aria-label="Connect MIDI keyboard">{midiConnecting ? "…" : midiConnected ? "MIDI ✓" : "MIDI"}</button></header>
    <div className="sk-performance">
      <div className="sk-lights" aria-hidden="true" />
      <div className="sk-band" aria-hidden="true">{cast.map((pal, i) => <div key={pal.id} className="sk-performer" style={{ "--pal-index": i }}><img src={pal.heroSprite || pal.sprite} alt="" /><span className="sk-music-note">{["♪", "♫", "♬"][i]}</span><div className="sk-stand" /></div>)}</div>
      <div className="soundkeys-game-board sk-phrase">
        <img className="sk-word-image" src={target.image} alt={target.alt} />
        <div className="soundkeys-game-word"><h2>{freePlay ? "Make your own music" : target.display}</h2><div className="soundkeys-token-row" aria-label="Sounds selected">{target.tokens.map((token, i) => <span key={i} className={tokens[i] ? "is-filled" : i === tokens.length ? "is-next" : ""}>{tokens[i] || "·"}</span>)}</div></div>
        <button type="button" className="soundkeys-listen" aria-label={`Hear ${target.display} again`} disabled={!isSoundEnabled} onClick={() => speak(target.id)}>Hear ♪</button>
      </div>
    </div>
    <div className="sk-feedback" role="status">{feedback || midiMessage || (freePlay ? "Explore every sound. Your word is saved." : "Play the sounds. Build the word.")}</div>
    <div className="sk-console"><div className="sk-bank-controls"><button type="button" aria-label="Previous sound keys" onClick={() => { stopSounds(); setBank(value => (value + banks - 1) % banks); }}>‹</button><span>Keys {bank * 8 + 1}–{Math.min((bank + 1) * 8, availableKeys.length)}<small>Type letters or press 1–8</small></span><button type="button" aria-label="Next sound keys" onClick={() => { stopSounds(); setBank(value => (value + 1) % banks); }}>›</button><button type="button" onClick={undo} aria-label="Undo last sound">↶</button></div>
      <div className="soundkeys-keyboard" aria-label="Onscreen sound keys">{visibleKeys.map((token, i) => <button type="button" key={token} className={pressed.includes(token) ? "is-down" : ""} aria-label={`Play ${token}`} data-token={token}
        onPointerDown={event => { if (state.current.paused) return; event.currentTarget.setPointerCapture(event.pointerId); play(token, `pointer:${event.pointerId}`, false); }}
        onPointerUp={event => { const id = `pointer:${event.pointerId}`; const wasHeld = held.current.has(id); release(id); const rect = event.currentTarget.getBoundingClientRect(); if (wasHeld && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) { play(token, id, true, false); release(id); } }}
        onPointerCancel={event => release(`pointer:${event.pointerId}`)} onLostPointerCapture={event => release(`pointer:${event.pointerId}`)}
        onClick={event => { if (event.detail === 0) { play(token, `assistive:${token}`); release(`assistive:${token}`); } }}><span>{token}</span><small>{i + 1}</small></button>)}</div>
    </div>
  </section>;
}
