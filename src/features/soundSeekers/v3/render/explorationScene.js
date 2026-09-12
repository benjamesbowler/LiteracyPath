import { visibleAdventureNodes,adventureNavigation } from '../engine/adventureNavigation.js';
import { LEARNING_SPRITES,PUZZLE_SPRITES } from './puzzleSprites.js';
import { createExplorationLayout,createExplorer,advanceExplorer,setExplorerInput,releaseExplorer,findExplorationPath,explorerSnapshot } from '../engine/exploration.js';
import { CAST } from '../content/cast.js';
import { getCampaignHeroAssets } from './campaignHeroes.js';
import { WORLD_MATERIALS } from './illustratedWorldArt.js';
import { createExplorationLandscape } from './explorationLandscape.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/** One collision and mission controller serves direct movement and motor assist.
 * The renderer is a third-person landscape; it cannot resolve literacy actions. */
export function createExplorationScene({canvas,stage,missions=[],heroId,progress,isAvailable=()=>true,onMission,onTravel,nextStage,onSavePosition,onSound,onHint,onFailure,reducedMotion=false,simplifiedBackgrounds=false,position}){
  const layout=createExplorationLayout(stage),player=createExplorer(layout,position);
  const nodes=layout.nodes.map(n=>({...n,mission:missions.find(m=>m.id===n.id)}));
  let time=0,gait=0,disposed=false,destination=null,activity=false,lastSave=0,message='',messageTime=0,lastHint='',drag=null;
  let yaw=Number.isFinite(position?.cameraYaw)?position.cameraYaw:-Math.PI/2,distance=15;
  const look={left:false,right:false,axis:0};
  const completed=()=>progress?.campaign?.completedMissions||{};
  const currentNodes=()=>visibleAdventureNodes(nodes,completed(),isAvailable);
  let landscape=null,initializationError=null;
  if(canvas)try{landscape=createExplorationLandscape({canvas,layout,stage,heroId,nodes,completed,isAvailable,reducedMotion,simplifiedBackgrounds,onFailure});}catch(error){initializationError=error;}
  const objects=()=>[
    ...currentNodes().map(n=>({...n,role:'friend',label:n.mission.title})),
    ...(!player.shortcut?[{...layout.switch,role:'switch',label:'Lower the bridge'}]:[]),
    {...layout.secret,id:player.discovered?'camp-shortcut':'hidden-nook',role:player.discovered?'shortcut':'secret',label:player.discovered?'Take the shortcut to camp':'Explore the hidden nook'},
    ...(completed()[stage.finaleMissionId]&&nextStage?[{...layout.portal,role:'portal',label:`Explore ${nextStage.name}`}]:[])
  ];
  const snapshot=()=>({...explorerSnapshot(player),cameraYaw:yaw});
  function release(){releaseExplorer(player);destination=null;look.left=false;look.right=false;look.axis=0;drag=null;}
  function tell(line){message=line;messageTime=3.5;}
  function trigger(o){
    if(!o||disposed)return;activity=true;release();player.actionTime=.65;player.actionState=o.role==='secret'?'celebrate':'use';
    if(o.role==='friend'){onSavePosition?.(snapshot());onMission?.(o.mission);}
    else if(o.role==='switch'){player.shortcut=true;tell('The bridge is down. A new way across!');onSound?.('place');}
    else if(o.role==='secret'){player.discovered=true;tell('A hidden picnic nook! You found a shortcut home.');onSound?.('complete');}
    else if(o.role==='shortcut'){player.x=layout.camp.x;player.y=layout.camp.y;tell('Back at camp.');}
    else if(o.role==='portal')onTravel?.(nextStage.id);
    onSavePosition?.(snapshot());
  }
  function approach(o){if(!o)return;activity=true;destination=o;player.path=findExplorationPath(layout,player,o,player);if(!player.path.length)destination=null;}
  function nearest(){return objects().filter(o=>Math.hypot(o.x-player.x,o.y-player.y)<145).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];}
  function update(dt){
    if(disposed)return;time+=dt;player.actionTime=Math.max(0,(player.actionTime||0)-dt);messageTime=Math.max(0,messageTime-dt);yaw+=((look.right?1:0)-(look.left?1:0)+look.axis)*dt*1.6;
    player.heading=landscape?yaw:0;advanceExplorer(player,layout,dt);gait+=dt*Math.hypot(player.vx,player.vy)/330;
    if(destination&&Math.hypot(destination.x-player.x,destination.y-player.y)<65){const o=destination;trigger(o);}
    const hint=messageTime?message:'';
    if(hint!==lastHint){lastHint=hint;onHint?.(hint);}
    if(time-lastSave>1.5){lastSave=time;onSavePosition?.(snapshot());}
  }
  function input(k,v){const jumping=player.jumpTime>0;setExplorerInput(player,k,v);if(!jumping&&player.jumpTime>0)onSound?.('jump');}
  function click(x,y){
    if(!landscape)return;const candidates=objects().map(o=>({o,p:landscape.project(o.x,o.y)})).filter(({p})=>p.visible&&Math.hypot(p.x-x,p.y-y)<85).sort((a,b)=>Math.hypot(a.p.x-x,a.p.y-y)-Math.hypot(b.p.x-x,b.p.y-y));
    if(candidates[0])approach(candidates[0].o);else{const point=landscape.groundPoint(x,y);if(point){destination=null;player.path=findExplorationPath(layout,player,point,player);activity=true;}}
  }
  const pointerMove=event=>{if(!drag)return;const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;if(Math.hypot(x-drag.startX,y-drag.startY)>8)drag.moved=true;if(drag.moved)yaw-=(x-drag.x)*.006;drag.x=x;drag.y=y;};
  const pointerUp=()=>{if(!drag)return;const d=drag;drag=null;if(!d.moved)click(d.x,d.y);};
  const pointerCancel=()=>{drag=null;};
  const recenter=()=>{if(Math.hypot(player.vx,player.vy)>25)yaw=Math.atan2(-player.vx,-player.vy);else yaw=-Math.PI/2;distance=15;};
  const wheel=event=>{event.preventDefault();distance=clamp(distance+event.deltaY*.01,8,24);};
  canvas?.addEventListener('pointermove',pointerMove);canvas?.addEventListener('pointerup',pointerUp);canvas?.addEventListener('pointercancel',pointerCancel);canvas?.addEventListener('lostpointercapture',pointerCancel);canvas?.addEventListener('wheel',wheel,{passive:false});
  return {update,release,ready:initializationError?Promise.reject(initializationError):landscape?.ready||Promise.resolve(),
    draw(_ctx,width,height){return landscape?.render({width,height,player,yaw,distance,time,gait,nearby:nearest(),message:messageTime?message:''});},
    assets:()=>[LEARNING_SPRITES,PUZZLE_SPRITES,WORLD_MATERIALS,...getCampaignHeroAssets(heroId),CAST[heroId]?.heroSprite,CAST[heroId]?.sprite,...nodes.flatMap(n=>{const id=n.mission.residentId===heroId?n.mission.residentAlternateId:n.mission.residentId;return [CAST[id]?.sprite,...getCampaignHeroAssets(id)];})].filter(Boolean),
    setInput(k,v){activity=true;if(k==='lookX'){look.axis=v;return;}if(k==='lookLeft'||k==='lookRight'){look[k==='lookLeft'?'left':'right']=v;return;}destination=null;input(k,v);},
    key(code,down){const k={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',ShiftLeft:'sprint',ShiftRight:'sprint'}[code];if(k){activity=true;destination=null;input(k,down);return true;}if(code==='KeyR'&&down){recenter();return true;}if(['KeyQ','KeyC'].includes(code)){look[code==='KeyQ'?'left':'right']=down;return true;}if(down&&['Enter','KeyE'].includes(code)){trigger(nearest());return true;}return false;},
    pointerDown(x,y){drag={startX:x,startY:y,x,y,moved:false};},activate(id){approach(objects().find(o=>o.id===id));},confirm(){trigger(nearest());},
    getNavigation:()=>adventureNavigation(currentNodes(),stage,player,yaw),getInteraction:()=>{const n=nearest();return n?{id:n.id,label:n.role==='friend'?`Enter ${n.label}`:n.label,role:n.role}:null;},
    getObjects:()=>objects().map(({id,label,role})=>({id,label,role})),setProgress(p){progress=p;},setState(){},applyOutcome(){},snapshot,
    consumeActivity(){const active=activity||Math.hypot(player.vx,player.vy)>10;activity=false;return active;},
    debug:()=>({hub:true,mode:'third-person',player:snapshot(),camera:{yaw,distance},objects:objects().map(({id,x,y,label})=>({id,x,y,label})),layout}),
    dispose(){onSavePosition?.(snapshot());disposed=true;release();landscape?.dispose();canvas?.removeEventListener('pointermove',pointerMove);canvas?.removeEventListener('pointerup',pointerUp);canvas?.removeEventListener('pointercancel',pointerCancel);canvas?.removeEventListener('lostpointercapture',pointerCancel);canvas?.removeEventListener('wheel',wheel);}
  };
}
