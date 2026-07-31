import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { approvedPhonicsPatternAudio } from "../src/data/approvedPhonicsPatternAudio.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v18-complete-phoneme-bank"
);
const audioDirectory = path.join(outputDirectory, "audio");
const reviewTemplatePath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v17-manual-vowel-removal/MANUAL_VOWEL_REMOVAL_V17_REVIEW.html"
);
const productionDirectory = path.join(
  repositoryRoot,
  "public/audio/production/en-US/pattern"
);
const targetLufs = -25.6;
const legacyFadePatterns = new Set(["ft", "lb", "lp", "nk", "rk"]);
const mildFadePatterns = new Set(["nd"]);
const manualCutPatterns = new Set(["ct", "pt", "xt"]);

function runFfmpeg(args, label) {
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${String(result.stderr).slice(-1600)}`);
  }
  return String(result.stderr || "");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

function normalizeForReview(sourcePath, outputPath) {
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
    `Review normalization for ${sourcePath}`
  );
  let normalized = analyze(outputPath);
  const correctionDb = targetLufs - normalized.integratedLufs;
  if (Math.abs(correctionDb) > 0.15) {
    runFfmpeg(
      [
        "-y",
        "-hide_banner",
        "-nostats",
        "-i",
        sourcePath,
        "-af",
        `${filter},volume=${correctionDb.toFixed(3)}dB`,
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
      `Review loudness correction for ${sourcePath}`
    );
    normalized = analyze(outputPath);
  }
  if (
    !Number.isFinite(normalized.integratedLufs) ||
    Math.abs(normalized.integratedLufs - targetLufs) > 0.6 ||
    !Number.isFinite(normalized.truePeakDbtp) ||
    normalized.truePeakDbtp > -1.8
  ) {
    throw new Error(
      `${outputPath} missed review loudness target: ` +
      `${normalized.integratedLufs} LUFS, ${normalized.truePeakDbtp} dBTP.`
    );
  }
  return { original: measured, normalized };
}

function probeAudio(filePath) {
  const result = spawnSync(
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
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(`Audio probe failed for ${filePath}.`);
  }
  const parsed = JSON.parse(result.stdout);
  return {
    codecName: parsed.streams?.[0]?.codec_name,
    sampleRate: Number(parsed.streams?.[0]?.sample_rate),
    channels: Number(parsed.streams?.[0]?.channels),
    durationSeconds: Number(parsed.format?.duration),
    bytes: Number(parsed.format?.size)
  };
}

function classifyTechnique(pattern) {
  if (manualCutPatterns.has(pattern)) {
    return {
      method: "NEW FORMULA — manual boundary cut",
      priority: "reference",
      specification:
        "New spectrogram-guided formula: the support vowel samples were physically removed."
    };
  }
  if (legacyFadePatterns.has(pattern)) {
    return {
      method: "REDO PRIORITY — legacy opening fade",
      priority: "legacy-fade",
      specification:
        "Earlier pass used a lowered/faded support vowel. Listen for any residual 'uh'; this is a direct candidate for the new manual-cut formula."
    };
  }
  if (mildFadePatterns.has(pattern)) {
    return {
      method: "CHECK — mild opening fade",
      priority: "mild-fade",
      specification:
        "Direct IPA with a mild opening fade. It passed previously, but compare it against the clean manual-cut reference."
    };
  }
  return {
    method: "STANDARD — existing approved phoneme",
    priority: "standard",
    specification:
      "Existing human-approved production phoneme. Reassess pronunciation, accent and child-imitability."
  };
}

function describeOriginalLevel(originalLufs) {
  const deviation = originalLufs - targetLufs;
  if (deviation <= -4) return `${Math.abs(deviation).toFixed(1)} LU quieter`;
  if (deviation < -2) return `${Math.abs(deviation).toFixed(1)} LU somewhat quieter`;
  if (deviation >= 4) return `${deviation.toFixed(1)} LU louder`;
  if (deviation > 2) return `${deviation.toFixed(1)} LU somewhat louder`;
  return "within 2 LU of bank target";
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function buildReviewHtml(templateHtml, records) {
  const embeddedRecords = JSON.stringify(records).replaceAll("<", "\\u003c");
  const recordBlock =
    /const records = \[[\s\S]*?\];\n[ ]{4}const storageKey = "literacypath-manual-vowel-removal-v17-review";/u;
  if (!recordBlock.test(templateHtml)) {
    throw new Error("Could not locate the V17 review record block.");
  }

  return templateHtml
    .replace(
      "<title>Manual Vowel Removal V17 — Human Review</title>",
      "<title>Complete Phoneme Bank V18 — Human Review</title>"
    )
    .replace(
      "<h1>Final ending clusters — vowel surgically removed</h1>",
      "<h1>Complete approved phoneme bank</h1>"
    )
    .replace(
      "6 candidates · two manual cut points for each remaining cluster",
      `${records.length} production phonemes · level-matched for a fair listening review`
    )
    .replaceAll("0 of 6 rated", `0 of ${records.length} rated`)
    .replace(
      `<strong>Manual-edit review:</strong> the synthesized opening vowel has now been physically cut
      out at the spectrogram boundary. A preserves the silent consonant closure; B starts later at the
      consonant release. Mark Yes only if the complete cluster remains clear and child-imitable.`,
      `<strong>Full-bank review:</strong> every approved production phoneme is included. Listening
      copies are normalized to the same level; each row also shows the original production loudness.
      Rows marked REDO PRIORITY used the older fade-at-the-start technique. Mark Yes to keep, Maybe
      when uncertain, Needs edit when the recording is basically usable but should receive the new
      surgical treatment, or No when it needs complete replacement.`
    )
    .replace(
      recordBlock,
      `const records = ${embeddedRecords};\n    ` +
        `const storageKey = "literacypath-complete-phoneme-bank-v18-review";`
    )
    .replace(
      'link.download = "manual-vowel-removal-v17-review.csv";',
      'link.download = "complete-phoneme-bank-v18-review.csv";'
    )
    .replace(
      "      --no-bg: #fbe8ea;",
      `      --no-bg: #fbe8ea;
      --edit: #6f4aa8;
      --edit-bg: #f0e9fb;`
    )
    .replace(
      '    .card[data-rating="No"] { border-left: 6px solid var(--no); }',
      `    .card[data-rating="No"] { border-left: 6px solid var(--no); }
    .card[data-rating="Needs edit"] { border-left: 6px solid var(--edit); }`
    )
    .replace(
      "      grid-template-columns: repeat(3, 1fr);",
      "      grid-template-columns: repeat(4, 1fr);"
    )
    .replace(
      `    .rating.no[aria-pressed="true"] {
      border-color: var(--no);
      background: var(--no-bg);
      color: var(--no);
    }`,
      `    .rating.no[aria-pressed="true"] {
      border-color: var(--no);
      background: var(--no-bg);
      color: var(--no);
    }
    .rating.needs-edit[aria-pressed="true"] {
      border-color: var(--edit);
      background: var(--edit-bg);
      color: var(--edit);
    }`
    )
    .replace(
      '        <option value="No">No only</option>',
      `        <option value="Needs edit">Needs edit only</option>
        <option value="No">No only</option>`
    )
    .replace(
      '        ["Yes", "Maybe", "No"].forEach(rating => {',
      '        ["Yes", "Maybe", "Needs edit", "No"].forEach(rating => {'
    )
    .replace(
      '          button.className = "rating " + rating.toLowerCase();',
      '          button.className = "rating " + rating.toLowerCase().replaceAll(" ", "-");'
    );
}

