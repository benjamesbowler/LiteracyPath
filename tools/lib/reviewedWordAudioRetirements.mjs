import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const sha = value => /^[a-f0-9]{64}$/.test(value || "");
const wordPath = value => /^\/audio\/production\/en-US\/isolated_word\/[a-z0-9-]+-[a-f0-9]{10}\.mp3$/.test(value || "");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const requireThat = (condition, message) => { if (!condition) throw Error(message); };
const tokens = text => String(text || "").toLowerCase().replaceAll("’", "'").match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g) || [];
const contextKey = row => `${row.bookId}:${row.pageNumber}:${row.pageText}`;

// Evidence is gathered independently below; this predicate has no filesystem or
// Git fallback that could turn an unreadable source into proof of absence.
export function validateReviewedWordAudioRetirement(r, e) {
  requireThat(r && ["default", "contextual"].includes(r.mode) && /^[a-z]+$/.test(r.word || "")
    && r.meaning?.trim() && r.pronunciation?.trim(), "Missing exact word/meaning contract");
  requireThat(wordPath(r.oldAudioPath) && wordPath(r.newAudioPath) && r.oldAudioPath !== r.newAudioPath
    && sha(r.oldSha256) && sha(r.newSha256) && r.newAudioPath.endsWith(`-${r.newSha256.slice(0, 10)}.mp3`), "Invalid isolated-word path/hash");
  requireThat(e.revisionsVerified === true && e.absentAtProductionRevision === true, "Unpublished lineage is unverified");
  for (const bytes of [e.previousBytes, e.sourceBytes, e.recoveryBytes]) {
    requireThat(Buffer.isBuffer(bytes) && hash(bytes) === r.oldSha256, "Old source/baseline/recovery bytes differ");
  }
  requireThat(e.recoveryPathVerified === true && e.meaningfulReferences?.length === 0, "Recovery path or live references are unsafe");
  requireThat(Buffer.isBuffer(e.currentBytes) && hash(e.currentBytes) === r.newSha256 && e.replacementDecodes === true, "Replacement bytes/decode differ");
  requireThat(r.voiceName === "en-US-Chirp3-HD-Leda" && e.reviewReportVerified === true, "Reviewed voice/report is unverified");
  const review = e.review;
  requireThat(review?.kind === "word" && review.text === r.word && review.lookupText === r.word
    && review.audioPath === r.newAudioPath && review.audioSha256 === r.newSha256
    && review.voiceName === r.voiceName && ["independent-recognizer-match", "reviewed-contextual-pronunciation",
      "reviewed-exact-ipa-residual-asr-ambiguity"].includes(review.decision) && review.reviewNote?.trim(), "Exact accepted word review differs");
  requireThat(Array.isArray(r.contexts) && r.contexts.length > 0
    && new Set(r.contexts.map(contextKey)).size === r.contexts.length
    && e.contexts?.length === r.contexts.length, "Missing/duplicate exact contexts");
  for (const [index, expected] of r.contexts.entries()) {
    const actual = e.contexts[index];
    requireThat(same(actual.binding, expected) && actual.pageText === expected.pageText
      && tokens(expected.pageText).includes(r.word) && actual.resolvedPath === r.newAudioPath, "Source page/context resolution differs");
    const approved = actual.approval;
    requireThat(approved?.bookId === expected.bookId && approved.pageNumber === expected.pageNumber
      && approved.pageText === expected.pageText && approved.word === r.word && approved.status === "reviewed"
      && approved.pronunciation === r.pronunciation && approved.pronunciationEncoding === "PHONETIC_ENCODING_IPA"
      && approved.audioPath === r.newAudioPath && approved.audioSha256 === r.newSha256
      && approved.voiceName === r.voiceName && approved.reviewEvidence === e.reviewReportPath, "Accepted pronunciation context differs");
  }
  if (r.mode === "default") {
    const repair = e.repair;
    requireThat(e.historicalWordMapping === r.oldAudioPath && e.defaultResolvedPath === r.newAudioPath
      && e.generatorResolvedPath === r.newAudioPath, "Default lookup/generator lineage differs");
    requireThat(repair?.role === "isolated_word" && repair.normalizedLookupText === r.word
      && repair.spokenText === r.word && repair.voiceName === r.voiceName && repair.audioPath === r.newAudioPath
      && repair.audioSha256 === r.newSha256 && repair.reviewEvidence === review.reviewNote
      && repair.pronunciations?.some(p => p.phrase === r.word && p.pronunciation === r.pronunciation
        && p.phoneticEncoding === "PHONETIC_ENCODING_IPA"), "Durable reviewed generator alias differs");
    requireThat(same([...e.currentOccurrences].sort(), r.contexts.map(contextKey).sort()), "Word now has an unreviewed meaning/context");
  } else {
    // The duplicate rejected ribbon take must never change the shared bow
    // dictionary or substitute the bodily-bow context.
    requireThat(r.word === "bow" && r.pronunciation === "boʊ" && r.contexts.length === 1
      && r.contexts[0].bookId === "world-discovery-c-12" && r.contexts[0].pageNumber === 8
      && r.duplicateRejectedSha256 === r.oldSha256 && e.duplicateRecoveryVerified === true,
    "Rejected ribbon duplicate/context differs");
    requireThat(!e.historicalWordMapping && !e.currentWordMapping && !e.repair
      && e.defaultResolvedPath === r.retainedDefault?.audioPath && sha(r.retainedDefault?.sha256)
      && Buffer.isBuffer(e.retainedDefaultBytes) && hash(e.retainedDefaultBytes) === r.retainedDefault.sha256,
    "Shared bow default changed");
  }
  return true;
}

