import { interpolateArcadeMotion } from '../shared/arcadeMotion.js';
const FIELDS=['x','y','vx','vy','camera','elapsed'];

// A single presentation object is shared by semantic ledges, Three and Canvas.
// Nested authored geometry remains read-only; save/evidence use the real world.
export function createWordClimbMotion(world) {
  let previous=null;
  const pose={...world};
  return {
    pose,
    capture(){previous=Object.fromEntries(FIELDS.map(key=>[key,world[key]]));},
    reset(){previous=null;Object.assign(pose,world);},
    sample(alpha){
      Object.assign(pose,world);
      // Recovery/route transitions may teleport; never slide through the gap.
      const discontinuity=previous&&(Math.abs(world.x-previous.x)>100||Math.abs(world.y-previous.y)>100);
      interpolateArcadeMotion(discontinuity?null:previous,world,world.paused?1:alpha,pose,FIELDS);
      return pose;
    }
  };
}
