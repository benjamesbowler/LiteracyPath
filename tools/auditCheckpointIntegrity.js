// Checkpoint assessment integrity audit.
//
// Loads the SAME runtime-eligible question pools the app loads (via
// loadAssessmentSkillBank / loadHfwAssessmentBank) and FAILS (exit 1) on:
//   (a) rule-checkable prompts ("starts with X", "rhymes with Y", "middle
//       sound", "same first sound") where the set of options satisfying the
//       rule is not exactly the keyed answer(s);
//   (b) empty visible prompt (no prompt/question text) with a non-empty
//       passage (malformed record — the question hides in the passage);
//   (c) duplicate prompt+sentence+passage+target+answer pairs within a skill
//       across different levels in the SAME source file (authoring bugs);
//       cross-file duplicates from stacked expansion banks are reported as
//       warnings — de-duplicating those is a separate curation project;
//   (d) >35% of a comprehension skill's items (main_idea, theme, inference,
//       cause_effect) having the correct answer uniquely longest;
//   (e) runtime-eligible pool below 30 for any checkpoint skill (warns
//       below 45);
//   (f) distractors ending in trailing-padding artifacts ("… after lunch",
//       "… with friends", "… all the time", "… every day") where the phrase
//       is not the correct answer and does not appear in the passage —
//       pre-existing items are grandfathered in PADDING_LEGACY_QUESTION_IDS
//       so only NEW padding fails;
//   (g) preposition items whose distractor is a synonym of the correct answer
//       (in/inside/into, under/below/beneath, beside/near/next to, over/above,
//       behind/in back of) — pre-existing items are grandfathered in
//       PREPOSITION_SYNONYM_LEGACY_QUESTION_IDS so only NEW conflicts fail.
//
// WARNS (non-fatal) additionally on:
//   (h) passages longer than 90 words on difficulty <= 3 items.
//
// Run: npm run audit:checkpoints

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAssessmentSkillGroupMetadata,
  loadAssessmentSkillBank,
  loadHfwAssessmentBank
} from "../src/data/loadAssessmentSkillBank.js";
import { segmentWord } from "../src/utils/graphemeSegments.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const POOL_FLOOR_FAIL = 30;
const POOL_FLOOR_WARN = 45;
const UNIQUELY_LONGEST_MAX_SHARE = 0.35;
const LONGEST_TELL_SKILLS = new Set([
  "main_idea",
  "inference",
  "cause_effect",
  "theme_higher_comprehension"
]);

// Words whose written rime misleads a spelling-based rhyme check. Values are
// the spelling-rime of the regular family each word actually rhymes with.
const RIME_OVERRIDES = {
  bear: "air",
  pear: "air",
  wear: "air",
  there: "air",
  where: "air",
  their: "air",
  ear: "eer",
  dear: "eer",
  fear: "eer",
  hear: "eer",
  near: "eer",
  year: "eer",
  great: "ate",
  eight: "ate",
  weight: "ate",
  straight: "ate",
  wait: "ate",
  bait: "ate",
  break: "ake",
  steak: "ake",
  said: "ed",
  bread: "ed",
  head: "ed",
  one: "un",
  done: "un",
  none: "un",
  won: "un",
  come: "um",
  some: "um",
  give: "iv",
  live: "iv",
  love: "uv",
  dove: "uv",
  glove: "uv",
  above: "uv",
  move: "oov",
  prove: "oov",
  they: "ay",
  grey: "ay",
  gray: "ay",
  hey: "ay",
  prey: "ay",
  sleigh: "ay",
  weigh: "ay",
  do: "oo",
  to: "oo",
  two: "oo",
  who: "oo",
  you: "oo",
  shoe: "oo",
  through: "oo",
  blue: "oo",
  glue: "oo",
  clue: "oo",
  true: "oo",
  flew: "oo",
  grew: "oo",
  drew: "oo",
  threw: "oo",
  chew: "oo",
  dew: "oo",
  few: "oo",
  new: "oo",
  me: "ee",
  we: "ee",
  he: "ee",
  she: "ee",
  be: "ee",
  key: "ee",
  ski: "ee",
  sea: "ee",
  tea: "ee",
  pea: "ee",
  flea: "ee",
  toe: "o",
  doe: "o",
  hoe: "o",
  snow: "o",
  grow: "o",
  show: "o",
  slow: "o",
  blow: "o",
  glow: "o",
  flow: "o",
  throw: "o",
  low: "o",
  row: "o",
  mow: "o",
  tow: "o",
  crow: "o",
  bow: "o",
  hi: "y",
  pie: "y",
  tie: "y",
  die: "y",
  lie: "y",
  high: "y",
  sigh: "y",
  thigh: "y",
  buy: "y",
  guy: "y",
  eye: "y",
  bye: "y",
  dye: "y",
  word: "ird",
  heard: "ird",
  herd: "ird"
};

