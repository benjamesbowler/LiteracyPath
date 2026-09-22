import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../shared/threeShell.js';

export const ROCKET_COURIER_URL = '/game-assets/arcade-blender/rocket-courier.glb';

// A mounted game owns its geometry/materials. A late load is disposed and cannot
// reattach after exit; the existing complete craft covers loading and failure.
export function attachRocketCourier(parent, { onReady } = {}) {
  let disposed = false;
  let model = null;
  const ready = new GLTFLoader().loadAsync(ROCKET_COURIER_URL).then(gltf => {
    if (disposed) { disposeObject(gltf.scene); return false; }
    model = gltf.scene;
    model.name = 'BlenderRocketCourier';
    model.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    parent.add(model);
    onReady?.(model);
    return true;
  }).catch(() => false);
  function dispose() {
    disposed = true;
    if (!model) return;
    parent.remove(model);
    disposeObject(model);
    model = null;
  }
  return { ready, dispose };
}
