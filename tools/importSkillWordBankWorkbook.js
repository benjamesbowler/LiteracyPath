import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { findAssessmentMediaCandidates, normalizeAssessmentMediaWord } from "../src/data/assessmentMediaRegistry.js";
import {
  HFW_FORMATS_BY_PHASE,
  hfwPhaseKey
} from "../src/data/hfwAssessmentFormatConfig.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workbookPath = path.join(repoRoot, "docs/imports/LiteracyPath_K5_Skill_Word_Bank_Through_Homophones.xlsx");
const generatedDir = path.join(repoRoot, "src/data/generated");
const validationDir = path.join(repoRoot, "docs/validation");
const skillWordBankPath = path.join(generatedDir, "skillWordBank.generated.js");
const hfwQuestionsPath = path.join(generatedDir, "hfwAssessmentQuestions.generated.js");
const languageQuestionsPath = path.join(generatedDir, "languageSkillQuestions.generated.js");
const bundledPython = "/Users/benjaminbowler/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

const HFW_BANDS = {
  "HFW 1-25 Sentences": {
    skillId: "hfw_1_25",
    skillName: "High-Frequency Words 1-25",
    bandLabel: "HFW 1-25",
    words: ["the", "to", "and", "a", "i", "you", "it", "in", "said", "for", "up", "look", "is", "go", "we", "little", "can", "see", "me", "my", "on", "one", "big", "come", "like"]
  },
  "HFW 26-50 Sentences": {
    skillId: "hfw_26_50",
    skillName: "High-Frequency Words 26-50",
    bandLabel: "HFW 26-50",
    words: ["down", "not", "play", "all", "are", "as", "be", "but", "came", "from", "have", "he", "she", "they", "was", "with", "that", "then", "this", "what", "when", "where", "will", "help", "make"]
  },
  "HFW 51-75 Sentences": {
    skillId: "hfw_51_75",
    skillName: "High-Frequency Words 51-75",
    bandLabel: "HFW 51-75",
    words: ["after", "again", "an", "any", "around", "ask", "away", "before", "by", "could", "every", "find", "fly", "found", "funny", "give", "going", "had", "has", "her", "here", "him", "his", "how", "into"]
  },
  "HFW 76-100 Sentences": {
    skillId: "hfw_76_100",
    skillName: "High-Frequency Words 76-100",
    bandLabel: "HFW 76-100",
    words: ["just", "know", "let", "live", "made", "may", "must", "new", "now", "of", "old", "once", "open", "our", "out", "over", "please", "pretty", "put", "read", "round", "some", "take", "thank", "yes"]
  }
};

const SKILL_COLUMN_ALIASES = new Map([
  ["initial sounds", "initial_sounds"],
  ["ending sounds", "final_sounds"],
  ["final sounds", "final_sounds"],
  ["rhyming", "rhyming"],
  ["cvc short vowels", "cvc_short_vowels"],
  ["short vowel discrimination", "short_vowel_discrimination"],
  ["blends", "blends"],
  ["digraphs", "digraphs"],
  ["long vowels / silent e", "long_vowels_silent_e"],
  ["long vowels silent e", "long_vowels_silent_e"],
  ["vowel teams", "vowel_teams"],
  ["r-controlled vowels", "r_controlled_vowels"],
  ["r controlled vowels", "r_controlled_vowels"],
  ["nouns", "nouns"],
  ["verbs", "verbs"],
  ["adjectives", "adjectives"],
  ["prepositions", "prepositions_of_place"],
  ["prepositions of place", "prepositions_of_place"],
  ["plurals", "plurals"],
  ["prefixes", "prefixes_suffixes"],
  ["suffixes", "prefixes_suffixes"],
  ["antonyms / synonyms", "antonyms_synonyms"],
  ["antonyms synonyms", "antonyms_synonyms"],
  ["homophones / homonyms", "homophones_homonyms"],
  ["homophones homonyms", "homophones_homonyms"]
]);

const DETERMINER_WORDS = new Set(["a", "an", "the", "my", "your", "his", "her", "our", "their", "this", "that", "some", "any"]);
const ARTICLE_WORDS = new Set(["a", "an", "the"]);
const OBVIOUSLY_UNSUITABLE = /\b(?:beer|wine|kill|gun|rifle|sexy|drug|death|dead|blood)\b/i;

const HFW_WORD_TO_BAND = new Map(
  Object.values(HFW_BANDS).flatMap(config =>
    config.words.map(word => [normalizeAssessmentMediaWord(word), config])
  )
);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

function cellText(cell) {
  const value = cell?.value;
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value.richText) return value.richText.map(part => part.text || "").join("").trim();
  if (value.text) return String(value.text).trim();
  if (value.result != null) return String(value.result).trim();
  return String(value).trim();
}

