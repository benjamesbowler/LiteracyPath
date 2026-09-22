import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from './threeShell.js';

const URL = '/game-assets/arcade-worlds/';
const WOODLAND_TREES = [[-20,58],[21,55],[-40,15],[45,-10],[-22,-46],[69,61],[-81,-52],[78,-43],[-79,23],[26,-57],[-12,26],[62,24]];
const isTree = id => /^(birch|broadleaf|maple)/.test(id);
const TREE_ISLANDS = [[-24,18],[24,0],[-24,-22],[24,-43],[-24,-66]];

// These placements dress existing solid islands and the outside of the arena.
// Ground-level flowers occupy no collision volume. Learning targets stay owned
// by the games; decoration never reads the answer's correctness.
export function gardenWorldPlacements(gameId, route = 0) {
  const result = [];
  const add = (id,x,z,height,y=0,yaw=0,solid=false) => result.push({id,x,y,z,height,yaw,solid});
  if (gameId === 'grammar-grind') {
    TREE_ISLANDS.forEach(([x,z],i) => {
      add(i%2?'broadleaf-tree':'maple-tree',x,z,17,.8,i*.7,true);
      for(let k=0;k<4;k++)add('flowering-shrub',x+Math.cos(k*Math.PI/2)*3,z+Math.sin(k*Math.PI/2)*2,1.4,.82,k);
    });
    for(let i=0;i<18;i++) {
      const angle=(i*7%18)*Math.PI/9;
      add(i%3?'broadleaf-tree':'birch-tall',Math.sin(angle)*(96+i%2*5),Math.cos(angle)*(96+i%2*5),19+i%4*3,0,angle);
    }
    for(let i=0;i<7;i++)add(['park-house','park-cafe','park-workshop'][i%3],-90+i*30,-109,15+i%3*2,0,Math.PI);
    for(const side of [-1,1])for(let i=0;i<4;i++)add(['park-house','park-workshop'][i%2],side*109,55-i*35,16+i%2*2,0,-side*Math.PI/2);
  } else {
    for(let i=0;i<26;i++) {
      const angle=(i*11%26)*Math.PI/13;
      add(i%3?'broadleaf-tree':'broadleaf-tall',Math.sin(angle)*132,Math.cos(angle)*105,30+i%4*3,0,angle*.7);
    }
    // The camp sits behind the starting position, clear of every answer route.
    for(const x of [-20,20]) { add('maple-tree',x,86,22);add('flowering-shrub',x*.76,83,1.8); }
    WOODLAND_TREES.forEach(([x,z],i)=>{
      add(i%3===0?'maple-tree':'broadleaf-tree',x,z,19+i%3*3,0,i*.8,true);
      for(let k=0;k<3;k++)add('flowering-shrub',x+Math.cos(k*2.1)*3.4,z+Math.sin(k*2.1)*3,1.2,0,k);
    });
    for(let i=0;i<45;i++) {
      const x=-110+(i*43)%220,z=-79+(i*31)%157;
      if(Math.abs(x)<12&&z>42)continue;
      add('meadow-grass',x,z,.7+(i%3)*.2,0,i);
    }
    for(const [x,z] of [[-127,-65],[126,-24],[-126,22],[126,57],[-60,98],[55,-99]])add('mossy-rock',x,z,3.5,0,x);
  }
  if(route%2)result.forEach(p=>{p.x=-p.x;p.yaw=-p.yaw;});
  return result;
}

