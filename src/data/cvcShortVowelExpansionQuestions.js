const cvcTargets = [
  ["bag", ["bag", "bug", "big", "bed"]],
  ["bat", ["bat", "bag", "bed", "bud"]],
  ["bed", ["bed", "bad", "bid", "bud"]],
  ["cap", ["cap", "cup", "cat", "cot"]],
  ["cat", ["cat", "cot", "cut", "cap"]],
  ["cup", ["cup", "cap", "cot", "cut"]],
  ["dog", ["dog", "dig", "dug", "dot"]],
  ["dot", ["dot", "dog", "dig", "dug"]],
  ["fin", ["fin", "fan", "pin", "pen"]],
  ["hat", ["hat", "hot", "hut", "hit"]],
  ["jam", ["jam", "jet", "jug", "hat"]],
  ["leg", ["leg", "log", "lid", "red"]],
  ["log", ["log", "leg", "lid", "mug"]],
  ["man", ["man", "map", "mop", "mud"]],
  ["map", ["map", "mop", "mug", "man"]],
  ["mud", ["mud", "mug", "map", "bed"]],
  ["mug", ["mug", "mud", "map", "mop"]],
  ["nut", ["nut", "net", "nap", "pot"]],
  ["pen", ["pen", "pan", "pin", "pun"]],
  ["pig", ["pig", "pin", "pan", "pen"]],
  ["pot", ["pot", "pan", "pen", "pig"]],
  ["ram", ["ram", "red", "rug", "mug"]],
  ["red", ["red", "ram", "rug", "bed"]],
  ["sit", ["sit", "sun", "hit", "hot"]],
  ["sun", ["sun", "sit", "nut", "cup"]],
  ["wig", ["wig", "web", "zip", "pig"]],
  ["zip", ["zip", "wig", "sit", "pig"]]
];

function uniqueChoices(choices) {
  return [...new Set(choices)];
}

export const cvcShortVowelExpansionQuestions = cvcTargets.flatMap(([targetWord, choices], index) => [
  {
    id: `cvc_listen_find_${String(index + 1).padStart(3, "0")}`,
    grade: "K",
    skill: "cvc words",
    skillId: "cvc_short_vowels",
    difficulty: 1,
    passage: "",
    question: "Listen and find the word",
    prompt: "Listen and find the word",
    spokenPrompt: targetWord,
    audioText: targetWord,
    questionType: "listen_and_find_word",
    formatType: "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    itemType: "cvc_word",
    itemKey: targetWord,
    targetWord,
    targetVowel: targetWord.match(/[aeiou]/)?.[0] || "",
    choices: uniqueChoices(choices),
    answer: targetWord
  },
  {
    id: `cvc_picture_print_${String(index + 1).padStart(3, "0")}`,
    grade: "K",
    skill: "cvc words",
    skillId: "cvc_short_vowels",
    difficulty: 1,
    passage: "",
    question: "Listen and find the word",
    prompt: "Listen and find the word",
    spokenPrompt: targetWord,
    audioText: targetWord,
    questionType: "listen_and_find_word",
    formatType: "PICTURE_TO_PRINT_MATCH",
    itemType: "cvc_word",
    itemKey: targetWord,
    targetWord,
    targetVowel: targetWord.match(/[aeiou]/)?.[0] || "",
    choices: uniqueChoices([targetWord, ...choices.slice().reverse()]),
    answer: targetWord
  }
]);
