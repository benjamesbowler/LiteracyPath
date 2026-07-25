import path from "node:path";

import { managedAssessmentSkillDepthConfig } from "../src/data/skillLevelDepthConfig.js";
import { loadAssessmentSkillBank } from "../src/data/loadAssessmentSkillBank.js";
import {
  createAssessmentSessionMediaUsage,
  getApprovedMediaForTarget,
  getQuestionMediaContentKey,
  inferAssessmentQuestionTargetWord,
  resolveQuestionMediaDynamically,
  validateResolvedQuestionMedia
} from "../src/data/assessmentMediaPicker.js";
import {
  ASSESSMENT_ROUND_DIVERSITY_BUDGET,
  getAssessmentItemKeyBudgetFailures,
  getAssessmentQuestionContentKey,
  getAssessmentTemplateBudgetFailures,
  selectAssessmentRoundCandidate
} from "../src/data/assessmentRoundSelector.js";
import {
  getQuestionSignature,
  getRepeatOptionSetSignature,
  getRepeatTargetWord
} from "../src/questionRepeatGuards.js";
import { getInitialSoundRoundPlan } from "../src/content/initialSounds/initialSoundSelector.js";
import {
  getQuestionImagePaths,
  repoRoot,
  writeFile
} from "./phonicsRuntimeUtils.js";

