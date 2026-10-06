const STEP=1/60,MAX_STEPS=12;
// Driving/collision clocks advance at a fixed cadence, independently of the
// decorative render rate. Pauses, hidden tabs and ending release catch-up time.
export function createSentenceGroveStepper(update) {
  let remainder=0,totalSteps=0;
  return {
    advance(seconds,isActive=()=>true) {
      if(!isActive()){remainder=0;return 0;}
      remainder=Math.min(STEP*MAX_STEPS,remainder+Math.max(0,Number.isFinite(seconds)?seconds:0));
      let steps=0;
      while(remainder+1e-9>=STEP&&steps<MAX_STEPS){
        update(STEP);remainder=Math.max(0,remainder-STEP);steps++;totalSteps++;
        if(remainder<1e-12)remainder=0;
        if(!isActive()){remainder=0;break;}
      }
      return steps;
    },
    reset(){remainder=0;},
    inspect:()=>({fixedStep:STEP,maxSteps:MAX_STEPS,remainder,totalSteps})
  };
}
