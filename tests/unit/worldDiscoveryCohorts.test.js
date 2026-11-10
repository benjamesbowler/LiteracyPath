import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import manifest from "../../src/content/world-discovery/cohorts.json" with { type: "json" };
import { WORLD_DISCOVERY_REGISTERED_COHORTS } from "../../src/data/generated/worldDiscoveryCohorts.generated.js";
import { registeredWorldDiscoveryCohorts, validateWorldDiscoveryCohortManifest, validateWorldDiscoveryRegistration, worldDiscoveryCohortIds, worldDiscoverySeriesOrder } from "../../src/data/worldDiscoveryCohortContract.js";
import { adaptWorldDiscoveryBook } from "../../src/data/worldDiscoveryBookAdapter.js";
import { auditWorldDiscoveryCohort, buildWorldDiscoveryAudioPlan, collectWorldDiscoveryCohortAudio, readWorldDiscoveryCohort, validateWorldDiscoveryAudioPlan, validateWorldDiscoveryEvidenceReceipt } from "../../tools/worldDiscoveryCohortReleaseLib.mjs";
import { checkRegisteredWorldDiscoveryCohorts, worldDiscoveryCohortModule } from "../../tools/registerWorldDiscoveryCohorts.mjs";
import { validateWorldDiscoveryCohortDrafts } from "../../tools/worldDiscoveryValidationLib.mjs";
import { fingerprintBookReadingText } from "../../src/utils/guidedReading/textMetrics.js";

test("a repaired book can earn a new public shelf without moving its identity or media", () => {
  const entry = WORLD_DISCOVERY_REGISTERED_COHORTS.find(row => row.id === "21-30");
  const source = entry.books.find(row => row.id === "world-discovery-e-22");
  const review = { ...entry.reviews[source.id], appReadingLevel: "D", reviewedTextFingerprint: fingerprintBookReadingText(source) };
  const book = adaptWorldDiscoveryBook(source, review, manifest.cohorts[2], true);
  assert.equal(book.active, true);
  assert.equal(book.id, "world-discovery-e-22");
  assert.equal(book.coverImage, "/guided-reading/world-discovery/e-22/cover.webp");
  assert.equal(book.seriesOrder, 142);
  assert.equal(adaptWorldDiscoveryBook(source, { ...review, appReadingLevel: "pending" }, manifest.cohorts[2], true).active, false);
  assert.equal(adaptWorldDiscoveryBook({ ...source, title: source.title + " changed" }, review, manifest.cohorts[2], true).active, false);
});

test("three explicit cohorts declare 150 unique IDs while the first 100 retain their order and registration", () => {
  assert.deepEqual(validateWorldDiscoveryCohortManifest(manifest), []);
  assert.equal(manifest.targetBooks, 150);
  assert.equal(manifest.cohorts.length, 3);
  const ids = manifest.cohorts.flatMap(worldDiscoveryCohortIds);
  assert.equal(ids.length, 150);
  assert.equal(new Set(ids).size, 150);
  const orders = manifest.cohorts.flatMap(cohort => worldDiscoveryCohortIds(cohort).map(id => {
    const [, level, number] = id.match(/world-discovery-([a-e])-(\d+)/);
    return worldDiscoverySeriesOrder({ appLevel: level.toUpperCase(), number: Number(number) }, cohort);
  }));
  assert.deepEqual(orders, Array.from({ length: 150 }, (_, index) => index + 1));
  assert.equal(ids[49], "world-discovery-e-10");
  assert.equal(ids[50], "world-discovery-a-11");
  assert.equal(ids[99], "world-discovery-e-20");
  assert.equal(ids[100], "world-discovery-a-21");
  assert.equal(ids.at(-1), "world-discovery-e-30");
  assert.equal(manifest.cohorts[2].topicProfile, "nonfiction-discovery");
  assert.deepEqual(manifest.cohorts.slice(0, 2).map(cohort => [cohort.id, cohort.active]), [["01-10", true], ["11-20", true]]);
  const first100Ids = [1, 11].flatMap(firstNumber => [..."abcde"].flatMap(level =>
    Array.from({ length: 10 }, (_, index) => `world-discovery-${level}-${String(firstNumber + index).padStart(2, "0")}`)));
  assert.deepEqual(ids.slice(0, 100), first100Ids);
  const active = manifest.cohorts.filter(cohort => cohort.active);
  const registeredIds = registeredWorldDiscoveryCohorts(manifest, WORLD_DISCOVERY_REGISTERED_COHORTS)
    .flatMap(entry => entry.books.map(book => book.id));
  assert.deepEqual(registeredIds.slice(0, 100), first100Ids);
  assert.deepEqual(registeredIds, active.flatMap(worldDiscoveryCohortIds));
  assert.equal(registeredIds.length, active.reduce((sum, cohort) => sum + cohort.expectedBooks, 0));
  assert.equal(worldDiscoveryCohortModule(manifest).includes("cohorts/21-30"), manifest.cohorts[2].active);
});

