import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { languageSkillQuestions } from "../src/data/generated/languageSkillQuestions.generated.js";
import { skillLevelGapQuestions } from "../src/data/generated/skillLevelGapQuestions.generated.js";
import { getChildWordAsset } from "../src/data/childAssets.js";
import { sceneForPrepositionQuestion } from "../src/data/prepositionClozeScenes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const workbookPath = process.argv[2] || "/Users/benjaminbowler/Desktop/LiteracyPath_QuestionBank_Fix_Workbook.xlsx";
const pythonBin = process.env.CODEX_PYTHON ||
  "/Users/benjaminbowler/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

const FALLBACK_NOUN_ROWS = {
  arm: ["The child raised an ___ to wave.", "The child raised an arm to wave.", "arm | shoe | cloud | pencil"],
  baby: ["The ___ slept in the crib.", "The baby slept in the crib.", "baby | road | spoon | flag"],
  basket: ["The ___ held the apples.", "The basket held the apples.", "basket | moon | fox | chair"],
  bat: ["The player swung the ___.", "The player swung the bat.", "bat | river | pencil | cookie"],
  bench: ["The ___ was beside the park path.", "The bench was beside the park path.", "bench | banana | cow | boot"],
  boat: ["The ___ floated on the lake.", "The boat floated on the lake.", "boat | pencil | frog | lamp"],
  boot: ["The muddy ___ sat by the door.", "The muddy boot sat by the door.", "boot | cloud | key | garden"],
  bottle: ["The ___ held cold water.", "The bottle held cold water.", "bottle | bird | road | shell"],
  boy: ["The ___ kicked the ball.", "The boy kicked the ball.", "boy | leaf | bridge | egg"],
  branch: ["The bird sat on the ___.", "The bird sat on the branch.", "branch | bus | sock | moon"],
  bread: ["The ___ was on the plate.", "The bread was on the plate.", "bread | hill | fox | desk"],
  bucket: ["The ___ was full of sand.", "The bucket was full of sand.", "bucket | clock | horse | seed"],
  card: ["The ___ came in the mail.", "The card came in the mail.", "card | frog | spoon | tree"],
  cheese: ["The mouse nibbled the ___.", "The mouse nibbled the cheese.", "cheese | rock | gate | pen"],
  child: ["The ___ read a book.", "The child read a book.", "child | window | jar | cow"],
  doll: ["The ___ sat on the shelf.", "The doll sat on the shelf.", "doll | flower | road | cup"],
  farm: ["The ___ had cows and goats.", "The farm had cows and goats.", "farm | sock | pencil | cake"],
  game: ["The children played a ___ together.", "The children played a game together.", "game | bird | door | rock"],
  gate: ["The ___ opened into the garden.", "The gate opened into the garden.", "gate | pig | moon | sock"],
  girl: ["The ___ carried a backpack.", "The girl carried a backpack.", "girl | leaf | truck | egg"],
  grape: ["The ___ rolled off the plate.", "The grape rolled off the plate.", "grape | chair | fox | lamp"],
  hill: ["The ___ was behind the house.", "The hill was behind the house.", "hill | spoon | cow | pencil"],
  jar: ["The ___ held red jam.", "The jar held red jam.", "jar | bridge | fish | coat"],
  leg: ["The chair had a broken ___.", "The chair had a broken leg.", "leg | cloud | cookie | river"],
  log: ["The frog sat on the ___.", "The frog sat on the log.", "log | kite | desk | banana"],
  nose: ["The clown had a red ___.", "The clown had a red nose.", "nose | road | sheep | pencil"],
  owl: ["The ___ sat in the tree at night.", "The owl sat in the tree at night.", "owl | cup | bridge | seed"],
  pond: ["The duck swam in the ___.", "The duck swam in the pond.", "pond | shoe | clock | cheese"],
  ring: ["The ___ shone on her finger.", "The ring shone on her finger.", "ring | farm | dog | pencil"],
  rope: ["The ___ was tied to the boat.", "The rope was tied to the boat.", "rope | apple | cloud | desk"],
  stick: ["The dog carried a ___.", "The dog carried a stick.", "stick | milk | river | chair"],
  stone: ["The ___ was smooth and gray.", "The stone was smooth and gray.", "stone | cookie | bird | door"],
  truck: ["The ___ carried boxes.", "The truck carried boxes.", "truck | leaf | spoon | cat"],
  window: ["The ___ was open on a warm day.", "The window was open on a warm day.", "window | cow | seed | shell"],
  zoo: ["The class visited the ___.", "The class visited the zoo.", "zoo | lamp | pencil | duck"]
};

