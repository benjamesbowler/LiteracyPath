import assert from 'node:assert/strict';
import test from 'node:test';
import {groupCompletionKey,groupCompletionPrefix,readGroupCompletion,saveGroupCompletion} from '../../src/content/comprehension/groupCompletion.js';

function fixture(){const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
const ids=['muddy-mat','pip-bag'];

test('whole-group checks survive reload and can be cleared without changing another passage',()=>{
 const storage=fixture(),scope='teacher:a:class:k-co';
 assert.deepEqual(readGroupCompletion(storage,scope,ids),{completed:[],status:'ready'});
 assert.equal(saveGroupCompletion(storage,scope,ids[0],true),true);
 assert.equal(saveGroupCompletion(storage,scope,ids[1],true),true);
 assert.deepEqual(readGroupCompletion(storage,scope,ids).completed,ids);
 assert.equal(saveGroupCompletion(storage,scope,ids[0],false),true);
 assert.deepEqual(readGroupCompletion(storage,scope,ids).completed,[ids[1]]);
});

test('account and class scopes cannot borrow checks from one another',()=>{
 const storage=fixture();
 saveGroupCompletion(storage,'teacher:a:class:one',ids[0],true);
 assert.deepEqual(readGroupCompletion(storage,'teacher:b:class:one',ids).completed,[]);
 assert.deepEqual(readGroupCompletion(storage,'teacher:a:class:two',ids).completed,[]);
 assert.deepEqual(readGroupCompletion(storage,'teacher:a:class:one',ids).completed,[ids[0]]);
 assert.notEqual(groupCompletionKey('a:b','c'),groupCompletionKey('a','b:c'));
 assert.notEqual(groupCompletionPrefix('a:'),groupCompletionPrefix('a'));
});

test('no class has no shared fallback key and cannot persist checks',()=>{
 const storage=fixture();
 for(const scope of ['',null,undefined,'   ']){
  assert.equal(groupCompletionPrefix(scope),null);
  assert.equal(groupCompletionKey(scope,ids[0]),null);
  assert.deepEqual(readGroupCompletion(storage,scope,ids),{completed:[],status:'needs-class'});
  assert.equal(saveGroupCompletion(storage,scope,ids[0],true),false);
 }
 assert.equal(storage.values.size,0);
});

test('malformed records stay unchecked without discarding other valid passage checks',()=>{
 const storage=fixture(),scope='teacher:a:class:one';
 saveGroupCompletion(storage,scope,ids[1],true);
 for(const record of ['{broken','null','[]','true','{"version":2,"passageId":"muddy-mat","completed":true}','{"version":1,"passageId":"pip-bag","completed":true}','{"version":1,"passageId":"muddy-mat","completed":"true"}']){
  storage.setItem(groupCompletionKey(scope,ids[0]),record);
  assert.deepEqual(readGroupCompletion(storage,scope,ids),{completed:[ids[1]],status:'invalid'});
 }
});

test('missing and denied browser storage reports unsaved state without throwing',()=>{
 const denied={getItem(){throw Error('denied');},setItem(){throw Error('quota');}};
 for(const storage of [null,denied]){
  assert.deepEqual(readGroupCompletion(storage,'class',ids),{completed:[],status:'unavailable'});
  assert.equal(saveGroupCompletion(storage,'class',ids[0],true),false);
 }
});

test('student practice and print-pack choices never stand in for whole-group completion',()=>{
 const storage=fixture();
 storage.setItem('lp-comprehension:teacher:a:class:one:muddy-mat',JSON.stringify({completed:true,reads:[true,true,true]}));
 storage.setItem('lp-comprehension-selection:teacher:a:class:one','muddy-mat');
 assert.deepEqual(readGroupCompletion(storage,'teacher:a:class:one',ids),{completed:[],status:'ready'});
});

test('only requested known passage IDs are loaded, without duplicate results',()=>{
 const storage=fixture(),scope='class';
 saveGroupCompletion(storage,scope,ids[0],true);
 saveGroupCompletion(storage,scope,'retired-passage',true);
 assert.deepEqual(readGroupCompletion(storage,scope,[...ids,ids[0]]).completed,[ids[0]]);
 assert.equal(saveGroupCompletion(storage,scope,ids[0],'true'),false);
 assert.equal(saveGroupCompletion(storage,scope,'',true),false);
});
