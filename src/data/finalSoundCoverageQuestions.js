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

const FINAL_SOUND_DIGRAPHS = new Set(["sh", "ch", "th", "ck", "ng"]);
const FINAL_SOUND_DOUBLE_LETTERS = new Set(["ll", "ss", "ff"]);
const FINAL_SOUND_LEVEL_TWO_REVIEW_KEYS = new Set(["b", "d", "f", "g", "k", "l", "m", "n", "p", "r", "s", "t"]);

export function getFinalSoundType(finalSound = "") {
  const value = String(finalSound || "").toLowerCase().trim();
  if (value.length === 1) return "single_letter";
  if (FINAL_SOUND_DOUBLE_LETTERS.has(value)) return "double_letter";
  if (FINAL_SOUND_DIGRAPHS.has(value)) return "digraph";
  return "blend";
}

export const finalSoundPairCoverageQuestions = Object.entries(finalSoundPairs).flatMap(([itemKey, variants]) =>
  variants.map((words, index) =>
    makePairSelectionQuestion({
      id: `coverage_final_${itemKey}_${String(index + 1).padStart(3, "0")}`,
      skill: "final sounds",
      skillId: "final_sounds",
      itemType: "final_sound",
      itemKey,
      targetSound: itemKey,
      targetFinalSound: itemKey,
      finalSoundType: FINAL_SOUND_LEVEL_TWO_REVIEW_KEYS.has(itemKey) ? "single_letter" : getFinalSoundType(itemKey),
      formatType: "FINAL_SOUND_PAIR_SELECT",
      questionType: "final_sound_pair",
      prompt: "Listen to each word. Which two words end with the same sound?",
      words,
      pairVariant: index,
      level: 2,
      phase: (index % 2) + 1,
      phaseTarget: `level_2_phase_${(index % 2) + 1}`,
      difficulty: 2
    })
  )
);

const endingSoundAnswerOptions = {
  1: ["b", "d", "g", "l", "m", "n", "p", "t"],
  2: ["ll", "ss", "ff", "ck", "sh", "ch", "th", "ng", "nd", "nt", "st", "sk", "mp", "rk", "lt", "ft"]
};

const finalSoundMediaOverrides = {
  animal: {
    image: "/media/initial-sounds/images/a/animal.webp",
    audio: "/media/initial-sounds/audio/a/animal.mp3"
  },
  bib: {
    image: "/media/final-sounds/images/b/bib.webp",
    audio: "/media/final-sounds/audio/b/bib.mp3"
  },
  blob: {
    image: "/media/final-sounds/images/b/blob.webp",
    audio: "/media/final-sounds/audio/b/blob.mp3"
  },
  bulb: {
    image: "/media/final-sounds/images/b/bulb.webp",
    audio: "/media/final-sounds/audio/b/bulb.mp3"
  },
  cab: {
    image: "/media/final-sounds/images/b/cab.webp",
    audio: "/media/final-sounds/audio/b/cab.mp3"
  },
  club: {
    image: "/media/final-sounds/images/b/club.webp",
    audio: "/media/final-sounds/audio/b/club.mp3"
  },
  cob: {
    image: "/media/final-sounds/images/b/cob.webp",
    audio: "/media/final-sounds/audio/b/cob.mp3"
  },
  crib: {
    image: "/media/final-sounds/images/b/crib.webp",
    audio: "/media/final-sounds/audio/b/crib.mp3"
  },
  cub: {
    image: "/media/final-sounds/images/b/cub.webp",
    audio: "/media/final-sounds/audio/b/cub.mp3"
  },
  cube: {
    image: "/media/final-sounds/images/b/cube.webp",
    audio: "/media/final-sounds/audio/b/cube.mp3"
  },
  curb: {
    image: "/media/final-sounds/images/b/curb.webp",
    audio: "/media/final-sounds/audio/b/curb.mp3"
  },
  dab: {
    image: "/media/final-sounds/images/b/dab.webp",
    audio: "/media/final-sounds/audio/b/dab.mp3"
  },
  fossil: {
    image: "/media/initial-sounds/images/f/fossil.webp",
    audio: "/media/initial-sounds/audio/f/fossil.mp3"
  },
  grab: {
    image: "/media/final-sounds/images/b/grab.webp",
    audio: "/media/final-sounds/audio/b/grab.mp3"
  },
  hospital: {
    image: "/media/initial-sounds/images/h/hospital.webp",
    audio: "/media/initial-sounds/audio/h/hospital.mp3"
  },
  jewel: {
    image: "/media/initial-sounds/images/j/jewel.webp",
    audio: "/media/initial-sounds/audio/j/jewel.mp3"
  },
  knob: {
    image: "/media/final-sounds/images/b/knob.webp",
    audio: "/media/final-sounds/audio/b/knob.mp3"
  },
  lab: {
    image: "/media/final-sounds/images/b/lab.webp",
    audio: "/media/final-sounds/audio/b/lab.mp3"
  },
  nail: {
    image: "/media/initial-sounds/images/n/nail.webp",
    audio: "/media/initial-sounds/audio/n/nail.mp3"
  },
  orb: {
    image: "/media/final-sounds/images/b/orb.webp",
    audio: "/media/final-sounds/audio/b/orb.mp3"
  },
  owl: {
    image: "/media/initial-sounds/images/o/owl.webp",
    audio: "/media/initial-sounds/audio/o/owl.mp3"
  },
  pencil: {
    image: "/media/initial-sounds/images/p/pencil.webp",
    audio: "/media/initial-sounds/audio/p/pencil.mp3"
  },
  pretzel: {
    image: "/media/initial-sounds/images/p/pretzel.webp",
    audio: "/media/initial-sounds/audio/p/pretzel.mp3"
  },
  seal: {
    image: "/media/initial-sounds/images/s/seal.webp",
    audio: "/media/initial-sounds/audio/s/seal.mp3"
  },
  robe: {
    image: "/media/final-sounds/images/b/robe.webp",
    audio: "/media/final-sounds/audio/b/robe.mp3"
  },
  rub: {
    image: "/media/final-sounds/images/b/rub.webp",
    audio: "/media/final-sounds/audio/b/rub.mp3"
  },
  sub: {
    image: "/media/final-sounds/images/b/sub.webp",
    audio: "/media/final-sounds/audio/b/sub.mp3"
  },
  tube: {
    image: "/media/final-sounds/images/b/tube.webp",
    audio: "/media/final-sounds/audio/b/tube.mp3"
  },
  wheel: {
    image: "/media/initial-sounds/images/w/wheel.webp",
    audio: "/media/initial-sounds/audio/w/wheel.mp3"
  }
};

