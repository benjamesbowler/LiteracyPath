import { advanceClimbWorld, createClimbWorld } from "./wordClimbWorld.js";

export const CLIMB_TRAVEL_SPEED = 108;
export const CLIMB_STAGE_TRAVEL = 13_600;
export const CLIMB_STAGE_NAMES = ["Rootways", "Windward Canopy", "Lantern Ridge"];
const STEER_SPEED = 310;
export const CLIMB_ROUTE_HALF_WIDTH = 160;

// Authored route families use different bends, obstacle sides and wind. Neither
// the route nor its scenery reads which word is correct at the next station.
export function climbRouteCenter(journey,y,startX=null) {
  const section=Math.min(journey.summit-1,Math.max(0,Math.floor(y/journey.sectionHeight)));
  const local=y-section*journey.sectionHeight;
  if(local>=journey.travelPerSection)return 500;
  const t=local/journey.travelPerSection;
  const family=journey.stageIndex%3;
  let x=500+Math.sin(t*Math.PI*2*(1.25+family*.25)+section*.8+Math.floor(journey.stageIndex/3)*.6)*Math.sin(t*Math.PI)*(family===2?205:170);
  if(startX!==null&&local<240)x=startX+(x-startX)*(local/240);
  return x;
}
export function climbRouteRadius(journey,y){
 const section=Math.max(0,Math.floor(y/journey.sectionHeight)),local=y-section*journey.sectionHeight;
 return section>0&&local<240 ? 90+(CLIMB_ROUTE_HALF_WIDTH-90)*(local/240) : CLIMB_ROUTE_HALF_WIDTH;
}
export function climbJourneyWind(journey,y,time) {
  if(journey.stageIndex%3!==1)return 0;
  return Math.sin(y/650+time*.7)*26;
}
export function createClimbJourney(session,stageIndex=0,startStep=0,random=Math.random) {
  const world=createClimbWorld(session,startStep,random);
  const travelPerSection=CLIMB_STAGE_TRAVEL/session.summit;
  const journey={stageIndex,summit:session.summit,travelPerSection,sectionHeight:travelPerSection+210,
    phase:"climb",branchStartX:world.x,obstacles:[],lights:[],collected:[],activeSeconds:0,recovery:null};
  world.journey=journey;world.summitHeight=journey.sectionHeight*session.summit;
  for(const platform of world.platforms){platform.kind=platform.row?"word":"base";platform.y=platform.row*journey.sectionHeight;}
  for(let section=0;section<session.summit;section++){
    const start=section*journey.sectionHeight;
    for(let local=360,index=0;local<travelPerSection-120;local+=360,index++){
      const y=start+local;world.platforms.push({id:`rest-${section}-${index}`,row:section,kind:"rest",word:"",correct:true,x:climbRouteCenter(journey,y),y,width:120});
    }
    world.platforms.push({id:`base-${section}`,row:section,kind:"base",word:"",correct:true,x:500,y:start+travelPerSection,width:240});
    for(let local=500,index=0;local<travelPerSection-140;local+=480,index++){
      const y=start+local,side=(index+section+stageIndex)%2?1:-1,center=climbRouteCenter(journey,y);
      journey.obstacles.push({id:`branch-${section}-${index}`,section,y,x:center+side*76,width:122,side});
      journey.lights.push({id:`light-${section}-${index}`,section,y:y-240,x:climbRouteCenter(journey,y-240)+side*112});
    }
  }
  const safe=world.platforms.find(p=>p.id===world.safeId);
  world.x=safe.x;world.y=safe.y;world.camera=world.y-115;
  journey.safeRest={id:safe.id,x:safe.x,y:safe.y};
  return world;
}

function recover(world,reason) {
  const journey=world.journey;
  world.motorFalls++;world.vx=0;world.vy=0;world.state="recovering";
  journey.recovery={from:{x:world.x,y:world.y},to:{...journey.safeRest},time:0};
  world.event={type:"fall",reason};
}

export function advanceClimbJourney(world,seconds,input={}) {
  const journey=world.journey;
  if(!journey){advanceClimbWorld(world,seconds,Number(Boolean(input.right))-Number(Boolean(input.left)));return;}
  if(world.paused||world.completed){world.event=null;return;}
  if(journey.phase==="word"){
    const step=world.step;advanceClimbWorld(world,seconds,Number(Boolean(input.right))-Number(Boolean(input.left)));
    if(world.step>step&&!world.completed){
      journey.phase="climb";journey.branchStartX=world.x;
      journey.safeRest={id:world.safeId,x:world.x,y:world.y};
    }
    return;
  }
  world.event=null;
  const dt=Math.min(Math.max(seconds,0),.05),steer=Number(Boolean(input.right))-Number(Boolean(input.left));
  world.elapsed+=dt;
  if(journey.recovery){
    const recovery=journey.recovery;recovery.time+=dt;
    const t=Math.min(1,recovery.time/.65),ease=1-(1-t)**3;
    world.x=recovery.from.x+(recovery.to.x-recovery.from.x)*ease;
    world.y=recovery.from.y+(recovery.to.y-recovery.from.y)*ease+Math.sin(t*Math.PI)*35;
    if(t===1){journey.recovery=null;world.state="gripping";world.safeId=recovery.to.id;world.standingId=recovery.to.id;world.event={type:"recovered"};}
  }else if(world.state==="landed"&&world.landingTime>0){
    world.landingTime-=dt;if(world.landingTime<=0)world.state="grounded";
  }else if(input.up||steer){
    journey.activeSeconds+=dt;world.state="climbing";world.standingId=null;
    const base=world.platforms.find(p=>p.id===`base-${world.step}`);
    world.x+=(steer*STEER_SPEED+climbJourneyWind(journey,world.y,world.elapsed))*dt;
    world.y=Math.min(base.y,world.y+(input.up?CLIMB_TRAVEL_SPEED*dt:0));
    const center=climbRouteCenter(journey,world.y,journey.branchStartX);
    const obstruction=journey.obstacles.find(o=>o.section===world.step&&Math.abs(o.y-world.y)<27&&Math.abs(o.x-world.x)<o.width/2);
    if(Math.abs(world.x-center)>climbRouteRadius(journey,world.y))recover(world,"edge");
    else if(obstruction)recover(world,"branch");
    else{
      for(const hold of world.platforms){
        if(hold.kind==="rest"&&hold.row===world.step&&hold.y<=world.y&&world.y-hold.y<18&&Math.abs(world.x-hold.x)<=hold.width/2+25&&hold.y>journey.safeRest.y){journey.safeRest={id:hold.id,x:hold.x,y:hold.y};world.safeId=hold.id;}
      }
      for(const light of journey.lights){
        if(!journey.collected.includes(light.id)&&Math.abs(light.y-world.y)<38&&Math.abs(light.x-world.x)<62){journey.collected.push(light.id);world.event={type:"light",light};}
      }
      if(world.y>=base.y&&Math.abs(world.x-base.x)<=base.width/2){
        journey.phase="word";world.state="grounded";world.standingId=base.id;world.safeId=base.id;world.vx=0;world.vy=0;
        journey.safeRest={id:base.id,x:world.x,y:base.y};world.event={type:"station"};
      }
    }
  }else if(!["grounded","landed"].includes(world.state))world.state="gripping";
  world.camera+=(world.y-115-world.camera)*(1-Math.exp(-7*dt));
}
