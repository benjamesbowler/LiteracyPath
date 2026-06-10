import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { skillWordBank } from "../src/data/generated/skillWordBank.generated.js";
import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { languageSkillQuestions } from "../src/data/generated/languageSkillQuestions.generated.js";
import {
  findAssessmentMediaCandidates,
  normalizeAssessmentMediaWord
} from "../src/data/assessmentMediaRegistry.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionImagePaths,
  questionFilterReason,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const OUT_JSON = path.join(repoRoot, "docs/validation/workbook_media_priority_audit.json");
const OUT_MD = path.join(repoRoot, "docs/validation/workbook_media_priority_audit.md");
const HFW_SKILLS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];
const LANGUAGE_SKILLS = [
  "nouns",
  "verbs",
  "adjectives",
  "prepositions",
  "plurals",
  "prefixes_suffixes",
  "antonyms_synonyms",
  "homophones_homonyms"
];
const VISUAL_ADJECTIVES = new Set([
  "big", "small", "wet", "dry", "hot", "cold", "soft", "hard", "fast", "slow", "loud", "quiet",
  "red", "blue", "green", "yellow", "black", "white", "brown", "orange", "round", "square", "long",
  "short", "tall", "tiny", "huge", "clean", "dirty", "full", "empty", "light", "heavy", "bright", "dark"
]);
const COMMON_PREPOSITIONS = new Set([
  "in", "on", "under", "over", "beside", "behind", "between", "near", "above", "below", "around",
  "through", "across", "inside", "outside", "next to", "in front of", "behind"
]);
const ABSTRACT_OR_LOW_VALUE = /\b(?:ability|belief|concept|decision|development|energy|evidence|experience|government|history|information|knowledge|memory|minute|number|problem|reason|system|thought|truth|understanding)\b/i;
const INAPPROPRIATE = /\b(?:beer|wine|gun|rifle|kill|dead|death|blood|drug|sexy)\b/i;

function normalizeSkillId(value = "") {
  const text = String(value || "").toLowerCase();
  if (text === "prepositions_of_place") return "prepositions";
  if (text === "prefix_suffix") return "prefixes_suffixes";
  if (text === "homophones") return "homophones_homonyms";
  return text;
}

