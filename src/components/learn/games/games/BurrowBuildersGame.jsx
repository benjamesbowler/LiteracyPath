import { burrowStructureChanged } from './burrowPresentation.js';
import { createArcadeRenderGate, arcadeDampingFactor } from '../shared/arcadeFramePolicy.js';
import { arcadePixelRatio } from '../shared/arcadeRenderBudget.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Howler } from 'howler';
import { playCorrectChime, playSoftBuzz, playPopSound, playTapSound, playWhoosh, playStarChime, playCelebrationFanfare, cancelGameSfx } from '../../../../utils/audio/gameSfx.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ArrowCounterClockwise, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Cube, Hand, Hammer, SpeakerHigh, Tree, ArrowsClockwise, GridFour, X } from '@phosphor-icons/react';
import { buildBurrowMissions, BURROW_BUILDERS_VERSION, BUILD_ISLANDS, BUILD_PARTS, BUILD_SUPPLY_PILES, createBurrowWorld, terrainAt, walkingHeight,
  moveBurrowPlayer, placeBurrowPart, pickupBurrowPart, undoBurrowEdit, newBurrowEvidence, commitBurrowResponse, installBurrowKit } from '../../../../utils/burrowBuildersRules.js';
import { effectiveBurrowTerrain, burrowShelteredBeds, growBurrowGardens, burrowWaterCells } from '../../../../utils/burrowBuildersRules.js';
import { loadBurrowSession, loadBurrowSavedWorlds, saveBurrowSession } from '../../../../utils/burrowBuildersSession.js';
import { phonicsTargetHint } from '../../../../utils/phonicsTargetPresentation.js';
import { createDrumTrailVoice } from '../../../../utils/drumTrailVoice.js';
import { loadThree, createRenderer, disposeObject, disposeRenderer, detectQualityTier, QUALITY_TIERS } from '../shared/threeShell.js';
import { createPalFigure, animatePalFigure, createWorldTree, createGraphemeTexture, createWoodMaterial } from '../shared/physicalArcadeWorld.js';
import { physicalThemeForDifficulty } from '../shared/physicalArcadeThemes.js';
import { createQuestFrameBudgetState, sampleQuestFrameBudget } from '../../../../utils/questPerformance.js';
import { createBurrowCanvasWorld } from './burrowBuildersCanvasWorld.js';
import './BurrowBuildersGame.css';

const PART_NAMES = { wood: 'Wood', stone: 'Stone', bridge: 'Bridge', roof: 'Roof', window: 'Window', garden: 'Garden', gate: 'Gate', bed: 'Sleep spot', channel: 'Channel', dam: 'Dam' };
const BURROW_ART = '/game-assets/physical-arcade/burrow-builders';
const BURROW_ART_PATHS = Object.fromEntries(['grass', 'plank', 'stone', 'soil', 'shingle'].map(id => [id, `${BURROW_ART}/materials/${id}-albedo-v1.webp`]));
for (const id of ['meadow', 'dino', 'moonwood']) BURROW_ART_PATHS[`${id}-horizon`] = `${BURROW_ART}/horizons/${id}-horizon-v1.webp`;
const BURROW_FOLIAGE = {
  meadow: { runtime: '/game-assets/physical-arcade/rally-pals/meadow-scenery-v1.webp', size: [1672, 941], tree: [145, 0, 578, 580] },
  dino: { runtime: '/game-assets/physical-arcade/rally-pals/dino-scenery-v1.webp', size: [1536, 1024], tree: [0, 0, 751, 600] },
  moonwood: { runtime: '/game-assets/physical-arcade/rally-pals/moonwood-scenery-v1.webp', size: [1536, 1024], tree: [122, 0, 596, 670] },
};
for (const [id, data] of Object.entries(BURROW_FOLIAGE)) BURROW_ART_PATHS[`${id}-foliage`] = data.runtime;

function loadBurrowArt(difficulty) {
  const world = physicalThemeForDifficulty(difficulty).id;
  return Promise.all(Object.entries(BURROW_ART_PATHS).filter(([id]) => !/(?:horizon|foliage)$/.test(id) || id.startsWith(`${world}-`)).map(([id, src]) => new Promise(resolve => {
    const image = new Image(); image.decoding = 'async'; let timer;
    const finish = value => { clearTimeout(timer); image.onload = null; image.onerror = null; resolve([id, value]); };
    image.onload = () => finish(image); image.onerror = () => finish(null);
    timer = setTimeout(() => { image.src = ''; finish(null); }, 6000); image.src = src;
  }))).then(entries => new Map(entries));
}
const iconForPart = { wood: '▰', stone: '◆', bridge: '═', roof: '⌂', window: '▦', garden: '❀', gate: '╫', bed: '▤', channel: '≈', dam: '▥' };
const ISLAND_NAMES = {
  meadow: ['Meadow Homes', 'River Workshop', 'Treetop Garden'],
  dino: ['Fern Homes', 'Fossil Creek', 'Egg Hill'],
  moonwood: ['Moonwood Village', 'Lantern Brook', 'Mushroom Glen'],
};
const islandName = (difficulty, id) => ISLAND_NAMES[physicalThemeForDifficulty(difficulty).id][BUILD_ISLANDS.findIndex(island => island.id === id)];

function MoveButton({ direction, label, Icon, apiRef }) {
  return <button type="button" aria-label={label}
    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); apiRef.current?.press(direction); }}
    onPointerUp={() => apiRef.current?.release(direction)} onPointerCancel={() => apiRef.current?.release(direction)} onLostPointerCapture={() => apiRef.current?.release(direction)}
    onClick={event => { if (event.detail === 0) { apiRef.current?.press(direction); apiRef.current?.release(direction); } }}><Icon size={29} /></button>;
}

function initialGame(missions, difficulty, seed, journeyIndex, scope, startLevel, resumed) {
  const restored = loadBurrowSession(scope, difficulty, seed, journeyIndex, missions);
  if (restored) return { ...restored,
    delivery: 'pending', pictureDelivery: 'pending', saveError: false, message: restored.phase === 'creative' ? 'Your island is saved. Keep building!' : '' };
  const cursor = Math.min(missions.length - 1, Math.max(0, startLevel));
  const retainedWorlds = loadBurrowSavedWorlds(scope, difficulty);
  return { version: BURROW_BUILDERS_VERSION, difficulty, seed, journeyIndex, cursor, phase: 'ready', islandId: BUILD_ISLANDS[journeyIndex % 3].id,
    worlds: Object.fromEntries(BUILD_ISLANDS.map(island => [island.id, { ...(retainedWorlds?.[island.id] || createBurrowWorld(island.id, { starter: true })), ...(difficulty === 'hard' ? { selectedPart: missions[cursor].part, camera: 0 } : {}) }])), chunks: [], mistakes: 0, freeBuilding: false, supportReasons: resumed || cursor ? ['resume-without-support-history'] : [],
    delivery: 'pending', pictureDelivery: 'pending', score: 0, evidence: newBurrowEvidence(), saveError: false, message: '' };
}

function partMesh(THREE, block, theme = physicalThemeForDifficulty('easy'), resources = { get: (_key, factory) => factory() }) {
  const group = new THREE.Group();
  const box = (...sizes) => resources.get(`box:${sizes.join(':')}`, () => new RoundedBoxGeometry(...sizes, 1, Math.min(...sizes) * .12));
  const sphere = (...sizes) => resources.get(`sphere:${sizes.join(':')}`, () => new THREE.SphereGeometry(...sizes));
  const cylinder = (...sizes) => resources.get(`cylinder:${sizes.join(':')}`, () => new THREE.CylinderGeometry(...sizes));
  const wood = () => resources.get('wood', () => resources.material?.('plank', theme.id === 'moonwood' ? '#cfccd9' : '#fff2d6') || createWoodMaterial(THREE, { color: theme.wood }));
  const cream = () => resources.get('cream', () => new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? '#e1eadb' : '#f4e5b5', roughness: .85 }));
  const add = (geometry, material, x = 0, y = 0, z = 0, parent = group) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  if (block.type === 'wood' || block.type === 'stone') {
    add(box(.92, .94, .92), block.type === 'wood' ? wood() : resources.get('stone', () => resources.material?.('stone', '#fff9ed') || new THREE.MeshStandardMaterial({ color: theme.stone, roughness: .95 })), 0, .47);
    if (block.type === 'stone') for (const [x, y] of [[-.25, .25], [.2, .6]]) add(box(.38, .025, .035), resources.get('stone-mark', () => new THREE.MeshStandardMaterial({ color: '#829399' })), x, y, .47);
  } else if (block.type === 'bridge') {
    for (let i = 0; i < 5; i++) add(box(.95, .16, .17), wood(), 0, .09, -.36 + i * .18);
    for (const z of [-.42, .42]) { add(box(1.05, .09, .09), wood(), 0, .55, z); for (const x of [-.43, .43]) add(box(.09, .6, .09), wood(), x, .3, z); }
  } else if (block.type === 'roof') {
    const roof = resources.get('roof-shingles', () => resources.material?.('shingle', theme.id === 'moonwood' ? '#809ec1' : theme.id === 'dino' ? '#d4bf8b' : '#ffefc9') || new THREE.MeshStandardMaterial({ color: '#d96845', roughness: .8 }));
    const left = add(box(.75, .13, 1.2), roof, -.25, .27); left.rotation.z = .55;
    const right = add(box(.75, .13, 1.2), roof, .25, .27); right.rotation.z = -.55;
    add(box(.11, .12, 1.26), roof, 0, .5);
    if (theme.id === 'dino') for (const z of [-.4, 0, .4]) add(box(1.16, .04, .07), cream(), 0, .27, z);
    if (theme.id === 'moonwood') add(sphere(.075, 8, 5), new THREE.MeshStandardMaterial({ color: theme.accent, emissive: theme.accent, emissiveIntensity: .3 }), 0, .58);
  } else if (block.type === 'window') {
    add(box(.92, .86, .15), wood(), 0, .43);
    add(box(.7, .63, .18), new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? theme.accent : '#8ed9eb', emissive: theme.id === 'moonwood' ? theme.accent : '#000000', emissiveIntensity: .35, metalness: .1, roughness: .25 }), 0, .45, .015);
    add(box(.06, .65, .2), cream(), 0, .45, .02); add(box(.72, .06, .2), cream(), 0, .45, .02);
  } else if (block.type === 'garden') {
    add(box(.95, .2, .95), wood(), 0, .1);
    add(box(.8, .04, .8), new THREE.MeshStandardMaterial({ color: '#775437' }), 0, .22);
    const plants = new THREE.Group(); plants.position.y = .23; group.add(plants); group.userData.gardenPlants = plants;
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.bezierCurveTo(.14, .08, .16, .33, 0, .47); leafShape.bezierCurveTo(-.16, .33, -.14, .08, 0, 0);
    const leafGeometry = resources.get('garden-leaf', () => new THREE.ExtrudeGeometry(leafShape, { depth: .014, bevelEnabled: true, bevelSize: .008, bevelThickness: .006, bevelSegments: 1, steps: 1 }));
    const leafMaterial = resources.get('garden-leaf-material', () => new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? '#6daa97' : '#478849', roughness: .83 }));
    for (const [x, z] of [[-.22, -.2], [.2, -.2], [-.22, .2], [.2, .2]]) {
      add(cylinder(.025, .025, .28, 5), resources.get('garden-stems', () => new THREE.MeshStandardMaterial({ color: '#528d3d' })), x, .15, z, plants);
      add(sphere(.11, 6, 4), resources.get('garden-fruit', () => new THREE.MeshStandardMaterial({ color: theme.id === 'dino' ? '#71a34e' : theme.id === 'moonwood' ? '#b9a8e5' : '#efaa46' })), x, .31, z, plants);
      for (let leaf = 0; leaf < 4; leaf++) { const object = add(leafGeometry, leafMaterial, x, .12, z, plants); object.rotation.set(.62 + (leaf % 2) * .2, leaf * Math.PI / 2, .15); object.scale.set(.55, .65, .55); }
      if (theme.id === 'dino') { const leaf = add(box(.25, .025, .08), new THREE.MeshStandardMaterial({ color: theme.foliage }), x, .21, z, plants); leaf.rotation.z = .35; }
    }
    compactScenery(THREE, plants, resources, 'garden-plants');
  } else if (block.type === 'gate') {
    for (const x of [-.42, .42]) add(box(.13, 1, .13), wood(), x, .5);
    for (const y of [.3, .7]) add(box(.86, .09, .1), wood(), 0, y);
    add(box(.075, .82, .1), cream(), 0, .5);
  } else if (block.type === 'bed') {
    add(box(.8, .25, .98), wood(), 0, .2); add(box(.75, .16, .88), cream(), 0, .42);
    add(box(.7, .08, .25), new THREE.MeshStandardMaterial({ color: '#e5f5f1' }), 0, .55, -.28);
    const blanket = add(box(.75, .1, .58), new THREE.MeshStandardMaterial({ color: '#80bac5' }), 0, .53, .15); blanket.userData.keepDynamicMaterial = true; group.userData.bedBlanket = blanket;
  } else if (block.type === 'dam') {
    for (const x of [-.35, 0, .35]) add(box(.29, .95, .2), wood(), x, .45);
    for (const y of [.25, .7]) add(box(1, .12, .27), wood(), 0, y);
  } else if (block.type === 'channel') {
    const soil = new THREE.MeshStandardMaterial({ color: '#a98457', roughness: .96 });
    for (const x of [-.43, .43]) add(box(.13, .2, .99), soil, x, -.08);
  }
  group.position.set(block.x - 5, block.y + .035, block.z - 5); group.rotation.y = block.rotation * Math.PI / 2;
  group.userData.cell = { x: block.x, z: block.z }; return compactScenery(THREE, group, resources, `part-${block.type}`);
}

