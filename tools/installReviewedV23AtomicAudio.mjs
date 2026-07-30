import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const reviewDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v23-rounded-atomic"
);
const reconciliationDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v24-final-audio-mapping"
);
const destinations = Object.freeze({
  r: [
    "public/audio/phonemes/r.mp3",
    "public/audio/child-mode/clean-human/graphemes/consonants/r.mp3"
  ]
});

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const [manifest, decisions] = await Promise.all([
  readFile(path.join(reviewDirectory, "rounded-atomic-v23-manifest.json"), "utf8")
    .then(JSON.parse),
  readFile(path.join(reconciliationDirectory, "v23-review-decisions.json"), "utf8")
    .then(JSON.parse)
]);
const ratingByClipId = new Map(
  decisions.records.map(record => [record.clip_id, record.rating])
);
const installed = [];
for (const [key, relativePaths] of Object.entries(destinations)) {
  const record = manifest.records.find(candidate => candidate.key === key);
  if (!record) throw new Error(`Missing V23 source for ${key}.`);
  if (ratingByClipId.get(record.clipId) !== "Yes") {
    throw new Error(`Refusing to install ${key}: it was not rated Yes.`);
  }
  const source = await readFile(record.audioPath);
  if (sha256(source) !== record.sha256) {
    throw new Error(`Source checksum changed for ${key}.`);
  }
  for (const relativePath of relativePaths) {
    const outputPath = path.join(repositoryRoot, relativePath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await copyFile(record.audioPath, outputPath);
    const copied = await readFile(outputPath);
    if (sha256(copied) !== record.sha256) {
      throw new Error(`Installed checksum mismatch for ${relativePath}.`);
    }
    installed.push({
      key,
      clipId: record.clipId,
      sourcePath: record.audioPath,
      outputPath,
      sha256: record.sha256,
      meanVolumeDb: record.meanVolumeDb
    });
  }
}
const unresolved = decisions.records
  .filter(record => record.rating !== "Yes")
  .map(record => ({
    clipId: record.clip_id,
    key: String(record.display_text).split("—")[0].trim(),
    rating: record.rating
  }));
const reportPath = path.join(
  reconciliationDirectory,
  "v23-approved-install-report.json"
);
await writeFile(
  reportPath,
  `${JSON.stringify({
    installedAt: new Date().toISOString(),
    approvedSourceClips: Object.keys(destinations).length,
    resolvedSoundKeys: Object.keys(destinations),
    installedFiles: installed.length,
    unresolved,
    installed
  }, null, 2)}\n`,
  "utf8"
);
console.log(JSON.stringify({
  reportPath,
  approvedSourceClips: Object.keys(destinations).length,
  resolvedSoundKeys: Object.keys(destinations),
  unresolvedSoundKeys: unresolved.map(record => record.key),
  installedFiles: installed.length
}, null, 2));
