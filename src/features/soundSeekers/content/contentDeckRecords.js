function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

const STOPS = Object.freeze(Array.from({ length: 40 }, (_, index) => `s${index + 1}`));

export const STORY_CONTENT_DECK_RECORDS = Object.freeze(STOPS.map(stopId => deepFreeze({
  recordId: `story:scene-${stopId}`,
  category: "stories",
  contentId: `scene-${stopId}`,
  targetId: `text:scene-${stopId}`,
  wordId: null,
  connectedTextId: `scene-${stopId}`,
  slotIds: [`story-slot-${stopId}`]
})));

const TRANSFER_PHASES = Object.freeze({
  s1: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s1-controlled-scene", null],
  s2: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s2-controlled-scene", null],
  s3: ["memory-delivery-follow-decoded-instruction", "memory_delivery", "follow_decoded_instruction", "connected_text_transfer", "s3-wind-stone-instruction", null],
  s4: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s4-controlled-scene", null],
  s5: ["blend-bridge-choose-novel-meaning", "blend_bridge", "choose_novel_decoded_meaning", "novel_decoding", "bramble-gate-novel-decode", "cat"],
  s6: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s6-controlled-scene", null],
  s7: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s7-controlled-scene", null],
  s8: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s8-controlled-scene", null],
  s9: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s9-controlled-scene", null],
  s10: ["blend-bridge-choose-novel-meaning", "blend_bridge", "choose_novel_decoded_meaning", "novel_decoding", "singing-weir-novel-decode", "thing"],
  s11: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s11-controlled-scene", null],
  s12: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s12-controlled-scene", null],
  s13: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s13-controlled-scene", null],
  s14: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s14-controlled-scene", null],
  s15: ["blend-bridge-choose-novel-meaning", "blend_bridge", "choose_novel_decoded_meaning", "novel_decoding", "claw-pass-novel-decode", "truck"],
  s16: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s16-controlled-scene", null],
  s17: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s17-controlled-scene", null],
  s18: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s18-controlled-scene", null],
  s19: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s19-controlled-scene", null],
  s20: ["blend-bridge-choose-novel-meaning", "blend_bridge", "choose_novel_decoded_meaning", "novel_decoding", "word-forge-novel-decode", "stone"],
  s21: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s21-controlled-scene", null],
  s22: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s22-controlled-scene", null],
  s23: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s23-controlled-scene", null],
  s24: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s24-controlled-scene", null],
  s25: ["blend-bridge-choose-novel-meaning", "blend_bridge", "choose_novel_decoded_meaning", "novel_decoding", "mirror-fen-novel-decode", "night"],
  s26: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s26-controlled-scene", null],
  s27: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s27-controlled-scene", null],
  s28: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s28-controlled-scene", null],
  s29: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s29-controlled-scene", null],
  s30: ["blend-bridge-choose-novel-meaning", "blend_bridge", "choose_novel_decoded_meaning", "novel_decoding", "thunder-lighthouse-novel-decode", "point"],
  s31: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s31-controlled-scene", null],
  s32: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s32-controlled-scene", null],
  s33: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s33-controlled-scene", null],
  s34: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s34-controlled-scene", null],
  s35: ["blend-bridge-choose-novel-meaning", "blend_bridge", "choose_novel_decoded_meaning", "novel_decoding", "observatory-novel-decode", "near"],
  s36: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s36-controlled-scene", null],
  s37: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s37-controlled-scene", null],
  s38: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s38-controlled-scene", null],
  s39: ["story-power-choose-story-action", "story_power", "choose_story_action", "connected_text_transfer", "s39-controlled-scene", null],
  s40: ["blend-bridge-choose-novel-meaning", "blend_bridge", "choose_novel_decoded_meaning", "novel_decoding", "first-reading-star-novel-decode", "action"]
});

const NON_BOSS_KEYS = Object.freeze({
  s1: "b", s2: "a", s3: "c", s4: "b", s6: "c", s7: "a", s8: "b", s9: "c",
  s11: "a", s12: "c", s13: "b", s14: "a", s16: "b", s17: "c", s18: "a", s19: "b",
  s21: "c", s22: "a", s23: "b", s24: "c", s26: "a", s27: "b", s28: "c", s29: "a",
  s31: "b", s32: "c", s33: "a", s34: "b", s36: "c", s37: "a", s38: "b", s39: "c"
});

