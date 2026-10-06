import {releaseRacerComparisonPixels} from './racerGroundOcclusion.js';

export const RACER_DIAGNOSTIC_SAMPLING=Object.freeze(['inherit','low','medium','high']);

// Called only by the paused development diagnostic. The whole-region count
// includes changed world pixels behind transparent art. Opaque authored pixels
// are counted separately; high actor/word sampling is never inferred from an
// unchanged background. Mask storage is bounded to one clipped visible region.
export function compareRacerSamplingFrame({ctx,canvas,draw,sampling='medium',createCanvas=()=>document.createElement('canvas')}){
 if(!RACER_DIAGNOSTIC_SAMPLING.includes(sampling)||sampling==='inherit')return null;
 const result={sampling,width:canvas.width,height:canvas.height,diagnosticDraws:2,gcObserved:false,regions:[],fullFrameReadbackBytes:canvas.width*canvas.height*8,maskPeakRgbaBytes:0};
 const buffers={},masks=[];
 try{
  const original=draw('inherit');result.originalState=original.state;
  result.originalPng=canvas.toDataURL('image/png');buffers.original=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const candidate=draw(sampling);result.candidateState=candidate.state;
  result.candidatePng=canvas.toDataURL('image/png');buffers.candidate=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  result.worldChangedPixels=0;result.maxWorldChannelDelta=0;
  for(let index=0;index<buffers.original.length;index+=4){
   let delta=0;for(let channel=0;channel<4;channel++)delta=Math.max(delta,Math.abs(buffers.original[index+channel]-buffers.candidate[index+channel]));
   result.maxWorldChannelDelta=Math.max(result.maxWorldChannelDelta,delta);if(delta>1)result.worldChangedPixels++;
  }
  result.registrationUnchanged=original.regions.length===candidate.regions.length&&original.regions.every((r,i)=>{
   const other=candidate.regions[i];return r.kind===other.kind&&r.image===other.image&&JSON.stringify(r.source)===JSON.stringify(other.source)&&JSON.stringify(r.destination)===JSON.stringify(other.destination);
  });
  result.protectedSamplingUnchanged=original.regions.length===candidate.regions.length&&original.regions.every((r,i)=>r.quality==='high'&&r.enabled===true&&candidate.regions[i].quality==='high'&&candidate.regions[i].enabled===true);
  for(const region of candidate.regions){
   const [dx,dy,dw,dh]=region.destination,x=Math.max(0,Math.floor(dx)),y=Math.max(0,Math.floor(dy));
   const width=Math.max(0,Math.min(canvas.width,Math.ceil(dx+dw))-x),height=Math.max(0,Math.min(canvas.height,Math.ceil(dy+dh))-y);
   if(!width||!height)continue;
   const mask=createCanvas(),owner={canvas:mask,pixels:null};masks.push(owner);mask.width=width;mask.height=height;
   const mx=mask.getContext('2d');mx.imageSmoothingEnabled=region.enabled;mx.imageSmoothingQuality=region.quality;
   mx.drawImage(region.image,...region.source,dx-x,dy-y,dw,dh);
   let pixels=mx.getImageData(0,0,width,height).data;owner.pixels=pixels;
   const receipt={kind:region.kind,source:[...region.source],destination:[...region.destination],visibleBounds:[x,y,width,height],quality:region.quality,enabled:region.enabled,opaquePixels:0,opaqueChangedPixels:0,opaqueMaxChannelDelta:0,wholeRegionChangedPixels:0};
   result.maskPeakRgbaBytes=Math.max(result.maskPeakRgbaBytes,pixels.byteLength);
   for(let iy=0;iy<height;iy++)for(let ix=0;ix<width;ix++){
    const local=(iy*width+ix)*4,global=((y+iy)*canvas.width+x+ix)*4;let delta=0;
    for(let channel=0;channel<4;channel++)delta=Math.max(delta,Math.abs(buffers.original[global+channel]-buffers.candidate[global+channel]));
    if(delta>1)receipt.wholeRegionChangedPixels++;
    if(pixels[local+3]===255){receipt.opaquePixels++;receipt.opaqueMaxChannelDelta=Math.max(receipt.opaqueMaxChannelDelta,delta);if(delta>1)receipt.opaqueChangedPixels++;}
   }
   receipt.maskRelease=releaseRacerComparisonPixels(pixels);owner.pixels=null;pixels=null;mask.width=mask.height=1;result.regions.push(receipt);
  }
 }finally{
  result.pixelRelease=[releaseRacerComparisonPixels(buffers.original),releaseRacerComparisonPixels(buffers.candidate)];
  delete buffers.original;delete buffers.candidate;result.transientPixelReferencesReleased=Object.keys(buffers).length===0;
  for(const owner of masks){releaseRacerComparisonPixels(owner.pixels);owner.pixels=null;owner.canvas.width=owner.canvas.height=1;}
  result.maskCanvasesReleased=masks.every(owner=>owner.canvas.width===1&&owner.canvas.height===1&&owner.pixels===null);masks.length=0;
  result.transientPeakRgbaBytes=result.fullFrameReadbackBytes+result.maskPeakRgbaBytes*2;
 }
 return result;
}
