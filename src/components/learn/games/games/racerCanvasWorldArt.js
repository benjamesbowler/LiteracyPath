import * as THREE from 'three';

// Materials use metres, independent of viewport size or camera travel. The
// same tile sizes are used by the real road/terrain UVs and Canvas recovery.
export const RACER_SURFACE_METRES = Object.freeze({grass: 3.5, paving: 2.5});
// Measured last alpha-covered rows in the retained1774x887 horizon images.
// Fading against the actual edge avoids an opaque lawn band where the source
// has transparent padding (the three authored worlds have different bounds).
export const RACER_HORIZON_BLEND = Object.freeze(Object.fromEntries(
  Object.entries({meadow:729/887,dino:1,moonwood:821/887}).map(([world,end])=>[world,Object.freeze({start:end-.16,end})])
));

// Recovery lighting is baked into an owned working surface, preserving the
// same fine concrete grain rather than painting a flat night-colour route.
export const RACER_CANVAS_PAVING_TINT = Object.freeze({meadow:'#fffdf5',dino:'#e9d7b9',moonwood:'#7184aa'});

// Only the south-facing Dino panel contains the complete volcano composition.
// Adjacent panels use actual canyon/palm pixels from the same original image.
// All eight materials still share one decoded/GPU texture.
export function racerHorizonPanelCrop(world,index) {
  const panel=((index%8)+8)%8;
  if(world!=='dino'||panel===4)return {start:0,span:1,flip:false};
  const crops=[{start:0,span:.48},{start:.10,span:.46},{start:.22,span:.36}];
  return {...crops[panel%3],flip:panel%2===1};
}

// Flip changes only the draw transform. Identical Meadow/Moonwood panels and
// matching Dino crops own one decoded working surface rather than eight copies.
export function racerHorizonPanelRecipe(world,index,imageWidth,imageHeight) {
  const crop=racerHorizonPanelCrop(world,index);
  return {key:`${crop.start}:${crop.span}`,source:[crop.start*imageWidth,0,crop.span*imageWidth,imageHeight],
    width:Math.max(1,Math.round(crop.span*imageWidth)),height:imageHeight,flip:crop.flip};
}

export function racerHorizonEdgeAlpha(u) {
  const smooth=value=>{const t=Math.max(0,Math.min(1,value/.055));return t*t*(3-2*t);};
  return smooth(u)*smooth(1-u);
}

export function racerHorizonMapFragment(world,index) {
  const crop=racerHorizonPanelCrop(world,index),blend=RACER_HORIZON_BLEND[world];
  const x=crop.flip?'(1.-vMapUv.x)':'vMapUv.x';
  return THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )',
    `texture2D( map, vec2(${crop.start.toFixed(7)}+${x}*${crop.span.toFixed(7)},vMapUv.y) )`)+
    `\ndiffuseColor.a*=smoothstep(${(1-blend.end).toFixed(7)},${(1-blend.start).toFixed(7)},vMapUv.y)*smoothstep(0.,.055,vMapUv.x)*smoothstep(0.,.055,1.-vMapUv.x);`;
}

// Decorative foliage can fade at the camera; its collision clearance and
// world placement remain unchanged. A near billboard must never magnify into
// a full-screen blurry wall over the real route and distant landmarks.
export function racerCanvasFoliageOpacity({x,y,width,height},viewportWidth,viewportHeight) {
  if(![x,y,width,height,viewportWidth,viewportHeight].every(Number.isFinite)||width<=0||height<=0||viewportWidth<=0||viewportHeight<=0)return 0;
  const visibleWidth=Math.max(0,Math.min(viewportWidth,x+width)-Math.max(0,x));
  const visibleHeight=Math.max(0,Math.min(viewportHeight,y+height)-Math.max(0,y));
  if(!visibleWidth||!visibleHeight)return 0;
  const smooth=(start,end,value)=>{const t=Math.max(0,Math.min(1,(value-start)/(end-start)));return t*t*(3-2*t);};
  const heightFade=1-smooth(.75,1.3,height/viewportHeight);
  const coverageFade=1-smooth(.26,.55,visibleWidth*visibleHeight/(viewportWidth*viewportHeight));
  return Math.min(heightFade,coverageFade);
}

