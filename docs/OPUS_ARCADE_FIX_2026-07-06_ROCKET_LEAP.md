# OPUS TASK — Arcade Fix Round: Rocket Run ghosts/audio/visuals + Letter Leap level design v2

Date: 2026-07-06. You are the sole coder. Implement everything below directly, run the full
verification loop until clean, then hand Benjamin ONE copy-paste push command. Do not ask him
to edit anything.

Files you will touch:

- `src/components/learn/games/games/RocketRunGame.jsx`
- `src/components/learn/games/games/LetterLeapGame.jsx`
- `tools/patch-bg-space-watermark.mjs` (new)
- `public/images/games/bg-space.webp` (patched output)

Root causes were already diagnosed by reading the code — do not re-derive them, just apply
the fixes, then verify in the loop.

---

## PART 1 — ROCKET RUN (`RocketRunGame.jsx`)

### Bug 1.1 — Ghost words survive into the next round (CONFIRMED root cause)

`endRound()` sets `running = false` but never removes in-flight bubbles from the Three.js
scene. `startRound()` then does `bubbles = []`, dropping the JS references while the meshes
stay in `scene` forever — frozen "ghost" words (see screenshot: shell/who/kit/itch stuck
mid-screen in a later round).

**Fix — add `clearField()` and call it first thing in `endRound()`.**

Insert this function directly above `function endRound() {`:

```js
  function clearField() {
    // Remove every in-flight bubble/meteor from the SCENE, not just the array —
    // this is what used to leave frozen "ghost" words behind between rounds.
    for (const b of bubbles) { b.userData.alive = false; scene.remove(b); disposeGroup(b); }
    bubbles = [];
    queue = [];
  }
```

Then change the top of `endRound()` from:

```js
  function endRound() {
    running = false;
    caughtTotal += caught; neededTotal += needed; wrongTotal += wrongHits;
```

to:

```js
  function endRound() {
    running = false;
    clearField();
    caughtTotal += caught; neededTotal += needed; wrongTotal += wrongHits;
```

Also harden `teardown()` — change `for (const b of bubbles) disposeGroup(b);` to
`for (const b of bubbles) { scene.remove(b); disposeGroup(b); }`.

### Bug 1.2 — Miss/pass sounds fire at the SCREEN plane, not the rocket (CONFIRMED)

The pass-by branch currently triggers at `bubble.position.z > camera.position.z + 2`
(z ≈ 9.2 — the screen), while the ship sits at z = 4.2. So the "ping" lands ~0.5s after the
word visually passes the rocket. Move the audio cue to the rocket plane, then let the
bubble fade out and get culled at the camera plane.

**Fix — replace the whole bubble-update block inside `tick()`.** Find:

```js
      for (const bubble of bubbles) {
        if (!bubble.userData.alive) continue;
        bubble.position.z += dt * 9.5 * speed;
        if (bubble.userData.meteor) bubble.userData.rock.rotation.x += dt * 1.8;
        else bubble.userData.orb.rotation.y += dt * 1.5;
        if (bubble.position.z >= ship.position.z - 0.2 && bubble.position.z <= ship.position.z + 0.9) resolveBubble(bubble);
        else if (bubble.position.z > camera.position.z + 2) {
          bubble.userData.alive = false;
          if (bubble.userData.correct) requeueMissed(bubble.userData);
          scene.remove(bubble); disposeGroup(bubble);
        }
      }
```

Replace with:

