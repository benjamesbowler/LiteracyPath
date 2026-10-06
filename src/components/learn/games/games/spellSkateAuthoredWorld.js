import * as THREE from 'three';
import {createSportsVenueBatches} from './sportsStaticBatch.js';
import {disposeOwnedSportsGltf,disposeOwnedSportsPrimaryGroup,disposeOwnedSportsTexture} from './sportsOwnedGltfResources.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RALLY_PALS_WORLD_ART} from '../../../../utils/rallyPalsRules.js';

// The same authored material treatment belongs to both presentations.
export const SKATE_MATERIAL_TINTS=Object.freeze({
  meadow:Object.freeze({floor:'#fffdf5',ramp:'#f2ecde'}),
  dino:Object.freeze({floor:'#efdec2',ramp:'#ddcdb0'}),
  moonwood:Object.freeze({floor:'#a7b7d5',ramp:'#8092b6'})
});

export const SKATE_AUTHORED_WORLD_URLS=Object.freeze(Object.fromEntries(['meadow','dino','moonwood'].map(world=>[world,{
  // Retained original sports venue geometry and registered physical-world art.
  // Every park owns its parsed resources and instancing; no shared live cache.
  venues:`/game-assets/sound-racer/venues/${world}-circuit-venues-v1.glb`,
  horizon:`/game-assets/physical-arcade/rally-pals/${world}-horizon-v1.webp`,
  scenery:`/game-assets/physical-arcade/rally-pals/${world}-scenery-v1.webp`,
  concrete:'/game-assets/spell-skate/materials/fine-concrete-albedo-v1.webp',
  wood:'/game-assets/physical-arcade/burrow-builders/materials/plank-albedo-v1.webp'
}])));

// Changing UVs never changes the actual ramps, concave bowl or collision mesh.
export function mapSkateSurface(geometry,metresPerTile=2.4){
  if(geometry.userData.authoredSkateUV)return;
  const p=geometry.attributes.position,n=geometry.attributes.normal,uv=[];
  for(let i=0;i<p.count;i++){
    const normal=[Math.abs(n?.getX(i)||0),Math.abs(n?.getY(i)||0),Math.abs(n?.getZ(i)||0)];
    const axis=normal.indexOf(Math.max(...normal));
    const point=[p.getX(i),p.getY(i),p.getZ(i)],axes=[0,1,2].filter(index=>index!==axis);
    uv.push(point[axes[0]]/metresPerTile,point[axes[1]]/metresPerTile);
  }
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.userData.authoredSkateUV=true;
}
export function createSkateOriginalMaterials(world,renderer){
  const states={};let disposed=false;
  const textures={};
  const ready=Promise.all(['concrete','wood'].map(kind=>new Promise(resolve=>{
    states[kind]='pending';
    const texture=new THREE.TextureLoader().load(SKATE_AUTHORED_WORLD_URLS[world][kind],()=>{
      if(disposed){disposeOwnedSportsTexture(texture);resolve(false);return;}states[kind]='delivered';resolve(true);
    },undefined,()=>{states[kind]='unavailable';resolve(false);});
    texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.anisotropy=Math.min(4,renderer?.capabilities?.getMaxAnisotropy?.()||1);textures[kind]=texture;
  })));
  return {textures,ready,snapshot:()=>({...states,primaryReleased:disposed,liveTextures:Object.values(textures).filter(texture=>texture.source?.data).length}),dispose(){if(disposed)return;disposed=true;Object.values(textures).forEach(disposeOwnedSportsTexture);}};
}

