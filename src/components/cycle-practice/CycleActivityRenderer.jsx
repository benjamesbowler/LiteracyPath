import CycleButton from "./CycleButton.jsx";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SpeakerIcon } from "../elQuest/AdventureRoundFrame.jsx";
import CycleTraceActivity from "./CycleTraceActivity.jsx";

export function CycleIcon({ name, ...props }) {
  const paths = {
    star: "m12 2 3 6.1 6.7 1-4.8 4.7 1.1 6.7-6-3.2-6 3.2 1.1-6.7L2.3 9.1 6.7-1Z",
    play: "m8 4 13 8-13 8Z",
    pause: "M8 5v14M16 5v14",
    home: "m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    retry: "M4 10a8 8 0 1 1 1 8M4 4v6h6",
    tick: "m5 12 4 4L19 6",
  };
  return <svg viewBox="0 0 24 24" fill={name === "star" || name === "play" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.star} /></svg>;
}

const PictureRevision = createContext(0);

function Picture({ src, word, onFailure, className = "" }) {
  const revision = useContext(PictureRevision);
  return <img key={`${src}:${revision}`} className={`cycle-picture ${className}`} src={src} alt={word || ""} draggable="false" data-assessment-media-kind="evidence" data-assessment-media-role="picture" onError={onFailure} />;
}

function HearPicture({ choice, disabled, onHear }) {
  return <CycleButton type="button" className="cycle-picture-hear" aria-label={`Hear ${choice.label || choice.value}`} disabled={disabled} data-audio-action="replay" onClick={() => onHear?.(choice.audio, choice.label || choice.value)}><SpeakerIcon /></CycleButton>;
}

function ChoiceActivity({ round, disabled, onCommit, onHear, onMediaFailure, supportLevel }) {
  const [selected, setSelected] = useState(null);
  const lock = useRef(false);
  const pictureChoice = round.mechanicId === "pictureSound" || round.mechanicId === "rhymeMatch" || round.variant === "wordParts";
  const rhyme = round.mechanicId === "rhymeMatch";
  const select = choice => {
    if (disabled || lock.current) return;
    lock.current = true;
    setSelected(choice.value);
    if (onCommit({ correct: String(choice.value) === String(round.answer), selected: choice.value, evidence: { supportLevel } }) === false) {
      lock.current = false; setSelected(null);
    }
  };
  return <div className={`cycle-choice-play cycle-choice-play--${round.mechanicId}`}>
    {round.mechanicId === "pictureSound" ? <div className="cycle-sound-sun" aria-label={`Find the ${round.targetGrapheme} sound`}><span>{round.targetGrapheme}</span><SpeakerIcon /></div> :
      <div className={`cycle-picture-model${rhyme ? " cycle-picture-model--rhyme" : ""}`}>
        <Picture src={round.image} word={round.imageWord || round.targetWord} onFailure={onMediaFailure} />
        {round.mechanicId === "letterMatch" && round.variant !== "wordListen" && <span className="cycle-model-letter" aria-hidden="true">{round.variant === "letterCase" ? round.model : "?"}</span>}
        <CycleButton type="button" className="cycle-picture-hear" aria-label={`Hear ${round.targetWord}`} disabled={disabled} data-audio-action="replay" onClick={() => onHear?.(round.audio, round.targetWord)}><SpeakerIcon /></CycleButton>
        {rhyme && <div className="cycle-rhyme-link" aria-hidden="true">↔</div>}
      </div>}
    <div className="cycle-play-choices" role="group" aria-label={pictureChoice ? "Choose a picture" : "Choose a letter"}>
      {round.choices.map(choice => <div className="cycle-choice-wrap" key={choice.id || choice.value}>
        <CycleButton type="button" className={`cycle-answer ${pictureChoice ? "cycle-answer--picture" : round.variant === "wordListen" ? "cycle-answer--word" : "cycle-answer--letter"}${supportLevel >= 2 && String(choice.value) === String(round.answer) ? " cycle-answer--hint" : ""}`} aria-label={choice.label || String(choice.value)} aria-pressed={selected === choice.value} disabled={disabled || selected !== null} onClick={() => select(choice)}>
          {pictureChoice ? <Picture src={choice.image} word={choice.label} onFailure={onMediaFailure} /> : <span>{choice.label || choice.value}</span>}
          <span className="cycle-choice-marker" aria-hidden="true">{selected === choice.value ? "●" : ""}</span>
        </CycleButton>
        {pictureChoice && <HearPicture choice={choice} disabled={disabled} onHear={onHear} />}
      </div>)}
    </div>
  </div>;
}

