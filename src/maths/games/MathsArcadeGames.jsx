import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bridge,
  Check,
  Factory,
  Plus,
  Sparkle
} from "@phosphor-icons/react";

const MathsNumberTrailThree = lazy(() => import("./MathsNumberTrailThree.jsx")
  .then(module => ({ default: module.MathsNumberTrailThree })));
const GlimpseGardenArcade2D = lazy(() => import("./GlimpseGardenArcade2D.jsx")
  .then(module => ({ default: module.GlimpseGardenArcade2D })));
const CountCarryArcade2D = lazy(() => import("./CountCarryArcade2D.jsx")
  .then(module => ({ default: module.CountCarryArcade2D })));

function ArcadeEngineLoading({ label }) {
  return <div aria-live="polite" className="maths-arcade-loading">Opening {label}…</div>;
}

export function NumberTrailGame({ round, disabled, paused = false, onAnswer }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [travelling, setTravelling] = useState(false);
  const answerTimerRef = useRef(0);
  useEffect(() => () => window.clearTimeout(answerTimerRef.current), []);
  const choose = (value, index, component) => {
    if (disabled || travelling || paused) return;
    setSelectedSlot(index);
    setTravelling(true);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    answerTimerRef.current = window.setTimeout(() => {
      setTravelling(false);
      onAnswer(value, { component, optionSlot: index, pathOptions: round.options, travelCompleted: true });
    }, reduceMotion ? 0 : 620);
  };
  return <div className="maths-arcade-mechanic maths-number-trail-v2">
    <div className="maths-number-trail-world">
      <div aria-hidden="true" className="maths-mountain-layer is-back" /><div aria-hidden="true" className="maths-mountain-layer is-front" />
      <Suspense fallback={<div aria-hidden="true" className="maths-number-trail-three is-loading" data-render-state="loading" />}>
        <MathsNumberTrailThree paused={paused} selectedSlot={selectedSlot} />
      </Suspense>
      <ol aria-label={`Number path: ${round.model.sequence.map(value => value ?? "gap").join(", ")}`} className="maths-trail-sequence">
        {round.model.sequence.map((value, index) => <li className={value === null ? "is-gap" : ""} key={`${value ?? "gap"}-${index}`}><small>{value === null ? "Missing" : `Step ${index + 1}`}</small><strong>{value ?? "?"}</strong></li>)}
      </ol>
      <div className="maths-trail-stones" data-child-choices role="group" aria-label="Walk onto a stepping stone for the missing number">
        {round.options.map((value, index) => <button aria-label={`Step onto ${value} and put it in the gap`} aria-pressed={selectedSlot === index} className={selectedSlot === index ? "is-selected" : ""} data-answer-slot={index} data-depth={index + 1} disabled={disabled || travelling || paused} key={value} onClick={() => choose(value, index, "number_trail_stone")} type="button"><span>{value}</span>{selectedSlot === index && <Sparkle aria-hidden="true" size={24} weight="fill" />}</button>)}
      </div>
    </div>
    <p aria-live="polite" className="maths-trail-hint">{travelling ? `Walking to ${round.options[selectedSlot]}...` : "Count along the path. Tap the stone that fits the gap."}</p>
  </div>;
}

export function GlimpseGardenGame({ round, disabled, paused = false, onAnswer }) {
  return <Suspense fallback={<ArcadeEngineLoading label="the garden" />}><GlimpseGardenArcade2D disabled={disabled} onAnswer={onAnswer} paused={paused} round={round} /></Suspense>;
}

export function FrameFoundryGame({ round, disabled, onAnswer }) {
  const [added, setAdded] = useState([]);
  const spaces = useMemo(() => Array.from({ length: round.model.capacity }, (_, index) => index), [round.model.capacity]);
  const toggle = index => setAdded(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index]);
  return <div className="maths-arcade-mechanic maths-foundry-world">
    <div className="maths-foundry-machine" aria-label={`${round.model.shown} fixed counters. ${added.length} counters added.`} role="group">
      <div className="maths-machine-top"><Factory aria-hidden="true" size={34} weight="duotone" /><span>Target order</span><strong>{round.model.target}</strong></div>
      <div className="maths-foundry-frame">
        {spaces.map(index => index < round.model.shown
          ? <span aria-label="Fixed counter" className="is-fixed" key={index} role="img"><Check aria-hidden="true" size={18} weight="bold" /></span>
          : <button aria-label={`${added.includes(index) ? "Remove" : "Add"} counter in space ${index + 1}`} aria-pressed={added.includes(index)} disabled={disabled} key={index} onClick={() => toggle(index)} type="button">{added.includes(index) ? <Sparkle aria-hidden="true" size={20} weight="fill" /> : <Plus aria-hidden="true" size={19} weight="bold" />}</button>)}
      </div>
      <div className="maths-foundry-readout"><span>Already there <b>{round.model.shown}</b></span><span>You added <b>{added.length}</b></span><span>Whole now <b>{round.model.shown + added.length}</b></span></div>
    </div>
    <button className="maths-arcade-submit" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={disabled || added.length === 0} onClick={() => onAnswer(added.length, { component: "frame_foundry_builder", fixed: round.model.shown, addedIndexes: added, whole: round.model.shown + added.length })} type="button">Test this build <ArrowRight aria-hidden="true" size={20} weight="bold" /></button>
  </div>;
}

