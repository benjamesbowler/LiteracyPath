# OPUS TASK — Arcade Quality Pass: longer, harder, SNES/PS1-grade (Wipeout × Super Mario World)

Date: 2026-07-06. You are the sole coder. Run AFTER `docs/OPUS_ARCADE_FIX_2026-07-06_ROCKET_LEAP.md`
has landed (it rewrites `makeLevel`, the RR bubble loop, ship, and starfield — this doc builds on
those versions). If any anchor below doesn't match, adapt to the post-fix code, never revert it.

Files: `src/components/learn/games/games/RocketRunGame.jsx`,
`src/components/learn/games/games/LetterLeapGame.jsx`, `src/utils/audio/gameSfx.js` (additions only).

Skip anything already implemented by `docs/OPUS_ARCADE_10_IMPROVEMENTS_2026-07-06.md` (check git
log first) — do not duplicate audio/pause/persistence work.

Work mission by mission. After EVERY mission: lint → unit tests → play it → screenshot. Never move
on with a red gate.

---

## MISSION 0 — Session length & challenge (the "30 seconds and too easy" fix)

Today's math: RR rounds are ~12–20 single-file bubbles spaced 1.15s — ≈20s per round, one lane
switch every few seconds, no simultaneous threats. LL levels are a ~18s walk with sparse hazards.
Active kids are done before the game starts. Targets: **RR ≈ 2.5–4 min/session, LL ≈ 2–3 min/level,
both with real hands-busy pressure that ramps.**

### 0.1 Rocket Run

In `RocketRunGame.jsx`:

```js
const ROUNDS_PER_GAME = 8;                      // was 5
function difficultyCount(difficulty) {
  return difficulty === "hard" ? 12 : difficulty === "medium" ? 10 : 8;   // was 8/6/5
}
```

Steeper speed curve — in `tick()` replace the `speed` line:

```js
    const speed = 1.15 + roundIx * 0.26 + Math.min(1.0, elapsed * 0.01);
```

and bubble travel `dt * 9.5 * speed` → `dt * 11 * speed`.

**Pair spawns (the real difficulty):** two objects at once in different lanes, chance ramping with
depth. Replace the spawn block in `tick()`:

```js
      spawnTimer -= dt;
      if (spawnTimer <= 0 && queue.length) {
        const spawnOne = avoidLane => {
          const item = queue.shift();
          let lane = item.guaranteed ? laneIx : Math.floor(Math.random() * 3);
          if (avoidLane != null && lane === avoidLane) lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
          const b = item.meteor ? makeMeteor(lane) : makeBubble(item.word, item.correct, lane, item.tries);
          bubbles.push(b);
          return lane;
        };
        const lane = spawnOne(null);
        const pairChance = Math.min(0.55, 0.12 + roundIx * 0.06 + (opts.difficulty === "hard" ? 0.15 : 0));
        if (queue.length && Math.random() < pairChance) spawnOne(lane);
        spawnTimer = 1.0 / speed;
      }
```

(If the ghost-fix version of this block differs slightly, merge — keep `passed`/fade logic intact.)

Meteors scale harder: in `startRound()`, `const meteorCount = 2 + roundIx;` →
`const meteorCount = Math.round((2 + roundIx * 1.4) * (theme.meteorMul || 1));` (themes in Mission 3).

### 0.2 Letter Leap

- `SEG = 380` → `SEG = 440` and `WORD_GAP = 460` → `WORD_GAP = 560` — longer runs, and every extra
  px is now populated (ravines/foes/decoys/coins land in the gaps).
- Foe/decoy pressure up one notch: `foeCount = 4 + Math.round(levelIndex * 0.9) + bump;`
  `decoyCount = 5 + Math.round(levelIndex * 1.0) + bump;`
