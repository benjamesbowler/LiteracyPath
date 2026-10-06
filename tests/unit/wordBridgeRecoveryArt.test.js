import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { PHYSICAL_PAL_ART } from '../../src/components/learn/games/shared/physicalPalArtData.js';
import { wordBridgeRecoveryAtlas,wordBridgeRecoveryPose,wordBridgeSingleHandSurface } from '../../src/components/learn/games/games/wordBridgeRecoveryArt.js';

test('canonical recovery exposes only its actual visible palm and opaque sole within unchanged shared crops',async()=>{
  for(const hero of ['bouncy','chompy','pip']){
    const atlas=wordBridgeRecoveryAtlas(hero),shared=PHYSICAL_PAL_ART[hero].actionAtlases.tools;
    const {data,info}=await sharp(await fs.readFile('public'+atlas.runtime)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(atlas.runtime,shared.runtime);
    for(let index=0;index<2;index++){
      const frame=atlas.frames[index];assert.deepEqual(frame.cell,shared.frames[index+6].cell);assert.deepEqual(frame.anchor,shared.frames[index+6].anchor);
      assert.deepEqual(Object.keys(frame.sockets),['forehand','feet']);
      for(const point of Object.values(frame.sockets)){
        assert.ok(point[0]>=frame.cell[0]&&point[0]<frame.cell[2]&&point[1]>=frame.cell[1]&&point[1]<frame.cell[3]);
        assert.ok(data[(point[1]*info.width+point[0])*4+3]>=160,hero+' measured contact must be visible source art');
      }
      assert.equal(frame.action,'retained-static-carry','recovery cannot invent opposite stride animation');
    }
  }
});

test('both real facing poses attach a readable plank to one measured palm without invented anatomy',()=>{
  for(const hero of ['bouncy','chompy','pip'])for(const mirror of [false,true]){
    const atlas=wordBridgeRecoveryAtlas(hero),selected=wordBridgeRecoveryPose(atlas,{x:180,y:220,height:110,mirror});
    assert.equal(selected.index,mirror?1:0);assert.equal(selected.pose.mirror,false,'left pose is original left-facing artwork');
    const surface=wordBridgeSingleHandSurface(selected.pose,{width:148,height:58,aspectRatio:2.4,facing:mirror?-1:1});
    assert.deepEqual(Object.keys(surface.grips),['forehand']);assert.equal(surface.angle,0);
    const palm=surface.grips.forehand;
    assert.ok(Math.abs(palm.x-surface.centre.x)<surface.width/2);
    assert.ok(Math.abs(palm.y-surface.centre.y+.28*surface.height)<1e-8);
    assert.ok(Math.abs(selected.pose.sockets.feet.y-220)<1,'actual opaque sole remains beside the shared physical foot plane');
  }
  assert.equal(wordBridgeSingleHandSurface({sockets:{}},{}),null);
  assert.throws(()=>wordBridgeRecoveryAtlas('speedy'),/Unknown canonical/);
});