function slug(value = "") {
  return normalizeAssessmentMediaWord(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function mediaCounts({ word, skillId, role = "target_object" }) {
  const image = findAssessmentMediaCandidates({ word, skillId, mediaType: "image", role, includeGenericFallback: true });
  const audio = findAssessmentMediaCandidates({ word, skillId, mediaType: "audio", includeGenericFallback: true });
  return {
    existingImageCount: image.length,
    existingAudioCount: audio.length,
    existingApprovedMedia: [...image.slice(0, 3), ...audio.slice(0, 3)].map(item => item.path)
  };
}

function addItem(items, raw) {
  const key = [raw.priority, raw.skillId, raw.targetWord || raw.pair || raw.contextKey, raw.itemType, raw.reason].join("::");
  if (items.some(item => item._key === key)) return;
  items.push({ _key: key, ...raw });
}

function phaseCountsFor(skillId) {
  const selectable = selectableRuntimeQuestionsForSkill(skillId);
  const out = { L1P1: 0, L1P2: 0, L2P1: 0, L2P2: 0 };
  for (const question of selectable) {
    const level = Number(question.level || question.difficulty || 1) >= 2 ? 2 : 1;
    const phase = Number(question.phase || question.assessmentPhase || 1) === 2 ? 2 : 1;
    out[`L${level}P${phase}`] += 1;
  }
  return out;
}

function priorityForWord({ skillId, word, itemType, imageCount, audioCount, partOfSpeech = "", phaseGap = false, runtimeGap = false }) {
  if (!word || INAPPROPRIATE.test(word)) return { priority: "P4", reason: "Do not request now: inappropriate or unsafe for K-5 assessment." };
  if (ABSTRACT_OR_LOW_VALUE.test(word) && !["prefixes_suffixes", "homophones_homonyms", "antonyms_synonyms"].includes(skillId)) {
    return { priority: "P4", reason: "Do not request now: abstract/low-imageability; use sentence-only if needed." };
  }
  if (skillId.startsWith("hfw_") && runtimeGap) {
    return { priority: "P1", reason: "HFW contract/runtime variation is blocked by too few unique approved context images." };
  }
  if (["verbs", "adjectives", "nouns"].includes(skillId) && runtimeGap && (imageCount === 0 || audioCount === 0)) {
    return { priority: "P1", reason: "Active grammar runtime gap: strict grammar variants need approved image and choice audio." };
  }
  if (skillId === "prepositions" && imageCount === 0 && COMMON_PREPOSITIONS.has(word)) {
    return { priority: "P1", reason: "Common spatial preposition needs real scene images, not word art." };
  }
  if (skillId === "plurals" && imageCount === 0 && runtimeGap) {
    return { priority: "P1", reason: "Active plural expansion needs imageable singular/plural contrast media." };
  }
  if (["antonyms_synonyms", "homophones_homonyms"].includes(skillId) && phaseGap && imageCount === 0) {
    return { priority: "P1", reason: "Active language-pair phase gap would benefit from disambiguating image/context media." };
  }
  if (imageCount === 0 || audioCount === 0) {
    if (partOfSpeech === "adjective" && !VISUAL_ADJECTIVES.has(word)) return { priority: "P3", reason: "Useful later, but adjective is less visually reliable." };
    return { priority: "P2", reason: "Common workbook term useful for near-term skill expansion." };
  }
  return { priority: "P3", reason: "Already has some approved media; only extra variants would be useful later." };
}

function promptTypeFor({ skillId, itemType }) {
  if (skillId.startsWith("hfw_")) return "hfw_context_scene_variants";
  if (skillId === "prepositions") return "preposition_spatial_scene";
  if (skillId === "verbs") return "action_verb_image_and_word_audio";
  if (skillId === "adjectives") return "visual_adjective_image_and_word_audio";
  if (skillId === "nouns") return "concrete_noun_image_and_word_audio";
  if (skillId === "plurals") return "singular_plural_contrast_image";
  if (skillId === "antonyms_synonyms") return "visual_word_pair_or_sentence_context";
  if (skillId === "homophones_homonyms") return "homophone_context_scene";
  if (itemType?.includes("suffix") || itemType?.includes("prefix")) return "morphology_word_audio_optional_image";
  return "word_image_audio";
}

function generatedLanguageRuntimeGapIds() {
  const gaps = new Set();
  for (const question of languageSkillQuestions) {
    const skillId = normalizeSkillId(question.skillId);
    const reason = questionFilterReason(question);
    if (reason) gaps.add(`${skillId}:${normalizeAssessmentMediaWord(question.targetWord || question.answer || question.correctAnswer)}`);
  }
  return gaps;
}

function hfwPriorityItems(items) {
  const byWord = new Map();
  for (const question of hfwAssessmentQuestions) {
    const skillId = normalizeSkillId(question.skillId);
    const targetWord = normalizeAssessmentMediaWord(question.targetWord);
    const key = `${skillId}:${targetWord}`;
    const row = byWord.get(key) || { skillId, targetWord, questions: 0, images: new Set() };
    row.questions += 1;
    getQuestionImagePaths(question).forEach(image => row.images.add(image));
    byWord.set(key, row);
  }
  for (const row of byWord.values()) {
    const counts = mediaCounts({ word: row.targetWord, skillId: row.skillId, role: "hfw_scene" });
    const needsImages = row.questions > row.images.size || row.images.size < Math.min(row.questions, 20);
    if (!needsImages) continue;
    const missingVariantBuffer = Math.max(0, Math.min(row.questions, 20) - row.images.size);
    const { priority, reason } = priorityForWord({
      skillId: row.skillId,
      word: row.targetWord,
      itemType: "hfw_context_scene",
      imageCount: row.images.size,
      audioCount: counts.existingAudioCount,
      runtimeGap: true
    });
    addItem(items, {
      skillId: row.skillId,
      targetWord: row.targetWord,
      pair: "",
      itemType: "hfw_context_scene",
      imageNeeded: true,
      audioNeeded: false,
      priority,
      reason: `${reason} Current generated questions: ${row.questions}; unique images used: ${row.images.size}; suggested extra image variants: ${missingVariantBuffer}.`,
      existingImageCount: row.images.size,
      existingAudioCount: counts.existingAudioCount,
      existingApprovedMedia: counts.existingApprovedMedia,
      suggestedKimiPromptType: promptTypeFor({ skillId: row.skillId }),
      notes: "Request distinct sentence/context scenes matching existing workbook HFW sentences. Do not request word-art."
    });
  }
}

function languagePriorityItems(items) {
  const runtimeGapIds = generatedLanguageRuntimeGapIds();
  const phaseCounts = Object.fromEntries(LANGUAGE_SKILLS.map(skill => [skill, phaseCountsFor(skill)]));
  const phaseGapSkills = new Set(Object.entries(phaseCounts)
    .filter(([, counts]) => Object.values(counts).some(count => count < 15))
    .map(([skill]) => skill));

  const posRecords = (skillWordBank.partsOfSpeech || []).map(record => ({
    skillId: normalizeSkillId(record.skillId),
    targetWord: record.targetWord,
    itemType: record.partOfSpeech || "word",
    partOfSpeech: record.partOfSpeech || ""
  }));
  const prepositionRecords = (skillWordBank.prepositionQuestions || []).map(record => ({ skillId: "prepositions", targetWord: record.targetWord, itemType: "preposition_scene" }));
  const pluralRecords = (skillWordBank.pluralPairs || []).flatMap(record => [
    { skillId: "plurals", targetWord: record.targetWord, pair: `${record.targetWord}/${record.pairedWord}`, itemType: "plural_pair" },
    { skillId: "plurals", targetWord: record.pairedWord, pair: `${record.targetWord}/${record.pairedWord}`, itemType: "plural_pair" }
  ]);
  const prefixSuffixRecords = [...(skillWordBank.prefixWords || []), ...(skillWordBank.suffixWords || [])]
    .map(record => ({ skillId: "prefixes_suffixes", targetWord: record.targetWord, itemType: record.skillName?.toLowerCase().includes("suffix") ? "suffix_word" : "prefix_word" }));
  const pairRecords = (skillWordBank.antonymSynonymPairs || []).flatMap(record => [
    { skillId: "antonyms_synonyms", targetWord: record.targetWord, pair: `${record.targetWord}/${record.pairedWord}`, itemType: record.pattern || "word_pair" },
    { skillId: "antonyms_synonyms", targetWord: record.pairedWord, pair: `${record.targetWord}/${record.pairedWord}`, itemType: record.pattern || "word_pair" }
  ]);
  const homophoneRecords = (skillWordBank.homophoneHomonymSets || []).flatMap(record => (record.words || []).map(word => ({
    skillId: "homophones_homonyms",
    targetWord: word,
    pair: record.words.join("/"),
    itemType: "homophone_context"
  })));

  const all = [...posRecords, ...prepositionRecords, ...pluralRecords, ...prefixSuffixRecords, ...pairRecords, ...homophoneRecords];
  for (const record of all) {
    const word = normalizeAssessmentMediaWord(record.targetWord);
    if (!word) continue;
    const skillId = normalizeSkillId(record.skillId);
    const role = skillId === "prepositions" ? "preposition_scene" : "target_object";
    const counts = mediaCounts({ word, skillId, role });
    const runtimeGap = runtimeGapIds.has(`${skillId}:${word}`) || phaseGapSkills.has(skillId);
    const { priority, reason } = priorityForWord({
      skillId,
      word,
      itemType: record.itemType,
      imageCount: counts.existingImageCount,
      audioCount: counts.existingAudioCount,
      partOfSpeech: record.partOfSpeech,
      phaseGap: phaseGapSkills.has(skillId),
      runtimeGap
    });
    const imageNeeded = counts.existingImageCount === 0 || (skillId === "prepositions" && priority === "P1");
    const audioNeeded = ["nouns", "verbs", "adjectives"].includes(skillId) && counts.existingAudioCount === 0;
    if (priority === "P3" && !imageNeeded && !audioNeeded) continue;
    addItem(items, {
      skillId,
      targetWord: word,
      pair: record.pair || "",
      itemType: record.itemType,
      imageNeeded,
      audioNeeded,
      priority,
      reason,
      existingImageCount: counts.existingImageCount,
      existingAudioCount: counts.existingAudioCount,
      existingApprovedMedia: counts.existingApprovedMedia,
      suggestedKimiPromptType: promptTypeFor({ skillId, itemType: record.itemType }),
      notes: phaseGapSkills.has(skillId) ? `Phase gap remains: ${JSON.stringify(phaseCounts[skillId])}` : ""
    });
  }
}

function buildAudit() {
  const items = [];
  hfwPriorityItems(items);
  languagePriorityItems(items);
  const cleanItems = items.map(({ _key, ...item }) => item)
    .sort((a, b) => a.priority.localeCompare(b.priority) || a.skillId.localeCompare(b.skillId) || String(a.targetWord).localeCompare(String(b.targetWord)));
  const countsByPriority = cleanItems.reduce((counts, item) => {
    counts[item.priority] = (counts[item.priority] || 0) + 1;
    return counts;
  }, { P1: 0, P2: 0, P3: 0, P4: 0 });
  const countsBySkill = cleanItems.reduce((counts, item) => {
    counts[item.skillId] = (counts[item.skillId] || 0) + 1;
    return counts;
  }, {});
  return {
    generatedAt: new Date().toISOString(),
    sourceWorkbook: skillWordBank.sourceWorkbook,
    countsByPriority,
    countsBySkill,
    p1Summary: cleanItems.filter(item => item.priority === "P1").reduce((counts, item) => {
      counts[item.skillId] = (counts[item.skillId] || 0) + 1;
      return counts;
    }, {}),
    items: cleanItems
  };
}

function markdown(audit) {
  const lines = [];
  lines.push("# Workbook Media Priority Audit", "");
  lines.push(`Source: \`${audit.sourceWorkbook}\``);
  lines.push(`Generated: ${audit.generatedAt}`, "");
  lines.push("## Priority Counts", "");
  lines.push("| Priority | Count |", "|---|---:|");
  for (const priority of ["P1", "P2", "P3", "P4"]) lines.push(`| ${priority} | ${audit.countsByPriority[priority] || 0} |`);
  lines.push("", "## Counts By Skill", "", "| Skill | Count |", "|---|---:|");
  for (const [skillId, count] of Object.entries(audit.countsBySkill).sort()) lines.push(`| ${skillId} | ${count} |`);
  lines.push("", "## P1 Items", "", "| Skill | Target/Pair | Type | Image | Audio | Existing Images | Existing Audio | Reason |", "|---|---|---|---:|---:|---:|---:|---|");
  for (const item of audit.items.filter(item => item.priority === "P1").slice(0, 250)) {
    lines.push(`| ${item.skillId} | ${item.pair || item.targetWord} | ${item.itemType} | ${item.imageNeeded ? "yes" : "no"} | ${item.audioNeeded ? "yes" : "no"} | ${item.existingImageCount} | ${item.existingAudioCount} | ${item.reason.replace(/\|/g, "\\|")} |`);
  }
  if (audit.items.filter(item => item.priority === "P1").length > 250) lines.push("", `_P1 list truncated in markdown; see JSON for all rows._`);
  return `${lines.join("\n")}\n`;
}

const audit = buildAudit();
writeFile(OUT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
writeFile(OUT_MD, markdown(audit));
console.log(`Wrote ${path.relative(repoRoot, OUT_MD)} and ${path.relative(repoRoot, OUT_JSON)}`);
console.log(JSON.stringify({ countsByPriority: audit.countsByPriority, p1Summary: audit.p1Summary }, null, 2));