await mkdir(audioDirectory, { recursive: true });
const reviewTemplate = await readFile(reviewTemplatePath, "utf8");
const sortedApproved = approvedPhonicsPatternAudio
  .slice()
  .sort((left, right) =>
    left.pattern.localeCompare(right.pattern) ||
    left.anchor.localeCompare(right.anchor)
  );
const generatedRecords = [];
for (const item of sortedApproved) {
  const sourcePath = path.join(
    productionDirectory,
    path.basename(item.audioPath)
  );
  const fileName =
    `${item.clipId}-${item.pattern}-${item.anchor || "no-anchor"}-level-matched.mp3`
      .replaceAll(/[^a-zA-Z0-9._-]+/gu, "-");
  const outputPath = path.join(audioDirectory, fileName);
  const loudness = normalizeForReview(sourcePath, outputPath);
  const probe = probeAudio(outputPath);
  const audioBuffer = await readFile(outputPath);
  const technique = classifyTechnique(item.pattern);
  const levelDescription = describeOriginalLevel(
    loudness.original.integratedLufs
  );
  const displayText = item.anchor
    ? `${item.pattern} — as in ${item.anchor}`
    : item.pattern;

  generatedRecords.push({
    number: generatedRecords.length + 1,
    clipId: item.clipId,
    displayText,
    pattern: item.pattern,
    variant: technique.priority,
    ipa: item.phoneme.replaceAll("/", ""),
    anchor: item.anchor,
    cue: item.pattern,
    group: "approved-production-phoneme",
    method: technique.method,
    specification:
      `${technique.method}. ${technique.specification} Original level: ` +
      `${loudness.original.integratedLufs.toFixed(2)} LUFS ` +
      `(${levelDescription}).`,
    audioUrl: `audio/${fileName}`,
    audioPath: outputPath,
    productionAudioPath: item.audioPath,
    voice:
      `Level-matched review copy · original ` +
      `${loudness.original.integratedLufs.toFixed(2)} LUFS`,
    languageCode: "en-US",
    engine: "Approved production phoneme bank",
    generationMethod: technique.method,
    reviewTargetLufs: targetLufs,
    originalIntegratedLufs: loudness.original.integratedLufs,
    originalTruePeakDbtp: loudness.original.truePeakDbtp,
    originalDeviationLu:
      loudness.original.integratedLufs - targetLufs,
    reviewIntegratedLufs: loudness.normalized.integratedLufs,
    reviewTruePeakDbtp: loudness.normalized.truePeakDbtp,
    durationSeconds: probe.durationSeconds,
    bytes: probe.bytes,
    sha256: sha256(audioBuffer)
  });

  console.log(
    `${String(generatedRecords.length).padStart(2, "0")}/${sortedApproved.length} ` +
    `${displayText} ${loudness.original.integratedLufs.toFixed(2)} -> ` +
    `${loudness.normalized.integratedLufs.toFixed(2)} LUFS`
  );
}

if (
  generatedRecords.length !== sortedApproved.length ||
  new Set(generatedRecords.map(record => record.clipId)).size !==
    generatedRecords.length ||
  new Set(generatedRecords.map(record => record.sha256)).size !==
    generatedRecords.length
) {
  throw new Error("The complete review must contain distinct copies of every approved clip.");
}

const manifestPath = path.join(
  outputDirectory,
  "complete-phoneme-bank-v18-manifest.json"
);
const reviewHtmlPath = path.join(
  outputDirectory,
  "COMPLETE_PHONEME_BANK_V18_REVIEW.html"
);
const blankCsvPath = path.join(
  outputDirectory,
  "complete-phoneme-bank-v18-review-blank.csv"
);
const priorityCounts = generatedRecords.reduce((counts, record) => {
  counts[record.variant] = (counts[record.variant] || 0) + 1;
  return counts;
}, {});
await writeFile(
  manifestPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    reviewTargetLufs: targetLufs,
    count: generatedRecords.length,
    priorityCounts,
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
  outputDirectory,
  reviewHtmlPath,
  manifestPath,
  blankCsvPath,
  generated: generatedRecords.length,
  priorityCounts
}));
