import { useEffect, useMemo, useRef, useState } from "react";
import { AdventureGame } from "./AdventureGame.jsx";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import { hfwOptions, shuffled } from "../../../../utils/recognitionPractice.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import "./phonics-recognition-overhaul.css";

// A bare spoken cue cannot distinguish homophones. The existing HFW option
// filter removes those foils without changing the reviewed target sequence.
function rescueChoices(round, rounds) {
  const safe = hfwOptions(round.word, [...new Set(rounds.flatMap(item => item.choices))]);
  const existing = round.choices.filter(word => word !== round.word && safe.includes(word));
  const replacements = safe.filter(word => word !== round.word && !existing.includes(word));
  return shuffled([round.word, ...[...existing, ...replacements].slice(0, 2)]);
}

export function RiversideRescueStage({ rounds, state, isSoundEnabled }) {
  const task = rounds[state.index] || rounds.at(-1);
  const choices = useMemo(() => rescueChoices(task, rounds), [task, rounds]);
  const [carried, setCarried] = useState("");
  const [walkX, setWalkX] = useState(() => state.worldSnapshot?.prIndex === state.index ? state.worldSnapshot.prWalkX ?? 16 : 16);
  const [lastWrong, setLastWrong] = useState(() => state.worldSnapshot?.prIndex === state.index ? state.worldSnapshot.prWrong || "" : "");
  const motion = useRef(0);
  const answeredRef = useRef(false);
  const startedRef = useRef(state.index);
  const finishRef = useRef(false);
  const { canHear, replay, unavailable } = useRecordedPracticeCue(task.word, isSoundEnabled && !state.paused, true, state.ownReplay);
  const spokenCueAvailable = canHear && !unavailable;
  const solved = state.planks > state.index;
  const bridge = Math.floor(state.index / 6);
  const bridgeStart = bridge * 6;
  const bridgeRounds = rounds.slice(bridgeStart, bridgeStart + 6);
  const built = Math.max(0, Math.min(bridgeRounds.length, state.planks - bridgeStart));
  const currentIndex = state.index;
  const onWorldSnapshot = state.onWorldSnapshot;

  useEffect(() => {
    if (startedRef.current === state.index) return;
    startedRef.current = state.index;
    setCarried("");
    setLastWrong("");
    setWalkX(16);
    motion.current = 0;
    answeredRef.current = false;
  }, [state.index]);
  useEffect(() => {
    onWorldSnapshot?.({ prIndex: currentIndex, prWalkX: walkX, prWrong: lastWrong });
  }, [currentIndex, onWorldSnapshot, walkX, lastWrong]);
  useEffect(() => {
    if (state.paused || solved) motion.current = 0;
  }, [state.paused, solved]);
  useEffect(() => {
    let frame, previous;
    const tick = now => {
      const elapsed = previous == null ? 0 : Math.min(.05, (now - previous) / 1000);
      previous = now;
      if (!state.paused && !solved && motion.current) setWalkX(x => Math.max(7, Math.min(35, x + motion.current * elapsed * 30)));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.paused, solved]);
  useEffect(() => {
    const release = () => { motion.current = 0; };
    const keyup = event => { if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) release(); };
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", release);
    return () => { window.removeEventListener("keyup", keyup); window.removeEventListener("blur", release); };
  }, []);
  useEffect(() => {
    if (state.arrivalReady && !state.paused && !finishRef.current) {
      finishRef.current = true;
      state.finish();
    }
  }, [state]);

  function choose(word) {
    if (state.paused || solved || state.arrivalReady || answeredRef.current) return;
    answeredRef.current = word === task.word;
    setLastWrong(word === task.word ? "" : word);
    setCarried(word === task.word ? word : "");
    state.choose(word, spokenCueAvailable);
  }
  function move(direction) {
    if (!state.paused && !solved) motion.current = direction;
  }
  const wrong = lastWrong;
  return <section className={`pr-game pr-rescue${state.paused ? " pr-paused" : ""}`} data-aw-mode="rescue"
    data-aw-index={state.index} data-built={state.planks} data-engine-paused={Boolean(state.paused)} tabIndex={0} aria-label="Word Rescue river trail"
    onKeyDown={event => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (["ArrowLeft", "a", "A", "ArrowRight", "d", "D"].includes(event.key)) {
        event.preventDefault();
        move(["ArrowLeft", "a", "A"].includes(event.key) ? -1 : 1);
      }
    }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) motion.current = 0; }}>
    <header className="pr-objective">
      <div><strong>{spokenCueAvailable ? "Find the spoken word plank" : <>Find <b data-aw="target">{task.word}</b></>}</strong><span>Read a plank. Speedy will carry the matching word.</span></div>
      <span className="pr-count">{state.planks}/{rounds.length}<small>bridge planks</small></span>
      <button type="button" className="pr-replay" disabled={!canHear || state.paused} aria-label="Hear target word" onClick={() => state.ownReplay?.(replay())}>♪<small>Hear</small></button>
    </header>
    <div className={`pr-riverside pr-river-${bridge % 3}`} data-aw="world">
      <div className="pr-bridge-sign">Bridge {bridge + 1} of {Math.ceil(rounds.length / 6)}</div>
      <div className="pr-river-water" aria-hidden="true"><i /><i /><i /></div>
      <div className="pr-left-bank" aria-hidden="true" /><div className="pr-right-bank" aria-hidden="true" />
      <div className="pr-word-bridge" aria-label={`${built} of ${bridgeRounds.length} planks in this bridge`}>
        {bridgeRounds.map((item, index) => <span key={index} className={`pr-bridge-plank${index < built ? " is-built" : ""}`}
          data-aw="bridge" data-solid={index < built} aria-label={index < built ? `Built plank ${item.word}` : "Missing plank"}>{index < built ? item.word : ""}</span>)}
      </div>
      <div className={`pr-rescue-hero${solved ? " is-delivering" : ""}`} style={{ left: `${solved ? 42 + (built - .5) / bridgeRounds.length * 38 : walkX}%` }} aria-hidden="true">
        <img src={CAST.speedy.heroSprite} alt="" onError={event => { event.currentTarget.hidden = true; }} />{carried && <span className="pr-carried-word">{carried}</span>}
      </div>
      <div className={`pr-rescue-friend${built === bridgeRounds.length ? " is-safe" : ""}`} aria-hidden="true"><img src={CAST.splashy.sprite} alt="" onError={event => { event.currentTarget.hidden = true; }} /><span>{built === bridgeRounds.length ? "✓" : "…"}</span></div>
      <div className="pr-plank-rack" role="group" aria-label="Choose the matching word plank">
        {choices.map(word => <button type="button" key={`${state.index}-${word}`} className={`pr-answer-plank${wrong === word ? " is-wrong" : ""}${solved && word === task.word ? " is-chosen" : ""}`}
          disabled={state.paused || solved || state.arrivalReady} data-aw="pickup" data-value={word}
          onClick={() => choose(word)} aria-label={`Read ${word} plank`}>{word}{solved && word === task.word && <span aria-hidden="true">✓</span>}</button>)}
      </div>
    </div>
    <footer className="pr-rescue-footer">
      <button type="button" className="pr-walk" aria-label="Walk left" disabled={state.paused || solved}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(-1); }}
        onPointerUp={() => move(0)} onPointerCancel={() => move(0)} onLostPointerCapture={() => move(0)}
        onClick={() => { if (!state.paused && !solved) setWalkX(x => Math.max(7, x - 5)); }}>←</button>
      <p className="pr-feedback" role="status" data-aw="feedback">{solved ? `${task.word}! The word matches and the bridge grows.`
        : wrong ? `That says ${wrong}. ${spokenCueAvailable ? "Hear the target again and read all the letters." : `Find ${task.word}. Read all the letters.`}`
          : "Choose the matching word to build a safe path for Splashy."}</p>
      <button type="button" className="pr-walk" aria-label="Walk right" disabled={state.paused || solved}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(1); }}
        onPointerUp={() => move(0)} onPointerCancel={() => move(0)} onLostPointerCapture={() => move(0)}
        onClick={() => { if (!state.paused && !solved) setWalkX(x => Math.min(35, x + 5)); }}>→</button>
    </footer>
  </section>;
}

const stages = { rescue: RiversideRescueStage };
export default function WordRescue(props) {
  return <AdventureGame {...props} title="Word Rescue" mode="rescue" stageComponents={stages} />;
}
