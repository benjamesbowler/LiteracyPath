import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import sharp from 'sharp';
import {racerWorldTextureMatrix,racerMaterialMipIndex,racerCanvasGroundPoint,racerCanvasObstacleFaces,racerCanvasFoliageOpacity,racerCanvasDecorativeOpacity,racerCanvasVenueFrame,racerHorizonPanelCrop,racerHorizonPanelRecipe,racerHorizonEdgeAlpha,racerHorizonMapFragment,drawRacerTyreFootprint,RACER_SURFACE_METRES,RACER_HORIZON_BLEND} from '../../src/components/learn/games/games/racerCanvasWorldArt.js';
import {clipSportsCanvasPolygon} from '../../src/components/learn/games/games/sportsCanvasRenderer.js';

test('horizon fading reaches the actual authored alpha edge in each world, including transparent source padding',async()=>{
  for(const world of ['meadow','dino','moonwood']){
    const source=new URL(`../../public/game-assets/physical-arcade/rally-pals/${world}-horizon-v1.webp`,import.meta.url);
    const {data,info}=await sharp(source.pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let bottom=-1;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16)bottom=y;
    const blend=RACER_HORIZON_BLEND[world];
    assert.equal(blend.end,(bottom+1)/info.height,'Padding cannot leave a hard opaque grass edge before the material fade');
    assert.ok(blend.start>0&&blend.start<blend.end);
  }
});

test('road material is registered to metres under a moving perspective camera, rather than screen pixels',()=>{
  const points=[{x:-4,y:0,z:-9},{x:4,y:0,z:-9},{x:4,y:0,z:-18}];
  const camera=new THREE.PerspectiveCamera(58,1.6,.1,500);camera.position.set(1,4,4);camera.lookAt(1,0,-15);camera.updateMatrixWorld(true);
  let previous=null;
  for(const shift of [0,3]){
    camera.position.z-=shift;camera.updateMatrixWorld(true);
    const pixels=points.map(point=>{const p=new THREE.Vector3(point.x,point.y,point.z).project(camera);return{x:(p.x+1)*800,y:(1-p.y)*500};});
    const matrix=racerWorldTextureMatrix(points,pixels,1024,1024,RACER_SURFACE_METRES.paving);
    assert.ok(matrix);
    points.forEach((p,index)=>{
      const u=p.x*1024/RACER_SURFACE_METRES.paving,v=p.z*1024/RACER_SURFACE_METRES.paving;
      assert.ok(Math.abs(matrix[0]*u+matrix[2]*v+matrix[4]-pixels[index].x)<1e-8);
      assert.ok(Math.abs(matrix[1]*u+matrix[3]*v+matrix[5]-pixels[index].y)<1e-8);
    });
    if(previous)assert.notDeepEqual(matrix,previous,'Moving the camera changes projection of the same world-registered texels');previous=matrix;
  }
  assert.equal(racerWorldTextureMatrix([points[0],points[0],points[2]],[{x:1,y:2},{x:1,y:2},{x:3,y:4}],1024,1024,2),null);
});

test('ground texture grid rays meet the chase camera ground plane and cannot paint above its horizon',()=>{
  const camera=new THREE.PerspectiveCamera(60,16/9,.1,1000);camera.position.set(0,4,8);camera.lookAt(0,1,-10);camera.updateMatrixWorld(true);
  const point=racerCanvasGroundPoint(camera,720,810,1440,900);
  assert.ok(point);assert.equal(point.y,-.22);
  const pixel=new THREE.Vector3(point.x,point.y,point.z).project(camera);
  assert.ok(Math.abs((pixel.x+1)*720-720)<1e-8);assert.ok(Math.abs((1-pixel.y)*450-810)<1e-8);
  assert.equal(racerCanvasGroundPoint(camera,720,0,1440,900),null);
});

