import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RACER_GROUND_OCCLUSION_MARGIN_PX,insetOpaqueRacerRoad,racerGroundOcclusionRects,withRacerGroundOcclusion,releaseRacerComparisonPixels} from '../../src/components/learn/games/games/racerGroundOcclusion.js';
import {clipSportsCanvasPolygon,paintRacerMaterialTriangle} from '../../src/components/learn/games/games/sportsCanvasRenderer.js';
import {racerWorldTextureMatrix} from '../../src/components/learn/games/games/racerCanvasWorldArt.js';
import {buildTrack} from '../../src/utils/soundRacerTracks.js';
import {offsetCircuitPoint,RACER_ROAD_WIDTH} from '../../src/utils/soundRacerPhysics.js';

const rectangle=(x,y,width,height)=>[{x,y},{x:x+width,y},{x:x+width,y:y+height},{x,y:y+height}];
function contained(p,points,margin=0){
  const area=points.reduce((sum,a,index)=>{const b=points[(index+1)%points.length];return sum+a.x*b.y-b.x*a.y;},0),direction=Math.sign(area);
  return points.every((a,index)=>{const b=points[(index+1)%points.length];return direction*((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))/Math.hypot(b.x-a.x,b.y-a.y)>=margin-1e-7;});
}
function assertSafe(result,polygons,width,height){
  for(const r of result.rectangles){
    assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1e-8&&r.y+r.height<=height+1e-8);
    // Dense independent finite observations supplement the exact convex-box
    // construction; they are not used to select or admit an occlusion region.
    for(const u of [0,.25,.5,.75,1])for(const v of [0,.25,.5,.75,1])assert.ok(polygons.some(poly=>contained({x:r.x+r.width*u,y:r.y+r.height*v},poly,RACER_GROUND_OCCLUSION_MARGIN_PX)));
  }
  for(let i=0;i<result.rectangles.length;i++)for(let j=i+1;j<result.rectangles.length;j++){
    const a=result.rectangles[i],b=result.rectangles[j],overlapX=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),overlapY=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
    assert.ok(overlapX<=1e-8||overlapY<=1e-8,'Evenodd holes cannot overlap and cancel their opaque-road exclusion');
  }
}