const FALLBACK_VERB_ROWS = {
  cheer: ["The fans ___ when the team scores.", "The fans cheer when the team scores.", "cheer | pencil | quiet | basket"],
  come: ["Please ___ to the rug for story time.", "Please come to the rug for story time.", "come | table | shiny | carrot"],
  drink: ["The child will ___ water after running.", "The child will drink water after running.", "drink | button | yellow | cloud"],
  fish: ["The family will ___ at the lake.", "The family will fish at the lake.", "fish | spoon | purple | chair"],
  go: ["The class will ___ to the library.", "The class will go to the library.", "go | coin | quiet | branch"],
  guess: ["The child will ___ which cup hides the ball.", "The child will guess which cup hides the ball.", "guess | window | cold | banana"],
  hang: ["They will ___ the coat on the hook.", "They will hang the coat on the hook.", "hang | pencil | sour | garden"],
  hit: ["The player will ___ the ball with a bat.", "The player will hit the ball with a bat.", "hit | table | gentle | cloud"],
  join: ["The child will ___ the game.", "The child will join the game.", "join | basket | silver | river"],
  march: ["The band will ___ down the street.", "The band will march down the street.", "march | cookie | tiny | door"],
  pick: ["The child will ___ a red apple.", "The child will pick a red apple.", "pick | spoon | brave | window"],
  rescue: ["The helper will ___ the kitten from the tree.", "The helper will rescue the kitten from the tree.", "rescue | pencil | salty | moon"],
  smell: ["The child will ___ the flower.", "The child will smell the flower.", "smell | basket | loud | road"],
  speak: ["The student will ___ to the class.", "The student will speak to the class.", "speak | window | sticky | pencil"],
  start: ["The runner will ___ at the line.", "The runner will start at the line.", "start | apple | smooth | bench"],
  stop: ["The car will ___ at the red light.", "The car will stop at the red light.", "stop | pencil | fuzzy | river"],
  swing: ["The child will ___ at the playground.", "The child will swing at the playground.", "swing | basket | clean | moon"],
  take: ["The child will ___ a book from the shelf.", "The child will take a book from the shelf.", "take | chair | silver | garden"],
  teach: ["The instructor will ___ the class a new song.", "The instructor will teach the class a new song.", "teach | spoon | orange | road"],
  use: ["The child will ___ a pencil to write.", "The child will use a pencil to write.", "use | window | sour | basket"],
  visit: ["The family will ___ the zoo.", "The family will visit the zoo.", "visit | button | cold | pencil"],
  watch: ["The child will ___ the bird fly.", "The child will watch the bird fly.", "watch | table | bumpy | river"],
  yell: ["The coach will ___ across the field.", "The coach will yell across the field.", "yell | basket | round | cloud"]
};

