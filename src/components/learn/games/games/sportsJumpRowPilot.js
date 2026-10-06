import {completeSportsSharpRegistry,createSportsSharpDecoder} from './sportsSharpArt.js';
import {SPORTS_JUMP_ROWS} from './sportsJumpRowRegistry.js';

const FORMAT='skater-384-jump-row-pilot-v1';
const ROW_BYTES=1536*384*4;
const PHASES=[0,.25,.5,.75];
const digestPattern=/^[a-f0-9]{64}$/;
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const viewId=value=>((Math.round(value)%8)+8)%8;
const now=()=>performance.now();
async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}

export function validJumpRowPilotTable(rows,registry,world='dino'){
 const source=SPORTS_JUMP_ROWS[world];
 return Boolean(source)&&completeSportsSharpRegistry(registry)&&Array.isArray(rows)&&rows.length===8&&rows.every((row,view)=>row?.view===view
  &&equal(row,source.rows[view])
  &&row.metadata===`/game-assets/spell-skate/recovery384-action-pilot/${source.character}/jump/view-${view}-v1.json`
  &&row.runtime===`/game-assets/spell-skate/recovery384-action-pilot/${source.character}/jump/view-${view}-v1.webp`
  &&Number.isInteger(row.metadataBytes)&&row.metadataBytes>0&&Number.isInteger(row.runtimeBytes)&&row.runtimeBytes>0
  &&[row.metadataSha256,row.runtimeSha256,row.decodedCropSha256].every(value=>digestPattern.test(value))&&row.decodedBytes===ROW_BYTES)
  &&rows.reduce((sum,row)=>sum+row.runtimeBytes,0)===source.maximumEncodedBytes&&rows.reduce((sum,row)=>sum+row.metadataBytes,0)===source.maximumMetadataEncodedBytes;
}

export function validateJumpRowPilotMetadata(raw,entry,full){
 if(raw?.format!==FORMAT||raw.kind!=='skater'||raw.world!==full.world||raw.character!==full.character||raw.view!==entry.view
  ||raw.runtime!==entry.runtime||raw.runtimeBytes!==entry.runtimeBytes||raw.runtimeSha256!==entry.runtimeSha256
  ||raw.modelSha256!==full.modelSha256||raw.decodedCropSha256!==entry.decodedCropSha256
  ||!equal(raw.states,['jump'])||!equal(raw.phases,PHASES)||!equal(raw.cell,[384,384])||!equal(raw.viewSheet,[1536,384])
  ||raw.decodedBytes!==ROW_BYTES||raw.pixelsPerUnit!==full.pixelsPerUnit||raw.shadowPixelsPerUnit!==full.shadowPixelsPerUnit
  ||raw.lineage?.basis!=='decoded-current-runtime-RGBA'||raw.lineage.fullMetadata!==full.metadata||raw.lineage.fullMetadataSha256!==full.metadataSha256
  ||raw.lineage.fullRuntime!==full.runtime||raw.lineage.fullRuntimeSha256!==full.runtimeSha256||!equal(raw.lineage.crop,[0,1920,1536,384])
  ||raw.lineage.changedChannels!==0||!Array.isArray(raw.frames)||raw.frames.length!==4)return null;
 for(const [index,frame]of raw.frames.entries()){
  if(frame.state!=='jump'||frame.phase!==PHASES[index]||!equal(frame.cell,[index*384,0,384,384])||!equal(frame.fullCell,[index*384,1920,384,384])
   ||!equal(frame.groundAnchor,full.groundAnchor)||[['tyreContacts',4],['soleContacts',2],['palmAnchors',2]].some(([key,count])=>!Array.isArray(frame[key])||frame[key].length!==count||frame[key].some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>=384))))return null;
 }
 return raw;
}

