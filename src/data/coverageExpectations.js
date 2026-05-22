import { initialSoundPairItemKeys } from "./initialSoundPairAssets.js";

export const initialSoundExpectedItemKeys = initialSoundPairItemKeys;

export const coverageExpectations = {
  initial_sounds: {
    itemType: "initial_sound",
    itemKeys: initialSoundExpectedItemKeys,
    total: initialSoundExpectedItemKeys.length,
    unit: "sounds",
    note: "Initial Sounds live assessment only serves itemKeys with complete static image and human-word audio pairs. Other letters remain out of the live pool until matching assets are added; x is intentionally excluded because common x words do not make a clean Kindergarten initial-sound target."
  },
  final_sounds: {
    total: 26,
    unit: "sounds"
  },
  hfw_1_25: {
    total: 25,
    unit: "words"
  },
  hfw_26_50: {
    total: 25,
    unit: "words"
  },
  hfw_51_100: {
    total: 50,
    unit: "words"
  }
};
