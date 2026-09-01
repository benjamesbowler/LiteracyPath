import {
  EVIDENCE_DOMAINS,
  isEvidenceDomain,
  validateEvidencePath
} from "../engine/evidenceEligibility.js";

export const SOUND_POWER_IDS = Object.freeze({
  ECHO_SEARCH: "echo_search",
  CONTRAST_SORT: "contrast_sort",
  WORD_FORGE: "word_forge",
  BLEND_BRIDGE: "blend_bridge",
  MEMORY_DELIVERY: "memory_delivery",
  STORY_POWER: "story_power"
});

const VALID_POWER_IDS = new Set(Object.values(SOUND_POWER_IDS));
const VALID_PHASES = new Set(["teach", "replay", "decision"]);

const audible = ({ instructionId, powerId, phase, childText, cue, expectedAction, recordsDomain = null }) => Object.freeze({
  instructionId,
  powerId,
  phase,
  childText,
  childAudio: `quest/instructions/${instructionId}`,
  cue,
  expectedAction,
  recordsDomain,
  silenceIsIntentional: false
});

const contracts = [
  audible({ instructionId: "morphology-teach", powerId: SOUND_POWER_IDS.WORD_FORGE, phase: "teach", childText: "Endings can change or extend a word.", cue: "morphology", expectedAction: "introduce_word_ending" }),
  audible({ instructionId: "single-sound-teach", powerId: SOUND_POWER_IDS.ECHO_SEARCH, phase: "teach", childText: "This spelling shows the sound. Say it with me.", cue: "phoneme", expectedAction: "introduce_sound_spelling" }),
  audible({ instructionId: "letter-team-teach", powerId: SOUND_POWER_IDS.ECHO_SEARCH, phase: "teach", childText: "These letters work together to show one sound.", cue: "phoneme", expectedAction: "introduce_sound_spelling" }),
  audible({ instructionId: "consonant-blend-teach", powerId: SOUND_POWER_IDS.ECHO_SEARCH, phase: "teach", childText: "Say each sound, then slide them together.", cue: "phoneme_sequence", expectedAction: "introduce_sound_spelling" }),
  audible({ instructionId: "alternative-value-teach", powerId: SOUND_POWER_IDS.ECHO_SEARCH, phase: "teach", childText: "These letters can show this sound in this word.", cue: "phoneme", expectedAction: "introduce_sound_spelling" }),
  audible({ instructionId: "echo-search-teach", powerId: SOUND_POWER_IDS.ECHO_SEARCH, phase: "teach", childText: "Listen for the sound. Find its letter.", cue: "phoneme", expectedAction: "reveal_matching_grapheme" }),
  audible({ instructionId: "echo-search-replay", powerId: SOUND_POWER_IDS.ECHO_SEARCH, phase: "replay", childText: "Hear the sound again.", cue: "phoneme", expectedAction: "replay_cue" }),
  audible({ instructionId: "echo-search-find-source", powerId: SOUND_POWER_IDS.ECHO_SEARCH, phase: "decision", childText: "Find the letter for this sound.", cue: "phoneme", expectedAction: "reveal_matching_grapheme", recordsDomain: EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME }),
  audible({ instructionId: "contrast-sort-teach", powerId: SOUND_POWER_IDS.CONTRAST_SORT, phase: "teach", childText: "Listen. Put each item with its sound.", cue: "phoneme", expectedAction: "place_sound_token" }),
  audible({ instructionId: "contrast-sort-replay", powerId: SOUND_POWER_IDS.CONTRAST_SORT, phase: "replay", childText: "Hear the sound again.", cue: "phoneme", expectedAction: "replay_cue" }),
  audible({ instructionId: "contrast-sort-place-sound", powerId: SOUND_POWER_IDS.CONTRAST_SORT, phase: "decision", childText: "Put this item with the matching sound.", cue: "phoneme", expectedAction: "place_sound_token", recordsDomain: EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME }),
  audible({ instructionId: "contrast-sort-place-decoded-word", powerId: SOUND_POWER_IDS.CONTRAST_SORT, phase: "decision", childText: "Read this word. Put it with the matching word pattern.", cue: "printed_word", expectedAction: "place_decoded_word_token", recordsDomain: EVIDENCE_DOMAINS.WORD_DECODING }),
  audible({ instructionId: "contrast-sort-place-heart-word", powerId: SOUND_POWER_IDS.CONTRAST_SORT, phase: "decision", childText: "Look at the heart part. Put this word with its matching pattern.", cue: "heart_word", expectedAction: "place_heart_word_token", recordsDomain: EVIDENCE_DOMAINS.HEART_WORD_MAPPING }),
  audible({ instructionId: "word-forge-teach", powerId: SOUND_POWER_IDS.WORD_FORGE, phase: "teach", childText: "Listen to the whole word. Build it with letters or letter teams.", cue: "whole_word", expectedAction: "place_grapheme_tile" }),
  audible({ instructionId: "word-forge-replay", powerId: SOUND_POWER_IDS.WORD_FORGE, phase: "replay", childText: "Hear the whole word again.", cue: "whole_word", expectedAction: "replay_cue" }),
  audible({ instructionId: "word-forge-place-tile", powerId: SOUND_POWER_IDS.WORD_FORGE, phase: "decision", childText: "Choose the letter or letter team for this sound.", cue: "whole_word", expectedAction: "place_grapheme_tile", recordsDomain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING }),
  audible({ instructionId: "blend-bridge-teach", powerId: SOUND_POWER_IDS.BLEND_BRIDGE, phase: "teach", childText: "Touch each letter or letter team. Blend the word.", cue: "grapheme_sequence", expectedAction: "activate_grapheme_sequence" }),
  audible({ instructionId: "blend-bridge-replay", powerId: SOUND_POWER_IDS.BLEND_BRIDGE, phase: "replay", childText: "Hear the sounds again.", cue: "grapheme_sequence", expectedAction: "replay_cue" }),
  audible({ instructionId: "blend-bridge-choose-meaning", powerId: SOUND_POWER_IDS.BLEND_BRIDGE, phase: "decision", childText: "Choose what the blended word means.", cue: "whole_word", expectedAction: "choose_blended_meaning", recordsDomain: EVIDENCE_DOMAINS.WORD_DECODING }),
  audible({ instructionId: "blend-bridge-choose-novel-meaning", powerId: SOUND_POWER_IDS.BLEND_BRIDGE, phase: "decision", childText: "Blend the new word. Choose its picture.", cue: "grapheme_sequence", expectedAction: "choose_novel_decoded_meaning", recordsDomain: EVIDENCE_DOMAINS.NOVEL_DECODING }),
  audible({ instructionId: "memory-delivery-teach", powerId: SOUND_POWER_IDS.MEMORY_DELIVERY, phase: "teach", childText: "Listen. Remember the clue as you travel.", cue: "whole_word", expectedAction: "receive_memory_cue" }),
  audible({ instructionId: "memory-delivery-replay", powerId: SOUND_POWER_IDS.MEMORY_DELIVERY, phase: "replay", childText: "Hear the clue again.", cue: "whole_word", expectedAction: "replay_cue" }),
  audible({ instructionId: "memory-delivery-deliver-sound", powerId: SOUND_POWER_IDS.MEMORY_DELIVERY, phase: "decision", childText: "Remember the sound. Take it to the matching letter.", cue: "phoneme", expectedAction: "deliver_sound_cue", recordsDomain: EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME }),
  audible({ instructionId: "memory-delivery-deliver-decoded-word", powerId: SOUND_POWER_IDS.MEMORY_DELIVERY, phase: "decision", childText: "Read and remember the word. Take it to what it means.", cue: "printed_word", expectedAction: "deliver_decoded_word_cue", recordsDomain: EVIDENCE_DOMAINS.WORD_DECODING }),
  audible({ instructionId: "memory-delivery-deliver-heart-word", powerId: SOUND_POWER_IDS.MEMORY_DELIVERY, phase: "decision", childText: "Remember the heart word. Take it to its matching place.", cue: "heart_word", expectedAction: "deliver_heart_word_cue", recordsDomain: EVIDENCE_DOMAINS.HEART_WORD_MAPPING }),
  audible({ instructionId: "memory-delivery-follow-decoded-instruction", powerId: SOUND_POWER_IDS.MEMORY_DELIVERY, phase: "decision", childText: "Read and remember the instruction. Do it when you arrive.", cue: "connected_text", expectedAction: "follow_decoded_instruction", recordsDomain: EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER }),
  audible({ instructionId: "story-power-teach", powerId: SOUND_POWER_IDS.STORY_POWER, phase: "teach", childText: "Read the words. Use them to change the scene.", cue: "connected_text", expectedAction: "read_story_text" }),
  audible({ instructionId: "story-power-replay", powerId: SOUND_POWER_IDS.STORY_POWER, phase: "replay", childText: "Hear the words again.", cue: "connected_text", expectedAction: "replay_cue" }),
  audible({ instructionId: "story-power-choose-story-action", powerId: SOUND_POWER_IDS.STORY_POWER, phase: "decision", childText: "Choose the action that matches the story.", cue: "connected_text", expectedAction: "choose_story_action", recordsDomain: EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER })
];

