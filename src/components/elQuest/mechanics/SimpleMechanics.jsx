import { useEffect, useRef, useState } from "react";
import { SpeakerHigh, Check, X, ArrowCounterClockwise, Star } from "@phosphor-icons/react";
import { resolveScenePicture } from "./codeMechanicState.js";
import { collectTarget, createCollection, createMemory, flipMemoryCard, resetMemoryMiss, chooseSimpleAnswer } from "./simpleMechanicState.js";
import { playStarChime } from "../../../utils/audio/gameSfx.js";
import { triggerTactileFeedback } from "../../../utils/tactileFeedback.js";
import "../../../styles/adventure-simple-games.css";

function Picture({ word, image, className = "" }) {
  const source = image || resolveScenePicture(word);
  return source ? <img className={className} src={source} alt="" draggable="false" /> : <span className="am-simple-picture-label">{word}</span>;
}

function HearWord({ word, disabled, onRequestObjectAudio }) {
  return <button className="am-simple-hear" type="button" disabled={disabled} aria-label={`Hear ${word}`} onClick={() => onRequestObjectAudio?.(word)}><SpeakerHigh size={22} weight="fill" aria-hidden="true" /><span>Hear</span></button>;
}

function FindCount({ found, total, label = "found" }) {
  return <p className="am-simple-count" role="status" aria-live="polite"><Check size={22} weight="bold" aria-hidden="true" />{found} / {total} {label}</p>;
}

export function LetterGridMechanic({ round, disabled, supportLevel, onCommit, reducedMotion }) {
  const [state, setState] = useState(createCollection);
  const current = useRef(state);
  function find(id) {
    if (disabled) return;
    const result = collectTarget(current.current, round, id, supportLevel);
    if (result.state === current.current) return;
    current.current = result.state;
    setState(result.state);
    if (result.outcome) onCommit?.(result.outcome);
    else { triggerTactileFeedback(); playStarChime(); }
  }
  return <section className="am-simple am-letter-grid" data-mechanic-stage="letter-grid" data-reduced-motion={Boolean(reducedMotion)} aria-label="Find the letters">
    <div className="am-simple-target-letters" aria-label="Letters to find">{round.targetLetters.map(letter => <span key={letter}>{letter.toUpperCase()} {letter.toLowerCase()}</span>)}</div>
    <div className="am-letter-grid__cells" role="group" aria-label="Letter grid">{round.cells.map(cell => {
      const found = state.found.includes(cell.id);
      return <button key={cell.id} type="button" data-cell-id={cell.id} data-find-state={found ? "found" : state.wrong === cell.id ? "retry" : "ready"} aria-label={`${cell.letter}, letter ${round.cells.indexOf(cell) + 1}`} aria-pressed={found} disabled={disabled || found} onClick={() => find(cell.id)}><span>{cell.letter}</span>{found && <Check weight="bold" aria-hidden="true" />}</button>;
    })}</div>
    <FindCount found={state.found.length} total={round.cells.filter(cell => cell.matches).length} />
  </section>;
}

