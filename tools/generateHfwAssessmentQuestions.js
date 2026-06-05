import fs from "node:fs";
import path from "node:path";

import {
  HFW_FORMATS_BY_PHASE,
  hfwPhaseKey
} from "../src/data/hfwAssessmentFormatConfig.js";
import {
  HFW_WORD_BANDS
} from "../src/data/highFrequencyWordBands.js";
import {
  hfwAssessmentImageVariants
} from "../src/data/generated/assessmentImageVariants.generated.js";
import {
  getMultiplePlausibleHfwAnswerIssues,
  hasHfwFillerPhrase,
  normalizeHfwText
} from "../src/data/hfwQualityRules.js";

const outputPath = path.join("src", "data", "generated", "hfwAssessmentQuestions.generated.js");
const importedManifestPath = path.join("docs", "imports", "kimi_these_still_need_finishing_2026-06-05", "production_manifest.json");

const clozeSentenceBank = {
  a: "Mia found ___ smooth stone.",
  after: "We washed our hands ___ lunch.",
  again: "Sam read the page ___ before bed.",
  all: "___ the children sat on the rug.",
  an: "I saw ___ owl in the tree.",
  and: "Mom ___ Dad waved goodbye.",
  any: "Do you see ___ crayons on the table?",
  are: "The puppies ___ asleep on the rug.",
  around: "The children walked ___ the garden.",
  as: "She smiled ___ she opened the box.",
  ask: "Ben will ___ the teacher for help.",
  away: "The bird flew ___ from the tree.",
  be: "Please ___ kind to your friend.",
  before: "Put on your shoes ___ we leave.",
  big: "A ___ truck stopped by the gate.",
  but: "The box was small ___ heavy.",
  by: "The dog sat ___ the fence.",
  came: "Grandma ___ to our house for dinner.",
  can: "I ___ carry the blue bag.",
  come: "Please ___ sit beside me.",
  could: "She ___ reach the top shelf.",
  down: "The ball rolled ___ the hill.",
  every: "We read ___ day in our book log.",
  find: "We will ___ the missing puzzle piece.",
  fly: "The kite can ___ above the field.",
  for: "This snack is ___ Sam.",
  found: "Dad ___ a shell near the path.",
  from: "The letter came ___ my aunt.",
  funny: "The puppy made a ___ face.",
  give: "Please ___ the book to Lee.",
  go: "We will ___ to the park.",
  going: "They are ___ to the library.",
  had: "The dog ___ a red ball.",
  has: "The frog ___ spots on its back.",
  have: "We ___ two pencils in the cup.",
  he: "___ ran to the bus.",
  help: "I can ___ clean the table.",
  her: "Lily packed ___ lunch box.",
  here: "Please sit ___ beside me.",
  him: "We gave ___ the green cup.",
  his: "He raised ___ hand.",
  how: "___ did the puppy get out?",
  i: "___ can read this page.",
  in: "The key is ___ the box.",
  into: "The frog jumped ___ the pond.",
  is: "The soup ___ hot now.",
  it: "___ is raining by the window.",
  just: "We ___ finished the puzzle.",
  know: "I ___ the answer now.",
  let: "Please ___ the puppy rest.",
  like: "I ___ the red kite.",
  little: "A ___ bird sat on the branch.",
  live: "Fish ___ in the pond.",
  look: "___ at the bright moon.",
  made: "She ___ a card for Dad.",
  make: "We can ___ a paper boat.",
  may: "You ___ choose a book.",
  me: "Please sit beside ___.",
  must: "We ___ clean up the blocks.",
  my: "I packed ___ lunch in a bag.",
  new: "She wore ___ shoes to the party.",
  not: "The puppy is ___ asleep yet.",
  now: "We are ready ___.",
  of: "A slice ___ cake sat on the plate.",
  old: "The ___ barn stood by the road.",
  on: "The cup is ___ the tray.",
  once: "We read that story ___ before.",
  one: "I found ___ red mitten.",
  open: "Please ___ the blue box.",
  our: "We cleaned ___ classroom together.",
  out: "The bird flew ___ of the cage.",
  over: "The plane flew ___ the school.",
  play: "We will ___ after lunch.",
  please: "___ pass the crayons.",
  pretty: "The garden has ___ flowers.",
  put: "Please ___ the book on the shelf.",
  read: "I can ___ the short story.",
  round: "The ball is ___ and red.",
  said: "Mom ___ it was time to go.",
  see: "I ___ a duck near the pond.",
  she: "___ found a shiny rock.",
  some: "He shared ___ crayons.",
  take: "Please ___ your coat home.",
  thank: "We will ___ the helper.",
  that: "Please hand me ___ green book.",
  the: "Please close ___ blue door.",
  then: "We ate lunch, ___ we played.",
  they: "___ walked to the bus.",
  this: "___ red cup belongs on the shelf.",
  to: "We walked ___ the park gate.",
  up: "The balloon floated ___ above the chair.",
  was: "The baby ___ asleep before lunch.",
  we: "___ made a tent with blankets.",
  what: "___ is inside the box?",
  when: "___ will the bus arrive?",
  where: "___ did you put the book?",
  will: "The sun ___ come out soon.",
  with: "She drew ___ a blue crayon.",
  yes: "Dad said ___ to the picnic.",
  you: "___ may choose a book."
};

