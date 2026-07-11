// THE TRAIL — a 2.5D map.
//
// Not a menu of levels. A ROAD, that recedes: stops further along sit higher and
// smaller, the creature scales as it walks, and the parallax bands shift with
// the camera. This is the whole 2.5D decision made concrete, and it costs zero
// image files — the road and the hills are procedural SVG.

import { useEffect, useMemo, useRef, useState } from "react";
import CreatureFigure from "./CreatureFigure.jsx";
import ParallaxScene from "./ParallaxScene.jsx";
import { stopsForAct, QUEST_ACTS } from "../../data/questSequence.js";
import { currentStopIndex } from "../../utils/questProgress.js";
import { playWhoosh } from "../../utils/audio/gameSfx.js";

// The road runs left to right and RISES — the horizon is up and away. A stop at
// t=0 is at the child's feet; a stop at t=1 is small and far.
function pointAt(t) {
  const x = 6 + t * 88;                       // %
  const y = 78 - Math.sin(t * Math.PI * 0.55) * 34; // % — rises toward the horizon
  const depth = 1 - t * 0.55;                 // 1.0 near -> 0.45 far
  return { x, y, depth };
}

export default function TrailMap({ state, act = 1, onAct, onEnterStop, onBack, isSoundEnabled = true }) {
  const stops = useMemo(() => stopsForAct(act), [act]);
  const actMeta = QUEST_ACTS[act - 1];
  const nextIndex = currentStopIndex(state);
  const done = new Set(state.trail.stopsDone);

  // An act is reachable once the child has walked to ANY of its stops. You can
  // always go BACK to a land you've been to — the map is a place, not a menu,
  // and a child who wants to re-walk the Meadow should be able to.
  const reachable = a => stopsForAct(a)[0].index <= nextIndex;

  const [walking, setWalking] = useState(false);
  const walkTimer = useRef(null);

  const positions = stops.map((stop, i) => ({ stop, ...pointAt(stops.length === 1 ? 0 : i / (stops.length - 1)) }));
  const here = positions.find(p => p.stop.index === nextIndex) || positions[positions.length - 1];

  const road = useMemo(() => {
    const pts = positions.map(p => `${p.x},${p.y}`);
    return `M${pts.join(" L")}`;
  }, [positions]);

  useEffect(() => () => clearTimeout(walkTimer.current), []);

  function enter(stop) {
    if (stop.index > nextIndex) return;      // fogged: not walked to yet
    setWalking(true);
    if (isSoundEnabled) playWhoosh();
    walkTimer.current = setTimeout(() => {
      setWalking(false);
      onEnterStop?.(stop.id);
    }, 620);
  }

  // The camera trails the child: further along the road = scene shifted left.
  const camera = ((here.stop.index - stops[0].index) / Math.max(1, stops.length - 1)) * 18;

  return (
    <div className="q-screen q-map">
      <ParallaxScene world={actMeta.world} offset={camera} className="q-map-scene">
        <svg className="q-road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={road} fill="none" stroke="var(--q-deep)" strokeWidth="3.4" strokeLinecap="round" opacity="0.32" />
          <path d={road} fill="none" stroke="var(--q-road)" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 3" opacity="0.75" />
        </svg>

        {positions.map(({ stop, x, y, depth }) => {
          const isDone = done.has(stop.id);
          const isNext = stop.index === nextIndex;
          const locked = stop.index > nextIndex;
          const stars = state.trail.stars?.[stop.id] || 0;
          return (
            <button
              key={stop.id}
              type="button"
              className={`q-marker${isDone ? " is-done" : ""}${isNext ? " is-next" : ""}${locked ? " is-locked" : ""}${stop.boss ? " is-boss" : ""}`}
              style={{ left: `${x}%`, top: `${y}%`, "--depth": depth }}
              disabled={locked}
              onClick={() => enter(stop)}
              aria-label={locked ? `${stop.name} — not reached yet` : `${stop.name}`}
            >
              <span className="q-marker-dot" />
              <span className="q-marker-name">{locked ? "???" : stop.name}</span>
              {isDone && (
                <span className="q-marker-stars" aria-hidden="true">
                  {"★".repeat(stars)}{"☆".repeat(Math.max(0, 3 - stars))}
                </span>
              )}
            </button>
          );
        })}

        <div
          className="q-walker"
          style={{ left: `${here.x}%`, top: `${here.y}%`, "--depth": here.depth }}
        >
          <CreatureFigure creature={state.creature} size={104} mood={walking ? "walk" : "idle"} />
        </div>
      </ParallaxScene>

      <div className="q-map-bar">
        <button type="button" className="q-ghost" onClick={onBack}>Back to the Den</button>

        <span className="q-acts" role="tablist" aria-label="Lands">
          {QUEST_ACTS.map(a => {
            const open = reachable(a.n);
            return (
              <button
                key={a.n}
                type="button"
                role="tab"
                aria-selected={a.n === act}
                className={`q-actchip${a.n === act ? " is-on" : ""}${open ? "" : " is-locked"}`}
                disabled={!open}
                onClick={() => onAct?.(a.n)}
                title={open ? a.title : "Not reached yet"}
              >
                {open ? a.title : "???"}
              </button>
            );
          })}
        </span>

        <span className="q-progress">
          {stops.filter(s => done.has(s.id)).length} / {stops.length}
        </span>
      </div>
    </div>
  );
}