function WordBuild({ round, disabled, feedbackPending, onCommit, onHear, onMediaFailure, supportLevel, onStep }) {
  const expected = Array.isArray(round.answer) ? round.answer : (round.letters || round.graphemes || [...String(round.answer || round.targetWord)]);
  const changing = round.variant === "wordChange";
  const [built, setBuilt] = useState(() => changing ? [...round.beforeLetters] : []);
  const [changeSlot, setChangeSlot] = useState(null);
  const nextIndex = changing ? changeSlot : built.length;
  const [miss, setMiss] = useState(null);
  const locked = useRef(false);
  const model = round.modelWord || (round.variant === "highFrequency" ? round.targetWord : "");
  useEffect(() => {
    if (feedbackPending || !locked.current) return;
    locked.current = false;
    setMiss(null);
  }, [feedbackPending]);
  const place = choice => {
    if (disabled || locked.current || miss !== null || (changing && changeSlot === null)) return;
    const value = String(choice.value);
    if (value !== String(expected[nextIndex]) || (changing && nextIndex !== round.changeIndex)) {
      locked.current = true;
      setMiss(value);
      const accepted = onCommit({ correct: false, selected: changing ? built.map((letter, index) => index === nextIndex ? value : letter) : [...built, value], evidence: { supportLevel, ...(model ? { independent: false, supportUsed: ["visible_word_model"] } : {}) } });
      if (accepted === false) { locked.current = false; setMiss(null); }
      return;
    }
    const next = changing ? built.map((letter, index) => index === nextIndex ? value : letter) : [...built, value];
    setBuilt(next);
    onStep?.(choice.audio);
    if (next.length === expected.length && next.every(Boolean)) {
      locked.current = true;
      const accepted = onCommit({ correct: true, selected: next, evidence: { supportLevel, ...(model ? { independent: false, supportUsed: ["visible_word_model"] } : {}) } });
      if (accepted === false) { locked.current = false; setBuilt(built); }
    }
  };
  return <div className="cycle-word-workshop">
    <div className="cycle-build-target">
      {changing && <div className="cycle-before-word"><Picture src={round.beforeImage} word={round.beforeWord} onFailure={onMediaFailure} /><span>{round.beforeWord}</span></div>}
      {changing && <CycleIcon name="arrow" className="cycle-change-arrow" />}
      <Picture src={round.image} word={round.imageWord || round.targetWord} onFailure={onMediaFailure} />
      {model && <strong className="cycle-copy-model" aria-label={`Word model ${model}`}>{model}</strong>}
      <CycleButton type="button" className="cycle-picture-hear" aria-label={`Hear ${round.targetWord}`} disabled={disabled} data-audio-action="replay" onClick={() => onHear?.(round.audio, round.targetWord)}><SpeakerIcon /></CycleButton>
    </div>
    <div className="cycle-word-train" role="group" aria-label="Word you are building">
      <div className="cycle-train-engine" aria-hidden="true"><span /><i /><b /><em /></div>
      {expected.map((_, index) => <div key={index} className={`cycle-word-car${index === nextIndex ? " cycle-word-car--next" : ""}${built[index] ? " cycle-word-car--filled" : ""}`} aria-label={`Letter ${index + 1}: ${built[index] || "empty"}`}><span>{changing ? <CycleButton type="button" className={`cycle-change-letter${supportLevel >= 2 && index === round.changeIndex ? " cycle-answer--hint" : ""}`} aria-label={`Change letter ${index + 1}: ${built[index]}`} aria-pressed={changeSlot === index} disabled={disabled || miss !== null} onClick={() => { setChangeSlot(index); onStep?.(); }}>{built[index]}</CycleButton> : built[index] || ""}</span><i /><i /></div>)}
    </div>
    <div className="cycle-letter-bank" role="group" aria-label="Letters to build the word">
      {round.choices.map(choice => <CycleButton type="button" key={choice.id || choice.value} className={`cycle-letter-block${supportLevel >= 2 && String(choice.value) === String(expected[changing ? round.changeIndex : nextIndex]) ? " cycle-answer--hint" : ""}`} disabled={disabled || miss !== null || (changing && changeSlot === null)} onClick={() => place(choice)} aria-label={`Add ${choice.label || choice.value}`}><span>{choice.label || choice.value}</span></CycleButton>)}
    </div>
  </div>;
}