test("topic profiles cannot reinterpret published cohorts or silently select the new cohort's topics", () => {
  for (const change of [
    value => { value.cohorts[0].topicProfile = "nonfiction-discovery"; },
    value => { value.cohorts[1].topicProfile = "nonfiction-discovery"; },
    value => { delete value.cohorts[2].topicProfile; },
    value => { value.cohorts[2].topicProfile = "original"; },
    value => { value.cohorts[2].topicProfile = "unrecognized"; }
  ]) {
    const changed = structuredClone(manifest);
    change(changed);
    assert.ok(validateWorldDiscoveryCohortManifest(changed).length > 0);
  }
});

test("inactive cohorts have no generated imports; an active flag or manuscript review cannot register a cohort", () => {
  const firstTwo = structuredClone(manifest);
  firstTwo.cohorts[2].active = false;
  assert.equal(registeredWorldDiscoveryCohorts(firstTwo, WORLD_DISCOVERY_REGISTERED_COHORTS.slice(0, 2)).length, 2);
  assert.doesNotMatch(worldDiscoveryCohortModule(firstTwo), /cohorts\/21-30/);
  firstTwo.cohorts[2].active = true;
  assert.match(worldDiscoveryCohortModule(firstTwo), /cohorts\/21-30/);
  assert.throws(() => registeredWorldDiscoveryCohorts(firstTwo, WORLD_DISCOVERY_REGISTERED_COHORTS.slice(0, 2)), /Generated cohort imports differ/);
  const firstOnly = structuredClone(manifest);
  for (const cohort of firstOnly.cohorts) cohort.active = cohort.index === 0;
  assert.equal(registeredWorldDiscoveryCohorts(firstOnly, [WORLD_DISCOVERY_REGISTERED_COHORTS[0]]).length, 1);
  assert.doesNotMatch(worldDiscoveryCohortModule(firstOnly), /cohorts\/11-20/);
  firstOnly.cohorts[1].active = true;
  assert.throws(() => registeredWorldDiscoveryCohorts(firstOnly, [WORLD_DISCOVERY_REGISTERED_COHORTS[0]]), /Generated cohort imports differ/);
  const original = WORLD_DISCOVERY_REGISTERED_COHORTS[0];
  assert.equal(adaptWorldDiscoveryBook(original.books[0], original.reviews[original.books[0].id], manifest.cohorts[0]).active, false);
  const noProof = structuredClone(original);
  delete noProof.registration;
  assert.match(validateWorldDiscoveryRegistration(manifest.cohorts[0], noProof).join("\n"), /complete media registration is missing/);
});

