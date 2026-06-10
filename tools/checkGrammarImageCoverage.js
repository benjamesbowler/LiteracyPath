import path from "node:path";

import { getChildWordAsset } from "../src/data/childAssets.js";
import { getImportedVocabularyMedia } from "../src/data/importedVocabularyMediaManifest.js";
import { getLexiconEntry } from "../src/content/lexicon/masterWordLexicon.js";
import {
  getCoreSkillId,
  loadCoreQuestionPool,
  normalizeWord,
  publicPathExists,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const POS_SKILLS = {
  nouns: "noun",
  verbs: "verb",
  adjectives: "adjective"
};

const REPORT_PATH = path.join(repoRoot, "docs/validation/grammar_image_coverage_audit.md");
const REQUEST_PATH = path.join(repoRoot, "docs/assets/kimi_missing_grammar_images_request.md");

function slugWord(value = "") {
  return normalizeWord(value).replace(/\s+/g, "-");
}

function titleCase(value = "") {
  return String(value || "").replace(/\b[a-z]/g, char => char.toUpperCase());
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function splitWordList(value = "") {
  const text = String(value || "")
    .toLowerCase()
    .replace(/[“”"'?.!()]/g, "")
    .replace(/\band\b/g, ",");

  return text
    .split(/[,;/|]+/)
    .map(part => normalizeWord(part))
    .flatMap(part => part.split(/\s+/))
    .map(word => word.trim())
    .filter(word => /^[a-z]+$/.test(word));
}

function choiceValue(choice) {
  if (choice && typeof choice === "object") {
    return choice.value || choice.word || choice.label || choice.text || choice.answer || "";
  }
  return choice || "";
}

function candidateImagePathsForValue(question = {}, value = "") {
  const normalized = normalizeWord(value);
  const paths = [];
  const addIfMatching = item => {
    if (!item || typeof item !== "object") return;
    const itemValue = normalizeWord(item.value || item.word || item.label || item.text || item.answer);
    if (itemValue !== normalized) return;
    paths.push(item.image, item.imageUrl, item.imagePath, item.picture, item.media?.image);
  };

  toArray(question.answerOptions).forEach(addIfMatching);
  toArray(question.options).forEach(addIfMatching);
  toArray(question.choices).forEach(addIfMatching);
  toArray(question.imageCards).forEach(addIfMatching);
  toArray(question.promptImageCards).forEach(addIfMatching);

  Object.entries(question.choiceImages || {}).forEach(([key, asset]) => {
    if (normalizeWord(key) !== normalized) return;
    paths.push(asset?.image, asset?.imageUrl, asset?.imagePath);
  });

  const targetValue = normalizeWord(question.targetWord || question.itemKey || question.word || "");
  if (targetValue === normalized) {
    paths.push(question.image, question.imageUrl, question.imagePath, question.targetImage, question.targetImageUrl, question.targetImagePath);
  }

  return paths.filter(Boolean);
}

function existingFilePaths(paths = []) {
  return paths.filter(assetPath =>
    String(assetPath || "").startsWith("/") && publicPathExists(assetPath)
  );
}

function resolveWordImage(word, pos, observedPaths = []) {
  const normalized = normalizeWord(word);
  const slug = slugWord(normalized);
  const childAsset = getChildWordAsset(normalized);
  const importedAsset = getImportedVocabularyMedia(normalized);
  const lexiconEntry = getLexiconEntry(normalized);
  const candidates = [
    ...observedPaths,
    `/media/vocabulary/images/${pos}-${slug}.webp`,
    childAsset?.image,
    childAsset?.fallbackImage,
    importedAsset?.image,
    importedAsset?.imageUrl,
    importedAsset?.imagePath,
    lexiconEntry?.imageUrl,
    lexiconEntry?.image,
    lexiconEntry?.imagePath
  ].filter(Boolean);
  const filePaths = existingFilePaths(candidates);
  return {
    hasFileImage: filePaths.length > 0,
    filePaths: [...new Set(filePaths)],
    inlinePlaceholders: candidates.filter(candidate => String(candidate).startsWith("data:image/")).length
  };
}

function registerWord(records, pos, word, question, observedPaths = []) {
  const normalized = normalizeWord(word);
  if (!normalized || !/^[a-z]+$/.test(normalized)) return;
  const key = `${pos}:${normalized}`;
  const current = records.get(key) || {
    partOfSpeech: pos,
    word: normalized,
    questionIds: new Set(),
    sources: new Set(),
    observedPaths: []
  };
  if (question?.id) current.questionIds.add(question.id);
  if (question?._source) current.sources.add(question._source);
  current.observedPaths.push(...observedPaths);
  records.set(key, current);
}

function buildCanonicalPosMap(questions) {
  const canonical = new Map();

  questions.forEach(question => {
    const skillId = getCoreSkillId(question);
    const pos = POS_SKILLS[skillId];
    if (!pos) return;

    toArray(question.imageCards).forEach(card => {
      const cardPos = card?.partOfSpeech;
      if (!["noun", "verb", "adjective"].includes(cardPos)) return;
      splitWordList(choiceValue(card)).forEach(word => canonical.set(word, cardPos));
    });

    toArray(question.answerOptions).forEach(option => {
      const optionPos = option?.partOfSpeech;
      if (!["noun", "verb", "adjective"].includes(optionPos)) return;
      splitWordList(choiceValue(option)).forEach(word => canonical.set(word, optionPos));
    });

    if (shouldTreatCorrectAnswerAsPosTarget(question)) {
      const answerWords = [
        ...splitWordList(question.answer),
        ...splitWordList(question.correctAnswer),
        ...toArray(question.correctAnswers).flatMap(splitWordList)
      ];
      answerWords.forEach(word => canonical.set(word, pos));
    }
  });

  return canonical;
}

function shouldTreatCorrectAnswerAsPosTarget(question = {}) {
  const prompt = `${question.question || ""} ${question.prompt || ""} ${question.spokenPrompt || ""}`.toLowerCase();
  if (question.itemType === "grammar_basic") return false;
  if (/\bnot\s+(a|an|the)?\s*(noun|verb|adjective)\b/.test(prompt)) return false;
  if (/\bwould\s+not\s+fit\b/.test(prompt)) return false;
  return true;
}

function collectGrammarRecords() {
  const questions = loadCoreQuestionPool().filter(question =>
    question.active !== false && POS_SKILLS[getCoreSkillId(question)]
  );
  const selectableIds = new Set(
    Object.keys(POS_SKILLS).flatMap(skillId =>
      selectableRuntimeQuestionsForSkill(skillId).map(question => question.id)
    )
  );
  const canonicalPos = buildCanonicalPosMap(questions);
  const records = new Map();

  questions.forEach(question => {
    const skillId = getCoreSkillId(question);
    const questionPos = POS_SKILLS[skillId];
    if (!questionPos) return;

    if (shouldTreatCorrectAnswerAsPosTarget(question)) {
      [
        question.answer,
        question.correctAnswer,
        ...toArray(question.correctAnswers)
      ].forEach(value => {
        splitWordList(value).forEach(word => {
          registerWord(records, questionPos, word, question, candidateImagePathsForValue(question, word));
        });
      });
    }

    [
      ...toArray(question.imageCards),
      ...toArray(question.answerOptions),
      ...toArray(question.choices),
      ...toArray(question.options)
    ].forEach(choice => {
      splitWordList(choiceValue(choice)).forEach(word => {
        const choicePos = choice?.partOfSpeech || canonicalPos.get(word);
        if (!["noun", "verb", "adjective"].includes(choicePos)) return;
        registerWord(records, choicePos, word, question, candidateImagePathsForValue(question, word));
      });
    });
  });

  return {
    questions,
    selectableIds,
    records: [...records.values()]
      .map(record => {
        return {
          ...record,
          questionIds: [...record.questionIds].sort(),
          sources: [...record.sources].sort(),
          ...resolveWordImage(record.word, record.partOfSpeech, record.observedPaths),
          selectableUseCount: [...record.questionIds].filter(id => selectableIds.has(id)).length
        };
      })
      .sort((a, b) => a.partOfSpeech.localeCompare(b.partOfSpeech) || a.word.localeCompare(b.word))
  };
}

function summarize(records) {
  return Object.values(POS_SKILLS).map(pos => {
    const items = records.filter(record => record.partOfSpeech === pos);
    const withImages = items.filter(record => record.hasFileImage);
    const missing = items.filter(record => !record.hasFileImage);
    return {
      partOfSpeech: pos,
      total: items.length,
      withImages: withImages.length,
      missing: missing.length
    };
  });
}

function requestPromptFor(record) {
  const word = record.word;
  if (record.partOfSpeech === "noun") {
    return `Child-friendly spot illustration of the noun "${word}" as one clear, recognizable person/place/thing. No text, no letters, no labels.`;
  }
  if (record.partOfSpeech === "verb") {
    return `Child-friendly spot illustration showing the action "${word}" clearly with one simple child/animal/object performing it. No text, no letters, no labels.`;
  }
  return `Child-friendly spot illustration showing the adjective "${word}" clearly through a simple object or scene. No text, no letters, no labels.`;
}

function buildReport({ records, questions, selectableIds }) {
  const summary = summarize(records);
  const missing = records.filter(record => !record.hasFileImage);
  const totalWithImages = records.filter(record => record.hasFileImage).length;
  const totalMissing = missing.length;

  const lines = [
    "# Grammar Image Coverage Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Scope: active app questions routed to Nouns, Verbs, and Adjectives. The audit counts unique POS vocabulary terms, including correct-answer targets and answer-choice words that can be tied to noun/verb/adjective metadata elsewhere in the grammar pool.",
    "",
    "Rule: a word only counts as having an image when a real file-backed image exists under `public/`. Inline generated SVG placeholders are treated as missing real image files.",
    "",
    `Active grammar questions checked: ${questions.length}`,
    `Selectable runtime grammar questions checked: ${selectableIds.size}`,
    `Unique noun/verb/adjective records with image files: ${totalWithImages}`,
    `Unique noun/verb/adjective records missing image files: ${totalMissing}`,
    "",
    "## Summary",
    "",
    "| Part of speech | Unique words | With image file | Missing image file |",
    "| --- | ---: | ---: | ---: |",
    ...summary.map(row => `| ${titleCase(row.partOfSpeech)} | ${row.total} | ${row.withImages} | ${row.missing} |`),
    "",
    "## Missing Image Files",
    "",
    "| Part of speech | Word | Uses | Example questions |",
    "| --- | --- | ---: | --- |",
    ...missing.map(record => `| ${record.partOfSpeech} | ${record.word} | ${record.questionIds.length} | ${record.questionIds.slice(0, 5).join(", ")} |`),
    "",
    "## Existing Image Files",
    "",
    "| Part of speech | Word | Image file |",
    "| --- | --- | --- |",
    ...records
      .filter(record => record.hasFileImage)
      .map(record => `| ${record.partOfSpeech} | ${record.word} | ${record.filePaths[0]} |`)
  ];

  return `${lines.join("\n")}\n`;
}

function buildKimiRequest(records) {
  const missing = records.filter(record => !record.hasFileImage);
  const lines = [
    "# Kimi Request: Missing Grammar Images",
    "",
    "Please generate one square or landscape child-friendly WebP image for each missing grammar vocabulary term below.",
    "",
    "Style requirements: bright early-reader illustration, simple uncluttered composition, clear silhouette, no written words, no letters, no labels, no watermark, safe classroom-friendly content.",
    "",
    "Suggested destination paths are designed for later import into the shared vocabulary media manifest.",
    "",
    `Total requested images: ${missing.length}`,
    "",
    "| Part of speech | Word | Suggested destination path | Prompt |",
    "| --- | --- | --- | --- |",
    ...missing.map(record => {
      const slug = slugWord(`${record.partOfSpeech}-${record.word}`);
      return `| ${record.partOfSpeech} | ${record.word} | /media/vocabulary/images/${slug}.webp | ${requestPromptFor(record)} |`;
    })
  ];

  return `${lines.join("\n")}\n`;
}

const result = collectGrammarRecords();
writeFile(REPORT_PATH, buildReport(result));
writeFile(REQUEST_PATH, buildKimiRequest(result.records));

const summary = summarize(result.records);
console.log("Grammar image coverage audit complete.");
summary.forEach(row => {
  console.log(`${row.partOfSpeech}: ${row.withImages} with image file, ${row.missing} missing, ${row.total} total`);
});
console.log(`Report: ${path.relative(repoRoot, REPORT_PATH)}`);
console.log(`Kimi request: ${path.relative(repoRoot, REQUEST_PATH)}`);
