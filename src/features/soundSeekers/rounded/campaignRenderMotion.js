import { createArcadeMotionTrack } from '../../../components/learn/games/shared/arcadeMotion.js';

export function createCampaignRenderMotion() {
  const track = createArcadeMotionTrack(['x', 'z', 'vx', 'vz']);
  return {
    capture: player => track.capture(player),
    reset: () => track.reset(),
    sample: (player, remainder, snap = false) => track.sample(player, remainder * 60, snap),
  };
}
