import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// Source registration is authored once in registration.json. Compile actual
// irregular opaque bounds and visible contacts; never fabricate hidden hands.
const root=path.resolve(import.meta.dirname,'../..');
const directory='source-art/arcade/physical-worlds/word-bridge';
const configuration=JSON.parse(await fs.readFile(path.join(root,directory,'registration.json'),'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const registerOnly=process.argv.includes('--register-only'),assets=[],retainedInputs=[],atlases={};
const compilationStart=performance.now();
const timed=(asset,stage,started)=>console.log(JSON.stringify({event:'asset-stage',asset,stage,
  durationMs:performance.now()-started,elapsedMs:performance.now()-compilationStart}));
if(process.argv.includes('--metadata-only')){
  const manifest=JSON.parse(await fs.readFile(path.join(root,directory,'manifest.json'),'utf8'));
  for(const asset of manifest.assets){
    if(hash(await fs.readFile(path.join(root,asset.source)))!==asset.sourceSha256)throw Error(`${asset.id}: original source identity changed`);
    atlases[asset.id]={width:asset.sourceSize[0],height:asset.sourceSize[1],nominalHeight:asset.nominalHeight,pixelsPerUnit:asset.pixelsPerUnit,runtime:asset.runtime||asset.plannedRuntime,
      frames:asset.frames.map(frame=>{const[x,y,w,h]=frame.rect;return{id:frame.id,action:frame.action,direction:frame.direction,cell:[x,y,x+w,y+h],anchor:frame.anchor,
        sockets:Object.fromEntries(Object.entries(frame.contacts).filter(([,point])=>point).map(([name,point])=>[name,[x+point[0],y+point[1]]]))};})};
  }
  await fs.writeFile(path.join(root,'src/components/learn/games/games/wordBridgeArt.generated.js'),
    '// Source-registered metadata only; planned URLs remain unavailable until original derivatives are encoded.\n'+`export const WORD_BRIDGE_ATLASES = ${JSON.stringify(atlases,null,2)};\n`);
  console.log(JSON.stringify({compiled:false,metadataOnly:true,runtimeAcceptance:manifest.review.runtimeAcceptance}));process.exit(0);
}
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
  const assetStart=performance.now();
  const source=`${directory}/characters/${spec.file}.png`,bytes=await fs.readFile(path.join(root,source));
  timed(spec.file,'source-read',assetStart);let stageStart=performance.now();
  const{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  timed(spec.file,'PNG-decode',stageStart);stageStart=performance.now();
  const components=bodies(data,info);
  timed(spec.file,'whole-body-component-scan',stageStart);stageStart=performance.now();
  if(components.length!==spec.bodyCount||data[3]!==0)throw Error(`${spec.file}: requires exactly ${spec.bodyCount} genuine-alpha whole bodies`);
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
  const frames=spec.frames.map(measure=>{
    const body=ordered[measure.sourceIndex],left=Math.max(0,body.left-7),top=Math.max(0,body.top-7),right=Math.min(info.width,body.right+7),bottom=Math.min(info.height,body.bottom+7);
    const bootLeft=sole(measure.boots[0]),bootRight=sole(measure.boots[1]),foot=bootLeft[1]>=bootRight[1]?bootLeft:bootRight;
    const contactsSource={bootLeft,bootRight,nearHand:measure.hands?.[0]||null,farHand:measure.hands?.[1]||null};
    const local=point=>point?[point[0]-left,point[1]-top]:null;
    for(const[name,point]of Object.entries(contactsSource))if(point&&!opaque(point))throw Error(`${spec.file}/${measure.action}: ${name} must be an inspected actual opaque contact`);
    for(const point of Object.values(contactsSource).filter(Boolean))if(point[0]<left||point[0]>=right||point[1]<top||point[1]>=bottom)throw Error(`${spec.file}/${measure.action}: contact lies outside its own actual body crop`);
    return{id:`${spec.hero}-${measure.action}`,hero:spec.hero,action:measure.action,direction:'right',
      rect:[left,top,right-left,bottom-top],anchor:[measure.axis-left,Math.max(bootLeft[1],bootRight[1])-top],
      contacts:{feet:local(foot),...Object.fromEntries(Object.entries(contactsSource).map(([name,point])=>[name,local(point)]))},
      measurement:{bodyBounds:[body.left,body.top,body.right,body.bottom],opaqueArea:body.area,
        method:'alpha>=160 connected body plus7px gutter; visible palms directly pixel-inspected; opaque last sole row nearest lower3-row centroid; hidden hands omitted',
        torsoAxisSourceX:measure.axis,bootRegions:measure.boots,contactsSource}};
  });
  const prompt=`prompts/${spec.file.replace(/-input$/,'')}.txt`,promptBytes=await fs.readFile(path.join(root,directory,prompt));
  timed(spec.file,'crop-alpha-and-measured-contacts',stageStart);stageStart=performance.now();
  const plannedRuntime=`/game-assets/physical-arcade/word-bridge/characters/${spec.file}.webp`;
  const asset={id:`${spec.hero}-${spec.file.includes('opposite')?'carry-opposite':'builder'}`,kind:'character',hero:spec.hero,world:spec.world,family:'construction',source,
    plannedRuntime,runtime:registerOnly?null:plannedRuntime,sourceSize:[info.width,info.height],runtimeSize:registerOnly?null:[info.width,info.height],
    nominalHeight:2.2,pixelsPerUnit:(ordered[0].bottom-ordered[0].top)/2.2,frames,prompt,sourceSha256:hash(bytes),promptSha256:hash(promptBytes),
    creator:'OpenAI builtin imagegen under LiteracyPath direction',licence:'Original project-authored output; exact sources/prompts retained',origin:'builtin imagegen 2026-10-04',
    derivative:registerOnly?'PENDING encoding; exact original PNG and measured source contacts retained':'Same dimensions; WebP quality90/alphaQuality100; exact original PNG retained',reviewStatus:'source-pixel-inspected; actual native full-action/contact acceptance pending',
    referenceRoles:[{source:spec.reference,sha256:hash(await fs.readFile(path.join(root,spec.reference))),role:'Canonical character identity/material; new game-specific action family, no atlas relabel'}]};
  for(const inputFile of spec.inputs||[]){
    const input=`${directory}/characters/${inputFile}.png`,inputBytes=await fs.readFile(path.join(root,input)),inputInfo=await sharp(inputBytes).metadata();
    const inputPrompt=`prompts/${inputFile.replace(/-input$/,'')}.txt`;
    retainedInputs.push({source:input,sourceSize:[inputInfo.width,inputInfo.height],sha256:hash(inputBytes),prompt:inputPrompt,
      promptSha256:hash(await fs.readFile(path.join(root,directory,inputPrompt))),role:'Required original edit-input provenance; corrected runtime derivative has its own exact identity'});
    asset.referenceRoles.push({source:input,sha256:hash(inputBytes),role:'Original source input to the retained opposite-limb or canonical-costume correction'});
  }
  if(!registerOnly){
    timed(spec.file,'prompt-and-reference-provenance',stageStart);stageStart=performance.now();
    const output=await sharp(bytes).webp({quality:90,alphaQuality:100,effort:6}).toBuffer(),runtimePath=path.join(root,'public',asset.runtime);
    timed(spec.file,'WebP-encode-q90-alpha100-effort6',stageStart);stageStart=performance.now();
    const decoded=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(decoded.info.width!==info.width||decoded.info.height!==info.height||decoded.data[3]!==0)throw Error(`${spec.file}: derivative dimensions/true alpha differ from registration`);
    const sourceAlpha=Buffer.alloc(info.width*info.height),runtimeAlpha=Buffer.alloc(sourceAlpha.length);
    for(let pixel=0;pixel<sourceAlpha.length;pixel++){
      sourceAlpha[pixel]=data[pixel*4+3];runtimeAlpha[pixel]=decoded.data[pixel*4+3];
      if(sourceAlpha[pixel]!==runtimeAlpha[pixel])throw Error(`${spec.file}: delivered alpha changed at source pixel ${pixel}`);
    }
    asset.alphaCoverage={method:'Every original alpha pixel equals the same-size decoded WebP alpha; RGB uses declared lossy quality90',
      pixelCount:sourceAlpha.length,sourceAlphaSha256:hash(sourceAlpha),runtimeAlphaSha256:hash(runtimeAlpha)};
    for(const frame of frames)for(const[name,point]of Object.entries(frame.measurement.contactsSource)){
      if(point&&decoded.data[(Math.round(point[1])*info.width+Math.round(point[0]))*4+3]<160)throw Error(`${frame.id}: delivered ${name} is not an opaque measured contact`);
    }
    timed(spec.file,'decoded-runtime-dimensions-alpha-sockets',stageStart);stageStart=performance.now();
    await fs.mkdir(path.dirname(runtimePath),{recursive:true});await fs.writeFile(runtimePath,output);asset.runtimeSha256=hash(output);asset.runtimeBytes=output.length;
    timed(spec.file,'write-and-SHA',stageStart);
    const atlas={width:info.width,height:info.height,nominalHeight:asset.nominalHeight,pixelsPerUnit:asset.pixelsPerUnit,runtime:asset.runtime,
      frames:frames.map(frame=>{const[x,y,w,h]=frame.rect;return{id:frame.id,action:frame.action,direction:frame.direction,cell:[x,y,x+w,y+h],anchor:frame.anchor,
        sockets:Object.fromEntries(Object.entries(frame.contacts).filter(([,point])=>point).map(([name,point])=>[name,[x+point[0],y+point[1]]]))};})};
    atlases[asset.id]=atlas;
  }
  assets.push(asset);
  timed(spec.file,'asset-total',assetStart);
}
const manifest={schemaVersion:1,game:'word-bridge',scope:'Three canonical original construction action families; independent source poses, actual live-plank palms and two foot contacts; native full-loop/world/fault acceptance remains pending',
  review:{method:'Direct source pixel inspection and measured alpha/contact registration',runtimeAcceptance:'PENDING',humanApproval:'UNKNOWN',physicalDeviceObservation:'UNKNOWN'},
  registration:'registration.json',registrationSha256:hash(await fs.readFile(path.join(root,directory,'registration.json'))),retainedInputs,assets};
if(!registerOnly)await fs.writeFile(path.join(root,'src/components/learn/games/games/wordBridgeArt.generated.js'),
  '// Generated by scripts/art/build-word-bridge-art.mjs from retained measured original source.\n'+
  `export const WORD_BRIDGE_ATLASES = ${JSON.stringify(atlases,null,2)};\n`);
await fs.writeFile(path.join(root,directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({registeredFrames:assets.reduce((sum,asset)=>sum+asset.frames.length,0),compiled:!registerOnly,assets:assets.map(({id,runtimeBytes})=>({id,runtimeBytes}))}));
