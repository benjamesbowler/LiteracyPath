import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Execute the production entry points with an observable audio allocator. This
// does not need an audio device or fabricate successful recording delivery.
function fixture() {
  const source=readFileSync(new URL('../../src/utils/learnGamesAudio.js',import.meta.url),'utf8');
  const start=source.indexOf('export function preloadWordAudio('),end=source.indexOf('// Gold-voice policy:',start);
  assert.ok(start>=0&&end>start);
  const calls=[],cache=new Map();
  const context={existingAudioPaths:values=>values,wordAudioCandidates:word=>[`/${word}.mp3`],slugify:word=>word,howlCache:cache,
    getHowl:path=>{calls.push(path);const sound={duration:()=>1.25};cache.set(path,sound);return sound;}};
  vm.createContext(context);vm.runInContext(source.slice(start,end).replaceAll('export function','function'),context);
  return {...context,calls,cache};
}

test('muted preloading and repeated pacing reads never initialize audio',()=>{
  const f=fixture();
  f.preloadWordAudio('map',{enabled:false});
  for(let i=0;i<1000;i++)assert.equal(f.wordAudioDuration('map'),.8);
  assert.equal(f.calls.length,0);
});

test('enabled preloading retains recorded timing and invalid durations keep the existing fallback',()=>{
  const f=fixture();
  f.preloadWordAudio('map',{enabled:true});
  assert.deepEqual(f.calls,['/map.mp3']);
  assert.equal(f.wordAudioDuration('map'),1.25);
  f.cache.set('/map.mp3',{duration:()=>NaN});
  assert.equal(f.wordAudioDuration('map'),.8);
  assert.equal(f.calls.length,1);
});
