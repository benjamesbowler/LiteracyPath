import path from "node:path";

import {
  ASSESSMENT_CONTRACT_ROUND_SIZE,
  CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP,
  assessmentSkillContracts
} from "../src/data/assessmentSkillContracts.js";
import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";
import { isQuestionBlockedByMediaQa } from "../src/data/mediaQaManifest.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionAudioPaths,
  getQuestionImagePaths,
  getQuestionTargetWord,
  normalizeWord,
  publicPathExists,
  repoRoot,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const REPORT_MD = path.join(repoRoot, "docs/validation/assessment_skill_contract_audit.md");
const REPORT_JSON = path.join(repoRoot, "docs/validation/assessment_skill_contract_audit.json");

const NON_WORDS = new Set([
  "bex", "bux", "clop", "dap", "dub", "flub", "plam", "plea", "strop"
]);

const OBSCURE_WORDS = new Set([
  "trod", "brute", "dune", "eigh", "orb", "curb"
]);

function escapeMarkdown(value = "") {
  return String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|");
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(escapeMarkdown).join(" | ")} |`)
  ].join("\n");
}

function phaseKey(level, phase) {
  return `L${level}P${phase}`;
}

function questionId(question = {}) {
  return question.id || question.questionId || "(missing id)";
}

function questionLevel(question = {}) {
  return Number(question.level || question.assessmentLevel || question.depthLevel || question.difficulty || 1) >= 2 ? 2 : 1;
}

function questionPhase(question = {}) {
  const raw = question.phase ?? question.assessmentPhase ?? question.levelPhase ?? question.phaseTarget ?? "";
  const numeric = Number(raw);
  if (numeric === 1 || numeric === 2) return numeric;
  const text = String(raw || "").toLowerCase();
  if (/phase_?2|p2/.test(text)) return 2;
  if (/phase_?1|p1/.test(text)) return 1;
  return 1;
}

function questionFormat(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function primaryImage(question = {}) {
  return getQuestionImagePaths(question)[0] || "";
}

function questionPromptContext(question = {}) {
  return normalizeWord(question.sentence || question.passage || question.context || question.question || question.prompt || "");
}

function optionValue(option) {
  if (option && typeof option === "object") {
    return option.value || option.word || option.label || option.text || option.answer || "";
  }
  return option || "";
}

function answerOptions(question = {}) {
  if (Array.isArray(question.imageCards) && question.imageCards.length) return question.imageCards;
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  if (Array.isArray(question.options) && question.options.length) return question.options;
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  return [];
}

function questionWords(question = {}) {
  return [
    question.targetWord,
    question.itemKey,
    question.answer,
    question.correctAnswer,
    ...(Array.isArray(question.correctAnswers) ? question.correctAnswers : []),
    ...answerOptions(question).map(optionValue)
  ]
    .map(normalizeWord)
    .filter(Boolean);
}

function coverageKey(question = {}, contract = {}) {
  const targetType = String(contract.requiredTargetType || contract.targetType || "").toLowerCase();
  const direct =
    question.itemKey ||
    question.coverageTarget ||
    question.targetPattern ||
    question.phonicsPattern ||
    question.targetSound ||
    question.rhymeGroup ||
    question.rime ||
    question.targetWord ||
    getQuestionTargetWord(question);

  if (targetType.includes("word")) return normalizeWord(question.targetWord || question.itemKey || getQuestionTargetWord(question));
  return normalizeWord(direct).replace(/ /g, "_");
}

function targetTemplateKey(question = {}) {
  const target = normalizeWord(question.targetWord || getQuestionTargetWord(question) || question.itemKey || question.answer || question.correctAnswer);
  const format = questionFormat(question);
  if (!target || !format) return "";
  return `${target}::${format}`;
}

function contentKey(question = {}) {
  const options = answerOptions(question)
    .map(optionValue)
    .map(normalizeWord)
    .filter(Boolean)
    .sort()
    .join("|");
  return [
    normalizeWord(question.targetWord || getQuestionTargetWord(question) || question.itemKey || question.answer || question.correctAnswer),
    questionFormat(question),
    questionPromptContext(question),
    normalizeWord(question.answer || question.correctAnswer || ""),
    options,
    primaryImage(question)
  ].filter(Boolean).join("::");
}

function imagePathFromOption(option = {}) {
  if (!option || typeof option !== "object") return "";
  return option.image || option.imageUrl || option.imagePath || option.media?.image || option.media?.imageUrl || option.media?.imagePath || "";
}

function audioPathFromOption(option = {}) {
  if (!option || typeof option !== "object") return "";
  return option.audio || option.audioUrl || option.audioPath || option.media?.audio || option.media?.audioUrl || option.media?.audioPath || "";
}

function answerImageGap(question = {}) {
  const options = answerOptions(question);
  if (!options.length) return { gap: true, reason: "no answer options" };
  const imageOptions = options.map(imagePathFromOption);
  const missing = imageOptions
    .map((assetPath, index) => ({ assetPath, index }))
    .filter(item => !item.assetPath || !publicPathExists(item.assetPath));
  return {
    gap: missing.length > 0,
    reason: missing.length ? `${missing.length}/${options.length} answer images missing or unapproved by QA gate` : ""
  };
}

function approvedPromptAudioGap(question = {}) {
  const target = normalizeWord(question.targetWord || getQuestionTargetWord(question) || question.audioKey || question.audioText || question.answer || question.correctAnswer);
  const promptAudioPaths = [question.audioPath, question.audioUrl, question.audio].filter(Boolean);
  const approved = promptAudioPaths.some(audioPath => Boolean(getApprovedAudioPath(target, audioPath)));
  return {
    gap: !approved,
    reason: approved ? "" : "missing approved prompt/target audio"
  };
}

function answerAudioGap(question = {}) {
  const options = answerOptions(question);
  if (!options.length) return { gap: true, reason: "no answer options" };
  const missing = [];
  options.forEach((option, index) => {
    const word = normalizeWord(optionValue(option));
    const audioPath = audioPathFromOption(option);
    if (!audioPath || !getApprovedAudioPath(word, audioPath)) missing.push({ index, word, audioPath });
  });
  return {
    gap: missing.length > 0,
    reason: missing.length ? `${missing.length}/${options.length} answer audio paths missing or unapproved` : ""
  };
}

function hasMediaFileGap(question = {}) {
  const missingImages = getQuestionImagePaths(question).filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  const missingAudio = getQuestionAudioPaths(question).filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  return { missingImages, missingAudio };
}

function perQuestionContractIssues(question = {}, contract = {}, phase = {}) {
  const issues = [];
  const id = questionId(question);
  const format = questionFormat(question);
  const allowedFormats = phase.allowedFormats || [];
  const mediaGap = hasMediaFileGap(question);

  if (contract.qaBlockedMediaMustFail && isQuestionBlockedByMediaQa(question)) {
    issues.push(`${id}: QA-blocked media is selectable`);
  }
  if (mediaGap.missingImages.length) {
    issues.push(`${id}: missing image files: ${mediaGap.missingImages.join(", ")}`);
  }
  if (mediaGap.missingAudio.length) {
    issues.push(`${id}: missing audio files: ${mediaGap.missingAudio.join(", ")}`);
  }
  if (allowedFormats.length && !allowedFormats.includes(format)) {
    issues.push(`${id}: format ${format} is outside contract formats ${allowedFormats.join(", ")}`);
  }
  if (phase.promptAudioRequired || contract.promptAudioRequired) {
    const gap = approvedPromptAudioGap(question);
    if (gap.gap) issues.push(`${id}: ${gap.reason}`);
  }
  if (phase.answerImagesRequired || contract.answerImagesRequired) {
    const gap = answerImageGap(question);
    if (gap.gap) issues.push(`${id}: ${gap.reason}`);
  }
  if (phase.answerAudioRequired || contract.answerAudioRequired) {
    const gap = answerAudioGap(question);
    if (gap.gap) issues.push(`${id}: ${gap.reason}`);
  }

  const words = questionWords(question);
  const nonWords = words.filter(word => NON_WORDS.has(word));
  const obscureWords = words.filter(word => OBSCURE_WORDS.has(word));
  if (contract.fakeCompoundsNonWordsMustFail && nonWords.length) {
    issues.push(`${id}: fake/non-word tokens found: ${[...new Set(nonWords)].join(", ")}`);
  }
  if (contract.obscureWordsMustFail && obscureWords.length) {
    issues.push(`${id}: obscure word tokens found: ${[...new Set(obscureWords)].join(", ")}`);
  }

  return issues;
}

function evaluateCompleteContract(contract) {
  const rawRuntime = buildRuntimeQuestionsForSkill(contract.skillId);
  const selectable = selectableRuntimeQuestionsForSkill(contract.skillId);
  const failures = [];
  const warnings = [];
  const phaseRows = [];
  const selectableIdsInContract = new Set();
  const allPerQuestionIssues = [];
  const assignedTargetsByLevel = new Map();
  const globalDuplicateMaps = {
    targetTemplate: new Map(),
    primaryImage: new Map(),
    promptAnswer: new Map(),
    content: new Map()
  };

  for (const question of selectable) {
    const targetTemplate = targetTemplateKey(question);
    const image = primaryImage(question);
    const promptAnswer = `${questionPromptContext(question)}::${normalizeWord(question.answer || question.correctAnswer || "")}`;
    const content = contentKey(question);
    if (targetTemplate) {
      const rows = globalDuplicateMaps.targetTemplate.get(targetTemplate) || [];
      rows.push(question);
      globalDuplicateMaps.targetTemplate.set(targetTemplate, rows);
    }
    if (image) {
      const rows = globalDuplicateMaps.primaryImage.get(image) || [];
      rows.push(question);
      globalDuplicateMaps.primaryImage.set(image, rows);
    }
    if (promptAnswer.replace(/:/g, "")) {
      const rows = globalDuplicateMaps.promptAnswer.get(promptAnswer) || [];
      rows.push(question);
      globalDuplicateMaps.promptAnswer.set(promptAnswer, rows);
    }
    if (content) {
      const rows = globalDuplicateMaps.content.get(content) || [];
      rows.push(question);
      globalDuplicateMaps.content.set(content, rows);
    }
  }

  function addGlobalDuplicateFailures(mapName, label) {
    for (const [duplicateKey, rows] of globalDuplicateMaps[mapName].entries()) {
      if (rows.length <= 1) continue;
      failures.push(`${label} reused ${rows.length} times: ${duplicateKey} :: ${rows.map(questionId).join(", ")}`);
    }
  }

  if (contract.uniqueTargetTemplateAcrossSkill) addGlobalDuplicateFailures("targetTemplate", "target/template");
  if (contract.uniquePrimaryImagesAcrossSkill) addGlobalDuplicateFailures("primaryImage", "primary image");
  if (contract.uniquePromptAnswersAcrossSkill) addGlobalDuplicateFailures("promptAnswer", "prompt/answer");
  if (contract.duplicateContentKeysForbidden) addGlobalDuplicateFailures("content", "question content");

  for (const [key, phase] of Object.entries(contract.phases || {})) {
    const requiredTargets = new Set((phase.requiredTargets || []).map(value => String(value).toLowerCase()));
    for (const target of requiredTargets) {
      const mapKey = `${phase.level}::${target}`;
      const phases = assignedTargetsByLevel.get(mapKey) || new Set();
      phases.add(phase.phase);
      assignedTargetsByLevel.set(mapKey, phases);
    }

    const phasePool = selectable.filter(question =>
      questionLevel(question) === Number(phase.level) &&
      questionPhase(question) === Number(phase.phase)
    );
    phasePool.forEach(question => selectableIdsInContract.add(questionId(question)));

    const phaseIssues = [];
    for (const question of phasePool) {
      phaseIssues.push(...perQuestionContractIssues(question, contract, phase));
    }

    const duplicateCounts = new Map();
    for (const question of phasePool) {
      const duplicateKey = targetTemplateKey(question);
      if (!duplicateKey) continue;
      duplicateCounts.set(duplicateKey, (duplicateCounts.get(duplicateKey) || 0) + 1);
    }
    const duplicatePairs = [...duplicateCounts.entries()].filter(([, count]) => count > 1);
    if (contract.duplicateTargetTemplatePairsForbidden && duplicatePairs.length) {
      phaseIssues.push(...duplicatePairs.map(([duplicateKey, count]) => `${key}: duplicate target/template pair ${duplicateKey} appears ${count} times`));
    }

    const coverageCounts = new Map();
    for (const question of phasePool) {
      const keyValue = coverageKey(question, phase);
      if (keyValue) coverageCounts.set(keyValue, (coverageCounts.get(keyValue) || 0) + 1);
    }
    const coveredTargets = [...requiredTargets].filter(target => coverageCounts.has(target));
    const missingTargets = [...requiredTargets].filter(target => !coverageCounts.has(target));
    const extraTargets = [...coverageCounts.keys()].filter(target => requiredTargets.size && !requiredTargets.has(target));
    const round = sampleRound(phasePool, phase.roundSize || contract.roundSize || ASSESSMENT_CONTRACT_ROUND_SIZE);
    const roundPass = round.length >= (phase.roundSize || contract.roundSize || ASSESSMENT_CONTRACT_ROUND_SIZE);
    const retryWrongAllowance = Number(contract.retryWrongAnswerAllowance || 0);
    const wrongOnRetry = round.slice(0, retryWrongAllowance);
    const wrongIds = new Set(wrongOnRetry.map(questionId));
    const firstRoundIds = new Set(round.map(questionId));
    const retryPool = phasePool.filter(question =>
      !firstRoundIds.has(questionId(question)) || wrongIds.has(questionId(question))
    );
    const retryRound = sampleRound(retryPool, phase.roundSize || contract.roundSize || ASSESSMENT_CONTRACT_ROUND_SIZE);
    const retryPass = retryRound.length >= (phase.roundSize || contract.roundSize || ASSESSMENT_CONTRACT_ROUND_SIZE);
    const minSelectable = phase.minimumSelectableCount || contract.minimumSelectableCountPerPhase || contract.roundSize || ASSESSMENT_CONTRACT_ROUND_SIZE;

    if (phasePool.length < minSelectable) {
      phaseIssues.push(`${key}: selectable count ${phasePool.length}/${minSelectable}`);
    }
    if (!roundPass) {
      phaseIssues.push(`${key}: runtime simulation only built ${round.length}/${phase.roundSize || contract.roundSize}`);
    }
    if (!retryPass) {
      phaseIssues.push(`${key}: retry simulation after ${retryWrongAllowance} wrong answers only built ${retryRound.length}/${phase.roundSize || contract.roundSize} without repeating correctly answered questions`);
    }
    if (missingTargets.length) {
      phaseIssues.push(`${key}: missing required targets ${missingTargets.join(", ")}`);
    }
    if (extraTargets.length && phase.requiredTargets?.length) {
      phaseIssues.push(`${key}: selectable items include targets outside this phase contract: ${extraTargets.slice(0, 20).join(", ")}${extraTargets.length > 20 ? ", ..." : ""}`);
    }

    allPerQuestionIssues.push(...phaseIssues);
    phaseRows.push({
      phaseKey: key,
      level: phase.level,
      phase: phase.phase,
      selectableCount: phasePool.length,
      minimumSelectable: minSelectable,
      roundSize: phase.roundSize || contract.roundSize,
      simulatedRoundCount: round.length,
      simulationPass: roundPass,
      retryWrongAnswerAllowance: retryWrongAllowance,
      simulatedRetryRoundCount: retryRound.length,
      retrySimulationPass: retryPass,
      requiredTargetCount: requiredTargets.size,
      coveredTargetCount: coveredTargets.length,
      missingTargets,
      extraTargets,
      issues: phaseIssues
    });
  }

  if (contract.forbidCoverageTargetsOutsideAssignedPhase) {
    for (const question of selectable) {
      const level = questionLevel(question);
      const phase = questionPhase(question);
      const target = coverageKey(question, contract);
      const assigned = assignedTargetsByLevel.get(`${level}::${target}`);
      if (assigned && !assigned.has(phase)) {
        failures.push(`${questionId(question)}: target ${target} appears in L${level}P${phase}, outside its assigned phase ${[...assigned].join("/")}`);
      }
    }
  }

  const unassignedSelectable = selectable.filter(question => !selectableIdsInContract.has(questionId(question)));
  if (unassignedSelectable.length) {
    failures.push(`${unassignedSelectable.length} selectable questions are not assigned to any contract phase`);
  }

  const selectableBlocked = selectable.filter(question => isQuestionBlockedByMediaQa(question));
  if (selectableBlocked.length) {
    failures.push(`${selectableBlocked.length} QA-blocked questions are still selectable`);
  }

  failures.push(...allPerQuestionIssues);

  return {
    skillId: contract.skillId,
    displayName: contract.displayName,
    status: contract.status,
    contractComplete: true,
    rawRuntimeCount: rawRuntime.length,
    runtimeSelectableCount: selectable.length,
    auditSelectableCount: selectableIdsInContract.size,
    runtimeAuditCountsMatch: selectable.length === selectableIdsInContract.size,
    rawQaBlockedCount: rawRuntime.filter(question => isQuestionBlockedByMediaQa(question)).length,
    selectableQaBlockedCount: selectableBlocked.length,
    phaseRows,
    warnings,
    failures
  };
}

function evaluateIncompleteContract(contract) {
  const rawRuntime = buildRuntimeQuestionsForSkill(contract.skillId);
  const selectable = selectableRuntimeQuestionsForSkill(contract.skillId);
  const failure = `${contract.skillId}: ${contract.incompleteReason || CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP}`;
  return {
    skillId: contract.skillId,
    displayName: contract.displayName,
    status: contract.status,
    incompleteReason: contract.incompleteReason,
    contractComplete: false,
    rawRuntimeCount: rawRuntime.length,
    runtimeSelectableCount: selectable.length,
    auditSelectableCount: 0,
    runtimeAuditCountsMatch: false,
    rawQaBlockedCount: rawRuntime.filter(question => isQuestionBlockedByMediaQa(question)).length,
    selectableQaBlockedCount: selectable.filter(question => isQuestionBlockedByMediaQa(question)).length,
    phaseRows: Object.entries(contract.phases || {}).map(([key, phase]) => ({
      phaseKey: key,
      level: phase.level,
      phase: phase.phase,
      selectableCount: 0,
      minimumSelectable: phase.minimumSelectableCount || contract.minimumSelectableCountPerPhase,
      roundSize: phase.roundSize || contract.roundSize,
      simulatedRoundCount: 0,
      simulationPass: false,
      retryWrongAnswerAllowance: Number(contract.retryWrongAnswerAllowance || 0),
      simulatedRetryRoundCount: 0,
      retrySimulationPass: false,
      requiredTargetCount: 0,
      coveredTargetCount: 0,
      missingTargets: [],
      extraTargets: [],
      issues: [contract.incompleteReason || CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP]
    })),
    warnings: [],
    failures: [failure]
  };
}

function evaluateContract(contract) {
  if (contract.status !== "complete") return evaluateIncompleteContract(contract);
  return evaluateCompleteContract(contract);
}

const results = assessmentSkillContracts.map(evaluateContract);
const completeSkills = results.filter(result => result.contractComplete).map(result => result.skillId);
const incompleteSkills = results.filter(result => !result.contractComplete).map(result => result.skillId);
const passingSkills = results.filter(result => result.contractComplete && result.failures.length === 0).map(result => result.skillId);
const failingSkills = results.filter(result => result.failures.length > 0).map(result => result.skillId);
const failureRows = results.flatMap(result =>
  result.failures.map(failure => [result.skillId, result.displayName, failure])
);

const summaryRows = results.map(result => [
  result.skillId,
  result.displayName,
  result.contractComplete ? "complete" : result.incompleteReason,
  result.rawRuntimeCount,
  result.runtimeSelectableCount,
  result.auditSelectableCount,
  result.runtimeAuditCountsMatch ? "yes" : "no",
  result.phaseRows.filter(row => row.simulationPass && row.retrySimulationPass).length + "/" + result.phaseRows.length,
  result.failures.length
]);

const phaseRows = results.flatMap(result =>
  result.phaseRows.map(row => [
    result.skillId,
    row.phaseKey,
    row.selectableCount,
    row.minimumSelectable,
    `${row.simulatedRoundCount}/${row.roundSize}`,
    `${row.simulatedRetryRoundCount}/${row.roundSize}`,
    `${row.coveredTargetCount}/${row.requiredTargetCount}`,
    row.missingTargets.join(", ") || "none",
    row.issues.length
  ])
);

const report = {
  generatedAt: new Date().toISOString(),
  roundSize: ASSESSMENT_CONTRACT_ROUND_SIZE,
  completeSkills,
  incompleteSkills,
  passingSkills,
  failingSkills,
  results
};

writeFile(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");
writeFile(REPORT_MD, [
  "# Assessment Skill Contract Audit",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `Round size: ${ASSESSMENT_CONTRACT_ROUND_SIZE}`,
  `Complete contracts: ${completeSkills.join(", ") || "none"}`,
  `Incomplete contracts: ${incompleteSkills.join(", ") || "none"}`,
  `Passing complete contracts: ${passingSkills.join(", ") || "none"}`,
  `Failing skills: ${failingSkills.join(", ") || "none"}`,
  "",
  "## Summary",
  "",
  table([
    "Skill ID",
    "Display Name",
    "Contract Status",
    "Runtime Pool",
    "Runtime Selectable",
    "Audit Selectable",
    "Runtime/Audit Match",
    "Phase Simulations",
    "Failures"
  ], summaryRows),
  "",
  "## Phase Detail",
  "",
  table([
    "Skill ID",
    "Phase",
    "Selectable",
    "Minimum",
    "Simulated Round",
    "Retry Round",
    "Targets Covered",
    "Missing Targets",
    "Issue Count"
  ], phaseRows),
  "",
  "## Failure Table",
  "",
  failureRows.length ? table(["Skill ID", "Display Name", "Failure"], failureRows) : "- none",
  ""
].join("\n"));

console.log("Assessment skill contract audit");
console.table(summaryRows.map(row => ({
  skillId: row[0],
  status: row[2],
  runtimeSelectable: row[4],
  auditSelectable: row[5],
  runtimeAuditMatch: row[6],
  phaseSimulations: row[7],
  failures: row[8]
})));
console.log(`Wrote ${path.relative(repoRoot, REPORT_MD)}`);
console.log(`Wrote ${path.relative(repoRoot, REPORT_JSON)}`);

if (failureRows.length) {
  console.error(`Assessment skill contract audit failed: ${failureRows.length} failures across ${failingSkills.length} skills.`);
  failureRows.slice(0, 80).forEach(([skillId, , failure]) => console.error(`- ${skillId}: ${failure}`));
  if (failureRows.length > 80) console.error(`...and ${failureRows.length - 80} more`);
  process.exit(1);
}

console.log("Assessment skill contract audit passed.");
