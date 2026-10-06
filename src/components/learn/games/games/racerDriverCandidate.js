import {createDirectionalSportsArt} from './sportsDirectionalArt.js';

const bouncy=Object.freeze({
 format:'driver-384-tight-v2',world:'meadow',character:'bouncy',view:0,
 metadata:'/game-assets/sound-racer/recovery384/bouncy/view-0-v2.json',
 metadataSha256:'b2740bf1d82a3d39d4e8e8d9370201147ba2235d891e19d89156db58b8ffe88c',
 runtime:'/game-assets/sound-racer/recovery384/bouncy/view-0-v2.webp',
 runtimeSha256:'12347d54495be8526314c548abac4642080b183351c855bbda40d74077a86b29',
 modelSha256:'c159321cfe93b81515da78f46290e82236337b7ee8f11d74615db5cc86a814c1',
 decodedBytes:14155776,maximumPairBytes:28311552,pixelsPerUnit:136.24661033616846,
 groundAnchor:Object.freeze([192,311.5282]),
});
const chompy=Object.freeze({
 format:'driver-384-tight-v2',world:'dino',character:'chompy',view:0,
 metadata:'/game-assets/sound-racer/recovery384/chompy/view-0-v2.json',
 metadataSha256:'e34a4cca4adbfd460d8a9a86dc7013e57b75a7814155705182a4868ede746bea',
 runtime:'/game-assets/sound-racer/recovery384/chompy/view-0-v2.webp',
 runtimeSha256:'7481447a0afa994b0f5fc7cb2712489f62f294db99504b6ea74967664deaf99d',
 modelSha256:'6fa03ac5cbc0b8bd2f6b1196bc677d7dc93603b9d8d55d54351e5c7d09f2c8d5',
 decodedBytes:14155776,maximumPairBytes:28311552,pixelsPerUnit:136.282187358349,
 groundAnchor:Object.freeze([192.0,311.5125]),
});
const pip=Object.freeze({
 format:'driver-384-tight-v2',world:'moonwood',character:'pip',view:0,
 metadata:'/game-assets/sound-racer/recovery384/pip/view-0-v2.json',
 metadataSha256:'fcf5563b47f84a69ac6f030cbd2b20b077bd7c851a106312b07cfd67b0032a10',
 runtime:'/game-assets/sound-racer/recovery384/pip/view-0-v2.webp',
 runtimeSha256:'e0975c5200fd17ccfbc5fe12afa53c5cf6e893e842a556bc5b8e7035349ca1c0',
 modelSha256:'defc0153e5a6e0e4795c63d88a22b7bcd09b0155943f5dc59de3b96d4d2098c0',
 decodedBytes:14155776,maximumPairBytes:28311552,pixelsPerUnit:139.46399145454268,
 groundAnchor:Object.freeze([192,310.1002]),
});
export const RACER_384_CANDIDATES=Object.freeze({meadow:bouncy,dino:chompy,moonwood:pip});
export const RACER_384_CANDIDATE=bouncy;

// These three finite original BACK candidates do not change legacy validation
// or approve another view/cell size. Decode also checks the exact retained
// metadata bytes, which bind all measured contact and source-frame coordinates.
export function validateRacer384Candidate(raw,{kind,world,view}){
 const registered=RACER_384_CANDIDATES[world],states=['drive','turn_left','turn_right','brake','recover','celebrate'];
 if(!registered||kind!=='driver'||world!==registered.world||view!==0||raw?.format!==registered.format||raw.kind!==kind||raw.world!==world||raw.character!==registered.character||raw.view!==0
  ||raw.runtime!==registered.runtime||raw.runtimeSha256!==registered.runtimeSha256||raw.modelSha256!==registered.modelSha256
  ||JSON.stringify(raw.cell)!=='[384,384]'||JSON.stringify(raw.viewSheet)!=='[1536,2304]'||raw.decodedBytes!==registered.decodedBytes
  ||raw.pixelsPerUnit!==registered.pixelsPerUnit||JSON.stringify(raw.states)!==JSON.stringify(states)||JSON.stringify(raw.phases)!=='[0,0.25,0.5,0.75]'
  ||raw.framing?.mode!=='native-pose-union'||raw.framing.unionPoseCount!==24||raw.framing.marginPixels!==12
  ||Math.abs(384/raw.framing.orthoScale-raw.pixelsPerUnit)>1e-6||!Number.isFinite(raw.framing.orthoScale)||!Array.isArray(raw.frames)||raw.frames.length!==24)return null;
 const seen=new Set();
 for(const frame of raw.frames){
  const row=states.indexOf(frame.state),column=raw.phases.indexOf(frame.phase),key=`${row}:${column}`;
  if(row<0||column<0||seen.has(key)||JSON.stringify(frame.cell)!==JSON.stringify([column*384,row*384,384,384])
   ||JSON.stringify(frame.groundAnchor)!==JSON.stringify(registered.groundAnchor)||!Array.isArray(frame.opaqueBounds)||frame.opaqueBounds.length!==4
   ||frame.opaqueBounds.some(value=>!Number.isFinite(value)||value<=0||value>=384)||frame.opaqueBounds[0]>=frame.opaqueBounds[2]||frame.opaqueBounds[1]>=frame.opaqueBounds[3]
   ||!Array.isArray(frame.tyreContacts)||frame.tyreContacts.length!==4||!Array.isArray(frame.pedalSoles)||frame.pedalSoles.length!==2
   ||[...frame.tyreContacts,...frame.pedalSoles].some(point=>!Array.isArray(point)||point.length!==2||point.some(value=>!Number.isFinite(value)||value<0||value>=384)))return null;
  seen.add(key);
 }return structuredClone(raw);
}

