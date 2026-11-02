import { PHYSICAL_PAL_ART } from '../shared/physicalPalArtData.js';
import { registeredPalCanvasPose } from '../shared/registeredPalArt.js';

// Recovery contacts come from the current shared atlas's measured visible
// palm and opaque sole. A hidden far hand is never invented.
export const WORD_BRIDGE_RECOVERY_CONTACTS = Object.freeze(Object.fromEntries(
  Object.entries(PHYSICAL_PAL_ART).map(([hero, source]) => [hero, Object.freeze(
    [6, 7].map(index => {
      const frame = source.actionAtlases.tools.frames[index];
      return Object.freeze({ forehand: Object.freeze([...frame.rightHandPixel]),
        feet: Object.freeze([frame.cell[0] + frame.anchor[0], frame.cell[1] + frame.anchor[1]]) });
    })
  )])
));

export function wordBridgeRecoveryAtlas(hero) {
  const source=PHYSICAL_PAL_ART[hero]?.actionAtlases?.tools;
  if(!source)throw new Error('Unknown canonical Bridge recovery identity: '+hero);
  return { ...source,nominalHeight:2.2,frames:[6,7].map((index,side)=>{
    const frame = { ...source.frames[index] }; delete frame.rightHandPixel; delete frame.leftHandPixel; const contacts=WORD_BRIDGE_RECOVERY_CONTACTS[hero][side];
    return{ ...frame,id:`${hero}-retained-carry-${side?'left':'right'}`,action:'retained-static-carry',
      sockets:{forehand:[...contacts.forehand],feet:[...contacts.feet]} };
  }) };
}

export function wordBridgeRecoveryPose(atlas,{x,y,height,mirror=false}={}) {
  const index=mirror?1:0,frame=atlas?.frames?.[index];
  return frame?{ index,frame,pose:registeredPalCanvasPose(atlas,frame,{x,y,height,mirror:false}) }:null;
}

export function wordBridgeSingleHandSurface(pose,{width=64,height=44,aspectRatio=null,facing=1}={}) {
  const palm=pose?.sockets?.forehand;
  if(!palm||![palm.x,palm.y,width,height].every(Number.isFinite)||width<=0||height<=0)return null;
  const originalAspect=Number.isFinite(aspectRatio)&&aspectRatio>0?aspectRatio:null;
  const fittedWidth=Math.max(width,originalAspect?originalAspect*34:0),fittedHeight=originalAspect?fittedWidth/originalAspect:height;
  return{ centre:{x:palm.x+(facing<0?-1:1)*fittedWidth*.23,y:palm.y+fittedHeight*.28},
    angle:0,width:fittedWidth,height:fittedHeight,gripFraction:.22,grips:{forehand:{...palm}},
    renderOrder:'held-surface-before-original-character-palm',representation:'retained-static-canonical-carry' };
}

// This is a visual loading/recovery decision only. It never reports an image
// delivery or waits before allowing the physical controller to move/interact.
export function wordBridgeRecoveryRepresentation(art) {
  if (!art || art.disposed) return null;
  if (Object.values(art.delivery || {}).some(status => status === 'pending')
    || art.recovery?.delivery?.carry === 'pending') return 'procedural-art-loading';
  return art.recovery?.delivery?.carry === 'unavailable' ? 'procedural-art-unavailable' : null;
}
