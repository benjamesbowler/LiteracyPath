import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {disposeOwnedSportsGltf,disposeOwnedSportsPrimaryGroup} from './sportsOwnedGltfResources.js';
import { sampleCircuitPath, offsetCircuitPoint, RACER_ROAD_WIDTH } from '../../../../utils/soundRacerPhysics.js';
import { createRacerAuthoredWorld, racerDensityIncludes } from './soundRacerAuthoredWorld.js';

const ASSETS = {
  treeB: { height: 10, radius: 3.8, foliage: true },
  meadowCopse: { height: 12, radius: 5.8, foliage: true },
  dinoCycads: { height: 5, radius: 4.8, foliage: true },
  moonMushrooms: { height: 5.5, radius: 3, foliage: true },
  bush: { height: 1.2, radius: 1 }, lamp: { height: 4.5, radius: .5 },
  flag: { height: 3.5, radius: .8 },
  hero: { height: 1.8, radius: 2.2 }
};
export const RACER_SCENERY_URLS = {
  ...Object.fromEntries(Object.keys(ASSETS).filter(name => !['meadowCopse', 'dinoCycads', 'moonMushrooms'].includes(name)).map(name => [name, `/game-assets/sound-racer/models/${name}.glb`])),
  treeB: '/game-assets/arcade-worlds/birch-canopy.glb',
  bush: '/game-assets/arcade-worlds/flowering-shrub.glb',
  meadowCopse: '/game-assets/arcade-worlds/broadleaf-tree.glb',
  dinoCycads: '/game-assets/arcade-blender/dino-cycads.glb',
  moonMushrooms: '/game-assets/arcade-blender/moonwood-mushrooms.glb'
};

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

// Terrain and scenery share this surface: a tree beside the raised bridge
// belongs to the hillside, not to an invisible extension of the bridge deck.
export function racerTerrainHeight(path, x, z) {
  const clearance = circuitClearance(path, x, z);
  const blend = Math.min(1, Math.max(0, (clearance - 10) / 22));
  return -.22 + blend * blend * (2.8 + Math.sin(x * .038) * 2.1 + Math.cos(z * .029) * 1.8);
}

export function racerSceneryPlacements(track, world, tier = 'high') {
  const count = tier === 'low' ? 54 : tier === 'medium' ? 90 : 128;
  const result = [];
  const worldFoliage = world === 'meadow' ? 'meadowCopse' : world === 'dino' ? 'dinoCycads' : 'moonMushrooms';
  for (let i = 0; i < count; i++) {
    const distance = (i + .35) / count * track.totalLength;
    const point = sampleCircuitPath(track.path, distance);
    const side = i % 2 ? -1 : 1;
    const name = i % 7 === 0 ? 'lamp' : i % 5 === 0 ? 'bush' : world === 'meadow' && i % 3 === 0 ? 'treeB' : worldFoliage;
    const asset = ASSETS[name];
    let offset = side * (name === 'lamp' || name === 'flag' ? 7.4 : asset.foliage ? 12 + (i % 4) * 3 : 11 + (i % 4) * 4);
    let p = offsetCircuitPoint(point, offset);
    if (asset.foliage) for (let attempt = 0; attempt < 2 && circuitClearance(track.path, p.x, p.z) < RACER_ROAD_WIDTH / 2 + asset.radius + 1; attempt++) { offset += side * 8; p = offsetCircuitPoint(point, offset); }
    // Broad props on one bend must not intrude into its neighbouring hairpin.
    if (circuitClearance(track.path, p.x, p.z) < RACER_ROAD_WIDTH / 2 + asset.radius + 1) continue;
    result.push({ name, x: p.x, z: p.z, y: racerTerrainHeight(track.path, p.x, p.z), heading: -point.heading + i * 1.73, height: asset.height, distance });
  }
  return result;
}

