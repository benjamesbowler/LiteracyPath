import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {SPORTS_SHARP_ART_REGISTRY as registry} from '../../../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {validateSportsSharpMetadata} from '../../../src/components/learn/games/games/sportsSharpArt.js';
import {SPORTS_JUMP_ROWS} from '../../../src/components/learn/games/games/sportsJumpRowRegistry.js';
import {SPORTS_SKATER_READY_FORMAT,SPORTS_SKATER_READY_BYTES,SPORTS_SKATER_READY_WORLDS,sportsSkaterReadyFrameRegistration,validateSportsSkaterReadyMetadata} from '../../../src/components/learn/games/games/sportsSkaterReadyAtlas.js';

const ROOT=fileURLToPath(new URL('../../../',import.meta.url));
const RECIPE=fileURLToPath(import.meta.url);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
sharp.concurrency(2);

// Pure readback diagnostics. Alpha differences and RGB changes at any nonzero
// alpha remain visible-pixel failures; zero-alpha RGB is counted separately,
// and never removed from the strict complete-RGBA equality requirement.
export function readyAtlasPixelDifferences(expected,delivered,{width,height,frames}){
 assert.equal(expected.length,width*height*4);assert.equal(delivered.length,expected.length);
 const cellWidth=frames[0].cell[2],cellHeight=frames[0].cell[3],columns=width/cellWidth;
 assert.ok(Number.isInteger(columns)&&Number.isInteger(height/cellHeight));
 const frameMap=new Map(frames.map(frame=>[(frame.cell[1]/cellHeight)*columns+frame.cell[0]/cellWidth,frame]));
 const scope=()=>({changedPixels:0,alphaDifferences:0,nonzeroAlphaRgbDifferences:0,zeroAlphaOnlyRgbDifferences:0});
 const result={changedChannels:0,changedPixels:0,alphaDifferences:0,nonzeroAlphaRgbDifferences:0,zeroAlphaOnlyRgbDifferences:0,
  maximumAlphaDelta:0,maximumRgbDelta:0,scope:{insideRegisteredOpaqueBounds:scope(),paddingOutsideRegisteredOpaqueBounds:scope(),unregisteredCell:scope()},
  firstLocations:{alpha:[],nonzeroAlphaRgb:[],zeroAlphaOnlyRgb:[]},perCell:[]};
 const perCell=new Map();
 for(let offset=0;offset<expected.length;offset+=4){
  if(expected[offset]===delivered[offset]&&expected[offset+1]===delivered[offset+1]&&expected[offset+2]===delivered[offset+2]&&expected[offset+3]===delivered[offset+3])continue;
  const pixel=offset/4,x=pixel%width,y=Math.floor(pixel/width),cellId=Math.floor(y/cellHeight)*columns+Math.floor(x/cellWidth),frame=frameMap.get(cellId);
  const localX=frame?x-frame.cell[0]:null,localY=frame?y-frame.cell[1]:null,bounds=frame?.opaqueBounds;
  const key=!frame?'unregisteredCell':localX>=bounds[0]&&localX<bounds[2]&&localY>=bounds[1]&&localY<bounds[3]?'insideRegisteredOpaqueBounds':'paddingOutsideRegisteredOpaqueBounds';
  let cell=perCell.get(cellId);if(!cell){cell={cellId,sourceView:frame?.sourceView??null,state:frame?.state??null,phase:frame?.phase??null,...scope()};perCell.set(cellId,cell);}
  result.changedPixels++;result.scope[key].changedPixels++;cell.changedPixels++;
  for(let channel=0;channel<4;channel++){
   if(expected[offset+channel]===delivered[offset+channel])continue;
   result.changedChannels++;const alpha=channel===3,visible=expected[offset+3]>0||delivered[offset+3]>0;
   const counter=alpha?'alphaDifferences':visible?'nonzeroAlphaRgbDifferences':'zeroAlphaOnlyRgbDifferences';
   result[counter]++;result.scope[key][counter]++;cell[counter]++;
   const delta=Math.abs(expected[offset+channel]-delivered[offset+channel]);
   if(alpha)result.maximumAlphaDelta=Math.max(result.maximumAlphaDelta,delta);else result.maximumRgbDelta=Math.max(result.maximumRgbDelta,delta);
   const sample=result.firstLocations[alpha?'alpha':visible?'nonzeroAlphaRgb':'zeroAlphaOnlyRgb'];
   if(sample.length<16)sample.push({pixel:[x,y],cellLocalPixel:[localX,localY],sourceView:frame?.sourceView??null,state:frame?.state??null,phase:frame?.phase??null,
    scope:key,channel:['R','G','B','A'][channel],expected:expected[offset+channel],delivered:delivered[offset+channel],expectedAlpha:expected[offset+3],deliveredAlpha:delivered[offset+3]});
  }
 }
 result.perCell=[...perCell.values()].sort((a,b)=>a.cellId-b.cellId);return result;
}

