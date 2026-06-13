# Codex prompt — Skills Quest map upgrade (path-following avatar + diegetic place markers)

Paste everything below into Codex. It is scoped to the adventure map only. Do not touch
game logic, progress saving, or content.

---

## Context

The adventure map lives in:

- `src/components/elQuest/ElSkillsQuest.jsx` — the `if (!activeCycle)` block (~lines 421–528)
  renders the map. Key pieces:
  - `WORLD_REGIONS` (~line 28) and `WORLD_MAP_POINTS` (~line 51) — landmark names + `[x%, y%]`
    coordinates per world.
  - `.sbq-mapboard` shows the painted art (`/images/pals/maps/{region}-map.webp`,
    portrait 1195×1600).
  - Each cycle is a `<button className="sbq-stop">` placed at `left/top` % (~lines 465–488).
  - The traveler is `<img className="sbq-journey-avatar">` placed at the recommended stop's
    `left/top` % (~lines 489–506).
- `src/styles/skills-block-quest.css` — map styles. Relevant: `.sbq-mapboard` (~879),
  `.sbq-mapboard .sbq-stop` (~943), `.sbq-mapboard .sbq-journey-avatar` (~993).

The three map images (`meadow-map.webp`, `dino-map.webp`, `moonwood-map.webp`) already have a
**winding dirt road painted on them** and all nine landmarks painted (barn, pond, sheep pen,
orchard, gate, etc.). We want to use that existing art, not cover it.

## Two problems to fix

1. **Avatar moves "as the crow flies."** It uses a CSS `transition` on `left`/`top`, which
   interpolates in a straight diagonal line and cuts across fields. It must glide **along the
   painted road**, smoothly.
2. **Cycles are white placeholder cards on top of the art.** `.sbq-stop` renders a white rounded
   rectangle with a number + label + grapheme text, plopped over each painted landmark. The
   cycles must instead be **disguised as the places themselves** — a small in-world marker (a
   carved wooden signpost) sitting on the painted landmark, with the name/skill text appearing
   only on hover/focus, not as a permanent white box.

---

## Part 1 — Avatar that follows the painted road (the important one)

Use an **SVG route path + requestAnimationFrame tween with `getPointAtLength`**. This follows the
curve exactly and scales correctly with the responsive board and the zoom control. (Do NOT use a
CSS `left/top` transition, and do NOT use `offset-path` with pixel coordinates — both break under
the zoomable, responsive board.)

### 1a. Add a route path per world

Coordinates are in the art's native space: viewBox `0 0 1195 1600`. Convert each `[x%, y%]` in
`WORLD_MAP_POINTS` to view units with `x/100*1195`, `y/100*1600`. Build a **smooth** path that
passes through every landmark in order using a Catmull-Rom → cubic-bezier helper so the line
curves like the painted road instead of zig-zagging.

Add this helper near the top of `ElSkillsQuest.jsx`:

```js
// Smooth path through the landmark anchors, in the map art's 1195x1600 space.
function buildRoutePath(points) {
  const pts = points.map(([x, y]) => [ (x / 100) * 1195, (y / 100) * 1600 ]);
  if (pts.length < 2) return "";
  const d = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}
```

### 1b. Render an SVG route overlay inside `.sbq-mapboard`

Place this as the FIRST child of `.sbq-mapboard` (before the stops), so the route sits under the
markers and avatar. `preserveAspectRatio="xMidYMid slice"` makes the SVG line up exactly with the
`background-size: cover` art.

```jsx
const routeD = buildRoutePath(mapPoints);
// ...
<svg
  className="sbq-route"
  viewBox="0 0 1195 1600"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
>
  <path ref={routeRef} className="sbq-route-line" d={routeD} />
</svg>
```

Add a `const routeRef = useRef(null);` alongside the other refs.

Route line styling (replace the dead `.sbq-trail` rules in the CSS):

```css
.sbq-route { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
.sbq-route-line {
  fill: none;
  stroke: rgba(255, 248, 225, 0.55);     /* soft, like a worn footpath; tweak per world below */
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: 2 26;                  /* dotted "footprint" trail; set to none for a solid road */
  filter: drop-shadow(0 1px 1px rgba(15, 23, 42, 0.35));
}
[data-pal-world="moonwood"] .sbq-route-line { stroke: rgba(186, 230, 253, 0.7); }
```

### 1c. Tween the avatar ALONG the path

Replace the avatar `<img>` block with a positioned wrapper. The wrapper carries the path position
(set via JS); a nested element carries the idle bob so the two transforms never fight.

```jsx
<div ref={avatarRef} className="sbq-journey-avatar" aria-hidden="true">
  <span className="sbq-journey-avatar-bob">
    <img src={travelerImage} alt="" />
  </span>
</div>
```

