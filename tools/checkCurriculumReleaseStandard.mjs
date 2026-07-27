import fs from "node:fs";
import path from "node:path";

import {
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  ASSESSMENT_RELEASE_STANDARD_VERSION,
  assessmentReleaseStandard
} from "../src/content/releaseStandard.js";
import {
  assessmentReleaseStatus,
  assessmentReleaseStatusVersion
} from "../src/content/assessments/assessmentReleaseStatus.generated.js";
import {
  assessmentReleaseExposureBySkillId,
  assessmentReleaseExposureVersion
} from "../src/content/assessments/assessmentReleaseExposure.generated.js";
import { managedAssessmentSkillDepthConfig } from "../src/data/skillLevelDepthConfig.js";
import {
  getAssessmentSkillPublicationStatus,
  loadAssessmentSkillBank,
  loadAssessmentSkillBankCandidates
} from "../src/data/loadAssessmentSkillBank.js";
import {
  buildRuntimeAlignedAssessmentReleaseStatus,
  renderAssessmentReleaseExposure,
  renderAssessmentReleaseStatus
} from "./assessmentReleaseStatus.mjs";
import { auditStrictProductionReadiness } from "./auditAllSkillsStrictProductionReadiness.js";
import { repoRoot } from "./phonicsRuntimeUtils.js";

const generatedPath = path.join(
  repoRoot,
  "src",
  "content",
  "assessments",
  "assessmentReleaseStatus.generated.js"
);
const generatedExposurePath = path.join(
  repoRoot,
  "src",
  "content",
  "assessments",
  "assessmentReleaseExposure.generated.js"
);
const failures = [];

function fail(message) {
  failures.push(message);
}

function sameValues(left = [], right = []) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

if (assessmentReleaseStandard.version !== ASSESSMENT_RELEASE_STANDARD_VERSION) {
  fail("Canonical release standard version exports disagree.");
}
if (assessmentReleaseStatusVersion !== ASSESSMENT_RELEASE_STANDARD_VERSION) {
  fail("Generated publication status uses a stale release-standard version.");
}
if (assessmentReleaseExposureVersion !== ASSESSMENT_RELEASE_STANDARD_VERSION) {
  fail("Generated publication exposure uses a stale release-standard version.");
}
if (!sameValues(
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  managedAssessmentSkillDepthConfig.map(skill => skill.skillId)
)) {
  fail("Release-standard skills and strict-audit managed skills differ.");
}

const expectedStatuses = await buildRuntimeAlignedAssessmentReleaseStatus();
const expectedGeneratedSource = renderAssessmentReleaseStatus(expectedStatuses);
if (fs.readFileSync(generatedPath, "utf8") !== expectedGeneratedSource) {
  fail("Generated assessment publication status is stale; run npm run generate:assessment-release-status.");
}
const expectedExposureSource = renderAssessmentReleaseExposure(expectedStatuses);
if (fs.readFileSync(generatedExposurePath, "utf8") !== expectedExposureSource) {
  fail("Generated assessment publication exposure is stale; run npm run generate:assessment-release-status.");
}

const strictReport = auditStrictProductionReadiness();
if (strictReport.strictStandard.version !== ASSESSMENT_RELEASE_STANDARD_VERSION) {
  fail("Strict audit did not report the canonical release-standard version.");
}
if (strictReport.perSkill.length !== ASSESSMENT_RELEASE_MANAGED_SKILL_IDS.length) {
  fail(`Strict audit covered ${strictReport.perSkill.length}/${ASSESSMENT_RELEASE_MANAGED_SKILL_IDS.length} release-managed skills.`);
}
const initialSoundsStrict = strictReport.perSkill.find(skill => skill.skillId === "initial_sounds");
if (!initialSoundsStrict?.balanceReport?.pass) {
  fail("initial_sounds: strict-audit phoneme and interaction balance report did not pass.");
}
if (!initialSoundsStrict?.releaseStandardDecision?.releaseReady) {
  fail("initial_sounds: the canonical release decision is not ready.");
}
for (const level of [1, 2]) {
  const balance = initialSoundsStrict?.balanceReport?.levels?.[level];
  if (!balance || balance.listenAndFindShare >= balance.caps.maximumListenAndFindShare) {
    fail(`initial_sounds: level ${level} listen-and-find share is not below its configured cap.`);
  }
}