```js
      for (const bubble of bubbles) {
        if (!bubble.userData.alive) continue;
        bubble.position.z += dt * 9.5 * speed;
        if (bubble.userData.meteor) bubble.userData.rock.rotation.x += dt * 1.8;
        else if (bubble.userData.orb) bubble.userData.orb.rotation.y += dt * 1.5;

        if (!bubble.userData.passed) {
          if (bubble.position.z >= ship.position.z - 0.2 && bubble.position.z <= ship.position.z + 0.9) {
            resolveBubble(bubble);
            continue;
          }
          if (bubble.position.z > ship.position.z + 0.9) {
            // Crossed the ROCKET plane uncaught — every pass-by cue fires HERE
            // (it used to fire at the camera/screen plane, half a second late).
            bubble.userData.passed = true;
            if (bubble.userData.correct) requeueMissed(bubble.userData);
            else if (!bubble.userData.meteor) sfx(playWhoosh);
          }
        } else {
          const fade = Math.max(0, 1 - (bubble.position.z - ship.position.z - 0.9) / 2.2);
          if (bubble.userData.setFade) bubble.userData.setFade(fade);
          if (bubble.position.z > camera.position.z + 2) {
            bubble.userData.alive = false;
            scene.remove(bubble); disposeGroup(bubble);
          }
        }
      }
```

`playWhoosh` already exists in `gameSfx` — add it to the import list at the top of the file.

### Upgrade 1.3 — 2026 look: renderer, ship, bubbles, starfield

