import { makePairSelectionQuestion } from "./soundPairAssets.js";

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

export const finalSoundCoverageQuestions = Object.entries(finalSoundPairs).flatMap(([itemKey, variants]) =>
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
