// Generated complete-world registry. Unselected art is not imported.
import { createRocketWorldRecordDelivery } from './rocketRunWorldRecordDelivery.js';
const loadWorld = {
  'meadow': () => import('./rocketRunCraftData-meadow.js'),
  'dino': () => import('./rocketRunCraftData-dino.js'),
  'moonwood': () => import('./rocketRunCraftData-moonwood.js'),
};
const recoveryPackets = {
  'meadow': { runtime: '/game-assets/rocket-run/world-records/meadow-v2.json', bytes: 1567295 },
  'dino': { runtime: '/game-assets/rocket-run/world-records/dino-v2.json', bytes: 1466133 },
  'moonwood': { runtime: '/game-assets/rocket-run/world-records/moonwood-v2.json', bytes: 1452141 },
};
export const loadRocketRunCraft = createRocketWorldRecordDelivery(loadWorld, recoveryPackets);
