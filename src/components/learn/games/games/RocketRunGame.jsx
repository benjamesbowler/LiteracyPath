import { useEffect, useRef, useState } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playCelebrationFanfare,
  playTapSound
} from "../../../../utils/audio/gameSfx";
import {
  buildRocketRunRound,
  rocketRunTargets,
  rocketRunStars
} from "../../../../utils/rocketRunRounds.js";

// Rocket Run: a real, steer-and-collect 3D game (not an animated worksheet).
// The child flies a rocket across three lanes to catch the words that START
// with the target sound and dodge the rest. Three.js loads from a CDN at
// runtime, so it adds nothing to the app bundle and fails gracefully offline.
const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const LANES = [-2.2, 0, 2.2];
const ROUNDS_PER_GAME = 3;

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
  const targets = rocketRunTargets();
  const sfx = fn => { if (opts.isSoundEnabled) { try { fn(); } catch { /* audio optional */ } } };

  // ── HUD (plain DOM, cleaned up on teardown) ──────────────────────────────
  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff";
  hud.innerHTML =
    '<div style="position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:10px;background:rgba(10,16,40,.72);border:2px solid rgba(120,180,255,.35);border-radius:999px;padding:6px 16px 6px 8px">' +
    '<div data-rr="letter" style="width:48px;height:48px;display:grid;place-items:center;font-size:1.7rem;font-weight:700;border-radius:14px;color:#071033;background:linear-gradient(160deg,#ffd34e,#ffa41c);box-shadow:0 4px 0 #c9781a"></div>' +
    '<div data-rr="copy" style="font-size:1.05rem;font-weight:600"></div></div>' +
    '<div style="position:absolute;top:16px;right:16px;text-align:right">' +
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
  renderer.domElement.style.display = "block";
  mount.insertBefore(renderer.domElement, hud);

  scene.add(new THREE.AmbientLight(0x8899ff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 8, 6);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0x9fc0ff, 0x1a1440, 0.55));
  // Premium SNES-tier nebula backdrop (if generated); else keeps fog + starfield.
  new THREE.TextureLoader().load("/images/games/bg-space.webp", tex => { scene.background = tex; scene.fog = new THREE.FogExp2(0x0a1230, 0.03); });

  const starN = 800;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i += 1) {
    starPos[i * 3] = (Math.random() - 0.5) * 60;
    starPos[i * 3 + 1] = Math.random() * 30 - 2;
    starPos[i * 3 + 2] = -Math.random() * 90;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xbcd2ff, size: 0.14, transparent: true, opacity: 0.9 }));
  scene.add(stars);

  const ship = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1.5, 20),
    new THREE.MeshStandardMaterial({ color: 0xffd34e, metalness: 0.3, roughness: 0.35, emissive: 0x5a3a00, emissiveIntensity: 0.3 })
  );
  body.rotation.x = Math.PI * -0.5;
  ship.add(body);
  const finMat = new THREE.MeshStandardMaterial({ color: 0xff6b57, roughness: 0.5 });
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.5), finMat);
    fin.position.set(side * 0.42, -0.1, 0.45);
    ship.add(fin);
  }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshBasicMaterial({ color: 0x59d3ff, transparent: true, opacity: 0.8 }));
  glow.position.set(0, 0, 0.9);
  ship.add(glow);
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
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    // Readable dark pill behind the word so it always pops off the bubble.
    ctx.fillStyle = "rgba(4,10,32,0.66)";
    pill(ctx, 20, 33, 216, 62, 31);
    ctx.fill();
    ctx.font = "700 62px Fredoka, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(4,10,32,0.9)";
    ctx.strokeText(text, 128, 66);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, 128, 66);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    // Float the label in FRONT of the orb (toward the camera) and draw it on
    // top, so the semi-transparent bubble can never hide the word.
    sprite.renderOrder = 5;
    sprite.scale.set(2.6, 1.3, 1);
    sprite.position.set(0, 0, 1.2);
    return sprite;
  }
  function makeBubble(word, correct, lane) {
    const group = new THREE.Group();
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x2b5fd0, emissive: 0x1b3f9a, emissiveIntensity: 0.5, metalness: 0.1, roughness: 0.25, transparent: true, opacity: 0.55 })
    );
    group.add(orb);
    group.add(labelSprite(word));
    group.position.set(LANES[lane], 1.05, -46);
    group.userData = { word, correct, lane, orb, alive: true };
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
  let totalStars = 0;
  let roundIx = 0;
  let running = false;
  let raf = 0;
  let last = 0;
  let shakeV = 0;
  const bursts = [];

  function setFuel() { el("fuel").style.width = Math.round(needed ? (100 * caught) / needed : 0) + "%"; }

  function startRound() {
    const target = targets[Math.floor(Math.random() * targets.length)];
    const round = buildRocketRunRound(target, { count });
    el("letter").textContent = target;
    el("copy").innerHTML = "Catch the <b>" + target + "</b> words!";
    queue = round.sequence.map(item => ({ word: item.word, correct: item.correct }));
    needed = round.needed;
    caught = 0;
    wrongHits = 0;
    bubbles = [];
    spawnTimer = 0.3;
    running = true;
    setFuel();
    if (opts.onProgressUpdate) opts.onProgressUpdate(roundIx, ROUNDS_PER_GAME);
  }

  function moveLane(dir) {
    if (!running) return;
    const next = Math.max(0, Math.min(2, laneIx + dir));
    if (next !== laneIx) { laneIx = next; sfx(playTapSound); }
  }

  function burst(position, color) {
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
    if (hit && bubble.userData.correct) {
      caught += 1;
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
    scene.remove(bubble);
    if (caught >= needed) endRound();
  }

  function showOverlay(html) {
    const overlay = el("overlay");
    overlay.innerHTML = html;
    overlay.style.display = "grid";
    return overlay;
  }

  function endRound() {
    running = false;
    const stars = rocketRunStars(caught, needed, wrongHits);
    totalStars += stars;
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
    const avg = Math.round(totalStars / ROUNDS_PER_GAME) || (totalStars > 0 ? 1 : 0);
    showOverlay('<div><div style="font-size:2rem;font-weight:700">Mission complete!</div><div style="opacity:.85;margin-top:8px;font-size:1.6rem">' + "★".repeat(Math.max(1, avg)) + "✩".repeat(3 - Math.max(1, avg)) + '</div></div>');
    if (opts.onProgressUpdate) opts.onProgressUpdate(ROUNDS_PER_GAME, ROUNDS_PER_GAME);
    if (opts.onComplete) opts.onComplete(Math.max(1, avg), totalStars * 10, needed * ROUNDS_PER_GAME);
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

  // ── Loop ─────────────────────────────────────────────────────────────────
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, ((now - last) || 16) / 1000);
    last = now;
    stars.position.z += dt * 8;
    if (stars.position.z > 40) stars.position.z = 0;
    ship.position.x += (LANES[laneIx] - ship.position.x) * Math.min(1, dt * 12);
    ship.rotation.z = (LANES[laneIx] - ship.position.x) * -0.25;

    if (running) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && queue.length) {
        const item = queue.shift();
        bubbles.push(makeBubble(item.word, item.correct, Math.floor(Math.random() * 3)));
        spawnTimer = 1.15;
      }
      for (const bubble of bubbles) {
        if (!bubble.userData.alive) continue;
        bubble.position.z += dt * 9.5;
        bubble.userData.orb.rotation.y += dt * 1.5;
        if (bubble.position.z >= ship.position.z - 0.2 && bubble.position.z <= ship.position.z + 0.9) resolveBubble(bubble);
        else if (bubble.position.z > camera.position.z + 2) { bubble.userData.alive = false; scene.remove(bubble); }
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

    if (shakeV > 0) { camera.position.x = Math.sin(now * 0.08) * shakeV; shakeV = Math.max(0, shakeV - dt * 1.2); } else { camera.position.x *= 0.8; }
    renderer.render(scene, camera);
  }
  startRound();
  raf = requestAnimationFrame(tick);

  return function teardown() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    try { renderer.dispose(); } catch { /* ignore */ }
    if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    if (hud.parentNode) hud.parentNode.removeChild(hud);
  };
}

export default function RocketRunGame({ difficulty = "easy", onProgressUpdate, onComplete, isSoundEnabled = true }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState("loading");

  // Re-create the game only when difficulty changes. The parent's callbacks are
  // captured once at start-up on purpose - re-running on their identity change
  // would destroy and rebuild the whole 3D scene on every render.
  useEffect(() => {
    let cancelled = false;
    let teardown = () => {};
    loadThree()
      .then(THREE => {
        if (cancelled || !mountRef.current || !THREE) return;
        setStatus("playing");
        teardown = startGame(THREE, mountRef.current, { difficulty, onProgressUpdate, onComplete, isSoundEnabled });
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => {
      cancelled = true;
      try { teardown(); } catch { /* ignore */ }
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
