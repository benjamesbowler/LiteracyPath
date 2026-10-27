import { createArcadeMotionTrack } from '../shared/arcadeMotion.js';
const stageKey = state => `${state.index}:${state.phase}:${state.mode}:${state.court}`;
export function createRallyPalsRenderMotion() {
  const player=createArcadeMotionTrack(['x','z']),opponent=createArcadeMotionTrack(['x','z']);
  const ball=createArcadeMotionTrack(['x','y','z','time']),clock=createArcadeMotionTrack(['time','swing','rivalSwing']);
  let previous=null;
  return {
    capture(physics,state,time) {
      player.capture(physics.player);opponent.capture(physics.opponent);ball.capture(physics.ball);
      clock.capture({time,swing:physics.swing,rivalSwing:physics.rivalSwing});
      previous={key:stageKey(state),contact:physics.lastContact,ballTime:physics.ball?.time,
        x:physics.player.x,z:physics.player.z,swing:physics.swing,rivalSwing:physics.rivalSwing};
    },
    reset() { previous=null;player.reset();opponent.reset();ball.reset();clock.reset(); },
    sample(physics,state,time,alpha,paused=false) {
      const snap=paused||!previous||previous.key!==stageKey(state);
      const timing=clock.sample({time,swing:physics.swing,rivalSwing:physics.rivalSwing},alpha,snap);
      const actorSnap=snap||Math.hypot(physics.player.x-previous.x,physics.player.z-previous.z)>2;
      return {time:timing.time,physics:{...physics,
        swing:physics.swing>previous?.swing?physics.swing:timing.swing,
        rivalSwing:physics.rivalSwing>previous?.rivalSwing?physics.rivalSwing:timing.rivalSwing,
        player:player.sample(physics.player,alpha,actorSnap),opponent:opponent.sample(physics.opponent,alpha,snap),
        ball:ball.sample(physics.ball,alpha,snap||previous.contact!==physics.lastContact||physics.ball?.time<previous.ballTime)}};
    }
  };
}
