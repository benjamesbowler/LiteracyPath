import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../..');
const sourceDirectory='source-art/arcade/physical-worlds/word-climb';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const args=process.argv.slice(2);
if(args.length>1 || (args[0] && !['--check','--write'].includes(args[0])))throw Error('Usage: node scripts/art/build-word-climb-scenery.mjs [--check|--write]');
const check=args[0]==='--check';
const currentPath=path.join(root,sourceDirectory,'scenery-clean-cartoon-registration.json');
const current=await fs.readFile(currentPath,'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
const manifestName=current?'scenery-clean-cartoon-manifest.json':'scenery-manifest.json';
const prior=await fs.readFile(path.join(root,sourceDirectory,manifestName),'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
const roles=['root-landscape','canopy-bough','summit-landscape','foreground-plants'];
function cutouts(data,info){
  const visited=new Uint8Array(info.width*info.height),components=[];
  for(let seed=0;seed<visited.length;seed++){
    if(visited[seed]||data[seed*4+3]<100)continue;
    const queue=[seed];visited[seed]=1;let left=info.width,top=info.height,right=0,bottom=0;
    for(let index=0;index<queue.length;index++){
      const pixel=queue[index],x=pixel%info.width,y=Math.floor(pixel/info.width);
      left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
      for(const adjacent of[x>0?pixel-1:-1,x<info.width-1?pixel+1:-1,y>0?pixel-info.width:-1,y<info.height-1?pixel+info.width:-1]){
        if(adjacent>=0&&!visited[adjacent]&&data[adjacent*4+3]>=100){visited[adjacent]=1;queue.push(adjacent);}
      }
    }
    if(queue.length>2000)components.push({left,top,right,bottom,area:queue.length});
  }
  if(components.length!==4)throw Error('Scenery requires four separate whole cutouts');
  components.sort((a,b)=>a.top-b.top);
  return[...components.slice(0,2).sort((a,b)=>a.left-b.left),...components.slice(2).sort((a,b)=>a.left-b.left)];
}
const assets=[],atlases={};
for(const [world,revision]of[['meadow',2],['dino',2],['moonwood',3]]){
  const file=`${world}-scenery-v${revision}`,recipe=current?.assets.find(a=>a.world===world);
  if(current&&!recipe)throw Error('Missing current scenery source '+world);
  const source=recipe?.source||`${sourceDirectory}/scenery/${file}.png`;
  const bytes=await fs.readFile(path.join(root,source));
  if(recipe&&hash(bytes)!==recipe.sourceSha256)throw Error('Changed registered scenery source '+world);
  const{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const components=cutouts(data,info);
  for(const body of components)if(Math.min(body.left,body.top,info.width-body.right,info.height-body.bottom)<15)throw Error(`${world}: complete silhouettes need a genuine outside gutter`);
  // Actual separated opaque bounds, rather than an assumed equal-cell grid.
  // Use a 1px UV gutter; these isolated alpha silhouettes have no nearby art
  // inside those bounds. Source PNG and exact dimensions remain unchanged.
  const frames=components.map((body,index)=>({id:roles[index],rect:[body.left-1,body.top-1,body.right-body.left+2,body.bottom-body.top+2],opaqueBounds:[body.left,body.top,body.right,body.bottom],opaqueArea:body.area}));
  for(let a=0;a<frames.length;a++)for(let b=a+1;b<frames.length;b++){
    const[x,y,w,h]=frames[a].rect,[xx,yy,ww,hh]=frames[b].rect;
    if(x<xx+ww&&x+w>xx&&y<yy+hh&&y+h>yy)throw Error(`${world}: unrelated cutout rectangles overlap`);
  }
  let maxEdgeAlpha=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(x===0||y===0||x===info.width-1||y===info.height-1)maxEdgeAlpha=Math.max(maxEdgeAlpha,data[(y*info.width+x)*4+3]);
  // The generator's invisible alpha=1 edge residue is recorded truthfully;
  // it is below the runtime alphaTest and outside every admitted UV crop.
  if(maxEdgeAlpha>1)throw Error(`${world}: opaque art touches the source edge`);
  const runtime=`/game-assets/physical-arcade/word-climb/scenery/${file}.webp`;
  const output=await sharp(bytes).webp(current?.encoding||{quality:90,alphaQuality:100,effort:6}).toBuffer();
  const runtimeFile=path.join(root,'public',runtime);
  if(check){if(hash(await fs.readFile(runtimeFile))!==hash(output))throw Error('Non-reproducible scenery delivery '+world);}
  else{await fs.mkdir(path.dirname(runtimeFile),{recursive:true});await fs.writeFile(runtimeFile,output);}
  const prompt=recipe?.prompt||`prompts/${file}.txt`,promptBytes=await fs.readFile(path.join(root,sourceDirectory,prompt));
  if(recipe&&hash(promptBytes)!==recipe.promptSha256)throw Error('Changed registered scenery prompt '+world);
  const inputs=[];
  for(const input of(current?[]:[`${world}-scenery-v1-input`,...(revision===3?[`${world}-scenery-v2`]:[])])){
    const inputSource=`${sourceDirectory}/scenery/${input}.png`,inputBytes=await fs.readFile(path.join(root,inputSource));
    const inputPrompt=`prompts/${input.replace(/-input$/,'')}.txt`;
    inputs.push({source:inputSource,sha256:hash(inputBytes),prompt:inputPrompt,promptSha256:hash(await fs.readFile(path.join(root,sourceDirectory,inputPrompt))),role:'Exact retained input to uncropped-isolation edit; not an admitted runtime atlas'});
  }
  const asset={id:`${world}-root-canopy-summit`,world,kind:'scenery-atlas',source,runtime,sourceSize:[info.width,info.height],runtimeSize:[info.width,info.height],frames,
    sourceSha256:hash(bytes),runtimeSha256:hash(output),runtimeBytes:output.length,prompt,promptSha256:hash(promptBytes),editInputs:inputs,
    creator:'OpenAI builtin imagegen under LiteracyPath direction',origin:'Original game-owned art 2026-10-04',licence:'Original project-authored output; exact sources/prompts retained',
    registration:'alpha>=100 connected complete cutouts; actual non-overlapping rectangle bounds;1px gutter; no forced equal cells',maxEdgeAlpha,
    derivative:'Same dimensions; WebP quality90/alphaQuality100',reviewStatus:prior?.assets.find(a=>a.world===world&&a.sourceSha256===hash(bytes))?.reviewStatus||'Direct source silhouettes/alpha/crops inspected; actual live-world acceptance PENDING',
    ...(recipe?{jobId:recipe.jobId,receipt:recipe.receipt,receiptSha256:recipe.receiptSha256}:{} )};
  assets.push(asset);atlases[world]={runtime,width:info.width,height:info.height,frames};
}
const manifest={...prior,schemaVersion:1,game:'word-climb',runtimeAcceptance:prior?.runtimeAcceptance||'PENDING',physicalDeviceObservation:'UNKNOWN',
  ...(current?{currentRegistration:'scenery-clean-cartoon-registration.json',registrationSha256:hash(await fs.readFile(currentPath)),historicalManifest:current.historicalManifest,styleAuthority:current.styleAuthority}:{}),assets};
const manifestFile=path.join(root,sourceDirectory,manifestName),generated='// Generated from exact original PNGs by build-word-climb-scenery.mjs.\nexport const WORD_CLIMB_SCENERY = '+JSON.stringify(atlases,null,2)+';\n',generatedPath=path.join(root,'src/components/learn/games/games/wordClimbScenery.generated.js');
if(check){
  if(await fs.readFile(manifestFile,'utf8')!==JSON.stringify(manifest,null,2)+'\n')throw Error('Stale scenery manifest');
  if(await fs.readFile(generatedPath,'utf8')!==generated)throw Error('Stale scenery registration');
}else{await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');await fs.writeFile(generatedPath,generated);}
console.log(JSON.stringify({assets:assets.map(({id,runtimeBytes})=>({id,runtimeBytes})),nativeAcceptance:manifest.runtimeAcceptance}));
