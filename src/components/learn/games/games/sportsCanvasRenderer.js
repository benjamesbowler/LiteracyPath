import * as THREE from 'three';
import {SKATE_MATERIAL_TINTS} from './spellSkateAuthoredWorld.js';
import {sportsArtView} from './sportsDirectionalArt.js';
import {createSportsSharpArt} from './sportsSharpArt.js';
import {SPORTS_JUMP_ROWS} from './sportsJumpRowRegistry.js';
import {createSportsSkaterReadyAtlas} from './sportsSkaterReadyAtlas.js';
import {SPORTS_SKATER_READY_REGISTRY} from './sportsSkaterReadyRegistry.js';
import {SPORTS_SHARP_ART_REGISTRY} from './sportsSharpArtRegistry.js';
import {skateRampProfile} from './spellSkatePark.js';
import {offsetCircuitPoint,RACER_ROAD_WIDTH} from '../../../../utils/soundRacerPhysics.js';
import {RACER_SURFACE_METRES,RACER_HORIZON_BLEND,RACER_CANVAS_PAVING_TINT,racerHorizonPanelRecipe,racerHorizonEdgeAlpha,racerCanvasDecorativeOpacity,racerCanvasVenueFrame,racerWorldTextureMatrix,racerMaterialMipIndex,racerCanvasGroundPoint,racerCanvasObstacleFaces,drawRacerTyreFootprint} from './racerCanvasWorldArt.js';
import {RACER_GROUND_OCCLUSION_MARGIN_PX,racerGroundOcclusionRects,withRacerGroundOcclusion,releaseRacerComparisonPixels} from './racerGroundOcclusion.js';
import {RACER_DIAGNOSTIC_SAMPLING,compareRacerSamplingFrame} from './racerSamplingDiagnostic.js';
import {createMoonFogSourceOwner,moonFogCanvasFrame,drawMoonFogCanvas,MOON_FOG_PRESENTATION} from './moonFogAsset.js';

export function racerPreparedMaterialIsOpaque(canvas) {
 try{
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  for(let index=3;index<pixels.length;index+=4)if(pixels[index]!==255)return false;
  return pixels.length===canvas.width*canvas.height*4;
 }catch{return false;}
}

// Retain the original path and two paint operations. The geometric union
// candidate changed interior texture pixels on the actual Canvas backend;
// matching its boundary and UV matrix did not establish raster equivalence.
export function paintRacerMaterialTriangle(ctx,points,pattern) {
 ctx.beginPath();points.forEach((p,index)=>{if(index)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();
 ctx.fillStyle=pattern;ctx.fill();
 ctx.strokeStyle=pattern;ctx.lineWidth=.7;ctx.stroke();
 return 'legacyFillStroke';
}

// The source's existing tint/palette is inherited by every mip. This owner
// holds only derived working surfaces; the original base has a separate owner.
export function createRacerMaterialMipOwner(base,createCanvas=()=>document.createElement('canvas')) {
 const levels=[base];
 while(levels.at(-1).width>1||levels.at(-1).height>1){
  const source=levels.at(-1),canvas=createCanvas();canvas.width=Math.max(1,Math.floor(source.width/2));canvas.height=Math.max(1,Math.floor(source.height/2));
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,canvas.width,canvas.height);levels.push(canvas);
 }
 let disposed=false;
 return{levels,snapshot:()=>({levels:levels.length,derivedRgbaBytes:levels.slice(1).reduce((sum,canvas)=>sum+canvas.width*canvas.height*4,0)}),
  dispose(){if(disposed)return;disposed=true;for(const canvas of levels.slice(1))canvas.width=canvas.height=1;levels.length=0;}};
}

// Bake source crop and soft edges once. The current camera still places each
// real angular panel; it no longer resubmits seventeen alpha strips per frame.
export function prepareRacerHorizonPanels(image,world,createCanvas=()=>document.createElement('canvas')) {
 const surfaces=new Map(),panels=[];
 for(let index=0;index<8;index++){
  const recipe=racerHorizonPanelRecipe(world,index,image.width,image.height);
  if(!surfaces.has(recipe.key)){
   const canvas=createCanvas();canvas.width=recipe.width;canvas.height=recipe.height;const ctx=canvas.getContext('2d');
   ctx.drawImage(image,...recipe.source,0,0,canvas.width,canvas.height);
   ctx.globalCompositeOperation='destination-in';
   const blend=RACER_HORIZON_BLEND[world],vertical=ctx.createLinearGradient(0,0,0,canvas.height);
   vertical.addColorStop(0,'#fff');vertical.addColorStop(blend.start,'#fff');vertical.addColorStop(blend.end,'#ffffff00');
   ctx.fillStyle=vertical;ctx.fillRect(0,0,canvas.width,canvas.height);
   // Sample the exact primary smoothstep into one bounded one-row mask. This
   // scratch source closes immediately; only the cropped panel stays owned.
   const mask=createCanvas();mask.width=canvas.width;mask.height=1;const mx=mask.getContext('2d');
   for(let x=0;x<mask.width;x++){mx.fillStyle=`rgba(255,255,255,${racerHorizonEdgeAlpha((x+.5)/mask.width)})`;mx.fillRect(x,0,1,1);}
   ctx.drawImage(mask,0,0,mask.width,1,0,0,canvas.width,canvas.height);mask.width=mask.height=1;
   surfaces.set(recipe.key,canvas);
  }
  panels.push({surface:surfaces.get(recipe.key),flip:recipe.flip});
 }
 let disposed=false;
 return{panels,snapshot:()=>({uniqueSurfaces:surfaces.size,rgbaBytes:[...surfaces.values()].reduce((sum,canvas)=>sum+canvas.width*canvas.height*4,0)}),
  dispose(){if(disposed)return;disposed=true;for(const canvas of surfaces.values())canvas.width=canvas.height=1;surfaces.clear();panels.length=0;}};
}

// The presentation can change without replacing the physics/controller, camera,
// choice positions, recording owner or practice evidence. The proxy keeps the
// existing ResizeObserver attached to the current, exclusively owned renderer.
export function createSportsRendererHost(createWebGL){
 let current,mode='webgl',reason=null;
 function canvasRenderer(){
  const canvas=document.createElement('canvas');const context=canvas.getContext('2d',{alpha:false});
  if(!context)throw new Error('A graphics surface could not be opened');
  let ratio=1;return {domElement:canvas,context,shadowMap:{enabled:false},capabilities:{getMaxAnisotropy:()=>1},
   info:{render:{calls:0,triangles:0},memory:{geometries:0,textures:0}},setPixelRatio(value){ratio=Math.min(1.5,value||1);},getPixelRatio:()=>ratio,
   setSize(width,height,style=true){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);if(style){canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;}},
   dispose(){canvas.width=canvas.height=1;},forceContextLoss(){}};
 }
 try{current=createWebGL();}catch{mode='canvas';reason='webgl-unavailable';current=canvasRenderer();}
 const proxy=new Proxy({}, {get(_target,key){const value=current[key];return typeof value==='function'?value.bind(current):value;},set(_target,key,value){current[key]=value;return true;}});
 return {renderer:proxy,get mode(){return mode;},get reason(){return reason;},switchCanvas(why){
  if(mode==='canvas')return current;const old=current,parent=old.domElement.parentNode,style=old.domElement.style.cssText;
  current=canvasRenderer();current.domElement.style.cssText=style;parent?.insertBefore(current.domElement,old.domElement);old.domElement.remove();
  old.dispose();old.forceContextLoss?.();mode='canvas';reason=why;return current;
 },snapshot:()=>({mode,reason})};
}

