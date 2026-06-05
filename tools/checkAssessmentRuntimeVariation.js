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
  "hfw_76_100",
  "nouns",
  "verbs",
  "adjectives",
  "prepositions",
  "plurals",
  "antonyms_synonyms",
  "homophones_homonyms"
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
    templateKeys: [...usage.templateKeys],
    promptKeys: [...usage.promptKeys],
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
  if (skillId === "nouns") return "noun_image";
  if (skillId === "verbs") return "verb_action";
  if (skillId === "adjectives") return "adjective_visual";
  if (skillId === "prepositions") return "preposition_scene";
  if (skillId === "plurals") return "plural_pair";
  if (skillId === "antonyms_synonyms") return "antonym_synonym_scene";
  if (skillId === "homophones_homonyms") return "homophone_context";
  return "generic_word";
}

function getPrimaryImage(question = {}) {
  return getQuestionImagePaths(question)[0] || "";
}

function getPrimaryAudio(question = {}) {
  return getQuestionAudioPaths(question)[0] || "";
}

function getTemplateKey(question = {}) {
  return String(question.templateType || question.formatType || question.questionType || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .trim();
}

function getPromptKey(question = {}) {
  return String(question.prompt || question.question || question.sentence || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function markResolvedUsed(usage, question = {}) {
  const image = getPrimaryImage(question);
  const audio = getPrimaryAudio(question);
  const target = inferAssessmentQuestionTargetWord(question);
  const contentKey = getQuestionMediaContentKey(question);
  const template = getTemplateKey(question);
  const prompt = getPromptKey(question);
  if (image) usage.imagePaths.add(image);
  if (audio) usage.audioPaths.add(audio);
  if (target) usage.targetWords.add(target);
  if (contentKey) usage.contentKeys.add(contentKey);
  if (template) usage.templateKeys.add(template);
  if (prompt) usage.promptKeys.add(prompt);
}

function scoreResolvedQuestion(question, usage) {
  const image = getPrimaryImage(question);
  const audio = getPrimaryAudio(question);
  const contentKey = getQuestionMediaContentKey(question);
  const target = inferAssessmentQuestionTargetWord(question);
  const template = getTemplateKey(question);
  const prompt = getPromptKey(question);
  return (
    (contentKey && usage.contentKeys.has(contentKey) ? 1000 : 0) +
    (image && usage.imagePaths.has(image) ? 120 : 0) +
    (audio && usage.audioPaths.has(audio) ? 80 : 0) +
    (template && usage.templateKeys?.has(template) ? 60 : 0) +
    (prompt && usage.promptKeys?.has(prompt) ? 45 : 0) +
    (target && usage.targetWords.has(target) ? 700 : 0)
  );
}

function scoreRoundRepeat(question, roundUsage) {
  const target = inferAssessmentQuestionTargetWord(question);
  const template = getTemplateKey(question);
  const prompt = getPromptKey(question);
  return (
    (target && roundUsage.targetWords.has(target) ? 5000 : 0) +
    (template && roundUsage.templateKeys.has(template) ? 450 : 0) +
    (prompt && roundUsage.promptKeys.has(prompt) ? 350 : 0)
  );
}

function pickRound(pool, context) {
  const selected = [];
  const failures = [];
  const roundUsage = createAssessmentSessionMediaUsage();
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
      const score = scoreResolvedQuestion(resolved, context.sessionUsage) + scoreRoundRepeat(resolved, roundUsage);
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
    markResolvedUsed(context.sessionUsage, resolved);
    markResolvedUsed(roundUsage, resolved);
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
      const repeatedTargets = countRepeats(round.selected.map(inferAssessmentQuestionTargetWord));
      const repeatedTemplates = countRepeats(round.selected.map(getTemplateKey));
      const repeatedPrompts = countRepeats(round.selected.map(getPromptKey));
      const contentAlternatives = new Set(phasePool.map(getQuestionMediaContentKey).filter(Boolean)).size;
      const targetAlternatives = new Set(phasePool.map(inferAssessmentQuestionTargetWord).filter(Boolean)).size;
      const templateAlternatives = new Set(phasePool.map(getTemplateKey).filter(Boolean)).size;
      const promptAlternatives = new Set(phasePool.map(getPromptKey).filter(Boolean)).size;
      const imageRepeatFailures = repeatedImages.filter(repeat => {
        const repeatedQuestion = round.selected.find(question => getPrimaryImage(question) === repeat.value);
        return repeatedQuestion && approvedImageAlternativeCount(repeatedQuestion, normalizedSkillId, phase.level, phase.phase) > 1;
      });
      const audioRepeatFailures = repeatedAudio.filter(repeat => approvedAudioAlternativeCount(repeat.value) > 1);
      const contentRepeatFailures = repeatedContent.filter(() => contentAlternatives >= ROUND_SIZE);
      const targetRepeatFailures = repeatedTargets.filter(() => targetAlternatives >= ROUND_SIZE);
      const templateRepeatFailures = repeatedTemplates.filter(() => templateAlternatives >= Math.min(4, ROUND_SIZE));
      const promptRepeatFailures = repeatedPrompts.filter(() => promptAlternatives >= ROUND_SIZE);
      const missingImageFailures = round.selected.filter(question => {
        const image = getPrimaryImage(question);
        if (!image) return ["nouns", "verbs", "adjectives", "prepositions", "plurals", "antonyms_synonyms", "homophones_homonyms"].includes(normalizedSkillId);
        const record = getAssessmentMediaByPath(image, "image");
        return Boolean(record && !record.available);
      });
      const badAudioFailures = round.selected.filter(question => {
        const audioPath = getPrimaryAudio(question);
        if (!audioPath) return false;
        const record = getAssessmentMediaByPath(audioPath, "audio");
        return Boolean(record && (!record.available || (record.audioType && record.audioType !== "whole_word" && !normalizedSkillId.startsWith("hfw_"))));
      });

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
      if (targetRepeatFailures.length) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "repeated target despite alternatives", repeats: targetRepeatFailures });
      }
      if (templateRepeatFailures.length) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "repeated template despite alternatives", repeats: templateRepeatFailures });
      }
      if (promptRepeatFailures.length) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "repeated prompt despite alternatives", repeats: promptRepeatFailures });
      }
      if (missingImageFailures.length) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "missing or blocked image media", questionIds: missingImageFailures.map(question => question.id).slice(0, 20) });
      }
      if (badAudioFailures.length) {
        failures.push({ skillId: normalizedSkillId, sessionIndex, phase: phase.key, reason: "blocked or non-word audio media", questionIds: badAudioFailures.map(question => question.id).slice(0, 20) });
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
        repeatedContent,
        repeatedTargets,
        repeatedTemplates,
        repeatedPrompts
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