for (const strictSkill of strictReport.perSkill) {
  const generated = assessmentReleaseStatus.find(status => status.skillId === strictSkill.skillId);
  const publication = getAssessmentSkillPublicationStatus(strictSkill.skillId);
  if (!generated) {
    fail(`${strictSkill.skillId}: missing generated publication decision.`);
    continue;
  }
  if (generated.releaseReady && !strictSkill.releaseStandardDecision.releaseReady) {
    fail(`${strictSkill.skillId}: generated publication bypassed a failing strict decision.`);
  }
  if (publication.releaseReady !== generated.releaseReady) {
    fail(`${strictSkill.skillId}: loader publication decision disagrees with generated status.`);
  }

  const candidates = await loadAssessmentSkillBankCandidates(strictSkill.skillId);
  const published = await loadAssessmentSkillBank(strictSkill.skillId);
  const expectedPublished = assessmentReleaseExposureBySkillId[strictSkill.skillId] || [];
  const expectedById = new Map(expectedPublished.map(item => [
    String(item.questionId || ""),
    Number(item.level || 1)
  ]));
  const publishedById = new Map(published.map(question => [
    String(question.id || question.questionId || ""),
    Number(question.level || question.assessmentLevel || 1)
  ]));
  if (generated.releaseReady && generated.publicationMode === "audited-id-set") {
    if (expectedById.size !== publishedById.size) {
      fail(`${strictSkill.skillId}: loader published ${publishedById.size}/${expectedById.size} audited questions.`);
    }
    for (const [questionId, level] of expectedById) {
      if (!publishedById.has(questionId)) {
        fail(`${strictSkill.skillId}: audited question ${questionId} is absent from the student loader.`);
      } else if (publishedById.get(questionId) !== level) {
        fail(`${strictSkill.skillId}: audited question ${questionId} has loader level ${publishedById.get(questionId)}, expected ${level}.`);
      }
    }
    if (expectedById.size > candidates.length) {
      fail(`${strictSkill.skillId}: audited publication set exceeds its candidate pool.`);
    }
  } else if (generated.releaseReady) {
    fail(`${strictSkill.skillId}: a ready skill does not use its audited ID set.`);
  }
  if (strictSkill.skillId === "initial_sounds" && generated.releaseReady) {
    for (const level of [1, 2]) {
      const scoped = published.filter(question => Number(question.level || 1) === level);
      if (scoped.length !== assessmentReleaseStandard.defaults.questionCount.minimumPerLevel) {
        fail(`initial_sounds: level ${level} published ${scoped.length} questions instead of the canonical floor.`);
      }
    }
  }
  if (!generated.releaseReady && published.length !== 0) {
    fail(`${strictSkill.skillId}: a failing skill still published ${published.length} questions.`);
  }
}

const canonicalDefinitionPath = "src/content/releaseStandard.js";
const sourceGuards = [
  {
    file: "tools/auditAllSkillsStrictProductionReadiness.js",
    required: [
      /from "\.\.\/src\/content\/releaseStandard\.js"/u,
      /evaluateAssessmentSkillReleaseSummary/u
    ],
    forbidden: [
      /const minimumPerLevel\s*=\s*\d/u,
      /const minimumUniqueTargetsPerLevel\s*=\s*\d/u,
      /const maxTargetDominance\s*=\s*0\./u
    ]
  },
  {
    file: "src/data/skillLevelDepthConfig.js",
    required: [/from "\.\.\/content\/releaseStandard\.js"/u],
    forbidden: [
      /minimumPerLevel:\s*\d/u,
      /phaseSize:\s*\d/u
    ]
  },
  {
    file: "src/data/loadAssessmentSkillBank.js",
    required: [
      /assessmentReleaseStatusBySkillId/u,
      /if \(!publicationStatus\.releaseReady\) return \[\]/u,
      /assessmentReleaseExposureBySkillId/u
    ],
    forbidden: []
  }
];

for (const guard of sourceGuards) {
  const source = fs.readFileSync(path.join(repoRoot, guard.file), "utf8");
  for (const pattern of guard.required) {
    if (!pattern.test(source)) fail(`${guard.file}: missing canonical-standard integration ${pattern}.`);
  }
  for (const pattern of guard.forbidden) {
    if (pattern.test(source)) fail(`${guard.file}: duplicates a policy owned by ${canonicalDefinitionPath}.`);
  }
}

const readyCount = assessmentReleaseStatus.filter(status => status.releaseReady).length;
console.log(`Canonical release standard: ${ASSESSMENT_RELEASE_STANDARD_VERSION}`);
console.log(`Release-managed skills: ${assessmentReleaseStatus.length}`);
console.log(`Published skills: ${readyCount}`);
console.log(`Blocked skills: ${assessmentReleaseStatus.length - readyCount}`);
for (const level of [1, 2]) {
  const balance = initialSoundsStrict.balanceReport.levels[level];
  console.log(
    `Initial Sounds L${level}: ${balance.questionCount} published; ` +
    `phoneme ${(balance.maximumPhonemeShare * 100).toFixed(1)}%; ` +
    `prompt-family ${(balance.maximumPromptFamilyShare * 100).toFixed(1)}%; ` +
    `response-format ${(balance.maximumResponseFormatShare * 100).toFixed(1)}%; ` +
    `listen-and-find ${(balance.listenAndFindShare * 100).toFixed(1)}%; PASS`
  );
}
console.log(`Strict/loader/generator mismatches: ${failures.length}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