const FALLBACK_ADJECTIVE_ROWS = {
  awake: ["The child is ___ after breakfast.", "The child is awake after breakfast.", "awake | sticky | square | sour"],
  black: ["The crayon is ___ like the night sky.", "The crayon is black like the night sky.", "black | polite | bumpy | salty"],
  blue: ["The sky is ___ on a sunny day.", "The sky is blue on a sunny day.", "blue | careful | rough | sleepy"],
  clear: ["The clean water is ___.", "The clean water is clear.", "clear | striped | angry | late"],
  cloudy: ["The sky is ___ before the rain.", "The sky is cloudy before the rain.", "cloudy | sticky | polite | square"],
  first: ["The runner in front came ___ in the race.", "The runner in front came first in the race.", "first | sour | fuzzy | quiet"],
  flat: ["The pancake is ___ on the plate.", "The pancake is flat on the plate.", "flat | noisy | kind | purple"],
  good: ["The helper made a ___ choice.", "The helper made a good choice.", "good | slippery | striped | loud"],
  gray: ["The storm cloud is ___.", "The storm cloud is gray.", "gray | gentle | sticky | sour"],
  green: ["The leaf is ___.", "The leaf is green.", "green | polite | bumpy | loud"],
  huge: ["The elephant is ___ beside the mouse.", "The elephant is huge beside the mouse.", "huge | sour | careful | striped"],
  large: ["The box is ___ enough to hold all the books.", "The box is large enough to hold all the books.", "large | sticky | polite | salty"],
  last: ["The final runner came ___ in the race.", "The final runner came last in the race.", "last | fuzzy | sour | square"],
  lightweight: ["The empty backpack feels ___ to carry.", "The empty backpack feels lightweight to carry.", "lightweight | noisy | striped | sour"],
  little: ["The kitten is ___ beside the big dog.", "The kitten is little beside the big dog.", "little | salty | careful | striped"],
  messy: ["The desk is ___ after art time.", "The desk is messy after art time.", "messy | polite | clear | tiny"],
  neat: ["The folded shirts are ___ in the drawer.", "The folded shirts are neat in the drawer.", "neat | slippery | loud | sour"],
  orange: ["The pumpkin is ___.", "The pumpkin is orange.", "orange | gentle | bumpy | quiet"],
  patient: ["The child is ___ while waiting in line.", "The child is patient while waiting in line.", "patient | sticky | round | loud"],
  poor: ["The plant had ___ soil and did not grow well.", "The plant had poor soil and did not grow well.", "poor | striped | sunny | polite"],
  rainy: ["The day is ___ with falling rain.", "The day is rainy with falling rain.", "rainy | sticky | square | polite"],
  red: ["The apple is ___.", "The apple is red.", "red | careful | bumpy | noisy"],
  rich: ["The chocolate cake tastes ___ and sweet.", "The chocolate cake tastes rich and sweet.", "rich | square | noisy | polite"],
  sharp: ["The pencil point is ___.", "The pencil point is sharp.", "sharp | cloudy | polite | soft"],
  silent: ["The room went ___ when the music stopped.", "The room went silent when the music stopped.", "silent | sticky | orange | sour"],
  simple: ["The puzzle with two pieces is ___.", "The puzzle with two pieces is simple.", "simple | rainy | striped | noisy"],
  snowy: ["The day is ___ with falling snow.", "The day is snowy with falling snow.", "snowy | sticky | polite | square"],
  sunny: ["The day is ___ with bright sun.", "The day is sunny with bright sun.", "sunny | sticky | square | polite"],
  thick: ["The book is ___ with many pages.", "The book is thick with many pages.", "thick | polite | sour | tiny"],
  thin: ["The paper is ___ and bends easily.", "The paper is thin and bends easily.", "thin | noisy | sweet | large"],
  tiny: ["The ant is ___ beside the apple.", "The ant is tiny beside the apple.", "tiny | sour | careful | striped"],
  tricky: ["The maze is ___ to finish.", "The maze is tricky to finish.", "tricky | sunny | polite | square"],
  white: ["The snow is ___.", "The snow is white.", "white | sticky | noisy | sour"],
  windy: ["The day is ___ with blowing leaves.", "The day is windy with blowing leaves.", "windy | sticky | polite | square"],
  yellow: ["The banana is ___.", "The banana is yellow.", "yellow | careful | bumpy | loud"]
};

const INITIAL_REPLACEMENTS = {
  almond: { target: "ant", answer: "a", choices: ["a", "b", "c", "d"], letters: ["a", "b", "c", "d"] },
  anteater: { target: "apple", answer: "a", choices: ["a", "f", "g", "h"], letters: ["a", "f", "g", "h"] },
  armchair: { target: "apple", answer: "a", choices: ["a", "m", "s", "t"], letters: ["a", "m", "s", "t"] },
  artichoke: { target: "apple", answer: "a", choices: ["a", "b", "c", "d"], letters: ["a", "b", "c", "d"] },
  asparagus: { target: "ant", answer: "a", choices: ["a", "b", "c", "d"], letters: ["a", "b", "c", "d"] }
};

const GRAMMAR_SENTENCE_OVERRIDES = {
  bake: ["Mum will ___ a loaf of bread in the oven.", "Mum will bake a loaf of bread in the oven."],
  slide: ["The child will ___ down the hill at the park.", "The child will slide down the hill at the park."],
  leaf: ["The ___ was shaped like a hand.", "The leaf was shaped like a hand."]
};

