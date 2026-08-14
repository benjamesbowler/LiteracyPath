import {
  LEDA_PRODUCTION_AUDIO_BY_ROLE,
  LEDA_PRODUCTION_AUDIO_ROLES
} from "./generated/ledaProductionAudio.generated.js";
import { LEDA_RUNTIME_SUPPLEMENT_AUDIO } from "./generated/ledaRuntimeSupplement.generated.js";
import { STORY_QUEST_LEDA_AUDIO } from "./generated/storyQuestLedaAudio.generated.js";
import { ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE } from "./generated/assessmentLedaGaps.generated.js";
import { LEDA_PRODUCTION_VOICE } from "./ledaProductionVoice.js";

export { LEDA_PRODUCTION_AUDIO_ROLES, LEDA_PRODUCTION_VOICE };

export const LEDA_LANGUAGE_AUDIO_ROLES = Object.freeze([
  "supplemental",
  "isolated_word",
  "letter_name",
  "assessment_prompt",
  "assessment_passage",
  "instruction",
  "guided_page",
  "story_page",
  "poem",
  "report"
]);

export function normalizeLedaAudioText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/^hfw:/i, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, "\"")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();
}

export function getLedaProductionAudioPath(
  text = "",
  roles = LEDA_LANGUAGE_AUDIO_ROLES
) {
  const normalized = normalizeLedaAudioText(text);
  if (!normalized) return "";
  for (const role of roles || []) {
    const path = role === "supplemental"
      ? LEDA_RUNTIME_SUPPLEMENT_AUDIO[normalized]
      : role === "story_page"
        ? STORY_QUEST_LEDA_AUDIO[normalized] || LEDA_PRODUCTION_AUDIO_BY_ROLE.story_page?.[normalized]
        : LEDA_PRODUCTION_AUDIO_BY_ROLE[role]?.[normalized]
          || ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE[role]?.[normalized];
    if (path) return path;
  }
  return "";
}

export function getLedaWordAudioPath(text = "") {
  return getLedaProductionAudioPath(text, ["supplemental", "isolated_word", "letter_name"]);
}

export function getLedaInstructionAudioPath(text = "") {
  return getLedaProductionAudioPath(text, [
    "supplemental",
    "instruction",
    "assessment_prompt",
    "assessment_passage",
    "guided_page",
    "story_page",
    "poem",
    "report"
  ]);
}

export function isLedaProductionAudioPath(value = "") {
  return /^\/audio\/production\/en-US\/(?:supplemental|isolated_word|letter_name|assessment_prompt|assessment_passage|instruction|guided_page|story_page|poem|report)\//.test(
    String(value || "")
  );
}
