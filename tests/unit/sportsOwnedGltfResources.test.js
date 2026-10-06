import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {disposeOwnedSportsGltf,disposeOwnedSportsPrimaryGroup,disposeOwnedSportsTexture,disposeOwnedSportsWordGates} from '../../src/components/learn/games/games/sportsOwnedGltfResources.js';

test('independent parsed sports GLTF closes shared embedded bitmap storage once, including non-base maps, without taking the renderer environment',()=>{
  const root=new THREE.Group(),calls={bitmap:0,geometry:0,material:0,texture:0,skeleton:0,environment:0};
  const bitmap={close:()=>calls.bitmap++},map=new THREE.Texture(bitmap),roughnessMap=new THREE.Texture(bitmap);
  const environment=new THREE.Texture({close:()=>calls.environment++});
  const geometry=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial({map,roughnessMap,envMap:environment});
  geometry.addEventListener('dispose',()=>calls.geometry++);material.addEventListener('dispose',()=>calls.material++);
  for(const texture of [map,roughnessMap])texture.addEventListener('dispose',()=>calls.texture++);
  const skeleton={dispose:()=>calls.skeleton++};
  for(let i=0;i<2;i++){const mesh=new THREE.Mesh(geometry,material);mesh.skeleton=skeleton;root.add(mesh);}
  disposeOwnedSportsGltf(root);disposeOwnedSportsGltf(root);
  assert.deepEqual(calls,{bitmap:1,geometry:1,material:1,texture:2,skeleton:1,environment:0});
  assert.equal(root.children.length,0);
  assert.equal(map.source.data,null);assert.equal(roughnessMap.source.data,null);assert.ok(environment.source.data);
});

test('primary-only group release drops reachable Canvas and HTML-image storage while leaving separate answer owners and reusable generations intact',()=>{
  const group=new THREE.Group(),canvas={width:512,height:512,getContext(){}},image={src:'/original.png',removeAttribute(key){assert.equal(key,'src');this.src=null;}};
  const texture=new THREE.Texture(canvas),other=new THREE.Texture(image),answer=new THREE.Texture({width:512,height:256});
  group.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({map:texture})),new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({map:other})));
  const released=disposeOwnedSportsPrimaryGroup(group);assert.equal(released.canvases,1);assert.equal(released.imageElements,1);assert.equal(canvas.width,1);assert.equal(image.src,null);assert.equal(texture.source.data,null);assert.equal(other.source.data,null);assert.ok(answer.source.data,'Canvas word gates are independent owners outside the primary tree');
  assert.equal(disposeOwnedSportsPrimaryGroup(group).images,0);
  let closes=0;group.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({map:new THREE.Texture({close(){closes++;}})})));
  disposeOwnedSportsPrimaryGroup(group);assert.equal(closes,1,'A later real circuit may reuse the now-empty group without suppressing its new owner release');
});

test('a late independently parsed tree still releases its actual skin and embedded bitmap without attaching to a disposed game',()=>{
  const root=new THREE.Group();let closes=0;
  root.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({map:new THREE.Texture({close:()=>closes++})})));
  disposeOwnedSportsGltf(root);
  assert.equal(closes,1);assert.equal(root.parent,null);assert.equal(root.children.length,0);
});

test('an original image arriving after its independent primary texture owner has retired is released rather than resurrected',()=>{
  let closes=0;const texture=new THREE.Texture();disposeOwnedSportsTexture(texture);
  texture.source.data={close(){closes++;}};disposeOwnedSportsTexture(texture);disposeOwnedSportsTexture(texture);
  assert.equal(closes,1);assert.equal(texture.source.data,null);
});

test('a final word-gate generation releases all unique labels and retained mesh aliases while a live Sprite keeps its shared engine quad',()=>{
  const root=new THREE.Group(),gates=[],labels=[],liveCanvas={width:512,height:256,getContext(){}},liveTexture=new THREE.CanvasTexture(liveCanvas);
  const live=new THREE.Sprite(new THREE.SpriteMaterial({map:liveTexture}));let quadDisposals=0;
  const onQuadDispose=()=>quadDisposals++;live.geometry.addEventListener('dispose',onQuadDispose);
  for(let index=0;index<26;index++){
    const canvas={width:512,height:256,getContext(){}},map=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map}));
    const group=new THREE.Group();group.add(sprite);group.userData.sprite=sprite;root.add(group);gates.push({word:String(index),mesh:group});labels.push({canvas,map,group});
  }
  const retainedGeneration=gates.slice(),receipt=disposeOwnedSportsWordGates(root,gates);
  assert.equal(receipt.canvases,26);assert.equal(receipt.images,26);assert.equal(gates.length,0);assert.equal(root.children.length,0);
  for(const {canvas,map,group} of labels){assert.deepEqual([canvas.width,canvas.height],[1,1]);assert.equal(map.source.data,null);assert.equal(group.userData.sprite,undefined);}
  assert.ok(retainedGeneration.every(gate=>gate.mesh===null),'A retained controller alias cannot keep an old label mesh tree alive');
  assert.equal(quadDisposals,0);assert.equal(liveTexture.source.data,liveCanvas);assert.deepEqual([liveCanvas.width,liveCanvas.height],[512,256]);
  assert.equal(disposeOwnedSportsWordGates(root,gates).images,0);
  const nextCanvas={width:512,height:256,getContext(){}},nextMap=new THREE.CanvasTexture(nextCanvas),nextGroup=new THREE.Group();
  const nextSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:nextMap}));nextGroup.add(nextSprite);nextGroup.userData.sprite=nextSprite;root.add(nextGroup);gates.push({mesh:nextGroup});
  assert.equal(disposeOwnedSportsWordGates(root,gates).canvases,1,'Reset or restored gates are a new owner generation of the reusable group');
  assert.equal(nextMap.source.data,null);assert.equal(quadDisposals,0);assert.equal(liveTexture.source.data,liveCanvas);
  live.geometry.removeEventListener('dispose',onQuadDispose);
});

test('final park sky, sign and contact-shadow Canvas owners close without taking independent recovery surfaces',()=>{
  const root=new THREE.Group(),shadow=new THREE.Group(),canvases=[],textures=[],recovery={width:1024,height:2560,getContext(){}};
  for(const [width,height]of [[1024,512],[640,192],[640,192]]){
    const canvas={width,height,getContext(){}},map=new THREE.CanvasTexture(canvas);canvases.push(canvas);textures.push(map);root.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));
  }
  const shadowCanvas={width:64,height:64,getContext(){}},shadowMap=new THREE.CanvasTexture(shadowCanvas);shadow.add(new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial({map:shadowMap})));
  const recoveryMap=new THREE.CanvasTexture(recovery);
  assert.equal(disposeOwnedSportsPrimaryGroup(root).canvases,3);assert.equal(disposeOwnedSportsPrimaryGroup(shadow).canvases,1);
  for(const canvas of [...canvases,shadowCanvas])assert.deepEqual([canvas.width,canvas.height],[1,1]);
  for(const texture of [...textures,shadowMap])assert.equal(texture.source.data,null);
  assert.equal(root.children.length,0);assert.equal(shadow.children.length,0);assert.equal(disposeOwnedSportsPrimaryGroup(root).images,0);
  assert.equal(recoveryMap.source.data,recovery);assert.deepEqual([recovery.width,recovery.height],[1024,2560]);
});
