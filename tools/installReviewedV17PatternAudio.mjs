import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const v17Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v17-manual-vowel-removal"
);
const productionDirectory = path.join(
  repositoryRoot,
  "public/audio/production/en-US/pattern"
);
const targetLufs = -25.3;
const selections = Object.freeze({
  ct: {
    variant: "A",
    fileName: "ct-as-in-act-776a495964.mp3"
  },
  pt: {
    variant: "A",
    fileName: "pt-as-in-kept-3335a20003.mp3"
  },
  xt: {
    variant: "A",
    fileName: "xt-as-in-next-c90be54143.mp3"
  }
});

function runFfmpeg(args, label) {
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${String(result.stderr).slice(-1600)}`);
  }
  return String(result.stderr || "");
}

function analyze(filePath) {
  const stderr = runFfmpeg(
    [
      "-hide_banner",
      "-nostats",
      "-i",
      filePath,
      "-af",
      `loudnorm=I=${targetLufs}:TP=-2:LRA=7:print_format=json`,
      "-f",
      "null",
      "-"
    ],
    `Loudness analysis for ${filePath}`
  );
  const jsonMatch = stderr.match(/\{\s*"input_i"[\s\S]*?\}/u);
  if (!jsonMatch) {
    throw new Error(`Could not parse loudness data for ${filePath}.`);
  }
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    integratedLufs: Number(parsed.input_i),
    truePeakDbtp: Number(parsed.input_tp),
    loudnessRangeLu: Number(parsed.input_lra),
    thresholdLufs: Number(parsed.input_thresh),
    targetOffsetLu: Number(parsed.target_offset)
  };
}

function normalize(sourcePath, outputPath) {
  const measured = analyze(sourcePath);
  const filter =
    `loudnorm=I=${targetLufs}:TP=-2:LRA=7:` +
    `measured_I=${measured.integratedLufs}:` +
    `measured_TP=${measured.truePeakDbtp}:` +
    `measured_LRA=${measured.loudnessRangeLu}:` +
    `measured_thresh=${measured.thresholdLufs}:` +
    `offset=${measured.targetOffsetLu}:linear=true:print_format=summary`;

  runFfmpeg(
    [
      "-y",
      "-hide_banner",
      "-nostats",
      "-i",
      sourcePath,
      "-af",
      filter,
      "-ar",
      "24000",
      "-ac",
      "1",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "64k",
      outputPath
    ],
    `Loudness normalization for ${sourcePath}`
  );
  const finalMeasurement = analyze(outputPath);
  if (
    !Number.isFinite(finalMeasurement.integratedLufs) ||
    Math.abs(finalMeasurement.integratedLufs - targetLufs) > 0.6 ||
    !Number.isFinite(finalMeasurement.truePeakDbtp) ||
    finalMeasurement.truePeakDbtp > -1.8
  ) {
    throw new Error(
      `${outputPath} missed loudness target: ` +
      `${finalMeasurement.integratedLufs} LUFS, ` +
      `${finalMeasurement.truePeakDbtp} dBTP.`
    );
  }
  return finalMeasurement;
}

function median(values) {
  const sorted = values
    .filter(Number.isFinite)
    .slice()
    .sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

const [manifest, decisions] = await Promise.all([
  readFile(path.join(v17Directory, "manual-vowel-removal-v17-manifest.json"), "utf8")
    .then(JSON.parse),
  readFile(path.join(v17Directory, "v17-review-decisions.json"), "utf8")
    .then(JSON.parse)
]);
const ratingByClipId = new Map(
  decisions.records.map(record => [record.clip_id, record.rating])
);

const installed = [];
for (const [pattern, selection] of Object.entries(selections)) {
  const record = manifest.records.find(
    candidate =>
      candidate.pattern === pattern && candidate.variant === selection.variant
  );
  if (!record) {
    throw new Error(`Missing selected V17 candidate ${pattern} ${selection.variant}.`);
  }
  if (ratingByClipId.get(record.clipId) !== "Yes") {
    throw new Error(
      `Refusing to install ${pattern} ${selection.variant}: it was not rated Yes.`
    );
  }
  const outputPath = path.join(productionDirectory, selection.fileName);
  const loudness = normalize(record.audioPath, outputPath);
  installed.push({
    pattern,
    variant: selection.variant,
    clipId: record.clipId,
    reason:
      "Both variants passed; A selected because it preserves the consonant closure.",
    sourcePath: record.audioPath,
    outputPath,
    targetLufs,
    ...loudness
  });
}

const productionNames = (await readdir(productionDirectory))
  .filter(name => name.endsWith(".mp3"))
  .sort();
const productionMeasurements = productionNames.map(name => {
  const filePath = path.join(productionDirectory, name);
  return { name, ...analyze(filePath) };
});
const reportPath = path.join(v17Directory, "v17-installed-loudness-report.json");
await writeFile(
  reportPath,
  `${JSON.stringify({
    installedAt: new Date().toISOString(),
    targetLufs,
    productionBank: {
      count: productionMeasurements.length,
      medianIntegratedLufs: median(
        productionMeasurements.map(record => record.integratedLufs)
      ),
      quietest: productionMeasurements
        .slice()
        .sort((left, right) => left.integratedLufs - right.integratedLufs)
        .slice(0, 6),
      loudest: productionMeasurements
        .slice()
        .sort((left, right) => right.integratedLufs - left.integratedLufs)
        .slice(0, 6)
    },
    installed
  }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify({ reportPath, installed }, null, 2));