Add a tween effect. It walks the SVG path with `getPointAtLength`, finds the arc-length nearest
each landmark anchor, then animates `distance` from the old landmark to the recommended one with
an ease-in-out over a duration that scales with how far it travels:

```js
const avatarRef = useRef(null);
const routeRef = useRef(null);
const lastIndexRef = useRef(0);

useEffect(() => {
  const path = routeRef.current;
  const avatar = avatarRef.current;
  if (!path || !avatar || !routeD) return undefined;

  const total = path.getTotalLength();
  // arc-length at each landmark anchor
  const anchorDist = mapPoints.map(([x, y]) => {
    const tx = (x / 100) * 1195, ty = (y / 100) * 1600;
    let best = 0, bestD = Infinity;
    for (let s = 0; s <= total; s += total / 240) {
      const p = path.getPointAtLength(s);
      const dd = (p.x - tx) ** 2 + (p.y - ty) ** 2;
      if (dd < bestD) { bestD = dd; best = s; }
    }
    return best;
  });

  const targetIndex = stops.findIndex(c => c.id === recommendedCycle?.id);
  if (targetIndex < 0) return undefined;

  const from = anchorDist[lastIndexRef.current] ?? 0;
  const to = anchorDist[targetIndex] ?? 0;
  lastIndexRef.current = targetIndex;

  const place = (dist) => {
    const p = path.getPointAtLength(dist);
    avatar.style.left = `${(p.x / 1195) * 100}%`;
    avatar.style.top = `${(p.y / 1600) * 100}%`;
  };

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce || from === to) { place(to); return undefined; }

  const dur = Math.min(2200, 600 + Math.abs(to - from) * 0.9);
  const t0 = performance.now();
  let raf = 0;
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2); // easeInOutQuad
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    place(from + (to - from) * ease(t));
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
  // re-run when the recommended stop or the active world changes
}, [routeD, recommendedCycle?.id, region.id]);
```

Avatar CSS (replace the existing `.sbq-mapboard .sbq-journey-avatar` rules and the duplicate
generic `.sbq-journey-avatar` block near line 653 — keep only one):

```css
.sbq-journey-avatar {
  position: absolute;
  left: 0; top: 0;
  transform: translate(-50%, -100%);   /* anchored by the feet to the point on the road */
  z-index: 5;
  pointer-events: none;
  /* no left/top transition — JS rAF drives the motion along the path */
}
.sbq-journey-avatar-bob {
  display: block;
  animation: sbq-avatar-bob 2.6s ease-in-out infinite;
}
.sbq-journey-avatar img {
  height: calc(74px * var(--map-zoom, 1));
  width: auto;
  filter: drop-shadow(0 5px 10px rgba(15, 23, 42, 0.28));
}
@keyframes sbq-avatar-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@media (prefers-reduced-motion: reduce) { .sbq-journey-avatar-bob { animation: none; } }
```

### 1d. Keep the avatar in view

After the tween starts, smooth-scroll the `.sbq-map-viewport` so the destination stays on screen
(useful when zoomed). Optional but recommended:

```js
stopRefs.current[recommendedCycle?.id]?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
```

---

## Part 2 — Cycles disguised as places, not white cards

Goal: the painted landmark IS the button. A small carved **wooden signpost** marker sits on it
showing the cycle number / a star when done; the name + skill text appear only on hover/focus as a
little wooden sign, so the map stays clean.

### 2a. Restructure each stop button

```jsx
<button
  key={cycle.id}
  type="button"
  ref={el => { stopRefs.current[cycle.id] = el; }}
  className={`sbq-stop${cycleProgress?.stars ? " done" : ""}${isRecommended ? " next" : ""}`}
  style={{ left: `${x}%`, top: `${y}%` }}
  onClick={() => openCycle(cycle)}
  aria-label={`${region.landmarks[index] || `Cycle ${cycle.cycleNumber}`}${isRecommended ? " — you are here" : ""}`}
>
  <span className="sbq-stop-marker" aria-hidden="true">
    {cycleProgress?.stars ? "★" : cycle.cycleNumber}
  </span>
  <span className="sbq-stop-tip">
    <span className="sbq-stop-name">{region.landmarks[index] || "Mystery Spot"}</span>
    <span className="sbq-stop-skill">
      {(cycle.focusLetters || []).map(i => i.grapheme).join(" ") || "Review"}
    </span>
    {cycleProgress?.stars ? <ProgressStars stars={cycleProgress.stars} /> : null}
  </span>
</button>
```

### 2b. Marker + tooltip CSS — replace the whole `.sbq-mapboard .sbq-stop*` block

