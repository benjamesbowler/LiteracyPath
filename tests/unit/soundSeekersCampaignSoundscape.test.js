import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createCampaignSoundscape,CAMPAIGN_SOUNDS} from '../../src/features/soundSeekers/v3/engine/campaignSoundscape.js';
function harness(preferences={}){
 const clips=[],listeners=new Map(),doc={visibilityState:'visible',documentElement:{getAttribute:()=>null},querySelector:()=>null,addEventListener:(k,fn)=>listeners.set(k,fn),removeEventListener:k=>listeners.delete(k)};
 const mix=createCampaignSoundscape({preferences,documentRef:doc,audioFactory:src=>{const a={src,paused:true,plays:0,currentTime:0,play(){this.paused=false;this.plays++;return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){},load(){}};clips.push(a);return a;}});
 return {mix,clips,doc,listeners};
}
test('music is opt-in and recorded action sounds never mask speech',()=>{
 const {mix,clips}=harness();mix.configure({worldId:'meadow',enabled:true});assert.equal(clips.length,0);
 assert.equal(mix.effect('pickup'),true);assert.equal(clips[0].paused,false);
 mix.configure({speaking:true,musicEnabled:true});assert.ok(clips.every(a=>a.paused));assert.equal(mix.effect('correct'),false);
 mix.configure({speaking:false});assert.equal(clips.filter(a=>a.loop&&!a.paused).length,2);mix.dispose();
});
test('pause, mute, hidden and quiet stop loops; lower-intensity preference softens every owned clip',()=>{
 const {mix,clips,doc,listeners}=harness({musicEnabled:true,musicPreferenceVersion:1});mix.configure({enabled:true});
 const original=clips.find(a=>a.loop).volume;doc.documentElement.getAttribute=()=> 'true';mix.configure({worldId:'dino'});
 assert.ok(clips.filter(a=>a.loop&&!a.paused).every(a=>a.volume<=original*.55));
 mix.configure({paused:true});assert.ok(clips.every(a=>a.paused));mix.configure({paused:false,quiet:true});assert.ok(clips.every(a=>a.paused));
 assert.equal(mix.effect('place'),true);assert.equal(clips.at(-1).volume,.08*.55);
 mix.configure({quiet:false});doc.visibilityState='hidden';listeners.get('visibilitychange')();assert.ok(clips.every(a=>a.paused));assert.equal(mix.effect('jump'),false);
 doc.visibilityState='visible';listeners.get('visibilitychange')();assert.equal(clips.filter(a=>a.loop&&!a.paused).length,2);
 mix.configure({enabled:false});assert.ok(clips.every(a=>a.paused));mix.dispose();assert.equal(listeners.size,0);assert.equal(mix.effect('repair'),false);
});
test('soundscape uses only existing committed world and UI recordings',()=>{
 const paths=[...Object.values(CAMPAIGN_SOUNDS.worlds).flatMap(Object.values),...Object.values(CAMPAIGN_SOUNDS.effects)];
 for(const path of paths)assert.ok(existsSync(`public${path}`),path);
});
test('a late play promise cannot restart audio after disposal',async()=>{
 let resolve;const a={paused:true,currentTime:0,play(){return new Promise(done=>{resolve=()=>{this.paused=false;done();};});},pause(){this.paused=true;}};
 const mix=createCampaignSoundscape({audioFactory:()=>a,documentRef:null});mix.effect('pickup');mix.dispose();resolve();await Promise.resolve();await Promise.resolve();assert.equal(a.paused,true);
});
test('an interrupted play rejection cannot cancel a newer resumed request',async()=>{
 const pending=[];
 const a={paused:true,currentTime:0,play(){this.paused=false;return new Promise((resolve,reject)=>pending.push({resolve,reject}));},pause(){this.paused=true;}};
 const mix=createCampaignSoundscape({audioFactory:()=>a,documentRef:null});
 mix.effect('pickup');mix.configure({paused:true});mix.configure({paused:false});mix.effect('pickup');
 pending[0].reject(new Error('Interrupted by pause'));await Promise.resolve();
 pending[1].resolve();await Promise.resolve();assert.equal(a.paused,false);
 mix.configure({speaking:true});assert.equal(a.paused,true);mix.dispose();
});