export function CountCarryGame({ round, disabled, paused = false, onAnswer }) {
  return <Suspense fallback={<ArcadeEngineLoading label="the parcel route" />}><CountCarryArcade2D disabled={disabled} onAnswer={onAnswer} paused={paused} round={round} /></Suspense>;
}

function BridgePlanks({ count, capacity = 10, activeClass = "" }) {
  return <div className={`maths-bridge-planks ${activeClass}`}>{Array.from({ length: capacity }, (_, index) => <span className={index < count ? "is-laid" : ""} key={index} />)}</div>;
}

function relationshipFor(left, right) {
  if (left === right) return "same";
  return left > right ? "a" : "b";
}

export function BridgeBuilderGame({ round, disabled, onAnswer }) {
  const isCompare = round.mechanic === "compare_frames";
  const [built, setBuilt] = useState(0);
  const [pairedSlots, setPairedSlots] = useState([]);
  if (!isCompare) return <div className="maths-arcade-mechanic maths-bridge-world">
    <div className="maths-bridge-sky"><Bridge aria-hidden="true" size={46} weight="duotone" /><span>Numeral beacon</span><strong>{round.model.target}</strong></div>
    <BridgePlanks activeClass="is-building" capacity={10} count={built} />
    <div className="maths-bridge-build-controls"><button disabled={disabled || built === 0} onClick={() => setBuilt(value => value - 1)} type="button">Remove one</button><strong aria-live="polite">{built} {built === 1 ? "plank" : "planks"}</strong><button disabled={disabled || built === 10} onClick={() => setBuilt(value => value + 1)} type="button">Add one</button></div>
    <button className="maths-arcade-submit" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={disabled || built === 0} onClick={() => onAnswer(built, { component: "bridge_numeral_builder", plankCount: built })} type="button">Test the bridge <ArrowRight aria-hidden="true" size={20} weight="bold" /></button>
  </div>;
  const possiblePairs = Math.min(round.model.left, round.model.right);
  const paired = pairedSlots.length;
  const complete = paired === possiblePairs;
  const leftOver = round.model.left - paired;
  const rightOver = round.model.right - paired;
  return <div className="maths-arcade-mechanic maths-bridge-world is-compare">
    <div className="maths-pair-banks">
      <div><span>Left bank</span><BridgePlanks capacity={round.model.left} count={leftOver} /></div>
      <div className="maths-paired-channel"><strong>{paired}</strong><span>{paired === 1 ? "pair" : "pairs"} joined</span></div>
      <div><span>Right bank</span><BridgePlanks capacity={round.model.right} count={rightOver} /></div>
    </div>
    <div className="maths-direct-pairs" role="group" aria-label="Join one plank from each bank">{Array.from({ length: possiblePairs }, (_, index) => { const joined = pairedSlots.includes(index); return <button aria-pressed={joined} disabled={disabled || joined} key={index} onClick={() => setPairedSlots(value => [...value, index])} type="button"><span /><Bridge aria-hidden="true" size={22} weight={joined ? "fill" : "duotone"} /><span /><small>{joined ? `Pair ${index + 1} joined` : `Join pair ${index + 1}`}</small></button>; })}</div>
    <p aria-live="polite" className="maths-pair-result">{complete ? `${leftOver} left unpaired · ${rightOver} right unpaired` : "Pair one from each bank to compare fairly."}</p>
    <div className="maths-relationship-controls" data-child-choices role="group" aria-label="Choose what the pairing proves">
      {[{ value: "a", label: "Left has more" }, { value: "same", label: "Same amount" }, { value: "b", label: "Right has more" }].map((option, slot) => <button data-answer-slot={slot} disabled={disabled || !complete} key={option.value} onClick={() => onAnswer(option.value, { component: "one_to_one_bridge_compare", paired, leftOver, rightOver, derivedRelationship: relationshipFor(round.model.left, round.model.right) })} type="button">{option.label}</button>)}
    </div>
  </div>;
}

export function MathsArcadeGame({ gameId, round, disabled, paused = false, onAnswer }) {
  if (gameId === "glimpse-garden") return <GlimpseGardenGame disabled={disabled} onAnswer={onAnswer} paused={paused} round={round} />;
  if (gameId === "frame-foundry") return <FrameFoundryGame disabled={disabled} onAnswer={onAnswer} round={round} />;
  if (gameId === "count-and-carry") return <CountCarryGame disabled={disabled} onAnswer={onAnswer} paused={paused} round={round} />;
  if (gameId === "quantity-match") return <BridgeBuilderGame disabled={disabled} onAnswer={onAnswer} round={round} />;
  return <NumberTrailGame disabled={disabled} onAnswer={onAnswer} paused={paused} round={round} />;
}
