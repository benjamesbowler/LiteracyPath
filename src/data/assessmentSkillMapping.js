import { skillTree } from "../skillTree.js";

const BLEND_PATTERNS = ["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw"];
const DIGRAPH_PATTERNS = ["sh", "ch", "th", "wh", "ph", "ck"];
const VOWEL_TEAMS = ["ai", "ay", "ee", "ea", "oa", "ow", "igh", "ie", "oo", "ue", "ew", "oi", "oy", "ou", "aw"];
const R_CONTROLLED_PATTERNS = ["ar", "er", "ir", "or", "ur"];

export function normalizeAssessmentSkillKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const skillIdSet = new Set(skillTree.map(skill => skill.id));
const skillById = Object.fromEntries(skillTree.map(skill => [skill.id, skill]));

const aliasPairs = [
  ...skillTree.flatMap(skill => [
    [skill.id, skill.id],
    [skill.label, skill.id],
    ...(skill.match || []).map(match => [match, skill.id])
  ]),
  ["ending_sounds", "final_sounds"],
  ["short_vowels", "cvc_short_vowels"],
  ["cvc", "cvc_short_vowels"],
  ["cvc_words", "cvc_short_vowels"],
  ["long_vowels_silent_e", "long_vowels"],
  ["r_controlled_vowels", "r_controlled"],
  ["prepositions_of_place", "prepositions"],
  ["prefixes_suffixes", "prefix_suffix"],
  ["homophones_homonyms", "homophones"],
  ["theme_higher_comprehension", "theme"],
  ["antonyms", "antonyms_synonyms"],
  ["synonyms", "antonyms_synonyms"],
  ["sight_words", "hfw_1_25"],
  ["high_frequency_words", "hfw_1_25"],
  ["high_frequency_words_1_25", "hfw_1_25"],
  ["high_frequency_words_26_50", "hfw_26_50"],
  ["high_frequency_words_51_75", "hfw_51_75"],
  ["high_frequency_words_76_100", "hfw_76_100"]
];

const assessmentSkillAliases = new Map(
  aliasPairs.map(([alias, skillId]) => [normalizeAssessmentSkillKey(alias), skillId])
);

function wordsFromQuestion(question = {}) {
  return [
    question.targetWord,
    question.word,
    question.answer,
    question.correctAnswer,
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.answerOptions)
      ? question.answerOptions.map(option => option?.value || option?.word || option?.label || "")
      : [])
  ]
    .map(value => String(value || "").toLowerCase().replace(/[^a-z]/g, ""))
    .filter(Boolean);
}