const SESSION_COUNT = Math.max(
  1,
  Number.parseInt(process.env.LP_RUNTIME_SIMULATION_SESSIONS || "500", 10) || 500
);
const ROUND_LENGTH = 15;
const OUT_JSON = path.join(repoRoot, "docs/validation/runtime_variation_simulation.json");
const OUT_MD = path.join(repoRoot, "docs/validation/runtime_variation_simulation.md");
const requestedSkillIds = new Set(
  String(process.env.LP_RUNTIME_SIMULATION_SKILLS || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
);

function deterministicHash(value = "") {
  return Array.from(String(value)).reduce(
    (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0,
    0
  );
}

function seededOrder(items = [], seed = "") {
  return items
    .map((item, index) => ({
      item,
      score: deterministicHash(`${seed}:${index}:${item.id || getQuestionSignature(item)}`)
    }))
    .sort((a, b) => a.score - b.score || String(a.item.id).localeCompare(String(b.item.id)))
    .map(entry => entry.item);
}

function questionLevel(question = {}) {
  return Number(question.level || question.assessmentLevel || question.difficulty || 1) >= 2 ? 2 : 1;
}

function questionPhase(question = {}) {
  return Number(question.phase || question.assessmentPhase || 1) === 2 ? 2 : 1;
}

function phasePool(pool, level, phase) {
  return pool.filter(question =>
    questionLevel(question) === level &&
    questionPhase(question) === phase
  );
}

function primaryImage(question = {}) {
  return getQuestionImagePaths(question)[0] || "";
}

function mediaRoleForSkill(skillId = "") {
  if (skillId.startsWith("hfw_")) return "hfw_scene";
  if (skillId === "rhyming") return "rhyming_target";
  if (skillId === "nouns") return "noun_image";
  if (skillId === "verbs") return "verb_action";
  if (skillId === "adjectives") return "adjective_visual";
  if (["prepositions", "prepositions_of_place"].includes(skillId)) return "preposition_scene";
  if (skillId === "plurals") return "plural_pair";
  if (skillId === "antonyms_synonyms") return "antonym_synonym_scene";
  if (skillId === "homophones_homonyms") return "homophone_context";
  return "target_object";
}

function counts(values = []) {
  const output = new Map();
  for (const value of values.filter(Boolean)) {
    output.set(value, (output.get(value) || 0) + 1);
  }
  return output;
}

function repeats(values = []) {
  return [...counts(values).entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function defaultItemKey(question = {}) {
  return question.itemType && question.itemKey
    ? `${String(question.itemType).toLowerCase()}::${String(question.itemKey).toLowerCase()}`
    : "";
}

function pushFailure(failures, failure) {
  failures.push(failure);
}

function buildSharedRound(pool, { skillId, level, phase, sessionIndex }) {
  const ordered = seededOrder(pool, `${skillId}:${level}:${phase}:${sessionIndex}`);
  const rawSelected = [];
  const resolvedSelected = [];
  const mediaUsage = createAssessmentSessionMediaUsage();
  const targetLength = Math.min(ROUND_LENGTH, pool.length);
  const validationFailures = [];

  while (rawSelected.length < targetLength) {
    const selection = selectAssessmentRoundCandidate(ordered, {
      selectedQuestions: rawSelected,
      skillId,
      roundLength: ROUND_LENGTH,
      getItemKey: defaultItemKey
    });
    if (!selection.question) break;
    rawSelected.push(selection.question);
    const resolved = resolveQuestionMediaDynamically(selection.question, {
      skillId,
      level,
      phase,
      sessionUsage: mediaUsage
    });
    const mediaIssues = validateResolvedQuestionMedia(resolved);
    if (mediaIssues.length) {
      validationFailures.push({
        questionId: resolved.id,
        issues: mediaIssues
      });
    }
    resolvedSelected.push(resolved);
  }

  return {
    rawSelected,
    resolvedSelected,
    targetLength,
    validationFailures
  };
}

function auditSharedRound({
  skillId,
  level,
  phase,
  sessionIndex,
  pool,
  rawSelected,
  resolvedSelected,
  targetLength,
  validationFailures
}) {
  const failures = [];
  const context = { skillId, level, phase, sessionIndex };
  if (rawSelected.length !== targetLength) {
    pushFailure(failures, {
      ...context,
      reason: `selected ${rawSelected.length}/${targetLength}`
    });
  }

  for (const duplicate of repeats(rawSelected.map(question => question.id))) {
    pushFailure(failures, { ...context, reason: "repeated question id", duplicate });
  }
  for (const duplicate of repeats(rawSelected.map(getQuestionSignature))) {
    pushFailure(failures, { ...context, reason: "repeated exact signature", duplicate });
  }

  const contentAlternatives = new Set(pool.map(getAssessmentQuestionContentKey).filter(Boolean)).size;
  if (contentAlternatives >= targetLength) {
    for (const duplicate of repeats(rawSelected.map(getQuestionMediaContentKey))) {
      pushFailure(failures, { ...context, reason: "repeated content despite alternatives", duplicate });
    }
  }
  const targetAlternatives = new Set(pool.map(getRepeatTargetWord).filter(Boolean)).size;
  if (targetAlternatives >= targetLength) {
    for (const duplicate of repeats(rawSelected.map(getRepeatTargetWord))) {
      pushFailure(failures, { ...context, reason: "repeated target despite alternatives", duplicate });
    }
  }
  const optionAlternatives = new Set(pool.map(getRepeatOptionSetSignature).filter(Boolean)).size;
  for (const failure of getAssessmentTemplateBudgetFailures(rawSelected, pool, {
    skillId,
    roundLength: ROUND_LENGTH
  })) {
    pushFailure(failures, { ...context, reason: "template budget exceeded", failure });
  }
  for (const failure of getAssessmentItemKeyBudgetFailures(rawSelected, pool, {
    roundLength: ROUND_LENGTH,
    getItemKey: defaultItemKey
  })) {
    pushFailure(failures, { ...context, reason: "phoneme/item budget exceeded", failure });
  }
  const maxOptionSetCount = Math.max(
    1,
    Math.floor(ROUND_LENGTH * ASSESSMENT_ROUND_DIVERSITY_BUDGET.maxOptionSetShare)
  );
  for (const duplicate of repeats(rawSelected.map(getRepeatOptionSetSignature))) {
    if (duplicate.count > maxOptionSetCount && optionAlternatives >= targetLength) {
      pushFailure(failures, {
        ...context,
        reason: "distractor-set budget exceeded",
        duplicate,
        allowedCount: maxOptionSetCount
      });
    }
  }

  for (const duplicate of repeats(resolvedSelected.map(primaryImage))) {
    const repeatedQuestion = resolvedSelected.find(question => primaryImage(question) === duplicate.value);
    if (!repeatedQuestion) continue;
    const target = inferAssessmentQuestionTargetWord(repeatedQuestion);
    const targetUseCount = resolvedSelected.filter(question =>
      inferAssessmentQuestionTargetWord(question) === target
    ).length;
    const alternativeCount = getApprovedMediaForTarget({
      word: target,
      skillId,
      mediaType: "image",
      role: mediaRoleForSkill(skillId),
      level,
      phase
    }).length;
    if (alternativeCount > 1 && targetUseCount <= alternativeCount) {
      pushFailure(failures, {
        ...context,
        reason: "repeated image despite approved alternatives",
        duplicate,
        target,
        alternativeCount
      });
    }
  }

  validationFailures.forEach(failure => {
    pushFailure(failures, {
      ...context,
      reason: "resolved media validation failed",
      ...failure
    });
  });

  return failures;
}

function auditInitialSoundsSession({ level, sessionIndex }) {
  const plan = getInitialSoundRoundPlan({
    level,
    roundNumber: (sessionIndex % 3) + 1,
    seed: deterministicHash(`initial_sounds:${level}:${sessionIndex}`)
  });
  const failures = [];
  const context = { skillId: "initial_sounds", level, phase: plan.meta.phase, sessionIndex };
  const ids = plan.items.map(item => item.id);
  const letters = plan.items.map(item => item.letter);
  const words = plan.items.map(item => item.targetWord);
  const images = plan.items.map(item => item.imageUrl);
  for (const [reason, values] of [
    ["repeated question id", ids],
    ["repeated phoneme", letters],
    ["repeated target word", words],
    ["repeated image", images]
  ]) {
    repeats(values).forEach(duplicate => {
      pushFailure(failures, { ...context, reason, duplicate });
    });
  }
  if (plan.items.length !== Math.min(plan.meta.availableLetters.length, ROUND_LENGTH)) {
    pushFailure(failures, {
      ...context,
      reason: `selected ${plan.items.length}/${Math.min(plan.meta.availableLetters.length, ROUND_LENGTH)}`
    });
  }
  return {
    failures,
    signature: ids.join("|")
  };
}

const results = [];
const allFailures = [];

const simulationConfigs = requestedSkillIds.size
  ? managedAssessmentSkillDepthConfig.filter(config => requestedSkillIds.has(config.skillId))
  : managedAssessmentSkillDepthConfig;

for (const config of simulationConfigs) {
  const skillId = config.skillId;
  const pool = await loadAssessmentSkillBank(skillId);
  const skillFailures = [];
  const phaseRoundSignatures = new Map();

  if (!pool.length) {
    skillFailures.push({
      skillId,
      reason: "runtime pool is empty"
    });
  } else if (skillId === "initial_sounds") {
    for (let sessionIndex = 0; sessionIndex < SESSION_COUNT; sessionIndex += 1) {
      for (const level of [1, 2]) {
        const result = auditInitialSoundsSession({ level, sessionIndex });
        skillFailures.push(...result.failures);
        const key = `L${level}`;
        const signatures = phaseRoundSignatures.get(key) || new Set();
        signatures.add(result.signature);
        phaseRoundSignatures.set(key, signatures);
      }
    }
  } else {
    for (let sessionIndex = 0; sessionIndex < SESSION_COUNT; sessionIndex += 1) {
      for (const level of [1, 2]) {
        for (const phase of [1, 2]) {
          const scopedPool = phasePool(pool, level, phase);
          if (!scopedPool.length) continue;
          const round = buildSharedRound(scopedPool, {
            skillId,
            level,
            phase,
            sessionIndex
          });
          skillFailures.push(...auditSharedRound({
            skillId,
            level,
            phase,
            sessionIndex,
            pool: scopedPool,
            ...round
          }));
          const key = `L${level}P${phase}`;
          const signatures = phaseRoundSignatures.get(key) || new Set();
          signatures.add(round.rawSelected.map(question => question.id).join("|"));
          phaseRoundSignatures.set(key, signatures);
        }
      }
    }
  }

  for (const [phase, signatures] of phaseRoundSignatures) {
    const scopedPoolSize = skillId === "initial_sounds"
      ? pool.filter(question => questionLevel(question) === Number(phase.slice(1))).length
      : phasePool(pool, Number(phase[1]), Number(phase[3])).length;
    if (scopedPoolSize > ROUND_LENGTH && signatures.size < 10) {
      skillFailures.push({
        skillId,
        phase,
        reason: "insufficient cross-session round variation",
        uniqueRounds: signatures.size,
        required: 10
      });
    }
  }

  const result = {
    skillId,
    sessions: SESSION_COUNT,
    poolSize: pool.length,
    phaseUniqueRounds: Object.fromEntries(
      [...phaseRoundSignatures.entries()].map(([phase, signatures]) => [phase, signatures.size])
    ),
    failureCount: skillFailures.length,
    failures: skillFailures.slice(0, 100)
  };
  results.push(result);
  allFailures.push(...skillFailures);
  console.log(`${skillId}: ${SESSION_COUNT} sessions, ${skillFailures.length} failures`);
}

const report = {
  generatedAt: new Date().toISOString(),
  sessionsPerSkill: SESSION_COUNT,
  skillCount: results.length,
  failureCount: allFailures.length,
  results
};
const markdown = [
  "# Runtime variation simulation",
  "",
  `- Sessions per skill: ${SESSION_COUNT}`,
  `- Skills: ${results.length}`,
  `- Failures: ${allFailures.length}`,
  "",
  "| Skill | Pool | Unique rounds by phase | Failures |",
  "|---|---:|---|---:|",
  ...results.map(result =>
    `| ${result.skillId} | ${result.poolSize} | ${Object.entries(result.phaseUniqueRounds).map(([phase, count]) => `${phase}: ${count}`).join(", ")} | ${result.failureCount} |`
  ),
  "",
  ...(allFailures.length
    ? [
      "## First failures",
      "",
      "```json",
      JSON.stringify(allFailures.slice(0, 40), null, 2),
      "```"
    ]
    : ["All seeded runtime-diversity budgets passed."]),
  ""
].join("\n");

writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
writeFile(OUT_MD, markdown);

if (allFailures.length) {
  console.error(`Runtime variation simulation failures: ${allFailures.length}`);
  process.exitCode = 1;
}