export function createCanvasPremiumBridge(){return{effectiveTier:'low',setTier(){},resize(){},prepareObject(){},render:()=> 'low',restoreContext(){},destroy(){}};}

export function clipSportsCanvasPolygon(camera,points,near=.12){
 const result=[],v=new THREE.Vector3();
 const depth=p=>v.set(p.x,p.y||0,p.z).applyMatrix4(camera.matrixWorldInverse).z;
 for(let index=0;index<points.length;index++){
  const a=points[index],b=points[(index+1)%points.length],za=depth(a),zb=depth(b),insideA=za<=-near,insideB=zb<=-near;
  if(insideA)result.push(a);
  if(insideA!==insideB){const t=(-near-za)/(zb-za);result.push({x:a.x+(b.x-a.x)*t,y:(a.y||0)+((b.y||0)-(a.y||0))*t,z:a.z+(b.z-a.z)*t});}
 }return result;
}

function imageOwner(url){
 let disposed=false,finish;const image=new Image();image.decoding='async';
 const ready=new Promise(resolve=>{finish=resolve;image.onload=()=>resolve(disposed?null:image);image.onerror=()=>resolve(null);image.src=url;});
 return{image,ready,dispose(){disposed=true;finish(null);image.onload=image.onerror=null;image.src='';}};
}

// Polygon coordinates are from the real curved riding profiles and collision
// decks. Canvas uses the same perspective camera and registered athlete feet;
// it never changes a destination, adds an answer or substitutes a quiz loop.
export function skateCanvasSurfaces(ramps,platforms){
 const faces=[];
 const worldPoint=(zone,x,y,z)=>{const c=Math.cos(zone.rot),s=Math.sin(zone.rot);return{x:zone.x+x*c+z*s,y,z:zone.z-x*s+z*c};};
 for(const zone of ramps){
  if(zone.kind==='bowl'){
   for(let ring=0;ring<8;ring++)for(let slice=0;slice<32;slice++){
    const points=[];for(const [r,a] of [[ring,slice],[ring+1,slice],[ring+1,slice+1],[ring,slice+1]]){const radius=zone.radius*r/8,angle=a*Math.PI/16;points.push(worldPoint(zone,Math.cos(angle)*radius,zone.height*(radius/zone.radius)**2,Math.sin(angle)*radius));}faces.push({points,shade:ring/32});
   }continue;
  }
  const low=zone.kind==='quarter'?-zone.depth:-zone.depth/2,high=zone.kind==='quarter'?0:zone.depth/2;
  for(let index=0;index<32;index++){
   const a=low+(high-low)*index/32,b=low+(high-low)*(index+1)/32,ya=skateRampProfile(zone,a),yb=skateRampProfile(zone,b);
   faces.push({points:[worldPoint(zone,-zone.width/2,ya,a),worldPoint(zone,zone.width/2,ya,a),worldPoint(zone,zone.width/2,yb,b),worldPoint(zone,-zone.width/2,yb,b)],shade:.08});
   for(const side of [-1,1])faces.push({points:[worldPoint(zone,side*zone.width/2,0,a),worldPoint(zone,side*zone.width/2,ya,a),worldPoint(zone,side*zone.width/2,yb,b),worldPoint(zone,side*zone.width/2,0,b)],shade:.24});
  }
 }
 for(const zone of platforms){
  const top=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>worldPoint(zone,x*zone.width/2,zone.height,z*zone.depth/2));faces.push({points:top,shade:.04});
  for(let index=0;index<4;index++){const a=top[index],b=top[(index+1)%4];faces.push({points:[a,b,{...b,y:0},{...a,y:0}],shade:.22});}
 }return faces;
}

// Essential actor graphics contain every jump direction. If their real image
// fails, the owner starts the original serialized full/compact-row pool only
// after that failure; both paths retain their own finite two-image ceiling.
export function createSkateCanvasArt({world}, {makeReady}={}){
 const options={registry:SPORTS_SHARP_ART_REGISTRY,world,rows:SPORTS_JUMP_ROWS[world].rows,entry:SPORTS_SKATER_READY_REGISTRY[world]};
 return makeReady?makeReady(options):createSportsSkaterReadyAtlas(options);
}

