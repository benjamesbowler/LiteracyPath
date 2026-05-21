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

// R-controlled vowels
[
  ["car", "ar", ["cat", "cap", "can"]],
  ["star", "ar", ["sat", "sit", "set"]],
  ["park", "ar", ["pack", "pick", "peck"]],
  ["bird", "ir", ["bad", "bed", "bud"]],
  ["girl", "ir", ["gold", "gate", "gum"]],
  ["shirt", "ir", ["shot", "shut", "sheet"]],
  ["corn", "or", ["can", "cot", "cut"]],
  ["fork", "or", ["fish", "fan", "fun"]],
  ["storm", "or", ["stem", "steam", "stamp"]],
  ["turn", "ur", ["tan", "tin", "ten"]],
  ["burn", "ur", ["bin", "bun", "ban"]],
  ["nurse", "ur", ["nose", "nice", "near"]],
  ["her", "er", ["he", "here", "hair"]],
  ["fern", "er", ["fan", "fun", "fin"]],
  ["teacher", "er", ["teach", "touch", "team"]]
].forEach(([answer, pattern, wrongs], i) => {
  add({
    id: `exp3_r_controlled_${i + 1}`,
    grade: "2",
    skill: "r controlled vowels",
    difficulty: 4,
    question: `Which word has the ${pattern} r controlled vowel sound?`,
    choices: choices(answer, wrongs),
    answer
  });
});

