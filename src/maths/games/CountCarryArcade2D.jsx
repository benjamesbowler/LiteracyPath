import { ArrowLeft, ArrowRight, Basket, Package, SteeringWheel } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import "../../styles/maths-arcade-2d-engines.css";
import { canUseArcadeTarget, countCarryEvidence, createCountCarryWorld, deliveredInGroup, nextWaitingParcel } from "./maths2dArcadeEngine.js";
import { useArcadeXAxis } from "./useArcadeXAxis.js";

function planChoices(total) {
  if (total > 10) return [
    { id: "ten_and_more", label: "Make ten, then extras", note: "Fill one group of ten before the extra parcels." },
    { id: "make_row", label: "Use clear rows", note: "Keep each authored row together as you deliver." }
  ];
  return [
    { id: "make_row", label: total > 5 ? "Make five, then more" : "Build one clear row", note: "A structured row helps each parcel stay counted once." },
    { id: "move_once", label: "Sweep left to right", note: "Move across the meadow in one direction." }
  ];
}

function CountCarryArcade2DSession({ disabled = false, onAnswer, paused = false, round }) {
  const [selectedPlan, setSelectedPlan] = useState("");
  const world = useMemo(() => createCountCarryWorld(round, selectedPlan || "move_once"), [round, selectedPlan]);
  const [cartX, setCartX] = useState(world.playerX);
  const [carryingIndex, setCarryingIndex] = useState(null);
  const [deliveredIndexes, setDeliveredIndexes] = useState([]);
  const [autoTarget, setAutoTarget] = useState(null);
  const [announcement, setAnnouncement] = useState("Choose a counting plan before the delivery starts.");
  const locked = disabled || paused;
  const finished = deliveredIndexes.length === world.parcels.length;

  const nearest = useMemo(() => nextWaitingParcel(world, deliveredIndexes, carryingIndex, cartX), [carryingIndex, cartX, deliveredIndexes, world]);
  const arrived = useCallback(() => {
    setAutoTarget(null);
    setAnnouncement("The cart is beside a parcel. Load it once.");
  }, []);
  const movement = useArcadeXAxis({
    disabled: locked || !selectedPlan || finished || carryingIndex !== null,
    maximum: world.worldMaximum,
    minimum: 2,
    onArrive: arrived,
    paused,
    position: cartX,
    setPosition: setCartX,
    speed: 46,
    target: autoTarget
  });

  const performAction = useCallback(() => {
    if (locked || !selectedPlan || finished) return;
    if (carryingIndex !== null) {
      setDeliveredIndexes(current => [...current, carryingIndex]);
      setCarryingIndex(null);
      setAnnouncement(deliveredIndexes.length + 1 === world.parcels.length
        ? "Every parcel has moved once. Choose the label for the whole collection."
        : "Parcel delivered once. Find a parcel still waiting in the meadow.");
      return;
    }
    const nearby = world.parcels
      .filter(parcel => !deliveredIndexes.includes(parcel.index) && canUseArcadeTarget(cartX, parcel.x, world.interactionRadius))
      .sort((left, right) => Math.abs(left.x - cartX) - Math.abs(right.x - cartX))[0];
    if (!nearby) {
      if (nearest) {
        setAutoTarget(nearest.x);
        setAnnouncement("Driving to a parcel that has not moved yet.");
      }
      return;
    }
    setCarryingIndex(nearby.index);
    setAnnouncement("One parcel loaded. Deliver this parcel before collecting another.");
  }, [carryingIndex, cartX, deliveredIndexes, finished, locked, nearest, selectedPlan, world]);

  useEffect(() => {
    const activate = event => {
      if ((event.key === " " || event.key === "Enter") && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        performAction();
      }
    };
    window.addEventListener("keydown", activate);
    return () => window.removeEventListener("keydown", activate);
  }, [performAction]);

  const choosePlan = plan => {
    setSelectedPlan(plan);
    setCartX(4);
    setAnnouncement("Drive to a waiting parcel. Load one, then carry it to the rack.");
  };
  const actionLabel = carryingIndex !== null
    ? "Place parcel in the next structured group"
    : nearest && canUseArcadeTarget(cartX, nearest.x, world.interactionRadius)
      ? "Load parcel"
      : "Find parcel";
  const visibleParcels = world.parcels.map(parcel => ({
    ...parcel,
    screenX: 34 + ((parcel.x - cartX) * 2)
  })).filter(parcel => parcel.screenX > -12 && parcel.screenX < 72);

  return <section
    aria-label="Count and Carry arcade"
    className={`m2d-game m2d-carry-game${paused ? " is-paused" : ""}`}
    data-engine="count-and-carry-2d"
    data-world-signature={world.worldSignature}
  >
    <div className="m2d-status"><Package aria-hidden="true" size={20} weight="fill" /><span aria-live="polite">{paused ? "Game paused" : announcement}</span></div>
    {!selectedPlan && <div className="m2d-plan-picker" role="group" aria-label="Choose a counting plan">
      <strong>How will you keep track?</strong>
      <div>{planChoices(world.parcels.length).map(plan => <button disabled={locked} key={plan.id} onClick={() => choosePlan(plan.id)} type="button"><b>{plan.label}</b><span>{plan.note}</span></button>)}</div>
    </div>}
    {selectedPlan && <div className="m2d-stage m2d-carry-stage" data-counting-plan={selectedPlan} data-layout-mode={world.layout.layoutMode} data-layout-rows={world.layout.layoutRows.join(",")}>
      <div className="m2d-carry-plan"><span>Counting plan</span><strong>{selectedPlan === "ten_and_more" ? "Ten, then extras" : selectedPlan === "make_row" ? "Clear rows" : "Left to right"}</strong></div>
      <div aria-label="Parcels still waiting in the meadow" className="m2d-parcel-field" role="group">
        {visibleParcels.map(parcel => {
          const delivered = deliveredIndexes.includes(parcel.index);
          const carried = carryingIndex === parcel.index;
          return <button
            aria-label={delivered ? "Parcel already delivered" : carried ? "Parcel in the cart" : "Route the cart to this waiting parcel"}
            className={`${delivered ? "is-delivered" : ""}${carried ? " is-carried" : ""}`}
            disabled={locked || delivered || carried || finished}
            key={parcel.id}
            onClick={() => {
              setAutoTarget(parcel.x);
              setAnnouncement("Driving to the chosen waiting parcel.");
            }}
            style={{ "--parcel-x": `${parcel.screenX}%`, "--parcel-y": `${parcel.y}%` }}
            type="button"
          ><Package aria-hidden="true" size={26} weight="duotone" /></button>;
        })}
      </div>
      <div aria-label="Structured delivery rack" className="m2d-delivery-rack" role="region" tabIndex={0}>
        <div className="m2d-rack-title"><Basket aria-hidden="true" size={23} weight="duotone" /><span>Delivery rack</span></div>
        {world.groups.map((group, groupIndex) => {
          const filled = deliveredInGroup(deliveredIndexes.length, group, groupIndex, world.groups);
          return <div aria-label={`${group.label} group of ${group.size}`} className="m2d-delivery-group" data-parcel-count={group.size} data-parcel-row={groupIndex + 1} key={group.id} role="group">
            <small>{group.label}</small>
            <div>{Array.from({ length: filled }, (_, index) => <span aria-label="One delivered parcel" key={`${group.id}-${index}`} role="img"><Package aria-hidden="true" size={18} weight="fill" /></span>)}</div>
            {filled === group.size && <b>{group.label} complete</b>}
          </div>;
        })}
        <button aria-label="Place the carried parcel in the next structured group" disabled={locked || carryingIndex === null || finished} onClick={performAction} type="button">Place parcel</button>
      </div>
      <div aria-hidden="true" className={`m2d-delivery-cart${carryingIndex !== null ? " is-loaded" : ""}`} style={{ "--cart-x": "34%" }}><span>{carryingIndex !== null && <Package size={22} weight="fill" />}</span><i /><i /></div>
      <div aria-label="Delivery movement controls" className="m2d-controls" role="group">
        <button aria-label="Drive left" disabled={locked || finished || carryingIndex !== null} type="button" {...movement.left}><ArrowLeft aria-hidden="true" size={26} weight="bold" /></button>
        <button aria-label="Drive right" disabled={locked || finished || carryingIndex !== null} type="button" {...movement.right}><ArrowRight aria-hidden="true" size={26} weight="bold" /></button>
        <button aria-label={actionLabel} className="is-action" disabled={locked || finished} onClick={performAction} type="button"><SteeringWheel aria-hidden="true" size={25} weight="fill" /><small>{carryingIndex === null ? "Load" : "Drop"}</small></button>
      </div>
      {finished && <div className="m2d-answer-dock is-carry" data-child-choices data-evidence-layout-mode={world.layout.layoutMode} data-evidence-layout-rows={world.layout.layoutRows.join(",")} data-evidence-selected-plan={selectedPlan} role="group" aria-label="Choose how many parcels are in the whole collection">
        {round.options.map((value, optionSlot) => <button
          data-answer-slot={optionSlot}
          disabled={locked}
          key={value}
          onClick={() => onAnswer(value, countCarryEvidence(world, { deliveredIndexes, optionSlot, options: round.options, selectedPlan }))}
          type="button"
        >{value}</button>)}
      </div>}
    </div>}
    {selectedPlan && !finished && <div className="m2d-access-row is-carry">
      <button disabled={locked} onClick={() => {
        if (carryingIndex !== null) {
          performAction();
          return;
        }
        if (Number.isFinite(nearest?.x)) setAutoTarget(nearest.x);
        setAnnouncement("Assisted travel is taking the cart to the next waiting parcel.");
      }} type="button">{carryingIndex !== null ? "Place this parcel in the group" : "Assist the travel, keep the counting"}</button>
      <span>{deliveredIndexes.length ? "Counted parcels are kept apart on the rack." : "No parcel has moved yet."}</span>
    </div>}
  </section>;
}

export function CountCarryArcade2D(props) {
  return <CountCarryArcade2DSession key={props.round.id} {...props} />;
}

export default CountCarryArcade2D;
