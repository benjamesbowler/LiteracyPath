import test from 'node:test';
import assert from 'node:assert/strict';
import { wordTargetLayout, hopscotchRoutes, hopPosition, practiceEvidence } from '../../src/components/learn/games/games/phonicsPlayModel.js';
test('moving words remain readable and disjoint across compact viewports and motion phases', () => {
  for (const [width,height] of [[390,450],[568,160],[844,226],[1024,500]]) for (const time of [0,1,5,20,100]) {
    const layout=wordTargetLayout(width,height,['the','because','you','where','little','should'],time);
    for(const item of layout) {
      assert.ok(item.width>=56 && item.height>=56);
      assert.ok(item.x-item.width/2>=0 && item.x+item.width/2<=width);
      assert.ok(item.y-item.height/2>=0 && item.y+item.height/2<=height);
    }
    for(let i=0;i<layout.length;i++)for(let j=i+1;j<layout.length;j++) {
      const a=layout[i],b=layout[j];
      assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2+8 || Math.abs(a.y-b.y)>=(a.height+b.height)/2+8);
    }
  }
});
test('hopscotch authors persistent forward forks with individually identified repeated words', () => {
  const sentences=['The cat and the dog can run.','I can see a red sun.'];
  const routes=hopscotchRoutes(sentences);
  assert.deepEqual(routes,hopscotchRoutes(sentences));
  const steps=routes.flat(); const ids=steps.flat().map(s=>s.id);
  assert.equal(new Set(ids).size,ids.length);
  for(let i=0;i<steps.length;i++){
    assert.equal(steps[i].filter(s=>s.accepted).length,1);
    assert.notEqual(steps[i][0].word,steps[i][1].word);
    if(i)assert.ok(steps[i][0].x>steps[i-1][0].x);
  }
  assert.equal(new Set(steps.map(pair=>pair.find(s=>s.accepted).y)).size,2);
});
test('jump lands on the chosen world coordinate and can reverse safely', () => {
  const from={x:60,y:.76},to={x:180,y:.35};
  assert.deepEqual(hopPosition(from,to,0),{...from,lift:0});
  assert.ok(hopPosition(from,to,.5).lift>60);
  const landed=hopPosition(from,to,1);assert.equal(landed.x,to.x);assert.equal(landed.y,to.y);
  assert.equal(hopPosition(to,from,1).x,from.x);
});
test('supported play evidence never claims an independent assessment or measured audio', () => {
  assert.deepEqual(practiceEvidence('construction',['picture']),{construct:'construction',supportUsed:['picture'],practiceOnly:true,independent:false,audioDelivery:'not_measured'});
});

test('session snapshots isolate learners and modes, require matching checkpoints, and clear at completion',async()=>{
 const {phonicsSessionKey,loadPhonicsSession,savePhonicsSession}=await import('../../src/components/learn/games/games/phonicsSession.js');
 const original=globalThis.localStorage,storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 try{
  const key=phonicsSessionKey('learner-a','build','easy');assert.notEqual(key,phonicsSessionKey('learner-b','build','easy'));assert.notEqual(key,phonicsSessionKey('learner-a','memory','easy'));
  const saved={round:2,gameState:{rounds:[{word:'cat'}]},score:25,correct:1,stage:{round:2,data:{placed:[{id:'cat-0',grapheme:'c'}]}}};savePhonicsSession(key,saved);assert.deepEqual(loadPhonicsSession(key,2),{...saved,v:1});assert.equal(loadPhonicsSession(key,0),null);
  storage.set(key,'broken-json');assert.equal(loadPhonicsSession(key,2),null);savePhonicsSession(key,saved);savePhonicsSession(key,null);assert.equal(storage.has(key),false);
  globalThis.localStorage.setItem=()=>{throw Error('full');};assert.doesNotThrow(()=>savePhonicsSession(key,saved));
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});
