import path from "node:path";

import {
  buildRuntimeQuestionsForSkill,
  inferPatternForSkill,
  publicPathExists,
  repoRoot,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";
import { initialSoundWordBank } from "../src/content/initialSounds/initialSoundWordBank.js";
import {
  getEarlySkillRuntimeEligibilityIssues,
  isRuntimeEligibleEarlySkillQuestion
} from "../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import { getQuestionMediaPaths } from "../src/data/mediaQaManifest.js";
import { isFinalSoundsLevel1Question } from "../src/data/earlyPhonicsValidation.js";

const SKILL_LEVELS = {
  initial_sounds: [1, 2],
  final_sounds: [1, 2],
  cvc_short_vowels: [1],
  rhyming: [1, 2],
  short_vowel_discrimination: [1]
};

const FINAL_LEVEL_ONE_FORBIDDEN = /^(?:sh|ch|th|ng|nd|nk|nt|st|sk|ft|lt|ll|ck|ss|ff|zz|mp|rk|lk)$/;
const FINAL_LEVEL_ONE_ALLOWED = new Set(["b", "d", "g", "l", "m", "n", "p", "t"]);

function levelOf(question) {
  const level = Number(question.level || question.difficulty || 1);
  return Number.isFinite(level) && level > 0 ? level : 1;
}

function seededShuffle(items, seed) {
  const out = [...items];
  let state = seed || 1;
  for (let index = out.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [out[index], out[swapIndex]] = [out[swapIndex], out[index]];
  }
  return out;
}

function optionLabels(question = {}) {
  return [
    ...(question.choices || []),
    ...(question.answerOptions || [])
  ].map(option => typeof option === "string" ? option : (option?.label || option?.word || option?.value || option?.answer || ""))
    .map(value => String(value || "").toLowerCase().trim())
    .filter(Boolean);
}

function summarizeRejected(skillId, questions, level) {
  const counts = new Map();
  const examples = [];
  for (const question of questions) {
    if (levelOf(question) !== level && skillId !== "final_sounds") continue;
    const issues = getEarlySkillRuntimeEligibilityIssues(question, {
      skillId,
      level,
      pathExists: publicPathExists
    });
    if (!issues.length) continue;
    issues.forEach(issue => counts.set(issue, (counts.get(issue) || 0) + 1));
    if (examples.length < 12) {
      examples.push({
        id: question.id,
        level: levelOf(question),
        targetWord: question.targetWord || question.answer || "",
        issues
      });
    }
  }
  return { counts, examples };
}

function validateRound(skillId, level, round, label, failures) {
  if (round.length !== 15 && round.length >= 15) {
    failures.push(`${skillId} Level ${level} ${label}: expected 15 questions, got ${round.length}`);
  }
  if (round.length < 15) {
    failures.push(`${skillId} Level ${level} ${label}: only ${round.length}/15 runtime-eligible questions`);
  }

  round.forEach(question => {
    const issues = getEarlySkillRuntimeEligibilityIssues(question, {
      skillId,
      level,
      pathExists: publicPathExists
    });
    if (issues.length) {
      failures.push(`${skillId} Level ${level} ${label}: ${question.id} ineligible: ${issues.join("; ")}`);
    }

    if (skillId === "final_sounds" && level === 1) {
      const target = String(question.coverageTarget || question.targetFinalSound || question.itemKey || question.correctAnswer || question.answer || "").toLowerCase().trim();
      if (!FINAL_LEVEL_ONE_ALLOWED.has(target)) {
        failures.push(`Final Sounds Level 1 ${label}: ${question.id} target "${target}" is not allowed`);
      }
      optionLabels(question).forEach(option => {
        if (option.length !== 1 || FINAL_LEVEL_ONE_FORBIDDEN.test(option) || !FINAL_LEVEL_ONE_ALLOWED.has(option)) {
          failures.push(`Final Sounds Level 1 ${label}: ${question.id} option "${option}" is not allowed`);
        }
      });
    }
  });
}

const report = [];
const failures = [];

report.push("# Early Skill Runtime Eligibility Audit");
report.push("");
report.push(`Generated: ${new Date().toISOString()}`);
report.push("");

for (const [skillId, levels] of Object.entries(SKILL_LEVELS)) {
  const all = skillId === "initial_sounds"
    ? initialSoundWordBank
    : buildRuntimeQuestionsForSkill(skillId);
  const selectable = skillId === "initial_sounds"
    ? initialSoundWordBank.filter(question => isRuntimeEligibleEarlySkillQuestion(question, {
      skillId,
      level: question.level || 1,
      pathExists: publicPathExists
    }))
    : selectableRuntimeQuestionsForSkill(skillId);

  report.push(`## ${skillId}`);
  report.push("");
  report.push(`- Total candidate questions: ${all.length}`);
  report.push(`- Runtime eligible questions: ${selectable.length}`);
  report.push("");

  for (const level of levels) {
    const source = selectable.filter(question => {
      if (skillId === "final_sounds") {
        return level === 1
          ? isFinalSoundsLevel1Question(question) && isRuntimeEligibleEarlySkillQuestion(question, { skillId, level, pathExists: publicPathExists })
          : !isFinalSoundsLevel1Question(question) && isRuntimeEligibleEarlySkillQuestion(question, { skillId, level, pathExists: publicPathExists });
      }
      return levelOf(question) === level && isRuntimeEligibleEarlySkillQuestion(question, { skillId, level, pathExists: publicPathExists });
    });
    const patterns = new Set(source.map(question => inferPatternForSkill(skillId, question)).filter(Boolean));
    const missingImages = source
      .flatMap(question => getQuestionMediaPaths(question).image)
      .filter(item => item && !publicPathExists(item));
    const missingAudio = source
      .flatMap(question => getQuestionMediaPaths(question).audio)
      .filter(item => item && !publicPathExists(item));
    const rejected = summarizeRejected(skillId, all, level);

    report.push(`### Level ${level}`);
    report.push("");
    report.push(`- Accepted count: ${source.length}`);
    report.push(`- Coverage targets: ${patterns.size}`);
    report.push(`- Missing image references among accepted: ${missingImages.length}`);
    report.push(`- Missing audio references among accepted: ${missingAudio.length}`);
    report.push("");
    report.push("| Rejection reason | Count |");
    report.push("|---|---:|");
    [...rejected.counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .forEach(([reason, count]) => report.push(`| ${reason.replace(/\|/g, "\\|")} | ${count} |`));
    if (rejected.counts.size === 0) report.push("| None | 0 |");
    report.push("");

    const freshProof = [];
    const remediationProof = [];
    for (let index = 0; index < 100; index += 1) {
      const freshRound = sampleRound(seededShuffle(source, index + 1), 15);
      const remediationRound = sampleRound(seededShuffle(source, index + 1001), 15);
      validateRound(skillId, level, freshRound, `fresh round ${index + 1}`, failures);
      validateRound(skillId, level, remediationRound, `review round ${index + 1}`, failures);
      if (index === 0) {
        freshProof.push(...freshRound.map(question => `${question.id} (${question.targetWord || question.answer || ""})`));
        remediationProof.push(...remediationRound.map(question => `${question.id} (${question.targetWord || question.answer || ""})`));
      }
    }

    report.push(`- Fresh round proof: ${freshProof.join(", ") || "none"}`);
    report.push(`- Review round proof: ${remediationProof.join(", ") || "none"}`);
    report.push("");
  }
}

writeFile(
  path.join(repoRoot, "docs/validation/early_skill_runtime_eligibility_audit.md"),
  `${report.join("\n")}\n`
);

if (failures.length > 0) {
  console.error(`Early skill runtime eligibility failures: ${failures.length}`);
  failures.slice(0, 50).forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Early skill runtime eligibility passed.");
console.log("Audit written to docs/validation/early_skill_runtime_eligibility_audit.md");
