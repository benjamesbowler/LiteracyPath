import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  inferFinalSound,
  inferInitialSound,
  inferMedialVowel,
  inferOnset,
  inferPhonicsTags,
  inferRime,
  inferSyllables,
  inferSyllableType,
  inferVowelPattern,
  normalizeLexiconWord
} from "../src/utils/phonics/phonicsHeuristics.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = "/Users/benjaminbowler/Desktop/Literacy Path Past Assets/Kimi New Vocabulary 500 Media Pairs";
const sourceMediaRoot = path.join(sourceRoot, "public", "media", "vocabulary");
const targetImageDir = path.join(repoRoot, "public", "media", "vocabulary", "images");
const targetAudioDir = path.join(repoRoot, "public", "media", "vocabulary", "audio");
const docsDir = path.join(repoRoot, "docs", "assets");
const applyImport = process.argv.includes("--apply");

const SIMPLE_FINAL_SOUNDS = new Set(["b", "d", "g", "l", "m", "n", "p", "t"]);
const SHORT_VOWELS = new Set(["a", "e", "i", "o", "u"]);
const ABSTRACT_OR_SPATIAL = new Set([
  "above", "around", "below", "beside", "between", "dark", "dirty", "empty", "far",
  "full", "hard", "heavy", "inside", "light", "near", "outside", "over", "round",
  "short", "slow", "soft", "through", "under"
]);
const RISKY_WORDS = new Set(["rob", "sob", "mob", "job", "thumb"]);
const ACTION_WORDS = new Set([
  "bend", "clap", "climb", "crawl", "dig", "draw", "drink", "drop", "hop", "jump",
  "kick", "laugh", "lift", "mix", "paint", "pull", "push", "read", "ride", "roll",
  "run", "sit", "sleep", "swim", "throw", "wash", "wave"
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function normalizeWord(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactWord(word) {
  return normalizeLexiconWord(word).replace(/[\s-]/g, "");
}

function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function hasInitialBlend(word) {
  return inferPhonicsTags(word).includes("initial-blend");
}

function hasDigraph(word) {
  const tags = inferPhonicsTags(word);
  return tags.includes("initial-digraph") || tags.includes("complex-final-sound");
}

function getBlendInitial(word) {
  const compact = compactWord(word);
  return ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "sc", "sk", "sl", "sm", "sn", "sp", "st", "sw", "tr", "tw"]
    .find(pattern => compact.startsWith(pattern)) || null;
}

function getBlendFinal(word) {
  const compact = compactWord(word);
  return ["ft", "ld", "lk", "mp", "nd", "nt", "sk", "sp", "st"]
    .find(pattern => compact.endsWith(pattern)) || null;
}

function getDigraphInitial(word) {
  const compact = compactWord(word);
  return ["ch", "sh", "th", "wh", "ph", "kn", "wr"].find(pattern => compact.startsWith(pattern)) || null;
}

function getDigraphFinal(word) {
  const compact = compactWord(word);
  return ["ch", "sh", "th", "ck", "ng"].find(pattern => compact.endsWith(pattern)) || null;
}

function getVowelTeam(word) {
  const compact = compactWord(word);
  return ["ai", "ay", "ea", "ee", "oa", "oe", "oi", "oy", "oo", "ou", "ow", "ue", "ui"]
    .find(pattern => compact.includes(pattern)) || null;
}

function getRControlled(word) {
  const compact = compactWord(word);
  return ["ar", "er", "ir", "or", "ur"].find(pattern => compact.includes(pattern)) || null;
}

function isSimpleCvc(word) {
  return /^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/u.test(compactWord(word));
}

function categoryForWord(word, cleanItem, manifestItem) {
  if (ACTION_WORDS.has(word)) return "action";
  if (cleanItem?.category?.includes("adjective")) return "adjective";
  if (cleanItem?.category?.includes("preposition") || ABSTRACT_OR_SPATIAL.has(word)) return "spatial_or_concept";
  if (manifestItem?.category) return manifestItem.category;
  return cleanItem?.category || "vocabulary";
}

function difficultyFor(word, cleanItem) {
  const syllables = inferSyllables(word);
  const vowelPattern = inferVowelPattern(word);
  const tags = inferPhonicsTags(word);

  if (RISKY_WORDS.has(word)) return "review_only";
  if (ABSTRACT_OR_SPATIAL.has(word)) return "level_2";
  if (isSimpleCvc(word)) return "level_1";
  if (syllables === 1 && SIMPLE_FINAL_SOUNDS.has(inferFinalSound(word)) && !hasInitialBlend(word) && !hasDigraph(word) && vowelPattern !== "silent-e") {
    return "level_1_stretch";
  }
  if (cleanItem?.category === "final_sounds_b" && ["cube", "tube", "robe"].includes(word)) return "level_2";
  if (vowelPattern === "silent-e" || vowelPattern === "vowel-team" || vowelPattern === "bossy-r") return "level_2";
  if (tags.includes("initial-blend") || tags.includes("initial-digraph") || tags.includes("complex-final-sound")) return "level_2";
  if (syllables > 1) return "level_3";
  return "level_2";
}

function recommendedLevelForBand(band) {
  if (band === "level_1") return 1;
  if (band === "level_1_stretch" || band === "level_2") return 2;
  if (band === "level_3") return 3;
  return null;
}

function skillsFor(word, band, category) {
  const initialSound = inferInitialSound(word);
  const finalSound = inferFinalSound(word);
  const rimeFamily = inferRime(word);
  const vowelPattern = inferVowelPattern(word);
  const cvc = isSimpleCvc(word);
  const levelOne = band === "level_1";
  const stretch = band === "level_1_stretch";
  const minLevel = recommendedLevelForBand(band) || 3;

  return {
    initialSounds: { eligible: Boolean(initialSound), minLevel: levelOne || stretch ? 1 : minLevel },
    finalSounds: { eligible: SIMPLE_FINAL_SOUNDS.has(finalSound), minLevel: levelOne ? 1 : minLevel },
    rhyming: { eligible: Boolean(rimeFamily), minLevel: levelOne ? 1 : minLevel, rimeFamily },
    cvcShortVowels: { eligible: cvc, minLevel: cvc ? 1 : minLevel },
    blends: { eligible: Boolean(getBlendInitial(word) || getBlendFinal(word)), minLevel: 2 },
    digraphs: { eligible: Boolean(getDigraphInitial(word) || getDigraphFinal(word)), minLevel: 2 },
    longVowelsSilentE: { eligible: vowelPattern === "silent-e", minLevel: 2 },
    vowelTeams: { eligible: Boolean(getVowelTeam(word)), minLevel: 2 },
    rControlledVowels: { eligible: Boolean(getRControlled(word)), minLevel: 2 },
    vocabulary: { eligible: true, minLevel: Math.min(minLevel || 3, 2), category }
  };
}

function makeLexiconEntry(item, cleanItem, classification) {
  const word = normalizeWord(item.word);
  const compact = compactWord(word);
  const band = classification.difficultyBand;
  const category = categoryForWord(word, cleanItem, item);
  const shortVowel = isSimpleCvc(word) && SHORT_VOWELS.has(inferMedialVowel(word))
    ? `short_${inferMedialVowel(word)}`
    : null;

  return {
    word,
    normalizedWord: word,
    displayWord: word.replace(/-/g, " "),
    imagePath: `/media/vocabulary/images/${word}.webp`,
    audioPath: `/media/vocabulary/audio/${word}.mp3`,
    status: classification.lexiconStatus,
    source: "kimi_vocab_expansion_500",
    recommendedLevel: recommendedLevelForBand(band),
    difficultyBand: band,
    isConcrete: !ABSTRACT_OR_SPATIAL.has(word),
    isImageable: true,
    isDecodable: band === "level_1" || band === "level_1_stretch" || band === "level_2",
    isAbstract: ABSTRACT_OR_SPATIAL.has(word),
    tags: [...new Set([category, item.category, cleanItem?.category, ...inferPhonicsTags(word)].filter(Boolean))].sort(),
    phonics: {
      initialSound: inferInitialSound(word),
      finalSound: inferFinalSound(word),
      medialVowel: inferMedialVowel(word) || null,
      cvc: isSimpleCvc(word),
      cvce: inferVowelPattern(word) === "silent-e",
      shortVowel,
      longVowel: inferVowelPattern(word) === "silent-e" ? inferMedialVowel(word) || null : null,
      rimeFamily: inferRime(word),
      onset: inferOnset(word) || null,
      blendInitial: getBlendInitial(word),
      blendFinal: getBlendFinal(word),
      digraphInitial: getDigraphInitial(word),
      digraphFinal: getDigraphFinal(word),
      vowelTeam: getVowelTeam(word),
      rControlled: getRControlled(word),
      syllableCount: inferSyllables(word),
      syllableType: inferSyllableType(word),
      vowelPattern: inferVowelPattern(word)
    },
    skills: skillsFor(word, band, category),
    notes: classification.notes
  };
}

const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "manifest.json"), "utf8"));
const cleanPlan = readJson("docs/assets/kimi_vocab_expansion_500_clean.json");
const usableInventory = readJson("docs/assets/usable_vocab_media_inventory.json").inventory || [];
const cleanByWord = new Map(cleanPlan.map(item => [normalizeWord(item.word), item]));
const existingApproved = new Set(
  usableInventory
    .filter(item => item.usableImage && item.usableAudio && item.usablePair && item.recommendedStatus === "approved")
    .map(item => normalizeWord(item.word))
);

