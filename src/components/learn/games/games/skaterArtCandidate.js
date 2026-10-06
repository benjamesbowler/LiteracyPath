import {createDirectionalSportsArt} from './sportsDirectionalArt.js';

export const SKATER_384_CANDIDATE=Object.freeze({
 format:'skater-384-tight-v2',world:'meadow',character:'bouncy',view:0,
 metadata:'/game-assets/spell-skate/recovery384/bouncy/view-0-v2.json',
 metadataSha256:'77f4ffdc930349dd573050d21cfbdc53f0ffb9d27b5ec91e27af2629cbb1a327',
 runtime:'/game-assets/spell-skate/recovery384/bouncy/view-0-v2.webp',
 runtimeSha256:'f32fa56f5a0d9a308bed35b07af693f3cf837227e8848b12a3e08399fd174cc5',
 modelSha256:'d67c387273ebcba0a9c5565db72d1b9f2c907d5bf40fab27d61818fdea97b413',
 decodedBytes:23592960,maximumPairBytes:47185920,maximumComparisonBytes:34078720,
 pixelsPerUnit:87.54742264947954,groundAnchor:Object.freeze([192,314.3452]),
});
const states=['coast','push','turn_left','turn_right','crouch','jump','land','grind','stumble','recover'];

// Only this exact original-model BACK sheet is admitted for paused DEV review.
// The retained256 validator and ordinary production selection stay unchanged.
export function validateSkater384Candidate(raw,{kind,world,view}){
 const registered=SKATER_384_CANDIDATE;
 if(kind!=='skater'||world!==registered.world||view!==0||raw?.format!==registered.format||raw.kind!==kind||raw.world!==world||raw.character!==registered.character||raw.view!==0
  ||raw.runtime!==registered.runtime||raw.runtimeSha256!==registered.runtimeSha256||raw.modelSha256!==registered.modelSha256
  ||JSON.stringify(raw.cell)!=='[384,384]'||JSON.stringify(raw.viewSheet)!=='[1536,3840]'||raw.decodedBytes!==registered.decodedBytes
  ||raw.pixelsPerUnit!==registered.pixelsPerUnit||JSON.stringify(raw.states)!==JSON.stringify(states)||JSON.stringify(raw.phases)!=='[0,0.25,0.5,0.75]'
  ||raw.framing?.mode!=='native-pose-union'||raw.framing.unionPoseCount!==40||raw.framing.marginPixels!==12
  ||!Number.isFinite(raw.framing.orthoScale)||Math.abs(384/raw.framing.orthoScale-raw.pixelsPerUnit)>1e-6||!Array.isArray(raw.frames)||raw.frames.length!==40)return null;
 const seen=new Set();
 for(const frame of raw.frames){
  const row=states.indexOf(frame.state),column=raw.phases.indexOf(frame.phase),key=`${row}:${column}`;
  if(row<0||column<0||seen.has(key)||JSON.stringify(frame.cell)!==JSON.stringify([column*384,row*384,384,384])
   ||JSON.stringify(frame.groundAnchor)!==JSON.stringify(registered.groundAnchor)||!Array.isArray(frame.opaqueBounds)||frame.opaqueBounds.length!==4
   ||frame.opaqueBounds.some(value=>!Number.isFinite(value)||value<=0||value>=384)||frame.opaqueBounds[0]>=frame.opaqueBounds[2]||frame.opaqueBounds[1]>=frame.opaqueBounds[3]
   ||!Array.isArray(frame.tyreContacts)||frame.tyreContacts.length!==4||!Array.isArray(frame.soleContacts)||frame.soleContacts.length!==2||!Array.isArray(frame.palmAnchors)||frame.palmAnchors.length!==2
   ||[...frame.tyreContacts,...frame.soleContacts,...frame.palmAnchors].some(point=>!Array.isArray(point)||point.length!==2||point.some(value=>!Number.isFinite(value)||value<0||value>=384)))return null;
  seen.add(key);
 }return structuredClone(raw);
}
async function digest(bytes){return[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');}
export async function decodeSkater384Candidate({kind,world,view,signal}){
 const registered=SKATER_384_CANDIDATE;
 if(kind!=='skater'||world!==registered.world||view!==0||signal.aborted)throw new Error('Only registered original Bouncy BACK view0 candidate is available');
 const registration=await fetch(registered.metadata,{signal});if(!registration.ok)throw new Error('Original candidate registration unavailable');
 const metadataBytes=await registration.arrayBuffer();if(await digest(metadataBytes)!==registered.metadataSha256)throw new Error('Original candidate registration fingerprint mismatch');
 const metadata=validateSkater384Candidate(JSON.parse(new TextDecoder().decode(metadataBytes)),{kind,world,view});if(!metadata)throw new Error('Original candidate registration invalid');
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
 if(signal.aborted||image.width!==1536||image.height!==3840){close();throw new Error('Original candidate decode cancelled or unregistered');}
 return{metadata,image,close};
}

export function createSkaterComparisonArt({world,baseline=createDirectionalSportsArt({kind:'skater',world}),decode=decodeSkater384Candidate}){
 let candidate=null,preparing=null,disposed=false,format='skater-256-v1';
 const active=()=>format===SKATER_384_CANDIDATE.format?candidate:baseline;
 const owners=()=>[baseline,candidate].filter(Boolean).map(owner=>owner.snapshot());
 async function prepare(){
  if(disposed||world!==SKATER_384_CANDIDATE.world)return false;
  if(candidate)return candidate.snapshot().delivery==='delivered';if(preparing)return preparing;
  const old=baseline.snapshot();if(old.view!==0||old.wantedView!==0||old.decodedViews.length!==1||old.pendingViews.length)return false;
  candidate=createDirectionalSportsArt({kind:'skater',world,decode});const pending=candidate;
  preparing=pending.ready.then(ready=>{
   const delivered=!disposed&&ready&&pending.snapshot().decodedBytes===SKATER_384_CANDIDATE.decodedBytes;
   if(!delivered){pending.dispose();if(candidate===pending)candidate=null;}return delivered;
  }).finally(()=>{preparing=null;});return preparing;
 }
 return{ready:baseline.ready,prepareCandidate:prepare,switchFormat(next){
  if(disposed||!['skater-256-v1',SKATER_384_CANDIDATE.format].includes(next)||next===SKATER_384_CANDIDATE.format&&candidate?.snapshot().delivery!=='delivered')return false;
  format=next;return true;
 },select(...args){
  if(disposed)return null;const pose=active().select(...args);if(!pose)return null;
  // The original contact-shadow dimensions are independent of this sharper
  // source's texel density. This only supplies registration for DEV comparison.
  return{...pose,shadowPixelsPerUnit:baseline.frame()?.metadata.pixelsPerUnit||pose.metadata.pixelsPerUnit};
 },frame:()=>disposed?null:active().frame(),snapshot(){
  const snapshot=active()?.snapshot()||baseline.snapshot(),owned=owners();return{...snapshot,format,candidatePrepared:candidate?.snapshot().delivery==='delivered',
   comparisonDecodedViews:owned.reduce((sum,row)=>sum+row.decodedViews.length,0),comparisonDecodedBytes:owned.reduce((sum,row)=>sum+row.decodedBytes,0),maximumPairBytes:SKATER_384_CANDIDATE.maximumComparisonBytes};
 },dispose(){if(disposed)return;disposed=true;baseline.dispose();candidate?.dispose();candidate=null;preparing=null;format='skater-256-v1';}};
}
