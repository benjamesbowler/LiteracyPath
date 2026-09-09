import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ArcadePremiumRenderPipeline } from '../../src/components/learn/games/shared/arcadePremiumRender.js';
import { createRocketScene, ROCKET_WORLD_ASSETS } from '../../src/components/learn/games/games/rocketRunScene.js';
import { createFlightRun, flightLayout, FLIGHT_STEP } from '../../src/components/learn/games/games/rocketRunFlight.js';

// Real Three.js geometry, projection and shared render pipeline; only the GPU,
// mount, resize notification and network loader are replaced in these unit tests.
function sceneHarness(t, { load = async () => { throw new Error('offline'); }, reducedMotion = true,
  legacyMotionEvents = false, devicePixelRatio = 1 } = {}) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const motionListeners = new Set();
  const motionEvents = new EventTarget();
  const motionQuery = { media: '(prefers-reduced-motion: reduce)', matches: reducedMotion };
  const addMotionListener = listener => { motionListeners.add(listener); motionEvents.addEventListener('change', listener); };
  const removeMotionListener = listener => { motionListeners.delete(listener); motionEvents.removeEventListener('change', listener); };
  if (legacyMotionEvents) {
    motionQuery.addListener = addMotionListener; motionQuery.removeListener = removeMotionListener;
  } else {
    motionQuery.addEventListener = (type, listener) => { if (type === 'change') addMotionListener(listener); };
    motionQuery.removeEventListener = (type, listener) => { if (type === 'change') removeMotionListener(listener); };
  }
  let observer;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    devicePixelRatio, matchMedia: query => {
      assert.equal(query, motionQuery.media);
      return motionQuery;
    }
  } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true,
    value: { hardwareConcurrency: 8, deviceMemory: 8 } });
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: class {
    constructor(callback) { this.callback = callback; this.disconnected = false; observer = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  } });
  t.mock.method(GLTFLoader.prototype, 'loadAsync', load);
  let renderer;
  class Renderer {
    constructor() {
      renderer = this;
      this.domElement = new EventTarget(); this.domElement.dataset = {};
      this.domElement.remove = () => this.domElement.parentNode?.removeChild(this.domElement);
      this.shadowMap = {}; this.autoClear = true; this.renders = 0; this.disposals = 0; this.lost = false;
    }
    setPixelRatio(value) { this.pixelRatio = value; }
    setSize(width, height) { this.size = [width, height]; }
    // Exercise the real tier policy and pipeline without creating GPU effects.
    getContext() { return { isContextLost: () => this.lost, getExtension: () => null,
      getParameter: () => 'software test renderer' }; }
    render(scene, camera) { this.scene = scene; this.camera = camera; this.renders++; }
    dispose() { this.disposals++; }
    forceContextLoss() { this.lost = true; }
  }
  const mount = { clientWidth: 320, clientHeight: 568, children: [],
    appendChild(canvas) { this.children.push(canvas); canvas.parentNode = this; },
    removeChild(canvas) { this.children = this.children.filter(child => child !== canvas); canvas.parentNode = null; }
  };
  const scene = createRocketScene({ ...THREE, WebGLRenderer: Renderer }, mount);
  t.after(() => {
    scene.dispose();
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else delete globalThis.window;
    if (previousObserver) Object.defineProperty(globalThis, 'ResizeObserver', previousObserver); else delete globalThis.ResizeObserver;
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator); else delete globalThis.navigator;
  });
  return { scene, mount, renderer, motionListeners, get observer() { return observer; },
    setReducedMotion(matches) {
      if (motionQuery.matches === matches) return;
      motionQuery.matches = matches;
      const event = new Event('change'); Object.defineProperty(event, 'matches', { value: matches });
      motionEvents.dispatchEvent(event);
    },
    resize(width, height) { mount.clientWidth = width; mount.clientHeight = height; observer.callback(); }
  };
}

