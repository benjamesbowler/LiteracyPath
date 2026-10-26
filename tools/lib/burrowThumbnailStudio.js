import * as THREE from 'three';
import { partMesh } from '../../src/components/learn/games/games/burrowPartMeshes.js';
import { physicalThemeForDifficulty } from '../../src/components/learn/games/shared/physicalArcadeThemes.js';
import { BUILD_PARTS } from '../../src/utils/burrowBuildersRules.js';

// Build-time only. The shipped palette is raster imagery, not ten more renderers.
export async function renderBurrowThumbnails() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(192, 192); renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  const textures = new Map(), loader = new THREE.TextureLoader();
  for (const id of ['plank', 'stone', 'shingle']) {
    const texture = await loader.loadAsync(`/game-assets/physical-arcade/burrow-builders/materials/${id}-albedo-v1.webp`);
    texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; textures.set(id, texture);
  }
  const results = [];
  try {
    for (const difficulty of ['easy', 'medium', 'hard']) for (const type of BUILD_PARTS) {
      const theme = physicalThemeForDifficulty(difficulty), pool = new Map();
      const resources = { get(key, factory) { if (!pool.has(key)) pool.set(key, factory()); return pool.get(key); } };
      resources.material = (id, color) => resources.get(`material:${id}:${color}`, () => new THREE.MeshStandardMaterial({ color, map: textures.get(id), roughness: .92 }));
      const scene = new THREE.Scene(), piece = partMesh(THREE, { x: 5, z: 5, y: 0, type, rotation: 0 }, theme, resources);
      scene.add(piece, new THREE.HemisphereLight('#fff8e8', '#7495a2', 2.2));
      const light = new THREE.DirectionalLight('#fff6dd', 3); light.position.set(-3, 7, 5); scene.add(light);
      const camera = new THREE.OrthographicCamera(-.91, .91, .91, -.91, .1, 20);
      const bounds = new THREE.Box3().setFromObject(piece), center = bounds.getCenter(new THREE.Vector3());
      // A fixed object scale makes the card correspond to one real building cell.
      camera.position.copy(center).add(new THREE.Vector3(2.6, 2, 3)); camera.lookAt(center);
      renderer.render(scene, camera);
      results.push({ filename: `${theme.id}-${type}-v1.png`, data: renderer.domElement.toDataURL('image/png').split(',')[1] });
      const geometries = new Set(), materials = new Set();
      scene.traverse(node => { if (node.geometry) geometries.add(node.geometry); if (node.material) materials.add(node.material); });
      for (const item of [...pool.values(), ...geometries, ...materials]) if (item?.dispose) item.dispose();
    }
    return results;
  } finally { for (const texture of textures.values()) texture.dispose(); renderer.dispose(); renderer.forceContextLoss(); }
}
