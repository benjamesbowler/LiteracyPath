// A release between display frames must still reach one real physics step.
// Pending taps are consumed once; held input remains owned by native releases.
export function createWordClimbInputLatch(){
  let pending={};
  return {
    press(direction){pending[direction]=true;},
    clear(direction){if(direction)delete pending[direction];else pending={};},
    consume(held){const sampled={...held};for(const key of Object.keys(pending))sampled[key]=true;pending={};return sampled;}
  };
}
