import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { skillTree } from "../src/skillTree.js";
import {
  getActiveAssessmentSkillIds,
  getAssessmentSkillGroup,
  getAssessmentSkillGroupMetadata,
  getAssessmentSkillIdsForGroup,
  loadAssessmentSkillBank
} from "../src/data/loadAssessmentSkillBank.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(repoRoot, "docs/validation/assessment_bank_loader_check.md");
const failures = [];
const warnings = [];

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hasFunction(value, seen = new Set()) {
  if (typeof value === "function") return true;
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some(item => hasFunction(item, seen));
  return Object.values(value).some(item => hasFunction(item, seen));
}

function hasPrompt(question = {}) {
  return Boolean(
    question.prompt ||
    question.question ||
    question.spokenPrompt ||
    question.passage ||
    question.sentence ||
    question.text
  );
}

function hasAnswer(question = {}) {
  return Boolean(
    question.answer ||
    question.correctAnswer ||
    (Array.isArray(question.correctAnswers) && question.correctAnswers.length)
  );
}

function hasInteraction(question = {}) {
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  if (format === "HFW_LETTER_BUILD") return true;
  return Boolean(
    (Array.isArray(question.choices) && question.choices.length) ||
    (Array.isArray(question.answerOptions) && question.answerOptions.length) ||
    (Array.isArray(question.imageCards) && question.imageCards.length) ||
    (Array.isArray(question.promptImageCards) && question.promptImageCards.length) ||
    (Array.isArray(question.tiles) && question.tiles.length) ||
    question.choiceImages ||
    question.questionType === "letter_sound"
  );
}

function validateQuestionShape(skillId, questions) {
  const badShape = [];
  for (const question of questions) {
    if (!question || typeof question !== "object" || Array.isArray(question)) {
      badShape.push(`${skillId}: non-object question`);
      continue;
    }
    if (hasFunction(question)) badShape.push(`${skillId}/${question.id || "(missing id)"}: contains function`);
    if (!question.id && !question.questionId) badShape.push(`${skillId}: question missing id/questionId`);
    if (!question.skillId && !question.assessmentSkillId) badShape.push(`${skillId}/${question.id || "(missing id)"}: missing skill id`);
    if (!hasPrompt(question)) badShape.push(`${skillId}/${question.id || "(missing id)"}: missing prompt/question text`);
    if (!hasAnswer(question)) badShape.push(`${skillId}/${question.id || "(missing id)"}: missing answer`);
    if (!hasInteraction(question)) badShape.push(`${skillId}/${question.id || "(missing id)"}: missing answer interaction data`);
    if (badShape.length >= 20) break;
  }
  return badShape;
}

const activeSkillIds = getActiveAssessmentSkillIds();
const activeSkillIdSet = new Set(activeSkillIds);
const groups = getAssessmentSkillGroupMetadata();
const rows = [];
const explicitCheckRows = [];

const runtimeAliases = {
  long_vowels_silent_e: "long_vowels",
  r_controlled_vowels: "r_controlled",
  prepositions_of_place: "prepositions",
  prefixes_suffixes: "prefix_suffix",
  homophones_homonyms: "homophones",
  theme_higher_comprehension: "theme"
};

const canonicalAliases = Object.fromEntries(
  Object.entries(runtimeAliases).map(([canonical, alias]) => [alias, canonical])
);

function canonicalSkillId(value = "") {
  const normalized = normalize(value);
  return canonicalAliases[normalized] || normalized;
}

function mappedGroupsForSkill(skillId = "") {
  const canonical = canonicalSkillId(skillId);
  return groups.filter(group => group.skillIds.includes(canonical));
}

