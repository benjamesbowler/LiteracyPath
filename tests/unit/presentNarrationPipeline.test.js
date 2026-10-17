import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  analysePresentNarrationPcm,
  buildPresentNarrationWorklist,
  chargePresentNarrationAttempt,
  collectPresentNarrationScripts,
  inspectPresentNarrationAudio,
  installPresentNarrationWithoutOverwrite,
  presentNarrationId,
  requestPresentNarrationAudio,
  resolveSharedPresentNarration,
  validatePresentNarrationApproval,
  validatePresentNarrationResume,
  validatePresentNarrationState,
  withPresentNarrationGenerationLock
} from "../../tools/generatePresentNarration.mjs";
import { PRESENT_NARRATION_AUDIO, PRESENT_NARRATION_METADATA, PRESENT_NARRATION_WORKLIST_HASH } from "../../src/data/generated/presentNarration.generated.js";

const root = path.resolve(import.meta.dirname, "../..");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const clone = value => structuredClone(value);
function stateFor(worklist, maxTotalAttemptCharacters = 8333) {
  return {
    version: 1, worklistHash: worklist.worklistHash,
    maxTotalAttemptCharacters, submittedCharacters: 0,
    approvedRows: worklist.rows.filter(row => !row.reused).map(({ id, text, role, characters }) => ({ id, text, role, characters })),
    attempts: [], completed: {}
  };
}

test("worklist uses all exact current captions, child sentences, retell events and 270 daily cards", () => {
  const scripts = collectPresentNarrationScripts();
  const worklist = buildPresentNarrationWorklist();
  assert.equal(scripts.length, 329);
  assert.equal(scripts.filter(script=>script.source.startsWith('src/data/presentDailyReading.js:')).length,270);
  assert.equal(worklist.totalScripts, 306);
  assert.equal(worklist.reusedScripts, 7);
  assert.equal(worklist.ownedScripts, 299);
  assert.equal(worklist.oneAttemptCharacters, 5622);
  assert.equal(worklist.worklistHash, PRESENT_NARRATION_WORKLIST_HASH);
  for (const row of worklist.rows) {
    assert.equal(row.role, "sentence");
    assert.ok(row.sources.every(source => /^src\/data\/present(Vocabulary|TeachingContent|DailyReading)\.js:/.test(source)));
    assert.ok(scripts.some(script => script.text === row.text));
    if (!row.reused) assert.match(row.audio, /^\/audio\/production\/en-US\/instruction\/present-/);
  }
});

test("semantic stable IDs deduplicate equal scripts and refuse ambiguous transcript or role collisions", () => {
  const scripts = [{ text: "A cat sat.", role: "sentence", source: "one" }, { text: "A cat sat.", role: "sentence", source: "two" }];
  const worklist = buildPresentNarrationWorklist(scripts, () => null);
  assert.equal(worklist.rows.length, 1);
  assert.deepEqual(worklist.rows[0].sources, ["one", "two"]);
  assert.equal(worklist.rows[0].id, presentNarrationId("A cat sat."));
  assert.notEqual(presentNarrationId("A cat ran."), worklist.rows[0].id);
  assert.throws(() => buildPresentNarrationWorklist([{ ...scripts[0], role: "phoneme" }]), /only accepts/);
  assert.throws(() => buildPresentNarrationWorklist([...scripts, { ...scripts[0], text: "A cat sat!" }]), /collide/);
});

test("exact reuse preserves original production roles and does not substitute a component word", () => {
  assert.equal(resolveSharedPresentNarration("An apple is a fruit.").productionRole, "guided_page");
  assert.equal(resolveSharedPresentNarration("This is a map.").productionRole, "instruction");
  assert.equal(resolveSharedPresentNarration("The snake is long.").productionRole, "assessment_passage");
  assert.equal(resolveSharedPresentNarration("I put a sock on my foot."), null);
  assert.equal(resolveSharedPresentNarration("A cat sat."), null);
});

test("generation approval binds exact current scripts, source paths and the explicit hard ceiling", () => {
  const worklist = buildPresentNarrationWorklist();
  assert.doesNotThrow(() => validatePresentNarrationApproval(worklist, clone(worklist), worklist.worklistHash, 8333));
  assert.throws(() => validatePresentNarrationApproval(worklist, worklist, undefined, 8333), /matching/);
  assert.throws(() => validatePresentNarrationApproval(worklist, worklist, "0".repeat(64), 8333), /matching/);
  assert.throws(() => validatePresentNarrationApproval(worklist, worklist, worklist.worklistHash, 8334), /between 1 and 8333/);
  assert.throws(() => validatePresentNarrationApproval(worklist, worklist, worklist.worklistHash, 0), /between 1 and 8333/);
  assert.throws(() => validatePresentNarrationApproval(worklist, worklist, worklist.worklistHash, 1000), /cannot cover/);
  const changed = clone(worklist);
  changed.rows[0].text = "A different script.";
  assert.throws(() => validatePresentNarrationApproval(worklist, changed, worklist.worklistHash, 8333), /whitelist differs/);
});

