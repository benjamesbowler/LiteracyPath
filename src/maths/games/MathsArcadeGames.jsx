import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import {
  ArrowRight,
  Basket,
  Bridge,
  Check,
  Factory,
  HandPointing,
  Package,
  Plus,
  Sparkle
} from "@phosphor-icons/react";

function Stone({ value, position, active, disabled, onChoose }) {
  const colour = active ? "#ffd571" : "#d6e6d7";
  return <group position={position} onClick={event => { event.stopPropagation(); if (!disabled) onChoose(value); }}>
    <Float floatIntensity={active ? 0.35 : 0.12} rotationIntensity={0.05} speed={active ? 2 : 1}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.95, 0.35, 32]} />
        <meshStandardMaterial color={colour} roughness={0.72} />
      </mesh>
      <Text anchorX="center" anchorY="middle" color="#193b37" fontSize={0.58} fontWeight={700} position={[0, 0.2, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>{String(value)}</Text>
    </Float>
  </group>;
}

function MountainScene({ round, disabled, onAnswer }) {
  const stonePositions = [[-1.9, 0.25, 0.3], [0, 0.38, -0.35], [1.9, 0.55, -0.95]];
  return <div className="maths-number-trail-3d" aria-hidden="true">
    <Canvas camera={{ fov: 48, position: [0, 5.2, 7.2] }} dpr={[1, 1.5]}>
      <color attach="background" args={["#bde3df"]} />
      <fog attach="fog" args={["#bde3df", 8, 16]} />
      <ambientLight intensity={1.5} />
      <directionalLight castShadow intensity={2.2} position={[3, 7, 4]} shadow-mapSize={[1024, 1024]} />
      <mesh position={[0, -0.06, -1.3]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#75aa77" roughness={1} />
      </mesh>
      <mesh position={[-3.8, 0.3, -3.7]}>
        <coneGeometry args={[2.8, 2.8, 5]} />
        <meshStandardMaterial color="#5b8a6c" roughness={1} />
      </mesh>
      <mesh position={[4.2, 0.2, -4.5]}>
        <coneGeometry args={[3.2, 3.4, 5]} />
        <meshStandardMaterial color="#477865" roughness={1} />
      </mesh>
      <mesh castShadow position={[-2.7, 0.45, 1.25]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial color="#f7a15b" roughness={0.6} />
      </mesh>
      <Text anchorX="center" color="#163b36" fontSize={0.36} fontWeight={700} position={[-2.7, 1.08, 1.25]}>START {round.model.start}</Text>
      {round.options.map((value, index) => <Stone active={index === 1} disabled={disabled} key={value} onChoose={chosen => onAnswer(chosen, { component: "number_trail_3d", optionSlot: index, pathOptions: round.options })} position={stonePositions[index]} value={value} />)}
    </Canvas>
  </div>;
}

export function NumberTrailGame({ round, disabled, onAnswer }) {
  return <div className="maths-arcade-mechanic maths-number-trail-v2">
    <MountainScene disabled={disabled} onAnswer={onAnswer} round={round} />
    <div className="maths-arcade-direct-controls" data-child-choices role="group" aria-label="Choose the next stepping stone">
      <span><HandPointing aria-hidden="true" size={20} weight="duotone" /> Choose the stone after {round.model.start}</span>
      <div>{round.options.map((value, index) => <button data-answer-slot={index} disabled={disabled} key={value} onClick={() => onAnswer(value, { component: "number_trail_controls", optionSlot: index, pathOptions: round.options })} type="button">{value}</button>)}</div>
    </div>
  </div>;
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
          ? <span aria-label="Fixed counter" className="is-fixed" key={index}><Check aria-hidden="true" size={18} weight="bold" /></span>
          : <button aria-label={`${added.includes(index) ? "Remove" : "Add"} counter in space ${index + 1}`} aria-pressed={added.includes(index)} disabled={disabled} key={index} onClick={() => toggle(index)} type="button">{added.includes(index) ? <Sparkle aria-hidden="true" size={20} weight="fill" /> : <Plus aria-hidden="true" size={19} weight="bold" />}</button>)}
      </div>
      <div className="maths-foundry-readout"><span>Already there <b>{round.model.shown}</b></span><span>You added <b>{added.length}</b></span><span>Whole now <b>{round.model.shown + added.length}</b></span></div>
    </div>
    <button className="maths-arcade-submit" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={disabled || added.length === 0} onClick={() => onAnswer(added.length, { component: "frame_foundry_builder", fixed: round.model.shown, addedIndexes: added, whole: round.model.shown + added.length })} type="button">Test this build <ArrowRight aria-hidden="true" size={20} weight="bold" /></button>
  </div>;
}

export function CountCarryGame({ round, disabled, onAnswer }) {
  const [carried, setCarried] = useState([]);
  const total = round.model.total;
  const move = index => setCarried(current => current.includes(index) ? current : [...current, index]);
  return <div className="maths-arcade-mechanic maths-carry-world">
    <div className="maths-carry-landscape">
      <section aria-label={`${total - carried.length} parcels still in the meadow`} className="maths-parcel-meadow">
        <span className="maths-world-label">Waiting in the meadow</span>
        <div>{Array.from({ length: total }, (_, index) => <button aria-label={`Carry parcel ${index + 1}`} className={carried.includes(index) ? "is-carried" : ""} disabled={disabled || carried.includes(index)} key={index} onClick={() => move(index)} type="button"><Package aria-hidden="true" size={total > 12 ? 27 : 33} weight="duotone" /></button>)}</div>
      </section>
      <ArrowRight aria-hidden="true" className="maths-carry-arrow" size={36} weight="bold" />
      <section aria-live="polite" className="maths-carry-cart"><Basket aria-hidden="true" size={52} weight="duotone" /><strong>{carried.length}</strong><span>in the cart</span><div>{carried.map(index => <i key={index} />)}</div></section>
    </div>
    <div className="maths-carry-meter"><span style={{ width: `${(carried.length / total) * 100}%` }} /><small>{carried.length} of {total} carried once</small></div>
    <button className="maths-arcade-submit" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={disabled || carried.length !== total} onClick={() => onAnswer(carried.length, { component: "one_to_one_carry", movedItemIndexes: carried })} type="button">Deliver {total} parcels <ArrowRight aria-hidden="true" size={20} weight="bold" /></button>
  </div>;
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
  const [paired, setPaired] = useState(0);
  if (!isCompare) return <div className="maths-arcade-mechanic maths-bridge-world">
    <div className="maths-bridge-sky"><Bridge aria-hidden="true" size={46} weight="duotone" /><span>Numeral beacon</span><strong>{round.model.target}</strong></div>
    <BridgePlanks activeClass="is-building" capacity={10} count={built} />
    <div className="maths-bridge-build-controls"><button disabled={disabled || built === 0} onClick={() => setBuilt(value => value - 1)} type="button">Remove one</button><strong aria-live="polite">{built} planks</strong><button disabled={disabled || built === 10} onClick={() => setBuilt(value => value + 1)} type="button">Add one</button></div>
    <button className="maths-arcade-submit" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={disabled || built === 0} onClick={() => onAnswer(built, { component: "bridge_numeral_builder", plankCount: built })} type="button">Test the bridge <ArrowRight aria-hidden="true" size={20} weight="bold" /></button>
  </div>;
  const possiblePairs = Math.min(round.model.left, round.model.right);
  const complete = paired === possiblePairs;
  const leftOver = round.model.left - paired;
  const rightOver = round.model.right - paired;
  return <div className="maths-arcade-mechanic maths-bridge-world is-compare">
    <div className="maths-pair-banks">
      <div><span>Left bank</span><BridgePlanks capacity={round.model.left} count={leftOver} /></div>
      <div className="maths-paired-channel"><strong>{paired}</strong><span>{paired === 1 ? "pair" : "pairs"} joined</span></div>
      <div><span>Right bank</span><BridgePlanks capacity={round.model.right} count={rightOver} /></div>
    </div>
    <button className="maths-pair-next" disabled={disabled || complete} onClick={() => setPaired(value => value + 1)} type="button">{complete ? "Every possible pair is joined" : "Join the next pair"}</button>
    <p aria-live="polite" className="maths-pair-result">{complete ? `${leftOver} left unpaired · ${rightOver} right unpaired` : "Pair one from each bank to compare fairly."}</p>
    <div className="maths-relationship-controls" data-child-choices role="group" aria-label="Choose what the pairing proves">
      {[{ value: "a", label: "Left has more" }, { value: "same", label: "Same amount" }, { value: "b", label: "Right has more" }].map((option, slot) => <button data-answer-slot={slot} disabled={disabled || !complete} key={option.value} onClick={() => onAnswer(option.value, { component: "one_to_one_bridge_compare", paired, leftOver, rightOver, derivedRelationship: relationshipFor(round.model.left, round.model.right) })} type="button">{option.label}</button>)}
    </div>
  </div>;
}

export function MathsArcadeGame({ gameId, round, disabled, onAnswer }) {
  if (gameId === "frame-foundry") return <FrameFoundryGame disabled={disabled} onAnswer={onAnswer} round={round} />;
  if (gameId === "count-and-carry") return <CountCarryGame disabled={disabled} onAnswer={onAnswer} round={round} />;
  if (gameId === "quantity-match") return <BridgeBuilderGame disabled={disabled} onAnswer={onAnswer} round={round} />;
  return <NumberTrailGame disabled={disabled} onAnswer={onAnswer} round={round} />;
}