const ambiguityGroups = [
  ["come", "go"],
  ["look", "see"],
  ["make", "do"],
  ["said", "say"],
  ["has", "have"],
  ["a", "an", "the"],
  ["this", "that", "it"],
  ["my", "your", "his", "her", "our", "their"],
  ["is", "are", "was", "were"],
  ["to", "in", "on", "of", "for", "with", "by", "into", "out", "over", "around", "before", "after"]
];

const curatedSentenceBanks = {
  a: [
    "Mia found ___ smooth stone.",
    "Ben packed ___ yellow pencil.",
    "Nora drew ___ tiny star.",
    "Lee picked ___ red apple.",
    "Sam carried ___ paper bag.",
    "Ana saw ___ little frog.",
    "Dad fixed ___ broken toy.",
    "Kim held ___ blue cup.",
    "Max made ___ clay bowl.",
    "Jo found ___ shiny coin.",
    "Tess read ___ short note.",
    "Owen chose ___ green crayon.",
    "Lena wore ___ warm hat.",
    "Finn saw ___ small boat.",
    "Mia drew ___ happy face.",
    "Ben found ___ lost key.",
    "Nora packed ___ soft scarf.",
    "Lee held ___ round shell.",
    "Sam made ___ paper kite.",
    "Ana saw ___ brown rabbit.",
    "Dad carried ___ heavy box.",
    "Kim found ___ silver bell.",
    "Max drew ___ tall tree.",
    "Jo made ___ neat card.",
    "Tess held ___ clean cup.",
    "Owen found ___ tiny bead.",
    "Lena packed ___ red mitten.",
    "Finn drew ___ moon shape.",
    "Mia saw ___ sleepy cat.",
    "Ben chose ___ white button."
  ],
  come: [
    "Please ___ to the rug.",
    "Can you ___ here?",
    "I will ___ when you call.",
    "The dog will ___ to me.",
    "Please ___ to the red mat.",
    "Lee will ___ when the bell rings.",
    "The kitten may ___ to the bowl.",
    "Mom asked me to ___ inside.",
    "Sam will ___ when Dad waves.",
    "The class will ___ to the story corner.",
    "Please ___ beside the table.",
    "The puppy will ___ when I clap.",
    "Can Kim ___ to the gate?",
    "Dad will ___ when the bus stops.",
    "The bird may ___ back to the nest.",
    "Please ___ to the front step.",
    "The team will ___ when coach calls.",
    "Can Max ___ to the blue chair?",
    "The cat will ___ to the dish.",
    "Please ___ to the reading rug.",
    "The children will ___ when music starts.",
    "Can Nora ___ to the sink?",
    "The horse will ___ to the fence.",
    "Please ___ to the garden path.",
    "The helper will ___ when I knock.",
    "Can Ana ___ to the porch?",
    "The duck will ___ to the pond edge.",
    "Please ___ to the quiet corner.",
    "The baby will ___ when Mom sings.",
    "Can Finn ___ to the table?"
  ],
  go: [
    "We will ___ to the bus.",
    "I can ___ up the hill.",
    "Do not ___ past the gate.",
    "They ___ home after lunch.",
    "The class will ___ to music.",
    "Sam can ___ down the slide.",
    "We may ___ to the library.",
    "The ball can ___ over the line.",
    "Please ___ back to your seat.",
    "They will ___ through the door.",
    "I will ___ around the puddle.",
    "The boat can ___ across the pond.",
    "We can ___ under the bridge.",
    "The runner will ___ to the finish.",
    "Do not ___ near the road.",
    "The train will ___ past the farm.",
    "We will ___ into the gym.",
    "The kite can ___ above the trees.",
    "I can ___ with the group.",
    "They will ___ to the lunch line.",
    "The puppy may ___ under the chair.",
    "We can ___ along the path.",
    "The car will ___ around the bend.",
    "Please ___ to the art table.",
    "I will ___ through the gate.",
    "They can ___ over the bridge.",
    "The bus will ___ down the street.",
    "We may ___ into the tent.",
    "The bee can ___ to the flower.",
    "Please ___ back to the mat."
  ],
  like: [
    "I ___ this book.",
    "We ___ to play.",
    "Do you ___ apples?",
    "Sam and Mia ___ the red kite.",
    "I ___ the soft blanket.",
    "The children ___ music.",
    "We ___ the funny puppet.",
    "Do you ___ the blue cup?",
    "I ___ drawing stars.",
    "Nora and Lee ___ the story.",
    "We ___ warm soup.",
    "Do you ___ the green chair?",
    "I ___ the little frog.",
    "Sam and Kim ___ the puzzle.",
    "We ___ reading together.",
    "Do you ___ the yellow hat?",
    "I ___ the quiet song.",
    "The class ___ the garden.",
    "We ___ the paper boat.",
    "Do you ___ the round shell?",
    "I ___ this red crayon.",
    "Mia and Ben ___ the game.",
    "We ___ the tiny kitten.",
    "Do you ___ the shiny bell?",
    "I ___ the clean page.",
    "The helpers ___ the picnic.",
    "We ___ the sunny picture.",
    "Do you ___ the soft scarf?",
    "I ___ the bright moon.",
    "Sam and Lee ___ the new song."
  ],
  look: [
    "___ at the red bird.",
    "Please ___ at this page.",
    "I will ___ for my hat.",
    "___ at the bright moon.",
    "Please ___ at the map.",
    "I will ___ for the lost key.",
    "___ at the tiny bug.",
    "Please ___ at the green sign.",
    "I will ___ for my blue cup.",
    "___ at the tall tree.",
    "Please ___ at the first line.",
    "I will ___ for the red mitten.",
    "___ at the shiny shell.",
    "Please ___ at the picture card.",
    "I will ___ for the puzzle piece.",
    "___ at the yellow flower.",
    "Please ___ at the clock.",
    "I will ___ for the small bell.",
    "___ at the brown rabbit.",
    "Please ___ at the number chart.",
    "I will ___ for my lunch box.",
    "___ at the silver star.",
    "Please ___ at the clean board.",
    "I will ___ for the green crayon.",
    "___ at the sleepy cat.",
    "Please ___ at the story page.",
    "I will ___ for the white button.",
    "___ at the round stone.",
    "Please ___ at the weather chart.",
    "I will ___ for my paper boat."
  ],
  the: [
    "Please close ___ blue door.",
    "I opened ___ red box.",
    "Lee found ___ small shell.",
    "Mia carried ___ green bag.",
    "Sam fixed ___ broken toy.",
    "Nora read ___ short note.",
    "Ben cleaned ___ round table.",
    "Kim held ___ yellow cup.",
    "Max drew ___ tall tree.",
    "Ana packed ___ warm coat.",
    "Jo moved ___ heavy chair.",
    "Tess fed ___ little puppy.",
    "Owen shut ___ wooden gate.",
    "Lena folded ___ soft blanket.",
    "Finn picked ___ shiny coin.",
    "Mia washed ___ muddy boot.",
    "Ben opened ___ silver lock.",
    "Nora found ___ lost mitten.",
    "Lee carried ___ paper kite.",
    "Sam read ___ first page.",
    "Ana closed ___ clean window.",
    "Dad moved ___ garden hose.",
    "Mom packed ___ picnic basket.",
    "Kim fixed ___ loose wheel.",
    "Max held ___ bright lantern.",
    "Jo cleaned ___ paint brush.",
    "Tess opened ___ lunch bag.",
    "Owen shut ___ front gate.",
    "Lena read ___ final line.",
    "Finn carried ___ clay bowl."
  ],
  we: [
    "___ made a tent with blankets.",
    "___ read a story together.",
    "___ found a shell by the path.",
    "___ built a tower with blocks.",
    "___ sang a song for Mom.",
    "___ packed books in a bag.",
    "___ cleaned the table after lunch.",
    "___ drew stars on paper.",
    "___ helped the little puppy.",
    "___ walked to the bus stop.",
    "___ planted seeds in a cup.",
    "___ counted coins on the rug.",
    "___ fixed the puzzle together.",
    "___ carried chairs to the table.",
    "___ made soup in a pot.",
    "___ read signs on the wall.",
    "___ picked apples from a tree.",
    "___ found crayons in the box.",
    "___ folded paper into boats.",
    "___ built a bridge with sticks.",
    "___ washed paint from our hands.",
    "___ shared crackers at lunch.",
    "___ made cards for the helper.",
    "___ sorted shells by size.",
    "___ wrote names on tags.",
    "___ put blocks back in bins.",
    "___ watched birds near the feeder.",
    "___ mixed colors on a tray.",
    "___ carried water to the plants.",
    "___ read poems by the window."
  ]
};

