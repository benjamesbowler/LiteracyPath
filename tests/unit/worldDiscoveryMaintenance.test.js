import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { readWorldDiscoveryMaintenanceAudio, validateWorldDiscoveryMaintenancePaths, prepareWorldDiscoveryMaintenanceWrites, requireWorldDiscoveryMaintenanceBaselinePreserved } from "../../tools/worldDiscoveryMaintenanceLib.mjs";
import { repairWorldDiscoveryCohorts } from "../../tools/repairWorldDiscoveryCohorts.mjs";
const hash = value => createHash("sha256").update(value).digest("hex");
function example(change = () => {}) {
  const registrationPath = "src/content/world-discovery/registrations/01-10.json";
  const registration = { status: "release-ready", counts: { audioFiles: 2 } };
  const registrationBytes = Buffer.from(JSON.stringify(registration));
  const baseline = { schemaVersion: 1, authorization: "Explicitly requested content repair",
    historicalEvidence: [{ path: registrationPath, sha256: hash(registrationBytes) }],
    cohorts: [{ id: "01-10", registration, audio: [
      { audioPath: "/audio/production/en-US/isolated_word/cat.mp3", audioSha256: "a".repeat(64), kind: "word", texts: ["cat"] },
      { audioPath: "/audio/production/en-US/guided_page/a-cat.mp3", audioSha256: "b".repeat(64), kind: "page_or_title", texts: ["a cat"] }
    ] }] };
  change(baseline);
  const bytes = Buffer.from(JSON.stringify(baseline));
  const cohort = { id: "01-10", maintenanceBaseline: { path: "source-art/world-discovery/remediation/test/before.json", sha256: hash(bytes) } };
  const read = relative => relative === registrationPath ? registrationBytes : bytes;
  return { cohort, read, bytes };
}
test("maintenance inherits only registered words; all pages still require screening", () => {
  const x = example();
  const result = readWorldDiscoveryMaintenanceAudio(x.cohort, x);
  assert.deepEqual([...result.audio.keys()], ["/audio/production/en-US/isolated_word/cat.mp3"]);
  assert.deepEqual([...result.audio.values()][0].texts, new Set(["cat"]));
  assert.equal(result.evidence.length, 2);
});
test("maintenance rejects changed baseline or historical receipt bytes", () => {
  const x = example();
  assert.throws(() => readWorldDiscoveryMaintenanceAudio({ ...x.cohort, maintenanceBaseline: { ...x.cohort.maintenanceBaseline, sha256: "0".repeat(64) } }, x), /baseline bytes changed/);
  assert.throws(() => readWorldDiscoveryMaintenanceAudio(x.cohort, { read: file => file.endsWith("before.json") ? x.bytes : Buffer.from("{}") }), /Historical World Discovery evidence changed/);
});
test("later repairs cannot repin or relocate their registered historical audio baseline", () => {
  const { cohort } = example();
  assert.doesNotThrow(() => requireWorldDiscoveryMaintenanceBaselinePreserved(cohort, structuredClone(cohort)));
  for (const change of [
    value => { value.maintenanceBaseline.sha256 = "0".repeat(64); },
    value => { value.maintenanceBaseline.path = "source-art/world-discovery/remediation/test/replacement.json"; },
    value => { delete value.maintenanceBaseline; }
  ]) {
    const proposed = structuredClone(cohort); change(proposed);
    assert.throws(() => requireWorldDiscoveryMaintenanceBaselinePreserved(cohort, proposed), /baseline path\/hash is immutable/);
  }
  assert.doesNotThrow(() => requireWorldDiscoveryMaintenanceBaselinePreserved({ id: cohort.id }, cohort),
    "first maintenance still needs the separate historical-evidence validation");
});
test("the repair route rejects a repinned baseline before reading its proposed history", async t => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../../src/content/world-discovery/cohorts.json", import.meta.url)));
  manifest.cohorts[0].maintenanceBaseline.sha256 = "0".repeat(64);
  const proposedPath = fileURLToPath(new URL("../../.artifacts/test-repinned-maintenance.json", import.meta.url));
  const read = fs.readFileSync;
  t.mock.method(fs, "readFileSync", (file, options) => {
    if (String(file) !== proposedPath) return read(file, options);
    return JSON.stringify(manifest);
  });
  await assert.rejects(repairWorldDiscoveryCohorts(proposedPath), /baseline path\/hash is immutable/);
});
test("unregistered, duplicate, wrong-role or incomplete bindings cannot establish reuse", () => {
  for (const change of [
    b => { b.historicalEvidence = []; },
    b => { b.cohorts[0].audio.pop(); },
    b => { b.cohorts[0].audio[0].kind = "other"; },
    b => { b.cohorts[0].audio[0].texts = []; },
    b => { b.cohorts[0].audio[1] = b.cohorts[0].audio[0]; },
    b => { b.historicalEvidence[0].path = "../../outside.json"; }
  ]) { const x = example(change); assert.throws(() => readWorldDiscoveryMaintenanceAudio(x.cohort, x)); }
});

