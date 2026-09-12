// Motor-only routes following a completed learning area. These mechanisms do
// not resolve answers, mark a beat done, or emit formative evidence.
export function addCampaignTraversal(room, variant) {
  const x=room.originX+room.width,y=room.exit.y,id=`${room.id}/traverse`,width=920;
  const floor=(name,px,pw)=>({id:`${id}/${name}`,x:px,y,width:pw,height:340});
  const shelf=(name,px,py,pw)=>({id:`${id}/${name}`,x:px,y:py,width:pw,height:28});
  const mechanism=['drawbridge','stepping-stones','hoist'][Math.abs(Math.floor(variant)||0)%3];
  const route={id,kind:mechanism,x,y,width,switch:{id:`${id}/lever`,x:x+100,y,label:mechanism==='hoist'?'Raise the stepping platforms':'Lower the crossing',role:'mechanism'},opened:false,progress:0};
  room.solids.push(floor('near-bank',x,210),floor('far-bank',x+700,220));
  if(mechanism==='stepping-stones'){
    room.platforms.push(shelf('low',x+185,y-75,180),shelf('high',x+335,y-165,210),shelf('down',x+525,y-75,190));
    route.opened=true;route.progress=1;
  }else route.platforms=mechanism==='drawbridge'?[shelf('span',x+200,y,510)]:[shelf('step-a',x+185,y-80,190),shelf('step-b',x+350,y-165,210),shelf('step-c',x+530,y-80,185)];
  room.traversal=route;room.width+=width;room.exit={x:x+width-95,y};
  // Fall recovery starts beside the mechanism after the learning task is done.
  route.checkpoint={id:`${id}/checkpoint`,x:x+50,y:y-100,width:90,height:110,spawn:{x:x+100,y}};
  return room;
}
/** The lever changes real collision geometry over time. It never receives an
 * answer, awards progress or changes the educational difficulty. */
export function openCampaignTraversal(route, player, { immediate = false } = {}) {
  if(!route || route.opened)return;
  route.opened=true;route.progress=immediate?1:0;
  for(const target of route.platforms||[]){
    const surface={...target,height:0};
    if(route.kind==='drawbridge')surface.width=Math.max(1,target.width*route.progress);
    else surface.y=target.y+(1-route.progress)*160;
    player.platforms.push(surface);
  }
}
export function advanceCampaignTraversal(route,player,seconds,{reducedMotion=false}={}) {
  if(!route?.opened || route.progress>=1)return;
  const previous=route.progress;
  route.progress=reducedMotion?1:Math.min(1,route.progress+Math.max(0,Math.min(seconds,.25))/.85);
  for(const target of route.platforms||[]){
    const surface=player.platforms.find(p=>p.id===target.id);if(!surface)continue;
    const beforeY=surface.y;
    if(route.kind==='drawbridge')surface.width=Math.max(1,target.width*route.progress);
    else surface.y=target.y+(1-route.progress)*160;
    // A rider standing on a hoist moves with the same collision surface.
    if(player.grounded&&Math.abs(player.y-beforeY)<2&&player.x>surface.x-player.tuning.width/2&&player.x<surface.x+surface.width+player.tuning.width/2)player.y+=surface.y-beforeY;
  }
  return route.progress>previous;
}
export function traversalWaypoints(route) {
  if(!route)return [];
  if(route.kind==='drawbridge')return [{x:route.x+420,y:route.y},{x:route.x+775,y:route.y}];
  return [{x:route.x+265,y:route.y-75},{x:route.x+445,y:route.y-165},{x:route.x+610,y:route.y-75},{x:route.x+790,y:route.y}];
}
