import test from 'node:test';
import assert from 'node:assert/strict';
import {skateCanvasSurfaces,createSportsRendererHost,clipSportsCanvasPolygon,prepareRacerHorizonPanels,createRacerMaterialMipOwner} from '../../src/components/learn/games/games/sportsCanvasRenderer.js';
import * as THREE from 'three';
import {sampleSkateSurface} from '../../src/components/learn/games/games/spellSkatePark.js';

test('Canvas preserves the real curved ramp, quarter-pipe, concave bowl and elevated contact decks',()=>{
 const ramps=[{x:12,z:-8,rot:.7,width:10,depth:12,height:4},{x:-10,z:30,rot:-.4,width:12,depth:8,height:8,kind:'quarter'},{x:40,z:40,rot:0,radius:12,height:3,kind:'bowl'}];
 const decks=[{x:-25,z:-25,rot:.2,width:9,depth:11,height:2}];const faces=skateCanvasSurfaces(ramps,decks);
 for(const [x,z]of[[12,-8],[-10,30],[40,40],[46,40],[-25,-25]]){
  const authority=sampleSkateSurface(x,z,ramps,decks).height;
  if(x===40&&z===40)assert.ok(faces.some(face=>face.points.some(p=>p.x===x&&p.z===z&&p.y===authority)));
  else if(x===46)assert.ok(faces.some(face=>face.points.some(p=>Math.abs(p.x-x)<1e-9&&Math.abs(p.z-z)<1e-9&&Math.abs(p.y-authority)<1e-9)));
  else assert.ok(faces.some(face=>face.points.some(p=>Math.abs(p.y-authority)<1e-9)),`Contact height ${authority} remains in rendered riding surfaces`);
 }
 assert.ok(faces.every(face=>face.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z))));
 assert.ok(faces.some(face=>face.points.some(p=>p.y===8)));
});

test('renderer recovery releases the old GPU owner and existing resize calls reach only the current Canvas',()=>{
 const savedDocument=globalThis.document;const calls=[];
 const canvas={style:{cssText:'position:absolute'},remove(){calls.push('removed');},getContext:()=>({}),width:0,height:0};
 globalThis.document={createElement:()=>({...canvas,style:{cssText:''}})};
 const old={domElement:{...canvas,parentNode:{insertBefore(){calls.push('insert');}}},dispose(){calls.push('disposed');},forceContextLoss(){calls.push('lost');},setSize(){calls.push('old-size');}};
 try{
  const host=createSportsRendererHost(()=>old),proxy=host.renderer;proxy.setSize(10,20);host.switchCanvas('measured-frame-budget');proxy.setPixelRatio(1.5);proxy.setSize(320,568,false);
  assert.deepEqual(calls,['old-size','insert','removed','disposed','lost']);assert.equal(host.mode,'canvas');assert.equal(proxy.domElement.width,480);assert.equal(proxy.domElement.height,852);
  host.switchCanvas('another-request');assert.equal(calls.filter(c=>c==='disposed').length,1);proxy.dispose();assert.equal(proxy.domElement.width,1);
  const failed=createSportsRendererHost(()=>{throw new Error('No WebGL');});assert.equal(failed.mode,'canvas');assert.equal(failed.reason,'webgl-unavailable');
 }finally{globalThis.document=savedDocument;}
});

test('a riding surface crossing behind the chase camera remains clipped continuously under the vehicle',()=>{
 const camera=new THREE.PerspectiveCamera(60,1,.1,100);camera.updateMatrixWorld(true);
 const points=[{x:-5,y:0,z:2},{x:5,y:0,z:2},{x:5,y:0,z:-10},{x:-5,y:0,z:-10}];
 const clipped=clipSportsCanvasPolygon(camera,points);assert.equal(clipped.length,4);assert.ok(clipped.every(point=>point.z<=-.12+1e-12));assert.equal(clipped.filter(point=>Math.abs(point.z+.12)<1e-12).length,2);
 assert.deepEqual(clipSportsCanvasPolygon(camera,points.map(p=>({...p,z:2}))),[]);
});

test('working horizon surfaces retain source resolution and exact crop ownership, close scratch masks immediately and last owners on repeated disposal',()=>{
  for(const [world,expected]of [['meadow',1],['moonwood',1],['dino',4]]){
    const created=[],source={width:1774,height:887};
    const makeCanvas=()=>{
      const calls=[],ctx={drawImage(...args){calls.push(args);},fillRect(){},createLinearGradient(){return{addColorStop(){}};}};
      const canvas={width:0,height:0,calls,getContext(){return ctx;}};created.push(canvas);return canvas;
    };
    const bank=prepareRacerHorizonPanels(source,world,makeCanvas),unique=new Set(bank.panels.map(panel=>panel.surface));
    assert.equal(unique.size,expected);assert.equal(created.length,expected*2);assert.equal(bank.panels.length,8);
    const bytes=[...unique].reduce((sum,canvas)=>sum+canvas.width*canvas.height*4,0);assert.equal(bank.snapshot().rgbaBytes,bytes);
    for(const canvas of created.filter(canvas=>!unique.has(canvas)))assert.deepEqual([canvas.width,canvas.height],[1,1],'Temporary alpha masks retain no decoded image storage');
    for(const canvas of unique){assert.equal(canvas.height,source.height);assert.equal(canvas.calls[0][0],source);assert.equal(canvas.calls[0][4],source.height);}
    if(world==='dino'){assert.equal(bank.panels[0].surface,bank.panels[3].surface);assert.notEqual(bank.panels[0].flip,bank.panels[3].flip);assert.equal(bank.panels[4].surface.width,source.width);}
    bank.dispose();bank.dispose();assert.equal(bank.snapshot().rgbaBytes,0);assert.equal(bank.panels.length,0);
    for(const canvas of unique)assert.deepEqual([canvas.width,canvas.height],[1,1]);
    assert.deepEqual(source,{width:1774,height:887},'The retained source belongs to its separate decoded image owner');
  }
});

test('bounded material mips inherit only the existing prepared source and release derived backing surfaces without closing another source owner',()=>{
  const base={width:512,height:512},created=[];
  const owner=createRacerMaterialMipOwner(base,()=>{const canvas={width:0,height:0,getContext(){return{drawImage(...args){canvas.source=args[0];}};}};created.push(canvas);return canvas;});
  assert.deepEqual(owner.levels.map(canvas=>canvas.width),[512,256,128,64,32,16,8,4,2,1]);assert.equal(owner.snapshot().derivedRgbaBytes,349524);
  for(let index=1;index<owner.levels.length;index++)assert.equal(owner.levels[index].source,owner.levels[index-1]);
  owner.dispose();owner.dispose();assert.equal(owner.levels.length,0);assert.equal(owner.snapshot().derivedRgbaBytes,0);
  assert.ok(created.every(canvas=>canvas.width===1&&canvas.height===1));assert.deepEqual(base,{width:512,height:512});
});
