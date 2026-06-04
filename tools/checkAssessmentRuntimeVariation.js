import path from "node:path";

import {
  createAssessmentSessionMediaUsage,
  getApprovedMediaForTarget,
  getQuestionMediaContentKey,
  inferAssessmentQuestionTargetWord,
  resolveQuestionMediaDynamically,
  validateResolvedQuestionMedia
} from "../src/data/assessmentMediaPicker.js";
import { normalizeAssessmentSkillId } from "../src/data/assessmentMediaRegistry.js";
import { getAssessmentMediaByPath } from "../src/data/assessmentMediaRegistry.js";
import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const PRIORITY_SKILLS = [
  "initial_sounds",
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination",
  "hfw_1_25",
  "hfw_26_50",
  "hfw_51_75",
  "hfw_76_100"
];

const PHASES = [
  { level: 1, phase: 1, key: "L1P1" },
  { level: 1, phase: 2, key: "L1P2" },
  { level: 2, phase: 1, key: "L2P1" },
  { level: 2, phase: 2, key: "L2P2" }
];
const SESSIONS = 10;
const ROUND_SIZE = 15;
const OUT_JSON = path.join(repoRoot, "docs/validation/assessment_runtime_variation_audit.json");
const OUT_MD = path.join(repoRoot, "docs/validation/assessment_runtime_variation_audit.md");

function deterministicHash(value = "") {
  return Array.from(String(value)).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function shuffleDeterministic(items = [], seed = "") {
  return items
    .map((item, index) => ({ item, score: deterministicHash(`${seed}:${index}:${item.id || getQuestionMediaContentKey(item)}`) }))
    .sort((a, b) => a.score - b.score)
    .map(entry => entry.item);
}

function cloneUsage(usage) {
  return createAssessmentSessionMediaUsage({
    imagePaths: [...usage.imagePaths],
    audioPaths: [...usage.audioPaths],
    targetWords: [...usage.targetWords],
    contentKeys: [...usage.contentKeys],
    correctQuestionIds: [...usage.correctQuestionIds]
  });
}

function questionPhase(question = {}) {
  const level = Number(question.level || question.difficulty || 1) >= 2 ? 2 : 1;
  const phase = Number(question.phase || question.assessmentPhase || question.initialSoundRoundPhase || 1) === 2 ? 2 : 1;
  return { level, phase, key: `L${level}P${phase}` };
}

function filterPhase(pool, { level, phase }) {
  const exact = pool.filter(question => {
    const actual = questionPhase(question);
    return actual.level === level && actual.phase === phase;
  });
  return exact.length ? exact : [];
}

function mediaRoleForSkill(skillId) {
  if (skillId.startsWith("hfw_")) return "hfw_scene";
  if (skillId === "rhyming") return "rhyming_target";
  return "generic_word";
}

function getPrimaryImage(question = {}) {
  return getQuestionImagePaths(question)[0] || "";
}

function getPrimaryAudio(question = {}) {
  return getQuestionAudioPaths(question)[0] || "";
}

function scoreResolvedQuestion(question, usage) {
  const image = getPrimaryImage(question);
  const audio = getPrimaryAudio(question);
  const contentKey = getQuestionMediaContentKey(question);
  const target = inferAssessmentQuestionTargetWord(question);
  return (
    (contentKey && usage.contentKeys.has(contentKey) ? 1000 : 0) +
    (image && usage.imagePaths.has(image) ? 120 : 0) +
    (audio && usage.audioPaths.has(audio) ? 80 : 0) +
    (target && usage.targetWords.has(target) ? 12 : 0)
  );
}

function pickRound(pool, context) {
  const selected = [];
  const failures = [];
  const candidates = shuffleDeterministic(pool, `${context.skillId}:${context.sessionIndex}:${context.phase.key}`);

  while (selected.length < ROUND_SIZE && selected.length < candidates.length) {
    let best = null;
    for (const candidate of candidates) {
      if (selected.some(item => item.id === candidate.id)) continue;
      const previewUsage = cloneUsage(context.sessionUsage);
      const resolved = resolveQuestionMediaDynamically(candidate, {
        skillId: context.skillId,
        level: context.phase.level,
        phase: context.phase.phase,
        sessionUsage: previewUsage
      });
      const score = scoreResolvedQuestion(resolved, context.sessionUsage);
      const issues = validateResolvedQuestionMedia(resolved);
      const ranked = { candidate, resolved, score, issues };
      if (!best || ranked.score < best.score || (ranked.score === best.score && String(resolved.id).localeCompare(String(best.resolved.id)) < 0)) {
        best = ranked;
      }
    }
    if (!best) break;
    const resolved = resolveQuestionMediaDynamically(best.candidate, {
      skillId: context.skillId,
      level: context.phase.level,
      phase: context.phase.phase,
      sessionUsage: context.sessionUsage
    });
    const issues = validateResolvedQuestionMedia(resolved);
    if (issues.length) failures.push({ questionId: resolved.id, issues });
    selected.push(resolved);
  }

  return { selected, failures };
}

function countRepeats(values = []) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
}

