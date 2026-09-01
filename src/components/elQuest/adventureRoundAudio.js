import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from "../../data/generated/adventureMapInstructionAudio.generated.js";
import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath,
  normalizeLedaAudioText
} from "../../data/ledaProductionAudio.js";

const TEXT = Object.freeze({
  letter: "Listen to the letter. Tap its matching big or small letter.",
  sound: "Listen. Find the letter that matches the sound.",
  hunt: "Listen to the sound. Tap the picture that starts with it.",
  quick: "Listen then tap the matching word.",
  build: "Build the word. Fill each box in order.",
  spell: "Listen to the word. Build it with the letter cards.",
  playChange: "Listen to the word. Change its first sound. Tap the new word.",
  playRemove: "Take away the first sound. Tap what is left.",
  playJoin: "Join the two small words. Tap the big word they make.",
  poem: "Find the target word in the poem.",
  story: "Look at the book cover. Tap the character whose story it is.",
  trace: "Watch the letter. Then trace it with your finger.",
  chain: "Listen to the new word. Tap the missing letter.",
  speed: "Read the word. Tap it when you know it.",
  fallback: "Listen and find."
});

const PATTERN_TEXT = Object.freeze({
  "end with y": "Tap all the words that end with the letter Y.",
  "end with -ay": "Tap all the words that end with A Y.",
  "end with -ll": "Tap all the words that end with L L.",
  "have -ng": "Tap all the words that have N G.",
  "start with sh": "Tap all the words that start with S H.",
  "end with -ck": "Tap all the words that end with C K."
});

function instructionAudioFor(text) {
  return ADVENTURE_MAP_INSTRUCTION_AUDIO[normalizeLedaAudioText(text)]
    || getLedaInstructionAudioPath(text)
    || "";
}

function uniqueAudio(paths = []) {
  return [...new Set(paths.filter(Boolean))];
}

function result(round, instructionText, targetAudio = [], contentAudio = "") {
  const instructionAudio = instructionAudioFor(instructionText);
  const targets = uniqueAudio(targetAudio).filter(path => path !== instructionAudio);
  return {
    instructionText,
    instructionAudio,
    targetAudio: targets,
    contentAudio: contentAudio && !targets.includes(contentAudio) ? contentAudio : "",
    detailText: round?.prompt && round.prompt !== instructionText ? round.prompt : ""
  };
}

export function resolveAdventureRoundAudio(round = {}) {
  if (round.type === "letter") return result(round, TEXT.letter, [round.audio]);
  if (round.type === "sound") return result(round, TEXT.sound, [round.audio]);
  if (round.type === "hunt") return result(round, TEXT.hunt, [round.audio]);
  if (round.type === "quick") return result(round, TEXT.quick, [round.audio]);
  if (round.type === "build") {
    return /^Spell\b/i.test(round.prompt || "")
      ? result(round, TEXT.spell, [round.audio])
      : result(round, TEXT.build, [round.audio]);
  }
  if (round.type === "play") {
    if (/^Change the first sound\b/i.test(round.prompt || "")) {
      return result(round, TEXT.playChange, [round.audio]);
    }
    if (/^Take the first sound away\b/i.test(round.prompt || "")) {
      return result(round, TEXT.playRemove, [round.audio]);
    }
    const joinedWords = String(round.display || "")
      .split("+")
      .map(word => word.trim())
      .filter(Boolean)
      .map(getLedaWordAudioPath);
    return result(round, TEXT.playJoin, joinedWords);
  }
  if (round.type === "poem") {
    const targetWordAudio = getLedaWordAudioPath(round.answer || "");
    return result(round, TEXT.poem, [targetWordAudio], round.audio || "");
  }
  if (round.type === "story") return result(round, TEXT.story);
  if (round.type === "trace") return result(round, TEXT.trace, [round.audio]);
  if (round.type === "pattern") {
    return result(round, PATTERN_TEXT[round.patternLabel] || round.prompt || TEXT.fallback);
  }
  if (round.type === "chain") return result(round, TEXT.chain, [round.audio]);
  if (round.type === "speed") return result(round, TEXT.speed);
  return result(round, TEXT.fallback, [round.audio]);
}