const manifestWords = new Set();
const records = manifest.map(rawItem => {
  const word = normalizeWord(rawItem.word);
  manifestWords.add(word);
  const cleanItem = cleanByWord.get(word);
  const sourceImagePath = path.join(sourceMediaRoot, "images", `${word}.webp`);
  const sourceAudioPath = path.join(sourceMediaRoot, "audio", `${word}.mp3`);
  const imageExists = fs.existsSync(sourceImagePath);
  const audioExists = fs.existsSync(sourceAudioPath);
  const imageSize = fileSize(sourceImagePath);
  const audioSize = fileSize(sourceAudioPath);
  const issues = [];

  if (!cleanItem) issues.push("unexpected word not present in clean 500 request");
  if (existingApproved.has(word)) issues.push("duplicate of existing approved usable media pair");
  if (!imageExists) issues.push("missing image");
  if (!audioExists) issues.push("missing audio");
  if (imageExists && imageSize < 2_000) issues.push("suspicious tiny image file");
  if (audioExists && audioSize < 1_000) issues.push("suspicious tiny audio file");
  if (RISKY_WORDS.has(word)) issues.push("risky or unsuitable word for current K-2 media pack");

  const band = difficultyFor(word, cleanItem);
  let status = "imported_reserve";
  let lexiconStatus = "approved";
  if (band === "level_1" || band === "level_1_stretch") status = "imported_approved";
  if (band === "review_only") {
    status = "needs_review";
    lexiconStatus = "needs_review";
  }
  if (existingApproved.has(word)) {
    status = "duplicate_existing_approved";
    lexiconStatus = "duplicate_existing_approved";
  }
  if (!imageExists) {
    status = "missing_image";
    lexiconStatus = "missing_image";
  }
  if (!audioExists) {
    status = "missing_audio";
    lexiconStatus = "missing_audio";
  }
  if (!cleanItem || (imageExists && imageSize < 2_000) || (audioExists && audioSize < 1_000) || RISKY_WORDS.has(word)) {
    status = status.startsWith("missing_") || status === "duplicate_existing_approved" ? status : "needs_review";
    lexiconStatus = lexiconStatus === "approved" ? "needs_review" : lexiconStatus;
  }

  const imported = ["imported_approved", "imported_reserve"].includes(status);
  const classification = {
    word,
    status,
    imported,
    lexiconStatus,
    difficultyBand: band,
    recommendedLevel: recommendedLevelForBand(band),
    category: categoryForWord(word, cleanItem, rawItem),
    sourceImagePath,
    sourceAudioPath,
    imagePath: `/media/vocabulary/images/${word}.webp`,
    audioPath: `/media/vocabulary/audio/${word}.mp3`,
    imageExists,
    audioExists,
    imageSize,
    audioSize,
    expectedInCleanRequest: Boolean(cleanItem),
    duplicateExistingApproved: existingApproved.has(word),
    targetSkills: cleanItem?.targetSkills || [],
    priority: cleanItem?.priority || "reserve",
    reason: cleanItem?.reason || "",
    sourceCategory: rawItem.category || "",
    batch: rawItem.batch || cleanItem?.batch || null,
    issues,
    notes: issues.length
      ? issues.join("; ")
      : band === "level_1" || band === "level_1_stretch"
        ? "Approved exact media pair; eligible for future simple-skill use after question-bank validation."
        : "Approved exact media pair held as reserve for Level 2+ or vocabulary expansion."
  };

  return {
    ...classification,
    lexiconEntry: imported ? makeLexiconEntry(rawItem, cleanItem, classification) : null
  };
});