async function digest(bytes){return[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');}
export async function decodeRacer384Candidate({kind,world,view,signal}){
 const registered=RACER_384_CANDIDATES[world];
 if(!registered||kind!=='driver'||world!==registered.world||view!==registered.view||signal.aborted)throw new Error('Only registered original BACK view0 candidates are available');
 const metadataResponse=await fetch(registered.metadata,{signal});if(!metadataResponse.ok)throw new Error('Original candidate registration unavailable');
 const metadataBytes=await metadataResponse.arrayBuffer();if(await digest(metadataBytes)!==registered.metadataSha256)throw new Error('Original candidate registration fingerprint mismatch');
 const metadata=validateRacer384Candidate(JSON.parse(new TextDecoder().decode(metadataBytes)),{kind,world,view});if(!metadata)throw new Error('Original candidate registration invalid');
 const response=await fetch(registered.runtime,{signal});if(!response.ok)throw new Error('Original candidate sheet unavailable');
 const bytes=await response.arrayBuffer();if(await digest(bytes)!==registered.runtimeSha256)throw new Error('Original candidate sheet fingerprint mismatch');
 if(signal.aborted)throw new Error('Original candidate cancelled before decode');
 const blob=new Blob([bytes],{type:'image/webp'});let image,release;
 if(typeof createImageBitmap==='function'){image=await createImageBitmap(blob);release=()=>image.close();}
 else{
  const url=URL.createObjectURL(blob);image=new Image();release=()=>{image.src='';URL.revokeObjectURL(url);};
  try{image.src=url;await image.decode();}catch(error){release();throw error;}
 }
 let closed=false;const close=()=>{if(closed)return;closed=true;release();};
 if(signal.aborted||image.width!==1536||image.height!==2304){close();throw new Error('Original candidate decode cancelled or unregistered');}
 return{metadata,image,close};
}

// Comparison owns at most the existing one legacy view and this one384 view.
// It refuses a live/pending adjacent legacy owner rather than temporarily
// decoding a third sheet. Ordinary selection remains legacy until explicit DEV
// input; normal production never fetches this unused candidate.
export function createRacerDriverComparisonArt({world,baseline=createDirectionalSportsArt({kind:'driver',world}),decode=decodeRacer384Candidate}){
 let candidate=null,preparing=null,disposed=false,format='driver-256-v1';
 const active=()=>format===RACER_384_CANDIDATE.format?candidate:baseline;
 function owned(){return[baseline,candidate].filter(Boolean).map(owner=>owner.snapshot());}
 async function prepare(){
  if(disposed||!RACER_384_CANDIDATES[world])return false;
  if(candidate)return candidate.snapshot().delivery==='delivered';
  if(preparing)return preparing;
  const old=baseline.snapshot();if(old.view!==0||old.wantedView!==0||old.decodedViews.length!==1||old.pendingViews.length)return false;
  candidate=createDirectionalSportsArt({kind:'driver',world,decode});const pending=candidate;
  preparing=pending.ready.then(ready=>{
   const delivered=!disposed&&ready&&pending.snapshot().decodedBytes===RACER_384_CANDIDATE.decodedBytes;
   if(!delivered){pending.dispose();if(candidate===pending)candidate=null;}
   return delivered;
  }).finally(()=>{preparing=null;});
  return preparing;
 }
 return{ready:baseline.ready,prepareCandidate:prepare,switchFormat(next){
  if(disposed||!['driver-256-v1',RACER_384_CANDIDATE.format].includes(next)||next===RACER_384_CANDIDATE.format&&candidate?.snapshot().delivery!=='delivered')return false;
  format=next;return true;
 },select(...args){return disposed?null:active().select(...args);},frame:()=>disposed?null:active().frame(),
 snapshot(){const owner=active(),snap=owner?.snapshot()||baseline.snapshot(),owners=owned();return{...snap,format,candidatePrepared:candidate?.snapshot().delivery==='delivered',
  comparisonDecodedViews:owners.reduce((sum,row)=>sum+row.decodedViews.length,0),comparisonDecodedBytes:owners.reduce((sum,row)=>sum+row.decodedBytes,0),maximumPairBytes:RACER_384_CANDIDATE.maximumPairBytes};},
 dispose(){if(disposed)return;disposed=true;baseline.dispose();candidate?.dispose();candidate=null;preparing=null;format='driver-256-v1';}};
}
