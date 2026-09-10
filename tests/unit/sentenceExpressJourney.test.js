import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyClock } from '../../src/components/learn/games/games/sentenceExpressJourney.js';
test('a multi-second callback gap catches up to arrival instead of extending the journey',()=>{
 const clock=createJourneyClock(1000);
 assert.equal(clock.elapsed(1100),100);
 assert.equal(clock.elapsed(7600),6600);
 assert.ok(clock.elapsed(7600)>=6500);
});
test('pause excludes its whole duration while repeated pause/resume calls remain idempotent',()=>{
 const clock=createJourneyClock(1000);
 clock.pause(2000);clock.pause(2400);
 assert.equal(clock.elapsed(9000),1000);
 clock.resume(9000);clock.resume(9200);
 assert.equal(clock.elapsed(10000),2000);
 clock.pause(11000);clock.resume(14000);
 assert.equal(clock.elapsed(17500),6500);
});
