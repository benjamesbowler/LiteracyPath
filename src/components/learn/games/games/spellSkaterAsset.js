import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../shared/threeShell.js';
export const SPELL_SKATER_URL = '/game-assets/spell-skate/spell-skater.glb';
export const SPELL_SKATER_STATES = ['coast', 'push', 'turn_left', 'turn_right', 'crouch', 'jump', 'land', 'grind', 'stumble', 'recover'];
export function chooseSkaterState(player, keys) {
  if (player.stun > 0) return 'stumble';
  if (player.grind > 0) return 'grind';
  if (player.recoverTime > 0) return 'recover';
  if (!player.onGround) return 'jump';
  if (player.landTime > 0) return 'land';
  if (keys.brake) return 'crouch';
  if (keys.left) return 'turn_left';
  if (keys.right) return 'turn_right';
  if (keys.push && Math.abs(player.speed) > .15) return 'push';
  return 'coast';
}

// Every instance owns its parsed skin, geometry and materials. The embedded
// recovery copy is exported from exactly the same authored GLB, never a proxy.
export function createSpellSkater() {
  const root = new THREE.Group();
  root.name = 'SpellSkater';
  root.userData.assetState = 'loading';
  let disposed = false;
  let mixer = null;
  let model = null;
  let active = null;
  let state = 'coast';
  const actions = new Map();
  const loader = new GLTFLoader();
  const ready = loader.loadAsync(SPELL_SKATER_URL).catch(async () => {
    const {
      SPELL_SKATER_BASE64
    } = await import('./spellSkaterFallback.js');
    const bytes = Uint8Array.from(atob(SPELL_SKATER_BASE64), c => c.charCodeAt(0));
    return loader.parseAsync(bytes.buffer, '');
  }).then(gltf => {
    if (disposed) {
      disposeObject(gltf.scene);
      return false;
    }
    model = gltf.scene;
    model.name = 'AuthoredHumanSkater';
    model.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        material.envMapIntensity = .85;
        material.dithering = true;
      }
    });
    root.add(model);
    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip);
      if (['land', 'stumble', 'recover'].includes(clip.name)) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      actions.set(clip.name, action);
    }
    root.userData.assetState = 'ready';
    root.userData.clipNames = [...actions.keys()];
    return true;
  }).catch(error => {
    root.userData.assetState = 'error';
    root.userData.assetError = error.message;
    return false;
  });
  function update(dt, player, keys) {
    state = chooseSkaterState(player, keys);
    root.userData.animationState = state;
    if (!mixer) return;
    const action = actions.get(state) || actions.get('coast');
    if (action !== active) {
      action.reset().setEffectiveWeight(1).fadeIn(.12).play();
      active?.fadeOut(.12);
      active = action;
    }
    active.setEffectiveTimeScale(state === 'push' ? Math.min(1.8, .7 + Math.abs(player.speed) / 22) : state === 'coast' ? Math.min(1.5, Math.abs(player.speed) / 10) : 1);
    mixer.update(Math.min(dt, .05));
  }
  function dispose() {
    disposed = true;
    mixer?.stopAllAction();
    if (model) {
      mixer?.uncacheRoot(model);
      root.remove(model);
      disposeObject(model);
    }
    actions.clear();
  }
  return {
    root,
    ready,
    update,
    dispose
  };
}
