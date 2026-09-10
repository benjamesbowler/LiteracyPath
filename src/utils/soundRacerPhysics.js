// Sound Racer uses metres on one closed, arc-length sampled circuit. Rendering,
// gate positions and kart projection all consume these exact points.
export const RACER_ROAD_WIDTH = 9.6;
export const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const wrap = (n, length) => ((n % length) + length) % length;
export function sampleCircuitPath(path, distance) {
  const length = path.at(-1).distance;
  const target = wrap(distance, length);
  let low = 0;
  let high = path.length - 1;
  while (low + 1 < high) {
    const mid = (low + high) >> 1;
    if (path[mid].distance <= target) low = mid; else high = mid;
  }
  const a = path[low], b = path[high];
  const t = (target - a.distance) / (b.distance - a.distance);
  return { x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t, z: a.z + (b.z-a.z)*t,
    heading: a.heading + angleDelta(a.heading,b.heading)*t, bank:(a.bank||0)+((b.bank||0)-(a.bank||0))*t, distance: target };
}
export function offsetCircuitPoint(point, lateral) {
  return { x: point.x + Math.cos(point.heading)*lateral, y: point.y + Math.tan(point.bank||0)*lateral,
    z: point.z + Math.sin(point.heading)*lateral };
}
export function projectKart(path, kart) {
  const length = path.at(-1).distance;
  let best = null;
  for (let i=0;i<path.length-1;i++) {
    const a=path[i],b=path[i+1];
    const dx=b.x-a.x,dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((kart.x-a.x)*dx+(kart.z-a.z)*dz)/(dx*dx+dz*dz)));
    const distance=a.distance+(b.distance-a.distance)*t;
    // Local projection prevents teleporting between adjacent hairpin arms or
    // skipping checkpoints by cutting across the infield.
    const delta=wrap(distance-wrap(kart.progress,length)+length/2,length)-length/2;
    if(Math.abs(delta)>12) continue;
    const x=a.x+dx*t,z=a.z+dz*t;
    const error=(kart.x-x)**2+(kart.z-z)**2;
    if(!best || error<best.error) {
      const point=sampleCircuitPath(path,distance);
      best={...point,error,progress:kart.progress+delta,
        lateral:(kart.x-x)*Math.cos(point.heading)+(kart.z-z)*Math.sin(point.heading)};
    }
  }
  return best;
}
export function createKart(path, progress=0) {
  return {...sampleCircuitPath(path,progress),progress,lateral:0,steering:0,speed:0,safeProgress:progress,recoveries:0};
}
export function stepKart(path, kart, input, dt) {
  dt=Math.max(0,Math.min(0.05,Number(dt)||0));
  const next={...kart};
  const steer=Math.max(-1,Math.min(1,input.steer || 0));
  next.steering+=(steer-next.steering)*Math.min(1,dt*9);
  const wanted=input.brake ? 3.2 : (input.speed || 9);
  next.speed+=(wanted-next.speed)*Math.min(1,dt*3);
  next.heading+=next.steering*Math.min(1.05,next.speed*0.1)*dt;
  next.x+=Math.sin(next.heading)*next.speed*dt;
  next.z-=Math.cos(next.heading)*next.speed*dt;
  const projection=projectKart(path,next);
  if(projection) {
    next.lateral=projection.lateral;
    next.y=projection.y+Math.tan(projection.bank||0)*next.lateral;
    next.bank=projection.bank;
    // This is measured motion, never an automatic race clock.
    next.progress=projection.progress;
    if(Math.abs(next.lateral)<RACER_ROAD_WIDTH/2-1.1 && Math.abs(angleDelta(next.heading,projection.heading))<0.8)
      next.safeProgress=next.progress;
  }
  next.recovered=!projection || projection.error>(RACER_ROAD_WIDTH/2-0.48)**2;
  if(next.recovered) {
    const safe=createKart(path,next.safeProgress);
    return {...safe,speed:3.2,recoveries:kart.recoveries+1,recovered:true};
  }
  return next;
}
export function chasePose(kart) {
  return { x:kart.x-Math.sin(kart.heading)*8.8,y:kart.y+4.4,z:kart.z+Math.cos(kart.heading)*8.8,
    lookX:kart.x+Math.sin(kart.heading)*12,lookY:kart.y+0.8,lookZ:kart.z-Math.cos(kart.heading)*12 };
}
