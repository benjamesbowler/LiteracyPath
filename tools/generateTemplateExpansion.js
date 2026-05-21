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

const hfw1 = [
  "the","to","and","a","I","you","it","in","said","for",
  "up","look","is","go","we","little","down","can","see","not",
  "one","my","me","big","come"
];

hfw1.forEach((word, i) => {
  add({
    id: `template_hfw_1_25_${i + 1}`,
    grade: "K",
    skill: "high-frequency words 1-25",
    difficulty: 1,
    question: `Which word is "${word}"?`,
    choices: [word, `${word}x`, word.split("").reverse().join(""), word[0] + word],
    answer: word
  });
});

const hfw2 = [
  "blue","red","where","jump","away","here","help","make","two","play",
  "run","find","three","funny","yellow","then","they","was","all","but",
  "that","with","are","he","she"
];

hfw2.forEach((word, i) => {
  add({
    id: `template_hfw_26_50_${i + 1}`,
    grade: "K",
    skill: "high-frequency words 26-50",
    difficulty: 2,
    question: `Which word is "${word}"?`,
    choices: [word, `${word}e`, word.slice(1) + word[0], word + word[0]],
    answer: word
  });
});

const blends = [
  ["blue", "bl", ["blue", "due", "glue", "clue"]],
  ["flag", "fl", ["flag", "bag", "tag", "rag"]],
  ["frog", "fr", ["frog", "dog", "log", "hog"]],
  ["stop", "st", ["stop", "top", "hop", "mop"]],
  ["clap", "cl", ["clap", "cap", "lap", "map"]],
  ["grin", "gr", ["grin", "pin", "win", "tin"]],
  ["drum", "dr", ["drum", "gum", "sum", "hum"]],
  ["truck", "tr", ["truck", "duck", "luck", "muck"]],
  ["snail", "sn", ["snail", "mail", "tail", "pail"]],
  ["crab", "cr", ["crab", "cab", "tab", "lab"]]
];

blends.forEach(([word, blend, choices], i) => {
  add({
    id: `template_blend_${i + 1}`,
    grade: "1",
    skill: "blends",
    difficulty: 2,
    question: `Which word begins with the ${blend} blend?`,
    choices,
    answer: word
  });
});

const digraphs = [
  ["ship", "sh", ["ship", "sip", "tip", "lip"]],
  ["chop", "ch", ["chop", "top", "hop", "mop"]],
  ["thin", "th", ["thin", "pin", "win", "fin"]],
  ["whale", "wh", ["whale", "tail", "mail", "pail"]],
  ["shop", "sh", ["shop", "top", "pop", "mop"]],
  ["chair", "ch", ["chair", "hair", "fair", "pair"]],
  ["this", "th", ["this", "miss", "kiss", "hiss"]]
];

digraphs.forEach(([word, digraph, choices], i) => {
  add({
    id: `template_digraph_${i + 1}`,
    grade: "1",
    skill: "digraphs",
    difficulty: 3,
    question: `Which word begins with the ${digraph} sound?`,
    choices,
    answer: word
  });
});

const longVowels = [
  ["cake", "long a", ["cake", "cat", "cap", "can"]],
  ["bike", "long i", ["bike", "big", "bit", "bin"]],
  ["home", "long o", ["home", "hop", "hot", "hog"]],
  ["cube", "long u", ["cube", "cup", "cut", "cub"]],
  ["time", "long i", ["time", "tin", "tip", "sit"]]
];

longVowels.forEach(([word, sound, choices], i) => {
  add({
    id: `template_long_vowel_${i + 1}`,
    grade: "1",
    skill: "long vowels",
    difficulty: 3,
    question: `Which word has the ${sound} sound?`,
    choices,
    answer: word
  });
});

const vowelTeams = [
  ["rain", "ai", ["rain", "ran", "rim", "run"]],
  ["boat", "oa", ["boat", "bat", "bit", "but"]],
  ["seed", "ee", ["seed", "sad", "sit", "sun"]],
  ["leaf", "ea", ["leaf", "left", "lift", "loft"]],
  ["train", "ai", ["train", "tin", "tan", "ten"]]
];

