import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const FLIGHT_CLIPS = ['cruise', 'bank_left', 'bank_right', 'boost', 'shield_recover', 'catch', 'celebrate'];
const OWNED_MODEL_PATH = /^\/game-assets\/rocket-run\/models\/[a-z0-9-]+\.glb$/;
const defaultLoader = new GLTFLoader();
const defaultCache = new Map();
const materialsOf = node => Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
const namedNode = (root, name) => root.getObjectByName(name)
  || root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));

function disposeSource(gltf) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  gltf.scene?.traverse?.(node => {
    if (node.geometry) geometries.add(node.geometry);
    if (node.skeleton) skeletons.add(node.skeleton);
    for (const material of materialsOf(node)) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  skeletons.forEach(skeleton => skeleton.dispose());
  textures.forEach(texture => {
    const image = texture.source?.data || texture.image;
    texture.dispose();
    if (image?.close && typeof image.close === 'function') image.close();
  });
}

function resourceInventory(root) {
  const geometries = new Set(), textures = new Set(), materials = new Set(), arrays = new Set(), skeletons = new Set();
  let meshes = 0, skinnedMeshes = 0, vertices = 0;
  root.traverse(node => {
    if (!node.isMesh) return;
    meshes++; if (node.isSkinnedMesh) skinnedMeshes++;
    if (node.skeleton) skeletons.add(node.skeleton);
    if (node.geometry && !geometries.has(node.geometry)) {
      geometries.add(node.geometry);
      vertices += node.geometry.attributes.position?.count || 0;
      for (const attribute of Object.values(node.geometry.attributes)) if (attribute.array) arrays.add(attribute.array);
      if (node.geometry.index?.array) arrays.add(node.geometry.index.array);
    }
    for (const material of materialsOf(node)) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  return { meshes, skinnedMeshes, vertices, materials: materials.size, textures: textures.size,
    skeletonOwners: skeletons.size,
    boneMatrixBytes: [...skeletons].reduce((bytes, skeleton) => bytes + (skeleton.boneMatrices?.byteLength || 0), 0),
    attributeBytes: [...arrays].reduce((bytes, array) => bytes + array.byteLength, 0),
    decodedTextureBaseBytes: [...textures].reduce((bytes, texture) => {
      const image = texture.source?.data || texture.image;
      return bytes + (image?.width || image?.naturalWidth || 0) * (image?.height || image?.naturalHeight || 0) * 4;
    }, 0) };
}

// A single GLB skin can be instantiated as one Skeleton per material mesh.
// Share only proven identical bone objects/inverse binds within this one
// actor lease. Vertex skin indices, bind matrices, materials and canonical
// surfaces stay unchanged; separate actor leases never share mutable bones.
function shareIdenticalLeaseSkeletons(root) {
  const retained = [], abandoned = new Set();
  root.traverse(node => {
    const current = node.skeleton;
    if (!current) return;
    const same = retained.find(candidate => candidate !== current
      && candidate.bones.length === current.bones.length
      && candidate.boneInverses.length === current.boneInverses.length
      && candidate.bones.every((bone, index) => bone === current.bones[index])
      && candidate.boneInverses.every((matrix, index) => matrix.equals(current.boneInverses[index])));
    if (same) { node.skeleton = same; abandoned.add(current); }
    else if (!retained.includes(current)) retained.push(current);
  });
  const live = new Set(); root.traverse(node => { if (node.skeleton) live.add(node.skeleton); });
  for (const skeleton of abandoned) if (!live.has(skeleton)) skeleton.dispose();
}

/** Clone the actual skinned canonical derivative, never scene.clone(true).
 * Geometry/materials and every bone/skeleton are per lease; decoded source
 * textures are ref-counted until the final instance and pending caller exit.
 * No placeholder craft can acquire loaded/rendered status. */
export function createRocketCraftAssets({ records, loader = defaultLoader,
  cache = loader === defaultLoader ? defaultCache : new Map() }) {
  let disposed = false;
  const pending = new Set(), leases = new Set();
  const delivery = new Map();
  function release(entry) {
    entry.refs = Math.max(0, entry.refs - 1);
    if (entry.refs !== 0) return;
    if (cache.get(entry.url) === entry) cache.delete(entry.url);
    if (entry.gltf) disposeSource(entry.gltf);
  }
  async function load(world) {
    if (disposed) return null;
    const record = records?.[world];
    if (!record || !OWNED_MODEL_PATH.test(record.url || '') || record.capture?.socket !== 'wordCaptureSocket') {
      delivery.set(world, { status: 'unavailable', reason: 'No registered original craft' });
      return null;
    }
    let entry = cache.get(record.url);
    if (!entry) {
      entry = { url: record.url, refs: 0, gltf: null };
      entry.promise = loader.loadAsync(record.url).then(gltf => { entry.gltf = gltf; return gltf; });
      cache.set(record.url, entry);
    }
    entry.refs++;
    const token = { entry, released: false };
    pending.add(token);
    const releaseToken = () => { if (!token.released) { token.released = true; release(entry); } };
    delivery.set(world, { status: 'loading', url: record.url });
    let root, mixer;
    const ownedGeometry = new Set(), ownedMaterial = new Set(), ownedSkeleton = new Set();
    function disposeClone() {
      mixer?.stopAllAction(); if (mixer && root) mixer.uncacheRoot(root);
      ownedGeometry.forEach(value => value.dispose()); ownedMaterial.forEach(value => value.dispose());
      ownedSkeleton.forEach(value => value.dispose()); root?.removeFromParent();
    }
    try {
      const gltf = await entry.promise;
      if (disposed || token.released) { releaseToken(); return null; }
      const actualClips = new Map(gltf.animations.map(clip => [clip.name, clip]));
      if (actualClips.size !== FLIGHT_CLIPS.length || FLIGHT_CLIPS.some(name => !actualClips.has(name))) {
        throw new Error('Original flight clips are incomplete or contain unrelated actions');
      }
      root = cloneSkeleton(gltf.scene);
      shareIdenticalLeaseSkeletons(root);
      root.updateMatrixWorld(true);
      const surfaceContacts = Object.entries(record.contacts || {}).map(([name, value]) => {
        const bone = namedNode(root, value.bone), support = namedNode(root, value.support);
        if (!bone || !support || !Array.isArray(value.sourcePoint) || value.sourcePoint.length !== 3
          || !value.sourcePoint.every(Number.isFinite)) throw new Error('A registered original grip/sole source is invalid');
        // The retained source uses Blender X/right Y/forward Z/up. Preserve
        // that actual rigid-bone surface point in the loaded bind pose, then
        // observe its evaluated motion against the real support socket.
        const [x, y, z] = value.sourcePoint;
        const local = new THREE.Vector3(x, z, -y).applyMatrix4(bone.matrixWorld.clone().invert());
        return { name, bone, support, local };
      });
      root.traverse(node => { if (node.skeleton) ownedSkeleton.add(node.skeleton); });
      if (!namedNode(root, record.capture.socket)) throw new Error('The physical receiver socket is missing');
      root.traverse(node => {
        if (!node.isMesh) return;
        node.geometry = node.geometry.clone();
        ownedGeometry.add(node.geometry);
        node.material = Array.isArray(node.material) ? node.material.map(material => material.clone()) : node.material.clone();
        materialsOf(node).forEach(material => ownedMaterial.add(material));
        node.castShadow = false; node.receiveShadow = false;
        if (node.isSkinnedMesh) node.frustumCulled = false;
      });
      if (!root.children.length) throw new Error('The authored spacecraft is empty');
      mixer = new THREE.AnimationMixer(root);
      const actions = new Map();
      FLIGHT_CLIPS.forEach(name => {
        const action = mixer.clipAction(actualClips.get(name));
        action.setLoop(name === 'cruise' ? THREE.LoopRepeat : THREE.LoopOnce, name === 'cruise' ? Infinity : 1);
        action.clampWhenFinished = name !== 'cruise';
        actions.set(name, action);
      });
      let current = null, leaseDisposed = false, rendered = false;
      const inventory = resourceInventory(root);
      if (inventory.skinnedMeshes === 0) throw new Error('The canonical pilot has no actual skin');
      function disposeLease() {
        if (leaseDisposed) return;
        leaseDisposed = true;
        disposeClone(); leases.delete(lease); releaseToken();
      }
      const lease = {
        root, mixer,
        play(name, { restart = true, blend = .055 } = {}) {
          if (leaseDisposed || !actions.has(name)) return false;
          const next = actions.get(name);
          if (current === next && !restart) return true;
          if (current && current !== next) current.fadeOut(blend);
          if (restart) next.reset();
          next.enabled = true; next.setEffectiveWeight(1); next.fadeIn(blend).play(); current = next;
          return true;
        },
        update(seconds) { if (!leaseDisposed) mixer.update(Math.max(0, Math.min(.12, Number(seconds) || 0))); },
        sample(name, phase) {
          if (leaseDisposed || !actions.has(name) || !Number.isFinite(phase)) return false;
          const next = actions.get(name);
          // The registered Canvas frame and original GLB are sampled from the
          // same explicit clip phase. Mixer blending cannot shift a contact
          // socket relative to the authored fallback pose.
          if (current !== next) { mixer.stopAllAction(); next.reset(); current = next; }
          next.enabled = true; next.paused = true; next.setEffectiveWeight(1);
          next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; next.play();
          next.time = Math.max(0, Math.min(1, phase)) * next.getClip().duration;
          mixer.update(0);
          return true;
        },
        socket(name, target = new THREE.Vector3()) {
          if (leaseDisposed) return null;
          const node = namedNode(root, name);
          if (!node) return null;
          root.updateMatrixWorld(true); return node.getWorldPosition(target);
        },
        contacts() {
          if (leaseDisposed) return [];
          root.updateMatrixWorld(true);
          return surfaceContacts.map(({ name, bone, support, local }) => {
            const point = local.clone().applyMatrix4(bone.matrixWorld), supported = support.getWorldPosition(new THREE.Vector3());
            return { name, sourceKind: 'Registered original rigid-bone grip/sole centre',
              point: point.toArray(), support: supported.toArray(), separation: point.distanceTo(supported) };
          });
        },
        markRendered() {
          if (leaseDisposed) return;
          rendered = true;
          delivery.set(world, { status: 'rendered', url: record.url, resources: { ...inventory } });
        },
        inspect: () => ({ world, disposed: leaseDisposed, rendered, clip: current?.getClip().name || null,
          resources: { ...inventory }, captureSocket: record.capture.socket }),
        dispose: disposeLease,
      };
      leases.add(lease); lease.play('cruise', { blend: 0 });
      delivery.set(world, { status: 'loaded', url: record.url, resources: { ...inventory } });
      return lease;
    } catch (error) {
      // A clone is not accepted merely because the source URL loaded. On any
      // incomplete skeleton/action/source shape the world uses its authored
      // fallback; no primitive proxy or fabricated rendered state is supplied.
      disposeClone();
      releaseToken();
      if (!disposed) delivery.set(world, { status: 'failed', url: record.url, reason: String(error.message || error) });
      return null;
    } finally { pending.delete(token); }
  }
  return {
    load,
    inspect: () => ({ disposed, activeLeases: leases.size, pending: pending.size,
      delivery: [...delivery].map(([world, value]) => ({ world, ...structuredClone(value) })) }),
    dispose() {
      if (disposed) return;
      disposed = true;
      [...leases].forEach(lease => lease.dispose());
      // A pending decode retains its source until it resolves, then load()
      // releases it. Disposing a cache entry before GLTFLoader finishes would
      // resurrect textures or deprive a different live owner of the source.
    },
  };
}