for (const legacyMotionEvents of [false, true]) {
  test(`live motion changes re-probe quality, resize and clean up ${legacyMotionEvents ? 'legacy' : 'modern'} listeners`, t => {
    const tier = t.mock.method(ArcadePremiumRenderPipeline.prototype, 'setTier');
    const resize = t.mock.method(ArcadePremiumRenderPipeline.prototype, 'resize');
    const harness = sceneHarness(t, { legacyMotionEvents, devicePixelRatio: 2 });
    const { scene, renderer, mount } = harness;
    const state = createFlightRun();
    scene.render(state, FLIGHT_STEP, true);
    const initial = structuredClone(scene.snapshot());
    const learning = JSON.stringify(state);
    assert.equal(renderer.domElement.dataset.arcadeSceneQualityTier, 'low');
    assert.equal(renderer.pixelRatio, 1);

    // No ResizeObserver notification: the media event must run the live probe
    // and propagate the current host size to the renderer and premium pipeline.
    mount.clientWidth = 568; mount.clientHeight = 320;
    harness.setReducedMotion(false);
    assert.equal(renderer.domElement.dataset.arcadeSceneQualityTier, 'high');
    assert.equal(harness.motionListeners.size, 1);
    assert.equal(tier.mock.calls.at(-1).arguments[0], 'high');
    assert.equal(renderer.pixelRatio, 2);
    assert.deepEqual(renderer.size, [568, 320]);
    assert.deepEqual(resize.mock.calls.at(-1).arguments, [568, 320]);
    const layout = scene.render(state, FLIGHT_STEP, false);
    assert.deepEqual(layout, flightLayout(568, 320));
    assert.equal(JSON.stringify(state), learning);

    harness.setReducedMotion(true);
    assert.equal(renderer.domElement.dataset.arcadeSceneQualityTier, 'low');
    assert.equal(tier.mock.calls.at(-1).arguments[0], 'low');
    assert.equal(renderer.pixelRatio, 1);
    assert.equal(renderer.shadowMap.enabled, false);
    harness.resize(initial.width, initial.height);
    assert.deepEqual(scene.render(state, FLIGHT_STEP, true), flightLayout(initial.width, initial.height));

    const queuedListener = [...harness.motionListeners][0];
    scene.dispose();
    assert.equal(harness.motionListeners.size, 0);
    const calls = [tier.mock.callCount(), resize.mock.callCount()];
    harness.setReducedMotion(false);
    queuedListener(new Event('change'));
    assert.deepEqual([tier.mock.callCount(), resize.mock.callCount()], calls,
      'removed or already queued media callbacks must not reuse disposed resources');
  });
}

test('a motion change during context loss defers quality and size until restoration', t => {
  const tier = t.mock.method(ArcadePremiumRenderPipeline.prototype, 'setTier');
  const resize = t.mock.method(ArcadePremiumRenderPipeline.prototype, 'resize');
  const harness = sceneHarness(t, { devicePixelRatio: 2 });
  harness.renderer.lost = true;
  harness.scene.canvas.dispatchEvent(new Event('webglcontextlost'));
  const calls = [tier.mock.callCount(), resize.mock.callCount()];
  harness.mount.clientWidth = 568; harness.mount.clientHeight = 320;
  harness.setReducedMotion(false);
  assert.deepEqual([tier.mock.callCount(), resize.mock.callCount()], calls);
  assert.equal(harness.scene.restoreContext(), false);
  harness.renderer.lost = false;
  assert.equal(harness.scene.restoreContext(), true);
  assert.equal(harness.renderer.domElement.dataset.arcadeSceneQualityTier, 'high');
  assert.equal(tier.mock.calls.at(-1).arguments[0], 'high');
  assert.equal(harness.renderer.pixelRatio, 2);
  assert.deepEqual(harness.renderer.size, [568, 320]);
  assert.deepEqual(resize.mock.calls.at(-1).arguments, [568, 320]);
});

test('all authored assets and their local glTF buffers/images exist with matching licence/provenance', () => {
  const manifest = JSON.parse(readFileSync('public/models/library/manifest.json', 'utf8'));
  const collection = manifest.packs.find(item => item.id === 'kaykit-space');
  const seen = new Set();
  for (const asset of ROCKET_WORLD_ASSETS) {
    assert.equal(asset.creator, collection.creator);
    assert.equal(asset.licence, collection.license);
    assert.equal(asset.source, collection.source);
    const path = resolve('public', asset.path.slice(1));
    const model = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(model.asset.version, '2.0');
    let bytes = statSync(path).size;
    for (const dependency of [...(model.buffers || []), ...(model.images || [])]) {
      assert.ok(dependency.uri && !/^(https?:|data:)/.test(dependency.uri));
      const dependencyPath = resolve(dirname(path), decodeURIComponent(dependency.uri));
      const size = statSync(dependencyPath).size;
      assert.ok(size > 0);
      if (dependency.byteLength) assert.ok(size >= dependency.byteLength);
      bytes += size; seen.add(dependencyPath);
    }
    assert.ok(bytes < 6 * 1024 * 1024, `${asset.model} complete dependency size exceeds library policy`);
    assert.ok(model.meshes.length > 0);
  }
  assert.equal(new Set(ROCKET_WORLD_ASSETS.map(asset => asset.sector)).size, 3);
  assert.ok(seen.size > 0);
});

