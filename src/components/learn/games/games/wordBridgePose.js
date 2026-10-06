import { registeredPalCanvasPose } from '../shared/registeredPalArt.js';

const HEROES={meadow:'bouncy',dino:'chompy',moonwood:'pip'};

// Physical construction art selection, independent of literacy correctness.
// The held surface follows measured original palms, never a body-box estimate.
export function wordBridgeCharacterPose(atlases,{world='meadow',x,y,height,time=0,moving=false,carrying=false,reaching=false,celebrating=false,mirror=false}={}) {
  const hero=HEROES[world]||HEROES.meadow;
  const action=celebrating?'celebrate':reaching?'reach-low':carrying||moving
    ? moving?(Math.floor(time*9)%2?'carry-b':'carry-a'):'carry-ready':'rest';
  for(const [atlasKey,atlas]of Object.entries(atlases)){
    const frame=atlas.frames.find(row=>row.id===`${hero}-${action}`);
    if(frame)return{atlasKey,frame,action,pose:registeredPalCanvasPose(atlas,frame,{x,y,height,mirror})};
  }
  return null;
}

export function wordBridgeCarriedSurface(pose,{width=64,height=44,aspectRatio=null}={}) {
  const near=pose?.sockets?.nearHand,far=pose?.sockets?.farHand;
  if(!near||!far||!(width>0)||!(height>0))return null;
  const dx=far.x-near.x,dy=far.y-near.y,span=Math.hypot(dx,dy);
  if(span<1)return null;
  let angle=Math.atan2(dy,dx);
  // Mirroring changes anatomy and grip positions, never turns live text upside down.
  if(angle>Math.PI/2)angle-=Math.PI;
  if(angle<-Math.PI/2)angle+=Math.PI;
  const axis={x:Math.cos(angle),y:Math.sin(angle)},normal={x:-axis.y,y:axis.x};
  const contact={x:(near.x+far.x)/2,y:(near.y+far.y)/2};
  // Hands hold the upper rim. Putting the face above these palms hid its live
  // glyph behind the head/forearms in the actual first construction capture.
  const originalAspect=Number.isFinite(aspectRatio)&&aspectRatio>0?aspectRatio:null;
  const fittedWidth=Math.max(width,span+16,originalAspect?originalAspect*34:0),fittedHeight=originalAspect?fittedWidth/originalAspect:height,gripFraction=.22;
  const centre={x:contact.x-normal.x*(gripFraction-.5)*fittedHeight,y:contact.y-normal.y*(gripFraction-.5)*fittedHeight};
  return{centre,angle,width:fittedWidth,height:fittedHeight,gripFraction,grips:{nearHand:{...near},farHand:{...far}},
    label:{x:centre.x+normal.x*.14*fittedHeight,y:centre.y+normal.y*.14*fittedHeight},
    renderOrder:'held-surface-before-original-character-palms'};
}
