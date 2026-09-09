import {
  createRenderer, createScene, createPerspectiveCamera, applyQualityTier, detectQualityTier,
  QUALITY_TIERS, disposeRenderer
} from '../shared/threeShell.js';
import { createArcadePremiumRenderPipeline } from '../shared/arcadePremiumRender.js';
import { createOwnedModelInstance, disposeOwnedModelInstance } from '../shared/premiumGameAssets.js';
import { flightLayout, sectorForRound } from './rocketRunFlight.js';

// Existing CC0 Space Base kit, authored into three semantic compositions.
// Every referenced glTF and its buffer/atlas already belongs to the live library.
export const ROCKET_WORLD_ASSETS = Object.freeze([
  { model: 'basemodule_C', sector: 'hangar', role: 'loading terminal', position: [-5.3, 0, -12], height: 4.2, yaw: 0.7 },
  { model: 'cargo_A_stacked', sector: 'hangar', role: 'cargo ready to load', position: [4.8, 0, -6], height: 2.4, yaw: -0.4 },
  { model: 'lights', sector: 'hangar', role: 'gantry beacon', position: [5, 0, -16], height: 3.8, yaw: 0 },
  { model: 'drill_structure', sector: 'canyon', role: 'canyon mining outpost', position: [-5.8, 0, -11], height: 5, yaw: 0.3 },
  { model: 'windturbine_tall', sector: 'canyon', role: 'ridge wind beacon', position: [6, 0, -17], height: 6, yaw: -0.3 },
  { model: 'lander_A', sector: 'destination', role: 'receiving ship', position: [-5, 0, -12], height: 4.4, yaw: 0.4 },
  { model: 'solarpanel', sector: 'destination', role: 'receiving station power', position: [5, 0, -10], height: 3, yaw: -0.8 },
  { model: 'cargo_A_stacked', sector: 'destination', role: 'delivered supplies', position: [4.1, 0, -5], height: 1.8, yaw: 0.3 }
].map(record => Object.freeze({ ...record, path: '/models/library/kaykit/space/models/' + record.model + '.gltf',
  creator: 'Kay Lousberg', licence: 'CC0-1.0',
  source: 'https://github.com/KayKit-Game-Assets/KayKit-Space-Base-Bits-1.0',
  modification: 'Owned clone scaled and placed; source geometry/materials unchanged.' })));

