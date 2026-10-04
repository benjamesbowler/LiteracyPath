import fs from 'node:fs/promises';
import sharp from 'sharp';
const root='source-art/arcade/physical-worlds/letter-leap';
const manifest=JSON.parse(await fs.readFile(root+'/manifest.json','utf8'));
const names=['walker','hopper','spike','flyer'],actions=['idle','travel-a','travel-b','impact'];
for(const world of ['meadow','dino','moonwood']){
  const source=root+'/scenery/'+world+'-foes-v1.png';
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(data[3]!==0)throw new Error(world+': not genuine transparent source');
  const seen=new Uint8Array(info.width*info.height),components=[];
  for(let seed=0;seed<seen.length;seed++){
    if(seen[seed]||data[seed*4+3]<160)continue;
    const queue=[seed];seen[seed]=1;let left=info.width,top=info.height,right=0,bottom=0,area=0;
    for(let i=0;i<queue.length;i++){
      const p=queue[i],x=p%info.width,y=Math.floor(p/info.width);area++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
      for(const next of [x>0?p-1:-1,x<info.width-1?p+1:-1,y>0?p-info.width:-1,y<info.height-1?p+info.width:-1])if(next>=0&&!seen[next]&&data[next*4+3]>=160){seen[next]=1;queue.push(next);}
    }
    if(area>2000)components.push({left,top,right,bottom,area});
  }
  if(components.length!==16)throw new Error(world+': expected16 intact source bodies, found '+components.length);
  components.sort((a,b)=>(a.top+a.bottom)-(b.top+b.bottom));
  const frames=[],pixelsPerUnitByType={};
  for(let row=0;row<4;row++){
    const bodies=components.slice(row*4,row*4+4).sort((a,b)=>a.left-b.left);
    pixelsPerUnitByType[names[row]]=bodies[0].bottom-bodies[0].top;
    for(let col=0;col<4;col++){
      const body=bodies[col],left=Math.max(0,body.left-6),top=Math.max(0,body.top-6),right=Math.min(info.width,body.right+6),bottom=Math.min(info.height,body.bottom+6);
      const sole=[];
      for(let y=body.bottom-3;y<body.bottom;y++)for(let x=body.left;x<body.right;x++)if(data[(y*info.width+x)*4+3]>=160)sole.push([x,y]);
      const soleX=sole.reduce((sum,p)=>sum+p[0],0)/sole.length,soleY=body.bottom-1;
      frames.push({id:names[row]+'-'+actions[col],type:names[row],action:actions[col],direction:'right',rect:[left,top,right-left,bottom-top],anchor:[(body.left+body.right)/2-left,soleY-top],contacts:{feet:[soleX-left,soleY-top]},measurement:{method:'alpha>=160 connected body; original full body retained with6px edge gutter; actual lower3opaque row sole',bodyBounds:[body.left,body.top,body.right,body.bottom],soleContactSource:[soleX,soleY]}});
    }
  }
  const asset={id:world+'-foes',kind:'foe',world,source,runtime:'/game-assets/physical-arcade/letter-leap/scenery/'+world+'-foes-v1.webp',sourceSize:[info.width,info.height],runtimeSize:[info.width,info.height],prompt:'scenery/'+world+'-foes-v1.prompt.txt',creator:'OpenAI builtin imagegen under LiteracyPath direction',licence:'Original project-authored output; retained exact source and prompt',origin:'builtin imagegen2026-10-04',nominalHeight:1,pixelsPerUnitByType,frames,referenceRoles:'Original miniature plush encounter species; no canonical Pal substitution'};
  manifest.assets=manifest.assets.filter(item=>item.id!==asset.id);manifest.assets.push(asset);
  console.log(world+':16 measured original poses');
}
await fs.writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
