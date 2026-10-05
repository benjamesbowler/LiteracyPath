import test from 'node:test';
import assert from 'node:assert/strict';
import { REEL_READ_ART } from '../../src/components/learn/games/games/reelReadArtData.js';
import { forecastReelReadCast, forecastReelReadAlignedCast, detachedReelReadMotorState } from '../../src/utils/reelReadCastAim.js';
import { reelReadStageLayout, reelReadOperatorFrame, stepReelReadFish } from '../../src/utils/reelReadMotion.js';
import { reelReadSceneGeometry } from '../../src/utils/reelReadSceneGeometry.js';
import { beginReelReadCast, stepReelReadSimulation } from '../../src/utils/reelReadSimulation.js';

function geometryFor(world, character, width=320, height=340, actorReady=true, reducedKit=false) {
  const primary=REEL_READ_ART[`${character}-fishing-actions-v1`];
  const actorAsset=actorReady?primary:REEL_READ_ART[`${character}-fishing-fallback-v1`];
  const parts=REEL_READ_ART[`${world}-fishing-kit${reducedKit?'-fallback':''}-v1`].parts;
  const layout=reelReadStageLayout(width,height);
  return state=>{
    const frame=reelReadOperatorFrame(state);
    return reelReadSceneGeometry(state,layout,{actorAsset,actorFrame:actorAsset.frames[actorReady?frame:0],
      referenceFrames:primary.frames,parts,actorReady,frame});
  };
}

function pinnedHard() {
  // Exact v3 selected fish3, left-facing route limit, first native tap clock.
  return { stage:0,elapsed:2.1083333333333285,boatPosition:0,boatVelocity:0,facing:'left',
    level:{visibleFish:6,fishSpeed:82,hookSpeed:430},
    fish:[{id:1,slot:4,phase:37,direction:1},{id:2,slot:1,phase:74,direction:-1},
      {id:3,slot:0,phase:111,direction:1},{id:4,slot:3,phase:148,direction:-1},
      {id:5,slot:2,phase:185,direction:1},{id:6,slot:5,phase:31,direction:-1}],
    landedAt:-Infinity,errorAt:-Infinity,escapeAt:-Infinity,castAt:-Infinity,
    paused:false,complete:false,celebrating:false,castPending:false,hook:null,fight:null,
    steering:0,reeling:false,motorMisses:0,motorEscapes:0,
    evidence:{firstResponses:[],assistedRetries:[],acceptedResponses:[]},
  };
}

function actualFirstHit(state, geometry, onHook) {
  beginReelReadCast(state,'pointer');
  for(let step=0;step<400;step++) {
    const view=geometry(state);
    const hit=stepReelReadSimulation(state,1/120,{...view,resolveRod:current=>geometry(current).rod},onHook?{onHook}:{});
    if(hit?.type==='hook-impact')return hit;
    if(state.motorMisses)return null;
  }
  throw Error('The ordinary physical cast did not end within its real drop lifetime');
}

test('exact six-miss Hard state forecasts the animated release/current, while the old ready-column cast misses',()=>{
  const geometry=geometryFor('moonwood','pip'),state=pinnedHard();
  const observed=forecastReelReadCast(state,3,geometry);
  assert.equal(observed.firstHit.fishId,3);
  assert.ok(observed.releaseColumn<125&&observed.releaseColumn>122);
  assert.equal(actualFirstHit(structuredClone(state),geometry).fishId,3);
  // Old auto-aim fired as the fish reached within10px of ready x198.79.
  const late=pinnedHard();late.elapsed=(198.7893127209393-10+85)/82;
  assert.equal(actualFirstHit(late,geometry),null);
  assert.equal(late.motorMisses,1);
});

test('the first physical tie remains another fish, never the selected identity',()=>{
  const state=pinnedHard(),other={...state.fish.find(row=>row.id===3),id:99};
  state.fish.unshift(other);
  const result=forecastReelReadCast(state,3,geometryFor('moonwood','pip'));
  assert.equal(result.firstHit.fishId,99);
  assert.equal(actualFirstHit(structuredClone(state),geometryFor('moonwood','pip')).fishId,99);
});

test('forecast cannot read words/correctness or mutate live motor objects/history; only a real hook calls the response owner',()=>{
  const state=pinnedHard(),before=structuredClone(state),geometry=geometryFor('moonwood','pip');
  Object.defineProperty(state.level,'correctWords',{get(){throw Error('correctness read');}});
  Object.defineProperty(state.level,'target',{get(){throw Error('target read');}});
  for(const fish of state.fish)Object.defineProperty(fish,'word',{get(){throw Error('word read');}});
  const motor=detachedReelReadMotorState(state);
  assert.notEqual(motor.fish,state.fish);assert.notEqual(motor.level,state.level);
  assert.ok(!('evidence' in motor)&&!('correctWords' in motor.level)&&!('word' in motor.fish[0]));
  let responseCalls=0;
  const prediction=forecastReelReadCast(state,3,geometry);
  assert.equal(prediction.firstHit.fishId,3);assert.equal(responseCalls,0);
  assert.deepEqual(state,before);
  actualFirstHit(state,geometry,fish=>{responseCalls++;state.evidence.firstResponses.push({selectedId:fish.id});return {kind:'wrong-word'};});
  assert.equal(responseCalls,1);assert.deepEqual(state.evidence.firstResponses,[{selectedId:3}]);
});

