import fs from "node:fs";
import path from "node:path";

import {
  finalSoundLevelOneForbiddenItemKeys
} from "../src/data/coverageExpectations.js";
import {
  SKILL_LEVEL_DEPTH_TARGETS,
  managedAssessmentSkillDepthConfig
} from "../src/data/skillLevelDepthConfig.js";
import {
  auditSkillLevelDepth,
  buildRound,
  docsValidationDir,
  ensureDir,
  getQuestionMediaPaths,
  getRuntimeSafeDepthQuestions,
  uniqueRuntimeQuestions
} from "./skillLevelDepthShared.js";
import { publicPathExists } from "./phonicsRuntimeUtils.js";

const jsonPath = path.join(docsValidationDir, "skill_level_depth_check.json");
const markdownPath = path.join(docsValidationDir, "skill_level_depth_check.md");
const earlyMediaSkills = new Set([
  "initial_sounds",
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination"
]);

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function targetWord(question = {}) {
  return normalize(question.depthTargetWord || question.targetWord || question.audioText || question.word || question.id);
}

function itemKey(question = {}) {
  return normalize(question.depthItemKey || question.itemKey || question.targetPattern || question.targetSound || question.correctAnswer || "");
}

function missingMedia(question = {}) {
  const { image, audio } = getQuestionMediaPaths(question);
  return [...image, ...audio]
    .filter(assetPath => String(assetPath || "").startsWith("/") && !publicPathExists(assetPath));
}

function hasAdvancedFinalSoundLevelOneEnding(question = {}) {
  const key = itemKey(question);
  const word = targetWord(question);
  if (finalSoundLevelOneForbiddenItemKeys.includes(key)) return true;
  return finalSoundLevelOneForbiddenItemKeys.some(pattern => word.endsWith(pattern));
}

function validateRound({ round, skillId, level, phaseName, uniqueTargetCount, seed }) {
  const issues = [];
  if (round.length !== SKILL_LEVEL_DEPTH_TARGETS.phaseSize) {
    issues.push(`${phaseName} seed ${seed}: expected 15 questions, got ${round.length}`);
  }

  for (const question of round) {
    if (question.depthSkillId !== skillId) {
      issues.push(`${phaseName} seed ${seed}: ${question.id} routed to ${question.depthSkillId || "(missing)"}`);
    }
    if (question.depthLevel !== level) {
      issues.push(`${phaseName} seed ${seed}: ${question.id} has level ${question.depthLevel}`);
    }
    if (question.depthFilterReason) {
      issues.push(`${phaseName} seed ${seed}: ${question.id} is not runtime-safe: ${question.depthFilterReason}`);
    }
    const missing = missingMedia(question);
    if (missing.length) {
      issues.push(`${phaseName} seed ${seed}: ${question.id} missing media ${missing.join(", ")}`);
    }
    if (skillId === "final_sounds" && level === 1 && hasAdvancedFinalSoundLevelOneEnding(question)) {
      issues.push(`${phaseName} seed ${seed}: ${question.id} has advanced Final Sounds Level 1 ending`);
    }
  }

  const targets = round.map(targetWord).filter(Boolean);
  if (uniqueTargetCount >= SKILL_LEVEL_DEPTH_TARGETS.phaseSize && new Set(targets).size < SKILL_LEVEL_DEPTH_TARGETS.phaseSize) {
    issues.push(`${phaseName} seed ${seed}: repeated target word inside round despite enough unique targets`);
  }

  return issues;
}