Keep Three.js r128 from CDN (no npm dep, no CapsuleGeometry — it doesn't exist in r128).

**(a) Renderer + background encoding.** After `renderer.setSize(width(), height());` add:

```js
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputEncoding = THREE.sRGBEncoding;
```

And in the background loader callback, set the texture encoding:

```js
  new THREE.TextureLoader().load("/images/games/bg-space.webp", tex => {
    tex.encoding = THREE.sRGBEncoding;
    scene.background = tex;
    scene.fog = new THREE.FogExp2(0x0a1230, 0.03);
  });
```

**(b) Ship v2 — replace the ENTIRE ship construction block** (from `const ship = new THREE.Group();`
down to and including `scene.add(ship);`) with a smooth lathed hull, glass canopy, swept fins
and a live engine plume:

```js
  // ── Ship v2: one curved lathed hull (no cylinder+cone seams), glass canopy,
  //    swept fins, and a flickering additive engine plume + light. ───────────
  const ship = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0xf4f7ff, metalness: 0.6, roughness: 0.22 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xff6b57, metalness: 0.35, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c3350, metalness: 0.5, roughness: 0.6 });
  const profile = [
    [0.001, -1.65], [0.09, -1.52], [0.2, -1.18], [0.3, -0.62],
    [0.355, -0.05], [0.345, 0.42], [0.28, 0.78], [0.2, 0.95], [0.001, 0.98]
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), hullMat);
  body.rotation.x = Math.PI / 2; // lathe +y axis -> -z, nose forward
  ship.add(body);
  const noseRing = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.045, 12, 32), trimMat);
  noseRing.position.z = -0.95;
  ship.add(noseRing);
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x7fd8ff, emissive: 0x2a86c8, emissiveIntensity: 0.8, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.9 })
  );
  canopy.position.set(0, 0.26, -0.45);
  canopy.rotation.x = -0.25;
  ship.add(canopy);
  // Swept fins — verify orientation VISUALLY in the screenshot step; tweak the
  // eulers if a blade points forward instead of back.
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0); finShape.lineTo(0.14, 0.02); finShape.lineTo(0.62, 0.66);
  finShape.lineTo(0.5, 0.78); finShape.lineTo(0.05, 0.42); finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 });
  for (let i = 0; i < 3; i += 1) {
    const fin = new THREE.Mesh(finGeo, trimMat);
    const a = i * (Math.PI * 2 / 3) + Math.PI / 2;
    fin.position.set(Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0.55);
    fin.rotation.z = a - Math.PI / 2;
    fin.rotation.y = Math.PI / 2;
    ship.add(fin);
  }
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.28, 24), darkMat);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.z = 1.02;
  ship.add(nozzle);
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.0, 20, 1, true), plumeMat);
  plume.rotation.x = Math.PI / 2; // apex trails behind (+z)
  plume.position.z = 1.55;
  ship.add(plume);
  const plumeCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.65, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  plumeCore.rotation.x = Math.PI / 2;
  plumeCore.position.z = 1.4;
  ship.add(plumeCore);
  const engineLight = new THREE.PointLight(0x66ccff, 1.1, 7);
  engineLight.position.z = 1.3;
  ship.add(engineLight);
  ship.position.set(0, 1.0, 4.2);
  scene.add(ship);
```

Then in `tick()`, right after the `ship.rotation.z = ...` line, add the plume flicker:

```js
    const fl = 0.9 + Math.random() * 0.25;
    plume.scale.set(fl, 0.8 + Math.random() * 0.5, fl);
    plumeCore.scale.set(1, 0.7 + Math.random() * 0.6, 1);
    engineLight.intensity = 0.9 + Math.random() * 0.6;
```

**(c) Word bubbles v2 — glassy fresnel shells instead of flat 0.55-opacity spheres.**
Add this above `function makeBubble(...)`:

```js
  const BUBBLE_VERT = "varying vec3 vN; varying vec3 vE; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vE = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }";
  const BUBBLE_FRAG = "varying vec3 vN; varying vec3 vE; uniform vec3 uTint; uniform float uFade; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vE))), 2.0); vec3 col = mix(uTint * 0.45, vec3(0.78, 0.92, 1.0), f); gl_FragColor = vec4(col, (0.16 + 0.7 * f) * uFade); }";
  function bubbleMaterial(tintHex) {
    return new THREE.ShaderMaterial({
      uniforms: { uTint: { value: new THREE.Color(tintHex) }, uFade: { value: 1 } },
      vertexShader: BUBBLE_VERT,
      fragmentShader: BUBBLE_FRAG,
      transparent: true,
      depthWrite: false
    });
  }
```

Replace `makeBubble` entirely with:

```js
  function makeBubble(word, correct, lane, tries) {
    const group = new THREE.Group();
    const mat = bubbleMaterial(0x3f7dff);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 32), mat);
    group.add(orb);
    const glowIn = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x2b5fd0, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(glowIn);
    const sprite = labelSprite(word);
    group.add(sprite);
    group.position.set(LANES[lane], 1.05, -46);
    group.userData = {
      word, correct, lane, orb, alive: true, tries: tries || 0,
      setFade: a => { mat.uniforms.uFade.value = a; sprite.material.opacity = a; glowIn.material.opacity = 0.18 * a; }
    };
    scene.add(group);
    return group;
  }
```

In `makeMeteor`, add a fade hook to its `userData` (keep everything else):

```js
    group.userData = { meteor: true, lane, rock, alive: true,
      setFade: a => { group.scale.setScalar(0.4 + 0.6 * a); trail.material.opacity = 0.45 * a; } };
```

**(d) Parallax starfield — three depth layers.** Replace the single `starN/starGeo/stars`
block with:

```js
  const starLayers = [];
  [[500, 0.10, 0.55, 5], [300, 0.16, 0.8, 9], [120, 0.26, 1.0, 14]].forEach(([n, size, op, spd]) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 30 - 2;
      pos[i * 3 + 2] = -Math.random() * 90;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbcd2ff, size, transparent: true, opacity: op }));
    pts.userData.speed = spd;
    scene.add(pts);
    starLayers.push(pts);
  });
```

In `tick()`, replace the two `stars.position.z` lines with:

```js
    for (const layer of starLayers) {
      layer.position.z += dt * layer.userData.speed * speed * (reduceMotion ? 0.5 : 1);
      if (layer.position.z > 40) layer.position.z = 0;
    }
```

In `teardown()`, replace `disposeGroup(stars);` with
`for (const layer of starLayers) { scene.remove(layer); disposeGroup(layer); }`.

### Upgrade 1.4 — Patch the WATERMARK on `bg-space.webp` (visible bottom-right in prod screenshots)

The space backdrop still carries the generator's watermark text bottom-right (and a faint
"16:9…" mark mid-right). This alone reads as "cheap". Create `tools/patch-bg-space-watermark.mjs`:

