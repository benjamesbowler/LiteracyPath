import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root=fileURLToPath(new URL('../../',import.meta.url));
const source=resolve(root,'source-art/arcade/physical-worlds/tower-tumble/scene-kit-v1.json');
const manifest=JSON.parse(readFileSync(source,'utf8'));

test('retained Tower scene assets match their original sources and encoded runtime provenance',()=>{
  assert.equal(manifest.tool,'built-in image_gen.imagegen');
  assert.equal(manifest.assets.length,5);
  for(const asset of manifest.assets){
    const original=readFileSync(resolve(root,asset.source)),runtime=readFileSync(resolve(root,'public',asset.runtime.slice(1)));
    assert.equal(createHash('sha256').update(original).digest('hex'),asset.sourceSHA256,asset.id);
    assert.equal(createHash('sha256').update(runtime).digest('hex'),asset.runtimeSHA256,asset.id);
    assert.equal(runtime.length,asset.bytes,asset.id);
    assert.equal(original.readUInt32BE(16),asset.width,asset.id);
    assert.equal(original.readUInt32BE(20),asset.height,asset.id);
    assert.equal(runtime.toString('ascii',8,12),'WEBP',asset.id);
    if(asset.alpha){assert.equal(original[25],6,'prop source retains RGBA');assert.equal(runtime.toString('ascii',12,16),'VP8X');assert.ok(runtime[20]&16,'encoded props retain alpha');}
  }
  assert.deepEqual(JSON.parse(readFileSync(resolve(root,'public/game-assets/physical-arcade/tower-tumble/scene-kit-v1.json'),'utf8')),manifest);
});

test('Tower has separate difficulty landscapes and all measured material/prop rectangles remain inside their atlas',()=>{
  for(const world of['meadow','dino','moonwood'])assert.ok(manifest.assets.find(item=>item.id===`${world}-landscape-v1`));
  for(const[group,atlas]of[['materials','materials-atlas-v1'],['props','props-atlas-v1']]){
    const asset=manifest.assets.find(item=>item.id===atlas);
    for(const[name,bounds]of Object.entries(manifest[group])){
      assert.equal(bounds.length,4,name);assert.ok(bounds.every(Number.isInteger),name);
      assert.ok(bounds[0]>=0&&bounds[1]>=0&&bounds[2]>bounds[0]&&bounds[3]>bounds[1],name);
      assert.ok(bounds[2]<=asset.width&&bounds[3]<=asset.height,name);
    }
  }
  for(const prop of['beam','ladder','barrel','cage','pulley','ivy','flowers','fern','mushrooms','lantern'])assert.ok(manifest.props[prop]);
});