export function createRocketScene(THREE, mount) {
  let width = mount.clientWidth || 640, height = mount.clientHeight || 420;
  let qualityTier = detectQualityTier(), disposed = false, contextLost = false, activeSector = '';
  let layout = flightLayout(width, height), lastLane = 1;
  const scene = createScene(THREE, new THREE.FogExp2(0x081a30, 0.024));
  scene.background = new THREE.Color(0x081a30);
  const camera = createPerspectiveCamera(THREE, { fov: 66, aspect: width / height, near: 0.1, far: 120,
    position: [0, 3.2, 9.8], lookAt: [0, 1.1, -7] });
  const renderTier = () => {
    const dpr = Math.min(QUALITY_TIERS[qualityTier]?.pixelRatioCap || 1, window.devicePixelRatio || 1);
    return width * height * dpr * dpr > 1600000 ? 'low' : qualityTier;
  };
  const renderer = createRenderer(THREE, { antialias: true, pixelRatioCap: QUALITY_TIERS[renderTier()].pixelRatioCap,
    srgbOutput: true, toneMappingExposure: 1.16, powerPreference: 'default' });
  applyQualityTier(renderer, renderTier());
  renderer.setSize(width, height);
  renderer.domElement.dataset.rocketScene = 'authored';
  mount.appendChild(renderer.domElement);
  const onContextLost = () => { contextLost = true; };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  const premiumRender = createArcadePremiumRenderPipeline({ THREE, renderer, scene, camera, tier: renderTier(),
    mood: { bloomIntensity: 0.06, bloomThreshold: 0.9, environmentIntensity: 1, aoIntensity: 0.45, vignetteDarkness: 0.10 } });
  renderer.domElement.dataset.arcadeSceneQualityTier = qualityTier;
  scene.add(new THREE.HemisphereLight(0xc9e9ff, 0x292033, 2));
  const key = new THREE.DirectionalLight(0xfff2d0, 2.3); key.position.set(-4, 9, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88cfff, 1); rim.position.set(5, 4, -7); scene.add(rim);
  const mesh = (geometry, colour, metalness = 0.25) => new THREE.Mesh(geometry,
    new THREE.MeshStandardMaterial({ color: colour, metalness, roughness: 0.64, flatShading: true }));
  const floor = mesh(new THREE.PlaneGeometry(14, 90), 0x173647);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.1, -30); scene.add(floor);
  const stars = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < 180; i++) positions.push(Math.sin(i * 23.17) * 40, 5 + (i % 17), -15 - i * 0.46);
  stars.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xc6ddff, size: 0.07 })));
  const planet = mesh(new THREE.SphereGeometry(6, 24, 16), 0x507785);
  planet.position.set(13, 11, -54); scene.add(planet);

  const sectors = new Map();
  for (const name of ['hangar', 'canyon', 'destination']) {
    const group = new THREE.Group(); group.name = 'rocket-' + name; scene.add(group); sectors.set(name, group);
  }
  const hangar = sectors.get('hangar');
  for (const z of [-7, -18, -31]) {
    for (const side of [-1, 1]) {
      const post = mesh(new THREE.BoxGeometry(0.7, 7, 0.8), 0x3c6874);
      post.position.set(side * 5.8, 3.4, z); hangar.add(post);
      const brace = mesh(new THREE.BoxGeometry(3.2, 0.45, 0.8), 0xa4bbc0);
      brace.position.set(side * 4.5, 6.9, z); brace.rotation.z = side * -0.2; hangar.add(brace);
    }
    const beam = mesh(new THREE.BoxGeometry(12, 0.5, 0.8), 0x617f8a);
    beam.position.set(0, 7.2, z); hangar.add(beam);
  }
  const canyon = sectors.get('canyon');
  // Hand-authored cliff profiles provide a cut-through silhouette, terraces and
  // depth. They are world geometry, never the answer/collision path.
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? -1 : 1;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(0.2, 2.7); shape.lineTo(0.8, 3.2);
    shape.lineTo(0.7, 5.4 + i % 3); shape.lineTo(2.2, 6.1 + i % 3);
    shape.lineTo(3.3, 4.6); shape.lineTo(4.2, 4.2); shape.lineTo(5.2, 0); shape.closePath();
    const cliff = mesh(new THREE.ExtrudeGeometry(shape, { depth: 4.5, bevelEnabled: true,
      bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 1, steps: 1 }), i % 3 ? 0x996b50 : 0xd09a6a, 0.02);
    cliff.position.set(side * (5.8 + (i % 3) * 0.5), -0.1, -7 - Math.floor(i / 2) * 10);
    cliff.scale.x = side; cliff.rotation.y = side * (0.14 + (i % 3) * 0.08); canyon.add(cliff);
  }
  const destination = sectors.get('destination');
  const dock = mesh(new THREE.CylinderGeometry(8, 8, 0.7, 32), 0x5b6682);
  dock.position.set(0, -0.6, -13); destination.add(dock);
  for (const side of [-1, 1]) {
    const mast = mesh(new THREE.CylinderGeometry(0.22, 0.5, 6.5, 10), 0x9cabc4);
    mast.position.set(side * 6, 2.8, -13); destination.add(mast);
    const dish = mesh(new THREE.SphereGeometry(1.4, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xd8e2ed);
    dish.rotation.z = side * 0.6; dish.position.set(side * 6, 6, -13); destination.add(dish);
  }
  const cargoLights = [];
  for (let i = 0; i < 10; i++) {
    const cargo = mesh(new THREE.BoxGeometry(0.44, 0.32, 0.56), 0x455563);
    cargo.position.set((i % 5 - 2) * 0.65, 0.12, -8 - Math.floor(i / 5) * 0.85);
    scene.add(cargo); cargoLights.push(cargo);
  }
  const models = [];
  const assetStatus = {};
  void (async () => {
    for (const record of ROCKET_WORLD_ASSETS) {
      if (disposed) return;
      try {
        const model = await createOwnedModelInstance(THREE, record.path, { height: record.height, castShadow: false, receiveShadow: false });
        if (disposed) { disposeOwnedModelInstance(model); return; }
        model.position.set(...record.position); model.rotation.y = record.yaw;
        model.name = record.role; sectors.get(record.sector).add(model); models.push(model);
        premiumRender.prepareObject(model); assetStatus[record.role] = 'loaded';
      } catch { assetStatus[record.role] = 'failed'; }
      renderer.domElement.dataset.rocketAssets = JSON.stringify(assetStatus);
    }
  })();

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
  ship.scale.setScalar(0.74);
  scene.add(ship);
  const shipShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.08, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x02040c, transparent: true, opacity: 0.42, depthWrite: false })
  );
  shipShadow.rotation.x = -Math.PI / 2;
  shipShadow.position.set(0, 0.085, ship.position.z + 0.04);
  scene.add(shipShadow);


  const gates = [];
  for (let lane = 0; lane < 3; lane++) {
    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x86d6e1, metalness: 0.35, roughness: 0.4 });
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.075, 6, 24), frameMaterial);
    const shutter = mesh(new THREE.BoxGeometry(1.2, 0.13, 0.12), 0xffcc78);
    shutter.position.y = 0.65;
    const lower = mesh(new THREE.BoxGeometry(1.2, 0.13, 0.12), 0xffcc78); lower.position.y = -0.65;
    group.add(frame, shutter, lower); scene.add(group);
    gates.push({ group, frame, shutter, lower });
  }
  const rails = [];
  for (let lane = 0; lane < 3; lane++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3).setUsage(THREE.DynamicDrawUsage));
    const rail = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x64e0e6 }));
    // These three short guides are always part of the visible route. Disabling
    // culling avoids stale bounds without rebuilding bounding volumes per frame.
    rail.frustumCulled = false;
    scene.add(rail); rails.push(rail);
  }
  let lastLayout = null;
  const ray = new THREE.Vector3(), near = new THREE.Vector3(), destinationPoint = new THREE.Vector3();
  const points = Array.from({ length: 3 }, () => new THREE.Vector3());
  const shipOffset = new THREE.Vector3();
  function worldPoint(x, y, z, output) {
    ray.set(x / width * 2 - 1, 1 - y / height * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    return output.copy(camera.position).addScaledVector(ray, (z - camera.position.z) / ray.z);
  }
  // Fit the actual hull, fins and exhaust at resize boundaries. Projecting the
  // authored bounds also accounts for the tail's asymmetric screen footprint.
  function fitShip() {
    ship.rotation.set(0, 0, 0);
    ship.scale.setScalar(0.74);
    const anchor = worldPoint(layout.shipCentres[lastLane], layout.shipY, layout.shipZ, new THREE.Vector3());
    ship.position.copy(anchor);
    const corner = new THREE.Vector3();
    for (let iteration = 0; iteration < 5; iteration++) {
      const bounds = new THREE.Box3().setFromObject(ship);
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        corner.set(x, y, z).project(camera);
        const px = (corner.x + 1) * width / 2, py = (1 - corner.y) * height / 2;
        left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py);
      }
      const scale = Math.min(layout.shipWidth / (right - left), layout.shipHeight / (bottom - top));
      ship.scale.multiplyScalar(scale);
      corner.copy(ship.position).project(camera);
      worldPoint((corner.x + 1) * width / 2 + layout.shipCentres[lastLane] - (left + right) / 2,
        (1 - corner.y) * height / 2 + layout.shipY - (top + bottom) / 2, layout.shipZ, ship.position);
    }
    shipOffset.subVectors(ship.position, anchor);
    shipShadow.scale.setScalar(ship.scale.x / 0.74);
  }
  function render(state, dt, reduced) {
    if (disposed || contextLost || renderer.getContext()?.isContextLost?.() || state.paused) return layout;
    dt = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
    lastLane = state.lane;
    const currentSector = sectorForRound(state.round);
    if (activeSector !== currentSector.id) {
      activeSector = currentSector.id;
      sectors.forEach((group, id) => { group.visible = id === activeSector; });
      scene.background.setHex(currentSector.fog); scene.fog.color.setHex(currentSector.fog);
      floor.material.color.setHex(currentSector.deck);
      rails.forEach(rail => rail.material.color.setHex(currentSector.rail));
      renderer.domElement.dataset.rocketSector = activeSector;
    }
    const planeZ = state.phase === 'approach' ? -13 + Math.min(1, state.time / 0.75) * (13 + layout.gateZ) : layout.gateZ;
    layout.centres.forEach((x, lane) => worldPoint(x, layout.labelY, planeZ, points[lane]));
    gates.forEach((gate, lane) => {
      gate.group.position.copy(points[lane]);
      gate.group.visible = !['checkpoint', 'complete'].includes(state.phase);
      const openness = state.phase === 'commit' && lane === state.lane ? Math.min(1, state.time / 0.3) : 0;
      gate.shutter.position.y = 0.65 + openness * 0.65; gate.lower.position.y = -0.65 - openness * 0.65;
      gate.frame.material.color.setHex(openness ? 0xaff8ce : currentSector.rail);
      gate.group.scale.setScalar(Math.min(1.25, layout.labelWidth / 115));
      worldPoint(layout.shipCentres[lane], layout.shipY, layout.shipZ, near).add(shipOffset);
      const attribute = rails[lane].geometry.getAttribute('position');
      attribute.setXYZ(0, near.x, near.y, near.z);
      attribute.setXYZ(1, points[lane].x, points[lane].y, points[lane].z);
      attribute.setXYZ(2, points[lane].x * 0.5, 0, -40);
      attribute.needsUpdate = true;
    });
    worldPoint(layout.shipCentres[state.lane], layout.shipY, layout.shipZ, destinationPoint).add(shipOffset);
    const progress = Math.min(1, state.time / 0.75);
    if (state.phase === 'commit') destinationPoint.lerp(points[state.lane], progress);
    if (state.phase === 'return') destinationPoint.lerp(points[state.lane], Math.sin(Math.min(1, state.time / 1.15) * Math.PI) * 0.35);
    if (state.phase === 'complete' || state.phase === 'checkpoint') destinationPoint.set(0, 0.9, -7);
    const displacement = destinationPoint.x - ship.position.x;
    if (state.phase === 'commit' && progress >= 1) ship.position.copy(destinationPoint);
    else ship.position.lerp(destinationPoint, Math.min(1, dt * 12));
    ship.rotation.z += ((reduced ? 0 : Math.max(-0.28, Math.min(0.28, -displacement * 0.16))) - ship.rotation.z) * Math.min(1, dt * 10);
    ship.rotation.x = state.phase === 'commit' && !reduced ? -0.06 * Math.sin(progress * Math.PI) : 0;
    shipShadow.position.set(ship.position.x, 0.085, ship.position.z + 0.1);
    const thrust = state.phase === 'commit' ? 1.25 : 0.64;
    plume.scale.set(0.7, thrust, 0.7); plumeCore.scale.set(0.65, thrust, 0.65); engineLight.intensity = thrust;
    cargoLights.forEach((cargo, index) => {
      cargo.material.color.setHex(index < state.deliveries.length ? 0xb4ecc1 : 0x455563);
      cargo.position.y = index < state.deliveries.length ? 0.25 : 0.12;
    });
    premiumRender.render(dt);
    lastLayout = layout;
    return layout;
  }
  const resize = () => {
    if (disposed || contextLost) return;
    width = mount.clientWidth || 640; height = mount.clientHeight || 420;
    camera.aspect = width / height; camera.updateProjectionMatrix();
    camera.updateMatrixWorld(); layout = flightLayout(width, height); fitShip();
    qualityTier = detectQualityTier(); premiumRender.setTier(renderTier()); applyQualityTier(renderer, renderTier());
    renderer.setSize(width, height); premiumRender.resize(width, height);
    renderer.domElement.dataset.arcadeSceneQualityTier = qualityTier;
  };
  const observer = new ResizeObserver(resize); observer.observe(mount);
  premiumRender.prepareObject(scene); resize();
  // Motion preferences can change without a host resize. Reuse the live quality
  // probe; its lifecycle guards defer GPU work during loss and after disposal.
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const modernMotionEvents = typeof motionQuery?.addEventListener === 'function';
  if (modernMotionEvents) motionQuery.addEventListener('change', resize);
  else motionQuery?.addListener?.(resize);
  return { render, canvas: renderer.domElement,
    snapshot: () => lastLayout && ({ ...lastLayout, gates: points.map(point => ({ x: point.x, y: point.y, z: point.z })),
      ship: { x: ship.position.x, y: ship.position.y, z: ship.position.z } }),
    restoreContext() {
      if (disposed || renderer.getContext()?.isContextLost?.()) return false;
      premiumRender.restoreContext(); contextLost = false; resize();
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true; observer.disconnect();
      if (modernMotionEvents) motionQuery.removeEventListener('change', resize);
      else motionQuery?.removeListener?.(resize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      // Cached model textures remain owned by the library, not this instance.
      models.forEach(model => { model.removeFromParent(); disposeOwnedModelInstance(model); });
      premiumRender.destroy();
      const resources = new Set();
      scene.traverse(node => {
        if (node.geometry) resources.add(node.geometry);
        for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
          if (material) resources.add(material);
        }
      });
      resources.forEach(resource => resource.dispose());
      disposeRenderer(renderer, { forceContextLoss: true }); renderer.domElement.remove();
    } };
}
