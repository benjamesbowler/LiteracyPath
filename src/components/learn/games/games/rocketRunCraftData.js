// Generated complete-world registry. Unselected art is not imported.
import { createRocketWorldRecordDelivery } from './rocketRunWorldRecordDelivery.js';
const loadWorld = {
  'meadow': () => import('./rocketRunCraftData-meadow.js'),
  'dino': () => import('./rocketRunCraftData-dino.js'),
  'moonwood': () => import('./rocketRunCraftData-moonwood.js'),
};
const recoveryPackets = {
  'meadow': { runtime: '/game-assets/rocket-run/world-records/meadow-v2.json', bytes: 1561418 },
  'dino': { runtime: '/game-assets/rocket-run/world-records/dino-v2.json', bytes: 1456508 },
  'moonwood': { runtime: '/game-assets/rocket-run/world-records/moonwood-v2.json', bytes: 1441707 },
};
export const loadRocketRunCraft = createRocketWorldRecordDelivery(loadWorld, recoveryPackets);
