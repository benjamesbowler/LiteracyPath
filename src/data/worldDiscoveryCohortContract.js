export const WORLD_DISCOVERY_LEVELS = Object.freeze(["A", "B", "C", "D", "E"]);
export const stableWorldDiscoveryJson = value => JSON.stringify(value, (key, row) => row && typeof row === "object" && !Array.isArray(row)
  ? Object.fromEntries(Object.entries(row).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : row);

// Browser change detection; registration also pins SHA-256 evidence on disk.
export function worldDiscoveryInputFingerprint(books, reviews) {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(stableWorldDiscoveryJson({ books, reviews }))) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

export function worldDiscoveryCohortIds(cohort) {
  return WORLD_DISCOVERY_LEVELS.flatMap(level => Array.from({ length: cohort.lastNumber - cohort.firstNumber + 1 }, (_, index) =>
    `world-discovery-${level.toLowerCase()}-${String(cohort.firstNumber + index).padStart(2, "0")}`));
}

export function worldDiscoverySeriesOrder(book, cohort) {
  return cohort.index * 50 + WORLD_DISCOVERY_LEVELS.indexOf(book.appLevel) * 10 + book.number - cohort.firstNumber + 1;
}

export function validateWorldDiscoveryCohortManifest(manifest) {
  const failures = [];
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.cohorts) || !manifest.cohorts.length) return ["Invalid World Discovery cohort manifest"];
  let sawInactive = false;
  const paths = new Set();
  for (const [index, cohort] of manifest.cohorts.entries()) {
    const first = index * 10 + 1, last = first + 9;
    if (cohort.index !== index || cohort.firstNumber !== first || cohort.lastNumber !== last
      || cohort.id !== `${String(first).padStart(2, "0")}-${last}` || cohort.expectedBooks !== 50
      || !Number.isInteger(cohort.expectedPages) || cohort.expectedPages < 1 || typeof cohort.active !== "boolean") failures.push(`Invalid declared cohort ${cohort.id || index}`);
    if (!cohort.active) sawInactive = true;
    else if (sawInactive) failures.push(`${cohort.id}: cohorts must register in declared order`);
    for (const key of ["sourceDir", "cardReview", "narrationReview", "registration", ...(index ? ["narrationInventory"] : [])]) {
      const file = cohort[key];
      if (typeof file !== "string" || !/^(src\/content\/world-discovery|source-art\/world-discovery)\//.test(file + (key === "sourceDir" ? "/" : ""))
        || file.split("/").includes("..") || paths.has(file)) failures.push(`${cohort.id}: invalid or reused ${key}`);
      paths.add(file);
    }
  }
  if (!manifest.cohorts[0].active || manifest.cohorts[0].sourceDir !== "src/content/world-discovery") failures.push("Original cohort must remain active at its frozen source");
  if (manifest.targetBooks !== manifest.cohorts.reduce((total, cohort) => total + cohort.expectedBooks, 0)) failures.push("Target book count differs from declared cohorts");
  return failures;
}

export function validateWorldDiscoveryRegistration(cohort, entry) {
  const errors = [];
  const proof = entry?.registration, books = entry?.books || [];
  const expectedIds = worldDiscoveryCohortIds(cohort);
  if (entry?.id !== cohort.id || proof?.schemaVersion !== 1 || proof?.status !== "release-ready" || proof?.cohortId !== cohort.id) errors.push(`${cohort.id}: complete media registration is missing`);
  if (stableWorldDiscoveryJson(books.map(book => book.id)) !== stableWorldDiscoveryJson(expectedIds)
    || books.length !== cohort.expectedBooks || books.reduce((total, book) => total + (book.pages?.length || 0), 0) !== cohort.expectedPages) errors.push(`${cohort.id}: registered manuscripts differ from declared IDs/counts`);
  if (proof?.inputFingerprint !== worldDiscoveryInputFingerprint(books, entry?.reviews || {})) errors.push(`${cohort.id}: manuscript/review registration is stale`);
  if (!/^[a-f0-9]{64}$/.test(proof?.evidenceSha256 || "") || proof?.counts?.illustrations !== cohort.expectedPages + cohort.expectedBooks
    || proof?.counts?.cards !== cohort.expectedBooks || proof?.counts?.references !== cohort.expectedBooks + 1
    || !Number.isInteger(proof?.counts?.audioFiles) || proof.counts.audioFiles < 1) errors.push(`${cohort.id}: registered media evidence is incomplete`);
  return errors;
}

export function registeredWorldDiscoveryCohorts(manifest, entries) {
  const failures = validateWorldDiscoveryCohortManifest(manifest);
  const active = manifest.cohorts.filter(cohort => cohort.active);
  const entryIds = entries.map(entry => entry.id);
  if (stableWorldDiscoveryJson(entryIds) !== stableWorldDiscoveryJson(active.map(cohort => cohort.id))) failures.push("Generated cohort imports differ from the active manifest");
  for (const cohort of active) failures.push(...validateWorldDiscoveryRegistration(cohort, entries.find(entry => entry.id === cohort.id)));
  if (failures.length) throw Error(failures.join("\n"));
  return active.map(cohort => ({ ...entries.find(entry => entry.id === cohort.id), cohort }));
}