test("every attempted request is charged before submission, including HTTP failures and retries", () => {
  const worklist = buildPresentNarrationWorklist([{ text: "A cat sat.", role: "sentence", source: "test" }], () => null);
  const row = worklist.rows[0];
  const state = stateFor(worklist, 20);
  const first = chargePresentNarrationAttempt(state, row);
  assert.equal(first.status, "submitting");
  assert.equal(state.submittedCharacters, 10);
  first.status = "http-failed";
  first.httpStatus = 503;
  chargePresentNarrationAttempt(state, row);
  assert.equal(state.submittedCharacters, 20);
  assert.throws(() => chargePresentNarrationAttempt(state, row), /Attempt limit/);
  const small = stateFor(worklist, 9);
  assert.throws(() => chargePresentNarrationAttempt(small, row), /before submission/);
  assert.equal(small.submittedCharacters, 0);
  assert.equal(small.attempts.length, 0);
  assert.throws(() => chargePresentNarrationAttempt(stateFor(worklist), { ...row, text: "A cat ran." }), /outside the exact approved/);
});

test("resume refuses uncertain outcomes and tampered character accounting", () => {
  const worklist = buildPresentNarrationWorklist();
  const row = worklist.rows.find(item => !item.reused);
  const state = stateFor(worklist);
  chargePresentNarrationAttempt(state, row);
  assert.doesNotThrow(() => validatePresentNarrationState(state, worklist, 8333));
  assert.throws(() => validatePresentNarrationResume(state, worklist, 8333), /unresolved response/);
  state.attempts[0].status = "unknown-outcome";
  assert.throws(() => validatePresentNarrationResume(state, worklist, 8333), /unresolved response/);
  state.attempts[0].status = "http-failed";
  assert.doesNotThrow(() => validatePresentNarrationResume(state, worklist, 8333));
  state.submittedCharacters = 0;
  assert.throws(() => validatePresentNarrationResume(state, worklist, 8333), /accounting/);
  state.submittedCharacters = row.characters;
  state.approvedRows[0].text = "A changed whitelist.";
  assert.throws(() => validatePresentNarrationResume(state, worklist, 8333), /whitelist/);
});

test("request journal commits the charge before network work and uncertain failures never expose credentials", async () => {
  const worklist = buildPresentNarrationWorklist();
  const row = worklist.rows.find(item => !item.reused);
  const state = stateFor(worklist);
  const snapshots = [];
  let fetchCalls = 0;
  await assert.rejects(requestPresentNarrationAudio(row, "test-secret-token", state, {
    persist: async current => snapshots.push(clone(current)),
    fetcher: async () => {
      fetchCalls += 1;
      assert.equal(snapshots.length, 1);
      assert.equal(snapshots[0].submittedCharacters, row.characters);
      assert.equal(snapshots[0].attempts[0].status, "submitting");
      throw new Error("test-secret-token must never be logged");
    }
  }), error => /outcome is uncertain/.test(error.message) && !/test-secret-token/.test(error.message));
  assert.equal(fetchCalls, 1);
  assert.equal(snapshots[1].attempts[0].status, "unknown-outcome");
  assert.throws(() => validatePresentNarrationResume(state, worklist, 8333), /unresolved/);
});

test("HTTP failures consume characters, stop after two attempts and never read service error bodies", async () => {
  const worklist = buildPresentNarrationWorklist();
  const row = worklist.rows.find(item => !item.reused);
  const state = stateFor(worklist);
  const options = {
    persist: async () => {},
    fetcher: async () => ({ ok: false, status: 503, json: () => { throw new Error("Sensitive body must not be read"); } })
  };
  assert.deepEqual(await requestPresentNarrationAudio(row, "secret", state, options), { retryable: true, httpStatus: 503 });
  await assert.rejects(requestPresentNarrationAudio(row, "secret", state, options), /HTTP 503/);
  assert.equal(state.submittedCharacters, row.characters * 2);
  assert.equal(state.attempts.length, 2);
  await assert.rejects(requestPresentNarrationAudio(row, "secret", state, options), /Attempt limit/);
  assert.equal(state.submittedCharacters, row.characters * 2);
});