const BOSS_DECISIONS = deepFreeze({
  s5: ["boss-s5-choice-b", [["boss-s5-choice-a", "an animal that swims", "swimming-animal"], ["boss-s5-choice-b", "a small pet animal", "small-pet-animal"], ["boss-s5-choice-c", "an animal that flies", "flying-animal"]]],
  s10: ["boss-s10-choice-c", [["boss-s10-choice-a", "a person you meet", "person-you-meet"], ["boss-s10-choice-b", "a place you visit", "place-you-visit"], ["boss-s10-choice-c", "an object you use", "object-you-use"]]],
  s15: ["boss-s15-choice-a", [["boss-s15-choice-a", "a large road vehicle", "goods-truck"], ["boss-s15-choice-b", "a small water vessel", "small-boat"], ["boss-s15-choice-c", "a seat with a back", "single-chair"]]],
  s20: ["boss-s20-choice-b", [["boss-s20-choice-a", "water falling from clouds", "falling-rain"], ["boss-s20-choice-b", "a hard piece of rock", "hand-stone"], ["boss-s20-choice-c", "small round money", "single-coin"]]],
  s25: ["boss-s25-choice-c", [["boss-s25-choice-a", "water falling from clouds", "falling-rain"], ["boss-s25-choice-b", "the light time after morning", "day-sky"], ["boss-s25-choice-c", "the dark time before morning", "night-sky"]]],
  s30: ["boss-s30-choice-a", [["boss-s30-choice-a", "aim at one place", "point-at-target"], ["boss-s30-choice-b", "strike your hands together", "clap-hands"], ["boss-s30-choice-c", "rest on a seat", "sit-on-seat"]]],
  s35: ["boss-s35-choice-b", [["boss-s35-choice-a", "a long distance away", "far-object"], ["boss-s35-choice-b", "a short distance away", "near-object"], ["boss-s35-choice-c", "the place where you live", "home-place"]]],
  s40: ["boss-s40-choice-c", [["boss-s40-choice-a", "something you can hold", "held-object"], ["boss-s40-choice-b", "somewhere you can go", "destination-place"], ["boss-s40-choice-c", "something someone does", "person-doing-action"]]]
});

function transferRecord(stopId) {
  const [instructionId, powerId, expectedAction, recordsDomain, contextId, wordId] = TRANSFER_PHASES[stopId];
  const authoredBoss = BOSS_DECISIONS[stopId];
  const bossDecision = authoredBoss ? deepFreeze({
    expectedToken: authoredBoss[0],
    options: authoredBoss[1].map(([token, childText, semanticCue]) => ({ token, childText, semanticCue }))
  }) : null;
  const optionTokens = bossDecision
    ? bossDecision.options.map(option => option.token)
    : ["a", "b", "c"].map(letter => `ct-${stopId}-${letter}`);
  const expectedToken = bossDecision?.expectedToken || `ct-${stopId}-${NON_BOSS_KEYS[stopId]}`;
  return deepFreeze({
    recordId: `transfer:${stopId}`, category: "transfer", contentId: `transfer:${stopId}`,
    targetId: wordId ? `novel:${contextId}:${wordId}` : `text:scene-${stopId}`,
    wordId, position: wordId ? "whole" : null, connectedTextId: `scene-${stopId}`,
    bossTransferId: wordId ? contextId : null,
    instructionId, powerId, expectedAction, recordsDomain,
    decisionContract: { expectedToken, optionTokens }, bossDecision,
    slotIds: [`transfer-slot-${stopId}`]
  });
}

export const TRANSFER_CONTENT_DECK_RECORDS = Object.freeze(STOPS.map(transferRecord));

const ALTERNATIVE_TARGETS = deepFreeze({
  s16: ["y_ie", "y_ee"], s28: ["oo_short"], s29: ["ow_ou"],
  s37: ["c_s", "g_j", "ch_k", "ea_e"]
});

export const ALTERNATIVE_CONTENT_DECK_RECORDS = Object.freeze(Object.entries(ALTERNATIVE_TARGETS)
  .map(([stopId, targetIds]) => deepFreeze({
    recordId: `alternative:${stopId}`, category: "alternatives", contentId: `alternative:${stopId}`,
    targetId: null, wordId: null, targetIds,
    comparisonFamilies: targetIds.map(targetId => ({
      targetId,
      expectedToken: `alternative-${stopId}-${targetId}-choice-b`,
      optionTokens: ["a", "b", "c"].map(letter => `alternative-${stopId}-${targetId}-choice-${letter}`),
      distractorRationales: {
        [`alternative-${stopId}-${targetId}-choice-a`]: "same-family contrast before the target",
        [`alternative-${stopId}-${targetId}-choice-c`]: "same-family contrast after the target"
      }
    })),
    slotIds: [`alternative-slot-${stopId}`]
  })));

export const MORPHOLOGY_CONTENT_DECK_RECORDS = Object.freeze([deepFreeze({
  recordId: "morphology:s38:suffix_s", category: "morphology",
  contentId: "morphology:suffix_s:cats", targetId: null, wordId: "cats",
  morphologyId: "suffix_s", assessed: false, baseWord: "cat", ending: "s",
  meaning: "more than one", childText: "Add s to cat.", slotIds: ["morphology-slot-s38"]
})]);

export const CONTENT_DECK_RECORDS = deepFreeze({
  stories: STORY_CONTENT_DECK_RECORDS,
  alternatives: ALTERNATIVE_CONTENT_DECK_RECORDS,
  morphology: MORPHOLOGY_CONTENT_DECK_RECORDS,
  transfer: TRANSFER_CONTENT_DECK_RECORDS
});
