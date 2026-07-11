// THE SCENE — a real place, not three hills.
//
// Placeholder art, but placeholder art that is trying. Everything is procedural
// SVG, seeded off the stop so a land always looks the same, and layered for
// depth: sky, sun, far ridge, mid forest, ground, path, grass, near foliage.
//
// This is deliberately NOT the final art. The illustrated pass comes after the
// loop is proven fun — that was the call, and it is the right one: no amount of
// painting saves a boring loop.

import { useMemo } from "react";
import { worldPalette, HIGHLIGHT } from "../../../data/questWorlds.js";

function rand(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A silhouette ridge across the whole world strip.
function ridge(r, width, height, bumps, baseline) {
  let d = `M0,${baseline}`;
  const step = width / bumps;
  for (let i = 0; i <= bumps; i += 1) {
    const x = i * step;
    const peak = baseline - height * (0.45 + r() * 0.55);
    d += ` Q${x - step / 2},${peak} ${x},${baseline - height * (0.1 + r() * 0.25)}`;
  }
  return `${d} L${width},${baseline + 400} L0,${baseline + 400} Z`;
}

// One tree. Two blobs and a trunk, but a tree.
function Tree({ x, y, s, dark, mid }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-6" y="-30" width="12" height="34" rx="4" fill={dark} />
      <ellipse cx="0" cy="-52" rx="34" ry="30" fill={mid} />
      <ellipse cx="-14" cy="-38" rx="22" ry="19" fill={dark} opacity="0.35" />
      <ellipse cx="12" cy="-64" rx="20" ry="17" fill={HIGHLIGHT} opacity="0.12" />
    </g>
  );
}

function Tuft({ x, y, s, fill }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0,0 C-2,-10 -8,-14 -12,-16 C-6,-16 -2,-12 0,-8 C2,-13 7,-17 13,-18 C8,-14 3,-9 0,0 Z"
      fill={fill}
    />
  );
}

export default function WorldScene({ world, length, height = 620, seed = 1, camera = 0 }) {
  const p = worldPalette(world);
  const GROUND = height * 0.72;

  const far = useMemo(() => ridge(rand(seed * 3 + 1), length, 190, Math.round(length / 520), GROUND - 40), [seed, length, GROUND]);
  const mid = useMemo(() => ridge(rand(seed * 7 + 3), length, 120, Math.round(length / 380), GROUND - 6), [seed, length, GROUND]);

  const trees = useMemo(() => {
    const r = rand(seed * 11 + 5);
    const out = [];
    for (let x = 60; x < length; x += 120 + r() * 130) {
      out.push({ x, y: GROUND - 4 - r() * 26, s: 0.7 + r() * 0.8 });
    }
    return out;
  }, [seed, length, GROUND]);

  const tufts = useMemo(() => {
    const r = rand(seed * 13 + 7);
    const out = [];
    for (let x = 20; x < length; x += 26 + r() * 46) {
      out.push({ x, y: GROUND + 34 + r() * 46, s: 0.8 + r() * 1.3 });
    }
    return out;
  }, [seed, length, GROUND]);

  return (
    <div className="qw-scene" style={{ "--q-accent": p.accent, "--q-deep": p.deep, "--q-road": p.road }}>
      {/* Sky never moves. */}
      <div className="qw-sky" style={{ background: `linear-gradient(180deg, ${p.skyTop} 0%, ${p.skyBottom} 62%)` }}>
        <span className="qw-sun" style={{ background: p.accent }} />
      </div>

      {/* Far ridge: 25% of the camera. */}
      <svg
        className="qw-layer qw-far"
        viewBox={`0 0 ${length} ${height}`}
        width={length}
        height={height}
        style={{ transform: `translate3d(${-camera * 0.25}px,0,0)` }}
        aria-hidden="true"
      >
        <path d={far} fill={p.far} />
      </svg>

      {/* Mid ridge + forest: 55%. */}
      <svg
        className="qw-layer qw-mid"
        viewBox={`0 0 ${length} ${height}`}
        width={length}
        height={height}
        style={{ transform: `translate3d(${-camera * 0.55}px,0,0)` }}
        aria-hidden="true"
      >
        <path d={mid} fill={p.mid} opacity="0.9" />
        {trees.map((t, i) => (
          <Tree key={i} x={t.x} y={t.y} s={t.s * 0.75} dark={p.near} mid={p.mid} />
        ))}
      </svg>

      {/* Ground + path: the layer the creature stands on. Moves 1:1. */}
      <svg
        className="qw-layer qw-ground"
        viewBox={`0 0 ${length} ${height}`}
        width={length}
        height={height}
        style={{ transform: `translate3d(${-camera}px,0,0)` }}
        aria-hidden="true"
      >
        <rect x="0" y={GROUND} width={length} height={height - GROUND} fill={p.near} />
        <rect x="0" y={GROUND} width={length} height="14" fill={p.mid} />
        {/* The path itself — a worn track the creature walks along. */}
        <rect x="0" y={GROUND + 52} width={length} height="58" fill={p.road} opacity="0.55" rx="10" />
        <rect x="0" y={GROUND + 52} width={length} height="6" fill={HIGHLIGHT} opacity="0.18" />
        {tufts.map((t, i) => (
          <Tuft key={i} x={t.x} y={t.y} s={t.s} fill={i % 3 === 0 ? p.mid : p.deep} />
        ))}
      </svg>
    </div>
  );
}
