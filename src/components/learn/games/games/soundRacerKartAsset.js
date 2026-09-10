import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../shared/threeShell.js';

export const RACER_KART_URL = '/game-assets/sound-racer/models/pip-kart.glb';
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
  root.name = 'CanonicalPipKart';
  root.userData.assetState = 'loading';
  let disposed = false;
  let model = null;
  let mixer = null;
  let active = null;
  let roll = 0;
  let recovery = 0;
  let elapsed = 0;
  let chassis = null;
  const axle = new THREE.Vector3(0, 1, 0);
  const rotation = new THREE.Quaternion();
  const actions = new Map();
  const wheels = [];
  const steeringBones = [];
  const loader = new GLTFLoader();
  const ready = loader.loadAsync(RACER_KART_URL).catch(async () => {
    // This separately loaded recovery payload is the exact same GLB export,
    // including the same driver skin and clips; never a replacement mascot.
    const { RACER_KART_BASE64 } = await import('./soundRacerKartFallback.js');
    const bytes = Uint8Array.from(atob(RACER_KART_BASE64), c => c.charCodeAt(0));
    root.userData.assetRecovery = true;
    return loader.parseAsync(bytes.buffer, '');
  }).then(gltf => {
    if (disposed) { disposeObject(gltf.scene); return false; }
    model = gltf.scene;
    model.name = 'PipAuthoredKart';
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
        if (material.name === 'Paint') material.color.setHex(world === 'moonwood' ? 0x8261c2 : world === 'dino' ? 0xe97635 : 0x1ba18a);
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
    if (state.recovered) recovery = .8;
    recovery = Math.max(0, recovery - dt);
    const name = racerDriverState({ ...state, recoverTime: recovery });
    root.userData.driverState = name;
    if (!mixer) return;
    const next = actions.get(name) || actions.get('drive');
    if (next !== active) {
      next.reset().setEffectiveWeight(1).fadeIn(.12).play();
      active?.fadeOut(.12);
      active = next;
    }
    mixer.update(Math.min(dt, .05));
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
  function dispose() {
    disposed = true;
    mixer?.stopAllAction();
    if (model) {
      mixer?.uncacheRoot(model); root.remove(model);
      const skeletons = new Set();
      model.traverse(node => { if (node.skeleton) skeletons.add(node.skeleton); });
      for (const skeleton of skeletons) skeleton.dispose();
      disposeObject(model);
    }
    actions.clear();
    wheels.length = 0;
    steeringBones.length = 0;
  }
  function snapshot() {
    root.updateMatrixWorld(true);
    const joints = {};
    for (const name of ["head", "chest", "handL", "handR", "rollfrontL", "rollfrontR", "rollrearL", "rollrearR"]) {
      const node = model?.getObjectByName(name);
      if (node) joints[name] = { position: node.getWorldPosition(new THREE.Vector3()).toArray(), quaternion: node.getWorldQuaternion(new THREE.Quaternion()).toArray() };
    }
    return { asset: root.userData.assetState, recoveredAsset: Boolean(root.userData.assetRecovery), clips: [...actions.keys()], wheelCount: wheels.length, state: root.userData.driverState, joints };
  }
  return { root, ready, update, snapshot, dispose };
}
