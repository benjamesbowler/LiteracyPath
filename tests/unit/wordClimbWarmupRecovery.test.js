import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';
const source=fs.readFileSync('src/components/learn/games/games/WordClimbScene.jsx','utf8');
function find(node){
  if(!node||typeof node!=='object')return null;
  if(node.type==='FunctionDeclaration'&&node.id.name==='prepareScene')return node;
  for(const value of Object.values(node)){for(const child of Array.isArray(value)?value:[value]){const result=find(child);if(result)return result;}}
  return null;
}
const node=find(parse(source,{sourceType:'module',plugins:['jsx']})),production=source.slice(node.start,node.end);
function owner(status,{cancel=false}={}){
  const state=vm.createContext({warming:false,warmed:false,disposed:false,pendingReady:true,activeRegistered:null,model:null,sceneRevision:1,kit:{userData:{ready:Promise.resolve()}},scenery:{ready:Promise.resolve()},registered:{update(){},warmupTextures:()=>[]},canonicalRecovery:null,world:{},scene:{},camera:{},warmupReceipt:null,warmupRecovery:{current:null},last:123,invalidated:0,renderer:{getContext:()=>({isContextLost:()=>false})}});
  state.setRendererMode=mode=>{state.mode=mode;};state.renderGate={invalidate(){state.invalidated++;}};
  state.warmArcadeScene=async()=>{if(cancel)state.disposed=true;return{status,skippedTextures:status==='partial'?1:0};};
  vm.runInContext(production,state);return state;
}
for(const status of ['partial','failed','timeout'])test(`Climb actual ${status} warmup selects Canvas without declaring primary ready`,async()=>{
  const state=owner(status);await state.prepareScene();assert.equal(state.mode,'canvas');assert.equal(state.warmed,false);assert.equal(state.invalidated,0);assert.equal(state.warmupRecovery.current.status,status);
});
test('Climb ready warmup enables its first frame; disposed owner never revives either renderer',async()=>{
  const ready=owner('ready');await ready.prepareScene();assert.equal(ready.warmed,true);assert.equal(ready.invalidated,1);assert.equal(ready.mode,undefined);
  const cancelled=owner('failed',{cancel:true});await cancelled.prepareScene();assert.equal(cancelled.warmed,false);assert.equal(cancelled.mode,undefined);assert.equal(cancelled.warmupRecovery.current,null);
});