export function createSkateAuthoredWorld(world,tier,{islands,onReady}={}){
  const root=new THREE.Group();root.name=`${world}-OriginalSkateVillage`;
  root.userData={assetState:'loading',world,animationTime:0,failedAssets:[]};
  const venueInstances=new THREE.Group();root.add(venueInstances);
  let disposed=false,template=null,currentTier=tier,time=0,lastTreeYaw=null,treeMesh=null,venueBatches=null;
  const near=(islands||[]).filter(p=>p.radius===5.4).map((p,index)=>({...p,y:.8,height:10+index%2}));
  const far=Array.from({length:28},(_,index)=>{const angle=index*Math.PI*2/28;return{x:Math.sin(angle)*106,y:0,z:Math.cos(angle)*106,height:14+index%4*2};});
  const treeLocations=[...near,...far];
  const ownedImages=[];
  function loadImage(kind){return new Promise(resolve=>{
    const texture=new THREE.TextureLoader().load(SKATE_AUTHORED_WORLD_URLS[world][kind],()=>{
      if(disposed){disposeOwnedSportsTexture(texture);resolve(null);return;}texture.colorSpace=THREE.SRGBColorSpace;root.userData[`${kind}Delivery`]='delivered';resolve(texture);
    },undefined,error=>{root.userData[`${kind}Delivery`]='unavailable';root.userData.failedAssets.push(String(error));resolve(null);});
    ownedImages.push(texture);root.userData[`${kind}Delivery`]='pending';
  });}
  const sceneryReady=loadImage('scenery').then(texture=>{
    if(!texture)return false;
    const data=RALLY_PALS_WORLD_ART[world],[x,y,w,h]=data.frames.tree;
    texture.repeat.set((w-1)/data.width,(h-1)/data.height);texture.offset.set((x+.5)/data.width,(data.height-y-h+.5)/data.height);
    const geo=new THREE.PlaneGeometry(w/h,1);geo.translate(0,.5,0);
    treeMesh=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.16,side:THREE.DoubleSide,depthWrite:true,forceSinglePass:true}),treeLocations.length);
    treeMesh.name='RegisteredOriginalSkateTrees';root.add(treeMesh);update(0,{camera:{x:0,z:42}},true);return true;
  });
  const horizonReady=loadImage('horizon').then(texture=>{
    if(!texture)return false;
    const geo=new THREE.PlaneGeometry(213,86),mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.04,side:THREE.DoubleSide,depthWrite:false,fog:false,forceSinglePass:true});
    for(let index=0;index<8;index++){const angle=index*Math.PI/4,mesh=new THREE.Mesh(geo,mat);mesh.position.set(Math.sin(angle)*230,28,Math.cos(angle)*230);mesh.rotation.y=angle;root.add(mesh);}
    return true;
  });
  const locations=[
    ...[-72,-36,0,36,72].flatMap((x,index)=>[{name:index%2?'grandstand':'clubhouse',x,z:-94,heading:Math.PI,scale:1.6},{name:index%2?'clubhouse':'landmark',x,z:94,heading:0,scale:1.5}]),
    ...[-56,0,56].flatMap((z,index)=>[{name:index%2?'grandstand':'landmark',x:-94,z,heading:-Math.PI/2,scale:1.6},{name:index%2?'grandstand':'clubhouse',x:94,z,heading:Math.PI/2,scale:1.6}]),
    ...near.flatMap(p=>[-1,1].map(side=>({name:'flowerbed',x:p.x+side*2.4,z:p.z+2,heading:side*Math.PI/2,scale:.85})))
  ];
  const venueReady=new GLTFLoader().loadAsync(SKATE_AUTHORED_WORLD_URLS[world].venues).then(gltf=>{
    if(disposed){disposeOwnedSportsGltf(gltf.scene);return false;}template=gltf.scene;template.updateMatrixWorld(true);
    const recipes=[];
    for(const name of ['clubhouse','grandstand','flowerbed','landmark']){
      const source=template.getObjectByName(name),places=locations.filter(p=>p.name===name);if(!source||!places.length)continue;
      source.traverse(mesh=>{
        if(!mesh.isMesh)return;
        for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){material.envMapIntensity=.36;material.dithering=true;}
        places.forEach((p,index)=>recipes.push({geometry:mesh.geometry,material:mesh.material,location:p,ordinal:index,transform:new THREE.Matrix4().makeTranslation(p.x,0,p.z).multiply(new THREE.Matrix4().makeRotationY(p.heading)).multiply(new THREE.Matrix4().makeScale(p.scale,p.scale,p.scale)).multiply(mesh.matrixWorld)}));
      });
    }
    venueBatches=createSportsVenueBatches(recipes);venueInstances.add(venueBatches.root);venueBatches.setShadows(currentTier!=='low');
    root.userData.venueCount=locations.length;root.userData.venueBatches=venueBatches.snapshot();return true;
  }).catch(error=>{root.userData.failedAssets.push(String(error));return false;});
  function setQuality(next){if(disposed)return;currentTier=next;venueBatches?.setShadows(next!=='low');lastTreeYaw=null;}
  function update(dt,{camera,paused=false,reducedMotion=false}={},force=false){
    if(disposed)return;if(!paused)time+=Math.min(.05,Math.max(0,dt));root.userData.animationTime=time;
    if(!treeMesh||!camera)return;
    const yaw=Math.atan2(camera.x,camera.z);if(!force&&lastTreeYaw!==null&&Math.abs(yaw-lastTreeYaw)<.008)return;lastTreeYaw=yaw;
    const matrix=new THREE.Matrix4();let count=0;
    treeLocations.forEach((p,index)=>{
      if(index>=near.length&&currentTier==='low'&&index%2)return;
      const facing=Math.atan2(camera.x-p.x,camera.z-p.z);
      matrix.makeTranslation(p.x,p.y,p.z).multiply(new THREE.Matrix4().makeRotationY(facing)).multiply(new THREE.Matrix4().makeScale(p.height,p.height,p.height));
      treeMesh.setMatrixAt(count++,matrix);
    });
    treeMesh.count=count;treeMesh.instanceMatrix.needsUpdate=true;treeMesh.computeBoundingSphere();root.userData.authoredTrees=count;
    root.userData.reducedMotion=Boolean(reducedMotion);
  }
  const ready=Promise.all([sceneryReady,horizonReady,venueReady]).then(results=>{
    if(disposed)return false;root.userData.assetState=results.every(Boolean)?'ready':'partial';onReady?.(root,{trees:results[0],horizon:results[1],venues:results[2]});return true;
  });
  return{root,ready,setQuality,update,canvasScene:()=>({world,urls:{...SKATE_AUTHORED_WORLD_URLS[world]},art:structuredClone(RALLY_PALS_WORLD_ART[world]),trees:treeLocations.map(p=>({...p})),venues:locations.map(p=>({...p}))}),dispose(){
    if(disposed)return;
    disposed=true;root.removeFromParent();venueBatches?.dispose();venueInstances.clear();
    const model=template?disposeOwnedSportsGltf(template):null;
    const remaining=disposeOwnedSportsPrimaryGroup(root);
    ownedImages.forEach(disposeOwnedSportsTexture);ownedImages.length=0;
    template=null;treeMesh=null;venueBatches=null;
    root.userData.primaryReleased=true;root.userData.primaryRelease={model,remaining};
  }};
}
