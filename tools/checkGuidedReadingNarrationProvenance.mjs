#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import {
  LEDA_PRODUCTION_AUDIO_BY_ROLE,
  LEDA_PRODUCTION_VOICE
} from "../src/data/generated/ledaProductionAudio.generated.js";
import { GUIDED_READING_NARRATION_PROVENANCE } from "../src/data/generated/guidedReadingNarrationProvenance.generated.js";
import {
  buildGuidedReadingAudioInventory,
  canonicalVisibleText,
  exactPageAudioOverrides,
  sha256,
  stableStringify
} from "./guidedReadingAudioPipelineLib.mjs";
import { buildGuidedReadingNarrationProvenanceModule } from "./guidedReadingNarrationProvenanceLib.mjs";
import { auditScienceReadAloudNarration } from "./meadowPalsScienceGateLib.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedModulePath = path.join(
  repositoryRoot,
  "src/data/generated/guidedReadingNarrationProvenance.generated.js"
);

function productionManifestEvidence() {
  const guidedPageMap = LEDA_PRODUCTION_AUDIO_BY_ROLE.guided_page || {};
  return {
    productionManifestPageCount: Object.keys(guidedPageMap).length,
    productionManifestSha256: sha256(stableStringify(guidedPageMap))
  };
}

function corpusEvidence(pages) {
  const lines = pages.map(row => JSON.stringify([
    row.bookId,
    row.pageNumber,
    canonicalVisibleText(row.displayedText),
    row.audioPath,
    row.audioSha256
  ]));
  return {
    corpusSha256: sha256(lines.join("\n")),
    narrationRebuildClearanceSha256: sha256(
      pages
        .filter(row => row.narrationNeedsRebuild && row.exactLedaAudioResolves)
        .map(row => JSON.stringify([row.key, row.displayedTextSha256, row.audioSha256]))
        .join("\n")
    )
  };
}

function auditLedaNarrationProvenance({ verifySnapshot = true } = {}) {
  const inventory = buildGuidedReadingAudioInventory(
    guidedReadingBooks.filter(book => book.readingBandProfile !== "read-aloud"), repositoryRoot
  );
  const manifestEvidence = productionManifestEvidence();
  const corpus = corpusEvidence(inventory.pages);
  const failures = [];

  for (const row of inventory.pages) {
    if (!row.pageAudioTextMatches) {
      failures.push({ ...row, reason: "page_audio_text_mismatch" });
    } else if (!row.audioPath) {
      failures.push({ ...row, reason: "missing_audio_mapping" });
    } else if (!row.audioExists) {
      failures.push({ ...row, reason: "missing_audio_file" });
    } else if (!row.transcriptMatches) {
      failures.push({ ...row, reason: "word_sequence_mismatch" });
    }
  }
  for (const collision of inventory.collisions.filter(row => !row.resolved)) {
    failures.push({ ...collision, reason: "unresolved_normalized_text_collision" });
  }

  const snapshotMatches = corpus.corpusSha256
    === GUIDED_READING_NARRATION_PROVENANCE.corpusSha256;
  if (verifySnapshot && !snapshotMatches) {
    failures.push({
      reason: "narration_corpus_snapshot_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.corpusSha256,
      actual: corpus.corpusSha256
    });
  }

  if (
    verifySnapshot
    && inventory.activeBookCount !== GUIDED_READING_NARRATION_PROVENANCE.liveBookCount
  ) {
    failures.push({
      reason: "live_book_count_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.liveBookCount,
      actual: inventory.activeBookCount
    });
  }
  if (
    verifySnapshot
    && inventory.livePageCount !== GUIDED_READING_NARRATION_PROVENANCE.livePageCount
  ) {
    failures.push({
      reason: "live_page_count_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.livePageCount,
      actual: inventory.livePageCount
    });
  }
  if (LEDA_PRODUCTION_VOICE !== GUIDED_READING_NARRATION_PROVENANCE.voice) {
    failures.push({
      reason: "production_voice_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.voice,
      actual: LEDA_PRODUCTION_VOICE
    });
  }
  if (
    verifySnapshot
    && manifestEvidence.productionManifestPageCount
      !== GUIDED_READING_NARRATION_PROVENANCE.productionManifestPageCount
  ) {
    failures.push({
      reason: "production_manifest_page_count_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.productionManifestPageCount,
      actual: manifestEvidence.productionManifestPageCount
    });
  }
  if (
    verifySnapshot
    && manifestEvidence.productionManifestSha256
      !== GUIDED_READING_NARRATION_PROVENANCE.productionManifestSha256
  ) {
    failures.push({
      reason: "production_manifest_snapshot_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.productionManifestSha256,
      actual: manifestEvidence.productionManifestSha256
    });
  }

  const originCounts = {
    production_manifest: 0,
    gap_generator: 0,
    exact_text_override: 0,
    unknown: 0
  };
  for (const row of inventory.pages) originCounts[row.origin] += 1;

  return {
    activeBookCount: inventory.activeBookCount,
    livePageCount: inventory.livePageCount,
    originCounts,
    uniqueAudioPathCount: new Set(inventory.pages.map(row => row.audioPath).filter(Boolean)).size,
    exactResolvedPageCount: inventory.exactResolvedPageCount,
    wordSequenceMismatchCount: inventory.pages.filter(row => row.audioPath && !row.transcriptMatches).length,
    pageAudioTextMismatchCount: inventory.pageAudioTextMismatchCount,
    missingAudioCount: inventory.pages.filter(row => !row.audioExists).length,
    unknownProvenanceCount: inventory.pages.filter(row => row.origin === "unknown").length,
    normalizedCollisionCount: inventory.normalizedCollisionCount,
    unresolvedNormalizedCollisionCount: inventory.unresolvedNormalizedCollisionCount,
    narrationNeedsRebuildCount: inventory.narrationNeedsRebuildCount,
    clearableNarrationNeedsRebuildCount: inventory.clearableNarrationNeedsRebuildCount,
    ...manifestEvidence,
    ...corpus,
    expectedCorpusSha256: GUIDED_READING_NARRATION_PROVENANCE.corpusSha256,
    snapshotMatches,
    failures,
    pages: inventory.pages,
    collisions: inventory.collisions
  };
}