function readWorkbookWithPython() {
  const python = fs.existsSync(bundledPython) ? bundledPython : "python3";
  const script = String.raw`
import json
import sys
from openpyxl import load_workbook

path = sys.argv[1]
wb = load_workbook(path, read_only=True, data_only=True)
payload = {"sheetNames": wb.sheetnames, "sheets": {}}
for ws in wb.worksheets:
    rows = []
    for row in ws.iter_rows(values_only=True):
        values = []
        for value in row:
            if value is None:
                values.append("")
            else:
                values.append(str(value).strip())
        while values and values[-1] == "":
            values.pop()
        rows.append(values)
    payload["sheets"][ws.title] = rows
print(json.dumps(payload))
`;
  const result = spawnSync(python, ["-c", script, workbookPath], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 80
  });
  if (result.status !== 0) {
    throw new Error(`Unable to read workbook with Python/openpyxl: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function makeWorkbookAdapter(payload) {
  const sheets = new Map(Object.entries(payload.sheets || {}).map(([name, rows]) => {
    const sheet = {
      name,
      rowCount: rows.length,
      getRow(rowNumber) {
        const values = rows[rowNumber - 1] || [];
        return {
          getCell(columnNumber) {
            return { value: values[columnNumber - 1] || "" };
          },
          eachCell({ includeEmpty = false } = {}, callback) {
            const length = includeEmpty ? values.length : values.findLastIndex?.(value => value !== "") + 1 || values.length;
            for (let index = 0; index < length; index += 1) {
              const value = values[index] || "";
              if (!includeEmpty && value === "") continue;
              callback({ value }, index + 1);
            }
          }
        };
      }
    };
    return [name, sheet];
  }));
  return {
    worksheets: (payload.sheetNames || []).map(name => sheets.get(name)).filter(Boolean),
    getWorksheet(name) {
      return sheets.get(name) || null;
    }
  };
}

function getHeaderMap(sheet) {
  const headerRow = sheet.getRow(1);
  const map = new Map();
  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = cellText(cell).toLowerCase().replace(/\s+/g, " ").trim();
    if (header) map.set(header, columnNumber);
  });
  return map;
}

function rowValue(row, headerMap, aliases) {
  for (const alias of aliases) {
    const column = headerMap.get(alias.toLowerCase());
    if (column) return cellText(row.getCell(column));
  }
  return "";
}

function normalizeToken(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeSentence(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function skillIdForName(value = "") {
  const clean = String(value || "").toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();
  return SKILL_COLUMN_ALIASES.get(clean) || normalizeToken(clean);
}

function parseLevel(value = "") {
  const text = String(value || "").toLowerCase();
  const match = text.match(/(?:level|l)\s*([12])/i);
  if (match) return Number(match[1]);
  if (/\b2\b/.test(text)) return 2;
  return 1;
}

function parsePhase(value = "", index = 0) {
  const text = String(value || "").toLowerCase();
  const match = text.match(/(?:phase|p)\s*([12])/i);
  if (match) return Number(match[1]);
  return index % 2 === 0 ? 1 : 2;
}

function phaseFromSequence(sequence) {
  const number = Number(sequence) || 1;
  if (number <= 5) return { level: 1, phase: 1 };
  if (number <= 10) return { level: 1, phase: 2 };
  if (number <= 15) return { level: 2, phase: 1 };
  return { level: 2, phase: 2 };
}

function wordRegex(word = "") {
  const escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9'])(${escaped})(?=$|[^a-z0-9'])`, "i");
}

function sentenceUsesTarget(sentence = "", targetWord = "") {
  if (!targetWord) return false;
  return wordRegex(targetWord).test(sentence);
}

function targetOccurrenceCount(sentence = "", targetWord = "") {
  if (!targetWord) return 0;
  const escaped = String(targetWord).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = String(sentence || "").match(new RegExp(`(^|[^a-z0-9'])${escaped}(?=$|[^a-z0-9'])`, "gi"));
  return matches?.length || 0;
}

function blankTarget(sentence = "", targetWord = "") {
  return sentence.replace(wordRegex(targetWord), (_match, prefix) => `${prefix}___`);
}

function slugWord(value = "") {
  return normalizeAssessmentMediaWord(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function pickMediaPath(word, skillId, mediaType = "image", role = "target_object") {
  const candidates = findAssessmentMediaCandidates({ word, skillId, mediaType, role, includeGenericFallback: true });
  return candidates.find(candidate => publicAssetExists(candidate.path))?.path || "";
}

function publicAssetExists(assetPath = "") {
  return Boolean(
    assetPath &&
    String(assetPath).startsWith("/") &&
    fs.existsSync(path.join(repoRoot, "public", assetPath.replace(/^\//, "")))
  );
}

function languageImageRole(skillId = "", itemType = "") {
  const normalizedSkill = skillIdForName(skillId);
  const normalizedType = normalizeAssessmentMediaWord(itemType);
  if (normalizedSkill === "nouns" || normalizedType === "noun") return "noun_image";
  if (normalizedSkill === "verbs" || normalizedType === "verb") return "verb_action";
  if (normalizedSkill === "adjectives" || normalizedType === "adjective") return "adjective_visual";
  if (normalizedSkill === "prepositions_of_place" || normalizedSkill === "prepositions") return "preposition_scene";
  if (normalizedSkill === "plurals" || normalizedType === "plural") return "plural_pair";
  if (normalizedSkill === "antonyms_synonyms" || normalizedType === "antonym" || normalizedType === "synonym") return "antonym_synonym_scene";
  if (normalizedSkill === "homophones_homonyms" || normalizedType === "homophone_homonym") return "homophone_context";
  return "target_object";
}

function parseSkillColumns(workbook) {
  const sheet = workbook.getWorksheet("Skill Columns");
  if (!sheet) return [];
  const headers = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const skillName = cellText(cell);
    if (skillName) headers.push({ columnNumber, skillName, skillId: skillIdForName(skillName) });
  });
  const entries = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    for (const header of headers) {
      const raw = cellText(row.getCell(header.columnNumber));
      if (!raw) continue;
      const parts = raw.split("|").map(part => part.trim()).filter(Boolean);
      const level = parseLevel(parts[0] || raw);
      entries.push({
        skillId: header.skillId,
        skillName: header.skillName,
        level,
        phase: parsePhase(raw, rowNumber),
        pattern: parts.length >= 3 ? parts[1] : "",
        targetWord: parts.length >= 3 ? parts.slice(2).join(" | ") : raw,
        rawValue: raw,
        sourceSheet: "Skill Columns",
        sourceRow: rowNumber,
        imageRequired: ["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination", "nouns", "verbs", "adjectives"].includes(header.skillId),
        audioRequired: ["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination"].includes(header.skillId),
        textAllowed: true,
        listeningLed: ["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination"].includes(header.skillId),
        readingLed: !["initial_sounds", "final_sounds"].includes(header.skillId),
        grammarSkill: ["nouns", "verbs", "adjectives", "prepositions_of_place", "plurals", "prefixes_suffixes", "antonyms_synonyms", "homophones_homonyms"].includes(header.skillId),
        vocabularySkill: !header.skillId.startsWith("hfw_") && !["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination"].includes(header.skillId),
        phonicsSkill: ["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination", "blends", "digraphs", "long_vowels_silent_e", "vowel_teams", "r_controlled_vowels"].includes(header.skillId)
      });
    }
  }
  return entries;
}

function parseHfwSentences(workbook) {
  const records = [];
  for (const [sheetName, config] of Object.entries(HFW_BANDS)) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) continue;
    const headers = getHeaderMap(sheet);
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const targetWord = normalizeAssessmentMediaWord(rowValue(row, headers, ["target word", "hfw word"]));
      const sentence = normalizeSentence(rowValue(row, headers, ["sentence"]));
      if (!targetWord && !sentence) continue;
      const appBand = HFW_WORD_TO_BAND.get(targetWord);
      const runtimeConfig = appBand || config;
      const sentenceNumber = Number(rowValue(row, headers, ["sentence #", "sentence number"])) || 0;
      const { level, phase } = phaseFromSequence(sentenceNumber || records.filter(item => item.skillId === runtimeConfig.skillId && item.targetWord === targetWord).length + 1);
      records.push({
        skillId: runtimeConfig.skillId,
        skillName: runtimeConfig.skillName,
        workbookBandSkillId: config.skillId,
        inConfiguredAppBand: Boolean(appBand),
        level,
        phase,
        pattern: "high_frequency_word",
        targetWord,
        pairedWord: "",
        sentence,
        prompt: "Choose the word that completes the sentence.",
        answer: targetWord,
        distractors: runtimeConfig.words.filter(word => normalizeAssessmentMediaWord(word) !== targetWord),
        sentenceNumber,
        sourceSheet: sheetName,
        sourceRow: rowNumber,
        notes: rowValue(row, headers, ["use note", "use", "notes"]),
        imageRequired: true,
        audioRequired: false,
        textAllowed: true,
        listeningLed: false,
        readingLed: true,
        grammarSkill: false,
        vocabularySkill: false,
        phonicsSkill: false,
        targetPresent: sentenceUsesTarget(sentence, targetWord),
        targetOccurrenceCount: targetOccurrenceCount(sentence, targetWord),
        likelyAmbiguous: isLikelyAmbiguousHfwSentence(targetWord, sentence)
      });
    }
  }
  return records;
}

