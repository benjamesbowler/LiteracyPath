import path from "node:path";

import {
  ASSESSMENT_CONTRACT_ROUND_SIZE,
  assessmentSkillContracts
} from "../src/data/assessmentSkillContracts.js";
import {
  assessmentReleaseExposureBySkillId,
  assessmentReleaseExposureVersion
} from "../src/content/assessments/assessmentReleaseExposure.generated.js";
import {
  getAssessmentQuestionPhase,
  getConfiguredPhaseItemKeys
} from "../src/appState/assessmentRuntime.js";
import {
  getAssessmentSkillPublicationStatus,
  loadAssessmentSkillBank,
  loadAssessmentSkillBankCandidates
} from "../src/data/loadAssessmentSkillBank.js";
import { isQuestionBlockedByMediaQa } from "../src/data/mediaQaManifest.js";
import {
  getAssessmentQuestionTemplate,
  selectAssessmentRoundCandidate
} from "../src/data/assessmentRoundSelector.js";
import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  getQuestionTargetWord,
  normalizeWord,
  publicPathExists,
  repoRoot,
  writeFile
} from "./phonicsRuntimeUtils.js";
import { skillTree } from "../src/skillTree.js";

const REPORT_MD = path.join(repoRoot, "docs/validation/assessment_skill_contract_audit.md");
const REPORT_JSON = path.join(repoRoot, "docs/validation/assessment_skill_contract_audit.json");
const EXPECTED_SKILL_COUNT = 30;
const RUNTIME_SKILL_IDS = Object.freeze({
  long_vowels_silent_e: "long_vowels",
  r_controlled_vowels: "r_controlled",
  prepositions_of_place: "prepositions",
  prefixes_suffixes: "prefix_suffix",
  homophones_homonyms: "homophones",
  theme_higher_comprehension: "theme"
});

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

function questionId(question = {}) {
  return String(question.id || question.questionId || "");
}

function questionLevel(question = {}) {
  return Number(question.level || question.assessmentLevel || 1) >= 2 ? 2 : 1;
}

function isQuestionEligibleForPhase(question, phase) {
  const explicitPhase = getAssessmentQuestionPhase(question);
  return !explicitPhase || explicitPhase === Number(phase);
}

function getLivePhasePool(contract, published, phase) {
  const levelPool = published.filter(question =>
    questionLevel(question) === Number(phase.level)
  );
  const explicitPhasePool = levelPool.filter(question =>
    isQuestionEligibleForPhase(question, phase.phase)
  );
  const runtimeSkillId = RUNTIME_SKILL_IDS[contract.skillId] || contract.skillId;
  const stage = skillTree.find(item => item.id === runtimeSkillId) || {
    id: runtimeSkillId,
    label: contract.displayName
  };
  const requiresExplicitPhase = Boolean(
    getConfiguredPhaseItemKeys(stage, phase.level, phase.phase)?.length
  );
  const useExplicitPhase = requiresExplicitPhase ||
    explicitPhasePool.length >= ASSESSMENT_CONTRACT_ROUND_SIZE;
  return {
    questions: useExplicitPhase ? explicitPhasePool : levelPool,
    mode: useExplicitPhase ? "explicit-phase" : "level-fallback",
    explicitPhaseCount: explicitPhasePool.length,
    levelCount: levelPool.length,
    requiresExplicitPhase
  };
}

function buildSelectorRound(prioritizedQuestions, skillId, roundSize) {
  const remaining = [...prioritizedQuestions];
  const selected = [];

  while (selected.length < roundSize && remaining.length) {
    const selection = selectAssessmentRoundCandidate(remaining, {
      selectedQuestions: selected,
      skillId,
      roundLength: roundSize
    });
    if (!selection.question) break;
    selected.push(selection.question);
    const selectedIndex = remaining.indexOf(selection.question);
    if (selectedIndex < 0) break;
    remaining.splice(selectedIndex, 1);
  }

  return selected;
}

function buildRetryPriority(phasePool, firstRound, wrongAnswerAllowance) {
  const wrongIds = new Set(
    firstRound.slice(0, wrongAnswerAllowance).map(questionId)
  );
  const firstRoundIds = new Set(firstRound.map(questionId));
  const incorrectlyAnswered = phasePool.filter(question => wrongIds.has(questionId(question)));
  const unseen = phasePool.filter(question => !firstRoundIds.has(questionId(question)));
  const oldestReusableCorrect = phasePool.filter(question =>
    firstRoundIds.has(questionId(question)) && !wrongIds.has(questionId(question))
  );
  return [...incorrectlyAnswered, ...unseen, ...oldestReusableCorrect];
}