function cottageMesh(THREE, theme, resources) {
  const cottage = new THREE.Group();
  const wood = resources.get('wood', () => resources.material('plank', '#fff2d6'));
  const darkWood = resources.material('plank', theme.id === 'moonwood' ? '#818795' : '#987851');
  const roof = resources.material('shingle', theme.id === 'moonwood' ? '#7e9ec8' : theme.id === 'dino' ? '#cdbc8b' : '#ffe7b4');
  const stone = resources.material('stone', '#eee3cf'), window = new THREE.MeshStandardMaterial({ color: '#ffe7ae', emissive: '#d7a84e', emissiveIntensity: .32, roughness: .24 });
  const geometry = (...sizes) => resources.get(`cottage-box:${sizes.join(':')}`, () => new RoundedBoxGeometry(...sizes, 1, Math.min(...sizes) * .16));
  const add = (sizes, material, x, y, z) => { const object = new THREE.Mesh(geometry(...sizes), material); object.position.set(x, y, z); object.castShadow = object.receiveShadow = true; cottage.add(object); return object; };
  add([1.08, .25, 1.06], stone, 0, .125, 0); add([.94, 1.1, .94], wood, 0, .77, 0);
  for (const x of [-.48, .48]) for (const z of [-.48, .48]) add([.13, 1.24, .13], darkWood, x, .8, z);
  for (const side of [-1, 1]) { const slope = add([.83, .14, 1.32], roof, side * .28, 1.54, 0); slope.rotation.z = -side * .68; }
  add([.13, .14, 1.38], darkWood, 0, 1.83, 0);
  add([.2, .57, .22], stone, -.3, 1.87, -.2); add([.26, .09, .28], stone, -.3, 2.18, -.2);
  add([.4, .86, .045], darkWood, -.13, .65, .493);
  for (const x of [-.35, .1]) add([.065, .97, .09], wood, x, .67, .52);
  add([.53, .09, .1], wood, -.13, 1.13, .52); add([.54, .07, .24], stone, -.13, .29, .62);
  for (const z of [-.17, .2]) {
    add([.04, .36, .29], window, .496, .83, z); add([.07, .41, .055], darkWood, .52, .83, z - .17); add([.07, .41, .055], darkWood, .52, .83, z + .17);
    add([.07, .055, .4], darkWood, .52, .62, z); add([.07, .055, .4], darkWood, .52, 1.04, z); add([.065, .035, .34], wood, .535, .83, z); add([.065, .37, .03], wood, .535, .83, z);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.032, 8, 6), new THREE.MeshStandardMaterial({ color: '#987344', metalness: .4, roughness: .4 })); knob.position.set(.005, .64, .55); cottage.add(knob);
  return compactScenery(THREE, cottage, resources, 'cottage');
}

function compactScenery(THREE, group, resources, kind) {
  const byMaterial = new Map(), retained = [];
  for (const mesh of group.children) {
    if (!mesh.isMesh || mesh.userData.keepDynamicMaterial) { retained.push(mesh); continue; }
    if (!byMaterial.has(mesh.material)) byMaterial.set(mesh.material, []); byMaterial.get(mesh.material).push(mesh);
  }
  const compact = [];
  for (const [material, meshes] of byMaterial) {
    const geometry = resources.get(`merged:${kind}:${material.uuid}`, () => {
      const parts = meshes.map(mesh => { mesh.updateMatrix(); return mesh.geometry.clone().applyMatrix4(mesh.matrix); });
      const merged = mergeGeometries(parts, false); for (const part of parts) part.dispose(); return merged;
    });
    if (!geometry) return group;
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true; compact.push(mesh);
  }
  group.clear(); group.add(...compact, ...retained); return group;
}

