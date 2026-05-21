import fs from "fs";

const questions = [];

function add(q) {
  questions.push({
    id: q.id,
    grade: q.grade || "1",
    skill: q.skill,
    difficulty: q.difficulty || 2,
    passage: q.passage || "",
    question: q.question,
    image: q.image || "",
    imagePath: q.imagePath || "",
    questionType: q.questionType || "multiple_choice",
    choices: q.choices,
    answer: q.answer
  });
}

function choices(answer, wrongs) {
  return [...new Set([answer, ...wrongs])].slice(0, 4);
}

// Extra final sounds
[
  ["Which word ends with the /t/ sound?", "mat", ["man", "map", "mad"]],
  ["Which word ends with the /p/ sound?", "cap", ["cat", "can", "cab"]],
  ["Which word ends with the /n/ sound?", "sun", ["sup", "sut", "sub"]],
  ["Which word ends with the /g/ sound?", "dog", ["dot", "dock", "don"]],
  ["Which word ends with the /m/ sound?", "jam", ["jet", "jag", "jab"]]
].forEach(([question, answer, wrongs], i) => {
  add({
    id: `exp5_final_${i + 1}`,
    grade: "K",
    skill: "final sounds",
    difficulty: 1,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

// Extra rhyming
[
  ["moon", "spoon", ["cat", "fish", "dog"]],
  ["light", "night", ["log", "bug", "pen"]],
  ["bee", "tree", ["sun", "dog", "cat"]],
  ["goat", "coat", ["fish", "bed", "cup"]],
  ["chair", "bear", ["dog", "sun", "fish"]]
].forEach(([target, answer, wrongs], i) => {
  add({
    id: `exp5_rhyme_${i + 1}`,
    grade: "K",
    skill: "rhyming",
    difficulty: 1,
    question: `Which word rhymes with ${target}?`,
    choices: choices(answer, wrongs),
    answer
  });
});

// Extra blends
[
  ["black", "bl", ["back", "lack", "pack"]],
  ["green", "gr", ["seen", "mean", "bean"]],
  ["slide", "sl", ["side", "ride", "wide"]],
  ["smile", "sm", ["mile", "pile", "tile"]],
  ["brush", "br", ["rush", "mush", "tush"]]
].forEach(([answer, blend, wrongs], i) => {
  add({
    id: `exp5_blend_${i + 1}`,
    grade: "1",
    skill: "blends",
    difficulty: 2,
    question: `Which word begins with the ${blend} blend?`,
    choices: choices(answer, wrongs),
    answer
  });
});

// Extra digraphs
[
  ["sheep", "sh", ["sleep", "deep", "keep"]],
  ["chick", "ch", ["kick", "pick", "lick"]],
  ["thumb", "th", ["gum", "drum", "plum"]],
  ["whisk", "wh", ["risk", "disk", "mask"]],
  ["shark", "sh", ["park", "dark", "mark"]]
].forEach(([answer, sound, wrongs], i) => {
  add({
    id: `exp5_digraph_${i + 1}`,
    grade: "1",
    skill: "digraphs",
    difficulty: 3,
    question: `Which word begins with the ${sound} sound?`,
    choices: choices(answer, wrongs),
    answer
  });
});

// Extra long vowels
[
  ["plane", "long a", ["plan", "pan", "pin"]],
  ["smile", "long i", ["smell", "small", "spill"]],
  ["stone", "long o", ["stop", "stem", "stamp"]],
  ["flute", "long u", ["flat", "flip", "flop"]],
  ["theme", "long e", ["them", "then", "thin"]]
].forEach(([answer, sound, wrongs], i) => {
  add({
    id: `exp5_long_vowel_${i + 1}`,
    grade: "1",
    skill: "long vowels",
    difficulty: 3,
    question: `Which word has the ${sound} sound?`,
    choices: choices(answer, wrongs),
    answer
  });
});

// Extra vowel teams
[
  ["snail", "ai", ["snell", "snill", "snoll"]],
  ["toast", "oa", ["test", "tist", "tust"]],
  ["green", "ee", ["gran", "grin", "gron"]],
  ["dream", "ea", ["drum", "dram", "drom"]],
  ["tray", "ay", ["try", "tree", "true"]]
].forEach(([answer, team, wrongs], i) => {
  add({
    id: `exp5_vowel_team_${i + 1}`,
    grade: "2",
    skill: "vowel teams",
    difficulty: 4,
    question: `Which word has the ${team} vowel team?`,
    choices: choices(answer, wrongs),
    answer
  });
});

// Extra comprehension
const comp = [
  ["key details", "The brown dog chased a red ball.", "What color was the ball?", "red", ["red", "blue", "green", "yellow"]],
  ["key details", "Ella put her pencil in the desk.", "Where did Ella put her pencil?", "in the desk", ["in the desk", "on the roof", "under the bed", "beside the tree"]],
  ["sequencing", "First, Dan washed the apple. Then he cut it. Last, he ate it.", "What did Dan do first?", "washed the apple", ["washed the apple", "cut it", "ate it", "dropped it"]],
  ["sequencing", "The girl found paper. Then she drew a flower. Last, she colored it.", "What happened after she found paper?", "she drew a flower", ["she drew a flower", "she colored it", "she slept", "she cooked"]],
  ["main idea", "Fish swim in water. Fish have fins. Many fish lay eggs.", "What is this mostly about?", "fish", ["fish", "dogs", "cars", "books"]],
  ["main idea", "Doctors help sick people. They check bodies and give medicine.", "What is this mostly about?", "doctors", ["doctors", "farmers", "drivers", "artists"]],
  ["cause and effect", "The pencil broke, so Mia sharpened it.", "Why did Mia sharpen the pencil?", "it broke", ["it broke", "it was wet", "it was food", "it was new"]],
  ["cause and effect", "The bell rang, so the children lined up.", "Why did the children line up?", "the bell rang", ["the bell rang", "it snowed", "they were sleeping", "the lights were off"]],
  ["context clues", "The puppy was delighted when it saw its owner and wagged its tail.", "What does delighted mean?", "very happy", ["very happy", "very angry", "very tired", "very cold"]],
  ["context clues", "The heavy box was difficult to lift.", "What does difficult mean?", "hard to do", ["hard to do", "easy to eat", "funny", "blue"]],
  ["theme", "Amy helped clean up even though the mess was not hers.", "What lesson does this teach?", "helping is kind", ["helping is kind", "messes are toys", "never clean", "books are loud"]],
  ["theme", "Jack kept practicing until he could ride the bike.", "What lesson does this teach?", "practice helps", ["practice helps", "bikes are food", "never try", "wheels are soft"]]
];

comp.forEach(([skill, passage, question, answer, wrongs], i) => {
  add({
    id: `exp5_comp_${i + 1}`,
    grade: "2",
    skill,
    difficulty:
      skill === "theme" ? 5 :
      skill === "context clues" ? 4 :
      skill === "cause and effect" ? 4 :
      skill === "main idea" ? 4 :
      3,
    passage,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

fs.writeFileSync(
  "src/data/templateExpansion5.js",
  `export const templateExpansion5 = ${JSON.stringify(questions, null, 2)};\n`
);

console.log("Template expansion 5 created:", questions.length);
