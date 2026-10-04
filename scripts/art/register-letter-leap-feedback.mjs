import fs from 'node:fs/promises';
import sharp from 'sharp';
const root='source-art/arcade/physical-worlds/letter-leap';
const manifest=JSON.parse(await fs.readFile(root+'/manifest.json','utf8'));
const source=root+'/characters/pals-platform-feedback-v1.png';
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(data[3]!==0)throw new Error('Feedback source has no genuine transparent alpha');
const seen=new Uint8Array(info.width*info.height),components=[];
for(let seed=0;seed<seen.length;seed++){
  if(seen[seed]||data[seed*4+3]<160)continue;
  const queue=[seed];seen[seed]=1;let left=info.width,top=info.height,right=0,bottom=0,area=0;
  for(let i=0;i<queue.length;i++){
    const p=queue[i],x=p%info.width,y=Math.floor(p/info.width);area++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
    for(const n of [x>0?p-1:-1,x<info.width-1?p+1:-1,y>0?p-info.width:-1,y<info.height-1?p+info.width:-1])if(n>=0&&!seen[n]&&data[n*4+3]>=160){seen[n]=1;queue.push(n);}
  }
  if(area>3000)components.push({left,top,right,bottom,area});
}
if(components.length!==12)throw new Error('Expected12 intact feedback bodies; found '+components.length);
components.sort((a,b)=>(a.top+a.bottom)-(b.top+b.bottom));
const frames=[],pixelsPerUnitByHero={},heroes=['bouncy','chompy','pip'],actions=['bump','recover','correct','summit'];
for(let row=0;row<3;row++){
  const bodies=components.slice(row*4,row*4+4).sort((a,b)=>a.left-b.left),hero=heroes[row];
  // Calibrate to the standing collectible pose; variation is authored body
  // articulation, not a per-frame auto-scale or normalized bounding box.
  pixelsPerUnitByHero[hero]=(bodies[2].bottom-bodies[2].top)/2.2;
  for(let col=0;col<4;col++){
    const b=bodies[col],left=Math.max(0,b.left-7),top=Math.max(0,b.top-7),right=Math.min(info.width,b.right+7),bottom=Math.min(info.height,b.bottom+7),sole=[];
    for(let y=b.bottom-3;y<b.bottom;y++)for(let x=b.left;x<b.right;x++)if(data[(y*info.width+x)*4+3]>=160)sole.push([x,y]);
    const soleX=sole.reduce((s,p)=>s+p[0],0)/sole.length,soleY=b.bottom-1;
    frames.push({id:hero+'-'+actions[col],hero,action:actions[col],direction:'right',rect:[left,top,right-left,bottom-top],
      anchor:[(b.left+b.right)/2-left,soleY-top],contacts:{feet:[soleX-left,soleY-top],leftHand:null,rightHand:null},
      measurement:{method:'alpha>=160 connected actual body with7px gutter; lower3opaque rows sole; standing correct pose calibration, no fabricated hand sockets',bodyBounds:[b.left,b.top,b.right,b.bottom],soleContactSource:[soleX,soleY]}});
  }
}
const asset={id:'platform-feedback',kind:'character',source,runtime:'/game-assets/physical-arcade/letter-leap/characters/pals-platform-feedback-v1.webp',
  sourceSize:[info.width,info.height],runtimeSize:[info.width,info.height],prompt:'prompts/pals-platform-feedback-v1.txt',
  creator:'OpenAI builtin imagegen under LiteracyPath direction',licence:'Original project-authored output; retained exact source and prompt',origin:'builtin imagegen2026-10-04',
  nominalHeight:2.2,pixelsPerUnitByHero,frames,referenceRoles:'Exact retained original Bouncy/Chompy/Pip platforming source identities; no source relabel'};
manifest.assets=manifest.assets.filter(a=>a.id!==asset.id);manifest.assets.push(asset);
await fs.writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Registered12 original full-body platform feedback poses',info.width,info.height);
