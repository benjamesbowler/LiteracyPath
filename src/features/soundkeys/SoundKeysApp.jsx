/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef, useState } from "react";
import { SOUNDKEY_PROFILES, findSoundKeyWord, wordForMode } from "./content.js";
import { appendToken, isMissingSoundCorrect, resolveTokenForNote } from "./engine.js";
import { connectWebMidi, createComputerKeyboardProvider } from "./inputProviders.js";
import "./soundkeys.css";

const DEFAULT_MAPPING = Object.fromEntries(SOUNDKEY_PROFILES.cvc.map((token, index) => [String(48 + index), token]));
const MODES = [
  ["free", "Free Build"], ["picture", "Picture → Build"], ["listen", "Listen → Build"], ["missing", "Missing Sound"]
];

function playAudio(path) {
  if (!path) return false;
  try { const audio = new window.Audio(path); void audio.play().catch(() => {}); return true; } catch { return false; }
}

function initialMidiMessage() {
  return typeof globalThis.navigator?.requestMIDIAccess === "function"
    ? "Press Connect MIDI, then allow access to your keyboard."
    : "This browser cannot use MIDI. The onscreen keys still work.";
}

function midiFailureMessage(error) {
  if (error?.code === "unsupported") return "This browser cannot use MIDI. Try SoundKeys in Chrome or Edge on a desktop or laptop.";
  if (!window.isSecureContext) return "MIDI needs the secure HTTPS version of SoundKeys.";
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "MIDI permission is blocked. Allow MIDI in this site's browser settings, then press Connect MIDI again.";
  }
  return "SoundKeys could not open MIDI. Check the keyboard cable and power, then try again.";
}

