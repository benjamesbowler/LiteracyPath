import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { trailCenterX, trailHalfWidth, TRAIL_BOUNDS } from "../../../utils/questHub.js";

const MONSTER_ROOT = "/models/quest/monsters";
const NATURE_ROOT = "/models/quest/nature";

const MODEL_LIBRARY = Object.freeze({
  bunny: { file: "Bunny.gltf", scale: 0.56 },
  dino: { file: "Dino.gltf", scale: 0.6 },
  frog: { file: "Frog.gltf", scale: 0.7 },
  glub: { file: "Glub.gltf", scale: 0.72, flying: true, groundY: 0.08 },
  greenBlob: { file: "GreenBlob.gltf", scale: 0.94 },
  greenSpikyBlob: { file: "GreenSpikyBlob.gltf", scale: 0.49 },
  mushnub: { file: "Mushnub.gltf", scale: 0.6 },
  mushnubEvolved: { file: "Mushnub_Evolved.gltf", scale: 0.46 },
  mushroomKing: { file: "MushroomKing.gltf", scale: 0.55 },
  pinkBlob: { file: "PinkBlob.gltf", scale: 0.92 },
  wizard: { file: "Wizard.gltf", scale: 0.72 },
  yeti: { file: "Yeti.gltf", scale: 0.68 }
});

const WORLD_CASTS = Object.freeze({
  meadow: {
    player: "mushnubEvolved",
    guide: "bunny",
    residents: ["frog", "mushroomKing", "greenBlob", "pinkBlob"]
  },
  dino: {
    player: "mushnubEvolved",
    guide: "dino",
    residents: ["yeti", "greenSpikyBlob", "mushroomKing", "frog"]
  },
  moonwood: {
    player: "mushnubEvolved",
    guide: "wizard",
    residents: ["glub", "pinkBlob", "greenSpikyBlob", "mushnub"]
  }
});

const MOTION_CANDIDATES = Object.freeze({
  idle: ["Idle", "Flying_Idle", "Jump_Idle"],
  walk: ["Walk", "Fast_Flying", "Run"],
  teach: ["Wave", "Yes", "Idle", "Flying_Idle"],
  cheer: ["Dance", "Cheer", "Jump", "Yes", "Wave"],
  sad: ["No", "HitReact", "HitRecieve", "Idle", "Flying_Idle"]
});

const loader = new GLTFLoader();
const modelCache = new Map();
let contactShadowTexture = null;

function loadModel(url) {
  if (!modelCache.has(url)) {
    modelCache.set(url, new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    }));
  }
  return modelCache.get(url);
}

function makeContactShadow(radius, opacity) {
  if (!contactShadowTexture) {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(96, 96, 8, 96, 96, 88);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.5)");
    gradient.addColorStop(0.58, "rgba(0, 0, 0, 0.17)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 192, 192);
    contactShadowTexture = new THREE.CanvasTexture(canvas);
    contactShadowTexture.colorSpace = THREE.SRGBColorSpace;
  }
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2.2, radius * 1.42),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity,
      depthWrite: false
    })
  );
  shadow.name = "rigged-contact-shadow";
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.016;
  shadow.renderOrder = -1;
  return shadow;
}

function physicalMaterialFrom(source, { tint = null, maxAnisotropy = 1 } = {}) {
  const material = new THREE.MeshPhysicalMaterial({
    color: source.color || 0xffffff,
    map: source.map || null,
    alphaMap: source.alphaMap || null,
    emissive: source.emissive || 0x000000,
    emissiveMap: source.emissiveMap || null,
    emissiveIntensity: source.emissiveIntensity ?? 1,
    normalMap: source.normalMap || null,
    normalScale: source.normalScale || new THREE.Vector2(1, 1),
    roughnessMap: source.roughnessMap || null,
    metalnessMap: source.metalnessMap || null,
    roughness: 0.58,
    metalness: 0.015,
    clearcoat: 0.18,
    clearcoatRoughness: 0.72,
    sheen: 0.12,
    sheenRoughness: 0.78,
    envMapIntensity: 0.92,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaTest: source.alphaTest,
    side: source.side,
    vertexColors: source.vertexColors,
    depthWrite: source.depthWrite,
    depthTest: source.depthTest
  });
  material.name = source.name;
  if (tint) {
    const tintMix = new THREE.Color(0xffffff).lerp(new THREE.Color(tint), 0.24);
    material.color.multiply(tintMix);
  }
  for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]) {
    if (texture) texture.anisotropy = Math.max(texture.anisotropy || 1, maxAnisotropy);
  }
  return material;
}

