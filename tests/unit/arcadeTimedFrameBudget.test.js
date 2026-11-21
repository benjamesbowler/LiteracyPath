import test from 'node:test';
import assert from 'node:assert/strict';
import { createArcadeFrameBudgetState, createQuestFrameBudgetState, sampleQuestFrameBudget } from '../../src/utils/questPerformance.js';
import { createWordClimbRenderBudget } from '../../src/components/learn/games/games/wordClimbRenderBudget.js';
function sustained(create,dt){
  let state=create('rich'),elapsed=0;const changes=[];
  for(let frame=0;frame<800&&state.tierId!=='2d';frame++){
    elapsed+=dt;const result=sampleQuestFrameBudget(state,dt);
    if(result){state=result.state;if(result.signal.type==='quality-change')changes.push({to:state.tierId,elapsed,samples:result.signal.sampledFrames,average:result.signal.averageFrameMs});}
  }
  return changes;
}
test('54ms Arcade cadence uses bounded elapsed windows and identical tier thresholds; legacy remains unchanged',()=>{
  const bounded=sustained(createArcadeFrameBudgetState,54),legacy=sustained(createQuestFrameBudgetState,54);
  assert.deepEqual(bounded.map(x=>x.to),['balanced','low','2d']);assert.deepEqual(bounded.map(x=>x.to),legacy.map(x=>x.to));
  assert.deepEqual(bounded.map(x=>x.elapsed),[3294,6588,10368]);
  assert.deepEqual(legacy.map(x=>x.elapsed),[10530,21060,33210]);
  assert.ok(bounded.every(x=>x.samples>=8&&x.average===54));
});
test('healthy 60Hz retains ordinary warmup/report cadence and never discards art',()=>{
  const signals=create=>{let state=create('rich');const signals=[];for(let frame=1;frame<=1400;frame++){const result=sampleQuestFrameBudget(state,1000/60);if(result){state=result.state;signals.push({frame,signal:result.signal});}}assert.equal(state.tierId,'rich');return signals;};
  assert.deepEqual(signals(createArcadeFrameBudgetState),signals(createQuestFrameBudgetState));
  assert.equal(Object.hasOwn(createQuestFrameBudgetState(),'timeBoundedWindows'),false);
});
test('isolated stalls, invalid clocks and loading/pause gaps cannot satisfy a sustained Arcade downgrade',()=>{
  const budget=createWordClimbRenderBudget('high');let at=0;budget.observe(at,true);
  for(let frame=0;frame<700;frame++){
    at+=frame===65||frame===365?180:1000/60;assert.equal(budget.observe(at,true),null);
    if(frame===200){budget.observe(at,false);at+=30000;assert.equal(budget.observe(at,true),null);}
  }
  assert.equal(budget.tier,'high');
  const state=createArcadeFrameBudgetState();for(const interval of [NaN,-1,0,30000])assert.equal(sampleQuestFrameBudget(state,interval),null);
  assert.equal(state.warmupFrames,0);
});
test('Climb opts into real elapsed sampling and preserves the change across all fallback tiers',()=>{
  const budget=createWordClimbRenderBudget('high');let at=0;budget.observe(at,true);const changes=[];
  for(let frame=1;frame<=220&&budget.tier!=='canvas';frame++){at+=54;const to=budget.observe(at,true);if(to)changes.push({to,at});}
  assert.deepEqual(changes,[{to:'medium',at:3294},{to:'low',at:6588},{to:'canvas',at:10368}]);
});