// Rime spellings that sound identical for one-syllable words.
const RIME_EQUIV = {
  ight: "ite",
  igh: "y",
  ie: "y",
  uy: "y"
};

const failures = [];
const warnings = [];
const flaggedLongestItems = [];

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cleanWord(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function promptOf(question = {}) {
  return String(question.prompt || question.question || question.spokenPrompt || "");
}

function answerOf(question = {}) {
  return String(question.answer ?? question.correctAnswer ?? "");
}

function expectedAnswers(question = {}) {
  const multi = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
  const list = multi.length ? multi : [answerOf(question)];
  return [...new Set(list.map(cleanWord).filter(Boolean))].sort();
}

function optionLabels(question = {}) {
  const raw = Array.isArray(question.answerOptions) && question.answerOptions.length
    ? question.answerOptions
    : Array.isArray(question.choices) && question.choices.length
      ? question.choices
      : Array.isArray(question.imageCards) && question.imageCards.length
        ? question.imageCards
        : [];
  return raw
    .map(option => (
      typeof option === "string" || typeof option === "number"
        ? String(option)
        : String(option?.word ?? option?.label ?? option?.value ?? "")
    ))
    .filter(Boolean);
}

function questionLevel(question = {}) {
  return Number(question.level ?? question.assessmentLevel ?? question.difficulty ?? 0) || 0;
}

function questionMediaIdentity(question = {}) {
  return [
    question.targetWord || "",
    question.audioWord || "",
    question.imageWord || "",
    question.targetLetter || question.letter || "",
    question.imagePath || question.imageUrl || question.targetImage || ""
  ].map(value => normalizeText(value)).join("|");
}

function describe(question = {}) {
  return `${question.id || "(no id)"} [${question._sourceFile || question._source || "unknown source"}]`;
}

// ── rule (a) helpers ───────────────────────────────────────────────────────

function firstGrapheme(word = "") {
  return segmentWord(cleanWord(word))[0] || "";
}

function wordStartsWithPattern(word = "", pattern = "") {
  const clean = cleanWord(word);
  const target = cleanWord(pattern);
  if (!target || !clean.startsWith(target)) return false;
  let joined = "";
  for (const segment of segmentWord(clean)) {
    joined += segment;
    if (joined === target) return true;
    if (joined.length >= target.length) return false;
  }
  return false;
}

function vowelGroupCount(word = "") {
  return (cleanWord(word).match(/[aeiouy]+/g) || []).length;
}

function rimeKey(word = "") {
  const clean = cleanWord(word);
  if (!clean) return "";
  if (RIME_OVERRIDES[clean]) return RIME_OVERRIDES[clean];

  // y at the start of a word is a consonant, not a vowel (yam, yes).
  const body = clean[0] === "y" ? clean.slice(1) : clean;
  // Magic-e rime (mouse → ouse, cake → ake) before the generic last-vowel rime.
  const magicE = body.match(/[aeiouy]+[^aeiouy]+e$/);
  const rawRime = magicE ? magicE[0] : (body.match(/[aeiouy]+[^aeiouy]*$/) || [body])[0];
  // Collapse doubled letters (bell → bel, egg → eg) so families compare evenly.
  let rime = rawRime.replace(/(.)\1+/g, "$1");
  if (vowelGroupCount(clean) === 1 && RIME_EQUIV[rime]) rime = RIME_EQUIV[rime];
  return rime;
}

function rhymesWithTarget(option = "", target = "") {
  const parts = String(option).toLowerCase().split(/\s+and\s+/).map(cleanWord).filter(Boolean);
  if (!parts.length) return false;
  return parts.every(part => rimeKey(part) === rimeKey(target));
}

function middleVowel(word = "") {
  const match = cleanWord(word).match(/[aeiou]+/);
  return match ? match[0] : "";
}

function hasBlendOnset(word = "") {
  const segments = segmentWord(cleanWord(word));
  const isConsonant = segment => segment && !/[aeiou]/.test(segment);
  return segments.length >= 2 && isConsonant(segments[0]) && isConsonant(segments[1]);
}

const SAME_FIRST_SOUND = /same (?:first|beginning) sound as ['"“]?([a-z]+)/i;
const MIDDLE_SOUND_AS = /same middle sound as ['"“]?([a-z]+)/i;
const MIDDLE_SOUND_IN = /middle sound (?:in|of) (?:the word )?['"“]?([a-z]+)/i;
const RHYMES_WITH = /rhymes? with ['"“]?([a-z]+)/i;
const RHYME_FEATURE = /rhymes? with ['"“]?([a-z]+)['"”]?,? and (?:has|starts with|contains)(?: a| the)? ([a-z]{2})? ?(blend|digraph)/i;
const NOT_RHYME_OTHERS = /not rhyme with the others/i;
const STARTS_WITH = /(?:starts?|begins?) with (?:the (?:letter|sound|blend|digraph)s? )?['"“]?([a-z]{1,4})['"”]?\s*[?.!]*\s*$/i;
const PATTERN_STARTS_WORD = /(?:which|what) (?:letters|blend|digraph|sound)s? (?:start|begin)s? (?:this|the) word/i;

function detectRule(question = {}) {
  const prompt = promptOf(question);
  if (!prompt) return null;
  const negated = /\bnot\b/i.test(prompt) || /\bNOT\b/.test(prompt);

  if (NOT_RHYME_OTHERS.test(prompt)) return { mode: "not_rhyme_others" };

  const rhymeFeature = prompt.match(RHYME_FEATURE);
  if (rhymeFeature) {
    return {
      mode: "rhyme_with_feature",
      target: cleanWord(rhymeFeature[1]),
      featurePattern: cleanWord(rhymeFeature[2] || ""),
      featureType: rhymeFeature[3].toLowerCase(),
      negated
    };
  }

  const sameFirst = prompt.match(SAME_FIRST_SOUND);
  if (sameFirst) return { mode: "same_first_sound", target: cleanWord(sameFirst[1]), negated };

  const middleAs = prompt.match(MIDDLE_SOUND_AS);
  if (middleAs) return { mode: "middle_sound_as", target: cleanWord(middleAs[1]), negated };

  // Phoneme-substitution prompts ("Change the middle sound in …") are not
  // membership rules over the option set, so they are out of scope here.
  const middleIn = prompt.match(MIDDLE_SOUND_IN);
  if (middleIn && !/change/i.test(prompt)) {
    return { mode: "middle_sound_in", target: cleanWord(middleIn[1]), negated };
  }

  const rhyme = prompt.match(RHYMES_WITH);
  if (rhyme) return { mode: "rhymes_with", target: cleanWord(rhyme[1]), negated };

  if (PATTERN_STARTS_WORD.test(prompt) && question.targetWord) {
    return { mode: "pattern_starts_word", target: cleanWord(question.targetWord), negated };
  }

  const startsWith = prompt.match(STARTS_WITH);
  if (startsWith && !/same/i.test(prompt)) {
    return { mode: "starts_with", target: cleanWord(startsWith[1]), negated };
  }

  return null;
}

function optionSatisfiesRule(option, rule) {
  const word = cleanWord(option);
  if (!word) return false;
  if (rule.mode === "starts_with") return wordStartsWithPattern(word, rule.target);
  if (rule.mode === "pattern_starts_word") return wordStartsWithPattern(rule.target, word);
  if (rule.mode === "same_first_sound") return firstGrapheme(word) === firstGrapheme(rule.target);
  if (rule.mode === "rhymes_with") return rhymesWithTarget(option, rule.target);
  if (rule.mode === "rhyme_with_feature") {
    if (!rhymesWithTarget(option, rule.target)) return false;
    if (rule.featureType === "blend") return hasBlendOnset(word);
    return rule.featurePattern ? word.includes(rule.featurePattern) : /sh|ch|th|wh|ph|ck|ng/.test(word);
  }
  if (rule.mode === "middle_sound_as") {
    return Boolean(middleVowel(word)) && middleVowel(word) === middleVowel(rule.target);
  }
  if (rule.mode === "middle_sound_in") {
    return word.length === 1 && word === middleVowel(rule.target);
  }
  return false;
}

function checkRuleCheckablePrompt(skillId, question) {
  const rule = detectRule(question);
  if (!rule) return;

  const options = optionLabels(question);
  if (options.length < 2) return;

  let satisfying;
  if (rule.mode === "not_rhyme_others") {
    // Exactly one option must not rhyme with the rest of the option set.
    satisfying = options.filter(option =>
      !options.some(other => other !== option && rhymesWithTarget(option, cleanWord(other)))
    );
  } else if (!rule.target) {
    return;
  } else if (rule.negated) {
    satisfying = options.filter(option => !optionSatisfiesRule(option, rule));
  } else {
    satisfying = options.filter(option => optionSatisfiesRule(option, rule));
  }

  const expected = expectedAnswers(question);
  const satisfyingClean = [...new Set(satisfying.map(cleanWord))].sort();

  if (satisfyingClean.join("|") !== expected.join("|")) {
    failures.push(
      `[rule] ${skillId} ${describe(question)}: "${promptOf(question)}" — ` +
      `options satisfying ${rule.mode}${rule.target ? `(${rule.target})` : ""}${rule.negated ? " [negated]" : ""} ` +
      `are [${satisfying.join(", ")}] of [${options.join(", ")}] but the key is [${expected.join(", ")}]`
    );
  }
}

// ── rule (b): malformed record ─────────────────────────────────────────────

function checkEmptyPromptWithPassage(skillId, question) {
  const hasVisiblePrompt = Boolean(
    String(question.prompt || "").trim() ||
    String(question.question || "").trim()
  );
  if (!hasVisiblePrompt && String(question.passage || "").trim()) {
    failures.push(
      `[prompt] ${skillId} ${describe(question)}: empty prompt with non-empty passage ` +
      `("${String(question.passage).slice(0, 60)}…")`
    );
  }
}

// ── rule (f): trailing-padding artifacts on distractors ────────────────────

// Length-padding artifacts appended to distractors to match the correct
// answer's length ("what toothpaste is made of all the time").
const PADDING_ARTIFACT_PATTERN = /( every day){2,}|(?: after lunch| with friends| all the time| every day)$/;

// Pre-existing padded distractors OUTSIDE the 2026-07 qbAssess_* padding fix
// (templateExpansion*, questionBankExpansion13/14, generatedQuestions),
// captured 2026-07-10. Grandfathered so this rule can hard-fail on NEW
// padding without blocking the build on legacy items awaiting content
// curation. Remove ids from this list as their content is fixed.
const PADDING_LEGACY_QUESTION_IDS = new Set(["RC006","RC007","RC018","RC038","RC045","exp2_comp_7","exp2_comp_8","exp4_comp_12","exp4_comp_16","exp4_comp_18","exp6_comp_11","exp6_comp_17","exp6_comp_18","exp6_comp_29","exp7_cause_effect_14","exp7_cause_effect_15","exp7_cause_effect_18","exp7_cause_effect_19","exp7_cause_effect_20","exp7_cause_effect_3","exp7_main_idea_10","exp7_main_idea_6","inf_2_3_004","inf_2_3_008","inf_2_3_009","inf_2_3_010","inf_2_3_012","inf_2_3_013","inf_2_3_017","inf_2_3_018","inf_2_3_028","inf_2_3_029","inf_2_3_030","inf_2_3_033","inf_2_3_038","inf_2_3_040","inf_2_3_042","inf_2_3_044","inf_2_3_045","inf_2_3_049","inf_2_3_051","inf_2_3_052","inf_2_3_056","inf_2_3_057","inf_2_3_058","inf_2_3_062","inf_2_3_063","inf_2_3_064","inf_2_3_065","inf_2_3_070","inf_2_3_074","inf_2_3_076","inf_2_3_077","qb13_ce_003","qb13_ce_004","qb13_ce_005","qb13_ce_010","qb13_ce_011","qb13_ce_013","qb13_ce_014","qb13_ce_015","qb13_ce_018","qb13_ce_034","qb13_ce_035","qb13_ce_038","qb13_ce_039","qb13_mi_004","qb13_mi_008","qb13_mi_009","qb13_mi_010","qb13_mi_012","qb13_mi_018","qb13_mi_019","qb13_mi_020","qb13_mi_027","qb13_mi_033","qb13_mi_034","qb13_mi_036","qb13_mi_039","qb13_mi_040","qb14_cc_029","qb14_th_002","qb14_th_013","qb14_th_015","qb14_th_017","qb14_th_018","qb14_th_019","qb14_th_022","qb14_th_025","qb14_th_032","qb14_th_035","qb14_th_037","qb14_th_038","qb14_th_039","qb14_th_041","qb14_th_042","qb14_th_043","qb14_th_049","qb14_th_050","qb14_th_055","qb14_th_057","qb14_th_060","template_main_idea_1"]);

// Reviewed items where the matched phrase is natural language, NOT padding
// (e.g. "She started a reading group with friends" is a coherent
// alternative-cause distractor). Keep this list tiny and reviewed by hand.
const PADDING_FALSE_POSITIVE_QUESTION_IDS = new Set([
  "qa_ce_l1_012" // reviewed 2026-07-10: "a reading group with friends" is the noun phrase, not padding
]);

function cleanPhraseText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?,;:]+$/, "");
}

function checkPaddedDistractorArtifacts(skillId, question) {
  const correctSet = new Set(
    [answerOf(question), ...(Array.isArray(question.correctAnswers) ? question.correctAnswers : [])]
      .map(cleanPhraseText)
      .filter(Boolean)
  );
  if (!correctSet.size) return;
  const passage = cleanPhraseText(
    [question.passage, question.sentence, question.context].filter(Boolean).join(" ")
  );
  for (const option of optionLabels(question)) {
    const optionText = cleanPhraseText(option);
    if (!optionText || correctSet.has(optionText)) continue;
    const match = optionText.match(PADDING_ARTIFACT_PATTERN);
    if (!match) continue;
    const phrase = match[0].trim();
    if (phrase && passage.includes(phrase)) continue;
    if (PADDING_LEGACY_QUESTION_IDS.has(String(question.id || ""))) continue;
    if (PADDING_FALSE_POSITIVE_QUESTION_IDS.has(String(question.id || ""))) continue;
    failures.push(
      `[padding] ${skillId} ${describe(question)}: distractor "${option}" ends in ` +
      `padding artifact "${phrase}" that is not in the passage`
    );
  }
}

// ── rule (g): preposition distractor is a synonym of the correct answer ────

const PREPOSITION_SYNONYM_SETS = [
  ["in", "inside", "into"],
  ["under", "below", "beneath"],
  ["beside", "near", "next to"],
  ["over", "above"],
  ["behind", "in back of"]
];

// Pre-existing synonym conflicts in the generated preposition banks
// (languageSkillQuestions/secondBlockSkillTopUpQuestions), captured
// 2026-07-10. These are real two-plausible-answers defects that need content
// curation; grandfathered so this rule hard-fails only on NEW conflicts.
const PREPOSITION_SYNONYM_LEGACY_QUESTION_IDS = new Set(["second_prepositions_l1_04_beside","second_prepositions_l2_06_sentence_near","second_prepositions_l2_15_context_above","workbook_prepositions_above_96","workbook_prepositions_above_97","workbook_prepositions_above_98","workbook_prepositions_beside_43","workbook_prepositions_beside_44","workbook_prepositions_beside_45","workbook_prepositions_beside_46","workbook_prepositions_beside_47","workbook_prepositions_beside_48","workbook_prepositions_in_12","workbook_prepositions_in_13","workbook_prepositions_in_14","workbook_prepositions_in_15","workbook_prepositions_in_16","workbook_prepositions_in_17","workbook_prepositions_inside_150","workbook_prepositions_inside_151","workbook_prepositions_inside_152","workbook_prepositions_inside_153","workbook_prepositions_into_184","workbook_prepositions_into_185","workbook_prepositions_into_186","workbook_prepositions_into_189","workbook_prepositions_near_80","workbook_prepositions_near_84","workbook_prepositions_near_85","workbook_prepositions_near_86","workbook_prepositions_next-to_116","workbook_prepositions_next-to_117","workbook_prepositions_next-to_118","workbook_prepositions_under_26","workbook_prepositions_under_27","workbook_prepositions_under_28"]);

function checkPrepositionSynonymOptions(skillId, question) {
  if (skillId !== "prepositions_of_place") return;
  const answer = cleanPhraseText(answerOf(question));
  const synonymSet = PREPOSITION_SYNONYM_SETS.find(set => set.includes(answer));
  if (!synonymSet) return;
  for (const option of optionLabels(question)) {
    const optionText = cleanPhraseText(option);
    if (!optionText || optionText === answer || !synonymSet.includes(optionText)) continue;
    if (PREPOSITION_SYNONYM_LEGACY_QUESTION_IDS.has(String(question.id || ""))) continue;
    failures.push(
      `[preposition-synonym] ${skillId} ${describe(question)}: option "${option}" is a ` +
      `synonym of the correct answer "${answerOf(question)}" — two plausible answers`
    );
  }
}

// ── rule (h): passage length for young readers (warn only) ─────────────────

const PASSAGE_WORD_WARN_LIMIT = 90;
const PASSAGE_WORD_WARN_MAX_DIFFICULTY = 3;

function checkPassageLengthForYoungReaders(skillId, question) {
  const passage = String(question.passage || "").trim();
  if (!passage) return;
  if (questionLevel(question) > PASSAGE_WORD_WARN_MAX_DIFFICULTY) return;
  const wordCount = passage.split(/\s+/).filter(Boolean).length;
  if (wordCount > PASSAGE_WORD_WARN_LIMIT) {
    warnings.push(
      `[passage-length] ${skillId} ${describe(question)}: ${wordCount}-word passage ` +
      `exceeds ${PASSAGE_WORD_WARN_LIMIT} words for difficulty <= ${PASSAGE_WORD_WARN_MAX_DIFFICULTY}`
    );
  }
}

// ── rule (c): duplicates within a skill across levels ──────────────────────

function checkCrossLevelDuplicates(skillId, questions) {
  const byKey = new Map();
  questions.forEach(question => {
    if (!normalizeText(answerOf(question))) return;
    const key = [
      normalizeText(promptOf(question)),
      normalizeText(question.sentence),
      normalizeText(question.passage),
      questionMediaIdentity(question),
      normalizeText(answerOf(question))
    ].join("::");
    const bucket = byKey.get(key) || [];
    bucket.push(question);
    byKey.set(key, bucket);
  });

  byKey.forEach(bucket => {
    if (bucket.length < 2) return;
    const levels = new Set(bucket.map(questionLevel));

    // Same-file duplicates listed at different levels are authoring bugs and
    // fail the audit. Cross-file duplicates (stacked expansion banks) and
    // same-level repeats are surfaced as warnings.
    const byFile = new Map();
    bucket.forEach(question => {
      const file = question._sourceFile || question._source || "unknown";
      const fileBucket = byFile.get(file) || [];
      fileBucket.push(question);
      byFile.set(file, fileBucket);
    });
    let failed = false;
    byFile.forEach(fileBucket => {
      if (fileBucket.length < 2) return;
      const fileLevels = new Set(fileBucket.map(questionLevel));
      if (fileLevels.size > 1) {
        failed = true;
        failures.push(
          `[duplicate] ${skillId}: same prompt+answer across levels ${[...fileLevels].join("/")} in one file: ` +
          fileBucket.map(describe).join(" vs ")
        );
      }
    });
    if (!failed) {
      warnings.push(
        `[duplicate] ${skillId}: repeated prompt+answer (levels ${[...levels].join("/")}): ` +
        bucket.map(describe).join(" vs ")
      );
    }
  });
}

// ── rule (d): uniquely-longest correct answer tell ─────────────────────────

function checkLongestAnswerTell(skillId, questions) {
  if (!LONGEST_TELL_SKILLS.has(skillId)) return;

  let checked = 0;
  let uniquelyLongest = 0;
  questions.forEach(question => {
    const options = optionLabels(question);
    const answer = answerOf(question);
    if (options.length < 3 || !answer) return;
    const distractors = options.filter(option => option !== answer);
    if (!distractors.length || distractors.length === options.length) return;
    checked += 1;
    if (distractors.every(option => option.length < answer.length)) {
      uniquelyLongest += 1;
      flaggedLongestItems.push({
        skillId,
        id: question.id || "",
        sourceFile: question._sourceFile || "",
        source: question._source || "",
        answer,
        choices: options
      });
    }
  });

  if (!checked) return;
  const share = uniquelyLongest / checked;
  const summary = `${skillId}: correct answer uniquely longest in ${uniquelyLongest}/${checked} items (${Math.round(share * 100)}%)`;
  if (share > UNIQUELY_LONGEST_MAX_SHARE) {
    failures.push(`[length-tell] ${summary} — must be ≤35%`);
  } else {
    console.log(`  length-tell ok: ${summary}`);
  }
}

// ── rule (e): pool floors ──────────────────────────────────────────────────

function checkPoolFloor(skillId, count) {
  if (count < POOL_FLOOR_FAIL) {
    failures.push(`[pool] ${skillId}: only ${count} runtime-eligible questions (< ${POOL_FLOOR_FAIL})`);
  } else if (count < POOL_FLOOR_WARN) {
    warnings.push(`[pool] ${skillId}: ${count} runtime-eligible questions (< ${POOL_FLOOR_WARN} target)`);
  }
}

// ── main ───────────────────────────────────────────────────────────────────

const skillIds = getAssessmentSkillGroupMetadata().flatMap(group => group.skillIds);
const poolCounts = {};

for (const skillId of skillIds) {
  const group = getAssessmentSkillGroupMetadata().find(entry => entry.skillIds.includes(skillId));
  const questions = group?.id === "hfw"
    ? await loadHfwAssessmentBank(skillId)
    : await loadAssessmentSkillBank(skillId);
  poolCounts[skillId] = questions.length;
  console.log(`${skillId}: ${questions.length} runtime-eligible questions`);

  checkPoolFloor(skillId, questions.length);
  questions.forEach(question => {
    checkRuleCheckablePrompt(skillId, question);
    checkEmptyPromptWithPassage(skillId, question);
    checkPaddedDistractorArtifacts(skillId, question);
    checkPrepositionSynonymOptions(skillId, question);
    checkPassageLengthForYoungReaders(skillId, question);
  });
  checkCrossLevelDuplicates(skillId, questions);
  checkLongestAnswerTell(skillId, questions);
}

const reportPath = path.join(rootDir, "docs", "validation", "checkpoint_integrity_audit.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({
  generated: new Date().toISOString(),
  poolCounts,
  failures,
  warnings,
  flaggedLongestItems
}, null, 2));

console.log(`\nPool counts: ${JSON.stringify(poolCounts)}`);
console.log(`Warnings: ${warnings.length}`);
warnings.slice(0, 40).forEach(warning => console.log(`  warn: ${warning}`));
if (warnings.length > 40) console.log(`  … and ${warnings.length - 40} more warnings (see ${path.relative(rootDir, reportPath)})`);
console.log(`Failures: ${failures.length}`);
failures.slice(0, 80).forEach(failure => console.error(`  FAIL: ${failure}`));
if (failures.length > 80) console.error(`  … and ${failures.length - 80} more failures (see ${path.relative(rootDir, reportPath)})`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);

if (failures.length) {
  console.error("\nCheckpoint integrity audit FAILED.");
  process.exit(1);
}

console.log("\nCheckpoint integrity audit passed.");
