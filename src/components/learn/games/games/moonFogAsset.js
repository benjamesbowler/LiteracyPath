import * as THREE from 'three';

export const MOON_FOG_ASSET=Object.freeze({
 metadata:'/game-assets/sound-racer/hazards/moon-fog-v1.json',metadataSha256:'b5e52c1cb64c46410570161bca121007303626f1dc911401fb588b5c126bb271',
 runtime:'/game-assets/sound-racer/hazards/moon-fog-v1.webp',runtimeSha256:'af8ff5d31a0f52625a31dacb36508ad1389915fbf33bd8e138e12a5730235ede',
 dimensions:Object.freeze([512,256]),decodedRgbaBytes:524288,pixelsPerUnit:150.58823107023153,
 centre:Object.freeze([256,133.92292022705078]),
});
// The source remains the same original rolling volume. Its opaque footprint
// now matches the existing motor hazard more closely, with a pearl-lit body
// that can be distinguished from the night road. Two source-over passes raise
// alpha without adding another decoded image or changing the contact authority.
export const MOON_FOG_PRESENTATION=Object.freeze({scale:1.12,passes:2,brightness:1.5,linearBrightness:2.5});
const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');
export function moonFogSpriteRegistration(metadata){
 if(metadata?.format!=='moon-fog-alpha-v1'||metadata.kind!=='motor-obstacle'||metadata.world!=='moonwood'||metadata.runtime!==MOON_FOG_ASSET.runtime
  ||metadata.runtimeSha256!==MOON_FOG_ASSET.runtimeSha256||JSON.stringify(metadata.dimensions)!=='[512,256]'||metadata.decodedRgbaBytes!==524288
  ||metadata.pixelsPerUnit!==MOON_FOG_ASSET.pixelsPerUnit||JSON.stringify(metadata.registeredCentreWorld)!=='[0,0,0]'||JSON.stringify(metadata.registeredCentrePixel)!==JSON.stringify(MOON_FOG_ASSET.centre))return null;
 return{width:512/metadata.pixelsPerUnit,height:256/metadata.pixelsPerUnit,centre:[.5,1-metadata.registeredCentrePixel[1]/256],anchor:[...metadata.registeredCentrePixel]};
}
export async function decodeMoonFog({signal}){
 const response=await fetch(MOON_FOG_ASSET.metadata,{signal});if(!response.ok)throw new Error('Moon fog registration unavailable');
 const bytes=await response.arrayBuffer();if(await digest(bytes)!==MOON_FOG_ASSET.metadataSha256)throw new Error('Moon fog registration fingerprint mismatch');
 const metadata=JSON.parse(new TextDecoder().decode(bytes));if(!moonFogSpriteRegistration(metadata))throw new Error('Moon fog registration invalid');
 const imageResponse=await fetch(metadata.runtime,{signal});if(!imageResponse.ok)throw new Error('Moon fog source unavailable');
 const imageBytes=await imageResponse.arrayBuffer();if(await digest(imageBytes)!==metadata.runtimeSha256)throw new Error('Moon fog source fingerprint mismatch');
 if(signal.aborted)throw new Error('Moon fog cancelled before decode');
 let image,release;const blob=new Blob([imageBytes],{type:'image/webp'});
 if(typeof createImageBitmap==='function'){image=await createImageBitmap(blob);release=()=>image.close();}
 else{const url=URL.createObjectURL(blob);image=new Image();release=()=>{image.removeAttribute('src');URL.revokeObjectURL(url);};try{image.src=url;await image.decode();}catch(error){release();throw error;}}
 let closed=false;const close=()=>{if(closed)return;closed=true;release();};
 if(signal.aborted||image.width!==512||image.height!==256){close();throw new Error('Moon fog decode cancelled or unregistered');}
 return{image,metadata,close};
}

// This registration uses the original source's centre, not its opaque bounding
// rectangle. The same live gate centre and uniform world scale serve both views.
export function moonFogCanvasFrame({point,scale,viewportHeight,fov,metadata}){
 const registration=moonFogSpriteRegistration(metadata);
 if(!registration||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(point.depth)||point.depth<=0||!Number.isFinite(scale)||scale<=0||!Number.isFinite(viewportHeight)||viewportHeight<=0||!Number.isFinite(fov)||fov<=0||fov>=180)return null;
 const pixelsPerWorldUnit=viewportHeight/(2*Math.tan(fov*Math.PI/360)*point.depth),pixelScale=pixelsPerWorldUnit*scale*MOON_FOG_PRESENTATION.scale/metadata.pixelsPerUnit;
 return{destination:[point.x-registration.anchor[0]*pixelScale,point.y-registration.anchor[1]*pixelScale,512*pixelScale,256*pixelScale],registeredScreenCentre:[point.x,point.y]};
}