test('Canvas hazards retain actual bale volume, visible straps, world transform and animated rotation',()=>{
  const group=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(1.45,.8,.8),new THREE.MeshBasicMaterial({color:'#c7a15f'}));group.add(body);
  const strap=new THREE.Mesh(new THREE.BoxGeometry(1.52,.06,.86),new THREE.MeshBasicMaterial({color:'#6e5130'}));group.add(strap);
  group.position.set(5,1,-12);group.rotation.y=.35;
  const camera=new THREE.Vector3(4,3,0),first=racerCanvasObstacleFaces(group,camera);
  assert.ok(first.length>=4);assert.ok(new Set(first.map(face=>face.color)).size>=2,'The real contrasting band remains part of the obstacle');
  assert.ok(first.every(face=>face.points.every(p=>p.x>4&&p.x<6&&p.z<-11&&p.z>-13)));
  assert.ok(first.some(face=>face.points.some(p=>p.y<.9))&&first.some(face=>face.points.some(p=>p.y>1.1)),'The obstacle has real height rather than a ground disc');
  const original=body.geometry.attributes.position.array.slice();group.position.x+=3;group.rotation.y+=.4;
  const next=racerCanvasObstacleFaces(group,camera);assert.ok(next.every(face=>face.points.every(p=>p.x>7&&p.x<9)));
  assert.notDeepEqual(first[0].points,next[0].points);assert.deepEqual(body.geometry.attributes.position.array,original,'Projection cannot modify the shared physical obstacle mesh');
  body.geometry.dispose();strap.geometry.dispose();body.material.dispose();strap.material.dispose();
});

test('registered tyre shadows fade to zero alpha at their bounds and preserve the four actual contact centres',()=>{
  const stops=[],centres=[];
  const ctx={save(){},restore(){},translate(x,y){centres.push([x,y]);},scale(){},createRadialGradient(){const row=[];stops.push(row);return{addColorStop(position,color){row.push([position,color]);}};},fillRect(){}};
  const contacts=[[40,235],[65,205],[190,235],[165,205]];
  drawRacerTyreFootprint(ctx,{x:400,y:500},2,contacts,[128,240],256/3.28);
  assert.equal(stops.length,5);assert.ok(stops.every(row=>row.at(-1)[0]===1&&row.at(-1)[1]==='rgba(20,30,43,0)'));
  assert.deepEqual(centres.slice(1),[[224,490],[274,430],[524,490],[474,430]]);
});

test('near-camera foliage fades before it can cover the route, while readable distant trees retain their full size and alpha',()=>{
  const width=1440,height=900;
  assert.equal(racerCanvasFoliageOpacity({x:0,y:100,width:280,height:320},width,height),1);
  assert.equal(racerCanvasFoliageOpacity({x:-400,y:-2500,width:3400,height:3200},width,height),0,'The observed whole-horizon blurry wall is culled');
  const middle=racerCanvasFoliageOpacity({x:100,y:0,width:750,height:950},width,height);
  assert.ok(middle>0&&middle<1,'Foliage fades continuously on approach instead of abruptly shrinking its real placement');
  assert.equal(racerCanvasFoliageOpacity({x:1500,y:0,width:100,height:200},width,height),0);
  assert.equal(racerCanvasFoliageOpacity({x:0,y:0,width:NaN,height:200},width,height),0);
  assert.equal(racerCanvasFoliageOpacity({x:0,y:100/2,width:280/2,height:320/2},width/2,height/2),1,'Viewport-independent coverage keeps the same composition on a smaller surface');
});

test('Dino panorama has one volcano composition with different adjacent source crops and local alpha edges',()=>{
  const panels=Array.from({length:8},(_,index)=>racerHorizonPanelCrop('dino',index));
  assert.deepEqual(panels[4],{start:0,span:1,flip:false});
  assert.equal(panels.filter(p=>p.start+p.span>.68).length,1,'Only the designated panel reaches the observed volcano pixels');
  assert.ok(new Set(panels.map(p=>JSON.stringify(p))).size>=4);
  for(let index=0;index<8;index++){
    const shader=racerHorizonMapFragment('dino',index);
    assert.ok(shader.includes('texture2D( map, vec2('));
    assert.ok(shader.includes('sRGBTransferEOTF'),'Native map decoding remains intact');
    assert.ok(shader.includes('smoothstep(0.,.055,vMapUv.x)'),'Alpha edges follow local panel UVs even on a cropped source');
  }
  assert.deepEqual(racerHorizonPanelCrop('meadow',3),{start:0,span:1,flip:false});
  assert.deepEqual(racerHorizonPanelCrop('moonwood',3),{start:0,span:1,flip:false});
});