function isLikelyAmbiguousHfwSentence(targetWord = "", sentence = "") {
  const word = normalizeAssessmentMediaWord(targetWord);
  if (!word || !sentence) return false;
  if (ARTICLE_WORDS.has(word)) return true;
  if (DETERMINER_WORDS.has(word) && /\b(?:dog|cat|bird|fish|book|ball|hat|cup|box|toy|apple|kite|frog|duck|pig|home|school)\b/i.test(sentence)) return true;
  return false;
}

function parsePatternLists(workbook) {
  const sheet = workbook.getWorksheet("Pattern Lists");
  if (!sheet) return [];
  const headers = getHeaderMap(sheet);
  const records = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const skillName = rowValue(row, headers, ["skill"]);
    const targetWord = normalizeAssessmentMediaWord(rowValue(row, headers, ["entry"]));
    if (!skillName && !targetWord) continue;
    const sentenceNumber = Number(rowValue(row, headers, ["sentence #", "sentence number"])) || 0;
    const { level, phase } = phaseFromSequence(sentenceNumber || rowNumber);
    records.push({
      skillId: skillIdForName(skillName),
      skillName,
      level: parseLevel(rowValue(row, headers, ["level"])) || level,
      phase,
      pattern: rowValue(row, headers, ["pattern / family / sound", "pattern", "family"]),
      targetWord,
      pairedWord: "",
      sentence: normalizeSentence(rowValue(row, headers, ["sentence"])),
      prompt: "",
      answer: targetWord,
      distractors: [],
      sourceSheet: "Pattern Lists",
      sourceRow: rowNumber,
      notes: rowValue(row, headers, ["notes"]),
      imageRequired: ["rhyming", "cvc_short_vowels", "short_vowel_discrimination"].includes(skillIdForName(skillName)),
      audioRequired: ["rhyming", "cvc_short_vowels", "short_vowel_discrimination"].includes(skillIdForName(skillName)),
      textAllowed: true,
      listeningLed: true,
      readingLed: true,
      grammarSkill: false,
      vocabularySkill: false,
      phonicsSkill: true
    });
  }
  return records;
}

function parsePartsOfSpeech(workbook) {
  const sheet = workbook.getWorksheet("Nouns Verbs Adjectives");
  if (!sheet) return [];
  const headers = getHeaderMap(sheet);
  const records = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const partOfSpeech = normalizeAssessmentMediaWord(rowValue(row, headers, ["part of speech"]));
    const targetWord = normalizeAssessmentMediaWord(rowValue(row, headers, ["word"]));
    if (!partOfSpeech && !targetWord) continue;
    const skillId = partOfSpeech === "noun" ? "nouns" : partOfSpeech === "verb" ? "verbs" : partOfSpeech === "adjective" ? "adjectives" : skillIdForName(partOfSpeech);
    records.push({
      skillId,
      skillName: titleCase(skillId),
      level: rowNumber % 2 === 0 ? 1 : 2,
      phase: rowNumber % 4 < 2 ? 1 : 2,
      category: rowValue(row, headers, ["category"]),
      targetWord,
      partOfSpeech,
      imageability: rowValue(row, headers, ["imageability"]),
      assessmentUse: rowValue(row, headers, ["assessment use"]),
      sourceSheet: "Nouns Verbs Adjectives",
      sourceRow: rowNumber,
      imageRequired: false,
      audioRequired: false,
      textAllowed: true,
      listeningLed: false,
      readingLed: true,
      grammarSkill: true,
      vocabularySkill: true,
      phonicsSkill: false
    });
  }
  return records;
}

