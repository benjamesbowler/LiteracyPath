import { PerspectiveCamera, Vector3 } from 'three';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const intersects=(a,b,gap=0)=>a.x<b.right+gap&&a.right+gap>b.x&&a.y<b.bottom+gap&&a.bottom+gap>b.y;
const surfaceDirections=Array.from({length:7},(_,row)=>{
  const latitude=(row-3)*Math.PI/8;
  return Array.from({length:16},(_,column)=>{const longitude=column*Math.PI/8;
    return [Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude)];});
}).flat().concat([[0,1,0],[0,-1,0]]);
const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
function hull(points){
  const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y),lower=[],upper=[];
  for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for(const p of [...sorted].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  return lower.slice(0,-1).concat(upper.slice(0,-1));
}
function bounds(points){const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  return {x:Math.min(...xs),y:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};}

/** The scene and Canvas fallback use this actual perspective projection and
 * world lane spacing. It does not inspect a target, correct flag or history.
 * Projected words are measured at the reading floor instead of being shrunk
 * with distant cargo. Future unreadable cargo is not a presented response. */
export function createRocketViewGeometry(width,height) {
  width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);
  const portrait=width<520,compact=height<=420;
  const camera=new PerspectiveCamera(portrait?62:48,width/height,.1,180);
  camera.position.set(3.2,portrait?4.5:3.3,portrait?(compact?12:14):7.6);
  camera.lookAt(0,.8,compact?-6.5:-11);camera.updateMatrixWorld();
  // Recompose the actual camera around the compact HUD; moving a word or a
  // collider to escape that HUD would create a false physical route.
  if(portrait)camera.setViewOffset(width,height,compact?-15:-30,compact?-55:0,width,height);
  else if(compact)camera.setViewOffset(width,height,-48,0,width,height);
  // World-space lanes stay unchanged through a paused/in-flight resize. The
  // camera supplies the portrait fit; orientation cannot move a collider.
  const lanes=[-2.2,0,2.2];
  const cue=portrait?{x:8,y:78,right:width-8,bottom:compact?174:202}
    :compact?{x:8,y:74,right:172,bottom:146}:{x:width/2-140,y:8,right:width/2+140,bottom:104};
  // Reserve feedback where it can be read without covering the pilot. The
  // same rectangle excludes presented word faces; CSS cannot secretly place
  // a reading decision beneath a coach strip that the simulation ignores.
  const coach=portrait?{x:compact?16:18,y:compact?146:172,right:width-(compact?16:18),bottom:compact?166:192}
    :compact?{x:312,y:height-52,right:width-8,bottom:height-8}
    :{x:12,y:height-114,right:width-190,bottom:height-82};
  const safe={x:8,right:width-8,y:compact?80:portrait?208:112,
    bottom:height-(compact?100:width<520?138:112)};
  const point=new Vector3();
  const project=(x,y,z)=>{point.set(x,y,z).project(camera);return {x:(point.x+1)*width/2,y:(1-point.y)*height/2,depth:point.z};};
  // The authored receiver is a vertical ring in the world X/Y plane. Its
  // collision depth remains a separate Z radius; a flat fixed-pixel ellipse
  // would falsely describe the real spacecraft's contact geometry.
  const receiver=(x,y,z,radius=.34)=>{
    const points=Array.from({length:32},(_,i)=>{const angle=i*Math.PI/16;
      return project(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,z);});
    return {centre:project(x,y,z),points,bounds:bounds(points),radius};
  };
  const volume=(x,y,z,{radius,verticalRadius=radius,depthRadius=radius})=>{
    const points=hull(surfaceDirections.map(([dx,dy,dz])=>project(x+dx*radius,y+dy*verticalRadius,z+dz*depthRadius)));
    return {centre:project(x,y,z),points,bounds:bounds(points),radius,verticalRadius,depthRadius};
  };
  const laneX=lane=>lanes[clamp(Math.trunc(lane),0,2)];
  function faces(carriers,measure=word=>word.length*9.6) {
    const placed=[];
    return carriers.filter(row=>row.alive&&!row.passed).sort((a,b)=>b.z-a.z).map(row=>{
      const p=project(row.x,1.08,row.z),w=Math.max(88,Math.ceil(measure(row.word)+24)),h=34;
      const rect={x:p.x-w/2,y:p.y-h/2-18,right:p.x+w/2,bottom:p.y+h/2-18,width:w,height:h};
      const visible=row.z>=-27&&p.depth>-1&&p.depth<1&&rect.right>0&&rect.x<width&&rect.bottom>0&&rect.y<height;
      const readable=visible&&rect.x>=safe.x&&rect.right<=safe.right&&rect.y>=safe.y&&rect.bottom<=safe.bottom
        &&!intersects(rect,cue,6)&&!intersects(rect,coach,6)&&!placed.some(old=>intersects(rect,old,8));
      if(readable)placed.push(rect);
      return {flightId:row.flightId,trialId:row.trialId,word:row.word,lane:row.lane,visible,readable,
        x:p.x,y:p.y,depth:p.depth,rect,fontSize:16,hitHeight:56};
    });
  }
  return {camera,laneX,project,receiver,volume,faces,layout:{width,height,portrait,compact,lanes,cue,coach,safe}};
}

/** Hazard scenery has deterministic motor identities and never consults the
 * word bank. The duration of one physical passage is shorter than immunity,
 * so a single overlapping meteor cannot take another life after a remount. */
export function rocketRunMeteorField(state,difficulty,laneX) {
  const period=difficulty==='hard'?90:difficulty==='medium'?110:130;
  // The world advances all incoming motor objects by the same travelled
  // distance, including boost/slow reading speed. Collision sweeps therefore
  // cannot use a different meteor clock from its actual visible position.
  const origin=Number.isFinite(state.hazardOriginDistance)?state.hazardOriginDistance:0;
  const phase=Math.max(0,state.distance-origin-44),cycle=Math.floor(phase/period),rows=[];
  for(let offset=0;offset<2;offset++) {
    const id=cycle-offset;if(id<0)continue;
    const age=phase-id*period,z=-43+age;
    if(z>1||z<-43)continue;
    const lane=((state.seed^Math.imul(id+1,0x45d9f3b)^Math.imul(state.round+1,31))>>>0)%3;
    rows.push({id:`meteor-${state.round}-${id}`,lane,x:laneX(lane),z,radius:.55,depthRadius:.33,alive:true,passed:false});
  }
  return rows;
}
