import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {MOON_FOG_ASSET,MOON_FOG_PRESENTATION,decodeMoonFog,moonFogSpriteRegistration,moonFogCanvasFrame,drawMoonFogCanvas,createMoonFogSourceOwner,createMoonFogPrimaryOwner} from '../../src/components/learn/games/games/moonFogAsset.js';
import {disposeOwnedSportsWordGates} from '../../src/components/learn/games/games/sportsOwnedGltfResources.js';

const metadataBytes=fs.readFileSync(new URL('../../public'+MOON_FOG_ASSET.metadata,import.meta.url));
const metadata=JSON.parse(metadataBytes);
const imageBytes=fs.readFileSync(new URL('../../public'+MOON_FOG_ASSET.runtime,import.meta.url));
const bitmap=()=>({width:512,height:256,closed:0,close(){this.closed++;}});
const delivered=(image=bitmap())=>({image,metadata,close(){image.close();}});
const hazard=()=>{const group=new THREE.Group();group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.5,1),new THREE.MeshBasicMaterial()));return group;};

test('original fog delivery fingerprints and centre registration project to the same billboard bounds at real gate scales',()=>{
 assert.equal(crypto.createHash('sha256').update(metadataBytes).digest('hex'),MOON_FOG_ASSET.metadataSha256);
 assert.equal(crypto.createHash('sha256').update(imageBytes).digest('hex'),MOON_FOG_ASSET.runtimeSha256);
 assert.equal(imageBytes.length,metadata.runtimeBytes);
 const registration=moonFogSpriteRegistration(metadata);
 assert.ok(registration);assert.ok(Math.abs(registration.width-3.4)<1e-6);assert.ok(Math.abs(registration.height-1.7)<1e-6);
 for(const scale of [.55,.91,1.27]){
  const point={x:330,y:220,depth:12},frame=moonFogCanvasFrame({point,scale,viewportHeight:900,fov:60,metadata});
  const metresToPixels=900/(2*Math.tan(Math.PI/6)*12),[x,y,w,h]=frame.destination;
  assert.ok(Math.abs(w-registration.width*scale*MOON_FOG_PRESENTATION.scale*metresToPixels)<1e-10);
  assert.ok(Math.abs(h-registration.height*scale*MOON_FOG_PRESENTATION.scale*metresToPixels)<1e-10);
  assert.ok(Math.abs(x+w*registration.centre[0]-point.x)<1e-10);
  assert.ok(Math.abs(y+h*(1-registration.centre[1])-point.y)<1e-10);
  assert.deepEqual(frame.registeredScreenCentre,[point.x,point.y]);
 }
 assert.equal(moonFogSpriteRegistration({...metadata,pixelsPerUnit:100}),null);
 assert.equal(moonFogSpriteRegistration({...metadata,registeredCentreWorld:[0,1,0]}),null);
 assert.equal(moonFogCanvasFrame({point:{depth:-1},scale:1,viewportHeight:900,fov:60,metadata}),null);
});

test('the brighter fog keeps one image and an identical hazard anchor in both renderers, restoring caller paint state even on failure',async()=>{
 const image=bitmap(),owner=createMoonFogPrimaryOwner({decode:async()=>delivered(image)}),group=hazard();
 group.position.set(3.15,.78,-56);group.scale.setScalar(.91);const beforePosition=group.position.toArray(),beforeScale=group.scale.toArray();
 owner.attach(group);await owner.ready;
 const sprites=group.children.filter(node=>node.isSprite),registration=moonFogSpriteRegistration(metadata);
 assert.equal(sprites.length,2);assert.equal(new Set(sprites.map(node=>node.material.map)).size,1);assert.equal(owner.snapshot().decodedRgbaBytes,524288);
 assert.deepEqual(group.position.toArray(),beforePosition);assert.deepEqual(group.scale.toArray(),beforeScale);
 for(const sprite of sprites){assert.equal(sprite.material.opacity,1);assert.equal(sprite.material.color.r,2.5);assert.deepEqual(sprite.center.toArray(),registration.centre);assert.ok(Math.abs(sprite.scale.x-registration.width*1.12)<1e-12);}
 const frame=moonFogCanvasFrame({point:{x:602,y:423,depth:12},scale:.91,viewportHeight:900,fov:60,metadata});
 const caller={filter:'none',globalAlpha:.37,globalCompositeOperation:'multiply'},calls=[];let saved,fail=false;
 const ctx={...caller,save(){saved={filter:this.filter,globalAlpha:this.globalAlpha,globalCompositeOperation:this.globalCompositeOperation};},restore(){Object.assign(this,saved);},drawImage(...args){calls.push({args,filter:this.filter,alpha:this.globalAlpha,composite:this.globalCompositeOperation});if(fail)throw new Error('lost target');}};
 assert.equal(drawMoonFogCanvas(ctx,image,frame),2);assert.equal(calls.length,2);
 assert.deepEqual(calls[0],calls[1]);assert.deepEqual(calls[0].args,[image,...frame.destination]);assert.equal(calls[0].filter,'brightness(1.5)');assert.equal(calls[0].alpha,1);assert.equal(calls[0].composite,'source-over');
 for(const [key,value] of Object.entries(caller))assert.equal(ctx[key],value);
 fail=true;assert.throws(()=>drawMoonFogCanvas(ctx,image,frame),/lost target/);for(const [key,value] of Object.entries(caller))assert.equal(ctx[key],value);
 owner.dispose();assert.equal(image.closed,1);assert.ok(sprites.every(sprite=>sprite.material.map===null));
});