function prepareRiggedCharacter(gltf, modelKey, {
  role,
  tint = null,
  maxAnisotropy = 1,
  compact = false
}) {
  const spec = MODEL_LIBRARY[modelKey];
  const root = new THREE.Group();
  const visual = cloneSkeleton(gltf.scene);
  const materialClones = new Map();
  visual.name = `${modelKey}-skinned-model`;
  visual.scale.setScalar(spec.scale);

  visual.traverse(object => {
    if (!object.isMesh) return;
    object.geometry = object.geometry.clone();
    const originals = Array.isArray(object.material) ? object.material : [object.material];
    const replacements = originals.map(original => {
      if (!materialClones.has(original.uuid)) {
        materialClones.set(original.uuid, physicalMaterialFrom(original, {
          tint: role === "player" ? tint : null,
          maxAnisotropy
        }));
      }
      return materialClones.get(original.uuid);
    });
    object.material = Array.isArray(object.material) ? replacements : replacements[0];
    // Animated skinned shadow maps can stretch into giant quads on some WebGL
    // drivers. The authored radial contact shadow keeps the character grounded
    // without that device-dependent failure mode.
    object.castShadow = !object.isSkinnedMesh;
    object.receiveShadow = true;
  });

  const desktopScale = role === "player" ? 0.58 : role === "guide" ? 0.74 : 0.7;
  const roleScale = desktopScale * (compact ? (role === "player" ? 0.72 : 0.86) : 1);
  root.name = `${role}-${modelKey}-rigged`;
  root.userData.baseScale = roleScale;
  root.userData.groundY = spec.groundY || 0;
  root.userData.facing = role === "player" ? Math.PI : 0;
  root.add(makeContactShadow(role === "player" ? 0.84 : 0.74, role === "player" ? 0.3 : 0.23));
  root.add(visual);

  const mixer = new THREE.AnimationMixer(visual);
  const clips = new Map(gltf.animations.map(clip => [clip.name.toLowerCase(), clip]));
  root.userData.rig = {
    mixer,
    clips,
    currentAction: null,
    currentMotion: null,
    flying: Boolean(spec.flying),
    materials: [...materialClones.values()]
  };
  setRiggedMotion(root, "idle", true);
  return root;
}

function clipForMotion(rig, motion) {
  const candidates = MOTION_CANDIDATES[motion] || MOTION_CANDIDATES.idle;
  for (const name of candidates) {
    const clip = rig.clips.get(name.toLowerCase());
    if (clip) return clip;
  }
  return rig.clips.values().next().value || null;
}

function setRiggedMotion(root, motion, immediate = false) {
  const rig = root.userData.rig;
  if (!rig || rig.currentMotion === motion) return;
  const clip = clipForMotion(rig, motion);
  if (!clip) return;
  const nextAction = rig.mixer.clipAction(clip);
  nextAction.enabled = true;
  nextAction.setEffectiveTimeScale(motion === "walk" ? 1.08 : 1);
  nextAction.setEffectiveWeight(1);
  nextAction.setLoop(THREE.LoopRepeat, Infinity);
  nextAction.reset().play();
  if (rig.currentAction && !immediate) rig.currentAction.crossFadeTo(nextAction, 0.22, false);
  else if (rig.currentAction) rig.currentAction.stop();
  rig.currentAction = nextAction;
  rig.currentMotion = motion;
}

