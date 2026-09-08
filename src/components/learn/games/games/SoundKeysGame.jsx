import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SOUNDKEY_PROFILES, SOUNDKEY_WORDS, buildSoundKeySession, findSoundKeyWord, soundKeyTokensForWord } from "../../../../features/soundkeys/content.js";
import { appendToken, resolveTokenForNote } from "../../../../features/soundkeys/engine.js";
import { connectWebMidi, createComputerKeyboardProvider } from "../../../../features/soundkeys/inputProviders.js";
import "../../../../features/soundkeys/soundkeys.css";

const ROUNDS = 10;
const DEFAULT_MAPPING = Object.fromEntries([...SOUNDKEY_PROFILES.cvc, ...SOUNDKEY_PROFILES.digraphs].map((token, index) => [String(48 + index), token]));

export default function SoundKeysGame({ difficulty = "easy", seed = 0, startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const rounds = useMemo(() => buildSoundKeySession(difficulty, seed, ROUNDS), [difficulty, seed]);
  const [round, setRound] = useState(() => Math.max(0, Math.min(Number(startLevel) || 0, ROUNDS - 1)));
  const [tokens, setTokens] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [midiMessage, setMidiMessage] = useState("Use the sound keys below, or connect a MIDI keyboard.");
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiConnecting, setMidiConnecting] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [lastNote, setLastNote] = useState("");
  const [mapping] = useState(() => { try { return { ...DEFAULT_MAPPING, ...JSON.parse(window.localStorage.getItem("soundkeys-mapping") || "{}") }; } catch { return DEFAULT_MAPPING; } });
  const tokensRef = useRef([]);
  const pausedRef = useRef(false);
  const mountedRef = useRef(true);
  const soundRef = useRef(isSoundEnabled);
  const midiCleanup = useRef(null);
  const midiAttemptRef = useRef(0);
  const audioRef = useRef(new Set());
  const timersRef = useRef(new Set());
  const pendingTimerRef = useRef(null);
  const handlerRef = useRef(null);
  const roundRef = useRef(round);
  const scoreRef = useRef(0);
  const mistakesRef = useRef(0);
  const roundMistakesRef = useRef(0);
  const completedRef = useRef(false);
  const lockedRef = useRef(false);
  const committedRoundRef = useRef(null);
  const onEngineReadyRef = useRef(onEngineReady);
  const target = rounds[round % rounds.length] || SOUNDKEY_WORDS[0];

  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);
  useEffect(() => { onEngineReadyRef.current = onEngineReady; }, [onEngineReady]);
  useEffect(() => { onProgressUpdate?.(round, ROUNDS); onCheckpoint?.(round, ROUNDS); }, [onCheckpoint, onProgressUpdate, round]);

  const removeAudio = useCallback(audio => {
    audioRef.current.delete(audio);
    audio.onended = null;
    audio.onerror = null;
  }, []);
  const playAudio = useCallback(path => {
    if (!path || !soundRef.current || !mountedRef.current) return false;
    let audio;
    try {
      audio = new window.Audio(path);
      audio.preload = "auto";
      audio.onended = () => removeAudio(audio);
      audio.onerror = () => removeAudio(audio);
      audioRef.current.add(audio);
      const playback = audio.play();
      playback?.catch?.(() => removeAudio(audio));
      return true;
    } catch {
      if (audio) removeAudio(audio);
      return false;
    }
  }, [removeAudio]);

  const cancelTimer = useCallback(entry => {
    if (!entry) return;
    window.clearTimeout(entry.id);
    timersRef.current.delete(entry);
  }, []);
  const armTimer = useCallback(entry => {
    entry.startedAt = Date.now();
    entry.id = window.setTimeout(() => {
      timersRef.current.delete(entry);
      if (mountedRef.current) entry.fn();
    }, entry.remaining);
  }, []);
  const schedule = useCallback((fn, ms) => {
    const entry = { fn, id: 0, remaining: ms, startedAt: 0 };
    timersRef.current.add(entry);
    if (!pausedRef.current) armTimer(entry);
    return entry;
  }, [armTimer]);
  const pauseEngine = useCallback(() => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    const now = Date.now();
    timersRef.current.forEach(entry => {
      window.clearTimeout(entry.id);
      entry.remaining = Math.max(0, entry.remaining - (now - entry.startedAt));
    });
    audioRef.current.forEach(audio => audio.pause());
  }, []);
  const resumeEngine = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    timersRef.current.forEach(armTimer);
    if (soundRef.current) audioRef.current.forEach(audio => { audio.play().catch(() => removeAudio(audio)); });
  }, [armTimer, removeAudio]);
  const clearWord = useCallback(() => {
    if (committedRoundRef.current === roundRef.current) return;
    cancelTimer(pendingTimerRef.current);
    pendingTimerRef.current = null;
    tokensRef.current = [];
    setTokens([]);
    setFeedback("");
    lockedRef.current = false;
  }, [cancelTimer]);
  const finishRound = useCallback(word => {
    if (completedRef.current || committedRoundRef.current === roundRef.current) return;
    committedRoundRef.current = roundRef.current;
    const nextRound = roundRef.current + 1;
    const roundScore = Math.max(0, 100 - roundMistakesRef.current * 20);
    const nextScore = scoreRef.current + roundScore;
    scoreRef.current = nextScore;
    onScoreUpdate?.(nextScore);
    if (soundRef.current) playAudio(word.audio);
    if (nextRound >= ROUNDS) {
      completedRef.current = true;
      onProgressUpdate?.(ROUNDS, ROUNDS);
      const finalMistakes = mistakesRef.current;
      onComplete?.(finalMistakes === 0 ? 3 : finalMistakes <= 2 ? 2 : 1, nextScore, ROUNDS);
      return;
    }
    setFeedback(`Great build! ${word.display} is ready.`);
    pendingTimerRef.current = schedule(() => {
      pendingTimerRef.current = null;
      roundMistakesRef.current = 0;
      committedRoundRef.current = null;
      lockedRef.current = false;
      tokensRef.current = [];
      roundRef.current = nextRound;
      setRound(nextRound);
      setTokens([]);
      setFeedback("");
    }, 650);
  }, [onComplete, onProgressUpdate, onScoreUpdate, playAudio, schedule]);
  const acceptToken = useCallback(token => {
    if (pausedRef.current || lockedRef.current || completedRef.current || committedRoundRef.current === roundRef.current) return;
    const next = appendToken(tokensRef.current, token, target.tokens.length);
    tokensRef.current = next; setTokens(next);
    if (next.length < target.tokens.length) return;
    const word = findSoundKeyWord(next);
    lockedRef.current = true;
    if (word?.id === target.id) finishRound(word);
    else {
      roundMistakesRef.current += 1;
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      setFeedback("Not quite — listen, then try that word again.");
      if (soundRef.current) playAudio(target.audio);
      pendingTimerRef.current = schedule(() => {
        pendingTimerRef.current = null;
        tokensRef.current = [];
        setTokens([]);
        setFeedback("");
        lockedRef.current = false;
      }, 700);
    }
  }, [finishRound, playAudio, schedule, target]);
  const handleEvent = useCallback(event => {
    if (pausedRef.current && event.type === "midi") return;
    if (event.type === "midi-status") { setMidiConnected(Boolean(event.connected)); setMidiMessage(event.connected ? `${event.inputNames?.join(", ") || "MIDI keyboard"} is ready.` : "MIDI access is on. Plug in a keyboard."); }
    else if (event.type === "midi-error") { setMidiConnected(false); setMidiMessage(event.message || "MIDI could not be opened. The onscreen keys still work."); }
    else if (event.type === "control") clearWord();
    else if (event.type === "midi") { setLastNote(String(event.note)); const token = resolveTokenForNote(event.note, mapping); if (token) acceptToken(token); else setMidiMessage(`Note ${event.note} needs a sound mapping.`); }
    else if (event.type === "token") acceptToken(event.token);
  }, [acceptToken, clearWord, mapping]);
  useEffect(() => { handlerRef.current = handleEvent; }, [handleEvent]);
  useEffect(() => {
    const forward = event => handlerRef.current?.(event);
    const cleanupKeyboard = createComputerKeyboardProvider(forward);
    const timers = timersRef.current;
    const audio = audioRef.current;
    onEngineReadyRef.current?.({ pause: pauseEngine, resume: resumeEngine });
    return () => {
      mountedRef.current = false;
      cleanupKeyboard();
      midiAttemptRef.current += 1;
      midiCleanup.current?.();
      timers.forEach(entry => window.clearTimeout(entry.id));
      timers.clear();
      pendingTimerRef.current = null;
      audio.forEach(item => { item.pause(); removeAudio(item); });
    };
  }, [pauseEngine, removeAudio, resumeEngine]);
  async function connectMidi() {
    const attempt = midiAttemptRef.current + 1;
    midiAttemptRef.current = attempt;
    midiCleanup.current?.();
    midiCleanup.current = null;
    setMidiConnecting(true); setMidiMessage("Waiting for MIDI permission…");
    try {
      const cleanup = await connectWebMidi(event => handlerRef.current?.(event));
      if (!mountedRef.current || midiAttemptRef.current !== attempt) { cleanup(); return; }
      midiCleanup.current = cleanup;
    } catch (error) {
      if (mountedRef.current && midiAttemptRef.current === attempt) setMidiMessage(error?.code === "unsupported" ? "MIDI is not available here. The onscreen keys still work." : "MIDI permission was not available. Try again or use the onscreen keys.");
    } finally {
      if (mountedRef.current && midiAttemptRef.current === attempt) setMidiConnecting(false);
    }
  }

  return <section className="soundkeys-game" aria-labelledby="soundkeys-game-title" data-child-surface="soundkeys">
    <div className="soundkeys-game-brand"><span className="soundkeys-game-orbit" aria-hidden="true" /><span>SoundKeys</span><small>THE WORD LAB</small></div>
    <div className="soundkeys-game-tools"><span className={`soundkeys-midi-status${midiConnected ? " is-connected" : ""}`} aria-live="polite">{midiConnected ? "MIDI READY" : "KEYBOARD READY"}</span><button type="button" className="soundkeys-midi-connect" onClick={connectMidi} disabled={midiConnecting}>{midiConnecting ? "Connecting…" : midiConnected ? "Reconnect MIDI" : "Connect MIDI"}</button></div>
    <div className="soundkeys-game-progress"><span>ROUND {Math.min(round + 1, ROUNDS)} / {ROUNDS}</span><i><b style={{ width: `${(round / ROUNDS) * 100}%` }} /></i><span>{mistakes} misses</span></div>
    <div className="soundkeys-game-board">
      <div className="soundkeys-game-cue"><span className="soundkeys-game-kicker">BUILD THE WORD</span><img src={target.image} alt={target.alt} /><button type="button" className="soundkeys-listen" aria-label={isSoundEnabled ? `Hear ${target.display} again` : "Word replay unavailable while sound is off"} disabled={!isSoundEnabled} onClick={() => { if (isSoundEnabled) playAudio(target.audio); }}>{isSoundEnabled ? "Hear word again" : "Sound is off"}</button></div>
      <div className={`soundkeys-game-word${feedback ? " has-feedback" : ""}`}><div className="soundkeys-token-row" aria-label="Sounds selected">{target.tokens.map((token, index) => <span key={`${token}-${index}`} className={tokens[index] ? "is-filled" : ""}>{tokens[index] || "_"}</span>)}</div><h2 id="soundkeys-game-title">{tokens.length ? tokens.join(" ").toUpperCase() : "YOUR TURN"}</h2><p role="status">{feedback || "Play the sounds in order."}</p>{feedback && <button type="button" className="soundkeys-retry" onClick={clearWord}>Try again</button>}</div>
    </div>
    {showKeyboard && <div className="soundkeys-keyboard" aria-label="Onscreen sound keys">{soundKeyTokensForWord(target).map(token => <button type="button" key={token} onClick={() => acceptToken(token)}>{token}</button>)}</div>}
    <div className="soundkeys-game-footer"><button type="button" className="soundkeys-show-keyboard" onClick={() => setShowKeyboard(show => !show)}>{showKeyboard ? "Hide keys" : "Show sound keys"}</button><button type="button" className="soundkeys-clear" onClick={clearWord}>Clear</button><span>{midiMessage}{lastNote ? ` · note ${lastNote}` : ""}</span></div>
  </section>;
}
