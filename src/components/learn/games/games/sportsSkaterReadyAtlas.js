import {completeSportsSharpRegistry,createSportsSharpDecoder} from './sportsSharpArt.js';
import {createSportsSkaterArt} from './sportsJumpRowPilot.js';

// Normal Canvas actor graphics contain coast0 and every original jump
// direction/phase; controls never wait on a later directional cache.
export const SPORTS_SKATER_READY_FORMAT='skater-384-coast-jump-atlas-v1';
export const SPORTS_SKATER_READY_BYTES=1536*3456*4;
export const SPORTS_SKATER_READY_PAIR_BYTES=SPORTS_SKATER_READY_BYTES+1536*3840*4;
export const SPORTS_SKATER_READY_WORLDS=Object.freeze({meadow:'bouncy',dino:'chompy',moonwood:'pip'});
export const SPORTS_SKATER_READY_FRAME_FIELDS=['source','sha256','state','phase','sourceFrame','groundAnchor','opaqueBounds','tyreContacts','soleContacts','palmAnchors','contactWorld'];
const PHASES=[0,.25,.5,.75];
const hash=/^[a-f0-9]{64}$/;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const viewId=value=>((Math.round(value)%8)+8)%8;
const point=value=>Array.isArray(value)&&value.length===2&&value.every(n=>Number.isFinite(n)&&n>=0&&n<384);
const now=()=>performance.now();
export const sportsSkaterReadyFrameRegistration=frame=>Object.fromEntries(SPORTS_SKATER_READY_FRAME_FIELDS.map(key=>[key,frame[key]]));
async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}

export function validSportsSkaterReadyEntry(entry,registry,world){
 if(!Object.hasOwn(SPORTS_SKATER_READY_WORLDS,world)||!completeSportsSharpRegistry(registry))return false;
 const source=registry.skater[world];if(!source)return false;
 const stem=`/game-assets/spell-skate/recovery384-action-atlas-candidate/${source[0].character}/coast-jump-v1`;
 return source[0].character===SPORTS_SKATER_READY_WORLDS[world]&&entry?.format===SPORTS_SKATER_READY_FORMAT&&entry.world===world&&entry.character===source[0].character
  &&entry.runtime===`${stem}.webp`&&entry.metadata===`${stem}.json`&&entry.modelSha256===source[0].modelSha256
  &&[entry.runtimeSha256,entry.metadataSha256,entry.decodedSha256,entry.recipeSha256].every(value=>hash.test(value))
  &&Number.isInteger(entry.runtimeBytes)&&entry.runtimeBytes>0&&Number.isInteger(entry.metadataBytes)&&entry.metadataBytes>0
  &&entry.decodedBytes===SPORTS_SKATER_READY_BYTES&&same(entry.viewSheet,[1536,3456])
  &&Array.isArray(entry.sources)&&entry.sources.length===8&&entry.sources.every((item,view)=>same(item,source[view]))
  &&Array.isArray(entry.frameRegistrationSha256)&&entry.frameRegistrationSha256.length===36&&entry.frameRegistrationSha256.every(value=>hash.test(value));
}

export function completeSportsSkaterReadyRegistry(table,registry){
 return Boolean(table&&typeof table==='object'&&!Array.isArray(table)
  &&same(Object.keys(table).sort(),Object.keys(SPORTS_SKATER_READY_WORLDS).sort())
  &&Object.keys(SPORTS_SKATER_READY_WORLDS).every(world=>validSportsSkaterReadyEntry(table[world],registry,world)));
}

