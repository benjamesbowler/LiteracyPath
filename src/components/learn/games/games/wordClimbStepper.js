export const WORD_CLIMB_STEP=1/60;
const MAX_STEPS=12;

// The controller owns this mutable physical state outside React rendering.
export function pauseWordClimbWorld(world, paused) { world.paused=Boolean(paused); }

// Movement is the existing controller's unmodified physics. This accumulator
// makes input/collision integration independent of the renderer cadence and
// delivers each real controller event before a later substep can replace it.
export function createWordClimbStepper(world,advance,onEvent=()=>{},onStep=()=>{}){
  let remainder=0,steps=0;
  return {
    advance(seconds,input){
      if(world.paused){remainder=0;return 0;}
      if(!Number.isFinite(seconds)||seconds<0)return 0;
      remainder=Math.min(MAX_STEPS*WORD_CLIMB_STEP,remainder+Math.min(seconds,.2));
      let count=0;
      while(remainder+1e-9>=WORD_CLIMB_STEP&&count<MAX_STEPS){
        advance(world,WORD_CLIMB_STEP,input);
        if(world.event)onEvent(world.event);
        onStep(WORD_CLIMB_STEP);remainder=Math.max(0,remainder-WORD_CLIMB_STEP);count++;steps++;
        if(world.paused){remainder=0;break;}
      }
      return count;
    },
    reset(){remainder=0;},
    inspect:()=>({step:WORD_CLIMB_STEP,steps,remainder,maxSteps:MAX_STEPS})
  };
}
