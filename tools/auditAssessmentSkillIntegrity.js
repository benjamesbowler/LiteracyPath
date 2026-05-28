import fs from "node:fs";
import path from "node:path";

import { managedAssessmentSkillDepthConfig, SKILL_LEVEL_DEPTH_TARGETS } from "../src/data/skillLevelDepthConfig.js";
import {
  finalSoundLevelOneAllowedItemKeys,
  finalSoundLevelOneForbiddenItemKeys,
  finalSoundLevelTwoExpectedItemKeys
} from "../src/data/coverageExpectations.js";
import { getQuestionRoutingFormat } from "../src/data/skillTemplateRouting.js";
import { getQuestionSignature } from "../src/questionRepeatGuards.js";
import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  getQuestionTargetWord,
  loadCoreQuestionPool,
  publicPathExists,
  repoRoot
} from "./phonicsRuntimeUtils.js";
import {
  docsValidationDir,
  ensureDir,
  getDepthLevel,
  getDepthSkillId,
  markdownTable
} from "./skillLevelDepthShared.js";

const PHASE_SIZE = SKILL_LEVEL_DEPTH_TARGETS.phaseSize || 15;
const MINIMUM_PER_LEVEL = SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel || 30;
const EXPECTED_LEVELS = [1, 2];
const EXPECTED_PHASES = [1, 2];

const outputMdPath = path.join(docsValidationDir, "assessment_skill_integrity_audit.md");
const outputJsonPath = path.join(docsValidationDir, "assessment_skill_integrity_audit.json");

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function displayList(values, limit = 16) {
  const clean = [...new Set(values.filter(Boolean).map(String))];
  if (!clean.length) return "-";
  if (clean.length <= limit) return clean.join(", ");
  return `${clean.slice(0, limit).join(", ")} +${clean.length - limit} more`;
}

function getPrompt(question = {}) {
  return question.prompt || question.question || question.text || question.sentence || question.passage || "";
}

function getCorrectAnswers(question = {}) {
  return [
    question.correctAnswer,
    question.answer,
    ...(Array.isArray(question.correctAnswers) ? question.correctAnswers : [])
  ].filter(value => value !== undefined && value !== null && String(value).trim() !== "");
}

function getAnswerChoices(question = {}) {
  const choices = [
    ...asArray(question.answerOptions),
    ...asArray(question.choices),
    ...asArray(question.options),
    ...asArray(question.tiles),
    ...asArray(question.imageCards)
  ];

  return choices
    .map(choice => {
      if (choice && typeof choice === "object") {
        return choice.value || choice.word || choice.label || choice.text || choice.answer || "";
      }
      return choice;
    })
    .filter(value => value !== undefined && value !== null && String(value).trim() !== "");
}