export const SOUND_SEEKERS_INSTRUCTIONS = Object.freeze(Object.fromEntries(
  contracts.map(contract => [contract.instructionId, contract])
));

export function getInstructionContract(instructionId) {
  return SOUND_SEEKERS_INSTRUCTIONS[String(instructionId || "").trim()] || null;
}

function validateContract(contract) {
  if (!contract || typeof contract !== "object") throw new Error("instruction contract is required");
  if (!/^[a-z]+(?:-[a-z]+)+$/u.test(contract.instructionId || "")) throw new Error("instruction id is invalid");
  if (!VALID_POWER_IDS.has(contract.powerId)) throw new Error(`${contract.instructionId}: power id is invalid`);
  if (!VALID_PHASES.has(contract.phase)) throw new Error(`${contract.instructionId}: phase is invalid`);
  if (!String(contract.childText || "").trim()) throw new Error(`${contract.instructionId}: child text is required`);
  if (/\b[a-z]+_[a-z]+\b/u.test(contract.childText)) throw new Error(`${contract.instructionId}: child text exposes an internal id`);
  if (!String(contract.expectedAction || "").trim()) throw new Error(`${contract.instructionId}: expected action is required`);
  if (contract.phase === "decision" && !isEvidenceDomain(contract.recordsDomain)) {
    throw new Error(`${contract.instructionId}: scored decision requires a valid records domain`);
  }
  if (contract.phase !== "decision" && contract.recordsDomain !== null) {
    throw new Error(`${contract.instructionId}: unscored instruction cannot authorize evidence`);
  }
  if (contract.silenceIsIntentional !== true && !String(contract.childAudio || "").trim()) {
    throw new Error(`${contract.instructionId}: required audio is missing`);
  }
}

export function assertInstructionMatchesChallenge(contract, challenge = {}) {
  validateContract(contract);
  if (challenge.instructionId !== contract.instructionId) {
    throw new Error(`${contract.instructionId}: instruction id does not match the challenge`);
  }
  if (challenge.powerId !== contract.powerId) {
    throw new Error(`${contract.instructionId}: power id does not match the challenge`);
  }
  if (challenge.expectedAction !== contract.expectedAction) {
    throw new Error(`${contract.instructionId}: expected action does not match the challenge`);
  }
  if (challenge.recordsDomain !== contract.recordsDomain) {
    throw new Error(`${contract.instructionId}: records domain does not match the challenge`);
  }
  if (contract.phase === "decision") {
    const eligibility = validateEvidencePath(challenge);
    if (!eligibility.valid) {
      throw new Error(`${contract.instructionId}: target evidence path is not eligible (${eligibility.errors.join("; ")})`);
    }
  }
  if (challenge.requiresAudio !== false && contract.silenceIsIntentional === true) {
    throw new Error(`${contract.instructionId}: an audio-dependent challenge cannot use intentional silence`);
  }
  return true;
}

for (const contract of contracts) validateContract(contract);
