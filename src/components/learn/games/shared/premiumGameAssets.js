import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const modelCache = new Map();

function loadModel(url) {
  if (!modelCache.has(url)) {
    modelCache.set(url, loader.loadAsync(url).catch(error => {
      modelCache.delete(url);
      throw error;
    }));
  }
  return modelCache.get(url);
}

// Loads a static, owned glTF scene and returns a self-contained geometry /
// material instance. Texture maps remain shared with the cached source model,
// which keeps repeated scenery light enough for iPad; disposeOwnedModelInstance
// deliberately leaves those cached maps alive for the next game session.
export async function createOwnedModelInstance(THREE, url, {
  height = 2,
  castShadow = true,
  receiveShadow = true
} = {}) {
  const gltf = await loadModel(url);
  const root = gltf.scene.clone(true);

  root.traverse(node => {
    if (!node.isMesh) return;
    if (node.geometry?.clone) node.geometry = node.geometry.clone();
    if (Array.isArray(node.material)) node.material = node.material.map(material => material.clone());
    else if (node.material?.clone) node.material = node.material.clone();
    node.castShadow = castShadow;
    node.receiveShadow = receiveShadow;
  });

  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = height / Math.max(0.001, size.y);
  root.scale.setScalar(scale);
  const scaledBounds = new THREE.Box3().setFromObject(root);
  const centre = scaledBounds.getCenter(new THREE.Vector3());
  root.position.x -= centre.x;
  root.position.y -= scaledBounds.min.y;
  root.position.z -= centre.z;
  const container = new THREE.Group();
  container.add(root);
  return container;
}

export function disposeOwnedModelInstance(root) {
  root?.traverse?.(node => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) material?.dispose?.();
  });
}
