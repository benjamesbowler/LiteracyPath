import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from "../../data/generated/adventureMapInstructionAudio.generated.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath,
  normalizeLedaAudioText
} from "../../data/ledaProductionAudio.js";

export const ADVENTURE_MAP_INSTRUCTIONS = Object.freeze({
  letterPair: "Press the big or small letter that pairs with the model.",
  soundGate: "Listen to the sound. Load its spelling into the sound gate, then open it.",
  sceneHunt: "Listen to each picture name. Tag every word that starts with the target sound, then check your tags.",
  sceneHuntEnding: "Listen to each picture name. Tag every word that ends with the target pattern, then check your tags.",
  wordWindow: "Study the whole word. Close the window, choose it from memory, then reveal it to check.",
  soundBoxes: "Listen to the word. Put one grapheme in each sound box, then blend and check.",
  wordMachineSubstitute: "Listen to the new word. Choose an onset to replace the first sound, then run the word machine.",
  wordMachineRemove: "Listen to the word. Choose the first sound to remove, then run the word machine.",
  wordMachineJoin: "Select both word parts in order, then join them in the word machine.",
  // The visible prompt names the authored target word. This short generic
  // recording remains the action cue; the target word is replayable separately
  // from the Listen control below.
  poemSpotlight: "Find the target word in the poem.",
  coverClue: "Pick up the title strip. Read it, then place it on the matching book cover.",
  letterTrace: "Watch the letter path. Trace it, then trace it again with a faded model.",
  graphemeTrace: "Watch the letter team path. Trace it, then trace it again with a faded model.",
  patternSort: "Pick up one word at a time. Put it in the matching pattern bin, then sort the new word.",
  wordChain: "Listen to the next word. Choose which grapheme changes, then choose its replacement.",
  phraseFlow: "Read the continuous word trail. Choose where the first poetry line ends, follow the model, then echo-read it.",
  heartWord: "Study the heart word. Hide it, spell it from memory, then reveal and repair any difference."
});

const PHRASE_FLOW_MODELS = Object.freeze([
  "\"Let's play again!\" the friends all say, a brand new Moonwood day.",
  "Pip and Luna read and play, \"hip hip hooray!\" they say.",
  "\"Why does Glimmer's fire fly high?\" \"My spark!\" laughs Spark, \"I'll try!\"",
  "Fern flutters way up high, and waves the clouds goodbye.",
  "They share a berry, half each, in the Whispering Meadow's reach."
]);

const POEM_MODELS = Object.freeze(
  EL_CYCLE_POEMS.map(poem => poem.lines.join("\n"))
);

export const ADVENTURE_MAP_AUDIO_TEXTS = Object.freeze([
  ...Object.values(ADVENTURE_MAP_INSTRUCTIONS),
  ...PHRASE_FLOW_MODELS,
  ...POEM_MODELS
]);

function instructionAudioFor(text) {
  return ADVENTURE_MAP_INSTRUCTION_AUDIO[normalizeLedaAudioText(text)]
    || getLedaInstructionAudioPath(text)
    || "";
}

function uniqueAudio(paths = []) {
  return [...new Set(paths.filter(Boolean))];
}

function result(
  round,
  instructionText,
  targetAudio = [],
  contentAudio = "",
  instructionAudioOverride = ""
) {
  const instructionAudio = instructionAudioOverride
    || (instructionText ? instructionAudioFor(instructionText) : "");
  const targets = uniqueAudio(targetAudio).filter(path => path !== instructionAudio);
  return {
    instructionText,
    instructionAudio,
    targetAudio: targets,
    contentAudio: contentAudio && !targets.includes(contentAudio) ? contentAudio : "",
    detailText: round?.prompt && round.prompt !== instructionText ? round.prompt : ""
  };
}

function emptyResult(round) {
  return result(round, "");
}

function phraseModelText(round) {
  return Array.isArray(round?.phraseChunks)
    ? round.phraseChunks.map(text => String(text || "").trim()).filter(Boolean).join(" ")
    : "";
}

function poemModelText(round) {
  return Array.isArray(round?.lines)
    ? round.lines.map(text => String(text || "").trim()).filter(Boolean).join("\n")
    : "";
}

function wordMachineAudio(round) {
  if (round.operation === "substituteOnset") {
    return result(round, ADVENTURE_MAP_INSTRUCTIONS.wordMachineSubstitute, [round.audio]);
  }
  if (round.operation === "removeOnset") {
    return result(round, ADVENTURE_MAP_INSTRUCTIONS.wordMachineRemove, [round.audio]);
  }
  if (round.operation === "joinCompound") {
    const joinedWords = String(round.beforeWord || round.display || "")
      .split("+")
      .map(word => word.trim())
      .filter(Boolean)
      .map(getLedaWordAudioPath);
    return result(round, ADVENTURE_MAP_INSTRUCTIONS.wordMachineJoin, joinedWords);
  }
  return emptyResult(round);
}

export function resolveAdventureRoundAudio(round = {}) {
  switch (round.mechanicId) {
    case "letterPair":
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.letterPair, [round.audio]);
    case "soundGate":
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.soundGate, [round.audio]);
    case "sceneHunt":
      {
        const genericInstruction = round.variant === "soundSort"
          ? ADVENTURE_MAP_INSTRUCTIONS.sceneHuntEnding
          : ADVENTURE_MAP_INSTRUCTIONS.sceneHunt;
        const visiblePrompt = round.prompt || genericInstruction;
        return result(
          round,
          visiblePrompt,
          [round.audio],
          "",
          instructionAudioFor(genericInstruction)
        );
      }
    case "wordWindow":
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.wordWindow, [round.audio]);
    case "soundBoxes":
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.soundBoxes, [round.audio]);
    case "wordMachine":
      return wordMachineAudio(round);
    case "poemSpotlight": {
      const targetWord = String(round.answer || round.targetWord || "").trim();
      const visiblePrompt = targetWord
        ? `Find the word “${targetWord}” in the poem.`
        : ADVENTURE_MAP_INSTRUCTIONS.poemSpotlight;
      return result(
        round,
        visiblePrompt,
        [getLedaWordAudioPath(targetWord)],
        instructionAudioFor(poemModelText(round)),
        instructionAudioFor(ADVENTURE_MAP_INSTRUCTIONS.poemSpotlight)
      );
    }
    case "coverClue":
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.coverClue);
    case "letterTrace":
      return result(
        round,
        round.construct === "grapheme_pattern_formation_practice"
          ? ADVENTURE_MAP_INSTRUCTIONS.graphemeTrace
          : ADVENTURE_MAP_INSTRUCTIONS.letterTrace,
        [round.audio]
      );
    case "patternSort":
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.patternSort);
    case "wordChain":
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.wordChain, [round.audio]);
    case "phraseFlow": {
      const modelAudio = instructionAudioFor(phraseModelText(round));
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.phraseFlow, [], modelAudio);
    }
    case "heartWord":
      return result(round, ADVENTURE_MAP_INSTRUCTIONS.heartWord, [round.audio]);
    default:
      return emptyResult(round);
  }
}