export function PictureSearchMechanic({ round, disabled, supportLevel, onCommit, onRequestObjectAudio, reducedMotion }) {
  const [state, setState] = useState(createCollection);
  const current = useRef(state);
  const scene = round.mechanicId === "pictureSearch";
  function find(object) {
    if (disabled) return;
    const result = collectTarget(current.current, round, String(object.id ?? object.word), supportLevel);
    if (result.state === current.current) return;
    current.current = result.state;
    setState(result.state);
    if (result.outcome) onCommit?.(result.outcome);
    else { triggerTactileFeedback(); playStarChime(); }
  }
  return <section className={`am-simple ${scene ? "am-picture-search" : "am-picture-sounds"}`} data-mechanic-stage={scene ? "picture-search" : "scene-hunt"} data-hunt-state={state.complete ? "complete" : "searching"} data-reduced-motion={Boolean(reducedMotion)} aria-label={scene ? "Find pictures in the scene" : "Find the matching pictures"}>
    <div className="am-picture-target"><span>{round.variant === "soundSort" ? "Ends with" : "Starts with"}</span><strong>{round.targetGrapheme}</strong><FindCount found={state.found.length} total={round.objects.filter(object => object.matches).length} /></div>
    <div className={scene ? "am-picture-search__scene" : "am-picture-sounds__choices"} role="group" aria-label="Picture words" style={scene ? { backgroundImage: `url(${round.scene})` } : undefined}>
      {round.objects.map(object => {
        const id = String(object.id ?? object.word);
        const found = state.found.includes(id);
        return <div key={id} className={scene ? "am-picture-search__object" : "am-simple-picture-card"} style={scene ? { left: `${object.x}%`, top: `${object.y}%` } : undefined}>
          <button className="am-simple-picture-choice" type="button" aria-label={`Choose ${object.word}`} aria-pressed={found} data-scene-word={object.word} data-find-state={found ? "found" : state.wrong === id ? "retry" : "ready"} disabled={disabled || found} onClick={() => find(object)}><Picture word={object.word} image={object.image} />{!scene && <span>{object.word}</span>}{found && <Check className="am-simple-found" weight="bold" aria-hidden="true" />}</button>
          <HearWord word={object.word} disabled={disabled} onRequestObjectAudio={onRequestObjectAudio} />
        </div>;
      })}
    </div>
  </section>;
}

export function WordMemoryMechanic({ round, disabled, supportLevel, onCommit, onRequestObjectAudio, reducedMotion }) {
  const [state, setState] = useState(createMemory);
  const current = useRef(state);
  useEffect(() => {
    if (!state.mismatch) return undefined;
    const timer = window.setTimeout(() => { current.current = resetMemoryMiss(current.current); setState(current.current); }, 1100);
    return () => window.clearTimeout(timer);
  }, [state.mismatch]);
  function flip(id) {
    if (disabled) return;
    const before = current.current;
    const result = flipMemoryCard(before, round, id, supportLevel);
    if (result.state === before) return;
    current.current = result.state;
    setState(result.state);
    onRequestObjectAudio?.(round.cards.find(card => card.id === id).word);
    if (result.outcome) onCommit?.(result.outcome);
    else if (result.state.matched.length > before.matched.length) playStarChime();
    triggerTactileFeedback();
  }
  return <section className="am-simple am-word-memory" data-mechanic-stage="word-memory" data-reduced-motion={Boolean(reducedMotion)} aria-label="Find matching word cards">
    <div className="am-word-memory__cards" role="group" aria-label="Hidden word cards">{round.cards.map((card, index) => {
      const matched = state.matched.includes(card.id);
      const faceUp = matched || state.open.includes(card.id);
      return <button key={card.id} className="am-word-memory__card" type="button" data-card-id={card.id} data-card-state={matched ? "matched" : faceUp ? "open" : "hidden"} disabled={disabled || matched || state.mismatch} aria-label={faceUp ? `${card.word}, card ${index + 1}${matched ? ", matched" : ""}` : `Turn over card ${index + 1}`} onClick={() => flip(card.id)}>{faceUp ? <span>{card.word}</span> : <Star size={42} weight="duotone" aria-hidden="true" />}{matched && <Check weight="bold" className="am-simple-found" aria-hidden="true" />}</button>;
    })}</div>
    <FindCount found={state.matched.length / 2} total={round.cards.length / 2} label="pairs" />
  </section>;
}

export function MissingLetterMechanic({ round, disabled, supportLevel, onCommit, onRequestObjectAudio, reducedMotion }) {
  const [selected, setSelected] = useState("");
  const committed = useRef(false);
  function choose(choice) {
    if (disabled || committed.current) return;
    const outcome = chooseSimpleAnswer(round, choice, supportLevel);
    committed.current = outcome.correct;
    setSelected(choice);
    onCommit?.(outcome);
  }
  return <section className="am-simple am-missing-letter" data-mechanic-stage="missing-letter" data-missing-position={round.missingPosition} data-reduced-motion={Boolean(reducedMotion)} aria-label={`Find the ${round.missingPosition === "start" ? "first" : "last"} sound`}>
    <div className="am-missing-letter__model"><div className="am-missing-letter__picture"><Picture word={round.word} image={round.image} /><HearWord word={round.word} disabled={disabled} onRequestObjectAudio={onRequestObjectAudio} /></div><div className="am-missing-letter__word" aria-label="Word with a missing letter">{(round.graphemes || [...round.word]).map((letter, index) => <span key={index} data-letter-slot={index === round.missingIndex ? "missing" : "given"} data-answer-state={index === round.missingIndex && selected ? selected === round.missingGrapheme ? "correct" : "retry" : "ready"}>{index === round.missingIndex ? selected || "?" : letter}</span>)}</div></div>
    <div className="am-simple-letter-choices" role="group" aria-label="Choose the missing letter">{round.choices.map(choice => <button key={choice} type="button" aria-pressed={selected === choice} disabled={disabled || selected === round.missingGrapheme} onClick={() => choose(choice)}>{choice}</button>)}</div>
  </section>;
}

