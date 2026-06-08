import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { languageSkillQuestions } from "../src/data/generated/languageSkillQuestions.generated.js";
import { generatedEarlySkillQuestions } from "../src/data/generated/earlySkillQuestions.generated.js";
import { skillLevelGapQuestions } from "../src/data/generated/skillLevelGapQuestions.generated.js";
import { longVowelsAssessmentQuestions } from "../src/data/generated/longVowelsAssessmentQuestions.generated.js";
import { vowelTeamsVarietyQuestions } from "../src/data/generated/vowelTeamsVarietyQuestions.generated.js";
import { blendsAssessmentQuestions } from "../src/data/generated/blendsAssessmentQuestions.generated.js";
import { getRhymeGroup } from "../src/data/rhymeGroups.js";
import { selectableRuntimeQuestionsForSkill } from "./phonicsRuntimeUtils.js";

const failures = [];
const fail = message => failures.push(message);
const byId = (rows, id) => rows.find(row => row.id === id);
const same = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
const choiceValue = choice => String(choice?.value || choice?.word || choice?.label || choice || "").toLowerCase();

const genericGrammarFrames = new Set([
  "This is the ___.",
  "It is ___.",
  "They ___.",
  "The ___ is in the picture.",
  "They can ___.",
  "The picture is ___."
]);

languageSkillQuestions.forEach(question => {
  if (["nouns", "verbs", "adjectives"].includes(question.skillId)) {
    if (genericGrammarFrames.has(question.sentence)) fail(`${question.id}: generic grammar frame remains`);
    if (!String(question.sentence || "").includes("___")) fail(`${question.id}: missing grammar sentence blank`);
    if (!question.choices?.includes(question.answer)) fail(`${question.id}: grammar answer missing from choices`);
  }
  if (question.skillId === "prepositions_of_place") {
    const answer = String(question.answer || question.correctAnswer || "").toLowerCase();
    const prompt = `${question.prompt || ""} ${question.question || ""}`.toLowerCase();
    if (answer && new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(prompt)) {
      fail(`${question.id}: preposition prompt contains the answer word`);
    }
  }
  if (question.skillId === "homophones_homonyms") {
    if (!String(question.sentence || "").includes("___")) fail(`${question.id}: homophone row has no context blank`);
    if (!question.choices?.includes(question.answer)) fail(`${question.id}: homophone answer missing from choices`);
    if ((question.choices || []).length < 2 || (question.choices || []).length > 3) {
      fail(`${question.id}: homophone choices are not a same-set pair/triple`);
    }
  }
});

["nouns", "verbs", "adjectives"].forEach(skillId => {
  selectableRuntimeQuestionsForSkill(skillId).forEach(question => {
    const sentence = question.sentence || question.sentenceWithBlank || "";
    if (genericGrammarFrames.has(sentence)) {
      fail(`${question.id}: active runtime ${skillId} generic grammar frame remains`);
    }
  });
});

const core001 = byId(masteryCoreQuestions, "core_cvc_001");
if (core001?.question !== "Find the word: cat.") fail("core_cvc_001 prompt was not updated");
if (!same(core001?.choices, ["cat", "bat", "cap", "can"])) fail("core_cvc_001 choices are not workbook-approved");

const core003 = byId(masteryCoreQuestions, "core_cvc_003");
if (!same(core003?.choices, ["red", "bad", "big", "bud"])) fail("core_cvc_003 choices are not workbook-approved");

const core006 = byId(masteryCoreQuestions, "core_cvc_006");
if (!same(core006?.choices, ["cup", "cap", "cop", "cot"])) fail("core_cvc_006 still has weak/nonword choices");

const expectedInitialExtras = {
  extra_initial_1: ["map", "bat", "pin", "log"],
  extra_initial_2: ["sock", "mat", "fig", "hut"],
  extra_initial_3: ["tub", "dog", "cap", "rig"],
  extra_initial_4: ["pan", "bug", "sit", "dot"],
  extra_initial_5: ["bat", "cup", "hid", "log"],
  extra_initial_6: ["nap", "bit", "dog", "sun"]
};
Object.entries(expectedInitialExtras).forEach(([id, choices]) => {
  if (!same(byId(masteryExtraQuestions, id)?.choices, choices)) fail(`${id}: repeated initial-sound distractors remain`);
});

const forbiddenInitialTargets = new Set(["almond", "anteater", "armchair", "artichoke", "asparagus"]);
skillLevelGapQuestions
  .filter(question => question.skillId === "initial_sounds")
  .forEach(question => {
    if (forbiddenInitialTargets.has(question.targetWord)) fail(`${question.id}: high-vocabulary initial-sound target remains`);
  });

generatedEarlySkillQuestions
  .filter(question => ["cvc_short_vowels", "short_vowel_discrimination"].includes(question.skillId))
  .forEach(question => {
    const words = [question.targetWord, question.answer, question.correctAnswer, ...(question.choices || []), ...(question.answerOptions || []).map(choiceValue)];
    if (words.includes("bid")) fail(`${question.id}: active CVC runtime uses blocked word bid`);
    if (words.includes("cip")) fail(`${question.id}: active CVC runtime uses nonword cip`);
  });

generatedEarlySkillQuestions
  .filter(question => question.skillId === "final_sounds")
  .forEach(question => {
    if (question.level === 1 && question.targetWord === "bulb") fail(`${question.id}: level 1 final-sound bulb remains`);
  });

generatedEarlySkillQuestions
  .filter(question => question.skillId === "rhyming")
  .forEach((question, index, rows) => {
    const distractors = (question.answerOptions || []).map(choiceValue).filter(word => word !== question.answer);
    const answerFamily = getRhymeGroup(question.answer);
    distractors.forEach(word => {
      if (getRhymeGroup(word) && getRhymeGroup(word) === answerFamily) {
        fail(`${question.id}: rhyming distractor ${word} rhymes with answer ${question.answer}`);
      }
      if (String(word).slice(-2) === String(question.answer || "").slice(-2)) {
        fail(`${question.id}: rhyming distractor ${word} shares final letters with answer ${question.answer}`);
      }
    });
    if (index > 0) {
      const previous = rows[index - 1];
      const prevDistractors = (previous.answerOptions || []).map(choiceValue).filter(word => word !== previous.answer).join("|");
      if (prevDistractors === distractors.join("|")) fail(`${question.id}: adjacent rhyming distractor set repeats`);
    }
  });

longVowelsAssessmentQuestions.forEach(question => {
  if (question.targetWord === "Pete") fail(`${question.id}: Pete remains active in long vowels`);
  if (question.level === 1 && ["concrete", "complete"].includes(question.targetWord)) {
    fail(`${question.id}: ${question.targetWord} remains in long vowels level 1`);
  }
});

vowelTeamsVarietyQuestions.forEach(question => {
  if (question.targetWord === "kiwifruit") fail(`${question.id}: kiwifruit remains active in vowel teams`);
});

blendsAssessmentQuestions.forEach(question => {
  if (question.level === 1 && ["shr", "squ", "thr"].includes(question.targetPattern)) {
    fail(`${question.id}: ${question.targetPattern} remains in basic Level 1 blends`);
  }
});

if (failures.length) {
  console.error(`Question bank fix guide compliance failed (${failures.length}):`);
  failures.slice(0, 80).forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Question bank fix guide compliance passed.");
