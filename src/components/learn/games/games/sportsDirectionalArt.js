const CHARACTERS={meadow:'bouncy',dino:'chompy',moonwood:'pip'};
const STATES={driver:['drive','turn_left','turn_right','brake','recover','celebrate'],skater:['coast','push','turn_left','turn_right','crouch','jump','land','grind','stumble','recover']};
const viewId=view=>((Math.round(view)%8)+8)%8;
const hashPattern=/^[0-9a-f]{64}$/;
export function sportsArtView(kind,{actorX,actorZ,yaw,cameraX,cameraZ}){
 const dx=cameraX-actorX,dz=cameraZ-actorZ,c=Math.cos(yaw),s=Math.sin(yaw),localX=dx*c-dz*s,localZ=dx*s+dz*c;
 return viewId(Math.atan2(localX,kind==='skater'?-localZ:localZ)/(Math.PI/4));
}
export function sportsArtSource(kind,world,view){
 if(!STATES[kind]||!CHARACTERS[world])throw new Error('Unknown original athlete art context');
 const game=kind==='driver'?'sound-racer':'spell-skate';return `/game-assets/${game}/recovery/${CHARACTERS[world]}/view-${viewId(view)}-v1`;
}
export function validateSportsArtMetadata(raw,{kind,world,view}){
 const rows=STATES[kind];if(!rows)return null;
 if(raw?.kind!==kind||raw.world!==world||raw.character!==CHARACTERS[world]||raw.view!==viewId(view)
  ||raw.runtime!==`${sportsArtSource(kind,world,view)}.webp`||!hashPattern.test(raw.runtimeSha256)||!hashPattern.test(raw.modelSha256)
  ||JSON.stringify(raw.states)!==JSON.stringify(rows)||JSON.stringify(raw.phases)!=='[0,0.25,0.5,0.75]'
  ||JSON.stringify(raw.cell)!=='[256,256]'||JSON.stringify(raw.viewSheet)!==JSON.stringify([1024,rows.length*256])
  ||raw.decodedBytes!==1024*rows.length*256*4||!Number.isFinite(raw.pixelsPerUnit)||raw.pixelsPerUnit<40||raw.pixelsPerUnit>120
  ||!Array.isArray(raw.frames)||raw.frames.length!==rows.length*4)return null;
 const keys=new Set();for(const frame of raw.frames){
  const row=rows.indexOf(frame.state),col=raw.phases.indexOf(frame.phase);if(row<0||col<0||keys.has(`${row}:${col}`)
   ||JSON.stringify(frame.cell)!==JSON.stringify([col*256,row*256,256,256])||!Array.isArray(frame.groundAnchor)||frame.groundAnchor.length!==2
   ||frame.groundAnchor.some(v=>!Number.isFinite(v)||v<0||v>256)||!Array.isArray(frame.opaqueBounds)||frame.opaqueBounds.length!==4
   ||frame.opaqueBounds.some(v=>!Number.isFinite(v)||v<0||v>256))return null;keys.add(`${row}:${col}`);
 }return structuredClone(raw);
}
async function decodeSheet({kind,world,view,signal}){
 const source=sportsArtSource(kind,world,view),response=await fetch(`${source}.json`,{signal});if(!response.ok)throw new Error('Registered athlete art metadata unavailable');
 const metadata=validateSportsArtMetadata(await response.json(),{kind,world,view});if(!metadata)throw new Error('Registered athlete art metadata invalid');
 const imageResponse=await fetch(`${source}.webp`,{signal});if(!imageResponse.ok)throw new Error('Original athlete art unavailable');const bytes=await imageResponse.arrayBuffer();
 const digest=await crypto.subtle.digest('SHA-256',bytes),hash=[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');if(hash!==metadata.runtimeSha256)throw new Error('Original athlete art fingerprint mismatch');
 const blob=new Blob([bytes],{type:'image/webp'});let image,close;
 if(typeof createImageBitmap==='function'){image=await createImageBitmap(blob);close=()=>image.close();}
 else {const url=URL.createObjectURL(blob);image=new Image();try{image.src=url;await image.decode();}catch(error){URL.revokeObjectURL(url);throw error;}close=()=>{image.src='';URL.revokeObjectURL(url);};}
 if(signal.aborted||image.width!==metadata.viewSheet[0]||image.height!==metadata.viewSheet[1]){close();throw new Error('Original athlete art decode cancelled or unregistered');}
 return{image,metadata,close};
}

// A game owns its current camera sheet plus at most one adjacent sheet. The
// original model-derived views are fetched separately; no hidden full-atlas
// upload, GLB payload duplication or global live texture cache is involved.
export function createDirectionalSportsArt({kind,world,decode=decodeSheet,onChange=()=>{},releaseView=()=>{}}){
 if(!STATES[kind]||!CHARACTERS[world])throw new Error('Unknown original athlete art context');
 const owners=new Map();let disposed=false,current=null,wanted=0,clock=0,state=STATES[kind][0],phase=0,failures=0;
 function evict(record){if(!record)return;record.controller.abort();if(record.sheet){releaseView(record.view,record.sheet);record.sheet.close();}owners.delete(record.view);}
 function keepOnly(views){for(const record of [...owners.values()])if(!views.includes(record.view))evict(record);}
 function request(view){
  view=viewId(view);if(owners.has(view))return owners.get(view).promise;
  const controller=new AbortController(),record={view,controller,sheet:null,settled:false};owners.set(view,record);
  record.promise=decode({kind,world,view,signal:controller.signal}).then(sheet=>{
   if(disposed||controller.signal.aborted||owners.get(view)!==record){sheet.close();return false;}
   record.sheet=sheet;if(view===wanted){current=record;keepOnly([wanted,viewId(wanted+1)]);onChange();}return true;
  }).catch(()=>{if(!controller.signal.aborted)failures++;return false;}).finally(()=>{record.settled=true;});return record.promise;
 }
 function select(view,nextState,dt=0,{actionPhase}={}){
  if(disposed)return null;view=viewId(view);wanted=view;
  if(state!==nextState){state=STATES[kind].includes(nextState)?nextState:STATES[kind][0];clock=0;}else clock+=Math.max(0,dt);
  phase=Number.isFinite(actionPhase)?Math.max(0,Math.min(.999,actionPhase)):clock%1;
  if(current?.view===view){keepOnly([view,viewId(view+1)]);request(viewId(view+1));}
  else if(owners.get(view)?.sheet){current=owners.get(view);keepOnly([view,viewId(view+1)]);request(viewId(view+1));onChange();}
  else {keepOnly(current?[current.view,view]:[view]);request(view);}
  return frame();
 }
 function frame(){
  const sheet=current?.sheet;if(!sheet)return null;const index=Math.min(3,Math.floor(phase*4)),selected=sheet.metadata.frames.find(item=>item.state===state&&item.phase===sheet.metadata.phases[index]);
  return selected?{image:sheet.image,metadata:sheet.metadata,frame:selected,view:current.view,wantedView:wanted}:null;
 }
 const ready=request(0);
 return{ready,select,frame,snapshot(){return{kind,world,delivery:current?.sheet?'delivered':'pending',view:current?.view??null,wantedView:wanted,state,phase,
  decodedViews:[...owners.values()].filter(record=>record.sheet).map(record=>record.view),pendingViews:[...owners.values()].filter(record=>!record.sheet&&!record.settled).map(record=>record.view),
  unavailableViews:[...owners.values()].filter(record=>!record.sheet&&record.settled).map(record=>record.view),
  decodedBytes:[...owners.values()].reduce((sum,record)=>sum+(record.sheet?.metadata.decodedBytes||0),0),failedViews:failures,disposed};},
 dispose(){if(disposed)return;disposed=true;for(const record of [...owners.values()])evict(record);current=null;}};
}
