import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {warmArcadeScene} from '../../src/components/learn/games/shared/arcadeSceneWarmup.js';
function fixture(){
 let time=0,active=true,lost=false,ready=false;const calls=[];
 const textures=[{isTexture:true,image:{width:2,height:2}},{isTexture:true,image:{width:2,height:2}}],material={map:textures[0],normalMap:textures[1]};
 const program={program:{},isReady:()=>ready,getUniforms:()=>calls.push('uniforms'),getAttributes:()=>calls.push('attributes')};
 const renderer={getContext:()=>({isContextLost:()=>lost}),initTexture:t=>{calls.push(t);time+=5;},compile:()=>{calls.push('compile');return new Set([material]);},properties:{get:()=>({currentProgram:program})}};
 const args={renderer,scene:{traverse:fn=>{fn({material});fn({material});}},camera:{},isCurrent:()=>active,now:()=>time,renderFrame:()=>calls.push('render'),yieldTask:async()=>{calls.push('yield');time++;ready=true;}};
 return {args,calls,program,setActive:value=>active=value,setLost:value=>lost=value,setTime:value=>time=value};
}
test('staged texture upload deduplicates maps and prepares first use before one warm frame',async()=>{
 const {args,calls}=fixture();const receipt=await warmArcadeScene(args);
 assert.equal(receipt.status,'ready');assert.equal(receipt.textures,2);assert.equal(receipt.programs,1);
 assert.deepEqual(calls.filter(x=>typeof x==='string'),['yield','yield','compile','uniforms','attributes','yield','render']);
});
test('Exit during texture work never compiles or renders the disposed owner',async()=>{
 const f=fixture();f.args.yieldTask=async()=>f.setActive(false);
 assert.equal((await warmArcadeScene(f.args)).status,'cancelled');assert.equal(f.calls.length,1);
});
test('context loss during parallel compilation exits before touching invalid programs',async()=>{
 const f=fixture();f.args.budgetMs=100;f.args.yieldTask=async()=>{f.setLost(true);f.program.getUniforms=()=>assert.fail('disposed program accessed');};
 assert.equal((await warmArcadeScene(f.args)).status,'cancelled');assert.ok(!f.calls.includes('render'));
});
test('missing/disposed programs and stalled compiles cannot keep loading forever',async()=>{
 const f=fixture();f.program.program=undefined;assert.equal((await warmArcadeScene(f.args)).status,'cancelled');
 const g=fixture();g.args.budgetMs=100;g.args.yieldTask=async()=>g.setTime(10001);
 assert.equal((await warmArcadeScene(g.args)).status,'timeout');assert.ok(!g.calls.includes('render'));
});
test('unsupported renderers warm once with ownership guard; upload failure stays explicit',async()=>{
 const f=fixture();delete f.args.renderer.compile;assert.equal((await warmArcadeScene(f.args)).status,'unsupported');assert.equal(f.calls.filter(c=>c==='render').length,1);
 const g=fixture();g.args.renderer.initTexture=()=>{throw new Error('upload failed');};const receipt=await warmArcadeScene(g.args);assert.equal(receipt.status,'failed');assert.equal(receipt.error,'upload failed');
});
test('version-sensitive adapter matches installed Three 0.185.1 readiness interface',()=>{
 const pkg=JSON.parse(fs.readFileSync(new URL('../../node_modules/three/package.json',import.meta.url)));assert.equal(pkg.version,'0.185.1','Review warmup adapter when updating Three');
 const renderer=fs.readFileSync(new URL('../../node_modules/three/src/renderers/WebGLRenderer.js',import.meta.url),'utf8');
 assert.match(renderer,/const program = materialProperties.currentProgram/);assert.match(renderer,/program.isReady\(\)/);
});
test('inactive action textures warm once alongside material maps before play',async()=>{
 const f=fixture(),inactive={isTexture:true,image:{width:2,height:2}},active={isTexture:true,image:{width:2,height:2}};f.args.extraTextures=[inactive,inactive,active];
 f.args.scene.traverse=fn=>fn({material:{map:active}});
 const receipt=await warmArcadeScene(f.args);assert.equal(receipt.textures,2);assert.equal(f.calls.filter(c=>c===inactive).length,1);
});

test('pending or disposed image sources are explicit partial readiness and never uploaded or warm-rendered',async()=>{
 const f=fixture(),missing={isTexture:true,image:null,name:'pending-driver'},incomplete={isTexture:true,image:{complete:false}};
 f.args.extraTextures=[missing,incomplete];
 const receipt=await warmArcadeScene(f.args);assert.equal(receipt.status,'partial');assert.equal(receipt.skippedTextures,2);
 assert.equal(receipt.skippedTextureDetails[0].name,'pending-driver');assert.equal(receipt.skippedTextureDetails[0].source,'extraTextures[0]');
 assert.ok(!f.calls.includes(missing)&&!f.calls.includes(incomplete)&&!f.calls.includes('render'));
});
