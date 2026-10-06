import * as THREE from 'three';
import {createSportsVenueBatches} from './sportsStaticBatch.js';
import {disposeOwnedSportsGltf,disposeOwnedSportsPrimaryGroup,disposeOwnedSportsTexture} from './sportsOwnedGltfResources.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sampleCircuitPath, offsetCircuitPoint, RACER_ROAD_WIDTH } from '../../../../utils/soundRacerPhysics.js';
import { PHYSICAL_PAL_ART } from '../shared/physicalPalArtData.js';
import { RALLY_PALS_WORLD_ART } from '../../../../utils/rallyPalsRules.js';
import { RACER_SURFACE_METRES, racerHorizonMapFragment } from './racerCanvasWorldArt.js';

const WORLD_CHARACTER = { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' };
const surfaceDelivery = new WeakMap();
const densityForTier = tier => tier === 'low' ? .42 : tier === 'medium' ? .72 : 1;
// Sample across the complete circuit when reducing quality. Removing a prefix
// would leave the last bends entirely bare after a sustained-frame reduction.
export function racerDensityIncludes(index, density) {
  return index === 0 || Math.floor(index * density) > Math.floor((index - 1) * density);
}
export const RACER_AUTHORED_WORLD_URLS = Object.freeze(Object.fromEntries(Object.keys(WORLD_CHARACTER).map(world => [world, {
  venues: `/game-assets/sound-racer/venues/${world}-circuit-venues-v1.glb`,
  horizon: `/game-assets/physical-arcade/rally-pals/${world}-horizon-v1.webp`,
  scenery: `/game-assets/physical-arcade/rally-pals/${world}-scenery-v1.webp`,
  grass: '/game-assets/physical-arcade/burrow-builders/materials/grass-albedo-v1.webp',
  paving: '/game-assets/spell-skate/materials/fine-concrete-albedo-v1.webp',
}])));

// Image files are project-owned originals. Each race owns the actual texture
// transform and GPU resource; a previous map cannot recolour the next one.
export function createRacerSurfaceTexture(kind, world, renderer) {
  const url = RACER_AUTHORED_WORLD_URLS[world]?.[kind];
  let settle;
  const ready = new Promise(resolve => { settle = resolve; });
  const texture = new THREE.TextureLoader().load(url, delivered => {
    delivered.userData.delivery = 'delivered'; settle(true);
  }, undefined, error => {
    texture.userData.delivery = 'unavailable'; texture.userData.deliveryError = String(error); settle(false);
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  const repeats = kind === 'grass' ? 500 / RACER_SURFACE_METRES.grass : 1;
  texture.repeat.set(repeats, repeats);
  texture.userData.originalSource = url;
  texture.userData.delivery = 'pending';
  surfaceDelivery.set(texture, ready);
  return texture;
}
export const racerSurfaceTextureReady = texture => surfaceDelivery.get(texture) || Promise.resolve(false);

const RADII = { clubhouse: 5.1, grandstand: 4.5, bench: 1.9, flowerbed: 1.6, landmark: 4.9 };
export function racerVenuePlacements(track, clearance, terrainHeight, tier = 'high') {
  const count = tier === 'low' ? 38 : tier === 'medium' ? 50 : 64;
  const result = [];
  for (let i = 0; i < count; i++) {
    const distance = (i + .42) * track.totalLength / count;
    const point = sampleCircuitPath(track.path, distance);
    const side = i % 2 ? 1 : -1;
    const name = ['flowerbed','clubhouse','flowerbed','grandstand','bench','flowerbed','landmark','flowerbed','bench','flowerbed','grandstand'][i % 11];
    const radius = RADII[name];
    let offset = side * (RACER_ROAD_WIDTH / 2 + radius + (name === 'flowerbed' || name === 'bench' ? 1.1 : 3.5));
    let p = offsetCircuitPoint(point, offset);
    for (let n = 0; n < 3 && clearance(track.path, p.x, p.z) < RACER_ROAD_WIDTH / 2 + radius + .9; n++) {
      offset += side * 5;
      p = offsetCircuitPoint(point, offset);
    }
    if (clearance(track.path, p.x, p.z) < RACER_ROAD_WIDTH / 2 + radius + .9) continue;
    result.push({ name, x: p.x, z: p.z, y: terrainHeight(track.path, p.x, p.z), heading: -point.heading - side * Math.PI / 2, distance, radius, side });
  }
  return result;
}

export function createRacerAuthoredWorld(track, world, tier, { clearance, terrainHeight }) {
  const root = new THREE.Group(); root.name = `${world}-AuthoredRacingVillage`;
  const venues = new THREE.Group(); venues.name = 'RouteBoundVenueInstances'; root.add(venues);
  const spectators = new THREE.Group(); spectators.name = 'DistantOriginalPalSpectators'; root.add(spectators);
  const foliage=new THREE.Group();foliage.name='OriginalLayeredTreeArt';root.add(foliage);
  let foliageLocations=[],treeInstances=null,cameraView=null,lastTreeAngle=null;
  let disposed = false, template = null, currentTier = tier,venueBatches=null;
  const initialDensity = densityForTier(tier);
  let view = { x: track.path[0].x, z: track.path[0].z };

  const placements = racerVenuePlacements(track, clearance, terrainHeight, tier);
  root.userData = { assetState: 'loading', venueCount: placements.length, world, source: 'sound-racer/venues', failedAssets: [], treeDelivery:'pending' };

  // A continuous far panorama surrounds the complete circuit. These alpha
  // horizons contain only distant scenery; all road/terrain/near architecture
  // and the actor remain real moving 3D objects with contact and parallax.
  const center = new THREE.Box3();
  for (const p of track.path) center.expandByPoint(new THREE.Vector3(p.x, 0, p.z));
  const focus = center.getCenter(new THREE.Vector3());
  const radius = Math.max(190, center.getSize(new THREE.Vector3()).length() + 40);
  let settleHorizon;
  const horizonReady = new Promise(resolve => { settleHorizon = resolve; });
  const horizon = new THREE.TextureLoader().load(RACER_AUTHORED_WORLD_URLS[world].horizon, delivered => {
    if (disposed) { disposeOwnedSportsTexture(delivered); settleHorizon(false); return; }
    root.userData.horizonDelivery = 'delivered'; settleHorizon(true);
  }, undefined, error => {
    root.userData.horizonDelivery = 'unavailable'; root.userData.failedAssets.push(String(error)); settleHorizon(false);
  });
  root.userData.horizonDelivery = 'pending';
  horizon.colorSpace = THREE.SRGBColorSpace;
  const horizonGeo = new THREE.PlaneGeometry(radius * .93, radius * .31);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const horizonMat = new THREE.MeshBasicMaterial({ map: horizon, transparent: true, alphaTest: .04, depthWrite: false, side: THREE.DoubleSide, fog: false });
    horizonMat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',racerHorizonMapFragment(world,i));};
    horizonMat.customProgramCacheKey=()=> `racer-authored-${world}-horizon-panel-${i}-v2`;
    const mesh = new THREE.Mesh(horizonGeo, horizonMat);
    mesh.position.set(focus.x + Math.sin(a) * radius, radius * .10, focus.z + Math.cos(a) * radius);
    mesh.rotation.y = a;
    root.add(mesh);
  }

  const treeReady=new THREE.TextureLoader().loadAsync(RACER_AUTHORED_WORLD_URLS[world].scenery).then(texture=>{
    if(disposed){disposeOwnedSportsTexture(texture);return false;}
    texture.colorSpace=THREE.SRGBColorSpace;
    const data=RALLY_PALS_WORLD_ART[world],[x,y,w,h]=data.frames.tree;
    texture.repeat.set((w-1)/data.width,(h-1)/data.height);
    texture.offset.set((x+.5)/data.width,(data.height-y-h+.5)/data.height);
    const geo=new THREE.PlaneGeometry(w/h,1);geo.translate(0,.5,0);
    const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.16,depthWrite:true,side:THREE.DoubleSide,forceSinglePass:true});
    treeInstances=new THREE.InstancedMesh(geo,mat,Math.max(1,foliageLocations.length));
    treeInstances.name='OriginalAuthoredWorldTrees';foliage.add(treeInstances);
    root.userData.treeDelivery='delivered';update(view,true,cameraView);return true;
  }).catch(error=>{root.userData.treeDelivery='unavailable';root.userData.failedAssets.push(String(error));return false;});
  const venueReady = new GLTFLoader().loadAsync(RACER_AUTHORED_WORLD_URLS[world].venues).then(gltf => {
    if (disposed) { disposeOwnedSportsGltf(gltf.scene); return false; }
    template = gltf.scene;
    template.updateMatrixWorld(true);
    const recipes=[];
    for (const name of Object.keys(RADII)) {
      const source = template.getObjectByName(name);
      const locations = placements.filter(p => p.name === name);
      if (!source || !locations.length) continue;
      source.traverse(mesh => {
        if (!mesh.isMesh) return;
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          material.envMapIntensity = .34;
          for (const key of ['map', 'normalMap', 'roughnessMap']) if (material[key]) material[key].anisotropy = 4;
        }
        locations.forEach((p,index)=>recipes.push({geometry:mesh.geometry,material:mesh.material,location:p,ordinal:index,transform:new THREE.Matrix4().makeTranslation(p.x,p.y,p.z).multiply(new THREE.Matrix4().makeRotationY(p.heading)).multiply(mesh.matrixWorld)}));
      });
    }
    venueBatches=createSportsVenueBatches(recipes);venues.add(venueBatches.root);root.userData.venueBatches=venueBatches.snapshot();
    addSpectators();
    root.userData.assetState = 'ready';
    setTier(currentTier);
    return true;
  }).catch(error => {
    root.userData.assetState = 'unavailable'; root.userData.failedAssets.push(String(error));
    return false;
  });

  function addSpectators() {
    const data = PHYSICAL_PAL_ART[WORLD_CHARACTER[world]];
    const frame = data.frames[0], [x, y, right, bottom] = frame.cell;
    const texture = new THREE.TextureLoader().load(data.runtime,delivered=>{if(disposed)disposeOwnedSportsTexture(delivered);});
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set((right - x - 1) / data.width, (bottom - y - 1) / data.height);
    texture.offset.set((x + .5) / data.width, (data.height - bottom + .5) / data.height);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .15, depthWrite: true, side: THREE.DoubleSide });
    const geometry = new THREE.PlaneGeometry((right - x) / data.pixelsPerUnit * .63, (bottom - y) / data.pixelsPerUnit * .63);
    const matrix = new THREE.Matrix4();
    const stands = placements.filter(p => p.name === 'grandstand');
    const instance = new THREE.InstancedMesh(geometry, material, stands.length * 6);
    instance.name = 'OriginalPlushSpectators';
    let index = 0;
    for (const p of stands) for (let j = 0; j < 6; j++) {
      const local = new THREE.Vector3((j % 3 - 1) * 1.52, 1.20 + Math.floor(j / 3) * .51, .28 + Math.floor(j / 3) * .77);
      local.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.heading).add(new THREE.Vector3(p.x, p.y, p.z));
      matrix.makeTranslation(local.x, local.y, local.z).multiply(new THREE.Matrix4().makeRotationY(p.heading));
      instance.setMatrixAt(index++, matrix);
    }
    instance.instanceMatrix.needsUpdate = true; instance.computeBoundingSphere(); spectators.add(instance);
    root.userData.spectatorCount = index;
  }
  function setTier(next) {
    if(disposed)return;
    currentTier = next;
    venueBatches?.setShadows(next !== 'low');
    update(view, true, cameraView);
    root.userData.qualityTier = next;
  }
  function update(position, force = false, cameraPosition = null) {
    if (disposed || !position) return;
    if(cameraPosition)cameraView={x:cameraPosition.x,z:cameraPosition.z};
    const heading=Math.atan2((cameraView?.x??position.x)-position.x,(cameraView?.z??position.z+1)-position.z);
    if (!force && Math.hypot(position.x - view.x, position.z - view.z) < 2 && Math.abs(heading-(lastTreeAngle??heading))<.025) return;
    lastTreeAngle=heading;
    view = { x: position.x, z: position.z };
    const radius = currentTier === 'low' ? 95 : currentTier === 'medium' ? 130 : 165;
    const density = Math.min(1, densityForTier(currentTier) / initialDensity);
    venueBatches?.setVisible(({location:p,ordinal:index})=>racerDensityIncludes(index,density)&&Math.hypot(p.x-view.x,p.z-view.z)<=radius+p.radius);
    root.userData.activeVenueSurfaces=venueBatches?.snapshot().visibleSurfaces||0;
    if(treeInstances){
      let count=0;const matrix=new THREE.Matrix4();
      for(const [index,p] of foliageLocations.entries()){
        if(!racerDensityIncludes(index,density))continue;
        if(Math.hypot(p.x-view.x,p.z-view.z)>radius+8)continue;
        const yaw=Math.atan2((cameraView?.x??view.x)-p.x,(cameraView?.z??view.z)-p.z);
        matrix.makeTranslation(p.x,p.y,p.z).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeScale(p.height,p.height,p.height));
        treeInstances.setMatrixAt(count++,matrix);
      }
      treeInstances.count=count;treeInstances.instanceMatrix.needsUpdate=true;treeInstances.computeBoundingSphere();
      root.userData.activeAuthoredTrees=count;
    }
  }
  function setFoliagePlacements(locations){foliageLocations=locations.map(p=>({...p}));}
  function dispose() {
    if(disposed)return;
    disposed = true; root.parent?.remove(root);
    venueBatches?.dispose();
    // Geometry/material are owned by the parsed template, exactly once.
    venues.clear();
    const parsed=template?disposeOwnedSportsGltf(template):null;
    const remaining=disposeOwnedSportsPrimaryGroup(root);
    template = null;venueBatches=null;treeInstances=null;
    root.userData.primaryReleased=true;root.userData.primaryRelease={parsed,remaining};
  }
  const ready=Promise.all([venueReady,treeReady,horizonReady]).then(([venuesReady,treesReady,horizonDelivered])=>{
    if(!disposed)root.userData.assetState=venuesReady&&treesReady&&horizonDelivered?'ready':'partial';
    return !disposed;
  });
  return { root, ready, setTier, update, dispose, setFoliagePlacements,canvasScene:()=>({world,urls:{...RACER_AUTHORED_WORLD_URLS[world]},art:structuredClone(RALLY_PALS_WORLD_ART[world]),trees:foliageLocations.map(p=>({...p})),venues:placements.map(p=>({...p}))}) };
}