const endingSoundLevelOneTargets = [
  ["cat", "t"], ["dog", "g"], ["bed", "d"], ["map", "p"], ["pan", "n"],
  ["pin", "n"], ["bat", "t"], ["bag", "g"], ["cup", "p"], ["web", "b"],
  ["cub", "b"], ["cab", "b"], ["bib", "b"], ["rub", "b"], ["knob", "b"],
  ["lab", "b"], ["sub", "b"], ["cob", "b"], ["dab", "b"],
  ["jet", "t"], ["jam", "m"], ["sun", "n"], ["hat", "t"], ["log", "g"],
  ["mug", "g"], ["bug", "g"], ["cap", "p"], ["pot", "t"], ["pen", "n"],
  ["hen", "n"], ["fan", "n"], ["ham", "m"], ["ram", "m"], ["gum", "m"],
  ["fin", "n"], ["net", "t"], ["cot", "t"], ["cut", "t"], ["lid", "d"],
  ["tub", "b"], ["crab", "b"],
  ["animal", "l"], ["fossil", "l"], ["hospital", "l"], ["jewel", "l"],
  ["nail", "l"], ["owl", "l"], ["pencil", "l"], ["pretzel", "l"],
  ["seal", "l"], ["wheel", "l"]
];

const endingSoundLevelTwoTargets = [
  ["fish", "sh"], ["dish", "sh"], ["brush", "sh"], ["duck", "ck"], ["sock", "ck"],
  ["rock", "ck"], ["ring", "ng"], ["king", "ng"], ["hand", "nd"], ["tent", "nt"],
  ["lamp", "mp"], ["park", "rk"], ["fork", "rk"], ["desk", "sk"], ["shell", "ll"],
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
  const override = finalSoundMediaOverrides[targetWord] || {};
  const audioPath = getApprovedAudioPath(targetWord, override.audio || asset?.audio || "");

  return {
    id: `ending_l${level}_${String(index + 1).padStart(3, "0")}_${targetWord.replace(/[^a-z0-9]+/g, "_")}`,
    grade: level === 1 ? "K" : "1",
    skill: "Final Sounds",
    skillId: "final_sounds",
    level,
    phase: (index % 2) + 1,
    phaseTarget: `level_${level}_phase_${(index % 2) + 1}`,
    difficulty: level,
    passage: "",
    question: "Listen to the word. Which sound does it end with?",
    prompt: "Listen to the word. Which sound does it end with?",
    spokenPrompt: "Listen to the word. Which sound does it end with?",
    questionType: "ixl_template",
    templateType: "ENDING_SOUND",
    formatType: "ENDING_SOUND",
    renderMode: "final_sound_text_choices",
    choiceDisplay: "text_only",
    itemType: "final_sound",
    itemKey: finalSound,
    targetSound: finalSound,
    targetFinalSound: finalSound,
    finalSoundType: getFinalSoundType(finalSound),
    targetWord,
    audioText: targetWord,
    audioPath,
    imagePath: override.image || asset?.image || asset?.fallbackImage || "",
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
