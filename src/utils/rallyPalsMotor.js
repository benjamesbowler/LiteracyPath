import { gameRandom } from './gameReplay.js';

export const RALLY_PALS_NEAR_SCALE = 1.22;
export const RALLY_PALS_FAR_SCALE = 1.12;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Sporting variation has its own seed. Neither the literacy target nor the
// selected answer is an input; only an already launched ball can be observed.
export function rallyOpponentPlan(seed, point, flight, mode = 'match', court = 'meadow') {
  const random = gameRandom(`rally-motor:${seed}:${point}:${flight}:${court}`);
  const patient = random() < .5;
  const cooperative = mode !== 'match';
  return {
    style: cooperative ? 'helper' : patient ? 'patient' : 'steady',
    reactionSeconds: cooperative ? .14 : patient ? .29 : .23,
    anticipationSeconds: cooperative ? 1.35 : patient ? 1.05 : 1.15,
    maxSpeed: mode === 'targets' ? 7.5 : mode === 'coop' ? 6.4 : (patient ? 4.2 : 4.7) * (court === 'rooftop' ? .94 : 1),
    acceleration: cooperative ? 28 : 20,
    targetError: cooperative ? 0 : (random() * 2 - 1) * (patient ? .44 : .24),
  };
}

export function newRallyOpponentState(x = 0) {
  return { x, velocity: 0, targetX: x, observed: false, phase: 'observe' };
}

export function stepRallyOpponent(state, ball, plan, seconds) {
  const dt = clamp(seconds, 0, 1 / 30);
  if (!dt) return { ...state };
  const incoming = ball?.direction === 'far' && !ball.soft;
  const mayObserve = incoming && ball.time >= plan.reactionSeconds
    && ball.duration - ball.time <= plan.anticipationSeconds;
  // Keep the sampled estimate for this flight. Future aim changes cannot make
  // the rival oscillate, and an unobserved flight cannot expose its destination.
  const observed = incoming && (state.observed || mayObserve);
  const targetX = incoming ? observed
    ? state.observed ? state.targetX : clamp(ball.to.x + plan.targetError, -4.6, 4.6)
    : state.x : 0;
  const difference = targetX - state.x;
  const phase = !incoming ? 'recover' : !observed ? 'observe'
    : ball.duration - ball.time < .24 && Math.abs(difference) < 1.1 ? 'prepare' : 'track';
  const maximum = incoming ? plan.maxSpeed : Math.min(2.8, plan.maxSpeed);
  const speed = Math.min(maximum, Math.abs(difference) * 6);
  const desired = observed || !incoming ? Math.sign(difference) * speed : 0;
  const velocity = state.velocity + clamp(desired - state.velocity, -plan.acceleration * dt, plan.acceleration * dt);
  return { x: clamp(state.x + velocity * dt, -4.8, 4.8), velocity, targetX, observed, phase };
}

// Existing atlas frames provide readiness, the exact contact pose, then the
// follow-through. Preparation precedes the input; input itself never waits.
export function rallyActorPose({ near, ball, swing = 0, style = 'forehand', moving, phase, opponentPhase }) {
  if (near && ['point', 'complete'].includes(phase)) return { action: 'celebrate', phase: 0, stage: 'celebrate' };
  if (swing > 0) return { action: style, phase: 1 - swing / 5, stage: swing >= 2.4 ? 'strike' : 'recover' };
  const preparing = near ? ball?.direction === 'near' && !ball.soft && ball.z > 2.8 : opponentPhase === 'prepare';
  if (preparing) return { action: 'forehand', phase: .12, stage: 'prepare' };
  return { action: moving ? undefined : 'ready', phase: 0, stage: moving ? 'move' : 'ready' };
}

export function rallyRacketRotation(swing, near, pose) {
  return pose.stage === 'prepare' ? -.72 : -.3 + Math.sin(swing * .6) * (near ? .8 : .7);
}
