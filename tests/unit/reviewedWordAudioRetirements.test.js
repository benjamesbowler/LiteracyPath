import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { validateReviewedWordAudioRetirement, verifyReviewedWordAudioRetirements } from "../../tools/lib/reviewedWordAudioRetirements.mjs";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
function fixture(contextual = false) {
  const old = Buffer.from("rejected candidate"), current = Buffer.from("accepted candidate");
  const word = contextual ? "bow" : "bows", pronunciation = contextual ? "boʊ" : "baʊz";
  const context = { bookId: contextual ? "world-discovery-c-12" : "world-discovery-d-14", pageNumber: contextual ? 8 : 10,
    pageText: contextual ? "Kit ties a bow." : "Kit bows to Zoe." };
  const r = { mode: contextual ? "contextual" : "default", word, meaning: contextual ? "ribbon loops" : "bends the body",
    pronunciation, voiceName: "en-US-Chirp3-HD-Leda", oldAudioPath: `/audio/production/en-US/isolated_word/${word}-0123456789.mp3`,
    oldSha256: hash(old), newAudioPath: `/audio/production/en-US/isolated_word/${word}-clear-${hash(current).slice(0, 10)}.mp3`,
    newSha256: hash(current), contexts: [context] };
  const note = "Automated review with retained limitations; no human-listening claim.";
  const e = { revisionsVerified: true, absentAtProductionRevision: true, previousBytes: old, sourceBytes: old,
    recoveryBytes: old, recoveryPathVerified: true, meaningfulReferences: [], currentBytes: current, replacementDecodes: true,
    reviewReportVerified: true, reviewReportPath: "source-art/world-discovery/cohorts/11-20/narration-review.json",
    review: { kind: "word", text: word, lookupText: word, audioPath: r.newAudioPath, audioSha256: r.newSha256,
      voiceName: r.voiceName, decision: "reviewed-contextual-pronunciation", reviewNote: note },
    contexts: [{ binding: context, pageText: context.pageText, resolvedPath: r.newAudioPath,
      approval: { ...context, word, status: "reviewed", pronunciation, pronunciationEncoding: "PHONETIC_ENCODING_IPA",
        audioPath: r.newAudioPath, audioSha256: r.newSha256, voiceName: r.voiceName,
        reviewEvidence: "source-art/world-discovery/cohorts/11-20/narration-review.json" } }],
    historicalWordMapping: r.oldAudioPath, defaultResolvedPath: r.newAudioPath, generatorResolvedPath: r.newAudioPath,
    currentOccurrences: [`${context.bookId}:${context.pageNumber}:${context.pageText}`],
    repair: { role: "isolated_word", normalizedLookupText: word, spokenText: word, voiceName: r.voiceName,
      audioPath: r.newAudioPath, audioSha256: r.newSha256, reviewEvidence: note,
      pronunciations: [{ phrase: word, pronunciation, phoneticEncoding: "PHONETIC_ENCODING_IPA" }] } };
  if (contextual) {
    const dictionary = Buffer.from("unchanged dictionary bow");
    r.duplicateRejectedSha256 = r.oldSha256;
    r.retainedDefault = { audioPath: `/audio/production/en-US/isolated_word/bow-${hash(dictionary).slice(0, 10)}.mp3`, sha256: hash(dictionary) };
    e.duplicateRecoveryVerified = true; e.retainedDefaultBytes = dictionary; e.defaultResolvedPath = r.retainedDefault.audioPath;
    delete e.historicalWordMapping; delete e.repair;
  }
  return { r, e };
}

test("exact unpublished word supersession preserves its reviewed meaning and durable default", () => {
  const { r, e } = fixture();
  assert.notEqual(path.basename(r.oldAudioPath).slice(-14, -4), r.oldSha256.slice(0, 10), "old request-hash filename is intentionally permitted");
  assert.equal(validateReviewedWordAudioRetirement(r, e), true);
});

test("existing exact-recognition and disclosed-ambiguity review decisions retain their exact evidence", () => {
  for (const decision of ["independent-recognizer-match", "reviewed-exact-ipa-residual-asr-ambiguity"]) {
    const { r, e } = fixture(); e.review.decision = decision;
    assert.equal(validateReviewedWordAudioRetirement(r, e), true);
  }
});

