import fs from "fs";

const files = [
  ["src/data/templateExpansion.js", "templateExpansion"],
  ["src/data/templateExpansion2.js", "templateExpansion2"],
  ["src/data/templateExpansion3.js", "templateExpansion3"],
  ["src/data/templateExpansion4.js", "templateExpansion4"],
  ["src/data/templateExpansion5.js", "templateExpansion5"],
  ["src/data/templateExpansion6.js", "templateExpansion6"],
  ["src/data/templateQuestions.js", "templateQuestions"],
  ["src/data/masteryCoreQuestions.js", "masteryCoreQuestions"]
];

const sentenceMap = {
  the: ["___ dog is brown.", ["The", "Jump", "Away", "Funny"]],
  to: ["I go ___ school.", ["to", "said", "little", "jump"]],
  and: ["Mom ___ Dad came.", ["and", "to", "look", "where"]],
  a: ["I see ___ cat.", ["a", "go", "said", "jump"]],
  i: ["___ can run.", ["I", "the", "and", "where"]],
  you: ["Can ___ help me?", ["you", "the", "little", "away"]],
  it: ["___ is raining.", ["It", "Jump", "Where", "Funny"]],
  in: ["The toy is ___ the box.", ["in", "go", "said", "jump"]],
  said: ["Dad ___, “Come here.”", ["said", "jump", "little", "where"]],
  for: ["This gift is ___ you.", ["for", "jump", "said", "look"]],
  up: ["Look ___ at the sky.", ["up", "the", "said", "little"]],
  look: ["___ at the picture.", ["Look", "Said", "Away", "Funny"]],
  is: ["The dog ___ big.", ["is", "jump", "where", "said"]],
  go: ["We ___ to school.", ["go", "said", "little", "where"]],
  we: ["___ can play.", ["We", "The", "Said", "Away"]],
  little: ["The mouse is very ___.", ["little", "jump", "said", "where"]],
  down: ["Sit ___ on the chair.", ["down", "said", "little", "where"]],
  can: ["I ___ jump.", ["can", "the", "where", "said"]],
  see: ["I can ___ a bird.", ["see", "said", "little", "where"]],
  not: ["Do ___ run inside.", ["not", "jump", "little", "where"]],
  one: ["I have ___ pencil.", ["one", "said", "jump", "where"]],
  my: ["This is ___ bag.", ["my", "jump", "said", "where"]],
  me: ["Please help ___.", ["me", "jump", "said", "where"]],
  big: ["The elephant is ___.", ["big", "said", "jump", "where"]],
  come: ["Please ___ here.", ["come", "said", "little", "where"]],

  blue: ["The sky is ___.", ["blue", "jump", "said", "where"]],
  red: ["The apple is ___.", ["red", "jump", "said", "where"]],
  where: ["___ is my book?", ["Where", "Jump", "Said", "Little"]],
  jump: ["I can ___ high.", ["jump", "said", "little", "where"]],
  away: ["The bird flew ___.", ["away", "said", "little", "where"]],
  here: ["Come over ___.", ["here", "jump", "said", "little"]],
  help: ["Can you ___ me?", ["help", "jump", "said", "little"]],
  make: ["We can ___ a cake.", ["make", "jump", "said", "where"]],
  two: ["I have ___ hands.", ["two", "said", "jump", "where"]],
  play: ["We ___ at recess.", ["play", "said", "little", "where"]],
  run: ["The dog can ___.", ["run", "said", "little", "where"]],
  find: ["Can you ___ my shoe?", ["find", "jump", "said", "little"]],
  three: ["I see ___ ducks.", ["three", "jump", "said", "where"]],
  funny: ["The clown is ___.", ["funny", "jump", "said", "where"]],
  yellow: ["The sun is ___.", ["yellow", "jump", "said", "where"]],
  then: ["First we read, ___ we write.", ["then", "jump", "said", "little"]],
  they: ["___ are playing.", ["They", "Jump", "Said", "Little"]],
  was: ["It ___ cold yesterday.", ["was", "jump", "said", "little"]],
  all: ["___ the children came.", ["All", "Jump", "Said", "Where"]],
  but: ["I wanted to play, ___ it rained.", ["but", "jump", "said", "little"]],
  that: ["I like ___ book.", ["that", "jump", "said", "little"]],
  with: ["I play ___ my friend.", ["with", "jump", "said", "little"]],
  are: ["They ___ happy.", ["are", "jump", "said", "little"]],
  he: ["___ is my brother.", ["He", "Jump", "Said", "Little"]],
  she: ["___ is my sister.", ["She", "Jump", "Said", "Little"]],

  be: ["I will ___ kind.", ["be", "jump", "said", "little"]],
  have: ["I ___ a pencil.", ["have", "jump", "said", "little"]],
  will: ["I ___ go home.", ["will", "jump", "said", "little"]],
  into: ["The frog jumped ___ the pond.", ["into", "jump", "said", "little"]],
  like: ["I ___ apples.", ["like", "jump", "said", "little"]],
  must: ["You ___ listen.", ["must", "jump", "said", "little"]],
  new: ["I have a ___ book.", ["new", "jump", "said", "little"]],
  now: ["We go ___!", ["now", "jump", "said", "little"]],
  our: ["This is ___ class.", ["our", "jump", "said", "little"]],
  out: ["Go ___ to play.", ["out", "jump", "said", "little"]],
  please: ["___ help me.", ["Please", "Jump", "Said", "Little"]],
  pretty: ["The flower is ___.", ["pretty", "jump", "said", "little"]],
  saw: ["I ___ a bird.", ["saw", "jump", "said", "little"]],
  say: ["What did you ___?", ["say", "jump", "little", "where"]],
  soon: ["We will eat ___.", ["soon", "jump", "said", "little"]],
  this: ["___ is my desk.", ["This", "Jump", "Said", "Little"]],
  under: ["The ball is ___ the table.", ["under", "jump", "said", "little"]],
  want: ["I ___ water.", ["want", "jump", "said", "little"]],
  well: ["You did very ___.", ["well", "jump", "said", "little"]],
  went: ["We ___ to the park.", ["went", "jump", "said", "little"]],
  what: ["___ is your name?", ["What", "Jump", "Said", "Little"]],
  white: ["The snow is ___.", ["white", "jump", "said", "little"]],
  who: ["___ is at the door?", ["Who", "Jump", "Said", "Little"]],
  yes: ["___, I can help.", ["Yes", "Jump", "Said", "Little"]],
  came: ["She ___ to school.", ["came", "jump", "said", "little"]]
};

