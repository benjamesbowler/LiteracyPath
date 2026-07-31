import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const v15Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v15-targeted-redos"
);
const v16Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v16-alternate-engine"
);
const productionDirectory = path.join(
  repositoryRoot,
  "public/audio/production/en-US/pattern"
);
const targetLufs = -25.3;

const selections = Object.freeze({
  fr: {
    variant: "B",
    fileName: "fr-as-in-frog-ec820e30a1.mp3"
  },
  ft: {
    variant: "A",
    fileName: "ft-as-in-left-9f4bb83ac7.mp3"
  },
  lp: {
    variant: "A",
    fileName: "lp-as-in-help-26f95086a2.mp3"
  },
  tr: {
    variant: "A",
    fileName: "tr-as-in-train-7fc11cde1c.mp3"
  },
  tw: {
    variant: "A",
    fileName: "tw-as-in-twist-1614f22227.mp3"
  }
});

function runFfmpeg(args, label) {
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${String(result.stderr).slice(-1500)}`);
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
  return JSON.parse(jsonMatch[0]);
}

function normalize(sourcePath, outputPath) {
  const measured = analyze(sourcePath);
  const filter =
    `loudnorm=I=${targetLufs}:TP=-2:LRA=7:` +
    `measured_I=${measured.input_i}:` +
    `measured_TP=${measured.input_tp}:` +
    `measured_LRA=${measured.input_lra}:` +
    `measured_thresh=${measured.input_thresh}:` +
    `offset=${measured.target_offset}:linear=true:print_format=summary`;

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
  const finalLufs = Number(finalMeasurement.input_i);
  const finalTruePeak = Number(finalMeasurement.input_tp);
  if (
    !Number.isFinite(finalLufs) ||
    Math.abs(finalLufs - targetLufs) > 0.5 ||
    !Number.isFinite(finalTruePeak) ||
    finalTruePeak > -1.8
  ) {
    throw new Error(
      `${outputPath} missed loudness target: ${finalLufs} LUFS, ${finalTruePeak} dBTP.`
    );
  }
  return {
    integratedLufs: finalLufs,
    truePeakDbtp: finalTruePeak
  };
}

const [manifest, decisions] = await Promise.all([
  readFile(
    path.join(v15Directory, "targeted-consonant-alternatives-v15-manifest.json"),
    "utf8"
  ).then(JSON.parse),
  readFile(path.join(v16Directory, "v15-review-decisions.json"), "utf8").then(JSON.parse)
]);
const ratingByClipId = new Map(
  decisions.records.map(record => [record.clip_id, record.rating])
);

await mkdir(productionDirectory, { recursive: true });
const installed = [];
for (const [pattern, selection] of Object.entries(selections)) {
  const record = manifest.records.find(
    candidate =>
      candidate.pattern === pattern && candidate.variant === selection.variant
  );
  if (!record) {
    throw new Error(`Missing selected V15 candidate ${pattern} ${selection.variant}.`);
  }
  if (ratingByClipId.get(record.clipId) !== "Yes") {
    throw new Error(
      `Refusing to install ${pattern} ${selection.variant}: it was not explicitly rated Yes.`
    );
  }

  const outputPath = path.join(productionDirectory, selection.fileName);
  const loudness = normalize(record.audioPath, outputPath);
  installed.push({
    pattern,
    variant: selection.variant,
    clipId: record.clipId,
    sourcePath: record.audioPath,
    outputPath,
    targetLufs,
    ...loudness
  });
}

const reportPath = path.join(v16Directory, "v15-installed-loudness-report.json");
await writeFile(
  reportPath,
  `${JSON.stringify({ installedAt: new Date().toISOString(), installed }, null, 2)}\n`,
  "utf8"
);
console.log(JSON.stringify({ reportPath, installed }, null, 2));
