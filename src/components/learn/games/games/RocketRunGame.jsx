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
import { speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { onsetGrapheme } from "../../../elQuest/elQuestEngine.js";
import {
  loadThree,
  createRenderer,
  createScene,
  createPerspectiveCamera,
  attachResize,
  createFrameLoop,
  attachContextLossGuard,
  attachSteerZones,
  attachSwipeSteer,
  prefersReducedMotion,
  detectQualityTier,
  applyQualityTier,
  shadowMapForTier,
  particleCountForTier,
  QUALITY_TIERS,
  hasSeenOnboarding,
  markOnboardingSeen,
  disposeRenderer,
  disposeObject as disposeGroup,
  setTextureSrgb
} from "../shared/threeShell.js";
import {
  createOwnedModelInstance,
  disposeOwnedModelInstance
} from "../shared/premiumGameAssets.js";
import {
  hasCompletePremiumSetpieceSet,
  laneDirectionForKey,
  premiumSetpieceBudget
} from "../shared/premiumGameStandard.js";
import { createArcadePremiumRenderPipeline } from "../shared/arcadePremiumRender.js";

// Rocket Run: a real, steer-and-collect 3D game (not an animated worksheet).
// The child flies a rocket across three lanes to catch the words that START
// with the target sound and dodge the rest. The shared 3D shell resolves the
// same bundled Three.js module as the other 3D games, so it remains offline
// without downloading a second legacy runtime.
const LANES = [-2.2, 0, 2.2];
const ROUNDS_PER_GAME = 8;
const SHIP_BASE_SCALE = 0.74;
const CAMERA_FOV = 66;
const BOOST_FOV = 78;

// CC0 KayKit scenery already ships in the owned runtime library. Rocket Run
// uses it as environmental storytelling rather than a collision surface, so a
// late or failed model load can never block the literacy mechanic. The
// procedural corridor below remains the low-tier and load-failure fallback.
const OWNED_SPACE_SETPIECES = Object.freeze([
  { url: "/models/library/kaykit/space/models/basemodule_A.gltf", height: 2.9 },
  { url: "/models/library/kaykit/space/models/cargodepot_A.gltf", height: 2.5 },
  { url: "/models/library/kaykit/space/models/lander_A.gltf", height: 2.7 },
  { url: "/models/library/kaykit/space/models/drill_structure.gltf", height: 3.8 },
  { url: "/models/library/kaykit/space/models/windturbine_tall.gltf", height: 4.4 },
  { url: "/models/library/kaykit/space/models/cargo_A_stacked.gltf", height: 1.8 }
]);

// Each round flies through a themed sector (Wipeout-style). Fog + ambient tint
// tween in per round, and meteorMul scales the asteroid pressure.
// Each sector gets a distinct dominant hue so the worlds actually look different,
// not just differently-tinted fog: star colour, lane-rail colour, and a big
// backdrop "sun"/nebula glow are all recoloured per theme (set in startRound).
const ROUND_THEMES = [
  { name: "Deep Space",    fog: 0x0a1230, ambient: 0x8899ff, meteorMul: 1.0, star: 0xbcd2ff, rail: 0x3fd6ff, sun: 0x2a3a8a, deck: 0x17245a, pad: 0x55e9ff },
  { name: "Asteroid Belt", fog: 0x171008, ambient: 0xffc08a, meteorMul: 2.2, star: 0xffd9a0, rail: 0xff9a3c, sun: 0x8a5a1c, deck: 0x3a2719, pad: 0xffb14a },
  { name: "Nebula Storm",  fog: 0x1a0a2e, ambient: 0xc09aff, meteorMul: 1.3, star: 0xe6c0ff, rail: 0xb06bff, sun: 0x6a2ab0, deck: 0x2b174f, pad: 0xd17cff },
  { name: "Ice Field",     fog: 0x0a1a26, ambient: 0x9fe0ff, meteorMul: 1.6, star: 0xd6f4ff, rail: 0x59d3ff, sun: 0x2a7aa8, deck: 0x17374a, pad: 0x8cf1ff },
  { name: "Red Giant",     fog: 0x260c08, ambient: 0xff9a7a, meteorMul: 1.8, star: 0xffc0a8, rail: 0xff5a3c, sun: 0xc8321c, deck: 0x4c1710, pad: 0xff6f3f },
  { name: "Dark Rift",     fog: 0x05060f, ambient: 0x6677cc, meteorMul: 2.0, star: 0x9fb0ff, rail: 0x5566cc, sun: 0x1a2050, deck: 0x111735, pad: 0x6a78ff },
  { name: "Star Nursery",  fog: 0x201a08, ambient: 0xffe09a, meteorMul: 1.5, star: 0xfff0c0, rail: 0xffcf4a, sun: 0xc89a2a, deck: 0x473614, pad: 0xffdd67 },
  { name: "Comet Chase",   fog: 0x0a1230, ambient: 0xaaccff, meteorMul: 2.6, star: 0xcfe6ff, rail: 0x7fd8ff, sun: 0x3a5aa8, deck: 0x182e5f, pad: 0xa5e8ff }
];

function difficultyCount(difficulty) {
  // Five deliberate catches is enough evidence for an entry reader. The old
  // eight-word easy round became a reaction endurance test and hid the phonics.
  return difficulty === "hard" ? 12 : difficulty === "medium" ? 9 : 5;
}

// Imperative game — kept out of React so the render stays a single container.
function startGame(THREE, mount, opts) {
  const width = () => mount.clientWidth || 640;
  const height = () => mount.clientHeight || 420;
  const laneSpread = () => {
    const aspect = width() / Math.max(1, height());
    if (aspect < 0.58) return 0.72;
    if (aspect < 0.78) return 0.84;
    return 1;
  };
  const laneX = lane => LANES[lane] * laneSpread();
  const count = difficultyCount(opts.difficulty);
  // Ramped, no-repeat sound targets for this difficulty (framework ladder).
  const ladder = rocketRunLadder(opts.difficulty);
  const targets = ladder.length ? ladder : rocketRunTargets();
  const sfx = fn => { if (opts.getSound ? opts.getSound() : opts.isSoundEnabled) { try { fn(); } catch { /* audio optional */ } } };
  // Speech rides the same live sound gate as sfx and is purely additive —
  // with sound off nothing is spoken and the game stays fully playable.
  const say = fn => { if (opts.getSound ? opts.getSound() : opts.isSoundEnabled) { try { fn(); } catch { /* speech optional */ } } };
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  let reduceMotion = motionQuery?.matches ?? prefersReducedMotion();
  // Hardware quality tier: scales the DPR cap, shadow mode and particle counts
  // so weak devices get a lighter scene instead of a stuttery one.
  let qualityTier = detectQualityTier();
  function makeNebulaTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#050716");
    bg.addColorStop(0.48, "#10143d");
    bg.addColorStop(1, "#02040c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const clouds = [
      ["rgba(65, 214, 255, 0.38)", 220, 300, 260, 120],
      ["rgba(168, 88, 255, 0.34)", 720, 170, 320, 150],
      ["rgba(255, 171, 74, 0.18)", 840, 360, 250, 100],
      ["rgba(33, 77, 176, 0.42)", 420, 210, 420, 170]
    ];
    for (const [color, x, y, rx, ry] of clouds) {
      const g = ctx.createRadialGradient(x, y, 8, x, y, Math.max(rx, ry));
      g.addColorStop(0, color);
      g.addColorStop(0.52, color.replace(/0\.\d+\)/, "0.14)"));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 0.82;
    for (let i = 0; i < 320; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.78;
      const s = Math.random() < 0.18 ? 2 : 1;
      ctx.fillStyle = Math.random() < 0.12 ? "#8ff6ff" : "#ffffff";
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(canvas);
    setTextureSrgb(THREE, tex);
    tex.needsUpdate = true;
    return tex;
  }
  function makeGlowTexture(colorA, colorB) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 126);
    g.addColorStop(0, colorA);
    g.addColorStop(0.45, colorB);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  function makeTrackPanelTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const base = ctx.createLinearGradient(0, 0, 256, 256);
    base.addColorStop(0, "#172252");
    base.addColorStop(0.52, "#0a102a");
    base.addColorStop(1, "#1b2d64");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);

    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = "#8feeff";
    ctx.lineWidth = 2;
    for (let i = -256; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 96, 256);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.32;
    ctx.fillStyle = "#ffe36a";
    for (let y = 18; y < 256; y += 64) {
      for (let x = 28; x < 228; x += 56) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20, y + 16);
        ctx.lineTo(x, y + 32);
        ctx.lineTo(x + 8, y + 16);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 320; i += 1) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  // ── Three.js scene + renderer FIRST. WebGLRenderer creation is the one step
  //    that can throw (WebGL unavailable / GPU context lost / antialias rejected
  //    on a constrained GPU). Doing it before the HUD means a failure produces a
  //    clean error instead of an orphaned HUD sitting behind the fallback text,
  //    and we retry once without antialias before giving up. ─────────────────
  const scene = createScene(THREE, new THREE.FogExp2(0x070b1e, 0.055));
  const camera = createPerspectiveCamera(THREE, {
    fov: CAMERA_FOV,
    aspect: width() / height(),
    near: 0.1,
    far: 100,
    position: [0, 2.65, 8.35],
    lookAt: [0, 1.1, -6]
  });
  const renderer = createRenderer(THREE, {
    antialias: true,
    powerPreference: "default",
    pixelRatioCap: QUALITY_TIERS[qualityTier].pixelRatioCap,
    srgbOutput: true,
    toneMappingExposure: 1.12,
    shadowMap: shadowMapForTier(qualityTier, "pcf")
  });
  applyQualityTier(renderer, qualityTier);
  renderer.setSize(width(), height());
  renderer.domElement.style.display = "block";
  renderer.domElement.style.filter = "saturate(1.04)";
  mount.appendChild(renderer.domElement);

  // ── HUD (plain DOM, cleaned up on teardown) ──────────────────────────────
  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.55)";
  hud.innerHTML =
    '<div data-rr="lens" style="position:absolute;inset:0;opacity:.16;background:linear-gradient(180deg,rgba(130,218,255,.12),transparent 24%,transparent 76%,rgba(5,8,24,.45));mix-blend-mode:soft-light"></div>' +
    '<div style="position:absolute;top:12px;left:14px;display:flex;align-items:stretch;gap:10px;filter:drop-shadow(0 10px 18px rgba(0,0,0,.32))">' +
    '<button type="button" data-rr="hear-target" aria-label="Hear the target sound again" title="Hear target sound" style="position:relative;width:62px;height:56px;display:grid;place-items:center;padding:0;font:inherit;color:#071033;background:linear-gradient(160deg,#ffe879,#ff9f24);clip-path:polygon(10% 0,100% 0,90% 100%,0 100%);border:1px solid rgba(255,255,255,.8);box-shadow:inset 0 0 0 2px rgba(255,255,255,.22);pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;outline-offset:3px"><span data-rr="letter" style="font-size:2rem;font-weight:900;line-height:1"></span><svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" style="position:absolute;right:8px;bottom:5px;opacity:.72"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Zm11.5-.7v7.4a4.5 4.5 0 0 0 0-7.4Zm0-3.3v2.1a7 7 0 0 1 0 9.8V19a9 9 0 0 0 0-14Z"/></svg></button>' +
    '<div style="min-width:210px;padding:7px 18px 8px 14px;background:linear-gradient(90deg,rgba(7,12,32,.9),rgba(15,35,78,.72));border:1px solid rgba(126,232,255,.46);clip-path:polygon(0 0,94% 0,100% 50%,94% 100%,0 100%)">' +
    '<div style="font-size:.62rem;font-weight:900;letter-spacing:.18em;color:#7ff0ff;text-transform:uppercase">Beginning sound</div>' +
    '<div data-rr="copy" style="font-size:1.05rem;font-weight:800;line-height:1.1"></div>' +
    '</div>' +
    '<div data-rr="combo" style="display:none;align-self:center;padding:8px 12px;font-size:1.2rem;font-weight:900;color:#071033;background:linear-gradient(160deg,#8ff6ff,#55d4ff);clip-path:polygon(12% 0,100% 0,88% 100%,0 100%);text-shadow:none;transition:transform .12s cubic-bezier(.2,.9,.3,1)">x2</div></div>' +
    '<div style="position:absolute;top:13px;right:14px;text-align:right;display:grid;gap:6px;justify-items:end">' +
    '<div style="padding:7px 14px;background:linear-gradient(90deg,rgba(7,12,32,.75),rgba(22,41,74,.9));border:1px solid rgba(126,232,255,.36);clip-path:polygon(8% 0,100% 0,100% 100%,0 100%)">' +
    '<div style="font-size:.62rem;font-weight:900;letter-spacing:.16em;color:#7ff0ff;text-transform:uppercase">Shield</div>' +
    '<div data-rr="hearts" style="font-size:1.12rem;letter-spacing:2px">❤❤❤</div></div>' +
    '<div data-rr="stars" style="font-size:1.34rem;letter-spacing:2px">✩✩✩</div>' +
    '<div style="width:176px;height:14px;border:1px solid rgba(255,255,255,.34);background:rgba(255,255,255,.12);overflow:hidden;clip-path:polygon(8% 0,100% 0,92% 100%,0 100%)">' +
    '<i data-rr="fuel" style="display:block;height:100%;width:0%;background:linear-gradient(90deg,#55f0ca,#f4dd57,#ff804d);transition:width .35s cubic-bezier(.2,.9,.3,1)"></i></div></div>' +
    '<button data-rr="left" aria-label="Steer left" style="position:absolute;left:0;top:80px;bottom:0;width:42%;background:transparent;border:0;pointer-events:auto"></button>' +
    '<button data-rr="right" aria-label="Steer right" style="position:absolute;right:0;top:80px;bottom:0;width:42%;background:transparent;border:0;pointer-events:auto"></button>' +
    '<div data-rr="reticle" style="position:absolute;left:50%;top:58%;width:72px;height:28px;transform:translate(-50%,-50%);opacity:.38;border-left:2px solid #7ff0ff;border-right:2px solid #7ff0ff;border-radius:50%;box-shadow:0 0 18px rgba(127,240,255,.42)"></div>' +
    '<div data-rr="banner" style="position:absolute;top:34%;left:0;right:0;text-align:center;pointer-events:none;font-weight:900;font-size:clamp(1.3rem,5vw,2.4rem);letter-spacing:.12em;text-transform:uppercase;color:#eaf2ff;text-shadow:0 3px 18px rgba(0,0,0,.75),0 0 22px rgba(127,240,255,.45);opacity:0;transition:opacity .3s ease,transform .3s ease;transform:translateX(-40px)"></div>' +
    '<div data-rr="countdown" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;pointer-events:none;background:radial-gradient(120% 90% at 50% 42%,rgba(10,16,40,.6),rgba(6,9,24,.25))"></div>' +
    '<div data-rr="overlay" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;background:radial-gradient(120% 90% at 50% 25%,rgba(30,44,96,.72),rgba(6,9,24,.94));pointer-events:auto"></div>';
  mount.appendChild(hud);
  const el = key => hud.querySelector('[data-rr="' + key + '"]');
  let bannerT = 0;
  function showBanner(text, seconds = 1.2) {
    const b = el("banner"); if (!b) return;
    b.textContent = text;
    b.style.opacity = "1"; b.style.transform = "translateX(0)";
    bannerT = seconds;
  }
  // Start-of-round "get ready" popup: the target letter, big, plus a 3-2-1 count.
  // Spawning is gated on running=false until the countdown flips it true (in tick).
  function showCountdown(target) {
    const cd = el("countdown"); if (!cd) return;
    // One-time steering hint, shown during the session's first countdown only.
    const steerHint = steeringHintShown ? "" :
      '<div style="margin-top:16px;font-size:.95rem;font-weight:700;color:#bfe6ff;opacity:.92">Tap the sides or use the arrow keys to steer</div>';
    steeringHintShown = true;
    cd.innerHTML =
      '<div>' +
      '<div style="font-size:.78rem;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#7ff0ff;margin-bottom:12px">Find words beginning with</div>' +
      '<div style="width:136px;height:120px;margin:0 auto;display:grid;place-items:center;font-size:5rem;font-weight:900;color:#071033;background:linear-gradient(160deg,#ffe879,#ff9f24);clip-path:polygon(10% 0,100% 0,90% 100%,0 100%);box-shadow:0 10px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.28)">' + target + '</div>' +
      '<div data-rr="cd-num" style="font-size:3.6rem;font-weight:900;margin-top:18px;letter-spacing:.08em;text-shadow:0 3px 18px rgba(0,0,0,.75),0 0 24px rgba(127,240,255,.55)">3</div>' +
      steerHint +
      '</div>';
    cd.style.display = "grid";
    countdownT = 3.4;
    // The approved phoneme route handles both single letters and digraphs, so
    // every round introduction uses the exact same cue as the replay control.
    say(() => speakPhoneme(target));
  }

  const ambient = new THREE.AmbientLight(0x8899ff, 0.7);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 8, 6);
  key.castShadow = qualityTier !== "low";
  key.shadow.mapSize.width = 1024;
  key.shadow.mapSize.height = 1024;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x8eb8ff, 0.46);
  rim.position.set(-5, 4.5, -8);
  scene.add(rim);

  const premiumRender = createArcadePremiumRenderPipeline({
    THREE,
    renderer,
    scene,
    camera,
    tier: qualityTier,
    shadowLights: [key],
    mood: {
      bloomIntensity: 0.105,
      bloomThreshold: 0.82,
      environmentIntensity: 1.02,
      vignetteDarkness: 0.14,
      aoIntensity: 0.76
    }
  });
  qualityTier = premiumRender.effectiveTier;
  applyQualityTier(renderer, qualityTier);
  premiumRender.setTier(qualityTier);
  premiumRender.resize(width(), height());

  function reassessQualityTier() {
    const nextTier = detectQualityTier();
    premiumRender.setTier(nextTier);
    qualityTier = premiumRender.effectiveTier;
    applyQualityTier(renderer, qualityTier);
    premiumRender.resize(width(), height());
  }
  const syncMotionPreference = event => {
    reduceMotion = Boolean(event.matches);
    reassessQualityTier();
  };
  motionQuery?.addEventListener?.("change", syncMotionPreference);
  scene.add(new THREE.HemisphereLight(0x9fc0ff, 0x1a1440, 0.55));
  const sceneBackground = makeNebulaTexture();
  scene.background = sceneBackground;
  scene.fog = new THREE.FogExp2(0x0a1230, 0.032);

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

  // ── Mission 3: neon lane rails (instant "it's a track, not empty space") ──
  const rails = [];
  LANES.forEach((_, laneIndex) => {
    const rail = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 70),
      new THREE.MeshBasicMaterial({ color: 0x3fd6ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    rail.rotation.x = -Math.PI / 2;
    rail.position.set(laneX(laneIndex), 0.18, -25);
    scene.add(rail); rails.push(rail);
  });

  // ── Authored racing corridor: readable lanes, grounded deck and depth cues.
  const trackSegments = [];
  const trackGroup = new THREE.Group();
  scene.add(trackGroup);
  const trackTexture = makeTrackPanelTexture();
  const deckGeo = new THREE.PlaneGeometry(8.2, 5.2, 1, 1);
  const stripeGeo = new THREE.PlaneGeometry(0.1, 4.9, 1, 1);
  const guardGeo = new THREE.BoxGeometry(0.22, 0.56, 5.05);
  const guardLightGeo = new THREE.BoxGeometry(0.08, 0.07, 4.9);
  for (let i = 0; i < 18; i += 1) {
    const mat = new THREE.MeshStandardMaterial({
      color: i % 2 ? 0x111a3b : 0x0c132d,
      map: trackTexture,
      roughness: 0.74,
      metalness: 0.16,
      flatShading: true
    });
    const deck = new THREE.Mesh(deckGeo, mat);
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(0, 0.04, -2 - i * 5.2);
    deck.receiveShadow = true;
    trackGroup.add(deck);
    const center = new THREE.Mesh(
      stripeGeo,
      new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    center.rotation.x = -Math.PI / 2;
    center.position.set(0, 0.065, deck.position.z);
    trackGroup.add(center);
    const walls = [];
    const wallGlows = [];
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(
        guardGeo,
        new THREE.MeshStandardMaterial({
          color: 0x1a2a5a,
          roughness: 0.58,
          metalness: 0.28,
          flatShading: true,
          emissive: 0x061030,
          emissiveIntensity: 0.2
        })
      );
      wall.position.set(side * 4.2, 0.35, deck.position.z);
      wall.rotation.z = side * -0.1;
      wall.castShadow = true;
      wall.receiveShadow = true;
      trackGroup.add(wall);
      walls.push(wall);

      const glow = new THREE.Mesh(
        guardLightGeo,
        new THREE.MeshBasicMaterial({
          color: 0x7ff0ff,
          transparent: true,
          opacity: 0.62,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      glow.position.set(side * 4.04, 0.69, deck.position.z);
      glow.rotation.z = side * -0.1;
      trackGroup.add(glow);
      wallGlows.push(glow);
    }
    trackSegments.push({ deck, center, walls, wallGlows });
  }

  const tunnelRings = [];
  const pylonPairs = [];
  const stationPieces = [];
  const canyonPieces = [];
  const ringGeo = new THREE.TorusGeometry(5.25, 0.045, 6, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x59d3ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  const pylonGeo = new THREE.BoxGeometry(0.22, 1.9, 0.22);
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0x15245a, metalness: 0.35, roughness: 0.52, flatShading: true, emissive: 0x071332, emissiveIntensity: 0.32 });
  const capGeo = new THREE.BoxGeometry(0.72, 0.16, 0.34);
  const capMat = new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 13; i += 1) {
    const z = -9 - i * 7;
    const ring = new THREE.Mesh(ringGeo, ringMat.clone());
    ring.position.set(0, 2.1, z);
    scene.add(ring);
    tunnelRings.push(ring);
    const pair = new THREE.Group();
    for (const side of [-1, 1]) {
      const pylon = new THREE.Mesh(pylonGeo, pylonMat.clone());
      pylon.position.set(side * 4.25, 1.0, 0);
      pylon.rotation.z = side * 0.11;
      pair.add(pylon);
      const cap = new THREE.Mesh(capGeo, capMat.clone());
      cap.position.set(side * 4.25, 2.05, 0.02);
      pair.add(cap);
    }
    pair.position.z = z + 2.4;
    scene.add(pair);
    pylonPairs.push(pair);
  }
  const stationMat = new THREE.MeshStandardMaterial({ color: 0x203066, metalness: 0.45, roughness: 0.62, flatShading: true, emissive: 0x071332, emissiveIntensity: 0.28 });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.74, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 18; i += 1) {
    const group = new THREE.Group();
    const side = i % 2 ? -1 : 1;
    const blockCount = 2 + (i % 3);
    for (let j = 0; j < blockCount; j += 1) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.85 + j * 0.2, 0.7 + (j % 2) * 0.7, 0.7),
        stationMat.clone()
      );
      block.position.set(side * (5.4 + j * 0.55), 0.85 + j * 0.34, j * -0.26);
      block.rotation.y = side * 0.12;
      group.add(block);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.72), windowMat.clone());
      win.position.set(block.position.x, block.position.y + 0.05, block.position.z - 0.38);
      win.rotation.y = block.rotation.y;
      group.add(win);
    }
    group.position.z = -14 - i * 5.4;
    scene.add(group);
    stationPieces.push(group);
  }

  const ridgeMats = [
    new THREE.MeshStandardMaterial({ color: 0x253064, roughness: 0.82, metalness: 0.08, flatShading: true, emissive: 0x090d25, emissiveIntensity: 0.22 }),
    new THREE.MeshStandardMaterial({ color: 0x3f2d5f, roughness: 0.86, metalness: 0.04, flatShading: true, emissive: 0x12061e, emissiveIntensity: 0.18 }),
    new THREE.MeshStandardMaterial({ color: 0x4c3b2a, roughness: 0.9, metalness: 0.03, flatShading: true, emissive: 0x180c04, emissiveIntensity: 0.18 })
  ];
  for (let i = 0; i < 30; i += 1) {
    const cluster = new THREE.Group();
    const side = i % 2 ? -1 : 1;
    const pieces = 2 + (i % 3);
    for (let j = 0; j < pieces; j += 1) {
      const geometry = j % 3 === 0
        ? new THREE.DodecahedronGeometry(0.72 + j * 0.18, 0)
        : j % 3 === 1
          ? new THREE.ConeGeometry(0.58 + j * 0.12, 1.4 + j * 0.45, 5)
          : new THREE.BoxGeometry(0.72 + j * 0.16, 0.9 + j * 0.34, 0.86 + j * 0.12);
      const rock = new THREE.Mesh(geometry, ridgeMats[(i + j) % ridgeMats.length].clone());
      rock.position.set(side * (6.0 + j * 0.82 + Math.random() * 0.7), 0.35 + j * 0.28, -0.9 + Math.random() * 1.8);
      rock.rotation.set(Math.random() * 0.4, side * (0.25 + Math.random() * 0.4), Math.random() * 0.35);
      rock.scale.set(1, 0.85 + Math.random() * 0.8, 1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      cluster.add(rock);
    }
    const beacon = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.82, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
    );
    beacon.position.set(side * 5.35, 1.0, 0.25);
    cluster.add(beacon);
    cluster.position.z = -10 - i * 4.3;
    scene.add(cluster);
    canyonPieces.push(cluster);
  }

  // Premium scenery stream. Medium/high devices swap the repeated procedural
  // skyline for coherent, authored low-poly space-base models. The budget is
  // tiered and bounded; low-power/reduced-motion devices keep the much cheaper
  // procedural silhouette. All assets are decorative and all failures settle
  // into that fallback instead of failing the game.
  const ownedScenery = new THREE.Group();
  ownedScenery.name = "rocket-run-owned-space-base";
  scene.add(ownedScenery);
  let ownedSceneryDisposed = false;
  const setpieceBudget = premiumSetpieceBudget(qualityTier);
  const setpieceSpecs = OWNED_SPACE_SETPIECES.slice(0, setpieceBudget.setpieceKinds);
  const setpieceWrap = Math.max(1, setpieceBudget.setpieceCopies) * 5.8;
  const setpieceLoads = [];
  for (let i = 0; i < setpieceBudget.setpieceCopies; i += 1) {
    const spec = setpieceSpecs[i % Math.max(1, setpieceSpecs.length)];
    if (!spec) break;
    const load = createOwnedModelInstance(THREE, spec.url, {
      height: spec.height,
      castShadow: qualityTier === "high",
      receiveShadow: qualityTier !== "low"
    }).then(model => {
      if (ownedSceneryDisposed) {
        disposeOwnedModelInstance(model);
        return;
      }
      const side = i % 2 === 0 ? -1 : 1;
      model.position.set(
        side * (5.3 + (i % 3) * 0.85),
        0.08,
        -16 - i * 5.8
      );
      model.rotation.y = side < 0 ? Math.PI * 0.42 : -Math.PI * 0.42;
      model.userData.streamOffset = i * 0.17;
      ownedScenery.add(model);
      premiumRender.prepareObject(model);
    }).catch(() => {
      // The procedural corridor is the deliberate, playable fallback.
    });
    setpieceLoads.push(load);
  }
  void Promise.allSettled(setpieceLoads).then(() => {
    // Only replace the complete procedural skyline when every tier-budgeted
    // authored model is ready. A partially cached/offline load may still add
    // useful foreground detail, but it must never turn the dependable fallback
    // into a sparse or apparently broken route.
    if (ownedSceneryDisposed || !hasCompletePremiumSetpieceSet(ownedScenery.children.length, setpieceBudget)) return;
    stationPieces.forEach(piece => { piece.visible = false; });
    canyonPieces.forEach(piece => { piece.visible = false; });
  });

  const nebulaPlanes = [];
  const cyanGlow = makeGlowTexture("rgba(103,232,249,0.88)", "rgba(74,144,226,0.18)");
  const roseGlow = makeGlowTexture("rgba(255,128,100,0.72)", "rgba(176,70,255,0.12)");
  for (let i = 0; i < 4; i += 1) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(18 + i * 4, 8 + i * 2),
      new THREE.MeshBasicMaterial({
        map: i % 2 ? roseGlow : cyanGlow,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    plane.position.set(i % 2 ? -10 - i : 11 + i, 6 + i * 1.2, -42 - i * 11);
    plane.rotation.z = (i % 2 ? -1 : 1) * (0.15 + i * 0.06);
    scene.add(plane);
    nebulaPlanes.push(plane);
  }

  const planetGroup = new THREE.Group();
  const farPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(4.4, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0x5fd4cf, emissive: 0x123f5e, emissiveIntensity: 0.28, roughness: 0.75, flatShading: true })
  );
  farPlanet.rotation.z = -0.28;
  planetGroup.add(farPlanet);
  const planetRing = new THREE.Mesh(
    new THREE.TorusGeometry(5.7, 0.08, 6, 48),
    new THREE.MeshBasicMaterial({ color: 0xf1d47a, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  planetRing.rotation.x = 1.25;
  planetRing.rotation.y = 0.24;
  planetGroup.add(planetRing);
  planetGroup.position.set(13, 8, -74);
  scene.add(planetGroup);

  // ── Per-theme backdrop glow (a distant "sun"/nebula core) — recoloured each
  //    round so every sector has a distinct dominant hue, not just tinted fog. ──
  const themeSun = new THREE.Mesh(
    new THREE.SphereGeometry(14, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0x2a3a8a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  themeSun.position.set(-18, 12, -78);
  scene.add(themeSun);

  // ── Mission 5: far-field drifting planets (procedural texture) ────────────
  function planetTexture(hue) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(44, 44, 8, 64, 64, 74);
    g.addColorStop(0, "hsl(" + hue + ",70%,72%)"); g.addColorStop(1, "hsl(" + ((hue + 40) % 360) + ",60%,32%)");
    x.fillStyle = g; x.beginPath(); x.arc(64, 64, 64, 0, 7); x.fill();
    x.globalAlpha = 0.18; x.fillStyle = "#000";
    for (let i = 0; i < 6; i += 1) x.fillRect(0, 20 + i * 16 + Math.sin(i) * 4, 128, 5 + (i % 2) * 3);
    return new THREE.CanvasTexture(c);
  }
  const planets = [];
  for (let i = 0; i < 3; i += 1) {
    const hue = Math.floor(Math.random() * 360);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 24), new THREE.MeshBasicMaterial({ map: planetTexture(hue) }));
    mesh.position.set((Math.random() - 0.5) * 34, 4 + Math.random() * 10, -70 - i * 8);
    scene.add(mesh); planets.push(mesh);
  }

  // ── Mission 5: occasional ambient comet streak (thin additive plane) ──────
  const cometStreak = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  cometStreak.rotation.z = -0.5;
  cometStreak.position.set(0, 12, -60);
  scene.add(cometStreak);

  // ── Mission 4: boost speed-line quads at the screen edges (hidden until boosting) ──
  const speedLines = [];
  for (let i = 0; i < 12; i += 1) {
    const q = new THREE.Mesh(
      new THREE.PlaneGeometry(0.05, 2.4),
      new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    const side = i < 6 ? -1 : 1;
    q.position.set(side * (2.6 + Math.random() * 1.6), 0.4 + Math.random() * 3, 2 - Math.random() * 6);
    scene.add(q); speedLines.push(q);
  }

  // ── Ship v4: smooth, reflective hero craft. The silhouette stays chunky and
  //    child-readable, while curved bodywork and layered surface response move
  //    it out of deliberately retro low-poly presentation. ─────────────────
  const ship = new THREE.Group();
  const hullMat = new THREE.MeshPhysicalMaterial({ color: 0xd9a43f, metalness: 0.66, roughness: 0.22, clearcoat: 0.46, clearcoatRoughness: 0.2, emissive: 0x2d1900, emissiveIntensity: 0.11, envMapIntensity: 1.2, dithering: true });
  const trimMat = new THREE.MeshPhysicalMaterial({ color: 0xff6b57, metalness: 0.38, roughness: 0.3, clearcoat: 0.38, clearcoatRoughness: 0.24, emissive: 0x351008, emissiveIntensity: 0.08, envMapIntensity: 1.08, dithering: true });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x18203a, metalness: 0.58, roughness: 0.42, clearcoat: 0.22, clearcoatRoughness: 0.34, envMapIntensity: 0.94, dithering: true });
  const panelMat = new THREE.MeshPhysicalMaterial({ color: 0xffe28a, metalness: 0.52, roughness: 0.24, clearcoat: 0.34, clearcoatRoughness: 0.2, emissive: 0x3a2400, emissiveIntensity: 0.08, envMapIntensity: 1.16, dithering: true });
  const profile = [
    [0.001, -1.65], [0.09, -1.52], [0.2, -1.18], [0.3, -0.62],
    [0.355, -0.05], [0.345, 0.42], [0.28, 0.78], [0.2, 0.95], [0.001, 0.98]
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const bodySegments = qualityTier === "high" ? 40 : qualityTier === "medium" ? 28 : 18;
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, bodySegments), hullMat);
  body.rotation.x = Math.PI / 2; // lathe +y axis -> -z, nose forward
  body.scale.set(1.2, 1.2, 1.22);
  ship.add(body);
  const noseRing = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.045, 8, 24), trimMat);
  noseRing.position.z = -1.16;
  ship.add(noseRing);
  const dorsal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 1.35), panelMat);
  dorsal.position.set(0, 0.38, -0.18);
  dorsal.rotation.x = -0.06;
  ship.add(dorsal);
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: 0x7ff0ff, emissive: 0x21a7c8, emissiveIntensity: 0.76, metalness: 0.08, roughness: 0.08, transmission: qualityTier === "high" ? 0.18 : 0, thickness: 0.3, clearcoat: 0.72, clearcoatRoughness: 0.1, transparent: true, opacity: 0.94, envMapIntensity: 1.35, dithering: true })
  );
  canopy.position.set(0, 0.34, -0.52);
  canopy.rotation.x = -0.25;
  ship.add(canopy);
  const cockpitRim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 8, 20), darkMat);
  cockpitRim.position.copy(canopy.position);
  cockpitRim.rotation.x = Math.PI / 2 - 0.25;
  ship.add(cockpitRim);
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0); finShape.lineTo(0.18, 0.02); finShape.lineTo(0.86, 0.72);
  finShape.lineTo(0.68, 0.9); finShape.lineTo(0.08, 0.48); finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 });
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(finGeo, trimMat);
    fin.position.set(side * 0.26, -0.08, 0.46);
    fin.rotation.z = side > 0 ? -0.32 : Math.PI + 0.32;
    fin.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    fin.scale.set(1.1, 1.1, 1);
    ship.add(fin);
  }
  const topFin = new THREE.Mesh(finGeo, trimMat);
  topFin.position.set(0, 0.28, 0.5);
  topFin.rotation.y = Math.PI / 2;
  topFin.rotation.z = -Math.PI / 2;
  topFin.scale.set(0.72, 0.72, 0.8);
  ship.add(topFin);
  for (const side of [-1, 1]) {
    const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.86, 10), darkMat);
    booster.rotation.x = Math.PI / 2;
    booster.position.set(side * 0.38, -0.18, 0.54);
    ship.add(booster);
    const boosterGlow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.58, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x55e9ff, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    boosterGlow.rotation.x = Math.PI / 2;
    boosterGlow.position.set(side * 0.38, -0.18, 1.06);
    ship.add(boosterGlow);
  }
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.25, 0.32, 12), darkMat);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.z = 1.16;
  ship.add(nozzle);
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.22, 16, 1, true), plumeMat);
  plume.rotation.x = Math.PI / 2; // apex trails behind (+z)
  plume.position.z = 1.82;
  ship.add(plume);
  const plumeCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.78, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  plumeCore.rotation.x = Math.PI / 2;
  plumeCore.position.z = 1.62;
  ship.add(plumeCore);
  const engineLight = new THREE.PointLight(0x66ccff, 1.1, 7);
  engineLight.position.z = 1.48;
  ship.add(engineLight);
  ship.traverse(node => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  ship.position.set(0, 0.92, 4.05);
  ship.scale.setScalar(SHIP_BASE_SCALE);
  scene.add(ship);
  const shipShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.08, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x02040c, transparent: true, opacity: 0.42, depthWrite: false })
  );
  shipShadow.rotation.x = -Math.PI / 2;
  shipShadow.position.set(0, 0.085, ship.position.z + 0.04);
  scene.add(shipShadow);

  function pill(ctx, px, py, w, h, r) {
    const cut = Math.min(r, w * 0.14, h * 0.34);
    ctx.beginPath();
    ctx.moveTo(px + cut, py);
    ctx.lineTo(px + w - cut, py);
    ctx.lineTo(px + w, py + cut);
    ctx.lineTo(px + w - cut, py + h);
    ctx.lineTo(px + cut, py + h);
    ctx.lineTo(px, py + h - cut);
    ctx.lineTo(px, py + cut);
    ctx.closePath();
  }
  function labelSprite(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const panel = ctx.createLinearGradient(40, 66, 472, 190);
    panel.addColorStop(0, "rgba(7,14,42,0.92)");
    panel.addColorStop(0.55, "rgba(18,36,86,0.86)");
    panel.addColorStop(1, "rgba(5,9,28,0.9)");
    ctx.fillStyle = panel;
    pill(ctx, 34, 58, 444, 138, 34);
    ctx.fill();
    ctx.strokeStyle = "rgba(127,240,255,0.72)";
    ctx.lineWidth = 7;
    pill(ctx, 34, 58, 444, 138, 34);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,225,105,0.95)";
    ctx.fillRect(58, 78, 42, 7);
    ctx.fillRect(412, 176, 42, 7);
    ctx.font = "800 116px Fredoka, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 16;
    ctx.strokeStyle = "rgba(1,4,16,0.96)";
    ctx.strokeText(text, 256, 132);
    ctx.fillStyle = "#f8fdff";
    ctx.fillText(text, 256, 132);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    // Float the label in FRONT of the orb (toward the camera) and draw it on
    // top, so the semi-transparent bubble can never hide the word.
    sprite.renderOrder = 5;
    sprite.scale.set(2.72, 1.24, 1);
    sprite.position.set(0, 0, 1.34);
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
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 2), mat);
    group.add(orb);
    const cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.84, 1),
      new THREE.MeshBasicMaterial({ color: 0x8ff6ff, wireframe: true, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(cage);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.022, 6, 28),
      new THREE.MeshBasicMaterial({ color: 0xffe36a, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.rotation.x = Math.PI / 2;
    group.add(halo);
    const glowIn = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x2b5fd0, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(glowIn);
    const sprite = labelSprite(word);
    group.add(sprite);
    group.position.set(laneX(lane), 1.05, -46);
    group.userData = {
      word, correct, lane, orb, cage, halo, alive: true, tries: tries || 0,
      setFade: a => {
        mat.uniforms.uFade.value = a;
        sprite.material.opacity = a;
        glowIn.material.opacity = 0.18 * a;
        cage.material.opacity = 0.36 * a;
        halo.material.opacity = 0.36 * a;
      }
    };
    scene.add(group);
    premiumRender.prepareObject(group);
    return group;
  }
  function makeMeteor(lane) {
    const group = new THREE.Group();
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.68, 1),
      new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 0.95, flatShading: true, emissive: 0x2a1c14, emissiveIntensity: 0.38 })
    );
    rock.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    group.add(rock);
    for (let i = 0; i < 3; i += 1) {
      const shard = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.16 + i * 0.04, 0),
        new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9, flatShading: true })
      );
      shard.position.set((Math.random() - 0.5) * 0.72, (Math.random() - 0.5) * 0.54, 0.45 + i * 0.18);
      shard.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      group.add(shard);
    }
    const trail = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 1.35, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    trail.rotation.x = Math.PI / 2;
    trail.position.set(0, 0, 0.7);
    group.add(trail);
    group.position.set(laneX(lane), 1.05, -46);
    group.userData = { meteor: true, lane, rock, alive: true,
      setFade: a => { group.scale.setScalar(0.4 + 0.6 * a); trail.material.opacity = 0.45 * a; } };
    scene.add(group);
    premiumRender.prepareObject(group);
    return group;
  }
  function makeRing(lane) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.09, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0x59ffe0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(ring);
    const inner = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.035, 6, 28),
      new THREE.MeshBasicMaterial({ color: 0xffe36a, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(inner);
    for (let i = 0; i < 4; i += 1) {
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.22, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
      );
      const a = i * Math.PI / 2;
      tick.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0);
      tick.rotation.z = a;
      group.add(tick);
    }
    group.position.set(laneX(lane), 1.05, -46);
    group.userData = { ring: true, lane, alive: true, orb: ring, inner, setFade: a => { ring.material.opacity = 0.9 * a; inner.material.opacity = 0.7 * a; } };
    scene.add(group);
    premiumRender.prepareObject(group);
    return group;
  }
  function makeHeart(lane) {
    const group = new THREE.Group();
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xff5a8a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(orb);
    const sprite = labelSprite("❤");
    group.add(sprite);
    group.position.set(laneX(lane), 1.05, -46);
    group.userData = { heart: true, lane, orb, alive: true, setFade: a => { orb.material.opacity = 0.9 * a; sprite.material.opacity = a; } };
    scene.add(group);
    premiumRender.prepareObject(group);
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
  let missed = 0; // correct words that flew past uncaught this round
  let roundIx = Math.max(0, Math.min(Number(opts.startLevel) || 0, ROUNDS_PER_GAME - 1));
  let running = false;
  let last = 0;
  let shakeV = 0;
  let hearts = 3;
  let elapsed = 0;
  let score = 0, caughtTotal = 0, neededTotal = 0, wrongTotal = 0, missedTotal = 0, deaths = 0;
  const bursts = [];
  // ── quality-pass state (missions 1-5) ────────────────────────────────────
  let rollT = 0, rollDir = 0, shipPulse = 0;       // bank flourish + catch pulse
  let combo = 0, boostT = 0, fov = CAMERA_FOV;     // combo multiplier + Wipeout boost
  let theme = ROUND_THEMES[0];                     // current themed sector
  const fogTarget = new THREE.Color(theme.fog);
  const ambientTarget = new THREE.Color(theme.ambient);
  let cometStreakT = 6 + Math.random() * 14;       // ambient comet streak timer
  let countdownT = 0;                              // start-of-round get-ready countdown
  let roundTarget = "";                            // current target grapheme (for refill)
  let steeringHintShown = false;                   // one-time "how to steer" countdown hint
  // (speedLines is declared up in the scene-setup section, before it's populated)

  const hearTargetButton = el("hear-target");
  function replayTarget() {
    if (roundTarget) say(() => speakPhoneme(roundTarget));
  }
  function syncHearTargetControl() {
    if (!hearTargetButton) return;
    const soundEnabled = Boolean(opts.getSound ? opts.getSound() : opts.isSoundEnabled);
    hearTargetButton.disabled = !soundEnabled;
    hearTargetButton.style.cursor = soundEnabled ? "pointer" : "default";
    hearTargetButton.style.opacity = soundEnabled ? "1" : ".84";
    hearTargetButton.setAttribute(
      "aria-label",
      soundEnabled
        ? `Hear the ${roundTarget || "target"} sound again`
        : `Target ${roundTarget || "sound"}; sound is off`
    );
  }
  const onHearTargetPointerDown = event => event.stopPropagation();
  hearTargetButton?.addEventListener("pointerdown", onHearTargetPointerDown);
  hearTargetButton?.addEventListener("click", replayTarget);

  function setFuel() { el("fuel").style.width = Math.round(needed ? (100 * caught) / needed : 0) + "%"; }
  function addScore(n) { score += n; if (opts.onScoreUpdate) opts.onScoreUpdate(score); }
  function bumpCombo() {
    combo += 1;
    const c = el("combo");
    if (c && combo >= 2) { c.style.display = "block"; c.textContent = "×" + combo; c.style.transform = "scale(1.4)"; setTimeout(() => { c.style.transform = "scale(1)"; }, 120); }
    if (combo % 5 === 0) queue.splice(Math.min(2, queue.length), 0, { ring: true }); // Wipeout boost ring every 5
  }
  function resetCombo() { combo = 0; const c = el("combo"); if (c) c.style.display = "none"; }
  let finaleComet = null;
  function spawnFinaleComet() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), new THREE.MeshStandardMaterial({ color: 0xdfe9ff, emissive: 0x88aaff, emissiveIntensity: 0.8, flatShading: true })));
    const tail = new THREE.Mesh(new THREE.ConeGeometry(1.1, 20, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fc6ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    tail.rotation.x = -Math.PI / 2; tail.position.z = 10; g.add(tail);
    g.position.set(-14, 9, -55);
    scene.add(g); finaleComet = g;
  }
  function missCue() {
    const f = el("fuel"); if (f) { f.style.filter = "brightness(1.9)"; setTimeout(() => { f.style.filter = ""; }, 180); }
    sfx(playPopSound);
  }
  function requeueMissed(data) {
    // Catch-up: a correct word that slipped past comes back. After 2 tries it
    // returns in the ship's OWN lane (a guaranteed catch) — a word is never lost.
    const tries = (data.tries || 0) + 1;
    missed += 1; // a missed catch counts as a mistake in the end-of-game rubric
    resetCombo(); // a correct word slipping past breaks the streak
    missCue();
    say(() => speakWord(data.word)); // hear the word that slipped past
    if (tries <= 2) queue.splice(Math.min(3, queue.length), 0, { word: data.word, correct: true, tries });
    else queue.splice(Math.min(1, queue.length), 0, { word: data.word, correct: true, tries, guaranteed: true });
  }
  function updateHearts() { el("hearts").textContent = "❤".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts)); }
  function loseHeart() {
    if (hearts <= 0) return;
    hearts -= 1; wrongHits += 1; updateHearts(); sfx(playSoftBuzz); shakeV = 0.55;
    if (hearts <= 0) { deaths += 1; retryRound(); }
  }

  function startRound() {
    theme = ROUND_THEMES[roundIx % ROUND_THEMES.length];       // themed sector
    fogTarget.set(theme.fog); ambientTarget.set(theme.ambient); // tweened in tick
    // Recolour the world so each sector looks distinct — stars, rails, backdrop sun.
    for (const layer of starLayers) layer.material.color.setHex(theme.star);
    rails.forEach(r => r.material.color.setHex(theme.rail));
    themeSun.material.color.setHex(theme.sun);
    for (const segment of trackSegments) {
      segment.deck.material.color.setHex(theme.deck || 0x17245a);
      segment.center.material.color.setHex(theme.pad || theme.rail);
      segment.walls.forEach(wall => {
        wall.material.color.setHex(theme.deck || 0x17245a);
        wall.material.emissive.setHex(theme.sun || 0x071332);
      });
      segment.wallGlows.forEach(glow => {
        glow.material.color.setHex(theme.pad || theme.rail);
      });
    }
    tunnelRings.forEach((ring, index) => {
      ring.material.color.setHex(index % 3 === 0 ? theme.pad || theme.rail : theme.rail);
      ring.material.opacity = index % 3 === 0 ? 0.34 : 0.2;
    });
    pylonPairs.forEach(pair => {
      pair.children.forEach(child => {
        if (child.material?.emissive) {
          child.material.color.setHex(theme.deck || 0x17245a);
          child.material.emissive.setHex(theme.sun || 0x071332);
        } else if (child.material?.color) {
          child.material.color.setHex(theme.pad || theme.rail);
        }
      });
    });
    stationPieces.forEach(group => {
      group.children.forEach(child => {
        if (child.material?.emissive) {
          child.material.color.setHex(theme.deck || 0x203066);
          child.material.emissive.setHex(theme.sun || 0x071332);
        } else if (child.material?.color) {
          child.material.color.setHex(theme.pad || theme.rail);
        }
      });
    });
    canyonPieces.forEach((group, groupIndex) => {
      group.children.forEach((child, childIndex) => {
        if (child.material?.emissive) {
          child.material.color.setHex(childIndex % 2 ? theme.trim || theme.deck : theme.deck || 0x203066);
          child.material.emissive.setHex(theme.sun || 0x071332);
        } else if (child.material?.color) {
          child.material.color.setHex(groupIndex % 3 === 0 ? theme.pad || theme.rail : theme.rail);
        }
      });
    });
    const target = targets[roundIx % targets.length]; // walk the ramped ladder, no repeats
    roundTarget = target;
    const round = buildRocketRunRound(target, { count, difficulty: opts.difficulty });
    el("letter").textContent = target;
    el("copy").innerHTML = "Catch the <b>" + target + "</b> words!";
    syncHearTargetControl();
    const seq = round.sequence.map(item => ({ word: item.word, correct: item.correct }));
    // Interleave meteors to dodge — more the deeper you get, scaled by the sector.
    // Meteor pressure grows gently and is CAPPED — the sector meteorMul used to
    // multiply an already-steep ramp into ~30 meteors, leaving no room to dodge.
    const isEasy = opts.difficulty === "easy";
    // Easy begins as a listening-and-steering lesson. Hazards arrive only once
    // the child has completed a calm sound round, and never flood the learning.
    const meteorCount = isEasy
      ? (roundIx === 0 ? 0 : Math.min(3, 1 + Math.floor(roundIx / 3)))
      : Math.min(10, Math.round((2 + roundIx * 0.6) * (theme.meteorMul || 1)));
    for (let i = 0; i < meteorCount; i += 1) seq.splice(Math.floor(Math.random() * (seq.length + 1)), 0, { meteor: true });
    seq.splice(Math.floor(Math.random() * (seq.length + 1)), 0, { heart: true }); // a life to win back
    queue = seq;
    needed = round.needed;
    caught = 0;
    wrongHits = 0;
    missed = 0;
    hearts = 3;
    bubbles = [];
    spawnTimer = 0.3;
    running = false;          // held until the get-ready countdown finishes (in tick)
    resetCombo();
    setFuel();
    updateHearts();
    showBanner("Round " + (roundIx + 1) + " — " + theme.name);
    showCountdown(target);    // big target letter + 3-2-1 before any words fly
    if (roundIx === ROUNDS_PER_GAME - 1 && !finaleComet) spawnFinaleComet(); // Comet Chase finale
    if (opts.onProgressUpdate) opts.onProgressUpdate(roundIx + 1, ROUNDS_PER_GAME);
    if (opts.onCheckpoint) opts.onCheckpoint(roundIx, ROUNDS_PER_GAME);
  }

  function moveLane(dir) {
    if (!running) return;
    const next = Math.max(0, Math.min(2, laneIx + dir));
    if (next !== laneIx) { laneIx = next; rollT = 0.38; rollDir = dir; sfx(playTapSound); }
  }

  function burst(position, color) {
    if (reduceMotion) return;
    const n = particleCountForTier(qualityTier, 14);
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
    if (bubble.userData.ring) {
      // Boost ring: fly through in the right lane for a Wipeout speed burst. Never
      // a penalty in the wrong lane — it just passes.
      if (hit) { boostT = 1.6; addScore(25); sfx(playWhoosh); burst(bubble.position, 0x59ffe0); }
      scene.remove(bubble); disposeGroup(bubble);
      return;
    }
    if (bubble.userData.heart) {
      // Heart pickup: catch it in your lane to win a life back (never a penalty).
      if (hit) { hearts = Math.min(3, hearts + 1); updateHearts(); addScore(5); sfx(playStarChime); burst(bubble.position, 0xff8ab0); }
      scene.remove(bubble); disposeGroup(bubble);
      return;
    }
    if (bubble.userData.meteor) {
      if (hit) { loseHeart(); resetCombo(); burst(bubble.position, 0xff7a66); }
      scene.remove(bubble); disposeGroup(bubble);
      return;
    }
    if (hit && bubble.userData.correct) {
      caught += 1;
      bumpCombo();
      addScore((opts.difficulty === "hard" ? 15 : 10) * Math.min(4, 1 + Math.floor(combo / 3)));
      shipPulse = 0.25;
      setFuel();
      sfx(playCorrectChime);
      sfx(playPopSound);
      showBanner("'" + bubble.userData.word + "' starts with '" + roundTarget + "' ✓", 2.0);
      say(async () => {
        try { await speakWord(bubble.userData.word); } catch { /* word clip optional */ }
        try { await speakPhoneme(roundTarget); } catch { /* phoneme cue optional */ }
      });
      burst(bubble.position, 0x8affc0);
    } else if (hit && !bubble.userData.correct) {
      // Wrong word = SOFT penalty (hearts are for meteors only): the bubble
      // bounces off the shield, the combo breaks, and we flash + speak the
      // contrast ("map starts with m") so the hit teaches the sound difference.
      resetCombo();
      rollT = 0.38; rollDir = bubble.userData.lane === 0 ? 1 : -1; // flinch away
      shakeV = 0.3;
      sfx(playSoftBuzz);
      const onset = onsetGrapheme(bubble.userData.word);
      showBanner("'" + bubble.userData.word + "' starts with '" + onset + "'", 2.4);
      say(async () => {
        try { await speakWord(bubble.userData.word); } catch { /* word clip optional */ }
        try { await speakPhoneme(onset); } catch { /* phoneme cue optional */ }
      });
      burst(bubble.position, 0xffd34e);
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

  const overlayButtonStyle = [
    "font-family:inherit",
    "font-weight:900",
    "font-size:1.08rem",
    "letter-spacing:.05em",
    "text-transform:uppercase",
    "color:#071033",
    "padding:14px 30px",
    "border:1px solid rgba(255,255,255,.62)",
    "background:linear-gradient(160deg,#ffe879,#ff9f24)",
    "box-shadow:0 7px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.2)",
    "clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)",
    "cursor:pointer"
  ].join(";");

  function refillQueue() {
    // The round can't be passed without catching `needed` correct words. If the
    // queue empties short, top it back up so the child keeps getting chances
    // (plus a heart) — the round loops until they've caught enough or run out of hearts.
    const round = buildRocketRunRound(roundTarget, { count, difficulty: opts.difficulty });
    for (const item of round.sequence) queue.push({ word: item.word, correct: item.correct });
    queue.splice(Math.floor(Math.random() * (queue.length + 1)), 0, { heart: true });
  }

  function retryRound() {
    // Death does NOT advance — the only way to the next planet is catching enough
    // correct words. Restart the SAME round (fresh hearts) so the child tries again.
    running = false;
    clearField();
    const overlay = showOverlay(
      '<div><div style="font-size:2rem;font-weight:700;margin-bottom:8px">Out of fuel!</div>' +
      '<div style="opacity:.85;margin-bottom:14px">Catch the <b>' + roundTarget + '</b> words to reach the next planet.</div>' +
      '<button data-rr="retry" style="' + overlayButtonStyle + '">Try again →</button></div>'
    );
    overlay.querySelector('[data-rr="retry"]').addEventListener("click", () => { overlay.style.display = "none"; startRound(); });
  }

  function endRound() {
    if (!running) return; // idempotent — a death and a caught>=needed can both fire in one frame
    running = false;
    clearField();
    caughtTotal += caught; neededTotal += needed; wrongTotal += wrongHits; missedTotal += missed;
    const stars = rocketRunStars(caught, needed, wrongHits);
    el("stars").textContent = "★".repeat(stars) + "✩".repeat(3 - stars);
    sfx(playStarChime);
    roundIx += 1;
    if (roundIx >= ROUNDS_PER_GAME) {
      finishGame();
      return;
    }
    const nextTheme = ROUND_THEMES[roundIx % ROUND_THEMES.length];
    const overlay = showOverlay(
      '<div><div style="font-size:2rem;font-weight:700;margin-bottom:4px">Planet reached!</div>' +
      '<div style="opacity:.85;margin-bottom:12px">Entering the <b>' + nextTheme.name + '</b></div>' +
      '<button data-rr="next" style="' + overlayButtonStyle + '">Next sound →</button></div>'
    );
    overlay.querySelector('[data-rr="next"]').addEventListener("click", () => {
      overlay.style.display = "none";
      startRound();
    });
  }

  function finishGame() {
    sfx(playCelebrationFanfare);
    // Mistakes = heart-losing hits + correct words that flew past uncaught.
    // Without the misses, endRound only fires at caught >= needed, so rubric
    // accuracy was a structural 100% and stars could never drop below 2.
    const stars = starRubric({ correct: caughtTotal, total: neededTotal, mistakes: wrongTotal + missedTotal, deaths });
    // Comet Chase finale: a burst of confetti as the run completes.
    const confettiColors = [0xffd34e, 0x59ffe0, 0xff7a9c, 0x8affc0];
    for (let i = 0; i < 6; i += 1) burst({ x: (Math.random() - 0.5) * 6, y: 1 + Math.random() * 3, z: 3 }, confettiColors[i % 4]);
    const overlay = showOverlay(
      '<div style="display:grid;gap:14px;justify-items:center">' +
      '<div style="font-size:2rem;font-weight:800">You caught the comet!</div>' +
      '<div data-rr="rstars" style="font-size:2.3rem;letter-spacing:8px;min-height:2.5rem">✩✩✩</div>' +
      '<div style="font-size:1.15rem;opacity:.9">Score <b data-rr="rscore">0</b></div>' +
      '<button data-rr="done" style="' + overlayButtonStyle + ';margin-top:4px">Back to Arcade</button>' +
      '</div>'
    );
    // Stars pop in one at a time, each with a chime; score counts up over ~800ms.
    const sEl = overlay.querySelector('[data-rr="rstars"]');
    for (let i = 0; i < 3; i += 1) {
      setTimeout(() => {
        if (!sEl) return;
        const shown = Math.min(stars, i + 1);
        sEl.textContent = "★".repeat(shown) + "✩".repeat(3 - shown);
        if (i < stars) sfx(playStarChime);
      }, 350 + i * 400);
    }
    const scEl = overlay.querySelector('[data-rr="rscore"]');
    const t0 = performance.now();
    const countUp = () => {
      const p = Math.min(1, (performance.now() - t0) / 800);
      if (scEl) scEl.textContent = String(Math.round(score * p));
      if (p < 1) requestAnimationFrame(countUp);
    };
    requestAnimationFrame(countUp);
    const done = overlay.querySelector('[data-rr="done"]');
    if (done) done.addEventListener("click", () => {
      if (opts.onExit) opts.onExit();
      else overlay.style.display = "none";
    });
    if (opts.onProgressUpdate) opts.onProgressUpdate(ROUNDS_PER_GAME, ROUNDS_PER_GAME);
    if (opts.onComplete) opts.onComplete(stars, score, caughtTotal);
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  const onLeft = () => moveLane(-1);
  const onRight = () => moveLane(1);
  const detachSteerZones = attachSteerZones({ left: el("left"), right: el("right"), onLeft, onRight });
  const onKey = event => {
    if (isInteractiveKeyTarget(event.target)) return;
    const direction = laneDirectionForKey(event.key);
    if (direction) {
      event.preventDefault();
      moveLane(direction);
    }
  };
  window.addEventListener("keydown", onKey);
  const detachSwipeSteer = attachSwipeSteer(renderer.domElement, { threshold: 40, onSteer: dir => moveLane(dir) });

  const detachResize = attachResize({
    mount,
    renderer,
    camera,
    width,
    height,
    onResize: reassessQualityTier
  });

  // ── Loop ─────────────────────────────────────────────────────────────────
  function tick(now) {
    syncHearTargetControl();
    const dt = Math.min(0.05, ((now - last) || 16) / 1000);
    last = now;
    elapsed += dt;
    const finale = roundIx === ROUNDS_PER_GAME - 1;
    const boost = boostT > 0 ? 1.8 : 1; boostT = Math.max(0, boostT - dt);
    const difficultySpeed = opts.difficulty === "easy" ? 0.68 : opts.difficulty === "medium" ? 0.88 : 1.04;
    const speed = (1.15 + roundIx * 0.26 + Math.min(1.0, elapsed * 0.01))
      * difficultySpeed
      * (finale ? (opts.difficulty === "easy" ? 1.08 : 1.25) : 1);

    // themed sector tween (fog + ambient) + low-hearts fog tension
    if (scene.fog && scene.fog.color) scene.fog.color.lerp(fogTarget, Math.min(1, dt * 1.2));
    ambient.color.lerp(ambientTarget, Math.min(1, dt * 1.2));
    if (scene.fog) scene.fog.density = 0.03 + (hearts <= 1 ? Math.abs(Math.sin(elapsed * 3)) * 0.006 : 0);

    for (const layer of starLayers) {
      layer.position.z += dt * layer.userData.speed * speed * boost * (reduceMotion ? 0.5 : 1);
      if (layer.position.z > 40) layer.position.z = 0;
    }
    rails.forEach((r, i) => {
      r.position.x += (laneX(i) - r.position.x) * Math.min(1, dt * 8);
      r.material.opacity = (i === laneIx ? 0.5 : 0.22) + Math.sin(now * 0.004 + i) * 0.06;
    });
    const trackDrift = dt * 10.5 * speed * boost * (reduceMotion ? 0.45 : 1);
    for (const segment of trackSegments) {
      segment.deck.position.z += trackDrift;
      segment.center.position.z += trackDrift;
      if (segment.deck.position.z > 8) {
        segment.deck.position.z -= 18 * 5.2;
        segment.center.position.z = segment.deck.position.z;
      }
      segment.walls.forEach(wall => { wall.position.z = segment.deck.position.z; });
      segment.wallGlows.forEach(glow => {
        glow.position.z = segment.deck.position.z;
        glow.material.opacity = 0.48 + Math.sin(now * 0.005 + segment.deck.position.z) * 0.14;
      });
      segment.center.material.opacity = 0.2 + Math.sin(now * 0.006 + segment.center.position.z) * 0.08;
    }
    for (const ring of tunnelRings) {
      ring.position.z += trackDrift;
      ring.rotation.z += dt * 0.09;
      if (ring.position.z > 8) ring.position.z -= 13 * 7;
    }
    for (const pair of pylonPairs) {
      pair.position.z += trackDrift;
      if (pair.position.z > 8) pair.position.z -= 13 * 7;
    }
    for (const group of stationPieces) {
      group.position.z += trackDrift * 0.92;
      group.rotation.y = Math.sin(elapsed * 0.35 + group.position.z) * 0.025;
      if (group.position.z > 10) group.position.z -= 18 * 5.4;
    }
    for (const group of canyonPieces) {
      group.position.z += trackDrift * 0.82;
      group.rotation.y = Math.sin(elapsed * 0.18 + group.position.z) * 0.035;
      if (group.position.z > 12) group.position.z -= 30 * 4.3;
    }
    for (const model of ownedScenery.children) {
      model.position.z += trackDrift * 0.84;
      model.rotation.y += Math.sin(elapsed * 0.28 + model.userData.streamOffset) * dt * 0.012;
      if (model.position.z > 12) model.position.z -= setpieceWrap;
    }
    for (const plane of nebulaPlanes) {
      plane.position.z += dt * 0.75 * speed;
      plane.rotation.z += dt * 0.018;
      if (plane.position.z > -18) plane.position.z -= 72;
    }
    planetGroup.rotation.y += dt * 0.025;
    planetGroup.position.x = 13 + Math.sin(elapsed * 0.18) * 1.2;
    for (const pl of planets) {
      pl.position.z += dt * 0.4; pl.rotation.y += dt * 0.05;
      if (pl.position.z > -8) pl.position.set((Math.random() - 0.5) * 34, 4 + Math.random() * 10, -92);
    }
    cometStreakT -= dt;
    if (cometStreakT <= 0 && !reduceMotion) { cometStreak.position.set(-16, 8 + Math.random() * 6, -55); cometStreak.userData.run = 1.2; cometStreakT = 20 + Math.random() * 10; }
    if (cometStreak.userData.run > 0) { cometStreak.userData.run -= dt; cometStreak.position.x += dt * 34; cometStreak.material.opacity = Math.max(0, cometStreak.userData.run / 1.2) * 0.8; }
    if (finaleComet) { finaleComet.position.x = -14 + Math.sin(elapsed * 0.3) * 8; finaleComet.rotation.y += dt * 0.4; }

    const shipTargetX = laneX(laneIx);
    ship.position.x += (shipTargetX - ship.position.x) * Math.min(1, dt * 12);
    ship.rotation.z = (shipTargetX - ship.position.x) * -0.25;
    if (rollT > 0) { ship.rotation.z += Math.sin((1 - rollT / 0.38) * Math.PI) * -rollDir * 0.7; rollT -= dt; }
    shipShadow.position.x = ship.position.x;
    shipShadow.scale.setScalar(1 + Math.abs(ship.rotation.z) * 0.18 + (boost > 1 ? 0.18 : 0));
    shipShadow.material.opacity = 0.34 + (boost > 1 ? 0.1 : 0);
    camera.position.y = 2.6 + Math.sin(elapsed * 1.3) * 0.05;
    shipPulse = Math.max(0, shipPulse - dt); ship.scale.setScalar(SHIP_BASE_SCALE * (1 + shipPulse * 0.3));
    const bl = boost > 1 ? 1.6 : 1;
    const fl = (0.9 + Math.random() * 0.25) * bl;
    plume.scale.set(fl, (0.8 + Math.random() * 0.5) * bl, fl);
    plumeCore.scale.set(1, 0.7 + Math.random() * 0.6, 1);
    engineLight.intensity = 0.9 + Math.random() * 0.6;

    const fovWant = boost > 1 ? BOOST_FOV : CAMERA_FOV;
    if (Math.abs(fov - fovWant) > 0.1) { fov += (fovWant - fov) * Math.min(1, dt * 6); camera.fov = fov; camera.updateProjectionMatrix(); }
    for (const q of speedLines) {
      q.material.opacity = (boost > 1 && !reduceMotion) ? 0.5 : Math.max(0, q.material.opacity - dt * 3);
      q.scale.y = boost > 1 ? 1.7 : 1;
      q.position.z += dt * 40 * boost; if (q.position.z > 6) q.position.z = -6;
    }
    if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) { const b = el("banner"); if (b) { b.style.opacity = "0"; b.style.transform = "translateX(-40px)"; } } }

    // Start-of-round get-ready countdown (3-2-1-GO); holds spawning until it finishes.
    // Frozen while paused, so it can't flip running=true behind the quit dialog.
    if (countdownT > 0) {
      if (!paused) countdownT -= dt;
      const cd = el("countdown");
      if (cd) { const n = cd.querySelector('[data-rr="cd-num"]'); if (n) n.textContent = countdownT > 0.5 ? String(Math.max(1, Math.ceil(countdownT - 0.4))) : "GO!"; }
      if (countdownT <= 0 && !paused) { if (cd) cd.style.display = "none"; running = true; }
    }

    if (running) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && queue.length) {
        // Pair spawns: two objects in different lanes as depth ramps — real
        // hands-busy difficulty, not a single-file trickle.
        const spawnOne = avoidLane => {
          const item = queue.shift();
          let lane = item.guaranteed ? laneIx : Math.floor(Math.random() * 3);
          if (avoidLane != null && lane === avoidLane) lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
          bubbles.push(item.ring ? makeRing(lane) : item.heart ? makeHeart(lane) : item.meteor ? makeMeteor(lane) : makeBubble(item.word, item.correct, lane, item.tries));
          // Entry readers should not need to decode a moving word before they
          // can practise its first sound. Easy mode says each word as it enters,
          // creating a true listen → identify → steer loop.
          if (opts.difficulty === "easy" && item.word) say(() => speakWord(item.word));
          return lane;
        };
        const lane = spawnOne(null);
        const pairChance = opts.difficulty === "easy"
          ? 0
          : Math.min(0.35, 0.08 + roundIx * 0.03 + (opts.difficulty === "hard" ? 0.1 : 0));
        if (queue.length && Math.random() < pairChance) spawnOne(lane);
        // Spacing GROWS with speed: the old 1.0/speed collapsed the reaction gap to
        // ~0.3s at high speed. Floor it (~0.7s min) so faster = more spread out, not
        // an unavoidable wall — the child always has time to change lanes.
        spawnTimer = opts.difficulty === "easy"
          ? 2.05
          : Math.max(0.7, 1.2 / Math.sqrt(speed));
      }
      const noseZ = ship.position.z - 1.9; // catch at the rocket's NOSE, not its centre/tail
      for (const bubble of bubbles) {
        if (!bubble.userData.alive) continue;
        bubble.position.z += dt * 11 * speed * boost;
        if (bubble.userData.meteor) bubble.userData.rock.rotation.x += dt * 1.8;
        else if (bubble.userData.ring) bubble.rotation.z += dt * 1.4;
        else if (bubble.userData.orb) {
          bubble.userData.orb.rotation.y += dt * 1.5;
          if (bubble.userData.cage) bubble.userData.cage.rotation.y -= dt * 0.9;
          if (bubble.userData.halo) bubble.userData.halo.rotation.z += dt * 1.1;
        }

        if (!bubble.userData.passed) {
          if (bubble.position.z >= noseZ - 0.7 && bubble.position.z <= noseZ + 0.7) {
            resolveBubble(bubble);
            continue;
          }
          if (bubble.position.z > noseZ + 0.7) {
            // Crossed the ROCKET NOSE uncaught — pass-by cue fires HERE.
            bubble.userData.passed = true;
            if (bubble.userData.correct) requeueMissed(bubble.userData);
            else if (!bubble.userData.meteor && !bubble.userData.ring && !bubble.userData.heart) sfx(playWhoosh);
          }
        } else {
          const fade = Math.max(0, 1 - (bubble.position.z - noseZ - 0.7) / 2.8);
          if (bubble.userData.setFade) bubble.userData.setFade(fade);
          if (bubble.position.z > camera.position.z + 2) {
            bubble.userData.alive = false;
            scene.remove(bubble); disposeGroup(bubble);
          }
        }
      }
      bubbles = bubbles.filter(bubble => bubble.userData.alive);
      if (!queue.length && !bubbles.length && caught < needed) refillQueue(); // loop until enough correct caught
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
    const renderedTier = premiumRender.render(dt);
    if (renderedTier !== qualityTier) {
      qualityTier = renderedTier;
      applyQualityTier(renderer, qualityTier);
    }
  }
  premiumRender.prepareObject(scene);
  startRound();
  const loop = createFrameLoop(tick);
  loop.start();

  let paused = false, savedRunning = false, introActive = false;
  function pause() { if (paused) return; paused = true; savedRunning = running; running = false; }
  function resume() { if (!paused || introActive) return; paused = false; last = performance.now(); if (savedRunning) running = true; }

  // First-run onboarding: one goal line + the controls, shown once per device.
  // Gameplay freezes through the game's own pause path (countdown and spawns
  // are both gated on paused/running), so the GamePlayer chrome pause and this
  // overlay can't fight — a chrome resume is ignored until the child dismisses.
  function dismissIntro() {
    if (!introActive) return;
    introActive = false;
    markOnboardingSeen("rocket-run");
    const overlay = el("overlay");
    if (overlay) overlay.style.display = "none";
    window.removeEventListener("keydown", onIntroKey, true);
    // This is the first guaranteed user gesture on iPad. Replay the target here
    // so Safari's audio lock cannot swallow the round's essential cue.
    sfx(playTapSound);
    replayTarget();
    resume();
  }
  function onIntroKey(event) {
    if (isInteractiveKeyTarget(event.target)) return;
    const key = String(event.key || "").toLowerCase();
    if (!(key === " " || key === "enter" || laneDirectionForKey(event.key))) return;
    event.preventDefault();
    dismissIntro();
  }
  if (!hasSeenOnboarding("rocket-run")) {
    introActive = true;
    pause();
    const overlay = showOverlay(
      '<div style="display:grid;gap:12px;justify-items:center;max-width:min(520px,88vw)">' +
      '<div style="font-size:.8rem;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#7ff0ff">Rocket Run</div>' +
      '<div style="font-size:clamp(1.55rem,4.5vw,2.2rem);font-weight:900;line-height:1.08;text-wrap:balance">Listen. Choose. Fly!</div>' +
      '<div aria-hidden="true" style="display:flex;align-items:center;gap:16px;font-size:2.2rem"><svg viewBox="0 0 24 24" width="38" height="38"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Zm11.5-.7v7.4a4.5 4.5 0 0 0 0-7.4Zm0-3.3v2.1a7 7 0 0 1 0 9.8V19a9 9 0 0 0 0-14Z"/></svg><span>→</span><svg viewBox="0 0 24 24" width="44" height="44"><path fill="currentColor" d="M14.4 3.1c2.2-.9 4.4-.8 6.5-.6.2 2.2.2 4.5-.7 6.6l-3.1 3.1-5.3-5.3 2.6-3.8ZM10.7 8l5.3 5.3-3 3-2.2-.6-2.5 2.5-2.5-2.5 2.5-2.5-.6-2.2 3-3Zm-4.2 9.3c-.9.2-2.4 1.2-2.8 3 .9-.4 2.1-.7 3.2-.5.2-1 .9-1.9 1.7-2.5l-2.1-.1Z"/></svg></div>' +
      '<div style="font-size:1rem;font-weight:750;line-height:1.45;opacity:.94">Hear the word. Fly to it if it begins with the target sound.</div>' +
      '<div style="display:flex;align-items:center;gap:12px;font-size:.92rem;font-weight:750;opacity:.82"><span>← tap left</span><span>tap right →</span></div>' +
      '<button data-rr="intro-play" style="' + overlayButtonStyle + '">Play</button>' +
      '</div>'
    );
    overlay.querySelector('[data-rr="intro-play"]').addEventListener("click", dismissIntro);
    overlay.addEventListener("pointerdown", dismissIntro);
    window.addEventListener("keydown", onIntroKey, true);
  }
  const detachContextGuard = attachContextLossGuard(renderer, {
    onLost: pause,
    onRestored: () => {
      premiumRender.restoreContext();
      resume();
    }
  });
  function teardown() {
    loop.stop();
    detachContextGuard();
    detachSteerZones();
    detachSwipeSteer();
    motionQuery?.removeEventListener?.("change", syncMotionPreference);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keydown", onIntroKey, true);
    hearTargetButton?.removeEventListener("pointerdown", onHearTargetPointerDown);
    hearTargetButton?.removeEventListener("click", replayTarget);
    detachResize();
    for (const b of bubbles) { scene.remove(b); disposeGroup(b); }
    scene.remove(ship); disposeGroup(ship);
    scene.remove(shipShadow); disposeGroup(shipShadow);
    for (const layer of starLayers) { scene.remove(layer); disposeGroup(layer); }
    for (const r of rails) { scene.remove(r); disposeGroup(r); }
    scene.remove(trackGroup); disposeGroup(trackGroup);
    for (const ring of tunnelRings) { scene.remove(ring); disposeGroup(ring); }
    for (const pair of pylonPairs) { scene.remove(pair); disposeGroup(pair); }
    for (const group of stationPieces) { scene.remove(group); disposeGroup(group); }
    for (const group of canyonPieces) { scene.remove(group); disposeGroup(group); }
    ownedSceneryDisposed = true;
    scene.remove(ownedScenery);
    for (const model of ownedScenery.children) disposeOwnedModelInstance(model);
    ownedScenery.clear();
    ridgeMats.forEach(mat => mat.dispose());
    for (const plane of nebulaPlanes) { scene.remove(plane); disposeGroup(plane); }
    scene.remove(planetGroup); disposeGroup(planetGroup);
    for (const pl of planets) { scene.remove(pl); disposeGroup(pl); }
    for (const q of speedLines) { scene.remove(q); disposeGroup(q); }
    scene.remove(cometStreak); disposeGroup(cometStreak);
    scene.remove(themeSun); disposeGroup(themeSun);
    if (sceneBackground?.dispose) sceneBackground.dispose();
    if (finaleComet) { scene.remove(finaleComet); disposeGroup(finaleComet); }
    premiumRender.destroy();
    disposeRenderer(renderer, { forceContextLoss: true });
    if (hud.parentNode) hud.parentNode.removeChild(hud);
  }
  return { teardown, pause, resume };
}

export default function RocketRunGame({ difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, onExit, isSoundEnabled = true }) {
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
        try {
          api = startGame(THREE, mountRef.current, { difficulty, startLevel, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onExit, getSound: () => soundRef.current });
          if (onEngineReady) onEngineReady(api);
          setStatus("playing");
        } catch (err) {
          // A WebGL/setup failure used to be swallowed into the generic error
          // screen with no clue why — log the real cause so it's diagnosable,
          // and clean up any partial scene the failed start left behind.
          console.error("[RocketRun] failed to start:", err);
          try { api.teardown(); } catch { /* ignore */ }
          if (!cancelled) setStatus("error");
        }
      })
      .catch(err => { console.error("[RocketRun] three.js failed to load:", err); if (!cancelled) setStatus("error"); });
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
        <div className="rocket-run-status" style={statusStyle}>This game needs 3D graphics. Try refreshing the page, or pick another game!</div>
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
