import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {wordBridgeCharacterPose,wordBridgeCarriedSurface} from '../../src/components/learn/games/games/wordBridgePose.js';

const manifest=JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/word-bridge/manifest.json','utf8'));
// Geometry-only tests consume registered source metadata, not a fabricated image delivery.
const atlases=Object.fromEntries(manifest.assets.map(asset=>[asset.id,{width:asset.sourceSize[0],height:asset.sourceSize[1],nominalHeight:asset.nominalHeight,pixelsPerUnit:asset.pixelsPerUnit,
  frames:asset.frames.map(frame=>({id:frame.id,action:frame.action,cell:[frame.rect[0],frame.rect[1],frame.rect[0]+frame.rect[2],frame.rect[1]+frame.rect[3]],anchor:frame.anchor,
    sockets:Object.fromEntries(Object.entries(frame.contacts).filter(([,point])=>point).map(([name,point])=>[name,[frame.rect[0]+point[0],frame.rect[1]+point[1]]]))}))}]));

test('construction carry gait uses independently registered opposite strides for all three casts',()=>{
  for(const world of ['meadow','dino','moonwood']){
    const a=wordBridgeCharacterPose(atlases,{world,x:180,y:220,height:110,time:0,moving:true,carrying:true});
    const b=wordBridgeCharacterPose(atlases,{world,x:180,y:220,height:110,time:.12,moving:true,carrying:true});
    assert.equal(a.action,'carry-a');assert.equal(b.action,'carry-b');assert.notEqual(a.frame.id,b.frame.id);
    assert.equal(a.pose.sockets.feet.y,220);assert.equal(b.pose.sockets.feet.y,220);
    assert.ok(a.pose.sockets.nearHand&&a.pose.sockets.farHand&&b.pose.sockets.nearHand&&b.pose.sockets.farHand);
  }
});

test('both actual palms lie on the same live plank face after either native facing direction, without inverted text',()=>{
  for(const world of ['meadow','dino','moonwood'])for(const mirror of [false,true])for(const time of [0,.12]){
    const actor=wordBridgeCharacterPose(atlases,{world,x:180,y:220,height:110,time,moving:true,carrying:true,mirror});
    const surface=wordBridgeCarriedSurface(actor.pose,{width:64,height:44});
    assert.ok(surface);assert.ok(Math.abs(surface.angle)<=Math.PI/2);
    for(const point of Object.values(surface.grips)){
      const dx=point.x-surface.centre.x,dy=point.y-surface.centre.y;
      const localX=dx*Math.cos(surface.angle)+dy*Math.sin(surface.angle);
      const localY=-dx*Math.sin(surface.angle)+dy*Math.cos(surface.angle);
      assert.ok(Math.abs(localX)<=surface.width/2-7.99);
      assert.ok(Math.abs(localY-(surface.gripFraction-.5)*surface.height)<1e-8);
    }
    assert.equal(surface.renderOrder,'held-surface-before-original-character-palms');
  }
});

test('hidden source hands cannot be substituted with guessed grips',()=>{
  const resting=wordBridgeCharacterPose(atlases,{world:'meadow',x:0,y:220,height:110});
  assert.equal(resting.action,'rest');assert.equal(wordBridgeCarriedSurface(resting.pose),null);
  assert.equal(wordBridgeCharacterPose({},{}),null);
});

test('an original plank keeps its source aspect and both measured palms when fitted to long or short carried text',()=>{
  for(const world of ['meadow','dino','moonwood'])for(const mirror of [false,true])for(const width of [64,148]){
    const aspectRatio=world==='meadow'?709/282:world==='dino'?677/312:678/277;
    const actor=wordBridgeCharacterPose(atlases,{world,x:180,y:220,height:110,time:.12,moving:true,carrying:true,mirror});
    const surface=wordBridgeCarriedSurface(actor.pose,{width,height:58,aspectRatio});
    assert.ok(Math.abs(surface.width/surface.height-aspectRatio)<1e-10,'source timber is uniformly scaled');
    assert.ok(surface.height>=34,'live glyph retains a readable face beneath the actual palms');
    assert.equal(surface.gripFraction,.22,'hands hold the top rim, avoiding the observed face/head occlusion');
    for(const point of Object.values(surface.grips)){
      const dx=point.x-surface.centre.x,dy=point.y-surface.centre.y;
      const localY=-dx*Math.sin(surface.angle)+dy*Math.cos(surface.angle);
      assert.ok(Math.abs(localY-(surface.gripFraction-.5)*surface.height)<1e-8,'actual palms stay on the original face');
    }
    assert.equal(actor.pose.sockets.feet.y,220,'fitting the live piece cannot move the character baseline');
  }
});