export function createRacerScenery(track, world, tier) {
  const root = new THREE.Group(); root.name = 'AuthoredCircuitScenery';
  const details = new THREE.Group(); details.name = 'OptionalFarScenery'; root.add(details);
  const village = createRacerAuthoredWorld(track, world, tier, { clearance: circuitClearance, terrainHeight: racerTerrainHeight });
  root.add(village.root);
  let disposed = false;
  const resources = new Set();
  const rotors = [];
  const spatialBatches = [];
  let view = { x: track.path[0].x, z: track.path[0].z };
  let rotorAngle = 0;
  let currentTier = tier;
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
  village.setFoliagePlacements(placements.filter(p=>ASSETS[p.name].foliage));
  const initialDensity = tier === 'low' ? .42 : tier === 'medium' ? .72 : 1;
  root.userData.placementCount = placements.length;
  root.userData.assetState = 'loading';
  const loader = new GLTFLoader();
  const ready = Promise.allSettled([...new Set(placements.filter(p=>!ASSETS[p.name].foliage).map(p => p.name))].map(async name => {
    const gltf = await loader.loadAsync(RACER_SCENERY_URLS[name]);
    if (disposed) { disposeOwnedSportsGltf(gltf.scene); return; }
    resources.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = ASSETS[name].height / Math.max(.01, bounds.max.y - bounds.min.y);
    const locations = placements.filter(p => p.name === name);
    gltf.scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
        if(material.transparent&&ASSETS[name].foliage){material.transparent=false;material.alphaTest=.4;material.depthWrite=true;material.forceSinglePass=true;material.needsUpdate=true;}
        material.envMapIntensity=.32;material.roughness=Math.max(.8,material.roughness||0);
      }
      const instance = new THREE.InstancedMesh(mesh.geometry, mesh.material, locations.length);
      instance.userData.capacity = locations.length;
      instance.userData.foliage = ASSETS[name].foliage || name === 'bush';
      instance.name = `Retained_${name}_${mesh.name}`;
      instance.castShadow = tier !== 'low'; instance.receiveShadow = true;
      const rotor = mesh.name.startsWith('WindmillRotor') || mesh.parent?.name === 'WindmillRotor';
      instance.userData.windmillRotor = rotor;
      const rotorBases = [];
      const transforms = [];
      locations.forEach((p, index) => {
        const transform = new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)
          .multiply(new THREE.Matrix4().makeRotationY(p.heading))
          .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
          .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z))
          .multiply(mesh.matrixWorld);
        instance.setMatrixAt(index, transform);
        transforms.push(transform);
        if (rotor) rotorBases.push(transform.clone());
      });
      instance.instanceMatrix.needsUpdate = true; instance.computeBoundingSphere();
      details.add(instance);
      spatialBatches.push({ instance, locations, transforms });
      if (rotor) rotors.push({ instance, bases: rotorBases });
    });
  })).then(async results => {
    await village.ready;
    if(disposed)return false;
    root.userData.assetState = results.some(result => result.status === 'rejected') || village.root.userData.assetState !== 'ready' ? 'partial' : 'ready';
    root.userData.failedAssets = results.filter(result => result.status === 'rejected').map(result => String(result.reason));
    root.userData.venues = structuredClone(village.root.userData);
    if (!disposed) setTier(currentTier);
    return !disposed;
  });
  function setTier(next) {
    if(disposed)return;
    currentTier = next;
    village.setTier(next);
    details.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = next !== 'low';
      if (node.isInstancedMesh && node.userData.foliage) node.count = Math.max(1, Math.ceil(node.userData.capacity * Math.min(1, (next === 'low' ? .42 : next === 'medium' ? .72 : 1) / initialDensity)));
    });
    updateSpatial(view, true);
    root.userData.qualityTier = next;
  }
  const rotorTurn = new THREE.Matrix4();
  const rotorTransform = new THREE.Matrix4();
  function updateSpatial(position, force = false) {
    if (disposed || !position) return;
    if (!force && Math.hypot(position.x - view.x, position.z - view.z) < 2) return;
    view = { x: position.x, z: position.z };
    const radius = currentTier === 'low' ? 85 : currentTier === 'medium' ? 115 : 145;
    let active = 0;
    for (const { instance, locations, transforms } of spatialBatches) {
      const density = Math.min(1, (currentTier === 'low' ? .42 : currentTier === 'medium' ? .72 : 1) / initialDensity);
      let count = 0;
      locations.forEach((p, index) => {
        if (instance.userData.foliage && !racerDensityIncludes(index, density)) return;
        if (Math.hypot(p.x - view.x, p.z - view.z) > radius + p.height) return;
        instance.setMatrixAt(count++, transforms[index]);
      });
      instance.count = count; instance.instanceMatrix.needsUpdate = true; active += count;
    }
    root.userData.activeScenerySurfaces = active;
  }
  function update(dt, reducedMotion = false, position, camera) {
    if (disposed) return;
    if (position) { updateSpatial(position); village.update(position,false,camera?.position); }
    if (reducedMotion || !rotors.length) return;
    rotorAngle = (rotorAngle + Math.min(.05, Math.max(0, dt)) * (Math.PI / 10)) % (Math.PI * 2);
    rotorTurn.makeRotationZ(rotorAngle);
    for (const { instance, bases } of rotors) {
      bases.forEach((base, index) => instance.setMatrixAt(index, rotorTransform.multiplyMatrices(base, rotorTurn)));
      instance.instanceMatrix.needsUpdate = true;
    }
    root.userData.rotorAngle = rotorAngle;
  }
  function dispose() {
    if(disposed)return;
    disposed = true;
    root.parent?.remove(root);
    village.dispose();
    root.userData.venues=structuredClone(village.root.userData);
    // Instanced meshes share their template resources inside this one scope.
    // Dispose templates exactly once; clear instances before generic disposal.
    details.traverse(node => { if (node.isInstancedMesh) node.dispose(); });
    details.clear();
    const templates=[...resources].map(resource=>disposeOwnedSportsGltf(resource));
    resources.clear();
    rotors.length = 0;
    spatialBatches.length=0;
    root.userData.primaryRelease={templates:templates.filter(Boolean),remaining:disposeOwnedSportsPrimaryGroup(root)};
    root.userData.primaryReleased=true;
  }
  return { root, ready, setTier, update, dispose,canvasScene:()=>village.canvasScene() };
}