export function drawMoonFogCanvas(ctx,image,frame){
 if(!ctx||!image||!frame)return 0;
 ctx.save();
 try{
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';
  ctx.filter=`brightness(${MOON_FOG_PRESENTATION.brightness})`;
  for(let pass=0;pass<MOON_FOG_PRESENTATION.passes;pass++)ctx.drawImage(image,...frame.destination);
 }finally{ctx.restore();}
 return MOON_FOG_PRESENTATION.passes;
}

export function createMoonFogSourceOwner({decode=decodeMoonFog}={}){
 const controller=new AbortController();let source=null,disposed=false,delivery='pending',lateDeliveriesClosed=0,releaseReceipt=null;
 const ready=decode({signal:controller.signal}).then(delivered=>{
  if(disposed||controller.signal.aborted){delivered.close();lateDeliveriesClosed++;return false;}
  if(!moonFogSpriteRegistration(delivered.metadata)){delivered.close();throw new Error('Moon fog delivered with invalid registration');}
  source=delivered;delivery='delivered';return true;
 }).catch(()=>{if(!disposed)delivery='unavailable';return false;});
 function dispose(){
  if(releaseReceipt)return structuredClone(releaseReceipt);
  disposed=true;controller.abort();const image=source?.image;source?.close();source=null;delivery='released';
  releaseReceipt={imageClosed:Boolean(image),decodedBytesBefore:image?MOON_FOG_ASSET.decodedRgbaBytes:0};return structuredClone(releaseReceipt);
 }
 return{ready,frame:()=>disposed?null:source,snapshot:()=>({delivery,disposed,decodedRgbaBytes:source?MOON_FOG_ASSET.decodedRgbaBytes:0,source:MOON_FOG_ASSET.runtime,sourceSha256:MOON_FOG_ASSET.runtimeSha256,lateDeliveriesClosed,releaseReceipt:releaseReceipt?structuredClone(releaseReceipt):null}),dispose};
}

// One primary source owner serves its generated hazard sprites. Gate-set
// retirement first detaches maps; the source belongs to this owner rather than
// a word-gate disposer. Independent Canvas recovery decodes its own source.
export function createMoonFogPrimaryOwner({decode=decodeMoonFog}={}){
 const source=createMoonFogSourceOwner({decode}),bindings=new Map();let texture=null,disposed=false,releaseReceipt=null;
 const ready=source.ready.then(delivered=>{
  if(!delivered||disposed)return false;
  texture=new THREE.Texture(source.frame().image);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;
  for(const [sprite,fallback] of bindings){sprite.material.map=texture;sprite.material.needsUpdate=true;sprite.visible=true;fallback.forEach(mesh=>{mesh.visible=false;});}
  return true;
 });
 function attach(group){
  const registration=moonFogSpriteRegistration(source.frame()?.metadata)||{width:512/MOON_FOG_ASSET.pixelsPerUnit,height:256/MOON_FOG_ASSET.pixelsPerUnit,centre:[.5,1-MOON_FOG_ASSET.centre[1]/256],anchor:[...MOON_FOG_ASSET.centre]};
  group.userData.moonFog={registration,source:MOON_FOG_ASSET.runtime};
  if(disposed)return null;
  const fallback=group.children.filter(child=>child.isMesh);let first=null;
  for(let pass=0;pass<MOON_FOG_PRESENTATION.passes;pass++){
   const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:new THREE.Color(MOON_FOG_PRESENTATION.linearBrightness,MOON_FOG_PRESENTATION.linearBrightness,MOON_FOG_PRESENTATION.linearBrightness),transparent:true,depthWrite:false,toneMapped:false}));
   sprite.scale.set(registration.width*MOON_FOG_PRESENTATION.scale,registration.height*MOON_FOG_PRESENTATION.scale,1);sprite.center.set(...registration.centre);sprite.visible=Boolean(texture);sprite.userData.moonFog=true;
   group.add(sprite);bindings.set(sprite,fallback);if(sprite.visible)fallback.forEach(mesh=>{mesh.visible=false;});if(!first)first=sprite;
  }
  return first;
 }
 function detach(root){if(!root)return;root.traverse(node=>{if(bindings.has(node)){node.material.map=null;node.material.needsUpdate=true;bindings.delete(node);}});}
 function releasePrimary(){
  if(releaseReceipt)return structuredClone(releaseReceipt);
  disposed=true;for(const [sprite,fallback] of bindings){sprite.material.map=null;sprite.material.needsUpdate=true;sprite.visible=false;fallback.forEach(mesh=>{mesh.visible=true;});}bindings.clear();
  texture?.dispose();if(texture)texture.source.data=null;releaseReceipt={textureDisposed:Boolean(texture),...source.dispose(),bindings:0};texture=null;return structuredClone(releaseReceipt);
 }
 return{ready,attach,detach,releasePrimary,snapshot:()=>({...source.snapshot(),presentation:{...MOON_FOG_PRESENTATION},bindings:bindings.size,texture:Boolean(texture),disposed,releaseReceipt:releaseReceipt?structuredClone(releaseReceipt):null}),dispose:releasePrimary};
}
