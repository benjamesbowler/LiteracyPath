import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { validateReviewedWordAudioRetirement, verifyReviewedWordAudioRetirements, verifyReviewedWordAudioContextWithdrawals, verifyReviewedWordAudioContextAdditions } from "../../tools/lib/reviewedWordAudioRetirements.mjs";
import { stableWorldDiscoveryJson, worldDiscoveryCohortIds, worldDiscoveryInputFingerprint } from "../../src/data/worldDiscoveryCohortContract.js";

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

function withdrawalFixture(contextual = false) {
  const f = fixture(contextual);
  const cohorts = [0, 1].map(index => ({ id: index ? "11-20" : "01-10", index,
    firstNumber: index * 10 + 1, lastNumber: index * 10 + 10, expectedBooks: 50, expectedPages: 50, active: true,
    sourceDir: index ? "src/content/world-discovery/cohorts/11-20" : "src/content/world-discovery",
    cardReview: `source-art/world-discovery/cards-${index}.json`,
    narrationReview: `source-art/world-discovery/remediation/2026-11-09/review-${index}.json`,
    narrationInventory: `source-art/world-discovery/remediation/2026-11-09/inventory-${index}.json`,
    registration: `src/content/world-discovery/registrations/2026-11-09/${index ? "11-20" : "01-10"}.json`,
    maintenanceBaseline: { path: "source-art/world-discovery/remediation/2026-11-09/before.json", sha256: "a".repeat(64) } }));
  const cohort = cohorts[1], binding = f.r.contexts[0], replacementPageText = contextual ? "Kit pulls the ribbon tight." : "Kit bends forward.";
  const books = worldDiscoveryCohortIds(cohort).map(id => ({ id, pages: [{ pageNumber: id === binding.bookId ? binding.pageNumber : 1,
    text: id === binding.bookId ? replacementPageText : "We see a tree." }] }));
  const reviews = {};
  const registration = { schemaVersion: 1, cohortId: cohort.id, status: "release-ready",
    inputFingerprint: worldDiscoveryInputFingerprint(books, reviews), inputSha256: hash(stableWorldDiscoveryJson({ books, reviews })),
    evidenceSha256: "b".repeat(64), counts: { illustrations: 100, cards: 50, references: 51, audioFiles: 1 } };
  const files = new Map(), put = (file, value) => files.set(file, Buffer.from(JSON.stringify(value)));
  put("src/content/world-discovery/cohorts.json", { schemaVersion: 1, targetBooks: 100, cohorts });
  for (const level of "abcde") put(`${cohort.sourceDir}/level-${level}.json`, books.filter(b => b.id.startsWith(`world-discovery-${level}-`)));
  put(`${cohort.sourceDir}/reviews.json`, reviews); put(cohort.registration, registration);
  const manuscriptPath = `${cohort.sourceDir}/level-${binding.bookId.split("-")[2]}.json`;
  const withdrawal = { oldAudioPath: f.r.oldAudioPath, word: f.r.word, context: structuredClone(binding), replacementPageText,
    authorization: "Explicit user-authorized ESL prose repair on 2026-11-09",
    manuscript: { path: manuscriptPath, sha256: hash(files.get(manuscriptPath)) },
    registration: { path: cohort.registration, sha256: hash(files.get(cohort.registration)) } };
  const scope = { entries: [f.r], contextWithdrawals: [withdrawal] };
  const historicalBooks = structuredClone(books);
  historicalBooks.find(b => b.id === binding.bookId).pages[0].text = binding.pageText;
  const evidence = { books: structuredClone(books), contextualEntries: [], read: file => {
    assert.ok(files.has(file), `missing test evidence: ${file}`); return files.get(file);
  }, readHistorical: file => {
    assert.equal(file, manuscriptPath);
    return Buffer.from(JSON.stringify(historicalBooks.filter(b => b.id.startsWith(`world-discovery-${binding.bookId.split("-")[2]}-`))));
  } };
  const verify = () => verifyReviewedWordAudioContextWithdrawals(scope, evidence);
  const apply = () => {
    const verified = verify();
    f.e.contexts[0] = { binding, pageText: replacementPageText, approval: null, contextualEntryCount: 0,
      withdrawal: [...verified.values()][0], withdrawalVerified: true };
    f.e.currentOccurrences = [];
    return validateReviewedWordAudioRetirement(f.r, f.e);
  };
  return { ...f, scope, evidence, files, put, withdrawal, registration, cohort, verify, apply };
}

