import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// Source registration is authored once in registration.json. Compile actual
// irregular opaque bounds and visible contacts; never fabricate hidden hands.
const root=path.resolve(import.meta.dirname,'../..');
const directory='source-art/arcade/physical-worlds/word-climb';
// This explicit metadata operation records retained native evidence. Encoding
// or source registration alone still creates PENDING acceptance below.
if(process.argv.includes('--review-metadata-only')){
  const evidencePath=`${directory}/native-verification.json`;
  const evidence=JSON.parse(await fs.readFile(path.join(root,evidencePath),'utf8'));
  if(evidence.localRuntimeAcceptance!=='LOCAL_NATIVE_PASS'||!evidence.currentPacedProofIds?.length
    ||Object.values(evidence.manualEvidence).some(value=>value!=='UNKNOWN'))throw Error('Requires truthful retained local native evidence and unknown manual observations');
  for(const id of evidence.currentPacedProofIds){
    const proof=evidence.nativeProofs.find(row=>row.id===id);
    if(!proof||!['passed','measured'].includes(proof.status)||!proof.sourceFreezeExact
      ||!Number.isFinite(proof.durationSeconds)||proof.durationSeconds<=0
      ||!/^[a-f0-9]{64}$/.test(proof.proofSha256))throw Error(`${id}: missing retained current native proof`);
  }
  const identity=new Map(evidence.compiledRuntimeAssets.map(asset=>[asset.path,asset]));
  for(const name of ['manifest.json','scenery-manifest.json']){
    const file=path.join(root,directory,name),manifest=JSON.parse(await fs.readFile(file,'utf8'));
    for(const asset of manifest.assets){
      const runtime=await fs.readFile(path.join(root,'public'+asset.runtime));
      const source=await fs.readFile(path.join(root,asset.source));
      const expected=identity.get('public'+asset.runtime);
      if(!expected||expected.sha256!==crypto.createHash('sha256').update(runtime).digest('hex')
        ||asset.runtimeSha256!==expected.sha256||asset.runtimeBytes!==runtime.length
        ||asset.sourceSha256!==crypto.createHash('sha256').update(source).digest('hex'))throw Error(`${asset.id}: native asset identity changed`);
      asset.reviewStatus='LOCAL_NATIVE_PASS: original pixels/registration and actual current route/contact/fault frames reviewed; human/physical observations UNKNOWN';
    }
    if(name==='manifest.json'){
      manifest.scope='Three canonical original action families; current paced local native full-route/contact/fault evidence retained; parent release remains separate';
      manifest.review={...manifest.review,runtimeAcceptance:'LOCAL_NATIVE_PASS',nativeEvidence:evidencePath,reviewedEvidence:evidence.reviewedEvidence,humanApproval:'UNKNOWN',physicalDeviceObservation:'UNKNOWN'};
    }else Object.assign(manifest,{runtimeAcceptance:'LOCAL_NATIVE_PASS',nativeEvidence:evidencePath,reviewedEvidence:evidence.reviewedEvidence,humanApproval:'UNKNOWN',physicalDeviceObservation:'UNKNOWN'});
    await fs.writeFile(file,JSON.stringify(manifest,null,2)+'\n');
  }
  console.log(JSON.stringify({operation:'review-metadata-only',runtimeAcceptance:'LOCAL_NATIVE_PASS',assets:identity.size,encoded:false}));
  process.exit(0);
}
const configuration=JSON.parse(await fs.readFile(path.join(root,directory,'registration.json'),'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const registerOnly=process.argv.includes('--register-only'),assets=[],retainedInputs=[],atlases={},movementAtlases={};
function bodies(data,info){
  const seen=new Uint8Array(info.width*info.height),components=[];
  for(let seed=0;seed<seen.length;seed++){
    if(seen[seed]||data[seed*4+3]<160)continue;
    const queue=[seed];seen[seed]=1;let left=info.width,top=info.height,right=0,bottom=0;
    for(let i=0;i<queue.length;i++){
      const point=queue[i],x=point%info.width,y=Math.floor(point/info.width);
      left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
      for(const next of[x>0?point-1:-1,x<info.width-1?point+1:-1,y>0?point-info.width:-1,y<info.height-1?point+info.width:-1]){
        if(next>=0&&!seen[next]&&data[next*4+3]>=160){seen[next]=1;queue.push(next);}
      }
    }
    if(queue.length>3000)components.push({left,top,right,bottom,area:queue.length});
  }
  return components;
}
for(const spec of configuration.assets){
  const source=`${directory}/characters/${spec.file}.png`,bytes=await fs.readFile(path.join(root,source));
  const{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const components=bodies(data,info);
  if(components.length!==spec.frames.length||data[3]!==0)throw Error(`${spec.file}: requires exactly ${spec.frames.length} genuine-alpha whole bodies`);
  components.sort((a,b)=>(a.top+a.bottom)-(b.top+b.bottom));
  const ordered=[];
  for(let row=0;row<components.length/spec.columns;row++)ordered.push(...components.slice(row*spec.columns,(row+1)*spec.columns).sort((a,b)=>a.left-b.left));
  const opaque=point=>point&&Number.isFinite(point[0])&&Number.isFinite(point[1])&&point[0]>=0&&point[0]<info.width&&point[1]>=0&&point[1]<info.height&&data[(Math.round(point[1])*info.width+Math.round(point[0]))*4+3]>=160;
  function sole([left,right,top,bottom]){
    let low=-1;const pixels=[];
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>=160){low=Math.max(low,y);pixels.push([x,y]);}
    if(low<0)throw Error(`${spec.file}: no actual boot in inspected region`);
    const band=pixels.filter(([,y])=>y>=low-2),average=band.reduce((sum,[x])=>sum+x,0)/band.length;
    // Choose the actual opaque point closest to the centroid on the final sole
    // row; a centroid of a curved boot can otherwise fall on transparent space.
    const last=pixels.filter(([,y])=>y===low).sort((a,b)=>Math.abs(a[0]-average)-Math.abs(b[0]-average));
    return[last[0][0],low];
  }
  const frames=ordered.map((body,index)=>{
    const measure=spec.frames[index],left=Math.max(0,body.left-7),top=Math.max(0,body.top-7),right=Math.min(info.width,body.right+7),bottom=Math.min(info.height,body.bottom+7);
    const bootLeft=sole(measure.boots[0]),bootRight=sole(measure.boots[1]),foot=bootLeft[1]>=bootRight[1]?bootLeft:bootRight;
    const contactsSource={bootLeft,bootRight,grip:measure.grip||null,lowerHand:measure.lowerHand||null};
    const local=point=>point?[point[0]-left,point[1]-top]:null;
    for(const[name,point]of Object.entries(contactsSource))if(point&&!opaque(point))throw Error(`${spec.file}/${measure.action}: ${name} must be an inspected actual opaque contact`);
    for(const point of Object.values(contactsSource).filter(Boolean))if(point[0]<left||point[0]>=right||point[1]<top||point[1]>=bottom)throw Error(`${spec.file}/${measure.action}: contact lies outside its own actual body crop`);
    return{id:`${spec.hero}-${spec.family}-${measure.action}`,hero:spec.hero,action:measure.action,direction:'right',
      rect:[left,top,right-left,bottom-top],anchor:[measure.axis-left,Math.max(bootLeft[1],bootRight[1])-top],
      contacts:{feet:local(foot),...Object.fromEntries(Object.entries(contactsSource).map(([name,point])=>[name,local(point)]))},
      measurement:{bodyBounds:[body.left,body.top,body.right,body.bottom],opaqueArea:body.area,
        method:'alpha>=160 connected body plus7px gutter; visible palms directly pixel-inspected; opaque last sole row nearest lower3-row centroid; hidden hands omitted',
        torsoAxisSourceX:measure.axis,bootRegions:measure.boots,contactsSource}};
  });
  const prompt=`prompts/${spec.file}.txt`,promptBytes=await fs.readFile(path.join(root,directory,prompt));
  const asset={id:`${spec.hero}-${spec.family}`,kind:'character',hero:spec.hero,world:spec.world,family:spec.family,source,
    runtime:`/game-assets/physical-arcade/word-climb/characters/${spec.file}.webp`,sourceSize:[info.width,info.height],runtimeSize:[info.width,info.height],
    nominalHeight:2.2,pixelsPerUnit:(ordered[0].bottom-ordered[0].top)/2.2,frames,prompt,sourceSha256:hash(bytes),promptSha256:hash(promptBytes),
    creator:'OpenAI builtin imagegen under LiteracyPath direction',licence:'Original project-authored output; exact sources/prompts retained',origin:'builtin imagegen 2026-10-04',
    derivative:'Same dimensions; WebP quality90/alphaQuality100; exact original PNG retained',reviewStatus:'source-pixel-inspected; actual native full-action/contact acceptance pending',
    referenceRoles:[{source:spec.reference,sha256:hash(await fs.readFile(path.join(root,spec.reference))),role:'Canonical character identity/material; new game-specific action family, no atlas relabel'}]};
  for(const inputFile of spec.inputs||[]){
    const input=`${directory}/characters/${inputFile}.png`,inputBytes=await fs.readFile(path.join(root,input)),inputInfo=await sharp(inputBytes).metadata();
    const inputPrompt=`prompts/${inputFile.replace(/-input$/,'')}.txt`;
    retainedInputs.push({source:input,sourceSize:[inputInfo.width,inputInfo.height],sha256:hash(inputBytes),prompt:inputPrompt,
      promptSha256:hash(await fs.readFile(path.join(root,directory,inputPrompt))),role:'Required original edit-input provenance; corrected runtime derivative has its own exact identity'});
    asset.referenceRoles.push({source:input,sha256:hash(inputBytes),role:'Original source input to the retained opposite-limb or canonical-costume correction'});
  }
  if(!registerOnly){
    const output=await sharp(bytes).webp({quality:90,alphaQuality:100,effort:6}).toBuffer(),runtimePath=path.join(root,'public',asset.runtime);
    await fs.mkdir(path.dirname(runtimePath),{recursive:true});await fs.writeFile(runtimePath,output);asset.runtimeSha256=hash(output);asset.runtimeBytes=output.length;
    const atlas={width:info.width,height:info.height,nominalHeight:asset.nominalHeight,pixelsPerUnit:asset.pixelsPerUnit,runtime:asset.runtime,
      frames:frames.map(frame=>{const[x,y,w,h]=frame.rect;return{id:frame.id,action:frame.action,direction:frame.direction,cell:[x,y,x+w,y+h],anchor:frame.anchor,
        sockets:Object.fromEntries(Object.entries(frame.contacts).filter(([,point])=>point).map(([name,point])=>[name,[x+point[0],y+point[1]]]))};})};
    (spec.family==='climbing'?atlases:movementAtlases)[spec.hero]=atlas;
  }
  assets.push(asset);
}
const manifest={schemaVersion:1,game:'word-climb',scope:'Three canonical original climbing and word-jump/summit action families; native full-loop/world/fault acceptance remains pending',
  review:{method:'Direct source pixel inspection and measured alpha/contact registration',runtimeAcceptance:'PENDING',humanApproval:'UNKNOWN',physicalDeviceObservation:'UNKNOWN'},
  registration:'registration.json',registrationSha256:hash(await fs.readFile(path.join(root,directory,'registration.json'))),retainedInputs,assets};
if(!registerOnly)await fs.writeFile(path.join(root,'src/components/learn/games/games/wordClimbArt.generated.js'),
  '// Generated by scripts/art/build-word-climb-art.mjs from retained measured original source.\n'+
  `export const WORD_CLIMB_ATLASES = ${JSON.stringify(atlases,null,2)};\nexport const WORD_CLIMB_MOVEMENT_ATLASES = ${JSON.stringify(movementAtlases,null,2)};\n`);
await fs.writeFile(path.join(root,directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({registeredFrames:assets.reduce((sum,asset)=>sum+asset.frames.length,0),compiled:!registerOnly,assets:assets.map(({id,runtimeBytes})=>({id,runtimeBytes}))}));
