#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import {
  LEDA_PRODUCTION_AUDIO_BY_ROLE,
  LEDA_PRODUCTION_VOICE
} from "../src/data/generated/ledaProductionAudio.generated.js";
import { GUIDED_READING_LEDA_GAPS } from "../src/data/generated/guidedReadingLedaGaps.generated.js";
import { GUIDED_READING_NARRATION_PROVENANCE } from "../src/data/generated/guidedReadingNarrationProvenance.generated.js";
import { normalizeLedaAudioText } from "../src/data/ledaProductionAudio.js";
import { getGuidedReadingPageAudioPath } from "../src/utils/guidedReading/readAloudPolicy.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readablePageText(page = {}) {
  return Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
}

function canonicalVisibleText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, "\"")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function spokenWordSequence(value = "") {
  return normalizeLedaAudioText(value).match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g) || [];
}

function publicAudioFile(audioPath = "") {
  return path.join(repositoryRoot, "public", String(audioPath || "").replace(/^\/+/, ""));
}

function transcriptIndex() {
  const byPath = new Map();
  for (const [transcript, audioPath] of Object.entries(
    LEDA_PRODUCTION_AUDIO_BY_ROLE.guided_page || {}
  )) {
    byPath.set(audioPath, {
      origin: "production_manifest",
      transcript
    });
  }
  for (const [transcript, audioPath] of Object.entries(
    GUIDED_READING_LEDA_GAPS.guided_page || {}
  )) {
    byPath.set(audioPath, {
      origin: "gap_generator",
      transcript
    });
  }
  for (const [transcript, audioPath] of Object.entries(
    GUIDED_READING_NARRATION_PROVENANCE.exactPageAudioByText || {}
  )) {
    byPath.set(audioPath, {
      origin: "exact_text_override",
      transcript
    });
  }
  return byPath;
}

export function auditGuidedReadingNarrationProvenance({ verifySnapshot = true } = {}) {
  const transcripts = transcriptIndex();
  const pages = [];
  const failures = [];
  const originCounts = {
    production_manifest: 0,
    gap_generator: 0,
    exact_text_override: 0,
    unknown: 0
  };

  for (const book of guidedReadingBooks.filter(candidate => candidate.active !== false)) {
    for (const [pageIndex, page] of (book.pages || []).entries()) {
      if (page.active === false) continue;
      const pageNumber = page.pageNumber || pageIndex + 1;
      const displayedText = readablePageText(page);
      const audioPath = getGuidedReadingPageAudioPath(page);
      const provenance = transcripts.get(audioPath);
      const origin = provenance?.origin || "unknown";
      originCounts[origin] += 1;

      const audioFile = publicAudioFile(audioPath);
      const audioExists = Boolean(audioPath) && existsSync(audioFile);
      const audioSha256 = audioExists ? sha256(readFileSync(audioFile)) : "";
      const displayedWords = spokenWordSequence(displayedText);
      const recordedWords = spokenWordSequence(provenance?.transcript || "");
      const wordSequenceMatches = (
        displayedWords.length === recordedWords.length
        && displayedWords.every((word, index) => word === recordedWords[index])
      );

      const row = {
        bookId: book.id,
        title: book.title,
        pageNumber,
        displayedText,
        recordedTranscript: provenance?.transcript || "",
        audioPath,
        audioSha256,
        origin,
        audioExists,
        wordSequenceMatches
      };
      pages.push(row);

      if (!audioPath) failures.push({ ...row, reason: "missing_audio_mapping" });
      else if (!provenance) failures.push({ ...row, reason: "missing_transcript_provenance" });
      else if (!audioExists) failures.push({ ...row, reason: "missing_audio_file" });
      else if (!wordSequenceMatches) failures.push({ ...row, reason: "word_sequence_mismatch" });
    }
  }

  const corpusLines = pages.map(row => JSON.stringify([
    row.bookId,
    row.pageNumber,
    canonicalVisibleText(row.displayedText),
    row.audioPath,
    row.audioSha256
  ]));
  const corpusSha256 = sha256(corpusLines.join("\n"));
  const snapshotMatches = (
    !verifySnapshot
    || corpusSha256 === GUIDED_READING_NARRATION_PROVENANCE.corpusSha256
  );
  if (!snapshotMatches) {
    failures.push({
      reason: "narration_corpus_snapshot_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.corpusSha256,
      actual: corpusSha256
    });
  }

  const activeBooks = guidedReadingBooks.filter(candidate => candidate.active !== false);
  if (activeBooks.length !== GUIDED_READING_NARRATION_PROVENANCE.liveBookCount) {
    failures.push({
      reason: "live_book_count_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.liveBookCount,
      actual: activeBooks.length
    });
  }
  if (pages.length !== GUIDED_READING_NARRATION_PROVENANCE.livePageCount) {
    failures.push({
      reason: "live_page_count_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.livePageCount,
      actual: pages.length
    });
  }
  if (LEDA_PRODUCTION_VOICE !== GUIDED_READING_NARRATION_PROVENANCE.voice) {
    failures.push({
      reason: "production_voice_mismatch",
      expected: GUIDED_READING_NARRATION_PROVENANCE.voice,
      actual: LEDA_PRODUCTION_VOICE
    });
  }

  return {
    activeBookCount: activeBooks.length,
    livePageCount: pages.length,
    originCounts,
    uniqueAudioPathCount: new Set(pages.map(row => row.audioPath)).size,
    wordSequenceMismatchCount: pages.filter(row => !row.wordSequenceMatches).length,
    missingAudioCount: pages.filter(row => !row.audioExists).length,
    unknownProvenanceCount: pages.filter(row => row.origin === "unknown").length,
    corpusSha256,
    expectedCorpusSha256: GUIDED_READING_NARRATION_PROVENANCE.corpusSha256,
    snapshotMatches,
    failures,
    pages
  };
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const verifySnapshot = !process.argv.includes("--print-digest");
  const audit = auditGuidedReadingNarrationProvenance({ verifySnapshot });
  console.log(JSON.stringify({
    activeBookCount: audit.activeBookCount,
    livePageCount: audit.livePageCount,
    originCounts: audit.originCounts,
    uniqueAudioPathCount: audit.uniqueAudioPathCount,
    wordSequenceMismatchCount: audit.wordSequenceMismatchCount,
    missingAudioCount: audit.missingAudioCount,
    unknownProvenanceCount: audit.unknownProvenanceCount,
    corpusSha256: audit.corpusSha256,
    expectedCorpusSha256: audit.expectedCorpusSha256,
    snapshotMatches: audit.snapshotMatches,
    failureCount: audit.failures.length,
    failures: audit.failures.slice(0, 100)
  }, null, 2));
  if (verifySnapshot && audit.failures.length) process.exit(1);
}