function additionFixture(withdrawOriginal = false) {
  const f = withdrawalFixture();
  if (!withdrawOriginal) {
    f.scope.contextWithdrawals = [];
    f.evidence.books.find(b => b.id === f.r.contexts[0].bookId).pages[0].text = f.r.contexts[0].pageText;
  }
  const context = { bookId: "world-discovery-d-15", pageNumber: 1, pageText: "Sam bows to Dot." };
  f.evidence.books.find(b => b.id === context.bookId).pages[0].text = context.pageText;
  for (const level of "abcde") f.put(`${f.cohort.sourceDir}/level-${level}.json`, f.evidence.books.filter(b => b.id.startsWith(`world-discovery-${level}-`)));
  f.registration.inputFingerprint = worldDiscoveryInputFingerprint(f.evidence.books, {});
  f.registration.inputSha256 = hash(stableWorldDiscoveryJson({ books: f.evidence.books, reviews: {} }));
  f.put(f.cohort.registration, f.registration);
  f.withdrawal.manuscript.sha256 = hash(f.files.get(f.withdrawal.manuscript.path));
  f.withdrawal.registration.sha256 = hash(f.files.get(f.cohort.registration));
  const addition = { oldAudioPath: f.r.oldAudioPath, word: f.r.word, meaning: f.r.meaning, pronunciation: f.r.pronunciation,
    audioPath: f.r.newAudioPath, audioSha256: f.r.newSha256, context,
    authorization: "Explicitly reviewed same-meaning use after authorized prose repair",
    manuscript: structuredClone(f.withdrawal.manuscript), registration: structuredClone(f.withdrawal.registration) };
  f.scope.contextAdditions = [addition];
  f.files.set(`public${f.r.newAudioPath}`, f.e.currentBytes);
  f.evidence.resolve = () => f.r.newAudioPath;
  const verify = () => verifyReviewedWordAudioContextAdditions(f.scope, f.evidence);
  const apply = () => {
    const additions = [...verify().values()];
    if (withdrawOriginal) {
      const withdrawals = [...verifyReviewedWordAudioContextWithdrawals(f.scope, f.evidence).values()];
      f.e.contexts[0] = { binding: f.r.contexts[0], pageText: f.withdrawal.replacementPageText,
        approval: null, contextualEntryCount: 0, withdrawal: withdrawals[0], withdrawalVerified: true };
    }
    f.e.contextAdditions = additions.map(row => ({ row, binding: row.context, verified: true }));
    const retained = withdrawOriginal ? [] : f.r.contexts;
    f.e.currentOccurrences = [...retained, context].map(c => `${c.bookId}:${c.pageNumber}:${c.pageText}`);
    return validateReviewedWordAudioRetirement(f.r, f.e);
  };
  return { ...f, addition, verify, apply };
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

test("explicit removed contexts preserve both default and contextual retirement provenance", () => {
  for (const contextual of [false, true]) {
    const f = withdrawalFixture(contextual);
    assert.equal(f.verify().size, 1);
    assert.equal(f.apply(), true);
    assert.ok(f.e.currentBytes.length && f.e.recoveryBytes.length);
    assert.equal(f.r.contexts[0].pageText, contextual ? "Kit ties a bow." : "Kit bows to Zoe.");
  }
});

for (const [label, change] of [
  ["unlisted old audio", f => { f.withdrawal.oldAudioPath = f.r.newAudioPath; }],
  ["changed original binding", f => { f.withdrawal.context.pageText = "A different old sentence with bows."; }],
  ["rewritten historical binding", f => {
    f.r.contexts[0].pageText = "Kit bows on an invented page.";
    f.withdrawal.context.pageText = f.r.contexts[0].pageText;
  }],
  ["wrong word", f => { f.withdrawal.word = "bow"; }],
  ["duplicate ledger row", f => { f.scope.contextWithdrawals.push(f.withdrawal); }],
  ["missing authorization", f => { delete f.withdrawal.authorization; }],
  ["word still present", f => { f.withdrawal.replacementPageText = "Kit bows again."; }],
  ["wrong manuscript bytes", f => { f.withdrawal.manuscript.sha256 = "0".repeat(64); }],
  ["detached manuscript path", f => { f.withdrawal.manuscript.path = ".artifacts/draft.json"; }],
  ["wrong registration bytes", f => { f.withdrawal.registration.sha256 = "0".repeat(64); }],
  ["noncurrent registration", f => { f.withdrawal.registration.path = "src/content/world-discovery/registrations/2026-11-09/other.json"; }],
  ["stale registration input", f => {
    f.registration.inputSha256 = "0".repeat(64); f.put(f.cohort.registration, f.registration);
    f.withdrawal.registration.sha256 = hash(f.files.get(f.cohort.registration));
  }],
  ["unbound other manuscript", f => {
    const file = `${f.cohort.sourceDir}/level-a.json`, books = JSON.parse(f.files.get(file));
    books[0].pages[0].text = "Another current change."; f.put(file, books);
  }],
  ["different runtime page", f => { f.evidence.books.find(b => b.id === f.withdrawal.context.bookId).pages[0].text = "Changed again."; }],
  ["retained contextual entry", f => { f.evidence.contextualEntries.push({ ...f.withdrawal.context, word: f.r.word }); }],
  ["unreadable current source", f => { f.files.delete(`${f.cohort.sourceDir}/reviews.json`); }]
]) test(`context withdrawal rejects ${label}`, () => {
  const f = withdrawalFixture(); change(f); assert.throws(f.verify);
});

test("a changed page without a listed verified withdrawal still fails the original context gate", () => {
  const f = fixture();
  f.e.contexts[0].pageText = "Kit bends forward.";
  f.e.contexts[0].approval = null; f.e.currentOccurrences = [];
  assert.throws(() => validateReviewedWordAudioRetirement(f.r, f.e), /Source page\/context resolution differs/);
  const w = withdrawalFixture(); w.apply(); w.e.contexts[0].withdrawalVerified = false;
  assert.throws(() => validateReviewedWordAudioRetirement(w.r, w.e), /Unverified withdrawn/);
});

test("withdrawal cannot bypass retained audio, generator alias or newly introduced meanings", () => {
  for (const change of [
    f => { f.e.currentBytes = Buffer.from("changed accepted audio"); },
    f => { f.e.recoveryBytes = Buffer.from("lost historical audio"); },
    f => { delete f.e.repair; },
    f => { f.e.generatorResolvedPath = f.r.oldAudioPath; },
    f => { f.e.currentOccurrences = ["other:1:The ribbon bows are red."]; }
  ]) {
    const f = withdrawalFixture(); f.apply(); change(f);
    assert.throws(() => validateReviewedWordAudioRetirement(f.r, f.e));
  }
});

test("remaining exact contexts stay strict when a different context is withdrawn", () => {
  const f = withdrawalFixture(); f.apply();
  const binding = { bookId: "world-discovery-d-14", pageNumber: 9, pageText: "Kit bows." };
  f.r.contexts.push(binding);
  const original = fixture();
  f.e.contexts.push({ ...original.e.contexts[0], binding, pageText: binding.pageText,
    approval: { ...original.e.contexts[0].approval, ...binding } });
  f.e.currentOccurrences = [`${binding.bookId}:${binding.pageNumber}:${binding.pageText}`];
  assert.equal(validateReviewedWordAudioRetirement(f.r, f.e), true);
  f.e.contexts[1].pageText = "Kit bows again.";
  assert.throws(() => validateReviewedWordAudioRetirement(f.r, f.e), /Source page\/context resolution differs/);
});

test("registered same-meaning additions extend retained contexts or accompany a verified withdrawal", () => {
  for (const withdrawn of [false, true]) {
    const f = additionFixture(withdrawn);
    assert.equal(f.verify().size, 1);
    assert.equal(f.apply(), true);
    assert.equal(f.e.currentOccurrences.length, withdrawn ? 1 : 2);
    assert.equal(f.r.contexts.length, 1, "original retirement provenance remains unchanged");
  }
});

for (const [label, change] of [
  ["unlisted old audio", f => { f.addition.oldAudioPath = f.r.newAudioPath; }],
  ["invented meaning", f => { f.addition.meaning = "ribbon loops"; }],
  ["different pronunciation", f => { f.addition.pronunciation = "boʊz"; }],
  ["different accepted audio", f => { f.addition.audioPath = f.r.oldAudioPath; }],
  ["different accepted hash", f => { f.addition.audioSha256 = "0".repeat(64); }],
  ["absent token", f => { f.addition.context.pageText = "Sam bends forward."; }],
  ["original binding relabeled new", f => { f.addition.context = structuredClone(f.r.contexts[0]); }],
  ["duplicate addition", f => { f.scope.contextAdditions.push(f.addition); }],
  ["missing authorization", f => { delete f.addition.authorization; }],
  ["changed manuscript pin", f => { f.addition.manuscript.sha256 = "0".repeat(64); }],
  ["changed registration pin", f => { f.addition.registration.sha256 = "0".repeat(64); }],
  ["noncurrent receipt", f => { f.addition.registration.path = "src/content/world-discovery/registrations/2026-11-09/other.json"; }],
  ["stale registered input", f => {
    f.registration.inputSha256 = "0".repeat(64); f.put(f.cohort.registration, f.registration);
    f.addition.registration.sha256 = hash(f.files.get(f.cohort.registration));
  }],
  ["runtime text mismatch", f => { f.evidence.books.find(b => b.id === f.addition.context.bookId).pages[0].text = "Sam bows again."; }],
  ["contextual override", f => { f.evidence.contextualEntries.push({ ...f.addition.context, word: f.r.word, audioPath: f.r.oldAudioPath }); }],
  ["wrong shared default", f => { f.evidence.resolve = (_word, context) => context ? f.r.newAudioPath : f.r.oldAudioPath; }],
  ["wrong page resolution", f => { f.evidence.resolve = (_word, context) => context ? f.r.oldAudioPath : f.r.newAudioPath; }],
  ["changed accepted bytes", f => { f.files.set(`public${f.r.newAudioPath}`, Buffer.from("changed audio")); }],
  ["contextual rather than default retirement", f => { f.r.mode = "contextual"; }]
]) test(`context addition rejects ${label}`, () => {
  const f = additionFixture(); change(f); assert.throws(f.verify);
});

test("an unlisted or unverified extra occurrence cannot enter the retirement allowance", () => {
  const f = additionFixture(); f.apply();
  delete f.e.contextAdditions;
  assert.throws(() => validateReviewedWordAudioRetirement(f.r, f.e), /unreviewed meaning\/context/);
  const g = additionFixture(); g.apply(); g.e.contextAdditions[0].verified = false;
  assert.throws(() => validateReviewedWordAudioRetirement(g.r, g.e), /Unverified added/);
});
