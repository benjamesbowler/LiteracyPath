import * as THREE from 'three';
import { createRenderer,disposeRenderer } from '../shared/threeShell.js';
import { createQuestFrameBudgetState,sampleQuestFrameBudget } from '../../../../utils/questPerformance.js';
import { createRocketViewGeometry } from '../../../../utils/rocketRunViewGeometry.js';
import { createRocketCraftAssets } from './rocketRunCraftAssets.js';
import { createRocketRouteAssets } from './rocketRunRouteAssets.js';
import { createRocketRoutePresentation } from './rocketRunRoutePresentation.js';
import { registerRocketCraftAnatomy } from './rocketRunCraftAnatomy.js';
import { createRocketFlightAssets } from './rocketRunFlightAssets.js';
import { createRocketSkyAssets } from './rocketRunSkyAssets.js';

const identities={easy:{world:'meadow',character:'bouncy'},medium:{world:'dino',character:'chompy'},hard:{world:'moonwood',character:'pip'}};

/** Owned live world. Model loading and authored Canvas delivery are separate
 * facts; missing art cannot acquire a rendered flag. Physical lanes/camera,
 * source receiver anchors and measured word rectangles are shared with motor
 * play. No correctness or expected target enters this renderer. */
export function createRocketRunWorld(mount,{difficulty='easy',records,onDelivery=()=>{},onContextLoss=()=>{},onContextRestored=()=>{}},dependencies={}) {
  const {world,character}=identities[difficulty]||identities.easy,record=records?.[world];
  let disposed=false,width=1,height=1,view=createRocketViewGeometry(1,1),model=null,renderer=null,scene=null,mode='canvas',modelClip=null,sceneSnapshot={};
  let skyRequest=0,modelFailed=false,modelAnatomy=null,modelFailureReason=null,contextUnavailable=false,adaptedCanvas=false;
  let frameBudget=createQuestFrameBudgetState('rich'),quality='rich',lastFrameSignal=null,modelRequest=0;
  const modelAssets=(dependencies.createCraftAssets||createRocketCraftAssets)({records}),routeGroup=new THREE.Group();
  const canvas=document.createElement('canvas');canvas.className='rocket-flight-overlay';canvas.setAttribute('aria-hidden','true');mount.prepend(canvas);
  const ctx=canvas.getContext('2d');
  const reducedMotion=Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  let routeAssets=null;
  routeAssets=(dependencies.createRouteAssets||createRocketRouteAssets)(record?.route,{onDelivery:()=>report()});
  const route=(dependencies.createRoutePresentation||createRocketRoutePresentation)(routeAssets,routeGroup,{world});
  const skyAssets=(dependencies.createSkyAssets||createRocketSkyAssets)(record?.venue,{onDelivery:()=>report()});
  const art=(dependencies.createFlightAssets||createRocketFlightAssets)(record?.flight,{onDelivery:()=>report()});
  function delivery(){return {model:modelAssets.inspect(),sky:skyAssets.delivery(),actions:art.delivery(),
    skyResources:skyAssets.inspect(),actionResources:art.inspect(),route:routeAssets?.inspect()||{},mode,quality,modelFailureReason};}
  function report(){if(!disposed)onDelivery(delivery());}
  async function loadSky(){
    const request=++skyRequest;
    if(scene)scene.background=new THREE.Color('#09162f');
    await skyAssets.preload();
    if(disposed||request!==skyRequest)return;
    if(scene&&skyAssets.texture())scene.background=skyAssets.texture();
    report();
  }
  function initThree(){
    try{renderer=(dependencies.createRenderer||createRenderer)(THREE,{antialias:true,pixelRatioCap:1,toneMappingExposure:1.15});mode='three';
      renderer.domElement.className='rocket-flight-three';renderer.domElement.setAttribute('aria-hidden','true');mount.prepend(renderer.domElement);
      scene=new THREE.Scene();scene.background=skyAssets.texture()||new THREE.Color('#09162f');scene.fog=new THREE.Fog('#0c1a31',70,135);
      scene.add(new THREE.HemisphereLight('#d9f0ff','#3c416c',2.2));const key=new THREE.DirectionalLight('#fff0cf',2.8);key.position.set(3,8,6);scene.add(key);
      scene.add(routeGroup);
      renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
      void loadModel();
    }catch{releaseThree();mode='canvas';contextUnavailable=true;report();}
  }
  function releaseThree(){
    modelRequest++;model?.dispose();model=null;modelClip=null;modelAnatomy=null;
    route.releaseInstances();routeGroup.removeFromParent();
    if(renderer){const canvas=renderer.domElement;canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);
      disposeRenderer(renderer,{forceContextLoss:true});canvas.remove();}
    renderer=null;scene=null;
  }
  async function loadModel(){
    const request=++modelRequest;model?.dispose();model=null;modelClip=null;modelAnatomy=null;modelFailed=false;modelFailureReason=null;
    const lease=await modelAssets.load(world);
    if(disposed||request!==modelRequest||!renderer){lease?.dispose();return;}
    model=lease;modelFailed=!lease;
    if(model){
      try{modelAnatomy=registerRocketCraftAnatomy(model.root,record);scene.add(model.root);}
      catch(error){modelFailureReason=String(error.message||error);modelFailed=true;model.dispose();model=null;}
    }
    if(modelFailed){releaseThree();mode='canvas';}
    report();
  }
  function contextLost(event){if(disposed)return;event.preventDefault();mode='canvas';contextUnavailable=true;modelRequest++;model?.dispose();model=null;modelClip=null;modelAnatomy=null;onContextLoss();report();}
  function contextRestored(){if(disposed||adaptedCanvas)return;mode='three';contextUnavailable=false;quality=reducedMotion?'low':'rich';frameBudget=createQuestFrameBudgetState(quality);void loadModel();onContextRestored();report();}
  function updateModel(state,pose){
    if(!model)return false;
    if(!model.sample(pose.clip,pose.phase))return false;modelClip=pose.clip;
    model.root.position.set(0,0,0);model.root.updateMatrixWorld(true);
    const socket=model.socket(record.capture.socket);
    if(!socket)return false;
    // Clip bank changes its evaluated receiver position. Compensate the root,
    // never the collision volume: exactly this visible ring selects words.
    model.root.position.set(state.flight.x-socket.x,.54-socket.y,-1.8-socket.z);model.root.updateMatrixWorld(true);
    return true;
  }
  function drawCanvasCraft(state,pose){
    const receiver=view.project(state.flight.x,.54,-1.8),right=view.camera.matrixWorld.elements;
    const unit=view.project(state.flight.x+right[0],.54+right[1],-1.8+right[2]);
    const scale=Math.hypot(unit.x-receiver.x,unit.y-receiver.y);
    const placement={x:receiver.x,y:receiver.y,unitScale:scale};
    return {...art.draw(ctx,pose,placement),receiver};
  }
  function drawLabel(row,selected,highlighted){
    const r=row.rect;ctx.save();ctx.lineWidth=selected?4:2;ctx.fillStyle=selected?'#dceaff':'#fff6df';ctx.strokeStyle=highlighted?'#416edf':selected?'#2c61cf':'#a97c43';
    ctx.beginPath();ctx.roundRect(r.x,r.y,r.width,r.height,8);ctx.fill();ctx.stroke();ctx.font='900 16px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#172b4d';ctx.fillText(row.word,(r.x+r.right)/2,(r.y+r.bottom)/2);ctx.restore();
  }
  function outline(points){if(!points.length)return;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();}
  function draw(state,pose,seconds,{highlight=null,meteors=[]}={}){
    if(disposed)return;const ratio=Math.min(1.5,window.devicePixelRatio||1);
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
    const faces=view.faces(state.carriers,word=>{ctx.font='900 16px Nunito,system-ui,sans-serif';return ctx.measureText(word).width;});
    let actor=false,completeActor=false,actorTier='unavailable',paintedRoute=null;
    route.update(state,view,meteors,{createMeshes:mode==='three'&&Boolean(renderer)});
    if(mode==='three'&&renderer){
      actor=updateModel(state,pose);completeActor=actor;actorTier=actor?'original-skinned-model':'unavailable';
      try{renderer.render(scene,view.camera);if(actor)model.markRendered();}
      catch{releaseThree();mode='canvas';contextUnavailable=true;actor=false;completeActor=false;actorTier='unavailable';report();}
      if(actor&&seconds>0){const result=sampleQuestFrameBudget(frameBudget,seconds*1000);if(result){frameBudget=result.state;lastFrameSignal=result.signal;if(result.signal?.type==='quality-change'){quality=result.signal.toTier;if(quality==='2d'){adaptedCanvas=true;releaseThree();mode='canvas';}else renderer.setPixelRatio(quality==='low'?.7:quality==='balanced'?.85:1);report();}}}
    }
    if(mode==='canvas'){
      ctx.fillStyle='#09162f';ctx.fillRect(0,0,width,height);
      const sky=skyAssets.image();
      if(sky){const scale=Math.max(width/sky.naturalWidth,height/sky.naturalHeight);ctx.drawImage(sky,(width-sky.naturalWidth*scale)/2,(height-sky.naturalHeight*scale)/2,sky.naturalWidth*scale,sky.naturalHeight*scale);}
      const actorDepth=view.project(state.flight.x,.54,-1.8).depth;
      const far=route.draw(ctx,view,{minDepth:actorDepth,maxDepth:1});
      const craft=drawCanvasCraft(state,pose);actor=craft.delivered;completeActor=craft.complete;actorTier=craft.tier;
      const near=route.draw(ctx,view,{minDepth:-1,maxDepth:actorDepth});
      paintedRoute={delivered:far.delivered+near.delivered,requested:far.requested+near.requested};
    }
    else if(!actor&&modelFailed){const craft=drawCanvasCraft(state,pose);actor=craft.delivered;completeActor=craft.complete;actorTier=craft.tier;}
    const meteorShapes=[];
    for(const meteor of meteors){const shape=view.volume(meteor.x,.54,meteor.z,meteor),p=shape.centre;if(p.depth<-1||p.depth>1)continue;meteorShapes.push({id:meteor.id,...shape});}
    const receiver=view.receiver(state.flight.x,.54,-1.8);ctx.strokeStyle=state.flight.immunity>0?'#dff6ff':'#8fd6f5';ctx.lineWidth=state.flight.immunity>0?5:2;
    outline(receiver.points);ctx.stroke();
    for(const row of faces)if(row.readable)drawLabel(row,state.intent?.flightId===row.flightId,highlight===row.flightId);
    const routeDelivered=Boolean(routeAssets.inspect().selected);
    sceneSnapshot={world,character,mode,quality,layout:view.layout,faces,playable:completeActor&&Boolean(skyAssets.image())&&routeDelivered,
      actorTier,completeActor,delivered:actor&&Boolean(skyAssets.image())&&routeDelivered,modelClip,
      receiver:{world:{x:state.flight.x,y:.54,z:-1.8},screen:receiver.centre,outline:receiver.points,bounds:receiver.bounds,radius:.34,depthRadius:.24},meteorShapes,
      actualReceiver:model?.socket(record.capture.socket)?.toArray()||null,contacts:model?.contacts?.()||[],
      actualAnatomy:modelAnatomy?.sample(pose.clip,pose.phase)||null,route:route.inspect(),paintedRoute,
      model:model?.inspect()||null,delivery:delivery(),contextUnavailable,adaptedCanvas,
      render:renderer&&mode==='three'?{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures}:null,lastFrameSignal};
  }
  function resize(w,h){width=Math.max(1,w||1);height=Math.max(1,h||1);view=createRocketViewGeometry(width,height);const ratio=Math.min(1.5,window.devicePixelRatio||1);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.style.width=width+'px';canvas.style.height=height+'px';renderer?.setSize(width,height,false);}
  if(reducedMotion){quality='low';frameBudget=createQuestFrameBudgetState('low');}
  void art.preload();void loadSky();void routeAssets.preload();initThree();
  return {draw,resize,reducedMotion,laneX:lane=>view.laneX(lane),
    present(carrier,carriers){ctx.font='900 16px Nunito,system-ui,sans-serif';return view.faces(carriers,word=>ctx.measureText(word).width).find(row=>row.flightId===carrier.flightId)||{visible:false,readable:false};},
    inspect:()=>structuredClone(sceneSnapshot),
    retry(){void art.preload();void loadSky();void routeAssets.preload();if(renderer&&mode!=='canvas')void loadModel();else if((contextUnavailable||modelFailed)&&!adaptedCanvas){releaseThree();contextUnavailable=false;initThree();resize(width,height);}report();},
    dispose(){if(disposed)return;disposed=true;skyRequest++;art.dispose();releaseThree();route.dispose();routeAssets.dispose();modelAssets.dispose();skyAssets.dispose();canvas.remove();},
  };
}
