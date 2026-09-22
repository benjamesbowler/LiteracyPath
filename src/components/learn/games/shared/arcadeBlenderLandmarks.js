import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from './threeShell.js';
import { blenderWorldUrl } from './arcadeBlenderWorlds.js';

// Decorative architecture only: callers place it outside physical play space.
// Clones share their scope's geometry/materials, but own animation mixers.
export function createBlenderLandmarks(gameId, placements, { onReady } = {}) {
  const root = new THREE.Group(); root.name = `BlenderWorld_${gameId}`;
  root.userData.assetState = 'loading';
  const motion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const mixers = [];
  let template = null, disposed = false;
  const ready = new GLTFLoader().loadAsync(blenderWorldUrl(gameId)).then(gltf => {
    if (disposed) { disposeObject(gltf.scene); return false; }
    template = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(template);
    const center = bounds.getCenter(new THREE.Vector3());
    const sourceHeight = Math.max(.01, bounds.max.y - bounds.min.y);
    for (const placement of placements) {
      const slot = new THREE.Group(); slot.position.set(placement.x, placement.y || 0, placement.z);
      slot.rotation.y = placement.yaw || 0;
      slot.scale.setScalar(placement.height / sourceHeight);
      const model = template.clone(true);
      model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
      model.traverse(node => { if (node.isMesh) { node.castShadow = false; node.receiveShadow = true; } });
      slot.add(model); root.add(slot);
      const mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach(clip => mixer.clipAction(clip).play());
      mixers.push(mixer);
    }
    root.userData.assetState = 'ready';
    onReady?.(root);
    return true;
  }).catch(() => { if (!disposed) root.userData.assetState = 'fallback'; return false; });
  return {
    root, ready,
    update(dt, { paused = false, reducedMotion = false } = {}) {
      if (disposed || paused || reducedMotion || motion?.matches) return;
      const step = Math.min(.05, Math.max(0, dt));
      mixers.forEach(mixer => mixer.update(step));
      root.userData.animationTime = (root.userData.animationTime || 0) + step;
    },
    dispose() {
      disposed = true;
      root.removeFromParent();
      mixers.forEach(mixer => { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); });
      mixers.length = 0;
      root.clear();
      if (template) disposeObject(template);
      template = null;
    }
  };
}
