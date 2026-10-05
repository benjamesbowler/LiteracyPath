import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as THREE from 'three';
import { WORD_CLIMB_SCENERY } from '../../src/components/learn/games/games/wordClimbScenery.generated.js';
import { createWordClimbScenery, wordClimbSceneryLayout, wordClimbSceneryAtCamera } from '../../src/components/learn/games/games/wordClimbScenery.js';

const root=new URL('../../',import.meta.url);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('three original Climb scenery atlases retain whole silhouettes, exact derivatives and truthful local-native/manual boundaries',async()=>{
  const directory='source-art/arcade/physical-worlds/word-climb/';
  const manifest=JSON.parse(await fs.readFile(new URL(directory+'scenery-manifest.json',root),'utf8'));
  assert.equal(manifest.runtimeAcceptance,'LOCAL_NATIVE_PASS');assert.equal(manifest.assets.length,3);
  assert.equal(manifest.humanApproval,'UNKNOWN');assert.equal(manifest.physicalDeviceObservation,'UNKNOWN');
  assert.equal(manifest.reviewedEvidence,'docs/design/WORD_CLIMB_IMPLEMENTATION.md');
  for(const asset of manifest.assets){
    const source=await fs.readFile(new URL(asset.source,root)),runtime=await fs.readFile(new URL('public'+asset.runtime,root));
    assert.equal(hash(source),asset.sourceSha256);assert.equal(hash(runtime),asset.runtimeSha256);
    const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const derived=await sharp(runtime).metadata();assert.deepEqual([info.width,info.height],asset.sourceSize);assert.deepEqual([derived.width,derived.height],asset.runtimeSize);
    assert.equal(hash(await fs.readFile(new URL(directory+asset.prompt,root))),asset.promptSha256);
    assert(asset.maxEdgeAlpha<=1,'Recorded only invisible generator edge residue; no clipped actual artwork');
    assert.equal(asset.frames.length,4);assert.deepEqual(WORD_CLIMB_SCENERY[asset.world].frames,asset.frames);
    for(const frame of asset.frames){const[l,t,r,b]=frame.opaqueBounds;assert(Math.min(l,t,info.width-r,info.height-b)>=15);assert(frame.opaqueArea>10000);
      let actualOpaque=0;for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(data[(y*info.width+x)*4+3]>=100)actualOpaque++;
      assert(actualOpaque>=frame.opaqueArea);assert(actualOpaque<frame.opaqueArea*1.05,'Crop retains its measured whole cutout with no second scenery cluster');
    }
    for(let a=0;a<asset.frames.length;a++)for(let b=a+1;b<asset.frames.length;b++){
      const[x,y,w,h]=asset.frames[a].rect,[xx,yy,ww,hh]=asset.frames[b].rect;assert(!(x<xx+ww&&x+w>xx&&y<yy+hh&&y+h>yy),'Unrelated cutout UV rectangles never overlap');
    }
    for(const input of asset.editInputs){assert.equal(hash(await fs.readFile(new URL(input.source,root))),input.sha256);assert.equal(hash(await fs.readFile(new URL(directory+input.prompt,root))),input.promptSha256);}
  }
});

test('Climb scenery owner retains one decoded texture and four exact UV geometries across resize, with bounded disposal',async()=>{
  const before=globalThis.Image,atlas=WORD_CLIMB_SCENERY.meadow;
  globalThis.Image=class {set src(value){this.url=value;this.naturalWidth=atlas.width;this.naturalHeight=atlas.height;queueMicrotask(()=>this.onload?.());}async decode(){}};
  try{
    const owner=createWordClimbScenery(THREE,'meadow');assert.equal(await owner.ready,true);
    owner.resize({viewWidth:900,viewHeight:350,ascent:3060});
    const mesh=owner.root.children[0].children[0],texture=mesh.material.map,geometry=mesh.geometry;
    const[x,y,w,h]=atlas.frames[0].rect,uv=geometry.attributes.uv;
    assert(Math.abs(uv.getX(0)-x/atlas.width)<1e-6);assert(Math.abs(uv.getY(0)-(1-y/atlas.height))<1e-6);
    assert(Math.abs(uv.getX(3)-(x+w)/atlas.width)<1e-6);assert(Math.abs(uv.getY(3)-(1-(y+h)/atlas.height))<1e-6);
    for(let i=0;i<15;i++)owner.resize({viewWidth:400+i*40,viewHeight:300,ascent:3060});
    assert.equal(mesh.material.map,texture);assert.equal(mesh.geometry,geometry);assert.equal(owner.inspect().textureCount,1);
    assert(owner.inspect().meshCount<20);const originalY=mesh.userData.sceneryBaseY;owner.update(123);assert.equal(owner.root.children[1].position.y,123);
    assert.equal(mesh.position.y,originalY+123*.78,'retained original landscape follows slower background parallax');
    owner.update(0);assert.equal(mesh.position.y,originalY,'the same mesh returns without cumulative camera drift');
    let maps=0,materials=0,geometries=0;texture.addEventListener('dispose',()=>maps++);mesh.material.addEventListener('dispose',()=>materials++);
    const all=new Set();owner.root.traverse(node=>{if(node.geometry)all.add(node.geometry);});all.forEach(value=>value.addEventListener('dispose',()=>geometries++));
    owner.dispose();owner.dispose();assert.equal(maps,1);assert.equal(materials,1);assert.equal(geometries,4);assert.equal(owner.root.children.length,0);
    const recipe=wordClimbSceneryLayout({viewWidth:900,viewHeight:350,ascent:3060});assert.equal(recipe.route.filter(row=>row.role===2).length,2);assert.equal(recipe.frame.length,2);
  }finally{globalThis.Image=before;}
});

test('normal and Canvas scenery use the same bounded layers and parallax without changing route placement',()=>{
  const layout=wordClimbSceneryLayout({viewWidth:900,viewHeight:350,ascent:3060}),before=structuredClone(layout);
  assert.ok(layout.route.filter(row=>row.role===1).length>=9,'authored canopy fills the full ascent');
  const moved=wordClimbSceneryAtCamera(layout.route,500);
  for(let i=0;i<layout.route.length;i++){
    const a=layout.route[i],b=moved[i];assert.equal(b.x,a.x);assert.equal(b.z,a.z);assert.equal(b.width,a.width);
    assert.equal(b.y,a.y+(a.role===0?390:0),'only distant root landscape has camera parallax');
  }
  assert.deepEqual(layout,before);
});