function getExplicitLevel(question = {}) {
  const value = question.level ?? question.assessmentLevel ?? question.depthLevel ?? question.difficultyLevel ?? question.difficulty;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function getPhase(question = {}) {
  const raw = question.phase ?? question.phaseTarget ?? question.assessmentPhase ?? question.levelPhase ?? question.initialSoundRoundPhase ?? "";
  if (raw === 1 || raw === "1") return 1;
  if (raw === 2 || raw === "2") return 2;
  const text = normalize(raw);
  if (/\bphase_?1\b|level_?1_?phase_?1|p1/.test(text)) return 1;
  if (/\bphase_?2\b|level_?1_?phase_?2|p2/.test(text)) return 2;
  return null;
}

function getQuestionId(question = {}) {
  return question.id || question.questionId || "";
}

function getQuestionKey(question = {}) {
  return getQuestionId(question) || getQuestionSignature(question) || `${getDepthSkillId(question) || "unknown"}::${getPrompt(question)}::${getCorrectAnswers(question).join("|")}`;
}

function getItemKey(question = {}) {
  return normalize(
    question.itemKey ||
    question.rimeFamily ||
    question.rhymeFamily ||
    question.targetPattern ||
    question.targetSound ||
    question.finalSound ||
    question.initialSound ||
    question.medialVowel ||
    question.phonicsPattern ||
    getQuestionTargetWord(question) ||
    getCorrectAnswers(question)[0] ||
    getQuestionId(question)
  );
}

function missingMediaPaths(question = {}) {
  const missingImages = getQuestionImagePaths(question)
    .filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  const missingAudio = getQuestionAudioPaths(question)
    .filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  return { missingImages, missingAudio };
}

function getRequiredFieldIssues(question = {}) {
  const issues = [];
  if (!getQuestionId(question)) issues.push("missing question id");
  if (!getPrompt(question)) issues.push("missing prompt");
  if (!getAnswerChoices(question).length) issues.push("missing answer choices");
  if (!getCorrectAnswers(question).length) issues.push("missing correct answer");
  if (!question.skillId && !question.skill && !question.skillName && !question.stage) issues.push("missing skill id");
  if (!getExplicitLevel(question)) issues.push("missing level data");
  if (!getPhase(question)) issues.push("missing phase data");
  const { missingImages, missingAudio } = missingMediaPaths(question);
  if (missingImages.length) issues.push(`missing image path: ${missingImages.slice(0, 3).join(", ")}`);
  if (missingAudio.length) issues.push(`missing audio path: ${missingAudio.slice(0, 3).join(", ")}`);
  return issues;
}

function getQuestionContentIssues(question = {}) {
  return getRequiredFieldIssues(question).filter(issue => issue !== "missing phase data");
}

function dedupeByQuestionKey(questions) {
  const seen = new Set();
  const output = [];
  for (const question of questions) {
    const key = getQuestionKey(question);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(question);
  }
  return output;
}

function countBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

function duplicateIdsFor(questions) {
  const counts = countBy(questions, getQuestionId);
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }));
}

function buildRoundPossible(questions) {
  const uniqueItems = new Set();
  const selected = [];
  for (const question of questions) {
    const itemKey = getItemKey(question) || getQuestionKey(question);
    if (selected.length < PHASE_SIZE && !uniqueItems.has(itemKey)) {
      selected.push(question);
      uniqueItems.add(itemKey);
    }
  }
  if (selected.length >= PHASE_SIZE) return true;
  return questions.length >= PHASE_SIZE;
}

function levelReport(skillQuestions, level) {
  const levelQuestions = skillQuestions.filter(question => getDepthLevel(question) === level);
  const uniqueQuestions = dedupeByQuestionKey(levelQuestions);
  const strictUsable = uniqueQuestions.filter(question => getQuestionContentIssues(question).length === 0);
  const phases = [...new Set(levelQuestions.map(getPhase).filter(Boolean))].sort();
  const phaseCounts = Object.fromEntries(EXPECTED_PHASES.map(phase => [
    phase,
    strictUsable.filter(question => getPhase(question) === phase).length
  ]));
  const missingTo30 = Math.max(0, MINIMUM_PER_LEVEL - strictUsable.length);
  const phaseGeneration = Object.fromEntries(EXPECTED_PHASES.map(phase => {
    const phaseItems = strictUsable.filter(question => getPhase(question) === phase);
    return [phase, phaseItems.length >= PHASE_SIZE && buildRoundPossible(phaseItems)];
  }));

  return {
    level,
    rawQuestionCount: levelQuestions.length,
    uniqueQuestionCount: uniqueQuestions.length,
    strictUsableQuestionCount: strictUsable.length,
    detectedPhases: phases,
    phaseCounts,
    phaseGeneration,
    missingTo30,
    below30: strictUsable.length < MINIMUM_PER_LEVEL,
    canGenerate15QuestionRound: strictUsable.length >= PHASE_SIZE && buildRoundPossible(strictUsable),
    canGeneratePhase1Round: Boolean(phaseGeneration[1]),
    canGeneratePhase2Round: Boolean(phaseGeneration[2]),
    uniqueTargets: [...new Set(strictUsable.map(question => getItemKey(question)).filter(Boolean))].sort(),
    formats: countBy(strictUsable, question => getQuestionRoutingFormat(question) || question.templateType || question.formatType || "UNKNOWN")
  };
}

