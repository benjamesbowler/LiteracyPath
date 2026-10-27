import { createArcadeMotionTrack } from '../shared/arcadeMotion.js';
const stageKey = state => `${state.index}:${state.lives}:${state.phase}`;
export function createTowerTumbleRenderMotion() {
  const actor=createArcadeMotionTrack(['x','y']),time=createArcadeMotionTrack(['elapsed','smash','impactAge','rescueProgress']);
  let previous=null,barrelTracks=new Map();
  return {
    capture(data) {
      actor.capture(data.state.actor);time.capture(data);
      const next=new Map();for(const barrel of data.barrels){const track=barrelTracks.get(barrel)?.track||createArcadeMotionTrack(['x','y','spin']);track.capture(barrel);next.set(barrel,{track,y:barrel.y,dir:barrel.dir});}barrelTracks=next;
      previous={key:stageKey(data.state),x:data.state.actor.x,y:data.state.actor.y,smash:data.smash,impactAge:data.impactAge};
    },
    reset() { previous=null;barrelTracks.clear();actor.reset();time.reset(); },
    sample(data,alpha,paused=false) {
      const snap=paused||!previous||previous.key!==stageKey(data.state);
      const timing=time.sample(data,alpha,snap);
      const actorSnap=snap||data.state.actor.fell||Math.hypot(data.state.actor.x-previous.x,data.state.actor.y-previous.y)>2;
      return {...data,...timing,state:{...data.state,actor:actor.sample(data.state.actor,alpha,actorSnap)},
        smash:data.smash>previous?.smash?data.smash:timing.smash,
        impactAge:data.impactAge<previous?.impactAge?data.impactAge:timing.impactAge,
        lift:3+Math.sin(timing.elapsed*.7)*3,
        barrels:data.barrels.map(barrel=>{const old=barrelTracks.get(barrel);return old?old.track.sample(barrel,alpha,snap||old.y!==barrel.y||old.dir!==barrel.dir):barrel;})};
    }
  };
}