test('changing source pixel density cannot change tyre centres or shadow dimensions in the rendered world',()=>{
  const draw=(density)=>{
    const centres=[],radii=[];
    const ctx={save(){},restore(){},translate(x,y){centres.push([x,y]);},scale(x,y){radii.push([x,y]);},createRadialGradient(){return{addColorStop(){}};},fillRect(){}};
    const ppu=78*density,anchor=[128*density,240*density],contacts=[[40,235],[65,205],[190,235],[165,205]].map(p=>p.map(v=>v*density));
    drawRacerTyreFootprint(ctx,{x:400,y:500},2/density,contacts,anchor,ppu);return {centres,radii};
  };
  assert.deepEqual(draw(1),draw(1.5),'A 384 source uses the same actual four contact locations and metre-sized footprint as a 256 source');
});


test('decorative houses cannot become the observed whole-horizon wall; answer and hazard projection are not changed',()=>{
  assert.equal(racerCanvasDecorativeOpacity,racerCanvasFoliageOpacity,'One projected-size authority prevents a second contradictory scenery rule');
  const hugeHouse={x:-2100,y:-3100,width:6400,height:5000};
  assert.equal(racerCanvasDecorativeOpacity(hugeHouse,1440,900),0);
  const readableHouse={x:110,y:130,width:440,height:330};
  assert.equal(racerCanvasDecorativeOpacity(readableHouse,1440,900),1);
  assert.equal(racerCanvasDecorativeOpacity(Object.fromEntries(Object.entries(readableHouse).map(([key,value])=>[key,value/2])),720,450),1);
  const actor=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#6e5130'}));actor.add(mesh);actor.position.set(0,1,-12);
  const before=racerCanvasObstacleFaces(actor,new THREE.Vector3(0,3,0));
  racerCanvasDecorativeOpacity(hugeHouse,1440,900);
  assert.deepEqual(racerCanvasObstacleFaces(actor,new THREE.Vector3(0,3,0)),before,'The graphics guard has no authority over real obstacle geometry/materials');
  mesh.geometry.dispose();mesh.material.dispose();
});


test('recovery uses actual matching venue art and never substitutes a ten-metre house for an unknown decorative role',()=>{
  assert.deepEqual(racerCanvasVenueFrame('clubhouse'),{frame:'club',height:10});
  assert.deepEqual(racerCanvasVenueFrame('grandstand'),{frame:'crowd',height:7});
  assert.deepEqual(racerCanvasVenueFrame('flowerbed'),{frame:'flowers',height:2.8});
  assert.equal(racerCanvasVenueFrame('bench'),null);
  assert.equal(racerCanvasVenueFrame('landmark'),null);
  assert.equal(racerCanvasVenueFrame('unknown'),null);
});

test('static horizon ownership reuses actual source crops and preserves symmetric primary alpha edges independently of flip',()=>{
  for(const world of ['meadow','moonwood']){
    const panels=Array.from({length:8},(_,index)=>racerHorizonPanelRecipe(world,index,1774,887));
    assert.equal(new Set(panels.map(panel=>panel.key)).size,1);assert.ok(panels.every(panel=>panel.width===1774&&panel.height===887));
  }
  const dino=Array.from({length:8},(_,index)=>racerHorizonPanelRecipe('dino',index,1774,887));
  assert.equal(new Set(dino.map(panel=>panel.key)).size,4);assert.deepEqual(dino[4].source,[0,0,1774,887]);
  assert.equal(dino[0].key,dino[3].key);assert.equal(dino[0].flip,false);assert.equal(dino[3].flip,true);
  for(const u of [0,.01,.0275,.055,.2,.5,.945,.99,1])assert.ok(Math.abs(racerHorizonEdgeAlpha(u)-racerHorizonEdgeAlpha(1-u))<1e-12);
  assert.equal(racerHorizonEdgeAlpha(0),0);assert.equal(racerHorizonEdgeAlpha(1),0);assert.equal(racerHorizonEdgeAlpha(.5),1);assert.ok(Math.abs(racerHorizonEdgeAlpha(.0275)-.5)<1e-12);
});