- Foe patrol speeds: walker 1.5 → 1.9, flyer 1.8 → 2.3, hopper 1.2 → 1.5 (keep spike slow at 1.1 —
  it's a positioning puzzle, not a chase).
- Player counter-buff so it stays fair AND snappier: `MOVE = 4.2` → `MOVE = 4.8`.

**Gate:** time yourself (Playwright with a scripted competent run, or count frames): RR full session
≥ 2.5 min; one LL medium stage ≥ 100s for a clean run. If short, raise `difficultyCount` / add one
word-gap feature room per stage — loop until the gate passes.

---

## MISSION 1 — Modern game feel (controls + juice)

This is the single biggest "feels 1990 vs feels 2026" lever.

### 1.1 Letter Leap: coyote time, jump buffer, variable jump height

State (next to `keys`):

```js
  const COYOTE = 0.12, JUMP_BUFFER = 0.14;
  let coyoteT = 0, jumpBufT = 0;
```

Input — jump press should BUFFER, and holding should float higher. `onKeyDown`: add `if (!e.repeat)`
guard and set `jumpBufT = JUMP_BUFFER;` when jump is pressed. In `hold()` for the JUMP button, set
`jumpBufT = JUMP_BUFFER;` inside `down`.

In `update(dt)` replace `if (keys.jump && p.onGround) { ... }` with:

```js
    coyoteT = p.onGround ? COYOTE : Math.max(0, coyoteT - dt);
    jumpBufT = Math.max(0, jumpBufT - dt);
    if (jumpBufT > 0 && (p.onGround || coyoteT > 0)) {
      p.vy = -JUMP; p.onGround = false; coyoteT = 0; jumpBufT = 0; p.squash = -0.3; sfx(playTapSound);
    }
    if (!keys.jump && p.vy < -4) p.vy = -4;   // release early = shorter hop (variable jump height)
```

### 1.2 Letter Leap: dust, popups, stomp shake

- **Landing dust:** where `if (p.onGround && wasAir) p.squash = 0.35;` add 6 grey puffs
  (`particles.push({..., c:"#cfc9bd", vy: -Math.random()*1.5, vx: ±2 })`).
- **Run dust:** a timer emits one puff at the heels every 0.18s while `p.onGround && p.vx !== 0`.
- **Score popups:** `let floats = [];` — on letter/coin/stomp add
  `floats.push({ x, y, txt: "+10", life: 0.8 });` update (rise 40px, fade) and draw in world space
  with `700 18px Fredoka`, white with dark stroke.
- **Stomp shake:** `let shakeT = 0;` set `0.22` on stomp; in `draw()` wrap the world render in a
  translate of `(Math.random()-0.5)*6*shakeT` when `shakeT > 0`, decaying `shakeT -= dt`.

### 1.3 Rocket Run: bank flourish + camera life

- On successful `moveLane`, set `rollT = 0.38; rollDir = dir;`. In `tick()` after the lean line:
  `if (rollT > 0) { ship.rotation.z += Math.sin((1 - rollT / 0.38) * Math.PI) * -rollDir * 0.7; rollT -= dt; }`
- Camera breathing: `camera.position.y = 2.6 + Math.sin(elapsed * 1.3) * 0.05;`
- Catch juice: on a correct catch, `shipPulse = 0.25` → scale ship `1 + shipPulse*0.3` decaying.

**Gate:** record a 10s gif of each game (Playwright video). Landing dust, popups, buffered jumps
(press jump 0.1s before landing — it must fire), coyote jump off a ravine edge, and the RR bank
flourish all visible. Loop until they are.

---

## MISSION 2 — Combo, boost & collectibles (score systems that create replay)

### 2.1 Rocket Run: catch combo + Wipeout boost ring

State: `let combo = 0, boostT = 0;` HUD: add a combo pill next to the letter chip
(`<div data-rr="combo" ...>` hidden when combo < 2, text `×2`, `×3`…).

- Correct catch: `combo += 1; addScore((opts.difficulty === "hard" ? 15 : 10) * Math.min(4, 1 + Math.floor(combo / 3)));`
  update the pill with a 120ms scale-pop transition.
- Wrong hit, heart loss, or a correct word passing uncaught: `combo = 0` (hide pill).
- **Boost ring:** when `combo` REACHES 5 (and every +5 after), splice `{ ring: true }` 2 items deep
  into `queue`. `makeRing()`:

```js
  function makeRing(lane) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.09, 12, 40),
      new THREE.MeshBasicMaterial({ color: 0x59ffe0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(ring);
    group.position.set(LANES[lane], 1.05, -46);
    group.userData = { ring: true, lane, alive: true, orb: ring, setFade: a => { ring.material.opacity = 0.9 * a; } };
    scene.add(group);
    return group;
  }
```

  In `resolveBubble`, rings: fly through in the right lane → `boostT = 1.6; addScore(25); sfx(playWhoosh);`
  (never a penalty in the wrong lane — it just passes).
- **Boost effect** in `tick()`: `const boost = boostT > 0 ? 1.8 : 1; boostT = Math.max(0, boostT - dt);`
  multiply bubble travel AND star-layer speed by `boost`, and lerp `camera.fov` 62 → 74 while
  boosting (`camera.updateProjectionMatrix()` when it changes by >0.1). Plume scale ×1.6.

### 2.2 Letter Leap: coins, star tokens, end-of-stage tally

- **Coins** in `makeLevel`: (a) a 5-coin parabolic arc over every ravine (`y = groundY() - 90 - Math.sin(u * Math.PI) * 58`),
  (b) a line of 3 between letters on long flat gaps, (c) one on each hop platform. Store
  `level.coins = [{x, y, taken: false}]`.
- Draw spinning: `const wobble = Math.abs(Math.cos(t * 4 + c.x));` gold ellipse `rx = 9 * wobble, ry = 10`,
  darker rim, sparkle dot. Collect radius 26: `+5` score, popup, `playPopSound`, coin counter in HUD
  (`data-ll="coins"`, top-left, `🪙 ×N` styled like the hearts pill).
- **Star tokens:** 3 per stage on the HIGHEST platforms (risk/reward). Rotating 5-point gold star,
  radius 13. Collecting all 3 → `+250`, `playStarChime`, brief golden vignette flash.
- **Tally screen:** replace the bare `clearStage()` overlay with a results card that counts up:
  words spelled, coins, stars collected (0–3 as ★), time, score — each line ticking in 400ms apart
  (setTimeout chain), then the Next button. Same card style as the existing overlay button.

**Gate:** play RR to a 5-combo — ring must spawn, boost must visibly kick (fov + speed) and end.
LL: clear a stage grabbing coins + 3 stars — tally must match actual counts (assert via temporary
console.log, then remove). Loop until clean.

---

## MISSION 3 — Track & level architecture (Wipeout track / SMW level language)

### 3.1 Rocket Run: neon lane rails + round environments + finale

- **Lane rails** (instant "it's a track, not empty space"): per lane, an additive glowing strip:

```js
  const rails = [];
  for (const lx of LANES) {
    const rail = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 70),
      new THREE.MeshBasicMaterial({ color: 0x3fd6ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    rail.rotation.x = -Math.PI / 2;
    rail.position.set(lx, 0.18, -25);
    scene.add(rail); rails.push(rail);
  }
```

  In `tick()`: `rails.forEach((r, i) => { r.material.opacity = (i === laneIx ? 0.5 : 0.22) + Math.sin(now * 0.004 + i) * 0.06; });`
  — the child's current lane glows brighter.
- **Round themes** — module-scope:

```js
const ROUND_THEMES = [
  { name: "Deep Space",    fog: 0x0a1230, ambient: 0x8899ff, meteorMul: 1.0 },
  { name: "Asteroid Belt", fog: 0x171008, ambient: 0xffc08a, meteorMul: 2.2 },
  { name: "Nebula Storm",  fog: 0x1a0a2e, ambient: 0xc09aff, meteorMul: 1.3 },
  { name: "Ice Field",     fog: 0x0a1a26, ambient: 0x9fe0ff, meteorMul: 1.6 },
  { name: "Red Giant",     fog: 0x260c08, ambient: 0xff9a7a, meteorMul: 1.8 },
  { name: "Dark Rift",     fog: 0x05060f, ambient: 0x6677cc, meteorMul: 2.0 },
  { name: "Star Nursery",  fog: 0x201a08, ambient: 0xffe09a, meteorMul: 1.5 },
  { name: "Comet Chase",   fog: 0x0a1230, ambient: 0xaaccff, meteorMul: 2.6 }
];
```

  In `startRound()`: `const theme = ROUND_THEMES[roundIx % ROUND_THEMES.length];`
  tween `scene.fog.color` / ambient light color to the theme over ~1s (lerp in tick), and use
  `theme.meteorMul` (Mission 0). The between-round overlay becomes an intro banner:
  "Planet reached! → **Entering the Asteroid Belt**" with the theme name.
- **Finale (round 8, Comet Chase):** spawn a large comet — icosahedron r 1.6, emissive, with a
  20-unit additive cone tail — drifting slowly across the far field (`z ≈ -55`, x oscillating).
  Speed +25% for the round. On round clear, the comet flies past the camera with a long whoosh and
  a 3D confetti burst (reuse `burst()` ×6, mixed colors). Mission-complete overlay says
  "You caught the comet!".

### 3.2 Letter Leap: moving platforms, springs, upper bonus routes

- **Moving platforms** — extend the plat shape: `{ x, y, w, move: { axis: "y"|"x", range, speed, t } }`.
  In `update(dt)`, before collisions:

```js
    for (const pl of level.plats) {
      if (!pl.move) continue;
      pl.move.t += dt;
      const off = Math.sin(pl.move.t * pl.move.speed) * pl.move.range;
      pl.prevX = pl.x; pl.prevY = pl.y;
      if (pl.move.axis === "x") pl.x = pl.baseX + off; else pl.y = pl.baseY + off;
      if (p.stood === pl) { p.x += pl.x - pl.prevX; p.y += pl.y - pl.prevY; } // carry the rider
    }
```

  Set `pl.baseX = pl.x; pl.baseY = pl.y;` at creation for movers; in the plat-landing collision set
  `p.stood = pl;` and clear `p.stood = null;` at the top of each frame. Use movers on the SECOND hop
  platform of ravines from level 4+ (`move: { axis: "y", range: 34, speed: 1.4, t: Math.random() * 6 }`)
  and as x-movers over the widest ravines on hard.
- **Springs:** `level.springs = [{x, taken:false}]`, placed before extra-high platforms. Feet
  collision (radius 24, on ground) → `p.vy = -19; p.squash = -0.45; sfx(playWhoosh);`. Draw: coiled
  red/steel spring, compressing (2-frame) when hit.
- **Upper bonus route:** on levels ≥ 3, over one long flat stretch add a chain of 3–4 platforms at
  `groundY() - 150…-190` carrying a coin line + one star token — reachable by spring or hop chain.
  Ground route stays complete (letters never require the upper route; catch-up logic untouched).

**Gate:** screenshot every ROUND_THEME (advance roundIx via `startLevel` prop or temporary key).
LL: ride an x-mover across a ravine, spring to a star token, verify the carry (player must not slide
off a moving platform). Loop until all pass.

---

## MISSION 4 — Cinematic presentation (PS1 attract-mode polish)

- **Round/stage intro banner** (both games): a 1.2s DOM banner — big italic
  `ROUND 3 — NEBULA STORM` / `MOONWOOD · LVL 4` sliding in from the left with letter-spacing
  animation, dark gradient backdrop strip, then sliding out. Pure CSS keyframes injected once.
- **Results screens** (both): shared visual language — dark card, three stars popping in
  sequentially (scale 0→1.2→1 with `playStarChime` per star), score counting up over 800ms, then
  buttons. RR's `finishGame` and LL's `finishGame` both use it.
- **LL camera lookahead:** `const camTarget = Math.max(0, Math.min(level.L - W, p.x - W * 0.35 + p.face * 90));`
  `cam += (camTarget - cam) * Math.min(1, dt * 4);` (replaces the hard `cam =` snap).
- **RR speed lines during boost:** 12 thin additive quads at screen edges, stretched with speed,
  opacity tied to `boostT` (skip when `reduceMotion`).
- **Low-hearts tension:** at 1 heart, LL vignette pulses subtly red (existing vignette gradient,
  animate alpha 0.28→0.4); RR fog pulses `+0.005` density. Reset when a heart is regained.

**Gate:** gif each intro banner + both results screens. Stars must pop sequentially with sound.
`prefers-reduced-motion` must disable banner slide (fade instead), speed lines, and shakes — test
with emulation in Playwright. Loop until clean.

---

## MISSION 5 — Living worlds (ambient depth)

- **LL foreground parallax layer:** after entities, draw a dark silhouette strip (bushes/rocks —
  procedural humps, `rgba` of theme.treeDark at 0.85) scrolling at `cam * 1.22`. Instant SNES depth.
- **LL weather per world:** meadow — drifting pollen + one butterfly (two-ellipse flap, wandering
  sine path); dino — falling leaves (rotating rects, brown/amber) + heat-shimmer band above the
  horizon (2px sine y-offset slices, skip on reduceMotion); moonwood — keep fireflies, add a
  shooting star every ~14s (bright streak, 0.6s) and a slow moon glow pulse.
- **LL animated flag:** replace the static triangle with a 3-segment waving pennant
  (`Math.sin(t * 6 + seg)` y-offsets) + a little sparkle when the stage is completable
  (`stageDone` true → flag glows gold).
- **LL idle animation:** if `p.vx === 0 && p.onGround` for > 2s, blink (scale eyes) every ~3s and a
  small look-around head tilt — sells "real character". (Canvas fallback only; sprite pals just bob.)
- **RR ambient props:** 2–3 slow drifting far-field planets — `SphereGeometry(2.2)` with a
  procedural CanvasTexture (radial gradient + horizontal bands, per-theme hue), `z ≈ -70`,
  drifting +z at 0.4/s and respawning at −90 with a new hue. Plus occasional comet streak
  (thin additive plane, diagonal, every ~20s).

**Gate:** 15s gif per LL world + one RR round — pollen/leaves/fireflies, butterfly, waving flag,
idle blink, drifting planets all visible; GPU steady (no FPS drop below 55 on the dev machine —
check with a temporary FPS meter, then remove it). Loop until clean.

---

## GLOBAL VERIFICATION LOOP (after all missions, before handoff)

1. `npm run lint` → zero errors.
2. `npm test` → all green.
3. `npx playwright test tests/smoke` → green.
4. Full manual pass via Playwright: one COMPLETE RR session (8 rounds) and one complete LL stage
   per difficulty. Assert: no console errors, no leaked event listeners on unmount (mount/unmount
   the game modal 5× and check `getEventListeners` count is stable), memory stable across rounds
   (no unbounded `scene.children` growth — log `scene.children.length` each round start; it must
   return to baseline).
5. Session-length gate re-check (Mission 0 numbers).
6. Screenshots + gifs into `docs/verify/arcade-quality-pass/` for Benjamin.
7. `graphify update .`

## HANDOFF

One command for Benjamin when every gate is green:

```bash
cd ~/Desktop/LiteracyPath && npm run lint && npm test && git add -A && git commit -m "arcade quality pass: longer harder sessions, modern game-feel controls, combo/boost/coins, lane rails + round themes + finale, moving platforms/springs/bonus routes, cinematic banners/results, living worlds" && git push
```

## ACCEPTANCE CRITERIA

- [ ] RR session ≥ 2.5 min with pair spawns and a steepening speed curve; LL stage ≥ ~100s.
- [ ] Coyote time, jump buffering, and variable jump height in LL (verified by scripted input test).
- [ ] Combo ×-multiplier + boost rings with FOV/speed kick in RR; coins, star tokens, and counting
      tally screen in LL.
- [ ] Neon lane rails, 8 themed rounds with intro banners, and a Comet Chase finale in RR.
- [ ] Moving platforms (with rider carry), springs, and upper bonus routes in LL.
- [ ] Shared cinematic results screens; sequential star pops with audio.
- [ ] Foreground parallax, per-world weather, animated flag, idle anims, drifting planets.
- [ ] `prefers-reduced-motion` respected by every new effect.
- [ ] 55+ FPS held; no memory/listener leaks over 5 mount cycles; all suites green; screenshots
      and gifs delivered in `docs/verify/arcade-quality-pass/`.
