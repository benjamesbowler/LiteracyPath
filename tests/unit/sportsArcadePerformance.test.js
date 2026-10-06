import test from 'node:test';
import assert from 'node:assert/strict';
import {createSportsFrameTelemetry} from '../../src/utils/sportsArcadePerformance.js';
test('performance sampling measures real intervals/next-render input, excludes pause and gives owned diagnostics',()=>{
  let now=0;const telemetry=createSportsFrameTelemetry({now:()=>now});
  for(let frame=0;frame<50;frame++){now+=16;telemetry.rendered(16,{tier:'high',cpuStart:now-2});}
  telemetry.markInput();now+=11;telemetry.rendered(16,{tier:'high',cpuStart:now-3});
  const proof=telemetry.snapshot();assert.equal(proof.byTier.high.frames.meanMs,16);assert.equal(proof.inputs.meanMs,11);
  telemetry.markInput();now+=1000;telemetry.rendered(1000,{tier:'high',active:false});
  now+=16;telemetry.rendered(16,{tier:'high'});assert.equal(telemetry.snapshot().inputs.count,1);
  proof.byTier.high.frames.meanMs=0;assert.equal(telemetry.snapshot().byTier.high.frames.meanMs,16);
});
test('only the existing sustained shared frame policy requests lower quality; a single hitch is insufficient',()=>{
  let now=0;const telemetry=createSportsFrameTelemetry({now:()=>now});
  for(let frame=0;frame<200;frame++){now+=16;assert.equal(telemetry.rendered(16,{tier:'low'}),null);}
  now+=120;assert.equal(telemetry.rendered(120,{tier:'low'}),null);
  let requested=null;
  for(let frame=0;frame<400;frame++){now+=60;requested=telemetry.rendered(60,{tier:'low'});if(requested)break;}
  assert.equal(requested.to,'canvas');assert.ok(telemetry.snapshot().qualityChanges.length);
});
test('the final Canvas tier reports actual active frames and input without adding an adaptive policy',()=>{
  let now=0;const telemetry=createSportsFrameTelemetry({now:()=>now});
  for(let frame=0;frame<700;frame++){
    now+=frame<100?100:16;
    assert.equal(telemetry.rendered(frame<100?100:16,{tier:'canvas',cpuStart:now-4}),null);
  }
  telemetry.markInput();now+=9;telemetry.rendered(16,{tier:'canvas',cpuStart:now-3});
  const proof=telemetry.snapshot();
  assert.equal(proof.byTier.canvas.frames.count,600);
  assert.equal(proof.byTier.canvas.frames.meanMs,16);
  assert.equal(proof.byTier.canvas.frames.p95Ms,16);
  assert.equal(proof.byTier.canvas.inputToRender.meanMs,9);
  assert.deepEqual(proof.qualityChanges,[]);
  now+=1000;telemetry.rendered(1000,{tier:'canvas',active:false});
  assert.equal(telemetry.snapshot().byTier.canvas.frames.meanMs,16);
  proof.byTier.canvas.frames.meanMs=0;
  assert.equal(telemetry.snapshot().byTier.canvas.frames.meanMs,16);
});
test('separate indexed receipts select only existing post-boundary samples and cannot mutate ordinary summaries or sample clocks',()=>{
  let now=0,clockReads=0;
  const telemetry=createSportsFrameTelemetry({now:()=>{clockReads++;return now;}});
  for(let frame=0;frame<9;frame++){now+=47;telemetry.rendered(47,{tier:'canvas',cpuStart:now-3});}
  const beforeSummary=telemetry.snapshot(),readsBefore=clockReads,boundary=telemetry.snapshotFrameRows();
  assert.equal(clockReads,readsBefore);assert.deepEqual(telemetry.snapshot(),beforeSummary);assert.equal(boundary.lastSampleIndex,9);
  for(let frame=0;frame<20;frame++){now+=16;telemetry.rendered(16,{tier:'canvas',cpuStart:now-2});}
  const afterSummary=telemetry.snapshot(),after=telemetry.snapshotFrameRows(),postBoundary=after.rows.filter(row=>row.sampleIndex>boundary.lastSampleIndex);
  assert.equal(after.lastSampleIndex,29);assert.equal(postBoundary.length,20);
  assert.ok(postBoundary.every(row=>row.tier==='canvas'&&row.frameMs===16&&row.renderCpuMs===2));
  after.rows[0].frameMs=0;after.rows.length=0;boundary.lastSampleIndex=0;
  assert.deepEqual(telemetry.snapshot(),afterSummary);assert.equal(telemetry.snapshotFrameRows().rows[0].frameMs,47);
});
test('frame receipts retain at most600 original rows and monotonic indices across pause without changing the shared quality policy',()=>{
  let now=0;const telemetry=createSportsFrameTelemetry({now:()=>now});
  for(let frame=0;frame<700;frame++){now+=16;assert.equal(telemetry.rendered(16,{tier:'canvas'}),null);}
  const before=telemetry.snapshotFrameRows();assert.equal(before.lastSampleIndex,700);assert.equal(before.oldestSampleIndex,101);assert.equal(before.rows.length,600);
  assert.deepEqual(before.rows.map(row=>row.sampleIndex),Array.from({length:600},(_,i)=>i+101));
  now+=1000;telemetry.rendered(1000,{tier:'canvas',active:false});telemetry.reset();
  assert.deepEqual(telemetry.snapshotFrameRows(),before);
  now+=17;assert.equal(telemetry.rendered(17,{tier:'canvas'}),null);
  const after=telemetry.snapshotFrameRows();assert.equal(after.lastSampleIndex,701);assert.equal(after.oldestSampleIndex,102);assert.equal(after.rows.length,600);assert.equal(after.rows.at(-1).frameMs,17);
  assert.deepEqual(telemetry.snapshot().qualityChanges,[]);
});