export function createGardenWorld(gameId, { onReady, world='meadow', route=0 } = {}) {
  const root=new THREE.Group();root.name='AuthoredGardenWorld';root.userData.assetState='loading';
  const owned=[];const templates=new Map();const instanced=[];const attachments=new Set();const simpleMaterials=new Map();
  const motion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const placements=gardenWorldPlacements(gameId,route);
  const ids=[...new Set(placements.map(p=>p.id).concat(gameId==='star-gallery'?['garden-rover','birch-canopy']:[]))];
  let disposed=false,time=0,lastWind=-1,low=false;
  const contactRoot=new THREE.Group();root.add(contactRoot);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=64;shadowCanvas.height=64;
  const context=shadowCanvas.getContext('2d'),gradient=context.createRadialGradient(32,32,2,32,32,32);
  gradient.addColorStop(0,'rgba(27,45,28,.4)');gradient.addColorStop(.35,'rgba(27,45,28,.2)');gradient.addColorStop(1,'rgba(27,45,28,0)');context.fillStyle=gradient;context.fillRect(0,0,64,64);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const shadowGeometry=new THREE.PlaneGeometry(1,1);
  placements.filter(p=>isTree(p.id)).forEach(p=>{const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.scale.set(p.height*.8,p.height*.58,1);shadow.position.set(p.x+.8,p.y+.045,p.z);shadow.userData.solid=p.solid;contactRoot.add(shadow);});
  const loader=new GLTFLoader();
  function normalized(id,height) {
    const source=templates.get(id);if(!source)return null;
    const model=source.scene.clone(true),slot=new THREE.Group();
    const {box,size,centre}=source;
    model.position.sub(new THREE.Vector3(centre.x,box.min.y,centre.z));
    slot.scale.setScalar(height/size.y);slot.add(model);return slot;
  }
  function style(model,id) {
    model.traverse(node=>{
      if(!node.isMesh)return;
      node.receiveShadow=true;node.castShadow=id==='garden-rover';
      for(const material of Array.isArray(node.material)?node.material:[node.material]) {
        // Leaf cutouts write depth and render once: alpha blending otherwise
        // doubles foliage work and sorts whole instances incorrectly.
        if(material.transparent){material.transparent=false;material.alphaTest=.4;material.depthWrite=true;material.forceSinglePass=true;material.needsUpdate=true;}
        material.roughness=Math.max(.65,material.roughness||0);material.envMapIntensity=.32;
        if(material.map){material.map.anisotropy=4;material.map.needsUpdate=true;}
        if(id.startsWith('birch')&&/leave/i.test(material.name)&&world==='meadow') material.color.multiply(new THREE.Color('#85b976'));
        if(world==='moonwood'&&id!=='garden-rover')material.color.multiply(new THREE.Color('#9aabc9'));
        else if(world==='dino'&&id.startsWith('birch'))material.color.multiply(new THREE.Color('#d9b788'));
      }
    });
  }
  function tierMaterial(original) {
    if(!low)return original;
    if(!simpleMaterials.has(original))simpleMaterials.set(original,new THREE.MeshLambertMaterial({color:original.color,map:original.map,side:original.side,alphaTest:original.alphaTest,transparent:false,depthWrite:true}));
    return simpleMaterials.get(original);
  }
  function applyQuality() {
    // Solid trunks are first in every batch. Only distant scenery thins out.
    instanced.forEach(({batch,transforms,slots,id,material})=>{batch.material=Array.isArray(material)?material.map(tierMaterial):tierMaterial(material);const solids=slots.filter(p=>p.solid).length;batch.count=low?solids+Math.ceil((transforms.length-solids)*(isTree(id)?.4:.65)):transforms.length;});
    contactRoot.children.forEach(shadow=>{shadow.visible=!low||shadow.userData.solid;});
  }
  const ready=Promise.all(ids.map(async id=>{
    const gltf=await loader.loadAsync(URL+id+'.glb');
    if(disposed){disposeObject(gltf.scene);return;}
    owned.push(gltf.scene);style(gltf.scene,id);gltf.scene.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
    templates.set(id,{scene:gltf.scene,box,size,centre});
  })).then(()=>{
    if(disposed)return false;
    for(const id of ids) {
      const source=templates.get(id),slots=placements.filter(p=>p.id===id).sort((a,b)=>Number(b.solid)-Number(a.solid));if(!slots.length)continue;
      source.scene.traverse(node=>{
        if(!node.isMesh)return;
        const batch=new THREE.InstancedMesh(node.geometry,node.material,slots.length);
        batch.name='Instanced '+id;batch.receiveShadow=true;batch.castShadow=isTree(id);
        const transforms=slots.map(p=>{
          const scale=p.height/source.size.y;
          const slot=new THREE.Matrix4().compose(new THREE.Vector3(p.x,p.y,p.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),p.yaw),new THREE.Vector3(scale,scale,scale));
          return slot.multiply(new THREE.Matrix4().makeTranslation(-source.centre.x,-source.box.min.y,-source.centre.z)).multiply(node.matrixWorld);
        });
        transforms.forEach((matrix,i)=>batch.setMatrixAt(i,matrix));batch.computeBoundingSphere();root.add(batch);
        instanced.push({batch,transforms,id,slots,material:node.material});
      });
    }
    applyQuality();root.userData.assetState='ready';onReady?.(root);return true;
  }).catch(()=>{if(!disposed)root.userData.assetState='fallback';return false;});
  return {
    root,ready,
    resolvePosition(player) {
      if(gameId!=='star-gallery'||root.userData.assetState!=='ready')return;
      // Only solid trunks collide; the low planting leaves clear driving routes.
      for(const [originalX,z] of WOODLAND_TREES){const x=route%2?-originalX:originalX;const dx=player.x-x,dz=player.z-z,distance=Math.hypot(dx,dz),radius=2.4;if(distance<radius){const divisor=distance||1;player.x=x+(distance?dx/divisor:1)*radius;player.z=z+(distance?dz/divisor:0)*radius;player.speed*=.75;}}
    },
    attachRover(vehicle) {
      const model=normalized('garden-rover',3.15);if(!model||disposed)return false;
      vehicle.children.forEach(child=>{child.visible=false;});vehicle.add(model);attachments.add(model);
      const wheels=[];model.traverse(node=>{if(node.name.startsWith('Wheel_'))wheels.push(node);});
      vehicle.userData.wheels=wheels;vehicle.userData.authoredAsset='garden-rover';return true;
    },
    attachTree(token) {
      const model=normalized('birch-canopy',6.4);if(!model||disposed)return false;
      // A single identical model for every answer: no correctness giveaway.
      token.treeFallback?.forEach(node=>{node.visible=false;});token.group.add(model);token.gardenAsset=model;attachments.add(model);return true;
    },
    detachTree(token) {if(token.gardenAsset){token.gardenAsset.removeFromParent();attachments.delete(token.gardenAsset);token.gardenAsset=null;}},
    setQuality(tier) {low=tier==='low';applyQuality();},
    update(dt,{paused=false,reducedMotion=false}={}) {
      if(disposed||paused||reducedMotion||motion?.matches)return;
      time+=Math.min(.05,Math.max(0,dt));root.userData.animationTime=time;
      if(low||time-lastWind<.08)return;lastWind=time;
      const sway=new THREE.Matrix4(),rot=new THREE.Quaternion(),axis=new THREE.Vector3(0,0,1),position=new THREE.Vector3();
      for(const {batch,transforms,id,slots} of instanced) {
        if(!isTree(id))continue;
        transforms.forEach((base,i)=>{
          const p=slots[i];position.set(p.x,p.y,p.z);
          rot.setFromAxisAngle(axis,Math.sin(time*.8+i*1.7)*.006);
          sway.makeTranslation(position.x,position.y,position.z).multiply(new THREE.Matrix4().makeRotationFromQuaternion(rot)).multiply(new THREE.Matrix4().makeTranslation(-position.x,-position.y,-position.z)).multiply(base);
          batch.setMatrixAt(i,sway);
        });batch.instanceMatrix.needsUpdate=true;
      }
    },
    dispose() {
      disposed=true;root.removeFromParent();
      // Instanced objects own GPU instance buffers; templates own shared meshes.
      instanced.forEach(({batch})=>batch.dispose());
      for(const node of attachments)node.removeFromParent();attachments.clear();root.clear();
      shadowGeometry.dispose();shadowMaterial.dispose();shadowTexture.dispose();
      simpleMaterials.forEach(material=>material.dispose());simpleMaterials.clear();
      owned.forEach(disposeObject);owned.length=0;templates.clear();
    }
  };
}
