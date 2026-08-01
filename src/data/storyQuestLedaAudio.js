import { STORY_QUEST_LEDA_AUDIO } from "./generated/storyQuestLedaAudio.generated.js";
import { normalizeLedaAudioText } from "./ledaProductionAudio.js";

export function getStoryQuestLedaAudioPath(text = "") {
  return STORY_QUEST_LEDA_AUDIO[normalizeLedaAudioText(text)] || "";
}
