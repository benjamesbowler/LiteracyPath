import test from 'node:test';
import assert from 'node:assert/strict';
import { REEL_READ_ART } from '../../src/components/learn/games/games/reelReadArtData.js';
import { reelReadStageLayout, stepReelReadFish } from '../../src/utils/reelReadMotion.js';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';
import { reelReadSceneGeometry } from '../../src/utils/reelReadSceneGeometry.js';

test('every actual packed fishing pose fits its measured body and stable full-hull route at required short sizes',()=>{
  for(const [world,character] of [['meadow','bouncy'],['dino','chompy'],['moonwood','pip']]) {
    const actorAsset=REEL_READ_ART[`${character}-fishing-actions-v1`],parts=REEL_READ_ART[`${world}-fishing-kit-v1`].parts;
    for(const [width,height] of [[320,340],[320,568],[568,260],[568,320],[1366,768]]) {
      const layout=reelReadStageLayout(width,height),routes=[];
      for(const [frame,actorFrame] of actorAsset.frames.entries())for(const facing of ['left','right'])for(const boatPosition of [0,.5,1]) {
        const view=reelReadSceneGeometry({boatPosition,facing},layout,{actorAsset,actorFrame,
          referenceFrames:actorAsset.frames,parts,actorReady:true,frame});
        assert.ok(view.bodyBounds.top>=layout.operatorTop-1e-6,`${world} frame${frame} head`);
        assert.ok(view.bodyBounds.left>=8-1e-6&&view.bodyBounds.right<=width-8+1e-6);
        assert.ok(view.hull.x>=8-1e-6&&view.hull.x+view.hull.width<=width-8+1e-6);
        assert.ok(view.route.max>=view.route.min);routes.push(view.route);
        if(layout.compact)assert.ok(view.bodyBounds.left>=layout.cue.x+layout.cue.width+8-1e-6);
        const level=reelReadV2Ladder(['easy','medium','hard'][['meadow','dino','moonwood'].indexOf(world)],913)[0];
        for(let slot=0;slot<level.visibleFish;slot++)for(const elapsed of [0,2,4,7,11]) {
          const fish=stepReelReadFish({slot,phase:slot*71},layout,level,elapsed);
          if(!fish.visible)continue;
          const r=parts.fish[slot%parts.fish.length],c=parts.labelCentres[slot%parts.labelCentres.length];
          const bounds={left:fish.x-Math.max(54,(c[0]-r[0])*layout.fishScale),
            right:fish.x+Math.max(54,(r[2]-c[0])*layout.fishScale),
            top:fish.labelY-Math.max(24,(c[1]-r[1])*layout.fishScale),
            bottom:fish.labelY+Math.max(48,(r[3]-c[1])*layout.fishScale)};
          assert.ok(bounds.bottom<=layout.controlsTop-8+1e-6);
          assert.ok(bounds.right<=view.hull.x-8+1e-6||bounds.left>=view.hull.x+view.hull.width+8-1e-6
            ||bounds.top>=view.hull.y+view.hull.height+8-1e-6,'live plaque and complete authored fish clear the full hull');
          assert.ok(bounds.right<=view.bodyBounds.left-8+1e-6||bounds.left>=view.bodyBounds.right+8-1e-6
            ||bounds.top>=view.bodyBounds.bottom+8-1e-6,'school never hides the operator body');
        }
        if(view.rodHeld) {
          assert.deepEqual(view.rod.origin,view.pose.sockets.rodGrip);
          if(view.pose.sockets.reelGrip)assert.ok(view.rod.reelSeparation<1e-9);
          else assert.equal(view.rod.pairedContact,false);
        } else assert.equal(view.pose.sockets.rodGrip,undefined);
      }
      assert.ok(routes.every(route=>JSON.stringify(route)===JSON.stringify(routes[0])));
    }
  }
});

test('independent idle fallback uses the same complete boat route and physical source tool sockets',()=>{
  for(const [world,character] of [['meadow','bouncy'],['dino','chompy'],['moonwood','pip']]) {
    const primary=REEL_READ_ART[`${character}-fishing-actions-v1`],fallback=REEL_READ_ART[`${character}-fishing-fallback-v1`];
    for(const facing of ['left','right']) {
      const state={boatPosition:.4,facing},layout=reelReadStageLayout(320,340);
      const view=reelReadSceneGeometry(state,layout,{actorAsset:fallback,actorFrame:fallback.frames[0],
        referenceFrames:primary.frames,parts:REEL_READ_ART[`${world}-fishing-kit-v1`].parts,actorReady:false,frame:0});
      const actual=reelReadSceneGeometry(state,layout,{actorAsset:primary,actorFrame:primary.frames[0],
        referenceFrames:primary.frames,parts:REEL_READ_ART[`${world}-fishing-kit-v1`].parts,actorReady:true,frame:0});
      assert.deepEqual(view.route,actual.route);assert.deepEqual(view.pose.sockets,actual.pose.sockets);
      assert.deepEqual(view.rod.tip,actual.rod.tip);
    }
  }
});