```js
// Patch generator watermarks out of bg-space.webp by mirroring clean neighbour
// regions over them. Writes bg-space.patched.webp for eyeball approval first.
import sharp from "sharp";

const SRC = "public/images/games/bg-space.webp";
const meta = await sharp(SRC).metadata();
const W = meta.width, H = meta.height;

// Region list: [left, top, width, height] boxes that contain watermark text.
// OPEN THE IMAGE FIRST and adjust these to cover every mark you can see.
const marks = [
  [Math.round(W * 0.74), Math.round(H * 0.86), Math.round(W * 0.26), Math.round(H * 0.14)],
  [Math.round(W * 0.80), Math.round(H * 0.55), Math.round(W * 0.20), Math.round(H * 0.10)]
];

let img = sharp(SRC);
const layers = [];
for (const [left, top, width, height] of marks) {
  const srcLeft = Math.max(0, left - width); // clean region immediately to the left
  const patch = await sharp(SRC).extract({ left: srcLeft, top, width, height }).flop().blur(0.6).toBuffer();
  layers.push({ input: patch, left, top });
}
await img.composite(layers).webp({ quality: 88 }).toFile("public/images/games/bg-space.patched.webp");
console.log("Wrote bg-space.patched.webp — view it, then replace the original if clean.");
```

Run `npm ls sharp || npm i -D sharp`, then `node tools/patch-bg-space-watermark.mjs`.
View the output image yourself (Read the file), adjust the `marks` boxes until no watermark
text remains, then `cp -f` the patched file over `bg-space.webp` and delete the `.patched` one.

---

## PART 2 — LETTER LEAP (`LetterLeapGame.jsx`)

### Bug 2.1 — Bad guys float above the ground (CONFIRMED root cause)

Grumpers are drawn CENTERED on `f.y` with `ctx.drawImage(gim, -w/2, -h/2 - 4, w, h)`. The
`enemy-grumper.webp` sprite has transparent padding, so its visible feet land well above the
grass. Two-part fix: alpha-trim every sprite at load, and anchor drawing to the FEET.

**(a) Add an alpha-trim helper** (above the `CHAR_ROSTER` block):

```js
  // Crop transparent padding off a sprite once at load — padding is why enemies
  // and pals appeared to FLOAT above the ground.
  function alphaTrim(img) {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let top = c.height, left = c.width, right = 0, bottom = 0;
    for (let py = 0; py < c.height; py += 1) {
      for (let px = 0; px < c.width; px += 1) {
        if (d[(py * c.width + px) * 4 + 3] > 12) {
          if (px < left) left = px;
          if (px > right) right = px;
          if (py < top) top = py;
          if (py > bottom) bottom = py;
        }
      }
    }
    if (right <= left || bottom <= top) return img;
    const out = document.createElement("canvas");
    out.width = right - left + 1; out.height = bottom - top + 1;
    out.getContext("2d").drawImage(img, -left, -top);
    return out;
  }
```

**(b) Use it everywhere sprites load** — change `sprLoad` and the char loaders:

```js
  const sprLoad = (key, file) => { const im = new Image(); im.onload = () => { try { SPR[key] = alphaTrim(im); } catch { SPR[key] = im; } }; im.src = "/images/games/" + file; };
```

```js
  (CHAR_ROSTER[world] || []).forEach((file, i) => { const im = new Image(); im.onload = () => { try { charImgs[i] = alphaTrim(im); } catch { charImgs[i] = im; } }; im.src = "/images/games/" + file; });
```

(`alphaTrim` returns a canvas; canvases have `.width`, so the existing `im.width` checks keep working.)

### Upgrade 2.2 — Foe variety: walker, spike, hopper, flyer (feet ANCHORED to ground)

**(a) Replace foe creation** inside `makeLevel` (the old `for (let k = 0; k < foeCount; ...)`)
— exact code is in the full `makeLevel` replacement below, which uses:

```js
  function pickFoeType(worldKey, levelIndex, k) {
    const pool = ["walker", "walker", "hopper"];
    if (levelIndex >= 2) pool.push("spike");
    if (levelIndex >= 3 || worldKey !== "meadow") pool.push("flyer", "spike");
    return pool[(k * 7 + levelIndex * 3) % pool.length]; // deterministic mix, no clumping
  }
```

(Put `pickFoeType` at module scope, next to the `WORLD_THEME` constant.)

**(b) Replace the foe update block** in `update(dt)`. Find:

```js
    for (const f of level.foes) {
      f.x += f.dir * 1.5; if (f.x < f.x0 || f.x > f.x1) f.dir *= -1;
      if (Math.abs(f.x - p.x) < 28 && Math.abs(f.y - p.y) < 34) { if (p.vy > 2 && p.y < f.y - 6) { f.dead = true; p.vy = -9; sfx(playPopSound); burst(f.x, f.y, "#a0ffb0"); } else hurt(); }
    }
```

Replace with:

```js
    for (const f of level.foes) {
      f.t += dt;
      if (f.type === "walker" || f.type === "spike") {
        f.x += f.dir * (f.type === "spike" ? 1.1 : 1.5);
        if (f.x < f.x0 || f.x > f.x1) f.dir *= -1;
        f.y = f.baseY;
      } else if (f.type === "hopper") {
        f.x += f.dir * 1.2;
        if (f.x < f.x0 || f.x > f.x1) f.dir *= -1;
        const ph = f.t % 1.6;
        f.y = f.baseY - (ph < 0.8 ? Math.sin((ph / 0.8) * Math.PI) * 46 : 0);
      } else if (f.type === "flyer") {
        f.x += f.dir * 1.8;
        if (f.x < f.x0 - 40 || f.x > f.x1 + 40) f.dir *= -1;
        f.y = f.baseY - 64 + Math.sin(f.t * 2.2) * 18;
      }
      if (Math.abs(f.x - p.x) < 26 && Math.abs(f.y - p.y) < 32) {
        const stomp = p.vy > 2 && p.y < f.y - 6;
        if (stomp && f.type !== "spike") { f.dead = true; p.vy = -9; sfx(playPopSound); burst(f.x, f.y, "#a0ffb0"); addScore(5); }
        else hurt(); // spikes can NEVER be stomped — jump OVER them
      }
    }
```

**(c) Replace `grumper(f)` with a typed, bottom-anchored `drawFoe(f)`** (and update the call
site in `draw()` from `grumper(f)` to `drawFoe(f)`):

```js
  function drawFoe(f) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath(); ctx.ellipse(f.x, f.baseY + 18, 16, 5, 0, 0, 7); ctx.fill();
    const gim = SPR["foe-" + f.type] || (f.type === "walker" ? SPR.grumper : null);
    if (gim && gim.width) {
      const h = f.type === "flyer" ? 40 : 46;
      const w = gim.width / gim.height * h;
      ctx.translate(f.x, 0); ctx.scale(-f.dir, 1);
      ctx.drawImage(gim, -w / 2, f.y + 22 - h, w, h); // FEET at f.y+22 — anchored, never floats
      ctx.restore();
      return;
    }
    // Canvas fallbacks (ship these — sprites are optional polish):
    ctx.translate(f.x, f.y);
    if (f.type === "spike") {
      ctx.fillStyle = "#8a3bb8";
      for (let i = 0; i < 7; i += 1) { const a = -Math.PI + (i / 6) * Math.PI; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14 + 2); ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26 + 2); ctx.lineTo(Math.cos(a + 0.28) * 14, Math.sin(a + 0.28) * 14 + 2); ctx.closePath(); ctx.fill(); }
      const sg = ctx.createLinearGradient(0, -16, 0, 16); sg.addColorStop(0, "#b45de0"); sg.addColorStop(1, "#7a2aa8"); ctx.fillStyle = sg;
      rr(-16, -14, 32, 32, 12); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-6, -2, 4, 0, 7); ctx.arc(6, -2, 4, 0, 7); ctx.fill();
      ctx.fillStyle = "#1a0a24"; ctx.beginPath(); ctx.arc(-6 + f.dir * 2, -2, 2, 0, 7); ctx.arc(6 + f.dir * 2, -2, 2, 0, 7); ctx.fill();
    } else if (f.type === "hopper") {
      const squish = f.y === f.baseY ? 0.15 : -0.12;
      ctx.scale(1 + squish, 1 - squish);
      const hg = ctx.createLinearGradient(0, -20, 0, 18); hg.addColorStop(0, "#4aa3ff"); hg.addColorStop(1, "#1f5fd0"); ctx.fillStyle = hg;
      rr(-14, -20, 28, 38, 12); ctx.fill();
      ctx.fillStyle = "#173a6b"; rr(-13, 14, 9, 8, 3); ctx.fill(); rr(4, 14, 9, 8, 3); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-5, -8, 4.5, 0, 7); ctx.arc(6, -8, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#0a1a2e"; ctx.beginPath(); ctx.arc(-5 + f.dir * 2, -8, 2.2, 0, 7); ctx.arc(6 + f.dir * 2, -8, 2.2, 0, 7); ctx.fill();
    } else if (f.type === "flyer") {
      const flap = Math.sin(f.t * 10) * 10;
      ctx.fillStyle = "#e8a13c";
      ctx.beginPath(); ctx.ellipse(-16, -2 - flap * 0.4, 12, 6, -0.5 - flap * 0.03, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, -2 - flap * 0.4, 12, 6, 0.5 + flap * 0.03, 0, 7); ctx.fill();
      const fg = ctx.createLinearGradient(0, -14, 0, 12); fg.addColorStop(0, "#ffcf5e"); fg.addColorStop(1, "#e08b1f"); ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-5, -3, 4, 0, 7); ctx.arc(5, -3, 4, 0, 7); ctx.fill();
      ctx.fillStyle = "#2e1a05"; ctx.beginPath(); ctx.arc(-5 + f.dir * 2, -3, 2, 0, 7); ctx.arc(5 + f.dir * 2, -3, 2, 0, 7); ctx.fill();
    } else {
      const gg = ctx.createLinearGradient(0, -18, 0, 14); gg.addColorStop(0, "#ff6b57"); gg.addColorStop(1, "#c9331f"); ctx.fillStyle = gg;
      rr(-16, -16, 32, 30, 10); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-6, -4, 4.5, 0, 7); ctx.arc(6, -4, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#0a1a12"; ctx.beginPath(); ctx.arc(-6 + f.dir * 2, -4, 2.2, 0, 7); ctx.arc(6 + f.dir * 2, -4, 2.2, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
```