function BuildWorld({ stateRef, apiRef, diagnosticsRef, revision, fallback, onFallback, reducedMotion }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    if (fallback) return createBurrowCanvasWorld(mount, { state: () => stateRef.current, api: apiRef, diagnostics: diagnosticsRef, reducedMotion, loadArt: loadBurrowArt, foliage: BURROW_FOLIAGE });
    let renderer, scene, camera, THREE, frame, observer, alive = true, worldGroup, actor, actorShadow, preview, rayTargets = [], labels = [], lastWorld = null, lastCue = '', gardenMeshes = [], bedMeshes = [], rain, reduced = reducedMotion, imageBank = new Map();
    const gpuTextures = new Map();
    // Decoded source pixels and their GPU texture have engine lifetime. World
    // rebuilds own geometry/materials, but must not upload the same large atlas
    // again after every accepted unit or construction edit.
    const detachAssetMaps = root => { const owned = new Set(gpuTextures.values()); root?.traverse(node => { for (const material of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) if (owned.has(material.map)) material.map = null; }); };
    let software = false, currentTier = detectQualityTier(), frameBudget = createQuestFrameBudgetState({ high: 'rich', medium: 'balanced', low: 'low' }[currentTier]);
    const ray = { value: null }, pointer = { value: null }, state = () => stateRef.current;
    let billboardNormal, horizon, waterfall, fallingFoam;
    const layers=new Map();
    const renderGate=createArcadeRenderGate();
    let previousBlocks=null, dryBeds=[], flowingWater=new Set(), coveredRain=[];
    const createResources=()=>{
      const sharedResources = new Map();
      const resources = { get(key, factory) { if (!sharedResources.has(key)) sharedResources.set(key, factory()); return sharedResources.get(key); } };
      resources.texture = id => {
        if (gpuTextures.has(id)) return gpuTextures.get(id);
        const image = imageBank.get(id); if (!image) return null;
        const texture = new THREE.Texture(image); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); texture.needsUpdate = true; gpuTextures.set(id, texture); return texture;
      };
      resources.material = (id, color = '#ffffff') => resources.get(`material:${id}:${color}`, () => new THREE.MeshStandardMaterial({ color, map: resources.texture(id), roughness: .92 }));
      return resources;
    };
    const rebuildLayer=(name,world,build)=>{
      const old=layers.get(name);
      if(old){
        const nodes=new Set();old.traverse(node=>nodes.add(node));
        rayTargets=rayTargets.filter(node=>!nodes.has(node));labels=labels.filter(node=>!nodes.has(node));
        worldGroup.remove(old);detachAssetMaps(old);disposeObject(old);
      }
      const group=new THREE.Group();group.name=`burrow-${name}`;layers.set(name,group);worldGroup.add(group);
      build(world,group,createResources(),physicalThemeForDifficulty(state().difficulty));
      diagnosticsRef.current.layerUpdates={...diagnosticsRef.current.layerUpdates,[name]:(diagnosticsRef.current.layerUpdates?.[name]||0)+1};
    };
    const rebuildTerrain=world=>rebuildLayer('terrain',world,(world,worldGroup,resources,theme)=>{
      const transform=new THREE.Object3D(),island=BUILD_ISLANDS.find(item=>item.id===world.islandId);
      const earth = resources.material('soil', theme.id === 'moonwood' ? '#b5b2c7' : '#fff0d1'), grass = resources.material('grass');
      if (grass.map) grass.onBeforeCompile = shader => {
        // Continuous world coordinates prevent one copy of turf per grid cell.
        shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_INSTANCING\nvMapUv=(position.xz+instanceMatrix[3].xz)*.68;\n#endif');
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat lawnLuma=dot(diffuseColor.rgb,vec3(.299,.587,.114));\ndiffuseColor.rgb=mix(vec3(lawnLuma),diffuseColor.rgb,.66)*.88;');
      };
      const cliff = resources.material('stone', theme.id === 'dino' ? '#d3b896' : theme.id === 'moonwood' ? '#8296b3' : '#d9d5cd');
      const water = new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? '#577dad' : theme.id === 'dino' ? '#71bac1' : island.water, metalness: .14, roughness: .3 });
      const terrainCells = [];
      for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) { const terrain = effectiveBurrowTerrain(world, x, z); if (terrain) terrainCells.push({ x, z, ...terrain }); }
      const cubeGeometry = new RoundedBoxGeometry(1, 1, 1, 1, .045), soilBatch = new THREE.InstancedMesh(cubeGeometry, earth, terrainCells.length), cliffBatch = new THREE.InstancedMesh(cubeGeometry, cliff, terrainCells.length);
      const landCells = terrainCells.filter(cell => !cell.water), waterCells = terrainCells.filter(cell => cell.water);
      const landBatch = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), grass, landCells.length), waterBatch = new THREE.InstancedMesh(cubeGeometry, water, waterCells.length);
      soilBatch.userData.cells = terrainCells; landBatch.userData.cells = landCells; waterBatch.userData.cells = waterCells;
      for (const [index, cell] of terrainCells.entries()) {
        const cut = cell.water || cell.dryBed;
        transform.position.set(cell.x - 5, cut ? -1.45 : -.9 + Math.max(0, cell.height) / 2, cell.z - 5);
        transform.scale.set(.999, cut ? 2 : 1.8 + Math.max(0, cell.height), .999); transform.updateMatrix(); soilBatch.setMatrixAt(index, transform.matrix);
        transform.position.set(cell.x - 5, -2.55, cell.z - 5); transform.scale.set(.994, 1.5, .994); transform.updateMatrix(); cliffBatch.setMatrixAt(index, transform.matrix);
      }
      for (const [batch, cells] of [[landBatch, landCells], [waterBatch, waterCells]]) for (const [index, cell] of cells.entries()) {
        transform.position.set(cell.x - 5, cell.height - .02, cell.z - 5); transform.scale.set(1.001, .13, 1.001); transform.updateMatrix(); batch.setMatrixAt(index, transform.matrix);
        if (!cell.water) { const tint = new THREE.Color(cell.dryBed ? '#a9a07e' : theme.id === 'dino' ? '#e0edc6' : theme.id === 'moonwood' ? '#a1bdd0' : '#fff7d9'); tint.offsetHSL(0, 0, ((cell.x * 13 + cell.z * 17) % 5 - 2) * .012); batch.setColorAt(index, tint); }
      }
      for (const batch of [cliffBatch, soilBatch, landBatch, waterBatch]) { batch.receiveShadow = true; worldGroup.add(batch); if (batch !== cliffBatch) rayTargets.push(batch); }
      // Fine broken ripples and bank foam belong to the live derived water,
      // so a placed dam or channel immediately changes their visible footprint.
      const foamGeometry = resources.get('river-foam', () => new THREE.TorusGeometry(.21, .011, 4, 15, Math.PI * 1.35));
      const foamMaterial = resources.get('river-foam-material', () => new THREE.MeshBasicMaterial({ color: '#e6fcff', transparent: true, opacity: .55, depthWrite: false }));
      const foam = new THREE.InstancedMesh(foamGeometry, foamMaterial, waterCells.length * 2);
      for (const [index, cell] of waterCells.entries()) for (let ripple = 0; ripple < 2; ripple++) {
        transform.position.set(cell.x - 5 + (ripple ? .17 : -.2), cell.height + .063, cell.z - 5 + (ripple ? -.26 : .23));
        transform.rotation.set(-Math.PI / 2, 0, (cell.x + cell.z + ripple) * .9); transform.scale.set(1, .62, 1); transform.updateMatrix(); foam.setMatrixAt(index * 2 + ripple, transform.matrix);
      }
      worldGroup.add(foam);
      const paths = landCells.filter(cell => cell.z === 3 && [3, 7].includes(cell.x) && !world.blocks.some(block => block.x === cell.x && block.z === cell.z));
      const path = new THREE.InstancedMesh(resources.get('soil-path', () => new RoundedBoxGeometry(.66, .025, 1.01, 1, .01)), earth, paths.length);
      for (const [index, cell] of paths.entries()) { transform.position.set(cell.x - 5, cell.height + .053, cell.z - 5); transform.rotation.set(0, cell.z === 3 && cell.x > 3 ? Math.PI / 2 : 0, 0); transform.scale.set(1 + ((cell.x + cell.z) % 3) * .05, 1, 1); transform.updateMatrix(); path.setMatrixAt(index, transform.matrix); }
      path.receiveShadow = true; worldGroup.add(path);
      const plantCells = terrainCells.filter(cell => !cell.water && !cell.scenery && (cell.x === 0 || cell.x === 10 || cell.z === 0 || cell.z === 10) && !world.blocks.some(block => block.x === cell.x && block.z === cell.z));
      const leafyShape = new THREE.Shape(); leafyShape.moveTo(0, 0); leafyShape.bezierCurveTo(.08, .09, .11, .28, 0, .42); leafyShape.bezierCurveTo(-.11, .28, -.08, .09, 0, 0);
      const leafGeometry = new THREE.ExtrudeGeometry(leafyShape, { depth: .012, bevelEnabled: false, steps: 1 });
      const leafBatch = new THREE.InstancedMesh(leafGeometry, new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? '#7dbaa7' : '#86bd42', roughness: .92 }), plantCells.length * 8);
      let leafIndex = 0;
      for (const cell of plantCells) for (let leaf = 0; leaf < 8; leaf++) {
        const edge = leaf % 4, offset = ((cell.x * 17 + cell.z * 11 + leaf * 3) % 13) / 13 - .5;
        transform.position.set(cell.x - 5 + (edge < 2 ? (edge ? .46 : -.46) : offset), cell.height + .02, cell.z - 5 + (edge >= 2 ? (edge === 2 ? .46 : -.46) : offset));
        transform.rotation.set(.35 + leaf % 3 * .25, leaf * 2.2 + cell.x, .2); transform.scale.setScalar(.4 + ((cell.x + cell.z + leaf) % 4) * .12); transform.updateMatrix(); leafBatch.setMatrixAt(leafIndex++, transform.matrix);
      }
      leafBatch.castShadow = true; worldGroup.add(leafBatch);
      const flowers = plantCells.filter(cell => (cell.x * 11 + cell.z * 7) % 5 === 0);
      const petals = new THREE.InstancedMesh(new THREE.SphereGeometry(.045, 7, 5), new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? '#c5c2ef' : '#fff7df', roughness: .75 }), flowers.length * 5);
      const hearts = new THREE.InstancedMesh(new THREE.SphereGeometry(.025, 7, 5), new THREE.MeshStandardMaterial({ color: '#f6c055', roughness: .8 }), flowers.length);
      for (const [index, cell] of flowers.entries()) {
        for (let petal = 0; petal < 5; petal++) { const angle = petal * Math.PI * 2 / 5; transform.position.set(cell.x - 4.67 + Math.cos(angle) * .035, cell.height + .14, cell.z - 4.69 + Math.sin(angle) * .035); transform.rotation.set(0, -angle, .15); transform.scale.set(1, .35, .7); transform.updateMatrix(); petals.setMatrixAt(index * 5 + petal, transform.matrix); }
        transform.position.set(cell.x - 4.67, cell.height + .15, cell.z - 4.69); transform.scale.set(1, .65, 1); transform.updateMatrix(); hearts.setMatrixAt(index, transform.matrix);
      }
      worldGroup.add(petals, hearts);
    });
    const rebuildSupplies=world=>rebuildLayer('supplies',world,(world,worldGroup,resources,theme)=>{
      for (const pile of BUILD_SUPPLY_PILES.filter(item => !world.gathered.includes(item.key) && !world.blocks.some(block => block.x === item.x && block.z === item.z))) {
        const stack = partMesh(THREE, { ...pile, y: 0, rotation: 1 }, theme, resources); stack.position.set(pile.x - 5, 0, pile.z - 5); stack.scale.set(.55, .55, .55); stack.userData.supply = true; worldGroup.add(stack);
        stack.traverse(mesh => { if (mesh.isMesh) { mesh.userData.cell = { x: pile.x, z: pile.z }; rayTargets.push(mesh); } });
      }
    });
    const rebuildBlocks=world=>rebuildLayer('blocks',world,(world,worldGroup,resources,theme)=>{
      const transform=new THREE.Object3D();
      gardenMeshes=[];bedMeshes=[];
      // Ordinary blocks share batches, without changing any saved/editable piece.
      // A large sculpture costs a few draw calls rather than one per cube/mark.
      for (const type of ['wood', 'stone']) {
        const blocks = world.blocks.filter(block => block.type === type); if (!blocks.length) continue;
        const geometry = resources.get('box:.92:.94:.92', () => new RoundedBoxGeometry(.92, .94, .92, 1, .07));
        const material = resources.get(type, () => resources.material(type === 'wood' ? 'plank' : 'stone', type === 'wood' ? '#fff2d6' : '#fff9ed'));
        const batch = new THREE.InstancedMesh(geometry, material, blocks.length); batch.userData.cells = blocks; batch.castShadow = true; batch.receiveShadow = true;
        for (const [index, block] of blocks.entries()) { transform.position.set(block.x - 5, block.y + .505, block.z - 5); transform.rotation.set(0, block.rotation * Math.PI / 2, 0); transform.scale.set(1, 1, 1); transform.updateMatrix(); batch.setMatrixAt(index, transform.matrix); }
        worldGroup.add(batch); rayTargets.push(batch);
        if (type === 'stone') {
          const marks = new THREE.InstancedMesh(resources.get('box:.38:.025:.035', () => new THREE.BoxGeometry(.38, .025, .035)), resources.get('stone-mark', () => new THREE.MeshStandardMaterial({ color: '#829399' })), blocks.length * 2);
          marks.userData.cells = blocks.flatMap(block => [block, block]);
          for (const [index, block] of blocks.entries()) for (const [mark, [x, y]] of [[-.25, .25], [.2, .6]].entries()) {
            const angle = block.rotation * Math.PI / 2; transform.position.set(block.x - 5 + x * Math.cos(angle) + .47 * Math.sin(angle), block.y + .035 + y, block.z - 5 + .47 * Math.cos(angle) - x * Math.sin(angle));
            transform.rotation.set(0, angle, 0); transform.updateMatrix(); marks.setMatrixAt(index * 2 + mark, transform.matrix);
          }
          worldGroup.add(marks); rayTargets.push(marks);
        }
      }
      for (const block of world.blocks.filter(block => !['wood', 'stone'].includes(block.type))) {
        const object = partMesh(THREE, block, theme, resources); object.traverse(mesh => { if (mesh.isMesh) { mesh.userData.cell = { x: block.x, z: block.z }; rayTargets.push(mesh); } }); worldGroup.add(object);
        if (block.type === 'garden') gardenMeshes.push({ object, index:world.blocks.indexOf(block), key: `${block.x}:${block.z}:${block.y}` });
        if (block.type === 'bed') bedMeshes.push({ object, block });
      }
    });
    const rebuildRack=world=>rebuildLayer('rack',world,(world,worldGroup,resources,theme)=>{
      // Builder's workbench: the same visible grapheme inventory is reachable
      // through the world and native semantic controls. It isn't a quiz dialog.
      const mission = apiRef.current?.mission?.();
      if (mission && state().phase !== 'creative' && !state().freeBuilding) {
        if (mission.kind === 'spelling') {
          const rack = new THREE.Group();
          mission.choices.forEach((chunk, index) => {
            const brick = new THREE.Mesh(new RoundedBoxGeometry(.62, .54, .4, 1, .04), resources.get('wood', () => createWoodMaterial(THREE, { color: theme.wood }))); brick.position.set(-3.9 + (index % 3) * .7, .84, 3.5 + Math.floor(index / 3) * .7); brick.userData.chunk = chunk;
            const glyph = new THREE.Mesh(new THREE.PlaneGeometry(.51, .44), new THREE.MeshBasicMaterial({ map: createGraphemeTexture(THREE, chunk), transparent: true })); glyph.userData.chunk = chunk;
            glyph.userData.billboardAnchor = brick.position.clone(); glyph.userData.billboardDepth = .37;
            rack.add(brick, glyph); rayTargets.push(brick, glyph); labels.push(glyph);
          });
          const timber = resources.get('wood', () => createWoodMaterial(THREE, { color: theme.wood }));
          const bench = new THREE.Mesh(new RoundedBoxGeometry(2.15, .14, 2.15, 1, .035), timber); bench.position.set(-3.2, .54, 4.2); rack.add(bench);
          for (const x of [-4.1, -2.3]) for (const z of [3.3, 5.1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.13, .5, .13), timber); leg.position.set(x, .25, z); rack.add(leg); }
          const rail = new THREE.Mesh(new THREE.BoxGeometry(2.55, .15, .62), timber); rail.position.set(-3.3, .08, 2.65); rack.add(rail);
          for (let index = 0; index < mission.chunks.length; index++) {
            const chunk = state().chunks[index]; const cube = new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .48), chunk ? resources.get('accepted-wood', () => createWoodMaterial(THREE, { color: '#dfbb78' })) : new THREE.MeshStandardMaterial({ color: '#f0e6bf', transparent: true, opacity: .45 })); cube.position.set(-4.15 + index * .85, .4, 2.65); rack.add(cube);
            if (chunk) { const label = new THREE.Mesh(new THREE.PlaneGeometry(.6, .43), new THREE.MeshBasicMaterial({ map: createGraphemeTexture(THREE, chunk), transparent: true })); label.userData.billboardAnchor = new THREE.Vector3(cube.position.x, .42, cube.position.z); label.userData.billboardDepth = .4; rack.add(label); labels.push(label); }
          }
          worldGroup.add(rack);
        } else {
          for (const [index, cell] of mission.choices.entries()) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(.35, .035, 6, 24), new THREE.MeshBasicMaterial({ color: '#f5e6a8' })); ring.rotation.x = -Math.PI / 2; ring.position.set(cell.x - 5, Math.max(0, terrainAt(cell.x, cell.z)?.height || 0) + .1, cell.z - 5); ring.userData.cell = cell; worldGroup.add(ring); rayTargets.push(ring);
            const marker = new THREE.Mesh(new THREE.PlaneGeometry(.48, .48), new THREE.MeshBasicMaterial({ map: createGraphemeTexture(THREE, String(index + 1)), side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false })); marker.position.set(cell.x - 5, Math.max(0, terrainAt(cell.x, cell.z)?.height || 0) + .45, cell.z - 5); marker.userData.cell = cell; marker.renderOrder = 50; worldGroup.add(marker); rayTargets.push(marker); labels.push(marker);
          }
        }
      }
    });
    const rebuildPreview=world=>rebuildLayer('preview',world,(world,worldGroup,resources,theme)=>{
      if (actor.userData.burrowCarried) { const old = actor.userData.burrowCarried; old.parent?.remove(old); detachAssetMaps(old); disposeObject(old); }
      const gripPool = new Map(), gripResources = { get(key, factory) { if (!gripPool.has(key)) gripPool.set(key, factory()); return gripPool.get(key); } };
      gripResources.material = (id, color = '#ffffff') => gripResources.get(`grip:${id}:${color}`, () => new THREE.MeshStandardMaterial({ color, map: resources.texture(id), roughness: .92 }));
      const carried = partMesh(THREE, { x: 5, z: 5, y: 0, type: world.selectedPart, rotation: 0 }, theme, gripResources); carried.scale.setScalar(.58); carried.position.y = -.27; actor.userData.artHands?.right.add(carried); actor.userData.burrowCarried = carried;
      preview = new THREE.Mesh(new THREE.BoxGeometry(.97, .1, .97), new THREE.MeshBasicMaterial({ color: '#fff4ab', transparent: true, opacity: .48, depthWrite: false })); worldGroup.add(preview);
      const ghost = partMesh(THREE, { x: 5, z: 5, y: 0, type: world.selectedPart, rotation: world.rotation }, theme, resources); ghost.userData.preview = true;
      const solidMaterials = new Set(); worldGroup.traverse(node => { if (node.isMesh) solidMaterials.add(node.material); });
      const ghostMaterials = new Map();
      ghost.traverse(node => { if (node.isMesh) { if (!ghostMaterials.has(node.material)) ghostMaterials.set(node.material, node.material.clone()); node.material = ghostMaterials.get(node.material); node.material.transparent = true; node.material.opacity = .42; node.material.depthWrite = false; node.castShadow = false; } }); preview.add(ghost);
      for (const material of ghostMaterials.keys()) if (!solidMaterials.has(material)) material.dispose();
    });
    const rebuildScenery=world=>rebuildLayer('scenery',world,(world,worldGroup,resources,theme)=>{
      const island=BUILD_ISLANDS.find(item=>item.id===world.islandId);
      scene.background = new THREE.Color(theme.sky); scene.fog = new THREE.Fog(theme.sky, 20, 48);
      const horizonTexture = resources.texture(`${theme.id}-horizon`);
      if (horizonTexture) { horizonTexture.wrapS = horizonTexture.wrapT = THREE.ClampToEdgeWrapping; horizon = new THREE.Mesh(new THREE.PlaneGeometry(19, 9.5), new THREE.MeshBasicMaterial({ map: horizonTexture, transparent: true, depthWrite: false, fog: false, toneMapped: false })); horizon.renderOrder = -5; worldGroup.add(horizon); } else horizon = null;
      // The lower pond is a visible spatial landmark; it never hides walkable cells.
      for (const [x, z] of [[8, 3], [8, 5], [0, 3], [10, 8]]) {
        const foliage = BURROW_FOLIAGE[theme.id], texture = resources.texture(`${theme.id}-foliage`);
        let tree;
        if (foliage && texture) {
          const [left, top, width, height] = foliage.tree; texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.repeat.set(width / foliage.size[0], height / foliage.size[1]); texture.offset.set(left / foliage.size[0], 1 - (top + height) / foliage.size[1]);
          tree = new THREE.Sprite(resources.get('authored-tree', () => new THREE.SpriteMaterial({ map: texture, alphaTest: .04, transparent: true, depthWrite: false, toneMapped: false })));
          const treeHeight = x === 10 ? 2.3 : 3.1; tree.scale.set(treeHeight * width / height, treeHeight, 1); tree.center.set(.5, 0);
        } else tree = createWorldTree(THREE, { world: theme.id, height: 2.3, variant: BUILD_ISLANDS.indexOf(island) });
        tree.position.set(x - 5, terrainAt(x, z, world.islandId)?.height || 0, z - 5); worldGroup.add(tree);
        const shade = new THREE.Mesh(resources.get('tree-contact', () => new THREE.CircleGeometry(.65, 16)), resources.get('tree-contact-material', () => new THREE.MeshBasicMaterial({ color: '#34412d', transparent: true, opacity: .18, depthWrite: false })));
        shade.rotation.x = -Math.PI / 2; shade.position.set(x - 5, (terrainAt(x, z, world.islandId)?.height || 0) + .057, z - 5); worldGroup.add(shade);
      }
      const propMaterial = new THREE.MeshStandardMaterial({ color: theme.accent, roughness: .85 });
      if (theme.id === 'dino') {
        for (const [x, z] of [[7, 1], [9, 7], [1, 8]]) {
          const egg = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 8), new THREE.MeshStandardMaterial({ color: '#f4e2ae', roughness: .88 })); egg.scale.y = 1.28; egg.position.set(x - 5, (terrainAt(x, z)?.height || 0) + .35, z - 5); worldGroup.add(egg);
          for (let spot = 0; spot < 3; spot++) { const speck = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), propMaterial); speck.position.set(egg.position.x + Math.sin(spot * 2.1) * .2, egg.position.y + .1 - spot * .08, egg.position.z + .21); worldGroup.add(speck); }
        }
        const fossil = new THREE.Mesh(new THREE.TorusGeometry(.43, .08, 8, 18, Math.PI * 1.5), new THREE.MeshStandardMaterial({ color: '#e1c79e', roughness: .9 })); fossil.rotation.x = -Math.PI / 2; fossil.position.set(3.1, .07, 1.9); worldGroup.add(fossil);
      } else if (theme.id === 'moonwood') {
        for (const [x, z] of [[1, 8], [9, 7], [7, 1]]) {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.1, .16, .85, 8), new THREE.MeshStandardMaterial({ color: '#d1c4bc' })); trunk.position.set(x - 5, .43, z - 5); worldGroup.add(trunk);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(.46, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), propMaterial); cap.position.set(x - 5, .85, z - 5); worldGroup.add(cap);
          const lantern = new THREE.Mesh(new THREE.BoxGeometry(.18, .25, .18), new THREE.MeshStandardMaterial({ color: '#ffe9a0', emissive: '#eebd60', emissiveIntensity: .6 })); lantern.position.set(x - 5 + .4, .42, z - 5); worldGroup.add(lantern);
        }
        const stars = new THREE.BufferGeometry(), skyPoints = new Float32Array(30 * 3);
        for (let i = 0; i < 30; i++) { skyPoints[i * 3] = Math.sin(i * 11.3) * 12; skyPoints[i * 3 + 1] = 4 + i % 4; skyPoints[i * 3 + 2] = -8 - i % 5; }
        stars.setAttribute('position', new THREE.BufferAttribute(skyPoints, 3)); worldGroup.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: '#e9edff', size: .045, transparent: true, opacity: .85 })));
      }
      // The cozy fixed landmark occupies the same existing collision cell.
      const baseHouse = cottageMesh(THREE, theme, resources); baseHouse.position.set(-4, 0, -3); worldGroup.add(baseHouse);
      const drops = new THREE.BufferGeometry(), points = new Float32Array(22 * 3);
      for (let i = 0; i < 22; i++) { points[i * 3] = Math.sin(i * 9.7) * 4.8; points[i * 3 + 1] = i % 7 * .45 + 1; points[i * 3 + 2] = Math.cos(i * 12.2) * 4.8; }
      drops.setAttribute('position', new THREE.BufferAttribute(points, 3)); rain = new THREE.Points(drops, new THREE.PointsMaterial({ color: '#cee7ef', size: .055, transparent: true, opacity: .55 })); rain.visible = !reduced; worldGroup.add(rain);
      waterfall = new THREE.Mesh(new THREE.PlaneGeometry(.89, 2.7, 4, 12), new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? '#94bde4' : '#a1e4ed', transparent: true, opacity: .72, roughness: .17, metalness: .15, side: THREE.DoubleSide })); waterfall.position.set(0, -1.65, 5.49); worldGroup.add(waterfall);
      const foamThreads = new THREE.BufferGeometry(); foamThreads.setAttribute('position', new THREE.BufferAttribute(new Float32Array(20 * 3), 3));
      fallingFoam = new THREE.LineSegments(foamThreads, new THREE.LineBasicMaterial({ color: '#e1fbff', transparent: true, opacity: .75 })); worldGroup.add(fallingFoam);
    });
    const updateStructure=world=>{
      rebuildTerrain(world);rebuildSupplies(world);rebuildBlocks(world);
      dryBeds=burrowShelteredBeds(world);flowingWater=burrowWaterCells(world);
      coveredRain=Array.from({length:22},(_,i)=>{const x=Math.sin(i*9.7)*4.8,z=Math.cos(i*12.2)*4.8;return world.blocks.some(block=>block.type==='roof'&&Math.abs(block.x-5-x)<.55&&Math.abs(block.z-5-z)<.65);});
    };
    const makeWorld = world => {
      if(worldGroup){worldGroup.remove(actor,actorShadow);scene.remove(worldGroup);detachAssetMaps(worldGroup);disposeObject(worldGroup);}
      worldGroup=new THREE.Group();scene.add(worldGroup);layers.clear();rayTargets=[];labels=[];
      const theme=physicalThemeForDifficulty(state().difficulty);
      rebuildScenery(world);updateStructure(world);rebuildRack(world);
      if (!actor) {
        actor = createPalFigure(THREE, { world: theme.id, scale: mount.clientWidth < 500 && mount.clientHeight >= 460 ? 1.5 : 1.12, artActions: ['tools'] });
        actorShadow = new THREE.Mesh(new THREE.CircleGeometry(.4, 16), new THREE.MeshBasicMaterial({ color: '#493f37', transparent: true, opacity: .22, depthWrite: false })); actorShadow.rotation.x = -Math.PI / 2; actorShadow.scale.y = .7;
      }
      worldGroup.add(actor, actorShadow);
      rebuildPreview(world);
      lastWorld=world;previousBlocks=world.blocks;
      lastCue=`${state().cursor}:${state().chunks.join('|')}:${state().phase}:${state().freeBuilding}`;
    };
    const resize = () => {
      renderGate.invalidate();
      if (!renderer || !camera) return;
      const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight), aspect = width / height;
      const reading = state().difficulty === 'hard' && !state().freeBuilding && state().phase !== 'creative';
      const span = height < 460 && width >= 360 ? 13 : aspect < .9 ? 14.8 / aspect : reading ? 11.6 : height < 200 ? 11.6 : 11.4;
      camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.top = span / 2; camera.bottom = -span / 2;
      if (reading && (width < 500 || height < 460)) camera.setViewOffset(width, height, width < 500 ? 0 : 9, width < 500 ? 20 : 0, width, height); else camera.clearViewOffset(); camera.userData.burrowReading = reading;
      camera.updateProjectionMatrix(); if (actor) actor.scale.setScalar(width < 500 && height >= 460 ? 1.5 : 1.12);
      renderer.setPixelRatio(arcadePixelRatio(QUALITY_TIERS[currentTier].pixelRatioCap, width, height) * (software && width > 650 ? .8 : 1));
      renderer.setSize(width, height);
    };
    const select = event => {
      if (!ray.value || apiRef.current?.isPaused?.()) return;
      const rect = mount.getBoundingClientRect(); pointer.value.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
      ray.value.setFromCamera(pointer.value, camera);
      const intersection = ray.value.intersectObjects(rayTargets)[0], hit = intersection?.object;
      if (hit?.userData.chunk) apiRef.current?.buildChunk(hit.userData.chunk);
      else { const cell = hit?.userData.cell || hit?.userData.cells?.[intersection.instanceId]; if (cell) apiRef.current?.selectCell(cell); }
    };
    loadThree().then(async module => {
      if (!alive) return; THREE = module; imageBank = await loadBurrowArt(state().difficulty); if (!alive) { for (const image of imageBank.values()) if (image) image.src = ''; imageBank.clear(); return; }
      try {
        const tier = QUALITY_TIERS[currentTier];
        renderer = createRenderer(THREE, { pixelRatioCap: tier.pixelRatioCap, toneMappingExposure: 1.15, shadowMap: tier.shadowMap === 'off' ? null : 'pcf' });
        const gl = renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
        software = Boolean(debug && /SwiftShader|llvmpipe|software/i.test(String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))));
        if (software) { currentTier = 'low'; renderer.shadowMap.enabled = false; }
        frameBudget = createQuestFrameBudgetState({ high: 'rich', medium: 'balanced', low: 'low' }[currentTier]);
        renderer.domElement.setAttribute('aria-hidden', 'true'); mount.appendChild(renderer.domElement);
        scene = new THREE.Scene(); camera = new THREE.OrthographicCamera(-7, 7, 7, -7, .1, 80);
        scene.add(new THREE.HemisphereLight('#e8f4ff', '#59683e', 1.1));
        const sun = new THREE.DirectionalLight('#fff1d2', 2.65); sun.position.set(-6, 14, 9); sun.castShadow = tier.shadowMap !== 'off'; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -9; sun.shadow.camera.right = 9; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9; sun.shadow.bias = -.001; sun.shadow.normalBias = .03; scene.add(sun);
        const rim = new THREE.DirectionalLight('#c6e8ff', .8); rim.position.set(8, 6, -8); scene.add(rim);
        ray.value = new THREE.Raycaster(); pointer.value = new THREE.Vector2(); billboardNormal = new THREE.Vector3();
        observer = new ResizeObserver(resize); observer.observe(mount); resize();
        renderer.domElement.addEventListener('pointerup', select);
        renderer.domElement.addEventListener('webglcontextlost', lost);
        makeWorld(state().worlds[state().islandId]);
        let previousFrame = 0,visualTime=0,cameraHeight=null;
        const tick = time => {
          if (!alive) return; frame = requestAnimationFrame(tick);
          const began = performance.now();
          const current=state(),world=current.worlds[current.islandId],paused=Boolean(apiRef.current?.isPaused?.());
          const artRevision=JSON.stringify([actor?.userData.authoredPal?.delivery,actor?.userData.authoredPal?.actionDelivery]);
          if(!renderGate.shouldRender(paused,artRevision)){previousFrame=0;return;}
          if(!paused)visualTime+=previousFrame?Math.min(.1,Math.max(0,(time-previousFrame)/1000)):0;
          const cue=`${current.cursor}:${current.chunks.join('|')}:${current.phase}:${current.freeBuilding}`;
          if(!worldGroup||world.islandId!==lastWorld?.islandId)makeWorld(world);
          else{
            if(world.blocks!==previousBlocks&&burrowStructureChanged(previousBlocks,world.blocks))updateStructure(world);
            else if(world.gathered!==lastWorld?.gathered)rebuildSupplies(world);
            if(cue!==lastCue)rebuildRack(world);
            if(world.selectedPart!==lastWorld?.selectedPart||world.rotation!==lastWorld?.rotation)rebuildPreview(world);
          }
          previousBlocks=world.blocks;lastWorld=world;lastCue=cue;
          for(const garden of gardenMeshes)garden.object.userData.gardenPlants.scale.setScalar(.12+.88*(world.blocks[garden.index]?.growth||0));
          for(const bed of bedMeshes)bed.object.userData.bedBlanket.material.color.set(dryBeds.some(item=>item.x===bed.block.x&&item.z===bed.block.z&&item.y===bed.block.y)?'#efb565':'#79adbc');
          if(rain&&!reduced&&!paused){const positions=rain.geometry.attributes.position;for(let i=0;i<positions.count;i++)positions.setY(i,coveredRain[i]?-2:3.5-((visualTime+i*.3)%2.7));positions.needsUpdate=true;}
          const height = walkingHeight(world, Math.round(world.player.x), Math.round(world.player.z)) ?? 0;
          actor.position.set(world.player.x - 5, height + .12, world.player.z - 5);
          actorShadow.position.set(world.player.x - 5, height + .035, world.player.z - 5); actorShadow.visible = !renderer.shadowMap.enabled;
          actor.rotation.y = actor.userData.authoredPal?.delivery === 'delivered' ? 0 : apiRef.current?.facing?.() || 0;
          const angle = (world.camera % 4) * Math.PI / 2, distance = 12, viewAngle = Math.atan2(11, 12) + angle, facing = apiRef.current?.facing?.() || 0;
          const relative = facing - viewAngle, side = Math.sin(relative), front = Math.cos(relative);
          actor.userData.artDirection = Math.abs(side) > Math.abs(front) ? side > 0 ? 'right' : 'left' : front > 0 ? 'front' : 'back';
          const selectedHeight = walkingHeight(world, world.selection.x, world.selection.z);
          preview.position.set(world.selection.x - 5, Math.max(0, selectedHeight || 0) + .08, world.selection.z - 5);
          preview.material.color.set(selectedHeight === null ? '#d7b9ec' : '#fff4ab');
          const reading = current.difficulty === 'hard' && !current.freeBuilding && current.phase !== 'creative';
          const focusX = reading ? 0 : Math.max(-.5, Math.min(.5, world.player.x - 5)), focusZ = reading ? 0 : Math.max(-.3, Math.min(.3, world.player.z - 5));
          // Keep the builder below the HUD when walking on a tall sculpture.
          const targetHeight = reading || height <= .6 ? 0 : height + .35;
          if(cameraHeight===null||reading)cameraHeight=targetHeight;
          else if(!paused)cameraHeight+=(targetHeight-cameraHeight)*arcadeDampingFactor(previousFrame?Math.min(.1,(time-previousFrame)/1000):0,.12);
          const focusY=cameraHeight;
          camera.position.set(focusX + Math.sin(angle) * distance + Math.cos(angle) * 11, (reading ? 12 : 10) + focusY, focusZ + Math.cos(angle) * distance - Math.sin(angle) * 11);
          if (camera.userData.burrowReading !== reading) resize();
          const lookY = !reading && mount.clientHeight < 460 && mount.clientWidth >= 360 ? 2.8 : mount.clientWidth < 500 ? 1.4 : -.4;
          camera.lookAt(focusX, lookY + focusY, focusZ); camera.getWorldDirection(billboardNormal).negate();
          animatePalFigure(actor, reduced ? 0 : visualTime, !apiRef.current?.isPaused?.() && apiRef.current?.moving?.(), { action: current.phase === 'celebrating' ? 'celebrate' : 'carry' });
          if (actor.userData.authoredPal?.delivery === 'delivered') for (const hand of Object.values(actor.userData.artHands || {})) { hand.position.applyQuaternion(camera.quaternion); hand.quaternion.copy(camera.quaternion); }
          if (horizon) { horizon.quaternion.copy(camera.quaternion); horizon.position.copy(camera.position).addScaledVector(billboardNormal, -35); horizon.position.y += 3.4; }
          if (waterfall) {
            waterfall.visible = flowingWater.has('5:10'); fallingFoam.visible = waterfall.visible;
            if (!apiRef.current?.isPaused?.()) {
              const foamPositions = fallingFoam.geometry.attributes.position;
              for (let i = 0; i < 10; i++) { const y = -.35 - ((reduced ? i * .27 : visualTime / .65 + i * .27) % 2.65), x = Math.sin(i * 2.1) * .34; foamPositions.setXYZ(i * 2, x, y, 5.505); foamPositions.setXYZ(i * 2 + 1, x + .018, y - .17, 5.505); } foamPositions.needsUpdate = true;
            }
          }
          for (const label of labels) { label.quaternion.copy(camera.quaternion); if (label.userData.cell) label.scale.setScalar(Math.max(1, 26 * (camera.top - camera.bottom) / (.48 * mount.clientHeight))); if (label.userData.billboardAnchor) label.position.copy(label.userData.billboardAnchor).addScaledVector(billboardNormal, label.userData.billboardDepth || .56); }
          renderer.render(scene, camera);
          const renderMs = performance.now() - began;
          if (!apiRef.current?.isPaused?.()) {
            const measurements = diagnosticsRef.current;
            measurements.frames++;
            measurements.drawCalls = renderer.info.render.calls; measurements.textures = renderer.info.memory.textures; measurements.geometries = renderer.info.memory.geometries;
            measurements.quality = currentTier; measurements.software = software; measurements.pixelRatio = renderer.getPixelRatio();
            measurements.authoredPal = actor.userData.authoredPal?.delivery || 'unavailable';
            measurements.palActions = actor.userData.authoredPal?.actionDelivery;
            const sprite = actor.userData.authoredPal?.sprite;
            if (sprite?.visible) {
              const point = sprite.getWorldPosition(new THREE.Vector3()).project(camera), unit = mount.clientHeight / (camera.top - camera.bottom), width = sprite.scale.x * actor.scale.x * unit, height = sprite.scale.y * actor.scale.y * unit;
              measurements.palBounds = { x: (point.x + 1) * mount.clientWidth / 2 - sprite.center.x * width, y: (1 - point.y) * mount.clientHeight / 2 - (1 - sprite.center.y) * height, width, height };
            }
            measurements.artAssets = Object.fromEntries([...imageBank].map(([id, image]) => [id, image ? 'delivered' : 'unavailable']));
            measurements.workbenchBricks = labels.filter(label => label.userData.chunk).map(label => { const point = label.position.clone().project(camera); return { chunk: label.userData.chunk, x: (point.x + 1) * mount.clientWidth / 2, y: (1 - point.y) * mount.clientHeight / 2, cursor: current.cursor }; });
            measurements.readingPlaces = reading ? labels.filter(label => label.userData.cell).map((label, index) => {
              const point = label.position.clone().project(camera);
              const diameter = .48 * label.scale.x * mount.clientHeight / (camera.top - camera.bottom);
              return { index: index + 1, cell: { ...label.userData.cell }, x: (point.x + 1) * mount.clientWidth / 2, y: (1 - point.y) * mount.clientHeight / 2, radius: diameter / 2, diameter, fontPx: diameter * 134 / 256, shape: 'square', cursor: current.cursor };
            }) : [];
            measurements.renderMs.push(renderMs);
            if (previousFrame) measurements.frameMs.push(time - previousFrame);
            measurements.renderMs = measurements.renderMs.slice(-180);
            measurements.frameMs = measurements.frameMs.slice(-180);
            if (measurements.frames > 180) {
              measurements.steadyRenderMs.push(renderMs);
              if (previousFrame) measurements.steadyFrameMs.push(time - previousFrame);
              measurements.steadyRenderMs = measurements.steadyRenderMs.slice(-180);
              measurements.steadyFrameMs = measurements.steadyFrameMs.slice(-180);
            }
            const budget = previousFrame && sampleQuestFrameBudget(frameBudget, time - previousFrame);
            if (budget) {
              frameBudget = budget.state;
              if (budget.signal.type === 'quality-change') {
                if (budget.signal.toTier === '2d') {
                  measurements.transition = { ...budget.signal, renderer: 'webgl-to-canvas', actualWorldPieces: world.blocks.length };
                  onFallback(true); return;
                }
                // Retain the complete 3D world at the lowest tier. Actual GPU
                // frame intervals, rather than submission time, choose quality.
                currentTier = budget.signal.toTier === 'rich' ? 'high' : budget.signal.toTier === 'balanced' ? 'medium' : 'low';
                renderer.shadowMap.enabled = false; resize();
              }
            }
          }
          previousFrame = apiRef.current?.isPaused?.() ? 0 : time;
        }; frame = requestAnimationFrame(tick);
      } catch { onFallback(true); }
    });
    function lost() { apiRef.current?.releaseInput?.(); onFallback(true); }
    return () => {
      alive = false; cancelAnimationFrame(frame); observer?.disconnect();
      renderer?.domElement?.removeEventListener('pointerup', select); renderer?.domElement?.removeEventListener('webglcontextlost', lost);
      if (scene) { detachAssetMaps(scene); disposeObject(scene); }
      for (const texture of gpuTextures.values()) texture.dispose(); gpuTextures.clear(); disposeRenderer(renderer, { forceContextLoss: true });
      for (const image of imageBank.values()) if (image) image.src = ''; imageBank.clear();
    };
  }, [fallback, onFallback, reducedMotion, stateRef, apiRef, diagnosticsRef]);
  return <div ref={mountRef} className="burrow-builders__world" data-world-revision={revision} aria-label={fallback ? "Illustrated editable island" : "Editable three-dimensional island"} />;
}

