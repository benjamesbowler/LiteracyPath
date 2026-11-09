#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateWorldDiscoveryCohortManifest } from "../src/data/worldDiscoveryCohortContract.js";
import { readWorldDiscoveryMaintenanceAudio, validateWorldDiscoveryMaintenancePaths, prepareWorldDiscoveryMaintenanceWrites, requireWorldDiscoveryMaintenanceBaselinePreserved } from "./worldDiscoveryMaintenanceLib.mjs";
import { auditWorldDiscoveryCohort, addWorldDiscoveryApprovedAudio, buildWorldDiscoveryAudioPlan, collectWorldDiscoveryCohortAudio, readWorldDiscoveryCohort } from "./worldDiscoveryCohortReleaseLib.mjs";
import { validateWorldDiscoveryCohortDrafts } from "./worldDiscoveryValidationLib.mjs";
import { worldDiscoveryCohortModule } from "./registerWorldDiscoveryCohorts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "src/content/world-discovery/cohorts.json");
const read = file => JSON.parse(fs.readFileSync(path.resolve(root, file), "utf8"));
const writeJson = (file, value, { exclusive = false } = {}) => {
  const target = path.resolve(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + "\n", { flag: exclusive ? "wx" : "w" });
};
const requireThat = (condition, message) => { if (!condition) throw Error(message); };

// Deliberate repair registration is separate from additive cohort registration.
// It cannot activate, renumber, move or add a cohort, or overwrite its historical
// receipt. Every changed cohort must pass the same complete release audit first.
export async function repairWorldDiscoveryCohorts(manifestFile, { write = false, audioPlan = false } = {}) {
  const current = read(manifestPath), proposed = read(manifestFile);
  const errors = validateWorldDiscoveryCohortManifest(proposed);
  requireThat(!errors.length, errors.join("\n"));
  requireThat(current.targetBooks === proposed.targetBooks && current.cohorts.length === proposed.cohorts.length, "Repair cannot change declared catalogue membership");
  // Check every existing trust anchor before inspecting proposed evidence.
  // A later pending cohort must not mask a repin, nor may an earlier cohort's
  // history be read before a later cohort's immutable fields are checked.
  for (const [index, cohort] of proposed.cohorts.entries()) {
    const before = current.cohorts[index];
    for (const key of ["id", "index", "firstNumber", "lastNumber", "expectedBooks", "expectedPages", "active", "sourceDir", "cardReview"])
      requireThat(cohort[key] === before[key], `Repair cannot change ${cohort.id}:${key}`);
    requireWorldDiscoveryMaintenanceBaselinePreserved(before, cohort);
  }
  for (const cohort of proposed.cohorts) {
    requireThat(cohort.active && cohort.maintenanceBaseline, "Repair requires an already active cohort and pinned maintenance history");
  }
  validateWorldDiscoveryMaintenancePaths(proposed.cohorts);
  for (const cohort of proposed.cohorts) {
    readWorldDiscoveryMaintenanceAudio(cohort);
    requireThat(/^src\/content\/world-discovery\/registrations\/\d{4}-\d{2}-\d{2}\//.test(cohort.registration)
      && /^source-art\/world-discovery\/remediation\/\d{4}-\d{2}-\d{2}\//.test(cohort.narrationReview)
      && /^source-art\/world-discovery\/remediation\/\d{4}-\d{2}-\d{2}\//.test(cohort.narrationInventory), "Repair evidence must use new versioned paths");
  }
  const entries = [], priorAudio = new Map(), images = new Set(), plans = [];
  for (const cohort of proposed.cohorts) {
    if (audioPlan) {
      const source = readWorldDiscoveryCohort(cohort);
      plans.push({ path: cohort.narrationInventory, value: buildWorldDiscoveryAudioPlan(cohort, source, priorAudio) });
      addWorldDiscoveryApprovedAudio(priorAudio, collectWorldDiscoveryCohortAudio(source.books));
      entries.push({ ...source, cohort });
    } else {
      const audited = await auditWorldDiscoveryCohort(cohort, priorAudio);
      for (const digest of audited.imageDigests) {
        requireThat(!images.has(digest), `${cohort.id}: canonical artwork repeats a registered cohort`);
        images.add(digest);
      }
      entries.push({ ...audited, cohort });
      addWorldDiscoveryApprovedAudio(priorAudio, audited.audio);
    }
  }
  const failures = validateWorldDiscoveryCohortDrafts(entries).failures;
  requireThat(!failures.length, failures.join("\n"));
  if (audioPlan) {
    const writes = prepareWorldDiscoveryMaintenanceWrites(plans);
    if (write) for (const plan of writes.filter(row => row.shouldWrite)) writeJson(plan.path, plan.value, { exclusive: true });
    return writes.map(plan => ({ inventory: plan.path, required: plan.value.required.length, reused: plan.value.reused.length,
      written: write && plan.shouldWrite, unchanged: !plan.shouldWrite }));
  }
  const writes = prepareWorldDiscoveryMaintenanceWrites(entries.map(entry => ({ path: entry.cohort.registration, value: entry.registration })));
  if (write) {
    for (const entry of writes.filter(row => row.shouldWrite)) writeJson(entry.path, entry.value, { exclusive: true });
    fs.writeFileSync(path.join(root, "src/data/generated/worldDiscoveryCohorts.generated.js"), worldDiscoveryCohortModule(proposed));
    writeJson(manifestPath, proposed);
  }
  return { cohorts: entries.length, books: entries.reduce((n, entry) => n + entry.books.length, 0), written: write,
    next: "Run all global content, audio, visual and browser gates. Registration is not publication." };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, manifestFile, ...extra] = process.argv.slice(2);
  if (!["--plan-audio", "--audit", "--register"].includes(mode) || !manifestFile || extra.length)
    throw Error("Usage: repairWorldDiscoveryCohorts.mjs --plan-audio|--audit|--register REVIEWED_MANIFEST.json");
  console.log(JSON.stringify(await repairWorldDiscoveryCohorts(manifestFile, { write: mode !== "--audit", audioPlan: mode === "--plan-audio" }), null, 2));
}