Optionally add `sprLoad("foe-spike", "enemy-spike.webp")` etc. — but ONLY if those webp
files exist; do not add loads for missing files.

### Upgrade 2.3 — Level design v2: ravines with hop platforms, raised letters, real decoy pressure

Root causes fixed here: (1) decoys starve because pits/foes/blocks/hearts all pull from ONE
shared `take()` slot pool before decoys get any; (2) the only platforming is one platform per
word gap and tiny 88px pits; (3) `pits` can be generated unsorted, which silently corrupts the
grass-strip rendering loop (latent bug — the new code sorts them).

**Replace the ENTIRE `makeLevel` function** with:

```js
  function shuffleArr(a) { for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function makeLevel(levelWords, worldKey, levelIndex) {
    const plats = [], bubbles = [], blocks = [], pickups = [], letterX = [];
    const pits = [], foes = [];
    const bump = { meadow: 0, dino: 2, moonwood: 4 }[worldKey] || 0;
    const hard = worldKey !== "meadow";

    let cx = 320;
    levelWords.forEach((up, wi) => {
      for (let i = 0; i < up.length; i += 1) {
        // Mid/hard worlds: every 3rd letter sits on a RAISED platform the child
        // must jump up to (a brick sits before it as a step/visual cue).
        const raised = hard && levelIndex >= 1 && i > 0 && (wi + i) % 3 === 2;
        if (raised) {
          const py = groundY() - 118;
          plats.push({ x: cx - 66, y: py, w: 132 });
          blocks.push({ x: cx - 150, y: groundY() - 60, w: 44, h: 40, type: "brick", broken: false, used: false });
          bubbles.push({ x: cx, y: py - 44, ch: up[i], word: wi, order: i, taken: false });
        } else {
          bubbles.push({ x: cx, y: groundY() - 46, ch: up[i], word: wi, order: i, taken: false });
        }
        letterX.push(cx); cx += SEG;
      }
      if (wi < levelWords.length - 1) {
        // Feature room between words: a RAVINE crossed by two staggered hop
        // platforms (mid/hard + later easy levels), else the classic platform.
        const useRavine = (hard || levelIndex >= 3) && (hard || wi % 2 === 1);
        if (useRavine) {
          const left = cx - 40, wRav = 230 + Math.min(90, levelIndex * 12);
          pits.push([left, left + wRav]);
          const hopW = 104;
          plats.push({ x: left + wRav * 0.22 - hopW / 2, y: groundY() - 92, w: hopW });
          plats.push({ x: left + wRav * 0.62 - hopW / 2, y: groundY() - 138, w: hopW });
          cx += wRav + WORD_GAP * 0.5;
        } else {
          plats.push({ x: cx - WORD_GAP * 0.5 - 60, y: groundY() - 104, w: 120 });
          cx += WORD_GAP;
        }
      }
    });
    const flag = cx + 200, L = cx + 360;

    // SEPARATE slot budgets: hazards (foes/blocks/hearts/small pits) use gap
    // midpoints; decoys get their OWN offset slots so they can no longer be
    // starved by the hazard budget — this is why levels felt empty of wrong
    // letters before.
    const hazardSlots = [], decoySlots = [];
    for (let i = 0; i < letterX.length - 1; i += 1) {
      const a = letterX[i], b = letterX[i + 1];
      if (b - a < 220) continue;
      const mid = (a + b) / 2;
      if (mid < 520 || mid > flag - 220) continue;
      if (pits.some(q => mid > q[0] - 80 && mid < q[1] + 80)) continue;
      hazardSlots.push(mid);
      decoySlots.push(mid - 92, mid + 92);
    }
    shuffleArr(hazardSlots); shuffleArr(decoySlots);

    const foeCount = 3 + Math.round(levelIndex * 0.8) + bump;
    const decoyCount = 4 + Math.round(levelIndex * 0.9) + bump;
    const blockCount = 2 + Math.round(levelIndex * 0.4);
    const heartCount = 1 + Math.round(levelIndex * 0.2);

    const inWords = new Set(levelWords.join("").toUpperCase().split(""));
    const decoyPool = "BDFGJKMPQVXZ".split("").filter(c => !inWords.has(c));

    for (let k = 0; k < decoyCount && decoyPool.length && decoySlots.length; k += 1) {
      const c = decoySlots.pop();
      bubbles.push({ x: c, y: groundY() - 46, ch: decoyPool[Math.floor(Math.random() * decoyPool.length)], word: -1, order: -1, taken: false });
    }
    for (let k = 0; k < foeCount && hazardSlots.length; k += 1) {
      const c = hazardSlots.pop();
      foes.push({
        type: pickFoeType(worldKey, levelIndex, k),
        x0: c - 70, x1: c + 70, x: c, dir: Math.random() < 0.5 ? -1 : 1,
        y: groundY() - 20, baseY: groundY() - 20, t: Math.random() * 6
      });
    }
    for (let k = 0; k < blockCount && hazardSlots.length; k += 1) {
      const c = hazardSlots.pop();
      const n = 1 + Math.floor(Math.random() * 2);
      for (let j = 0; j < n; j += 1) blocks.push({ x: c + j * 46 - 23, y: groundY() - 140, w: 44, h: 40, type: Math.random() < 0.3 ? "prize" : "brick", broken: false, used: false });
    }
    for (let k = 0; k < heartCount && hazardSlots.length; k += 1) {
      const c = hazardSlots.pop();
      pickups.push({ x: c, y: groundY() - 150, taken: false });
    }
    // Extra small pits deep in a run (levels 5+), on ground stretches only.
    const smallPits = levelIndex >= 4 ? 1 + Math.floor(levelIndex / 4) : 0;
    for (let k = 0; k < smallPits && hazardSlots.length; k += 1) {
      const c = hazardSlots.pop();
      pits.push([c - 40, c + 40]);
    }
    pits.sort((a, b) => a[0] - b[0]); // grass-strip renderer REQUIRES ascending pits

    return { L, pits, plats, blocks, pickups, bubbles, foes, flag };
  }
```

