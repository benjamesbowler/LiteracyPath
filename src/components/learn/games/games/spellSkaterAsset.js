import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {disposeOwnedSportsGltf} from './sportsOwnedGltfResources.js';
import { GAME_RECOVERY_URLS, spellSkaterRecoveryUrl, loadGameRecoveryBytes } from '../../../../utils/gameRecoveryAssets.js';
export const SPELL_SKATER_URL = '/game-assets/spell-skate/spell-skater.glb';
export const SPELL_SKATER_URLS = Object.freeze({
  meadow:'/game-assets/spell-skate/models/bouncy-skater-v2.glb',
  dino:'/game-assets/spell-skate/models/chompy-skater-v2.glb',
  moonwood:'/game-assets/spell-skate/models/pip-skater-v2.glb'
});
export const SPELL_SKATER_STATES = ['coast', 'push', 'turn_left', 'turn_right', 'crouch', 'jump', 'land', 'grind', 'stumble', 'recover'];
// Exact source clips are authored at 30Hz; one-shot endpoints round to frames.
const CLIP_SECONDS={coast:1.6,push:1,turn_left:1,turn_right:1,crouch:14/30,jump:20/30,land:13/30,grind:1.2,stumble:16/30,recover:20/30};
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

// Every instance owns its parsed skin, geometry and materials. The compressed
// recovery copy is exported from exactly the same authored GLB, never a proxy.
export function createSpellSkater({world} = {}) {
  const root = new THREE.Group();
  const character = {meadow:'Bouncy',dino:'Chompy',moonwood:'Pip'}[world] || 'Retained skater';
  const source = SPELL_SKATER_URLS[world] || SPELL_SKATER_URL;
  root.name = `${character}SpellSkater`;
  root.userData.assetState = 'loading';
  let disposed = false;
  let primaryReleased=false,primaryRelease=null;
  let mixer = null;
  let model = null;
  let active = null;
  let state = 'coast';
  let poseTime=0,posePhase=0;
  const actions = new Map();
  const loader = new GLTFLoader();
  const ready = loader.loadAsync(source).catch(async () => {
    const recovery = world ? spellSkaterRecoveryUrl(world) : GAME_RECOVERY_URLS.skater;
    if (!recovery) throw new Error(`${character} skater recovery is unavailable`);
    const bytes = await loadGameRecoveryBytes(recovery);
    root.userData.assetRecovery = true;
    return loader.parseAsync(bytes, '');
  }).then(gltf => {
    if (disposed) {
      disposeOwnedSportsGltf(gltf.scene);
      return false;
    }
    root.userData.clipNames=gltf.animations.map(clip=>clip.name);
    root.userData.authoredHeight=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3()).y;
    if(primaryReleased){primaryRelease=disposeOwnedSportsGltf(gltf.scene);root.userData.assetState='ready';return true;}
    model = gltf.scene;
    model.name = `${character}AuthoredSkater`;
    model.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        material.envMapIntensity = .85;
        material.dithering = true;
      }
    });
    root.add(model);
    root.userData.authoredHeight=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y;
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
    const nextState=chooseSkaterState(player, keys);if(nextState!==state)poseTime=0;
    state = nextState;
    root.userData.animationState = state;
    const rate=state==='push'?Math.min(1.8,.7+Math.abs(player.speed)/22):state==='coast'?Math.min(1.5,Math.abs(player.speed)/10):1;
    poseTime+=Math.min(dt,.05)*rate;
    const duration=CLIP_SECONDS[state];posePhase=['land','stumble','recover'].includes(state)?Math.min(.999,poseTime/duration):(poseTime%duration)/duration;
    if (!mixer) return;
    const action = actions.get(state) || actions.get('coast');
    if (action !== active) {
      action.reset().setEffectiveWeight(1).fadeIn(.12).play();
      active?.fadeOut(.12);
      active = action;
    }
    active.setEffectiveTimeScale(state === 'push' ? Math.min(1.8, .7 + Math.abs(player.speed) / 22) : state === 'coast' ? Math.min(1.5, Math.abs(player.speed) / 10) : 1);
    mixer.update(Math.min(dt, .05));
    posePhase=Math.min(.999,active.time/active.getClip().duration);
    // Spin the complete authored rider and board together, independently of
    // physical steering. Every full turn returns to the same landing heading.
    model.rotation.y = player.onGround || player.grind > 0 ? 0 : player.spinAngle || 0;
    model.rotation.z = player.airTricks ? Math.sin(player.spinAngle || 0) * .16 : 0;
  }
  function releasePrimary() {
    if(primaryReleased)return primaryRelease;
    primaryReleased=true;
    mixer?.stopAllAction();
    if (model) {
      mixer?.uncacheRoot(model);
      root.remove(model);
      primaryRelease=disposeOwnedSportsGltf(model);
    }
    model=null;mixer=null;active=null;
    actions.clear();
    return primaryRelease;
  }
  function dispose(){if(disposed)return;disposed=true;releasePrimary();}
  return {
    root,
    ready,
    update,
    snapshot() {
      root.updateMatrixWorld(true);
      const joints={};
      for(const name of ['head','hips','footL','footR','handL','handR']) {
        const node=model?.getObjectByName(name);
        if(node)joints[name]={position:node.getWorldPosition(new THREE.Vector3()).toArray(),quaternion:node.getWorldQuaternion(new THREE.Quaternion()).toArray()};
      }
      return {character,source,asset:root.userData.assetState,recoveredAsset:Boolean(root.userData.assetRecovery),state,posePhase,clips:[...(root.userData.clipNames||[])],liveClipCount:actions.size,primaryReleased,primaryRelease:primaryRelease?{...primaryRelease}:null,height:root.userData.authoredHeight,joints};
    },
    presentationPose:()=>({state,phase:posePhase}),
    releasePrimary,dispose
  };
}