function parsePrepositions(workbook) {
  const sheet = workbook.getWorksheet("Preposition Questions");
  if (!sheet) return [];
  const headers = getHeaderMap(sheet);
  const records = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const targetWord = normalizeAssessmentMediaWord(rowValue(row, headers, ["preposition"]));
    const prompt = normalizeSentence(rowValue(row, headers, ["question / prompt", "question", "prompt"]));
    if (!targetWord && !prompt) continue;
    const questionNumber = Number(rowValue(row, headers, ["question #", "question number"])) || 0;
    const { level, phase } = phaseFromSequence(questionNumber || rowNumber);
    records.push({
      skillId: "prepositions_of_place",
      skillName: "Prepositions",
      level,
      phase,
      targetWord,
      prompt,
      answer: targetWord,
      questionType: rowValue(row, headers, ["question type"]),
      sourceSheet: "Preposition Questions",
      sourceRow: rowNumber,
      notes: rowValue(row, headers, ["media note", "notes"]),
      imageRequired: false,
      audioRequired: false,
      textAllowed: true,
      listeningLed: false,
      readingLed: true,
      grammarSkill: true,
      vocabularySkill: true,
      phonicsSkill: false
    });
  }
  return records;
}

function parsePairs(workbook, sheetName, config) {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return [];
  const headers = getHeaderMap(sheet);
  const records = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const item = config.parse(row, headers);
    if (!item) continue;
    records.push({
      ...item,
      sourceSheet: sheetName,
      sourceRow: rowNumber,
      imageRequired: false,
      audioRequired: false,
      textAllowed: true,
      listeningLed: false,
      readingLed: true,
      grammarSkill: true,
      vocabularySkill: true,
      phonicsSkill: false
    });
  }
  return records;
}

function parseWorkbookData(workbook) {
  const skillColumnEntries = parseSkillColumns(workbook);
  const hfwSentences = parseHfwSentences(workbook);
  const patternEntries = parsePatternLists(workbook);
  const partsOfSpeech = parsePartsOfSpeech(workbook);
  const prepositionQuestions = parsePrepositions(workbook);
  const pluralPairs = parsePairs(workbook, "Plurals", {
    parse(row, headers) {
      const singular = normalizeAssessmentMediaWord(rowValue(row, headers, ["singular"]));
      const plural = normalizeAssessmentMediaWord(rowValue(row, headers, ["plural"]));
      if (!singular && !plural) return null;
      const ruleType = rowValue(row, headers, ["rule type"]);
      const hard = /irregular|ves|ies|same/i.test(ruleType);
      return { skillId: "plurals", skillName: "Plurals", level: hard ? 2 : 1, phase: hard ? 2 : 1, targetWord: singular, pairedWord: plural, answer: plural, pattern: ruleType, sentence: normalizeSentence(rowValue(row, headers, ["example sentence"])), malformed: !singular || !plural };
    }
  });
  const prefixWords = parsePairs(workbook, "Prefixes", {
    parse(row, headers) {
      const prefix = normalizeAssessmentMediaWord(rowValue(row, headers, ["prefix"]));
      const word = normalizeAssessmentMediaWord(rowValue(row, headers, ["word"]));
      if (!prefix && !word) return null;
      return { skillId: "prefixes_suffixes", skillName: "Prefixes", level: ["un", "re", "pre"].includes(prefix) ? 1 : 2, phase: ["un", "re", "pre"].includes(prefix) ? 1 : 2, pattern: prefix, targetWord: word, answer: prefix, notes: rowValue(row, headers, ["pattern note", "assessment use"]), malformed: !prefix || !word };
    }
  });
  const suffixWords = parsePairs(workbook, "Suffixes", {
    parse(row, headers) {
      const suffix = normalizeAssessmentMediaWord(rowValue(row, headers, ["suffix"]));
      const word = normalizeAssessmentMediaWord(rowValue(row, headers, ["word"]));
      if (!suffix && !word) return null;
      return { skillId: "prefixes_suffixes", skillName: "Suffixes", level: ["ing", "ed", "s", "er"].includes(suffix) ? 1 : 2, phase: ["ing", "ed", "s", "er"].includes(suffix) ? 1 : 2, pattern: suffix, targetWord: word, answer: suffix, notes: rowValue(row, headers, ["pattern note", "assessment use"]), malformed: !suffix || !word };
    }
  });
  const antonymSynonymPairs = parsePairs(workbook, "Antonyms Synonyms", {
    parse(row, headers) {
      const wordA = normalizeAssessmentMediaWord(rowValue(row, headers, ["word 1"]));
      const wordB = normalizeAssessmentMediaWord(rowValue(row, headers, ["word 2"]));
      const relationship = normalizeAssessmentMediaWord(rowValue(row, headers, ["relationship"]));
      if (!wordA && !wordB) return null;
      const relationType = relationship.includes("same") || relationship.includes("similar") || relationship.includes("synonym")
        ? "synonym"
        : "antonym";
      return { skillId: "antonyms_synonyms", skillName: "Antonyms Synonyms", level: relationType === "synonym" ? 2 : 1, phase: relationType === "synonym" ? 2 : 1, targetWord: wordA, pairedWord: wordB, answer: wordB, pattern: relationType, notes: rowValue(row, headers, ["pair format"]), rawRelationship: relationship, malformed: !wordA || !wordB || !relationship };
    }
  });
  const homophoneHomonymSets = parsePairs(workbook, "Homophones Homonyms", {
    parse(row, headers) {
      const wordsRaw = rowValue(row, headers, ["words"]);
      const words = wordsRaw.split(/[,/;]/).map(normalizeAssessmentMediaWord).filter(Boolean);
      if (!wordsRaw && !rowValue(row, headers, ["pair/set"])) return null;
      return { skillId: "homophones_homonyms", skillName: "Homophones Homonyms", level: 2, phase: 2, targetWord: words[0] || "", pairedWord: words.slice(1).join(", "), answer: words[0] || "", pattern: normalizeAssessmentMediaWord(rowValue(row, headers, ["type"])), setLabel: rowValue(row, headers, ["pair/set"]), words, notes: rowValue(row, headers, ["assessment use"]), malformed: words.length < 2 };
    }
  });
  const languagePairs = parsePairs(workbook, "Language Pairs", {
    parse(row, headers) {
      const skillName = rowValue(row, headers, ["skill"]);
      const wordA = normalizeAssessmentMediaWord(rowValue(row, headers, ["word a"]));
      const wordB = normalizeAssessmentMediaWord(rowValue(row, headers, ["word b / other words", "word b"]));
      if (!skillName && !wordA && !wordB) return null;
      return { skillId: skillIdForName(skillName), skillName, level: 1, phase: 1, targetWord: wordA, pairedWord: wordB, pattern: rowValue(row, headers, ["pair / set"]), notes: rowValue(row, headers, ["teaching note"]), malformed: !wordA || !wordB };
    }
  });

  return {
    sourceWorkbook: "docs/imports/LiteracyPath_K5_Skill_Word_Bank_Through_Homophones.xlsx",
    generatedAt: new Date().toISOString(),
    workbookSheets: workbook.worksheets.map(sheet => sheet.name),
    skillColumnEntries,
    hfwSentences,
    patternEntries,
    partsOfSpeech,
    prepositionQuestions,
    pluralPairs,
    prefixWords,
    suffixWords,
    antonymSynonymPairs,
    homophoneHomonymSets,
    languagePairs
  };
}

