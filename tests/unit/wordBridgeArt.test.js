import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { WORD_BRIDGE_ATLASES } from '../../src/components/learn/games/games/wordBridgeArt.generated.js';

const manifest=JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/word-bridge/manifest.json','utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

test('all five delivered construction sheets retain original alpha, measured visible contacts and explicit lossy RGB provenance',async()=>{
  assert.equal(manifest.assets.length,5);
  for(const asset of manifest.assets){
    const source=await fs.readFile(asset.source),runtime=await fs.readFile('public'+asset.runtime);
    assert.equal(hash(source),asset.sourceSha256);assert.equal(hash(runtime),asset.runtimeSha256);assert.equal(runtime.length,asset.runtimeBytes);
    const original=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const delivered=await sharp(runtime).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.deepEqual([delivered.info.width,delivered.info.height],asset.sourceSize);
    assert.match(asset.derivative,/quality90\/alphaQuality100/);
    for(let pixel=0;pixel<original.info.width*original.info.height;pixel++)assert.equal(delivered.data[pixel*4+3],original.data[pixel*4+3],asset.id+' source silhouette');
    assert.equal(asset.alphaCoverage.sourceAlphaSha256,asset.alphaCoverage.runtimeAlphaSha256);
    for(const frame of asset.frames)for(const [name,point] of Object.entries(frame.measurement.contactsSource)){
      if(point)assert.ok(delivered.data[(Math.round(point[1])*delivered.info.width+Math.round(point[0]))*4+3]>=160,`${frame.id}: actual delivered ${name}`);
    }
  }
});

test('runtime registration is exactly the retained crop and measured contact contract, including genuine opposite strides',()=>{
  for(const asset of manifest.assets){
    const atlas=WORD_BRIDGE_ATLASES[asset.id];assert(atlas);assert.equal(atlas.runtime,asset.runtime);
    assert.deepEqual([atlas.width,atlas.height],asset.sourceSize);
    for(let index=0;index<asset.frames.length;index++){
      const source=asset.frames[index],frame=atlas.frames[index],[x,y,w,h]=source.rect;
      assert.equal(frame.id,source.id);assert.deepEqual(frame.cell,[x,y,x+w,y+h]);assert.deepEqual(frame.anchor,source.anchor);
      assert.deepEqual(frame.sockets,Object.fromEntries(Object.entries(source.contacts).filter(([,point])=>point).map(([name,point])=>[name,[x+point[0],y+point[1]]])));
    }
  }
  for(const hero of ['bouncy','chompy','pip']){
    const frames=Object.values(WORD_BRIDGE_ATLASES).flatMap(atlas=>atlas.frames).filter(frame=>frame.id.startsWith(hero+'-'));
    for(const action of ['rest','carry-ready','carry-a','carry-b','reach-low','celebrate'])assert.equal(frames.filter(frame=>frame.id===hero+'-'+action).length,1,'one authoritative measured action frame');
  }
});

test('encoded art does not fabricate native, human or physical-device acceptance',()=>{
  assert.equal(manifest.review.runtimeAcceptance,'PENDING');
  assert.equal(manifest.review.humanApproval,'UNKNOWN');assert.equal(manifest.review.physicalDeviceObservation,'UNKNOWN');
  assert.ok(manifest.assets.every(asset=>asset.reviewStatus.includes('native full-action/contact acceptance pending')));
});
