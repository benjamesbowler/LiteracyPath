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

function makeChoices(answer, wrongs) {
  return [answer, ...wrongs].slice(0, 4);
}

// Rhyming
[
  ["cat", "hat", ["dog", "sun", "fish"]],
  ["bug", "rug", ["cat", "pen", "fish"]],
  ["sun", "run", ["dog", "map", "book"]],
  ["bed", "red", ["cup", "dog", "fish"]],
  ["top", "hop", ["sun", "cat", "pen"]],
  ["cake", "lake", ["dog", "fish", "sun"]],
  ["fish", "dish", ["cat", "bug", "pen"]],
  ["king", "ring", ["dog", "cat", "sun"]],
  ["boat", "coat", ["bed", "fish", "map"]],
  ["star", "car", ["dog", "pen", "bug"]]
].forEach(([target, answer, wrongs], i) => {
  add({
    id: `exp2_rhyme_${i + 1}`,
    grade: "K",
    skill: "rhyming",
    difficulty: 1,
    question: `Which word rhymes with ${target}?`,
    choices: makeChoices(answer, wrongs),
    answer
  });
});

// Short vowel discrimination
[
  ["cat", "a", "mat", ["met", "mit", "mop"]],
  ["pet", "e", "red", ["rad", "rid", "rod"]],
  ["pig", "i", "sit", ["sat", "set", "sot"]],
  ["dog", "o", "hop", ["hip", "hap", "hep"]],
  ["sun", "u", "cup", ["cap", "cop", "cip"]],
  ["map", "a", "tap", ["tip", "top", "tup"]],
  ["bed", "e", "pen", ["pan", "pin", "pun"]],
  ["fin", "i", "pin", ["pan", "pen", "pun"]],
  ["pot", "o", "top", ["tap", "tip", "tup"]],
  ["bug", "u", "rug", ["rag", "rig", "rog"]]
].forEach(([target, vowel, answer, wrongs], i) => {
  add({
    id: `exp2_short_vowel_${i + 1}`,
    grade: "K",
    skill: "short vowel discrimination",
    difficulty: 2,
    question: `Which word has the same middle sound as ${target}?`,
    choices: makeChoices(answer, wrongs),
    answer
  });
});

// HFW 51-100
[
  "be","have","will","into","like","must","new","now","our","out",
  "please","pretty","saw","say","soon","this","under","want","well","went",
  "what","white","who","yes","came"
].forEach((word, i) => {
  add({
    id: `exp2_hfw_51_100_${i + 1}`,
    grade: "1",
    skill: "high-frequency words 51-100",
    difficulty: 2,
    question: `Which word is "${word}"?`,
    choices: [word, word + "e", word.split("").reverse().join(""), word[0] + word],
    answer: word
  });
});

// More digraphs
[
  ["ship", "sh", ["sip", "tip", "lip"]],
  ["shell", "sh", ["sell", "fell", "bell"]],
  ["chair", "ch", ["hair", "fair", "pair"]],
  ["chin", "ch", ["pin", "win", "fin"]],
  ["thin", "th", ["tin", "pin", "win"]],
  ["three", "th", ["tree", "free", "see"]],
  ["whale", "wh", ["tail", "mail", "pail"]],
  ["wheel", "wh", ["feel", "peel", "heel"]],
  ["shop", "sh", ["top", "mop", "pop"]],
  ["cheese", "ch", ["bees", "knees", "sees"]]
].forEach(([answer, sound, wrongs], i) => {
  add({
    id: `exp2_digraph_${i + 1}`,
    grade: "1",
    skill: "digraphs",
    difficulty: 3,
    question: `Which word begins with the ${sound} sound?`,
    choices: makeChoices(answer, wrongs),
    answer
  });
});