function selectHfwDistractors({ skillId, targetWord, sentenceNumber, sentence }) {
  const band = Object.values(HFW_BANDS).find(config => config.skillId === skillId);
  const target = normalizeAssessmentMediaWord(targetWord);
  const sentenceWords = new Set(normalizeAssessmentMediaWord(sentence).split(/\s+/).filter(Boolean));
  const forbidden = new Set([target]);
  if (ARTICLE_WORDS.has(target)) {
    for (const word of ARTICLE_WORDS) if (word !== target) forbidden.add(word);
  }
  if (DETERMINER_WORDS.has(target)) {
    for (const word of DETERMINER_WORDS) if (word !== target) forbidden.add(word);
  }
  const rotated = [...(band?.words || [])]
    .map(normalizeAssessmentMediaWord)
    .filter(Boolean)
    .filter(word => !forbidden.has(word))
    .sort((a, b) => ((a.charCodeAt(0) + sentenceNumber) % 29) - ((b.charCodeAt(0) + sentenceNumber) % 29));
  const clean = rotated.filter(word => !sentenceWords.has(word));
  const options = [];
  for (const word of [...clean, ...rotated]) {
    if (!options.includes(word)) options.push(word);
    if (options.length === 3) break;
  }
  if (options.length < 3) {
    for (const word of band.words.map(normalizeAssessmentMediaWord)) {
      if (word !== target && !options.includes(word)) options.push(word);
      if (options.length === 3) break;
    }
  }
  return options.slice(0, 3);
}

function orderedOptions(targetWord, distractors, seed) {
  const target = normalizeAssessmentMediaWord(targetWord);
  const values = [target, ...distractors.map(normalizeAssessmentMediaWord)].slice(0, 4);
  const rotateBy = Math.abs(Number(seed) || 0) % values.length;
  return [...values.slice(rotateBy), ...values.slice(0, rotateBy)].map(value => ({
    label: value,
    value,
    text: value,
    word: value,
    correct: value === target
  }));
}

function generateHfwModule(data) {
  const questions = [];
  for (const record of data.hfwSentences) {
    if (!record.inConfiguredAppBand || !record.targetWord || !record.sentence || !record.targetPresent || record.targetOccurrenceCount !== 1) continue;
    const cloze = blankTarget(record.sentence, record.targetWord);
    if ((cloze.match(/___/g) || []).length !== 1) continue;
    const targetSlug = slugWord(record.targetWord);
    const seed = Number(record.sentenceNumber || questions.length + 1);
    const level = Number(record.level) >= 2 ? 2 : 1;
    const phase = Number(record.phase) === 2 ? 2 : 1;
    const imagePath = pickHfwImagePath(record.skillId, record.targetWord, level, phase, seed);
    const phaseFormatKey = hfwPhaseKey(level, phase);
    const phaseFormats = HFW_FORMATS_BY_PHASE[phaseFormatKey] || [];
    const formatType = phaseFormats[Math.abs(seed) % Math.max(phaseFormats.length, 1)] || "HFW_SENTENCE_CLOZE_L1P1_01";
    const common = {
      id: `hfw_workbook_${record.skillId}_${targetSlug}_s${String(record.sentenceNumber || seed).padStart(2, "0")}`,
      skillId: record.skillId,
      assessmentSkillId: record.skillId,
      skillName: record.skillName,
      level,
      phase,
      difficultyLevel: level,
      itemType: "sight_word",
      disableAudio: true,
      noAudio: true,
      itemKey: `${targetSlug}_s${record.sentenceNumber || seed}`,
      targetWord: record.targetWord,
      answer: record.targetWord,
      correctAnswer: record.targetWord,
      imagePath,
      imageUrl: imagePath,
      mediaTarget: `hfw-workbook:${record.skillId}:${targetSlug}:s${record.sentenceNumber || seed}`,
      source: "skill_word_bank_workbook",
      sourceSheet: record.sourceSheet,
      sourceRow: record.sourceRow
    };
    if (level >= 2) {
      const tiles = buildLetterTiles(record.targetWord, seed);
      questions.push({
        ...common,
        prompt: "Listen to the sentence. Spell the word that fits.",
        question: "Listen to the sentence. Spell the word that fits.",
        sentence: cloze,
        visibleSentenceWithBlank: cloze,
        sentenceText: record.sentence,
        fullSentence: record.sentence,
        spokenPrompt: record.sentence,
        sentenceAudio: record.sentence,
        audioText: record.sentence,
        context: cloze,
        correctLetterSequence: record.targetWord.split(""),
        letterTiles: tiles,
        soundTiles: tiles,
        distractorLetters: tiles.filter((letter, index) => !record.targetWord[index] || letter !== record.targetWord[index]),
        formatType,
        templateType: formatType,
        questionType: "hfw_sentence_spell"
      });
    } else {
      const distractors = selectHfwDistractors({
        skillId: record.skillId,
        targetWord: record.targetWord,
        sentenceNumber: seed,
        sentence: record.sentence
      });
      const options = orderedOptions(record.targetWord, distractors, seed);
      questions.push({
        ...common,
        prompt: "Choose the word that completes the sentence.",
        question: "Choose the word that completes the sentence.",
        sentence: cloze,
        fullSentence: record.sentence,
        context: cloze,
        choices: options.map(option => option.value),
        answerOptions: options,
        options,
        visibleSentenceWithBlank: cloze,
        formatType,
        templateType: formatType,
        questionType: "multiple_choice"
      });
    }
  }

  return `// Generated by tools/importSkillWordBankWorkbook.js from the K-5 skill workbook. Do not hand-edit.

export const hfwAssessmentQuestions = ${JSON.stringify(questions, null, 2)};
`;
}