function mediaIssues(question = {}) {
  const id = questionId(question) || "(missing id)";
  const issues = [];
  const missingImages = getQuestionImagePaths(question)
    .filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  const missingAudio = getQuestionAudioPaths(question)
    .filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));

  if (isQuestionBlockedByMediaQa(question)) {
    issues.push(`${id}: QA-blocked media is present in the exact published bank`);
  }
  if (missingImages.length) {
    issues.push(`${id}: missing published image files: ${missingImages.join(", ")}`);
  }
  if (missingAudio.length) {
    issues.push(`${id}: missing published audio files: ${missingAudio.join(", ")}`);
  }
  return issues;
}

function compareExactExposure(contract, published, publicationStatus) {
  const failures = [];
  const exposure = assessmentReleaseExposureBySkillId[contract.skillId] || [];
  const exposureById = new Map(
    exposure.map(row => [String(row.questionId || ""), Number(row.level || 1)])
  );
  const publishedById = new Map(
    published.map(question => [questionId(question), questionLevel(question)])
  );

  if (assessmentReleaseExposureVersion !== publicationStatus.standardVersion) {
    failures.push(
      `exposure version ${assessmentReleaseExposureVersion} does not match publication version ${publicationStatus.standardVersion}`
    );
  }
  if (!publicationStatus.releaseReady) {
    failures.push(`canonical publication status is blocked: ${(publicationStatus.reasons || []).join("; ")}`);
  }
  if (publicationStatus.publicationMode !== "audited-id-set") {
    failures.push(`publication mode is ${publicationStatus.publicationMode || "missing"}, expected audited-id-set`);
  }
  if (exposureById.size !== exposure.length) {
    failures.push(`exact exposure contains ${exposure.length - exposureById.size} duplicate question IDs`);
  }
  if (publishedById.size !== published.length) {
    failures.push(`published bank contains ${published.length - publishedById.size} duplicate question IDs`);
  }
  if (published.length !== Number(publicationStatus.runtimeSelectableQuestions || 0)) {
    failures.push(
      `published bank count ${published.length} does not match canonical runtime-selectable count ${publicationStatus.runtimeSelectableQuestions || 0}`
    );
  }

  const missingIds = [...exposureById.keys()].filter(id => !publishedById.has(id));
  const extraIds = [...publishedById.keys()].filter(id => !exposureById.has(id));
  const levelMismatches = [...publishedById.entries()].filter(
    ([id, level]) => exposureById.has(id) && exposureById.get(id) !== level
  );

  if (missingIds.length) {
    failures.push(`published bank is missing exact exposure IDs: ${missingIds.slice(0, 12).join(", ")}`);
  }
  if (extraIds.length) {
    failures.push(`published bank contains IDs outside exact exposure: ${extraIds.slice(0, 12).join(", ")}`);
  }
  if (levelMismatches.length) {
    failures.push(
      `published level differs from exact exposure for ${levelMismatches.slice(0, 12).map(([id]) => id).join(", ")}`
    );
  }

  return {
    exposureCount: exposure.length,
    exposureIds: exposureById,
    publishedIds: publishedById,
    failures
  };
}

function evaluateRequiredLevelTargets(contract, published) {
  const rows = [];
  const failures = [];

  for (const level of [1, 2]) {
    const required = new Set(
      (contract.requiredLevelTargets?.[level] || []).map(normalizeWord).filter(Boolean)
    );
    if (!required.size) continue;
    const covered = new Set(
      published
        .filter(question => questionLevel(question) === level)
        .map(question => normalizeWord(getQuestionTargetWord(question)))
        .filter(Boolean)
    );
    const missing = [...required].filter(target => !covered.has(target));
    const outsideBand = [...covered].filter(target => !required.has(target));

    if (missing.length) {
      failures.push(`L${level}: missing canonical band targets ${missing.join(", ")}`);
    }
    if (outsideBand.length) {
      failures.push(`L${level}: targets outside canonical band ${outsideBand.join(", ")}`);
    }
    rows.push({
      level,
      requiredTargetCount: required.size,
      coveredTargetCount: [...required].filter(target => covered.has(target)).length,
      missingTargets: missing,
      outsideTargets: outsideBand
    });
  }

  return { rows, failures };
}