function summarizeMissingFields(questions) {
  const summary = {
    missingQuestionIds: [],
    missingPrompts: [],
    missingAnswerChoices: [],
    missingCorrectAnswers: [],
    missingSkillIds: [],
    missingLevelData: [],
    missingPhaseData: [],
    missingMedia: []
  };

  for (const question of questions) {
    const id = getQuestionId(question) || `(source:${question._source}#${question._sourceIndex})`;
    if (!getQuestionId(question)) summary.missingQuestionIds.push(id);
    if (!getPrompt(question)) summary.missingPrompts.push(id);
    if (!getAnswerChoices(question).length) summary.missingAnswerChoices.push(id);
    if (!getCorrectAnswers(question).length) summary.missingCorrectAnswers.push(id);
    if (!question.skillId && !question.skill && !question.skillName && !question.stage) summary.missingSkillIds.push(id);
    if (!getExplicitLevel(question)) summary.missingLevelData.push(id);
    if (!getPhase(question)) summary.missingPhaseData.push(id);
    const { missingImages, missingAudio } = missingMediaPaths(question);
    if (missingImages.length || missingAudio.length) {
      summary.missingMedia.push({
        id,
        missingImages,
        missingAudio
      });
    }
  }

  return summary;
}

function progressionConcerns({ levelsDetected, phasesDetected, levels, duplicateIds, missingFields }) {
  const concerns = [];
  if (levelsDetected.length !== 2 || !EXPECTED_LEVELS.every(level => levelsDetected.includes(level))) {
    concerns.push(`Expected levels 1 and 2; detected ${levelsDetected.join(", ") || "none"}.`);
  }
  if (phasesDetected.length !== 2 || !EXPECTED_PHASES.every(phase => phasesDetected.includes(phase))) {
    concerns.push(`Expected phases 1 and 2; detected ${phasesDetected.join(", ") || "none"}.`);
  }
  if (duplicateIds.length) concerns.push(`${duplicateIds.length} duplicate question id group(s).`);
  if (missingFields.missingLevelData.length) concerns.push(`${missingFields.missingLevelData.length} question(s) missing explicit level data.`);
  if (missingFields.missingPhaseData.length) concerns.push(`${missingFields.missingPhaseData.length} question(s) missing explicit phase data.`);
  for (const level of EXPECTED_LEVELS) {
    const report = levels[level];
    if (report.below30) concerns.push(`Level ${level} has ${report.strictUsableQuestionCount}/30 strict usable questions.`);
    if (!report.canGenerate15QuestionRound) concerns.push(`Level ${level} cannot safely generate a 15-question round.`);
    if (!report.canGeneratePhase1Round) concerns.push(`Level ${level} Phase 1 cannot safely generate 15 questions.`);
    if (!report.canGeneratePhase2Round) concerns.push(`Level ${level} Phase 2 cannot safely generate 15 questions.`);
  }
  return concerns;
}

function getFinalSoundTarget(question = {}) {
  return normalize(
    question.targetFinalSound ||
    question.targetSound ||
    question.itemKey ||
    question.phonicsPattern ||
    question.targetPattern ||
    question.correctAnswer ||
    question.answer ||
    ""
  );
}