function topCounts(values = [], limit = 20) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }));
}

function approvedImageAlternativeCount(question, skillId, level, phase) {
  const target = inferAssessmentQuestionTargetWord(question);
  return getApprovedMediaForTarget({
    word: target,
    skillId,
    mediaType: "image",
    role: mediaRoleForSkill(skillId),
    level,
    phase
  }).length;
}

function approvedAudioAlternativeCount(audioPath = "") {
  const record = getAssessmentMediaByPath(audioPath, "audio");
  if (!record?.normalizedWord) return 0;
  return getApprovedMediaForTarget({
    word: record.normalizedWord,
    mediaType: "audio",
    audioType: record.audioType || "whole_word"
  }).length;
}

function auditSkill(skillId) {
  const normalizedSkillId = normalizeAssessmentSkillId(skillId);
  const pool = selectableRuntimeQuestionsForSkill(normalizedSkillId);
  const staticImages = [];
  const staticAudio = [];
  const dynamicImages = [];
  const dynamicAudio = [];
  const dynamicContentKeys = [];
  const phaseResults = [];
  const failures = [];

  for (const question of pool) {
    staticImages.push(getPrimaryImage(question));
    staticAudio.push(getPrimaryAudio(question));
  }

  for (let sessionIndex = 0; sessionIndex < SESSIONS; sessionIndex += 1) {
    const sessionUsage = createAssessmentSessionMediaUsage();
    for (const phase of PHASES) {
      const phasePool = filterPhase(pool, phase);
      if (!phasePool.length) continue;
      const round = pickRound(phasePool, { skillId: normalizedSkillId, phase, sessionIndex, sessionUsage });
      const images = round.selected.map(getPrimaryImage).filter(Boolean);
      const audio = round.selected.map(getPrimaryAudio).filter(Boolean);
      const contentKeys = round.selected.map(getQuestionMediaContentKey).filter(Boolean);
      dynamicImages.push(...images);
      dynamicAudio.push(...audio);
      dynamicContentKeys.push(...contentKeys);

      const repeatedImages = countRepeats(images);
      const repeatedAudio = countRepeats(audio);
      const repeatedContent = countRepeats(contentKeys);
      const contentAlternatives = new Set(phasePool.map(getQuestionMediaContentKey).filter(Boolean)).size;
      const imageRepeatFailures = repeatedImages.filter(repeat => {
        const repeatedQuestion = round.selected.find(question => getPrimaryImage(question) === repeat.value);
        return repeatedQuestion && approvedImageAlternativeCount(repeatedQuestion, normalizedSkillId, phase.level, phase.phase) > 1;
      });
      const audioRepeatFailures = repeatedAudio.filter(repeat => approvedAudioAlternativeCount(repeat.value) > 1);
      const contentRepeatFailures = repeatedContent.filter(() => contentAlternatives >= ROUND_SIZE);

      if (round.selected.length < Math.min(ROUND_SIZE, phasePool.length)) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: `only selected ${round.selected.length}/${Math.min(ROUND_SIZE, phasePool.length)} questions` });
      }
      if (imageRepeatFailures.length) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "repeated image despite alternatives", repeats: imageRepeatFailures });
      }
      if (audioRepeatFailures.length) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "repeated audio despite alternatives", repeats: audioRepeatFailures });
      }
      if (contentRepeatFailures.length) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "repeated content/template key despite alternatives", repeats: contentRepeatFailures });
      }
      for (const failure of round.failures) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "resolved media validation failed", ...failure });
      }

      phaseResults.push({
        sessionIndex,
        phase: phase.key,
        poolSize: phasePool.length,
        selected: round.selected.length,
        uniqueImages: new Set(images).size,
        uniqueAudio: new Set(audio).size,
        uniqueContentKeys: new Set(contentKeys).size,
        repeatedImages,
        repeatedAudio,
        repeatedContent
      });
    }
  }

  const staticTopImages = topCounts(staticImages);
  const dynamicTopImages = topCounts(dynamicImages);
  const staticTopAudio = topCounts(staticAudio);
  const dynamicTopAudio = topCounts(dynamicAudio);
  const staticUniqueImages = new Set(staticImages.filter(Boolean)).size;
  const dynamicUniqueImages = new Set(dynamicImages.filter(Boolean)).size;
  const staticDominantImageCount = staticTopImages[0]?.count || 0;
  const dynamicDominantImageCount = dynamicTopImages[0]?.count || 0;
  if (pool.length >= 100 && dynamicUniqueImages < 40 && staticUniqueImages > dynamicUniqueImages) {
    failures.push({ skillId: normalizedSkillId, reason: "small image subset still dominates simulated rounds", dynamicUniqueImages, staticUniqueImages });
  }

  return {
    skillId: normalizedSkillId,
    selectableQuestions: pool.length,
    static: {
      uniqueImages: staticUniqueImages,
      uniqueAudio: new Set(staticAudio.filter(Boolean)).size,
      topImages: staticTopImages,
      topAudio: staticTopAudio,
      dominantImageCount: staticDominantImageCount
    },
    dynamic: {
      simulatedSessions: SESSIONS,
      simulatedQuestionUses: dynamicContentKeys.length,
      uniqueImages: dynamicUniqueImages,
      uniqueAudio: new Set(dynamicAudio.filter(Boolean)).size,
      uniqueContentKeys: new Set(dynamicContentKeys).size,
      topImages: dynamicTopImages,
      topAudio: dynamicTopAudio,
      dominantImageCount: dynamicDominantImageCount
    },
    improvement: {
      uniqueImagesDelta: dynamicUniqueImages - staticUniqueImages,
      dominantImageRepeatDelta: dynamicDominantImageCount - staticDominantImageCount
    },
    phaseResults,
    failures
  };
}

