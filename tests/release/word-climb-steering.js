import { pacedClimbWaypoint } from '../../src/components/learn/games/games/wordClimbPacedRoute.js';

// Public keyboard steering follows the authored physical connection. The
// trunk's broad tracking deadzone cannot stop short of an exact bough endpoint.
export function pacedClimbNativeKeys(world, side = 1) {
  const waypoint = pacedClimbWaypoint(world, side);
  if (!waypoint) return { waypoint, keys: [] };
  const delta = waypoint.x - world.x;
  const tolerance = waypoint.crossing ? 0 : 7;
  return { waypoint, keys: ['ArrowUp', ...(delta > tolerance ? ['ArrowRight'] : delta < -tolerance ? ['ArrowLeft'] : [])] };
}