export async function validateSportsSkaterReadyMetadata(raw,entry,registry,world){
 if(!validSportsSkaterReadyEntry(entry,registry,world)||raw?.format!==entry.format||raw.kind!=='skater'||raw.world!==world
  ||raw.character!==entry.character||raw.runtime!==entry.runtime||raw.runtimeBytes!==entry.runtimeBytes||raw.runtimeSha256!==entry.runtimeSha256
  ||raw.modelSha256!==entry.modelSha256||raw.decodedSha256!==entry.decodedSha256||raw.decodedBytes!==entry.decodedBytes
  ||raw.recipeSha256!==entry.recipeSha256||!same(raw.cell,[384,384])||!same(raw.viewSheet,[1536,3456])
  ||!same(raw.phases,PHASES)||!same(raw.states,['coast','jump'])||!same(raw.lineage?.sources,entry.sources)
  ||raw.lineage?.basis!=='decoded-current-runtime-RGBA'||raw.lineage.changedChannels!==0
  ||!Array.isArray(raw.frames)||raw.frames.length!==36)return null;
 for(const [index,frame]of raw.frames.entries()){
  const coast=index<4,view=coast?0:Math.floor((index-4)/4),column=index%4,row=coast?0:view+1,source=entry.sources[view];
  const bounds=frame.opaqueBounds;
  if(frame.sourceView!==view||frame.state!==(coast?'coast':'jump')||frame.phase!==PHASES[column]
   ||!same(frame.cell,[column*384,row*384,384,384])||!same(frame.fullCell,[column*384,coast?0:1920,384,384])
   ||frame.pixelsPerUnit!==source.pixelsPerUnit||frame.shadowPixelsPerUnit!==source.shadowPixelsPerUnit
   ||!same(frame.groundAnchor,source.groundAnchor)||!Array.isArray(bounds)||bounds.length!==4
   ||bounds.some(value=>!Number.isFinite(value)||value<=0||value>=384)||bounds[0]>=bounds[2]||bounds[1]>=bounds[3]
   ||[['tyreContacts',4],['soleContacts',2],['palmAnchors',2]].some(([key,count])=>!Array.isArray(frame[key])||frame[key].length!==count||frame[key].some(p=>!point(p))))return null;
  const original=new TextEncoder().encode(JSON.stringify(sportsSkaterReadyFrameRegistration(frame)));
  if(await digest(original)!==entry.frameRegistrationSha256[index])return null;
 }
 return structuredClone(raw);
}

export function createSportsSkaterReadyDecoder(entry,registry,world){
 if(!validSportsSkaterReadyEntry(entry,registry,world))throw new Error('Exact finite coast/jump atlas registration required');
 return async signal=>{
  const begin=now();if(signal.aborted)throw new Error('Ready atlas cancelled');
  const registration=await fetch(entry.metadata,{signal});if(!registration.ok)throw new Error('Ready atlas registration unavailable');
  const metadataBytes=await registration.arrayBuffer();
  if(metadataBytes.byteLength!==entry.metadataBytes||await digest(metadataBytes)!==entry.metadataSha256)throw new Error('Ready atlas registration fingerprint');
  const metadata=await validateSportsSkaterReadyMetadata(JSON.parse(new TextDecoder().decode(metadataBytes)),entry,registry,world);
  if(!metadata)throw new Error('Ready atlas registration invalid');
  const response=await fetch(entry.runtime,{signal});if(!response.ok)throw new Error('Ready atlas image unavailable');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength!==entry.runtimeBytes||await digest(bytes)!==entry.runtimeSha256)throw new Error('Ready atlas image fingerprint');
  if(signal.aborted)throw new Error('Ready atlas cancelled before decode');
  const blob=new Blob([bytes],{type:'image/webp'});let image,release;
  if(typeof createImageBitmap==='function'){image=await createImageBitmap(blob);release=()=>image.close();}
  else{
   const url=URL.createObjectURL(blob);image=new Image();release=()=>{image.removeAttribute('src');URL.revokeObjectURL(url);};
   try{image.src=url;await image.decode();}catch(error){release();throw error;}
  }
  let closed=false;const close=()=>{if(closed)return;closed=true;release();};
  if(signal.aborted||image.width!==1536||image.height!==3456){close();throw new Error('Ready atlas decoded size or cancellation');}
  return{image,metadata,close,decodeAndSourceWaitMs:now()-begin};
 };
}

