import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignAudio } from '../../src/features/soundSeekers/v3/engine/campaignAudio.js';
class FakeAudio extends EventTarget {
  static instances=[];
  constructor(src){super();this.src=src;this.paused=false;FakeAudio.instances.push(this);}
  play(){return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){}
  load(){}
  finish(){this.dispatchEvent(new Event('ended'));}
}
test('replay cancels the old instruction, keeps the new one alive, and settles both callers',async()=>{
  const player=createCampaignAudio({AudioClass:FakeAudio});
  const first=player.play(['a']);const old=FakeAudio.instances.at(-1);
  const second=player.play(['b']);const current=FakeAudio.instances.at(-1);
  assert.equal(await first,false);assert.equal(old.paused,true);
  old.finish();assert.equal(current.paused,false);current.finish();assert.equal(await second,true);
  player.dispose();
});
test('dispose stops a sequence before its next clip and never reports cancelled speech as heard',async()=>{
  const player=createCampaignAudio({AudioClass:FakeAudio});const initialCount=FakeAudio.instances.length;
  const pending=player.play(['a','m']);player.dispose();
  assert.equal(await pending,false);assert.equal(FakeAudio.instances.length,initialCount+1);
  assert.equal(await player.play(['s']),false);
});
test('a rejected playback produces an explicit failure and no successful learning callback',async()=>{
  class BlockedAudio extends FakeAudio{play(){return Promise.reject(new Error('blocked'));}}
  const failures=[];const player=createCampaignAudio({AudioClass:BlockedAudio,onFailure:src=>failures.push(src)});
  assert.equal(await player.play(['target']),false);assert.deepEqual(failures,['target']);player.dispose();
});
test('the whole teaching sequence owns the quiet interval, including gaps between clips',async()=>{
  const changes=[];
  const player=createCampaignAudio({AudioClass:FakeAudio,onSpeakingChange:value=>changes.push(value)});
  const pending=player.play(['phoneme','anchor']);
  assert.equal(changes.at(-1),true);
  FakeAudio.instances.at(-1).finish();
  await Promise.resolve();
  assert.equal(changes.at(-1),true);
  FakeAudio.instances.at(-1).finish();
  assert.equal(await pending,true);
  assert.equal(changes.at(-1),false);
  player.dispose();
});