export function auditGuidedReadingNarrationProvenance(options = {}) {
  // Keep the reviewed Leda-only corpus and its snapshot intact. Character
  // performances have a separate exact-text, speaker-by-speaker authority.
  const ledaAudit = auditLedaNarrationProvenance(options);
  const scienceAudit = auditScienceReadAloudNarration(guidedReadingBooks, repositoryRoot);
  return {
    ...ledaAudit,
    activeBookCount: ledaAudit.activeBookCount + scienceAudit.activeBookCount,
    livePageCount: ledaAudit.livePageCount + scienceAudit.pages.length,
    exactResolvedPageCount: ledaAudit.exactResolvedPageCount + scienceAudit.pages.filter(page => page.exactNarrationResolves).length,
    missingAudioCount: ledaAudit.missingAudioCount + scienceAudit.pages.filter(page => !page.audioExists).length,
    wordSequenceMismatchCount: ledaAudit.wordSequenceMismatchCount + scienceAudit.pages.filter(page => !page.transcriptMatches).length,
    pageAudioTextMismatchCount: ledaAudit.pageAudioTextMismatchCount + scienceAudit.pages.filter(page => !page.pageAudioTextMatches).length,
    narrationNeedsRebuildCount: ledaAudit.narrationNeedsRebuildCount + scienceAudit.pages.filter(page => page.narrationNeedsRebuild).length,
    uniqueAudioPathCount: new Set([...ledaAudit.pages, ...scienceAudit.pages].map(page => page.audioPath).filter(Boolean)).size,
    originCounts: { ...ledaAudit.originCounts, character_dialogue_manifest: scienceAudit.pages.length },
    pages: [...ledaAudit.pages, ...scienceAudit.pages],
    failures: [...ledaAudit.failures, ...scienceAudit.failures],
    ledaBookCount: ledaAudit.activeBookCount,
    ledaPageCount: ledaAudit.livePageCount,
    sharedReadAloudPageCount: scienceAudit.pages.length,
    ledaAudit
  };
}

function activeExactOverrides(audit) {
  const activeTexts = new Set(audit.pages.map(row => row.displayedText));
  return Object.fromEntries(
    Object.entries(exactPageAudioOverrides())
      .filter(([text]) => activeTexts.has(canonicalVisibleText(text)))
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

export function buildNarrationProvenanceModule(audit) {
  const ledaAudit = audit.ledaAudit || audit;
  const exactOverrides = activeExactOverrides(ledaAudit);
  return buildGuidedReadingNarrationProvenanceModule({
    audit: ledaAudit,
    voice: LEDA_PRODUCTION_VOICE,
    exactOverrides
  });
}

function outputSummary(audit, extra = {}) {
  return {
    activeBookCount: audit.activeBookCount,
    livePageCount: audit.livePageCount,
    ledaBookCount: audit.ledaBookCount,
    ledaPageCount: audit.ledaPageCount,
    sharedReadAloudPageCount: audit.sharedReadAloudPageCount,
    originCounts: audit.originCounts,
    uniqueAudioPathCount: audit.uniqueAudioPathCount,
    exactResolvedPageCount: audit.exactResolvedPageCount,
    wordSequenceMismatchCount: audit.wordSequenceMismatchCount,
    pageAudioTextMismatchCount: audit.pageAudioTextMismatchCount,
    missingAudioCount: audit.missingAudioCount,
    unknownProvenanceCount: audit.unknownProvenanceCount,
    normalizedCollisionCount: audit.normalizedCollisionCount,
    unresolvedNormalizedCollisionCount: audit.unresolvedNormalizedCollisionCount,
    narrationNeedsRebuildCount: audit.narrationNeedsRebuildCount,
    clearableNarrationNeedsRebuildCount: audit.clearableNarrationNeedsRebuildCount,
    productionManifestSha256: audit.productionManifestSha256,
    corpusSha256: audit.corpusSha256,
    expectedCorpusSha256: audit.expectedCorpusSha256,
    snapshotMatches: audit.snapshotMatches,
    failureCount: audit.failures.length,
    failures: audit.failures.slice(0, 100),
    ...extra
  };
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const refresh = process.argv.includes("--refresh");
  const refreshPreview = process.argv.includes("--refresh-preview");
  const printDigest = process.argv.includes("--print-digest");
  const audit = auditGuidedReadingNarrationProvenance({
    verifySnapshot: !refresh && !refreshPreview && !printDigest
  });

  if (refresh || refreshPreview) {
    if (audit.failures.length) {
      console.error(stableStringify(outputSummary(audit, {
        error: "Provenance refresh refused: every live page must first resolve to exact-text Leda audio."
      }), 2));
      process.exit(1);
    }
    const moduleText = buildNarrationProvenanceModule(audit);
    if (refreshPreview) {
      process.stdout.write(moduleText);
    } else {
      writeFileSync(generatedModulePath, moduleText);
      console.log(stableStringify(outputSummary(audit, {
        refreshed: path.relative(repositoryRoot, generatedModulePath),
        generatedModuleSha256: sha256(moduleText)
      }), 2));
    }
  } else {
    console.log(stableStringify(outputSummary(audit), 2));
    if (!printDigest && audit.failures.length) process.exit(1);
  }
}
