import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  LEDA_PRODUCTION_AUDIO_BY_ROLE,
  LEDA_PRODUCTION_VOICE
} from "../src/data/generated/ledaProductionAudio.generated.js";
import { GUIDED_READING_LEDA_GAPS } from "../src/data/generated/guidedReadingLedaGaps.generated.js";
import { GUIDED_READING_NARRATION_PROVENANCE } from "../src/data/generated/guidedReadingNarrationProvenance.generated.js";
import { normalizeLedaAudioText } from "../src/data/ledaProductionAudio.js";

export { LEDA_PRODUCTION_VOICE };

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function readablePageText(page = {}) {
  return Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
}

export function canonicalVisibleText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, "\"")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function spokenWordSequence(value = "") {
  return normalizeLedaAudioText(value).match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g) || [];
}

export function sameSpokenWords(left = "", right = "") {
  const leftWords = spokenWordSequence(left);
  const rightWords = spokenWordSequence(right);
  return leftWords.length === rightWords.length
    && leftWords.every((word, index) => word === rightWords[index]);
}

export function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableValue(nested)])
  );
}

export function stableStringify(value, spacing = 0) {
  return JSON.stringify(stableValue(value), null, spacing);
}

export function guidedReadingPageKey(bookId, pageNumber) {
  return `${bookId}::${pageNumber}`;
}

export function publicAudioFile(repositoryRoot, audioPath = "") {
  return path.join(repositoryRoot, "public", String(audioPath || "").replace(/^\/+/, ""));
}

export function audioFileEvidence(repositoryRoot, audioPath = "") {
  if (!audioPath) return { audioExists: false, audioBytes: 0, audioSha256: "" };
  const filePath = publicAudioFile(repositoryRoot, audioPath);
  if (!existsSync(filePath)) return { audioExists: false, audioBytes: 0, audioSha256: "" };
  const bytes = readFileSync(filePath);
  return {
    audioExists: bytes.length > 0,
    audioBytes: bytes.length,
    audioSha256: bytes.length ? sha256(bytes) : ""
  };
}

export function exactPageAudioOverrides() {
  return GUIDED_READING_NARRATION_PROVENANCE.exactPageAudioByText || {};
}

export function resolveGuidedReadingPageAudio(text = "") {
  const exactText = canonicalVisibleText(text);
  const normalizedText = normalizeLedaAudioText(exactText);
  const exactOverride = exactPageAudioOverrides()[exactText];
  if (exactOverride) {
    return {
      audioPath: exactOverride,
      transcript: exactText,
      origin: "exact_text_override",
      exactOverride: true
    };
  }
  const gapAudio = GUIDED_READING_LEDA_GAPS.guided_page?.[normalizedText];
  if (gapAudio) {
    return {
      audioPath: gapAudio,
      transcript: normalizedText,
      origin: "gap_generator",
      exactOverride: false
    };
  }
  const productionAudio = LEDA_PRODUCTION_AUDIO_BY_ROLE.guided_page?.[normalizedText];
  if (productionAudio) {
    return {
      audioPath: productionAudio,
      transcript: normalizedText,
      origin: "production_manifest",
      exactOverride: false
    };
  }
  return { audioPath: "", transcript: "", origin: "unknown", exactOverride: false };
}

export function collectGuidedReadingPageInventory(books, repositoryRoot) {
  const rows = [];
  for (const book of books.filter(candidate => candidate.active !== false)) {
    for (const [pageIndex, page] of (book.pages || []).entries()) {
      if (page.active === false) continue;
      const pageNumber = page.pageNumber || pageIndex + 1;
      const displayedText = canonicalVisibleText(readablePageText(page));
      const declaredPageAudioText = page.pageAudioText === undefined
        ? null
        : canonicalVisibleText(page.pageAudioText);
      const pageAudioTextMatches = declaredPageAudioText === null
        || declaredPageAudioText === displayedText;
      const resolution = resolveGuidedReadingPageAudio(displayedText);
      const evidence = audioFileEvidence(repositoryRoot, resolution.audioPath);
      const transcriptMatches = Boolean(resolution.transcript)
        && sameSpokenWords(displayedText, resolution.transcript);
      const exactLedaAudioResolves = Boolean(
        resolution.audioPath
        && evidence.audioExists
        && transcriptMatches
        && pageAudioTextMatches
        && LEDA_PRODUCTION_VOICE === "en-US-Chirp3-HD-Leda"
      );
      rows.push({
        key: guidedReadingPageKey(book.id, pageNumber),
        bookId: book.id,
        title: book.title,
        pageNumber,
        displayedText,
        displayedTextSha256: sha256(displayedText),
        declaredPageAudioText,
        pageAudioTextMatches,
        normalizedText: normalizeLedaAudioText(displayedText),
        narrationNeedsRebuild: page.narrationNeedsRebuild === true,
        ...resolution,
        ...evidence,
        transcriptMatches,
        exactLedaAudioResolves
      });
    }
  }
  return rows.sort((left, right) =>
    left.bookId.localeCompare(right.bookId) || left.pageNumber - right.pageNumber
  );
}

export function findNormalizedPageTextCollisions(rows, exactOverrides = exactPageAudioOverrides()) {
  const groups = new Map();
  for (const row of rows) {
    const group = groups.get(row.normalizedText) || [];
    group.push(row);
    groups.set(row.normalizedText, group);
  }

  return [...groups.entries()]
    .map(([normalizedText, group]) => {
      const exactTexts = [...new Set(group.map(row => row.displayedText))].sort();
      if (exactTexts.length < 2) return null;
      const overrideTexts = exactTexts.filter(text => Boolean(exactOverrides[text]));
      // A normalized map can safely own one exact spelling. Every additional exact
      // spelling must be explicitly mapped so object construction cannot silently
      // overwrite punctuation or prosody variants.
      const unresolvedExactTexts = exactTexts.filter(text => !exactOverrides[text]).slice(1);
      return {
        normalizedText,
        exactTexts,
        overrideTexts,
        unresolvedExactTexts,
        resolved: unresolvedExactTexts.length === 0,
        pages: group.map(row => ({
          bookId: row.bookId,
          pageNumber: row.pageNumber,
          displayedText: row.displayedText
        }))
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.normalizedText.localeCompare(right.normalizedText));
}

export function buildGuidedReadingAudioInventory(books, repositoryRoot) {
  const pages = collectGuidedReadingPageInventory(books, repositoryRoot);
  const collisions = findNormalizedPageTextCollisions(pages);
  const pageAudioTextMismatches = pages.filter(row => !row.pageAudioTextMatches);
  const unresolvedCollisions = collisions.filter(row => !row.resolved);
  return {
    voice: LEDA_PRODUCTION_VOICE,
    activeBookCount: books.filter(candidate => candidate.active !== false).length,
    livePageCount: pages.length,
    exactResolvedPageCount: pages.filter(row => row.exactLedaAudioResolves).length,
    missingExactPageAudioCount: pages.filter(row => !row.exactLedaAudioResolves).length,
    narrationNeedsRebuildCount: pages.filter(row => row.narrationNeedsRebuild).length,
    clearableNarrationNeedsRebuildCount: pages.filter(
      row => row.narrationNeedsRebuild && row.exactLedaAudioResolves
    ).length,
    pageAudioTextMismatchCount: pageAudioTextMismatches.length,
    normalizedCollisionCount: collisions.length,
    unresolvedNormalizedCollisionCount: unresolvedCollisions.length,
    pageAudioTextMismatches,
    collisions,
    pages
  };
}
