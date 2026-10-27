import test from 'node:test';
import assert from 'node:assert/strict';
import { createComprehensionPlayer } from '../../src/content/comprehension/playback.js';
const clip=path=>({status:'ready',path});
function fixture(){
 const notes=[],calls=[],preloads=[];let cancels=0,stops=0;
 const capture=(type,paths,options)=>calls.push({type,paths,options});
 const player=createComprehensionPlayer({onNote:n=>notes.push(n),stopOtherAudio:()=>stops++,preload:src=>{preloads.push(src);return Promise.resolve(true);},
  playSingle:(src,options)=>capture('single',[src],options),playSequence:(paths,options)=>capture('sequence',paths,options),cancelAudio:()=>cancels++
 });
 return {player,notes,calls,preloads,get cancels(){return cancels;},get stops(){return stops;}};
}
test('missing Leda has explicit feedback and never substitutes device speech',()=>{
 const f=fixture();assert.equal(f.player.play({status:'missing'}),false);assert.equal(f.calls.length,0);assert.match(f.notes.at(-1),/unavailable/);assert.equal(f.stops,1);
});
test('replay cancels the old owner and retired deliveries cannot affect the replacement',()=>{
 const f=fixture();f.player.play(clip('/first'));const old=f.calls[0].options.onDelivery;
 old({type:'started'});assert.equal(f.notes.at(-1),'Playing with Leda.');f.player.play(clip('/next'));assert.equal(f.cancels,1);
 old({type:'completed'});old({type:'failed'});assert.equal(f.notes.at(-1),'Loading Leda audio…');assert.equal(f.cancels,1);
 f.calls[1].options.onDelivery({type:'completed'});assert.equal(f.notes.at(-1),'Finished reading with Leda.');
});
test('displayed shuffled parts use the canonical one-voice sequence and warm their exact sources',()=>{
 const f=fixture(),paths=['/question','/label-a','/displayed-a','/label-b','/displayed-b'];
 assert.equal(f.player.play({status:'ready',path:'',parts:paths.map((path,i)=>({path,gapBeforeMs:i?450:0}))}),true);
 assert.deepEqual(f.calls[0].paths,paths);assert.deepEqual(f.preloads,paths);assert.equal(f.calls[0].type,'sequence');assert.equal(f.calls[0].options.gapMs,450);assert.equal(f.calls[0].options.playImmediately,true);
 f.player.stop('Audio stopped.');assert.equal(f.cancels,1);f.calls[0].options.onDelivery({type:'started'});assert.equal(f.notes.at(-1),'Audio stopped.');
});
test('another cue interruption cannot make an old workspace stop the new voice',()=>{
 const f=fixture();f.player.play(clip('/story'));f.calls[0].options.onDelivery({type:'interrupted'});assert.equal(f.notes.at(-1),'Audio stopped.');
 f.player.cancel();assert.equal(f.cancels,0,'the shared player already transferred voice ownership');
});
test('failed delivery cancels the remaining question parts and a fresh tap can recover',()=>{
 const f=fixture();f.player.play(clip('/story'));f.calls[0].options.onDelivery({type:'failed'});assert.match(f.notes.at(-1),/could not play/);assert.equal(f.cancels,1);
 assert.equal(f.player.play(clip('/story')),true);f.calls[1].options.onDelivery({type:'started'});assert.equal(f.notes.at(-1),'Playing with Leda.');
});