test("post-registration prose, scene-state, teaching support and review changes fail the runtime input binding", () => {
  const original = WORLD_DISCOVERY_REGISTERED_COHORTS[0];
  for (const change of [
    entry => { entry.books[0].title += " changed"; },
    entry => { entry.books[0].pages[0].imageBrief += " Changed state."; },
    entry => { entry.books[0].discussion.visual.prompt += " Changed cue."; },
    entry => { entry.reviews[entry.books[0].id].rationale += " Changed rationale."; }
  ]) {
    const entry = structuredClone(original);
    change(entry);
    assert.match(validateWorldDiscoveryRegistration(manifest.cohorts[0], entry).join("\n"), /registration is stale/);
  }
});

test("overlapping ranges, skipped activation order and understated target counts fail", () => {
  for (const change of [
    value => { value.cohorts[1].firstNumber = 1; },
    value => { value.cohorts[0].active = false; value.cohorts[1].active = true; },
    value => { value.targetBooks = 50; }
  ]) {
    const changed = structuredClone(manifest);
    change(changed);
    assert.ok(validateWorldDiscoveryCohortManifest(changed).length > 0);
  }
});

test("a new cohort cannot repeat a published complete manuscript under a different ID/title", () => {
  const original = WORLD_DISCOVERY_REGISTERED_COHORTS[0];
  const repeated = original.books.map(book => ({ ...structuredClone(book), number: book.number + 10,
    id: `world-discovery-${book.appLevel.toLowerCase()}-${book.number + 10}`, title: `${book.title} Again` }));
  const checked = validateWorldDiscoveryCohortDrafts([
    { cohort: manifest.cohorts[0], books: original.books }, { cohort: manifest.cohorts[1], books: repeated }
  ]);
  assert.match(checked.failures.join("\n"), /duplicates the manuscript/);
});

test("audio reuse requires exact registered clip bytes, role and text; inventories cannot omit or relabel clips", () => {
  const cohort = manifest.cohorts[0], source = readWorldDiscoveryCohort(cohort);
  const audio = collectWorldDiscoveryCohortAudio(source.books);
  const plan = buildWorldDiscoveryAudioPlan(cohort, source, audio);
  assert.equal(plan.required.length, 0);
  assert.equal(plan.reused.length, 1720);
  for (const change of [
    value => { value.reused.pop(); },
    value => { value.required.push(value.reused.pop()); },
    value => { value.reused[0].audioSha256 = "0".repeat(64); },
    value => { value.reused[0].kind = "wrong-role"; }
  ]) {
    const changed = structuredClone(plan);
    change(changed);
    assert.ok(validateWorldDiscoveryAudioPlan(changed, plan).length > 0);
  }
  const [key, first] = audio.entries().next().value;
  audio.set(key, { ...first, audioSha256: "0".repeat(64) });
  assert.equal(buildWorldDiscoveryAudioPlan(cohort, source, audio).required.length, 1);
});

