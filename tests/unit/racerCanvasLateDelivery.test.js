import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import * as THREE from 'three';
import {createRacerCanvasPresentation,createSkateCanvasPresentation} from '../../src/components/learn/games/games/sportsCanvasRenderer.js';
import {SPORTS_SKATER_READY_REGISTRY} from '../../src/components/learn/games/games/sportsSkaterReadyRegistry.js';
import {SPORTS_SKATER_READY_PAIR_BYTES} from '../../src/components/learn/games/games/sportsSkaterReadyAtlas.js';
import {SPORTS_SHARP_ART_REGISTRY} from '../../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {SPORTS_JUMP_ROWS} from '../../src/components/learn/games/games/sportsJumpRowRegistry.js';

test('late actual registered sheet decode and scene image arrivals cannot allocate material pyramids or revive a disposed Canvas owner',async()=>{
  const originals={fetch:globalThis.fetch,Image:globalThis.Image,document:globalThis.document,createImageBitmap:globalThis.createImageBitmap};
  const images=[],canvases=[],bitmap={width:1536,height:2304,closed:0,close(){this.closed++;}};let deliverAtlas;
  globalThis.fetch=async url=>{
    const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));
    return{ok:true,json:async()=>JSON.parse(bytes.toString()),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  };
  globalThis.createImageBitmap=()=>new Promise(resolve=>deliverAtlas=()=>resolve(bitmap));
  globalThis.Image=class{
    constructor(){this.width=1024;this.height=1024;images.push(this);}
    set src(value){this.source=value;if(value)this.deliver=this.onload;}
    get src(){return this.source;}
  };
  globalThis.document={createElement(){const canvas={width:0,height:0,getContext(){return{drawImage(){},fillRect(){},createLinearGradient(){return{addColorStop(){}};}};}};canvases.push(canvas);return canvas;}};
  let game;
  try{
    game=createRacerCanvasPresentation({world:'meadow',renderer:{domElement:{width:1440,height:900}},camera:new THREE.PerspectiveCamera(),
      sceneData:{urls:{horizon:'/horizon.webp',scenery:'/scenery.webp',grass:'/grass.webp',paving:'/paving.webp'},venues:[],trees:[],art:{frames:{}}},track:{path:[{x:0,y:0,z:0,heading:0},{x:0,y:0,z:-10,heading:0}]}});
    for(let attempt=0;attempt<50&&!deliverAtlas;attempt++)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(typeof deliverAtlas,'function','Registered metadata and exact fingerprint must pass before the delayed bitmap can arrive');
    game.dispose();game.dispose();for(const image of images)image.deliver();deliverAtlas();assert.equal(await game.ready,false);
    assert.equal(bitmap.closed,1);assert.equal(canvases.length,0,'Disposed late source images cannot create base materials, mips or horizon panels');
    const snapshot=game.snapshot();assert.equal(snapshot.preparedSurfaceBytes,0);assert.deepEqual(snapshot.materialWorkingMips,{});
    assert.ok(images.every(image=>image.src===''&&image.onload===null&&image.onerror===null));game.dispose();assert.equal(bitmap.closed,1);
  }finally{
    game?.dispose();Object.assign(globalThis,originals);
  }
});

