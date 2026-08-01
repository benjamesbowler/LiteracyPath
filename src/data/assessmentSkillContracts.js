import { assessmentReleaseStandard } from "../content/releaseStandard.js";
import { hfwApprovedWordsBySkill } from "./generated/hfwEligibilityKeys.generated.js";
import { managedAssessmentSkillDepthConfig } from "./skillLevelDepthConfig.js";
import { getMasteryRule } from "../masterySystem.js";

export const ASSESSMENT_CONTRACT_ROUND_SIZE =
  assessmentReleaseStandard.defaults.questionCount.phaseSize;

const HFW_SKILL_IDS = new Set([
  "hfw_1_25",
  "hfw_26_50",
  "hfw_51_75",
  "hfw_76_100"
]);

function phaseKey(level, phase) {
  return `L${level}P${phase}`;
}

function makePhase(level, phase, levelConfig = {}, roundSize = ASSESSMENT_CONTRACT_ROUND_SIZE) {
  return {
    level,
    phase,
    learnerBand: level === 1 ? "kindergarten_entry_esl" : "grade_1_extension",
    allowedFormats: [...(levelConfig.allowedFormats || [])],
    minimumSelectableCount: roundSize,
    roundSize,
    rule: levelConfig.rule || ""
  };
}

function makeContract(config = {}) {
  const roundSize = getMasteryRule(config.skillName).roundLength;
  const phases = {};
  for (const level of [1, 2]) {
    for (const phase of [1, 2]) {
      phases[phaseKey(level, phase)] = makePhase(level, phase, config.levels?.[level], roundSize);
    }
  }

  return {
    skillId: config.skillId,
    displayName: config.skillName,
    aliases: [...(config.aliases || [])],
    status: "complete",
    progression: {
      ...assessmentReleaseStandard.defaults.progression,
      requiredLevelOnePhases: [
        ...assessmentReleaseStandard.defaults.progression.requiredLevelOnePhases
      ]
    },
    difficultyProfile: {
      1: {
        learnerBand: "kindergarten_entry_esl",
        rule: config.levels?.[1]?.rule || ""
      },
      2: {
        learnerBand: "grade_1_extension",
        rule: config.levels?.[2]?.rule || ""
      }
    },
    roundSize,
    minimumSelectableCountPerPhase: roundSize,
    retryWrongAnswerAllowance: 3,
    qaBlockedMediaMustFail: true,
    exactPublishedExposureRequired: true,
    requiredLevelTargets: HFW_SKILL_IDS.has(config.skillId)
      ? {
          1: [...(hfwApprovedWordsBySkill[config.skillId] || [])],
          2: [...(hfwApprovedWordsBySkill[config.skillId] || [])]
        }
      : {},
    requiredTargetType: HFW_SKILL_IDS.has(config.skillId) ? "sight_word" : "",
    phases,
    notes: HFW_SKILL_IDS.has(config.skillId)
      ? "Uses the same generated approved HFW band as runtime eligibility; every word must be represented at each level across its two phases."
      : "Uses the canonical managed-skill level design and the exact published child bank."
  };
}

export const assessmentSkillContracts =
  managedAssessmentSkillDepthConfig.map(makeContract);

export const assessmentSkillContractsById = Object.fromEntries(
  assessmentSkillContracts.map(contract => [contract.skillId, contract])
);