test("versioned inventory and receipt writes preserve existing bytes or require a new revision", () => {
  const inventory = "source-art/world-discovery/remediation/2026-11-09/inventory.json";
  const receipt = "src/content/world-discovery/registrations/2026-11-09/01-10.json";
  const original = Buffer.from('{"required":[], "reused":[]}');
  const files = new Map([[inventory, original]]);
  const readExisting = file => files.get(file) ?? null;
  const writes = prepareWorldDiscoveryMaintenanceWrites([
    { path: inventory, value: { reused: [], required: [] } },
    { path: receipt, value: { status: "release-ready" } }
  ], { readExisting });
  assert.equal(writes[0].shouldWrite, false, "semantic equality must not reformat already pinned bytes");
  assert.equal(writes[1].shouldWrite, true);
  assert.equal(files.get(inventory), original);
  for (const file of [inventory, receipt]) {
    assert.throws(() => prepareWorldDiscoveryMaintenanceWrites([{ path: file, value: { changed: true } }],
      { readExisting: () => original }), /different content; use a new revision/);
  }
  assert.throws(() => prepareWorldDiscoveryMaintenanceWrites([{ path: inventory, value: {} }],
    { readExisting: () => Buffer.from("broken JSON") }), /not valid JSON; use a new revision/);
});

test("all versioned writes are preflighted before a caller can write an earlier new file", () => {
  const entries = [
    { path: "source-art/world-discovery/remediation/2026-11-09/new.json", value: { required: [] } },
    { path: "source-art/world-discovery/remediation/2026-11-09/frozen.json", value: { required: ["new"] } }
  ];
  const written = [];
  assert.throws(() => {
    const prepared = prepareWorldDiscoveryMaintenanceWrites(entries, {
      readExisting: file => file.endsWith("frozen.json") ? Buffer.from('{"required":[]}') : null
    });
    for (const row of prepared) if (row.shouldWrite) written.push(row.path);
  }, /different content/);
  assert.deepEqual(written, []);
});

test("maintenance rejects aliased output paths and duplicate writes while allowing a shared baseline", () => {
  const cohorts = [0, 1].map(index => ({
    sourceDir: `src/content/world-discovery/cohorts/${index}`,
    cardReview: `source-art/world-discovery/cards-${index}.json`,
    narrationReview: `source-art/world-discovery/remediation/2026-11-09/review-${index}.json`,
    registration: `src/content/world-discovery/registrations/2026-11-09/${index}.json`,
    narrationInventory: `source-art/world-discovery/remediation/2026-11-09/inventory-${index}.json`,
    maintenanceBaseline: { path: "source-art/world-discovery/remediation/2026-11-09/before.json" }
  }));
  assert.doesNotThrow(() => validateWorldDiscoveryMaintenancePaths(cohorts));
  for (const alias of ["./0.json", "nested/../0.json", "/0.json", "nested\\0.json"]) {
    const changed = structuredClone(cohorts);
    changed[1].registration = `src/content/world-discovery/registrations/2026-11-09/${alias}`;
    assert.throws(() => validateWorldDiscoveryMaintenancePaths(changed), /canonical/);
  }
  const duplicate = structuredClone(cohorts);
  duplicate[1].registration = duplicate[0].registration;
  assert.throws(() => validateWorldDiscoveryMaintenancePaths(duplicate), /reused/);
  assert.throws(() => prepareWorldDiscoveryMaintenanceWrites([
    { path: cohorts[0].registration, value: {} }, { path: cohorts[0].registration, value: {} }
  ], { readExisting: () => null }), /reused/);
});
