import { skillTree } from "../src/skillTree.js";
import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { initialSoundCoverageQuestions } from "../src/data/initialSoundCoverageQuestions.js";
import { coverageExpectations } from "../src/data/coverageExpectations.js";
import { enrichListenAndFindWordQuestion, getListenAndFindAssetDiagnostics } from "../src/data/listenAndFindAssets.js";
import { templateQuestions } from "../src/data/templateQuestions.js";
import { templateExpansion } from "../src/data/templateExpansion.js";
import { templateExpansion2 } from "../src/data/templateExpansion2.js";
import { templateExpansion3 } from "../src/data/templateExpansion3.js";
import { templateExpansion4 } from "../src/data/templateExpansion4.js";
import { templateExpansion5 } from "../src/data/templateExpansion5.js";
import { templateExpansion6 } from "../src/data/templateExpansion6.js";
import { templateExpansion7 } from "../src/data/templateExpansion7.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";

const runtimeQuestionBanks = [
  ["masteryCoreQuestions", masteryCoreQuestions],
  ["masteryExtraQuestions", masteryExtraQuestions],
  ["initialSoundCoverageQuestions", initialSoundCoverageQuestions],
  ["templateQuestions", templateQuestions],
  ["templateExpansion", templateExpansion],
  ["templateExpansion2", templateExpansion2],
  ["templateExpansion3", templateExpansion3],
  ["templateExpansion4", templateExpansion4],
  ["templateExpansion5", templateExpansion5],
  ["templateExpansion6", templateExpansion6],
  ["templateExpansion7", templateExpansion7],
  ["generatedQuestions", generatedQuestions],
  ["fixSentenceQuestions", fixSentenceQuestions],
  ["templateComprehensionAdvanced", templateComprehensionAdvanced]
];

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

const coverageEnabledStages = new Set([
  "Initial Sounds",
  "Final Sounds",
  "Rhyming",
  "CVC and Short Vowels",
  "Short Vowel Discrimination",
  "High-Frequency Words 1-25",
  "High-Frequency Words 26-50",
  "High-Frequency Words 51-100",
  "Blends",
  "Digraphs",
  "Long Vowels and Silent E",
  "Vowel Teams",
  "R-Controlled Vowels"
]);

const vowelTeamPatterns = ["ai", "ay", "ee", "ea", "oa", "ow", "igh", "ie", "oo", "ue", "ew", "oi", "oy", "ou", "aw"];
const rControlledPatterns = ["ar", "er", "ir", "or", "ur"];
const blendPatterns = ["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw"];
const digraphPatterns = ["sh", "ch", "th", "wh", "ph"];

function findPattern(patterns, text) {
  const normalized = normalize(text);
  return patterns.find(pattern => normalized.includes(pattern));
}

