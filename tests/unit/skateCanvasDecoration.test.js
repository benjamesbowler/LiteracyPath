import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import * as THREE from 'three';
import {createSkateCanvasPresentation} from '../../src/components/learn/games/games/sportsCanvasRenderer.js';
import {RALLY_PALS_WORLD_ART} from '../../src/utils/rallyPalsRules.js';
import {SPORTS_SKATER_READY_REGISTRY} from '../../src/components/learn/games/games/sportsSkaterReadyRegistry.js';
import {SPORTS_SHARP_ART_REGISTRY} from '../../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {SPORTS_JUMP_ROWS} from '../../src/components/learn/games/games/sportsJumpRowRegistry.js';

test('Skate recovery paints matching original crops, retains distant dressing and cannot turn a near tree or unmatched landmark into a house wall',async()=>{
  const originals={fetch:globalThis.fetch,Image:globalThis.Image,createImageBitmap:globalThis.createImageBitmap,DOMMatrix:globalThis.DOMMatrix};
  const readySize=SPORTS_SKATER_READY_REGISTRY.meadow.viewSheet;
  const fullSize=JSON.parse(fs.readFileSync(new URL('../../public'+SPORTS_SHARP_ART_REGISTRY.skater.meadow[0].metadata,import.meta.url))).viewSheet;
  const rowSize=[fullSize[0],SPORTS_JUMP_ROWS.meadow.rows[0].decodedBytes/(4*fullSize[0])];
  const calls=[],images=[],stack=[],otherBitmaps=[],bitmapDecodes=[],bitmap={width:readySize[0],height:readySize[1],closed:0,close(){this.closed++;}};
  const ctx={globalAlpha:1,drawImage(...args){calls.push({args,alpha:this.globalAlpha});},fillRect(){},
    save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},beginPath(){},closePath(){},moveTo(){},lineTo(){},fill(){},stroke(){},ellipse(){},
    createPattern(){return{setTransform(){}};}};
  globalThis.fetch=async url=>{
    const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));
    return{ok:true,json:async()=>JSON.parse(bytes.toString()),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  };
  globalThis.createImageBitmap=blob=>{
    const work=(async()=>{
      const metadata=await sharp(Buffer.from(await blob.arrayBuffer())).metadata();
      const size=[metadata.width,metadata.height];
      if(JSON.stringify(size)===JSON.stringify(readySize))return bitmap;
      assert.ok([fullSize,rowSize].some(expected=>JSON.stringify(expected)===JSON.stringify(size)),'Only current registered full-sheet or compact-row dimensions are allowed');
      const image={width:metadata.width,height:metadata.height,closed:0,close(){this.closed++;}};otherBitmaps.push(image);return image;
    })();bitmapDecodes.push(work);return work;
  };
  globalThis.Image=class{
    constructor(){this.width=1774;this.height=887;images.push(this);}
    set src(value){this.source=value;if(value)queueMicrotask(()=>this.onload?.());}
    get src(){return this.source;}
  };
  globalThis.DOMMatrix=class{scale(){return this;}};
  let game;
  try{
    const camera=new THREE.PerspectiveCamera(60,1280/900,.1,650);camera.position.set(0,4,8);camera.lookAt(0,4,-20);camera.updateMatrixWorld(true);
    const scenery={world:'meadow',urls:{horizon:'/horizon.webp',scenery:'/scenery.webp',concrete:'/concrete.webp'},
      art:structuredClone(RALLY_PALS_WORLD_ART.meadow),trees:[{x:0,y:0,z:-30,height:100},{x:-12,y:0,z:-60,height:12}],
      venues:[{name:'clubhouse',x:0,z:-45},{name:'landmark',x:5,z:-45},{name:'flowerbed',x:8,z:-40}]};
    const ramps=[{x:10,z:-15,rot:0,width:10,depth:12,height:4}],platforms=[],rails=[{ax:18,az:17,bx:18,bz:7}];
    const player={pos:{x:0,z:-5},yaw:Math.PI,onGround:true,air:0},before=structuredClone({player,scenery,ramps,platforms,rails});
    game=createSkateCanvasPresentation({world:'meadow',renderer:{context:ctx,domElement:{width:1280,height:900},info:{render:{},memory:{}}},camera,sceneData:scenery,ramps,platforms,rails});
    assert.equal(await game.ready,true,'Actual registered36-cell essential atlas and fingerprint must decode before paint');
    game.draw({player,state:'coast',phase:0});
    const dressing=calls.filter(call=>call.args[0].source==='/scenery.webp');
    const frameCalls=frame=>dressing.filter(call=>JSON.stringify(call.args.slice(1,5))===JSON.stringify(frame));
    assert.equal(frameCalls(scenery.art.frames.club).length,1,'Only the actual matching club has club pixels; the separate landmark is not fabricated as another house');
    assert.equal(frameCalls(scenery.art.frames.tree).length,1,'Oversized near foliage fades out, while the actual distant original tree remains');
    assert.equal(frameCalls(scenery.art.frames.flowers).length,1);
    assert.ok(dressing.every(call=>call.alpha>0&&call.alpha<=1));
    assert.equal(calls.filter(call=>call.args[0]===bitmap).length,1,'Decorative fading never changes the independently registered player');
    assert.equal(ctx.globalAlpha,1,'Per-decoration alpha cannot leak into the actor or later choice paints');
    assert.deepEqual({player,scenery,ramps,platforms,rails},before,'Rendering cannot change the physical park, native pose, choices or scenery placement');
    await new Promise(resolve=>setImmediate(resolve));
  }finally{
    game?.dispose();game?.dispose();await Promise.all(bitmapDecodes);await new Promise(resolve=>setImmediate(resolve));Object.assign(globalThis,originals);
  }
  assert.equal(bitmap.closed,1);
  assert.ok(otherBitmaps.every(image=>image.closed===1),'Every separately allocated late full-sheet or row image closes once');
  assert.ok(images.every(image=>image.src===''&&image.onload===null&&image.onerror===null));
});