function getFinalSoundQuestionIssues(skillQuestions = []) {
  const levelOneAllowed = new Set(finalSoundLevelOneAllowedItemKeys);
  const levelOneForbidden = new Set(finalSoundLevelOneForbiddenItemKeys);
  const levelTwoExpected = new Set(finalSoundLevelTwoExpectedItemKeys);
  const ambiguousPairWords = new Set(["bud"]);
  const issues = [];
  const warnings = [];
  const levelOneLeaks = [];
  const textChoiceImageLeaks = [];
  const pairCardCountFailures = [];
  const ambiguousPairCards = [];
  const levelTwoHardTargets = new Set();

  for (const question of skillQuestions) {
    const id = getQuestionId(question) || `(source:${question._source}#${question._sourceIndex})`;
    const format = String(question.formatType || question.templateType || "").toUpperCase();
    const target = getFinalSoundTarget(question);
    const level = getDepthLevel(question);

    if (format === "ENDING_SOUND") {
      const imageOptions = [
        ...asArray(question.answerOptions),
        ...asArray(question.choices),
        ...asArray(question.options)
      ].filter(option => option && typeof option === "object" && (option.image || option.imageUrl || option.imagePath));
      if (imageOptions.length) textChoiceImageLeaks.push(id);
    }

    if (format === "FINAL_SOUND_PAIR_SELECT" || question.questionType === "final_sound_pair") {
      const cards = asArray(question.imageCards);
      if (cards.length !== 4 || !cards.every(card => card.image && card.audio)) {
        pairCardCountFailures.push(`${id} (${cards.length} cards)`);
      }
      const ambiguousCards = cards
        .map(card => normalize(card.word || card.label || card.value || card.targetWord || ""))
        .filter(word => ambiguousPairWords.has(word));
      if (ambiguousCards.length) {
        ambiguousPairCards.push(`${id}: ${ambiguousCards.join(", ")}`);
      }
    }

    const hasExplicitFinalTarget = Boolean(
      question.targetFinalSound ||
      question.targetSound ||
      question.itemKey ||
      question.phonicsPattern ||
      question.targetPattern ||
      format === "ENDING_SOUND"
    );
    if (level === 1 && hasExplicitFinalTarget && (!levelOneAllowed.has(target) || levelOneForbidden.has(target))) {
      levelOneLeaks.push(`${id}:${target || "missing"}`);
    }

    if (level === 2 && levelTwoExpected.has(target)) {
      levelTwoHardTargets.add(target);
    }
  }

  if (textChoiceImageLeaks.length) {
    warnings.push(`Final Sounds ENDING_SOUND questions have image metadata on answer choices, but the student renderer forces text-only tiles: ${displayList(textChoiceImageLeaks, 12)}.`);
  }
  if (pairCardCountFailures.length) {
    issues.push(`Final Sounds pair-selection questions without exactly 4 image/audio cards: ${displayList(pairCardCountFailures, 12)}.`);
  }
  if (ambiguousPairCards.length) {
    issues.push(`Final Sounds pair-selection questions use ambiguous visual targets that should not be active: ${displayList(ambiguousPairCards, 12)}.`);
  }
  if (levelOneLeaks.length) {
    issues.push(`Final Sounds Level 1 contains advanced/non-Level-1 targets: ${displayList(levelOneLeaks, 12)}.`);
  }
  if (levelTwoHardTargets.size === 0) {
    issues.push("Final Sounds Level 2 has no detected harder final patterns from the configured Level 2 expectation list.");
  }

  return {
    issues,
    warnings,
    textChoiceImageLeaks,
    pairCardCountFailures,
    ambiguousPairCards,
    levelOneLeaks,
    levelTwoHardTargets: [...levelTwoHardTargets].sort()
  };
}