// This finite pilot owns compressed blobs only. Two asynchronous fetch workers
// never wait on player input; a failed source remains a negative cache entry.
function createRowCache(rows,registry,world){
 const budget=SPORTS_JUMP_ROWS[world];
 const records=new Map();let disposed=false,fetchedBytes=0;const controllers=new Set();
 const tasks=rows.map(entry=>{
  let finish;const promise=new Promise(resolve=>{finish=resolve;});const record={entry,promise,finish,blob:null,metadata:null,error:null};records.set(entry.view,record);return record;
 });
 let next=0;
 async function worker(){
  while(!disposed&&next<tasks.length){
   const record=tasks[next++],entry=record.entry,controller=new AbortController();controllers.add(controller);
   try{
    const registration=await fetch(entry.metadata,{signal:controller.signal});if(!registration.ok)throw new Error('Pilot row registration unavailable');
    const metadataBytes=await registration.arrayBuffer();fetchedBytes+=metadataBytes.byteLength;
    if(metadataBytes.byteLength!==entry.metadataBytes||await digest(metadataBytes)!==entry.metadataSha256)throw new Error('Pilot row registration fingerprint');
    const metadata=validateJumpRowPilotMetadata(JSON.parse(new TextDecoder().decode(metadataBytes)),entry,registry.skater[world][entry.view]);
    if(!metadata)throw new Error('Pilot row registration invalid');
    const response=await fetch(entry.runtime,{signal:controller.signal});if(!response.ok)throw new Error('Pilot row image unavailable');
    const bytes=await response.arrayBuffer();fetchedBytes+=bytes.byteLength;
    if(bytes.byteLength!==entry.runtimeBytes||await digest(bytes)!==entry.runtimeSha256)throw new Error('Pilot row image fingerprint');
    if(disposed||controller.signal.aborted)throw new Error('Pilot cache cancelled');
    record.blob=new Blob([bytes],{type:'image/webp'});record.metadata=metadata;
   }catch(error){record.error=String(error);}finally{controllers.delete(controller);record.finish?.();record.finish=null;}
  }
 }
 const ready=Promise.all([worker(),worker()]);
 return{ready,async get(view){const record=records.get(view);if(!record)throw new Error('Unregistered pilot row');await record.promise;if(disposed||record.error||!record.blob)throw new Error(record.error||'Pilot row cache disposed');return record;},
  snapshot(){return{disposed,prefetchConcurrency:2,sourceCount:records.size,encodedBytes:[...records.values()].reduce((sum,r)=>sum+(r.blob?.size||0),0),maximumEncodedBytes:budget.maximumEncodedBytes,metadataEncodedBytes:[...records.values()].reduce((sum,r)=>sum+(r.metadata?r.entry.metadataBytes:0),0),maximumMetadataEncodedBytes:budget.maximumMetadataEncodedBytes,fetchedBytes,
   readyViews:[...records.values()].filter(r=>r.blob).map(r=>r.entry.view),failedViews:[...records.values()].filter(r=>r.error).map(r=>r.entry.view),pendingViews:[...records.values()].filter(r=>r.finish).map(r=>r.entry.view)};},
  dispose(){if(disposed)return;disposed=true;for(const controller of controllers)controller.abort();controllers.clear();for(const record of records.values()){record.blob=null;record.metadata=null;record.error='disposed';record.finish?.();record.finish=null;}records.clear();}};
}

async function decodeRow(record,signal){
 if(signal.aborted)throw new Error('Pilot row cancelled');
 const begin=now();
 let image,release;
 if(typeof createImageBitmap==='function'){image=await createImageBitmap(record.blob);release=()=>image.close();}
 else{
  const url=URL.createObjectURL(record.blob);image=new Image();release=()=>{image.removeAttribute('src');URL.revokeObjectURL(url);};
  try{image.src=url;await image.decode();}catch(error){release();throw error;}
 }
 let closed=false;const close=()=>{if(closed)return;closed=true;release();};
 if(signal.aborted||image.width!==1536||image.height!==384){close();throw new Error('Pilot row decode cancelled or invalid');}
 return{image,metadata:record.metadata,close,imageDecodeMs:now()-begin};
}

