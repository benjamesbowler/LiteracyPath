import {
  createRenderer, createScene, createPerspectiveCamera, attachResize,
  attachContextLossGuard, detectQualityTier, applyQualityTier,
  shadowMapForTier, disposeRenderer, disposeObject
} from '../../components/learn/games/shared/threeShell.js';
import { createArcadePremiumRenderPipeline } from '../../components/learn/games/shared/arcadePremiumRender.js';
import { createOwnedModelInstance, disposeOwnedModelInstance } from '../../components/learn/games/shared/premiumGameAssets.js';
import { sampleRacerRoute } from '../../utils/soundRacerRoute.js';
import { SOUND_RACER_SCENE_KIT as KIT } from './sceneKit.js';
import { createRacerPerformanceState, resetRacerPerformanceState, sampleRacerPerformance } from './performance.js';

const WORLD_COLOURS = {
  easy: { sky: '#aacedd', ground: '#85a86b', verge: '#bed296', hill: '#739685', road: '#384952' },
  medium: { sky: '#b6ced2', ground: '#8caf79', verge: '#c0ce8d', hill: '#72918b', road: '#414d52' },
  hard: { sky: '#818eb3', ground: '#798da3', verge: '#acb8cf', hill: '#637389', road: '#3a4158' }
};

// Render-only owner. The mission controller supplies every learning decision;
// neither positions nor frame timing can commit an answer here.
export async function createRacerScene(THREE, mount, {
  mission, signal, quality, reducedMotion = false, onFailure = () => {}
}) {
  let disposed = false;
  let contextLost = false;
  const cleanup = [];
  const owned = [];
  const atlases = {};
  let driverTexture;
  const scene = createScene(THREE);
  const palette = WORLD_COLOURS[mission.difficulty] || WORLD_COLOURS.easy;
  scene.background = new THREE.Color(palette.sky);
  scene.fog = new THREE.Fog(palette.sky, 45, 112);
  let renderer, pipeline;
  let frameBudget;
  let qualityCeiling = 'high';
  const tiers = ['low', 'medium', 'high'];
  const requestedQuality = () => quality || tiers[Math.min(tiers.indexOf(detectQualityTier()), tiers.indexOf(qualityCeiling))];
  function dispose() {
    if (disposed) return;
    disposed = true;
    cleanup.splice(0).reverse().forEach(fn => fn?.());
    for (const model of owned) { model.removeFromParent(); disposeOwnedModelInstance(model); }
    disposeObject(scene);
    Object.values(atlases).forEach(texture => texture.dispose());
    driverTexture?.dispose();
    pipeline?.destroy();
    if (renderer) disposeRenderer(renderer, { forceContextLoss: true });
    renderer?.domElement.remove();
    signal?.removeEventListener('abort', dispose);
  }
  try {
  renderer = createRenderer(THREE, {
    antialias: quality !== 'low', pixelRatioCap: 1.5,
    shadowMap: shadowMapForTier(quality || detectQualityTier(), 'pcf'), srgbOutput: true
  });
  mount.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.className = 'sr-scene-canvas';
  const camera = createPerspectiveCamera(THREE, { fov: 52, aspect: 1, near: 0.1, far: 160 });
  const sun = new THREE.DirectionalLight('#fff0ce', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target, new THREE.HemisphereLight('#eaf5ff', '#68816e', 2.2));
  pipeline = createArcadePremiumRenderPipeline({
    THREE, renderer, scene, camera, tier: quality || detectQualityTier(), shadowLights: [sun],
    mood: { bloomIntensity: 0.025, bloomThreshold: 1.1, environmentIntensity: 0.65, vignetteDarkness: 0.07, aoIntensity: 0.4 }
  });
  applyQualityTier(renderer, pipeline.effectiveTier);
  frameBudget = createRacerPerformanceState(pipeline.effectiveTier);
  const resize = () => {
    const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
    pipeline.setTier(requestedQuality());
    applyQualityTier(renderer, pipeline.effectiveTier);
    frameBudget = resetRacerPerformanceState(pipeline.effectiveTier);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    pipeline.resize(width, height);
  };
  cleanup.push(attachResize({ mount, renderer, camera, width: () => Math.max(1, mount.clientWidth), height: () => Math.max(1, mount.clientHeight), updateStyle: false, onResize: resize }));
  resize();
  cleanup.push(attachContextLossGuard(renderer, {
    onLost: () => { contextLost = true; onFailure('graphics'); },
    onRestored: () => { /* The same semantic mission remains available after loss. */ }
  }));
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) { dispose(); throw new Error('Scene cancelled'); }
    const textureLoader = new THREE.TextureLoader();
    await Promise.all(Object.entries(KIT.sharedAtlasUrls).map(async ([key, url]) => {
      const texture = await textureLoader.loadAsync(url);
      if (disposed) { texture.dispose(); return; }
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      atlases[key] = texture;
    }));
    driverTexture = await textureLoader.loadAsync(KIT.driver.image);
    if (disposed) { driverTexture.dispose(); throw new Error('Scene cancelled'); }
    driverTexture.colorSpace = THREE.SRGBColorSpace;
    const load = async key => {
      const asset = KIT.assets[key];
      const model = await createOwnedModelInstance(THREE, asset.url, { height: asset.height });
      if (disposed) { disposeOwnedModelInstance(model); throw new Error('Scene cancelled'); }
      owned.push(model);
      model.traverse(node => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of materials) {
          if (material.map) material.map = atlases[asset.atlasId];
          material.roughness = 0.84;
          material.metalness = 0.02;
        }
      });
      return model;
    };
    // Every cloned model uses one of two owned shared atlas textures. Cached
    // source geometry is never edited or disposed by this game instance.
    const templates = Object.fromEntries(await Promise.all(Object.keys(KIT.assets).map(async key => [key, await load(key)])));
    if (disposed) throw new Error('Scene cancelled');
    const clone = key => {
      const model = templates[key].clone(true);
      // Template owns shared geometry/materials; instances are removed before
      // template disposal, preventing duplicate releases during teardown.
      scene.add(model);
      return model;
    };
    const instances = [];
    cleanup.push(() => instances.forEach(model => model.removeFromParent()));
    const place = (key, distance, offset, rotation = 0, scale = 1) => {
      const model = clone(key);
      instances.push(model);
      const anchor = sampleRacerRoute(distance, offset);
      model.position.set(anchor.position.x, anchor.position.y, anchor.position.z);
      model.rotation.y = anchor.heading + rotation;
      model.scale.multiplyScalar(scale);
      return model;
    };
    const end = mission.finishDistance + 35;
    const material = colour => new THREE.MeshStandardMaterial({ color: colour, roughness: 1 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, end + 140), material(palette.ground));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.035, -end / 2 + 15);
    ground.receiveShadow = true;
    scene.add(ground);

    function ribbon(offset, width, colour, intervals, elevation) {
      const positions = [];
      for (const [start, finish] of intervals) {
        for (let d = start; d < finish; d += 1) {
          const next = Math.min(finish, d + 1);
          const a = sampleRacerRoute(d, offset - width / 2).position;
          const b = sampleRacerRoute(d, offset + width / 2).position;
          const c = sampleRacerRoute(next, offset - width / 2).position;
          const e = sampleRacerRoute(next, offset + width / 2).position;
          for (const point of [a, b, c, b, e, c]) positions.push(point.x, point.y + elevation, point.z);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, material(colour));
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }
    const full = [[-18, end]];
    ribbon(0, 14, palette.verge, full, 0.005);
    ribbon(0, 11, palette.road, full, 0.025);
    for (const side of [-1, 1]) ribbon(side * 5.15, 0.12, '#e3e8d6', full, 0.037);
    const dashed = Array.from({ length: Math.ceil((end + 18) / 6) }, (_, i) => [i * 6 - 18, i * 6 - 15]);
    for (const offset of [-1.5, 1.5]) ribbon(offset, 0.08, '#9dabb0', dashed, 0.038);

    // A composed village circuit: arrival courtyard, tree avenue, bridge
    // landmark, turning village and finish square. Far scenery is never a cue.
    for (const [key, distance, side, rotation] of [
      ['houseA', 0, -13, 0.45], ['houseB', 8, 14, -0.3],
      ['houseA', 65, 16, -0.6], ['houseB', 128, -16, 0.35],
      ['houseA', mission.finishDistance - 8, -15, 0.1], ['houseB', mission.finishDistance + 6, 14, -0.4]
    ]) place(key, distance, side, rotation);
    place('bridge', 85, -19, Math.PI / 2, 1.4);
    const scenery = [];
    for (let index = 0; index < Math.ceil(end / 11); index += 1) {
      for (const side of [-1, 1]) {
        scenery.push(place(index % 2 ? 'treeA' : 'treeB', index * 11 + side * 2, side * (8 + index % 3 * 2.5), index * 1.7, 0.8 + index % 3 * 0.16));
        if (index % 2 === 0) place('lamp', index * 11 + 3, side * 6.4, side < 0 ? Math.PI : 0);
        if (index % 3 === 0) scenery.push(place('bush', index * 11 - 4, side * 6.7, index));
      }
    }
    for (let index = 0; index < 12; index += 1) {
      const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), material(palette.hill));
      hill.scale.set(14 + index % 3 * 7, 8 + index % 4 * 3, 20);
      hill.position.set((index % 2 ? 1 : -1) * (40 + index % 3 * 8), 0, -index * 24);
      scene.add(hill);
    }
    function makeArch(distance, finish = false) {
      const root = new THREE.Group();
      const anchor = sampleRacerRoute(distance);
      root.position.copy(new THREE.Vector3(anchor.position.x, 0, anchor.position.z));
      root.rotation.y = anchor.heading;
      const archMaterial = material(finish ? '#f2d695' : '#d1e6dc');
      for (const side of [-1, 1]) {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.9, 0.28), archMaterial);
        upright.position.set(side * 5.8, 2.45, 0);
        root.add(upright);
      }
      const crossbar = new THREE.Mesh(new THREE.BoxGeometry(11.9, 0.24, 0.24), archMaterial);
      crossbar.position.y = 4.85;
      root.add(crossbar);
      for (let i = 0; i < 11; i += 1) {
        const flag = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 3), material(i % 2 ? '#e9b667' : '#73aa9d'));
        flag.position.set(i - 5, 4.35, 0);
        flag.rotation.z = Math.PI;
        root.add(flag);
      }
      scene.add(root);
      place('flag', distance, -6.7, 0, 1.15);
      place('flag', distance, 6.7, Math.PI, 1.15);
      return root;
    }
    makeArch(2);
    makeArch(mission.finishDistance + 3, true);
    place('signal', 5, 6.25);

    const hero = templates.hero;
    scene.add(hero);
    const wheels = KIT.assets.hero.wheels.map(wheel => ({
      ...wheel, steer: hero.getObjectByName(wheel.steerNode), roll: hero.getObjectByName(wheel.rollNode)
    }));
    if (wheels.some(wheel => !wheel.steer || !wheel.roll)) throw new Error('Vehicle wheel contract missing');
    const chassis = hero.getObjectByName(KIT.assets.hero.chassisNode);
    const chassisBaseY = chassis?.position.y || 0;
    // Canonical Pal art identifies this authored car without changing the
    // source model or replacing its silhouette with a primitive character.
    const driverBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62),
      new THREE.MeshBasicMaterial({ map: driverTexture, transparent: true, depthWrite: false }));
    driverBadge.position.set(0, KIT.assets.hero.height + 0.012, 0.015);
    driverBadge.rotation.x = -Math.PI / 2;
    hero.add(driverBadge);
    cleanup.push(() => { driverBadge.removeFromParent(); driverBadge.geometry.dispose(); driverBadge.material.dispose(); });
    const rivals = [-1, 1].map(side => ({ side, model: place('rival', 10, side * 6.5, Math.PI, 0.94) }));
    const barrier = new THREE.Group();
    scene.add(barrier);
    for (const offset of [-3, 0, 3]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.2, 8), material('#dbe9dd'));
      post.position.set(offset - 1.25, 0.6, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.12), material('#eac078'));
      arm.position.set(1.2, 0.43, 0);
      post.add(arm);
      barrier.add(post);
    }
    pipeline.prepareObject(scene);
    let lastDistance = 0, wheelAngle = 0, previousLateral = 0;
    let cameraStarted = false;
    const viewTarget = new THREE.Vector3();
    function render(snapshot, frameSeconds = 1 / 60) {
      if (disposed || contextLost) return;
      const dt = Math.max(0, Math.min(0.05, frameSeconds));
      const { distance: travelDistance = 0, lateral = 0, speed = 0, phase, roundIndex = 0 } = snapshot;
      const distance = reducedMotion ? (mission.rounds[roundIndex]?.distance ?? mission.finishDistance) : travelDistance;
      const position = sampleRacerRoute(distance, lateral);
      const delta = Math.max(0, distance - lastDistance);
      wheelAngle += (reducedMotion ? 0 : delta) / (KIT.assets.hero.wheels[0].radius * KIT.assets.hero.scale);
      const turn = Math.max(-0.35, Math.min(0.35, -(lateral - previousLateral) * 3));
      lastDistance = distance;
      previousLateral = lateral;
      hero.position.set(position.position.x, position.position.y + 0.04, position.position.z);
      hero.rotation.y = Math.PI + position.heading;
      for (const wheel of wheels) {
        wheel.roll.rotation.x = wheelAngle;
        wheel.steer.rotation.y += ((wheel.steers ? turn : 0) - wheel.steer.rotation.y) * Math.min(1, dt * 14);
      }
      if (chassis) {
        chassis.rotation.z = reducedMotion ? 0 : turn * 0.12;
        chassis.position.y = chassisBaseY + (reducedMotion ? 0 : Math.sin(distance * 5) * Math.min(0.014, speed * 0.0014));
      }
      for (const { side, model } of rivals) {
        const anchor = sampleRacerRoute(distance + 11 + side * 4, side * 6.65);
        model.position.set(anchor.position.x, 0.04, anchor.position.z);
        model.rotation.y = Math.PI + anchor.heading;
        for (const wheel of KIT.assets.rival.wheels) model.getObjectByName(wheel.rollNode).rotation.x = wheelAngle;
      }
      const forkDistance = mission.rounds[roundIndex]?.distance ?? mission.finishDistance;
      const gate = sampleRacerRoute(forkDistance + 6);
      barrier.position.set(gate.position.x, gate.position.y, gate.position.z);
      barrier.rotation.y = gate.heading;
      barrier.visible = phase !== 'finished';
      barrier.children.forEach((post, index) => {
        const opens = phase === 'transition' && index === snapshot.lane;
        post.children[0].rotation.z += ((opens ? Math.PI / 2 : 0) - post.children[0].rotation.z) * Math.min(1, dt * 10);
      });
      const portrait = Math.max(0, Math.min(0.6, 1 - camera.aspect));
      const behind = sampleRacerRoute(distance - 10.5 - portrait * 3, lateral * (0.3 + portrait * 0.8));
      const ahead = sampleRacerRoute(distance + 11, lateral * (0.18 + portrait * 0.5));
      const wantedCamera = new THREE.Vector3(behind.position.x, 6.4 + portrait * 1.5, behind.position.z);
      const target = new THREE.Vector3(ahead.position.x, 0.8, ahead.position.z);
      if (!cameraStarted || reducedMotion) {
        camera.position.copy(wantedCamera); viewTarget.copy(target); cameraStarted = true;
      } else {
        const blend = 1 - Math.exp(-dt * 7);
        camera.position.lerp(wantedCamera, blend); viewTarget.lerp(target, blend);
      }
      camera.lookAt(viewTarget);
      sun.position.set(position.position.x - 14, 24, position.position.z + 12);
      sun.target.position.set(position.position.x, 0, position.position.z - 12);
      scenery.forEach((model, index) => { model.visible = pipeline.effectiveTier !== 'low' || index % 3 !== 2; });
      const tier = pipeline.render(dt);
      if (tier !== renderer.domElement.dataset.qualityTier) {
        applyQualityTier(renderer, tier);
        renderer.domElement.dataset.qualityTier = tier;
      }
      // Production samples actual frame intervals. A development-only explicit
      // preview tier stays fixed so each declared art path can be inspected.
      if (!quality) {
        const change = sampleRacerPerformance(frameBudget, frameSeconds * 1000, { paused: frameSeconds === 0 });
        if (change?.action === 'fallback') onFailure('performance');
        else if (change?.action === 'quality-step') {
          qualityCeiling = change.quality;
          pipeline.setTier(change.quality);
          applyQualityTier(renderer, pipeline.effectiveTier);
          pipeline.resize(mount.clientWidth, mount.clientHeight);
        }
      }
    }
    return { render, resize, dispose, canvas: renderer.domElement };
  } catch (error) {
    dispose();
    throw error;
  }
}