function buildMarkdown(audit) {
  const lines = [];
  lines.push("# Assessment Runtime Variation Audit");
  lines.push("");
  lines.push(`Generated: ${audit.generatedAt}`);
  lines.push(`Status: ${audit.passed ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Skill Results");
  lines.push("| Skill | Selectable | Static unique images | Dynamic unique images | Top image before | Top image after | Failures |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const skill of audit.skills) {
    lines.push(`| ${skill.skillId} | ${skill.selectableQuestions} | ${skill.static.uniqueImages} | ${skill.dynamic.uniqueImages} | ${skill.static.dominantImageCount} | ${skill.dynamic.dominantImageCount} | ${skill.failures.length} |`);
  }
  lines.push("");
  lines.push("## Failures");
  if (!audit.failures.length) {
    lines.push("- None");
  } else {
    for (const failure of audit.failures.slice(0, 100)) {
      lines.push(`- ${failure.skillId}${failure.phase ? ` ${failure.phase}` : ""}: ${failure.reason}`);
    }
  }
  lines.push("");
  lines.push("## Top Repeated Images Before/After");
  for (const skill of audit.skills) {
    lines.push(`- ${skill.skillId}: before ${skill.static.topImages[0]?.count || 0}x ${skill.static.topImages[0]?.path || "none"}; after ${skill.dynamic.topImages[0]?.count || 0}x ${skill.dynamic.topImages[0]?.path || "none"}`);
  }
  return `${lines.join("\n")}\n`;
}

const skills = PRIORITY_SKILLS.map(auditSkill);
const failures = skills.flatMap(skill => skill.failures);
const audit = {
  generatedAt: new Date().toISOString(),
  passed: failures.length === 0,
  sessionsSimulatedPerSkill: SESSIONS,
  roundSize: ROUND_SIZE,
  skills,
  failures
};

writeFile(OUT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
writeFile(OUT_MD, buildMarkdown(audit));

console.log(`Assessment runtime variation audit written to ${path.relative(repoRoot, OUT_MD)}`);
for (const skill of skills) {
  console.log(`${skill.skillId}: static unique images ${skill.static.uniqueImages}, dynamic unique images ${skill.dynamic.uniqueImages}, failures ${skill.failures.length}`);
}
if (!audit.passed) {
  console.error(`Runtime variation failures: ${failures.length}`);
  process.exitCode = 1;
}
