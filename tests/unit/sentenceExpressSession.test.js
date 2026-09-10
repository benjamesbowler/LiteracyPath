import test from 'node:test';
import assert from 'node:assert/strict';
import { expressSessionKey, loadExpressSnapshot, saveExpressSnapshot } from '../../src/components/learn/games/games/sentenceExpressSession.js';
test('train snapshots preserve individual instances, repairs, retry evidence, and a level boundary', () => {
 const values=new Map(); globalThis.localStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const key=expressSessionKey('pupil-a','hard');
 const state={levelIndex:2,trainIndex:1,coupled:[0,3,2],queue:['hard-l2-t0'],rustyFixed:true,gapFilled:false,delay:2,mistakes:4,express:1};
 saveExpressSnapshot(key,state);assert.deepEqual(loadExpressSnapshot(key,2),{...state,v:1});assert.equal(loadExpressSnapshot(key,3),null);assert.equal(loadExpressSnapshot(expressSessionKey('pupil-b','hard'),2),null);assert.equal(loadExpressSnapshot(expressSessionKey('pupil-a','easy'),2),null);
 saveExpressSnapshot(key,null);assert.equal(loadExpressSnapshot(key,2),null);delete globalThis.localStorage;
});
test('missing, corrupted or unavailable storage never prevents a new train',()=>{
 globalThis.localStorage={getItem:()=>'{bad',setItem:()=>{throw Error('full');},removeItem:()=>{throw Error('blocked');}};
 assert.equal(loadExpressSnapshot('key',0),null);assert.doesNotThrow(()=>saveExpressSnapshot('key',{levelIndex:0}));assert.doesNotThrow(()=>saveExpressSnapshot('key',null));delete globalThis.localStorage;
});