function audit() {
  const pool = loadCoreQuestionPool();
  const byConfiguredSkill = managedAssessmentSkillDepthConfig.map((skill, index) => {
    const rawQuestions = pool.filter(question => getDepthSkillId(question) === skill.skillId);
    const uniqueQuestions = dedupeByQuestionKey(rawQuestions);
    const duplicateIds = duplicateIdsFor(rawQuestions);
    const missingFields = summarizeMissingFields(rawQuestions);
    const levelsDetected = [...new Set(rawQuestions.map(getDepthLevel).filter(Boolean))].sort();
    const explicitLevelsDetected = [...new Set(rawQuestions.map(getExplicitLevel).filter(Boolean).map(level => level >= 2 ? 2 : 1))].sort();
    const phasesDetected = [...new Set(rawQuestions.map(getPhase).filter(Boolean))].sort();
    const levels = Object.fromEntries(EXPECTED_LEVELS.map(level => [level, levelReport(rawQuestions, level)]));
    const strictUsableTotal = EXPECTED_LEVELS.reduce((sum, level) => sum + levels[level].strictUsableQuestionCount, 0);
    const finalSoundsSpecial = skill.skillId === "final_sounds"
      ? getFinalSoundQuestionIssues(rawQuestions)
      : null;
    const concerns = progressionConcerns({
      levelsDetected: explicitLevelsDetected,
      phasesDetected,
      levels,
      duplicateIds,
      missingFields
    }).concat(finalSoundsSpecial?.issues || []);

    return {
      skillNumber: index + 1,
      skillId: skill.skillId,
      skillName: skill.skillName,
      totalRawQuestions: rawQuestions.length,
      totalUniqueQuestions: uniqueQuestions.length,
      totalStrictUsableQuestions: strictUsableTotal,
      uniqueLevel1Questions: levels[1].strictUsableQuestionCount,
      uniqueLevel2Questions: levels[2].strictUsableQuestionCount,
      phasesDetected,
      phaseCount: phasesDetected.length,
      levelsDetected: explicitLevelsDetected,
      levelCount: explicitLevelsDetected.length,
      hasExactly2Phases: phasesDetected.length === 2 && EXPECTED_PHASES.every(phase => phasesDetected.includes(phase)),
      hasExactly2Levels: explicitLevelsDetected.length === 2 && EXPECTED_LEVELS.every(level => explicitLevelsDetected.includes(level)),
      duplicateQuestionIds: duplicateIds,
      missingFields,
      finalSoundsSpecial,
      levels,
      runtimeSelectionRisk: [
        !levels[1].canGenerate15QuestionRound ? "Level 1 cannot safely generate 15 questions." : "",
        !levels[2].canGenerate15QuestionRound ? "Level 2 cannot safely generate 15 questions." : "",
        !levels[1].canGeneratePhase1Round ? "Level 1 Phase 1 cannot safely generate 15 questions." : "",
        !levels[1].canGeneratePhase2Round ? "Level 1 Phase 2 cannot safely generate 15 questions." : "",
        !levels[2].canGeneratePhase1Round ? "Level 2 Phase 1 cannot safely generate 15 questions." : "",
        !levels[2].canGeneratePhase2Round ? "Level 2 Phase 2 cannot safely generate 15 questions." : ""
      ].filter(Boolean),
      brokenProgressionMetadata: concerns,
      productionReady: concerns.length === 0 &&
        strictUsableTotal >= MINIMUM_PER_LEVEL * 2 &&
        levels[1].uniqueTargets.length >= PHASE_SIZE &&
        levels[2].uniqueTargets.length >= PHASE_SIZE
    };
  });

  const unassigned = pool
    .filter(question => !getDepthSkillId(question))
    .map(question => ({
      id: getQuestionId(question) || `(source:${question._source}#${question._sourceIndex})`,
      source: question._source,
      skillId: question.skillId || "",
      skillName: question.skillName || question.skill || question.stage || "",
      prompt: getPrompt(question)
    }));

  return {
    generatedAt: new Date().toISOString(),
    source: "loadCoreQuestionPool() plus managedAssessmentSkillDepthConfig",
    targetContract: {
      levelsPerSkill: 2,
      phasesPerSkill: 2,
      questionsPerRound: PHASE_SIZE,
      minimumUniqueUsableQuestionsPerLevel: MINIMUM_PER_LEVEL
    },
    summary: {
      skillsAudited: byConfiguredSkill.length,
      productionReadySkills: byConfiguredSkill.filter(skill => skill.productionReady).length,
      failingPhaseCount: byConfiguredSkill.filter(skill => !skill.hasExactly2Phases).length,
      failingLevelCount: byConfiguredSkill.filter(skill => !skill.hasExactly2Levels).length,
      belowLevel1Depth: byConfiguredSkill.filter(skill => skill.levels[1].below30).length,
      belowLevel2Depth: byConfiguredSkill.filter(skill => skill.levels[2].below30).length,
      unableToGenerate15QuestionRound: byConfiguredSkill.filter(skill => skill.runtimeSelectionRisk.length > 0).length,
      duplicateIdGroups: byConfiguredSkill.reduce((sum, skill) => sum + skill.duplicateQuestionIds.length, 0),
      missingQuestionIds: byConfiguredSkill.reduce((sum, skill) => sum + skill.missingFields.missingQuestionIds.length, 0),
      missingPrompts: byConfiguredSkill.reduce((sum, skill) => sum + skill.missingFields.missingPrompts.length, 0),
      missingAnswerChoices: byConfiguredSkill.reduce((sum, skill) => sum + skill.missingFields.missingAnswerChoices.length, 0),
      missingCorrectAnswers: byConfiguredSkill.reduce((sum, skill) => sum + skill.missingFields.missingCorrectAnswers.length, 0),
      missingSkillIds: byConfiguredSkill.reduce((sum, skill) => sum + skill.missingFields.missingSkillIds.length, 0),
      missingLevelData: byConfiguredSkill.reduce((sum, skill) => sum + skill.missingFields.missingLevelData.length, 0),
      missingPhaseData: byConfiguredSkill.reduce((sum, skill) => sum + skill.missingFields.missingPhaseData.length, 0),
      unassignedQuestions: unassigned.length
    },
    skills: byConfiguredSkill,
    unassignedQuestions: unassigned
  };
}