for (const [label, change] of [
  ["published old file", f => { f.e.absentAtProductionRevision = false; }],
  ["unverified commits", f => { f.e.revisionsVerified = false; }],
  ["changed comparison bytes", f => { f.e.previousBytes = Buffer.from("different"); }],
  ["changed historical source", f => { f.e.sourceBytes = Buffer.from("different"); }],
  ["missing recovery bytes", f => { delete f.e.recoveryBytes; }],
  ["changed recovery bytes", f => { f.e.recoveryBytes = Buffer.from("different"); }],
  ["escaped recovery path", f => { f.e.recoveryPathVerified = false; }],
  ["live basename reference", f => { f.e.meaningfulReferences = ["src/currentCue.js"]; }],
  ["non-word media", f => { f.r.oldAudioPath = f.r.oldAudioPath.replace("isolated_word", "guided_page"); }],
  ["path traversal", f => { f.r.oldAudioPath = "/audio/production/en-US/isolated_word/../x-0123456789.mp3"; }],
  ["wrong replacement bytes", f => { f.e.currentBytes = Buffer.from("different"); }],
  ["undecodable replacement", f => { f.e.replacementDecodes = false; }],
  ["stale report hash", f => { f.e.reviewReportVerified = false; }],
  ["wrong reviewed word", f => { f.e.review.text = "bow"; }],
  ["different reviewed voice", f => { f.e.review.voiceName = "other"; }],
  ["invented review status", f => { f.e.review.decision = "pending"; }],
  ["removed ambiguity disclosure", f => { f.e.repair.reviewEvidence = "all passed"; }],
  ["wrong bows pronunciation", f => { f.r.pronunciation = "boʊz"; }],
  ["stale manuscript context", f => { f.e.contexts[0].pageText = "Kit sees bows."; }],
  ["unapproved context", f => { f.e.contexts[0].approval.status = "pending"; }],
  ["duplicate contexts", f => { f.r.contexts.push(f.r.contexts[0]); }],
  ["unreviewed additional sense", f => { f.e.currentOccurrences.push("other:1:The ribbon bows are red."); }],
  ["missing generator alias", f => { delete f.e.repair; }],
  ["wrong historical mapping", f => { f.e.historicalWordMapping = "other"; }],
  ["wrong current default", f => { f.e.defaultResolvedPath = f.r.oldAudioPath; }],
  ["wrong regeneration output", f => { f.e.generatorResolvedPath = f.r.oldAudioPath; }],
]) test(`word retirement rejects ${label}`, () => {
  const f = fixture(); change(f);
  assert.throws(() => validateReviewedWordAudioRetirement(f.r, f.e));
});

test("rejected ribbon duplicate uses only its exact contextual repair", () => {
  const { r, e } = fixture(true);
  assert.equal(validateReviewedWordAudioRetirement(r, e), true);
});
for (const [label, change] of [
  ["bodily bow meaning", f => { f.r.pronunciation = "baʊ"; }],
  ["different book", f => { f.r.contexts[0].bookId = "world-discovery-d-14"; }],
  ["different page", f => { f.r.contexts[0].pageNumber = 7; }],
  ["unproven rejected duplicate", f => { f.e.duplicateRecoveryVerified = false; }],
  ["new global bow alias", f => { f.e.repair = {}; }],
  ["changed global bow mapping", f => { f.e.currentWordMapping = f.r.newAudioPath; }],
  ["changed dictionary resolution", f => { f.e.defaultResolvedPath = f.r.newAudioPath; }],
  ["changed dictionary bytes", f => { f.e.retainedDefaultBytes = Buffer.from("different"); }]
]) test(`ribbon retirement rejects ${label}`, () => {
  const f = fixture(true); change(f);
  assert.throws(() => validateReviewedWordAudioRetirement(f.r, f.e));
});

test("wrapper fails closed for duplicate rows and missing Git history", async () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), "word-retirement-"));
  try {
    fs.mkdirSync(path.join(root, "tools/manifests"), { recursive: true });
    const { r } = fixture();
    const scope = { scope: "world-discovery-unpublished-11-20", productionRevision: "a".repeat(40), sourceRevision: "b".repeat(40), entries: [r, r] };
    const file = path.join(root, "tools/manifests/guided-reading-book-retirements.json");
    const check = async () => {
      fs.writeFileSync(file, JSON.stringify({ schemaVersion: 1, isolatedWordSupersessions: scope }));
      return verifyReviewedWordAudioRetirements(root, [{ status: "D", path: `public${r.oldAudioPath}` }], "HEAD");
    };
    let result = await check();
    assert.equal(result.paths.size, 0); assert.match(result.failures.join(), /Duplicate isolated-word/);
    scope.entries = [r]; result = await check();
    assert.equal(result.paths.size, 0); assert.equal(result.failures.length, 1);
    assert.match(result.failures[0], /Cannot validate isolated-word retirements/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
