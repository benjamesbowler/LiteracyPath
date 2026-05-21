import fs from "fs";

const questions = [];

function add(q) {
  questions.push({
    id: q.id,
    grade: q.grade || "2",
    skill: q.skill,
    difficulty: q.difficulty || 3,
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

// More short vowel discrimination
[
  ["cat", "mat", ["met", "mit", "mop"]],
  ["bag", "map", ["mop", "mug", "men"]],
  ["pet", "red", ["rad", "rid", "rod"]],
  ["hen", "pen", ["pan", "pin", "pun"]],
  ["pig", "sit", ["sat", "set", "sot"]],
  ["fin", "pin", ["pan", "pen", "pun"]],
  ["dog", "hop", ["hip", "hap", "hep"]],
  ["fox", "box", ["bag", "big", "bug"]],
  ["cup", "sun", ["sat", "set", "sit"]],
  ["bug", "rug", ["rag", "rig", "rog"]],
  ["map", "tap", ["tip", "top", "tup"]],
  ["bed", "pen", ["pan", "pin", "pun"]],
  ["log", "pot", ["pat", "pit", "pet"]],
  ["mud", "cup", ["cap", "cop", "cip"]],
  ["jam", "hat", ["hit", "hot", "hut"]]
].forEach(([target, answer, wrongs], i) => {
  add({
    id: `exp4_short_vowel_${i + 1}`,
    grade: "K",
    skill: "short vowel discrimination",
    difficulty: 2,
    question: `Which word has the same middle sound as ${target}?`,
    choices: choices(answer, wrongs),
    answer
  });
});

// More prepositions
[
  ["cat", "in the box", "/images/prepositions/cat_in_box.png", ["in the box", "under the box", "beside the box", "behind the box"]],
  ["dog", "under the table", "/images/prepositions/dog_under_table.png", ["under the table", "on the table", "behind the table", "beside the table"]],
  ["ball", "on the chair", "/images/prepositions/ball_on_chair.png", ["on the chair", "under the chair", "behind the chair", "beside the chair"]],
  ["rabbit", "beside the basket", "/images/prepositions/rabbit_beside_basket.png", ["beside the basket", "inside the basket", "under the basket", "behind the basket"]],
  ["bear", "behind the tree", "/images/prepositions/bear_behind_tree.png", ["behind the tree", "under the tree", "in front of the tree", "beside the tree"]],
  ["cup", "between the books", "/images/prepositions/cup_between_books.png", ["between the books", "under the books", "behind the books", "above the books"]],
  ["bird", "above the tree", "/images/prepositions/bird_above_tree.png", ["above the tree", "under the tree", "inside the tree", "beside the tree"]],
  ["shoes", "near the door", "/images/prepositions/shoes_near_door.png", ["near the door", "inside the door", "above the door", "between the door"]],
  ["goat", "inside the barn", "/images/prepositions/goat_inside_barn.png", ["inside the barn", "outside the barn", "above the barn", "under the barn"]],
  ["duck", "outside the pond", "/images/prepositions/duck_outside_pond.png", ["outside the pond", "inside the pond", "under the pond", "behind the pond"]]
].forEach(([thing, answer, imagePath, wrongs], i) => {
  const verb = thing === "shoes" ? "are" : "is";

  add({
    id: `exp4_prep_${i + 1}`,
    grade: "K",
    skill: "prepositions",
    difficulty: 1,
    questionType: "image_choice",
    imagePath,
    question: `Where ${verb} the ${thing}?`,
    choices: wrongs,
    answer
  });
});

// More homophones
[
  ["Which word means not old?", "new", ["knew", "now", "no"]],
  ["Which word means already understood something?", "knew", ["new", "now", "no"]],
  ["Which word means a flower?", "flower", ["flour", "floor", "flow"]],
  ["Which word is used to bake bread?", "flour", ["flower", "floor", "flow"]],
  ["Which word means right?", "correct", ["write", "rite", "right"]],
  ["Which word means to put words on paper?", "write", ["right", "rite", "correct"]],
  ["Which word means not left?", "right", ["write", "rite", "bright"]],
  ["Which word means to meet someone?", "meet", ["meat", "mitt", "met"]],
  ["Which word is food?", "meat", ["meet", "mitt", "met"]],
  ["Which word means a place to buy things?", "store", ["stair", "stare", "story"]]
].forEach(([question, answer, wrongs], i) => {
  add({
    id: `exp4_homophone_${i + 1}`,
    grade: "2",
    skill: "homophones",
    difficulty: 4,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

// More comprehension subskills
const items = [
  ["key details", "Jade carried a yellow lunchbox to school.", "What color was Jade's lunchbox?", "yellow", ["yellow", "blue", "red", "green"]],
  ["key details", "The rabbit hid behind the bush.", "Where did the rabbit hide?", "behind the bush", ["behind the bush", "in the pond", "under the bed", "on the roof"]],
  ["key details", "Marco ate soup for dinner.", "What did Marco eat?", "soup", ["soup", "cake", "rice", "apple"]],
  ["key details", "The children built a tall tower with blocks.", "What did the children build?", "a tower", ["a tower", "a boat", "a tree", "a cake"]],
  ["key details", "The bird made a nest in the tree.", "Where was the nest?", "in the tree", ["in the tree", "under the table", "on the road", "beside the shoe"]],

  ["sequencing", "First, Zoe opened the box. Next, she took out a toy. Last, she played with it.", "What did Zoe do last?", "played with the toy", ["played with the toy", "opened the box", "took out a toy", "washed a plate"]],
  ["sequencing", "Max woke up. Then he brushed his teeth. After that, he ate breakfast.", "What did Max do after waking up?", "brushed his teeth", ["brushed his teeth", "ate breakfast", "went swimming", "read a map"]],
  ["sequencing", "The girl mixed the paint. Then she painted a picture. Last, she cleaned the brush.", "What happened after she mixed the paint?", "she painted a picture", ["she painted a picture", "she cleaned the brush", "she ate lunch", "she rode a bike"]],
  ["sequencing", "First, the class read a story. Next, they drew a picture. Last, they shared their work.", "What did the class do next?", "drew a picture", ["drew a picture", "read a story", "shared their work", "went to sleep"]],
  ["sequencing", "A seed was planted. It got sun and water. Then it grew into a flower.", "What happened before it grew?", "it got sun and water", ["it got sun and water", "it flew away", "it turned into a chair", "it cooked dinner"]],

  ["main idea", "Frogs live near water. Frogs can jump. Frogs eat insects.", "What is this mostly about?", "frogs", ["frogs", "cats", "cars", "books"]],
  ["main idea", "People wear coats, hats, and gloves when it is cold.", "What is this mostly about?", "clothes for cold weather", ["clothes for cold weather", "summer games", "school lunch", "pet food"]],
  ["main idea", "A garden needs soil, water, sunlight, and care.", "What is this mostly about?", "taking care of a garden", ["taking care of a garden", "driving a car", "reading a book", "playing music"]],
  ["main idea", "Firefighters help people. They put out fires and keep people safe.", "What is this mostly about?", "what firefighters do", ["what firefighters do", "how birds fly", "how to make soup", "where fish swim"]],
  ["main idea", "Buses take people to school, work, and other places.", "What is this mostly about?", "what buses do", ["what buses do", "how trees grow", "why cats sleep", "what rain feels like"]],

  ["cause and effect", "Liam stayed up late. He felt tired at school.", "Why did Liam feel tired?", "he stayed up late", ["he stayed up late", "he ate breakfast", "he wore shoes", "he read a sign"]],
  ["cause and effect", "The cup fell on the floor. Water spilled everywhere.", "Why did water spill?", "the cup fell", ["the cup fell", "the sun came out", "the dog slept", "the book opened"]],
  ["cause and effect", "The girl practiced the song many times. She sang it well.", "Why did she sing well?", "she practiced many times", ["she practiced many times", "she lost the song", "she closed the door", "she dropped the toy"]],
  ["cause and effect", "The window was open during the storm. Rain came inside.", "Why did rain come inside?", "the window was open", ["the window was open", "the room was dry", "the storm stopped", "the chair was blue"]],
  ["cause and effect", "The boy watered the plant every day. The plant grew tall.", "Why did the plant grow tall?", "it got water every day", ["it got water every day", "it stayed in a box", "it had no sun or water", "it was made of paper"]],

  ["context clues", "The tiny ant walked beside the enormous elephant.", "What does enormous mean?", "very large", ["very large", "very small", "very sleepy", "very wet"]],
  ["context clues", "The icy wind made Maya zip up her coat.", "What does icy mean?", "very cold", ["very cold", "very loud", "very soft", "very sweet"]],
  ["context clues", "The children giggled when the clown made a silly face.", "What does giggled mean?", "laughed softly", ["laughed softly", "cried loudly", "ran quickly", "slept deeply"]],
  ["context clues", "The path was narrow, so only one child could walk through at a time.", "What does narrow mean?", "not wide", ["not wide", "very tall", "very loud", "full of water"]],
  ["context clues", "The old rope was weak and snapped when pulled.", "What does snapped mean?", "broke suddenly", ["broke suddenly", "became longer", "turned blue", "made food"]],

  ["theme", "Mia dropped her blocks but rebuilt the tower again and again.", "What lesson does this teach?", "do not give up", ["do not give up", "blocks are food", "never build things", "mistakes are impossible"]],
  ["theme", "Leo helped a new student find the classroom.", "What lesson does this teach?", "helping others is kind", ["helping others is kind", "new students are maps", "classrooms are outside", "never help anyone"]],
  ["theme", "Nora told her teacher she broke the crayon by accident.", "What lesson does this teach?", "tell the truth", ["tell the truth", "hide mistakes", "never use crayons", "teachers cannot listen"]],
  ["theme", "The team won because everyone shared ideas and worked together.", "What lesson does this teach?", "teamwork is important", ["teamwork is important", "only one person matters", "ideas are bad", "games are books"]],
  ["theme", "Owen was scared to try, but he took a deep breath and joined the game.", "What lesson does this teach?", "being brave can help", ["being brave can help", "games are scary forever", "never try new things", "breathing is a toy"]]
];

items.forEach(([skill, passage, question, answer, wrongs], i) => {
  add({
    id: `exp4_comp_${i + 1}`,
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
  "src/data/templateExpansion4.js",
  `export const templateExpansion4 = ${JSON.stringify(questions, null, 2)};\n`
);

console.log("Template expansion 4 created:", questions.length);