export function updateRiggedCharacter(root, {
  now,
  dt,
  mood = "idle",
  moving = false,
  solved = false,
  next = false,
  visible = true,
  turn = 0
}) {
  if (!root?.userData.rig) return false;
  root.visible = visible;
  if (!visible) return true;
  const rig = root.userData.rig;
  const motion = moving ? "walk" : mood === "sad" ? "sad" : (mood === "cheer" || solved) ? "cheer" : (mood === "teach" || next) ? "teach" : "idle";
  setRiggedMotion(root, motion);
  rig.mixer.update(dt);

  const baseScale = root.userData.baseScale || 1;
  const targetScale = baseScale * (next ? 1.06 : solved ? 0.98 : 1);
  const scaleBlend = 1 - Math.pow(0.015, dt);
  root.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), scaleBlend);
  root.rotation.y = THREE.MathUtils.lerp(
    root.rotation.y,
    (root.userData.facing || 0) + turn,
    1 - Math.pow(0.01, dt)
  );
  const hover = rig.flying ? 0.16 + Math.sin(now * 0.0024) * 0.08 : 0;
  root.position.y = (root.userData.groundY || 0) + hover;
  return true;
}

function castForWorld(world) {
  return WORLD_CASTS[world] || WORLD_CASTS.meadow;
}

export async function createRiggedTrailCharacters(section, {
  playerTint,
  maxAnisotropy = 1,
  compact = false
} = {}) {
  const cast = castForWorld(section.world);
  const entries = [
    { slot: "player", modelKey: cast.player, role: "player" },
    { slot: "guide", modelKey: cast.guide, role: "guide" },
    ...section.encounters.map(encounter => ({
      slot: encounter.id,
      modelKey: cast.residents[encounter.order % cast.residents.length],
      role: "resident"
    }))
  ];
  const settled = await Promise.allSettled(entries.map(entry => (
    loadModel(`${MONSTER_ROOT}/${MODEL_LIBRARY[entry.modelKey].file}`)
  )));
  const result = { player: null, guide: null, residents: new Map() };
  settled.forEach((loadResult, index) => {
    if (loadResult.status !== "fulfilled") return;
    const entry = entries[index];
    const character = prepareRiggedCharacter(loadResult.value, entry.modelKey, {
      role: entry.role,
      tint: playerTint,
      maxAnisotropy,
      compact
    });
    if (entry.slot === "player" || entry.slot === "guide") result[entry.slot] = character;
    else result.residents.set(entry.slot, character);
  });
  return result;
}

function cloneNatureMaterials(source, { tint = 0xffffff, maxAnisotropy = 1, wind = false } = {}) {
  const originals = Array.isArray(source) ? source : [source];
  const materials = originals.map(original => {
    const material = original.clone();
    material.color.multiply(new THREE.Color(tint));
    material.roughness = Math.max(0.62, material.roughness || 0.5);
    material.metalness = 0;
    material.envMapIntensity = 0.72;
    const isCutout = /leaves|flowers/i.test(material.name);
    if (material.transparent || isCutout) {
      material.transparent = false;
      material.alphaTest = Math.max(isCutout ? 0.42 : 0.32, material.alphaTest || 0);
      material.depthWrite = true;
      if (isCutout) material.side = THREE.DoubleSide;
    }
    for (const texture of [material.map, material.normalMap]) {
      if (texture) texture.anisotropy = Math.max(texture.anisotropy || 1, maxAnisotropy);
    }
    if (wind && isCutout) addWindShader(material);
    return material;
  });
  return Array.isArray(source) ? materials : materials[0];
}

function addWindShader(material) {
  material.userData.windStrength = 0.035;
  material.onBeforeCompile = shader => {
    shader.uniforms.questTime = { value: 0 };
    shader.vertexShader = `uniform float questTime;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float questWindWeight = smoothstep(0.35, 4.8, position.y);
       transformed.x += sin(questTime * 1.7 + position.y * 2.2 + position.z) * ${material.userData.windStrength.toFixed(3)} * questWindWeight;
       transformed.z += cos(questTime * 1.2 + position.x * 1.8) * ${(material.userData.windStrength * 0.58).toFixed(3)} * questWindWeight;`
    );
    material.userData.windShader = shader;
  };
  material.customProgramCacheKey = () => "sound-seekers-wind-v1";
}