**Also patch the catch-up slide** so a re-fronted needed letter never lands over a ravine.
Find in `update(dt)`:

```js
    const need = level.bubbles.find(b => !b.taken && b.word === wIx && b.order === nextIx);
    if (need && need.x < p.x - 40) { need.x = p.x + 320; need.y = groundY() - 46; }
```

Replace with:

```js
    const need = level.bubbles.find(b => !b.taken && b.word === wIx && b.order === nextIx);
    if (need && need.x < p.x - 40) {
      let nx = p.x + 320;
      const pit = level.pits.find(q => nx > q[0] - 40 && nx < q[1] + 40);
      if (pit) nx = pit[1] + 80;
      need.x = nx; need.y = groundY() - 46;
    }
```

Physics sanity (already checked against GRAV=0.62, MOVE=4.2, JUMP=13.6 — do not change these):
jump height ≈ 149px, air distance ≈ 185px. Raised platforms at −118 are reachable from
ground; ravine hop gaps are ≤ ~130px edge-to-edge. Keep these numbers if you tweak anything.

---

## PART 3 — VERIFICATION LOOP (run until clean; never claim success without it)

1. `npm run lint` — zero errors (warnings in untouched files are fine).
2. `npm test` (`node --test tests/unit/*.test.js`) — all pass.
3. Playwright smoke: run the existing smoke suite (`npx playwright test tests/smoke`).
4. **Visual + behavioural check (mandatory, human-check rule):** start the dev server and,
   with Playwright screenshots (save to `docs/verify/arcade-round2/`):
   - Rocket Run medium: play round 1 to completion, deliberately letting 2 words pass.
     Screenshot the START of round 2 → there must be ZERO leftover word bubbles.
   - Add a temporary `console.log("cue", bubble.position.z, ship.position.z)` at the
     pass-by cue, confirm it logs z ≈ 5.1 (rocket plane, not ≈ 9.2), then REMOVE the log.
   - Screenshot the new ship + plume + fresnel bubbles; if a fin points the wrong way,
     adjust the fin eulers and re-shoot.
   - Screenshot patched `bg-space.webp` in-game: no watermark text anywhere.
   - Letter Leap medium lvl 1 and hard lvl 1: every ground foe's feet ON the grass line;
     at least one ravine with two hop platforms; ≥4 decoy letters; at least two foe types
     visible. Screenshot each.
   - Letter Leap: jump every ravine and finish one full stage (no softlock; catch-up letter
     never respawns over a pit).
