import { makePairSelectionQuestion } from "./soundPairAssets.js";
import { getChildWordAsset } from "./childAssets.js";
import { getApprovedAudioPath } from "./audioPreferenceManifest.js";

const finalSoundPairs = {
  d: [["bed", "mud", "cat"], ["red", "bud", "fish"], ["bid", "kid", "sun"], ["seed", "hand", "dog"], ["lid", "bird", "map"], ["red", "bed", "cup"], ["hand", "mud", "fish"]],
  g: [["dog", "frog", "cat"], ["bug", "mug", "sun"], ["bag", "rug", "fish"], ["pig", "dig", "hat"], ["leg", "egg", "map"], ["log", "dog", "pen"]],
  k: [["book", "duck", "sun"], ["sock", "rock", "fish"], ["cake", "snake", "dog"], ["fork", "park", "hat"], ["desk", "book", "pig"], ["snake", "cake", "map"], ["rock", "duck", "pen"]],
  l: [["ball", "seal", "dog"], ["shell", "seal", "cat"], ["girl", "ball", "sun"], ["ball", "shell", "fish"]],
  m: [["ram", "gum", "dog"], ["ham", "jam", "fish"], ["farm", "worm", "cat"], ["thumb", "drum", "sun"]],
  n: [["fan", "ten", "dog"], ["pan", "hen", "fish"], ["moon", "corn", "cat"], ["lion", "pen", "sun"], ["pin", "bin", "hat"], ["rain", "train", "cup"]],
  p: [["cap", "cup", "dog"], ["mop", "top", "sun"], ["ship", "shop", "cat"], ["clap", "nap", "fish"], ["cup", "top", "bed"]],
  r: [["car", "tiger", "dog"], ["fork", "park", "sun"], ["star", "car", "fish"], ["fork", "car", "map"]],
  s: [["bus", "this", "dog"], ["vase", "house", "cat"], ["octopus", "bus", "fish"], ["bus", "vase", "sun"]],
  t: [["cat", "hat", "dog"], ["bat", "rat", "sun"], ["jet", "net", "fish"], ["pot", "cot", "map"], ["feet", "tent", "dog"], ["kite", "gate", "sun"]]
};

export const finalSoundPairCoverageQuestions = Object.entries(finalSoundPairs).flatMap(([itemKey, variants]) =>
  variants.map((words, index) =>
    makePairSelectionQuestion({
      id: `coverage_final_${itemKey}_${String(index + 1).padStart(3, "0")}`,
      skill: "final sounds",
      skillId: "final_sounds",
      itemType: "final_sound",
      itemKey,
      targetSound: itemKey,
      formatType: "FINAL_SOUND_PAIR_SELECT",
      questionType: "final_sound_pair",
      prompt: "Listen to each word. Which two words end with the same sound?",
      words,
      pairVariant: index
    })
  )
);

const endingSoundAnswerOptions = {
  1: ["b", "d", "g", "l", "m", "n", "p", "t"],
  2: ["sh", "ch", "th", "ck", "ng", "nd", "nt", "st", "mp", "rk", "sk", "l", "r", "f", "p", "s"]
};

const endingSoundLevelOneTargets = [
  ["cat", "t"], ["dog", "g"], ["bed", "d"], ["map", "p"], ["pan", "n"],
  ["pin", "n"], ["bat", "t"], ["bag", "g"], ["cup", "p"], ["web", "b"],
  ["jet", "t"], ["jam", "m"], ["sun", "n"], ["hat", "t"], ["log", "g"],
  ["mug", "g"], ["bug", "g"], ["cap", "p"], ["pot", "t"], ["pen", "n"],
  ["hen", "n"], ["fan", "n"], ["ham", "m"], ["ram", "m"], ["gum", "m"]
];

const endingSoundLevelTwoTargets = [
  ["fish", "sh"], ["dish", "sh"], ["brush", "sh"], ["duck", "ck"], ["sock", "ck"],
  ["rock", "ck"], ["ring", "ng"], ["king", "ng"], ["hand", "nd"], ["tent", "nt"],
  ["lamp", "mp"], ["park", "rk"], ["fork", "rk"], ["desk", "sk"], ["shell", "l"],
  ["whale", "l"], ["chair", "r"], ["car", "r"], ["tiger", "r"], ["leaf", "f"],
  ["roof", "f"], ["ship", "p"], ["bus", "s"], ["octopus", "s"], ["thumb", "m"]
];

function endingSoundOptionSet(correctAnswer, level) {
  const source = endingSoundAnswerOptions[level] || endingSoundAnswerOptions[1];
  return [correctAnswer, ...source.filter(option => option !== correctAnswer)].slice(0, 4).map(value => ({
    label: value,
    value
  }));
}

function makeEndingSoundQuestion([targetWord, finalSound], index, level) {
  const asset = getChildWordAsset(targetWord);
  const audioPath = getApprovedAudioPath(targetWord, asset?.audio || "");

  return {
    id: `ending_l${level}_${String(index + 1).padStart(3, "0")}_${targetWord.replace(/[^a-z0-9]+/g, "_")}`,
    grade: level === 1 ? "K" : "1",
    skill: "Final Sounds",
    skillId: "final_sounds",
    level,
    difficulty: level,
    passage: "",
    question: "Listen to the word. Which sound does it end with?",
    prompt: "Listen to the word. Which sound does it end with?",
    spokenPrompt: "Listen to the word. Which sound does it end with?",
    questionType: "ixl_template",
    templateType: "ENDING_SOUND",
    formatType: "ENDING_SOUND",
    itemType: "final_sound",
    itemKey: finalSound,
    targetSound: finalSound,
    targetWord,
    audioText: targetWord,
    audioPath,
    imagePath: asset?.image || asset?.fallbackImage || "",
    answer: finalSound,
    correctAnswer: finalSound,
    choices: endingSoundOptionSet(finalSound, level).map(option => option.value),
    answerOptions: endingSoundOptionSet(finalSound, level)
  };
}

export const endingSoundLevelQuestions = [
  ...endingSoundLevelOneTargets.map((item, index) => makeEndingSoundQuestion(item, index, 1)),
  ...endingSoundLevelTwoTargets.map((item, index) => makeEndingSoundQuestion(item, index, 2))
];

export const finalSoundCoverageQuestions = [
  ...finalSoundPairCoverageQuestions,
  ...endingSoundLevelQuestions
];
