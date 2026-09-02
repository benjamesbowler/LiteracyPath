import { blendBridge } from "./blendBridge.js";
import { contrastSort } from "./contrastSort.js";
import { echoSearch } from "./echoSearch.js";
import { memoryDelivery } from "./memoryDelivery.js";
import { storyPower } from "./storyPower.js";
import { wordForge } from "./wordForge.js";

export {
  canonicalMorphologyIntent,
  canonicalResponseIntent,
  createInteractionRuntimeModel
} from "./contracts.js";
export { blendBridge, contrastSort, echoSearch, memoryDelivery, storyPower, wordForge };

export const SOUND_POWER_REGISTRY = Object.freeze({
  echo_search: echoSearch,
  contrast_sort: contrastSort,
  word_forge: wordForge,
  blend_bridge: blendBridge,
  memory_delivery: memoryDelivery,
  story_power: storyPower
});

for (const [powerId, power] of Object.entries(SOUND_POWER_REGISTRY)) {
  if (typeof power.applyMissionCommitResult !== "function") {
    throw new Error(`${powerId}: mission commit integration is required`);
  }
}
