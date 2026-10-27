import test from 'node:test';
import assert from 'node:assert/strict';
import {createRallyPalsFrameWindow, sampleRallyPalsFrameWindow} from '../../src/components/learn/games/games/rallyPalsFrameBudget.js';
test('Rally keeps healthy original 36-frame decision window and mean',()=>{
 const window=createRallyPalsFrameWindow();
 for(let i=0;i<35;i++)assert.equal(sampleRallyPalsFrameWindow(window,1000/60),null);
 assert.ok(Math.abs(sampleRallyPalsFrameWindow(window,1000/60)-1000/60)<1e-9);
 assert.deepEqual(window,{frames:0,elapsed:0});
});
test('Rally bounds slow windows while requiring eight real samples',()=>{
 const window=createRallyPalsFrameWindow();
 for(let i=0;i<7;i++)assert.equal(sampleRallyPalsFrameWindow(window,235),null);
 assert.equal(sampleRallyPalsFrameWindow(window,235),235);
 for(let i=0;i<11;i++)assert.equal(sampleRallyPalsFrameWindow(window,54),null);
 assert.equal(sampleRallyPalsFrameWindow(window,54),54);
});
test('Rally ignores invalid/background gaps without poisoning decisions',()=>{
 const window=createRallyPalsFrameWindow();
 for(const dt of [0,-1,NaN,Infinity,1001])assert.equal(sampleRallyPalsFrameWindow(window,dt),null);
 assert.deepEqual(window,{frames:0,elapsed:0});
});
