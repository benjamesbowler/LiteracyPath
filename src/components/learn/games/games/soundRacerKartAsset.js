import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {disposeOwnedSportsGltf} from './sportsOwnedGltfResources.js';
import { racerKartRecoveryUrl, loadGameRecoveryBytes } from '../../../../utils/gameRecoveryAssets.js';

export const RACER_KART_URL = '/game-assets/sound-racer/models/pip-kart.glb';
export const RACER_KART_URLS = Object.freeze({
  meadow: '/game-assets/sound-racer/models/bouncy-kart-v2.glb',
  dino: '/game-assets/sound-racer/models/chompy-kart-v2.glb',
  moonwood: '/game-assets/sound-racer/models/pip-kart-v2.glb',
});
export const RACER_DRIVER_CLIPS = ['drive', 'turn_left', 'turn_right', 'brake', 'recover', 'celebrate'];

export function racerDriverState({ steering = 0, recovered = false, recoverTime = 0, braking = false, complete = false } = {}) {
  if (recovered || recoverTime > 0) return 'recover';
  if (complete) return 'celebrate';
  if (braking) return 'brake';
  if (steering < -.12) return 'turn_left';
  if (steering > .12) return 'turn_right';
  return 'drive';
}

// Each mounted race owns its parsed skin, mixer and materials. No global GLTF
// cache keeps previous races alive, and a late response cannot revive a teardown.
export function createRacerKart({ world = 'meadow' } = {}) {
  const root = new THREE.Group();
  const character = { meadow: 'Bouncy', dino: 'Chompy', moonwood: 'Pip' }[world] || 'Bouncy';
  root.name = `Canonical${character}Kart`;
  root.userData.assetState = 'loading';
  let disposed = false;
  let primaryReleased=false,primaryRelease=null;
  let model = null;
  let mixer = null;
  let active = null;
  let roll = 0;
  let recovery = 0;
  let elapsed = 0;
  let poseTime=0,poseState='drive',posePhase=0;
  const clipSeconds={drive:2,turn_left:1.2,turn_right:1.2,brake:1,recover:1.2,celebrate:2};
  let chassis = null;
  const axle = new THREE.Vector3(0, 1, 0);
  const rotation = new THREE.Quaternion();
  const actions = new Map();
  const wheels = [];
  const steeringBones = [];
  const loader = new GLTFLoader();
  const ready = loader.loadAsync(RACER_KART_URLS[world] || RACER_KART_URL).catch(async () => {
    // This separately loaded recovery payload is the exact same GLB export,
    // including the same driver skin and clips; never a replacement mascot.
    const bytes = await loadGameRecoveryBytes(racerKartRecoveryUrl(world));
    root.userData.assetRecovery = true;
    return loader.parseAsync(bytes, '');
  }).then(gltf => {
    if (disposed) {disposeOwnedSportsGltf(gltf.scene);return false;}
    root.userData.clips=gltf.animations.map(clip=>clip.name);
    let sourceWheelCount=0;gltf.scene.traverse(node=>{if(node.name.startsWith('roll'))sourceWheelCount++;});root.userData.wheelCount=sourceWheelCount;
    if(primaryReleased){primaryRelease=disposeOwnedSportsGltf(gltf.scene);root.userData.assetState='ready';return true;}
    model = gltf.scene;
    model.name = `${character}AuthoredKart`;
    model.traverse(node => {
      if (node.name === 'chassis') chassis = node;
      if (node.name.startsWith('roll')) wheels.push(node);
      if (node.name.startsWith('steerfront')) steeringBones.push(node);
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false; // Skinned rest bounds must not cull a leaning head.
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        material.envMapIntensity = .7;
        material.dithering = true;
        // Canonical world paint/materials belong to the real authored export;
        // runtime world choice selects geometry and UV art, never a recolour.
      }
    });
    root.add(model);
    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip);
      if (clip.name === 'recover') { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
      actions.set(clip.name, action);
    }
    root.userData.assetState = 'ready';
    root.userData.clips = [...actions.keys()];
    root.userData.wheelCount = wheels.length;
    return true;
  }).catch(error => {
    root.userData.assetState = 'error';
    root.userData.assetError = error.message;
    return false;
  });

  function update(dt, state = {}) {
    // The controller supplies its bounded fixed-step elapsed time. Animation
    // consumes all of that time so a slow render cannot halve a real pose.
    dt = Math.max(0, Math.min(.15, Number(dt) || 0));
    if (state.recovered) recovery = .8;
    recovery = Math.max(0, recovery - dt);
    const name = racerDriverState({ ...state, recoverTime: recovery });
    root.userData.driverState = name;
    if(name!==poseState){poseTime=0;poseState=name;}poseTime+=dt;posePhase=name==='recover'?Math.min(.999,poseTime/clipSeconds[name]):(poseTime%clipSeconds[name])/clipSeconds[name];
    if (!mixer) return;
    const next = actions.get(name) || actions.get('drive');
    if (next !== active) {
      next.reset().setEffectiveWeight(1).fadeIn(.12).play();
      active?.fadeOut(.12);
      active = next;
    }
    mixer.update(dt);
    posePhase=Math.min(.999,active.time/active.getClip().duration);
    elapsed += dt;
    if (chassis && !state.reducedMotion) {
      chassis.position.y += Math.sin(elapsed * 15) * Math.min(.012, Math.abs(state.speed || 0) * .001);
      chassis.quaternion.multiply(rotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -(state.steering || 0) * .035));
    }
    roll = (roll - (state.speed || 0) * dt / .37) % (Math.PI * 2);
    // Roll bones were authored with their local Y along the wheel axle. The
    // parent steering bones have local Y vertical, so axes remain semantic.
    for (const wheel of wheels) wheel.quaternion.multiply(rotation.setFromAxisAngle(axle, roll));
    for (const bone of steeringBones) bone.quaternion.multiply(rotation.setFromAxisAngle(axle, -(state.steering || 0) * .4));
    root.userData.wheelRoll = roll;
    root.userData.steeringAngle = -(state.steering || 0) * .4;
  }
  function releasePrimary() {
    if(primaryReleased)return primaryRelease;
    primaryReleased=true;
    mixer?.stopAllAction();
    if (model) {
      mixer?.uncacheRoot(model); root.remove(model);
      primaryRelease=disposeOwnedSportsGltf(model);
    }
    model=null;mixer=null;active=null;chassis=null;
    actions.clear();
    wheels.length = 0;
    steeringBones.length = 0;
    return primaryRelease;
  }
  function dispose() {
    if(disposed)return;
    disposed = true;releasePrimary();
  }
  function snapshot() {
    root.updateMatrixWorld(true);
    const joints = {};
    for (const name of ["head", "chest", "handL", "handR", "rollfrontL", "rollfrontR", "rollrearL", "rollrearR"]) {
      const node = model?.getObjectByName(name);
      if (node) joints[name] = { position: node.getWorldPosition(new THREE.Vector3()).toArray(), quaternion: node.getWorldQuaternion(new THREE.Quaternion()).toArray() };
    }
    return { asset: root.userData.assetState, source: RACER_KART_URLS[world], character, recoveredAsset: Boolean(root.userData.assetRecovery), clips: [...(root.userData.clips||[])], wheelCount: root.userData.wheelCount||0, liveClipCount:actions.size,liveWheelCount:wheels.length,primaryReleased,primaryRelease:primaryRelease?{...primaryRelease}:null,state: root.userData.driverState,posePhase, joints };
  }
  return { root, ready, update, snapshot,presentationPose:()=>({state:poseState,phase:posePhase}),releasePrimary, dispose };
}
