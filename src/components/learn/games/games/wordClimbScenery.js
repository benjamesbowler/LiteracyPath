import { createRegisteredPalArtBank } from '../shared/registeredPalArt.js';
import { WORD_CLIMB_SCENERY } from './wordClimbScenery.generated.js';

// The same language-blind depth recipe feeds the Three and Canvas worlds.
// Coordinates are actual climb/world units; no decoration depends on the
// selected or expected reading choice.
export function wordClimbSceneryLayout({ viewWidth, viewHeight, ascent }) {
  const route=[];
  route.push({ role:0,x:-viewWidth*.27,y:-100,z:-490,width:viewWidth*1.04,mirror:false,cameraFactor:.78 });
  route.push({ role:0,x:viewWidth*.39,y:-85,z:-545,width:viewWidth*.91,mirror:true,cameraFactor:.78 });
  for(let y=120,index=0;y<ascent+350;y+=340,index++){
    const side=index%2?1:-1;
    route.push({ role:1,x:side*viewWidth*.40,y,z:-205,width:viewWidth*.48,mirror:side<0 });
  }
  route.push({role:2,x:-viewWidth*.28,y:ascent-160,z:-410,width:viewWidth*.89,mirror:false});
  route.push({role:2,x:viewWidth*.42,y:ascent-125,z:-475,width:viewWidth*.74,mirror:true});
  const frame=[-1,1].map(side=>({role:3,x:side*viewWidth*.57,y:Math.max(4,viewHeight*.03),z:145,width:viewWidth*.29,mirror:side<0}));
  return {route,frame};
}

export function wordClimbSceneryAtCamera(placements,camera) {
  return placements.map(placement=>({...placement,y:placement.y+(placement.cameraFactor||0)*camera}));
}

export function createWordClimbScenery(THREE,world,{onDelivery}={}) {
  const atlas=WORD_CLIMB_SCENERY[world];
  const bank=createRegisteredPalArtBank({scenery:atlas});
  const root=new THREE.Group(),route=new THREE.Group(),frame=new THREE.Group();
  root.name=`${world}-authored-root-canopy-summit`;root.add(route,frame);root.visible=false;
  const material=new THREE.MeshBasicMaterial({alphaTest:.04,transparent:false,depthWrite:true,side:THREE.DoubleSide,toneMapped:false,fog:false});
  const geometries=atlas.frames.map(({rect})=>{
    const[x,y,w,h]=rect,geometry=new THREE.PlaneGeometry(1,1),uv=geometry.attributes.uv;
    for(let index=0;index<uv.count;index++)uv.setXY(index,(x+uv.getX(index)*w)/atlas.width,1-(y+(1-uv.getY(index))*h)/atlas.height);
    uv.needsUpdate=true;return geometry;
  });
  let texture=null,disposed=false,delivery='pending',layout=null,cameraPosition=0;
  const meshes=[];
  const ready=bank.preload().then(([image])=>{
    if(disposed)return false;
    delivery=image?'delivered':'unavailable';
    if(image){texture=new THREE.Texture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;material.map=texture;material.needsUpdate=true;root.visible=true;}
    onDelivery?.(delivery);return Boolean(image);
  });
  function setMeshes(group,entries){
    while(group.children.length>entries.length)group.children.at(-1).removeFromParent();
    entries.forEach((placement,index)=>{
      let mesh=group.children[index];
      if(!mesh){mesh=new THREE.Mesh(geometries[placement.role],material);mesh.name=`original-${atlas.frames[placement.role].id}`;group.add(mesh);meshes.push(mesh);}
      const rect=atlas.frames[placement.role].rect,height=placement.width*rect[3]/rect[2];
      mesh.geometry=geometries[placement.role];mesh.scale.set(placement.mirror?-placement.width:placement.width,height,1);
      mesh.position.set(placement.x,placement.y+height/2+(placement.cameraFactor||0)*cameraPosition,placement.z);
      mesh.userData.sceneryBaseY=placement.y+height/2;
      mesh.userData.sceneryCameraFactor=placement.cameraFactor||0;
    });
  }
  return {root,ready,resize(metrics){if(disposed)return;layout=wordClimbSceneryLayout(metrics);setMeshes(route,layout.route);setMeshes(frame,layout.frame);},
    update(camera){if(disposed)return;cameraPosition=camera;frame.position.y=camera;route.children.forEach(mesh=>{
      mesh.position.y=mesh.userData.sceneryBaseY+mesh.userData.sceneryCameraFactor*camera;
    });},delivery:()=>delivery,
    inspect:()=>structuredClone({world,delivery,layout,textureCount:texture?1:0,meshCount:route.children.length+frame.children.length}),
    dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.clear();route.clear();frame.clear();meshes.length=0;texture?.dispose();material.dispose();geometries.forEach(geometry=>geometry.dispose());bank.dispose();}
  };
}

export function drawWordClimbScenery(ctx,image,atlas,placements,project){
  if(!image)return false;
  for(const placement of placements){
    const[x,y,w,h]=atlas.frames[placement.role].rect,height=placement.width*h/w,point=project(placement.x,placement.y+height);
    const width=placement.width*project.scale,drawHeight=height*project.scale;
    if(point.y>ctx.canvas.height||point.y+drawHeight<0)continue;
    ctx.save();ctx.translate(point.x,point.y);if(placement.mirror)ctx.scale(-1,1);
    ctx.drawImage(image,x,y,w,h,-width/2,0,width,drawHeight);ctx.restore();
  }
  return true;
}