5. `graphify update .`
6. Leave the screenshots in `docs/verify/arcade-round2/` for Benjamin to eyeball.

## PART 4 — HANDOFF

When (and only when) every gate above is green, give Benjamin this single command:

```bash
cd ~/Desktop/LiteracyPath && npm run lint && npm test && git add -A && git commit -m "arcade: rocket run ghost-word purge, rocket-plane audio cues, ship/bubble/starfield v2, bg watermark patch; letter leap grounded+varied foes, ravine platforming, decoy pressure" && git push
```

Production is beta-only; this change is gated and non-destructive, so straight-to-live is
approved per the live-push policy.

## ACCEPTANCE CRITERIA (all must hold)

- [ ] No word/meteor from a previous round or game ever remains on screen.
- [ ] Miss/pass audio fires exactly when a word crosses the rocket, then the word fades out.
- [ ] Ship is seam-free with animated engine plume; bubbles are glassy fresnel shells;
      three-layer parallax starfield; ACES tone mapping on; no watermark on the backdrop.
- [ ] Letter Leap ground foes stand ON the ground (sprites alpha-trimmed, feet-anchored).
- [ ] Four foe behaviours (walker/spike/hopper/flyer); spikes cannot be stomped.
- [ ] Medium/hard levels contain ravines crossed by staggered platforms, raised-platform
      letters, and ≥4 decoy letters per level (scaling up with level/world).
- [ ] No softlocks: needed letters always reachable; catch-up never drops a letter in a pit.
- [ ] Lint, unit tests, and smoke suite green; graphify updated; screenshots delivered.