function main() {
  ensureDir(docsValidationDir);

  const audit = auditSkillLevelDepth();
  const failures = [];
  const warnings = [];
  const allQuestions = getRuntimeSafeDepthQuestions();
  const summaries = [];

  for (const skill of audit) {
    if (!skill.passes) {
      failures.push(`${skill.skillName}: depth audit did not pass`);
    }
  }

  for (const config of managedAssessmentSkillDepthConfig) {
    const skillQuestions = uniqueRuntimeQuestions(
      allQuestions.filter(question => question.depthSkillId === config.skillId && !question.depthFilterReason)
    );

    for (const level of [1, 2]) {
      const levelConfig = config.levels[level];
      if (!levelConfig?.designed) {
        summaries.push({
          skillId: config.skillId,
          skillName: config.skillName,
          level,
          designed: false,
          simulations: 0,
          questionCount: 0,
          status: "Level 2 not yet designed"
        });
        continue;
      }

      const levelItems = skillQuestions.filter(question => question.depthLevel === level);
      const uniqueTargets = new Set(levelItems.map(targetWord).filter(Boolean));
      let simulatedRounds = 0;
      for (let seed = 0; seed < SKILL_LEVEL_DEPTH_TARGETS.simulationRounds; seed += 1) {
        const phaseOne = buildRound(levelItems, SKILL_LEVEL_DEPTH_TARGETS.phaseSize, seed);
        const phaseTwoPool = levelItems.filter(item => !phaseOne.includes(item));
        const phaseTwo = buildRound(phaseTwoPool, SKILL_LEVEL_DEPTH_TARGETS.phaseSize, seed + 17);
        failures.push(...validateRound({
          round: phaseOne,
          skillId: config.skillId,
          level,
          phaseName: "Phase 1",
          uniqueTargetCount: uniqueTargets.size,
          seed
        }).map(message => `${config.skillName} L${level}: ${message}`));
        failures.push(...validateRound({
          round: phaseTwo,
          skillId: config.skillId,
          level,
          phaseName: "Phase 2",
          uniqueTargetCount: Math.max(0, uniqueTargets.size - SKILL_LEVEL_DEPTH_TARGETS.phaseSize),
          seed
        }).map(message => `${config.skillName} L${level}: ${message}`));
        simulatedRounds += 2;
      }

      if (earlyMediaSkills.has(config.skillId)) {
        const generatedMissingMedia = levelItems.filter(question =>
          question._source === "skillLevelGapQuestions" && missingMedia(question).length
        );
        if (generatedMissingMedia.length) {
          failures.push(`${config.skillName} L${level}: ${generatedMissingMedia.length} generated questions reference missing media`);
        }
      }

      summaries.push({
        skillId: config.skillId,
        skillName: config.skillName,
        level,
        designed: true,
        simulations: simulatedRounds,
        questionCount: levelItems.length,
        uniqueTargetWords: uniqueTargets.size,
        status: "checked"
      });
    }
  }

  const result = {
    generatedAt: new Date().toISOString(),
    simulationRoundsPerPhase: SKILL_LEVEL_DEPTH_TARGETS.simulationRounds,
    failures,
    warnings,
    summaries
  };
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

  const table = summaries.map(item =>
    `| ${item.skillName} | ${item.level} | ${item.designed ? "yes" : "no"} | ${item.questionCount} | ${item.uniqueTargetWords ?? "-"} | ${item.simulations} | ${item.status} |`
  ).join("\n");
  fs.writeFileSync(markdownPath, `# Skill Level Depth Check\n\nGenerated: ${result.generatedAt}\n\nFailures: ${failures.length}\nWarnings: ${warnings.length}\n\n| Skill | Level | Designed | Questions | Unique Targets | Simulated Rounds | Status |\n|---|---:|---|---:|---:|---:|---|\n${table}\n\n## Failures\n\n${failures.length ? failures.map(item => `- ${item}`).join("\n") : "None."}\n\n## Warnings\n\n${warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None."}\n`);

  if (failures.length) {
    console.error(`Skill level depth check failed with ${failures.length} failures.`);
    failures.slice(0, 40).forEach(item => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log(`Skill level depth check passed. Simulated ${summaries.reduce((sum, item) => sum + item.simulations, 0)} rounds.`);
}

main();
