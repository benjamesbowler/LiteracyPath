import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { registeredPalCanvasPose } from '../../src/components/learn/games/shared/registeredPalArt.js';

const manifest=JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/sentence-express/manifest.json','utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const alpha=(data,info,[x,y])=>data[(Math.round(y)*info.width+Math.round(x))*4+3];
const contains=(cell,[x,y])=>x>=cell[0]&&x<cell[2]&&y>=cell[1]&&y<cell[3];

test('all three conductor action families preserve two visible soles and measured palms, including corrected Pip pointing and Send poses',async()=>{
  for(const id of ['bouncy-conductor','chompy-conductor','pip-conductor']){
    const asset=manifest.assets.find(row=>row.id===id),bytes=await fs.readFile(asset.source);
    assert.equal(hash(bytes),asset.sourceSha256);
    const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.deepEqual([info.width,info.height],asset.sourceSize);assert.equal(data[3],0);
    assert.deepEqual(asset.frames.map(frame=>frame.action),['ready','point','couple-low','send-ready','wave','recover']);
    for(const frame of asset.frames){
      for(const [name,point]of Object.entries(frame.sockets)){
        assert.ok(contains(frame.cell,point),`${frame.id}/${name} belongs to its own complete pose`);
        assert.ok(alpha(data,info,point)>=160,`${frame.id}/${name} is actual original anatomy`);
      }
      assert.equal(frame.anchor[1]+frame.cell[1],Math.max(frame.sockets.bootLeft[1],frame.sockets.bootRight[1]));
      const atlas={width:info.width,height:info.height,pixelsPerUnit:asset.pixelsPerUnit,nominalHeight:asset.nominalHeight};
      const pose=registeredPalCanvasPose(atlas,frame,{x:180,y:220,height:110});
      const mirror=registeredPalCanvasPose(atlas,frame,{x:180,y:220,height:110,mirror:true});
      assert.equal(pose.sockets.feet.y,220);assert.equal(mirror.sockets.feet.y,220);
      assert.ok(Math.abs(pose.sockets.nearHand.x+mirror.sockets.nearHand.x-360)<1e-8,'A coupling prop follows the real hand under mirroring');
      assert.equal(frame.measurement.foreignOpaqueCropPixels,0);
    }
  }
  const pip=manifest.assets.find(row=>row.id==='pip-conductor');
  assert.deepEqual(pip.frames.find(frame=>frame.action==='send-ready').sockets.nearHand,[854,744]);
  assert.ok(pip.frames.find(frame=>frame.action==='point').sockets.feet[1]<518,'The sole region excludes the following pose’s hair');
});

test('all twelve real station locations have independent whole alpha bodies and actual decorative ground attachments',async()=>{
  for(const id of ['meadow-stops','dino-stops','moonwood-stops']){
    const asset=manifest.assets.find(row=>row.id===id),bytes=await fs.readFile(asset.source);
    assert.equal(hash(bytes),asset.sourceSha256);
    const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.deepEqual([info.width,info.height],asset.sourceSize);assert.equal(data[3],0);assert.equal(asset.frames.length,4);
    for(const frame of asset.frames){
      const [left,top,right,bottom]=frame.measurement.opaqueBodyBounds;
      assert.ok(left>0&&top>0&&right<info.width&&bottom<info.height,'No complete source object is clipped by the original image edge');
      assert.ok(contains(frame.cell,[left,top])&&contains(frame.cell,[right-1,bottom-1]));
      assert.equal(frame.measurement.foreignOpaqueCropPixels,0);
      assert.deepEqual(Object.keys(frame.sockets),['ground'],'Decorative station art does not invent a rail/deck or coupling contact');
      assert.ok(alpha(data,info,frame.sockets.ground)>=160);
      assert.equal(frame.anchor[1]+frame.cell[1],frame.sockets.ground[1]);
    }
  }
  assert.equal(manifest.review.humanApproval,'UNKNOWN','Source checks do not establish human observation');
});

test('Express preserves all three whole original railway yards and their exact prompts; derivative admission keeps their dimensions without inventing rail contacts', async () => {
  const yards = manifest.assets.filter(asset => asset.kind === 'authored-railway-yard-layer');
  assert.deepEqual(yards.map(asset => asset.world).sort(), ['dino', 'meadow', 'moonwood']);
  for (const asset of yards) {
    const source = await fs.readFile(asset.source), prompt = await fs.readFile(asset.prompt);
    assert.equal(hash(source), asset.sourceSha256); assert.equal(hash(prompt), asset.promptSha256);
    const info = await sharp(source).metadata();
    assert.deepEqual([info.width, info.height], asset.sourceSize);
    assert.equal(asset.frames, undefined, 'A whole background does not invent a physical rail/deck or carriage contact');
    if (asset.runtime) {
      const runtime = await fs.readFile(`public${asset.runtime}`), derivative = await sharp(runtime).metadata();
      assert.equal(hash(runtime), asset.runtimeSha256); assert.equal(runtime.length, asset.runtimeBytes);
      assert.deepEqual([derivative.width, derivative.height], asset.sourceSize);
      assert.deepEqual(asset.runtimeSize, asset.sourceSize);
    }
  }
  assert.equal(manifest.review.physicalDeviceObservation, 'UNKNOWN', 'Source/derivative checks do not establish physical-device observation');
});
