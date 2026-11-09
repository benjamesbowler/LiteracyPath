import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { stableWorldDiscoveryJson, validateWorldDiscoveryCohortManifest, validateWorldDiscoveryRegistration } from "../../src/data/worldDiscoveryCohortContract.js";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const sha = value => /^[a-f0-9]{64}$/.test(value || "");
const wordPath = value => /^\/audio\/production\/en-US\/isolated_word\/[a-z0-9-]+-[a-f0-9]{10}\.mp3$/.test(value || "");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const requireThat = (condition, message) => { if (!condition) throw Error(message); };
const tokens = text => String(text || "").toLowerCase().replaceAll("’", "'").match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g) || [];
const contextKey = row => `${row.bookId}:${row.pageNumber}:${row.pageText}`;
const withdrawalKey = (audioPath, context) => `${audioPath}:${contextKey(context)}`;

function currentRegisteredContextVerifier({ read, books }) {
  const manifest = JSON.parse(read("src/content/world-discovery/cohorts.json"));
  const manifestErrors = validateWorldDiscoveryCohortManifest(manifest);
  requireThat(!manifestErrors.length, `Invalid current context cohort manifest: ${manifestErrors.join("; ")}`);
  const sources = new Map();
  return (row, pageText) => {
    const id = /^world-discovery-([a-e])-(\d{2})$/.exec(row.context.bookId);
    const cohort = id && manifest.cohorts.find(c => c.active && Number(id[2]) >= c.firstNumber && Number(id[2]) <= c.lastNumber);
    requireThat(cohort && cohort.maintenanceBaseline
      && row.manuscript?.path === `${cohort.sourceDir}/level-${id[1]}.json` && sha(row.manuscript.sha256)
      && row.registration?.path === cohort.registration && sha(row.registration.sha256)
      && /^src\/content\/world-discovery\/registrations\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9_/-]+\.json$/.test(row.registration.path)
      && !row.registration.path.split("/").includes(".."), "Context revision must pin the current canonical manuscript and versioned registration");
    const manuscriptBytes = read(row.manuscript.path), registrationBytes = read(row.registration.path);
    requireThat(hash(manuscriptBytes) === row.manuscript.sha256 && hash(registrationBytes) === row.registration.sha256, "Context manuscript/registration bytes changed");
    if (!sources.has(cohort.id)) {
      const sourceBooks = [..."abcde"].flatMap(level => JSON.parse(read(`${cohort.sourceDir}/level-${level}.json`)));
      const reviews = JSON.parse(read(`${cohort.sourceDir}/reviews.json`));
      sources.set(cohort.id, { books: sourceBooks, reviews });
    }
    const source = sources.get(cohort.id), registration = JSON.parse(registrationBytes);
    const registrationErrors = validateWorldDiscoveryRegistration(cohort, { ...source, id: cohort.id, registration });
    requireThat(!registrationErrors.length && registration.inputSha256 === hash(stableWorldDiscoveryJson(source)),
      `Context registration does not bind current source/reviews: ${registrationErrors.join("; ")}`);
    const sourcePages = source.books.filter(b => b.id === row.context.bookId).flatMap(b => b.pages.filter(p => p.pageNumber === row.context.pageNumber));
    const runtimePages = books.filter(b => b.id === row.context.bookId).flatMap(b => b.pages.filter(p => p.pageNumber === row.context.pageNumber));
    requireThat(sourcePages.length === 1 && runtimePages.length === 1
      && sourcePages[0].text === pageText && runtimePages[0].text === pageText, "Context exact source/runtime page differs");
    return runtimePages[0];
  };
}

// A withdrawal retires only a former page binding, never its accepted MP3,
// generator alias or historical rejection/recovery evidence. The current
// canonical source and active, versioned registration must prove its removal.
export function verifyReviewedWordAudioContextWithdrawals(scope, { read, readHistorical, books, contextualEntries }) {
  const withdrawals = scope.contextWithdrawals ?? [];
  requireThat(Array.isArray(withdrawals), "Invalid context withdrawal ledger");
  const verified = new Map();
  if (!withdrawals.length) return verified;
  requireThat(typeof read === "function" && typeof readHistorical === "function"
    && Array.isArray(books) && Array.isArray(contextualEntries), "Missing context withdrawal evidence");
  const verifyCurrent = currentRegisteredContextVerifier({ read, books });
  for (const row of withdrawals) {
    const retirement = scope.entries.find(r => r.oldAudioPath === row.oldAudioPath && r.word === row.word);
    requireThat(retirement && retirement.contexts.some(context => same(context, row.context))
      && tokens(row.context.pageText).includes(row.word), "Withdrawal is not an exact listed historical context");
    const key = withdrawalKey(row.oldAudioPath, row.context);
    requireThat(!verified.has(key) && typeof row.authorization === "string" && row.authorization.trim(), "Missing authorization or duplicate context withdrawal");
    requireThat(typeof row.replacementPageText === "string" && row.replacementPageText.trim()
      && row.replacementPageText !== row.context.pageText && !tokens(row.replacementPageText).includes(row.word), "Withdrawal page still contains the word or has no exact replacement text");
    verifyCurrent(row, row.replacementPageText);
    const historicalBooks = JSON.parse(readHistorical(row.manuscript.path));
    const historicalPages = historicalBooks.filter(b => b.id === row.context.bookId).flatMap(b => b.pages.filter(p => p.pageNumber === row.context.pageNumber));
    requireThat(historicalPages.length === 1 && historicalPages[0].text === row.context.pageText,
      "Withdrawal original binding differs from pinned historical source");
    requireThat(!contextualEntries.some(c => c.bookId === row.context.bookId && c.pageNumber === row.context.pageNumber
      && String(c.word).toLowerCase() === row.word), "Withdrawn contextual pronunciation entry remains active");
    verified.set(key, row);
  }
  return verified;
}

