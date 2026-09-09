import "./adventureScenes.css";
import { clamp, RIVER_ROUTE_ANCHORS, riverFriendPosition, WORD_CONVEYOR_ANCHORS, conveyorBinPosition } from "./adventureSceneGeometry.js";

export function RiverRescueScene({ total, knownCompletedSteps = 0, currentSolvedSteps = 0, paused = false }) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const known = clamp(Number(knownCompletedSteps) || 0, 0, safeTotal);
  const solved = clamp(Number(currentSolvedSteps) || 0, 0, safeTotal - known);
  const completedSteps = known + solved;
  const progress = completedSteps / safeTotal;
  const friendX = riverFriendPosition(progress);

  return (
    <div
      className={`river-rescue-scene adv-bridge${paused ? " is-paused" : ""}`}
      data-progress={progress.toFixed(4)}
      data-known-completed={known}
      data-current-solved={solved}
      data-total={safeTotal}
      aria-label={`River rescue route: ${completedSteps} of ${safeTotal} bridge steps complete`}
    >
      <svg className="river-rescue-map" viewBox="0 0 1000 360" role="img" aria-label="A river between two banks with a bridge leading to a home doorway">
        <rect className="river-water" x="0" y="0" width="1000" height="360" rx="24" />
        <path className="river-bank river-bank-left" d="M0 0h160v360H0z" data-bank="left" />
        <path className="river-bank river-bank-right" d="M840 0h160v360H840z" data-bank="right" />
        <path className="river-current" d="M225 74c110 34 160-33 275 0s160-33 275 0M220 286c110 34 160-33 275 0s160-33 275 0" />
        <path className="bridge-shadow" d="M150 217h700" />
        <path className="bridge-deck" d="M150 202h700v42H150z" data-anchor="bridge" />
        <path className="bridge-rail" d="M150 202v-34m700 34v-34M150 168h700" />
        <g className="river-home" data-anchor="home" data-world-x={RIVER_ROUTE_ANCHORS.homeX}>
          <path className="home-roof" d="M842 82 900 35l58 47Z" />
          <path className="home-wall" d="M850 82h100v162H850z" />
          <rect className="home-door" data-anchor="door" x={RIVER_ROUTE_ANCHORS.door.x} y={RIVER_ROUTE_ANCHORS.door.y} width={RIVER_ROUTE_ANCHORS.door.width} height={RIVER_ROUTE_ANCHORS.door.height} />
          <circle className="home-knob" cx="922" cy="196" r="4" />
          <text x="900" y="280" textAnchor="middle">HOME</text>
        </g>
        <g className="rescue-planks" aria-hidden="true">
          {Array.from({ length: safeTotal }, (_, index) => {
            const step = (RIVER_ROUTE_ANCHORS.bridgeEndX - RIVER_ROUTE_ANCHORS.bridgeStartX) / safeTotal;
            return <rect key={index} className={`rescue-plank${index < completedSteps ? " is-laid" : ""}`} x={(RIVER_ROUTE_ANCHORS.bridgeStartX + (index * step)) * 10} y="202" width={Math.max(40, (step - 0.8) * 10)} height="42" rx="5" data-world-x={RIVER_ROUTE_ANCHORS.bridgeStartX + (index * step)} />;
          })}
        </g>
        <image className="rescue-friend" data-anchor="friend" data-world-x={friendX.toFixed(3)} data-progress={progress.toFixed(4)} href="/images/pals/poses/meadow-wave.webp" x={(friendX * 10) - (RIVER_ROUTE_ANCHORS.friendWidth / 2)} y={RIVER_ROUTE_ANCHORS.friendFeetY - RIVER_ROUTE_ANCHORS.friendHeight} width={RIVER_ROUTE_ANCHORS.friendWidth} height={RIVER_ROUTE_ANCHORS.friendHeight} preserveAspectRatio="xMidYMax meet" aria-hidden="true" />
      </svg>
    </div>
  );
}

export function WordConveyorScene({ item, binA, binB, motion = { phase: "idle", bin: "" }, paused = false, onSelect }) {
  const targetBin = motion.bin === binA ? "bin-a" : "bin-b";
  const itemTarget = conveyorBinPosition(targetBin);
  const phase = motion.phase || "idle";
  const itemClass = `conveyor-item adv-belt-item conveyor-item--${phase}`;

  return (
    <div className={`word-conveyor-scene${paused ? " is-paused" : ""}`} data-motion={phase}>
      <div className="conveyor-plant" aria-hidden="true" />
      <div className="word-conveyor-belt" data-anchor="conveyor">
        <span className="conveyor-source-anchor" data-anchor="item-start" data-world-x={WORD_CONVEYOR_ANCHORS.itemStart} aria-hidden="true" />
        <span className="conveyor-track" aria-hidden="true" />
        <span
          key={`${item.word}-${motion.token || phase}`}
          className={itemClass}
          data-anchor="item"
          data-world-x={phase === "idle" || phase === "wrong-return" ? WORD_CONVEYOR_ANCHORS.itemStart : itemTarget}
          style={{ "--item-start-x": `${WORD_CONVEYOR_ANCHORS.itemStart}%`, "--item-target-x": `${itemTarget}%`, "--item-start-y": `${WORD_CONVEYOR_ANCHORS.itemY}%`, "--item-target-y": `${WORD_CONVEYOR_ANCHORS.binY}%` }}
        >
          {item.word}
        </span>
      </div>
      <div className="word-conveyor-bins" data-anchor="bin-endpoints">
        {[{ id: "bin-a", label: binA, x: WORD_CONVEYOR_ANCHORS.binA }, { id: "bin-b", label: binB, x: WORD_CONVEYOR_ANCHORS.binB }].map(bin => (
          <button key={bin.id} type="button" className={`word-conveyor-bin adv-bin${motion.bin === bin.label && phase === "correct" ? " is-target" : ""}${motion.bin === bin.label && phase.startsWith("wrong") ? " is-rejected" : ""}`} style={{ left: `${bin.x}%` }} data-bin={bin.label} data-anchor="bin-endpoint" data-world-x={bin.x} onClick={() => onSelect(bin.label)}>
            <span className="conveyor-bin-label adv-bin-label">{bin.label}</span>
            <span className="conveyor-bin-mouth adv-bin-mouth" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="conveyor-route" aria-hidden="true"><span>START</span><i /><span>BIN</span></div>
      {phase === "correct" && <span className="conveyor-status" role="status">Routed to /{motion.bin}/ bin</span>}
    </div>
  );
}