// Verbs
[
  ["Which word is an action?", "climb", ["tree", "blue", "happy"]],
  ["Which word is a verb?", "write", ["pencil", "red", "small"]],
  ["Which word tells what someone can do?", "dance", ["music", "green", "quiet"]],
  ["Which word is an action word?", "throw", ["ball", "round", "under"]],
  ["Which word is a verb?", "sleep", ["bed", "soft", "yellow"]],
  ["Which word shows an action?", "build", ["blocks", "tall", "beside"]],
  ["Which word tells what the child does?", "draw", ["paper", "purple", "slow"]],
  ["Which word is an action?", "swim", ["water", "cold", "near"]],
  ["Which word is a verb?", "listen", ["ears", "loud", "behind"]],
  ["Which word shows something you can do?", "read", ["book", "new", "inside"]],
  ["Which word is an action?", "kick", ["shoe", "black", "tiny"]],
  ["Which word is a verb?", "cook", ["pan", "hot", "clean"]],
  ["Which word tells an action?", "wash", ["hands", "wet", "white"]],
  ["Which word is a verb?", "open", ["door", "brown", "big"]],
  ["Which word shows action?", "carry", ["bag", "heavy", "round"]]
].forEach(([question, answer, wrongs], i) => {
  add({
    id: `exp3_verb_${i + 1}`,
    grade: "1",
    skill: "verbs",
    difficulty: 2,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

// Adjectives
[
  ["Which word describes size?", "huge", ["run", "table", "under"]],
  ["Which word describes color?", "yellow", ["jump", "chair", "slowly"]],
  ["Which word describes how something feels?", "rough", ["dog", "sit", "behind"]],
  ["Which word describes the soup?", "hot", ["soup", "eat", "quickly"]],
  ["Which word describes the kitten?", "tiny", ["kitten", "jump", "near"]],
  ["Which word is an adjective?", "soft", ["blanket", "sleep", "beside"]],
  ["Which word describes taste?", "sweet", ["cake", "bake", "inside"]],
  ["Which word describes sound?", "loud", ["bell", "ring", "under"]],
  ["Which word describes speed?", "fast", ["runner", "run", "behind"]],
  ["Which word describes feeling?", "happy", ["child", "play", "outside"]],
  ["Which word is a describing word?", "cold", ["snow", "fall", "beside"]],
  ["Which word describes the box?", "empty", ["box", "carry", "near"]],
  ["Which word describes the pencil?", "sharp", ["pencil", "write", "inside"]],
  ["Which word describes the road?", "long", ["road", "walk", "under"]],
  ["Which word is an adjective?", "quiet", ["room", "read", "between"]]
].forEach(([question, answer, wrongs], i) => {
  add({
    id: `exp3_adjective_${i + 1}`,
    grade: "1",
    skill: "adjectives",
    difficulty: 2,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

// Prefixes and suffixes
[
  ["What does unhappy mean?", "not happy", ["very happy", "happy again", "full of happy"]],
  ["What does unfair mean?", "not fair", ["very fair", "fair again", "full of fair"]],
  ["What does unlock mean?", "open or make not locked", ["lock again", "very locked", "full of locks"]],
  ["What does reread mean?", "read again", ["stop reading", "read badly", "not read"]],
  ["What does replay mean?", "play again", ["stop playing", "not play", "play quietly"]],
  ["What does rebuild mean?", "build again", ["not build", "build badly", "full of building"]],
  ["What does helpful mean?", "full of help", ["not help", "help again", "without help"]],
  ["What does careful mean?", "full of care", ["not careful", "care again", "without care"]],
  ["What does joyful mean?", "full of joy", ["not joyful", "joy again", "without joy"]],
  ["What does painless mean?", "without pain", ["full of pain", "pain again", "not pain again"]],
  ["What does careless mean?", "without care", ["full of care", "care again", "very careful"]],
  ["What does teacher mean?", "a person who teaches", ["teach again", "not teach", "full of teach"]],
  ["What does runner mean?", "a person who runs", ["run again", "not run", "full of run"]],
  ["What does quickly mean?", "in a quick way", ["not quick", "quick again", "full of quick"]],
  ["What does kindness mean?", "the state of being kind", ["not kind", "kind again", "full of kind"]]
].forEach(([question, answer, wrongs], i) => {
  add({
    id: `exp3_morphology_${i + 1}`,
    grade: "2",
    skill: "prefixes and suffixes",
    difficulty: 3,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

// Homophones / homonyms
[
  ["Which word means the number 2?", "two", ["too", "to", "toe"]],
  ["Which word means also?", "too", ["two", "to", "toe"]],
  ["Which word means a place?", "there", ["their", "they're", "three"]],
  ["Which word means belonging to them?", "their", ["there", "they're", "three"]],
  ["Which word means they are?", "they're", ["there", "their", "three"]],
  ["Which word means to listen?", "hear", ["here", "hair", "ear"]],
  ["Which word means in this place?", "here", ["hear", "hair", "ear"]],
  ["Which word means the sun in the sky?", "sun", ["son", "some", "soon"]],
  ["Which word means a boy child of parents?", "son", ["sun", "some", "soon"]],
  ["Which word means one?", "one", ["won", "own", "on"]],
  ["Which word means was first in a game?", "won", ["one", "own", "on"]],
  ["Which word means the ocean?", "sea", ["see", "she", "say"]],
  ["Which word means to look?", "see", ["sea", "she", "say"]]
].forEach(([question, answer, wrongs], i) => {
  add({
    id: `exp3_homophone_${i + 1}`,
    grade: "2",
    skill: "homophones",
    difficulty: 4,
    question,
    choices: choices(answer, wrongs),
    answer
  });
});

// Comprehension packs
const comprehensionItems = [
  ["key details", "Liam saw three ducks swimming in the pond.", "How many ducks did Liam see?", "three", ["three", "one", "five", "ten"]],
  ["key details", "Sara wore a blue hat to school.", "What color was Sara's hat?", "blue", ["blue", "red", "green", "yellow"]],
  ["key details", "The puppy slept under the table.", "Where did the puppy sleep?", "under the table", ["under the table", "on the bed", "in the box", "beside the tree"]],
  ["key details", "Dad made pancakes for breakfast.", "What did Dad make?", "pancakes", ["pancakes", "soup", "rice", "salad"]],
  ["key details", "The class planted beans in small cups.", "What did the class plant?", "beans", ["beans", "rocks", "flowers", "grass"]],

  ["sequencing", "First, Kim opened her book. Next, she read a page. Last, she closed the book.", "What did Kim do next?", "read a page", ["read a page", "closed the book", "ate lunch", "washed hands"]],
  ["sequencing", "First, the boy mixed flour. Next, he added eggs. Last, he baked the cake.", "What happened last?", "he baked the cake", ["he baked the cake", "he mixed flour", "he added eggs", "he drank milk"]],
  ["sequencing", "Maya put on socks, then shoes, then tied the laces.", "What did Maya do after putting on socks?", "put on shoes", ["put on shoes", "tied laces", "ate dinner", "washed the car"]],
  ["sequencing", "The seed was planted. Then it got water. Later, it grew leaves.", "What happened after the seed was planted?", "it got water", ["it got water", "it grew leaves", "it flew away", "it became a rock"]],
  ["sequencing", "First, Anna brushed her teeth. Then she got into bed. Finally, she slept.", "What did Anna do finally?", "slept", ["slept", "brushed teeth", "got into bed", "played outside"]],

  ["main idea", "Cats like to sleep. Cats can climb. Cats often chase toys.", "What is this mostly about?", "cats", ["cats", "dogs", "toys", "beds"]],
  ["main idea", "Trees give shade. Trees have leaves. Some trees grow fruit.", "What is this mostly about?", "trees", ["trees", "cars", "birds", "houses"]],
  ["main idea", "Rain falls from clouds. Rain makes puddles. Rain helps plants grow.", "What is this mostly about?", "rain", ["rain", "snow", "wind", "sun"]],
  ["main idea", "Books have pages. Books tell stories. People read books to learn.", "What is this mostly about?", "books", ["books", "games", "food", "animals"]],
  ["main idea", "Bees fly to flowers. Bees collect nectar. Bees help plants grow.", "What is this mostly about?", "bees", ["bees", "fish", "trees", "clouds"]],

  ["cause and effect", "Emma ran too fast and tripped. She hurt her knee.", "Why did Emma hurt her knee?", "she tripped", ["she tripped", "she ate lunch", "she read a book", "she wore a hat"]],
  ["cause and effect", "The ice cream sat in the sun. It melted.", "Why did the ice cream melt?", "it sat in the sun", ["it sat in the sun", "it was in the freezer", "it was blue", "it was loud"]],
  ["cause and effect", "The dog barked loudly. The baby woke up.", "Why did the baby wake up?", "the dog barked", ["the dog barked", "the baby ate", "the room was dark", "the toy broke"]],
  ["cause and effect", "Tom forgot his lunch. He felt hungry.", "Why did Tom feel hungry?", "he forgot his lunch", ["he forgot his lunch", "he drank water", "he played soccer", "he wore shoes"]],
  ["cause and effect", "The plant did not get water. Its leaves drooped.", "Why did the leaves droop?", "the plant did not get water", ["the plant did not get water", "the plant was happy", "the plant was in a book", "the plant was loud"]],

  ["context clues", "The enormous whale swam beside the small fish.", "What does enormous mean?", "very large", ["very large", "very small", "very quiet", "very fast"]],
  ["context clues", "The room was silent. No one made a sound.", "What does silent mean?", "quiet", ["quiet", "loud", "messy", "bright"]],
  ["context clues", "The child was exhausted after running all day.", "What does exhausted mean?", "very tired", ["very tired", "very angry", "very wet", "very small"]],
  ["context clues", "The fragile glass broke when it fell.", "What does fragile mean?", "easy to break", ["easy to break", "very heavy", "very loud", "hard to see"]],
  ["context clues", "The brave girl walked into the dark room even though she felt nervous.", "What does brave mean?", "showing courage", ["showing courage", "feeling sleepy", "moving slowly", "being hungry"]],

  ["theme", "Noah could not tie his shoes. He practiced every day until he could do it.", "What lesson does Noah learn?", "practice helps you improve", ["practice helps you improve", "shoes are always easy", "never try hard things", "laces are food"]],
  ["theme", "Lily shared her snack with a friend who forgot lunch.", "What lesson does the story teach?", "sharing is kind", ["sharing is kind", "snacks are heavy", "friends never help", "lunch is loud"]],
  ["theme", "Jay lost the game but said, 'Good game' to the winner.", "What lesson does Jay show?", "be a good sport", ["be a good sport", "never play games", "winning is everything", "hide from friends"]],
  ["theme", "Ava told the truth even though she was worried.", "What lesson does Ava show?", "honesty is important", ["honesty is important", "lying is best", "worry is funny", "truth is a toy"]],
  ["theme", "The team worked together and built a strong bridge.", "What lesson does this teach?", "teamwork helps", ["teamwork helps", "bridges are soft", "working together is bad", "teams never share"]]
];

comprehensionItems.forEach(([skill, passage, question, answer, wrongs], i) => {
  add({
    id: `exp3_comp_${i + 1}`,
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
  "src/data/templateExpansion3.js",
  `export const templateExpansion3 = ${JSON.stringify(questions, null, 2)};\n`
);

console.log("Template expansion 3 created:", questions.length);