export function createSkateCanvasPresentation({world,renderer,camera,sceneData,ramps,platforms,rails,heroScale=1}){
 const trackPose=Boolean(import.meta.env?.DEV);
 const art=createSkateCanvasArt({world});
 const assets=Object.fromEntries(['horizon','scenery','concrete'].map(key=>[key,imageOwner(sceneData.urls[key])]));
 const decoded={},pilotDrawHistory=[],pilotHandoffHistory=[];let disposed=false,renderCount=0,lastPose=null,lastHeroDraw=null,pilotWasAirborne=false,pilotAwaitingHandoff=false,pilotFlightIndex=0;
 const ready=Promise.all([art.ready,...Object.entries(assets).map(async([key,owner])=>{decoded[key]=await owner.ready;})]).then(values=>Boolean(values[0]));
 const faces=skateCanvasSurfaces(ramps,platforms),v=new THREE.Vector3(),depth=new THREE.Vector3();
 const colors=world==='moonwood'?{sky:'#101a42',ground:'#7f92b2',edge:'#435575',accent:'#c4b9ed'}:world==='dino'?{sky:'#edb36f',ground:'#c8b998',edge:'#978b6d',accent:'#e9b949'}:{sky:'#8accec',ground:'#e5decb',edge:'#9b9f8f',accent:'#e4bc52'};
 function projected(point,width,height){depth.set(point.x,point.y||0,point.z).applyMatrix4(camera.matrixWorldInverse);if(depth.z>=-.12)return null;v.set(point.x,point.y||0,point.z).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2,depth:-depth.z};}
 function polygon(ctx,points,width,height,fill,stroke,tint){
  const p=clipSportsCanvasPolygon(camera,points,.121).map(point=>projected(point,width,height));if(p.length<3||p.some(point=>!point))return false;
  if(p.every(point=>point.x<0)||p.every(point=>point.x>width)||p.every(point=>point.y<0)||p.every(point=>point.y>height))return false;
  ctx.beginPath();p.forEach((point,index)=>{if(index)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(tint){ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle=tint;ctx.fill();ctx.restore();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}return true;
 }
 function crop(ctx,frame,p,height,source,width,canvasHeight){
  const foot=projected(p,width,canvasHeight),head=projected({...p,y:(p.y||0)+height},width,canvasHeight);if(!foot||!head)return;
  const h=Math.abs(foot.y-head.y),w=h*frame[2]/frame[3];if(h<2||foot.x+w/2<0||foot.x-w/2>width)return;
  // Decorative art has no contact/answer authority. Preserve its real crop
  // and distant scale, but never magnify a nearby tree or house into a wall.
  const opacity=racerCanvasDecorativeOpacity({x:foot.x-w/2,y:foot.y-h,width:w,height:h},width,canvasHeight);
  if(!opacity)return;
  ctx.save();ctx.globalAlpha*=opacity;ctx.drawImage(source,...frame,foot.x-w/2,foot.y-h,w,h);ctx.restore();
 }
 function draw({player,state,phase,dt=0,choices=[],pickups=[],groundHeight=0}){
  if(disposed)return;lastHeroDraw=null;const canvas=renderer.domElement,ctx=renderer.context,width=canvas.width,height=canvas.height;camera.updateMatrixWorld(true);
  ctx.fillStyle=colors.sky;ctx.fillRect(0,0,width,height);
  const image=decoded.horizon;if(image){
   const yaw=Math.atan2(camera.matrixWorld.elements[8],camera.matrixWorld.elements[10]),pan=((yaw/(Math.PI*2))%1+1)%1;
   const h=height*.52,w=h*image.width/image.height;for(let index=-2;index<4;index++)ctx.drawImage(image,(index-pan)*w,-height*.04,w,h);
  }
  ctx.fillStyle=colors.ground;ctx.fillRect(0,height*.32,width,height*.68);
  const pattern=decoded.concrete?ctx.createPattern(decoded.concrete,'repeat'):null;
  if(pattern&&pattern.setTransform){const matrix=new DOMMatrix().scale(.22);pattern.setTransform(matrix);}
  let calls=0;for(let x=-100;x<100;x+=20)for(let z=-100;z<100;z+=20)if(polygon(ctx,[{x,y:0,z},{x:x+20,y:0,z},{x:x+20,y:0,z:z+20},{x,y:0,z:z+20}],width,height,pattern||colors.ground,null,pattern?SKATE_MATERIAL_TINTS[world].floor:null))calls++;
  const entities=faces.map(face=>({kind:'face',depth:face.points.reduce((sum,p)=>sum+(p.x-camera.position.x)**2+(p.z-camera.position.z)**2,0)/face.points.length,face}));
  if(decoded.scenery){
   for(const tree of sceneData.trees)entities.push({kind:'scenery',depth:(tree.x-camera.position.x)**2+(tree.z-camera.position.z)**2,p:tree,frame:sceneData.art.frames.tree,height:tree.height});
   for(const venue of sceneData.venues){
    const recipe=racerCanvasVenueFrame(venue.name);if(!recipe)continue;
    entities.push({kind:'scenery',depth:(venue.x-camera.position.x)**2+(venue.z-camera.position.z)**2,p:{...venue,y:0},frame:sceneData.art.frames[recipe.frame],height:recipe.height});
   }
  }
  entities.push({kind:'hero',depth:(player.pos.x-camera.position.x)**2+(player.pos.z-camera.position.z)**2});
  entities.sort((a,b)=>b.depth-a.depth);
  const view=sportsArtView('skater',{actorX:player.pos.x,actorZ:player.pos.z,yaw:player.yaw+(player.onGround?0:player.spinAngle||0),cameraX:camera.position.x,cameraZ:camera.position.z});
  const pose=art.select(view,state,dt,{actionPhase:phase});lastPose=pose?{state:pose.frame.state,requestedState:state,phase,view:pose.view,wantedView:pose.wantedView}:null;
  for(const item of entities){
   if(item.kind==='face'){if(polygon(ctx,item.face.points,width,height,pattern||colors.ground,colors.edge,pattern?SKATE_MATERIAL_TINTS[world].ramp:null)){ctx.save();ctx.globalAlpha=item.face.shade;polygon(ctx,item.face.points,width,height,'#15243b');ctx.restore();calls++;}}
   else if(item.kind==='scenery'){crop(ctx,item.frame,item.p,item.height,decoded.scenery,width,height);calls++;}
   else if(pose){
    const ground=projected({x:player.pos.x,y:groundHeight+.03,z:player.pos.z},width,height),foot=projected({x:player.pos.x,y:player.air+.005,z:player.pos.z},width,height);
    if(foot){const scale=heroScale*height/(2*Math.tan(camera.fov*Math.PI/360)*foot.depth*pose.metadata.pixelsPerUnit),[sx,sy,sw,sh]=pose.frame.cell,[ax,ay]=pose.frame.groundAnchor;
     const shadowScale=scale*pose.metadata.pixelsPerUnit/(pose.shadowPixelsPerUnit||pose.metadata.pixelsPerUnit);
     if(ground){ctx.fillStyle='#16233538';ctx.beginPath();ctx.ellipse(ground.x,ground.y,Math.max(6,50*shadowScale),Math.max(3,16*shadowScale),0,0,Math.PI*2);ctx.fill();}
     const destination=[foot.x-ax*scale,foot.y-ay*scale,sw*scale,sh*scale];
     lastPose={...lastPose,format:pose.metadata.format||'skater-256-v1',selectedPhase:pose.frame.phase,groundScreenPoint:[foot.x,foot.y],source:[sx,sy,sw,sh],destination,displayOpaqueSize:[(pose.frame.opaqueBounds[2]-pose.frame.opaqueBounds[0])*scale,(pose.frame.opaqueBounds[3]-pose.frame.opaqueBounds[1])*scale]};
     lastHeroDraw={kind:'hero',image:pose.image,source:[sx,sy,sw,sh],destination,quality:'high',enabled:true};
     ctx.save();
     try{ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(pose.image,sx,sy,sw,sh,foot.x-ax*scale,foot.y-ay*scale,sw*scale,sh*scale);}
     finally{ctx.restore();}calls++;
    }
   }
  }
  for(const rail of rails){const a=projected({x:rail.ax,y:1.14,z:rail.az},width,height),b=projected({x:rail.bx,y:1.14,z:rail.bz},width,height);if(a&&b){ctx.lineCap='round';ctx.lineWidth=Math.max(2,70/a.depth);ctx.strokeStyle=colors.accent;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();for(const p of [a,b]){ctx.strokeStyle=colors.edge;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y+90/p.depth);ctx.stroke();}calls++;}}
  for(const target of [...choices,...pickups]){const p=projected(target,width,height);if(!p)continue;const r=Math.min(28,160/p.depth);ctx.strokeStyle='#edf3ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.45,0,0,Math.PI*2);ctx.stroke();calls++;}
  renderer.info.render.calls=calls;renderer.info.render.triangles=0;renderer.info.memory.textures=0;renderCount++;
  if(trackPose&&lastHeroDraw){
   if(!player.onGround){
    if(!pilotWasAirborne)pilotFlightIndex++;pilotWasAirborne=true;pilotAwaitingHandoff=true;
    pilotDrawHistory.push({flightIndex:pilotFlightIndex,renderIndex:renderCount,time:performance.now(),height:player.air,grounded:false,spin:player.spinAngle||0,...lastPose});if(pilotDrawHistory.length>256)pilotDrawHistory.shift();
   }else{
    pilotWasAirborne=false;
    if(pilotAwaitingHandoff){const matched=lastPose.state===lastPose.requestedState&&lastPose.view===lastPose.wantedView;
     pilotHandoffHistory.push({flightIndex:pilotFlightIndex,renderIndex:renderCount,time:performance.now(),height:player.air,grounded:true,matched,...lastPose});if(pilotHandoffHistory.length>128)pilotHandoffHistory.shift();
     if(matched)pilotAwaitingHandoff=false;
    }
   }
  }
 }
 // Original256/384 comparisons remain retained source/QC modules. Normal
 // play now owns the complete sharp bank; it never decodes a legacy second
 // bank or switches formats through the earlier development hooks.
 function prepareAthleteCandidate(){return Promise.resolve(false);}
 function selectAthleteFormat(){return false;}
 function compareAthleteCandidate(){return null;}
 return{ready,draw,prepareAthleteCandidate,selectAthleteFormat,compareAthleteCandidate,snapshot:()=>({renderer:'canvas',world,renderCount,originalAthlete:art.snapshot(),pose:lastPose?structuredClone(lastPose):null,heroDraw:lastHeroDraw?{source:[...lastHeroDraw.source],destination:[...lastHeroDraw.destination],quality:lastHeroDraw.quality,enabled:lastHeroDraw.enabled}:null,sceneDelivery:Object.fromEntries(Object.keys(assets).map(key=>[key,decoded[key]?'delivered':'unavailable'])),sceneDecodedBytes:Object.values(decoded).reduce((sum,image)=>sum+(image?image.width*image.height*4:0),0),surfaceBytes:renderer.domElement.width*renderer.domElement.height*4,ridingFaces:faces.length,deliveryStrategy:'ready-coast0/all-jump/full-state',pilot:trackPose?{drawHistory:pilotDrawHistory.map(row=>structuredClone(row)),handoffHistory:pilotHandoffHistory.map(row=>structuredClone(row))}:null}),dispose(){if(disposed)return;disposed=true;art.dispose();Object.values(assets).forEach(owner=>owner.dispose());Object.keys(decoded).forEach(key=>delete decoded[key]);lastHeroDraw=null;lastPose=null;pilotDrawHistory.length=0;pilotHandoffHistory.length=0;pilotWasAirborne=false;pilotAwaitingHandoff=false;}};
}

export function createRacerCanvasPresentation({world,renderer,camera,sceneData,track}){
 const art=createSportsSharpArt({kind:'driver',world,registry:SPORTS_SHARP_ART_REGISTRY});
 const moonFog=world==='moonwood'?createMoonFogSourceOwner():null;
 const assets=Object.fromEntries(['horizon','scenery','grass','paving'].map(key=>[key,imageOwner(sceneData.urls[key])]));
 const decoded={},prepared={},materialMips={},opaqueMaterials={};let disposed=false,renderCount=0,lastPose=null,patterns=null,horizonPanels=null;
 let lastFogDraws=[];
 let lastMipUsage={grass:[],paving:[]};
 let lastMaterialPaints={expandedFill:0,legacyFillStroke:0};
 let lastGroundOcclusion=null;
 let diagnosticSampling='inherit',lastSamplingState=null,lastProtectedDraws=[];
 function prepareMaterials(){
  if(disposed)return;
  patterns=null;
  if(decoded.grass){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
   ctx.filter='saturate(.72) brightness(.96)';ctx.drawImage(decoded.grass,0,0,512,512);ctx.filter='none';
   ctx.globalCompositeOperation='source-atop';ctx.fillStyle=world==='moonwood'?'#26374b80':world==='dino'?'#bca47445':'#f8f1d829';ctx.fillRect(0,0,512,512);prepared.grass=canvas;
  }
  if(decoded.paving){
   const image=decoded.paving,canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
   ctx.drawImage(image,0,0,512,512);ctx.globalCompositeOperation='multiply';ctx.fillStyle=RACER_CANVAS_PAVING_TINT[world];ctx.fillRect(0,0,canvas.width,canvas.height);prepared.paving=canvas;
  }
  for(const kind of ['grass','paving'])if(prepared[kind]){opaqueMaterials[kind]=racerPreparedMaterialIsOpaque(prepared[kind]);materialMips[kind]=createRacerMaterialMipOwner(prepared[kind]);}
  if(decoded.horizon)horizonPanels=prepareRacerHorizonPanels(decoded.horizon,world);
 }
 const ready=Promise.all([art.ready,moonFog?.ready,...Object.entries(assets).map(async([key,owner])=>{decoded[key]=await owner.ready;})]).then(values=>{prepareMaterials();return Boolean(values[0]);});
 const v=new THREE.Vector3(),depth=new THREE.Vector3();
 const canvasVenues=sceneData.venues.flatMap(p=>{const source=racerCanvasVenueFrame(p.name);return source?[{...p,source}]:[];});
 const omittedVenueKinds=[...new Set(sceneData.venues.filter(p=>!racerCanvasVenueFrame(p.name)).map(p=>p.name))];
 const color=world==='moonwood'?{sky:'#101a42',grass:'#425648',road:'#8293b1',kerb:'#c4b9ed'}:world==='dino'?{sky:'#edb36f',grass:'#899665',road:'#d0c3a8',kerb:'#e7ad4f'}:{sky:'#8accec',grass:'#a0b678',road:'#d6d2bf',kerb:'#e5c47c'};
 function project(p,width,height){depth.set(p.x,p.y||0,p.z).applyMatrix4(camera.matrixWorldInverse);if(depth.z>=-.12)return null;v.set(p.x,p.y||0,p.z).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2,depth:-depth.z};}
 const surfaces=[];for(let index=1;index<track.path.length;index++){
  const a=track.path[index-1],b=track.path[index];
  for(const [inner,outer,kind]of[[-RACER_ROAD_WIDTH/2,RACER_ROAD_WIDTH/2,'road'],[-RACER_ROAD_WIDTH/2-.7,-RACER_ROAD_WIDTH/2,'kerb'],[RACER_ROAD_WIDTH/2,RACER_ROAD_WIDTH/2+.7,'kerb']])surfaces.push({kind,points:[offsetCircuitPoint(a,inner),offsetCircuitPoint(a,outer),offsetCircuitPoint(b,outer),offsetCircuitPoint(b,inner)],index});
 }
 function path(ctx,pixels){ctx.beginPath();pixels.forEach((p,i)=>{if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();}
 function visiblePixels(pixels,width,height){return pixels.length>=3&&!pixels.some(p=>!p)&&!pixels.every(p=>p.x<0)&&!pixels.every(p=>p.x>width)&&!pixels.every(p=>p.y<0)&&!pixels.every(p=>p.y>height);}
 function polygon(ctx,points,width,height,fill){const pixels=clipSportsCanvasPolygon(camera,points,.121).map(p=>project(p,width,height));if(!visiblePixels(pixels,width,height))return false;path(ctx,pixels);ctx.fillStyle=fill;ctx.fill();return true;}
 function materialPolygon(ctx,points,width,height,kind,metres,fallback){
  const clipped=clipSportsCanvasPolygon(camera,points,.121),pixels=clipped.map(p=>project(p,width,height));if(!visiblePixels(pixels,width,height))return false;
  const levels=materialMips[kind]?.levels,paint=patterns[kind];
  if(!paint?.[0]?.setTransform||!levels?.length){path(ctx,pixels);ctx.fillStyle=fallback;ctx.fill();return true;}
  for(let i=1;i<pixels.length-1;i++){
   const tri=[0,i,i+1],worldPoints=tri.map(j=>clipped[j]),screenPoints=tri.map(j=>pixels[j]);
   const original=racerWorldTextureMatrix(worldPoints,screenPoints,levels[0].width,levels[0].height,metres);
   if(!original)continue;
   const level=racerMaterialMipIndex(original,levels.length),image=levels[level],pattern=paint[level];
   const matrix=level?racerWorldTextureMatrix(worldPoints,screenPoints,image.width,image.height,metres):original;
   lastMipUsage[kind][level]=(lastMipUsage[kind][level]||0)+1;
   pattern.setTransform(new DOMMatrix(matrix));
   lastMaterialPaints[paintRacerMaterialTriangle(ctx,screenPoints,pattern,opaqueMaterials[kind])]++;
  }return true;
 }
 function drawGround(ctx,width,height,clipEnabled){
  const direction=camera.getWorldDirection(new THREE.Vector3()),far=project({x:camera.position.x+direction.x*1800,y:-.22,z:camera.position.z+direction.z*1800},width,height);
  const top=Math.max(0,Math.min(height*.72,(far?.y??height*.3)+2)),rows=14,columns=6,grid=[];
  for(let row=0;row<=rows;row++){
   const y=top+(height-top)*(row/rows)**1.5,line=[];
   for(let column=0;column<=columns;column++)line.push(racerCanvasGroundPoint(camera,column*width/columns,y,width,height));grid.push(line);
  }
  const polygons=[];
  const pavingReady=Boolean(opaqueMaterials.paving&&patterns.paving?.[0]?.setTransform&&materialMips.paving?.levels.length);
  if(clipEnabled&&pavingReady){
   for(const surface of surfaces){
    if(surface.kind!=='road')continue;
    const clipped=clipSportsCanvasPolygon(camera,surface.points,.121),pixels=clipped.map(p=>project(p,width,height));
    if(!visiblePixels(pixels,width,height))continue;
    // The later road must actually have valid original UV triangles; an
    // ambiguous projection that would skip a paint cannot occlude grass.
    const image=materialMips.paving.levels[0],paintedTriangles=[];let paintable=true;
    for(let index=1;index<pixels.length-1;index++){
     const triangle=[pixels[0],pixels[index],pixels[index+1]];
     if(!racerWorldTextureMatrix([clipped[0],clipped[index],clipped[index+1]],triangle,image.width,image.height,RACER_SURFACE_METRES.paving)){paintable=false;break;}
     paintedTriangles.push(triangle);
    }
    // The actual later fan triangles each have an AA edge, including their
    // internal diagonal. A fully opaque material does not make the whole quad
    // pixel-opaque across that seam; its grass underlay must stay untouched.
    if(paintable)polygons.push(...paintedTriangles);
   }
  }
  const occlusion=racerGroundOcclusionRects(polygons,{width,height,top,opaque:pavingReady});
  lastGroundOcclusion={enabled:Boolean(clipEnabled),physicalMarginPx:RACER_GROUND_OCCLUSION_MARGIN_PX,rectangles:occlusion.rectangles.length,admittedRoadTriangles:occlusion.admitted,excludedArea:occlusion.area,groundViewportArea:(height-top)*width,extraRgbaBytes:0};
  return withRacerGroundOcclusion(ctx,occlusion,width,height,()=>{
   let calls=0;
   for(let row=0;row<rows;row++){
    ctx.globalAlpha=Math.min(1,(row+1)/3);
    for(let column=0;column<columns;column++){
     const points=[grid[row][column],grid[row][column+1],grid[row+1][column+1],grid[row+1][column]];if(points.some(p=>!p))continue;
     if(materialPolygon(ctx,points,width,height,'grass',RACER_SURFACE_METRES.grass,color.grass))calls++;
    }
   }ctx.globalAlpha=1;return calls;
  });
 }
 function crop(ctx,frame,p,h,source,width,height,decorative=false){const foot=project(p,width,height),head=project({...p,y:p.y+h},width,height);if(!foot||!head)return;const ph=Math.abs(foot.y-head.y),pw=ph*frame[2]/frame[3],x=foot.x-pw/2,y=foot.y-ph;if(ph<2||x+pw<0||x>width)return;const alpha=decorative?racerCanvasDecorativeOpacity({x,y,width:pw,height:ph},width,height):1;if(alpha<=.001)return;ctx.globalAlpha=alpha;ctx.drawImage(source,...frame,x,y,pw,ph);ctx.globalAlpha=1;}
 function drawHorizon(ctx,width,height){
  if(!horizonPanels)return 0;
  const yaw=Math.atan2(camera.matrixWorld.elements[8],camera.matrixWorld.elements[10])+Math.PI;
  const fovX=2*Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect),pixelsPerRadian=width/fovX,panelAngle=2*Math.atan(.93/2),h=height*.5,w=panelAngle*pixelsPerRadian;
  let calls=0;
  for(let panel=0;panel<8;panel++){
   const angle=Math.atan2(Math.sin(panel*Math.PI/4-yaw),Math.cos(panel*Math.PI/4-yaw)),x=width/2+angle*pixelsPerRadian-w/2;
   if(x+w<0||x>width)continue;
   const {surface,flip}=horizonPanels.panels[panel];ctx.save();
   if(flip){ctx.translate(x+w,-height*.04);ctx.scale(-1,1);ctx.drawImage(surface,0,0,w,h);}
   else ctx.drawImage(surface,x,-height*.04,w,h);
   ctx.restore();calls++;
  }return calls;
 }
 // V11/V12 confirmed unchanged final pixels, but V13 ordinary pacing worsened.
 // Keep complete original ground in normal play; the paused DEV comparison
 // retains the strict fan-interior experiment without admitting its cost.
 function draw({kart,pose,dt=0,gates=[],groundOcclusion=false}){
  if(disposed||!kart)return;const canvas=renderer.domElement,ctx=renderer.context,width=canvas.width,height=canvas.height;camera.updateMatrixWorld(true);
  // The paired V15 ordinary-frame comparison admitted low world sampling.
  // Scope it to this draw so registered cast/word images and the caller's
  // context keep their explicit quality rather than inheriting a prior draw.
  const worldSampling=import.meta.env?.DEV&&diagnosticSampling!=='inherit'?diagnosticSampling:'low';
  lastProtectedDraws=[];lastFogDraws=[];lastSamplingState={diagnostic:diagnosticSampling,before:ctx.imageSmoothingQuality,enabled:ctx.imageSmoothingEnabled,world:null,after:null};
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality=worldSampling;
  try{
  lastSamplingState.enabled=ctx.imageSmoothingEnabled;
  lastSamplingState.world=ctx.imageSmoothingQuality;
  if(!patterns)patterns=Object.fromEntries(['grass','paving'].map(kind=>[kind,materialMips[kind]?.levels.map(image=>ctx.createPattern(image,'repeat'))||[]]));
  lastMipUsage=Object.fromEntries(['grass','paving'].map(kind=>[kind,materialMips[kind]?.levels.map(()=>0)||[]]));
  lastMaterialPaints={expandedFill:0,legacyFillStroke:0};
  const sky=ctx.createLinearGradient(0,0,0,height*.65);sky.addColorStop(0,color.sky);sky.addColorStop(1,world==='moonwood'?'#27395e':world==='dino'?'#eed9b2':'#d7edf2');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  let calls=drawGround(ctx,width,height,groundOcclusion);
  calls+=drawHorizon(ctx,width,height);
  const distance=p=>(p.x-camera.position.x)**2+(p.z-camera.position.z)**2;
  const entities=surfaces.map(surface=>({kind:'surface',depth:surface.points.reduce((sum,p)=>sum+distance(p),0)/4,surface}));
  if(decoded.scenery){for(const p of sceneData.trees)entities.push({kind:'scenery',depth:distance(p),p,frame:sceneData.art.frames.tree,height:p.height,foliage:true});for(const p of canvasVenues)entities.push({kind:'scenery',depth:distance(p),p,frame:sceneData.art.frames[p.source.frame],height:p.source.height});}
  entities.push({kind:'hero',depth:distance(kart)});for(const gate of gates)if(gate.mesh.visible&&!gate.resolved)entities.push({kind:'gate',depth:distance(gate.mesh.position),gate});entities.sort((a,b)=>b.depth-a.depth);
  const frame=art.select(sportsArtView('driver',{actorX:kart.x,actorZ:kart.z,yaw:-kart.heading,cameraX:camera.position.x,cameraZ:camera.position.z}),pose.state,dt,{actionPhase:pose.phase});lastPose=null;
  for(const item of entities){
   if(item.kind==='surface'){const s=item.surface;if(s.kind==='road'){if(materialPolygon(ctx,s.points,width,height,'paving',RACER_SURFACE_METRES.paving,color.road))calls++;}else if(polygon(ctx,s.points,width,height,s.index%4<2?color.kerb:'#fff7e4'))calls++;}
   else if(item.kind==='scenery'){crop(ctx,item.frame,item.p,item.height,decoded.scenery,width,height,true);calls++;}
   else if(item.kind==='hero'&&frame){const foot=project(kart,width,height);if(foot){
    const scale=height/(2*Math.tan(camera.fov*Math.PI/360)*foot.depth*frame.metadata.pixelsPerUnit),[sx,sy,sw,sh]=frame.frame.cell,[ax,ay]=frame.frame.groundAnchor;
    lastPose={state:pose.state,phase:pose.phase,view:frame.view,wantedView:frame.wantedView,pixelScale:scale,sourceOpaqueBounds:[...frame.frame.opaqueBounds],displayOpaqueSize:[(frame.frame.opaqueBounds[2]-frame.frame.opaqueBounds[0])*scale,(frame.frame.opaqueBounds[3]-frame.frame.opaqueBounds[1])*scale]};
    if(import.meta.env?.DEV)Object.assign(lastPose,{selectedPhase:frame.frame.phase,format:art.snapshot().format,sourceCell:[...frame.frame.cell],sourceAnchor:[...frame.frame.groundAnchor],pixelsPerUnit:frame.metadata.pixelsPerUnit,groundScreenPoint:[foot.x,foot.y]});
    drawRacerTyreFootprint(ctx,foot,scale,frame.frame.tyreContacts,frame.frame.groundAnchor,frame.metadata.pixelsPerUnit);
    ctx.save();
    try{
     ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
     const source=[sx,sy,sw,sh],destination=[foot.x-ax*scale,foot.y-ay*scale,sw*scale,sh*scale];
     if(import.meta.env?.DEV)lastProtectedDraws.push({kind:'hero',image:frame.image,source,destination,quality:ctx.imageSmoothingQuality,enabled:ctx.imageSmoothingEnabled});
     ctx.drawImage(frame.image,...source,...destination);
    }finally{ctx.restore();}calls++;
   }}else if(item.kind==='gate'){
    const gate=item.gate,p=project(gate.mesh.position,width,height);if(!p)continue;const scale=height/(2*Math.tan(camera.fov*Math.PI/360)*p.depth),sprite=gate.mesh.userData.sprite;
    if(sprite?.material?.map?.image){
     const image=sprite.material.map.image,w=3.65*scale,h=1.78*scale,destination=[p.x-w/2,p.y-h-1.24*scale,w,h];
     ctx.save();
     try{
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      if(import.meta.env?.DEV)lastProtectedDraws.push({kind:'word',image,source:[0,0,image.width,image.height],destination,quality:ctx.imageSmoothingQuality,enabled:ctx.imageSmoothingEnabled});
      ctx.drawImage(image,...destination);
     }finally{ctx.restore();}calls++;
    }
    else if(gate.mesh.userData.moonFog&&moonFog?.frame()){
     const source=moonFog.frame(),fog=moonFogCanvasFrame({point:p,scale:gate.mesh.scale.x,viewportHeight:height,fov:camera.fov,metadata:source.metadata});
     if(fog){calls+=drawMoonFogCanvas(ctx,source.image,fog);lastFogDraws.push({gateZ:gate.z,lane:gate.lane,destination:[...fog.destination],registeredScreenCentre:[...fog.registeredScreenCentre],sourceSha256:source.metadata.runtimeSha256,presentation:{...MOON_FOG_PRESENTATION}});}
    }
    else for(const face of racerCanvasObstacleFaces(gate.mesh,camera.position)){ctx.globalAlpha=face.opacity;if(polygon(ctx,face.points,width,height,face.color))calls++;}ctx.globalAlpha=1;
   }
  }
  renderer.info.render.calls=calls;renderer.info.render.triangles=0;renderer.info.memory.textures=0;renderCount++;
  }finally{ctx.restore();lastSamplingState.after=ctx.imageSmoothingQuality;}
 }
 function setSamplingDiagnostic(sampling){
  if(!import.meta.env?.DEV||disposed||!RACER_DIAGNOSTIC_SAMPLING.includes(sampling))return false;
  diagnosticSampling=sampling;return true;
 }
 function compareSampling(input,sampling){
  if(!import.meta.env?.DEV||disposed)return null;
  const previous=diagnosticSampling;
  try{return compareRacerSamplingFrame({ctx:renderer.context,canvas:renderer.domElement,sampling,draw(mode){
   diagnosticSampling=mode;draw({...input,dt:0});return{state:{...lastSamplingState},regions:[...lastProtectedDraws]};
  }});}finally{diagnosticSampling=previous;lastProtectedDraws=[];}
 }
 function prepareDriverCandidate(){return Promise.resolve(false);}
 function selectDriverFormat(){return false;}
 function compareDriverCandidate(){return null;}
 function compareFrame(input){
  if(!import.meta.env?.DEV||disposed)return null;
  const canvas=renderer.domElement,ctx=renderer.context,result={width:canvas.width,height:canvas.height,diagnosticDraws:2,transientPixelBytes:canvas.width*canvas.height*8,gcObserved:false};
  const readbacks={};
  try{
   draw({...input,dt:0,groundOcclusion:false});
   result.originalPng=canvas.toDataURL('image/png');readbacks.original=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   draw({...input,dt:0,groundOcclusion:true});
   result.clippedPng=canvas.toDataURL('image/png');readbacks.clipped=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   result.occlusion={...lastGroundOcclusion};result.differingPixels=0;result.maxChannelDelta=0;result.differenceBounds=null;
   for(let index=0;index<readbacks.original.length;index+=4){
    let delta=0;for(let channel=0;channel<4;channel++)delta=Math.max(delta,Math.abs(readbacks.original[index+channel]-readbacks.clipped[index+channel]));
    result.maxChannelDelta=Math.max(result.maxChannelDelta,delta);
    if(delta>1){
     result.differingPixels++;const x=(index/4)%canvas.width,y=Math.floor(index/4/canvas.width),bounds=result.differenceBounds;
     result.differenceBounds=bounds?[Math.min(bounds[0],x),Math.min(bounds[1],y),Math.max(bounds[2],x),Math.max(bounds[3],y)]:[x,y,x,y];
    }
   }
  }finally{
   result.pixelRelease=[releaseRacerComparisonPixels(readbacks.original),releaseRacerComparisonPixels(readbacks.clipped)];
   delete readbacks.original;delete readbacks.clipped;result.transientPixelReferencesReleased=Object.keys(readbacks).length===0;
  }
  return result;
 }
 return{ready,draw,compareFrame,setSamplingDiagnostic,compareSampling,prepareDriverCandidate,selectDriverFormat,compareDriverCandidate,snapshot:()=>({renderer:'canvas',world,renderCount,sampling:lastSamplingState?{...lastSamplingState}:null,originalAthlete:art.snapshot(),pose:lastPose?structuredClone(lastPose):null,moonFog:moonFog?{...moonFog.snapshot(),drawn:lastFogDraws.map(row=>({...row,destination:[...row.destination],registeredScreenCentre:[...row.registeredScreenCentre]}))}:null,sceneDelivery:Object.fromEntries(Object.keys(assets).map(key=>[key,decoded[key]?'delivered':'unavailable'])),sceneDecodedBytes:Object.values(decoded).reduce((sum,image)=>sum+(image?image.width*image.height*4:0),0)+(moonFog?.snapshot().decodedRgbaBytes||0),preparedSurfaceBytes:Object.values(prepared).reduce((sum,image)=>sum+image.width*image.height*4,0)+(horizonPanels?.snapshot().rgbaBytes||0)+Object.values(materialMips).reduce((sum,owner)=>sum+owner.snapshot().derivedRgbaBytes,0),horizonWorkingPanels:horizonPanels?.snapshot()||null,materialPaints:{...lastMaterialPaints},groundOcclusion:lastGroundOcclusion?{...lastGroundOcclusion}:null,opaqueMaterials:{...opaqueMaterials},materialWorkingMips:Object.fromEntries(Object.entries(materialMips).map(([kind,owner])=>[kind,{...owner.snapshot(),usage:[...lastMipUsage[kind]]}])),surfaceBytes:renderer.domElement.width*renderer.domElement.height*4,roadSurfaces:surfaces.length,materialMetres:{...RACER_SURFACE_METRES},obstaclePresentation:moonFog?'registered-authored-fog-and-actual-mesh-faces':'actual-mesh-faces',decorativeVenues:{matchingSourceKinds:[...new Set(canvasVenues.map(p=>p.name))],omittedKinds:[...omittedVenueKinds],landmarks:'original-authored-horizon'}}),dispose(){if(disposed)return;disposed=true;art.dispose();moonFog?.dispose();Object.values(assets).forEach(owner=>owner.dispose());Object.keys(decoded).forEach(key=>delete decoded[key]);Object.values(prepared).forEach(canvas=>{canvas.width=canvas.height=1;});Object.keys(prepared).forEach(key=>delete prepared[key]);Object.values(materialMips).forEach(owner=>owner.dispose());Object.keys(materialMips).forEach(key=>delete materialMips[key]);Object.keys(opaqueMaterials).forEach(key=>delete opaqueMaterials[key]);horizonPanels?.dispose();horizonPanels=null;patterns=null;lastGroundOcclusion=null;lastProtectedDraws=[];lastFogDraws=[];lastSamplingState=null;}};
}
