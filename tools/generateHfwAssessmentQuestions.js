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
  before: "Put on your shoes ___ we go outside.",
  big: "A ___ truck stopped by the gate.",
  but: "The box was small ___ heavy.",
  by: "The dog sat ___ the fence.",
  came: "Grandma ___ to our house today.",
  can: "I ___ carry the blue bag.",
  come: "Please ___ sit beside me.",
  could: "She ___ reach the top shelf.",
  down: "The ball rolled ___ the hill.",
  every: "We read ___ day after snack.",
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
  have: "We ___ two pencils today.",
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
  it: "___ is raining outside.",
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
  new: "She wore ___ shoes today.",
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
  ["a", "an", "the"],
  ["this", "that", "it"],
  ["my", "your", "his", "her", "our", "their"],
  ["is", "are", "was", "were"],
  ["to", "in", "on", "of", "for", "with", "by", "into", "out", "over", "around", "before", "after"]
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

function sentenceFor(word, imagePath, variantIndex, importedSentences, hard = false) {
  const imported = importedSentences.get(imagePath);
  const base = imported && imported.includes("___")
    ? imported
    : clozeSentenceBank[word] || `We read the word ___ on the page.`;
  const phaseBase = hard
    ? `During harder practice, ${base.charAt(0).toLowerCase()}${base.slice(1)}`
    : base;
  const endings = [
    "",
    " today",
    " after lunch",
    " at school",
    " before snack",
    " with a smile",
    " near the window",
    " on Monday",
    " in the classroom",
    " during reading time",
    " before recess",
    " after the story",
    " in the morning",
    " with the teacher",
    " beside the rug",
    " near the bookshelf",
    " before we lined up",
    " after center time",
    " under the bright light",
    " while everyone listened",
    " during quiet work",
    " before the bell",
    " after music class",
    " near the art table",
    " during partner reading",
    " before cleanup",
    " after the game",
    " beside the window",
    " during morning meeting",
    " before story time",
    " after handwriting"
  ];
  const ending = endings[variantIndex % endings.length];
  if (!ending) return phaseBase;
  if (/[?!]$/.test(phaseBase)) return phaseBase.replace(/([?!])$/, `${ending}$1`);
  return phaseBase.replace(/\.$/, `${ending}.`);
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
    if (!selected.includes(word)) selected.push(word);
    if (selected.length === 3) break;
  }
  const values = [target, ...selected].slice(0, 4);
  const rotateBy = Math.abs(seed) % values.length;
  return optionObjects([...values.slice(rotateBy), ...values.slice(0, rotateBy)], target);
}

function questionForPath({ skillId, skillName, word, wordIndex, phaseKeyValue, imagePath, variantIndex, bandWords, importedSentences }) {
  const { level, phase } = phaseFromKey(phaseKeyValue);
  const formats = HFW_FORMATS_BY_PHASE[phaseKeyValue];
  const format = formats[(wordIndex + variantIndex) % formats.length];
  const hard = level >= 2;
  const isSpell = level >= 2;
  const target = normalizeWord(word);
  const id = `hfw_true_${skillId}_${slug(target)}_${phaseKeyValue.toLowerCase()}_${String(variantIndex + 1).padStart(2, "0")}`;
  const sentence = sentenceFor(target, imagePath, variantIndex + (phase === 2 ? 5 : 0) + (hard ? 11 : 0), importedSentences, hard);
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
            importedSentences
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
