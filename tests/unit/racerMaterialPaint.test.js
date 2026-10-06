import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {racerOpaqueMaterialFootprint,racerWorldTextureMatrix} from '../../src/components/learn/games/games/racerCanvasWorldArt.js';
import {paintRacerMaterialTriangle,racerPreparedMaterialIsOpaque} from '../../src/components/learn/games/games/sportsCanvasRenderer.js';

const triangle=[{x:0,y:0},{x:100,y:0},{x:0,y:100}];
const edgeDistance=(p,a,b)=>((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))/Math.hypot(b.x-a.x,b.y-a.y);
const inside=(point,polygon)=>polygon.every((p,index)=>edgeDistance(point,p,polygon[(index+1)%polygon.length])>=-1e-8);

test('one material fill has the exact centred .7 stroke outer edge, in either winding',()=>{
 const result=racerOpaqueMaterialFootprint(triangle);
 assert.deepEqual(result[0],{x:-.35,y:-.35});
 assert.ok(Math.abs(result[1].x-(100+.35*(1+Math.SQRT2)))<1e-9);
 assert.ok(Math.abs(result[2].y-(100+.35*(1+Math.SQRT2)))<1e-9);
 for(const p of result)for(let index=0;index<3;index++)assert.ok(edgeDistance(p,triangle[index],triangle[(index+1)%3])>=-.35000001);
 for(let index=0;index<3;index++){
  const a=triangle[index],b=triangle[(index+1)%3],length=Math.hypot(b.x-a.x,b.y-a.y),normal={x:(b.y-a.y)/length,y:-(b.x-a.x)/length};
  for(const t of [.2,.5,.8])assert.ok(inside({x:a.x+(b.x-a.x)*t+normal.x*.35,y:a.y+(b.y-a.y)*t+normal.y*.35},result),'The existing stroke edge is covered without shrinking the original triangle');
 }
 const reverse=racerOpaqueMaterialFootprint([...triangle].reverse());
 const canonical=points=>points.map(p=>[+p.x.toFixed(8),+p.y.toFixed(8)]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 assert.deepEqual(canonical(reverse),canonical(result));
});

test('acute projected corners obey the actual Canvas miter limit, including bevel endpoints',()=>{
 const points=[{x:0,y:0},{x:100,y:0},{x:0,y:1}];
 const limited=racerOpaqueMaterialFootprint(points,.7,{miterLimit:10});
 assert.equal(limited.length,4,'The very acute far corner has two bevel endpoints');
 assert.ok(limited.every(p=>Math.min(...points.map(vertex=>Math.hypot(vertex.x-p.x,vertex.y-p.y)))<=3.5000001));
 const bevel=limited.slice(1,3);assert.ok(bevel.every(p=>Math.abs(Math.hypot(p.x-100,p.y)-.35)<1e-9));
 const long=racerOpaqueMaterialFootprint(points,.7,{miterLimit:1000});assert.equal(long.length,3);
 assert.ok(long[1].x>169,'A larger explicitly supplied limit retains the genuine long miter rather than silently clipping it');
 assert.ok(inside({x:100,y:0},limited));
});

function context(overrides={}){
 const commands=[],ctx={globalAlpha:1,globalCompositeOperation:'source-over',lineJoin:'miter',miterLimit:10,
 beginPath(){commands.push(['begin']);},moveTo(x,y){commands.push(['move',x,y]);},lineTo(x,y){commands.push(['line',x,y]);},closePath(){commands.push(['close']);},fill(){commands.push(['fill']);},stroke(){commands.push(['stroke']);},...overrides};
 return {ctx,commands};
}

test('rejected union candidate cannot replace the original material fill and stroke or change UV sampling',()=>{
 const {ctx,commands}=context(),pattern={matrix:[1,.1,.2,2,50,30]},original=structuredClone(triangle);
 const world=[{x:-2,y:0,z:-6},{x:2,y:0,z:-6},{x:-2,y:0,z:-10}];
 const matrix=racerWorldTextureMatrix(world,triangle,512,512,2.5);
 pattern.matrix=matrix;
 assert.equal(paintRacerMaterialTriangle(ctx,triangle,pattern,true),'legacyFillStroke');
 assert.equal(commands.filter(row=>row[0]==='fill').length,1);assert.equal(commands.filter(row=>row[0]==='stroke').length,1);
 assert.equal(ctx.fillStyle,pattern);assert.equal(ctx.strokeStyle,pattern);assert.equal(ctx.lineWidth,.7);assert.deepEqual(triangle,original);assert.equal(pattern.matrix,matrix,'The original world-UV sampling matrix is neither recomputed from edge-cover points nor mutated');
 assert.deepEqual(commands.filter(row=>['move','line'].includes(row[0])).map(row=>({x:row[1],y:row[2]})),original);
 world.forEach((p,index)=>{const u=p.x*512/2.5,v=p.z*512/2.5;assert.ok(Math.hypot(matrix[0]*u+matrix[2]*v+matrix[4]-triangle[index].x,matrix[1]*u+matrix[3]*v+matrix[5]-triangle[index].y)<1e-8);});
});

test('alpha, compositing, unsupported joins and degenerate geometry retain their exact existing fill plus stroke path',()=>{
 for(const [points,opaque,overrides]of [[triangle,false,{}],[triangle,true,{globalAlpha:.5}],[triangle,true,{globalCompositeOperation:'multiply'}],[triangle,true,{lineJoin:'round'}],[triangle,true,{miterLimit:.5}],[[{x:0,y:0},{x:1,y:1},{x:2,y:2}],true,{}]]){
  const {ctx,commands}=context(overrides);assert.equal(paintRacerMaterialTriangle(ctx,points,{},opaque),'legacyFillStroke');
  assert.equal(commands.filter(row=>row[0]==='stroke').length,1);assert.equal(ctx.lineWidth,.7);
  assert.deepEqual(commands.filter(row=>['move','line'].includes(row[0])).map(row=>({x:row[1],y:row[2]})),points);
 }
 for(const points of [[],[...triangle,{x:10,y:10}],triangle.map((p,index)=>index? p:{x:NaN,y:0}),[{x:1e300,y:0},{x:0,y:1e300},{x:0,y:0}]])assert.equal(racerOpaqueMaterialFootprint(points),null);
});

test('single-fill admission checks actual prepared alpha and retained material pixels, not a filename assumption',async()=>{
 for(const file of ['public/game-assets/physical-arcade/burrow-builders/materials/grass-albedo-v1.webp','public/game-assets/spell-skate/materials/fine-concrete-albedo-v1.webp']){
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(racerPreparedMaterialIsOpaque({width:info.width,height:info.height,getContext:()=>({getImageData:()=>({data})})}),true);
  data[3]=254;assert.equal(racerPreparedMaterialIsOpaque({width:info.width,height:info.height,getContext:()=>({getImageData:()=>({data})})}),false);
 }
 assert.equal(racerPreparedMaterialIsOpaque({getContext(){throw new Error('tainted/unreadable surface');}}),false);
 assert.equal(racerPreparedMaterialIsOpaque({width:2,height:2,getContext:()=>({getImageData:()=>({data:new Uint8Array(4)})})}),false);
});