// The same near-camera guard applies to decorative architecture/crowds.
// Its original registered world scale and distant identity remain intact;
// language gates and physical hazards never use this presentation-only fade.
export const racerCanvasDecorativeOpacity = racerCanvasFoliageOpacity;

// Only these decorative roles have matching retained alpha source frames.
// A small bench or a separate world landmark must not become a10m club house.
// Optional unmatched props are omitted in recovery; their primary meshes and
// the genuinely authored distant world landmarks remain separate authorities.
export function racerCanvasVenueFrame(name) {
  return {clubhouse:{frame:'club',height:10},grandstand:{frame:'crowd',height:7},flowerbed:{frame:'flowers',height:2.8}}[name]||null;
}

// Map an authored repeating material onto one projected world triangle. A
// screen-space pattern would swim over the track and grow on a small screen.
export function racerWorldTextureMatrix(points, pixels, imageWidth, imageHeight, metres) {
  const uv = points.map(p => ({x: p.x * imageWidth / metres, y: p.z * imageHeight / metres}));
  const [a,b,c] = uv, [pa,pb,pc] = pixels;
  const determinant = (b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
  if (!Number.isFinite(determinant) || Math.abs(determinant)<1e-8) return null;
  const xx=((pb.x-pa.x)*(c.y-a.y)-(pc.x-pa.x)*(b.y-a.y))/determinant;
  const xy=((pc.x-pa.x)*(b.x-a.x)-(pb.x-pa.x)*(c.x-a.x))/determinant;
  const yx=((pb.y-pa.y)*(c.y-a.y)-(pc.y-pa.y)*(b.y-a.y))/determinant;
  const yy=((pc.y-pa.y)*(b.x-a.x)-(pb.y-pa.y)*(c.x-a.x))/determinant;
  const result=[xx,yx,xy,yy,pa.x-xx*a.x-xy*a.y,pa.y-yx*a.x-yy*a.y];
  return result.every(Number.isFinite)?result:null;
}

// Select only sampling resolution, from the largest actual affine derivative.
// A selected image texel remains approximately a screen pixel. Repeating tile
// dimensions/phase still come from the unchanged world metre coordinates.
export function racerMaterialMipIndex(matrix,levelCount) {
  if(!matrix||!Number.isInteger(levelCount)||levelCount<1)return 0;
  const [a,b,c,d]=matrix;
  const trace=a*a+b*b+c*c+d*d,determinant=a*d-b*c;
  const scale=Math.sqrt((trace+Math.sqrt(Math.max(0,trace*trace-4*determinant*determinant)))/2);
  if(!Number.isFinite(scale)||scale<=0)return 0;
  return Math.max(0,Math.min(levelCount-1,Math.floor(Math.log2(1/scale))));
}

// Projected footprint retained for the rejected union candidate's geometry
// regression. Native raster tests disproved interior pattern equivalence, so
// production material painting must not substitute this boundary. Keep
// Canvas's real miter limit: an acute corner switches to
// the two bevel endpoints rather than extending a distant needle. Sampling
// remains registered to the ORIGINAL triangle, never these edge-cover points.
// Unsupported joins, nonconvex and degenerate input retain the old paint path.
export function racerOpaqueMaterialFootprint(points,lineWidth=.7,{lineJoin='miter',miterLimit=10}={}) {
  if(lineJoin!=='miter'||!Number.isFinite(lineWidth)||lineWidth<=0||!Number.isFinite(miterLimit)||miterLimit<1||!Array.isArray(points)||points.length!==3||points.some(p=>!Number.isFinite(p?.x)||!Number.isFinite(p?.y)))return null;
  const area=points.reduce((sum,p,index)=>{const q=points[(index+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0);
  if(!Number.isFinite(area)||Math.abs(area)<1e-8)return null;
  const direction=Math.sign(area),half=lineWidth/2,normals=[];
  for(let index=0;index<points.length;index++){
    const a=points[index],b=points[(index+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    if(!Number.isFinite(length)||length<1e-8)return null;
    normals.push({x:direction*dy/length,y:-direction*dx/length});
  }
  const footprint=[];
  for(let index=0;index<points.length;index++){
    const p=points[index],previous=normals[(index+points.length-1)%points.length],next=normals[index],denominator=1+previous.x*next.x+previous.y*next.y;
    const ratio=denominator>1e-12?Math.sqrt(2/denominator):Infinity;
    if(ratio>miterLimit){
      footprint.push({x:p.x+previous.x*half,y:p.y+previous.y*half},{x:p.x+next.x*half,y:p.y+next.y*half});
    }else{
      footprint.push({x:p.x+(previous.x+next.x)*half/denominator,y:p.y+(previous.y+next.y)*half/denominator});
    }
  }
  return footprint.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))?footprint:null;
}

// Recover the actual ground point under a screen location, using the current
// chase camera. These vertices are only a texture mesh, never a collision map.
export function racerCanvasGroundPoint(camera,x,y,width,height,groundY=-.22) {
  const direction=new THREE.Vector3(x/width*2-1,1-y/height*2,.5).unproject(camera).sub(camera.position).normalize();
  if(direction.y>=-1e-5)return null;
  const distance=(groundY-camera.position.y)/direction.y;
  if(distance<=0||distance>2500)return null;
  return {x:camera.position.x+direction.x*distance,y:groundY,z:camera.position.z+direction.z*distance};
}

const geometryFaces=new WeakMap();
function localMeshFaces(geometry) {
  if(geometryFaces.has(geometry))return geometryFaces.get(geometry);
  const position=geometry.attributes.position,index=geometry.index,faces=[];
  const count=index?.count??position.count;
  for(let offset=0;offset<count;offset+=3){
    const points=[];
    for(let corner=0;corner<3;corner++){
      const vertex=index?index.getX(offset+corner):offset+corner;
      points.push(new THREE.Vector3(position.getX(vertex),position.getY(vertex),position.getZ(vertex)));
    }
    const group=geometry.groups.find(g=>offset>=g.start&&offset<g.start+g.count);
    faces.push({points,materialIndex:group?.materialIndex??0});
  }
  geometryFaces.set(geometry,faces);return faces;
}

// Draw the retained hay-bale/rock/cloud mesh itself, including its real straps,
// rotations, height and material. Canvas has no generic obstacle substitute.
export function racerCanvasObstacleFaces(root,cameraPosition) {
  root.updateWorldMatrix(true,true);
  const result=[],light=new THREE.Vector3(-.35,.86,.32).normalize();
  root.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.visible||!mesh.geometry?.attributes.position)return;
    for(const local of localMeshFaces(mesh.geometry)){
      const material=Array.isArray(mesh.material)?mesh.material[local.materialIndex]:mesh.material;
      if(!material||material.visible===false)continue;
      const vertices=local.points.map(p=>p.clone().applyMatrix4(mesh.matrixWorld));
      const center=vertices.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).multiplyScalar(1/3);
      const normal=vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0])).normalize();
      if(material.side!==THREE.DoubleSide&&normal.dot(cameraPosition.clone().sub(center))<=0)continue;
      const shade=.65+.35*Math.max(0,normal.dot(light));
      const color=(material.color??new THREE.Color('#faf8ef')).clone().multiplyScalar(shade).getStyle();
      result.push({points:vertices.map(p=>({x:p.x,y:p.y,z:p.z})),color,opacity:material.opacity??1,
        depth:center.distanceToSquared(cameraPosition)});
    }
  });
  return result.sort((a,b)=>b.depth-a.depth);
}

export function drawRacerTyreFootprint(ctx,foot,scale,contacts,anchor,pixelsPerUnit) {
  // A transparent radial footprint has no hard bounding rectangle or edge.
  // Its four small centres are registered to the original rendered tyres.
  const softEllipse=(x,y,rx,ry,opacity)=>{
    ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
    const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
    gradient.addColorStop(0,`rgba(20,30,43,${opacity})`);
    gradient.addColorStop(.4,`rgba(20,30,43,${opacity*.62})`);
    gradient.addColorStop(1,'rgba(20,30,43,0)');
    ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();
  };
  const worldScale=scale*pixelsPerUnit;
  softEllipse(foot.x,foot.y-.038*worldScale,worldScale,.244*worldScale,.17);
  for(const [x,y] of contacts??[])softEllipse(foot.x+(x-anchor[0])*scale,foot.y+(y-anchor[1])*scale,.167*worldScale,.064*worldScale,.23);
}
