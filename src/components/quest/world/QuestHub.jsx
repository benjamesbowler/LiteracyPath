// SOUND SEEKERS TRAIL - a long guided journey with room to roam.
//
// Three.js owns the path, forest walls, camera, and gate. React owns the
// illustrated creature, friends, collectibles, and phonics encounters. Only the
// next story encounter is active, so the 40-stop curriculum stays coherent
// without making movement feel like a side-scrolling level.

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CreatureFigure from "../CreatureFigure.jsx";
import Guide from "./Guide.jsx";
import Prop from "./Prop.jsx";
import { ENCOUNTER_VIEWS } from "./encounterViews.js";
import {
  buildTrailSection,
  clampTrailPosition,
  firstUnsolvedEncounter,
  forwardLimitFor,
  trailCenterX,
  trailHalfWidth,
  trailProgress,
  TRAIL_BOUNDS,
  TRAIL_EXIT_Z,
  TRAIL_START
} from "../../../utils/questHub.js";
import { targetsForStop } from "../../../utils/questReviewScheduler.js";
import { targetsAtStop, getStop, QUEST_STOPS } from "../../../data/questSequence.js";
import { starRubric } from "../../../utils/starRubric.js";
import { playStarChime, playWhoosh } from "../../../utils/audio/gameSfx.js";

const MOVE_SPEED = 4.6;
const ENCOUNTER_REACH = 1.7;
const AUTOSAVE_MS = 1200;

const WORLD_THEMES = {
  meadow: {
    name: "Sunlit Meadow",
    ground: 0x719956,
    path: 0xd8bc80,
    pathEdge: 0xa9834e,
    canopy: [0x3f7638, 0x568a43, 0x6f9b4c, 0x86aa59],
    trunk: 0x705035,
    fog: 0xcce0aa,
    stone: 0x849181,
    gate: 0x85522f
  },
  dino: {
    name: "Fossil Ridge",
    ground: 0x9b794b,
    path: 0xd6b77f,
    pathEdge: 0x735236,
    canopy: [0x476b43, 0x5f794b, 0x758653, 0x8b965c],
    trunk: 0x62442e,
    fog: 0xd5bf8d,
    stone: 0x897963,
    gate: 0x76503a
  },
  moonwood: {
    name: "Moonwood",
    ground: 0x344f4b,
    path: 0x7a7187,
    pathEdge: 0x40384d,
    canopy: [0x244d55, 0x315b61, 0x42656a, 0x5d7073],
    trunk: 0x40364a,
    fog: 0x45536e,
    stone: 0x69717d,
    gate: 0x58445f
  }
};

function pathRibbon(points, width, y, color) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(point => new THREE.Vector3(point.x, y, point.z)),
    false,
    "catmullrom",
    0.34
  );
  const steps = 150;
  const vertices = [];
  const indices = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    vertices.push(point.x + side.x, y, point.z + side.z, point.x - side.x, y, point.z - side.z);
    if (index < steps) {
      const a = index * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide })
  );
  mesh.receiveShadow = true;
  return mesh;
}

function addTree(scene, x, z, size, theme, shade = 0) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * size, 0.24 * size, 1.35 * size, 7),
    new THREE.MeshStandardMaterial({ color: theme.trunk, roughness: 1, flatShading: true })
  );
  trunk.position.set(x, 0.65 * size, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.88 * size, 0),
    new THREE.MeshStandardMaterial({ color: theme.canopy[shade % theme.canopy.length], roughness: 0.95, flatShading: true })
  );
  crown.scale.set(1, 1.2, 1);
  crown.position.set(x, 1.65 * size, z);
  crown.castShadow = true;
  scene.add(crown);
}

