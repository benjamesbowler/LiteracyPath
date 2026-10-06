import {createDirectionalSportsArt} from './sportsDirectionalArt.js';

const CHARACTERS={meadow:'bouncy',dino:'chompy',moonwood:'pip'};
const STATES={driver:['drive','turn_left','turn_right','brake','recover','celebrate'],skater:['coast','push','turn_left','turn_right','crouch','jump','land','grind','stumble','recover']};
const hash=/^[0-9a-f]{64}$/;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const point=(value,size)=>Array.isArray(value)&&value.length===2&&value.every(n=>Number.isFinite(n)&&n>=0&&n<size);

// The generated48-entry table is a normal-delivery authority, separate from
// retained256 validation and the explicitly finite DEV comparison candidates.
export function completeSportsSharpRegistry(registry){
 return ['driver','skater'].every(kind=>Object.entries(CHARACTERS).every(([world,character])=>{
  const rows=registry?.[kind]?.[world],game=kind==='driver'?'sound-racer':'spell-skate';
  return Array.isArray(rows)&&rows.length===8&&rows.every((row,view)=>row?.kind===kind&&row.world===world&&row.character===character&&row.view===view
   &&row.format===`${kind}-384-tight-v2`&&row.metadata===`/game-assets/${game}/recovery384/${character}/view-${view}-v2.json`
   &&row.runtime===`/game-assets/${game}/recovery384/${character}/view-${view}-v2.webp`
   &&[row.metadataSha256,row.runtimeSha256,row.modelSha256].every(value=>hash.test(value))
   &&Number.isInteger(row.metadataBytes)&&row.metadataBytes>0&&Number.isInteger(row.runtimeBytes)&&row.runtimeBytes>0
   &&row.decodedBytes===1536*STATES[kind].length*384*4&&Number.isFinite(row.pixelsPerUnit)&&row.pixelsPerUnit>0&&point(row.groundAnchor,384)
   &&(kind!=='skater'||Number.isFinite(row.shadowPixelsPerUnit)&&row.shadowPixelsPerUnit>0));
 }));
}

export function validateSportsSharpMetadata(raw,{kind,world,view,registered}){
 const states=STATES[kind];
 if(!states||!registered||registered.kind!==kind||registered.world!==world||registered.view!==view||!Number.isInteger(view)||view<0||view>7
  ||raw?.format!==registered.format||raw.kind!==kind||raw.world!==world||raw.character!==registered.character||raw.view!==view
  ||raw.runtime!==registered.runtime||raw.runtimeSha256!==registered.runtimeSha256||raw.runtimeBytes!==registered.runtimeBytes||raw.modelSha256!==registered.modelSha256
  ||!same(raw.cell,[384,384])||!same(raw.viewSheet,[1536,states.length*384])||raw.decodedBytes!==registered.decodedBytes
  ||raw.pixelsPerUnit!==registered.pixelsPerUnit||!same(raw.states,states)||!same(raw.phases,[0,.25,.5,.75])
  ||raw.framing?.mode!=='native-pose-union'||raw.framing.unionPoseCount!==states.length*4||raw.framing.marginPixels!==12
  ||!Number.isFinite(raw.framing.orthoScale)||raw.framing.orthoScale<=0||Math.abs(384/raw.framing.orthoScale-raw.pixelsPerUnit)>1e-6
  ||!Array.isArray(raw.frames)||raw.frames.length!==states.length*4)return null;
 const keys=new Set();
 for(const frame of raw.frames){
  const row=states.indexOf(frame.state),column=raw.phases.indexOf(frame.phase),key=`${row}:${column}`,bounds=frame.opaqueBounds;
  if(row<0||column<0||keys.has(key)||!same(frame.cell,[column*384,row*384,384,384])||!same(frame.groundAnchor,registered.groundAnchor)
   ||!Array.isArray(bounds)||bounds.length!==4||bounds.some(n=>!Number.isFinite(n)||n<=0||n>=384)||bounds[0]>=bounds[2]||bounds[1]>=bounds[3]
   ||!Array.isArray(frame.tyreContacts)||frame.tyreContacts.length!==4||frame.tyreContacts.some(p=>!point(p,384))
   ||!Array.isArray(frame[kind==='driver'?'pedalSoles':'soleContacts'])||frame[kind==='driver'?'pedalSoles':'soleContacts'].length!==2
   ||frame[kind==='driver'?'pedalSoles':'soleContacts'].some(p=>!point(p,384))
   ||kind==='skater'&&(!Array.isArray(frame.palmAnchors)||frame.palmAnchors.length!==2||frame.palmAnchors.some(p=>!point(p,384))))return null;
  keys.add(key);
 }
 if(kind==='skater'&&(!Number.isFinite(raw.framing.originalOrthoScale)||raw.framing.originalOrthoScale<=0||256/raw.framing.originalOrthoScale!==registered.shadowPixelsPerUnit))return null;
 return structuredClone(raw);
}

