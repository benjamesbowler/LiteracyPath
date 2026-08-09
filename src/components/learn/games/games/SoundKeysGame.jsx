import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SOUNDKEY_PROFILES, SOUNDKEY_WORDS, findSoundKeyWord } from "../../../../features/soundkeys/content.js";
import { appendToken, resolveTokenForNote } from "../../../../features/soundkeys/engine.js";
import { connectWebMidi, createComputerKeyboardProvider } from "../../../../features/soundkeys/inputProviders.js";
import "../../../../features/soundkeys/soundkeys.css";

const ROUNDS = 10;
const DEFAULT_MAPPING = Object.fromEntries(SOUNDKEY_PROFILES.cvc.map((token, index) => [String(48 + index), token]));

function wordsForDifficulty(difficulty) {
  return SOUNDKEY_WORDS.slice(0, difficulty === "hard" ? 24 : difficulty === "medium" ? 18 : 12);
}

function playAudio(path) {
  if (!path) return false;
  try { const audio = new window.Audio(path); void audio.play().catch(() => {}); return true; } catch { return false; }
}

export default function SoundKeysGame({ difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const rounds = useMemo(() => wordsForDifficulty(difficulty), [difficulty]);
  const [round, setRound] = useState(Math.min(startLevel, ROUNDS - 1));
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
  const midiCleanup = useRef(null);
  const handlerRef = useRef(null);
  const roundRef = useRef(round);
  const mistakesRef = useRef(mistakes);
  const target = rounds[round % rounds.length] || SOUNDKEY_WORDS[0];

  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);
  useEffect(() => { onProgressUpdate?.(round, ROUNDS); onCheckpoint?.(round, ROUNDS); }, [onCheckpoint, onProgressUpdate, round]);

  const clearWord = useCallback(() => { tokensRef.current = []; setTokens([]); setFeedback(""); }, []);
  const finishRound = useCallback((word, nextMistakes) => {
    const nextRound = roundRef.current + 1;
    const nextScore = Math.max(0, 100 - nextMistakes * 20);
    onScoreUpdate?.(nextScore + (nextRound - 1) * 100);
    if (isSoundEnabled) playAudio(word.audio);
    if (nextRound >= ROUNDS) { onProgressUpdate?.(ROUNDS, ROUNDS); onComplete?.(nextMistakes === 0 ? 3 : nextMistakes <= 2 ? 2 : 1, nextScore + (ROUNDS - 1) * 100, ROUNDS); return; }
    setFeedback(`Great build! ${word.display} is ready.`);
    window.setTimeout(() => { setRound(nextRound); tokensRef.current = []; setTokens([]); setFeedback(""); }, 650);
  }, [isSoundEnabled, onComplete, onProgressUpdate, onScoreUpdate]);
  const acceptToken = useCallback(token => {
    if (pausedRef.current || feedback) return;
    const next = appendToken(tokensRef.current, token, target.tokens.length);
    tokensRef.current = next; setTokens(next);
    if (next.length < target.tokens.length) return;
    const word = findSoundKeyWord(next);
    if (word?.id === target.id) finishRound(word, mistakesRef.current);
    else { const nextMistakes = mistakesRef.current + 1; mistakesRef.current = nextMistakes; setMistakes(nextMistakes); setFeedback("Not quite — listen, then try that word again."); if (isSoundEnabled) playAudio(target.audio); window.setTimeout(clearWord, 700); }
  }, [clearWord, feedback, finishRound, isSoundEnabled, target]);
  const handleEvent = useCallback(event => {
    if (pausedRef.current) return;
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
    onEngineReady?.({ pause: () => { pausedRef.current = true; }, resume: () => { pausedRef.current = false; } });
    return () => { cleanupKeyboard(); midiCleanup.current?.(); };
  }, [onEngineReady]);
  async function connectMidi() { setMidiConnecting(true); setMidiMessage("Waiting for MIDI permission…"); try { midiCleanup.current?.(); midiCleanup.current = await connectWebMidi(event => handlerRef.current?.(event)); } catch (error) { setMidiMessage(error?.code === "unsupported" ? "MIDI is not available here. The onscreen keys still work." : "MIDI permission was not available. Try again or use the onscreen keys."); } finally { setMidiConnecting(false); } }

  return <section className="soundkeys-game" aria-labelledby="soundkeys-game-title" data-child-surface="soundkeys">
    <div className="soundkeys-game-brand"><span className="soundkeys-game-orbit" aria-hidden="true" /><span>SoundKeys</span><small>THE WORD LAB</small></div>
    <div className="soundkeys-game-tools"><span className={`soundkeys-midi-status${midiConnected ? " is-connected" : ""}`} aria-live="polite">{midiConnected ? "MIDI READY" : "KEYBOARD READY"}</span><button type="button" className="soundkeys-midi-connect" onClick={connectMidi} disabled={midiConnecting}>{midiConnecting ? "Connecting…" : midiConnected ? "Reconnect MIDI" : "Connect MIDI"}</button></div>
    <div className="soundkeys-game-progress"><span>ROUND {Math.min(round + 1, ROUNDS)} / {ROUNDS}</span><i><b style={{ width: `${(round / ROUNDS) * 100}%` }} /></i><span>{mistakes} misses</span></div>
    <div className="soundkeys-game-board"><div className="soundkeys-game-cue"><span className="soundkeys-game-kicker">BUILD THE WORD</span><img src={target.image} alt={target.alt} /><button type="button" className="soundkeys-listen" onClick={() => playAudio(target.audio)}>Listen</button></div><div className={`soundkeys-game-word${feedback ? " has-feedback" : ""}`}><div className="soundkeys-token-row" aria-label="Sounds selected">{target.tokens.map((token, index) => <span key={`${token}-${index}`} className={tokens[index] ? "is-filled" : ""}>{tokens[index] || "_"}</span>)}</div><h2 id="soundkeys-game-title">{tokens.length ? tokens.join(" ").toUpperCase() : "YOUR TURN"}</h2><p role="status">{feedback || "Play the sounds in order."}</p>{feedback && <button type="button" className="soundkeys-retry" onClick={clearWord}>Try again</button>}</div></div>
    {showKeyboard && <div className="soundkeys-keyboard" aria-label="Onscreen sound keys">{SOUNDKEY_PROFILES.cvc.map(token => <button type="button" key={token} onClick={() => acceptToken(token)}>{token}</button>)}</div>}
    <div className="soundkeys-game-footer"><button type="button" className="soundkeys-show-keyboard" onClick={() => setShowKeyboard(show => !show)}>{showKeyboard ? "Hide keys" : "Show sound keys"}</button><button type="button" className="soundkeys-clear" onClick={clearWord}>Clear</button><span>{midiMessage}{lastNote ? ` · note ${lastNote}` : ""}</span></div>
  </section>;
}