function readWorkbookRows() {
  const code = String.raw`
import json, sys
from openpyxl import load_workbook

path = sys.argv[1]
sheets = ["Grammar_Nouns", "Grammar_Verbs", "Grammar_Adjectives", "Homophones"]
wb = load_workbook(path, data_only=True, read_only=True)
out = {}
for sheet_name in sheets:
    ws = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))
    headers = [str(value).strip() if value is not None else "" for value in rows[0]]
    data = []
    for row in rows[1:]:
        item = {}
        for index, header in enumerate(headers):
            if not header:
                continue
            value = row[index] if index < len(row) else None
            item[header] = "" if value is None else str(value).strip()
        if item.get("approved", "").upper() == "Y":
            data.append(item)
    out[sheet_name] = data
print(json.dumps(out))
`;
  return JSON.parse(execFileSync(pythonBin, ["-c", code, workbookPath], { encoding: "utf8" }));
}

function parseChoices(value = "") {
  return String(value || "")
    .split("|")
    .map(choice => choice.trim().toLowerCase())
    .filter(Boolean);
}

function rowMap(rows, skill) {
  const out = new Map();
  rows.forEach(row => {
    const target = String(row.target_word || "").trim().toLowerCase();
    const sentence = String(row.sentence_with_blank || "");
    if (!target || target.startsWith("adj_") || !sentence.includes("___")) return;
    if (!parseChoices(row.answer_choices).includes(target)) return;
    out.set(target, {
      target,
      prompt: row.prompt || `Choose the ${skill.slice(0, -1)} that fits the sentence.`,
      sentence,
      fullSentence: row.full_sentence || sentence.replace("___", target),
      answer: target,
      choices: parseChoices(row.answer_choices)
    });
  });
  return out;
}

function fallbackRow(skill, target) {
  const source = skill === "nouns" ? FALLBACK_NOUN_ROWS :
    skill === "verbs" ? FALLBACK_VERB_ROWS :
    skill === "adjectives" ? FALLBACK_ADJECTIVE_ROWS :
    null;
  const row = source?.[target];
  if (!row) {
    throw new Error(`Missing approved or explicit fallback sentence-fit row for ${skill}:${target}`);
  }
  return {
    target,
    prompt: `Choose the ${skill.slice(0, -1)} that fits the sentence.`,
    sentence: row[0],
    fullSentence: row[1],
    answer: target,
    choices: parseChoices(row[2])
  };
}

function optionFactory(question) {
  const existingOptions = [...(question.answerOptions || []), ...(question.options || [])];
  const audioByWord = new Map();
  existingOptions.forEach(option => {
    const word = String(option?.word || option?.value || option?.label || "").toLowerCase();
    if (word && (option.audio || option.audioPath || option.audioUrl)) {
      audioByWord.set(word, option);
    }
  });
  return (word, correct, partOfSpeech = "") => {
    const existing = audioByWord.get(word) || {};
    return {
      label: word,
      value: word,
      text: word,
      word,
      correct: Boolean(correct),
      ...(partOfSpeech ? { partOfSpeech } : {}),
      ...(existing.audio ? { audio: existing.audio } : {}),
      ...(existing.audioPath ? { audioPath: existing.audioPath } : {}),
      ...(existing.audioUrl ? { audioUrl: existing.audioUrl } : {})
    };
  };
}

function repairGrammarQuestion(question, row, partOfSpeech) {
  const override = GRAMMAR_SENTENCE_OVERRIDES[row.answer] || GRAMMAR_SENTENCE_OVERRIDES[row.target];
  const sentence = override?.[0] || row.sentence;
  const fullSentence = override?.[1] || row.fullSentence;
  const makeOption = optionFactory(question);
  const choices = row.choices.slice(0, 4);
  const answerOptions = choices.map(choice => makeOption(choice, choice === row.answer, partOfSpeech));
  return {
    ...question,
    formatType: "GRAMMAR_SENTENCE_FIT",
    templateType: "GRAMMAR_SENTENCE_FIT",
    questionType: "GRAMMAR_SENTENCE_FIT",
    prompt: row.prompt,
    question: row.prompt,
    spokenPrompt: `${fullSentence} Choose the word that fits.`,
    sentence,
    sentenceWithBlank: sentence,
    fullSentence,
    targetWord: row.target,
    correctAnswer: row.answer,
    answer: row.answer,
    choices,
    answerOptions,
    options: answerOptions,
    distractorType: "sentence_fit_contrast",
    distractors: choices.filter(choice => choice !== row.answer)
  };
}

