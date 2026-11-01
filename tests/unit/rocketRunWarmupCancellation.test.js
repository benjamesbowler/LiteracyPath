import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parse} from '@babel/parser';
const source=readFileSync(new URL('../../src/components/learn/games/games/RocketRunGame.jsx',import.meta.url),'utf8');
const ast=parse(source,{sourceType:'module',plugins:['jsx']});
const game=ast.program.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='startGame');
const declaration=game.body.body.find(node=>node.type==='VariableDeclaration'&&node.declarations.some(item=>item.id.name==='ready')).declarations[0];
const actualReady=source.slice(declaration.init.start,declaration.init.end);
function owner(status,{disposed=false,paused=false}={}){
 const state={disposed,paused,graphicsLoading:true,graphicsWarmup:null,sceneryClosed:false,sceneryTimeout:null,settleSceneryWait:null,
  sceneryReady:Promise.resolve(),courier:{ready:Promise.resolve()},premiumRender:{prepareObject(){},render(){}},
  renderer:{},scene:{},camera:{},warmArcadeScene:async()=>({status}),hud:{dataset:{}},last:0,running:false,savedRunning:false,
  performance:{now:()=>123},setTimeout:()=>1,clearTimeout(){},roundStarts:0};
 state.startRound=()=>{state.roundStarts++;state.running=true;};
 vm.createContext(state);state.ready=vm.runInContext(actualReady,state);return state;
}
test('actual Rocket startup rejects context-loss cancellation without opening gameplay',async()=>{
 const state=owner('cancelled');await assert.rejects(state.ready,/could not finish preparing/);
 assert.equal(state.graphicsLoading,true);assert.equal(state.roundStarts,0);assert.equal(state.hud.dataset.graphicsWarmup,undefined);
});
test('actual Rocket teardown cancellation cannot revive an exited owner',async()=>{
 const state=owner('cancelled',{disposed:true});await state.ready;assert.equal(state.roundStarts,0);assert.equal(state.graphicsLoading,true);
});
test('actual Rocket ready path starts once but preserves an existing pause',async()=>{
 const state=owner('ready',{paused:true});await state.ready;assert.equal(state.roundStarts,1);assert.equal(state.graphicsLoading,false);
 assert.equal(state.running,false);assert.equal(state.savedRunning,true);assert.equal(state.last,123);
});
