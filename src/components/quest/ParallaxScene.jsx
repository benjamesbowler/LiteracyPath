// THE 2.5D WORLD.
//
// Decided 2026-07-11: parallax, not 3D. Teach Your Monster isn't 3D either —
// what reads as depth in their world is perspective drawn into the art plus
// layers moving at different speeds. This does the same thing, and it does it
// with ZERO image files: every layer is procedural SVG, generated from the
// world's palette. That means a new land costs a palette, not an art order.
//
// Four depth bands, back to front:
//   sky    - static gradient, never moves
//   far    - distant hills, 0.15x
//   mid    - terrain and trees, 0.45x
//   near   - foreground fringe, 1.0x  (the creature stands between mid and near)
//
// Everything is transform: translate3d on a promoted layer, so the compositor
// does the work and an iPad doesn't drop frames.

import { useMemo } from "react";
import { worldPalette } from "../../data/questWorlds.js";

// Deterministic hills — the same world always has the same skyline, so a child
// recognises where they are.
function ridge(seed, height, bumps) {
  let a = seed >>> 0 || 1;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const step = 1000 / bumps;
  let d = `M0,300 L0,${height}`;
  for (let i = 0; i <= bumps; i += 1) {
    const x = i * step;
    const y = height - rand() * height * 0.45;
    d += ` Q${x - step / 2},${y} ${x},${height - rand() * height * 0.18}`;
  }
  return `${d} L1000,300 Z`;
}

export default function ParallaxScene({ world = "meadow", offset = 0, children, className = "" }) {
  const p = worldPalette(world);
  const far = useMemo(() => ridge(7, 150, 6), []);
  const mid = useMemo(() => ridge(23, 110, 9), []);
  const near = useMemo(() => ridge(91, 70, 12), []);

  // One number in, four speeds out. The whole 2.5D illusion is these multipliers.
  const shift = depth => ({ transform: `translate3d(${-offset * depth}%, 0, 0)` });

  return (
    <div
      className={`qp-scene ${className}`.trim()}
      data-world={world}
      style={{ "--q-accent": p.accent, "--q-deep": p.deep, "--q-road": p.road }}
    >
      <div className="qp-sky" style={{ background: `linear-gradient(180deg, ${p.skyTop}, ${p.skyBottom})` }} />

      <div className="qp-band qp-band-far" style={shift(0.15)}>
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
          <path d={far} fill={p.far} />
        </svg>
      </div>

      <div className="qp-band qp-band-mid" style={shift(0.45)}>
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
          <path d={mid} fill={p.mid} />
        </svg>
      </div>

      {/* The creature and the road live here — between mid and near, which is
          what makes the foreground read as "in front of" rather than "on top of". */}
      <div className="qp-stage">{children}</div>

      <div className="qp-band qp-band-near" style={shift(1)}>
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
          <path d={near} fill={p.near} />
        </svg>
      </div>
    </div>
  );
}