// Long vowels
[
  ["cake", "long a", ["cat", "cap", "can"]],
  ["gate", "long a", ["get", "got", "gut"]],
  ["bike", "long i", ["big", "bit", "bin"]],
  ["time", "long i", ["tin", "tip", "sit"]],
  ["home", "long o", ["hop", "hot", "hog"]],
  ["rope", "long o", ["rob", "rot", "rod"]],
  ["cube", "long u", ["cup", "cut", "cub"]],
  ["mule", "long u", ["mud", "mug", "mat"]],
  ["these", "long e", ["then", "them", "that"]],
  ["Pete", "long e", ["pet", "pit", "pot"]]
].forEach(([answer, sound, wrongs], i) => {
  add({
    id: `exp2_long_vowel_${i + 1}`,
    grade: "1",
    skill: "long vowels",
    difficulty: 3,
    question: `Which word has the ${sound} sound?`,
    choices: makeChoices(answer, wrongs),
    answer
  });
});

// Vowel teams
[
  ["rain", "ai", ["ran", "run", "rim"]],
  ["train", "ai", ["tin", "tan", "ten"]],
  ["boat", "oa", ["bat", "bit", "but"]],
  ["road", "oa", ["rod", "red", "rid"]],
  ["seed", "ee", ["sad", "sit", "sun"]],
  ["feet", "ee", ["fit", "fat", "fog"]],
  ["leaf", "ea", ["left", "lift", "loft"]],
  ["beach", "ea", ["bench", "bunch", "back"]],
  ["play", "ay", ["ply", "payd", "plan"]],
  ["day", "ay", ["dad", "did", "dog"]]
].forEach(([answer, team, wrongs], i) => {
  add({
    id: `exp2_vowel_team_${i + 1}`,
    grade: "2",
    skill: "vowel teams",
    difficulty: 4,
    question: `Which word has the ${team} vowel team?`,
    choices: makeChoices(answer, wrongs),
    answer
  });
});

// R-controlled vowels
[
  ["car", "ar", ["cat", "cap", "can"]],
  ["star", "ar", ["sat", "sit", "set"]],
  ["bird", "ir", ["bad", "bed", "bud"]],
  ["girl", "ir", ["gold", "gate", "gum"]],
  ["corn", "or", ["can", "cot", "cut"]],
  ["fork", "or", ["fish", "fan", "fun"]],
  ["turn", "ur", ["tan", "tin", "ten"]],
  ["burn", "ur", ["bin", "bun", "ban"]],
  ["her", "er", ["he", "here", "hair"]],
  ["fern", "er", ["fan", "fun", "fin"]]
].forEach(([answer, pattern, wrongs], i) => {
  add({
    id: `exp2_r_controlled_${i + 1}`,
    grade: "2",
    skill: "r-controlled vowels",
    difficulty: 4,
    question: `Which word has the ${pattern} r-controlled vowel sound?`,
    choices: makeChoices(answer, wrongs),
    answer
  });
});

// More grammar
[
  ["verbs", "Which word is an action?", "swim", ["swim", "chair", "blue", "small"]],
  ["verbs", "Which word is a verb?", "eat", ["eat", "table", "yellow", "soft"]],
  ["verbs", "Which word tells what someone can do?", "read", ["read", "book", "happy", "under"]],
  ["verbs", "Which word is an action word?", "jump", ["jump", "dog", "red", "quiet"]],
  ["adjectives", "Which word describes size?", "tiny", ["tiny", "run", "desk", "under"]],
  ["adjectives", "Which word describes color?", "green", ["green", "jump", "table", "quickly"]],
  ["adjectives", "Which word describes how something feels?", "soft", ["soft", "dog", "sit", "behind"]],
  ["adjectives", "Which word describes the cake?", "sweet", ["sweet", "cake", "eat", "slowly"]]
].forEach(([skill, question, answer, choices], i) => {
  add({
    id: `exp2_grammar_${i + 1}`,
    grade: "1",
    skill,
    difficulty: 2,
    question,
    choices,
    answer
  });
});