const duplicatesInManifest = [...manifestWords].filter((word, index, all) => all.indexOf(word) !== index);
const importedRecords = records.filter(record => record.imported);
const lexiconEntries = importedRecords.map(record => record.lexiconEntry);
const audioPreferences = Object.fromEntries(importedRecords.map(record => [
  record.word,
  {
    key: record.word,
    word: record.word,
    textSpoken: record.word.replace(/-/g, " "),
    preferredAudioPath: record.audioPath,
    deprecatedAudioPaths: [],
    reviewNeededPaths: [],
    source: "kimi_vocab_expansion_500",
    status: "approved",
    notes: record.status === "imported_approved"
      ? "Approved exact-word vocabulary audio from Kimi 500 pack; available for future validated skill use."
      : "Approved exact-word vocabulary audio from Kimi 500 pack; held as reserve for Level 2+ or vocabulary use."
  }
]));

if (applyImport) {
  fs.mkdirSync(targetImageDir, { recursive: true });
  fs.mkdirSync(targetAudioDir, { recursive: true });
  for (const record of importedRecords) {
    fs.copyFileSync(record.sourceImagePath, path.join(targetImageDir, `${record.word}.webp`));
    fs.copyFileSync(record.sourceAudioPath, path.join(targetAudioDir, `${record.word}.mp3`));
  }

  fs.writeFileSync(
    path.join(repoRoot, "src", "data", "kimiVocabulary500Lexicon.js"),
    `// Generated by tools/auditKimiVocabularyMediaImport.js. Do not edit by hand.\n\nexport const kimiVocabulary500Lexicon = ${JSON.stringify(lexiconEntries, null, 2)};\n\nexport const kimiVocabulary500LexiconByWord = new Map(kimiVocabulary500Lexicon.map(entry => [entry.normalizedWord, entry]));\n`,
    "utf8"
  );

  fs.writeFileSync(
    path.join(repoRoot, "src", "data", "kimiVocabulary500AudioPreferences.js"),
    `// Generated by tools/auditKimiVocabularyMediaImport.js. Do not edit by hand.\n\nexport const kimiVocabulary500AudioPreferences = ${JSON.stringify(audioPreferences, null, 2)};\n`,
    "utf8"
  );
}