function repairPreposition(question) {
  const answer = String(question.answer || question.targetWord || "").toLowerCase();
  const rowNumber = Number(String(question.id || "").match(/_(\d+)$/)?.[1] || 0);
  const scene = sceneForPrepositionQuestion(answer, rowNumber);
  const sentence = scene?.sentence || `The object is ___ the scene.`;
  const fullSentence = scene?.fullSentence || `The object is ${answer} the scene.`;
  const imagePath = scene?.imagePath || question.imagePath || question.imageUrl;
  const prompt = "Choose the word that fits the sentence.";
  return {
    ...question,
    prompt,
    question: prompt,
    spokenPrompt: `${fullSentence} Choose the word that fits.`,
    sentence,
    sentenceWithBlank: sentence,
    visibleSentenceWithBlank: sentence,
    fullSentence,
    imagePath,
    imageUrl: imagePath,
    questionType: "PREPOSITION_IMAGE_SENTENCE_FIT",
    templateType: "PREPOSITION_IMAGE_SENTENCE_FIT"
  };
}

function repairHomophoneQuestion(question, row) {
  const answer = String(row.correct_answer || row.target_word || "").trim().toLowerCase();
  const choices = parseChoices(row.answer_choices);
  const makeOption = optionFactory(question);
  const answerOptions = choices.map(choice => makeOption(choice, choice === answer));
  return {
    ...question,
    formatType: "HOMOPHONE_CONTEXT_CLOZE",
    templateType: "HOMOPHONE_CONTEXT_CLOZE",
    questionType: "HOMOPHONE_CONTEXT_CLOZE",
    prompt: row.prompt || "Choose the word that fits the sentence.",
    question: row.prompt || "Choose the word that fits the sentence.",
    spokenPrompt: `${row.full_sentence || row.sentence_with_blank} Choose the word that fits.`,
    sentence: row.sentence_with_blank,
    sentenceWithBlank: row.sentence_with_blank,
    fullSentence: row.full_sentence,
    targetWord: answer,
    correctAnswer: answer,
    answer,
    choices,
    answerOptions,
    options: answerOptions,
    homophoneSet: row.homophone_set,
    distractorType: "same_homophone_set"
  };
}

function repairLanguageBank(workbookRows) {
  const workbookMaps = {
    nouns: rowMap(workbookRows.Grammar_Nouns, "nouns"),
    verbs: rowMap(workbookRows.Grammar_Verbs, "verbs"),
    adjectives: rowMap(workbookRows.Grammar_Adjectives, "adjectives")
  };
  const homophoneRows = workbookRows.Homophones.filter(row =>
    String(row.target_word || "").trim() && String(row.sentence_with_blank || "").includes("___")
  );
  let homophoneIndex = 0;

  const grammarParts = new Map([
    ["nouns", "noun"],
    ["verbs", "verb"],
    ["adjectives", "adjective"]
  ]);

  return languageSkillQuestions.map(question => {
    if (grammarParts.has(question.skillId)) {
      const target = String(question.targetWord || question.answer || "").toLowerCase();
      const row = workbookMaps[question.skillId].get(target) || fallbackRow(question.skillId, target);
      return repairGrammarQuestion(question, row, grammarParts.get(question.skillId));
    }
    if (question.skillId === "prepositions_of_place") {
      return repairPreposition(question);
    }
    if (question.skillId === "homophones_homonyms") {
      const row = homophoneRows[homophoneIndex];
      homophoneIndex += 1;
      if (!row) throw new Error(`Missing homophone workbook row for ${question.id}`);
      return repairHomophoneQuestion({
        ...question,
        id: row.question_id_suggestion || question.id
      }, row);
    }
    return question;
  });
}