vowelTeams.forEach(([word, team, choices], i) => {
  add({
    id: `template_vowel_team_${i + 1}`,
    grade: "2",
    skill: "vowel teams",
    difficulty: 4,
    question: `Which word has the ${team} vowel team?`,
    choices,
    answer: word
  });
});

const grammar = [
  ["noun", "Which word names a person, place, or thing?", "book", ["book", "run", "happy", "quickly"]],
  ["noun", "Which word is a noun?", "teacher", ["teacher", "jump", "blue", "slowly"]],
  ["verb", "Which word is an action?", "jump", ["jump", "table", "red", "small"]],
  ["verb", "Which word is a verb?", "run", ["run", "chair", "yellow", "quiet"]],
  ["adjective", "Which word describes the dog?", "small", ["small", "dog", "ran", "quickly"]],
  ["adjective", "Which word is an adjective?", "happy", ["happy", "child", "sit", "under"]]
];

grammar.forEach(([skill, question, answer, choices], i) => {
  add({
    id: `template_grammar_${i + 1}`,
    grade: "1",
    skill: skill === "noun" ? "nouns" : skill === "verb" ? "verbs" : "adjectives",
    difficulty: 2,
    question,
    choices,
    answer
  });
});

const homophones = [
  ["Which word means the number 2?", "two", ["two", "too", "to", "toe"]],
  ["Which word means also?", "too", ["too", "two", "to", "toe"]],
  ["Which word is something you hear with?", "ear", ["ear", "here", "hear", "air"]],
  ["Which word means to listen?", "hear", ["hear", "here", "hair", "ear"]]
];

homophones.forEach(([question, answer, choices], i) => {
  add({
    id: `template_homophone_${i + 1}`,
    grade: "2",
    skill: "homophones",
    difficulty: 4,
    question,
    choices,
    answer
  });
});

const comprehension = [
  {
    id: "template_detail_1",
    skill: "key details",
    passage: "Mia has a red kite. She flies it at the park.",
    question: "What color is Mia's kite?",
    answer: "red",
    choices: ["red", "blue", "green", "yellow"],
    difficulty: 2
  },
  {
    id: "template_sequence_1",
    skill: "sequencing",
    passage: "First, Ben put on his shoes. Next, he got his bag. Last, he went to school.",
    question: "What did Ben do first?",
    answer: "put on his shoes",
    choices: ["put on his shoes", "got his bag", "went to school", "ate lunch"],
    difficulty: 3
  },
  {
    id: "template_main_idea_1",
    skill: "main idea",
    passage: "Dogs need food, water, exercise, and love. A dog owner must take care of a dog every day.",
    question: "What is this mostly about?",
    answer: "taking care of dogs",
    choices: ["taking care of dogs", "buying toys", "going to school", "playing soccer"],
    difficulty: 4
  },
  {
    id: "template_cause_1",
    skill: "cause and effect",
    passage: "The rain fell all morning. The playground was wet.",
    question: "Why was the playground wet?",
    answer: "because it rained",
    choices: ["because it rained", "because it was sunny", "because it was painted", "because children ran"],
    difficulty: 4
  },
  {
    id: "template_context_1",
    skill: "context clues",
    passage: "The tiny kitten was trembling during the thunderstorm. It hid under the chair.",
    question: "What does trembling probably mean?",
    answer: "shaking",
    choices: ["shaking", "eating", "sleeping", "jumping"],
    difficulty: 4
  },
  {
    id: "template_theme_1",
    skill: "theme",
    passage: "Lena tried to build a tower. It fell down twice. She tried again, and finally it stood tall.",
    question: "What lesson does Lena learn?",
    answer: "keep trying",
    choices: ["keep trying", "never build", "towers are bad", "stop learning"],
    difficulty: 5
  }
];

comprehension.forEach(q => add({ grade: "2", ...q }));

fs.writeFileSync(
  "src/data/templateExpansion.js",
  `export const templateExpansion = ${JSON.stringify(questions, null, 2)};\n`
);

console.log("Template expansion created:", questions.length);