const counts = records.reduce((acc, record) => {
  acc[record.status] = (acc[record.status] || 0) + 1;
  acc.total += 1;
  if (record.imported) acc.imported += 1;
  return acc;
}, { total: 0, imported: 0 });
const levelCounts = records.reduce((acc, record) => {
  acc[record.difficultyBand] = (acc[record.difficultyBand] || 0) + 1;
  return acc;
}, {});
const skillCounts = lexiconEntries.reduce((acc, entry) => {
  for (const [skill, config] of Object.entries(entry.skills || {})) {
    if (config?.eligible) acc[skill] = (acc[skill] || 0) + 1;
  }
  return acc;
}, {});

const manifestOutput = {
  generatedAt: new Date().toISOString(),
  sourceFolder: sourceRoot,
  targetImageDir: "/public/media/vocabulary/images",
  targetAudioDir: "/public/media/vocabulary/audio",
  applyImport,
  counts,
  levelCounts,
  skillCounts,
  duplicatesInManifest,
  records: records.map(({ sourceImagePath, sourceAudioPath, lexiconEntry, ...record }) => record)
};

fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, "kimi_vocab_500_import_manifest.json"), JSON.stringify(manifestOutput, null, 2), "utf8");

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, " ")).join(" | ")} |`)
  ].join("\n");
}

const problemRows = records
  .filter(record => !record.imported)
  .slice(0, 80)
  .map(record => [record.word, record.status, record.difficultyBand, record.issues.join("; ") || record.notes]);
const qaLevelOne = records.filter(record => record.status === "imported_approved").slice(0, 20).map(record => record.word);
const qaReserve = records.filter(record => record.status === "imported_reserve").slice(0, 20).map(record => record.word);
const qaFinalB = records.filter(record => ["cub", "cab", "bib", "rub", "knob", "lab", "sub", "crib", "grab", "club", "blob", "cob", "dab", "tube", "cube", "robe", "bulb", "curb", "orb"].includes(record.word)).map(record => record.word);

fs.writeFileSync(path.join(docsDir, "kimi_vocab_500_import_audit.md"), [
  "# Kimi Vocabulary 500 Import Audit",
  "",
  `- Source folder: \`${sourceRoot}\``,
  "- Existing lexicon: `src/content/lexicon/masterWordLexicon.js` builds a runtime lexicon from question banks.",
  "- Added reserve lexicon: `src/data/kimiVocabulary500Lexicon.js` stores imported Kimi vocabulary media with safe metadata.",
  "- Audio source of truth: `src/data/audioPreferenceManifest.js`, extended through `src/data/kimiVocabulary500AudioPreferences.js`.",
  "- Media resolution: app paths resolve from `/public`, with imported vocabulary media under `/media/vocabulary/images/` and `/media/vocabulary/audio/`.",
  "",
  "## Counts",
  "",
  table(["Metric", "Count"], [
    ["Manifest words", counts.total],
    ["Expected clean-list words matched", records.filter(record => record.expectedInCleanRequest).length],
    ["Image files found", records.filter(record => record.imageExists).length],
    ["Audio files found", records.filter(record => record.audioExists).length],
    ["Imported app-ready pairs", counts.imported],
    ["Imported approved Level 1 / stretch", counts.imported_approved || 0],
    ["Imported reserve Level 2+", counts.imported_reserve || 0],
    ["Needs review", counts.needs_review || 0],
    ["Rejected/missing/duplicate", records.filter(record => !record.imported && record.status !== "needs_review").length],
    ["Duplicate existing approved", counts.duplicate_existing_approved || 0],
    ["Missing image", counts.missing_image || 0],
    ["Missing audio", counts.missing_audio || 0]
  ]),
  "",
  "## Difficulty Distribution",
  "",
  table(["Band", "Count"], Object.entries(levelCounts).sort().map(([key, value]) => [key, value])),
  "",
  "## Skill Metadata Distribution",
  "",
  table(["Skill", "Eligible imported words"], Object.entries(skillCounts).sort().map(([key, value]) => [key, value])),
  "",
  "## Problem Examples",
  "",
  problemRows.length ? table(["Word", "Status", "Band", "Notes"], problemRows) : "_No missing, duplicate, rejected, or review-only records._",
  "",
  "## Manual QA Checklist",
  "",
  `- 20 Level 1 / stretch words: ${qaLevelOne.join(", ") || "none"}`,
  `- 20 reserve words: ${qaReserve.join(", ") || "none"}`,
  `- Final /b/ focus words: ${qaFinalB.join(", ") || "none"}`,
  `- Needs-review words: ${records.filter(record => record.status === "needs_review").map(record => record.word).join(", ") || "none"}`,
  "- Spot-check each listed word for exact object/action match, no text/watermarks, natural colors, and audio saying the target word only.",
  "",
  "## Safety Notes",
  "",
  "- No live question-bank selection logic was changed.",
  "- Imported reserve media is available to future validated generators but is not automatically active in Level 1.",
  "- Harder phonics patterns, multisyllable items, abstract/spatial words, silent-e, vowel-team, r-controlled, blend, and digraph words are level-gated as reserve."
].join("\n"), "utf8");

