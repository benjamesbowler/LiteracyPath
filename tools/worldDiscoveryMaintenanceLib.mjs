import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { stableWorldDiscoveryJson } from "../src/data/worldDiscoveryCohortContract.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const requireThat = (condition, message) => { if (!condition) throw Error(message); };

function requireCanonicalPath(relative) {
  requireThat(typeof relative === "string" && relative.length > 0
    && !path.posix.isAbsolute(relative) && !relative.includes("\\")
    && !relative.split("/").includes("..") && path.posix.normalize(relative) === relative,
  `Maintenance evidence path must be canonical and repository-relative: ${relative}`);
}

// Once registered, this snapshot is the trust anchor for historical reuse.
// Re-pinning an authored replacement would let new clips claim old approval.
export function requireWorldDiscoveryMaintenanceBaselinePreserved(current, proposed) {
  if (!current.maintenanceBaseline) return;
  requireThat(proposed.maintenanceBaseline?.path === current.maintenanceBaseline.path
    && proposed.maintenanceBaseline?.sha256 === current.maintenanceBaseline.sha256,
  `${current.id}: registered maintenance baseline path/hash is immutable`);
}

export function validateWorldDiscoveryMaintenancePaths(cohorts) {
  const paths = new Set();
  for (const cohort of cohorts) {
    for (const key of ["sourceDir", "cardReview", "narrationReview", "registration", "narrationInventory"]) {
      const relative = cohort[key];
      requireCanonicalPath(relative);
      requireThat(!paths.has(relative), `Maintenance evidence path is reused: ${relative}`);
      paths.add(relative);
    }
    // A single pinned baseline is deliberately shared by all repaired cohorts.
    requireCanonicalPath(cohort.maintenanceBaseline?.path);
  }
}

// Preflight the entire batch before the caller writes any file. Existing
// evidence is immutable even when it has not yet received a registration.
// An identical JSON value is an idempotent no-op: preserve its original bytes,
// including formatting, because other receipts may already pin those bytes.
export function prepareWorldDiscoveryMaintenanceWrites(entries, {
  readExisting = relative => {
    try { return fs.readFileSync(path.resolve(root, relative)); }
    catch (error) { if (error.code === "ENOENT") return null; throw error; }
  }
} = {}) {
  const paths = new Set();
  return entries.map(({ path: relative, value }) => {
    requireCanonicalPath(relative);
    requireThat(!paths.has(relative), `Maintenance write path is reused: ${relative}`);
    paths.add(relative);
    const existing = readExisting(relative);
    if (existing !== null) {
      let parsed;
      try { parsed = JSON.parse(existing); }
      catch { throw Error(`Existing maintenance evidence is not valid JSON; use a new revision: ${relative}`); }
      requireThat(stableWorldDiscoveryJson(parsed) === stableWorldDiscoveryJson(value),
        `Maintenance evidence already exists with different content; use a new revision: ${relative}`);
    }
    return { path: relative, value, shouldWrite: existing === null };
  });
}

// A user-requested repair is a new release, not permission to rewrite the
// historical release records. Only exact, previously consumed word clips may
// inherit that history. Current pages/titles retain explicit screening rows.
export function readWorldDiscoveryMaintenanceAudio(cohort, {
  read = relative => fs.readFileSync(path.resolve(root, relative))
} = {}) {
  if (!cohort.maintenanceBaseline) return { audio: new Map(), evidence: [] };
  const pin = cohort.maintenanceBaseline;
  requireThat(/^source-art\/world-discovery\/remediation\/[a-zA-Z0-9_/-]+\.json$/.test(pin.path || "")
    && !pin.path.split("/").includes("..") && /^[a-f0-9]{64}$/.test(pin.sha256 || ""), "Invalid maintenance baseline pin");
  const bytes = read(pin.path);
  requireThat(sha256(bytes) === pin.sha256, "Maintenance baseline bytes changed");
  const baseline = JSON.parse(bytes);
  requireThat(baseline.schemaVersion === 1 && baseline.authorization?.trim()
    && Array.isArray(baseline.historicalEvidence) && baseline.historicalEvidence.length
    && baseline.cohorts?.some(row => row.id === cohort.id), "Incomplete maintenance history");
  const evidence = [{ path: pin.path, sha256: pin.sha256 }];
  for (const row of baseline.historicalEvidence) {
    requireThat(typeof row.path === "string" && /^(source-art\/world-discovery|src\/content\/world-discovery\/registrations|tests\/fixtures\/world-discovery)\//.test(row.path)
      && !row.path.split("/").includes("..") && /^[a-f0-9]{64}$/.test(row.sha256 || ""), "Invalid historical evidence path/hash");
    requireThat(sha256(read(row.path)) === row.sha256, `Historical World Discovery evidence changed: ${row.path}`);
    evidence.push(row);
  }
  const audio = new Map();
  for (const entry of baseline.cohorts) {
    const registration = `src/content/world-discovery/registrations/${entry.id}.json`;
    requireThat(evidence.some(row => row.path === registration)
      && JSON.stringify(JSON.parse(read(registration))) === JSON.stringify(entry.registration)
      && entry.registration.status === "release-ready"
      && entry.registration.counts.audioFiles === entry.audio?.length, `Unverified historical cohort: ${entry.id}`);
    const seen = new Set();
    for (const row of entry.audio) {
      requireThat(typeof row.audioPath === "string" && row.audioPath.startsWith("/audio/production/en-US/")
        && !row.audioPath.split("/").includes("..") && !seen.has(row.audioPath)
        && /^[a-f0-9]{64}$/.test(row.audioSha256 || "")
        && ["word", "page_or_title"].includes(row.kind) && Array.isArray(row.texts) && row.texts.length
        && row.texts.every(text => typeof text === "string" && text.trim()), `Invalid historical audio binding: ${row.audioPath}`);
      seen.add(row.audioPath);
      if (row.kind !== "word") continue;
      const previous = audio.get(row.audioPath);
      requireThat(!previous || previous.audioSha256 === row.audioSha256, `Historical word bytes disagree: ${row.audioPath}`);
      audio.set(row.audioPath, { ...row, texts: new Set([...(previous?.texts || []), ...row.texts]) });
    }
  }
  return { audio, evidence };
}