test('rails reuse the same geometry, attribute and typed storage across frames and resize', t => {
  const harness = sceneHarness(t);
  const state = createFlightRun();
  harness.scene.render(state, FLIGHT_STEP, true);
  const rails = harness.renderer.scene.children.filter(item => item.isLine);
  assert.equal(rails.length, 3);
  const originals = rails.map(rail => ({ geometry: rail.geometry,
    attribute: rail.geometry.getAttribute('position'), array: rail.geometry.getAttribute('position').array }));
  for (let frame = 1; frame <= 120; frame++) {
    state.time = frame / 160;
    if (frame === 50) harness.resize(568, 320);
    harness.scene.render(state, FLIGHT_STEP, true);
    rails.forEach((rail, lane) => {
      assert.equal(rail.geometry, originals[lane].geometry, 'rail geometry was recreated');
      assert.equal(rail.geometry.getAttribute('position'), originals[lane].attribute);
      assert.equal(rail.geometry.getAttribute('position').array, originals[lane].array);
      assert.ok([...originals[lane].array].every(Number.isFinite));
    });
  }
});

test('gate centres and committed rocket project onto the same visible lane at all three sizes', t => {
  const { scene, renderer, resize } = sceneHarness(t);
  const state = createFlightRun();
  for (const [width, height] of [[320, 568], [568, 320], [1024, 768]]) {
    resize(width, height);
    const layout = flightLayout(width, height);
    for (const round of [0, 4, 9]) {
      state.round = round;
      for (let lane = 0; lane < 3; lane++) {
        state.lane = lane; state.phase = 'commit'; state.time = 0.8;
        scene.render(state, FLIGHT_STEP, true);
        const snapshot = scene.snapshot();
        snapshot.gates.forEach((point, index) => {
          const projected = new THREE.Vector3(point.x, point.y, point.z).project(renderer.camera);
          assert.ok(Math.abs((projected.x + 1) / 2 * width - layout.centres[index]) < 1e-6);
          assert.ok(Math.abs((1 - projected.y) / 2 * height - layout.labelY) < 1e-6);
        });
        const gate = snapshot.gates[lane];
        assert.ok(new THREE.Vector3(...Object.values(snapshot.ship)).distanceTo(new THREE.Vector3(gate.x, gate.y, gate.z)) < 1e-6,
          'committed rocket must reach the selected gate before the next gate can replace it');
      }
    }
  }
});

test('gold hero stays above the floor and has a visible screen region clear of labels and the HUD', t => {
  const { scene, renderer, resize } = sceneHarness(t);
  const state = createFlightRun();
  state.phase = 'decision';
  for (const [width, height] of [[320, 568], [568, 320], [1024, 695], [568, 247]]) {
    resize(width, height);
    const layout = flightLayout(width, height);
    for (const lane of [0, 1, 2]) {
      state.lane = lane;
      for (let frame = 0; frame < 90; frame++) scene.render(state, FLIGHT_STEP, true);
      const ship = renderer.scene.children.find(node => node.isGroup && node.children.some(child => child.geometry?.type === 'LatheGeometry'));
      const bounds = new THREE.Box3().setFromObject(ship);
      assert.ok(bounds.min.y > -0.1, `hero below floor at ${width}x${height}`);
      const projected = [];
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new THREE.Vector3(x, y, z).project(renderer.camera);
        projected.push({ x: (point.x + 1) / 2 * width, y: (1 - point.y) / 2 * height });
      }
      const box = { left: Math.min(...projected.map(p => p.x)), right: Math.max(...projected.map(p => p.x)),
        top: Math.min(...projected.map(p => p.y)), bottom: Math.max(...projected.map(p => p.y)) };
      assert.ok(box.bottom - box.top >= 24, `hero needs a recognisable silhouette at ${width}x${height}: ${JSON.stringify(box)}`);
      assert.ok(box.top >= 64, `${width}x${height}: hero behind prompt ${JSON.stringify(box)}`);
      assert.ok(box.bottom <= height - 126, `${width}x${height}: hero behind feedback ${JSON.stringify(box)}`);
      assert.ok(box.left >= 0 && box.right <= width);
      for (const centre of layout.centres) {
        assert.ok(box.right <= centre - layout.labelWidth / 2 || box.left >= centre + layout.labelWidth / 2 ||
          box.top >= layout.labelY + 28 || box.bottom <= layout.labelY - 28, `${width}x${height}: hero covered by gate label`);
      }
    }
  }
});

