import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const reviewDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v21-targeted-atomic-redos"
);
const reconciliationDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v22-reconcile"
);

const destinations = Object.freeze({
  it: [
    "public/audio/production/en-US/pattern/it-as-in-sit-7472a53417.mp3"
  ],
  o: [
    "public/audio/phonemes/short_o.mp3",
    "public/audio/child-mode/clean-human/graphemes/short_vowels/short_o.mp3"
  ],
  s: [
    "public/audio/phonemes/s.mp3",
    "public/audio/child-mode/clean-human/graphemes/consonants/s.mp3",
    "public/audio/phonemes/ss.mp3",
    "public/audio/child-mode/clean-human/graphemes/digraphs_blends/ss.mp3"
  ],
  ll: [
    "public/audio/phonemes/ll.mp3",
    "public/audio/child-mode/clean-human/graphemes/digraphs_blends/ll.mp3"
  ],
  z: [
    "public/audio/phonemes/z.mp3",
    "public/audio/child-mode/clean-human/graphemes/consonants/z.mp3"
  ],
  ong: [
    "public/audio/phonemes/ong.mp3"
  ]
});

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const [manifest, decisions] = await Promise.all([
  readFile(
    path.join(reviewDirectory, "targeted-atomic-redos-v21-manifest.json"),
    "utf8"
  ).then(JSON.parse),
  readFile(path.join(reconciliationDirectory, "v21-review-decisions.json"), "utf8")
    .then(JSON.parse)
]);
const ratingByClipId = new Map(
  decisions.records.map(record => [record.clip_id, record.rating])
);

const installed = [];
for (const [key, relativePaths] of Object.entries(destinations)) {
  const record = manifest.records.find(candidate => candidate.key === key);
  if (!record) throw new Error(`Missing V21 source record for ${key}.`);
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
      alsoResolves: key === "s" && relativePath.endsWith("/ss.mp3") ? "ss" : null,
      clipId: record.clipId,
      sourcePath: record.audioPath,
      outputPath,
      sha256: record.sha256,
      meanVolumeDb: record.meanVolumeDb
    });
  }
}

const reportPath = path.join(
  reconciliationDirectory,
  "v21-approved-install-report.json"
);
await writeFile(
  reportPath,
  `${JSON.stringify({
    installedAt: new Date().toISOString(),
    approvedSourceClips: Object.keys(destinations).length,
    resolvedSoundKeys: [...Object.keys(destinations), "ss"],
    installedFiles: installed.length,
    installed
  }, null, 2)}\n`,
  "utf8"
);
console.log(JSON.stringify({
  reportPath,
  approvedSourceClips: Object.keys(destinations).length,
  resolvedSoundKeys: [...Object.keys(destinations), "ss"],
  installedFiles: installed.length
}, null, 2));