function addExplicitCheck(name, passed, detail = "") {
  explicitCheckRows.push({ name, passed, detail });
  if (!passed) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

for (const group of groups) {
  if (!group.skillIds.length) failures.push(`${group.id} has no configured skill ids`);
  const activeInGroup = group.skillIds.filter(skillId => {
    return activeSkillIdSet.has(skillId) || activeSkillIdSet.has(runtimeAliases[skillId]);
  });
  if (!activeInGroup.length) warnings.push(`${group.id} has configured skills but no active skillTree entries`);
}

for (const skill of skillTree) {
  const matchingGroups = mappedGroupsForSkill(skill.id);
  const groupId = getAssessmentSkillGroup(skill.id);
  if (!groupId) failures.push(`${skill.id} is active but unmapped`);
  if (matchingGroups.length !== 1) {
    failures.push(`${skill.id} maps to ${matchingGroups.length} groups; expected exactly one`);
  } else if (groupId !== matchingGroups[0].id) {
    failures.push(`${skill.id} helper returned ${groupId || "none"} but metadata maps to ${matchingGroups[0].id}`);
  }
  const questions = await loadAssessmentSkillBank(skill.id);
  if (!questions.length) failures.push(`${skill.id} resolved 0 questions through loadAssessmentSkillBank`);
  const shapeIssues = validateQuestionShape(skill.id, questions);
  if (shapeIssues.length) failures.push(...shapeIssues);
  rows.push({
    skillId: skill.id,
    label: skill.label,
    groupId,
    count: questions.length,
    sampleIds: questions.slice(0, 5).map(question => question.id || question.questionId || "(missing id)")
  });
}

for (const skillId of ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"]) {
  const questions = await loadAssessmentSkillBank(skillId);
  addExplicitCheck(`${skillId} resolves`, questions.length > 0, `${questions.length} questions`);
}

const legacyHfwQuestions = await loadAssessmentSkillBank("hfw_51_100");
addExplicitCheck("hfw_51_100 is not active", !activeSkillIdSet.has("hfw_51_100"));
if (legacyHfwQuestions.length > 0) {
  warnings.push("hfw_51_100 still has legacy source questions, but it is not an active skillTree id");
}
addExplicitCheck("reading_comprehension is not active", !activeSkillIdSet.has("reading_comprehension"));

for (const skillId of ["blends", "digraphs", "long_vowels_silent_e", "vowel_teams", "r_controlled_vowels"]) {
  const questions = await loadAssessmentSkillBank(skillId);
  addExplicitCheck(`${skillId} replacement phonics resolves`, questions.length > 0, `${questions.length} questions`);
}

for (const [alias, canonical] of Object.entries(canonicalAliases)) {
  const aliasGroup = getAssessmentSkillGroup(alias);
  const canonicalGroup = getAssessmentSkillGroup(canonical);
  const aliasQuestions = await loadAssessmentSkillBank(alias);
  const canonicalQuestions = await loadAssessmentSkillBank(canonical);
  addExplicitCheck(`${alias} alias maps to ${canonical}`, aliasGroup === canonicalGroup && aliasQuestions.length === canonicalQuestions.length && aliasQuestions.length > 0, `${aliasQuestions.length}/${canonicalQuestions.length} questions`);
}

let fallbackAvailable = false;
try {
  const unknownQuestions = await loadAssessmentSkillBank("__unknown_future_skill__");
  fallbackAvailable = Array.isArray(unknownQuestions);
} catch {
  fallbackAvailable = false;
}
addExplicitCheck("unknown-skill fallback returns safely", fallbackAvailable);

const groupRows = groups.map(group => ({
  groupId: group.id,
  label: group.label,
  configuredSkills: getAssessmentSkillIdsForGroup(group.id).join(", "),
  activeMatches: rows.filter(row => row.groupId === group.id).length
}));

const report = [
  "# Assessment Skill Bank Loader Check",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- Active skills checked: ${activeSkillIds.length}`,
  `- Groups checked: ${groups.length}`,
  `- Fatal failures: ${failures.length}`,
  `- Warnings: ${warnings.length}`,
  "",
  "## Groups",
  "",
  "| Group | Label | Configured Skills | Active Skill Matches |",
  "| --- | --- | --- | ---: |",
  ...groupRows.map(row => `| ${row.groupId} | ${row.label} | ${row.configuredSkills} | ${row.activeMatches} |`),
  "",
  "## Skill Loader Counts",
  "",
  "| Skill | Label | Group | Loader Questions | Sample IDs |",
  "| --- | --- | --- | ---: | --- |",
  ...rows.map(row => `| ${row.skillId} | ${row.label} | ${row.groupId || "UNMAPPED"} | ${row.count} | ${row.sampleIds.join(", ")} |`),
  "",
  "## Explicit Safety Checks",
  "",
  "| Check | Result | Detail |",
  "| --- | --- | --- |",
  ...explicitCheckRows.map(row => `| ${row.name} | ${row.passed ? "pass" : "fail"} | ${row.detail || ""} |`),
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(warning => `- ${warning}`).join("\n") : "- none",
  "",
  "## Failures",
  "",
  failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "- none",
  ""
].join("\n");

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log(`Assessment skill bank loader checked ${activeSkillIds.length} active skills.`);
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);

if (warnings.length) {
  console.warn("Warnings:");
  warnings.forEach(warning => console.warn(`- ${warning}`));
}

if (failures.length) {
  console.error(`Assessment skill bank loader failed: ${failures.length}`);
  failures.slice(0, 50).forEach(failure => console.error(`- ${failure}`));
  if (failures.length > 50) console.error(`...and ${failures.length - 50} more`);
  process.exit(1);
}

console.log("Assessment skill bank loader check passed.");
