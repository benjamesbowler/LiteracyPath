import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from "../../data/generated/adventureMapInstructionAudio.generated.js";
import {
  getLedaInstructionAudioPath,
  getLedaProductionAudioPath,
  getLedaWordAudioPath,
  normalizeLedaAudioText
} from "../../data/ledaProductionAudio.js";

export const ADVENTURE_MAP_INSTRUCTIONS = Object.freeze({
  mapEntry: "Tap the card with the arrow to start.",
  letterPair: "Find the small letter.",
  letterPairUpper: "Find the big letter.",
  soundChoice: "Listen. Choose the letter for this sound.",
  soundChoiceTeam: "Listen. Choose the letter team for this sound.",
  soundChoiceEnding: "Choose the ending letters.",
  sceneHunt: "Find the picture that starts with this sound.",
  wordMemory: "Turn over two cards. Find the matching words.",
  letterGrid: "Find all the big and small letters.",
  missingLetterStart: "Choose the first letter.",
  missingLetterEnd: "Choose the last letter.",
  rhymePair: "Find the two words that rhyme.",
  rhymeOdd: "Which word does NOT rhyme?",
  compoundPicture: "What word do these two pictures make?",
  pictureSearch: "Find all the pictures that start with this sound."
});

export const ADVENTURE_MAP_AUDIO_TEXTS = Object.freeze(Object.values(ADVENTURE_MAP_INSTRUCTIONS));

function instructionAudioFor(text) {
  return ADVENTURE_MAP_INSTRUCTION_AUDIO[normalizeLedaAudioText(text)]
    || getLedaInstructionAudioPath(text)
    || "";
}

function uniqueAudio(paths = []) {
  return [...new Set(paths.filter(Boolean))];
}

function result(instructionText, targetAudio = []) {
  const instructionAudio = instructionText ? instructionAudioFor(instructionText) : "";
  const targets = uniqueAudio(targetAudio).filter(path => path !== instructionAudio);
  return {
    instructionText,
    instructionAudio,
    targetAudio: targets,
    contentAudio: "",
    detailText: ""
  };
}

function pictureNames(round) {
  return (round.choices || []).map(choice => (
    getLedaWordAudioPath(typeof choice === "string" ? choice : choice.word)
  ));
}

export function resolveAdventureRoundAudio(round = {}) {
  switch (round.mechanicId) {
    case "letterPair":
      return result(
        String(round.partnerForm || round.answer) === String(round.partnerForm || round.answer).toUpperCase()
          ? ADVENTURE_MAP_INSTRUCTIONS.letterPairUpper
          : ADVENTURE_MAP_INSTRUCTIONS.letterPair,
        [round.audio]
      );
    case "soundChoice":
      return result(
        round.soundPosition === "end"
          ? ADVENTURE_MAP_INSTRUCTIONS.soundChoiceEnding
          : String(round.targetGrapheme || round.answer || "").length > 1
          ? ADVENTURE_MAP_INSTRUCTIONS.soundChoiceTeam
          : ADVENTURE_MAP_INSTRUCTIONS.soundChoice,
        [round.audio]
      );
    case "sceneHunt":
      return result(ADVENTURE_MAP_INSTRUCTIONS.sceneHunt, [round.audio]);
    case "wordMemory":
      return result(ADVENTURE_MAP_INSTRUCTIONS.wordMemory);
    case "letterGrid":
      return result(ADVENTURE_MAP_INSTRUCTIONS.letterGrid, (round.targetLetters || []).map(letter => (
        getLedaProductionAudioPath(letter, ["letter_name"])
      )));
    case "missingLetter":
      return result(
        round.missingPosition === "end"
          ? ADVENTURE_MAP_INSTRUCTIONS.missingLetterEnd
          : ADVENTURE_MAP_INSTRUCTIONS.missingLetterStart,
        [round.audio || getLedaWordAudioPath(round.word || round.answer)]
      );
    case "rhymePair":
      return result(ADVENTURE_MAP_INSTRUCTIONS.rhymePair, pictureNames(round));
    case "rhymeOdd":
      return result(ADVENTURE_MAP_INSTRUCTIONS.rhymeOdd, pictureNames(round));
    case "compoundPicture":
      return result(ADVENTURE_MAP_INSTRUCTIONS.compoundPicture, [
        ...(round.parts || []).map(part => getLedaWordAudioPath(part.word)),
        ...pictureNames(round)
      ]);
    case "pictureSearch":
      return result(ADVENTURE_MAP_INSTRUCTIONS.pictureSearch, [round.audio]);
    default:
      return result("");
  }
}

export function withAdventureAudioEvidence(round, outcome, deliveredSources = []) {
  const targets = resolveAdventureRoundAudio(round).targetAudio;
  const delivered = new Set(deliveredSources);
  const audioDelivered = targets.length > 0 && targets.every(src => delivered.has(src));
  return {
    ...outcome,
    evidence: {
      ...outcome.evidence,
      audioRequired: round.audioRequired === true,
      audioDelivered,
      // Early responses still complete the game. An unheard target cannot
      // provide evidence of independent listening discrimination.
      ...(round.audioRequired && !audioDelivered ? { independent: false } : {})
    }
  };
}