fs.writeFileSync(path.join(docsDir, "kimi_vocab_500_lexicon_summary.md"), [
  "# Kimi Vocabulary 500 Lexicon Summary",
  "",
  `- Imported lexicon entries: ${lexiconEntries.length}`,
  `- Approved exact image/audio pairs added to vocabulary media folders: ${counts.imported}`,
  `- Level 1 / stretch reserve entries: ${(counts.imported_approved || 0)}`,
  `- Level 2+ reserve entries: ${(counts.imported_reserve || 0)}`,
  "",
  "## Counts By Difficulty",
  "",
  table(["Difficulty band", "Words"], Object.entries(levelCounts).sort().map(([key, value]) => [key, value])),
  "",
  "## Counts By Skill Support",
  "",
  table(["Skill", "Words"], Object.entries(skillCounts).sort().map(([key, value]) => [key, value])),
  "",
  "## Remaining Gaps",
  "",
  "- Automated checks confirm file presence and metadata consistency, but visual/audio exactness still needs human spot QA.",
  "- New media is intentionally not wired directly into active assessment question banks in this pass.",
  "- Future generators can draw from `kimiVocabulary500Lexicon` using `difficultyBand` and `skills.*.minLevel` gates."
].join("\n"), "utf8");

console.log(`Kimi vocabulary import audit complete. Found ${counts.total}, imported ${counts.imported}.`);
console.log(`Approved/stretch: ${counts.imported_approved || 0}; reserve: ${counts.imported_reserve || 0}; needs review: ${counts.needs_review || 0}; duplicates: ${counts.duplicate_existing_approved || 0}.`);
if (!applyImport) console.log("Dry run only. Re-run with --apply to copy assets and generate src/data manifests.");