test("registration rechecks actual files and rejects a changed evidence receipt without writing", async () => {
  const result = await checkRegisteredWorldDiscoveryCohorts();
  assert.equal(result.entries.length, manifest.cohorts.filter(cohort => cohort.active).length);
  const proof = result.entries[0].registration;
  assert.equal(proof.counts.illustrations, 490);
  assert.deepEqual(result.entries.slice(0, 2).map(entry => [entry.registration.cohortId, entry.registration.counts.audioFiles]), [["01-10", 1720], ["11-20", 1671]]);
  const expectedAudioFiles = { "01-10": 1720, "11-20": 1671, "21-30": 1861 };
  assert.deepEqual(result.entries.map(entry => [entry.registration.cohortId, entry.registration.counts.audioFiles]),
    manifest.cohorts.filter(cohort => cohort.active).map(cohort => [cohort.id, expectedAudioFiles[cohort.id]]));
  const nonfiction = result.entries.find(entry => entry.cohort.id === "21-30");
  if (manifest.cohorts[2].active) {
    assert.ok(nonfiction);
    assert.deepEqual(nonfiction.registration.counts, {
      books: 50, pages: 440, illustrations: 490, cards: 50, references: 51, audioFiles: 1861, screenedClips: 575
    });
    const inventory = JSON.parse(fs.readFileSync(new URL(`../../${nonfiction.cohort.narrationInventory}`, import.meta.url)));
    assert.equal(inventory.required.length, 575);
    assert.equal(inventory.reused.length, 1286);
    assert.equal(new Set([...inventory.required, ...inventory.reused].map(row => row.audioPath)).size, 1861);
    // Topic maintenance adds current consumers while every originally
    // published recording and its screening partition remain preserved.
    const originalRegistration = JSON.parse(fs.readFileSync(new URL("../../src/content/world-discovery/registrations/21-30.json", import.meta.url)));
    const originalInventory = JSON.parse(fs.readFileSync(new URL("../../source-art/world-discovery/cohorts/21-30/narration-inventory.json", import.meta.url)));
    assert.equal(originalRegistration.counts.audioFiles, 1829);
    assert.equal(originalRegistration.counts.screenedClips, 1074);
    assert.equal(originalInventory.required.length, 1074);
    assert.equal(originalInventory.reused.length, 755);
    const audioBytes = plan => [...plan.required, ...plan.reused]
      .map(row => [row.audioPath, row.audioSha256]).sort(([a], [b]) => a.localeCompare(b));
    const originalAudio = new Map(audioBytes(originalInventory));
    const currentAudio = new Map(audioBytes(inventory));
    assert.equal(originalAudio.size, 1829);
    for (const [audioPath, audioSha256] of originalAudio) {
      const actualBytes = fs.readFileSync(new URL(`../../public${audioPath}`, import.meta.url));
      assert.equal(createHash("sha256").update(actualBytes).digest("hex"), audioSha256, `${audioPath}: original published bytes changed`);
      if (currentAudio.has(audioPath)) assert.equal(currentAudio.get(audioPath), audioSha256, `${audioPath}: shared recording hash changed`);
    }
    const newToCohort = [...inventory.required, ...inventory.reused].filter(row => !originalAudio.has(row.audioPath));
    assert.equal(newToCohort.length, 173);
    assert.deepEqual(newToCohort.reduce((counts, row) => {
      counts[row.kind] = (counts[row.kind] || 0) + 1;
      return counts;
    }, {}), { page_or_title: 51, word: 122 });
    const replacementIds = new Set(["world-discovery-b-21", "world-discovery-c-21", "world-discovery-d-21", "world-discovery-e-21", "world-discovery-e-22"]);
    const replacementBooks = readWorldDiscoveryCohort(nonfiction.cohort).books.filter(book => replacementIds.has(book.id));
    assert.equal(replacementBooks.length, 5);
    const replacementAudio = collectWorldDiscoveryCohortAudio(replacementBooks);
    for (const row of newToCohort) {
      assert.equal(replacementAudio.get(row.audioPath)?.audioSha256, row.audioSha256, `${row.audioPath}: new cohort consumer must belong to a replacement book`);
    }
  } else assert.equal(nonfiction, undefined);
  const changed = structuredClone(proof);
  changed.evidenceSha256 = "0".repeat(64);
  assert.match(validateWorldDiscoveryEvidenceReceipt(proof, changed).join("\n"), /actual media bytes are stale/);
  const generated = fs.readFileSync(new URL("../../src/data/generated/worldDiscoveryCohorts.generated.js", import.meta.url), "utf8");
  assert.equal(generated, worldDiscoveryCohortModule(manifest));
  const incomplete = structuredClone(manifest);
  for (const cohort of incomplete.cohorts) cohort.active = cohort.index === 0;
  await assert.rejects(checkRegisteredWorldDiscoveryCohorts({ manifest: incomplete, complete: true, checkModule: false }), /all 150 declared books/);
});