test('inset uses the actual opaque boundary in either winding and rejects thin, concave or invalid projections',()=>{
  const points=rectangle(10,10,80,60),copy=structuredClone(points),inset=insetOpaqueRacerRoad(points);
  for(const p of inset)assert.ok(contained(p,points,2));assert.deepEqual(points,copy);
  const canonical=p=>p.map(v=>[v.x,v.y]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  assert.deepEqual(canonical(inset),canonical(insetOpaqueRacerRoad([...points].reverse())));
  for(const invalid of [rectangle(0,0,20,2),[{x:0,y:0},{x:0,y:0},{x:5,y:5}],[{x:0,y:0},{x:8,y:0},{x:2,y:2},{x:8,y:8},{x:0,y:8}],[{x:NaN,y:0},...points]])assert.equal(insetOpaqueRacerRoad(invalid),null);
});

test('overlapping roads form disjoint conservative clip holes; no parity cancellation or grass beyond the road boundary',()=>{
  const polygons=[rectangle(10,10,60,80),rectangle(40,20,50,50),rectangle(-15,65,45,40)];
  const result=racerGroundOcclusionRects(polygons,{width:100,height:100,opaque:true});
  assert.ok(result.rectangles.length>0);assert.ok(result.area<polygons.reduce((sum,p)=>sum+(p[1].x-p[0].x)*(p[2].y-p[1].y),0));assertSafe(result,polygons,100,100);
  const at=(x,y)=>result.rectangles.filter(r=>x>r.x&&x<r.x+r.width&&y>r.y&&y<r.y+r.height).length;
  assert.equal(at(50,40),1,'Overlapping physical road faces exclude grass once');assert.equal(at(5,20),0);assert.equal(at(11,20),0,'Visible road AA margin keeps original grass');
});

test('projected bank, turn, mirrored camera and near-plane cap keep conservative holes in exact surviving road faces',()=>{
  const world=[{x:-4,y:.3,z:-.04},{x:4,y:.9,z:-.04},{x:5,y:.65,z:-8},{x:-3,y:.2,z:-8}];
  for(const yaw of [0,.15,-.15]){
    const camera=new THREE.PerspectiveCamera(60,1.5,.1,650);camera.position.set(0,2.5,0);camera.lookAt(Math.sin(yaw)*4,0,-8);camera.updateMatrixWorld(true);
    const clipped=clipSportsCanvasPolygon(camera,world,.121);assert.ok(clipped.length>=3);
    const polygons=[clipped.map(p=>{const v=new THREE.Vector3(p.x,p.y,p.z).project(camera);return{x:(v.x+1)*450,y:(1-v.y)*300};})];
    const result=racerGroundOcclusionRects(polygons,{width:900,height:600,top:150,opaque:true});assert.ok(result.area>0);assertSafe(result,polygons,900,600);
  }
});

test('clipping leaves the original material vertices, pattern transform, alpha and fill/stroke sequence intact and restores even after errors',()=>{
  const commands=[],ctx={globalAlpha:.7,globalCompositeOperation:'source-over',lineJoin:'miter',miterLimit:10,
    save(){commands.push(['save']);},restore(){commands.push(['restore']);},beginPath(){commands.push(['begin']);},rect(...args){commands.push(['rect',...args]);},clip(rule){commands.push(['clip',rule]);},moveTo(...args){commands.push(['move',...args]);},lineTo(...args){commands.push(['line',...args]);},closePath(){commands.push(['close']);},fill(){commands.push(['fill']);},stroke(){commands.push(['stroke']);}};
  const points=[{x:0,y:0},{x:900,y:0},{x:0,y:600}],world=[{x:-2,y:0,z:-2},{x:2,y:0,z:-2},{x:-2,y:0,z:-8}],matrix=racerWorldTextureMatrix(world,points,512,512,3.5),pattern={matrix};
  const occlusion=racerGroundOcclusionRects([rectangle(200,100,300,400)],{width:900,height:600,opaque:true});
  withRacerGroundOcclusion(ctx,occlusion,900,600,()=>paintRacerMaterialTriangle(ctx,points,pattern));
  assert.deepEqual(commands.filter(c=>c[0]==='clip'),[['clip','evenodd']]);assert.deepEqual(commands.filter(c=>['move','line'].includes(c[0])).map(c=>({x:c[1],y:c[2]})),points);
  assert.equal(commands.filter(c=>c[0]==='fill').length,1);assert.equal(commands.filter(c=>c[0]==='stroke').length,1);assert.equal(ctx.fillStyle,pattern);assert.equal(ctx.strokeStyle,pattern);assert.equal(pattern.matrix,matrix);assert.equal(ctx.globalAlpha,.7);assert.equal(commands.at(-1)[0],'restore');
  assert.throws(()=>withRacerGroundOcclusion(ctx,occlusion,900,600,()=>{throw new Error('aborted paint');}),/aborted paint/);assert.equal(commands.at(-1)[0],'restore');
  const before=commands.length;assert.equal(withRacerGroundOcclusion(ctx,{rectangles:[]},900,600,()=>42),42);assert.equal(commands.length,before);
});

test('unconfirmed material alpha and invalid viewport retain the complete original ground',()=>{
  const polygons=[rectangle(10,10,80,80)];
  for(const options of [{width:100,height:100},{width:100,height:100,opaque:false},{width:0,height:100,opaque:true},{width:100,height:Infinity,opaque:true},{width:100,height:100,top:100,opaque:true}])assert.equal(racerGroundOcclusionRects(polygons,options).area,0);
});

test('the AA inset stays two physical pixels at larger DPR; it is not a CSS or quality-resolution cut',()=>{
  for(const ratio of [1,1.5,2]){
    const polygons=[rectangle(20*ratio,20*ratio,300*ratio,200*ratio)],result=racerGroundOcclusionRects(polygons,{width:400*ratio,height:300*ratio,opaque:true});
    assert.equal(result.rectangles.length,1);assert.equal(result.rectangles[0].x,20*ratio+2);assert.equal(result.rectangles[0].y,20*ratio+2);assert.equal(result.rectangles[0].width,300*ratio-4);
  }
});

test('actual retained chase-camera fan seams keep their original grass underlay at physical DPR scales and mirrored views',()=>{
  // These are the actual smoothed camera/projection and failed pixel positions
  // retained by the v10 native comparison. Source geometry verifies conservative
  // coverage only; the corrected backend pixels still need strict native proof.
  const camera=new THREE.PerspectiveCamera();camera.matrixAutoUpdate=false;
  camera.matrixWorld.fromArray([.3899205244216972,1.3877787807814457e-17,.920848513402019,0,.13435023780475225,.9892995928573732,-.056888743825487774,0,-.9109950593919349,.14589830558383962,.3857482160571185,0,15.21299054106105,2.9962992711248955,-144.48970698611274,1]);
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();camera.projectionMatrix.fromArray([1.0825317547305484,0,0,0,0,1.7320508075688774,0,0,0,0,-1.0003077396522542,-1,0,0,-.20003077396522542,0]);
  const track=buildTrack('b',{difficulty:'easy',seed:0}),faces=[];
  for(let index=1;index<track.path.length;index++){
    const a=track.path[index-1],b=track.path[index],points=clipSportsCanvasPolygon(camera,[offsetCircuitPoint(a,-RACER_ROAD_WIDTH/2),offsetCircuitPoint(a,RACER_ROAD_WIDTH/2),offsetCircuitPoint(b,RACER_ROAD_WIDTH/2),offsetCircuitPoint(b,-RACER_ROAD_WIDTH/2)],.121);
    const pixels=points.map(point=>{const p=new THREE.Vector3(point.x,point.y||0,point.z).project(camera);return{x:(p.x+1)*720,y:(1-p.y)*450};});
    if(pixels.length<3||pixels.every(p=>p.x<0)||pixels.every(p=>p.x>1440)||pixels.every(p=>p.y<0)||pixels.every(p=>p.y>900))continue;
    faces.push(pixels);
  }
  const failures=[[344.5,792.5],[235.5,799.5],[505.5,529.5],[301.5,795.5],[1385.5,874.5],[270.5,797.5]];
  const inside=(result,p)=>result.rectangles.some(r=>p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height);
  const failedQuadMask=racerGroundOcclusionRects(faces,{width:1440,height:900,opaque:true});
  assert.ok(failures.some(([x,y])=>inside(failedQuadMask,{x,y})),'The actual failed quad assumption would remove a retained internal seam underlay');
  for(const ratio of [1,1.5,2])for(const mirrored of [false,true]){
    const project=p=>({x:(mirrored?1440-p.x:p.x)*ratio,y:p.y*ratio}),triangles=faces.flatMap(points=>points.slice(1,-1).map((_p,index)=>[points[0],points[index+1],points[index+2]].map(project)));
    const result=racerGroundOcclusionRects(triangles,{width:1440*ratio,height:900*ratio,opaque:true});
    assert.ok(result.area>0);assertSafe(result,triangles,1440*ratio,900*ratio);
    for(const [x,y]of failures)assert.equal(inside(result,project({x,y})),false,'A real road triangle AA seam retains the exact original grass paint');
  }
});

test('owned comparison readback buffers detach explicitly without closing live art or claiming GC',()=>{
  const first=new Uint8ClampedArray(16),second=new Uint8ClampedArray(24),live=new Uint8ClampedArray(8);first.fill(40);second.fill(80);live.fill(120);
  const receipts=[releaseRacerComparisonPixels(first),releaseRacerComparisonPixels(second)];
  assert.deepEqual(receipts,[{bytes:16,detached:true},{bytes:24,detached:true}]);assert.equal(first.byteLength,0);assert.equal(second.byteLength,0);assert.equal(live.byteLength,8);assert.equal(live[0],120);
  assert.deepEqual(releaseRacerComparisonPixels(first),{bytes:0,detached:true});
  assert.deepEqual(releaseRacerComparisonPixels({byteLength:8,buffer:{}}),{bytes:8,detached:false},'Unsupported detach reports only reference release, never physical closure or GC');
  assert.deepEqual(releaseRacerComparisonPixels({byteLength:8,buffer:{transfer(){throw new Error('not transferable');}}}),{bytes:8,detached:false});
});