async function loadModule(path) {
  return await import("../" + path + "?cacheBust=" + Date.now());
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function fix(q) {
  const skill = String(q.skill || "").toLowerCase();

  if (!skill.includes("high-frequency")) {
    return q;
  }

  const answer = String(q.answer || "").trim();
  const key = answer.toLowerCase();

  if (!sentenceMap[key]) {
    return {
      ...q,
      passage: "",
      image: "",
      imagePath: "",
      spokenPrompt: "",
      questionType: "multiple_choice",
      question: "Which word best completes the sentence?",
      sentence: `Read the sentence and choose the missing word.`,
      choices: q.choices,
      answer
    };
  }

  const [sentence, choices] = sentenceMap[key];

  return {
    ...q,
    passage: sentence,
    image: "",
    imagePath: "",
    spokenPrompt: "",
    questionType: "cloze_choice",
    question: "Which word best completes the sentence?",
    choices: shuffle(choices),
    answer: choices[0]
  };
}

let changed = 0;

for (const [file, exportName] of files) {
  if (!fs.existsSync(file)) continue;

  const mod = await loadModule(file);
  const list = mod[exportName];

  if (!Array.isArray(list)) continue;

  const fixed = list.map(q => {
    const before = JSON.stringify(q);
    const after = fix(q);
    if (JSON.stringify(after) !== before) changed++;
    return after;
  });

  fs.writeFileSync(
    file,
    `export const ${exportName} = ${JSON.stringify(fixed, null, 2)};\n`
  );

  console.log(`${file}: processed ${fixed.length}`);
}

console.log("Sight word questions converted to cloze sentences:", changed);