test('paused and lost-context frames freeze ship, rail storage and rendering; restore rebuilds the pipeline', t => {
  const harness = sceneHarness(t);
  const restore = t.mock.method(ArcadePremiumRenderPipeline.prototype, 'restoreContext');
  const state = createFlightRun();
  harness.scene.render(state, FLIGHT_STEP, false);
  const initial = structuredClone(harness.scene.snapshot());
  const count = harness.renderer.renders;
  state.paused = true; state.lane = 2;
  harness.scene.render(state, 0.1, false);
  assert.deepEqual(harness.scene.snapshot(), initial);
  assert.equal(harness.renderer.renders, count);
  state.paused = false; harness.renderer.lost = true;
  harness.scene.canvas.dispatchEvent(new Event('webglcontextlost'));
  harness.scene.render(state, 0.1, false);
  assert.equal(harness.renderer.renders, count);
  harness.renderer.lost = false;
  assert.equal(typeof harness.scene.restoreContext, 'function');
  assert.equal(harness.scene.restoreContext(), true);
  assert.equal(restore.mock.callCount(), 1);
  harness.scene.render(state, FLIGHT_STEP, false);
  assert.equal(harness.renderer.renders, count + 1);
  assert.notDeepEqual(harness.scene.snapshot().ship, initial.ship);
});

test('disposal releases each scene resource once, disconnects resize and ignores later callbacks', t => {
  const harness = sceneHarness(t);
  harness.scene.render(createFlightRun(), FLIGHT_STEP, true);
  const counts = new Map();
  harness.renderer.scene.traverse(node => {
    for (const resource of [node.geometry, ...(Array.isArray(node.material) ? node.material : [node.material])]) {
      if (!resource || counts.has(resource)) continue;
      counts.set(resource, 0);
      resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1));
    }
  });
  harness.scene.dispose(); harness.scene.dispose();
  assert.ok(harness.observer.disconnected);
  assert.equal(harness.mount.children.length, 0);
  assert.equal(harness.renderer.disposals, 1);
  counts.forEach(count => assert.equal(count, 1));
  const rendered = harness.renderer.renders;
  harness.resize(568, 320);
  harness.scene.render(createFlightRun(), FLIGHT_STEP, false);
  assert.equal(harness.renderer.renders, rendered);
  assert.equal(harness.scene.restoreContext(), false);
});

test('failed decorative assets leave every sector and gate playable with an honest failure status', async t => {
  const { scene, renderer } = sceneHarness(t);
  await new Promise(resolve => setImmediate(resolve));
  const status = JSON.parse(scene.canvas.dataset.rocketAssets);
  assert.equal(Object.keys(status).length, ROCKET_WORLD_ASSETS.length);
  assert.ok(Object.values(status).every(value => value === 'failed'));
  const state = createFlightRun();
  state.phase = 'decision';
  for (const [round, sector] of [[0, 'hangar'], [3, 'canyon'], [7, 'destination']]) {
    state.round = round;
    scene.render(state, FLIGHT_STEP, true);
    assert.equal(scene.canvas.dataset.rocketSector, sector);
    const visible = renderer.scene.children.filter(node => node.name.startsWith('rocket-') && node.visible);
    assert.deepEqual(visible.map(node => node.name), [`rocket-${sector}`]);
    assert.equal(scene.snapshot().gates.length, 3);
  }
});

test('an asset arriving after disposal releases its owned clone but retains the shared source texture', async t => {
  let deliver;
  const source = new THREE.Group();
  const texture = new THREE.Texture();
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ map: texture });
  source.add(new THREE.Mesh(geometry, material));
  let textureDisposals = 0, geometryDisposals = 0, materialDisposals = 0;
  texture.addEventListener('dispose', () => textureDisposals++);
  t.mock.method(THREE.BufferGeometry.prototype, 'dispose', function () { geometryDisposals++; });
  t.mock.method(THREE.Material.prototype, 'dispose', function () { materialDisposals++; });
  const { scene, mount } = sceneHarness(t, { load: () => new Promise(resolve => { deliver = resolve; }) });
  scene.dispose();
  const before = [geometryDisposals, materialDisposals];
  deliver({ scene: source });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(geometryDisposals - before[0], 1);
  assert.equal(materialDisposals - before[1], 1);
  assert.equal(textureDisposals, 0);
  assert.equal(mount.children.length, 0);
});
