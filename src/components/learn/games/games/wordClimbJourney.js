import { advanceClimbWorld, createClimbWorld } from "./wordClimbWorld.js";
import { PACED_CLIMB_LAYOUT, CLIMB_LAYOUT_REVISIONS, pacedClimbRecipe, pacedClimbCenter, pacedClimbRadius, pacedClimbSection, isPacedClimb, climbLayoutRevision } from "./wordClimbPacedRoute.js";

export const CLIMB_TRAVEL_SPEED = 108;
export const CLIMB_APPROACH_HEIGHT = 300;
export const CLIMB_STAGE_NAMES = ["Rootways", "Windward Canopy", "Lantern Ridge"];
// A short thumb press should adjust a grip, not cross the whole trunk.
const STEER_SPEED = 180;
export const CLIMB_ROUTE_HALF_WIDTH = 160;

// Authored route families use different bends, obstacle sides and wind. Neither
// the route nor its scenery reads which word is correct at the next station.
export function climbRouteCenter(journey,y,startX=null) {
  if(isPacedClimb(journey))return pacedClimbCenter(journey,y,startX);
  const section=Math.min(journey.summit-1,Math.max(0,Math.floor(y/journey.sectionHeight)));
  const local=y-section*journey.sectionHeight;
  if(local>=journey.travelPerSection)return 500;
  const t=local/journey.travelPerSection;
  const family=journey.stageIndex%3;
  const oldLong=climbLayoutRevision(journey)==="long-v1";
  let x=500+Math.sin(t*Math.PI*(oldLong?2*(1.25+family*.25):(.65+family*.15))+section*.8+Math.floor(journey.stageIndex/3)*.6)*Math.sin(t*Math.PI)*(oldLong?(family===2?205:170):(family===2?100:80));
  if(startX!==null&&local<240)x=startX+(x-startX)*(local/240);
  return x;
}
export function climbRouteRadius(journey,y){
 if(isPacedClimb(journey))return pacedClimbRadius(journey,y);
 const section=Math.max(0,Math.floor(y/journey.sectionHeight)),local=y-section*journey.sectionHeight;
 return section>0&&local<240 ? 90+(CLIMB_ROUTE_HALF_WIDTH-90)*(local/240) : CLIMB_ROUTE_HALF_WIDTH;
}
export function climbJourneyWind(journey,y,time) {
  if(journey.stageIndex%3!==1)return 0;
  return Math.sin(y/650+time*.7)*26;
}
export function createClimbJourney(session,stageIndex=0,startStep=0,random=Math.random,{layoutRevision=PACED_CLIMB_LAYOUT}={}) {
  if(!CLIMB_LAYOUT_REVISIONS.includes(layoutRevision))throw new Error("Unknown Word Climb physical layout");
  const world=createClimbWorld(session,startStep,random);
  const paced=layoutRevision===PACED_CLIMB_LAYOUT,oldLong=layoutRevision==="long-v1";
  const recipe=pacedClimbRecipe(session.difficulty);
  const travelPerSection=paced?recipe.height:oldLong?13600/session.summit:CLIMB_APPROACH_HEIGHT+(stageIndex%3)*30;
  const journey={layoutRevision,stageIndex,summit:session.summit,travelPerSection,sectionHeight:travelPerSection+210,
    phase:"climb",branchStartX:world.x,obstacles:[],lights:[],collected:[],activeSeconds:0,recovery:null};
  if(paced){journey.crossingSpan=recipe.span;journey.routeChoices=Array(session.summit).fill(0);journey.crossing=null;}
  world.journey=journey;world.summitHeight=journey.sectionHeight*session.summit;
  for(const platform of world.platforms){platform.kind=platform.row?"word":"base";platform.y=platform.row*journey.sectionHeight;}
  for(let section=0;section<session.summit;section++){
    const start=section*journey.sectionHeight;
    if(paced){
      const route=pacedClimbSection(journey,section);
      const addRest=(id,x,y,width=140)=>world.platforms.push({id,row:section,kind:"rest",word:"",correct:true,x,y,width});
      for(const side of [-1,1]){
        addRest(`cross-out-${section}-${side}`,500+side*recipe.span/2,route.first,recipe.span+100);
        addRest(`cross-back-${section}-${side}`,500+side*recipe.span/2,route.second,recipe.span+100);
        for(let y=route.first+220,index=0;y<route.second-130;y+=300,index++)addRest(`side-rest-${section}-${side}-${index}`,pacedClimbCenter(journey,y,null,side),y,125);
      }
      for(const [from,to,name]of [[start+220,route.first-130,"root"],[route.second+220,route.top-130,"crown"]]){
        for(let y=from,index=0;y<to;y+=300,index++)addRest(`${name}-rest-${section}-${index}`,500,y);
      }
      const zones=[{y:Math.max(start+280,route.first-200),routeSide:0},{y:(route.first+route.second)/2,routeSide:-1},{y:(route.first+route.second)/2,routeSide:1},{y:route.top-180,routeSide:0}];
      zones.forEach((zone,index)=>{
        const side=(index+section+stageIndex)%2?1:-1,center=pacedClimbCenter(journey,zone.y,null,zone.routeSide);
        journey.obstacles.push({id:`branch-${section}-${index}`,section,y:zone.y,x:center+side*52,width:42,side,routeSide:zone.routeSide});
        journey.lights.push({id:`light-${section}-${index}`,section,y:zone.y-100,x:pacedClimbCenter(journey,zone.y-100,null,zone.routeSide)-side*48});
      });
    }else{
      for(let local=oldLong?360:90,index=0;local<travelPerSection-(oldLong?120:60);local+=oldLong?360:120,index++){
        const y=start+local;world.platforms.push({id:`rest-${section}-${index}`,row:section,kind:"rest",word:"",correct:true,x:climbRouteCenter(journey,y),y,width:120});
      }
      for(let local=oldLong?500:travelPerSection-80,index=0;local<travelPerSection-(oldLong?140:40);local+=480,index++){
        const y=start+local,side=(index+section+stageIndex)%2?1:-1,center=climbRouteCenter(journey,y),old=layoutRevision!=="short-v2";
        journey.obstacles.push({id:`branch-${section}-${index}`,section,y,x:center+side*(old?76:96),width:old?122:104,side});
        journey.lights.push({id:`light-${section}-${index}`,section,y:y-(oldLong?240:100),x:oldLong?climbRouteCenter(journey,y-240)+side*112:climbRouteCenter(journey,y-100)-side*82});
      }
    }
    world.platforms.push({id:`base-${section}`,row:section,kind:"base",word:"",correct:true,x:500,y:start+travelPerSection,width:240});
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
    if(world.step>step){
      if(!world.completed){journey.phase="climb";journey.branchStartX=world.x;}
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
    if(isPacedClimb(journey)){
      const route=pacedClimbSection(journey,world.step);
      if(journey.crossing){
        const crossing=journey.crossing;
        if(steer&&(!crossing.side||(crossing.phase==="out"&&Math.abs(world.x-500)<=8)))crossing.side=steer;
        const side=crossing.side;
        if(side){
          const endpoint=500+side*route.span;
          world.x=Math.max(Math.min(500,endpoint),Math.min(Math.max(500,endpoint),world.x+steer*STEER_SPEED*dt));
          const target=crossing.phase==="out"?endpoint:500;
          if(world.x===target){journey.routeChoices[world.step]=side;journey.crossing=null;journey.safeRest={id:`cross-${crossing.phase}-${world.step}-${side}`,x:world.x,y:world.y};world.safeId=journey.safeRest.id;world.event={type:"crossed",phase:crossing.phase};}
        }
        world.camera+=(world.y-115-world.camera)*(1-Math.exp(-7*dt));return;
      }
      const gate=world.y<route.first?route.first:world.y<route.second?route.second:route.top;
      world.x+=(steer*STEER_SPEED+climbJourneyWind(journey,world.y,world.elapsed))*dt;
      world.y=Math.min(gate,world.y+(input.up?CLIMB_TRAVEL_SPEED*dt:0));
      // Endpoint gating is geometric: no timed lock and no Up/steer shortcut.
      if(world.y===route.first&&!journey.routeChoices[world.step]){journey.crossing={phase:"out",side:0,y:route.first};world.event={type:"bough",phase:"out"};}
      else if(world.y===route.second&&journey.routeChoices[world.step]&&world.y<base.y){journey.crossing={phase:"back",side:journey.routeChoices[world.step],y:route.second};world.event={type:"bough",phase:"back"};}
    }else{
      world.x+=(steer*STEER_SPEED+climbJourneyWind(journey,world.y,world.elapsed))*dt;
      world.y=Math.min(base.y,world.y+(input.up?CLIMB_TRAVEL_SPEED*dt:0));
    }
    const center=isPacedClimb(journey)&&journey.crossing
      ? journey.crossing.phase==="out"?500:500+journey.crossing.side*journey.crossingSpan
      : climbRouteCenter(journey,world.y,journey.branchStartX);
    // The outer bark catches an oversteer. Hazards still require a deliberate
    // route around them, and neither motor event changes reading evidence.
    const radius=isPacedClimb(journey)?Math.max(8,climbRouteRadius(journey,world.y)):climbRouteRadius(journey,world.y)-12;
    world.x=Math.max(center-radius,Math.min(center+radius,world.x));
    const obstruction=journey.obstacles.find(o=>o.section===world.step&&Math.abs(o.y-world.y)<20&&Math.abs(o.x-world.x)<o.width/2);
    if(obstruction)recover(world,"branch");
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
