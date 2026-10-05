import test from 'node:test';
import assert from 'node:assert/strict';
import { REEL_READ_ART } from '../../src/components/learn/games/games/reelReadArtData.js';
import { reelReadStageLayout, reelReadOperatorFrame, stepReelReadFish, reelReadCastColumn } from '../../src/utils/reelReadMotion.js';
import { reelReadSceneGeometry } from '../../src/utils/reelReadSceneGeometry.js';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';
import { fillReelReadSchool, beginReelReadCast, stepReelReadSimulation } from '../../src/utils/reelReadSimulation.js';

test('every retained school ID has a genuine first swept-hook route in all ten stages, worlds and small channels',()=>{
  for(const [difficulty,world,character] of [['easy','meadow','bouncy'],['medium','dino','chompy'],['hard','moonwood','pip']]) {
    const actorAsset=REEL_READ_ART[`${character}-fishing-actions-v1`],parts=REEL_READ_ART[`${world}-fishing-kit-v1`].parts;
    for(const [width,height] of [[320,340],[320,568],[568,260],[568,320],[1366,768]]) {
      const layout=reelReadStageLayout(width,height);
      const routes=[];
      for(const boatPosition of [0,.5,1])for(const facing of ['left','right']) {
        const state={boatPosition,facing};
        const views=Object.fromEntries([2,4,5,6,7].map(frame=>[frame,reelReadSceneGeometry(state,layout,
          {actorAsset,actorFrame:actorAsset.frames[frame],referenceFrames:actorAsset.frames,parts,actorReady:true,frame})]));
        routes.push({boatPosition,facing,views});
      }
      for(const [stage,level] of reelReadV2Ladder(difficulty,913).entries()) {
        const base={stage,level,nextId:1,landedWords:[],fish:[]};fillReelReadSchool(base,913);
        const original=structuredClone(base.fish),reached=new Set();
        const period=stepReelReadFish(base.fish[0],layout,level,0).currentPeriod/level.fishSpeed;
        for(let elapsed=0;elapsed<period+1&&reached.size<base.fish.length;elapsed+=.2)for(const route of routes) {
          if(reached.size===base.fish.length)break;
          const column=reelReadCastColumn(route.views[7].rod,layout,route.facing);
          // Skip empty portions of the current, not a physical obstruction or
          // an alternative. The simulation still selects the first body hit.
          if(!base.fish.some(row=>!reached.has(row.id)&&Math.abs(stepReelReadFish(row,layout,level,elapsed).x-column)<level.fishSpeed*1.7+55))continue;
          const state={...base,fish:structuredClone(base.fish),elapsed,boatPosition:route.boatPosition,facing:route.facing,
            steering:0,boatVelocity:0,castAt:-Infinity,landedAt:-Infinity,errorAt:-Infinity,escapeAt:-Infinity,
            paused:false,complete:false,celebrating:false,hook:null,fight:null,castPending:false,
            motorMisses:0,motorEscapes:0};
          assert.ok(beginReelReadCast(state,'keyboard'));
          let first=null;
          for(let step=0;step<260&&!first&&!state.motorMisses;step++) {
            const view=route.views[reelReadOperatorFrame(state)];
            stepReelReadSimulation(state,1/120,{...view,resolveRod:current=>route.views[reelReadOperatorFrame(current)].rod},
              {onHook:fish=>{first=fish.id;return{kind:'wrong-word'};}});
          }
          if(first)reached.add(first);
        }
        assert.deepEqual([...reached].sort((a,b)=>a-b),base.fish.map(row=>row.id).sort((a,b)=>a-b),`${difficulty} ${width}×${height} stage${stage} actual first contacts`);
        assert.deepEqual(base.fish,original,'route observation never changes the retained school');
      }
    }
  }
});
