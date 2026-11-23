import { STORY_QUEST_LEDA_AUDIO } from "./generated/storyQuestLedaAudio.generated.js";
import { getLedaInstructionAudioPath, normalizeLedaAudioText } from "./ledaProductionAudio.js";

export function getStoryQuestLedaAudioPath(text = "") {
  return STORY_QUEST_LEDA_AUDIO[normalizeLedaAudioText(text)] || "";
}

export function getStoryQuestPageAudioUrl(page) {
  if (!page) return "";
  const pageText = Array.isArray(page.text) ? page.text.join(" ") : page.text;
  const rebuiltAudioUrl = getStoryQuestLedaAudioPath(pageText);
  if (rebuiltAudioUrl) return rebuiltAudioUrl;
  if (page.narrationNeedsRebuild) return "";
  return getLedaInstructionAudioPath(pageText) || page.audioUrl || "";
}