function renderSkillRow(skill) {
  return [
    skill.skillNumber,
    skill.skillName,
    skill.skillId,
    skill.totalUniqueQuestions,
    skill.uniqueLevel1Questions,
    skill.uniqueLevel2Questions,
    skill.phaseCount,
    skill.levelCount,
    skill.hasExactly2Phases ? "yes" : "no",
    skill.hasExactly2Levels ? "yes" : "no",
    skill.levels[1].missingTo30,
    skill.levels[2].missingTo30,
    skill.runtimeSelectionRisk.length ? "risk" : "ok",
    skill.productionReady ? "pass" : "blocker"
  ];
}

function renderMarkdown(report) {
  const skills = report.skills;
  const redFlags = skills.filter(skill => !skill.productionReady);
  const passing = skills.filter(skill => skill.productionReady);
  const failingPhase = skills.filter(skill => !skill.hasExactly2Phases);
  const failingLevel = skills.filter(skill => !skill.hasExactly2Levels);
  const below30 = skills.filter(skill => skill.levels[1].below30 || skill.levels[2].below30);
  const roundRisk = skills.filter(skill => skill.runtimeSelectionRisk.length);
  const duplicateSkills = skills.filter(skill => skill.duplicateQuestionIds.length);
  const missingRequired = skills.filter(skill =>
    Object.values(skill.missingFields).some(value => Array.isArray(value) && value.length)
  );

  const detailSections = redFlags.map(skill => [
    `### ${skill.skillNumber}. ${skill.skillName}`,
    "",
    `- Skill id: \`${skill.skillId}\``,
    `- Unique strict usable questions: ${skill.totalStrictUsableQuestions}`,
    `- Level 1: ${skill.levels[1].strictUsableQuestionCount}/30; phases ${displayList(skill.levels[1].detectedPhases)}; targets ${skill.levels[1].uniqueTargets.length}`,
    `- Level 2: ${skill.levels[2].strictUsableQuestionCount}/30; phases ${displayList(skill.levels[2].detectedPhases)}; targets ${skill.levels[2].uniqueTargets.length}`,
    `- Duplicate IDs: ${skill.duplicateQuestionIds.length ? skill.duplicateQuestionIds.map(item => `${item.id} (${item.count})`).join(", ") : "none"}`,
    `- Missing required fields: question ids ${skill.missingFields.missingQuestionIds.length}; prompts ${skill.missingFields.missingPrompts.length}; choices ${skill.missingFields.missingAnswerChoices.length}; correct answers ${skill.missingFields.missingCorrectAnswers.length}; skill ids ${skill.missingFields.missingSkillIds.length}; levels ${skill.missingFields.missingLevelData.length}; phases ${skill.missingFields.missingPhaseData.length}`,
    `- Runtime risks: ${skill.runtimeSelectionRisk.length ? skill.runtimeSelectionRisk.join(" ") : "none"}`,
    `- Progression concerns: ${skill.brokenProgressionMetadata.length ? skill.brokenProgressionMetadata.join(" ") : "none"}`,
    ""
  ].join("\n"));

  return [
    "# Assessment Skill Integrity Audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Strict contract: every assessment skill should have exactly 2 levels, exactly 2 phases, 15 safe questions per phase, and at least 30 unique usable questions per level. This is audit-only and does not modify question content.",
    "",
    "## Top-Level Summary",
    "",
    markdownTable([
      "Metric",
      "Count"
    ], Object.entries(report.summary).map(([key, value]) => [key, value])),
    "",
    "## Summary By Skill",
    "",
    markdownTable([
      "#",
      "Skill",
      "Skill ID",
      "Unique total",
      "L1 usable",
      "L2 usable",
      "Phases",
      "Levels",
      "2 phases",
      "2 levels",
      "L1 missing",
      "L2 missing",
      "Round risk",
      "Status"
    ], skills.map(renderSkillRow)),
    "",
    "## Red Flags",
    "",
    redFlags.length ? redFlags.map(skill => `- ${skill.skillName}: ${skill.brokenProgressionMetadata[0] || "strict production contract not met"}`).join("\n") : "_None._",
    "",
    "## Skills Passing All Checks",
    "",
    passing.length ? passing.map(skill => `- ${skill.skillName}`).join("\n") : "_None._",
    "",
    "## Skills Failing Phase Count",
    "",
    failingPhase.length ? failingPhase.map(skill => `- ${skill.skillName}: detected ${displayList(skill.phasesDetected)}`).join("\n") : "_None._",
    "",
    "## Skills Failing Level Count",
    "",
    failingLevel.length ? failingLevel.map(skill => `- ${skill.skillName}: detected ${displayList(skill.levelsDetected)}`).join("\n") : "_None._",
    "",
    "## Skills Below 30 Unique Usable Questions For Either Level",
    "",
    below30.length ? below30.map(skill => `- ${skill.skillName}: Level 1 ${skill.levels[1].strictUsableQuestionCount}/30, Level 2 ${skill.levels[2].strictUsableQuestionCount}/30`).join("\n") : "_None._",
    "",
    "## Skills Unable To Safely Generate 15-Question Rounds",
    "",
    roundRisk.length ? roundRisk.map(skill => `- ${skill.skillName}: ${skill.runtimeSelectionRisk.join(" ")}`).join("\n") : "_None._",
    "",
    "## Duplicate IDs",
    "",
    duplicateSkills.length ? duplicateSkills.map(skill => `- ${skill.skillName}: ${skill.duplicateQuestionIds.map(item => `${item.id} (${item.count})`).join(", ")}`).join("\n") : "_None._",
    "",
    "## Missing Required Fields",
    "",
    missingRequired.length ? missingRequired.map(skill => `- ${skill.skillName}: ids ${skill.missingFields.missingQuestionIds.length}, prompts ${skill.missingFields.missingPrompts.length}, choices ${skill.missingFields.missingAnswerChoices.length}, correct ${skill.missingFields.missingCorrectAnswers.length}, skill ids ${skill.missingFields.missingSkillIds.length}, levels ${skill.missingFields.missingLevelData.length}, phases ${skill.missingFields.missingPhaseData.length}`).join("\n") : "_None._",
    "",
    "## Progression Logic Concerns",
    "",
    redFlags.length ? detailSections.join("\n") : "_None._",
    "",
    "## Unassigned Questions",
    "",
    report.unassignedQuestions.length ? markdownTable(["ID", "Source", "Skill Label", "Prompt"], report.unassignedQuestions.slice(0, 100).map(item => [item.id, item.source, item.skillName, item.prompt])) : "_None._"
  ].join("\n");
}

