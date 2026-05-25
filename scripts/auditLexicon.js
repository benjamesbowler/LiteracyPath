import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { masterWordLexicon } from "../src/content/lexicon/masterWordLexicon.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const reportPath = resolve(repoRoot, "docs/lexicon/lexicon_validation_report.md");
const autoTaggingReportPath = resolve(repoRoot, "docs/lexicon/auto_tagging_report.md");

function countBy(entries, key) {
  return entries.reduce((counts, entry) => {
    const value = entry[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function tableFromCounts(counts, label) {
  return [
    `| ${label} | Count |`,
    "| --- | ---: |",
    ...Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => `| ${key} | ${count} |`)
  ].join("\n");
}

const duplicateWords = masterWordLexicon
  .map(entry => entry.lowercaseWord)
  .filter((word, index, words) => words.indexOf(word) !== index);
const missingCoreTags = masterWordLexicon.filter(entry =>
  !entry.initialSound ||
  !entry.finalSound ||
  !entry.rime ||
  !entry.syllables
);
const missingMedia = masterWordLexicon.filter(entry => !entry.imageUrl && !entry.audioUrl);
const unresolved = masterWordLexicon.filter(entry => entry.syllableType === "unknown");

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  `# Lexicon Validation Report

Generated: ${new Date().toISOString()}

## Summary

- Total deduplicated words: ${masterWordLexicon.length}
- Duplicate normalized words after merge: ${duplicateWords.length}
- Missing core phonics tags: ${missingCoreTags.length}
- No linked image or audio: ${missingMedia.length}
- Unknown syllable type: ${unresolved.length}

## Initial Sound Coverage

${tableFromCounts(countBy(masterWordLexicon, "initialSound"), "Initial Sound")}

## Final Sound Coverage

${tableFromCounts(countBy(masterWordLexicon, "finalSound"), "Final Sound")}

## Vowel Pattern Coverage

${tableFromCounts(countBy(masterWordLexicon, "vowelPattern"), "Vowel Pattern")}

## Words Needing Manual QA

${missingCoreTags.slice(0, 80).map(entry => `- ${entry.word}: missing inferred core tag`).join("\n") || "- None"}

## Missing Media References

${missingMedia.slice(0, 80).map(entry => `- ${entry.word}`).join("\n") || "- None"}
`,
  "utf8"
);

writeFileSync(
  autoTaggingReportPath,
  `# Auto Tagging Report

Generated: ${new Date().toISOString()}

The master lexicon is built automatically from active literacy content and media-backed question banks. It deduplicates normalized words, then applies heuristic phonics tagging for initial sound, final sound, medial vowel, rime, syllable count, syllable type, and vowel pattern.

## Counts

- Total words scanned after dedupe: ${masterWordLexicon.length}
- Missing core phonics tags: ${missingCoreTags.length}
- Words with no linked media reference: ${missingMedia.length}
- Words with unknown syllable type: ${unresolved.length}

## Notes

- The lexicon is intentionally isolated from the app startup route to avoid loading generated content globally.
- Ambiguous cases remain available for manual QA rather than being guessed silently.
- This is now the shared foundation for future adaptive selectors, decodable readers, spelling, remediation, and tutoring tools.
`,
  "utf8"
);

console.log(`Lexicon words: ${masterWordLexicon.length}`);
console.log(`Report written: ${reportPath}`);
console.log(`Auto-tagging report written: ${autoTaggingReportPath}`);

if (duplicateWords.length) {
  console.warn(`Duplicate normalized words after merge: ${duplicateWords.length}`);
}