function sourceMeshes(asset) {
  asset.scene.updateMatrixWorld(true);
  const sources = [];
  asset.scene.traverse(object => {
    if (object.isMesh) sources.push(object);
  });
  return sources;
}

function makeInstancedAsset(asset, count, layout, options = {}) {
  const sources = sourceMeshes(asset);
  if (!sources.length || count <= 0) return null;
  const group = new THREE.Group();
  const transforms = Array.from({ length: count }, (_, index) => layout(index));

  for (const source of sources) {
    const geometry = source.geometry.clone();
    geometry.applyMatrix4(source.matrixWorld);
    const materials = cloneNatureMaterials(source.material, options);
    const mesh = new THREE.InstancedMesh(geometry, materials, count);
    const helper = new THREE.Object3D();
    transforms.forEach((transform, index) => {
      helper.position.set(transform.x, transform.y || 0, transform.z);
      helper.rotation.set(transform.rotationX || 0, transform.rotationY || 0, transform.rotationZ || 0);
      helper.scale.setScalar(transform.scale || 1);
      helper.updateMatrix();
      mesh.setMatrixAt(index, helper.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = options.castShadow !== false;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  return group;
}

function windMaterialsFor(root) {
  const materials = new Set();
  root.traverse(object => {
    const entries = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    entries.forEach(material => {
      if (material.userData.windStrength) materials.add(material);
    });
  });
  return [...materials];
}

function seededUnit(value) {
  return Math.abs(Math.sin(value * 12.9898 + 78.233) * 43758.5453) % 1;
}

function treeLayout(section, rows, index) {
  const perBand = rows * 2;
  const band = Math.floor(index / perBand);
  const lane = index % perBand;
  const side = lane % 2 === 0 ? -1 : 1;
  const row = Math.floor(lane / 2);
  const z = TRAIL_BOUNDS.startZ + 1 - band * 4.25 + (row % 2) * 1.15;
  const center = trailCenterX(z, section.stopIndex);
  const width = trailHalfWidth(z, section.stopIndex);
  const seed = section.stopIndex * 131 + index * 17;
  return {
    x: center + side * (width + 1.35 + row * 2.65 + seededUnit(seed) * 0.48),
    y: -0.02,
    z: z + (seededUnit(seed + 4) - 0.5) * 0.74,
    scale: 0.68 + seededUnit(seed + 8) * 0.22,
    rotationY: seededUnit(seed + 12) * Math.PI * 2
  };
}

function groundScatterLayout(section, index, { inset = 0.5, step = 5.6, scale = 1 } = {}) {
  const z = TRAIL_BOUNDS.startZ - 5 - index * step;
  const side = index % 2 === 0 ? -1 : 1;
  const seed = section.stopIndex * 79 + index * 23;
  return {
    x: trailCenterX(z, section.stopIndex) + side * (trailHalfWidth(z, section.stopIndex) + inset + seededUnit(seed) * 0.8),
    y: 0.03,
    z: z + (seededUnit(seed + 6) - 0.5) * 1.8,
    scale: scale * (0.72 + seededUnit(seed + 11) * 0.48),
    rotationY: seededUnit(seed + 14) * Math.PI * 2
  };
}

export async function createImportedNature(section, theme, quality, { maxAnisotropy = 1 } = {}) {
  const treeFiles = section.world === "meadow"
    ? ["BirchTree_1.gltf"]
    : section.world === "dino"
      ? ["DeadTree_1.gltf", "DeadTree_4.gltf", "DeadTree_7.gltf"]
      : ["DeadTree_4.gltf", "DeadTree_7.gltf"];
  const requests = [
    ...treeFiles.map(treeFile => loadModel(`${NATURE_ROOT}/${treeFile}`)),
    loadModel(`${NATURE_ROOT}/Bush_Flowers.gltf`),
    loadModel(`${NATURE_ROOT}/Flower_1_Clump.gltf`),
    loadModel(`${NATURE_ROOT}/Bush_Large.gltf`)
  ];
  const results = await Promise.allSettled(requests);
  const treeResults = results.slice(0, treeFiles.length);
  const bushResult = results[treeFiles.length];
  const flowerResult = results[treeFiles.length + 1];
  const dryBushResult = results[treeFiles.length + 2];
  const group = new THREE.Group();
  group.name = `imported-nature-${section.world}`;
  group.userData.windMaterials = [];
  group.userData.replacesFallbackTrees = false;

  const loadedTrees = treeResults.filter(result => result.status === "fulfilled");
  const rows = quality.treeRows >= 3 ? 2 : 1;
  const bands = Math.ceil((TRAIL_BOUNDS.startZ - TRAIL_BOUNDS.endZ + 5) / 4.25);
  const totalTreeCount = bands * rows * 2;
  const treeTint = section.world === "moonwood" ? 0x9aa9bd : section.world === "dino" ? 0xc2a77e : 0xffffff;
  loadedTrees.forEach((treeResult, assetIndex) => {
    const count = Math.ceil(totalTreeCount / loadedTrees.length);
    const trees = makeInstancedAsset(
      treeResult.value,
      count,
      index => treeLayout(section, rows, index * loadedTrees.length + assetIndex),
      {
        tint: treeTint,
        maxAnisotropy,
        wind: section.world === "meadow"
      }
    );
    if (trees) {
      trees.name = `textured-tree-belt-${assetIndex + 1}`;
      group.add(trees);
      group.userData.windMaterials.push(...windMaterialsFor(trees));
      group.userData.replacesFallbackTrees = true;
    }
  });

  if (bushResult.status === "fulfilled" && section.world !== "dino") {
    const count = quality.treeRows >= 3 ? 22 : 13;
    const tint = section.world === "moonwood" ? 0x82a8a8 : 0xffffff;
    const bushes = makeInstancedAsset(
      bushResult.value,
      count,
      index => groundScatterLayout(section, index, { inset: 0.38, step: 6.2, scale: 0.72 }),
      { tint, maxAnisotropy, wind: true, castShadow: false }
    );
    if (bushes) {
      bushes.name = "textured-flowering-bushes";
      group.add(bushes);
      group.userData.windMaterials.push(...windMaterialsFor(bushes));
    }
  }

  if (flowerResult.status === "fulfilled" && section.world !== "dino") {
    const count = quality.treeRows >= 3 ? 30 : 18;
    const tint = section.world === "moonwood" ? theme.glow : 0xffffff;
    const flowers = makeInstancedAsset(
      flowerResult.value,
      count,
      index => groundScatterLayout(section, index, { inset: -0.08, step: 4.7, scale: 0.82 }),
      { tint, maxAnisotropy, wind: true, castShadow: false }
    );
    if (flowers) {
      flowers.name = "textured-flower-clumps";
      group.add(flowers);
      group.userData.windMaterials.push(...windMaterialsFor(flowers));
    }
  }

  if (dryBushResult.status === "fulfilled" && section.world === "dino") {
    const count = quality.treeRows >= 3 ? 26 : 16;
    const dryScrub = makeInstancedAsset(
      dryBushResult.value,
      count,
      index => groundScatterLayout(section, index, { inset: 0.2, step: 5.1, scale: 0.7 }),
      { tint: 0xb69262, maxAnisotropy, wind: true, castShadow: false }
    );
    if (dryScrub) {
      dryScrub.name = "textured-ridge-scrub";
      group.add(dryScrub);
      group.userData.windMaterials.push(...windMaterialsFor(dryScrub));
    }
  }

  return group.children.length ? group : null;
}

export function updateImportedNature(group, now) {
  for (const material of group?.userData.windMaterials || []) {
    if (material.userData.windShader) material.userData.windShader.uniforms.questTime.value = now * 0.001;
  }
}

export function disposeAssetObject(root) {
  if (!root) return;
  root.traverse(object => {
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    materials.forEach(material => material.dispose());
  });
  root.userData.rig?.mixer?.stopAllAction?.();
}
