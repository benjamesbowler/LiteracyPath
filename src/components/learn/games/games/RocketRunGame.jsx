import { useEffect, useRef, useState } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playCelebrationFanfare,
  playTapSound,
  playWhoosh
} from "../../../../utils/audio/gameSfx";
import {
  buildRocketRunRound,
  rocketRunTargets,
  rocketRunStars,
  rocketRunLadder
} from "../../../../utils/rocketRunRounds.js";
import { starRubric } from "../../../../utils/starRubric.js";

// Rocket Run: a real, steer-and-collect 3D game (not an animated worksheet).
// The child flies a rocket across three lanes to catch the words that START
// with the target sound and dodge the rest. Three.js loads from a CDN at
// runtime, so it adds nothing to the app bundle and fails gracefully offline.
const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const LANES = [-2.2, 0, 2.2];
const ROUNDS_PER_GAME = 5;

function loadThree() {
  return new Promise((resolve, reject) => {
    if (window.THREE) {
      resolve(window.THREE);
      return;
    }
    const existing = document.querySelector("script[data-three-cdn]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.THREE));
      existing.addEventListener("error", () => reject(new Error("three-load-failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = THREE_SRC;
    script.async = true;
    script.dataset.threeCdn = "1";
    script.onload = () => resolve(window.THREE);
    script.onerror = () => reject(new Error("three-load-failed"));
    document.head.appendChild(script);
  });
}

function difficultyCount(difficulty) {
  return difficulty === "hard" ? 8 : difficulty === "medium" ? 6 : 5;
}

// Imperative game — kept out of React so the render stays a single container.
function startGame(THREE, mount, opts) {
  const width = () => mount.clientWidth || 640;
  const height = () => mount.clientHeight || 420;
  const count = difficultyCount(opts.difficulty);
  // Ramped, no-repeat sound targets for this difficulty (framework ladder).
  const ladder = rocketRunLadder(opts.difficulty);
  const targets = ladder.length ? ladder : rocketRunTargets();
  const sfx = fn => { if (opts.getSound ? opts.getSound() : opts.isSoundEnabled) { try { fn(); } catch { /* audio optional */ } } };
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function disposeGroup(obj) {
    if (!obj) return;
    obj.traverse(node => {
      if (node.geometry) node.geometry.dispose();
      const mats = Array.isArray(node.material) ? node.material : (node.material ? [node.material] : []);
      for (const m of mats) { if (m.map) m.map.dispose(); m.dispose(); }
    });
  }

  // ── HUD (plain DOM, cleaned up on teardown) ──────────────────────────────
  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff";
  hud.innerHTML =
    '<div style="position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:10px;background:rgba(10,16,40,.72);border:2px solid rgba(120,180,255,.35);border-radius:999px;padding:6px 16px 6px 8px">' +
    '<div data-rr="letter" style="width:48px;height:48px;display:grid;place-items:center;font-size:1.7rem;font-weight:700;border-radius:14px;color:#071033;background:linear-gradient(160deg,#ffd34e,#ffa41c);box-shadow:0 4px 0 #c9781a"></div>' +
    '<div data-rr="copy" style="font-size:1.05rem;font-weight:600"></div></div>' +
    '<div style="position:absolute;top:16px;right:16px;text-align:right">' +
    '<div data-rr="hearts" style="font-size:1.25rem;letter-spacing:2px;margin-bottom:2px">❤❤❤</div>' +
    '<div data-rr="stars" style="font-size:1.4rem;letter-spacing:2px">✩✩✩</div>' +
    '<div style="width:150px;height:12px;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden;margin-top:6px;margin-left:auto">' +
    '<i data-rr="fuel" style="display:block;height:100%;width:0%;border-radius:999px;background:linear-gradient(90deg,#3fd6a0,#23a455);transition:width .35s cubic-bezier(.2,.9,.3,1)"></i></div></div>' +
    '<button data-rr="left" aria-label="Steer left" style="position:absolute;left:0;top:80px;bottom:0;width:42%;background:transparent;border:0;pointer-events:auto"></button>' +
    '<button data-rr="right" aria-label="Steer right" style="position:absolute;right:0;top:80px;bottom:0;width:42%;background:transparent;border:0;pointer-events:auto"></button>' +
    '<div data-rr="overlay" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;background:radial-gradient(120% 90% at 50% 25%,rgba(30,44,96,.72),rgba(6,9,24,.94));pointer-events:auto"></div>';
  mount.appendChild(hud);
  const el = key => hud.querySelector('[data-rr="' + key + '"]');

  // ── Three.js scene ───────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b1e, 0.055);
  const camera = new THREE.PerspectiveCamera(62, width() / height(), 0.1, 100);
  camera.position.set(0, 2.6, 7.2);
  camera.lookAt(0, 1.1, -6);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width(), height());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.style.display = "block";
  mount.insertBefore(renderer.domElement, hud);

  scene.add(new THREE.AmbientLight(0x8899ff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 8, 6);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0x9fc0ff, 0x1a1440, 0.55));
  // Premium SNES-tier nebula backdrop (if generated); else keeps fog + starfield.
  new THREE.TextureLoader().load("/images/games/bg-space.webp", tex => {
    tex.encoding = THREE.sRGBEncoding;
    scene.background = tex;
    scene.fog = new THREE.FogExp2(0x0a1230, 0.03);
  });

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

  function pill(ctx, px, py, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + w, py, px + w, py + h, r);
    ctx.arcTo(px + w, py + h, px, py + h, r);
    ctx.arcTo(px, py + h, px, py, r);
    ctx.arcTo(px, py, px + w, py, r);
    ctx.closePath();
  }
  function labelSprite(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    // Readable dark pill behind the word so it always pops off the bubble.
    // High-res texture (512x256 / 120px) so words stay crisp as they approach.
    ctx.fillStyle = "rgba(4,10,32,0.7)";
    pill(ctx, 40, 66, 432, 124, 62);
    ctx.fill();
    ctx.font = "700 120px Fredoka, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 14;
    ctx.strokeStyle = "rgba(4,10,32,0.9)";
    ctx.strokeText(text, 256, 132);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, 256, 132);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    // Float the label in FRONT of the orb (toward the camera) and draw it on
    // top, so the semi-transparent bubble can never hide the word.
    sprite.renderOrder = 5;
    sprite.scale.set(3.2, 1.6, 1);
    sprite.position.set(0, 0, 1.2);
    return sprite;
  }
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
  function makeMeteor(lane) {
    const group = new THREE.Group();
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.6, 0),
      new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 0.95, flatShading: true, emissive: 0x2a1c14, emissiveIntensity: 0.35 })
    );
    rock.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    group.add(rock);
    const trail = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, opacity: 0.45 }));
    trail.position.set(0, 0, 0.7);
    group.add(trail);
    group.position.set(LANES[lane], 1.05, -46);
    group.userData = { meteor: true, lane, rock, alive: true,
      setFade: a => { group.scale.setScalar(0.4 + 0.6 * a); trail.material.opacity = 0.45 * a; } };
    scene.add(group);
    return group;
  }

  // ── State ────────────────────────────────────────────────────────────────
  let laneIx = 1;
  let bubbles = [];
  let queue = [];
  let spawnTimer = 0;
  let caught = 0;
  let needed = 0;
  let wrongHits = 0;
  let roundIx = Math.max(0, Math.min(Number(opts.startLevel) || 0, ROUNDS_PER_GAME - 1));
  let running = false;
  let raf = 0;
  let last = 0;
  let shakeV = 0;
  let hearts = 3;
  let elapsed = 0;
  let score = 0, caughtTotal = 0, neededTotal = 0, wrongTotal = 0, deaths = 0;
  const bursts = [];

  function setFuel() { el("fuel").style.width = Math.round(needed ? (100 * caught) / needed : 0) + "%"; }
  function addScore(n) { score += n; if (opts.onScoreUpdate) opts.onScoreUpdate(score); }
  function missCue() {
    const f = el("fuel"); if (f) { f.style.filter = "brightness(1.9)"; setTimeout(() => { f.style.filter = ""; }, 180); }
    sfx(playPopSound);
  }
  function requeueMissed(data) {
    // Catch-up: a correct word that slipped past comes back. After 2 tries it
    // returns in the ship's OWN lane (a guaranteed catch) — a word is never lost.
    const tries = (data.tries || 0) + 1;
    missCue();
    if (tries <= 2) queue.splice(Math.min(3, queue.length), 0, { word: data.word, correct: true, tries });
    else queue.splice(Math.min(1, queue.length), 0, { word: data.word, correct: true, tries, guaranteed: true });
  }
  function updateHearts() { el("hearts").textContent = "❤".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts)); }
  function loseHeart() {
    if (hearts <= 0) return;
    hearts -= 1; wrongHits += 1; updateHearts(); sfx(playSoftBuzz); shakeV = 0.55;
    if (hearts <= 0) { deaths += 1; endRound(); }
  }

  function startRound() {
    const target = targets[roundIx % targets.length]; // walk the ramped ladder, no repeats
    const round = buildRocketRunRound(target, { count, difficulty: opts.difficulty });
    el("letter").textContent = target;
    el("copy").innerHTML = "Catch the <b>" + target + "</b> words!";
    const seq = round.sequence.map(item => ({ word: item.word, correct: item.correct }));
    // Interleave meteors to dodge — more the deeper you get.
    const meteorCount = 2 + roundIx;
    for (let i = 0; i < meteorCount; i += 1) seq.splice(Math.floor(Math.random() * (seq.length + 1)), 0, { meteor: true });
    queue = seq;
    needed = round.needed;
    caught = 0;
    wrongHits = 0;
    hearts = 3;
    bubbles = [];
    spawnTimer = 0.3;
    running = true;
    setFuel();
    updateHearts();
    if (opts.onProgressUpdate) opts.onProgressUpdate(roundIx, ROUNDS_PER_GAME);
    if (opts.onCheckpoint) opts.onCheckpoint(roundIx, ROUNDS_PER_GAME);
  }

  function moveLane(dir) {
    if (!running) return;
    const next = Math.max(0, Math.min(2, laneIx + dir));
    if (next !== laneIx) { laneIx = next; sfx(playTapSound); }
  }

  function burst(position, color) {
    if (reduceMotion) return;
    const n = 14;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) { pos[i * 3] = position.x; pos[i * 3 + 1] = position.y; pos[i * 3 + 2] = position.z; }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.32, transparent: true, opacity: 1 }));
    const vel = [];
    for (let i = 0; i < n; i += 1) vel.push(new THREE.Vector3((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, (Math.random() - 0.3) * 6));
    scene.add(points);
    bursts.push({ points, vel, life: 0.6, geo });
  }

  function resolveBubble(bubble) {
    bubble.userData.alive = false;
    const hit = bubble.userData.lane === laneIx;
    if (bubble.userData.meteor) {
      if (hit) { loseHeart(); burst(bubble.position, 0xff7a66); }
      scene.remove(bubble); disposeGroup(bubble);
      return;
    }
    if (hit && bubble.userData.correct) {
      caught += 1;
      addScore(opts.difficulty === "hard" ? 15 : 10);
      setFuel();
      sfx(playCorrectChime);
      sfx(playPopSound);
      burst(bubble.position, 0x8affc0);
    } else if (hit && !bubble.userData.correct) {
      wrongHits += 1;
      sfx(playSoftBuzz);
      burst(bubble.position, 0xff7a66);
      shakeV = 0.35;
    }
    scene.remove(bubble); disposeGroup(bubble);
    if (caught >= needed) endRound();
  }

  function showOverlay(html) {
    const overlay = el("overlay");
    overlay.innerHTML = html;
    overlay.style.display = "grid";
    return overlay;
  }

  function clearField() {
    // Remove every in-flight bubble/meteor from the SCENE, not just the array —
    // this is what used to leave frozen "ghost" words behind between rounds.
    for (const b of bubbles) { b.userData.alive = false; scene.remove(b); disposeGroup(b); }
    bubbles = [];
    queue = [];
  }

  function endRound() {
    running = false;
    clearField();
    caughtTotal += caught; neededTotal += needed; wrongTotal += wrongHits;
    const stars = rocketRunStars(caught, needed, wrongHits);
    el("stars").textContent = "★".repeat(stars) + "✩".repeat(3 - stars);
    sfx(playStarChime);
    roundIx += 1;
    if (roundIx >= ROUNDS_PER_GAME) {
      finishGame();
      return;
    }
    const overlay = showOverlay(
      '<div><div style="font-size:2rem;font-weight:700;margin-bottom:8px">Planet reached!</div>' +
      '<button data-rr="next" style="font-family:inherit;font-weight:700;font-size:1.2rem;color:#071033;padding:14px 30px;border:0;border-radius:999px;background:linear-gradient(160deg,#ffd34e,#ffa41c);box-shadow:0 6px 0 #c9781a;cursor:pointer">Next sound →</button></div>'
    );
    overlay.querySelector('[data-rr="next"]').addEventListener("click", () => {
      overlay.style.display = "none";
      startRound();
    });
  }

  function finishGame() {
    sfx(playCelebrationFanfare);
    const stars = starRubric({ correct: caughtTotal, total: neededTotal, mistakes: wrongTotal, deaths });
    showOverlay('<div><div style="font-size:2rem;font-weight:700">Mission complete!</div><div style="opacity:.85;margin-top:8px;font-size:1.6rem">' + "★".repeat(stars) + "✩".repeat(3 - stars) + '</div></div>');
    if (opts.onProgressUpdate) opts.onProgressUpdate(ROUNDS_PER_GAME, ROUNDS_PER_GAME);
    if (opts.onComplete) opts.onComplete(stars, score, caughtTotal);
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  const onLeft = () => moveLane(-1);
  const onRight = () => moveLane(1);
  el("left").addEventListener("pointerdown", onLeft);
  el("right").addEventListener("pointerdown", onRight);
  const onKey = event => {
    if (event.key === "ArrowLeft") moveLane(-1);
    else if (event.key === "ArrowRight") moveLane(1);
  };
  window.addEventListener("keydown", onKey);
  let dragX = null;
  const onDown = event => { dragX = event.clientX; };
  const onUp = event => {
    if (dragX == null) return;
    const dx = event.clientX - dragX;
    if (Math.abs(dx) > 40) moveLane(dx > 0 ? 1 : -1);
    dragX = null;
  };
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);

  const onResize = () => {
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height());
  };
  window.addEventListener("resize", onResize);
  const ro = new ResizeObserver(onResize); ro.observe(mount);

  // ── Loop ─────────────────────────────────────────────────────────────────
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, ((now - last) || 16) / 1000);
    last = now;
    elapsed += dt;
    const speed = 1 + roundIx * 0.22 + Math.min(0.7, elapsed * 0.006); // faster deeper in + over time
    for (const layer of starLayers) {
      layer.position.z += dt * layer.userData.speed * speed * (reduceMotion ? 0.5 : 1);
      if (layer.position.z > 40) layer.position.z = 0;
    }
    ship.position.x += (LANES[laneIx] - ship.position.x) * Math.min(1, dt * 12);
    ship.rotation.z = (LANES[laneIx] - ship.position.x) * -0.25;
    const fl = 0.9 + Math.random() * 0.25;
    plume.scale.set(fl, 0.8 + Math.random() * 0.5, fl);
    plumeCore.scale.set(1, 0.7 + Math.random() * 0.6, 1);
    engineLight.intensity = 0.9 + Math.random() * 0.6;

    if (running) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && queue.length) {
        const item = queue.shift();
        bubbles.push(item.meteor ? makeMeteor(Math.floor(Math.random() * 3)) : makeBubble(item.word, item.correct, item.guaranteed ? laneIx : Math.floor(Math.random() * 3), item.tries));
        spawnTimer = 1.15 / speed;
      }
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
      bubbles = bubbles.filter(bubble => bubble.userData.alive);
      if (!queue.length && !bubbles.length && caught < needed) endRound();
    }

    for (const item of bursts) {
      item.life -= dt;
      const pos = item.geo.attributes.position.array;
      for (let i = 0; i < item.vel.length; i += 1) {
        pos[i * 3] += item.vel[i].x * dt;
        pos[i * 3 + 1] += item.vel[i].y * dt;
        pos[i * 3 + 2] += item.vel[i].z * dt;
      }
      item.geo.attributes.position.needsUpdate = true;
      item.points.material.opacity = Math.max(0, item.life / 0.6);
      if (item.life <= 0) scene.remove(item.points);
    }
    for (let i = bursts.length - 1; i >= 0; i -= 1) if (bursts[i].life <= 0) bursts.splice(i, 1);

    if (!reduceMotion && shakeV > 0) { camera.position.x = Math.sin(now * 0.08) * shakeV; shakeV = Math.max(0, shakeV - dt * 1.2); } else { camera.position.x *= 0.8; }
    renderer.render(scene, camera);
  }
  startRound();
  raf = requestAnimationFrame(tick);

  let paused = false, savedRunning = false;
  function pause() { if (paused) return; paused = true; savedRunning = running; running = false; }
  function resume() { if (!paused) return; paused = false; last = performance.now(); if (savedRunning) running = true; }
  function teardown() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    ro.disconnect();
    for (const b of bubbles) { scene.remove(b); disposeGroup(b); }
    disposeGroup(ship);
    for (const layer of starLayers) { scene.remove(layer); disposeGroup(layer); }
    try { renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); } catch { /* ignore */ }
    if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    if (hud.parentNode) hud.parentNode.removeChild(hud);
  }
  return { teardown, pause, resume };
}

