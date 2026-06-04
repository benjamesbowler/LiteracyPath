import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { skillWordBank } from "../src/data/generated/skillWordBank.generated.js";
import {
  findAssessmentMediaCandidates,
  normalizeAssessmentMediaWord
} from "../src/data/assessmentMediaRegistry.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(repoRoot, "docs/validation/skill_word_bank_workbook_audit.json");
const mdPath = path.join(repoRoot, "docs/validation/skill_word_bank_workbook_audit.md");

const COLLECTIONS = [
  "skillColumnEntries",
  "hfwSentences",
  "patternEntries",
  "partsOfSpeech",
  "prepositionQuestions",
  "pluralPairs",
  "prefixWords",
  "suffixWords",
  "antonymSynonymPairs",
  "homophoneHomonymSets",
  "languagePairs"
];

const LIKELY_OBSCURE_OR_ADULT = /\b(?:beer|wine|rifle|gun|kill|dead|death|blood|sexy|drug)\b/i;
const ARTICLE_WORDS = new Set(["a", "an", "the"]);
const DETERMINER_WORDS = new Set(["a", "an", "the", "my", "your", "his", "her", "our", "their", "this", "that", "some", "any"]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text);
}

function sentenceUsesTarget(sentence = "", targetWord = "") {
  const word = normalizeAssessmentMediaWord(targetWord).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!word) return false;
  return new RegExp(`(^|[^a-z0-9'])${word}(?=$|[^a-z0-9'])`, "i").test(sentence);
}

function likelyAmbiguousHfw(record = {}) {
  const target = normalizeAssessmentMediaWord(record.targetWord);
  if (!target) return false;
  if (ARTICLE_WORDS.has(target)) return true;
  if (DETERMINER_WORDS.has(target) && /\b(?:dog|cat|bird|fish|book|ball|hat|cup|box|toy|apple|kite|frog|duck|pig|home|school)\b/i.test(record.sentence || "")) return true;
  return false;
}

