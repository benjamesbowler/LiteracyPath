/* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
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

export function SoundKeysApp() {
  const [mode, setMode] = useState("free");
  const [profile, setProfile] = useState("cvc");
  const [mapping, setMapping] = useState(() => ({ ...DEFAULT_MAPPING, ...JSON.parse(window.localStorage.getItem("soundkeys-mapping") || "{}") }));
  const [tokens, setTokens] = useState([]);
  const [target, setTarget] = useState(() => wordForMode("picture"));
  const [resolved, setResolved] = useState(null);
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiMessage, setMidiMessage] = useState("Connect a MIDI keyboard or use the keys below.");
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [autoRead, setAutoRead] = useState(true);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [lastNote, setLastNote] = useState("");
  const resolveTimer = useRef(null);
  const [session] = useState(() => ({ attempts: 0, correct: 0, startedAt: Date.now() }));
  const activeTokens = useMemo(() => profile === "digraphs" ? SOUNDKEY_PROFILES.digraphs : SOUNDKEY_PROFILES.cvc, [profile]);

  useEffect(() => {
    const cleanupKeyboard = createComputerKeyboardProvider(handleEvent);
    let cleanupMidi;
    connectWebMidi(handleEvent).then(cleanup => { cleanupMidi = cleanup; }).catch(() => setMidiMessage("MIDI is unavailable here. The onscreen keys still work."));
    return () => { cleanupKeyboard(); cleanupMidi?.(); window.clearTimeout(resolveTimer.current); };
  }, []);

  useEffect(() => () => window.clearTimeout(resolveTimer.current), []);

  function setNextTarget(nextMode = mode) {
    setTarget(wordForMode(nextMode));
    setTokens([]);
    setResolved(null);
  }

  function handleEvent(event) {
    if (event.type === "midi-status") { setMidiConnected(Boolean(event.connected)); return; }
    if (event.type === "control") { setTokens([]); setResolved(null); return; }
    if (event.type === "midi") {
      setLastNote(String(event.note));
      const token = resolveTokenForNote(event.note, mapping);
      if (!token) { setMidiMessage(`Note ${event.note} is not mapped yet.`); return; }
      acceptToken(token);
      return;
    }
    if (event.type === "token") acceptToken(event.token);
  }

  function acceptToken(token) {
    const isMissing = mode === "missing";
    const next = isMissing ? [token] : appendToken(tokens, token, target?.tokens?.length || Infinity);
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

  function chooseMode(nextMode) { setMode(nextMode); setNextTarget(nextMode); }
  function clearWord() { setTokens([]); setResolved(null); }
  function saveMapping() { window.localStorage.setItem("soundkeys-mapping", JSON.stringify(mapping)); setTeacherOpen(false); }

  const targetTokens = target?.tokens || [];
  return (
    <div className="soundkeys-app" data-child-surface="soundkeys">
      <header className="soundkeys-topbar">
        <a className="soundkeys-back" href="/">← Kids home</a>
        <div><span className="soundkeys-mark">SoundKeys</span><small>MIDI Word Builder</small></div>
        <div className="soundkeys-actions">
          <span className={`soundkeys-midi-status${midiConnected ? " is-connected" : ""}`} aria-live="polite">● {midiConnected ? "MIDI ready" : "MIDI not connected"}</span>
          <button type="button" onClick={() => setTeacherOpen(open => !open)} aria-expanded={teacherOpen}>⚙</button>
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