function pickHfwImagePath(skillId, word, level, phase, seed) {
  const candidates = findAssessmentMediaCandidates({
    word,
    skillId,
    mediaType: "image",
    role: "hfw_scene",
    level,
    phase,
    includeGenericFallback: true
  });
  const fallbackCandidates = candidates.length ? candidates : findAssessmentMediaCandidates({
    word,
    skillId,
    mediaType: "image",
    role: "target_object",
    includeGenericFallback: true
  });
  if (fallbackCandidates.length) return fallbackCandidates[Math.abs(Number(seed) || 0) % fallbackCandidates.length].path;
  return `/images/assessment/hfw/${slugWord(word)}.webp`;
}

function buildLetterTiles(word, seed = 0) {
  const alphabet = "etaoinshrdlucmfwypvbgkqjxz";
  const targetLetters = String(word || "").toLowerCase().replace(/[^a-z]/g, "").split("");
  const tiles = [...targetLetters];
  let index = Math.abs(Number(seed) || 0);
  while (tiles.length < 12) {
    const letter = alphabet[index % alphabet.length];
    tiles.push(letter);
    index += 5;
  }
  return tiles
    .map((letter, tileIndex) => ({ letter, sortKey: (tileIndex * 7 + seed) % 17 }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(item => item.letter);
}

function makeLanguageOptions(answer, pool, seed) {
  const target = normalizeAssessmentMediaWord(answer);
  const distractors = pool.map(normalizeAssessmentMediaWord).filter(word => word && word !== target);
  const picked = [];
  const start = Math.abs(Number(seed) || 0) % Math.max(1, distractors.length);
  for (let offset = 0; offset < distractors.length && picked.length < 3; offset += 1) {
    const word = distractors[(start + offset) % distractors.length];
    if (word && !picked.includes(word)) picked.push(word);
  }
  const values = [target, ...picked].slice(0, 4);
  const rotateBy = Math.abs(Number(seed) || 0) % values.length;
  return [...values.slice(rotateBy), ...values.slice(0, rotateBy)].map(value => ({ label: value, value, text: value, word: value, correct: value === target }));
}

function withPartOfSpeechOptionMedia(options, partOfSpeech, skillId) {
  return options.map(option => {
    const audioPath = pickMediaPath(option.value, skillId, "audio");
    return {
      ...option,
      partOfSpeech,
      audio: audioPath || undefined,
      audioPath: audioPath || undefined,
      audioUrl: audioPath || undefined
    };
  });
}

function sentenceTemplateFor(partOfSpeech, word) {
  if (partOfSpeech === "noun") return `This is the ___.`;
  if (partOfSpeech === "verb") return `They ___.`;
  return `It is ___.`;
}

function runtimeTemplateKey(...parts) {
  return parts
    .filter(Boolean)
    .map(part => slugWord(part))
    .filter(Boolean)
    .join("_");
}

function generateLanguageQuestions(data) {
  const questions = [];
  const posPools = {
    noun: data.partsOfSpeech.filter(item => item.partOfSpeech === "noun").map(item => item.targetWord),
    verb: data.partsOfSpeech.filter(item => item.partOfSpeech === "verb").map(item => item.targetWord),
    adjective: data.partsOfSpeech.filter(item => item.partOfSpeech === "adjective").map(item => item.targetWord)
  };
  for (const [index, item] of data.partsOfSpeech.entries()) {
    if (!item.targetWord || OBVIOUSLY_UNSUITABLE.test(item.targetWord)) continue;
    const imagePath = pickMediaPath(item.targetWord, item.skillId, "image", languageImageRole(item.skillId, item.partOfSpeech));
    const options = withPartOfSpeechOptionMedia(
      makeLanguageOptions(item.targetWord, posPools[item.partOfSpeech] || [], index),
      item.partOfSpeech,
      item.skillId
    );
    if (options.length !== 4) continue;
    questions.push({
      id: `workbook_${item.skillId}_${slugWord(item.targetWord)}_${index}`,
      skillId: item.skillId,
      assessmentSkillId: item.skillId,
      skillName: item.skillName,
      level: item.level,
      phase: item.phase,
      difficultyLevel: item.level,
      itemType: `grammar_${item.partOfSpeech}`,
      partOfSpeech: item.partOfSpeech,
      targetWord: item.targetWord,
      answer: item.targetWord,
      correctAnswer: item.targetWord,
      prompt: `Choose the ${item.partOfSpeech} that best fits the sentence.`,
      question: `Choose the ${item.partOfSpeech} that best fits the sentence.`,
      sentence: sentenceTemplateFor(item.partOfSpeech, item.targetWord),
      answerOptions: options,
      choices: options.map(option => option.value),
      options,
      formatType: "GRAMMAR_SENTENCE_FIT",
      templateType: "GRAMMAR_SENTENCE_FIT",
      questionType: "ixl_template",
      imagePath: imagePath || undefined,
      imageUrl: imagePath || undefined,
      mediaTarget: `workbook:${item.skillId}:${slugWord(item.targetWord)}`,
      source: "skill_word_bank_workbook",
      sourceSheet: item.sourceSheet,
      sourceRow: item.sourceRow
    });
  }

  const prepositionPool = [...new Set(data.prepositionQuestions.map(item => item.targetWord).filter(Boolean))];
  for (const [index, item] of data.prepositionQuestions.entries()) {
    const options = makeLanguageOptions(item.targetWord, prepositionPool, index);
    if (options.length !== 4) continue;
    const imagePath = pickMediaPath(item.targetWord, item.skillId, "image", languageImageRole(item.skillId, item.itemType || "preposition"));
    questions.push({
      id: `workbook_prepositions_${slugWord(item.targetWord)}_${index}`,
      skillId: "prepositions_of_place",
      assessmentSkillId: "prepositions_of_place",
      skillName: "Prepositions",
      level: item.level,
      phase: item.phase,
      difficultyLevel: item.level,
      itemType: "preposition",
      targetWord: item.targetWord,
      answer: item.targetWord,
      correctAnswer: item.targetWord,
      prompt: item.prompt || "Choose the preposition that fits.",
      question: item.prompt || "Choose the preposition that fits.",
      sentence: item.prompt,
      answerOptions: options,
      choices: options.map(option => option.value),
      options,
      formatType: "PREPOSITION_TEXT_CHOICE",
      templateType: "WORKBOOK_PREPOSITION_TEXT_CHOICE",
      runtimeTemplateKey: runtimeTemplateKey("preposition", item.level, item.phase, item.targetWord, index),
      questionType: "PREPOSITION_TEXT_CHOICE",
      imagePath: imagePath || undefined,
      imageUrl: imagePath || undefined,
      mediaTarget: `workbook:prepositions:${slugWord(item.targetWord)}:${index}`,
      source: "skill_word_bank_workbook",
      sourceSheet: item.sourceSheet,
      sourceRow: item.sourceRow
    });
  }

  const pluralPool = [...new Set(data.pluralPairs.map(item => item.pairedWord).filter(Boolean))];
  for (const [index, item] of data.pluralPairs.entries()) {
    if (item.malformed) continue;
    const options = makeLanguageOptions(item.pairedWord, pluralPool, index);
    if (options.length !== 4) continue;
    const imagePath = pickMediaPath(item.targetWord, item.skillId, "image", languageImageRole(item.skillId, "plural"));
    questions.push({
      id: `workbook_plurals_${slugWord(item.targetWord)}_${index}`,
      skillId: "plurals",
      assessmentSkillId: "plurals",
      skillName: "Plurals",
      level: item.level,
      phase: item.phase,
      difficultyLevel: item.level,
      itemType: "plural",
      targetWord: item.targetWord,
      answer: item.pairedWord,
      correctAnswer: item.pairedWord,
      prompt: `Choose the plural of ${item.targetWord}.`,
      question: `Choose the plural of ${item.targetWord}.`,
      sentence: item.sentence,
      answerOptions: options,
      choices: options.map(option => option.value),
      options,
      formatType: "PLURAL_TEXT_CHOICE",
      templateType: "WORKBOOK_PLURAL_TEXT_CHOICE",
      runtimeTemplateKey: runtimeTemplateKey("plural", item.level, item.phase, item.targetWord, item.pairedWord),
      questionType: "PLURAL_TEXT_CHOICE",
      imagePath: imagePath || undefined,
      imageUrl: imagePath || undefined,
      mediaTarget: `workbook:plurals:${slugWord(item.targetWord)}`,
      source: "skill_word_bank_workbook",
      sourceSheet: item.sourceSheet,
      sourceRow: item.sourceRow
    });
  }

  const prefixPool = [...new Set(data.prefixWords.map(item => item.pattern).filter(Boolean))];
  for (const [index, item] of data.prefixWords.entries()) {
    if (item.malformed) continue;
    const options = makeLanguageOptions(item.pattern, prefixPool, index);
    if (options.length !== 4) continue;
    questions.push({
      id: `workbook_prefix_${slugWord(item.targetWord)}_${index}`,
      skillId: "prefixes_suffixes",
      assessmentSkillId: "prefixes_suffixes",
      skillName: "Prefixes and Suffixes",
      level: item.level,
      phase: item.phase,
      difficultyLevel: item.level,
      itemType: "prefix",
      targetWord: item.targetWord,
      answer: item.pattern,
      correctAnswer: item.pattern,
      prompt: `Choose the prefix in ${item.targetWord}.`,
      question: `Choose the prefix in ${item.targetWord}.`,
      answerOptions: options,
      choices: options.map(option => option.value),
      options,
      formatType: "PREFIX_SUFFIX_TEXT_CHOICE",
      templateType: "WORKBOOK_PREFIX_TEXT_CHOICE",
      questionType: "PREFIX_SUFFIX_TEXT_CHOICE",
      mediaTarget: `workbook:prefix:${slugWord(item.targetWord)}`,
      source: "skill_word_bank_workbook",
      sourceSheet: item.sourceSheet,
      sourceRow: item.sourceRow
    });
  }

  const suffixPool = [...new Set(data.suffixWords.map(item => item.pattern).filter(Boolean))];
  for (const [index, item] of data.suffixWords.entries()) {
    if (item.malformed) continue;
    const options = makeLanguageOptions(item.pattern, suffixPool, index);
    if (options.length !== 4) continue;
    questions.push({
      id: `workbook_suffix_${slugWord(item.targetWord)}_${index}`,
      skillId: "prefixes_suffixes",
      assessmentSkillId: "prefixes_suffixes",
      skillName: "Prefixes and Suffixes",
      level: item.level,
      phase: item.phase,
      difficultyLevel: item.level,
      itemType: "suffix",
      targetWord: item.targetWord,
      answer: item.pattern,
      correctAnswer: item.pattern,
      prompt: `Choose the suffix in ${item.targetWord}.`,
      question: `Choose the suffix in ${item.targetWord}.`,
      answerOptions: options,
      choices: options.map(option => option.value),
      options,
      formatType: "PREFIX_SUFFIX_TEXT_CHOICE",
      templateType: "WORKBOOK_SUFFIX_TEXT_CHOICE",
      questionType: "PREFIX_SUFFIX_TEXT_CHOICE",
      mediaTarget: `workbook:suffix:${slugWord(item.targetWord)}`,
      source: "skill_word_bank_workbook",
      sourceSheet: item.sourceSheet,
      sourceRow: item.sourceRow
    });
  }

  const antonymPairs = data.antonymSynonymPairs.filter(item => !item.malformed && item.pattern.includes("antonym"));
  const synonymPairs = data.antonymSynonymPairs.filter(item => !item.malformed && item.pattern.includes("synonym"));
  const relationshipPools = {
    antonym: antonymPairs.flatMap(item => [item.targetWord, item.pairedWord]),
    synonym: synonymPairs.flatMap(item => [item.targetWord, item.pairedWord])
  };
  for (const [index, item] of data.antonymSynonymPairs.entries()) {
    if (item.malformed) continue;
    const relationship = item.pattern.includes("synonym") ? "synonym" : "antonym";
    const options = makeLanguageOptions(item.pairedWord, relationshipPools[relationship], index);
    if (options.length !== 4) continue;
    const imagePath = pickMediaPath(item.targetWord, item.skillId, "image", languageImageRole(item.skillId, relationship));
    questions.push({
      id: `workbook_${relationship}_${slugWord(item.targetWord)}_${index}`,
      skillId: "antonyms_synonyms",
      assessmentSkillId: "antonyms_synonyms",
      skillName: "Antonyms and Synonyms",
      level: item.level,
      phase: item.phase,
      difficultyLevel: item.level,
      itemType: relationship,
      targetWord: item.targetWord,
      answer: item.pairedWord,
      correctAnswer: item.pairedWord,
      prompt: relationship === "synonym" ? `Choose a word that means the same as ${item.targetWord}.` : `Choose a word that means the opposite of ${item.targetWord}.`,
      question: relationship === "synonym" ? `Choose a word that means the same as ${item.targetWord}.` : `Choose a word that means the opposite of ${item.targetWord}.`,
      answerOptions: options,
      choices: options.map(option => option.value),
      options,
      formatType: "LANGUAGE_PAIR_TEXT_CHOICE",
      templateType: `WORKBOOK_${relationship.toUpperCase()}_TEXT_CHOICE`,
      runtimeTemplateKey: runtimeTemplateKey(relationship, item.level, item.phase, item.targetWord, item.pairedWord),
      questionType: "LANGUAGE_PAIR_TEXT_CHOICE",
      imagePath: imagePath || undefined,
      imageUrl: imagePath || undefined,
      mediaTarget: `workbook:${relationship}:${slugWord(item.targetWord)}`,
      source: "skill_word_bank_workbook",
      sourceSheet: item.sourceSheet,
      sourceRow: item.sourceRow
    });
  }

  const homophonePool = [...new Set(data.homophoneHomonymSets.flatMap(item => item.words || []).filter(Boolean))];
  for (const [index, item] of data.homophoneHomonymSets.entries()) {
    if (item.malformed || !item.words?.length) continue;
    const answer = item.words[0];
    const options = makeLanguageOptions(answer, homophonePool, index);
    if (options.length !== 4) continue;
    const imagePath = pickMediaPath(answer, item.skillId, "image", languageImageRole(item.skillId, "homophone_homonym"));
    questions.push({
      id: `workbook_homophones_${slugWord(answer)}_${index}`,
      skillId: "homophones_homonyms",
      assessmentSkillId: "homophones_homonyms",
      skillName: "Homophones and Homonyms",
      level: 2,
      phase: 2,
      difficultyLevel: 2,
      itemType: "homophone_homonym",
      targetWord: answer,
      answer,
      correctAnswer: answer,
      prompt: `Choose the word from this set: ${item.words.join(", ")}.`,
      question: `Choose the word from this set: ${item.words.join(", ")}.`,
      answerOptions: options,
      choices: options.map(option => option.value),
      options,
      formatType: "HOMOPHONE_SET_TEXT_CHOICE",
      templateType: "WORKBOOK_HOMOPHONE_SET_TEXT_CHOICE",
      runtimeTemplateKey: runtimeTemplateKey("homophone", answer, item.words.join("-"), index),
      questionType: "HOMOPHONE_SET_TEXT_CHOICE",
      imagePath: imagePath || undefined,
      imageUrl: imagePath || undefined,
      mediaTarget: `workbook:homophone:${slugWord(answer)}`,
      source: "skill_word_bank_workbook",
      sourceSheet: item.sourceSheet,
      sourceRow: item.sourceRow
    });
  }

  return questions;
}

function generateSkillWordBankModule(data) {
  return `// Generated by tools/importSkillWordBankWorkbook.js. Do not hand-edit.\n\nexport const skillWordBankSourcePath = ${JSON.stringify(data.sourceWorkbook)};\nexport const skillWordBankGeneratedAt = ${JSON.stringify(data.generatedAt)};\nexport const skillWordBank = ${JSON.stringify(data, null, 2)};\n`;
}

function generateLanguageModule(questions) {
  return `// Generated by tools/importSkillWordBankWorkbook.js from normalized workbook language rows. Do not hand-edit.\n\nexport const languageSkillQuestions = ${JSON.stringify(questions, null, 2)};\n`;
}

async function main() {
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found: ${path.relative(repoRoot, workbookPath)}`);
  }
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.mkdirSync(validationDir, { recursive: true });
  const workbook = makeWorkbookAdapter(readWorkbookWithPython());
  const data = parseWorkbookData(workbook);
  const languageQuestions = generateLanguageQuestions(data);
  writeFile(skillWordBankPath, generateSkillWordBankModule(data));
  writeFile(hfwQuestionsPath, generateHfwModule(data));
  writeFile(languageQuestionsPath, generateLanguageModule(languageQuestions));

  const hfwCounts = Object.fromEntries(Object.values(HFW_BANDS).map(config => [config.skillId, data.hfwSentences.filter(item => item.skillId === config.skillId && item.targetPresent).length]));
  const languageCounts = languageQuestions.reduce((counts, question) => {
    counts[question.skillId] = (counts[question.skillId] || 0) + 1;
    return counts;
  }, {});
  console.log("Imported skill word-bank workbook.");
  console.log(JSON.stringify({
    workbook: path.relative(repoRoot, workbookPath),
    generated: [path.relative(repoRoot, skillWordBankPath), path.relative(repoRoot, hfwQuestionsPath), path.relative(repoRoot, languageQuestionsPath)],
    hfwCounts,
    languageCounts
  }, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
