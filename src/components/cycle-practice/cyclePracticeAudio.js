import {
  CYCLE_PRACTICE_INSTRUCTIONS,
  CYCLE_PRACTICE_FEEDBACK
} from "./cyclePracticeAudioScripts.js";
import { CYCLE_PRACTICE_INSTRUCTION_AUDIO, CYCLE_PRACTICE_WORD_AUDIO } from "../../data/generated/cyclePracticeInstructionAudio.generated.js";
import { getLedaInstructionAudioPath, getLedaWordAudioPath, normalizeLedaAudioText } from "../../data/ledaProductionAudio.js";

export { CYCLE_PRACTICE_INSTRUCTIONS, CYCLE_PRACTICE_FEEDBACK, CYCLE_PRACTICE_AUDIO_TEXTS } from "./cyclePracticeAudioScripts.js";

export function getCyclePracticeInstructionAudio(text = "") {
  return CYCLE_PRACTICE_INSTRUCTION_AUDIO[normalizeLedaAudioText(text)]
    || getLedaInstructionAudioPath(text)
    || "";
}

export function getCyclePracticeFeedbackAudio(key) {
  return getCyclePracticeInstructionAudio(CYCLE_PRACTICE_FEEDBACK[key] || "");
}

export function getCyclePracticeWordAudio(word = "") {
  return getLedaWordAudioPath(word)
    || CYCLE_PRACTICE_WORD_AUDIO[normalizeLedaAudioText(word)]
    || "";
}

function uniqueAudio(paths) {
  return [...new Set(paths.filter(path => typeof path === "string" && path.trim()))];
}

const DEFAULT_INSTRUCTION_KEYS = Object.freeze({
  pictureSound: "firstSound",
  letterMatch: "letterSound",
  rhymeMatch: "rhymeMatch",
  wordBuild: "wordBuild",
  soundSort: "sortFirstSound",
  letterTrace: "letterTrace"
});

/** Recorded teaching is separate from picture-name replay and answer feedback. */
export function resolveCyclePracticeAudio(round = {}) {
  const knownMechanic = Object.hasOwn(DEFAULT_INSTRUCTION_KEYS, round.mechanicId);
  const instructionKey = knownMechanic
    ? round.instructionKey || DEFAULT_INSTRUCTION_KEYS[round.mechanicId]
    : "";
  const wordParts = round.mechanicId === "wordBuild" && round.variant === "wordParts";
  const instructionText = wordParts
    ? round.instructionText || ""
    : CYCLE_PRACTICE_INSTRUCTIONS[instructionKey] || "";
  const instructionAudio = getCyclePracticeInstructionAudio(instructionText);
  // The target word names the correct picture. Playing it in pictureSound
  // would change sound discrimination into picture-vocabulary matching.
  const targetAudio = !instructionText || wordParts ? [] : uniqueAudio(
    round.mechanicId === "pictureSound" ? [round.soundAudio]
      : round.mechanicId === "letterMatch" && ["letterCase", "wordListen"].includes(round.variant) ? [round.audio]
      : round.mechanicId === "wordBuild" && round.variant === "wordChange"
        ? [round.beforeAudio, round.audio]
      : ["letterMatch", "letterTrace"].includes(round.mechanicId)
        ? [round.soundAudio, round.audio]
        : [round.audio]
  );
  const contentAudio = instructionText && round.contextText
    ? getCyclePracticeInstructionAudio(round.contextText) : "";
  const choiceAudio = !instructionText ? [] : uniqueAudio([
    ...(round.choices || []).flatMap(choice => typeof choice === "object" ? [choice.audio, choice.soundAudio] : []),
    ...(round.objects || []).map(object => object.audio),
    ...(round.choiceNarration || [])
  ]);
  return {
    instructionText,
    instructionAudio,
    targetAudio,
    contentAudio,
    choiceAudio,
    sequence: uniqueAudio([instructionAudio, contentAudio, ...targetAudio])
  };
}