// Compact jump rows and complete registered action sheets share one allocator.
// The original pilot name remains for retained regression fixtures; normal
// rendering uses the same implementation through createSportsSkaterArt below.
export function createSportsJumpRowPilot({registry,rows,world='dino',onChange=()=>{},decodeFull,decodePilot,cache:injectedCache}){
 if(!validJumpRowPilotTable(rows,registry,world))throw new Error('Exact finite selected-world eight-row pilot required');
 const cache=injectedCache||createRowCache(rows,registry,world),fullDecode=decodeFull||createSportsSharpDecoder(registry),rowDecode=decodePilot||decodeRow;
 const owners=new Map(),failedRows=new Set(),costs=[];let disposed=false,current=null,wanted=0,state='coast',phase=0,clock=0,allocationQueue=Promise.resolve();
 const family=()=>state==='jump'?'jump':'full';
 function evict(record){if(!record)return;record.controller.abort();record.sheet?.close();record.sheet=null;owners.delete(record.key);if(current===record)current=null;}
 function keepOnly(keys){for(const record of [...owners.values()])if(!keys.includes(record.key))evict(record);}
 function request(view,kind){
  const key=`${kind}:${view}`;if(owners.has(key))return owners.get(key);
  const record={key,view,kind,controller:new AbortController(),sheet:null,settled:false,fallbackReason:null,requestedAt:now()};owners.set(key,record);
  const {signal}=record.controller;
  const work=allocationQueue.catch(()=>{}).then(async()=>{
   if(disposed||signal.aborted)throw new Error('Pilot request cancelled before allocation');
   const begin=now();let sheet,cacheWaitMs=0;
   if(kind==='jump'&&!failedRows.has(view)){
    try{const source=await cache.get(view);cacheWaitMs=now()-begin;if(signal.aborted)throw new Error('Pilot row cancelled before allocation');sheet=await rowDecode(source,signal);}
    catch(error){if(signal.aborted||disposed)throw error;failedRows.add(view);record.fallbackReason=String(error);}
   }
   if(!sheet){if(disposed||signal.aborted)throw new Error('Pilot full fallback cancelled');sheet=await fullDecode({kind:'skater',world,view,signal});}
   if(disposed||signal.aborted||owners.get(key)!==record){sheet.close();throw new Error('Pilot late owner cancelled');}
   costs.push({view,family:kind,sourceFormat:sheet.metadata.format,queueWaitMs:begin-record.requestedAt,cacheWaitMs,imageDecodeMs:sheet.imageDecodeMs??null,decodeAndSourceWaitMs:now()-begin,fallback:Boolean(record.fallbackReason)});if(costs.length>64)costs.shift();
   record.sheet=sheet;
   if(view===wanted&&kind===family()){
    current=record;
    const nextKind=kind==='full'&&state==='coast'?'jump':kind,next=viewId(view+1);
    keepOnly([record.key,`${nextKind}:${next}`]);
    // The real requested image has arrived. Release the prior current image
    // before preparing its one adjacent source, without losing another render
    // interval or adding a third decoded owner. Allocation still waits for
    // this work item to finish in the same serialized queue.
    request(next,nextKind);onChange();
   }
   return true;
  });
  // All allocations, including a failed-row full fallback, share this queue.
  // A cancelled late bitmap closes before the next request can allocate.
  allocationQueue=work.then(()=>{},()=>{});record.promise=work.catch(()=>false).finally(()=>{record.settled=true;});return record;
 }
 function frame(){
  const metadata=current?.sheet?.metadata;if(!metadata)return null;
  const column=Math.min(3,Math.floor(phase*4));let selected=metadata.frames.find(item=>item.state===state&&item.phase===PHASES[column]);
  const fallbackState=!selected;
  if(!selected)selected=metadata.frames.find(item=>item.state==='jump'&&item.phase===PHASES[column])||metadata.frames[0];
  return selected?{image:current.sheet.image,metadata,frame:selected,view:current.view,wantedView:wanted,requestedState:state,fallbackState,shadowPixelsPerUnit:registry.skater[world][current.view].shadowPixelsPerUnit}:null;
 }
 function select(view,nextState,dt=0,{actionPhase}={}){
  if(disposed)return null;view=viewId(view);wanted=view;
  if(state!==nextState){state=nextState;clock=0;}else clock+=Math.max(0,dt);
  phase=Number.isFinite(actionPhase)?Math.max(0,Math.min(.999,actionPhase)):clock%1;
  const kind=family(),key=`${kind}:${view}`,record=owners.get(key);
  // Full view0 already has every registered action. Keep its real jump cells
  // during a cold first flight rather than decoding another row0 or a costly
  // adjacent coast atlas first. The one adjacent slot prepares jump1. A real
  // turn/other state at view1 still requests its full source immediately.
  const compatibleFull=current?.view===view&&current.sheet?.metadata.format==='skater-384-tight-v2'
   &&current.sheet.metadata.frames.some(item=>item.state===state);
  if(current?.key===key||record?.sheet||compatibleFull){
   current=record?.sheet?record:current;
   const nextKind=kind==='full'&&state==='coast'?'jump':kind;
   keepOnly([current.key,`${nextKind}:${viewId(view+1)}`]);request(viewId(view+1),nextKind);
  }
  else{keepOnly(current?[current.key,key]:[key]);request(view,kind);}
  return frame();
 }
 const ready=request(0,'full').promise;
 return{ready,pilotPrefetch:cache.ready,select,frame,snapshot(){const pose=frame();return{kind:'skater',world,delivery:pose?'delivered':'pending',view:pose?.view??null,wantedView:wanted,state:pose?.frame.state??null,requestedState:state,phase,fallbackState:pose?.fallbackState||false,
  decodedViews:[...owners.values()].filter(r=>r.sheet).map(r=>r.view),decodedOwnerKeys:[...owners.values()].filter(r=>r.sheet).map(r=>r.key),pendingViews:[...owners.values()].filter(r=>!r.sheet&&!r.settled).map(r=>r.view),
  decodedBytes:[...owners.values()].reduce((sum,r)=>sum+(r.sheet?.metadata.decodedBytes||0),0),maximumPairBytes:47_185_920,failedRows:[...failedRows],format:pose?.metadata.format||null,disposed,
  cache:cache.snapshot(),decodeCosts:costs.map(row=>({...row}))};},dispose(){if(disposed)return;disposed=true;for(const record of [...owners.values()])evict(record);current=null;cache.dispose();costs.length=0;}};
}

export const createSportsSkaterArt=createSportsJumpRowPilot;
