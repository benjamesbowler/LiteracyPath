import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RACER_WORD_LABEL, sizeRacerWordLabel, racerWordLabelFrame } from '../../src/utils/soundRacerReadability.js';

test('words retain their lane-bounded world size while decorative gates grow', () => {
  const gate = new THREE.Group(), sprite = new THREE.Sprite(); gate.add(sprite);
  for (const growth of [.55,.72,1,1.27]) {
    gate.scale.setScalar(growth); gate.rotation.y = .45;
    sizeRacerWordLabel(sprite,growth); gate.updateMatrixWorld(true);
    const scale = sprite.getWorldScale(new THREE.Vector3());
    assert.ok(Math.abs(scale.x-3.65)<1e-10);assert.ok(Math.abs(scale.y-1.78)<1e-10);
    assert.ok(scale.x*428/512<3.15, 'the actual board stays inside the lane pitch');
    assert.ok(Math.abs(sprite.getWorldPosition(new THREE.Vector3()).y-1.24)<1e-10);
  }
  sprite.material.dispose();
});

test('Canvas rectangle matches the actual camera-facing Three sprite corners on curved roads and resized views', () => {
  for(const [width,height,fov] of [[1280,900,60],[390,844,80],[844,390,60]])for(const growth of [.55,1.27]) {
    const camera=new THREE.PerspectiveCamera(fov,width/height,.1,650);camera.position.set(2,3,5.4);camera.lookAt(-3,1,-12);camera.updateMatrixWorld(true);
    const gate=new THREE.Group(),sprite=new THREE.Sprite();gate.position.set(-3,.9,-20);gate.rotation.y=.8;gate.scale.setScalar(growth);gate.add(sprite);sizeRacerWordLabel(sprite,growth);
    const frame=racerWordLabelFrame(sprite,camera,width,height),centre=sprite.getWorldPosition(new THREE.Vector3());
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
    const topLeft=centre.clone().addScaledVector(right,-RACER_WORD_LABEL.width/2).addScaledVector(up,RACER_WORD_LABEL.height/2).project(camera);
    const bottomRight=centre.clone().addScaledVector(right,RACER_WORD_LABEL.width/2).addScaledVector(up,-RACER_WORD_LABEL.height/2).project(camera);
    assert.ok(Math.abs(frame.x-(topLeft.x+1)*width/2)<1e-8);assert.ok(Math.abs(frame.y-(1-topLeft.y)*height/2)<1e-8);
    assert.ok(Math.abs(frame.width-(bottomRight.x-topLeft.x)*width/2)<1e-8);assert.ok(Math.abs(frame.height-(topLeft.y-bottomRight.y)*height/2)<1e-8);
    assert.ok(frame.textEmHeight>0);sprite.material.dispose();
  }
});

test('distant label grows by the removed artificial .55 factor, while the physical approach still determines size',()=>{
  const camera=new THREE.PerspectiveCamera(60,1280/900,.1,650);camera.position.set(0,3,5.4);camera.lookAt(0,1,-12);camera.updateMatrixWorld(true);
  const gate=new THREE.Group(),sprite=new THREE.Sprite();gate.add(sprite);gate.position.set(0,1,-34);gate.scale.setScalar(.55);sizeRacerWordLabel(sprite,.55);
  const far=racerWordLabelFrame(sprite,camera,1280,900);assert.ok(far.textEmHeight>15);
  gate.position.z=-16;const near=racerWordLabelFrame(sprite,camera,1280,900);assert.ok(near.textEmHeight>far.textEmHeight*1.7);
  gate.position.z=20;assert.equal(racerWordLabelFrame(sprite,camera,1280,900),null);
  assert.equal(racerWordLabelFrame(sprite,camera,0,900),null);sprite.material.dispose();
});