export function PictureWordChoiceMechanic({ round, disabled, supportLevel, onCommit, onRequestObjectAudio, reducedMotion }) {
  const [selected, setSelected] = useState([]);
  const current = useRef([]);
  const committed = useRef(false);
  const pair = round.mechanicId === "rhymePair";
  const compound = round.mechanicId === "compoundPicture";
  const complete = selected.length > 0 && chooseSimpleAnswer(round, pair ? selected : selected[0]).correct;
  const attempted = pair ? selected.length === 2 : selected.length === 1;
  function choose(word) {
    if (disabled || committed.current) return;
    const previous = current.current.length < 2 ? current.current : [];
    const next = pair ? previous.includes(word) ? [] : [...previous, word] : [word];
    current.current = next;
    setSelected(next);
    if (pair && next.length < 2) { triggerTactileFeedback(); onRequestObjectAudio?.(word); return; }
    const outcome = chooseSimpleAnswer(round, pair ? next : word, supportLevel);
    committed.current = outcome.correct;
    onCommit?.(outcome);
  }
  return <section className={`am-simple am-picture-words ${compound ? "am-compound-pictures" : "am-rhymes"}`} data-mechanic-stage={compound ? "compound-picture" : pair ? "rhyme-pair" : "rhyme-odd"} data-reduced-motion={Boolean(reducedMotion)} aria-label={compound ? "Join the picture words" : pair ? "Choose two rhyming words" : "Choose the word that does not rhyme"}>
    {compound && <div className="am-compound-pictures__parts" aria-label="Two word parts">{round.parts.map((part, index) => <div className="am-compound-pictures__part" key={part.word}>{index > 0 && <span className="am-compound-plus" aria-hidden="true">+</span>}<div><Picture word={part.word} image={part.image} /><HearWord word={part.word} disabled={disabled} onRequestObjectAudio={onRequestObjectAudio} /></div></div>)}</div>}
    <div className="am-picture-words__choices" role="group" aria-label={pair ? "Pick two pictures" : "Choose a picture"}>{round.choices.map(word => <div className="am-simple-picture-card" key={word}><button className="am-simple-picture-choice" type="button" aria-label={`Choose ${word}`} aria-pressed={selected.includes(word)} data-answer-state={selected.includes(word) ? complete ? "correct" : attempted ? "retry" : "selected" : "ready"} disabled={disabled || complete} onClick={() => choose(word)}><Picture word={word} image={round.objects?.find(object => object.word === word)?.image} /><span>{word}</span>{selected.includes(word) && (complete ? <Check className="am-simple-found" weight="bold" aria-hidden="true" /> : attempted ? <X className="am-simple-miss" weight="bold" aria-hidden="true" /> : <span className="am-simple-selected" aria-hidden="true">1</span>)}</button><HearWord word={word} disabled={disabled} onRequestObjectAudio={onRequestObjectAudio} /></div>)}</div>
    {pair && <p className="am-simple-count" role="status">{selected.length === 1 ? "Choose one more." : "Find two that rhyme."}{selected.length === 1 && <button type="button" aria-label="Choose the pair again" className="am-simple-reset" disabled={disabled} onClick={() => { current.current = []; setSelected([]); }}><ArrowCounterClockwise size={22} aria-hidden="true" /></button>}</p>}
  </section>;
}
