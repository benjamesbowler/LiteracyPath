import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSportsFrameTelemetry} from '../../src/utils/sportsArcadePerformance.js';

// Exercise the actual DEV closure without importing React or constructing a
// renderer. The production engine and its existing sampler remain the owners.
const source=readFileSync(new URL('../../src/components/learn/games/games/GrammarGrindGame.jsx',import.meta.url),'utf8');
const start=source.indexOf('  function readRenderingReceipt() {');
const end=source.indexOf('\n  const api = {',start);
assert.ok(start>=0&&end>start,'the real diagnostic closure is present');
const diagnostic=source.slice(start,end).replaceAll('import.meta.env.DEV','DEV');
const teardown=source.match(/running = false;\n\s*if\(import\.meta\.env\.DEV\)\{delete mount\.skatePrepareAthleteCandidate;[^\n]+\}/)?.[0];
assert.ok(teardown,'the actual engine removes its owned DEV properties');
const make=new Function('deps','DEV',`
  const {mount,renderer,frameTelemetry,presentationHost,premiumRender,document}=deps;
  let running=true;
  const qualityTier='low',graphicsLoading=false,assetsLoading=false,paused=false,completed=false;
  const requestedRendererFallback={from:'low',to:'canvas',reason:'sustained-severe-frames'};
  ${diagnostic}
  return {mount,read:readRenderingReceipt,close(){${teardown.replaceAll('import.meta.env.DEV','DEV')}}};
`);

function fixture({contextKind='active',debug=true,dev=true}={}){
  let now=0,clockReads=0;
  const calls=[];
  const telemetry=createSportsFrameTelemetry({now:()=>{clockReads++;return now;}});
  for(let i=0;i<5;i++){now+=16;telemetry.rendered(16,{tier:'canvas',cpuStart:now-2});}
  const attributes={alpha:false,antialias:true};
  const extension={UNMASKED_VENDOR_WEBGL:91,UNMASKED_RENDERER_WEBGL:92};
  const parameters=new Map([[1,'masked vendor'],[2,'masked renderer'],[3,'WebGL2'],[4,'GLSL'],[91,'actual vendor'],[92,'actual renderer']]);
  const context=contextKind==='unavailable'?null:{
    VENDOR:1,RENDERER:2,VERSION:3,SHADING_LANGUAGE_VERSION:4,
    isContextLost(){calls.push('isContextLost');if(contextKind==='throwing')throw Error('unavailable');return contextKind==='lost';},
    getExtension(name){calls.push(`extension:${name}`);if(contextKind==='throwing')throw Error('unavailable');return debug?extension:null;},
    getParameter(key){calls.push(`parameter:${key}`);if(contextKind==='throwing')throw Error('unavailable');return parameters.get(key);},
    getContextAttributes(){calls.push('attributes');if(contextKind==='throwing')throw Error('unavailable');return attributes;}
  };
  const renderer={
    getContext(){calls.push('existing-context');return context;},
    getPixelRatio(){calls.push('pixelRatio');return 1;},
    domElement:{width:1280,height:900,isConnected:true},
    info:{render:{calls:69,triangles:400},memory:{geometries:7,textures:4}}
  };
  const document={visibilityState:'visible',hasFocus:()=>true};
  const mount={skatePrepareAthleteCandidate:()=>{},skateAthleteFormat:()=>{},skateAthleteComparison:()=>{}};
  const deps={mount,renderer,frameTelemetry:telemetry,presentationHost:{mode:'three',reason:null},premiumRender:{effectiveTier:'low'},document};
  const engine=make(deps,dev);
  return {...engine,renderer,context,calls,attributes,telemetry,clockReads:()=>clockReads,deps};
}

test('receipt reads the existing context and frame ledger without sampling, allocation, reset or live GL leakage',()=>{
  const f=fixture(),before=f.telemetry.snapshot(),rows=f.telemetry.snapshotFrameRows(),reads=f.clockReads();
  const receipt=f.mount.skateRenderingReceipt;
  assert.equal(f.clockReads(),reads);
  assert.deepEqual(f.telemetry.snapshot(),before);
  assert.deepEqual(receipt.frameRows,rows);
  assert.equal(receipt.context.unmaskedRenderer,'actual renderer');
  assert.equal(receipt.context.maskedRenderer,'masked renderer');
  assert.deepEqual(receipt.context.drawingBufferSize,[1280,900]);
  assert.equal(receipt.page.focused,true);
  assert.equal(f.calls.filter(x=>x==='existing-context').length,1);
  assert.ok(f.calls.every(x=>x==='existing-context'||x==='isContextLost'||x==='pixelRatio'||x==='attributes'||x.startsWith('extension:')||x.startsWith('parameter:')));
  assert.ok(!Object.values(receipt.context).includes(f.context));
  assert.equal(receipt.activeMode,'three');
});

test('masked-only, lost, unavailable and throwing contexts retain honest boundaries',()=>{
  const masked=fixture({debug:false}).read();
  assert.equal(masked.context.debugExtensionAvailable,false);assert.equal(masked.context.unmaskedRenderer,null);assert.equal(masked.context.maskedRenderer,'masked renderer');
  for(const contextKind of ['lost','unavailable','throwing']){
    const f=fixture({contextKind}),receipt=f.read();
    assert.equal(receipt.context.status,{lost:'lost',unavailable:'unavailable',throwing:'unknown'}[contextKind]);
    assert.equal(receipt.context.unmaskedRenderer,null);assert.equal(receipt.context.maskedRenderer,null);
    assert.equal(receipt.context.attributes,null);
    if(contextKind==='lost')assert.ok(!f.calls.some(x=>x.startsWith('parameter:')||x.startsWith('extension:')||x==='attributes'));
  }
  const noAttributes=fixture();noAttributes.context.getContextAttributes=()=>null;
  assert.equal(noAttributes.read().context.attributes,null);
});

test('returned attributes, memory, render rows and quality receipts cannot mutate live engine state',()=>{
  const f=fixture(),receipt=f.read();
  receipt.context.attributes.antialias=false;receipt.context.drawingBufferSize[0]=0;
  receipt.lastThreeInfo.calls=0;receipt.lastThreeInfo.memory.textures=0;
  receipt.frameRows.rows[0].frameMs=0;receipt.frameRows.rows.length=0;
  receipt.qualityChange.to='high';
  const next=f.read();
  assert.equal(next.context.attributes.antialias,true);assert.equal(next.context.drawingBufferSize[0],1280);
  assert.equal(next.lastThreeInfo.calls,69);assert.equal(next.lastThreeInfo.memory.textures,4);
  assert.equal(next.frameRows.rows.length,5);assert.equal(next.frameRows.rows[0].frameMs,16);assert.equal(next.qualityChange.to,'canvas');
  assert.equal(f.renderer.info.memory.textures,4);
});

test('DEV binding expires with actual teardown, even for a previously retained getter',()=>{
  const f=fixture(),getter=Object.getOwnPropertyDescriptor(f.mount,'skateRenderingReceipt').get;
  assert.equal(getter().activeMode,'three');
  f.close();
  for(const key of ['skateRenderingReceipt','skatePrepareAthleteCandidate','skateAthleteFormat','skateAthleteComparison'])assert.equal(Object.hasOwn(f.mount,key),false);
  const before=f.calls.length;assert.equal(getter(),null);assert.equal(f.calls.length,before);
  f.close();assert.equal(f.read(),null);
  assert.equal(Object.hasOwn(fixture({dev:false}).mount,'skateRenderingReceipt'),false);
});