function buildGate(scene, section, theme) {
  const group = new THREE.Group();
  group.position.set(section.gate.x, 0, section.gate.z);
  const wood = new THREE.MeshStandardMaterial({ color: theme.gate, roughness: 0.92, flatShading: true });
  const cap = new THREE.MeshStandardMaterial({ color: theme.pathEdge, roughness: 1, flatShading: true });

  for (const x of [-3.35, 3.35]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.7, 0.5), wood);
    post.position.set(x, 1.75, 0);
    post.castShadow = true;
    group.add(post);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 5), cap);
    top.position.set(x, 3.9, 0);
    top.castShadow = true;
    group.add(top);
  }

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.48, 0.55), wood);
  lintel.position.set(0, 3.25, 0);
  lintel.castShadow = true;
  group.add(lintel);

  const left = new THREE.Group();
  left.position.set(-3.1, 0, 0);
  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(3.05, 2.5, 0.26), wood);
  leftDoor.position.set(1.5, 1.3, 0);
  leftDoor.castShadow = true;
  left.add(leftDoor);

  const right = new THREE.Group();
  right.position.set(3.1, 0, 0);
  const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(3.05, 2.5, 0.26), wood);
  rightDoor.position.set(-1.5, 1.3, 0);
  rightDoor.castShadow = true;
  right.add(rightDoor);

  group.add(left, right);
  scene.add(group);
  return { left, right };
}

function buildLandscape(scene, section, theme) {
  const length = TRAIL_BOUNDS.startZ - TRAIL_BOUNDS.endZ + 18;
  const groundGeometry = new THREE.PlaneGeometry(34, length, 20, 96);
  const positions = groundGeometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    positions.setZ(index, Math.sin(x * 0.54) * 0.05 + Math.cos(y * 0.19) * 0.07);
  }
  groundGeometry.computeVertexNormals();
  const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshStandardMaterial({ color: theme.ground, roughness: 1, flatShading: true })
  );
  ground.name = "trail-ground";
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = (TRAIL_BOUNDS.startZ + TRAIL_BOUNDS.endZ) / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const points = [];
  for (let z = TRAIL_BOUNDS.startZ + 4; z >= TRAIL_BOUNDS.endZ - 4; z -= 4) {
    points.push({ x: trailCenterX(z, section.stopIndex), z });
  }
  scene.add(pathRibbon(points, 7.35, 0.075, theme.pathEdge));
  scene.add(pathRibbon(points, 6.6, 0.105, theme.path));

  // The two dense tree belts are both scenery and the readable collision wall.
  // Several staggered rows stop the route reading as a thin road on a flat map.
  let treeIndex = 0;
  for (let z = TRAIL_BOUNDS.startZ + 2; z >= TRAIL_BOUNDS.endZ - 3; z -= 3.7) {
    const center = trailCenterX(z, section.stopIndex);
    const width = trailHalfWidth(z, section.stopIndex);
    for (const side of [-1, 1]) {
      for (let row = 0; row < 3; row += 1) {
        const stagger = ((treeIndex + row * 3) % 5) * 0.18;
        const x = center + side * (width + 1.05 + row * 2.05 + stagger);
        const treeZ = z + (row % 2 ? 1.45 : 0) + Math.sin(treeIndex * 1.7) * 0.35;
        const size = 0.82 + ((treeIndex * 11 + row * 7) % 10) * 0.045;
        addTree(scene, x, treeZ, size, theme, treeIndex + row);
      }
    }
    treeIndex += 1;
  }

  const rockMaterial = new THREE.MeshStandardMaterial({ color: theme.stone, roughness: 1, flatShading: true });
  for (let index = 0; index < 18; index += 1) {
    const z = 3 - index * 7.1;
    const side = index % 2 ? 1 : -1;
    const x = trailCenterX(z, section.stopIndex) + side * (trailHalfWidth(z, section.stopIndex) - 0.25);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24 + (index % 3) * 0.07, 0), rockMaterial);
    rock.scale.y = 0.62;
    rock.position.set(x, 0.2, z);
    rock.rotation.y = index * 0.73;
    rock.castShadow = true;
    scene.add(rock);
  }

  return { ground, gate: buildGate(scene, section, theme) };
}