// Prepositions, no passage, image-based
[
  ["cat", "in the box", "/images/prepositions/cat_in_box.png", ["in the box", "under the box", "beside the box", "behind the box"]],
  ["dog", "under the table", "/images/prepositions/dog_under_table.png", ["under the table", "on the table", "beside the table", "behind the table"]],
  ["ball", "on the chair", "/images/prepositions/ball_on_chair.png", ["on the chair", "under the chair", "behind the chair", "beside the chair"]],
  ["rabbit", "beside the basket", "/images/prepositions/rabbit_beside_basket.png", ["beside the basket", "inside the basket", "under the basket", "behind the basket"]],
  ["bear", "behind the tree", "/images/prepositions/bear_behind_tree.png", ["behind the tree", "in the tree", "under the tree", "beside the tree"]],
  ["cup", "between the books", "/images/prepositions/cup_between_books.png", ["between the books", "under the books", "behind the books", "above the books"]]
].forEach(([thing, answer, imagePath, choices], i) => {
  const verb = thing === "shoes" ? "are" : "is";

  add({
    id: `exp2_prep_${i + 1}`,
    grade: "K",
    skill: "prepositions",
    difficulty: 1,
    questionType: "image_choice",
    imagePath,
    question: `Where ${verb} the ${thing}?`,
    choices,
    answer
  });
});

// More comprehension subskills
[
  ["key details", "Nina packed a sandwich, an apple, and water for lunch.", "What did Nina pack to drink?", "water", ["water", "milk", "juice", "tea"]],
  ["key details", "The turtle moved slowly across the grass.", "How did the turtle move?", "slowly", ["slowly", "quickly", "loudly", "angrily"]],
  ["sequencing", "First, Ava washed her hands. Next, she ate lunch. Last, she cleaned her plate.", "What did Ava do next?", "ate lunch", ["ate lunch", "washed hands", "cleaned her plate", "went to sleep"]],
  ["sequencing", "Tom planted a seed. Then he watered it. Later, a small plant grew.", "What happened after Tom planted the seed?", "he watered it", ["he watered it", "a bird flew", "he ate it", "it snowed"]],
  ["main idea", "Birds have wings. Many birds fly. Birds build nests and lay eggs.", "What is this mostly about?", "birds", ["birds", "fish", "trees", "dogs"]],
  ["main idea", "Apples can be red, green, or yellow. They grow on trees. Many people eat apples as a snack.", "What is this mostly about?", "apples", ["apples", "cars", "books", "rain"]],
  ["cause and effect", "The boy forgot his umbrella. He got wet in the rain.", "Why did the boy get wet?", "he forgot his umbrella", ["he forgot his umbrella", "he wore boots", "he had a hat", "he stayed inside"]],
  ["cause and effect", "The vase fell off the table. It broke on the floor.", "Why did the vase break?", "it fell off the table", ["it fell off the table", "it was new", "it was blue", "it was full"]],
  ["context clues", "The huge elephant stood beside the tiny mouse.", "What does huge mean?", "very big", ["very big", "very small", "very cold", "very quiet"]],
  ["context clues", "The tired puppy yawned and fell asleep.", "What does tired mean?", "needing rest", ["needing rest", "very angry", "very wet", "full of food"]],
  ["theme", "Max made a mistake on his drawing. He tried again and made it better.", "What lesson does Max learn?", "keep trying", ["keep trying", "give up", "hide mistakes", "never draw"]],
  ["theme", "Sara shared her crayons with a friend. Her friend smiled and helped her later.", "What lesson does the story teach?", "being kind helps others", ["being kind helps others", "crayons are heavy", "friends never share", "colors are loud"]]
].forEach(([skill, passage, question, answer, choices], i) => {
  add({
    id: `exp2_comp_${i + 1}`,
    grade: "2",
    skill,
    difficulty: skill === "theme" ? 5 : skill === "context clues" ? 4 : 3,
    passage,
    question,
    choices,
    answer
  });
});

fs.writeFileSync(
  "src/data/templateExpansion2.js",
  `export const templateExpansion2 = ${JSON.stringify(questions, null, 2)};\n`
);

console.log("Template expansion 2 created:", questions.length);