test('Easy and Medium sibling aim plus Hard have a truthful cast with primary/idle art and primary/reduced kits on both short channels',()=>{
  for(const [world,character,speed,count] of [['meadow','bouncy',58,5],['dino','chompy',70,5],['moonwood','pip',82,6]])
  for(const [width,height] of [[320,340],[568,260]])for(const actorReady of [true,false])for(const reducedKit of [false,true]) {
    const state=pinnedHard();state.level={visibleFish:count,fishSpeed:speed,hookSpeed:430};
    state.fish=Array.from({length:count},(_,slot)=>({id:slot+1,slot,phase:37*(slot+1)%191,direction:slot%2?-1:1}));
    const geometry=geometryFor(world,character,width,height,actorReady,reducedKit);
    let forecast=null;
    for(let elapsed=0;elapsed<count*145/speed+1;elapsed+=.08) {
      state.elapsed=elapsed;
      const current=forecastReelReadCast(state,1,geometry);
      if(current?.firstHit?.fishId===1){forecast=current;break;}
    }
    assert.ok(forecast,`${world} ${width}×${height} primaryActor${actorReady} reducedKit${reducedKit} actual first route`);
    assert.equal(actualFirstHit(structuredClone(state),geometry).fishId,1);
    assert.deepEqual(state.evidence,{firstResponses:[],assistedRetries:[],acceptedResponses:[]});
  }
});

test('the actual Hard tall portrait no-cast has a readable opposite release route; all three sibling primary and idle rigs retain real first contact',()=>{
  for(const [world,character,speed,count] of [['meadow','bouncy',58,5],['dino','chompy',70,5],['moonwood','pip',82,6]])
  for(const actorReady of [true,false])for(const reducedKit of [false,true]) {
    const state=pinnedHard();state.boatPosition=1;state.facing='left';
    state.level={visibleFish:count,fishSpeed:speed,hookSpeed:430};
    state.fish=Array.from({length:count},(_,slot)=>({id:slot+1,slot,phase:37*(slot+1)%191,direction:slot%2?-1:1}));
    if(world==='moonwood')state.fish.forEach((row,index)=>{row.slot=[4,1,3,2,0,5][index];});
    const geometry=geometryFor(world,character,320,568,actorReady,reducedKit);let matched=null;
    for(let elapsed=0;elapsed<count*145/speed+1;elapsed+=.05) {
      state.elapsed=elapsed;
      const selected=stepReelReadFish(state.fish.find(row=>row.id===3),geometry(state).layout,state.level,elapsed);
      if(!selected.visible)continue;
      const result=forecastReelReadAlignedCast(state,3,geometry);
      if(result.firstHit?.fishId===3){matched=result;break;}
    }
    assert.ok(matched,`${world} primary${actorReady} reduced${reducedKit} readable selected first route`);
    const cast=structuredClone(state);cast.facing=matched.facing;
    assert.equal(actualFirstHit(cast,geometry).fishId,3);
    if(world==='moonwood'&&actorReady&&!reducedKit){assert.equal(matched.facing,'right');assert.notEqual(forecastReelReadCast(state,3,geometry).firstHit?.fishId,3);}
  }
});

test('alternate-facing selection cannot prioritize a selected ID over another collider or mutate the live motor and learning objects',()=>{
  const state=pinnedHard();state.boatPosition=1;state.elapsed=8.5;
  state.fish.forEach((row,index)=>{row.slot=[4,1,3,2,0,5][index];});
  const geometry=geometryFor('moonwood','pip',320,568),before=structuredClone(state);
  Object.defineProperty(state.level,'correctWords',{get(){throw Error('correctness read');}});
  Object.defineProperty(state.level,'target',{get(){throw Error('target read');}});
  for(const fish of state.fish)Object.defineProperty(fish,'word',{get(){throw Error('word read');}});
  const selected=forecastReelReadAlignedCast(state,3,geometry);
  assert.equal(selected.firstHit.fishId,3);assert.equal(selected.facing,'right');assert.deepEqual(state,before);
  const other={...state.fish.find(row=>row.id===3),id:99};state.fish.unshift(other);
  const blocked=forecastReelReadAlignedCast(state,3,geometry);
  assert.equal(blocked.facing,'left');assert.notEqual(blocked.firstHit?.fishId,3);
  const invisible={...before,elapsed:0};
  assert.equal(forecastReelReadAlignedCast(invisible,3,geometry).facing,'left');
});
