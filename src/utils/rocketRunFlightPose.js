const durations={cruise:2,bank_left:1.2,bank_right:1.2,boost:1,shield_recover:1.4,catch:1,celebrate:2};

/** These modes select the actual new flight clips. Optional scenery movement
 * is independent; a bank, boost, receiver contact or shield hit must animate
 * the corresponding seated grip/support curve rather than an idle bob. */
export function createRocketFlightPose() {
  let clip='cruise',age=0,lastDirection=0,priorityUntil=0,celebratePending=false;
  const switchTo=name=>{if(name!==clip){clip=name;age=0;}};
  return {
    event(type) {
      // The final genuine receiver contact must visibly finish its catch
      // follow-through before the sector celebration takes over.
      if(type==='round-complete'&&clip==='catch'&&age<durations.catch){celebratePending=true;return;}
      const next=type==='meteor-hit'?'shield_recover':type==='round-complete'?'celebrate'
        :['accepted-word','wrong-onset','motor-contact'].includes(type)?'catch':null;
      if(next){clip=next;age=0;priorityUntil=durations[next];}
    },
    update(seconds,flight,{boost=false,completed=false,reducedMotion=false}={}) {
      age+=Math.max(0,Math.min(.12,seconds));
      const direction=Math.abs(flight.velocity)>.12?Math.sign(flight.velocity):0;
      if((completed||celebratePending)&&!(clip==='catch'&&age<durations.catch)){switchTo('celebrate');celebratePending=false;}
      else if(age>=priorityUntil) {
        priorityUntil=0;
        if(boost)switchTo('boost');
        else if(!reducedMotion&&direction&&direction!==lastDirection)switchTo(direction<0?'bank_left':'bank_right');
        else if(age>=durations[clip])switchTo('cruise');
      }
      lastDirection=direction;
      const looping=clip==='cruise'||clip==='boost';
      return {clip,phase:looping?(age%durations[clip])/durations[clip]:Math.min(1,age/durations[clip]),duration:durations[clip]};
    },
    inspect:()=>({clip,age,lastDirection,priorityUntil,celebratePending}),
  };
}
