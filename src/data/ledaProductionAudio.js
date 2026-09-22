import {
  LEDA_PRODUCTION_AUDIO_BY_ROLE,
  LEDA_PRODUCTION_AUDIO_ROLES
} from "./generated/ledaProductionAudio.generated.js";
import { LEDA_RUNTIME_SUPPLEMENT_AUDIO } from "./generated/ledaRuntimeSupplement.generated.js";
import { STORY_QUEST_LEDA_AUDIO } from "./generated/storyQuestLedaAudio.generated.js";
import { ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE } from "./generated/assessmentLedaGaps.generated.js";
import { LEDA_PRODUCTION_VOICE } from "./ledaProductionVoice.js";
import { CHILD_WORD_AUDIO_OVERRIDES } from "./childWordAudioOverrides.js";
import { normalizeLedaAudioText } from "./normalizeLedaAudioText.js";

export { LEDA_PRODUCTION_AUDIO_ROLES, LEDA_PRODUCTION_VOICE };
export { normalizeLedaAudioText } from "./normalizeLedaAudioText.js";

export const LEDA_LANGUAGE_AUDIO_ROLES = Object.freeze([
  "supplemental",
  "isolated_word",
  "letter_name",
  "assessment_prompt",
  "assessment_passage",
  "instruction",
  "guided_page",
  "story_page",
  "report"
]);

export function getLedaProductionAudioPath(
  text = "",
  roles = LEDA_LANGUAGE_AUDIO_ROLES
) {
  const normalized = normalizeLedaAudioText(text);
  if (!normalized) return "";
  for (const role of roles || []) {
    // Exact repairs in the supplemental assessment map can replace an older
    // production recording with a new URL, including shared instruction roles.
    const path = ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE[role]?.[normalized] || (role === "supplemental"
      ? LEDA_RUNTIME_SUPPLEMENT_AUDIO[normalized]
      : role === "story_page"
        ? STORY_QUEST_LEDA_AUDIO[normalized] || LEDA_PRODUCTION_AUDIO_BY_ROLE.story_page?.[normalized]
        : LEDA_PRODUCTION_AUDIO_BY_ROLE[role]?.[normalized]);
    if (path) return path;
  }
  return "";
}

export function getLedaWordAudioPath(text = "") {
  const override = CHILD_WORD_AUDIO_OVERRIDES[normalizeLedaAudioText(text)];
  if (override) return override;
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
    "report"
  ]);
}

export function isLedaProductionAudioPath(value = "") {
  return /^\/audio\/production\/en-US\/(?:supplemental|isolated_word|letter_name|assessment_prompt|assessment_passage|instruction|guided_page|story_page|report)\//.test(
    String(value || "")
  );
}