async function evaluateContract(contract) {
  const candidates = await loadAssessmentSkillBankCandidates(contract.skillId);
  const published = await loadAssessmentSkillBank(contract.skillId);
  const publicationStatus = getAssessmentSkillPublicationStatus(contract.skillId);
  const exactExposure = compareExactExposure(contract, published, publicationStatus);
  const requiredLevelTargets = evaluateRequiredLevelTargets(contract, published);
  const failures = [
    ...exactExposure.failures,
    ...requiredLevelTargets.failures
  ];
  const phaseRows = [];
  const auditedPublishedIds = new Set();

  for (const [phaseKey, phase] of Object.entries(contract.phases || {})) {
    const phaseSelection = getLivePhasePool(contract, published, phase);
    const phasePool = phaseSelection.questions;
    phasePool.forEach(question => auditedPublishedIds.add(questionId(question)));
    const phaseIssues = [];
    const allowedFormats = new Set(phase.allowedFormats || []);

    for (const question of phasePool) {
      const format = getAssessmentQuestionTemplate(question);
      if (allowedFormats.size && !allowedFormats.has(format)) {
        phaseIssues.push(
          `${questionId(question)}: canonical format ${format} is outside ${phaseKey} formats ${[...allowedFormats].join(", ")}`
        );
      }
      phaseIssues.push(...mediaIssues(question));
    }

    const roundSize = Number(phase.roundSize || contract.roundSize || ASSESSMENT_CONTRACT_ROUND_SIZE);
    const minimumSelectable = Number(
      phase.minimumSelectableCount ||
      contract.minimumSelectableCountPerPhase ||
      roundSize
    );
    const firstRound = buildSelectorRound(phasePool, contract.skillId, roundSize);
    const retryWrongAnswerAllowance = Number(contract.retryWrongAnswerAllowance || 0);
    const retryPriority = buildRetryPriority(
      phasePool,
      firstRound,
      retryWrongAnswerAllowance
    );
    const retryRound = buildSelectorRound(retryPriority, contract.skillId, roundSize);
    const simulationPass = firstRound.length === roundSize;
    const retrySimulationPass = retryRound.length === roundSize;

    if (phasePool.length < minimumSelectable) {
      phaseIssues.push(`${phaseKey}: exact published phase pool ${phasePool.length}/${minimumSelectable}`);
    }
    if (!simulationPass) {
      phaseIssues.push(`${phaseKey}: live selector built ${firstRound.length}/${roundSize} questions`);
    }
    if (!retrySimulationPass) {
      phaseIssues.push(
        `${phaseKey}: live retry priority and selector built ${retryRound.length}/${roundSize} questions`
      );
    }

    failures.push(...phaseIssues);
    phaseRows.push({
      phaseKey,
      level: phase.level,
      phase: phase.phase,
      phasePoolMode: phaseSelection.mode,
      explicitPhaseCount: phaseSelection.explicitPhaseCount,
      levelCount: phaseSelection.levelCount,
      requiresExplicitPhase: phaseSelection.requiresExplicitPhase,
      selectableCount: phasePool.length,
      minimumSelectable,
      roundSize,
      simulatedRoundCount: firstRound.length,
      simulationPass,
      retryWrongAnswerAllowance,
      simulatedRetryRoundCount: retryRound.length,
      retrySimulationPass,
      allowedFormats: [...allowedFormats],
      issues: phaseIssues
    });
  }

  const unauditedIds = [...exactExposure.publishedIds.keys()]
    .filter(id => !auditedPublishedIds.has(id));
  if (unauditedIds.length) {
    failures.push(
      `${unauditedIds.length} exact published questions are outside every formal phase: ${unauditedIds.slice(0, 12).join(", ")}`
    );
  }

  return {
    skillId: contract.skillId,
    displayName: contract.displayName,
    status: contract.status,
    contractComplete: contract.status === "complete" && phaseRows.length === 4,
    rawRuntimeCount: candidates.length,
    runtimeSelectableCount: published.length,
    exactExposureCount: exactExposure.exposureCount,
    auditSelectableCount: auditedPublishedIds.size,
    runtimeAuditCountsMatch:
      published.length === exactExposure.exposureCount &&
      published.length === auditedPublishedIds.size,
    rawQaBlockedCount: candidates.filter(isQuestionBlockedByMediaQa).length,
    selectableQaBlockedCount: published.filter(isQuestionBlockedByMediaQa).length,
    phaseRows,
    requiredLevelTargetRows: requiredLevelTargets.rows,
    warnings: [],
    failures
  };
}

const contractIds = assessmentSkillContracts.map(contract => contract.skillId);
const contractSetFailures = [];
if (assessmentSkillContracts.length !== EXPECTED_SKILL_COUNT) {
  contractSetFailures.push(
    `canonical contract set has ${assessmentSkillContracts.length}/${EXPECTED_SKILL_COUNT} skills`
  );
}
if (new Set(contractIds).size !== contractIds.length) {
  contractSetFailures.push("canonical contract set contains duplicate skill IDs");
}

