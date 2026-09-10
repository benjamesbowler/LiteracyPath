import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../shared/threeShell.js';
import { sampleCircuitPath, offsetCircuitPoint, RACER_ROAD_WIDTH } from '../../../../utils/soundRacerPhysics.js';

const ASSETS = {
  treeA: { height: 4.2, radius: 2.5 }, treeB: { height: 3.8, radius: 2.4 },
  bush: { height: 1.2, radius: 1 }, lamp: { height: 4.5, radius: .5 },
  houseA: { height: 7, radius: 4 }, houseB: { height: 9, radius: 4 },
  bridge: { height: 5, radius: 5 }, flag: { height: 3.5, radius: .8 },
  hero: { height: 1.8, radius: 2.2 }
};
export const RACER_SCENERY_URLS = Object.fromEntries(Object.keys(ASSETS).map(name => [name, `/game-assets/sound-racer/models/${name}.glb`]));

// One indexed surface follows the exact physical road samples. Alternating
// kerbs and broad verge strips show the tyre boundary through the whole turn.
export function racerStripGeometry(path, inner, outer, bottom, top, alternating = false) {
  const positions = [], colors = [], indices = [];
  const pale = new THREE.Color(0xffedc0), accent = new THREE.Color(0xd95036);
  for (let i = 0; i < path.length; i++) {
    const point = path[i], color = alternating && Math.floor(point.distance / 2) % 2 ? accent : pale;
    for (const [offset, rise] of [[inner, bottom], [inner, top], [outer, top], [outer, bottom]]) {
      const p = offsetCircuitPoint(point, offset);
      positions.push(p.x, p.y + rise, p.z);
      colors.push(color.r, color.g, color.b);
    }
    if (!i) continue;
    const a = (i - 1) * 4, b = i * 4;
    for (let face = 0; face < 3; face++) indices.push(a + face, b + face, a + face + 1, a + face + 1, b + face, b + face + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function circuitClearance(path, x, z) {
  let distance = Infinity;
  for (const point of path) distance = Math.min(distance, Math.hypot(x - point.x, z - point.z));
  return distance;
}

export function racerSceneryPlacements(track, world, tier = 'high') {
  const count = tier === 'low' ? 30 : tier === 'medium' ? 64 : 96;
  const result = [];
  for (let i = 0; i < count; i++) {
    const distance = (i + .35) / count * track.totalLength;
    const point = sampleCircuitPath(track.path, distance);
    const side = i % 2 ? -1 : 1;
    let name = i % 7 === 0 ? 'lamp' : i % 5 === 0 ? 'bush' : i % 3 ? 'treeA' : 'treeB';
    if (i % 13 === 2) name = world === 'meadow' ? 'houseA' : world === 'moonwood' ? 'houseB' : 'bridge';
    if (i === 0) name = 'hero';
    if (i % 17 === 1) name = 'flag';
    const asset = ASSETS[name];
    let offset = side * (name === 'lamp' || name === 'flag' ? 7.4 : name.startsWith('tree') ? 24 + (i % 4) * 4 : 11 + (i % 4) * 4);
    let p = offsetCircuitPoint(point, offset);
    if (name.startsWith('tree')) for (let attempt = 0; attempt < 2 && circuitClearance(track.path, p.x, p.z) < RACER_ROAD_WIDTH / 2 + asset.radius + 1; attempt++) { offset += side * 8; p = offsetCircuitPoint(point, offset); }
    // Broad props on one bend must not intrude into its neighbouring hairpin.
    if (circuitClearance(track.path, p.x, p.z) < RACER_ROAD_WIDTH / 2 + asset.radius + 1) continue;
    result.push({ name, x: p.x, z: p.z, y: Math.max(-.2, p.y - .05), heading: -point.heading + (name.startsWith('house') ? -side * Math.PI / 2 : i * 1.73), height: asset.height, distance });
  }
  return result;
}

export function createRacerScenery(track, world, tier) {
  const root = new THREE.Group(); root.name = 'AuthoredCircuitScenery';
  const details = new THREE.Group(); details.name = 'OptionalFarScenery'; root.add(details);
  let disposed = false;
  const resources = new Set();
  const pale = new THREE.MeshStandardMaterial({ color: 0xffedca, roughness: .72, metalness: .12 });
  const kerb = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .87 });
  const verge = new THREE.MeshStandardMaterial({ color: world === 'dino' ? 0xb98658 : world === 'moonwood' ? 0x5a577b : 0x729b57, roughness: .98 });
  for (const side of [-1, 1]) {
    const edge = side * RACER_ROAD_WIDTH / 2;
    for (const [inner, outer, bottom, top, mat, alternating] of [
      [edge - side * .36, edge + side * .30, -.02, .10, kerb, true],
      [edge + side * .30, edge + side * .63, -.08, -.045, verge, false],
      [side * 5.46, side * 5.65, .36, .56, pale, false],
      [side * 5.46, side * 5.65, .90, 1.02, pale, false]
    ]) {
      const mesh = new THREE.Mesh(racerStripGeometry(track.path, inner, outer, bottom, top, alternating), mat);
      mesh.castShadow = false; mesh.receiveShadow = true; root.add(mesh);
    }
  }
  const posts = [];
  for (let distance = 0; distance < track.totalLength; distance += 4) for (const side of [-1, 1]) {
    const point = sampleCircuitPath(track.path, distance), p = offsetCircuitPoint(point, side * 5.55);
    posts.push({ x: p.x, y: p.y + .5, z: p.z });
  }
  const postMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(.055, .08, 1, 8), pale, posts.length);
  const matrix = new THREE.Matrix4();
  posts.forEach((p, i) => { matrix.makeTranslation(p.x, p.y, p.z); postMesh.setMatrixAt(i, matrix); });
  postMesh.instanceMatrix.needsUpdate = true; root.add(postMesh);

  const placements = racerSceneryPlacements(track, world, tier);
  root.userData.placementCount = placements.length;
  root.userData.assetState = 'loading';
  const loader = new GLTFLoader();
  const ready = Promise.allSettled([...new Set(placements.map(p => p.name))].map(async name => {
    const gltf = await loader.loadAsync(RACER_SCENERY_URLS[name]);
    if (disposed) { disposeObject(gltf.scene); return; }
    resources.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = ASSETS[name].height / Math.max(.01, bounds.max.y - bounds.min.y);
    const locations = placements.filter(p => p.name === name);
    gltf.scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      const instance = new THREE.InstancedMesh(mesh.geometry, mesh.material, locations.length);
      instance.userData.capacity = locations.length;
      instance.name = `Retained_${name}_${mesh.name}`;
      instance.castShadow = tier !== 'low'; instance.receiveShadow = true;
      locations.forEach((p, index) => {
        const transform = new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)
          .multiply(new THREE.Matrix4().makeRotationY(p.heading))
          .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
          .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z))
          .multiply(mesh.matrixWorld);
        instance.setMatrixAt(index, transform);
      });
      instance.instanceMatrix.needsUpdate = true; instance.computeBoundingSphere();
      details.add(instance);
    });
  })).then(results => {
    root.userData.assetState = results.some(result => result.status === 'rejected') ? 'partial' : 'ready';
    root.userData.failedAssets = results.filter(result => result.status === 'rejected').map(result => String(result.reason));
    return !disposed;
  });
  function setTier(next) {
    details.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = next !== 'low';
      if (node.isInstancedMesh && /Retained_(tree|bush)/.test(node.name)) node.count = Math.max(1, Math.ceil(node.userData.capacity * (next === 'low' ? .42 : next === 'medium' ? .72 : 1)));
    });
    root.userData.qualityTier = next;
  }
  function dispose() {
    disposed = true;
    root.parent?.remove(root);
    // Instanced meshes share their template resources inside this one scope.
    // Dispose templates exactly once; clear instances before generic disposal.
    details.traverse(node => { if (node.isInstancedMesh) node.dispose(); });
    details.clear();
    for (const resource of resources) disposeObject(resource);
    resources.clear();
    root.traverse(node => { if (node.isInstancedMesh) node.dispose(); });
    disposeObject(root);
  }
  return { root, ready, setTier, dispose };
}