// Explicit same-meaning additions extend only a reviewed default's allowed
// occurrence set. They cannot create a new pronunciation or contextual alias.
export function verifyReviewedWordAudioContextAdditions(scope, { read, books, contextualEntries, resolve }) {
  const additions = scope.contextAdditions ?? [];
  requireThat(Array.isArray(additions), "Invalid context addition ledger");
  const verified = new Map();
  if (!additions.length) return verified;
  requireThat(typeof read === "function" && typeof resolve === "function"
    && Array.isArray(books) && Array.isArray(contextualEntries), "Missing context addition evidence");
  const verifyCurrent = currentRegisteredContextVerifier({ read, books });
  for (const row of additions) {
    const retirement = scope.entries.find(r => r.oldAudioPath === row.oldAudioPath && r.word === row.word);
    requireThat(retirement?.mode === "default" && row.meaning === retirement.meaning
      && row.pronunciation === retirement.pronunciation && row.audioPath === retirement.newAudioPath
      && row.audioSha256 === retirement.newSha256, "Addition changes the reviewed default meaning/pronunciation/audio");
    requireThat(row.context && Number.isInteger(row.context.pageNumber) && row.context.pageNumber > 0
      && typeof row.context.pageText === "string" && tokens(row.context.pageText).includes(row.word)
      && !retirement.contexts.some(context => same(context, row.context)), "Addition is missing the word or repeats an original context");
    const key = withdrawalKey(row.oldAudioPath, row.context);
    requireThat(!verified.has(key) && typeof row.authorization === "string" && row.authorization.trim(), "Missing authorization or duplicate context addition");
    const page = verifyCurrent(row, row.context.pageText);
    requireThat(!contextualEntries.some(c => c.bookId === row.context.bookId && c.pageNumber === row.context.pageNumber
      && String(c.word).toLowerCase() === row.word), "Added default context has a contextual override");
    requireThat(resolve(row.word) === retirement.newAudioPath
      && resolve(row.word, { bookId: row.context.bookId, page }) === retirement.newAudioPath
      && hash(read(`public${retirement.newAudioPath}`)) === retirement.newSha256, "Added context/default does not resolve the accepted audio bytes");
    verified.set(key, row);
  }
  return verified;
}

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
    if (actual.withdrawal) {
      const withdrawal = actual.withdrawal;
      requireThat(actual.withdrawalVerified === true && same(actual.binding, expected) && same(withdrawal.context, expected)
        && withdrawal.oldAudioPath === r.oldAudioPath && withdrawal.word === r.word
        && actual.pageText === withdrawal.replacementPageText && !tokens(actual.pageText).includes(r.word)
        && actual.contextualEntryCount === 0 && actual.approval === null, "Unverified withdrawn word context");
      continue;
    }
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
    const retainedContexts = r.contexts.filter((_, index) => !e.contexts[index].withdrawal);
    const additions = e.contextAdditions ?? [];
    requireThat(Array.isArray(additions) && new Set(additions.map(a => contextKey(a.binding))).size === additions.length,
      "Missing/duplicate approved context additions");
    for (const addition of additions) {
      const row = addition.row;
      requireThat(addition.verified === true && row?.oldAudioPath === r.oldAudioPath && row.word === r.word
        && row.meaning === r.meaning && row.pronunciation === r.pronunciation
        && row.audioPath === r.newAudioPath && row.audioSha256 === r.newSha256
        && same(addition.binding, row.context) && tokens(row.context.pageText).includes(r.word)
        && !r.contexts.some(context => same(context, row.context)), "Unverified added word context");
    }
    requireThat(same([...e.currentOccurrences].sort(), [...retainedContexts, ...additions.map(a => a.binding)].map(contextKey).sort()), "Word now has an unreviewed meaning/context");
  } else {
    requireThat(!e.contextAdditions?.length, "Contextual retirement cannot gain default contexts");
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
    const withdrawals = verifyReviewedWordAudioContextWithdrawals(scope, {
      read: safeRead, readHistorical: relative => git(["show", `${scope.sourceRevision}:${relative}`]), books, contextualEntries: contexts
    });
    const additions = verifyReviewedWordAudioContextAdditions(scope, { read: safeRead, books, contextualEntries: contexts, resolve });
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
            const withdrawal = withdrawals.get(withdrawalKey(r.oldAudioPath, binding));
            return { binding, pageText: page?.text, resolvedPath: withdrawal ? null : resolve(r.word, { bookId: binding.bookId, page }),
              approval: matches.length === 1 ? matches[0] : null, contextualEntryCount: matches.length,
              ...(withdrawal ? { withdrawal, withdrawalVerified: true } : {}) };
          }),
          contextAdditions: [...additions.values()].filter(row => row.oldAudioPath === r.oldAudioPath)
            .map(row => ({ row, binding: row.context, verified: true })),
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
