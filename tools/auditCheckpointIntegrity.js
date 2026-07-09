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
//       below 45).
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
