import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../..'),directory='source-art/arcade/physical-worlds/word-bridge';
const configBytes=await fs.readFile(path.join(root,directory,'scenery-registration.json')),configuration=JSON.parse(configBytes);
const manifestPath=path.join(root,directory,'scenery-manifest.json'),manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const registerOnly=process.argv.includes('--register-only'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const atlases={},layers={};
const compilationStart=performance.now();
const timed=(asset,stage,started)=>console.log(JSON.stringify({event:'asset-stage',asset,stage,
  durationMs:performance.now()-started,elapsedMs:performance.now()-compilationStart}));
const actions=['plank','workbench','rack','bank'];
if(process.argv.includes('--metadata-only')){
  for(const asset of manifest.assets){
    if(hash(await fs.readFile(path.join(root,asset.source)))!==asset.sourceSha256)throw Error(`${asset.id}: original source identity changed`);
    const runtime=asset.runtime||`/game-assets/physical-arcade/word-bridge/scenery/${path.basename(asset.source,'.png')}.webp`;
    if(asset.frames)atlases[asset.id]={width:asset.sourceSize[0],height:asset.sourceSize[1],nominalHeight:asset.nominalHeight,pixelsPerUnit:asset.pixelsPerUnit,runtime,
      frames:asset.frames.map(({id,action,direction,cell,anchor,sockets})=>({id,action,direction,cell,anchor,sockets}))};
    else layers[asset.world]=runtime;
  }
  await fs.writeFile(path.join(root,'src/components/learn/games/games/wordBridgeScenery.generated.js'),
    '// Source-registered metadata only; planned URLs remain unavailable until original derivatives are encoded.\n'+
    `export const WORD_BRIDGE_SCENERY = ${JSON.stringify(atlases,null,2)};\nexport const WORD_BRIDGE_HORIZONS = ${JSON.stringify(layers,null,2)};\n`);
  console.log(JSON.stringify({compiled:false,metadataOnly:true,runtimeAcceptance:manifest.review.runtimeAcceptance}));process.exit(0);
}

function semanticFrame(data,info,[x,y,width,height],action,spec){
  const alpha=(cx,cy)=>data[(cy*info.width+cx)*4+3];
  let left=x+width,top=y+height,right=x,bottom=y;
  for(let cy=y;cy<y+height;cy++)for(let cx=x;cx<x+width;cx++)if(alpha(cx,cy)>=8){
    if(alpha(cx,cy)>=160&&(cx===x||cx===x+width-1||cy===y||cy===y+height-1))throw Error(`${spec.id}/${action}: semantic boundary cuts visible source geometry`);
    left=Math.min(left,cx);top=Math.min(top,cy);right=Math.max(right,cx+1);bottom=Math.max(bottom,cy+1);
  }
  if(right<=left||bottom<=top)throw Error(`${spec.id}/${action}: empty semantic region`);
  const cell=[Math.max(x,left-7),Math.max(y,top-7),Math.min(x+width,right+7),Math.min(y+height,bottom+7)];
  const axis=Math.floor((left+right)/2);
  let ground=null;for(let cy=bottom-1;cy>=top&&!ground;cy--)for(let delta=0;delta<=right-left&&!ground;delta++)for(const cx of[axis-delta,axis+delta]){
    if(cx>=left&&cx<right&&alpha(cx,cy)>=160){ground=[cx,cy];break;}
  }
  const sockets={ground};
  if(action==='bank'){
    const point=spec.walkSurface;
    if(!point||alpha(...point)<160||point[0]<left||point[0]>=right||point[1]<top||point[1]>=bottom)throw Error(`${spec.id}: walk surface is not a measured visible source pixel`);
    sockets.walkSurface=point;
  }
  const attachment=action==='bank'?sockets.walkSurface:ground;
  return{id:`${spec.world}-${action}`,action,direction:'front-three-quarter',cell,anchor:[attachment[0]-cell[0],attachment[1]-cell[1]],sockets,
    measurement:{semanticRegion:[x,y,width,height],wholeAlphaBounds:[left,top,right,bottom],method:'Every semantic alpha>=8 pixel retained; actual opaque ground/turf attachment; live bank-collider and palm-native proof pending'}};
}

for(const spec of configuration.kits){
  const assetStart=performance.now();let stageStart=assetStart;
  const asset=manifest.assets.find(row=>row.id===spec.id),bytes=await fs.readFile(path.join(root,asset.source));
  if(hash(bytes)!==asset.sourceSha256)throw Error(`${spec.id}: original source identity changed`);
  timed(spec.id,'source-read-and-SHA',stageStart);stageStart=performance.now();
  const{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  timed(spec.id,'PNG-decode',stageStart);stageStart=performance.now();
  if(data[3]!==0)throw Error(`${spec.id}: corner alpha is not genuinely transparent`);
  asset.frames=spec.regions.map((region,index)=>semanticFrame(data,info,region,actions[index],spec));
  timed(spec.id,'semantic-alpha-crops-and-actual-surface',stageStart);stageStart=performance.now();
  asset.registration='scenery-registration.json';asset.registrationSha256=hash(configBytes);asset.pixelsPerUnit=200;asset.nominalHeight=2.2;
  asset.reviewStatus='Direct source inspection and complete semantic alpha/contact registration; actual native live construction acceptance pending';
  if(!registerOnly){
    const runtime=`/game-assets/physical-arcade/word-bridge/scenery/${spec.file}.webp`,output=await sharp(bytes).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
    timed(spec.id,'WebP-encode-q90-alpha100-effort6',stageStart);stageStart=performance.now();
    const decoded=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(decoded.info.width!==info.width||decoded.info.height!==info.height||decoded.data[3]!==0)throw Error(`${spec.id}: derivative dimensions/true alpha differ from registration`);
    const sourceAlpha=Buffer.alloc(info.width*info.height),runtimeAlpha=Buffer.alloc(sourceAlpha.length);
    for(let pixel=0;pixel<sourceAlpha.length;pixel++){
      sourceAlpha[pixel]=data[pixel*4+3];runtimeAlpha[pixel]=decoded.data[pixel*4+3];
      if(sourceAlpha[pixel]!==runtimeAlpha[pixel])throw Error(`${spec.id}: delivered alpha changed at source pixel ${pixel}`);
    }
    asset.alphaCoverage={method:'Every original semantic-sheet alpha pixel equals decoded WebP alpha; RGB uses declared lossy quality90',
      pixelCount:sourceAlpha.length,sourceAlphaSha256:hash(sourceAlpha),runtimeAlphaSha256:hash(runtimeAlpha)};
    for(const frame of asset.frames)for(const[name,point]of Object.entries(frame.sockets)){
      if(decoded.data[(Math.round(point[1])*info.width+Math.round(point[0]))*4+3]<160)throw Error(`${frame.id}: delivered ${name} is not the measured opaque surface`);
    }
    timed(spec.id,'decoded-runtime-dimensions-alpha-sockets',stageStart);stageStart=performance.now();
    await fs.mkdir(path.dirname(path.join(root,'public',runtime)),{recursive:true});await fs.writeFile(path.join(root,'public',runtime),output);
    timed(spec.id,'runtime-write',stageStart);
    asset.runtime=runtime;asset.runtimeSize=[info.width,info.height];asset.runtimeSha256=hash(output);asset.runtimeBytes=output.length;
    atlases[spec.id]={width:info.width,height:info.height,pixelsPerUnit:asset.pixelsPerUnit,nominalHeight:asset.nominalHeight,runtime,
      frames:asset.frames.map(({id,action,direction,cell,anchor,sockets})=>({id,action,direction,cell,anchor,sockets}))};
  }
  timed(spec.id,'asset-total',assetStart);
}
if(!registerOnly){
  for(const asset of manifest.assets.filter(row=>row.kind==='authored-river-worksite-background-layer')){
    const assetStart=performance.now();let stageStart=assetStart;
    const bytes=await fs.readFile(path.join(root,asset.source));if(hash(bytes)!==asset.sourceSha256)throw Error(`${asset.id}: horizon source identity changed`);
    timed(asset.id,'source-read-and-SHA',stageStart);stageStart=performance.now();
    const output=await sharp(bytes).resize({width:1672,withoutEnlargement:true}).webp({quality:88,effort:6}).toBuffer();
    timed(asset.id,'horizon-resize-WebP-q88-effort6',stageStart);stageStart=performance.now();
    const info=await sharp(output).metadata();
    if(info.width!==1672||info.height!==941)throw Error(`${asset.id}: authored horizon dimensions differ from the registered live view`);
    timed(asset.id,'decoded-runtime-dimensions',stageStart);stageStart=performance.now();
    const runtime=`/game-assets/physical-arcade/word-bridge/scenery/${asset.world}-horizon-v1.webp`;
    await fs.mkdir(path.dirname(path.join(root,'public',runtime)),{recursive:true});await fs.writeFile(path.join(root,'public',runtime),output);
    asset.runtime=runtime;asset.runtimeSize=[info.width,info.height];asset.runtimeSha256=hash(output);asset.runtimeBytes=output.length;layers[asset.world]=runtime;
    timed(asset.id,'write-and-SHA',stageStart);timed(asset.id,'asset-total',assetStart);
  }
  await fs.writeFile(path.join(root,'src/components/learn/games/games/wordBridgeScenery.generated.js'),
    '// Generated from original Word Bridge materials/river horizons by scripts/art/build-word-bridge-scenery.mjs.\n'+
    `export const WORD_BRIDGE_SCENERY = ${JSON.stringify(atlases,null,2)};\nexport const WORD_BRIDGE_HORIZONS = ${JSON.stringify(layers,null,2)};\n`);
}
manifest.registration='scenery-registration.json';manifest.registrationSha256=hash(configBytes);
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({compiled:!registerOnly,registeredFrames:manifest.assets.reduce((sum,row)=>sum+(row.frames?.length||0),0),runtimeAcceptance:manifest.review.runtimeAcceptance}));
