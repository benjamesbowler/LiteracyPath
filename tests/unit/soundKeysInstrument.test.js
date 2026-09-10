import test from 'node:test';
import assert from 'node:assert/strict';
import {phonemeForSoundKey,trySoundKey,createSoundKeysInstrument} from '../../src/features/soundkeys/instrument.js';
import {connectWebMidi} from '../../src/features/soundkeys/inputProviders.js';

test('wrong sounds preserve the correct prefix and repeated sounds need distinct presses',()=>{
 const target=['t','oa','s','t'];let prefix=[];
 for(const token of target){const wrong=trySoundKey(prefix,'z',target);assert.equal(wrong.prefix,prefix);assert.equal(wrong.correct,false);prefix=trySoundKey(prefix,token,target).prefix;}
 assert.deepEqual(prefix,target);assert.equal(trySoundKey(prefix,'t',target).prefix,prefix);
});
test('short oo and long oo use different spoken units without changing the grapheme',()=>{
 assert.equal(phonemeForSoundKey('oo',{id:'book'}),'oo_short');assert.equal(phonemeForSoundKey('oo',{id:'cook'}),'oo_short');assert.equal(phonemeForSoundKey('oo',{id:'moon'}),'oo');assert.equal(phonemeForSoundKey('oo',null),'oo');
});
test('MIDI releases and disconnects clear held notes while control messages never enter words',async()=>{
 const input={state:'connected',name:'Test keyboard',type:'input'};const access={inputs:new Map([['one',input]])};const events=[];
 const cleanup=await connectWebMidi(e=>events.push(e),{requestMIDIAccess:async()=>access});
 input.onmidimessage({data:[0x90,60,100]});input.onmidimessage({data:[0xb0,64,127]});input.onmidimessage({data:[0x80,60,20]});
 assert.equal(events.filter(e=>e.type==='midi').length,1);assert.equal(events.filter(e=>e.type==='release').length,1);
 input.state='disconnected';access.onstatechange({port:input});assert.ok(events.some(e=>e.type==='release-all'));cleanup();
});
test('musical voices are bounded and stop/dispose releases every oscillator',()=>{
 const oscillators=[];let closed=false;
 class Context{currentTime=0;destination={};resume(){return Promise.resolve();}close(){closed=true;return Promise.resolve();}createOscillator(){const o={frequency:{},connect(){},disconnect(){},start(){},stop(at){this.stopped=at;}};oscillators.push(o);return o;}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}},connect(){},disconnect(){}};}}
 const instrument=createSoundKeysInstrument(Context);instrument.play('a',60);instrument.play('b',64);assert.ok(oscillators.every(o=>o.stopped<=1.3));instrument.release("a");assert.equal(oscillators[0].stopped,.3,"a tap keeps a short audible attack");instrument.stop();assert.ok(oscillators.every(o=>o.stopped===0),"pause also cuts already-released tails");instrument.dispose();assert.equal(closed,true);
});
