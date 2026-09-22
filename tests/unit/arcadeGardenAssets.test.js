import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createGardenWorld, gardenWorldPlacements } from '../../src/components/learn/games/shared/arcadeGardenWorlds.js';
import { createArcadeLandscape } from '../../src/components/learn/games/shared/arcadeLandscapeSprites.js';
const read=path=>fs.readFileSync(new URL('../../'+path,import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const parse=bytes=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
// The CPU checks decode geometry/animations. Pixel and GPU rendering is exercised
// in the browser; ImageBitmap is only a texture transport here.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});

test('curated worlds retain complete dependency closures, source hashes and valid bounded models',async()=>{
 const manifest=JSON.parse(read('public/game-assets/arcade-worlds/manifest.json'));
 assert.equal(hash(read(manifest.source)),manifest.sourceSha256);
 assert.equal(hash(read(manifest.authoring)),manifest.authoringSha256);
 for(const item of manifest.inputs)assert.equal(hash(read(item.path)),item.sha256,item.path);
 assert.equal(manifest.models.length,13);
 const bank=new URL('../../public/game-assets/arcade-worlds/',import.meta.url);const files=fs.readdirSync(bank,{recursive:true}).map(name=>new URL(name,bank)).filter(path=>fs.statSync(path).isFile());assert.ok(files.reduce((sum,path)=>sum+fs.statSync(path).size,0)<16*1024*1024,'complete game bank stays within its delivery budget');
 for(const model of manifest.models){
  const bytes=read('public'+model.url);assert.equal(hash(bytes),model.sha256,model.id);assert.equal(bytes.length,model.bytes);assert.ok(bytes.length<6*1024*1024);
  const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  assert.ok([...doc.images||[],...doc.buffers||[]].every(part=>!part.uri),model.id+' must embed all dependencies');
  const gltf=await parse(bytes),bounds=new THREE.Box3().setFromObject(gltf.scene);
  assert.ok(!bounds.isEmpty());assert.ok([...bounds.min,...bounds.max].every(Number.isFinite));
  if(model.sprite)assert.equal(hash(read('public'+model.sprite.url)),model.sprite.sha256);
 }
 for(const texture of manifest.textures)assert.equal(hash(read('public'+texture.url)),texture.sha256);
});

test('rolling stock exports real wheel motion at axle pivots and traceable atlases',async()=>{
 const manifest=JSON.parse(read('public/game-assets/arcade-worlds/trains/manifest.json'));
 assert.equal(hash(read(manifest.source)),manifest.sourceSha256);assert.equal(hash(read(manifest.authoring)),manifest.authoringSha256);
 for(const asset of manifest.assets){
  const bytes=read('public'+asset.url);assert.equal(hash(bytes),asset.glbSha256);assert.equal(hash(read('public'+asset.sprite.url)),asset.sha256);
  const gltf=await parse(bytes);assert.ok(gltf.animations.length,asset.id);const wheel=gltf.scene.children.find(node=>node.name.startsWith('Wheel'));
  assert.ok(wheel);const mixer=new THREE.AnimationMixer(gltf.scene);gltf.animations.forEach(clip=>mixer.clipAction(clip).play());mixer.setTime(0);const before=wheel.quaternion.clone(),position=wheel.position.clone();mixer.setTime(.4);
  assert.ok(before.angleTo(wheel.quaternion)>.03,asset.id+' wheel must rotate');assert.deepEqual(position,wheel.position,'axle stays fixed');mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);
 }
});

test('garden resource ownership survives token removal, low quality, pause and exit',async()=>{
 const original=GLTFLoader.prototype.loadAsync,oldDocument=globalThis.document;
 const sources=[];
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
 GLTFLoader.prototype.loadAsync=async()=>{const scene=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(2,4,2),new THREE.MeshStandardMaterial());scene.add(mesh);sources.push(mesh);return {scene};};
 try{
  const world=createGardenWorld('star-gallery');world.setQuality('low');assert.equal(await world.ready,true);
  for(const placement of gardenWorldPlacements('star-gallery').filter(p=>p.solid)){const batch=world.root.children.find(n=>n.name==='Instanced '+placement.id),matrix=new THREE.Matrix4();let visible=false;for(let i=0;i<batch.count;i++){batch.getMatrixAt(i,matrix);const p=new THREE.Vector3().setFromMatrixPosition(matrix);if(Math.abs(p.x-placement.x)<.001&&Math.abs(p.z-placement.z)<.001)visible=true;}assert.ok(visible,'solid trunk must remain visible at '+placement.x+','+placement.z);}
  const token={group:new THREE.Group(),treeFallback:[]};let disposals=0;sources.forEach(mesh=>mesh.geometry.addEventListener('dispose',()=>disposals++));
  assert.ok(world.attachTree(token));world.detachTree(token);assert.equal(token.group.children.length,0);assert.equal(disposals,0,'removing a token must not free shared tree geometry');
  assert.ok(world.attachTree(token));world.setQuality('high');world.update(.05);const before=world.root.userData.animationTime;world.update(.05,{paused:true});world.update(.05,{reducedMotion:true});assert.equal(world.root.userData.animationTime,before);
  const p=gardenWorldPlacements('star-gallery').find(p=>p.x===-20&&p.z===58);const player={x:p.x,z:p.z,speed:4};world.resolvePosition(player);assert.ok(Math.abs(Math.hypot(player.x-p.x,player.z-p.z)-2.4)<1e-10);
  world.dispose();assert.equal(token.group.children.length,0);assert.equal(disposals,sources.length);
  let resolve;GLTFLoader.prototype.loadAsync=()=>new Promise(done=>{(resolve??=[]).push(done);});const late=createGardenWorld('grammar-grind');late.dispose();
  let released=0;for(const done of resolve){const scene=new THREE.Group(),geometry=new THREE.BoxGeometry();geometry.addEventListener('dispose',()=>released++);scene.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()));done({scene});}
  assert.equal(await late.ready,false);assert.equal(released,resolve.length);
  GLTFLoader.prototype.loadAsync=()=>Promise.reject(new Error('offline'));const failed=createGardenWorld('star-gallery');assert.equal(await failed.ready,false);assert.equal(failed.root.userData.assetState,'fallback');failed.dispose();
 }finally{GLTFLoader.prototype.loadAsync=original;globalThis.document=oldDocument;}
});

test('landscape images tolerate failure and cannot revive a disposed canvas',()=>{
 const pending=[];class Image {constructor(){pending.push(this);}}
 const host={dataset:{}};const scene=createArcadeLandscape('letter-leap',host,{ImageClass:Image});pending[0].onerror();for(const image of pending.slice(1)){image.naturalWidth=32;image.onload();}assert.equal(host.dataset.landscapeState,'fallback');scene.dispose();assert.ok(pending.every(image=>image.src===''&&image.onload===null&&image.onerror===null));
});
