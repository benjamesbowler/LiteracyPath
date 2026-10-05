import { registeredPalCanvasPose } from '../components/learn/games/shared/registeredPalArt.js';
import { reelReadActorPlacement, reelReadRodTransform } from './reelReadMotion.js';

/** One measured pose/prop geometry is consumed by paint, physical casts and
 * read-only native route predictions. It never reads the expected word. */
export function reelReadSceneGeometry(state,layout,{actorAsset,actorFrame,referenceFrames,parts,actorReady,frame}) {
  const {boatX,placement,bodyBounds,route}=reelReadActorPlacement(layout,actorAsset,actorFrame,
    state.boatPosition,state.facing,referenceFrames);
  const pose=registeredPalCanvasPose(actorAsset,actorFrame,placement);
  // Open-arm error/finale actions leave the independent rod in its boat rest.
  const rodHeld=Boolean(pose.sockets.rodGrip);
  const restPose=rodHeld?pose:registeredPalCanvasPose(actorAsset,actorReady?actorAsset.frames[2]:actorAsset.frames[0],placement);
  const rod=reelReadRodTransform(parts,restPose.sockets,{singleGripAngle:state.facing==='left'?Math.PI+.2:-.2,
    singleGripScale:placement.height/360});
  return {layout,frame,actorReady,actorAsset,actorFrame,placement,pose,rod,rodHeld,boatX,bodyBounds,route,
    hull:{x:boatX-layout.boatWidth*.5,y:layout.hullTop,width:layout.boatWidth,height:layout.hullHeight}};
}
