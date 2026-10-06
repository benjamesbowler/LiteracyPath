import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
const manifest=JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/word-bridge/scenery-manifest.json','utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const alpha=(data,info,x,y)=>data[(y*info.width+x)*4+3];

test('each original construction kit retains every semantic alpha pixel and actual live-bank attachment across all three worlds',async()=>{
  for(const world of ['meadow','dino','moonwood']){
    const asset=manifest.assets.find(row=>row.id===`${world}-construction-kit`),bytes=await fs.readFile(asset.source);
    assert.equal(hash(bytes),asset.sourceSha256);
    const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.deepEqual([info.width,info.height],asset.sourceSize);assert.equal(data[3],0);
    assert.deepEqual(asset.frames.map(frame=>frame.action),['plank','workbench','rack','bank']);
    for(const frame of asset.frames){
      const [left,top,right,bottom]=frame.cell,[x,y,width,height]=frame.measurement.semanticRegion;
      for(let cy=y;cy<y+height;cy++)for(let cx=x;cx<x+width;cx++)if(alpha(data,info,cx,cy)>=8){
        assert.ok(cx>=left&&cx<right&&cy>=top&&cy<bottom,`${frame.id}: no plume, plank bevel, peg, tool, turf or flower is clipped`);
      }
      for(const point of Object.values(frame.sockets))assert.ok(alpha(data,info,...point)>=160);
    }
    const bank=asset.frames.find(frame=>frame.action==='bank');
    assert.deepEqual(bank.anchor,[bank.sockets.walkSurface[0]-bank.cell[0],bank.sockets.walkSurface[1]-bank.cell[1]],'The collider plane attaches to a real turf/dirt pixel, not decorative plant tips or the stone base');
    assert.ok(bank.sockets.walkSurface[1]<bank.sockets.ground[1]);
    const runtime=await fs.readFile('public'+asset.runtime);
    assert.equal(hash(runtime),asset.runtimeSha256);assert.equal(runtime.length,asset.runtimeBytes);
    const delivered=await sharp(runtime).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.deepEqual([delivered.info.width,delivered.info.height],asset.sourceSize);
    for(let pixel=0;pixel<info.width*info.height;pixel++)assert.equal(delivered.data[pixel*4+3],data[pixel*4+3],`${world}: every source alpha pixel remains exact`);
    assert.equal(asset.alphaCoverage.sourceAlphaSha256,asset.alphaCoverage.runtimeAlphaSha256);
    for(const frame of asset.frames)for(const point of Object.values(frame.sockets))assert.ok(alpha(delivered.data,delivered.info,...point)>=160);
  }
});

test('blank plank materials are separate source props from live target and repeated pieces',()=>{
  for(const world of ['meadow','dino','moonwood']){
    const asset=manifest.assets.find(row=>row.id===`${world}-construction-kit`),frame=asset.frames.find(row=>row.action==='plank');
    assert.deepEqual(Object.keys(frame.sockets),['ground']);
    assert.ok((frame.cell[2]-frame.cell[0])/(frame.cell[3]-frame.cell[1])>2,'Broad grain face leaves real room for a live readable glyph');
    assert.ok(!Object.hasOwn(frame,'target'));
  }
  assert.equal(manifest.review.runtimeAcceptance,'PENDING');
});