async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}

export function createSportsSharpDecoder(registry){
 if(!completeSportsSharpRegistry(registry))throw new Error('All48 registered original sharp directions are required');
 return async({kind,world,view,signal})=>{
  const registered=registry?.[kind]?.[world]?.[view];
  if(!registered||!Number.isInteger(view)||view<0||view>7||signal.aborted)throw new Error('Unregistered sharp athlete context');
  const response=await fetch(registered.metadata,{signal});if(!response.ok)throw new Error('Sharp athlete registration unavailable');
  const metadataBytes=await response.arrayBuffer();
  if(metadataBytes.byteLength!==registered.metadataBytes||await digest(metadataBytes)!==registered.metadataSha256)throw new Error('Sharp athlete registration fingerprint mismatch');
  const metadata=validateSportsSharpMetadata(JSON.parse(new TextDecoder().decode(metadataBytes)),{kind,world,view,registered});
  if(!metadata)throw new Error('Sharp athlete registration invalid');
  const pixels=await fetch(registered.runtime,{signal});if(!pixels.ok)throw new Error('Sharp athlete image unavailable');
  const bytes=await pixels.arrayBuffer();
  if(bytes.byteLength!==registered.runtimeBytes||await digest(bytes)!==registered.runtimeSha256)throw new Error('Sharp athlete image fingerprint mismatch');
  if(signal.aborted)throw new Error('Sharp athlete cancelled before decode');
  const blob=new Blob([bytes],{type:'image/webp'});let image,release;
  if(typeof createImageBitmap==='function'){image=await createImageBitmap(blob);release=()=>image.close();}
  else{
   const url=URL.createObjectURL(blob);image=new Image();release=()=>{image.removeAttribute('src');URL.revokeObjectURL(url);};
   try{image.src=url;await image.decode();}catch(error){release();throw error;}
  }
  let closed=false;const close=()=>{if(closed)return;closed=true;release();};
  if(signal.aborted||image.width!==metadata.viewSheet[0]||image.height!==metadata.viewSheet[1]){close();throw new Error('Sharp athlete decode cancelled or unregistered');}
  return{image,metadata,close};
 };
}

export function createSportsSharpArt({kind,world,registry,onChange,releaseView,decode}){
 if(!completeSportsSharpRegistry(registry))throw new Error('All48 registered original sharp directions are required');
 const owner=createDirectionalSportsArt({kind,world,decode:decode||createSportsSharpDecoder(registry),onChange,releaseView});
 const pose=frame=>frame&&kind==='skater'?{...frame,shadowPixelsPerUnit:registry.skater[world][frame.view].shadowPixelsPerUnit}:frame;
 return{...owner,select(...args){return pose(owner.select(...args));},frame:()=>pose(owner.frame()),
  snapshot:()=>({...owner.snapshot(),format:`${kind}-384-tight-v2`,maximumPairBytes:1536*STATES[kind].length*384*4*2})};
}