function inferCoverageMetadata(question, stageLabel) {
  if (question.itemType && question.itemKey) {
    return { itemType: question.itemType, itemKey: normalize(question.itemKey) };
  }

  const answer = normalize(question.answer);
  const text = normalize([question.question, question.prompt, question.spokenPrompt, question.audioText, question.passage, answer].join(" "));
  if (!answer) return null;

  if (stageLabel.startsWith("High-Frequency Words")) return { itemType: "sight_word", itemKey: answer };
  if (stageLabel === "Initial Sounds") return { itemType: "initial_sound", itemKey: answer[0] };
  if (stageLabel === "Final Sounds") return { itemType: "final_sound", itemKey: answer.at(-1) };
  if (stageLabel === "Rhyming") {
    const anchor = text.match(/rhymes? with ([a-z]+)/)?.[1];
    return { itemType: "rhyming_family", itemKey: (anchor || answer).slice(-2) };
  }
  if (stageLabel === "CVC and Short Vowels") return { itemType: "cvc_word", itemKey: answer };
  if (stageLabel === "Short Vowel Discrimination") {
    const vowel = answer.split("").find(letter => "aeiou".includes(letter));
    return vowel ? { itemType: "short_vowel", itemKey: `short_${vowel}` } : null;
  }
  if (stageLabel === "Blends") {
    const pattern = findPattern(blendPatterns, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stageLabel === "Digraphs") {
    const pattern = findPattern(digraphPatterns, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stageLabel === "Long Vowels and Silent E") {
    const pattern = text.match(/long ([aeiou])/)?.[1] || answer.match(/([aeiou])[^aeiou]?e$/)?.[1];
    return pattern ? { itemType: "phonics_pattern", itemKey: `${pattern}_e` } : null;
  }
  if (stageLabel === "Vowel Teams") {
    const pattern = findPattern(vowelTeamPatterns, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }
  if (stageLabel === "R-Controlled Vowels") {
    const pattern = findPattern(rControlledPatterns, `${answer} ${text}`);
    return pattern ? { itemType: "phonics_pattern", itemKey: pattern } : null;
  }

  return null;
}

function getStageIndex(question) {
  const skill = normalize(question.skill);

  const exactIndex = skillTree.findIndex(stage =>
    stage.match.some(term => skill === normalize(term))
  );

  if (exactIndex !== -1) return exactIndex;

  return skillTree.findIndex(stage =>
    stage.match.some(term =>
      skill.includes(normalize(term)) ||
      normalize(term).includes(skill)
    )
  );
}

function isFixSentenceQuestion(question) {
  return question?.questionType === "fix_sentence";
}

function isWordRecognitionQuestion(question) {
  const typeText = normalize([question.questionType, question.formatType].join(" "));
  return typeText.includes("word recognition") || typeText.includes("print match");
}

function getAnchorWord(question) {
  const text = normalize([question.question, question.prompt, question.spokenPrompt].join(" "));
  const match =
    text.match(/\b(?:starts the same as|ends the same as|starts like|ends like|has the same middle sound as|same sound in the middle as) ([a-z]+)\b/);

  return match?.[1] || "";
}

function hasAnchorChoiceLeakage(question) {
  if (isWordRecognitionQuestion(question)) return false;

  const anchor = getAnchorWord(question);
  if (!anchor || !Array.isArray(question.choices)) return false;

  return question.choices.map(choice => normalize(choice)).includes(anchor);
}

function sentenceCompletionMissingContext(question) {
  const promptText = String([question.question, question.prompt, question.spokenPrompt].join(" "));
  if (!/\b(complete(?:s)? the sentence|best completes the sentence)\b/i.test(promptText)) return false;

  return !(question.passage || question.sentence || question.context || question.brokenSentence);
}

function isQuestionValid(question) {
  if (!question) return false;
  if (!question.id || !question.skill || !(question.prompt || question.question)) return false;

  if (isFixSentenceQuestion(question)) {
    const tiles = question.tiles || question.choices;

    return Boolean(
      question.correctSentence &&
      question.brokenSentence &&
      Array.isArray(tiles) &&
      tiles.length >= 2 &&
      getStageIndex(question) !== -1
    );
  }

  if (!question.answer) return false;
  if (!Array.isArray(question.choices) || question.choices.length < 2) return false;
  if (!question.choices.includes(question.answer)) return false;
  if (getStageIndex(question) === -1) return false;
  if (hasAnchorChoiceLeakage(question)) return false;
  if (sentenceCompletionMissingContext(question)) return false;

  const choices = question.choices.map(choice => normalize(choice));
  if (new Set(choices).size !== choices.length) return false;

  const questionText = normalize(question.question);
  const allText = [
    question.question,
    question.skill,
    question.passage,
    ...question.choices
  ].join(" ").toLowerCase();

  if (questionText.includes("silent letter")) return false;
  if (allText.includes("sun") && allText.includes("son") && allText.includes("middle")) return false;
  if (questionText.includes("which word spells")) return false;
  if (questionText.includes("matches the picture") && !question.imagePath) return false;

  return true;
}

const runtimeQuestions =
  runtimeQuestionBanks.flatMap(([source, questions]) =>
    questions.map(question => ({ ...enrichListenAndFindWordQuestion(question), source }))
  );

const matchedQuestions = runtimeQuestions.filter(isQuestionValid);
const counts = skillTree.map((stage, index) => ({
  stage,
  count: matchedQuestions.filter(question => getStageIndex(question) === index).length
}));

console.log(`Runtime questions scanned: ${runtimeQuestions.length}`);
console.log(`Runtime questions matched and valid: ${matchedQuestions.length}`);
console.log("");

for (const { stage, count } of counts) {
  console.log(`${String(count).padStart(3)}  ${stage.label}`);
}

console.log("");
console.log("Coverage-enabled skill diagnostics:");

for (const stage of skillTree.filter(item => coverageEnabledStages.has(item.label))) {
  const stageQuestions = matchedQuestions.filter(question => getStageIndex(question) === skillTree.indexOf(stage));
  const byKey = new Map();

  for (const question of stageQuestions) {
    const metadata = inferCoverageMetadata(question, stage.label);
    if (!metadata?.itemKey || !metadata?.itemType) continue;
    const key = metadata.itemKey;
    byKey.set(key, (byKey.get(key) || 0) + 1);
  }

  const runtimeKeys = [...byKey.keys()].sort();
  const configured = coverageExpectations[stage.id];
  const expectedKeys = configured?.itemKeys || runtimeKeys;
  const missingKeys = expectedKeys.filter(key => !byKey.has(key));
  const impossibleKeys = expectedKeys.filter(key => !runtimeKeys.includes(key));
  const expectedTotal = configured?.total || expectedKeys.length;

  console.log(`- ${stage.label}`);
  console.log(`  expected total: ${expectedTotal} ${configured?.unit || "items"}${configured?.note ? ` (${configured.note})` : ""}`);
  console.log(`  runtime unique itemKeys: ${runtimeKeys.length}${runtimeKeys.length ? ` [${runtimeKeys.join(", ")}]` : ""}`);
  console.log(`  missing itemKeys: ${missingKeys.length ? missingKeys.join(", ") : "none"}`);
  console.log(`  questions per itemKey: ${runtimeKeys.map(key => `${key}:${byKey.get(key)}`).join(", ") || "none"}`);

  if (configured?.itemKeys && impossibleKeys.length > 0) {
    console.warn(`  warning: configured total is impossible with current runtime pool; missing ${impossibleKeys.join(", ")}`);
  }
}

const listenAndFindDiagnostics = matchedQuestions
  .map(question => getListenAndFindAssetDiagnostics(question))
  .filter(Boolean);
const listenAndFindMissingImages = listenAndFindDiagnostics
  .filter(item => item.missingImages.length > 0 || item.missingChoiceAssets.length > 0);
const listenAndFindMissingAudio = listenAndFindDiagnostics
  .filter(item => item.missingAudio);
const listenAndFindBadAudioText = listenAndFindDiagnostics
  .filter(item => !item.usesSingleWordAudioText);

console.log("");
console.log("Listen & Find Word diagnostics:");
console.log(`  questions: ${listenAndFindDiagnostics.length}`);
console.log(`  questions missing option images: ${listenAndFindMissingImages.length}`);
console.log(`  questions missing static target mp3: ${listenAndFindMissingAudio.length}`);
console.log(`  questions not using one-word audio text: ${listenAndFindBadAudioText.length}`);

for (const item of listenAndFindMissingImages.slice(0, 20)) {
  console.warn(`  missing images: ${item.question.id} -> ${[...new Set([...item.missingImages, ...item.missingChoiceAssets])].join(", ")}`);
}

for (const item of listenAndFindMissingAudio.slice(0, 20)) {
  console.warn(`  missing mp3: ${item.question.id} -> ${item.question.answer}`);
}

const emptyStages = counts.filter(({ count }) => count === 0);
const missingCoverageMetadata = matchedQuestions
  .map(question => {
    const stage = skillTree[getStageIndex(question)];
    return { question, stage };
  })
  .filter(({ question, stage }) =>
    stage &&
    coverageEnabledStages.has(stage.label) &&
    !inferCoverageMetadata(question, stage.label)
  );

if (emptyStages.length > 0) {
  console.log("");
  console.error("Missing runtime questions for:");
  for (const { stage } of emptyStages) {
    console.error(`- ${stage.label}`);
  }

  process.exit(1);
}

if (missingCoverageMetadata.length > 0) {
  console.log("");
  console.error("Coverage-enabled runtime questions missing item metadata:");
  for (const { question, stage } of missingCoverageMetadata.slice(0, 25)) {
    console.error(`- ${stage.label}: ${question.id} "${question.question || question.prompt}"`);
  }

  process.exit(1);
}

console.log("");
console.log("Runtime question coverage passed.");
