import fs from "node:fs";
import path from "node:path";
import { discoverBookIds, getBookRawDir, repoRoot, writeJson } from "./shared.js";
import { extractRawText } from "./extractText.js";
import { normalizeText } from "./normalizeText.js";

const COMMON_WORDS = new Set(
  "a about after all am an and are as at away be big but by came can come day did do down for from get go good had has have he her here him his i in into is it like little look make me my no not of on one out play put red run said saw see she so the them then there they this to too two up was we went were what when where who will with you".split(" ")
);

function splitWords(text) {
  return normalizeText(text).toLowerCase().match(/[a-z']+/g) || [];
}

export function scoreTextQuality(text = "") {
  const clean = normalizeText(text);
  const words = splitWords(clean);
  const chars = clean.length || 1;
  const weirdSymbols = (clean.match(/[^\w\s.,!?;:'"()\-]/g) || []).length;
  const malformedWords = words.filter(word =>
    word.length > 18 ||
    /(.)\1{4,}/.test(word) ||
    /[bcdfghjklmnpqrstvwxyz]{6,}/.test(word)
  ).length;
  const sentences = clean.split(/[.!?]+/).map(sentence => sentence.trim()).filter(Boolean);
  const sentenceWords = sentences.map(sentence => splitWords(sentence).length).filter(Boolean);
  const averageSentenceLength = sentenceWords.length
    ? sentenceWords.reduce((sum, count) => sum + count, 0) / sentenceWords.length
    : 0;
  const dictionaryLikeWords = words.filter(word =>
    COMMON_WORDS.has(word) ||
    /^[a-z]{1,12}$/.test(word)
  ).length;
  const uppercaseRuns = (clean.match(/\b[A-Z]{5,}\b/g) || []).length;
  const punctuationRuns = (clean.match(/[.,!?;:]{2,}/g) || []).length;

  const weirdSymbolDensity = weirdSymbols / chars;
  const malformedWordRate = words.length ? malformedWords / words.length : 0;
  const dictionaryLikeRate = words.length ? dictionaryLikeWords / words.length : 0;
  const uppercaseCorruptionRate = words.length ? uppercaseRuns / words.length : 0;
  const punctuationCorruptionRate = chars ? punctuationRuns / chars : 0;

  const riskScore =
    weirdSymbolDensity * 240 +
    malformedWordRate * 120 +
    Math.max(0, 0.88 - dictionaryLikeRate) * 80 +
    uppercaseCorruptionRate * 160 +
    punctuationCorruptionRate * 160 +
    (averageSentenceLength > 22 ? 15 : 0);

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    averageSentenceLength: Number(averageSentenceLength.toFixed(1)),
    weirdSymbolDensity: Number(weirdSymbolDensity.toFixed(4)),
    malformedWordRate: Number(malformedWordRate.toFixed(4)),
    dictionaryLikeRate: Number(dictionaryLikeRate.toFixed(4)),
    uppercaseCorruptionRate: Number(uppercaseCorruptionRate.toFixed(4)),
    punctuationCorruptionRate: Number(punctuationCorruptionRate.toFixed(4)),
    riskScore: Number(riskScore.toFixed(1)),
    needsManualCleanup: riskScore >= 25 || words.length < 30,
    readabilityBand: averageSentenceLength <= 8 ? "emergent" : averageSentenceLength <= 14 ? "early" : averageSentenceLength <= 22 ? "developing" : "read-aloud"
  };
}

export async function scoreAllTextQuality() {
  const rows = [];
  for (const bookId of discoverBookIds()) {
    let text = "";
    let error = "";
    try {
      text = extractRawText({ bookId });
    } catch (caught) {
      error = caught.message;
    }
    rows.push({
      bookId,
      ...scoreTextQuality(text),
      error
    });
  }

  const reportPath = path.join(repoRoot, "docs/guided-reading/text_quality_report.json");
  writeJson(reportPath, {
    generatedAt: new Date().toISOString(),
    rows
  });
  return { reportPath, rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scoreAllTextQuality()
    .then(({ reportPath, rows }) => {
      console.log(`Scored ${rows.length} public-domain text source(s).`);
      console.log(`Wrote ${reportPath}`);
    })
    .catch(error => {
      console.error(error.message);
      process.exit(1);
    });
}

