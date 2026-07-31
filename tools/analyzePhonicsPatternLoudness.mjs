import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const productionDirectory = path.join(
  repositoryRoot,
  "public/audio/production/en-US/pattern"
);
const v15Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v15-targeted-redos"
);
const v16Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v16-alternate-engine"
);

function measure(filePath) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-nostats",
      "-i",
      filePath,
      "-af",
      "loudnorm=I=-18:TP=-2:LRA=7:print_format=json",
      "-f",
      "null",
      "-"
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(
      `Loudness analysis failed for ${filePath}: ${String(result.stderr).slice(-1000)}`
    );
  }
  const stderr = String(result.stderr || "");

  const jsonMatch = stderr.match(/\{\s*"input_i"[\s\S]*?\}/u);
  if (!jsonMatch) {
    throw new Error(`Could not parse loudness data for ${filePath}.`);
  }
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    integratedLufs: Number(parsed.input_i),
    truePeakDbtp: Number(parsed.input_tp),
    loudnessRangeLu: Number(parsed.input_lra),
    thresholdLufs: Number(parsed.input_thresh)
  };
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

const [productionNames, v15Manifest, v15Decisions] = await Promise.all([
  readdir(productionDirectory),
  readFile(
    path.join(v15Directory, "targeted-consonant-alternatives-v15-manifest.json"),
    "utf8"
  ).then(JSON.parse),
  readFile(path.join(v16Directory, "v15-review-decisions.json"), "utf8").then(JSON.parse)
]);

const production = productionNames
  .filter(name => name.endsWith(".mp3"))
  .sort()
  .map(name => {
    const filePath = path.join(productionDirectory, name);
    return { name, filePath, ...measure(filePath) };
  });
const productionMedianLufs = median(
  production.map(record => record.integratedLufs)
);

const decisionByClipId = new Map(
  v15Decisions.records.map(record => [record.clip_id, record])
);
const candidates = v15Manifest.records.map(record => {
  const decision = decisionByClipId.get(record.clipId);
  const loudness = measure(record.audioPath);
  return {
    clipId: record.clipId,
    pattern: record.pattern,
    variant: record.variant,
    method: record.method,
    rating: decision?.rating || "Unrated",
    audioPath: record.audioPath,
    ...loudness,
    deviationFromProductionMedianLu:
      loudness.integratedLufs - productionMedianLufs
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  production: {
    count: production.length,
    medianIntegratedLufs: productionMedianLufs,
    quietest: production
      .slice()
      .sort((left, right) => left.integratedLufs - right.integratedLufs)
      .slice(0, 5),
    loudest: production
      .slice()
      .sort((left, right) => right.integratedLufs - left.integratedLufs)
      .slice(0, 5)
  },
  candidates: candidates
    .slice()
    .sort((left, right) =>
      left.pattern.localeCompare(right.pattern) ||
      left.variant.localeCompare(right.variant)
    )
};

const outputPath = path.join(v16Directory, "v15-loudness-report.json");
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  productionMedianLufs,
  approvedCandidates: report.candidates.filter(record => record.rating === "Yes")
}, null, 2));