test('material sampling follows actual projection density and cannot turn a mirrored or rotated tile into another world phase',()=>{
  assert.equal(racerMaterialMipIndex([1,0,0,1,0,0],10),0);
  assert.equal(racerMaterialMipIndex([1/16,0,0,1/16,3,4],10),4);
  assert.equal(racerMaterialMipIndex([-1/16,0,0,1/16,3,4],10),4);
  const angle=.83,c=Math.cos(angle)/16,s=Math.sin(angle)/16;assert.equal(racerMaterialMipIndex([c,s,-s,c,0,0],10),4);
  assert.equal(racerMaterialMipIndex([1/256,0,0,2,0,0],10),0,'The larger projection axis retains its real source detail');
  assert.equal(racerMaterialMipIndex([.00001,0,0,.00001,0,0],10),9);assert.equal(racerMaterialMipIndex(null,10),0);
  const points=[{x:-4,y:0,z:-9},{x:4,y:0,z:-9},{x:4,y:0,z:-18}],camera=new THREE.PerspectiveCamera(58,1.6,.1,500);
  camera.position.set(1,4,4);camera.lookAt(1,0,-15);camera.updateMatrixWorld(true);
  const pixels=points.map(point=>{const p=new THREE.Vector3(point.x,point.y,point.z).project(camera);return{x:(p.x+1)*800,y:(1-p.y)*500};});
  for(const metres of Object.values(RACER_SURFACE_METRES))for(const size of [512,256,128,64,32,16,8,4,2,1]){
    const matrix=racerWorldTextureMatrix(points,pixels,size,size,metres);assert.ok(matrix);
    points.forEach((p,index)=>{const u=p.x*size/metres,v=p.z*size/metres;assert.ok(Math.abs(matrix[0]*u+matrix[2]*v+matrix[4]-pixels[index].x)<1e-8);assert.ok(Math.abs(matrix[1]*u+matrix[3]*v+matrix[5]-pixels[index].y)<1e-8);});
  }
});

test('a near-plane crossing retains continuous original world UVs at every selected sampling size',()=>{
  const camera=new THREE.PerspectiveCamera(60,1.6,.1,100);camera.position.set(0,1,1);camera.lookAt(0,0,-10);camera.updateMatrixWorld(true);
  const points=[{x:-5,y:0,z:2},{x:5,y:0,z:2},{x:5,y:0,z:-10},{x:-5,y:0,z:-10}],original=structuredClone(points);
  const clipped=clipSportsCanvasPolygon(camera,points,.121);assert.equal(clipped.length,4);
  const triangle=clipped.slice(0,3),pixels=triangle.map(point=>{const p=new THREE.Vector3(point.x,point.y,point.z).project(camera);return{x:(p.x+1)*800,y:(1-p.y)*500};});
  const base=racerWorldTextureMatrix(triangle,pixels,512,512,2.5);assert.ok(base);const level=racerMaterialMipIndex(base,10),size=512/2**level;
  const matrix=racerWorldTextureMatrix(triangle,pixels,size,size,2.5);assert.ok(matrix.every(Number.isFinite));
  triangle.forEach((p,index)=>{assert.ok(Math.abs(matrix[0]*p.x*size/2.5+matrix[2]*p.z*size/2.5+matrix[4]-pixels[index].x)<1e-7);assert.ok(Math.abs(matrix[1]*p.x*size/2.5+matrix[3]*p.z*size/2.5+matrix[5]-pixels[index].y)<1e-7);});
  assert.deepEqual(points,original,'Sampling/near clipping does not alter physical surface points');
});