function questionSearchText(question = {}) {
  return [
    question.skillId,
    question.skill_id,
    question.skill,
    question.skillName,
    question.stage,
    question.templateType,
    question.formatType,
    question.questionType,
    question.prompt,
    question.question,
    question.spokenPrompt,
    question.passage,
    question.sentence,
    question.answer,
    question.correctAnswer,
    ...(Array.isArray(question.choices) ? question.choices : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasPattern(words, patterns, predicate = (word, pattern) => word.includes(pattern)) {
  return words.some(word => patterns.some(pattern => predicate(word, pattern)));
}

function classifyComprehensionQuestion(question = {}) {
  const text = questionSearchText(question);
  const prompt = String(question.prompt || question.question || "").toLowerCase();

  if (/\b(theme|lesson|message|moral)\b/.test(prompt)) return "theme";
  if (/\b(context clue|what does .+ mean|meaning of|closest meaning)\b/.test(prompt)) return "context_clues";
  if (/\b(main idea|mostly about|best title|central idea)\b/.test(prompt)) return "main_idea";
  if (/\b(first|next|then|after|before|last|order|sequence)\b/.test(prompt)) return "sequencing";
  if (/\bwhy\b|\bbecause\b|\bcause\b|\beffect\b|\breason\b/.test(prompt)) return "cause_effect";
  if (/\binfer|inference|probably|likely|suggests|conclude\b/.test(text)) return "inference";
  return "key_details";
}

function classifyPhonicsQuestion(question = {}) {
  const text = questionSearchText(question);
  const words = wordsFromQuestion(question);
  const answer = String(question.answer || question.correctAnswer || "").toLowerCase().trim();

  if (/\brhym/.test(text)) return "rhyming";
  if (/\b(short vowel|middle sound|middle vowel|vowel sound)\b/.test(text)) return "short_vowel_discrimination";
  if (/\blong [aeiou]\b|\blong vowel\b|\bsilent e\b|\bmagic e\b/.test(text)) return "long_vowels";
  if (hasPattern(words, VOWEL_TEAMS)) return "vowel_teams";
  if (hasPattern(words, R_CONTROLLED_PATTERNS)) return "r_controlled";
  if (/\b(digraph|letters .+ together)\b/.test(text) || hasPattern(words, DIGRAPH_PATTERNS)) return "digraphs";
  if (/\bblend\b/.test(text) || hasPattern(words, BLEND_PATTERNS, (word, pattern) => word.startsWith(pattern))) return "blends";
  if (/\b(end|ends|ending|final|last sound|last letter)\b/.test(text)) return "final_sounds";
  if (/\b(start|starts|beginning|initial|first sound|first letter)\b/.test(text)) return "initial_sounds";
  if (answer.length === 1 && /[a-z]/.test(answer)) return "initial_sounds";
  return "cvc_short_vowels";
}

function classifySpellingQuestion(question = {}) {
  const text = questionSearchText(question);
  const words = wordsFromQuestion(question);
  const target = String(question.answer || question.correctAnswer || question.targetWord || "").toLowerCase().replace(/[^a-z]/g, "");

  if (/\bplural|more than one\b/.test(text) || /(?:s|es|ies)$/.test(target)) return "plurals";
  if (/\bprefix|suffix\b/.test(text)) return "prefix_suffix";
  if (/\blong [aeiou]\b|\blong vowel\b|\bsilent e\b|\bmagic e\b/.test(text) || /[aeiou][bcdfghjklmnpqrstvwxyz]e$/.test(target)) return "long_vowels";
  if (hasPattern([target], R_CONTROLLED_PATTERNS)) return "r_controlled";
  if (hasPattern([target], DIGRAPH_PATTERNS)) return "digraphs";
  if (hasPattern([target], BLEND_PATTERNS, (word, pattern) => word.startsWith(pattern))) return "blends";
  if (hasPattern([target], VOWEL_TEAMS)) return "vowel_teams";
  if (!target && hasPattern(words, R_CONTROLLED_PATTERNS)) return "r_controlled";
  if (!target && hasPattern(words, DIGRAPH_PATTERNS)) return "digraphs";
  if (!target && hasPattern(words, BLEND_PATTERNS, (word, pattern) => word.startsWith(pattern))) return "blends";
  if (!target && hasPattern(words, VOWEL_TEAMS)) return "vowel_teams";
  return "cvc_short_vowels";
}

function inferAssessmentSkillId(question = {}) {
  const rawSkill = normalizeAssessmentSkillKey(question.skill || question.skillName || question.stage || "");
  if (rawSkill === "phonics") return classifyPhonicsQuestion(question);
  if (rawSkill === "spelling") return classifySpellingQuestion(question);
  return "";
}

export function resolveAssessmentSkillId(question = {}, fallbackSkillId = null) {
  const explicitFields = [
    question.skillId,
    question.skill_id,
    fallbackSkillId,
    question.skillName,
    question.skill,
    question.stage
  ];

  for (const field of explicitFields) {
    const key = normalizeAssessmentSkillKey(field);
    if (!key) continue;
    if (skillIdSet.has(key)) return key;
    if (assessmentSkillAliases.has(key)) return assessmentSkillAliases.get(key);
  }

  const inferred = inferAssessmentSkillId(question);
  return inferred || "";
}

export function getAssessmentSkillLabel(skillId = "") {
  return skillById[skillId]?.label || "";
}

export function normalizeAssessmentSkillFields(question = {}, fallbackSkillId = null) {
  const skillId = resolveAssessmentSkillId(question, fallbackSkillId);
  const label = getAssessmentSkillLabel(skillId);
  return {
    ...question,
    skillId: skillId || question.skillId || question.skill_id || fallbackSkillId || "",
    skill: label || question.skill || question.skillName || skillId || "",
    skillName: label || question.skillName || question.skill || skillId || ""
  };
}
