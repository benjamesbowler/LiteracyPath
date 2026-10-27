import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRacerKart, RACER_DRIVER_CLIPS } from '../../src/components/learn/games/games/soundRacerKartAsset.js';

// Constant keyed channels reproduce the actual export's static wheel/chassis
// samples: PropertyMixer deliberately skips writes when the sample is unchanged.
function rig() {
  const scene = new THREE.Group();
  for (const name of ['chassis','rollfrontL','rollfrontR','rollrearL','rollrearR','steerfrontL','steerfrontR']) {
    const node = new THREE.Bone(); node.name = name; node.position.y=.52; scene.add(node);
  }
  const animations = RACER_DRIVER_CLIPS.map(name => new THREE.AnimationClip(name, 2, scene.children.flatMap(node => [
    new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, [0,2], [0,0,0,1,0,0,0,1]),
    new THREE.VectorKeyframeTrack(`${node.name}.position`, [0,2], [0,.52,0,0,.52,0]),
  ])));
  return {scene, animations};
}
async function withRig(run) {
  const original = GLTFLoader.prototype.loadAsync, parsed=rig();
  GLTFLoader.prototype.loadAsync=async()=>parsed;
  const kart=createRacerKart();
  try { await kart.ready; await run(kart,parsed.scene); }
  finally {kart.dispose();GLTFLoader.prototype.loadAsync=original;}
}
for (const cadence of [[1/60], [.1], [1/120,1/30,1/60,.05]]) test(`held turns stay upright at ${cadence} cadence`, async()=>withRig((kart,scene)=>{
  let elapsed=0,frame=0;
  while(elapsed<15) {
    const dt=cadence[frame++%cadence.length];elapsed+=dt;
    kart.update(dt,{steering:1,speed:10});
    const chassis=scene.getObjectByName('chassis');
    assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(chassis.quaternion).y>.99,`body inverted after ${elapsed}s`);
    assert.ok(Math.abs(chassis.position.y-.52)<=.012001,'suspension cannot accumulate');
    assert.ok(scene.getObjectByName('steerfrontL').quaternion.angleTo(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-.4))<1e-6);
    const expected=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),(-10*elapsed/.37)%(2*Math.PI));
    assert.ok(scene.getObjectByName('rollfrontL').quaternion.angleTo(expected)<1e-5,'wheel angle follows distance once');
  }
  const before=scene.getObjectByName('chassis').quaternion.clone();
  for(let i=0;i<100;i++)kart.update(0,{steering:1,speed:10});
  assert.ok(before.angleTo(scene.getObjectByName('chassis').quaternion)<1e-6,'paused renders do not accumulate lean');
  kart.update(1/60,{steering:0,speed:0,reducedMotion:true});
  assert.ok(scene.getObjectByName('chassis').quaternion.angleTo(new THREE.Quaternion())<1e-6);
}));

test('all delivered GLB rigs remain upright throughout held steering and reversal',async()=>{
  const {readFile}=await import('node:fs/promises');
  const original=GLTFLoader.prototype.loadAsync;
  globalThis.ProgressEvent ??= class {constructor(type,options){Object.assign(this,{type},options);}};
  try {
    for(const [world,character] of [['meadow','bouncy'],['dino','chompy'],['moonwood','pip']]) {
      const bytes=await readFile(`public/game-assets/sound-racer/models/${character}-kart-v2.glb`);
      const jsonLength=bytes.readUInt32LE(12), document=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
      // Keep original mesh/skeleton/animation bytes; image decode is irrelevant
      // to transforms and needs browser APIs unavailable in the unit runner.
      for(const mesh of document.meshes)for(const primitive of mesh.primitives)delete primitive.material;
      delete document.materials;delete document.images;delete document.textures;
      document.buffers[0].uri=`data:application/octet-stream;base64,${bytes.subarray(28+jsonLength).toString('base64')}`;
      GLTFLoader.prototype.loadAsync=()=>new GLTFLoader().parseAsync(JSON.stringify(document),'');
      const kart=createRacerKart({world});await kart.ready;
      try {
        assert.equal(kart.snapshot().asset,'ready');
        for(let frame=0;frame<900;frame++) {
          kart.update(frame%3===0?1/30:1/120,{steering:frame<450?1:-1,speed:12});
          const chassis=kart.root.getObjectByName('chassis');
          const up=new THREE.Vector3(0,1,0).applyQuaternion(chassis.getWorldQuaternion(new THREE.Quaternion()));
          assert.ok(up.y>.97,`${character} rolls over at frame ${frame}: ${up.y}`);
        }
      }finally{kart.dispose();}
    }
  }finally{GLTFLoader.prototype.loadAsync=original;}
});

test('render interpolation fills 120Hz gaps, wraps headings and snaps recovery without changing collision state',async()=>{
 const {interpolateRacerKart,createRacerFixedStepper}=await import('../../src/utils/soundRacerPhysics.js');
 const clock=createRacerFixedStepper();
 let current={x:0,y:0,z:0,heading:0,progress:0,recoveries:0},previous=current;
 const samples=[];
 for(let frame=0;frame<20;frame++) {
  const {steps,remainder}=clock.advance(1/120);
  for(const dt of steps){previous=current;current={...current,x:current.x+12*dt,progress:current.progress+12*dt};}
  const before=JSON.stringify(current);
  samples.push(interpolateRacerKart(previous,current,remainder*60).x);
  assert.equal(JSON.stringify(current),before);
 }
 for(let i=2;i<samples.length;i++)assert.ok(Math.abs(samples[i]-samples[i-1]-.1)<1e-9);
 const seam=interpolateRacerKart({...current,heading:Math.PI-.01},{...current,heading:-Math.PI+.01},.5);
 assert.ok(Math.abs(seam.heading-Math.PI)<1e-8);
 const recovered={...current,x:100,recovered:true};assert.equal(interpolateRacerKart(previous,recovered,.5),recovered);
 clock.reset();previous=current;assert.equal(interpolateRacerKart(previous,current,0).x,current.x);
});