export default function RocketRunGame({ difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const soundRef = useRef(isSoundEnabled);
  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);

  // Re-create the game only when difficulty changes. The parent's callbacks are
  // captured once at start-up on purpose - re-running on their identity change
  // would destroy and rebuild the whole 3D scene on every render.
  useEffect(() => {
    let cancelled = false;
    let api = { teardown() {} };
    loadThree()
      .then(THREE => {
        if (cancelled || !mountRef.current || !THREE) return;
        setStatus("playing");
        api = startGame(THREE, mountRef.current, { difficulty, startLevel, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, getSound: () => soundRef.current });
        if (onEngineReady) onEngineReady(api);
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => {
      cancelled = true;
      try { api.teardown(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div
      className="rocket-run"
      ref={mountRef}
      style={{ position: "relative", width: "100%", height: "100%", minHeight: "420px", borderRadius: "20px", overflow: "hidden", background: "#070b1e" }}
    >
      {status === "loading" && (
        <div className="rocket-run-status" style={statusStyle}>Loading the launchpad…</div>
      )}
      {status === "error" && (
        <div className="rocket-run-status" style={statusStyle}>This game needs 3D graphics — try another game!</div>
      )}
    </div>
  );
}

const statusStyle = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  color: "#dce6ff",
  fontFamily: "var(--kid-font-display, Fredoka, sans-serif)",
  fontSize: "1.2rem"
};