// One initial atlas plus ONE original full sheet. A replacement full image is
// allocated only after its prior owner closes; the atlas remains the visible,
// truthfully labelled fallback. Full-sheet faults are negatively cached.
export function createSportsSkaterReadyAtlas({entry,registry,rows,world,onChange=()=>{},decodeAtlas,decodeFull,createFallback}){
 if(!validSportsSkaterReadyEntry(entry,registry,world))throw new Error('Exact finite coast/jump atlas registration required');
 const initialDecode=decodeAtlas||createSportsSkaterReadyDecoder(entry,registry,world),fullDecode=decodeFull||createSportsSharpDecoder(registry);
 const initialController=new AbortController(),failedFull=new Set(),costs=[],notificationErrors=[];
 let disposed=false,atlas=null,full=null,pending=null,fallback=null,atlasFailure=null,queue=Promise.resolve();
 let wanted=0,state='coast',phase=0,clock=0;
 function notify(){try{onChange();}catch(error){notificationErrors.push(String(error));if(notificationErrors.length>8)notificationErrors.shift();}}
 function closeFull(){if(!full)return;full.sheet.close();full=null;}
 function cancelPending(){pending?.controller.abort();pending=null;}
 function requestFull(view){
  if(disposed||!atlas||failedFull.has(view))return;
  if(full?.view===view){if(pending?.view!==view)cancelPending();return;}
  if(pending?.view===view)return;
  cancelPending();const record={view,controller:new AbortController(),requestedAt:now()};pending=record;
  const work=queue.catch(()=>{}).then(async()=>{
   if(disposed||record.controller.signal.aborted)return;
   closeFull();const begin=now();let sheet;
   try{
    sheet=await fullDecode({kind:'skater',world,view,signal:record.controller.signal});
    if(disposed||record.controller.signal.aborted||pending!==record){sheet.close();return;}
    full={view,sheet};costs.push({view,queueWaitMs:begin-record.requestedAt,decodeAndSourceWaitMs:now()-begin});
    if(costs.length>32)costs.shift();notify();
   }catch(error){
    if(sheet)sheet.close();
    if(!disposed&&!record.controller.signal.aborted){failedFull.add(view);costs.push({view,error:String(error)});if(costs.length>32)costs.shift();}
   }finally{if(pending===record)pending=null;}
  });
  queue=work.then(()=>{},()=>{});
 }
 function atlasFrame(){
  if(!atlas)return null;const column=Math.min(3,Math.floor(phase*4)),jump=state==='jump';
  const selected=atlas.metadata.frames[(jump?4+wanted*4:0)+column],view=jump?wanted:0;
  return{image:atlas.image,metadata:{...atlas.metadata,pixelsPerUnit:selected.pixelsPerUnit},frame:selected,view,wantedView:wanted,
   requestedState:state,fallbackState:!jump&&(state!=='coast'||wanted!==0),shadowPixelsPerUnit:selected.shadowPixelsPerUnit};
 }
 function frame(){
  if(disposed)return null;if(fallback)return fallback.frame();
  if(state==='jump')return atlasFrame();
  const selected=full?.view===wanted?full.sheet.metadata.frames.find(item=>item.state===state&&item.phase===PHASES[Math.min(3,Math.floor(phase*4))]):null;
  return selected?{image:full.sheet.image,metadata:full.sheet.metadata,frame:selected,view:wanted,wantedView:wanted,requestedState:state,fallbackState:false,
   shadowPixelsPerUnit:registry.skater[world][wanted].shadowPixelsPerUnit}:atlasFrame();
 }
 function select(view,nextState,dt=0,{actionPhase}={}){
  if(disposed)return null;wanted=viewId(view);
  if(state!==nextState){state=nextState;clock=0;}else clock+=Math.max(0,dt);
  phase=Number.isFinite(actionPhase)?Math.max(0,Math.min(.999,actionPhase)):clock%1;
  if(fallback)return fallback.select(view,nextState,dt,{actionPhase});
  if(state!=='jump')requestFull(wanted);
  return frame();
 }
 const ready=(async()=>{
  try{
   const sheet=await initialDecode(initialController.signal);
   if(disposed||initialController.signal.aborted){sheet.close();return false;}
   atlas=sheet;requestFull(0);notify();return true;
  }catch(error){
   if(disposed||initialController.signal.aborted)return false;atlasFailure=String(error);
   // The failed initial decoder owns no delivered bitmap before this separate
   // existing full/compact-row path starts. It keeps its own finite two owners.
   fallback=createFallback?createFallback():createSportsSkaterArt({registry,rows,world,onChange});
   const delivered=await fallback.ready;return!disposed&&Boolean(delivered);
  }
 })();
 return{ready,select,frame,snapshot(){
  if(fallback)return{...fallback.snapshot(),strategy:'existing-full/compact-row-fallback',atlasFailure};
  const pose=frame();return{kind:'skater',world,delivery:pose?'delivered':'pending',strategy:'initial-coast0/all-jump-directions',view:pose?.view??null,wantedView:wanted,
   state:pose?.frame.state??null,requestedState:state,phase,fallbackState:pose?.fallbackState||false,format:pose?.metadata.format??null,
   decodedOwnerKeys:[...(atlas?['initial:coast-jump']:[]),...(full?[`full:${full.view}`]:[])],pendingViews:pending?[pending.view]:[],
   decodedBytes:(atlas?.metadata.decodedBytes||0)+(full?.sheet.metadata.decodedBytes||0),maximumPairBytes:SPORTS_SKATER_READY_PAIR_BYTES,
   maximumOwners:2,atlasFailure,failedFullViews:[...failedFull],initialDecodeMs:atlas?.decodeAndSourceWaitMs??null,decodeCosts:costs.map(row=>({...row})),notificationErrors:[...notificationErrors],disposed};
 },dispose(){if(disposed)return;disposed=true;initialController.abort();cancelPending();closeFull();atlas?.close();atlas=null;fallback?.dispose();fallback=null;costs.length=0;notificationErrors.length=0;failedFull.clear();}};
}