function assetFor(word) {
  const asset = getChildWordAsset(word);
  if (!asset?.image || !asset?.audio) {
    throw new Error(`Missing approved image/audio for initial-sound replacement word: ${word}`);
  }
  return asset;
}

function repairInitialGapQuestion(question) {
  if (question.skillId !== "initial_sounds") return question;
  const oldTarget = String(question.targetWord || "").toLowerCase();
  const replacement = INITIAL_REPLACEMENTS[oldTarget];
  if (!replacement) return question;
  const asset = assetFor(replacement.target);
  const prompt = `What sound does ${replacement.target} start with?`;
  return {
    ...question,
    id: `${question.id}_replaced_${replacement.target}`,
    prompt,
    question: prompt,
    spokenPrompt: `What sound does ${replacement.target} start with?`,
    targetWord: replacement.target,
    audioText: replacement.target,
    correctAnswer: replacement.answer,
    answer: replacement.answer,
    choices: replacement.choices,
    answerOptions: replacement.choices,
    options: replacement.choices,
    letters: replacement.letters,
    imageUrl: asset.image,
    imagePath: asset.image,
    targetImage: asset.image,
    targetImagePath: asset.image,
    audioUrl: asset.audio,
    audioPath: asset.audio,
    mediaTarget: replacement.target,
    imageKey: replacement.target,
    audioKey: replacement.target,
    replacementFor: oldTarget,
    qaStatus: "approved_media_backed_replacement"
  };
}

function writeGeneratedFile(relativePath, exportName, value, header) {
  const output = `${header}\n\nexport const ${exportName} = ${JSON.stringify(value, null, 2)};\n`;
  fs.writeFileSync(path.join(rootDir, relativePath), output);
}

function assertLanguageQuality(questions) {
  const genericPatterns = [
    "The ___ is in the picture.",
    "They can ___.",
    "The picture is ___."
  ];
  const failures = [];
  questions.forEach(question => {
    if (["nouns", "verbs", "adjectives"].includes(question.skillId)) {
      if (!String(question.sentence || "").includes("___")) failures.push(`${question.id}: missing sentence blank`);
      if (genericPatterns.includes(question.sentence)) failures.push(`${question.id}: generic grammar frame remains`);
      if (!question.choices?.includes(question.answer)) failures.push(`${question.id}: answer missing from choices`);
    }
    if (question.skillId === "prepositions_of_place") {
      const answer = String(question.answer || question.correctAnswer || "").toLowerCase();
      const promptText = `${question.prompt || ""} ${question.question || ""}`.toLowerCase();
      if (answer && new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(promptText)) {
        failures.push(`${question.id}: preposition prompt contains answer`);
      }
    }
    if (question.skillId === "homophones_homonyms") {
      if (!String(question.sentence || "").includes("___")) failures.push(`${question.id}: homophone missing context blank`);
      if (!question.choices?.includes(question.answer)) failures.push(`${question.id}: homophone answer missing from choices`);
    }
  });
  if (failures.length) throw new Error(failures.slice(0, 20).join("\n"));
}

function main() {
  if (!fs.existsSync(workbookPath)) throw new Error(`Workbook not found: ${workbookPath}`);
  const workbookRows = readWorkbookRows();
  const repairedLanguage = repairLanguageBank(workbookRows);
  const repairedGaps = skillLevelGapQuestions.map(repairInitialGapQuestion);
  assertLanguageQuality(repairedLanguage);

  writeGeneratedFile(
    "src/data/generated/languageSkillQuestions.generated.js",
    "languageSkillQuestions",
    repairedLanguage,
    "// Generated by tools/importSkillWordBankWorkbook.js; repaired by tools/applyQuestionBankFixWorkbook.js from LiteracyPath_QuestionBank_Fix_Workbook.xlsx. Do not hand-edit."
  );
  writeGeneratedFile(
    "src/data/generated/skillLevelGapQuestions.generated.js",
    "skillLevelGapQuestions",
    repairedGaps,
    "// Generated skill level gap bank; repaired by tools/applyQuestionBankFixWorkbook.js for approved K-3 initial-sound replacements. Do not hand-edit."
  );
  console.log(`Repaired ${repairedLanguage.length} language questions and ${repairedGaps.length} skill-level gap questions.`);
}

main();
