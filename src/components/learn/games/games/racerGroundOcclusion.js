// Only screen regions already covered by the later opaque road may be omitted
// from grass rasterization. Two physical Canvas pixels stay inside every road
// boundary, conservatively preserving its fill AA, stroke and visible seams.
export const RACER_GROUND_OCCLUSION_MARGIN_PX=2;
const EPS=1e-8;

export function insetOpaqueRacerRoad(points,margin=RACER_GROUND_OCCLUSION_MARGIN_PX){
  if(!Array.isArray(points)||points.length<3||!Number.isFinite(margin)||margin<=0||points.some(p=>!Number.isFinite(p?.x)||!Number.isFinite(p?.y)))return null;
  const area=points.reduce((sum,p,index)=>{const q=points[(index+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0);
  if(!Number.isFinite(area)||Math.abs(area)<EPS)return null;
  const direction=Math.sign(area),edges=points.map((a,index)=>{
    const b=points[(index+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    return {length,distance:p=>direction*(dx*(p.y-a.y)-dy*(p.x-a.x))/length};
  });
  if(edges.some(edge=>!Number.isFinite(edge.length)||edge.length<EPS||points.some(p=>!Number.isFinite(edge.distance(p))||edge.distance(p)<-EPS)))return null;
  let result=points.map(p=>({x:p.x,y:p.y}));
  for(const edge of edges){
    const next=[];
    for(let index=0;index<result.length;index++){
      const a=result[index],b=result[(index+1)%result.length],da=edge.distance(a)-margin,db=edge.distance(b)-margin;
      if(da>=0)next.push(a);
      if((da>=0)!==(db>=0)){
        const t=da/(da-db);next.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
      }
    }
    result=next;if(result.length<3)return null;
  }
  return result.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))?result:null;
}

function horizontalRange(points,y){
  const xs=[];
  for(let index=0;index<points.length;index++){
    const a=points[index],b=points[(index+1)%points.length];
    if(y<Math.min(a.y,b.y)-EPS||y>Math.max(a.y,b.y)+EPS)continue;
    if(Math.abs(a.y-b.y)<EPS){if(Math.abs(y-a.y)<EPS)xs.push(a.x,b.x);}
    else xs.push(a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y));
  }
  return xs.length?[Math.min(...xs),Math.max(...xs)]:null;
}

export function racerGroundOcclusionRects(polygons,{width,height,top=0,opaque=false}={}){
  const empty=()=>({rectangles:[],admitted:0,area:0});
  if(!opaque||!Array.isArray(polygons)||![width,height,top].every(Number.isFinite)||width<=0||height<=0)return empty();
  top=Math.max(0,Math.min(height,top));
  const admitted=polygons.map(p=>insetOpaqueRacerRoad(p)).filter(Boolean);
  // Inside each slab, a convex polygon's left and right edges are linear.
  // Intersecting BOTH endpoint ranges therefore guarantees the whole box lies
  // inside that actual polygon. Only overlapping boxes in the SAME slab are
  // merged. The resulting holes cannot overlap and cancel under evenodd.
  const ys=[...new Set([top,height,...admitted.flatMap(p=>p.map(v=>v.y)).filter(y=>y>top&&y<height)])].sort((a,b)=>a-b),rectangles=[];
  for(let index=1;index<ys.length;index++){
    const lo=ys[index-1],hi=ys[index];if(hi-lo<EPS)continue;
    const spans=[];
    for(const points of admitted){
      if(Math.min(...points.map(p=>p.y))>lo+EPS||Math.max(...points.map(p=>p.y))<hi-EPS)continue;
      const a=horizontalRange(points,lo),b=horizontalRange(points,hi);if(!a||!b)continue;
      const left=Math.max(0,a[0],b[0]),right=Math.min(width,a[1],b[1]);if(right-left>EPS)spans.push([left,right]);
    }
    spans.sort((a,b)=>a[0]-b[0]);const merged=[];
    for(const span of spans){
      const previous=merged.at(-1);if(previous&&span[0]<=previous[1])previous[1]=Math.max(previous[1],span[1]);else merged.push([...span]);
    }
    for(const [left,right]of merged)rectangles.push({x:left,y:lo,width:right-left,height:hi-lo});
  }
  return {rectangles,admitted:admitted.length,area:rectangles.reduce((sum,r)=>sum+r.width*r.height,0)};
}

export function withRacerGroundOcclusion(ctx,occlusion,width,height,paint){
  if(!occlusion?.rectangles.length)return paint();
  ctx.save();
  try{
    ctx.beginPath();ctx.rect(0,0,width,height);
    for(const r of occlusion.rectangles)ctx.rect(r.x,r.y,r.width,r.height);
    ctx.clip('evenodd');
    return paint();
  }finally{ctx.restore();}
}

// getImageData owns these diagnostic ArrayBuffers. Detach their storage when
// the engine provides transfer; otherwise only drop references and report that
// distinction. No production render or controller requires this diagnostic.
export function releaseRacerComparisonPixels(pixels){
  if(!pixels)return {bytes:0,detached:false};
  const bytes=pixels.byteLength;
  if(pixels.buffer?.detached===true)return {bytes,detached:true};
  if(typeof pixels.buffer?.transfer==='function'){
    try{pixels.buffer.transfer(0);return {bytes,detached:pixels.byteLength===0};}
    catch{return {bytes,detached:false};}
  }
  return {bytes,detached:false};
}
