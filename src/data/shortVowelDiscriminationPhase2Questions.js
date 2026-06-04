import { makeWordChoiceQuestion } from "./visualQuestionAssets.js";

const VOWEL_LABELS = {
  a: "short_a",
  e: "short_e",
  i: "short_i",
  o: "short_o",
  u: "short_u"
};

const VOWEL_WORDS = {
  a: ["clap", "flat", "lamp", "fast", "span", "stamp", "shack", "black", "flag", "crab"],
  e: ["shelf", "blend", "melt", "sled", "step", "desk", "tent", "net", "pen", "bell"],
  i: ["clip", "limp", "crisp", "grip", "thin", "slip", "fist", "spin", "trim", "ship"],
  o: ["stop", "drop", "frog", "rock", "sock", "shop", "clock", "block", "log", "mop"],
  u: ["club", "drum", "slug", "plum", "brush", "duck", "mud", "mug", "cup", "bug"]
};

const VOWEL_SEQUENCE = Object.keys(VOWEL_WORDS);

function rotate(values, offset) {
  return values.map((_, index) => values[(index + offset) % values.length]);
}

function wordChoiceDistractors(vowel, wordIndex) {
  return VOWEL_SEQUENCE
    .filter(candidate => candidate !== vowel)
    .map((candidate, index) => VOWEL_WORDS[candidate][(wordIndex + index) % VOWEL_WORDS[candidate].length])
    .slice(0, 3);
}

function vowelChoiceDistractors(vowel, wordIndex) {
  return rotate(VOWEL_SEQUENCE.filter(candidate => candidate !== vowel), wordIndex).slice(0, 3);
}

function makeExtra(vowel, word, index, formatTag) {
  return {
    level: 2,
    assessmentLevel: 2,
    depthLevel: 2,
    difficulty: 2,
    phase: 2,
    assessmentPhase: 2,
    levelPhase: 2,
    phaseTarget: "level_2_phase_2",
    source: "short_vowel_discrimination_l2p2_media_backed_2026_06_04",
    tags: ["short-vowel-discrimination", "level-2", "phase-2", VOWEL_LABELS[vowel], word, formatTag],
    sequenceIndex: index
  };
}

const questions = [];

for (const [vowel, words] of Object.entries(VOWEL_WORDS)) {
  words.forEach((word, wordIndex) => {
    const itemKey = VOWEL_LABELS[vowel];
    const choices = [word, ...wordChoiceDistractors(vowel, wordIndex)];

    questions.push(makeWordChoiceQuestion({
      id: `svd_l2p2_picture_${itemKey}_${word}`,
      skill: "Short Vowel Discrimination",
      skillId: "short_vowel_discrimination",
      itemType: "short_vowel",
      itemKey,
      formatType: "PICTURE_TO_PRINT_MATCH",
      prompt: "Pick the word that matches the picture.",
      choices,
      answer: word,
      targetWord: word,
      imageWord: word,
      extra: makeExtra(vowel, word, wordIndex, "picture-match")
    }));

    const vowelChoices = [vowel, ...vowelChoiceDistractors(vowel, wordIndex)];
    questions.push(makeWordChoiceQuestion({
      id: `svd_l2p2_listen_${itemKey}_${word}`,
      skill: "Short Vowel Discrimination",
      skillId: "short_vowel_discrimination",
      itemType: "short_vowel",
      itemKey,
      formatType: "LISTEN_CHOOSE_VOWEL",
      prompt: "Listen and choose the vowel sound.",
      choices: vowelChoices,
      answer: vowel,
      targetWord: word,
      audioWord: word,
      imageWord: word,
      extra: makeExtra(vowel, word, wordIndex + words.length, "listen-vowel")
    }));
  });
}

export const shortVowelDiscriminationPhase2Questions = questions;
