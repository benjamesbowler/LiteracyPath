import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

/* =========================
   EXTRA FOUNDATIONAL SKILLS
========================= */

[
  ["Which word begins with the /b/ sound?", "ball", ["cat", "sun", "fish"]],
  ["Which word begins with the /m/ sound?", "map", ["dog", "sun", "fish"]],
  ["Which word begins with the /t/ sound?", "top", ["dog", "fish", "sun"]],
  ["Which word begins with the /p/ sound?", "pen", ["dog", "cat", "sun"]],
  ["Which word begins with the /l/ sound?", "leg", ["dog", "fish", "cat"]],
  ["Which word ends with the /t/ sound?", "hat", ["ham", "had", "hag"]],
  ["Which word ends with the /n/ sound?", "pen", ["pet", "peg", "pep"]],
  ["Which word ends with the /p/ sound?", "map", ["mat", "man", "mad"]],
  ["Which word ends with the /g/ sound?", "bag", ["bat", "ban", "bad"]],
  ["Which word ends with the /d/ sound?", "bed", ["bet", "beg", "ben"]],
  ["Which word rhymes with red?", "bed", ["cat", "dog", "sun"]],
  ["Which word rhymes with run?", "fun", ["dog", "cat", "fish"]],
  ["Which word rhymes with map?", "cap", ["dog", "sun", "fish"]],
  ["Which word rhymes with ten?", "pen", ["dog", "cat", "fish"]],
  ["Which word rhymes with hill?", "will", ["dog", "sun", "cat"]]
].forEach(([question, answer, wrongs], i) => {
  let skill = "initial sounds";
  if (question.includes("ends")) skill = "final sounds";
  if (question.includes("rhymes")) skill = "rhyming";
  add({
    id: `exp6_foundation_${i + 1}`,
    grade: "K",
    skill,
    difficulty: 1,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

/* =========================
   HFW 1-100 EXTRA
========================= */

[
  "after","again","an","any","ask","as","by","could","every","fly",
  "from","give","going","had","has","her","him","his","how","just",
  "know","let","live","may","of","old","once","open","over","put",
  "round","some","stop","take","thank","them","think","walk","were","when"
].forEach((word, i) => {
  add({
    id: `exp6_hfw_extra_${i + 1}`,
    grade: "1",
    skill: "high-frequency words 51-100",
    difficulty: 2,
    question: `Which word is "${word}"?`,
    choices: [word, word + "e", word.split("").reverse().join(""), word[0] + word],
    answer: word
  });
});

/* =========================
   PHONICS PATTERN EXTRA
========================= */

[
  ["Which word has the bl blend?", "black", ["back", "lack", "pack"]],
  ["Which word has the fl blend?", "flower", ["lower", "tower", "power"]],
  ["Which word has the st blend?", "star", ["tar", "car", "far"]],
  ["Which word has the tr blend?", "tree", ["free", "see", "bee"]],
  ["Which word has the cr blend?", "crab", ["cab", "tab", "lab"]],
  ["Which word begins with the sh sound?", "shoe", ["sue", "two", "blue"]],
  ["Which word begins with the ch sound?", "cheese", ["bees", "knees", "sees"]],
  ["Which word begins with the th sound?", "thumb", ["drum", "gum", "plum"]],
  ["Which word begins with the wh sound?", "wheel", ["feel", "peel", "heel"]],
  ["Which word begins with the ph sound?", "phone", ["cone", "bone", "stone"]],
  ["Which word has the long a sound?", "snake", ["snack", "stack", "stick"]],
  ["Which word has the long i sound?", "shine", ["shin", "ship", "shop"]],
  ["Which word has the long o sound?", "stone", ["stand", "sting", "stung"]],
  ["Which word has the long u sound?", "June", ["jump", "junk", "just"]],
  ["Which word has the long e sound?", "these", ["this", "thin", "then"]],
  ["Which word has the ai vowel team?", "paint", ["pant", "punt", "pent"]],
  ["Which word has the oa vowel team?", "float", ["flat", "flit", "flop"]],
  ["Which word has the ee vowel team?", "green", ["gran", "grin", "grown"]],
  ["Which word has the ea vowel team?", "dream", ["drum", "dram", "drop"]],
  ["Which word has the ay vowel team?", "play", ["ply", "plan", "plum"]],
  ["Which word has the ar r-controlled sound?", "farm", ["fan", "fun", "fin"]],
  ["Which word has the er r-controlled sound?", "fern", ["fan", "fun", "fin"]],
  ["Which word has the ir r-controlled sound?", "bird", ["bed", "bad", "bud"]],
  ["Which word has the or r-controlled sound?", "storm", ["stem", "steam", "stamp"]],
  ["Which word has the ur r-controlled sound?", "turn", ["tan", "tin", "ten"]]
].forEach(([question, answer, wrongs], i) => {
  let skill = "blends";
  if (question.includes("sh") || question.includes("ch") || question.includes("th") || question.includes("wh") || question.includes("ph")) skill = "digraphs";
  if (question.includes("long")) skill = "long vowels";
  if (question.includes("vowel team")) skill = "vowel teams";
  if (question.includes("r-controlled")) skill = "r-controlled vowels";
  add({
    id: `exp6_phonics_${i + 1}`,
    grade: "1",
    skill,
    difficulty: skill === "blends" ? 2 : skill === "digraphs" ? 3 : 4,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

/* =========================
   GRAMMAR / LANGUAGE EXTRA
========================= */

[
  ["Which word is a noun?", "garden", ["jump", "bright", "quickly"], "nouns"],
  ["Which word is a noun?", "doctor", ["run", "blue", "slowly"], "nouns"],
  ["Which word is a noun?", "school", ["play", "soft", "inside"], "nouns"],
  ["Which word is a verb?", "clap", ["hands", "loud", "beside"], "verbs"],
  ["Which word is a verb?", "paint", ["brush", "green", "under"], "verbs"],
  ["Which word is a verb?", "think", ["head", "quiet", "near"], "verbs"],
  ["Which word is an adjective?", "brave", ["child", "stand", "behind"], "adjectives"],
  ["Which word is an adjective?", "smooth", ["stone", "roll", "under"], "adjectives"],
  ["Which word is an adjective?", "bright", ["lamp", "shine", "beside"], "adjectives"],
  ["What is the plural of fox?", "foxes", ["foxs", "fox", "foxies"], "plurals"],
  ["What is the plural of leaf?", "leaves", ["leafs", "leaf", "leafes"], "plurals"],
  ["What is the plural of bus?", "buses", ["buss", "bus", "busies"], "plurals"],
  ["What does preview mean?", "see before", ["see again", "not see", "full of seeing"], "prefixes and suffixes"],
  ["What does rewrite mean?", "write again", ["not write", "write badly", "full of writing"], "prefixes and suffixes"],
  ["What does thankful mean?", "full of thanks", ["not thankful", "thank again", "without thanks"], "prefixes and suffixes"],
  ["What does fearless mean?", "without fear", ["full of fear", "fear again", "not fear again"], "prefixes and suffixes"],
  ["What is the opposite of early?", "late", ["soon", "fast", "first"], "antonyms"],
  ["What is the opposite of before?", "after", ["again", "near", "under"], "antonyms"],
  ["Which word means almost the same as small?", "tiny", ["huge", "loud", "wet"], "synonyms"],
  ["Which word means almost the same as quick?", "fast", ["slow", "cold", "empty"], "synonyms"],
  ["Which word means a place?", "there", ["their", "they're", "three"], "homophones"],
  ["Which word means belonging to them?", "their", ["there", "they're", "three"], "homophones"],
  ["Which word means they are?", "they're", ["there", "their", "three"], "homophones"]
].forEach(([question, answer, wrongs, skill], i) => {
  add({
    id: `exp6_language_${i + 1}`,
    grade: "2",
    skill,
    difficulty: skill === "homophones" ? 4 : skill.includes("prefix") ? 3 : 2,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

/* =========================
   COMPREHENSION EXTRA
========================= */

const compItems = [
  ["key details", "Milo packed a sandwich and a banana for the trip.", "What fruit did Milo pack?", "a banana", ["a banana", "an apple", "a grape", "an orange"]],
  ["key details", "The red bird sat on the fence and sang.", "Where did the bird sit?", "on the fence", ["on the fence", "under the bed", "in the pond", "beside the car"]],
  ["key details", "Ava used a small brush to paint a flower.", "What did Ava paint?", "a flower", ["a flower", "a dog", "a house", "a cake"]],
  ["key details", "The class visited the library after lunch.", "Where did the class go?", "the library", ["the library", "the beach", "the farm", "the shop"]],
  ["key details", "Ben wore boots because the ground was muddy.", "What did Ben wear?", "boots", ["boots", "sandals", "a hat", "gloves"]],

  ["sequencing", "First, Sam opened the door. Next, he walked inside. Last, he sat down.", "What did Sam do next?", "walked inside", ["walked inside", "sat down", "opened the door", "ate lunch"]],
  ["sequencing", "The girl washed the cup. Then she dried it. Finally, she put it away.", "What did she do after washing the cup?", "dried it", ["dried it", "put it away", "broke it", "filled it"]],
  ["sequencing", "Dad cut the wood. Then he built a shelf. Last, he painted it.", "What happened last?", "he painted it", ["he painted it", "he cut wood", "he built a shelf", "he bought apples"]],
  ["sequencing", "The children lined up, walked to the gym, and started the game.", "What happened before they started the game?", "they walked to the gym", ["they walked to the gym", "they went home", "they ate dinner", "they slept"]],
  ["sequencing", "First, the bird found sticks. Then it made a nest. Later, it laid eggs.", "What did the bird do after finding sticks?", "made a nest", ["made a nest", "laid eggs", "flew away forever", "ate a cake"]],

  ["main idea", "Dentists check teeth. They help keep teeth clean and healthy.", "What is this mostly about?", "what dentists do", ["what dentists do", "how dogs play", "where fish swim", "why birds fly"]],
  ["main idea", "Trains carry people from place to place. They move on tracks.", "What is this mostly about?", "trains", ["trains", "books", "flowers", "cats"]],
  ["main idea", "The moon shines at night. It changes shape during the month.", "What is this mostly about?", "the moon", ["the moon", "the ocean", "a tree", "a bus"]],
  ["main idea", "Farmers grow food. They care for animals and plants.", "What is this mostly about?", "farmers", ["farmers", "doctors", "drivers", "painters"]],
  ["main idea", "Libraries have books. People read, study, and borrow books there.", "What is this mostly about?", "libraries", ["libraries", "parks", "cars", "weather"]],

  ["cause and effect", "The backpack was open, so the books fell out.", "Why did the books fall out?", "the backpack was open", ["the backpack was open", "the books were cold", "the pencil was sharp", "the chair was tall"]],
  ["cause and effect", "Mia missed the bus because she woke up late.", "Why did Mia miss the bus?", "she woke up late", ["she woke up late", "she ate fast", "she wore red", "she saw a dog"]],
  ["cause and effect", "The cookies burned because they stayed in the oven too long.", "Why did the cookies burn?", "they stayed in the oven too long", ["they stayed in the oven too long", "they were on a plate", "they were sweet", "they were round"]],
  ["cause and effect", "The puppy chewed the shoe, so the shoe had holes.", "Why did the shoe have holes?", "the puppy chewed it", ["the puppy chewed it", "the shoe was new", "the shoe was blue", "the puppy slept"]],
  ["cause and effect", "The lights went out because the storm knocked down a wire.", "Why did the lights go out?", "the storm knocked down a wire", ["the storm knocked down a wire", "the room was quiet", "the lamp was pretty", "the window was clean"]],

  ["context clues", "The kitten was curious, so it looked inside every box.", "What does curious mean?", "wanting to know more", ["wanting to know more", "very sleepy", "very angry", "full of water"]],
  ["context clues", "The tower was sturdy and did not fall down.", "What does sturdy mean?", "strong", ["strong", "wet", "tiny", "hungry"]],
  ["context clues", "The baby was drowsy and rubbed his eyes.", "What does drowsy mean?", "sleepy", ["sleepy", "loud", "dirty", "fast"]],
  ["context clues", "The puppy was timid and hid behind its owner.", "What does timid mean?", "shy or nervous", ["shy or nervous", "very hungry", "very tall", "full of paint"]],
  ["context clues", "The path was slippery after the rain.", "What does slippery mean?", "easy to slide on", ["easy to slide on", "very dry", "very loud", "hard to see"]],

  ["theme", "Kai made a mistake but told the teacher the truth.", "What lesson does this teach?", "honesty matters", ["honesty matters", "mistakes are toys", "teachers never listen", "hide the truth"]],
  ["theme", "The children cleaned the park even though it was not their mess.", "What lesson does this teach?", "helping the community is good", ["helping the community is good", "parks are food", "never clean", "trash is fun"]],
  ["theme", "Maya tried a hard puzzle again and again until she solved it.", "What lesson does this teach?", "keep trying", ["keep trying", "give up quickly", "puzzles are bad", "never think"]],
  ["theme", "Leo shared his umbrella with a friend in the rain.", "What lesson does this teach?", "kindness helps others", ["kindness helps others", "rain is always bad", "umbrellas are heavy", "friends never help"]],
  ["theme", "The team listened to each other and solved the problem together.", "What lesson does this teach?", "teamwork helps", ["teamwork helps", "only one person should talk", "problems are toys", "listening is bad"]]
];

compItems.forEach(([skill, passage, question, answer, wrongs], i) => {
  add({
    id: `exp6_comp_${i + 1}`,
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
  "src/data/templateExpansion6.js",
  `export const templateExpansion6 = ${JSON.stringify(questions, null, 2)};\n`
);

console.log("Template expansion 6 created:", questions.length);
