import { ArrowLeft, ArrowRight, Eye, Footprints, Sparkle } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import "../../styles/maths-arcade-2d-engines.css";
import { canUseArcadeTarget, createGlimpseGardenWorld, glimpseGardenEvidence } from "./maths2dArcadeEngine.js";
import { useArcadeXAxis } from "./useArcadeXAxis.js";

const GLIMPSE_MILLISECONDS = 1350;

function GlowbugPattern({ countable = false, layout, visible }) {
  return <div
    aria-hidden={!visible}
    aria-label={countable ? `${layout.accessibleDescription}. Count each glowbug once.` : visible ? layout.accessibleDescription : undefined}
    className={`m2d-glimpse-pattern${visible ? " is-visible" : ""}${countable ? " is-countable" : ""}`}
    data-count={layout.total}
    data-layout-signature={layout.signature}
    data-parts={layout.parts.join("+")}
    data-pattern={layout.pattern}
    data-rendered-pattern={layout.pattern}
    role={visible ? countable ? "group" : "img" : undefined}
  >
    {layout.slots.map(slot => <span
      aria-label={countable && slot.occupied ? "Glowbug" : undefined}
      className={`m2d-glowbug is-group-${slot.group}${slot.occupied ? "" : " is-empty"}`}
      data-glowbug-group={slot.group}
      data-glowbug-slot={slot.cell}
      data-occupied={slot.occupied ? "true" : "false"}
      key={slot.cell}
      role={countable && slot.occupied ? "img" : undefined}
      style={{ "--bug-x": `${slot.x}%`, "--bug-y": `${slot.y}%` }}
    >{slot.occupied && <><i aria-hidden="true" /><b aria-hidden="true" /></>}</span>)}
  </div>;
}

function GlimpseGardenArcade2DSession({ disabled = false, onAnswer, paused = false, round }) {
  const world = useMemo(() => createGlimpseGardenWorld(round), [round]);
  const [playerX, setPlayerX] = useState(world.playerX);
  const [phase, setPhase] = useState("explore");
  const [autoTarget, setAutoTarget] = useState(null);
  const [revealCount, setRevealCount] = useState(0);
  const [announcement, setAnnouncement] = useState("Move the lantern keeper to the wooden gate.");
  const locked = disabled || paused;
  const atGate = canUseArcadeTarget(playerX, world.gateX, world.interactionRadius);

  const arrived = useCallback(() => {
    setAutoTarget(null);
    setAnnouncement("You reached the gate. Open it when you are ready to look.");
  }, []);
  const movement = useArcadeXAxis({ disabled: locked || phase === "glimpse", onArrive: arrived, paused, position: playerX, setPosition: setPlayerX, target: autoTarget });

  const reveal = useCallback(() => {
    if (locked || phase === "glimpse") return;
    if (!atGate) {
      setAutoTarget(world.gateX);
      setAnnouncement("Walking to the gate. You can steer with left and right.");
      return;
    }
    setRevealCount(value => value + 1);
    setPhase("glimpse");
    setAnnouncement("The gate is open briefly. Look for smaller parts in the whole pattern.");
  }, [atGate, locked, phase, world.gateX]);

  useEffect(() => {
    if (phase !== "glimpse" || paused) return undefined;
    const timer = window.setTimeout(() => {
      setPhase("choose");
      setAnnouncement("The gate is closed. Choose how many glowbugs you saw, or keep it open to count.");
    }, GLIMPSE_MILLISECONDS);
    return () => window.clearTimeout(timer);
  }, [paused, phase]);

  useEffect(() => {
    const activate = event => {
      if ((event.key === " " || event.key === "Enter") && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        reveal();
      }
    };
    window.addEventListener("keydown", activate);
    return () => window.removeEventListener("keydown", activate);
  }, [reveal]);

  const visible = phase === "glimpse" || phase === "count";
  const countable = phase === "count";
  const canChoose = phase === "choose" || phase === "count";

  return <section
    aria-label="Glimpse Garden arcade"
    className={`m2d-game m2d-glimpse-game${paused ? " is-paused" : ""}`}
    data-engine="glimpse-garden-2d"
    data-world-signature={world.worldSignature}
  >
    <div className="m2d-status"><Sparkle aria-hidden="true" size={20} weight="fill" /><span aria-live="polite">{paused ? "Game paused" : announcement}</span></div>
    <div className="m2d-stage m2d-garden-stage" style={{ "--gate-x": `${world.gateX}%` }}>
      <div aria-hidden="true" className="m2d-garden-moon" />
      <div aria-hidden="true" className="m2d-garden-hill is-back" />
      <div aria-hidden="true" className="m2d-garden-hill is-front" />
      {world.landmarks.map(landmark => <i aria-hidden="true" className={`m2d-landmark is-${landmark.kind}`} key={landmark.id} style={{ "--landmark-scale": landmark.scale, "--landmark-x": `${landmark.x}%` }} />)}
      <button
        aria-label={atGate ? "Open the wooden garden gate" : "Walk to the wooden garden gate"}
        className={`m2d-garden-gate${visible ? " is-open" : ""}${atGate ? " is-near" : ""}`}
        disabled={locked || phase === "glimpse"}
        onClick={reveal}
        type="button"
      ><span aria-hidden="true" /><b aria-hidden="true">?</b></button>
      <GlowbugPattern countable={countable} layout={world.layout} visible={visible} />
      <div aria-hidden="true" className="m2d-lantern-keeper" style={{ "--player-x": `${playerX}%` }}><span /><i /></div>

      {canChoose && <div className="m2d-answer-dock" data-child-choices data-evidence-layout-signature={world.layout.signature} data-evidence-pattern={world.layout.pattern} role="group" aria-label="Choose the number of glowbugs">
        {round.options.map((value, optionSlot) => <button
          data-answer-slot={optionSlot}
          disabled={locked}
          key={value}
          onClick={() => onAnswer(value, glimpseGardenEvidence(world, { accessMode: countable ? "untimed_counting" : "visual_glimpse", optionSlot, revealCount }))}
          type="button"
        >{value}</button>)}
      </div>}

      {!canChoose && <div aria-label="Garden movement controls" className="m2d-controls" role="group">
        <button aria-label="Move left" disabled={locked || phase === "glimpse"} type="button" {...movement.left}><ArrowLeft aria-hidden="true" size={26} weight="bold" /></button>
        <button aria-label="Move right" disabled={locked || phase === "glimpse"} type="button" {...movement.right}><ArrowRight aria-hidden="true" size={26} weight="bold" /></button>
        <button aria-label={atGate ? "Open gate" : "Walk to gate"} className="is-action" disabled={locked || phase === "glimpse"} onClick={reveal} type="button">{atGate ? <Eye aria-hidden="true" size={25} weight="fill" /> : <Footprints aria-hidden="true" size={25} weight="fill" />}<small>{atGate ? "Look" : "Gate"}</small></button>
      </div>}
    </div>
    {canChoose && <div className="m2d-access-row">
      <button disabled={locked} onClick={reveal} type="button">Show the pattern again</button>
      <button disabled={locked} onClick={() => {
        setPhase("count");
        setAnnouncement("The gate will stay open. Count each glowbug once, then choose the total.");
      }} type="button">Keep it open so I can count</button>
    </div>}
  </section>;
}

export function GlimpseGardenArcade2D(props) {
  return <GlimpseGardenArcade2DSession key={props.round.id} {...props} />;
}

export default GlimpseGardenArcade2D;