```css
/* The painted landmark is the target. The marker is a small in-world post, NOT a card. */
.sbq-mapboard .sbq-stop {
  position: absolute;
  transform: translate(-50%, -50%);
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  z-index: 2;
}

/* A carved wooden disc that reads as part of the scene */
.sbq-stop-marker {
  display: grid;
  place-items: center;
  width: calc(40px * var(--map-zoom, 1));
  height: calc(40px * var(--map-zoom, 1));
  border-radius: 50%;
  font: 800 calc(1rem * var(--map-zoom, 1)) / 1 var(--lp-font-reading);
  color: #fff5e1;
  background:
    radial-gradient(circle at 32% 28%, rgba(255,255,255,0.35), transparent 55%),
    linear-gradient(160deg, #8a5a33, #5e3a1d);     /* aged wood */
  border: 3px solid rgba(255, 248, 225, 0.9);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.45), inset 0 1px 2px rgba(255,255,255,0.3);
  transition: transform 130ms ease-out, box-shadow 130ms ease-out;
}
.sbq-mapboard .sbq-stop:hover .sbq-stop-marker,
.sbq-mapboard .sbq-stop:focus-visible .sbq-stop-marker {
  transform: scale(1.12);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.5);
}

/* Current stop: a gentle pulsing halo (Duolingo-style), no white box */
.sbq-mapboard .sbq-stop.next .sbq-stop-marker {
  box-shadow: 0 0 0 0 var(--pal-accent), 0 4px 10px rgba(15,23,42,0.45);
  animation: sbq-stop-pulse 1.8s ease-out infinite;
}
@keyframes sbq-stop-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--pal-accent) 70%, transparent), 0 4px 10px rgba(15,23,42,0.45); }
  70%  { box-shadow: 0 0 0 16px color-mix(in srgb, var(--pal-accent) 0%, transparent), 0 4px 10px rgba(15,23,42,0.45); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--pal-accent) 0%, transparent), 0 4px 10px rgba(15,23,42,0.45); }
}

/* Done: gold rim instead of brown */
.sbq-mapboard .sbq-stop.done .sbq-stop-marker {
  background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.45), transparent 55%),
              linear-gradient(160deg, #f6b53d, #c9881a);
  border-color: #fff3cf;
  color: #5a3a08;
}

/* Name + skill: hidden until hover/focus, shown as a small wooden sign */
.sbq-stop-tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translate(-50%, 4px);
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 110px;
  padding: 7px 12px;
  border-radius: 12px;
  background: rgba(40, 26, 14, 0.94);
  color: #fff6e6;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.4);
  opacity: 0;
  visibility: hidden;
  transition: opacity 140ms ease, transform 140ms ease;
  pointer-events: none;
  z-index: 4;
}
.sbq-mapboard .sbq-stop:hover .sbq-stop-tip,
.sbq-mapboard .sbq-stop:focus-visible .sbq-stop-tip,
.sbq-mapboard .sbq-stop.next .sbq-stop-tip {   /* the current stop labels itself by default */
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}
.sbq-stop-name { font: 700 0.9rem var(--lp-font-reading); }
.sbq-stop-skill { font-size: 0.62rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #ffe1a8; }
```

Per-world flavour (optional polish): swap the wooden disc for a themed marker —
meadow = wood signpost (above is fine), dino = carved bone/stone (`linear-gradient(#cdbfa3,#9a8f76)`),
moonwood = glowing lantern (`linear-gradient(#6ee7ff,#2b8bbd)` + soft outer glow). Gate them with
`[data-pal-world="dino"] .sbq-stop-marker { ... }` etc.

---

## Part 3 — Cleanup (remove dead code)

In `src/styles/skills-block-quest.css`, delete the unused legacy list-map styles — they are no
longer rendered anywhere:

- `.sbq-worldmap`, `.sbq-region`, `.sbq-region-name`, `.sbq-region-path` (~lines 674–715)
- `.sbq-stop-row` and its `::after` trail variants (~lines 717–739)
- the old `.sbq-trail` rules (~927–941) — replaced by `.sbq-route` above
- the duplicate top-of-file `.sbq-journey-avatar` block (~653–668) — keep only the new one

Verify nothing else references these class names before deleting.

---

## Acceptance checks

1. The traveler glides **along the painted road** between stops (curved, not diagonal), with
   ease-in-out and a subtle bob. No straight-line cuts across fields.
2. At every zoom level (1×–2.5×) the avatar still sits on the road and the route lines up with the
   painted path.
3. No white rectangles on the map. Each cycle shows a small in-world marker on its landmark;
   name + skill appear on hover/focus (and always for the current stop).
4. `prefers-reduced-motion`: avatar snaps to the stop, no bob, no pulse.
5. Keyboard: each marker is focusable, shows its sign on focus, and opens on Enter.
6. No console errors; dead CSS removed; lint passes.
