import { registeredPalCanvasPose } from '../shared/registeredPalArt.js';

const rotate=(point,origin,angle)=>({x:origin.x+(point.x-origin.x)*Math.cos(angle)-(point.y-origin.y)*Math.sin(angle),
  y:origin.y+(point.x-origin.x)*Math.sin(angle)+(point.y-origin.y)*Math.cos(angle)});

// Geometry only. Eligibility and learning outcomes remain owned by the existing
// Safari capture rules. A long tool is a real telescoping shaft, not a limb.
export function safariAttachedNetGeometry({operatorPose,netAtlas,netFrame,centre,radius}={}) {
  const wrist=operatorPose?.sockets?.nearHand??operatorPose?.sockets?.rightHand;
  if(!wrist||!netAtlas||!netFrame||!centre||!(radius>0)||!(netFrame.captureRadius>0))return null;
  const unitScale=radius/netFrame.captureRadius*netAtlas.pixelsPerUnit;
  const pose=registeredPalCanvasPose(netAtlas,netFrame,{x:centre.x,y:centre.y,unitScale});
  const contact=pose?.sockets?.connector,capture=pose?.sockets?.captureCenter;
  if(!contact||!capture)return null;
  const sourceAngle=Math.atan2(contact.y-capture.y,contact.x-capture.x);
  const intendedAngle=Math.atan2(wrist.y-centre.y,wrist.x-centre.x);
  const angle=intendedAngle-sourceAngle,connector=rotate(contact,centre,angle);
  const span=Math.hypot(connector.x-wrist.x,connector.y-wrist.y);
  const sections=Array.from({length:3},(_,index)=>({
    from:{x:wrist.x+(connector.x-wrist.x)*index/3,y:wrist.y+(connector.y-wrist.y)*index/3},
    to:{x:wrist.x+(connector.x-wrist.x)*(index+1)/3,y:wrist.y+(connector.y-wrist.y)*(index+1)/3},
    width:Math.max(3,7-index*1.5),material:index===1?'brass-collar':'wooden-telescoping-shaft',
  }));
  return{pose,angle,rotationCentre:{...centre},captureCentre:{...centre},captureRadius:radius,
    measuredWrist:{...wrist},connector,shaft:{span,sections,representation:'three connected telescoping sections'},
    renderOrder:'shaft-and-net-before-original-operator-palms'};
}

export function safariNetPoint(point,geometry) {
  return rotate(point,geometry.rotationCentre,geometry.angle);
}
