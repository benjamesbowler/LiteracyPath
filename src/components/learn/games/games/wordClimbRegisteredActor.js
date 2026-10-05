import {createRegisteredPalArtBank,registeredPalFrameGeometry} from '../shared/registeredPalArt.js';

export function wordClimbRegisteredAction(world,lastGrip='climb-a',celebrationTime=world.elapsed){
  if(world.completed)return Math.floor(celebrationTime/.4)%2?'summit-b':'summit-a';
  if(['clinging','recovering'].includes(world.state))return 'recover-grip';
  if(world.state==='climbing')return Math.floor(world.elapsed/.34)%2?'climb-b':'climb-a';
  if(world.state==='gripping')return lastGrip;
  if(world.state==='airborne')return world.vy>=0?'jump-rise':'jump-fall';
  if(world.state==='landed')return 'land';
  return 'rest';
}

/** Game-owned decoded atlases with one mesh, geometry and material. The source keeps
 * genuinely measured hands/soles; a missing frame contact has no socket. */
export function createWordClimbRegisteredActor(THREE,atlas,{onDelivery=()=>{},movementAtlas=null,representation='registered-original-climbing-art'}={}){
  const root=new THREE.Group();root.name='registered-climbing-pal';root.visible=false;
  const geometry=new THREE.PlaneGeometry(1,1);
  const material=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.04,depthWrite:true,side:THREE.DoubleSide});
  const body=new THREE.Mesh(geometry,material);body.name='original-registered-climbing-body';root.add(body);
  const collection={climber:atlas,...(movementAtlas?{movement:movementAtlas}:{})};
  const bank=createRegisteredPalArtBank(collection),textures=new Map();
  const sockets=new Map();let disposed=false,frame=null,registration=null,lastGrip='climb-a',activeAtlas=null;
  const delivery=()=>{const values=Object.values(bank.delivery());return values.every(value=>value==='delivered')?'delivered':values.includes('unavailable')?'unavailable':'pending';};
  for(const name of new Set(Object.values(collection).flatMap(value=>value.frames.flatMap(item=>Object.keys(item.sockets||{}))))){
    const node=new THREE.Object3D();node.name=`measured-${name}`;root.add(node);sockets.set(name,node);
  }
  const ready=bank.preload().then(images=>{
    if(disposed)return false;
    Object.values(collection).forEach((value,index)=>{const image=images[index];if(image){const texture=new THREE.Texture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;textures.set(value,texture);}});
    onDelivery(delivery());return delivery()==='delivered';
  });
  function select(next,nextAtlas){
    if(frame===next&&activeAtlas===nextAtlas)return;
    frame=next;activeAtlas=nextAtlas;registration=registeredPalFrameGeometry(activeAtlas,frame);
    const firstMap=!material.map;material.map=textures.get(activeAtlas);if(firstMap)material.needsUpdate=true;
    body.scale.set(registration.scale[0],registration.scale[1],1);
    body.position.set((.5-registration.center[0])*registration.scale[0],(.5-registration.center[1])*registration.scale[1],0);
    const[l,t,r,b]=frame.cell,uv=geometry.attributes.uv;
    uv.setXY(0,l/activeAtlas.width,1-t/activeAtlas.height);uv.setXY(1,r/activeAtlas.width,1-t/activeAtlas.height);
    uv.setXY(2,l/activeAtlas.width,1-b/activeAtlas.height);uv.setXY(3,r/activeAtlas.width,1-b/activeAtlas.height);uv.needsUpdate=true;
    for(const[name,node]of sockets){
      const point=registration.sockets[name];node.visible=Boolean(point);if(point)node.position.set(point[0],point[1],0);
    }
  }
  return{
    root,ready,
    get action(){return frame?.action||null;},
    delivery,
    update(world,{lean=0,celebrationTime=world.elapsed}={}){
      if(disposed||delivery()!=='delivered')return false;
      const action=wordClimbRegisteredAction(world,lastGrip,celebrationTime);
      if(action==='climb-a'||action==='climb-b')lastGrip=action;
      const actionAtlas=movementAtlas?.frames.some(item=>item.action===action)?movementAtlas:atlas;
      const next=actionAtlas.frames.find(item=>item.action===action)||actionAtlas.frames.find(item=>item.action==='rest');
      if(!next)return false;select(next,actionAtlas);root.rotation.z=lean;root.visible=true;return true;
    },
    contactWorld(name,target){
      const node=sockets.get(name);if(!root.visible||!registration?.sockets[name]||!node)return null;
      root.updateWorldMatrix(true,true);return node.getWorldPosition(target);
    },
    inspect(){return{delivery:delivery(),assets:{...bank.delivery()},frame:frame?.id||null,action:frame?.action||null,
      contacts:registration?structuredClone(registration.sockets):{},representation:textures.size?representation:'unavailable',
      productionScope:representation==='canonical-retained-pal-recovery'?'retained shared canonical Pal actions for failed owned art; native failure/contact proof required'
        :movementAtlas?'original climbing/word-jump/summit actions; native full-loop acceptance pending':'four-pose contact pilot; full action/world proof pending'};},
    dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.clear();geometry.dispose();material.dispose();for(const texture of textures.values())texture.dispose();textures.clear();bank.dispose();},
  };
}
