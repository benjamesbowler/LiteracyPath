import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';
function loopSource(game){
  const text=fs.readFileSync(`src/components/learn/games/games/${game}Game.jsx`,'utf8');
  const ast=parse(text,{sourceType:'module',plugins:['jsx']});
  const engine=ast.program.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='startGame');
  const loop=engine.body.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='loop');
  return text.slice(loop.start,loop.end);
}
const common=()=>({requestAnimationFrame:()=>1,rafId:0,last:100,performance:{now:()=>110},document:{hidden:false},paused:false,steps:0,update(){this.steps++;},render(){},renderMetrics:{frame(){}},frameMetrics:{frame(){}}});
test('Letter Leap queued pre-resume timestamp cannot subtract accumulator time or rewind last',()=>{
  const scope=vm.createContext({...common(),FIXED_STEP:1/60,frameAccumulator:.008,running:false,player:null,idleFrameDrawn:true,lastArtRevision:0,sceneKit:{revision:()=>0}});
  scope.update=()=>{scope.steps++;};vm.runInContext(loopSource('LetterLeap'),scope);
  scope.loop(90);assert.equal(scope.last,100);assert.equal(scope.frameAccumulator,.008);assert.equal(scope.steps,0);
  scope.loop(108);assert.equal(scope.steps,0);scope.loop(117);assert.equal(scope.steps,1);
});
test('Word Bridge zero or queued pre-resume timestamps never manufacture a step',()=>{
  const scope=vm.createContext({...common(),running:true,saveHeld:false,stepRemainder:0,builder:null,pals:[],particles:[],floats:[],cameraX:0,sceneTime:0,presentation:{capture(){}},renderAlpha:0,idleFrameDrawn:false});
  scope.update=()=>{scope.steps++;};vm.runInContext(loopSource('WordBridge'),scope);
  scope.loop(100);scope.loop(100);scope.loop(90);assert.equal(scope.last,100);assert.equal(scope.stepRemainder,0);assert.equal(scope.steps,0);
  scope.loop(116);assert.equal(scope.steps,0);scope.loop(117);assert.equal(scope.steps,1);
});
