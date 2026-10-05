import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../..');
const sourceDirectory='source-art/arcade/physical-worlds/word-climb';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
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
  const file=`${world}-scenery-v${revision}`,source=`${sourceDirectory}/scenery/${file}.png`;
  const bytes=await fs.readFile(path.join(root,source));
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
  const output=await sharp(bytes).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
  await fs.mkdir(path.dirname(path.join(root,'public',runtime)),{recursive:true});await fs.writeFile(path.join(root,'public',runtime),output);
  const prompt=`prompts/${file}.txt`,promptBytes=await fs.readFile(path.join(root,sourceDirectory,prompt));
  const inputs=[];
  for(const input of[`${world}-scenery-v1-input`,...(revision===3?[`${world}-scenery-v2`]:[])]){
    const inputSource=`${sourceDirectory}/scenery/${input}.png`,inputBytes=await fs.readFile(path.join(root,inputSource));
    const inputPrompt=`prompts/${input.replace(/-input$/,'')}.txt`;
    inputs.push({source:inputSource,sha256:hash(inputBytes),prompt:inputPrompt,promptSha256:hash(await fs.readFile(path.join(root,sourceDirectory,inputPrompt))),role:'Exact retained input to uncropped-isolation edit; not an admitted runtime atlas'});
  }
  const asset={id:`${world}-root-canopy-summit`,world,kind:'scenery-atlas',source,runtime,sourceSize:[info.width,info.height],runtimeSize:[info.width,info.height],frames,
    sourceSha256:hash(bytes),runtimeSha256:hash(output),runtimeBytes:output.length,prompt,promptSha256:hash(promptBytes),editInputs:inputs,
    creator:'OpenAI builtin imagegen under LiteracyPath direction',origin:'Original game-owned art 2026-10-04',licence:'Original project-authored output; exact sources/prompts retained',
    registration:'alpha>=100 connected complete cutouts; actual non-overlapping rectangle bounds;1px gutter; no forced equal cells',maxEdgeAlpha,
    derivative:'Same dimensions; WebP quality90/alphaQuality100',reviewStatus:'Direct source silhouettes/alpha/crops inspected; actual live-world acceptance PENDING'};
  assets.push(asset);atlases[world]={runtime,width:info.width,height:info.height,frames};
}
await fs.writeFile(path.join(root,sourceDirectory,'scenery-manifest.json'),JSON.stringify({schemaVersion:1,game:'word-climb',runtimeAcceptance:'PENDING',physicalDeviceObservation:'UNKNOWN',assets},null,2)+'\n');
await fs.writeFile(path.join(root,'src/components/learn/games/games/wordClimbScenery.generated.js'),'// Generated from exact original PNGs by build-word-climb-scenery.mjs.\nexport const WORD_CLIMB_SCENERY = '+JSON.stringify(atlases,null,2)+';\n');
console.log(JSON.stringify({assets:assets.map(({id,runtimeBytes})=>({id,runtimeBytes})),nativeAcceptance:'PENDING'}));