test('decoder consumes exact retained bytes, rejects substitutions and closes unregistered decoded images',async()=>{
 const originals={fetch:globalThis.fetch,createImageBitmap:globalThis.createImageBitmap};const requested=[],images=[];
 let corrupt=false,wrongSize=false;
 globalThis.fetch=async url=>{
  requested.push(url);let bytes=url===MOON_FOG_ASSET.metadata?metadataBytes:imageBytes;
  if(corrupt&&url===MOON_FOG_ASSET.runtime)bytes=Buffer.from('unregistered replacement');
  return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
 };
 globalThis.createImageBitmap=async()=>{const image=bitmap();if(wrongSize)image.width=256;images.push(image);return image;};
 try{
  const source=await decodeMoonFog({signal:new AbortController().signal});
  assert.deepEqual(requested,[MOON_FOG_ASSET.metadata,MOON_FOG_ASSET.runtime]);assert.equal(source.metadata.sourceSha256,metadata.sourceSha256);
  source.close();source.close();assert.equal(images[0].closed,1);
  corrupt=true;await assert.rejects(()=>decodeMoonFog({signal:new AbortController().signal}),/fingerprint mismatch/);assert.equal(images.length,1,'Substituted bytes never reach image decode');
  corrupt=false;wrongSize=true;await assert.rejects(()=>decodeMoonFog({signal:new AbortController().signal}),/unregistered/);assert.equal(images[1].closed,1);
 }finally{Object.assign(globalThis,originals);}
});

test('retiring one generated gate detaches its map without closing a fog source still owned by another live gate',async()=>{
 const image=bitmap(),owner=createMoonFogPrimaryOwner({decode:async()=>delivered(image)}),first=hazard(),second=hazard(),gateGroup=new THREE.Group(),gates=[];
 const firstSprite=owner.attach(first),secondSprite=owner.attach(second);gateGroup.add(first);gates.push({mesh:first});
 await owner.ready;const texture=secondSprite.material.map;let textureDisposals=0;texture.addEventListener('dispose',()=>textureDisposals++);
 assert.equal(first.children[0].visible,false);assert.equal(second.children[0].visible,false);
 assert.equal(firstSprite.material.map,texture);assert.equal(owner.snapshot().bindings,4);
 owner.detach(gateGroup);disposeOwnedSportsWordGates(gateGroup,gates);
 assert.equal(gates.length,0);assert.equal(owner.snapshot().bindings,2);assert.equal(image.closed,0);assert.equal(textureDisposals,0);
 assert.equal(secondSprite.material.map.image,image);assert.equal(secondSprite.visible,true);
 const receipt=owner.releasePrimary();assert.equal(receipt.textureDisposed,true);assert.equal(receipt.imageClosed,true);assert.equal(receipt.decodedBytesBefore,524288);
 assert.equal(image.closed,1);assert.equal(textureDisposals,1);assert.equal(texture.source.data,null);
 assert.ok(second.children.filter(node=>node.isSprite).every(node=>node.material.map===null&&!node.visible));assert.equal(second.children[0].visible,true,'The same physical fallback remains drawable if independent Canvas fog decode fails');
 owner.dispose();assert.equal(image.closed,1);assert.equal(textureDisposals,1);assert.equal(owner.snapshot().decodedRgbaBytes,0);
 const next=hazard();assert.equal(owner.attach(next),null);assert.ok(next.userData.moonFog,'Later Canvas circuit gates retain authored registration after the primary owner is gone');
 assert.equal(next.children.length,1);assert.equal(next.children[0].visible,true);
 disposeOwnedSportsWordGates(new THREE.Group().add(second,next),[{mesh:second},{mesh:next}]);assert.equal(image.closed,1);
});

test('late parse, repeated disposal and unavailable source retain explicit state without reviving texture or hiding a hazard',async()=>{
 let resolve;const image=bitmap(),owner=createMoonFogPrimaryOwner({decode:()=>new Promise(done=>resolve=done)}),group=hazard();
 const sprite=owner.attach(group);assert.equal(sprite.visible,false);assert.equal(group.children[0].visible,true);
 owner.releasePrimary();resolve(delivered(image));assert.equal(await owner.ready,false);
 owner.dispose();assert.equal(image.closed,1);assert.equal(owner.snapshot().lateDeliveriesClosed,1);assert.equal(owner.snapshot().texture,false);assert.equal(owner.snapshot().bindings,0);
 const failed=createMoonFogPrimaryOwner({decode:async()=>{throw new Error('offline');}}),fallback=hazard();failed.attach(fallback);assert.equal(await failed.ready,false);
 assert.equal(failed.snapshot().delivery,'unavailable');assert.equal(fallback.children[0].visible,true);assert.equal(fallback.children[1].visible,false);failed.dispose();
});

test('independently decoded Canvas source remains live after Three retirement and closes only its final owner',async()=>{
 const primaryImage=bitmap(),canvasImage=bitmap();
 const primary=createMoonFogPrimaryOwner({decode:async()=>delivered(primaryImage)}),canvas=createMoonFogSourceOwner({decode:async()=>delivered(canvasImage)});
 await Promise.all([primary.ready,canvas.ready]);assert.notEqual(primaryImage,canvas.frame().image);
 assert.equal(primary.snapshot().decodedRgbaBytes+canvas.snapshot().decodedRgbaBytes,1048576);
 primary.releasePrimary();assert.equal(primaryImage.closed,1);assert.equal(canvasImage.closed,0);assert.equal(canvas.frame().image,canvasImage);
 const canvasReceipt=canvas.dispose();assert.equal(canvasReceipt.decodedBytesBefore,524288);assert.equal(canvasImage.closed,1);assert.equal(canvas.frame(),null);
 canvas.dispose();assert.equal(canvasImage.closed,1);assert.equal(canvas.snapshot().decodedRgbaBytes,0);
});
