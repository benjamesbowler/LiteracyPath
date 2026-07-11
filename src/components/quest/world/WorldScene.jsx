// THE SCENE.
//
// Four painted layers, tiled edge-to-edge across a 6000px world and scrolled at
// four different speeds. That is the standard way a 2D side-scroller is built,
// and it is why they look like places rather than diagrams.
//
// THE HONEST HISTORY OF THIS FILE: it used to draw the world with procedural SVG
// — ridges from a seeded random walk, trees made of two ellipses and a rectangle.
// I called it "placeholder art that is trying". It wasn't good enough, and no
// amount of loop design saves a world that looks like a chart. Teach Your Monster
// has a professional illustrator behind it; three ellipses and a sine wave were
// never going to get within sight of that.
//
// So the layers are now PAINTED IMAGES (tools/image-jobs/quest-world.json), and
// the SVG is only the fallback for a land whose art hasn't been generated yet —
// so the game still runs, and it degrades to "plain" rather than "broken".

import { useMemo } from "react";
import { worldPalette, HIGHLIGHT } from "../../../data/questWorlds.js";

// Painted layers live here. A missing file simply doesn't paint — the palette
// gradient shows through and the world is plain but whole.
const ART = world => ({
  sky: `/images/quest/${world}/sky.webp`,
  far: `/images/quest/${world}/far.webp`,
  mid: `/images/quest/${world}/mid.webp`,
  ground: `/images/quest/${world}/ground.webp`
});

// ── The fallback. Kept deliberately, kept honest. ────────────────────────────
function rand(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

function FallbackHills({ length, height, seed, palette, camera }) {
  const GROUND = height * 0.72;
  const far = useMemo(() => ridge(rand(seed * 3 + 1), length, 190, Math.round(length / 520), GROUND - 40), [seed, length, GROUND]);
  const mid = useMemo(() => ridge(rand(seed * 7 + 3), length, 120, Math.round(length / 380), GROUND - 6), [seed, length, GROUND]);

  return (
    <>
      <svg
        className="qw-layer"
        viewBox={`0 0 ${length} ${height}`}
        width={length}
        height={height}
        style={{ transform: `translate3d(${-camera * 0.25}px,0,0)` }}
        aria-hidden="true"
      >
        <path d={far} fill={palette.far} />
      </svg>
      <svg
        className="qw-layer"
        viewBox={`0 0 ${length} ${height}`}
        width={length}
        height={height}
        style={{ transform: `translate3d(${-camera * 0.55}px,0,0)` }}
        aria-hidden="true"
      >
        <path d={mid} fill={palette.mid} opacity="0.9" />
      </svg>
      <svg
        className="qw-layer"
        viewBox={`0 0 ${length} ${height}`}
        width={length}
        height={height}
        style={{ transform: `translate3d(${-camera}px,0,0)` }}
        aria-hidden="true"
      >
        <rect x="0" y={GROUND} width={length} height={height - GROUND} fill={palette.near} />
        <rect x="0" y={GROUND} width={length} height="14" fill={palette.mid} />
        <rect x="0" y={GROUND + 52} width={length} height="58" fill={palette.road} opacity="0.55" rx="10" />
        <rect x="0" y={GROUND + 52} width={length} height="6" fill={HIGHLIGHT} opacity="0.18" />
      </svg>
    </>
  );
}

export default function WorldScene({ world, length, height = 620, seed = 1, camera = 0, painted = true }) {
  const p = worldPalette(world);
  const art = ART(world);

  // Each layer is ONE tiled image, moved with translate3d. `background-repeat:
  // repeat-x` does the tiling, which is why the source art has to be seamless
  // left-to-right — see the prompts, which say so three times.
  const layer = (src, depth, extra = {}) => ({
    backgroundImage: `url(${src})`,
    transform: `translate3d(${-camera * depth}px,0,0)`,
    width: length + 2400,          // slack so the far layers never run out
    ...extra
  });

  return (
    <div className="qw-scene" style={{ "--q-accent": p.accent, "--q-deep": p.deep, "--q-road": p.road }}>
      {/* The sky is the floor of the whole thing: the palette gradient is always
          there, so a missing painting means "plain", never "white hole". */}
      <div className="qw-sky" style={{ background: `linear-gradient(180deg, ${p.skyTop} 0%, ${p.skyBottom} 62%)` }}>
        {painted && <div className="qw-paint qw-paint-sky" style={layer(art.sky, 0.08)} />}
      </div>

      {painted ? (
        <>
          <div className="qw-paint qw-paint-far" style={layer(art.far, 0.25)} />
          <div className="qw-paint qw-paint-mid" style={layer(art.mid, 0.55)} />
          <div className="qw-paint qw-paint-ground" style={layer(art.ground, 1)} />
        </>
      ) : (
        <FallbackHills length={length} height={height} seed={seed} palette={p} camera={camera} />
      )}
    </div>
  );
}
