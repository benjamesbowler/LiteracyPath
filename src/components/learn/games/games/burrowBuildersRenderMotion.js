import { createArcadeMotionTrack } from '../shared/arcadeMotion.js';
const sameSurface=(a,b)=>a&&b&&a.islandId===b.islandId&&a.blocks===b.blocks;
export function createBurrowRenderMotion() {
  const track=createArcadeMotionTrack(['x','z','height']);
  let previousWorld=null,latestWorld=null,output=null,pulse=null;
  return {
    capture(pose,world) { track.capture(pose);previousWorld=world; },
    reset() { track.reset();previousWorld=latestWorld=output=pulse=null; },
    pulse(before,after,now) {
      pulse={x:after.x-before.x,z:after.z-before.z,at:now};
    },
    sample(pose,world,alpha,now,paused=false) {
      const snap=paused||!sameSurface(previousWorld,world);
      output=track.sample(pose,alpha,snap);
      if(snap)pulse=null;
      if(pulse){const remaining=Math.max(0,1-(now-pulse.at)/80);output.x-=pulse.x*remaining;output.z-=pulse.z*remaining;if(!remaining)pulse=null;}
      latestWorld=world;return output;
    },
    read(pose,world,paused=false) {
      if(paused||!output||!sameSurface(latestWorld,world)||latestWorld.player!==world.player){
        this.reset();output={...pose};latestWorld=world;
      }
      return output;
    }
  };
}
