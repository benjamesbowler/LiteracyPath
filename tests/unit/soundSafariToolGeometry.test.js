import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {registeredPalCanvasPose} from '../../src/components/learn/games/shared/registeredPalArt.js';
import {safariAttachedNetGeometry,safariNetPoint} from '../../src/components/learn/games/games/soundSafariToolGeometry.js';
const manifest=JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/sound-safari/manifest.json','utf8'));
const atlas=asset=>({width:asset.sourceSize[0],height:asset.sourceSize[1],pixelsPerUnit:asset.pixelsPerUnit,nominalHeight:asset.nominalHeight,frames:asset.frames});

test('all original Safari nets keep the native centre/radius while the actual shaft connects to measured palms at near and far reaches',()=>{
  const nets=manifest.assets.find(row=>row.id==='nets-v2');
  for(const world of ['meadow','dino','moonwood']){
    const operator=manifest.assets.find(row=>row.world===world&&row.frames?.some(frame=>frame.action==='swing'));
    const operatorPose=registeredPalCanvasPose(atlas(operator),operator.frames.find(frame=>frame.action==='swing'),{x:72,y:380,height:100});
    const frame=nets.frames.find(row=>row.world===world||row.id===`${world}-net`);
    for(const centre of[{x:180,y:160},{x:930,y:100},{x:290,y:310}]){
      const geometry=safariAttachedNetGeometry({operatorPose,netAtlas:atlas(nets),netFrame:frame,centre,radius:34});
      assert.ok(geometry);assert.deepEqual(geometry.captureCentre,centre);assert.equal(geometry.captureRadius,34);
      const actual=safariNetPoint(geometry.pose.sockets.captureCenter,geometry);
      assert.ok(Math.hypot(actual.x-centre.x,actual.y-centre.y)<1e-8);
      assert.deepEqual(geometry.shaft.sections[0].from,operatorPose.sockets.nearHand);
      assert.ok(Math.hypot(geometry.shaft.sections.at(-1).to.x-geometry.connector.x,geometry.shaft.sections.at(-1).to.y-geometry.connector.y)<1e-8);
      for(let i=1;i<3;i++)assert.deepEqual(geometry.shaft.sections[i-1].to,geometry.shaft.sections[i].from);
      assert.equal(geometry.shaft.representation,'three connected telescoping sections');
    }
  }
});

test('an unavailable actual wrist or source connector cannot fall through to a fabricated anatomy socket',()=>{
  const nets=manifest.assets.find(row=>row.id==='nets-v2');
  assert.equal(safariAttachedNetGeometry({operatorPose:{sockets:{}},netAtlas:atlas(nets),netFrame:nets.frames[0],centre:{x:200,y:200},radius:34}),null);
  assert.equal(safariAttachedNetGeometry({operatorPose:{sockets:{nearHand:{x:100,y:300}}},netAtlas:atlas(nets),netFrame:{...nets.frames[0],sockets:{captureCenter:nets.frames[0].sockets.captureCenter}},centre:{x:200,y:200},radius:34}),null);
});
