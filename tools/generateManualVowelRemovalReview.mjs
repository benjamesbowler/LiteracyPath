import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const v16Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v16-alternate-engine"
);
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v17-manual-vowel-removal"
);
const audioDirectory = path.join(outputDirectory, "audio");
const intermediateDirectory = path.join(outputDirectory, "intermediate");
const productionDirectory = path.join(
  repositoryRoot,
  "public/audio/production/en-US/pattern"
);
const manifestPath = path.join(
  v16Directory,
  "alternate-engine-ending-clusters-v16-manifest.json"
);
const reviewDecisionsPath = path.join(v16Directory, "v16-review-decisions.json");
const reviewTemplatePath = path.join(
  v16Directory,
  "ALTERNATE_ENGINE_ENDING_CLUSTERS_V16_REVIEW.html"
);
const targetLufs = -25.3;

const editSpecifications = Object.freeze({
  ct: {
    sourceVariant: "A",
    cuts: [
      {
        variant: "A",
        startSeconds: 0.245,
        method: "manual closure-boundary cut",
        specification:
          "Opening vowel removed at 245 ms; silent /k/ closure and both consonant releases retained."
      },
      {
        variant: "B",
        startSeconds: 0.275,
        method: "manual burst-boundary cut",
        specification:
          "Opening vowel and closure removed at 275 ms; starts immediately before the /k/ release."
      }
    ]
  },
  pt: {
    sourceVariant: "B",
    cuts: [
      {
        variant: "A",
        startSeconds: 0.265,
        method: "manual closure-boundary cut",
        specification:
          "Opening vowel removed at 265 ms; silent /p/ closure and the remaining cluster retained."
      },
      {
        variant: "B",
        startSeconds: 0.345,
        method: "manual burst-boundary cut",
        specification:
          "Opening vowel and closure removed at 345 ms; starts at the consonant release."
      }
    ]
  },
  xt: {
    sourceVariant: "A",
    cuts: [
      {
        variant: "A",
        startSeconds: 0.215,
        method: "manual closure-boundary cut",
        specification:
          "Opening vowel removed at 215 ms; silent /k/ closure plus /kst/ retained."
      },
      {
        variant: "B",
        startSeconds: 0.245,
        method: "manual burst-boundary cut",
        specification:
          "Opening vowel and closure removed at 245 ms; starts at the /k/ release before /st/."
      }
    ]
  }
});

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${label} failed: ${String(result.stderr || result.stdout).slice(-1800)}`
    );
  }
  return {
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || "")
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function analyzeLoudness(filePath) {
  const { stderr } = run(
    "ffmpeg",
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

function editAndNormalize(sourcePath, outputPath, intermediatePath, startSeconds) {
  run(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-nostats",
      "-i",
      sourcePath,
      "-af",
      [
        `atrim=start=${startSeconds}`,
        "asetpts=PTS-STARTPTS",
        "afade=t=in:st=0:d=0.003:curve=tri",
        "adelay=60",
        "apad=pad_dur=0.08",
        "aresample=24000",
        "aformat=sample_fmts=fltp:channel_layouts=mono"
      ].join(","),
      "-ar",
      "24000",
      "-ac",
      "1",
      "-codec:a",
      "pcm_s16le",
      intermediatePath
    ],
    `Manual vowel removal for ${sourcePath}`
  );

  const measured = analyzeLoudness(intermediatePath);
  const loudnessFilter =
    `loudnorm=I=${targetLufs}:TP=-2:LRA=7:` +
    `measured_I=${measured.input_i}:` +
    `measured_TP=${measured.input_tp}:` +
    `measured_LRA=${measured.input_lra}:` +
    `measured_thresh=${measured.input_thresh}:` +
    `offset=${measured.target_offset}:linear=true:print_format=summary`;
  run(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-nostats",
      "-i",
      intermediatePath,
      "-af",
      loudnessFilter,
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

  const finalMeasurement = analyzeLoudness(outputPath);
  return {
    integratedLufs: Number(finalMeasurement.input_i),
    truePeakDbtp: Number(finalMeasurement.input_tp)
  };
}

function probeAudio(filePath) {
  const { stdout } = run(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_entries",
      "stream=codec_name,sample_rate,channels:format=duration,size",
      "-of",
      "json",
      filePath
    ],
    `Audio probe for ${filePath}`
  );
  const parsed = JSON.parse(stdout);
  return {
    codecName: parsed.streams?.[0]?.codec_name,
    sampleRate: Number(parsed.streams?.[0]?.sample_rate),
    channels: Number(parsed.streams?.[0]?.channels),
    durationSeconds: Number(parsed.format?.duration),
    bytes: Number(parsed.format?.size)
  };
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function buildReviewHtml(templateHtml, records) {
  const embeddedRecords = JSON.stringify(records).replaceAll("<", "\\u003c");
  const recordBlock =
    /const records = \[[\s\S]*?\];\n[ ]{4}const storageKey = "literacypath-alternate-engine-clusters-v16-review";/u;
  if (!recordBlock.test(templateHtml)) {
    throw new Error("Could not locate the V16 review record block.");
  }

  return templateHtml
    .replace(
      "<title>Alternate-Engine Ending Clusters V16 — Human Review</title>",
      "<title>Manual Vowel Removal V17 — Human Review</title>"
    )
    .replace(
      "<h1>Final ending clusters — alternate voices</h1>",
      "<h1>Final ending clusters — vowel surgically removed</h1>"
    )
    .replace(
      "8 candidates · Studio-O versus Neural2-F, all volume-matched",
      "6 candidates · two manual cut points for each remaining cluster"
    )
    .replaceAll("0 of 8 rated", "0 of 6 rated")
    .replace(
      `<strong>Alternate-model review:</strong> A is Google Studio-O and B is Google Neural2-F.
      Every clip is level-matched to the production set. Mark Yes only when the complete ending cluster
      is clear and easy for a child to imitate, with only a very quiet opening support vowel. Both may
      be No; approve only genuinely production-ready audio.`,
      `<strong>Manual-edit review:</strong> the synthesized opening vowel has now been physically cut
      out at the spectrogram boundary. A preserves the silent consonant closure; B starts later at the
      consonant release. Mark Yes only if the complete cluster remains clear and child-imitable.`
    )
    .replace(
      recordBlock,
      `const records = ${embeddedRecords};\n    ` +
        `const storageKey = "literacypath-manual-vowel-removal-v17-review";`
    )
    .replace(
      'link.download = "alternate-engine-ending-clusters-v16-review.csv";',
      'link.download = "manual-vowel-removal-v17-review.csv";'
    );
}

const [manifest, decisions, reviewTemplate] = await Promise.all([
  readFile(manifestPath, "utf8").then(JSON.parse),
  readFile(reviewDecisionsPath, "utf8").then(JSON.parse),
  readFile(reviewTemplatePath, "utf8")
]);
const ratingByClipId = new Map(
  decisions.records.map(record => [record.clip_id, record.rating])
);

const approvedNd = manifest.records.find(
  record => record.pattern === "nd" && record.variant === "B"
);
if (!approvedNd || ratingByClipId.get(approvedNd.clipId) !== "Yes") {
  throw new Error("Refusing to install nd B because it was not explicitly rated Yes.");
}

await Promise.all([
  mkdir(audioDirectory, { recursive: true }),
  mkdir(intermediateDirectory, { recursive: true }),
  mkdir(productionDirectory, { recursive: true })
]);
const ndProductionFileName = "nd-as-in-hand-3c5e09aa3b.mp3";
const ndProductionPath = path.join(productionDirectory, ndProductionFileName);
await copyFile(approvedNd.audioPath, ndProductionPath);

const generatedRecords = [];
for (const [pattern, editSpecification] of Object.entries(editSpecifications)) {
  const sourceRecord = manifest.records.find(
    record =>
      record.pattern === pattern &&
      record.variant === editSpecification.sourceVariant
  );
  if (!sourceRecord) {
    throw new Error(
      `Missing V16 source ${pattern} ${editSpecification.sourceVariant}.`
    );
  }
  const sourceRating = ratingByClipId.get(sourceRecord.clipId);
  if (!["Maybe", "Yes"].includes(sourceRating)) {
    throw new Error(
      `Refusing to edit ${pattern} ${editSpecification.sourceVariant}: ` +
      `source rating was ${sourceRating}.`
    );
  }

  for (const cut of editSpecification.cuts) {
    const clipId =
      `lp_pattern_${sha256(`v17:${pattern}:${cut.startSeconds}`).slice(0, 10)}`;
    const fileStem =
      `${clipId}-${pattern}-${cut.variant.toLowerCase()}-manual-cut`;
    const outputPath = path.join(audioDirectory, `${fileStem}.mp3`);
    const intermediatePath = path.join(
      intermediateDirectory,
      `${fileStem}.wav`
    );
    const loudness = editAndNormalize(
      sourceRecord.audioPath,
      outputPath,
      intermediatePath,
      cut.startSeconds
    );
    const audioBuffer = await readFile(outputPath);
    const probe = probeAudio(outputPath);
    if (
      probe.codecName !== "mp3" ||
      probe.sampleRate !== 24000 ||
      probe.channels !== 1 ||
      !Number.isFinite(probe.durationSeconds) ||
      probe.durationSeconds <= 0 ||
      probe.bytes <= 0 ||
      !Number.isFinite(loudness.integratedLufs) ||
      Math.abs(loudness.integratedLufs - targetLufs) > 0.6 ||
      !Number.isFinite(loudness.truePeakDbtp) ||
      loudness.truePeakDbtp > -1.8
    ) {
      throw new Error(`${pattern} ${cut.variant} produced invalid edited audio.`);
    }

    generatedRecords.push({
      number: generatedRecords.length + 1,
      clipId,
      displayText: `${pattern} — as in ${sourceRecord.anchor} · ${cut.variant}`,
      pattern,
      variant: cut.variant,
      ipa: sourceRecord.ipa.replace(/^ə/u, ""),
      anchor: sourceRecord.anchor,
      cue: pattern,
      group: "ending-cluster",
      method: cut.method,
      specification: cut.specification,
      audioUrl: `audio/${fileStem}.mp3`,
      audioPath: outputPath,
      sourceClipId: sourceRecord.clipId,
      sourceVoice: sourceRecord.voice,
      sourceRating,
      manualCutSeconds: cut.startSeconds,
      voice: `${sourceRecord.voice} · manually edited`,
      languageCode: "en-US",
      engine: `${sourceRecord.engine} with manual waveform edit`,
      generationMethod: cut.method,
      targetLufs,
      ...loudness,
      durationSeconds: probe.durationSeconds,
      bytes: probe.bytes,
      sha256: sha256(audioBuffer),
      productionOutputPath: sourceRecord.productionOutputPath
    });
  }
}

if (
  generatedRecords.length !== 6 ||
  new Set(generatedRecords.map(record => record.clipId)).size !== 6 ||
  new Set(generatedRecords.map(record => record.sha256)).size !== 6
) {
  throw new Error("The V17 batch must contain six distinct edited clips.");
}

const v17ManifestPath = path.join(
  outputDirectory,
  "manual-vowel-removal-v17-manifest.json"
);
const reviewHtmlPath = path.join(
  outputDirectory,
  "MANUAL_VOWEL_REMOVAL_V17_REVIEW.html"
);
const blankCsvPath = path.join(
  outputDirectory,
  "manual-vowel-removal-v17-review-blank.csv"
);
await writeFile(
  v17ManifestPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    targetLufs,
    sourceManifestPath: manifestPath,
    sourceReviewDecisionsPath: reviewDecisionsPath,
    installedPass: {
      pattern: "nd",
      variant: "B",
      clipId: approvedNd.clipId,
      productionPath: ndProductionPath
    },
    count: generatedRecords.length,
    records: generatedRecords
  }, null, 2)}\n`,
  "utf8"
);
await writeFile(reviewHtmlPath, buildReviewHtml(reviewTemplate, generatedRecords), "utf8");

const blankCsvHeaders = [
  "clip_id",
  "display_text",
  "pattern",
  "variant",
  "method",
  "ipa",
  "anchor",
  "cue",
  "specification",
  "rating",
  "notes",
  "voice",
  "audio_file"
];
const blankCsvRows = generatedRecords.map(record => [
  record.clipId,
  record.displayText,
  record.pattern,
  record.variant,
  record.method,
  `/${record.ipa}/`,
  record.anchor,
  record.cue,
  record.specification,
  "",
  "",
  record.voice,
  record.audioUrl
]);
await writeFile(
  blankCsvPath,
  [blankCsvHeaders, ...blankCsvRows]
    .map(row => row.map(csvEscape).join(","))
    .join("\r\n") + "\r\n",
  "utf8"
);

console.log(JSON.stringify({
  reviewHtmlPath,
  v17ManifestPath,
  blankCsvPath,
  installedNd: ndProductionPath,
  generated: generatedRecords.length
}));
