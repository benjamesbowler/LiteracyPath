import test from 'node:test';
import assert from 'node:assert/strict';
import {createLetterLeapFrameMetrics} from '../../src/components/learn/games/games/letterLeapMetrics.js';

test('ordinary frame intervals include slow frames and save submission; bounded steady samples start after warmup',()=>{
  const metrics=createLetterLeapFrameMetrics({warmupMs:100,limit:3});
  for(const at of [0,20,40,60,80])metrics.frame(at,at+2,2,true);
  assert.equal(metrics.snapshot().frameInterval.count,0);
  for(const at of [100,120,170])metrics.frame(at,at+7,7,true);
  const snapshot=metrics.snapshot();assert.equal(snapshot.frameInterval.count,3);assert.equal(snapshot.frameInterval.maxMs,50);
  assert.equal(snapshot.frameInterval.p95Ms,50);assert.equal(snapshot.renderSubmission.meanMs,7);
  metrics.frame(190,192,2,true);assert.equal(metrics.snapshot().frameInterval.count,3);
  metrics.frame(200,202,2,false);metrics.frame(1000,1002,2,true);
  assert.equal(metrics.snapshot().frameInterval.maxMs,50,'a paused gap is excluded without erasing actual foreground slow frames');
  metrics.input(1005);metrics.frame(1020,1028,8,true);
  assert.equal(metrics.snapshot().inputToSubmission.maxMs,23);
  snapshot.frameInterval.count=99;assert.equal(metrics.snapshot().frameInterval.count,3);
  metrics.reset();assert.equal(metrics.snapshot().frameInterval.count,0);assert.equal(metrics.snapshot().inputToSubmission.count,0);
});