test('ordinary recovery retains original ground after a pixel-equivalent clip failed its actual pacing gate',async()=>{
  const originals={fetch:globalThis.fetch,Image:globalThis.Image,document:globalThis.document,createImageBitmap:globalThis.createImageBitmap,DOMMatrix:globalThis.DOMMatrix};
  const calls={clip:0,fill:0,stroke:0},bitmap={width:1536,height:2304,close(){}};
  const context=()=>({
    drawImage(){},fillRect(){},save(){},restore(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},rect(){},ellipse(){},translate(){},scale(){},
    clip(){calls.clip++;},fill(){calls.fill++;},stroke(){calls.stroke++;},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};},
    createPattern(){return{setTransform(){}};},getImageData(_x,_y,width,height){return{data:new Uint8ClampedArray(width*height*4).fill(255)};}
  });
  globalThis.fetch=async url=>{const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));return{ok:true,json:async()=>JSON.parse(bytes.toString()),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
  globalThis.createImageBitmap=async()=>bitmap;
  globalThis.Image=class{constructor(){this.width=1024;this.height=1024;}set src(value){this.source=value;if(value)queueMicrotask(()=>this.onload?.());}get src(){return this.source;}};
  globalThis.document={createElement:()=>({width:0,height:0,getContext:context})};
  globalThis.DOMMatrix=class{constructor(values){this.values=values;}};
  let game;
  try{
    const camera=new THREE.PerspectiveCamera(60,1.6,.1,650);camera.position.set(0,3,8);camera.lookAt(0,0,-10);camera.updateMatrixWorld(true);
    game=createRacerCanvasPresentation({world:'meadow',renderer:{context:context(),domElement:{width:1440,height:900},info:{render:{},memory:{}}},camera,
      sceneData:{urls:{horizon:'/horizon.webp',scenery:'/scenery.webp',grass:'/grass.webp',paving:'/paving.webp'},venues:[],trees:[],art:{frames:{}}},
      track:{path:[{x:0,y:0,z:0,heading:0},{x:0,y:0,z:-30,heading:0}]}});
    assert.equal(await game.ready,true);assert.equal(game.snapshot().originalAthlete.format,'driver-384-tight-v2');
    game.draw({kart:{x:0,y:0,z:-5,heading:0},pose:{state:'drive',phase:.25}});
    const snapshot=game.snapshot();
    assert.equal(snapshot.groundOcclusion.enabled,false);
    assert.equal(snapshot.groundOcclusion.rectangles,0);assert.equal(snapshot.groundOcclusion.excludedArea,0);
    assert.equal(snapshot.groundOcclusion.physicalMarginPx,2);
    assert.equal(calls.clip,0,'The non-beneficial clipping experiment does not add ordinary raster work');
    assert.ok(snapshot.materialPaints.legacyFillStroke>0);assert.equal(snapshot.materialPaints.expandedFill,0);
    assert.ok(calls.fill>0&&calls.stroke>0,'Actual original material operations still execute');
    await new Promise(resolve=>setImmediate(resolve));
  }finally{game?.dispose();Object.assign(globalThis,originals);}
});

test('ordinary recovery keeps scenery low, real registered cast and word draws high, and restores context across frames, errors and final ownership',async()=>{
  const originals={fetch:globalThis.fetch,Image:globalThis.Image,document:globalThis.document,createImageBitmap:globalThis.createImageBitmap,DOMMatrix:globalThis.DOMMatrix};
  const bitmap={width:1536,height:2304,closed:0,close(){this.closed++;}},images=[];
  const makeContext=()=>{
    const stack=[],ctx={imageSmoothingEnabled:true,imageSmoothingQuality:'high',worldQualities:[],images:[],stack,
      drawImage(image){this.images.push({image,quality:this.imageSmoothingQuality,enabled:this.imageSmoothingEnabled});if(image===this.failImage)throw new Error('word drawing failed');},fillRect(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},rect(){},ellipse(){},translate(){},scale(){},
      save(){stack.push({quality:this.imageSmoothingQuality,enabled:this.imageSmoothingEnabled});},restore(){const state=stack.pop();this.imageSmoothingQuality=state.quality;this.imageSmoothingEnabled=state.enabled;},
      clip(){},fill(){this.worldQualities.push(this.imageSmoothingQuality);},stroke(){},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};},
      createPattern(){return{setTransform(){}};},getImageData(_x,_y,width,height){return{data:new Uint8ClampedArray(width*height*4).fill(255)};}
    };return ctx;
  };
  globalThis.fetch=async url=>{const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));return{ok:true,json:async()=>JSON.parse(bytes.toString()),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
  globalThis.createImageBitmap=async()=>bitmap;
  globalThis.Image=class{constructor(){this.width=1024;this.height=1024;images.push(this);}set src(value){this.source=value;if(value)queueMicrotask(()=>this.onload?.());}get src(){return this.source;}};
  globalThis.document={createElement:()=>({width:0,height:0,getContext:makeContext})};globalThis.DOMMatrix=class{constructor(values){this.values=values;}};
  let game;
  try{
    const camera=new THREE.PerspectiveCamera(60,1.6,.1,650);camera.position.set(0,3,8);camera.lookAt(0,0,-10);camera.updateMatrixWorld(true);
    const ctx=makeContext();game=createRacerCanvasPresentation({world:'meadow',renderer:{context:ctx,domElement:{width:1440,height:900},info:{render:{},memory:{}}},camera,
      sceneData:{urls:{horizon:'/horizon.webp',scenery:'/scenery.webp',grass:'/grass.webp',paving:'/paving.webp'},venues:[],trees:[],art:{frames:{}}},track:{path:[{x:0,y:0,z:0,heading:0},{x:0,y:0,z:-30,heading:0}]}});
    assert.equal(await game.ready,true);assert.equal(game.snapshot().originalAthlete.format,'driver-384-tight-v2');
    const word={width:512,height:256},gate={resolved:false,mesh:{visible:true,position:new THREE.Vector3(0,0,-12),userData:{sprite:{material:{map:{image:word}}}}}};
    const input={kart:{x:0,y:0,z:-5,heading:0},pose:{state:'drive',phase:.25},gates:[gate]};
    for(const inheritedQuality of ['high','medium']){
      ctx.imageSmoothingQuality=inheritedQuality;ctx.worldQualities=[];ctx.images=[];game.draw(input);
      assert.deepEqual(game.snapshot().sampling,{diagnostic:'inherit',before:inheritedQuality,world:'low',after:inheritedQuality,enabled:true});
      assert.ok(ctx.worldQualities.length>0&&ctx.worldQualities.every(q=>q==='low'),'Both original world-locked materials use the admitted ordinary sampling');
      for(const image of [bitmap,word]){
        const draws=ctx.images.filter(draw=>draw.image===image);assert.equal(draws.length,1,'The actual registered cast and choice image each remain present');
        assert.ok(draws.every(draw=>draw.quality==='high'&&draw.enabled));
      }
      assert.ok(ctx.images.filter(draw=>draw.image!==bitmap&&draw.image!==word).every(draw=>draw.quality==='low'),'Horizon saves do not leak actor quality into later scenery');
      assert.equal(ctx.stack.length,0);
    }
    assert.equal(game.setSamplingDiagnostic('medium'),false,'A Node/production build has no active developer sampling toggle');
    ctx.failImage=word;ctx.imageSmoothingQuality='medium';ctx.imageSmoothingEnabled=false;
    assert.throws(()=>game.draw(input),/word drawing failed/);
    assert.equal(ctx.stack.length,0);assert.equal(ctx.imageSmoothingQuality,'medium');assert.equal(ctx.imageSmoothingEnabled,false,'A failed protected draw restores the caller state as well as its inner scope');
    game.dispose();game.dispose();assert.equal(bitmap.closed,1);assert.equal(game.snapshot().sampling,null);assert.equal(game.snapshot().preparedSurfaceBytes,0);
    assert.ok(images.every(image=>image.src===''&&image.onload===null&&image.onerror===null));
    const draws=ctx.images.length;game.draw(input);assert.equal(ctx.images.length,draws,'Disposed presentation cannot reopen sources or repaint');
  }finally{game?.dispose();Object.assign(globalThis,originals);}
});