test("authorized repairs retain the byte-pinned historical registration counts", () => {
  const hash = bytes => createHash("sha256").update(bytes).digest("hex");
  const read = relative => fs.readFileSync(new URL(`../../${relative}`, import.meta.url));
  for (const [index, historicalCount] of [1742, 1722].entries()) {
    const cohort = manifest.cohorts[index];
    const baselineBytes = read(cohort.maintenanceBaseline.path);
    assert.equal(hash(baselineBytes), cohort.maintenanceBaseline.sha256);
    const baseline = JSON.parse(baselineBytes);
    const historicalPath = `src/content/world-discovery/registrations/${cohort.id}.json`;
    assert.notEqual(cohort.registration, historicalPath);
    const pinned = baseline.historicalEvidence.find(row => row.path === historicalPath);
    const historicalBytes = read(historicalPath);
    assert.equal(hash(historicalBytes), pinned.sha256, "original receipt bytes remain unchanged");
    const original = JSON.parse(historicalBytes);
    const saved = baseline.cohorts.find(row => row.id === cohort.id);
    assert.deepEqual(original, saved.registration);
    assert.equal(original.counts.audioFiles, historicalCount);
    assert.equal(saved.audio.length, historicalCount);
  }
});

// Override evidence reads in memory so stale-proof rejection exercises the real
// cohort audit without ever rewriting a production receipt or review file.
function changedJsonRead(t, relative, change) {
  const target = fileURLToPath(new URL(`../../${relative}`, import.meta.url));
  const read = fs.readFileSync;
  const value = JSON.parse(read(target, "utf8"));
  change(value);
  const bytes = Buffer.from(JSON.stringify(value));
  let intercepted = 0;
  t.mock.method(fs, "readFileSync", (file, options) => {
    if (String(file) !== target) return read(file, options);
    intercepted += 1;
    const encoding = typeof options === "string" ? options : options?.encoding;
    return encoding ? bytes.toString(encoding) : bytes;
  });
  return () => intercepted;
}

for (const [label, change, message] of [
  ["missing current review", value => { delete value.reviewedManuscriptSource; }, /maintenance requires a current complete-book review/],
  ["wrong reviewed book", value => { value.reviewedManuscriptSource.bookId = "world-discovery-a-02"; }, /reviewed manuscript\/state is stale/],
  ["wrong manuscript path", value => { value.reviewedManuscriptSource.path = "src/content/world-discovery/level-b.json"; }, /reviewed manuscript\/state is stale/],
  ["stale manuscript hash", value => { value.reviewedManuscriptSource.sha256 = "0".repeat(64); }, /reviewed manuscript\/state is stale/]
]) test(`maintenance image receipt rejects ${label}`, async t => {
  const reads = changedJsonRead(t, "source-art/world-discovery/receipts/a-01-reference.json", change);
  await assert.rejects(auditWorldDiscoveryCohort(manifest.cohorts[0]), message);
  assert.ok(reads() > 0);
});

for (const [label, change] of [
  ["stale complete manuscript", row => { row.sourceBookSha256 = "0".repeat(64); }],
  ["stale reading text", row => { row.textFingerprint = "stale"; }],
  ["unreviewed teaching support", row => { row.fullTextPrepAndDiscussionReviewed = false; }],
  ["incomplete image sequence", row => { row.allReferencesCoversAndPagesReviewed = false; }],
  ["open finding", row => { row.openFindings = ["Unresolved text/image mismatch"]; }],
  ["stale installed image", row => { row.assets.find(asset => asset.slot === "reference").sha256 = "0".repeat(64); }],
  ["duplicate asset proof", row => { row.assets.push({ ...row.assets.find(asset => asset.slot === "reference") }); }]
]) test(`complete-book image proof rejects ${label}`, async t => {
  const receipt = JSON.parse(fs.readFileSync(new URL("../../source-art/world-discovery/receipts/a-01-reference.json", import.meta.url)));
  const reads = changedJsonRead(t, receipt.reviewedManuscriptSource.evidence,
    value => change(value.books.find(row => row.bookId === receipt.bookId)));
  await assert.rejects(auditWorldDiscoveryCohort(manifest.cohorts[0]), /complete-book inspection does not bind current text and image/);
  assert.ok(reads() > 0);
});
