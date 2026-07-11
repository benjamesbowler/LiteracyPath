// The encounter registry, in its own file.
//
// A module that exports BOTH components and a plain object breaks React Fast
// Refresh — the whole file stops hot-reloading, which is death on a game you are
// tuning by feel.

import {
  FlowerPatch, HungryBeast, BrokenBridge, EchoCaveEnc,
  SheepPens, WordBeastEnc, Signpost, StoryRock
} from "./Encounters.jsx";

export const ENCOUNTER_VIEWS = {
  "flower-patch": FlowerPatch,
  "hungry-beast": HungryBeast,
  "broken-bridge": BrokenBridge,
  "echo-cave": EchoCaveEnc,
  "sheep-pens": SheepPens,
  "word-beast": WordBeastEnc,
  signpost: Signpost,
  "story-rock": StoryRock
};