test("installation is exclusive and preserves existing production bytes", async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "present-narration-test-"));
  try {
    const source = path.join(temporaryDirectory, "new.mp3");
    const destination = path.join(temporaryDirectory, "installed.mp3");
    await fs.writeFile(source, "new-recording");
    await fs.writeFile(destination, "existing-recording");
    await assert.rejects(installPresentNarrationWithoutOverwrite(source, destination), { code: "EEXIST" });
    assert.equal(await fs.readFile(destination, "utf8"), "existing-recording");
  } finally { await fs.rm(temporaryDirectory, { recursive: true, force: true }); }
});

test("paid generation has an exclusive process lock and releases it after a known failure", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "present-narration-lock-test-"));
  try {
    await withPresentNarrationGenerationLock(async () => {
      const owner = JSON.parse(await fs.readFile(path.join(directory, "narration-generation.lock"), "utf8"));
      assert.equal(owner.pid, process.pid);
      await assert.rejects(withPresentNarrationGenerationLock(() => assert.fail("overlapping paid operation ran"), directory), /generation lock exists/);
      throw new Error("known test failure");
    }, directory).then(() => assert.fail("failure was swallowed"), error => assert.equal(error.message, "known test failure"));
    assert.equal(await withPresentNarrationGenerationLock(async () => "released", directory), "released");
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test("full signal checks detect silence, clipping and insufficient speech, while tail flags remain advisory", () => {
  const pcm = Buffer.alloc(24000 * 4);
  for (let sample = 0; sample < 22000; sample += 1) pcm.writeFloatLE(0.2 * Math.sin(sample * Math.PI / 24), sample * 4);
  const valid = analysePresentNarrationPcm(pcm, "A cat sat.");
  assert.deepEqual(valid.problems, []);
  assert.ok(valid.activeSpeechMilliseconds > 800);
  assert.ok(valid.trailingQuietMilliseconds >= 80);
  assert.ok(analysePresentNarrationPcm(Buffer.alloc(24000 * 4), "A cat sat.").problems.includes("missing-or-insufficient-spoken-signal"));
  pcm.writeFloatLE(1, 0);
  assert.ok(analysePresentNarrationPcm(pcm, "A cat sat.").problems.includes("invalid-or-clipped-samples"));
  assert.throws(() => analysePresentNarrationPcm(Buffer.alloc(3), "A cat sat."), /incomplete/);
});

test("generated lookup contains only existing exact recordings with matching actual byte provenance", async () => {
  const worklist = buildPresentNarrationWorklist();
  assert.equal(Object.keys(PRESENT_NARRATION_AUDIO).length, worklist.totalScripts);
  for (const [key, audio] of Object.entries(PRESENT_NARRATION_AUDIO)) {
    const row = worklist.rows.find(item => item.normalized === key);
    const metadata = PRESENT_NARRATION_METADATA[key];
    assert.ok(row, `No stale script: ${key}`);
    assert.equal(metadata.text, row.text);
    assert.equal(metadata.transcript, row.text);
    assert.equal(metadata.role, "sentence");
    assert.equal(metadata.audio, audio);
    assert.equal(metadata.voice, "en-US-Chirp3-HD-Leda");
    assert.equal(metadata.aiGenerated, true);
    assert.equal(metadata.humanListening, "unknown");
    const bytes = await fs.readFile(path.join(root, "public", audio.slice(1)));
    assert.equal(metadata.sha256, sha256(bytes));
    assert.equal(metadata.signal.clippedSamples, 0);
    assert.ok(metadata.signal.activeSpeechMilliseconds > 50);
    assert.ok(metadata.durationSeconds > 0);
  }
  for (const row of worklist.rows.filter(item => !PRESENT_NARRATION_AUDIO[item.normalized])) {
    assert.equal(PRESENT_NARRATION_METADATA[row.normalized], undefined);
  }
});

test("verification rejects a missing file and malformed audio, rather than accepting a nonempty asset", async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "present-narration-invalid-test-"));
  try {
    const missing = path.join(temporaryDirectory, "missing.mp3");
    await assert.rejects(inspectPresentNarrationAudio(missing, "A cat sat."), { code: "ENOENT" });
    const malformed = path.join(temporaryDirectory, "malformed.mp3");
    await fs.writeFile(malformed, "nonempty but not audio");
    await assert.rejects(inspectPresentNarrationAudio(malformed, "A cat sat."), /Undecodable/);
  } finally { await fs.rm(temporaryDirectory, { recursive: true, force: true }); }
});
