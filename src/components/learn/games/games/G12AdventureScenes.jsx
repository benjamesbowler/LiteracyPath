import "./G12AdventureScenes.css";
import { clamp, RESCUE_ANCHORS, rescueFriendX, SORT_ANCHORS, sortTargetX } from "./G12AdventureGeometry.js";

export function G12RiverScene({ total, knownCompletedSteps = 0, currentSolvedSteps = 0, paused = false }) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const known = clamp(Number(knownCompletedSteps) || 0, 0, safeTotal);
  const solved = clamp(Number(currentSolvedSteps) || 0, 0, safeTotal - known);
  const completedSteps = known + solved;
  const progress = completedSteps / safeTotal;
  const friendX = rescueFriendX(progress);

  return (
    <div
      className={`g12-rescue-scene${paused ? " is-paused" : ""}`}
      data-progress={progress.toFixed(4)}
      data-known-completed={known}
      data-current-solved={solved}
      data-total={safeTotal}
      aria-label={`River rescue route: ${completedSteps} of ${safeTotal} bridge steps complete`}
    >
      <svg className="g12-rescue-map" viewBox="0 0 1000 360" role="img" aria-label="A river between two banks with a bridge leading to a home doorway">
        <rect className="g12-river-water" x="0" y="0" width="1000" height="360" rx="24" />
        <path className="g12-river-bank g12-river-bank-left" d="M0 0h160v360H0z" data-bank="left" />
        <path className="g12-river-bank g12-river-bank-right" d="M840 0h160v360H840z" data-bank="right" />
        <path className="g12-river-current" d="M225 74c110 34 160-33 275 0s160-33 275 0M220 286c110 34 160-33 275 0s160-33 275 0" />
        <path className="g12-bridge-shadow" d="M150 217h700" />
        <path className="g12-bridge-deck" d="M150 202h700v42H150z" data-anchor="bridge" />
        <path className="g12-bridge-rail" d="M150 202v-34m700 34v-34M150 168h700" />
        <g className="g12-home" data-anchor="home" data-world-x={RESCUE_ANCHORS.homeX} style={{ transform: `translate(${RESCUE_ANCHORS.homeX * 10}px, ${RESCUE_ANCHORS.homeY * 3.6}px)` }}>
          <path className="g12-home-roof" d="M-52 16 0-28l52 44Z" />
          <path className="g12-home-wall" d="M-42 16h84v78h-84z" />
          <path className="g12-home-door" d="M-17 94V48h34v46" />
          <circle className="g12-home-knob" cx="9" cy="72" r="3" />
          <text x="0" y="116" textAnchor="middle">HOME</text>
        </g>
      </svg>
      <div className="g12-rescue-planks" aria-hidden="true">
        {Array.from({ length: safeTotal }, (_, index) => {
          const step = (RESCUE_ANCHORS.bridgeEnd - RESCUE_ANCHORS.bridgeStart) / safeTotal;
          return <span key={index} className={`g12-rescue-plank${index < completedSteps ? " is-laid" : ""}`} style={{ left: `${RESCUE_ANCHORS.bridgeStart + (index * step)}%`, width: `${Math.max(4, step - 0.8)}%` }} data-world-x={RESCUE_ANCHORS.bridgeStart + (index * step)} />;
        })}
      </div>
      <div className="g12-rescue-friend" data-anchor="friend" data-world-x={friendX.toFixed(3)} data-progress={progress.toFixed(4)} style={{ left: `${friendX}%`, top: `${RESCUE_ANCHORS.friendY}%` }}>
        <img src="/images/pals/poses/meadow-wave.webp" alt="" draggable="false" />
      </div>
    </div>
  );
}

export function G12ConveyorScene({ item, binA, binB, motion = { phase: "idle", bin: "" }, paused = false, onSelect }) {
  const targetBin = motion.bin === binA ? "bin-a" : "bin-b";
  const itemTarget = sortTargetX(targetBin);
  const phase = motion.phase || "idle";
  const itemClass = `g12-sort-item g12-sort-item--${phase}`;

  return (
    <div className={`g12-sort-scene${paused ? " is-paused" : ""}`} data-motion={phase}>
      <div className="g12-sort-plant" aria-hidden="true" />
      <div className="g12-sort-conveyor" data-anchor="conveyor">
        <span className="g12-sort-source-anchor" data-anchor="item-start" data-world-x={SORT_ANCHORS.itemStart} aria-hidden="true" />
        <span className="g12-sort-track" aria-hidden="true" />
        <span
          key={`${item.word}-${motion.token || phase}`}
          className={itemClass}
          data-anchor="item"
          data-world-x={phase === "idle" || phase === "wrong-return" ? SORT_ANCHORS.itemStart : itemTarget}
          style={{ "--item-start": `${SORT_ANCHORS.itemStart}%`, "--item-target": `${itemTarget}%`, "--item-y": `${SORT_ANCHORS.itemY}%` }}
        >
          {item.word}
        </span>
      </div>
      <div className="g12-sort-bins" data-anchor="bin-endpoints">
        {[{ id: "bin-a", label: binA, x: SORT_ANCHORS.binA }, { id: "bin-b", label: binB, x: SORT_ANCHORS.binB }].map(bin => (
          <button key={bin.id} type="button" className={`g12-sort-bin${motion.bin === bin.label && phase === "correct" ? " is-target" : ""}${motion.bin === bin.label && phase.startsWith("wrong") ? " is-rejected" : ""}`} style={{ left: `${bin.x}%` }} data-bin={bin.label} data-anchor="bin-endpoint" data-world-x={bin.x} onClick={() => onSelect(bin.label)}>
            <span className="g12-sort-bin-label">{bin.label}</span>
            <span className="g12-sort-bin-mouth" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="g12-sort-route" aria-hidden="true"><span>START</span><i /><span>BIN</span></div>
      {phase === "correct" && <span className="adv-sort-route" role="status">Routed to /{motion.bin}/ bin</span>}
    </div>
  );
}