export default function BurrowBuildersGame({ difficulty = 'easy', sessionSeed = 0, journey, startLevel = 0, resumedCheckpoint = false,
  progressScopeKey = 'default', isSoundEnabled = true, onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onResultReady, onSessionStart, onEngineReady, onRequestReplay, onRequestNextLevel }) {
  const journeyIndex = journey?.index || 0;
  const missions = useMemo(() => buildBurrowMissions(difficulty, sessionSeed, journeyIndex), [difficulty, sessionSeed, journeyIndex]);
  const [game, setGame] = useState(() => initialGame(missions, difficulty, sessionSeed, journeyIndex, progressScopeKey, startLevel, resumedCheckpoint));
  const [paused, setPaused] = useState(false), [drawer, setDrawer] = useState(null), [fallback, setFallback] = useState(false), [imageFailed, setImageFailed] = useState(false), [buildView, setBuildView] = useState(false);
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false);
  const stateRef = useRef(game), apiRef = useRef(null), rootRef = useRef(null), pictureRef = useRef(null), callbacks = useRef({}), fallbackRef = useRef(false), soundRef = useRef(isSoundEnabled);
  const diagnosticsRef = useRef({ frames: 0, drawCalls: 0, frameMs: [], renderMs: [], steadyFrameMs: [], steadyRenderMs: [] });
  useEffect(() => { callbacks.current = { onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onResultReady, onSessionStart, onEngineReady, onRequestReplay, onRequestNextLevel }; },
    [onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onResultReady, onSessionStart, onEngineReady, onRequestReplay, onRequestNextLevel]);

  useEffect(() => {
    let state = initialGame(missions, difficulty, sessionSeed, journeyIndex, progressScopeKey, startLevel, resumedCheckpoint), disposed = false, pauseRequested = false, hidden = document.hidden, sound = soundRef.current;
    let moving = false, facing = 0, publishAt = 0, saveTimer, completionSent = state.phase === 'creative', advanceTimer, advanceRemaining = 0, advanceStarted = 0;
    const keys = new Set(), voice = createDrumTrailVoice({ enabled: () => sound });
    let teachingTicket = 0; const requestedSfx = {}, suppressedSfx = {};
    const actionSfx = kind => {
      const reason = disposed ? 'disposed' : isPaused() ? 'paused' : !sound || Howler._muted || Howler.volume() <= 0 ? 'sound-disabled' : teachingTicket ? 'teaching-priority' : '';
      if (reason) { suppressedSfx[reason] = Math.min(999, (suppressedSfx[reason] || 0) + 1); return; }
      const effects = { place: playPopSound, pickup: playTapSound, recovery: playWhoosh, correct: playCorrectChime, retry: playSoftBuzz, kit: playStarChime, complete: playCelebrationFanfare };
      requestedSfx[kind] = Math.min(999, (requestedSfx[kind] || 0) + 1); effects[kind]?.();
    };
    let generation = 0, simulationFrame, simulationLast = 0, growthElapsed = 0, growthSaveElapsed = 0, overhead = false;
    const currentMission = () => missions[state.cursor], world = () => state.worlds[state.islandId];
    const isPaused = () => pauseRequested || hidden;
    const publish = next => { state = next; stateRef.current = next; if (!disposed) setGame({ ...next }); };
    const persist = () => {
      clearTimeout(saveTimer);
      const saved = saveBurrowSession(progressScopeKey, difficulty, {
        version: BURROW_BUILDERS_VERSION, difficulty, seed: sessionSeed, journeyIndex, cursor: state.cursor, phase: state.phase,
        islandId: state.islandId, worlds: state.worlds, chunks: state.chunks, mistakes: state.mistakes, supportReasons: state.supportReasons,
        freeBuilding: Boolean(state.freeBuilding), delivery: state.delivery, score: state.score, evidence: state.evidence,
      });
      if (!saved.localSaved) publish({ ...state, saveError: true, message: 'Your island is still here. Try saving again before leaving.' });
      return saved.localSaved;
    };
    const checkpoint = () => { try { callbacks.current.onCheckpoint?.(state.cursor, missions.length); } catch { publish({ ...state, saveError: true }); } };
    const markSupported = (reason = 'mission-help') => { publish({ ...state, supportReasons: [...new Set([...state.supportReasons, reason])].slice(0, 20) }); persist(); };
    const updateWorld = (value, message) => { publish({ ...state, worlds: { ...state.worlds, [state.islandId]: value }, ...(message ? { message } : {}) }); persist(); };
    const replay = async () => {
      if (disposed || isPaused() || state.phase === 'creative' || state.freeBuilding || currentMission().kind === 'reading') return;
      Howler.ctx?.resume?.().catch(() => {});
      const ticket = ++generation, missionId = currentMission().roundId; teachingTicket = ticket; cancelGameSfx();
      const result = await voice.play(currentMission().audio);
      if (teachingTicket === ticket) teachingTicket = 0;
      if (disposed || ticket !== generation || currentMission().roundId !== missionId) return;
      if (result.status === 'delivered') publish({ ...state, delivery: 'delivered' });
      else if (result.status === 'unavailable') publish({ ...state, delivery: 'unavailable', supportReasons: [...new Set([...state.supportReasons, sound ? 'audio-unavailable' : 'sound-disabled'])] });
      persist();
    };
    const announceResult = () => {
      if (completionSent || state.evidence.completions.length !== missions.length || state.saveError) return;
      completionSent = true;
      const evidence = { ...state.evidence, contentVersion: BURROW_BUILDERS_VERSION, sessionSeed, journeyIndex, practiceOnly: true,
        construct: difficulty === 'hard' ? 'literal-spatial-reading-comprehension' : 'ordered-grapheme-encoding',
        independentFirstCorrect: state.evidence.firstResponses.filter(row => row.independentPractice).length };
      callbacks.current.onComplete?.(3, state.score, state.evidence.completions.length, evidence);
    };
    const advance = () => {
      advanceTimer = null; advanceRemaining = 0;
      if (disposed || isPaused() || state.saveError) return;
      if (state.evidence.completions.length === missions.length) {
        publish({ ...state, phase: 'creative', freeBuilding: true, message: 'All six blueprints built! Free build: every ordinary piece is unlimited.' }); persist(); announceResult(); return;
      }
      const cursor = missions.findIndex(mission => !state.evidence.completions.includes(mission.roundId));
      const nextWorld = difficulty === 'hard' ? { ...world(), selectedPart: missions[cursor].part, camera: 0 } : world();
      publish({ ...state, cursor, phase: 'ready', chunks: [], worlds: { ...state.worlds, [state.islandId]: nextWorld }, mistakes: 0, supportReasons: [], delivery: 'pending', pictureDelivery: 'pending', message: state.freeBuilding ? 'Keep creating. Your next blueprint is kept for you.' : 'A fresh blueprint is ready. Your island stays just as you built it.' });
      setImageFailed(false); persist(); checkpoint(); replay();
    };
    const armAdvance = () => { advanceRemaining ||= 1050; advanceStarted = performance.now(); advanceTimer = setTimeout(advance, advanceRemaining); };
    const response = selected => {
      if (disposed || isPaused() || state.phase !== 'ready' || state.freeBuilding || state.saveError) return;
      const mission = currentMission(), slot = mission.kind === 'spelling' ? state.chunks.length : 0;
      const result = commitBurrowResponse(state.evidence, mission, selected, slot, { delivery: state.delivery, pictureDelivery: state.pictureDelivery,
        supportReasons: state.supportReasons, modelUsed: Boolean(phonicsTargetHint(mission.word, state.mistakes)) });
      if (!result.valid) return;
      if (!result.correct) {
        const selectedText = typeof selected === 'string' ? `The ${selected} block` : 'That place';
        publish({ ...state, mistakes: Math.min(999, state.mistakes + 1), evidence: result.evidence,
          supportReasons: [...new Set([...state.supportReasons, 'contrast-feedback', ...(mission.kind === 'spelling' && state.mistakes + 1 >= 2 ? ['partial-spelling-hint'] : [])])],
          message: mission.kind === 'spelling' ? `${selectedText} does not fit this sound. Hear the word and repair this slot.` : 'That place does not match the instruction. Look at the pond, house or trees and try another place.' });
        persist(); if (mission.kind === 'reading') actionSfx('retry'); replay(); return;
      }
      const chunks = mission.kind === 'spelling' ? [...state.chunks, selected] : [];
      const complete = result.evidence.completions.includes(mission.roundId), nextWorld = complete ? (mission.kind === 'reading'
        ? placeBurrowPart({ ...world(), selection: selected }, { type: mission.part, kit: true }).world : installBurrowKit(world(), mission)) : world();
      publish({ ...state, chunks, evidence: result.evidence, score: state.score + result.awarded, phase: complete ? 'celebrating' : 'ready',
        worlds: { ...state.worlds, [state.islandId]: nextWorld }, message: complete ? 'Blueprint built! Your new piece is part of the island.' : 'That sound fits. Build the next sound.' });
      actionSfx(complete ? result.evidence.completions.length === missions.length ? 'complete' : 'kit' : 'correct');
      const saved = persist(); checkpoint(); callbacks.current.onScoreUpdate?.(state.score); callbacks.current.onProgressUpdate?.(state.evidence.completions.length, missions.length);
      if (complete && saved) armAdvance();
    };
    const chooseMission = cursor => {
      if (isPaused() || state.saveError || !Number.isInteger(cursor) || cursor < 0 || cursor >= missions.length || state.evidence.completions.includes(missions[cursor].roundId)) return;
      // Revisiting an unfinished blueprint never resets incorrect first responses.
      const previous = [...state.evidence.firstResponses, ...state.evidence.assistedRetries].filter(row => row.roundId === missions[cursor].roundId);
      const retried = previous.length > 0, retainedChunks = [];
      if (missions[cursor].kind === 'spelling') for (let slot = 0; slot < missions[cursor].chunks.length; slot++) {
        if (previous.some(row => row.slot === slot && row.correct)) retainedChunks.push(missions[cursor].chunks[slot]); else break;
      }
      clearTimeout(advanceTimer); advanceRemaining = 0; generation++; teachingTicket = 0; voice.cancel(); cancelGameSfx();
      const retainedMistakes = previous.filter(row => !row.correct).length;
      const nextWorld = difficulty === 'hard' ? { ...world(), selectedPart: missions[cursor].part, camera: 0 } : world();
      publish({ ...state, cursor, phase: 'ready', freeBuilding: false, worlds: { ...state.worlds, [state.islandId]: nextWorld }, chunks: retainedChunks, mistakes: retainedMistakes, supportReasons: retried ? ['revisited-blueprint', ...(missions[cursor].kind === 'spelling' && retainedMistakes >= 2 ? ['partial-spelling-hint'] : [])] : [], delivery: 'pending', pictureDelivery: 'pending', message: missions[cursor].kind === 'reading' ? 'Read this plan. Choose the numbered place that fits.' : 'This blueprint is ready. Hear its picture word.' });
      setImageFailed(false); persist(); checkpoint(); replay(); setDrawer(null); rootRef.current?.focus();
    };
    const releaseInput = () => { keys.clear(); moving = false; persist(); };
    const updatePause = () => {
      releaseInput(); setPaused(isPaused());
      if (isPaused()) { cancelGameSfx(); voice.pause(); if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; advanceRemaining = Math.max(1, advanceRemaining - (performance.now() - advanceStarted)); } }
      else { voice.resume(); if (state.phase === 'celebrating' && !state.saveError) armAdvance(); }
    };
    const api = {
      pause() { pauseRequested = true; updatePause(); }, resume() { pauseRequested = false; updatePause(); const playArea = rootRef.current?.closest('.lg-game-player-main') || rootRef.current; if (!playArea?.contains(document.activeElement)) rootRef.current?.focus(); }, markSupported,
      mission: currentMission, isPaused, moving: () => moving, facing: () => facing, releaseInput,
      buildChunk: response,
      selectCell(position) {
        if (isPaused() || state.saveError || !terrainAt(position.x, position.z)) return;
        updateWorld({ ...world(), selection: position }, currentMission().kind === 'reading' && state.phase === 'ready' && !state.freeBuilding ? 'Selected place. Read the plan, then place your piece.' : `Selected cell ${position.x + 1}, ${position.z + 1}. Place or pick up a piece.`);
      },
      selectPart(type) { if (!BUILD_PARTS.includes(type) || isPaused()) return; updateWorld({ ...world(), selectedPart: type }, currentMission().kind === 'reading' && !state.freeBuilding ? 'Read the plan. Choose its numbered place.' : `${PART_NAMES[type]} selected. Choose a cell and place it.`); setDrawer(null); rootRef.current?.focus(); },
      place() {
        if (isPaused() || state.saveError) return;
        if (state.phase === 'ready' && !state.freeBuilding && currentMission().kind === 'reading') {
          if (!currentMission().choices.some(cell => cell.x === world().selection.x && cell.z === world().selection.z)) publish({ ...state, message: 'Choose one of the three numbered places for this blueprint.' });
          else response(world().selection); return;
        }
        const result = placeBurrowPart(world(), { free: state.phase === 'creative' || state.freeBuilding }); if (result.changed) actionSfx('place'); updateWorld(result.world, result.changed ? result.gateOpened !== undefined ? `Gate ${result.gateOpened ? 'opened' : 'closed'}.` : world().selectedPart === 'dam' ? 'Dam built. It stops the shallow water.' : world().selectedPart === 'channel' ? 'Channel dug. Connect it to the stream to bring water here.' : `${PART_NAMES[world().selectedPart]} placed. You can change it any time.` : result.reason);
      },
      pickup() { if (isPaused() || state.saveError) return; const result = pickupBurrowPart(world()); if (result.changed) actionSfx('pickup'); updateWorld(result.world, result.changed ? result.gathered ? 'Supplies gathered. Keep building!' : 'Piece picked up. Its materials are back.' : result.reason); },
      undo() { if (!isPaused() && !state.saveError && world().undo.length) { actionSfx('recovery'); updateWorld(undoBurrowEdit(world()), 'Last edit undone. Your blueprint progress is safe.'); } },
      rotate() { if (!isPaused()) updateWorld({ ...world(), rotation: (world().rotation + 1) % 4 }, 'Piece turned one quarter.'); },
      camera() { if (!isPaused() && !(difficulty === 'hard' && state.phase !== 'creative' && !state.freeBuilding)) updateWorld({ ...world(), camera: (world().camera + 1) % 4 }, 'Island view turned.'); },
      freeBuild() {
        if (isPaused() || state.saveError || state.phase === 'creative') return;
        releaseInput(); generation++; teachingTicket = 0; voice.cancel(); cancelGameSfx();
        const freeBuilding = !state.freeBuilding, nextWorld = !freeBuilding && difficulty === 'hard' ? { ...world(), camera: 0, selectedPart: currentMission().part } : world();
        publish({ ...state, freeBuilding, worlds: { ...state.worlds, [state.islandId]: nextWorld }, message: freeBuilding ? 'Place a piece. Your blueprint is kept.' : currentMission().kind === 'reading' ? 'Your plan is kept. Read it and choose a numbered place.' : 'Your blueprint is kept. Carry on from the next sound.' });
        persist(); if (!freeBuilding) replay(); rootRef.current?.focus();
      },
      island(id) {
        if (!BUILD_ISLANDS.some(item => item.id === id) || isPaused()) return;
        releaseInput();
        const nextWorld = difficulty === 'hard' && state.phase !== 'creative' && !state.freeBuilding ? { ...state.worlds[id], selectedPart: currentMission().part, camera: 0 } : state.worlds[id];
        publish({ ...state, islandId: id, worlds: { ...state.worlds, [id]: nextWorld }, message: 'Your other island is ready. Every build is kept.' });
        persist(); setDrawer(null); rootRef.current?.focus();
      },
      press(key) { if (isPaused()) return; keys.add(key); api.step(.08); }, release(key) { keys.delete(key); moving = Boolean(keys.size); persist(); },
      step(dt) {
        if (isPaused() || state.saveError) { moving = false; return; }
        growthElapsed += dt; growthSaveElapsed += dt;
        if (growthElapsed >= .5) {
          const grown = growBurrowGardens(world(), growthElapsed); growthElapsed = 0;
          if (grown !== world()) publish({ ...state, worlds: { ...state.worlds, [state.islandId]: grown } });
          if (growthSaveElapsed >= 2) { growthSaveElapsed = 0; persist(); }
        }
        let dx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), dz = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
        moving = Boolean(dx || dz); if (!moving) return;
        if (!overhead) { const angle = world().camera * Math.PI / 2, oldX = dx; dx = oldX * Math.cos(angle) + dz * Math.sin(angle); dz = dz * Math.cos(angle) - oldX * Math.sin(angle); }
        facing = Math.atan2(dx, dz); const distance = 2.8 * dt / Math.max(1, Math.hypot(dx, dz));
        let next = moveBurrowPlayer(world(), dx * distance, dz * distance);
        if (next === world()) next = moveBurrowPlayer(world(), dx * distance, 0);
        const updated = { ...state, worlds: { ...state.worlds, [state.islandId]: next } }; state = updated; stateRef.current = updated;
        if (performance.now() - publishAt > 80) { publish(updated); publishAt = performance.now(); }
        if (!saveTimer) saveTimer = setTimeout(() => { saveTimer = null; persist(); }, 900);
      }, tick: dt => api.step(dt), replay, chooseMission,
      accessibleView(value) { overhead = Boolean(value); releaseInput(); },
      pictureDelivered() { if (state.phase === 'ready') publish({ ...state, pictureDelivery: 'delivered' }); },
      pictureUnavailable() { if (state.phase === 'ready') { publish({ ...state, pictureDelivery: 'unavailable' }); markSupported('picture-unavailable'); } },
      hint() { if (state.mistakes >= 2) markSupported('partial-spelling-hint'); },
      soundEnabled(value) { sound = value; if (!sound) { teachingTicket = 0; cancelGameSfx(); } if (currentMission().kind === 'reading') { generation++; voice.cancel(); return; } if (!sound) { generation++; voice.cancel(); publish({ ...state, delivery: 'unavailable' }); markSupported('sound-disabled'); } else replay(); },
      retrySave() { publish({ ...state, saveError: false }); if (persist()) { checkpoint(); if (state.phase === 'celebrating') armAdvance(); if (state.phase === 'creative') announceResult(); } },
      inspect() {
        const measured = diagnosticsRef.current;
        const mean = values => values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
        const p95 = values => values.length ? [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * .95)] : 0;
        return structuredClone({ gameId: 'burrow-builders', phase: state.phase, seed: sessionSeed, cursor: state.cursor, paused: isPaused(), score: state.score,
        actionAudio: { requested: { ...requestedSfx }, suppressed: { ...suppressedSfx }, teachingBusy: Boolean(teachingTicket) },
        evidence: state.evidence, choices: currentMission().choices, chunks: state.chunks, mistakes: state.mistakes, supportReasons: state.supportReasons,
        delivery: state.delivery, pictureDelivery: state.pictureDelivery, islandId: state.islandId, freeBuilding: Boolean(state.freeBuilding), world: world(),
        theme: physicalThemeForDifficulty(difficulty).id, hero: physicalThemeForDifficulty(difficulty).hero, characterId: physicalThemeForDifficulty(difficulty).characterId,
        rendering: { layerUpdates: measured.layerUpdates, frames: measured.frames, drawCalls: measured.drawCalls, textures: measured.textures || 0, geometries: measured.geometries || 0,
          quality: measured.quality, renderer: measured.renderer || 'webgl', software: Boolean(measured.software), pixelRatio: measured.pixelRatio,
          transition: measured.transition, priorGl: measured.priorGl, canvasDraws: measured.canvasDraws, projectedObjects: measured.projectedObjects, cachedDepthBanks: measured.cachedDepthBanks, decodedImages: measured.decodedImages, cachedLayers: measured.cachedLayers, cacheRebuilds: measured.cacheRebuilds, assetLoads: measured.assetLoads,
          authoredPal: measured.authoredPal, palActions: measured.palActions, palBounds: measured.palBounds, artAssets: measured.artAssets,
          readingPlaces: measured.readingPlaces?.map(place => ({ ...place, cell: { ...place.cell } })),
          workbenchBricks: measured.workbenchBricks,
          meanFrameMs: mean(measured.frameMs), p95FrameMs: p95(measured.frameMs), meanRenderMs: mean(measured.renderMs), p95RenderMs: p95(measured.renderMs),
          steadyState: { warmupFrames: 180, samples: measured.steadyFrameMs.length, meanFrameMs: mean(measured.steadyFrameMs), p95FrameMs: p95(measured.steadyFrameMs), meanRenderMs: mean(measured.steadyRenderMs), p95RenderMs: p95(measured.steadyRenderMs) } },
        shelteredBeds: burrowShelteredBeds(world()).length, wetCells: burrowWaterCells(world()).size, saveError: state.saveError, fallback: fallbackRef.current }); },
    };
    api.debugSnapshot = api.inspect;
    apiRef.current = api; publish(state);
    let simulationRemainder = 0;
    const simulate = time => {
      if (disposed) return;
      const elapsed = simulationLast ? Math.min(.15, Math.max(0, (time - simulationLast) / 1000)) : 0; simulationLast = time;
      if (isPaused()) simulationRemainder = 0;
      else {
        simulationRemainder = Math.min(.15, simulationRemainder + elapsed);
        let steps = 0;
        while (simulationRemainder >= 1 / 60 && steps++ < 9) { api.tick(1 / 60); simulationRemainder -= 1 / 60; }
      }
      simulationFrame = requestAnimationFrame(simulate);
    };
    simulationFrame = requestAnimationFrame(simulate);
    const keyMap = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
    const keyDown = event => {
      const dialog = event.target?.closest('[role="dialog"]');
      if (disposed || isPaused() || event.target?.closest('input,select,textarea') || (dialog && !dialog.contains(rootRef.current))) return;
      const direction = keyMap[event.key];
      if (direction) { event.preventDefault(); if (!keys.has(direction)) api.press(direction); return; }
      if (event.target?.closest('button')) return;
      if (event.key === 'e' || event.key === 'E' || event.code === 'Space') { event.preventDefault(); if (!event.repeat) api.place(); }
      if (event.key === 'Backspace') { event.preventDefault(); if (!event.repeat) api.pickup(); }
      if (event.key === 'q' || event.key === 'Q') { event.preventDefault(); if (!event.repeat) api.rotate(); }
    };
    const keyUp = event => { if (keyMap[event.key]) api.release(keyMap[event.key]); };
    const visibility = () => { hidden = document.hidden; updatePause(); };
    const blur = () => releaseInput();
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    callbacks.current.onEngineReady?.(api); callbacks.current.onSessionStart?.(); checkpoint();
    callbacks.current.onProgressUpdate?.(state.evidence.completions.length, missions.length); callbacks.current.onScoreUpdate?.(state.score);
    rootRef.current?.focus(); if (state.phase === 'celebrating') armAdvance(); else if (state.phase !== 'creative') replay();
    return () => { disposed = true; generation++; cancelAnimationFrame(simulationFrame); clearTimeout(advanceTimer); clearTimeout(saveTimer); persist(); keys.clear(); voice.dispose();
      window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility);
      cancelGameSfx(); teachingTicket = 0; if (apiRef.current === api) apiRef.current = null; };
  }, [missions, difficulty, sessionSeed, journeyIndex, progressScopeKey, startLevel, resumedCheckpoint]);

  useEffect(() => { soundRef.current = isSoundEnabled; apiRef.current?.soundEnabled(isSoundEnabled); }, [isSoundEnabled]);
  useEffect(() => { apiRef.current?.accessibleView(buildView); }, [buildView, fallback]);
  const mission = missions[game.cursor], world = game.worlds[game.islandId], creative = game.phase === 'creative' || game.freeBuilding;
  const theme = physicalThemeForDifficulty(difficulty);
  const hint = phonicsTargetHint(mission.word, game.mistakes), isReading = mission.kind === 'reading';
  useEffect(() => {
    if (creative || isReading) return;
    if (imageFailed || !mission.image) apiRef.current?.pictureUnavailable();
    else if (pictureRef.current?.complete && pictureRef.current.naturalWidth > 0) apiRef.current?.pictureDelivered();
  }, [creative, isReading, imageFailed, mission.image, game.cursor, game.phase]);
  const onFallback = useMemo(() => value => { fallbackRef.current = value; setFallback(value); setBuildView(false); }, []);

  return <div ref={rootRef} className={`burrow-builders ${creative ? 'burrow-builders--creative' : ''}`} tabIndex={-1} aria-label="Burrow Builders playfield" data-game-phase={game.phase} data-world-theme={theme.id} data-character-id={theme.characterId} data-spelling-rack={!creative && !isReading} data-reading-plan={!creative && isReading}>
    <header className="burrow-builders__hud" data-picture-prompt={!creative && !isReading}>
      {!creative && !isReading && <div className="burrow-builders__picture">
        {imageFailed || !mission.image ? <span>Picture unavailable<br />Tap Hear</span> : <img ref={pictureRef} src={mission.image} alt="Building picture. Hear its word." onLoad={() => apiRef.current?.pictureDelivered()} onError={() => setImageFailed(true)} />}
      </div>}
      <div className="burrow-builders__cue">
        <strong>{creative ? 'Free build' : isReading ? mission.instruction : <><span className="burrow-builders__full-cue">Listen. Pick each sound.</span><span className="burrow-builders__compact-cue">Pick each sound.</span></>}</strong>
        {!creative && !isReading && <div className="burrow-builders__slots" aria-label="Blueprint sound slots">{mission.chunks.map((_, index) => <span key={index} aria-label={`Sound slot ${index + 1}${game.chunks[index] ? `: ${game.chunks[index]}` : ': empty'}`}>{game.chunks[index] || '·'}</span>)}</div>}
        <small>{creative ? 'Place a piece. Make it yours.' : `${game.evidence.completions.length} of ${missions.length} kits built`}</small>
      </div>
      <div className="burrow-builders__audio">
        {!creative && !isReading && <button type="button" onClick={() => apiRef.current?.replay()} aria-label="Hear the building word again"><SpeakerHigh size={26} /><span>Hear</span></button>}
      </div>
    </header>
    <div className="burrow-builders__utility">
        <button type="button" onClick={() => { apiRef.current?.releaseInput(); setDrawer('islands'); }} aria-label="Choose island or blueprint"><Tree size={25} /><span>Islands</span></button>
        <button type="button" onClick={() => { apiRef.current?.releaseInput(); setBuildView(value => !value); }} aria-label={buildView ? 'Return to world view' : 'Open overhead accessible build view'} aria-pressed={buildView}><GridFour size={24} /></button>
        {game.phase === 'creative' ? <button type="button" disabled={paused || game.saveError} onClick={() => setDrawer('islands')} aria-label="Choose another building outing"><ArrowCounterClockwise size={23} /><span>New trail</span></button> : <button type="button" onClick={() => apiRef.current?.freeBuild()} aria-pressed={Boolean(game.freeBuilding)} aria-label={game.freeBuilding ? 'Return to current blueprint' : 'Enter free building now'}><Cube size={23} /><span>{game.freeBuilding ? 'Blueprint' : 'Free build'}</span></button>}
    </div>
    <div className="burrow-builders__scene">
      <BuildWorld stateRef={stateRef} apiRef={apiRef} diagnosticsRef={diagnosticsRef} revision={game.score + world.blocks.length} fallback={fallback} onFallback={onFallback} reducedMotion={reducedMotion} />
      {buildView && <section className="burrow-builders__map" aria-label="Overhead accessible build view">
        <p>Overhead map. Top is behind; left and right follow this map.</p>
        <div className="burrow-builders__grid" role="group" aria-label="Island construction cells">
          {Array.from({ length: 121 }, (_, index) => { const x = index % 11, z = Math.floor(index / 11), terrain = effectiveBurrowTerrain(world, x, z), placed = world.blocks.filter(block => block.x === x && block.z === z), top = placed.at(-1);
            return terrain ? <button type="button" key={index} className={`${terrain.water ? 'water' : 'land'} ${world.selection.x === x && world.selection.z === z ? 'selected' : ''}`}
              aria-label={`Cell ${x + 1}, ${z + 1}, ${terrain.scenery ? 'house or tree' : top ? PART_NAMES[top.type] : terrain.water ? 'stream' : terrain.dryBed ? 'dry channel' : 'grass'}${Math.round(world.player.x) === x && Math.round(world.player.z) === z ? `, ${theme.hero} here` : ''}`}
              onClick={() => apiRef.current?.selectCell({ x, z })}>{Math.round(world.player.x) === x && Math.round(world.player.z) === z ? '●' : top ? iconForPart[top.type] : terrain.water ? '≈' : '·'}</button> : <span key={index} />; })}
        </div>
        <div className="burrow-builders__cell-picker"><label>Cell column <select value={world.selection.x} onChange={event => apiRef.current?.selectCell({ x: Number(event.target.value), z: world.selection.z })}>{Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label>
          <label>Cell row <select value={world.selection.z} onChange={event => apiRef.current?.selectCell({ x: world.selection.x, z: Number(event.target.value) })}>{Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label></div>
      </section>}
      {!creative && <div className="burrow-builders__rack" role="group" aria-label={isReading ? 'Instruction building places' : 'Workbench grapheme blocks'}>
        {isReading ? mission.choices.map((cell, index) => <button key={`${cell.x}:${cell.z}`} type="button" onClick={() => { apiRef.current?.selectCell(cell); apiRef.current?.place(); }} aria-label={`Build at place ${index + 1}, column ${cell.x + 1}, row ${cell.z + 1}`}><span>{index + 1}</span><small>{cell.x + 1},{cell.z + 1}</small></button>) : mission.choices.map(chunk => <button key={chunk} type="button" disabled={game.phase === 'celebrating' || game.saveError || paused} onClick={() => apiRef.current?.buildChunk(chunk)} aria-label={`Place ${chunk} block on the blueprint`}>{chunk}</button>)}
      </div>}
      {hint && !creative && !isReading && <button type="button" className="burrow-builders__hint" onClick={() => apiRef.current?.hint()} aria-label="Partial spelling help">Help: {hint}</button>}
      {isReading && !creative && <span className="burrow-builders__compass">Overhead map: ↑ behind · ← left</span>}
      <p className="burrow-builders__message" role="status" hidden={!game.message}>{game.message}</p>
    </div>
    <footer className="burrow-builders__controls">
      <div className="burrow-builders__move" role="group" aria-label={`Move ${theme.hero}`}>
        <MoveButton direction="left" label="Walk left" Icon={ArrowLeft} apiRef={apiRef} />
        <MoveButton direction="up" label="Walk up" Icon={ArrowUp} apiRef={apiRef} />
        <MoveButton direction="down" label="Walk down" Icon={ArrowDown} apiRef={apiRef} />
        <MoveButton direction="right" label="Walk right" Icon={ArrowRight} apiRef={apiRef} />
      </div>
      <div className="burrow-builders__tools" role="group" aria-label="Construction tools">
        <button type="button" onClick={() => { apiRef.current?.releaseInput(); setDrawer('parts'); }} aria-label="Choose building piece"><Cube size={24} /><span>Pieces</span></button>
      </div>
      <div className="burrow-builders__actions" role="group" aria-label="Place and pick up">
        <button type="button" className="burrow-builders__place" onClick={() => apiRef.current?.place()} disabled={game.saveError || paused} aria-label={isReading && !creative ? 'Build instruction piece at selected place' : 'Place selected building piece'}><Hammer size={28} /><span>Place</span></button>
        <button type="button" onClick={() => apiRef.current?.pickup()} disabled={game.saveError || paused} aria-label="Pick up selected piece or nearby supplies"><Hand size={28} /><span>Pick up</span></button>
      </div>
    </footer>
    {drawer && <section className="burrow-builders__drawer" role="dialog" aria-label={drawer === 'parts' ? 'Building pieces' : 'Islands and blueprints'}>
      <button className="burrow-builders__close" type="button" onClick={() => { setDrawer(null); rootRef.current?.focus(); }} aria-label="Close building choices"><X size={25} /></button>
      {drawer === 'parts' ? <><h2>Choose a piece</h2><p>{creative ? 'Ordinary blocks are unlimited. Keep creating.' : `${world.materials.wood} wood · ${world.materials.stone} stone. Pick up a supply pile for more.`}</p><div className="burrow-builders__part-list">{BUILD_PARTS.map(type => <button key={type} type="button" aria-label={PART_NAMES[type]} aria-pressed={world.selectedPart === type} onClick={() => apiRef.current?.selectPart(type)}><b aria-hidden="true">{iconForPart[type]}</b>{PART_NAMES[type]}</button>)}</div><div className="burrow-builders__drawer-tools"><button type="button" onClick={() => apiRef.current?.rotate()} aria-label="Turn carried piece"><ArrowsClockwise size={24} /> Rotate</button><button type="button" disabled={!world.undo.length} onClick={() => apiRef.current?.undo()} aria-label="Undo this edit"><ArrowCounterClockwise size={24} /> Undo</button><button type="button" disabled={isReading && !creative} onClick={() => apiRef.current?.camera()} aria-label="Turn camera view"><GridFour size={24} /> View</button></div></> : <><h2>Choose an island</h2><div className="burrow-builders__island-list">{BUILD_ISLANDS.map(island => <button key={island.id} type="button" aria-pressed={game.islandId === island.id} onClick={() => apiRef.current?.island(island.id)}>{islandName(difficulty, island.id)}<small>{game.worlds[island.id].blocks.length} placed pieces</small></button>)}</div>{game.phase === 'creative' && <div className="burrow-builders__drawer-tools"><button type="button" disabled={paused || game.saveError} onClick={() => callbacks.current.onRequestNextLevel?.()} aria-label="Start the next building outing">Next trail</button><button type="button" disabled={paused || game.saveError} onClick={() => callbacks.current.onRequestReplay?.()} aria-label="Replay building blueprints with fresh choices">Fresh blueprints</button></div>}<h3>Choose any blueprint</h3><div className="burrow-builders__blueprints">{missions.map((item, index) => <button key={item.roundId} type="button" disabled={game.evidence.completions.includes(item.roundId)} onClick={() => apiRef.current?.chooseMission(index)}>{item.image ? <img src={item.image} alt="Blueprint picture" /> : <span>{PART_NAMES[item.part]}</span>}<small>{game.evidence.completions.includes(item.roundId) ? 'Built ✓' : `Blueprint ${index + 1}`}</small></button>)}</div></>}
    </section>}
    {game.saveError && <div className="burrow-builders__save-error" role="alert"><p>Your build is still here. Saving needs another try.</p><button type="button" onClick={() => apiRef.current?.retrySave()}>Try saving again</button></div>}
    {paused && <div className="burrow-builders__paused" aria-live="polite">Your island is resting.</div>}
  </div>;
}