// The derivation and sole table author use the same finite source assembly.
// Current full/row source identities and original contacts remain authoritative.
export async function assembleReadyJumpAtlas({root=ROOT,world='moonwood'}={}){
 assert.ok(Object.hasOwn(SPORTS_SKATER_READY_WORLDS,world),'One exact existing sports world is required');
 const sources=registry.skater[world],character=sources[0].character,read=file=>fs.readFileSync(path.join(root,file));
 assert.equal(character,SPORTS_SKATER_READY_WORLDS[world],'Canonical existing cast');
 const model=`public/game-assets/spell-skate/models/${character}-skater-v2.glb`;
 assert.equal(sha(read(model)),sources[0].modelSha256,'Current original model');
 const frames=[],registrations=[],lineage=[],parts=[];
 for(const [view,entry]of sources.entries()){
  const metadataBytes=read(`public${entry.metadata}`),raw=JSON.parse(metadataBytes),runtime=read(`public${entry.runtime}`);
  assert.equal(sha(metadataBytes),entry.metadataSha256,`view${view} current registration`);
  assert.equal(sha(runtime),entry.runtimeSha256,`view${view} current delivered image`);
  assert.equal(entry.modelSha256,sources[0].modelSha256,`view${view} same current original model`);
  assert.ok(validateSportsSharpMetadata(raw,{kind:'skater',world,view,registered:entry}),`view${view} finite original384 metadata`);
  const row=SPORTS_JUMP_ROWS[world].rows[view],rowBytes=read(`public${row.metadata}`);
  assert.equal(sha(rowBytes),row.metadataSha256,`view${view} retained row registration`);
  const rowMetadata=JSON.parse(rowBytes);
  assert.equal(sha(read(rowMetadata.source)),rowMetadata.sourceSha256,`view${view} retained original row PNG`);
  assert.equal(sha(read(rowMetadata.lineage.originalSourcePng)),rowMetadata.lineage.originalSourcePngSha256,`view${view} retained original complete PNG`);
  lineage.push({view,originalSource:rowMetadata.lineage.originalSourcePng,originalSourceSha256:rowMetadata.lineage.originalSourcePngSha256,
   originalRowSource:rowMetadata.source,originalRowSourceSha256:rowMetadata.sourceSha256});
  const states=view===0?['coast','jump']:['jump'];
  for(const state of states){
   const sourceY=state==='coast'?0:1920,atlasRow=state==='coast'?0:view+1;
   const pixels=await sharp(runtime).extract({left:0,top:sourceY,width:1536,height:384}).ensureAlpha().raw().toBuffer();
   parts.push({pixels,row:atlasRow});
   for(const original of raw.frames.filter(frame=>frame.state===state)){
    const column=original.cell[0]/384;
    frames.push({...structuredClone(original),sourceView:view,fullCell:[...original.cell],cell:[column*384,atlasRow*384,384,384],
     pixelsPerUnit:entry.pixelsPerUnit,shadowPixelsPerUnit:entry.shadowPixelsPerUnit});
    registrations.push(sha(Buffer.from(JSON.stringify(sportsSkaterReadyFrameRegistration(original)))));
   }
  }
 }
 assert.equal(parts.length,9);assert.equal(frames.length,36);
 const rgba=Buffer.alloc(SPORTS_SKATER_READY_BYTES);
 for(const {pixels,row}of parts)pixels.copy(rgba,row*1536*384*4);
 return{sources,character,model,frames,registrations,lineage,rgba};
}