function printTerminalTable(report) {
  console.log("\nAssessment Skill Integrity Audit");
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Skills audited: ${report.summary.skillsAudited}`);
  console.log(`Production-ready skills: ${report.summary.productionReadySkills}/${report.summary.skillsAudited}`);
  console.log("");
  console.table(report.skills.map(skill => ({
    "#": skill.skillNumber,
    skill: skill.skillName,
    id: skill.skillId,
    unique: skill.totalUniqueQuestions,
    L1: skill.uniqueLevel1Questions,
    L2: skill.uniqueLevel2Questions,
    phases: skill.phaseCount,
    levels: skill.levelCount,
    twoPhases: skill.hasExactly2Phases,
    twoLevels: skill.hasExactly2Levels,
    L1Missing: skill.levels[1].missingTo30,
    L2Missing: skill.levels[2].missingTo30,
    status: skill.productionReady ? "PASS" : "BLOCKER"
  })));
}

const report = audit();
ensureDir(docsValidationDir);
fs.writeFileSync(outputJsonPath, JSON.stringify(report, null, 2));
fs.writeFileSync(outputMdPath, renderMarkdown(report));
printTerminalTable(report);
console.log(`\nWrote ${path.relative(repoRoot, outputMdPath)}`);
console.log(`Wrote ${path.relative(repoRoot, outputJsonPath)}`);