export function SoundKeysApp() {
  const [mode, setMode] = useState("free");
  const [profile, setProfile] = useState("cvc");
  const [mapping, setMapping] = useState(() => ({ ...DEFAULT_MAPPING, ...JSON.parse(window.localStorage.getItem("soundkeys-mapping") || "{}") }));
  const [tokens, setTokens] = useState([]);
  const [target, setTarget] = useState(() => wordForMode("picture"));
  const [resolved, setResolved] = useState(null);
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiConnecting, setMidiConnecting] = useState(false);
  const [midiMessage, setMidiMessage] = useState(initialMidiMessage);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [autoRead, setAutoRead] = useState(true);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [lastNote, setLastNote] = useState("");
  const resolveTimer = useRef(null);
  const tokensRef = useRef([]);
  const midiCleanup = useRef(null);
  const midiAttempt = useRef(0);
  const externalInputHandler = useRef(null);
  const [session] = useState(() => ({ attempts: 0, correct: 0, startedAt: Date.now() }));
  const activeTokens = useMemo(() => profile === "digraphs" ? SOUNDKEY_PROFILES.digraphs : SOUNDKEY_PROFILES.cvc, [profile]);

  useEffect(() => {
    externalInputHandler.current = handleEvent;
  });

  useEffect(() => {
    const forwardEvent = event => externalInputHandler.current?.(event);
    const cleanupKeyboard = createComputerKeyboardProvider(forwardEvent);
    return () => {
      cleanupKeyboard();
      midiAttempt.current += 1;
      midiCleanup.current?.();
      window.clearTimeout(resolveTimer.current);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(resolveTimer.current), []);

  function setNextTarget(nextMode = mode) {
    window.clearTimeout(resolveTimer.current);
    setTarget(wordForMode(nextMode));
    tokensRef.current = [];
    setTokens([]);
    setResolved(null);
  }

  function handleEvent(event) {
    if (event.type === "midi-status") {
      const connected = Boolean(event.connected);
      setMidiConnected(connected);
      setMidiMessage(connected
        ? `${event.inputNames?.join(", ") || "MIDI keyboard"} is ready. Play a key.`
        : "MIDI access is on. Plug in and switch on your keyboard.");
      return;
    }
    if (event.type === "midi-error") {
      setMidiConnected(false);
      setMidiMessage(event.message || "The MIDI keyboard could not be opened.");
      return;
    }
    if (event.type === "control") { clearWord(); return; }
    if (event.type === "midi") {
      setLastNote(String(event.note));
      const token = resolveTokenForNote(event.note, mapping);
      if (!token) { setMidiMessage(`Note ${event.note} is not mapped yet.`); return; }
      setMidiMessage(`${event.source || "MIDI keyboard"}: note ${event.note} plays ${token}.`);
      acceptToken(token);
      return;
    }
    if (event.type === "token") acceptToken(event.token);
  }

  function acceptToken(token) {
    window.clearTimeout(resolveTimer.current);
    const isMissing = mode === "missing";
    const targetLength = mode === "free" ? Infinity : (target?.tokens?.length || Infinity);
    const next = isMissing ? [token] : appendToken(tokensRef.current, token, targetLength);
    tokensRef.current = next;
    setTokens(next);
    session.attempts += 1;
    if (isMissing) {
      const correct = isMissingSoundCorrect(next, target, target.missingIndex);
      if (correct) { session.correct += 1; setResolved(target); playAudio(target.audio); }
      return;
    }
    const word = findSoundKeyWord(next);
    if (word && (autoRead || next.length === target?.tokens?.length)) {
      window.clearTimeout(resolveTimer.current);
      resolveTimer.current = window.setTimeout(() => { setResolved(word); playAudio(word.audio); session.correct += 1; }, autoRead ? 550 : 0);
    }
  }

  async function connectMidi() {
    const attempt = midiAttempt.current + 1;
    midiAttempt.current = attempt;
    midiCleanup.current?.();
    midiCleanup.current = null;
    setMidiConnected(false);
    setMidiConnecting(true);
    setMidiMessage("Waiting for MIDI permission…");
    try {
      const cleanup = await connectWebMidi(event => externalInputHandler.current?.(event));
      if (midiAttempt.current !== attempt) { cleanup(); return; }
      midiCleanup.current = cleanup;
    } catch (error) {
      if (midiAttempt.current !== attempt) return;
      setMidiConnected(false);
      setMidiMessage(midiFailureMessage(error));
    } finally {
      if (midiAttempt.current === attempt) setMidiConnecting(false);
    }
  }

  function chooseMode(nextMode) { setMode(nextMode); setNextTarget(nextMode); }
  function clearWord() {
    window.clearTimeout(resolveTimer.current);
    tokensRef.current = [];
    setTokens([]);
    setResolved(null);
  }
  function saveMapping() { window.localStorage.setItem("soundkeys-mapping", JSON.stringify(mapping)); setTeacherOpen(false); }

  const targetTokens = target?.tokens || [];
  return (
    <div className="soundkeys-app" data-child-surface="soundkeys">
      <header className="soundkeys-topbar">
        <a className="soundkeys-back" href="/">← Kids home</a>
        <div><span className="soundkeys-mark">SoundKeys</span><small>MIDI Word Builder</small></div>
        <div className="soundkeys-actions">
          <span className={`soundkeys-midi-status${midiConnected ? " is-connected" : ""}`} aria-live="polite">● {midiConnected ? "MIDI ready" : midiConnecting ? "Connecting MIDI" : "MIDI not connected"}</span>
          <button type="button" className="soundkeys-midi-connect" onClick={connectMidi} disabled={midiConnecting || typeof globalThis.navigator?.requestMIDIAccess !== "function"}>{midiConnecting ? "Connecting…" : midiConnected ? "Reconnect MIDI" : "Connect MIDI"}</button>
          <button type="button" onClick={() => setTeacherOpen(open => !open)} aria-expanded={teacherOpen} aria-label="SoundKeys teacher settings">⚙</button>
        </div>
      </header>
      <main className="soundkeys-main">
        <section className="soundkeys-modebar" aria-label="Activity mode">
          {MODES.map(([id, label]) => <button key={id} type="button" className={mode === id ? "is-active" : ""} onClick={() => chooseMode(id)}>{label}</button>)}
          <label className="soundkeys-toggle"><input type="checkbox" checked={autoRead} onChange={event => setAutoRead(event.target.checked)} /> Auto read</label>
        </section>
        <section className="soundkeys-stage" aria-labelledby="soundkeys-title">
          <p className="soundkeys-kicker">{mode === "free" ? "BUILD A WORD" : MODES.find(item => item[0] === mode)?.[1].toUpperCase()}</p>
          {mode === "picture" && target?.image && <img className="soundkeys-target-image" src={target.image} alt={target.alt} />}
          {mode === "listen" && <button type="button" className="soundkeys-listen" onClick={() => playAudio(target?.audio)}>🔊 Listen for the word</button>}
          {mode === "missing" && <div className="soundkeys-missing-image">{target?.image ? <img src={target.image} alt={target.alt} /> : "❓"}<strong>{targetTokens.map((token, index) => index === target.missingIndex ? "_" : token).join(" ")}</strong></div>}
          <h1 id="soundkeys-title">{resolved ? resolved.display.toUpperCase() : (tokens.length ? tokens.join(" ").toUpperCase() : "Press a sound key")}</h1>
          {!resolved && mode !== "free" && <p className="soundkeys-prompt">{mode === "picture" ? `Build ${targetTokens.length} sounds` : mode === "listen" ? "Listen, then build the word" : "Find the missing sound"}</p>}
          {resolved && <div className="soundkeys-result"><span className="soundkeys-result-spark">★</span><strong>{resolved.display}</strong><button type="button" onClick={() => playAudio(resolved.audio)} aria-label={`Read ${resolved.display}`}>🔊 Read</button></div>}
          <div className="soundkeys-controls"><button type="button" onClick={clearWord}>↶ Clear</button><button type="button" onClick={() => { if (resolved) setNextTarget(mode); else playAudio(target?.audio); }}>{resolved ? "Next word" : "🔊 Read"}</button></div>
        </section>
        {showKeyboard && <section className="soundkeys-keyboard" aria-label="Onscreen sound keys">{activeTokens.map(token => <button type="button" key={token} onClick={() => acceptToken(token)}>{token}</button>)}</section>}
        <button type="button" className="soundkeys-show-keyboard" onClick={() => setShowKeyboard(show => !show)}>{showKeyboard ? "Hide" : "Show"} SoundKeys</button>
        <p className="soundkeys-help" role="status">{midiMessage}{lastNote ? ` Last note: ${lastNote}.` : ""}</p>
      </main>
      {teacherOpen && <aside className="soundkeys-teacher" aria-label="SoundKeys teacher settings"><h2>SoundKeys Teacher</h2><label>Profile<select value={profile} onChange={event => { setProfile(event.target.value); setNextTarget(mode); }}>{Object.keys(SOUNDKEY_PROFILES).map(id => <option key={id} value={id}>{id}</option>)}</select></label><p>Map a MIDI note by choosing a note number and sound.</p><label>MIDI note<input type="number" min="0" max="127" value={lastNote || "48"} onChange={event => setLastNote(event.target.value)} /></label><label>Sound token<input value={mapping[lastNote || "48"] || ""} onChange={event => setMapping(current => ({ ...current, [lastNote || "48"]: event.target.value }))} placeholder="sh, a, t…" /></label><button type="button" onClick={saveMapping}>Save mapping</button></aside>}
    </div>
  );
}