// One explicit unselected delivery candidate per invocation. No new renders,
// pose interpolation, target changes or normal table promotion.
export async function deriveReadyJumpAtlas({root=ROOT,world='moonwood'}={}){
 const {sources,character,model,frames,registrations,lineage,rgba}=await assembleReadyJumpAtlas({root,world});
 const image=sharp(rgba,{raw:{width:1536,height:3456,channels:4}});
 const png=await image.clone().png().toBuffer(),webp=await image.clone().webp({lossless:true,effort:6,exact:true}).toBuffer();
 const delivered=await sharp(webp).ensureAlpha().raw().toBuffer();
 if(!delivered.equals(rgba)){
  const packet=path.join(root,'.artifacts/arcade-standard-upgrade/sharp-jump-atlas-v34');fs.mkdirSync(packet,{recursive:true});
  const diagnostic={world,modelSha256:sources[0].modelSha256,recipeSha256:sha(fs.readFileSync(RECIPE)),encoder:{lossless:true,effort:6,exact:true},
   expectedRgbaSha256:sha(rgba),deliveredRgbaSha256:sha(delivered),encodedSha256:sha(webp),width:1536,height:3456,
   sourceInputs:structuredClone(sources),...readyAtlasPixelDifferences(rgba,delivered,{width:1536,height:3456,frames}),
   diagnosticScope:'Lossless exact candidate failure diagnostics; no candidate assets/admission, no RGB or alpha differences suppressed.'};
  fs.writeFileSync(path.join(packet,`pixel-failure-${Date.now()}.json`),`${JSON.stringify(diagnostic,null,2)}\n`);
 }
 assert.ok(delivered.equals(rgba),'All36 delivered cells must change zero RGBA channels');
 const stem=`/game-assets/spell-skate/recovery384-action-atlas-candidate/${character}/coast-jump-v1`;
 const source=`source-art/arcade/spell-skate-3d/action-atlas-candidate/${character}/coast-jump-v1.png`;
 const recipePath=path.relative(root,RECIPE),recipeSha256=sha(fs.readFileSync(RECIPE));
 const raw={format:SPORTS_SKATER_READY_FORMAT,kind:'skater',world,character,states:['coast','jump'],phases:[0,.25,.5,.75],cell:[384,384],
  viewSheet:[1536,3456],decodedBytes:SPORTS_SKATER_READY_BYTES,decodedSha256:sha(delivered),modelSha256:sources[0].modelSha256,
  runtime:`${stem}.webp`,runtimeBytes:webp.length,runtimeSha256:sha(webp),source,sourceSha256:sha(png),recipe:recipePath,recipeSha256,
  lineage:{basis:'decoded-current-runtime-RGBA',changedChannels:0,sources:structuredClone(sources),originalSources:lineage},frames};
 const metadataBytes=Buffer.from(`${JSON.stringify(raw,null,2)}\n`);
 const entry={format:raw.format,world,character,runtime:raw.runtime,runtimeBytes:raw.runtimeBytes,runtimeSha256:raw.runtimeSha256,
  metadata:`${stem}.json`,metadataBytes:metadataBytes.length,metadataSha256:sha(metadataBytes),decodedBytes:raw.decodedBytes,decodedSha256:raw.decodedSha256,
  viewSheet:raw.viewSheet,modelSha256:raw.modelSha256,recipeSha256,sources:structuredClone(sources),frameRegistrationSha256:registrations};
 assert.ok(await validateSportsSkaterReadyMetadata(raw,entry,registry,world),'Finite source-bound candidate runtime registration');
 // No output is touched until every original model/registration/pixel/contact
 // and final decoded-delivery check has passed. Normal registry is untouched.
 for(const [file,bytes]of [[source,png],[`public${stem}.webp`,webp],[`public${stem}.json`,metadataBytes]]){
  fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),bytes);
 }
 const packet=path.join(root,'.artifacts/arcade-standard-upgrade/sharp-jump-atlas-v34');fs.mkdirSync(packet,{recursive:true});
 fs.writeFileSync(path.join(packet,'candidate-registration-moonwood.json'),`${JSON.stringify(entry,null,2)}\n`);
 const proof={world,character,source,sourceSha256:sha(png),runtime:entry.runtime,runtimeBytes:webp.length,runtimeSha256:sha(webp),metadata:entry.metadata,
  metadataBytes:metadataBytes.length,metadataSha256:entry.metadataSha256,model,modelSha256:entry.modelSha256,recipe:recipePath,recipeSha256,
  decodedRgbaBytes:SPORTS_SKATER_READY_BYTES,maximumPairedRgbaBytes:SPORTS_SKATER_READY_BYTES+23_592_960,changedChannels:0,
  actualCells:36,initialCoastCells:4,allJumpViews:8,allJumpPhases:4,normalSelectionChanged:false,sourceReviewOnly:true};
 fs.writeFileSync(path.join(packet,`source-proof-${world}.json`),`${JSON.stringify(proof,null,2)}\n`);return proof;
}

if(process.argv[1]&&path.resolve(process.argv[1])===RECIPE){
 const args=process.argv.slice(2);assert.equal(args.length,2,'One explicit source candidate only');assert.equal(args[0],'--world');
 assert.ok(Object.hasOwn(SPORTS_SKATER_READY_WORLDS,args[1]),'One exact existing sports world is required');
 const begin=performance.now(),result=await deriveReadyJumpAtlas({world:args[1]});
 console.log(JSON.stringify({...result,elapsedSeconds:(performance.now()-begin)/1000}));
}
