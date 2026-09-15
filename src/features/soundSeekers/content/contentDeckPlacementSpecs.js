// One set of placement definitions for gameplay and saved-receipt validation.
// Keep this data independent of expedition construction and media catalogues.
const SPECS = Object.freeze([
  ["s16-alternative", "alternatives", "alternative-slot-s16", ["y_ie", "y_ee"], "contrast-sort-place-sound", "contrast_sort", "place_sound_token", "grapheme_to_phoneme", true],
  ["s28-alternative", "alternatives", "alternative-slot-s28", ["oo_short"], "contrast-sort-place-sound", "contrast_sort", "place_sound_token", "grapheme_to_phoneme", true],
  ["s29-alternative", "alternatives", "alternative-slot-s29", ["ow_ou"], "contrast-sort-place-sound", "contrast_sort", "place_sound_token", "grapheme_to_phoneme", true],
  ["s37-alternative", "alternatives", "alternative-slot-s37", ["c_s", "g_j", "ch_k", "ea_e"], "contrast-sort-place-sound", "contrast_sort", "place_sound_token", "grapheme_to_phoneme", true],
  ["s38-morphology", "morphology", "morphology-slot-s38", [], "morphology-teach", "word_forge", "introduce_word_ending", null, false]
]);

export const CONTENT_DECK_PLACEMENT_SPECS = Object.freeze(SPECS.map(([
  placementId, category, slotId, challengeTargetIds, instructionId, powerId,
  expectedAction, recordsDomain, masteryCredit
]) => Object.freeze({
  placementId,
  category,
  slotId,
  challengeTargetIds: Object.freeze(challengeTargetIds),
  instructionId,
  powerId,
  expectedAction,
  recordsDomain,
  masteryCredit
})));