const fallbackSceneStarters = [
  "When the story started",
  "When the bell rang",
  "When the rain stopped",
  "When the puppy barked",
  "When the bus arrived",
  "When the music ended",
  "When the page turned",
  "When the garden gate opened",
  "When the red light blinked",
  "When the teacher pointed",
  "When the kitten woke",
  "When the ball bounced",
  "When the kite dipped",
  "When the puzzle was ready",
  "When the class lined up",
  "When the book opened",
  "When the duck splashed",
  "When the clock chimed",
  "When the helper waved",
  "When the lantern glowed",
  "When the train slowed",
  "When the apple rolled",
  "When the paint dried",
  "When the shell shone",
  "When the wind blew",
  "When the cup tipped",
  "When the dog sat",
  "When the boat floated",
  "When the card folded",
  "When the drum tapped"
];

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value = "") {
  return normalizeWord(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function phaseFromKey(phaseKey) {
  return {
    level: phaseKey.includes("L2") ? 2 : 1,
    phase: phaseKey.includes("P2") ? 2 : 1
  };
}

function readImportedSentences() {
  if (!fs.existsSync(importedManifestPath)) return new Map();
  const records = JSON.parse(fs.readFileSync(importedManifestPath, "utf8"));
  return new Map(
    records
      .filter(record => record.output_path && record.sentence)
      .map(record => [record.output_path, String(record.sentence)])
  );
}

function lowerFirst(value = "") {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function fallbackSentenceFor(word, variantIndex) {
  const bank = curatedSentenceBanks[word];
  if (bank?.length) return bank[variantIndex % bank.length];

  const base = clozeSentenceBank[word] || `The sentence needs ___ to make sense.`;
  const starter = fallbackSceneStarters[variantIndex % fallbackSceneStarters.length];
  if (/[?!]$/.test(base)) {
    return `${starter}, ${lowerFirst(base)}`;
  }
  return `${starter}, ${lowerFirst(base)}`;
}

function cleanImportedSentence(sentence = "") {
  const value = String(sentence || "").trim();
  if (!value.includes("___")) return "";
  if (hasHfwFillerPhrase(value)) return "";
  return value;
}

function sentenceFor({ word, imagePath, variantIndex, importedSentences, usedSentences }) {
  const imported = cleanImportedSentence(importedSentences.get(imagePath));
  const candidates = [];
  if (imported) candidates.push(imported);
  for (let offset = 0; offset < 40; offset += 1) {
    candidates.push(fallbackSentenceFor(word, variantIndex + offset));
  }

  for (const candidate of candidates) {
    const key = normalizeHfwText(candidate);
    if (!candidate.includes("___") || hasHfwFillerPhrase(candidate) || usedSentences.has(key)) continue;
    usedSentences.add(key);
    return candidate;
  }

  const finalSentence = fallbackSentenceFor(word, variantIndex + usedSentences.size);
  usedSentences.add(normalizeHfwText(finalSentence));
  return finalSentence;
}

function forbiddenDistractors(target, sentence = "") {
  const forbidden = new Set([target]);
  const sentenceWords = new Set(normalizeWord(sentence).split(/\s+/).filter(Boolean));
  for (const word of sentenceWords) forbidden.add(word);
  const group = ambiguityGroups.find(words => words.includes(target));
  if (group) {
    for (const word of group) forbidden.add(word);
  }
  return forbidden;
}

function optionObjects(values, target) {
  return values.map(value => ({
    label: value,
    value,
    text: value,
    word: value,
    correct: value === target
  }));
}

function buildLetterTiles(word, seed = 0) {
  const alphabet = "etaoinshrdlucmfwypvbgkqjxz";
  const targetLetters = String(word || "").toLowerCase().replace(/[^a-z]/g, "").split("");
  const tiles = [...targetLetters];
  let index = Math.abs(Number(seed) || 0);
  while (tiles.length < 12) {
    const letter = alphabet[index % alphabet.length];
    tiles.push(letter);
    index += 5;
  }
  return tiles
    .map((letter, tileIndex) => ({ letter, sortKey: (tileIndex * 7 + seed) % 17 }))
    .sort((a, b) => a.sortKey - b.sortKey || a.letter.localeCompare(b.letter))
    .map(item => item.letter);
}

function answerOptions({ target, bandWords, sentence = "", seed = 0, hard = false }) {
  const forbidden = forbiddenDistractors(target, sentence);
  const ordered = bandWords
    .map(normalizeWord)
    .filter(Boolean)
    .filter(word => !forbidden.has(word));
  const ranked = ordered
    .map(word => ({
      word,
      score: hard ? Math.abs(word.length - target.length) : 0,
      sort: (word.charCodeAt(0) * 17 + word.length * 7 + seed) % 101
    }))
    .sort((a, b) => a.score - b.score || a.sort - b.sort || a.word.localeCompare(b.word))
    .map(item => item.word);
  const selected = [];
  for (const word of ranked) {
    const trialQuestion = {
      answer: target,
      targetWord: target,
      sentence,
      answerOptions: [target, ...selected, word]
    };
    if (!selected.includes(word) && !getMultiplePlausibleHfwAnswerIssues(trialQuestion).length) {
      selected.push(word);
    }
    if (selected.length === 3) break;
  }
  const values = [target, ...selected].slice(0, 4);
  const rotateBy = Math.abs(seed) % values.length;
  return optionObjects([...values.slice(rotateBy), ...values.slice(0, rotateBy)], target);
}

function questionForPath({ skillId, skillName, word, wordIndex, phaseKeyValue, imagePath, variantIndex, bandWords, importedSentences, usedSentences }) {
  const { level, phase } = phaseFromKey(phaseKeyValue);
  const formats = HFW_FORMATS_BY_PHASE[phaseKeyValue];
  const format = formats[(wordIndex + variantIndex) % formats.length];
  const hard = level >= 2;
  const isSpell = level >= 2;
  const target = normalizeWord(word);
  const id = `hfw_true_${skillId}_${slug(target)}_${phaseKeyValue.toLowerCase()}_${String(variantIndex + 1).padStart(2, "0")}`;
  const sentence = sentenceFor({
    word: target,
    imagePath,
    variantIndex: variantIndex + (phase === 2 ? 5 : 0) + (hard ? 11 : 0) + wordIndex * 3,
    importedSentences,
    usedSentences
  });
  const fullSentence = sentence.replace("___", target);
  const common = {
    id,
    skillId,
    assessmentSkillId: skillId,
    skillName,
    level,
    phase,
    difficultyLevel: level,
    itemType: "sight_word",
    disableAudio: true,
    noAudio: true,
    itemKey: `${target}_${phaseKeyValue.toLowerCase()}_${variantIndex + 1}`,
    targetWord: target,
    answer: target,
    correctAnswer: target,
    imagePath,
    imageUrl: imagePath,
    mediaTarget: `hfw-true:${skillId}:${target}:${phaseKeyValue}:${variantIndex + 1}`,
    source: "hfw_true_variation_generator",
    formatType: format,
    templateType: format,
    questionType: format
  };

  if (isSpell) {
    const prompt = "Listen to the sentence. Spell the word that fits.";
    const tiles = buildLetterTiles(target, wordIndex * 41 + variantIndex + phase * 11);
    const distractorLetters = tiles.filter((letter, index) => !target[index] || letter !== target[index]);
    return {
      ...common,
      questionType: "hfw_sentence_spell",
      prompt,
      question: prompt,
      context: sentence,
      sentence,
      visibleSentenceWithBlank: sentence,
      sentenceText: fullSentence,
      fullSentence,
      spokenPrompt: fullSentence,
      sentenceAudio: fullSentence,
      audioText: fullSentence,
      correctLetterSequence: target.split(""),
      letterTiles: tiles,
      soundTiles: tiles,
      distractorLetters
    };
  }

  const options = answerOptions({ target, bandWords, sentence, seed: wordIndex * 37 + variantIndex + phase * 13, hard });
  const prompt = phase === 2
    ? "Read the sentence. Choose the word that fits."
    : "Choose the word that completes the sentence.";
  return {
    ...common,
    questionType: "multiple_choice",
    prompt,
    question: prompt,
    sentence,
    visibleSentenceWithBlank: sentence,
    fullSentence: sentence.replace("___", target),
    context: sentence,
    choices: options.map(option => option.value),
    answerOptions: options,
    options
  };
}

function generateQuestions() {
  const importedSentences = readImportedSentences();
  const usedSentences = new Set();
  const questions = [];
  for (const [skillId, words] of Object.entries(HFW_WORD_BANDS)) {
    const skillName = `High-Frequency Words ${skillId.replace("hfw_", "").replace("_", "-")}`;
    for (const [wordIndex, word] of words.entries()) {
      const phaseMap = hfwAssessmentImageVariants[skillId]?.[word] || {};
      for (const rawPhaseKey of ["l1p1", "l1p2", "l2p1", "l2p2"]) {
        const phaseKeyValue = hfwPhaseKey(rawPhaseKey.includes("l2") ? 2 : 1, rawPhaseKey.includes("p2") ? 2 : 1);
        const paths = phaseMap[rawPhaseKey] || [];
        paths.forEach((imagePath, variantIndex) => {
          questions.push(questionForPath({
            skillId,
            skillName,
            word,
            wordIndex,
            phaseKeyValue,
            imagePath,
            variantIndex,
            bandWords: words,
            importedSentences,
            usedSentences
          }));
        });
      }
    }
  }
  return questions;
}

const questions = generateQuestions();
fs.writeFileSync(outputPath, `// Generated by tools/generateHfwAssessmentQuestions.js. Do not hand-edit.\n\nexport const hfwAssessmentQuestions = ${JSON.stringify(questions, null, 2)};\n`);
console.log(JSON.stringify({
  generated: outputPath,
  questions: questions.length,
  bySkill: Object.fromEntries(Object.keys(HFW_WORD_BANDS).map(skillId => [
    skillId,
    questions.filter(question => question.skillId === skillId).length
  ]))
}, null, 2));