function countBy(records, keyFn) {
  const out = {};
  for (const record of records) {
    const key = keyFn(record) || "unknown";
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function uniqueWordsFromRecord(record = {}) {
  return [
    record.targetWord,
    record.pairedWord,
    record.answer,
    ...(Array.isArray(record.words) ? record.words : [])
  ].flatMap(value => String(value || "").split(/[,/;]/)).map(normalizeAssessmentMediaWord).filter(Boolean);
}

function mediaSummary(records) {
  const words = [...new Set(records.flatMap(uniqueWordsFromRecord))].filter(Boolean);
  const wordRows = words.map(word => {
    const imageCount = findAssessmentMediaCandidates({ word, mediaType: "image", includeGenericFallback: true }).length;
    const audioCount = findAssessmentMediaCandidates({ word, mediaType: "audio", includeGenericFallback: true }).length;
    return { word, imageCount, audioCount, hasImage: imageCount > 0, hasAudio: audioCount > 0 };
  });
  return {
    uniqueWords: words.length,
    withImage: wordRows.filter(item => item.hasImage).length,
    withoutImage: wordRows.filter(item => !item.hasImage).length,
    withAudio: wordRows.filter(item => item.hasAudio).length,
    withoutAudio: wordRows.filter(item => !item.hasAudio).length,
    imageButNoAudio: wordRows.filter(item => item.hasImage && !item.hasAudio).map(item => item.word),
    audioButNoImage: wordRows.filter(item => item.hasAudio && !item.hasImage).map(item => item.word),
    withoutImageWords: wordRows.filter(item => !item.hasImage).map(item => item.word),
    withoutAudioWords: wordRows.filter(item => !item.hasAudio).map(item => item.word)
  };
}

function duplicateRows(records) {
  const seen = new Map();
  const duplicates = [];
  for (const record of records) {
    const key = JSON.stringify({
      skillId: record.skillId,
      targetWord: normalizeAssessmentMediaWord(record.targetWord),
      pairedWord: normalizeAssessmentMediaWord(record.pairedWord),
      sentence: String(record.sentence || "").toLowerCase().replace(/\s+/g, " ").trim(),
      prompt: String(record.prompt || "").toLowerCase().replace(/\s+/g, " ").trim(),
      pattern: String(record.pattern || "").toLowerCase().trim()
    });
    const prior = seen.get(key);
    if (prior) {
      duplicates.push({ key, first: `${prior.sourceSheet}:${prior.sourceRow}`, second: `${record.sourceSheet}:${record.sourceRow}` });
    } else {
      seen.set(key, record);
    }
  }
  return duplicates;
}

function buildAudit() {
  const allRecords = COLLECTIONS.flatMap(collection => (skillWordBank[collection] || []).map(record => ({ ...record, collection })));
  const blankRows = allRecords.filter(record => !uniqueWordsFromRecord(record).length && !record.sentence && !record.prompt);
  const malformedPairs = allRecords.filter(record => record.malformed);
  const hfwSentences = skillWordBank.hfwSentences || [];
  const hfwMissingTarget = hfwSentences.filter(record => !sentenceUsesTarget(record.sentence, record.targetWord));
  const hfwAmbiguous = hfwSentences.filter(likelyAmbiguousHfw);
  const inappropriate = allRecords.filter(record => LIKELY_OBSCURE_OR_ADULT.test([record.targetWord, record.pairedWord, record.sentence, record.prompt].filter(Boolean).join(" ")));
  const duplicates = duplicateRows(allRecords);
  const media = mediaSummary(allRecords);

  return {
    generatedAt: new Date().toISOString(),
    sourceWorkbook: skillWordBank.sourceWorkbook,
    sheetNames: skillWordBank.workbookSheets,
    rowsByCollection: Object.fromEntries(COLLECTIONS.map(collection => [collection, (skillWordBank[collection] || []).length])),
    rowsBySkill: countBy(allRecords, record => record.skillId),
    usableTargetsBySkill: Object.fromEntries(Object.entries(Object.groupBy ? Object.groupBy(allRecords, record => record.skillId || "unknown") : groupBy(allRecords, record => record.skillId || "unknown")).map(([skillId, records]) => [skillId, new Set(records.map(record => normalizeAssessmentMediaWord(record.targetWord)).filter(Boolean)).size])),
    hfwUsableSentencesByBand: countBy(hfwSentences.filter(record => sentenceUsesTarget(record.sentence, record.targetWord)), record => record.skillId),
    hfwSentencesByWord: countBy(hfwSentences, record => `${record.skillId}:${record.targetWord}`),
    nounCount: (skillWordBank.partsOfSpeech || []).filter(item => item.partOfSpeech === "noun").length,
    verbCount: (skillWordBank.partsOfSpeech || []).filter(item => item.partOfSpeech === "verb").length,
    adjectiveCount: (skillWordBank.partsOfSpeech || []).filter(item => item.partOfSpeech === "adjective").length,
    prepositionQuestionsByPreposition: countBy(skillWordBank.prepositionQuestions || [], record => record.targetWord),
    pluralPairCount: (skillWordBank.pluralPairs || []).length,
    prefixWordCount: (skillWordBank.prefixWords || []).length,
    suffixWordCount: (skillWordBank.suffixWords || []).length,
    antonymPairCount: (skillWordBank.antonymSynonymPairs || []).filter(item => String(item.pattern || "").includes("antonym")).length,
    synonymPairCount: (skillWordBank.antonymSynonymPairs || []).filter(item => String(item.pattern || "").includes("synonym")).length,
    homophoneHomonymSetCount: (skillWordBank.homophoneHomonymSets || []).length,
    duplicateRows: duplicates,
    blankRows: blankRows.map(record => ({ collection: record.collection, sourceSheet: record.sourceSheet, sourceRow: record.sourceRow })),
    malformedPairs: malformedPairs.map(record => ({ collection: record.collection, sourceSheet: record.sourceSheet, sourceRow: record.sourceRow, targetWord: record.targetWord, pairedWord: record.pairedWord, pattern: record.pattern })),
    hfwSentencesMissingTargetWord: hfwMissingTarget.map(record => ({ skillId: record.skillId, targetWord: record.targetWord, sentence: record.sentence, sourceSheet: record.sourceSheet, sourceRow: record.sourceRow })),
    hfwSentencesWithLikelyMultiplePlausibleAnswers: hfwAmbiguous.map(record => ({ skillId: record.skillId, targetWord: record.targetWord, sentence: record.sentence, sourceSheet: record.sourceSheet, sourceRow: record.sourceRow, note: "Determiner/article sentence needs distractors that avoid article/determiner ambiguity." })),
    inappropriateOrTooAdultIfObvious: inappropriate.map(record => ({ collection: record.collection, sourceSheet: record.sourceSheet, sourceRow: record.sourceRow, targetWord: record.targetWord, pairedWord: record.pairedWord })),
    media
  };
}

function groupBy(records, keyFn) {
  return records.reduce((groups, record) => {
    const key = keyFn(record);
    groups[key] ||= [];
    groups[key].push(record);
    return groups;
  }, {});
}

function markdown(audit) {
  const lines = [];
  lines.push("# Skill Word Bank Workbook Audit", "");
  lines.push(`Source: \`${audit.sourceWorkbook}\``);
  lines.push(`Generated: ${audit.generatedAt}`, "");
  lines.push("## Rows By Collection", "");
  lines.push("| Collection | Rows |", "|---|---:|");
  for (const [collection, count] of Object.entries(audit.rowsByCollection)) lines.push(`| ${collection} | ${count} |`);
  lines.push("", "## Rows By Skill", "", "| Skill | Rows | Usable Targets |", "|---|---:|---:|");
  for (const [skillId, count] of Object.entries(audit.rowsBySkill).sort()) lines.push(`| ${skillId} | ${count} | ${audit.usableTargetsBySkill[skillId] || 0} |`);
  lines.push("", "## HFW Usable Sentences", "", "| Band | Sentences With Target Present |", "|---|---:|");
  for (const [skillId, count] of Object.entries(audit.hfwUsableSentencesByBand).sort()) lines.push(`| ${skillId} | ${count} |`);
  lines.push("", "## Language Counts", "");
  lines.push(`- Nouns: ${audit.nounCount}`);
  lines.push(`- Verbs: ${audit.verbCount}`);
  lines.push(`- Adjectives: ${audit.adjectiveCount}`);
  lines.push(`- Plural pairs: ${audit.pluralPairCount}`);
  lines.push(`- Prefix words: ${audit.prefixWordCount}`);
  lines.push(`- Suffix words: ${audit.suffixWordCount}`);
  lines.push(`- Antonym pairs: ${audit.antonymPairCount}`);
  lines.push(`- Synonym pairs: ${audit.synonymPairCount}`);
  lines.push(`- Homophone/homonym sets: ${audit.homophoneHomonymSetCount}`);
  lines.push("", "## Media Match", "");
  lines.push(`- Unique words checked: ${audit.media.uniqueWords}`);
  lines.push(`- With image: ${audit.media.withImage}`);
  lines.push(`- Without image: ${audit.media.withoutImage}`);
  lines.push(`- With audio: ${audit.media.withAudio}`);
  lines.push(`- Without audio: ${audit.media.withoutAudio}`);
  lines.push(`- Image but no audio: ${audit.media.imageButNoAudio.length}`);
  lines.push(`- Audio but no image: ${audit.media.audioButNoImage.length}`);
  lines.push("", "## Issues", "");
  lines.push(`- Duplicate rows: ${audit.duplicateRows.length}`);
  lines.push(`- Blank rows: ${audit.blankRows.length}`);
  lines.push(`- Malformed pairs/sets: ${audit.malformedPairs.length}`);
  lines.push(`- HFW sentences missing target word: ${audit.hfwSentencesMissingTargetWord.length}`);
  lines.push(`- HFW determiner/article sentences needing careful distractors: ${audit.hfwSentencesWithLikelyMultiplePlausibleAnswers.length}`);
  lines.push(`- Obvious unsuitable/adult rows: ${audit.inappropriateOrTooAdultIfObvious.length}`);
  return `${lines.join("\n")}\n`;
}

const audit = buildAudit();
writeJson(jsonPath, audit);
writeText(mdPath, markdown(audit));
console.log(`Wrote ${path.relative(repoRoot, mdPath)} and ${path.relative(repoRoot, jsonPath)}`);
console.log(JSON.stringify({
  rowsBySkill: audit.rowsBySkill,
  media: {
    uniqueWords: audit.media.uniqueWords,
    withImage: audit.media.withImage,
    withoutImage: audit.media.withoutImage,
    withAudio: audit.media.withAudio,
    withoutAudio: audit.media.withoutAudio
  },
  issues: {
    duplicateRows: audit.duplicateRows.length,
    malformedPairs: audit.malformedPairs.length,
    hfwMissingTarget: audit.hfwSentencesMissingTargetWord.length,
    hfwLikelyAmbiguous: audit.hfwSentencesWithLikelyMultiplePlausibleAnswers.length
  }
}, null, 2));