function projectElement(element, worldPosition, camera, viewport, { lift = 0, scale = 1, anchor = "-88%" } = {}) {
  if (!element) return;
  const point = new THREE.Vector3(worldPosition.x, lift, worldPosition.z);
  const distance = camera.position.distanceTo(point);
  point.project(camera);
  const visible = distance < 35 && point.z > -1 && point.z < 1 && Math.abs(point.x) < 1.08 && point.y < 0.78 && point.y > -1.15;
  element.hidden = !visible;
  if (!visible) return;
  const x = (point.x * 0.5 + 0.5) * viewport.width;
  const y = (-point.y * 0.5 + 0.5) * viewport.height;
  const perspective = THREE.MathUtils.clamp(11 / distance, 0.46, 1.06);
  element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, ${anchor}) scale(${perspective * scale})`;
  element.style.zIndex = String(Math.round(600 - distance * 9));
}

export default function QuestHub({
  stopId,
  state,
  resume = null,
  isSoundEnabled = true,
  onAnswer,
  onCheckpoint,
  onFinish,
  onQuit
}) {
  const stop = getStop(stopId);
  const [section] = useState(() => {
    const targets = targetsForStop(targetsAtStop(stopId), state.mastery, stop?.index || 1);
    const seed = (stop?.index || 1) * 1000 + (state.trail.stopsDone.length || 0);
    return buildTrailSection(stopId, { mastery: state.mastery, targets, seed });
  });
  const theme = WORLD_THEMES[section?.world] || WORLD_THEMES.meadow;

  const validEncounterIds = new Set(section?.encounters.map(encounter => encounter.id) || []);
  const validDropIds = new Set(section?.drops.map(drop => drop.id) || []);
  const initialSolved = Array.isArray(resume?.solved) ? resume.solved.filter(id => validEncounterIds.has(id)) : [];
  const initialPicked = Array.isArray(resume?.drops) ? resume.drops.filter(id => validDropIds.has(id)) : [];
  const initialGuideDone = Boolean(resume?.guideDone) || !section?.teach?.length;
  const initialMeetIndex = Math.max(0, Math.min(section?.teach?.length - 1 || 0, Number(resume?.meetIndex) || 0));
  const initialLimit = forwardLimitFor(section, { guideDone: initialGuideDone, solved: initialSolved });
  const initialPosition = clampTrailPosition(resume?.position || TRAIL_START, section?.stopIndex, initialLimit);
  const resumedActive = section?.encounters.find(encounter => encounter.id === resume?.activeId && !initialSolved.includes(encounter.id)) || null;
  const initialBeatIndex = Math.max(0, Math.min((resumedActive?.beats.length || 1) - 1, Number(resume?.beatIndex) || 0));
  const initialTally = resume?.tally && typeof resume.tally === "object"
    ? { correct: Number(resume.tally.correct) || 0, total: Number(resume.tally.total) || 0, mistakes: Number(resume.tally.mistakes) || 0 }
    : { correct: 0, total: 0, mistakes: 0 };
  const initialPhase = resume?.phase === "teach" && !initialGuideDone ? "teach" : "trail";
  const initialGateOpen = section?.encounters.every(encounter => initialSolved.includes(encounter.id)) || false;
  const initialRoutePercent = Math.round(trailProgress(initialPosition.z) * 100);

  const playerRef = useRef({ ...initialPosition });
  const targetRef = useRef({ ...initialPosition });
  const solvedRef = useRef(new Set(initialSolved));
  const pickedRef = useRef(new Set(initialPicked));
  const guideDoneRef = useRef(initialGuideDone);
  const meetIndexRef = useRef(initialMeetIndex);
  const selectedRef = useRef(null);
  const activeRef = useRef(resumedActive);
  const beatIndexRef = useRef(initialBeatIndex);
  const phaseRef = useRef(initialPhase);
  const tallyRef = useRef(initialTally);
  const lastCorrectRef = useRef(resumedActive?.kind === "story-rock");
  const onCheckpointRef = useRef(onCheckpoint);
  const finishingRef = useRef(false);

  const [phase, setPhase] = useState(initialPhase);
  const [guideDone, setGuideDone] = useState(initialGuideDone);
  const [meetIndex, setMeetIndex] = useState(initialMeetIndex);
  const [solved, setSolved] = useState(() => new Set(initialSolved));
  const [picked, setPicked] = useState(() => new Set(initialPicked));
  const [selectedId, setSelectedId] = useState(null);
  const [active, setActive] = useState(resumedActive);
  const [beatIndex, setBeatIndex] = useState(initialBeatIndex);
  const [retryNonce, setRetryNonce] = useState(0);
  const [mood, setMood] = useState("idle");
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [gateOpen, setGateOpen] = useState(initialGateOpen);
  const [routePercent, setRoutePercent] = useState(initialRoutePercent);

  const canvasRef = useRef(null);
  const playerElementRef = useRef(null);
  const guideRef = useRef(null);
  const landmarkRefs = useRef(new Map());
  const dropRefs = useRef(new Map());

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { onCheckpointRef.current = onCheckpoint; }, [onCheckpoint]);
  useEffect(() => { meetIndexRef.current = meetIndex; }, [meetIndex]);
  useEffect(() => { beatIndexRef.current = beatIndex; }, [beatIndex]);

  const checkpoint = useCallback((overrides = {}) => {
    const currentActive = overrides.active === undefined ? activeRef.current : overrides.active;
    const nextSolved = overrides.solved || solvedRef.current;
    const nextPicked = overrides.picked || pickedRef.current;
    onCheckpointRef.current?.({
      stopId,
      phase: overrides.phase || phaseRef.current,
      position: { ...playerRef.current },
      guideDone: overrides.guideDone ?? guideDoneRef.current,
      meetIndex: overrides.meetIndex ?? meetIndexRef.current,
      activeId: currentActive?.id || null,
      beatIndex: overrides.beatIndex ?? beatIndexRef.current,
      solved: [...nextSolved],
      drops: [...nextPicked],
      tally: { ...tallyRef.current }
    });
  }, [stopId]);

  useEffect(() => {
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") checkpoint();
    };
    const saveOnPageHide = () => checkpoint();
    document.addEventListener("visibilitychange", saveWhenHidden);
    window.addEventListener("pagehide", saveOnPageHide);
    return () => {
      checkpoint();
      document.removeEventListener("visibilitychange", saveWhenHidden);
      window.removeEventListener("pagehide", saveOnPageHide);
    };
  }, [checkpoint]);

  const moveToEncounter = useCallback(encounter => {
    const next = firstUnsolvedEncounter(section, solvedRef.current);
    if (!encounter || encounter.id !== next?.id || activeRef.current || !guideDoneRef.current) return;
    selectedRef.current = encounter.id;
    setSelectedId(encounter.id);
    const limit = forwardLimitFor(section, { guideDone: true, solved: solvedRef.current });
    targetRef.current = clampTrailPosition({ x: encounter.x, z: encounter.z + 0.8 }, section.stopIndex, limit);
    if (isSoundEnabled) playWhoosh();
  }, [isSoundEnabled, section]);

  useEffect(() => {
    if (!section || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setSceneError(true));
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(theme.fog, 17, 42);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 95);
    const landscape = buildLandscape(scene, section, theme);

    scene.add(new THREE.HemisphereLight(0xfff7d7, theme.ground, 2.2));
    const sun = new THREE.DirectionalLight(0xfff1c2, 3.25);
    sun.position.set(-7, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    const viewport = { width: 1, height: 1 };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      viewport.width = Math.max(1, rect.width);
      viewport.height = Math.max(1, rect.height);
      renderer.setSize(viewport.width, viewport.height, false);
      camera.aspect = viewport.width / viewport.height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const keys = new Set();
    let frame = 0;
    let readySent = false;
    let previous = performance.now();
    let wasMoving = false;
    let lastAutosave = performance.now();
    let lastPercent = Math.round(trailProgress(playerRef.current.z) * 100);
    let gateAmount = section.encounters.every(encounter => solvedRef.current.has(encounter.id)) ? 1 : 0;

    const currentLimit = () => forwardLimitFor(section, {
      guideDone: guideDoneRef.current,
      solved: solvedRef.current
    });

    const onPointer = event => {
      if (phaseRef.current !== "trail" || activeRef.current) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(landscape.ground, false)[0];
      if (!hit) return;
      selectedRef.current = null;
      setSelectedId(null);
      targetRef.current = clampTrailPosition(hit.point, section.stopIndex, currentLimit());
    };

    const onKeyDown = event => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
        keys.add(event.key.toLowerCase());
        event.preventDefault();
      }
    };
    const onKeyUp = event => keys.delete(event.key.toLowerCase());
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const beginEncounter = encounter => {
      activeRef.current = encounter;
      selectedRef.current = null;
      targetRef.current = { ...playerRef.current };
      beatIndexRef.current = 0;
      lastCorrectRef.current = encounter.kind === "story-rock";
      setSelectedId(null);
      setBeatIndex(0);
      setActive(encounter);
      checkpoint({ active: encounter, beatIndex: 0, phase: "trail" });
    };

    const animate = now => {
      const dt = Math.min(0.045, (now - previous) / 1000);
      previous = now;
      const player = playerRef.current;
      let moving = false;

      if (phaseRef.current === "trail" && !activeRef.current && !finishingRef.current) {
        let dx = 0;
        let dz = 0;
        if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
        if (keys.has("arrowright") || keys.has("d")) dx += 1;
        if (keys.has("arrowup") || keys.has("w")) dz -= 1;
        if (keys.has("arrowdown") || keys.has("s")) dz += 1;

        if (dx || dz) {
          const length = Math.hypot(dx, dz);
          const next = clampTrailPosition({
            x: player.x + (dx / length) * MOVE_SPEED * dt,
            z: player.z + (dz / length) * MOVE_SPEED * dt
          }, section.stopIndex, currentLimit());
          Object.assign(player, next);
          targetRef.current = { ...player };
          selectedRef.current = null;
          moving = true;
        } else {
          const tx = targetRef.current.x - player.x;
          const tz = targetRef.current.z - player.z;
          const distance = Math.hypot(tx, tz);
          if (distance > 0.04) {
            const step = Math.min(distance, MOVE_SPEED * dt);
            const next = clampTrailPosition({
              x: player.x + (tx / distance) * step,
              z: player.z + (tz / distance) * step
            }, section.stopIndex, currentLimit());
            Object.assign(player, next);
            moving = true;
          }
        }

        if (!guideDoneRef.current && Math.hypot(section.guide.x - player.x, section.guide.z - player.z) <= ENCOUNTER_REACH) {
          targetRef.current = { ...player };
          phaseRef.current = "teach";
          setPhase("teach");
          moving = false;
          checkpoint({ phase: "teach" });
        } else if (guideDoneRef.current) {
          const nextEncounter = firstUnsolvedEncounter(section, solvedRef.current);
          if (nextEncounter && Math.hypot(nextEncounter.x - player.x, nextEncounter.z - player.z) <= ENCOUNTER_REACH) {
            beginEncounter(nextEncounter);
            moving = false;
          }
        }

        const foundDrop = section.drops.find(drop => (
          !pickedRef.current.has(drop.id)
          && Math.hypot(drop.x - player.x, drop.z - player.z) < 0.72
        ));
        if (foundDrop) {
          const next = new Set([...pickedRef.current, foundDrop.id]);
          pickedRef.current = next;
          setPicked(next);
          if (isSoundEnabled) playStarChime();
          checkpoint({ picked: next });
        }

        const allSolved = section.encounters.every(encounter => solvedRef.current.has(encounter.id));
        if (allSolved && player.z <= TRAIL_EXIT_Z + 0.15) {
          finishingRef.current = true;
          targetRef.current = { ...player };
          checkpoint();
          const score = tallyRef.current;
          const stars = starRubric({ correct: score.correct, total: score.total, mistakes: score.mistakes, deaths: 0 });
          onFinish?.(stars, { ...score, drops: pickedRef.current.size });
        }
      }

      if (moving !== wasMoving) {
        wasMoving = moving;
        setMood(moving ? "walk" : "idle");
      }

      if (moving && now - lastAutosave >= AUTOSAVE_MS) {
        lastAutosave = now;
        checkpoint();
      }

      const percent = Math.round(trailProgress(player.z) * 100);
      if (percent !== lastPercent && percent % 2 === 0) {
        lastPercent = percent;
        setRoutePercent(percent);
      }

      const allSolved = section.encounters.every(encounter => solvedRef.current.has(encounter.id));
      gateAmount = THREE.MathUtils.lerp(gateAmount, allSolved ? 1 : 0, 1 - Math.pow(0.003, dt));
      landscape.gate.left.rotation.y = -gateAmount * 1.33;
      landscape.gate.right.rotation.y = gateAmount * 1.33;

      const desiredCamera = new THREE.Vector3(player.x, 8.8, player.z + 9.6);
      camera.position.lerp(desiredCamera, 1 - Math.pow(0.002, dt));
      camera.lookAt(player.x, 0.2, player.z - 4.1);

      projectElement(playerElementRef.current, player, camera, viewport, { lift: 0.26, scale: 0.88, anchor: "-76%" });
      projectElement(guideRef.current, section.guide, camera, viewport, { lift: 0.36, scale: 0.78 });
      for (const encounter of section.encounters) {
        projectElement(landmarkRefs.current.get(encounter.id), encounter, camera, viewport, { lift: 0.24, scale: 0.88 });
      }
      for (const drop of section.drops) {
        projectElement(dropRefs.current.get(drop.id), drop, camera, viewport, { lift: 0.36, scale: 0.48, anchor: "-50%" });
      }

      renderer.render(scene, camera);
      if (!readySent) {
        readySent = true;
        setSceneReady(true);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      scene.traverse(object => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
    };
  }, [section, theme, isSoundEnabled, checkpoint, onFinish]);

  const answer = (correct, target) => {
    lastCorrectRef.current = correct;
    tallyRef.current.total += 1;
    if (correct) tallyRef.current.correct += 1;
    else tallyRef.current.mistakes += 1;
    setMood(correct ? "cheer" : "sad");
    if (target == null) return;
    for (const one of Array.isArray(target) ? target : [target]) {
      if (one) onAnswer?.(one, correct, activeRef.current?.kind || "trail");
    }
  };

  const nextBeat = () => {
    const current = activeRef.current;
    if (!current) return;
    // The final helper owns the physical gate. A miss gets another friendly try
    // at the same beat; there is no extra boss quiz and no permanent failure.
    if (current.atGate && !lastCorrectRef.current) {
      setRetryNonce(value => value + 1);
      setMood("idle");
      checkpoint({ active: current, beatIndex: beatIndexRef.current });
      return;
    }
    if (beatIndexRef.current + 1 < current.beats.length) {
      const nextIndex = beatIndexRef.current + 1;
      beatIndexRef.current = nextIndex;
      lastCorrectRef.current = current.kind === "story-rock";
      setBeatIndex(nextIndex);
      checkpoint({ active: current, beatIndex: nextIndex });
      return;
    }

    const nextSolved = new Set([...solvedRef.current, current.id]);
    solvedRef.current = nextSolved;
    activeRef.current = null;
    beatIndexRef.current = 0;
    setSolved(nextSolved);
    setActive(null);
    setBeatIndex(0);
    setMood("cheer");
    checkpoint({ solved: nextSolved, active: null, beatIndex: 0, phase: "trail" });

    if (section.encounters.every(encounter => nextSolved.has(encounter.id))) {
      setGateOpen(true);
      if (isSoundEnabled) playWhoosh();
    }
  };

  if (!section) return null;
  const View = active ? ENCOUNTER_VIEWS[active.kind] : null;
  const teach = section.teach[meetIndex];
  const nextEncounter = firstUnsolvedEncounter(section, solved);
  const sectionNumber = stop?.index || 1;

  const leaveWorld = () => {
    checkpoint();
    onQuit?.();
  };

  const moveToNext = () => {
    if (gateOpen) {
      targetRef.current = clampTrailPosition(section.exit, section.stopIndex, TRAIL_BOUNDS.endZ);
      if (isSoundEnabled) playWhoosh();
      return;
    }
    if (!guideDone) {
      targetRef.current = clampTrailPosition(
        { x: section.guide.x, z: section.guide.z + 0.8 },
        section.stopIndex,
        forwardLimitFor(section)
      );
      return;
    }
    if (nextEncounter) moveToEncounter(nextEncounter);
  };

  return (
    <main
      className={`q-screen qh-root${sceneReady ? " is-ready" : ""}${sceneError ? " has-fallback" : ""}`}
      data-world={section.world}
      style={{ "--qh-backdrop": `url(/images/quest/${section.world}/sky.webp)` }}
    >
      <canvas ref={canvasRef} className="qh-canvas" aria-label={`Follow the trail through ${theme.name}`} tabIndex="0" />

      {!sceneReady && !sceneError && <div className="qh-loading" aria-live="polite">Opening the trail...</div>}

      <div className="qh-world-layer" aria-hidden={phase !== "trail" || Boolean(active)}>
        {section.drops.map(drop => (
          <span
            key={drop.id}
            ref={node => { if (node) dropRefs.current.set(drop.id, node); else dropRefs.current.delete(drop.id); }}
            className={`qh-drop${picked.has(drop.id) ? " is-picked" : ""}`}
          >
            <img src="/images/quest/props/sun-drop.webp" alt="" draggable="false" />
          </span>
        ))}

        {section.encounters.map(encounter => {
          const isSolved = solved.has(encounter.id);
          const isNext = nextEncounter?.id === encounter.id && guideDone;
          return (
            <button
              key={encounter.id}
              ref={node => { if (node) landmarkRefs.current.set(encounter.id, node); else landmarkRefs.current.delete(encounter.id); }}
              type="button"
              className={`qh-landmark${isSolved ? " is-solved" : ""}${isNext ? " is-next" : ""}${selectedId === encounter.id ? " is-selected" : ""}`}
              disabled={!isNext || Boolean(active)}
              onClick={() => moveToEncounter(encounter)}
              aria-label={isSolved ? `${encounter.friend} helped` : isNext ? `Help ${encounter.friend} at ${encounter.label}` : `${encounter.label} is farther along the trail`}
            >
              <img className="qh-friend" src={`/images/quest/props/guide-${section.world}.webp`} alt="" draggable="false" />
              <Prop kind={encounter.kind} done={isSolved} />
              {isNext && <span className="qh-beacon" aria-hidden="true">?</span>}
              <span className="qh-place-name"><strong>{encounter.friend}</strong>{encounter.label}</span>
            </button>
          );
        })}

        <button
          ref={guideRef}
          type="button"
          className={`qh-resident${guideDone ? " is-met" : " is-next"}`}
          disabled={guideDone}
          onClick={() => {
            if (guideDone) return;
            targetRef.current = clampTrailPosition({ x: section.guide.x, z: section.guide.z + 0.8 }, section.stopIndex, forwardLimitFor(section));
          }}
          aria-label={guideDone ? `${section.guide.friend} taught the new sounds` : `Meet ${section.guide.friend}`}
        >
          {!guideDone && <span className="qh-beacon" aria-hidden="true">!</span>}
          <img src={`/images/quest/props/guide-${section.world}.webp`} alt="" draggable="false" />
          <span>{section.guide.friend}</span>
        </button>

        <div ref={playerElementRef} className="qh-player" aria-hidden="true">
          <CreatureFigure creature={state.creature} size={142} mood={mood} />
        </div>
      </div>

      <header className="qh-hud">
        <button type="button" className="q-ghost qh-leave" onClick={leaveWorld}>Back to the Den</button>
        <div className="qh-land-title">
          <span>{stop?.name || theme.name}</span>
          <strong>Trail {sectionNumber} of {QUEST_STOPS.length}</strong>
        </div>
        <div className="qh-drops" aria-label={`${picked.size} sparks found`}>
          <img src="/images/quest/props/sun-drop.webp" alt="" />
          <span>{picked.size}</span>
        </div>
      </header>

      <div className="qh-route-meter" aria-label={`${routePercent}% through this trail`}>
        <span style={{ "--qh-progress": `${routePercent}%` }} />
      </div>

      {phase === "trail" && !active && (
        <button type="button" className={`qh-next-call${gateOpen ? " is-gate" : ""}`} onClick={moveToNext} aria-live="polite">
          {gateOpen ? (
            <><strong>The gate is open</strong><span>Walk through to the next trail</span></>
          ) : !guideDone ? (
            <><strong>{section.guide.friend} is waiting</strong><span>Follow the path</span></>
          ) : nextEncounter ? (
            <><strong>{nextEncounter.friend} needs help</strong><span>{nextEncounter.label}</span></>
          ) : null}
        </button>
      )}

      {phase === "teach" && teach && (
        <Guide
          key={teach.id}
          world={section.world}
          entry={teach}
          isSoundEnabled={isSoundEnabled}
          last={meetIndex + 1 >= section.teach.length}
          onNext={() => {
            if (meetIndex + 1 < section.teach.length) {
              const nextIndex = meetIndex + 1;
              meetIndexRef.current = nextIndex;
              setMeetIndex(nextIndex);
              checkpoint({ phase: "teach", meetIndex: nextIndex });
            } else {
              guideDoneRef.current = true;
              setGuideDone(true);
              phaseRef.current = "trail";
              setPhase("trail");
              checkpoint({ phase: "trail", guideDone: true });
            }
          }}
        />
      )}

      {View && active && (
        <div className="qw-panel qh-panel">
          <View
            key={`${active.id}-${beatIndex}-${retryNonce}`}
            beat={active.beats[beatIndex]}
            index={beatIndex}
            total={active.beats.length}
            isSoundEnabled={isSoundEnabled}
            onBeat={answer}
            onDone={nextBeat}
          />
        </div>
      )}
    </main>
  );
}