test('Skate preserves curved contacts and inherited world sampling while scoping high registered actor sampling and last owners',async()=>{
  const originals={fetch:globalThis.fetch,Image:globalThis.Image,document:globalThis.document,createImageBitmap:globalThis.createImageBitmap,DOMMatrix:globalThis.DOMMatrix};
  const ready=SPORTS_SKATER_READY_REGISTRY.meadow,readySize=ready.viewSheet;
  const fullRegistration=SPORTS_SHARP_ART_REGISTRY.skater.meadow[0];
  const fullSize=JSON.parse(fs.readFileSync(new URL('../../public'+fullRegistration.metadata,import.meta.url),'utf8')).viewSheet;
  const rowSize=[fullSize[0],SPORTS_JUMP_ROWS.meadow.rows[0].decodedBytes/(4*fullSize[0])];
  const bitmap={width:readySize[0],height:readySize[1],closed:0,close(){this.closed++;}},images=[],stack=[],otherBitmaps=[],bitmapDecodes=[];
  const ctx={imageSmoothingEnabled:true,imageSmoothingQuality:'medium',draws:[],fillCount:0,
    drawImage(image){this.draws.push({image,quality:this.imageSmoothingQuality,enabled:this.imageSmoothingEnabled});if(image===this.failImage)throw new Error('actor drawing failed');},fillRect(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},ellipse(){},
    save(){stack.push({quality:this.imageSmoothingQuality,enabled:this.imageSmoothingEnabled});},restore(){const previous=stack.pop();this.imageSmoothingQuality=previous.quality;this.imageSmoothingEnabled=previous.enabled;},fill(){this.fillCount++;},stroke(){},
    createPattern(){return{setTransform(){}};}};
  globalThis.fetch=async url=>{const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));return{ok:true,json:async()=>JSON.parse(bytes.toString()),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
  globalThis.createImageBitmap=blob=>{
    const work=(async()=>{
      const metadata=await sharp(Buffer.from(await blob.arrayBuffer())).metadata();
      const size=[metadata.width,metadata.height];
      if(JSON.stringify(size)===JSON.stringify(readySize))return bitmap;
      assert.ok([fullSize,rowSize].some(expected=>JSON.stringify(expected)===JSON.stringify(size)),'Only the current registered essential, full-sheet or compact-row dimensions can decode');
      const image={width:metadata.width,height:metadata.height,closed:0,close(){this.closed++;}};otherBitmaps.push(image);return image;
    })();bitmapDecodes.push(work);return work;
  };
  globalThis.Image=class{constructor(){this.width=1024;this.height=1024;images.push(this);}set src(value){this.source=value;if(value)queueMicrotask(()=>this.onload?.());}get src(){return this.source;}};
  globalThis.DOMMatrix=class{scale(){return this;}};
  let game;
  try{
    const camera=new THREE.PerspectiveCamera(60,1.6,.1,650);camera.position.set(0,3,8);camera.lookAt(0,0,-10);camera.updateMatrixWorld(true);
    game=createSkateCanvasPresentation({world:'meadow',renderer:{context:ctx,domElement:{width:1440,height:900},info:{render:{},memory:{}}},camera,
      sceneData:{urls:{horizon:'/horizon.webp',scenery:'/scenery.webp',concrete:'/concrete.webp'},venues:[],trees:[],art:{frames:{}}},
      ramps:[{x:0,z:-25,rot:0,width:10,depth:8,height:3,kind:'quarter'}],platforms:[],rails:[]});
    assert.equal(await game.ready,true);
    const input={player:{pos:{x:0,z:-5},yaw:0,onGround:true,air:0},state:'coast',phase:.25,groundHeight:0};
    game.draw(input);const snapshot=game.snapshot();
    assert.equal(snapshot.deliveryStrategy,'ready-coast0/all-jump/full-state','Normal rendering owns the admitted essential atlas and original full-state fallback without a DEV query');
    assert.equal(snapshot.originalAthlete.strategy,'initial-coast0/all-jump-directions');
    assert.equal(snapshot.originalAthlete.maximumOwners,2);
    assert.equal(snapshot.originalAthlete.maximumPairBytes,SPORTS_SKATER_READY_PAIR_BYTES);
    assert.equal(snapshot.ridingFaces,96);assert.equal(snapshot.originalAthlete.delivery,'delivered');
    assert.equal(snapshot.pose.state,'coast');assert.equal(snapshot.pose.phase,.25);assert.ok(snapshot.originalAthlete.decodedBytes>=ready.decodedBytes&&snapshot.originalAthlete.decodedBytes<=SPORTS_SKATER_READY_PAIR_BYTES);
    assert.equal(snapshot.originalAthlete.format,ready.format);
    assert.equal('image' in snapshot.heroDraw,false,'Read-only drawing registration never exposes or clones an owned bitmap');
    const originalSource=game.snapshot().heroDraw.source;snapshot.heroDraw.source[0]=-1;
    assert.deepEqual(game.snapshot().heroDraw.source,originalSource,'Inspector callers cannot mutate the actual drawing registration');
    assert.ok(ctx.draws.some(draw=>draw.image===bitmap),'The actual registered skater sheet remains in the physical riding presentation');
    assert.ok(ctx.draws.filter(draw=>draw.image===bitmap).every(draw=>draw.quality==='high'&&draw.enabled),'Registered source actor stays high without changing the world');
    assert.ok(ctx.draws.filter(draw=>draw.image!==bitmap).every(draw=>draw.quality==='medium'),'World images retain caller sampling');
    assert.ok(ctx.fillCount>0);assert.equal(ctx.imageSmoothingQuality,'medium');assert.equal(stack.length,0);
    ctx.failImage=bitmap;ctx.imageSmoothingEnabled=false;assert.throws(()=>game.draw(input),/actor drawing failed/);
    assert.equal(ctx.imageSmoothingQuality,'medium');assert.equal(ctx.imageSmoothingEnabled,false);assert.equal(stack.length,0,'Failed actor draw releases its local sampling scope');
    game.dispose();game.dispose();await Promise.all(bitmapDecodes);await new Promise(resolve=>setImmediate(resolve));
    assert.equal(bitmap.closed,1);assert.ok(otherBitmaps.every(image=>image.closed===1),'Every independently decoded late full-sheet or row closes exactly once at its last-owner boundary');assert.equal(game.snapshot().sceneDecodedBytes,0);
    assert.equal(game.snapshot().originalAthlete.disposed,true);assert.equal(game.snapshot().originalAthlete.decodedBytes,0);
    assert.deepEqual(game.snapshot().originalAthlete.decodedOwnerKeys,[]);assert.deepEqual(game.snapshot().originalAthlete.pendingViews,[]);
    assert.ok(images.every(image=>image.src===''&&image.onload===null&&image.onerror===null));
    const calls=ctx.draws.length;game.draw(input);assert.equal(ctx.draws.length,calls);
  }finally{game?.dispose();Object.assign(globalThis,originals);}
});