export async function verifyReviewedWordAudioRetirements(root, changedEntries, baseline, {
  meaningfulReferences, decodes, validateAll = false
} = {}) {
  const paths = new Set(), rows = [], failures = [];
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(root, "tools/manifests/guided-reading-book-retirements.json")));
    const scope = registry.isolatedWordSupersessions;
    requireThat(registry.schemaVersion === 1 && scope?.scope === "world-discovery-unpublished-11-20"
      && Array.isArray(scope.entries) && scope.entries.length > 0, "Missing isolated-word retirement scope");
    requireThat(new Set(scope.entries.map(r => r.oldAudioPath)).size === scope.entries.length, "Duplicate isolated-word retirement");
    const wanted = scope.entries.filter(r => validateAll || changedEntries.some(e => e.status === "D" && e.path === `public${r.oldAudioPath}`));
    if (!wanted.length) return { paths, rows, failures };
    const git = args => execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 });
    for (const ref of [scope.productionRevision, scope.sourceRevision]) {
      requireThat(/^[a-f0-9]{40}$/.test(ref) && git(["rev-parse", "--verify", `${ref}^{commit}`]).toString().trim() === ref, "Invalid pinned commit");
    }
    git(["merge-base", "--is-ancestor", scope.productionRevision, scope.sourceRevision]);
    git(["merge-base", "--is-ancestor", scope.sourceRevision, "HEAD"]);
    const productionFiles = new Set(git(["ls-tree", "-r", "--name-only", scope.productionRevision, "--", "public/audio/production/en-US/isolated_word"]).toString().trim().split("\n"));
    const priorSource = git(["show", `${scope.sourceRevision}:src/data/generated/guidedReadingLedaGaps.generated.js`]).toString();
    const marker = "export const GUIDED_READING_LEDA_GAPS = Object.freeze(";
    requireThat(priorSource.includes(marker), "Historical audio map is unreadable");
    const priorMap = JSON.parse(priorSource.slice(priorSource.indexOf(marker) + marker.length, priorSource.lastIndexOf(");")));
    const safeRead = relative => {
      requireThat(typeof relative === "string" && !path.isAbsolute(relative) && path.normalize(relative) === relative, "Invalid evidence path");
      const real = fs.realpathSync(path.join(root, relative));
      requireThat(real.startsWith(fs.realpathSync(root) + path.sep), "Evidence escapes repository");
      return fs.readFileSync(real);
    };
    const reportBytes = safeRead(scope.reviewReport.path);
    requireThat(hash(reportBytes) === scope.reviewReport.sha256, "Accepted review report changed");
    const report = JSON.parse(reportBytes);
    requireThat(report.status === "automated-review-complete", "Accepted review is incomplete");
    const { getRuntimeGuidedReadingBooks } = await import("../../src/utils/guidedReading/runtimeBooks.js");
    const { getGuidedReadingWordProductionAudioPath: resolve } = await import("../../src/utils/guidedReading/readAloudPolicy.js");
    const { GUIDED_READING_CONTEXTUAL_WORD_AUDIO: contexts } = await import("../../src/data/guidedReadingContextualWordAudio.js");
    const { GUIDED_READING_AUDIO_REPAIRS: repairs } = await import("../guidedReadingAudioRepairRegistry.mjs");
    const { resolveReviewedGuidedReadingAudioRepair } = await import("../guidedReadingAudioRepairLib.mjs");
    const { GUIDED_READING_LEDA_GAPS: currentMap } = await import("../../src/data/generated/guidedReadingLedaGaps.generated.js");
    const books = getRuntimeGuidedReadingBooks();
    for (const r of wanted) {
      try {
        requireThat(wordPath(r.oldAudioPath), "Invalid old isolated-word path");
        const recoveryRelative = `${scope.recoveryRoot}/${r.oldSha256}.mp3`;
        requireThat(r.recoveryPath === recoveryRelative && scope.recoveryRoot === ".artifacts/world-discovery-expansion/audio/first-50/review-audio", "Invalid recovery root/path");
        const recoveryReal = fs.realpathSync(path.join(root, r.recoveryPath));
        requireThat(recoveryReal.startsWith(fs.realpathSync(path.join(root, scope.recoveryRoot)) + path.sep), "Recovery escapes declared root");
        const historicalPath = `public${r.oldAudioPath}`;
        const sourceBytes = git(["show", `${scope.sourceRevision}:${historicalPath}`]);
        // Validate-all remains usable after the reviewed deletion is committed;
        // a pending deletion always has to match the actual comparison tree.
        const pendingDeletion = changedEntries.some(e => e.status === "D" && e.path === historicalPath);
        const previousBytes = pendingDeletion ? git(["show", `${baseline}:${historicalPath}`]) : sourceBytes;
        const currentBytes = safeRead(`public${r.newAudioPath}`);
        const accepted = report.results.filter(row => row.audioPath === r.newAudioPath);
        requireThat(accepted.length === 1, "Missing/duplicate accepted review row");
        let duplicateRecoveryVerified = false;
        if (r.mode === "contextual") {
          const bytes = safeRead(r.duplicateReviewEvidence.path);
          requireThat(hash(bytes) === r.duplicateReviewEvidence.sha256, "Original duplicate recovery report changed");
          const duplicateRows = JSON.parse(bytes).retainedReviewAudio?.filter(row =>
            row.formerProductionPath === r.duplicateRejectedPath && row.sha256 === r.oldSha256
            && row.path === r.recoveryPath) || [];
          duplicateRecoveryVerified = duplicateRows.length === 1;
        }
        validateReviewedWordAudioRetirement(r, {
          revisionsVerified: true, absentAtProductionRevision: !productionFiles.has(historicalPath), previousBytes, sourceBytes,
          recoveryBytes: safeRead(r.recoveryPath), recoveryPathVerified: true,
          meaningfulReferences: meaningfulReferences(r.oldAudioPath), currentBytes, replacementDecodes: decodes(currentBytes),
          reviewReportVerified: true, reviewReportPath: scope.reviewReport.path, review: accepted[0], duplicateRecoveryVerified,
          contexts: r.contexts.map(binding => {
            const page = books.find(b => b.id === binding.bookId)?.pages.find(p => p.pageNumber === binding.pageNumber);
            const matches = contexts.filter(c => c.bookId === binding.bookId && c.pageNumber === binding.pageNumber && c.word === r.word);
            return { binding, pageText: page?.text, resolvedPath: resolve(r.word, { bookId: binding.bookId, page }), approval: matches.length === 1 ? matches[0] : null };
          }),
          historicalWordMapping: priorMap.isolated_word?.[r.word], currentWordMapping: currentMap.isolated_word?.[r.word],
          defaultResolvedPath: resolve(r.word), repair: repairs[`isolated_word:${r.word}`],
          generatorResolvedPath: r.mode === "default" ? resolveReviewedGuidedReadingAudioRepair({ role: "isolated_word", lookupText: r.word, spokenText: r.word }, r.voiceName, root) : null,
          currentOccurrences: books.flatMap(b => [...b.pages, { text: b.title, pageNumber: "title" }].filter(p => tokens(p.text).includes(r.word)).map(p => contextKey({ bookId: b.id, pageNumber: p.pageNumber, pageText: p.text }))),
          retainedDefaultBytes: r.retainedDefault ? safeRead(`public${r.retainedDefault.audioPath}`) : undefined
        });
        paths.add(historicalPath); rows.push({ oldAudioPath: r.oldAudioPath, oldSha256: r.oldSha256,
          newAudioPath: r.newAudioPath, newSha256: r.newSha256, mode: r.mode, word: r.word, recoveryPath: r.recoveryPath, verified: true });
      } catch (error) { failures.push(`Unverified isolated-word retirement ${r.oldAudioPath}: ${error.message}`); }
    }
  } catch (error) { failures.push(`Cannot validate isolated-word retirements: ${error.message}`); }
  return { paths, rows, failures };
}
