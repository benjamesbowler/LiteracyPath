import test from 'node:test';
import assert from 'node:assert/strict';
import {compareRacerSamplingFrame} from '../../src/components/learn/games/games/racerSamplingDiagnostic.js';

test('actual diagnostic pixel buffers distinguish changed transparent surroundings from preserved opaque high-sampled actor and word pixels',()=>{
 const width=4,height=2,original=new Uint8ClampedArray(width*height*4).fill(255),candidate=new Uint8ClampedArray(original);
 candidate[0]=100;candidate[4]=120;
 const maskData=new Uint8ClampedArray(width*height*4);maskData[7]=255;
 const calls=[],masks=[],image={source:'registered-original'};let mode='inherit';
 const regions=[{kind:'hero',image,source:[0,0,256,256],destination:[0,0,4,2],quality:'high',enabled:true},
  {kind:'word',image,source:[0,0,512,256],destination:[2,0,2,2],quality:'high',enabled:true}];
 const ctx={getImageData(){return{data:mode==='inherit'?original:candidate};}};
 const result=compareRacerSamplingFrame({ctx,canvas:{width,height,toDataURL:()=>`image-${mode}`},sampling:'medium',draw(next){mode=next;return{state:{world:next},regions};},createCanvas(){
  const canvas={width:0,height:0,getContext(){return{drawImage(...args){calls.push({quality:this.imageSmoothingQuality,enabled:this.imageSmoothingEnabled,args});},getImageData(){const copy=new Uint8ClampedArray(canvas.width*canvas.height*4);if(canvas.width===4)copy.set(maskData);return{data:copy};}};}};masks.push(canvas);return canvas;
 }});
 assert.equal(result.worldChangedPixels,2);assert.equal(result.registrationUnchanged,true);assert.equal(result.protectedSamplingUnchanged,true);
 assert.equal(result.regions[0].wholeRegionChangedPixels,2);assert.equal(result.regions[0].opaquePixels,1);assert.equal(result.regions[0].opaqueChangedPixels,1,'A changed opaque source pixel is not hidden by a broad unchanged-region count');
 assert.ok(calls.every(call=>call.quality==='high'&&call.enabled));assert.ok(result.regions.every(region=>region.quality==='high'));
 assert.ok(result.pixelRelease.every(receipt=>receipt.detached&&receipt.bytes===32));assert.equal(original.byteLength,0);assert.equal(candidate.byteLength,0);
 assert.equal(result.transientPixelReferencesReleased,true);assert.equal(result.maskCanvasesReleased,true);assert.ok(masks.every(mask=>mask.width===1&&mask.height===1));
 assert.equal(result.fullFrameReadbackBytes,64);assert.equal(result.transientPeakRgbaBytes,128,'One mask backing store and its separate readback join the two full-frame arrays');
 assert.equal(result.gcObserved,false);assert.equal(JSON.stringify(result).includes('registered-original'),false,'Returned review metadata retains no bitmap/image owner');
});

test('opaque interior preservation and different source registration are reported independently of a real world sampling difference',()=>{
 const frames=[new Uint8ClampedArray([20,20,20,255,60,60,60,255]),new Uint8ClampedArray([25,25,25,255,60,60,60,255])];let current=0;
 const image={},mask=new Uint8ClampedArray([0,0,0,0,10,10,10,255]);
 const result=compareRacerSamplingFrame({ctx:{getImageData:()=>({data:frames[current]})},canvas:{width:2,height:1,toDataURL:()=>''},sampling:'low',draw(mode){current=mode==='inherit'?0:1;return{state:{world:mode},regions:[{kind:'hero',image,source:[current,0,256,256],destination:[0,0,2,1],quality:'high',enabled:true}]};},createCanvas:()=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(mask)})})})});
 assert.equal(result.worldChangedPixels,1);assert.equal(result.registrationUnchanged,false);assert.equal(result.regions[0].opaqueChangedPixels,0);assert.equal(result.regions[0].opaquePixels,1);
});

test('mask failure still detaches full-frame readbacks and retires the allocated mask backing store',()=>{
 const frames=[new Uint8ClampedArray(16),new Uint8ClampedArray(16)],masks=[];let current=0;
 assert.throws(()=>compareRacerSamplingFrame({ctx:{getImageData:()=>({data:frames[current]})},canvas:{width:2,height:2,toDataURL:()=>''},draw(mode){current=mode==='inherit'?0:1;return{state:{},regions:[{kind:'hero',image:{},source:[0,0,256,256],destination:[0,0,2,2],quality:'high',enabled:true}]};},createCanvas(){const canvas={width:0,height:0,getContext:()=>({drawImage(){throw new Error('mask decode failed');}})};masks.push(canvas);return canvas;}}),/mask decode failed/);
 assert.ok(frames.every(frame=>frame.byteLength===0));assert.ok(masks.every(mask=>mask.width===1&&mask.height===1));
});

test('unknown sampling mode cannot allocate a frame or change inherited rendering',()=>{
 let draws=0;assert.equal(compareRacerSamplingFrame({sampling:'nearest',draw(){draws++;}}),null);assert.equal(compareRacerSamplingFrame({sampling:'inherit',draw(){draws++;}}),null);assert.equal(draws,0);
});