function SoundSort({ round, disabled, feedbackPending, assessment, onCommit, onHear, onMediaFailure, supportLevel, onSubtarget, priorResponses = [] }) {
  const objects = round.objects || [{ word: round.targetWord, image: round.image, audio: round.audio, answer: round.answer }];
  const [initialPlacements] = useState(() => {
    const restored = [];
    for (const item of objects.slice(0, -1)) {
      const response = priorResponses.find(record => record.itemKey === item.word && (assessment || record.evidence?.objectCorrect));
      if (!response) break;
      restored.push({ ...item, bin: item.answer, correct: response.evidence?.objectCorrect === true });
    }
    return restored;
  });
  const [objectIndex, setObjectIndex] = useState(initialPlacements.length);
  const [placements, setPlacements] = useState(initialPlacements);
  const [picked, setPicked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);
  const [hoveredBin, setHoveredBin] = useState(null);
  const object = objects[objectIndex];
  const drag = useRef(null);
  const lock = useRef(false);
  const pending = useRef(null);
  const subtargetCallback = useRef(onSubtarget);
  const cancelDrag = () => {
    const held = drag.current;
    drag.current = null;
    if (held?.element.hasPointerCapture?.(held.id)) held.element.releasePointerCapture(held.id);
    setDragPosition(null); setHoveredBin(null);
  };
  useEffect(() => {
    window.addEventListener("blur", cancelDrag);
    return () => window.removeEventListener("blur", cancelDrag);
  }, []);
  useEffect(() => {
    if (!disabled) return undefined;
    const held = drag.current;
    drag.current = null;
    if (held?.element.hasPointerCapture?.(held.id)) held.element.releasePointerCapture(held.id);
    const frame = requestAnimationFrame(() => { setDragPosition(null); setHoveredBin(null); });
    return () => cancelAnimationFrame(frame);
  }, [disabled]);
  useEffect(() => { subtargetCallback.current = onSubtarget; }, [onSubtarget]);
  useEffect(() => {
    if (round.objects) subtargetCallback.current?.(object);
  }, [round.id, round.objects, object]);
  useEffect(() => {
    if (feedbackPending || !pending.current) return;
    const step = pending.current;
    pending.current = null;
    if (step.advance) {
      // Keep the original scored choice in the record, while the completed
      // picture sits with its actual sound instead of teaching a wrong match.
      setPlacements(previous => [...previous, { ...step.object, bin: step.object.answer, correct: step.correct }]);
      setObjectIndex(index => index + 1);
    }
    setSelected(null); setPicked(false); lock.current = false;
  }, [feedbackPending]);
  const send = choice => {
    if (disabled || lock.current) return;
    lock.current = true; setSelected(choice.value);
    const correct = String(choice.value) === String(object.answer);
    const hasNext = objectIndex + 1 < objects.length;
    // A wrong practice answer stays on this object. A check records the first
    // classification and continues, without supplying a second scored try.
    pending.current = { advance: hasNext && (correct || assessment), object, bin: choice.value, correct };
    const accepted = onCommit({ correct, selected: choice.value, ...(round.objects ? { object, partial: hasNext } : {}), evidence: { supportLevel, objectIndex, objectCorrect: correct, classifiedObjects: placements.length + (correct ? 1 : 0) } });
    if (accepted === false) { pending.current = null; lock.current = false; setSelected(null); }
  };
  function release(event) {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    const delta = Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y);
    cancelDrag();
    if (delta < 12) { setPicked(true); return; }
    const bin = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-cycle-bin]");
    if (bin) {
      const choice = round.choices.find(row => String(row.value) === bin.getAttribute("data-cycle-bin"));
      if (choice) send(choice);
    } else setPicked(true);
  }
  function move(event) {
    if (!drag.current || event.pointerId !== drag.current.id || disabled) return;
    const delta = Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y);
    if (delta < 12) return;
    setDragPosition({ x: event.clientX, y: event.clientY });
    setHoveredBin(document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-cycle-bin]")?.getAttribute("data-cycle-bin") || null);
  }
  return <div className={`cycle-sort-play${round.objects ? " cycle-sort-play--tray" : ""}`}>
    <div className="cycle-sort-tray">
      {round.objects && <div className="cycle-sort-waiting" aria-label="Pictures to sort">{objects.slice(objectIndex + 1).map(item => <Picture key={item.word} src={item.image} word={item.word} onFailure={onMediaFailure} />)}</div>}
      <div className={`cycle-sort-package${picked ? " cycle-sort-package--picked" : ""}`}>
        <button type="button" className="cycle-sort-picture" aria-label={`Pick up ${object.word}`} aria-pressed={picked} disabled={disabled || selected !== null} onClick={() => setPicked(true)}
          onPointerDown={event => { if (disabled || event.button !== 0 || event.isPrimary === false) return; drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, element: event.currentTarget }; event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={move} onPointerUp={release} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}>
          <Picture src={object.image} word={object.word} onFailure={onMediaFailure} />
        </button>
        <CycleButton type="button" className="cycle-picture-hear" data-audio-action="replay" aria-label={`Hear ${object.word}`} disabled={disabled} onClick={() => onHear?.(object.audio, object.word)}><SpeakerIcon /></CycleButton>
      </div>
    </div>
    <div className="cycle-sort-arrow" aria-hidden="true">↓</div>
    <div className="cycle-sort-bins" role="group" aria-label={round.variant === "syllableSort" ? "Word beats" : "Sound baskets"}>
      {round.choices.map(choice => <div className="cycle-sort-bin-wrap" key={choice.id || choice.value}>
        <div className="cycle-sort-bin-actions">
        <CycleButton type="button" className={`cycle-sort-bin${hoveredBin === String(choice.value) ? " cycle-sort-bin--hovered" : ""}${supportLevel >= 2 && String(choice.value) === String(object.answer) ? " cycle-answer--hint" : ""}`} aria-label={`Put ${object.word} in ${choice.label || choice.value}`} aria-pressed={selected === choice.value} data-cycle-bin={String(choice.value)} disabled={disabled || selected !== null} onClick={() => send(choice)}>
          <span className="cycle-basket-handle" />
          <strong>{choice.beats ? <span className="cycle-beat-dots" aria-label={`${choice.beats} beats`}>{Array.from({ length: choice.beats }, (_, i) => <i key={i} />)}</span> : choice.label || choice.value}</strong>
          <span className="cycle-basket-weave" />
        </CycleButton>
        <HearPicture choice={choice} disabled={disabled} onHear={onHear} />
        </div>
        {round.objects && <div className="cycle-sorted-pictures" aria-label={`Pictures with ${choice.label || choice.value}`}>
          {placements.filter(item => String(item.bin) === String(choice.value)).map(item => <Picture key={item.word} src={item.image} word={item.word} onFailure={onMediaFailure} />)}
        </div>}
      </div>)}
    </div>
    {dragPosition && createPortal(<img className="cycle-drag-picture" src={object.image} alt="" aria-hidden="true" style={{ left: dragPosition.x, top: dragPosition.y }} />, document.body)}
  </div>;
}

export function CycleActivityRenderer(props) {
  const { round } = props;
  const Activity = round.mechanicId === "letterTrace" ? CycleTraceActivity
    : round.mechanicId === "wordBuild" && round.variant !== "wordParts" ? WordBuild
      : round.mechanicId === "soundSort" ? SoundSort : ChoiceActivity;
  return <PictureRevision value={props.mediaRevision || 0}><Activity {...props} /></PictureRevision>;
}