const results = await Promise.all(assessmentSkillContracts.map(evaluateContract));
const completeSkills = results
  .filter(result => result.contractComplete)
  .map(result => result.skillId);
const incompleteSkills = results
  .filter(result => !result.contractComplete)
  .map(result => result.skillId);
const passingSkills = results
  .filter(result => result.contractComplete && result.failures.length === 0)
  .map(result => result.skillId);
const failingSkills = results
  .filter(result => result.failures.length > 0)
  .map(result => result.skillId);
const failureRows = [
  ...contractSetFailures.map(failure => ["(contract set)", "Canonical skill set", failure]),
  ...results.flatMap(result =>
    result.failures.map(failure => [result.skillId, result.displayName, failure])
  )
];

const summaryRows = results.map(result => [
  result.skillId,
  result.displayName,
  result.contractComplete ? "complete" : "incomplete",
  result.rawRuntimeCount,
  result.runtimeSelectableCount,
  result.exactExposureCount,
  result.auditSelectableCount,
  result.runtimeAuditCountsMatch ? "yes" : "no",
  result.phaseRows.filter(row => row.simulationPass && row.retrySimulationPass).length +
    "/" + result.phaseRows.length,
  result.failures.length
]);

const phaseRows = results.flatMap(result =>
  result.phaseRows.map(row => [
    result.skillId,
    row.phaseKey,
    row.phasePoolMode,
    row.selectableCount,
    row.minimumSelectable,
    `${row.simulatedRoundCount}/${row.roundSize}`,
    `${row.simulatedRetryRoundCount}/${row.roundSize}`,
    row.allowedFormats.join(", "),
    row.issues.length
  ])
);

const report = {
  generatedAt: new Date().toISOString(),
  roundSize: ASSESSMENT_CONTRACT_ROUND_SIZE,
  expectedSkillCount: EXPECTED_SKILL_COUNT,
  contractSetFailures,
  completeSkills,
  incompleteSkills,
  passingSkills,
  failingSkills,
  results
};

writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
writeFile(REPORT_MD, [
  "# Assessment Skill Contract Audit",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `Round size: ${ASSESSMENT_CONTRACT_ROUND_SIZE}`,
  `Canonical contracts: ${results.length}/${EXPECTED_SKILL_COUNT}`,
  `Complete contracts: ${completeSkills.length}/${EXPECTED_SKILL_COUNT}`,
  `Passing contracts: ${passingSkills.length}/${EXPECTED_SKILL_COUNT}`,
  `Failing skills: ${failingSkills.join(", ") || "none"}`,
  "",
  "This gate reads the exact generated child exposure, the canonical 30-skill level design,",
  "the live phase resolver, the approved HFW runtime bands, and the production round selector.",
  "A question must retain exact ID/level parity, belong to at least one formal phase, resolve its",
  "published media, use an allowed format, and support both an initial and retry round.",
  "",
  "## Summary",
  "",
  table([
    "Skill ID",
    "Display Name",
    "Contract",
    "Candidate Pool",
    "Published",
    "Exact Exposure",
    "Audited",
    "Exact Match",
    "Phase Simulations",
    "Failures"
  ], summaryRows),
  "",
  "## Phase Detail",
  "",
  table([
    "Skill ID",
    "Phase",
    "Live Pool Rule",
    "Selectable",
    "Minimum",
    "Initial Round",
    "Retry Round",
    "Allowed Formats",
    "Issues"
  ], phaseRows),
  "",
  "## Failure Table",
  "",
  failureRows.length
    ? table(["Skill ID", "Display Name", "Failure"], failureRows)
    : "- none",
  ""
].join("\n"));

console.log("Assessment skill contract audit");
console.table(summaryRows.map(row => ({
  skillId: row[0],
  status: row[2],
  published: row[4],
  exactExposure: row[5],
  auditSelectable: row[6],
  exactMatch: row[7],
  phaseSimulations: row[8],
  failures: row[9]
})));
console.log(`Wrote ${path.relative(repoRoot, REPORT_MD)}`);
console.log(`Wrote ${path.relative(repoRoot, REPORT_JSON)}`);

if (failureRows.length) {
  console.error(
    `Assessment skill contract audit failed: ${failureRows.length} failures across ${failingSkills.length} skills.`
  );
  failureRows
    .slice(0, 80)
    .forEach(([skillId, , failure]) => console.error(`- ${skillId}: ${failure}`));
  if (failureRows.length > 80) {
    console.error(`...and ${failureRows.length - 80} more`);
  }
  process.exitCode = 1;
} else {
  console.log("Assessment skill contract audit passed.");
}
