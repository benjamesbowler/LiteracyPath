import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const reviewDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v20-consistent-leda-atomic"
);
const reconciliationDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v21-reconcile"
);

const approvedAtomicKeys = new Set([
  "c", "d", "f", "g", "h", "i", "k", "l", "m", "n", "p", "q",
  "u", "v", "w", "x"
]);
const approvedLegacyKeys = new Set([
  "all", "ang", "ck", "ff", "ing", "qu", "ung", "wh"
]);
const cleanHumanDigraphKeys = new Set(["ck", "ff", "qu", "wh"]);
const approvedRepairKeys = new Set(["ou"]);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function destinationsFor(record, kind) {
  if (kind === "atomic") {
    if (["i", "u"].includes(record.key)) {
      return [
        path.join(repositoryRoot, "public/audio/phonemes", `short_${record.key}.mp3`),
        path.join(
          repositoryRoot,
          "public/audio/child-mode/clean-human/graphemes/short_vowels",
          `short_${record.key}.mp3`
        )
      ];
    }
    return [
      path.join(repositoryRoot, "public/audio/phonemes", `${record.key}.mp3`),
      path.join(
        repositoryRoot,
        "public/audio/child-mode/clean-human/graphemes/consonants",
        `${record.key}.mp3`
      )
    ];
  }

  if (kind === "legacy") {
    const destinations = [
      path.join(repositoryRoot, "public/audio/phonemes", `${record.key}.mp3`)
    ];
    if (cleanHumanDigraphKeys.has(record.key)) {
      destinations.push(
        path.join(
          repositoryRoot,
          "public/audio/child-mode/clean-human/graphemes/digraphs_blends",
          `${record.key}.mp3`
        )
      );
    }
    return destinations;
  }

  return [
    path.join(
      repositoryRoot,
      "public/audio/production/en-US/pattern",
      "ou-as-in-out-8bbcb0d3ea.mp3"
    )
  ];
}

async function installRecord(record, kind) {
  const source = await readFile(record.audioPath);
  if (sha256(source) !== record.sha256) {
    throw new Error(`Source checksum changed for ${record.key}.`);
  }

  const installed = [];
  for (const outputPath of destinationsFor(record, kind)) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await copyFile(record.audioPath, outputPath);
    const copied = await readFile(outputPath);
    if (sha256(copied) !== record.sha256) {
      throw new Error(`Installed checksum mismatch for ${outputPath}.`);
    }
    installed.push({
      key: record.key,
      kind,
      clipId: record.clipId,
      sourcePath: record.audioPath,
      outputPath,
      bytes: (await stat(outputPath)).size,
      sha256: record.sha256,
      meanVolumeDb: record.meanVolumeDb,
      integratedLufs: record.integratedLufs
    });
  }
  return installed;
}

const [manifest, decisions] = await Promise.all([
  readFile(
    path.join(reviewDirectory, "consistent-leda-atomic-v20-manifest.json"),
    "utf8"
  ).then(JSON.parse),
  readFile(path.join(reconciliationDirectory, "v20-review-decisions.json"), "utf8")
    .then(JSON.parse)
]);

const reviewedRatingByClipId = new Map(
  [...decisions.atomic.records, ...decisions.repairs.records]
    .map(record => [record.clip_id, record.rating])
);
const selections = [
  ...manifest.atomicRecords
    .filter(record => approvedAtomicKeys.has(record.key))
    .map(record => ({ record, kind: "atomic" })),
  ...manifest.legacyRecords
    .filter(record => approvedLegacyKeys.has(record.key))
    .map(record => ({ record, kind: "legacy" })),
  ...manifest.repairRecords
    .filter(record => approvedRepairKeys.has(record.key))
    .map(record => ({ record, kind: "repair" }))
];

for (const { record } of selections) {
  if (reviewedRatingByClipId.get(record.clipId) !== "Yes") {
    throw new Error(
      `Refusing to install ${record.key}: ${record.clipId} was not rated Yes.`
    );
  }
}

const installed = [];
for (const selection of selections) {
  installed.push(...await installRecord(selection.record, selection.kind));
}

const reportPath = path.join(
  reconciliationDirectory,
  "v20-approved-install-report.json"
);
await writeFile(
  reportPath,
  `${JSON.stringify({
    installedAt: new Date().toISOString(),
    approvedSourceClips: selections.length,
    installedFiles: installed.length,
    installed
  }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify({
  reportPath,
  approvedSourceClips: selections.length,
  installedFiles: installed.length
}, null, 2));
