import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v16-alternate-engine"
);
const audioDirectory = path.join(outputDirectory, "audio");
const rawAudioDirectory = path.join(outputDirectory, "raw-audio");
const v14ManifestPath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v14-tight-spec/tight-spec-consonant-redos-v14-manifest.json"
);
const v15ReviewDecisionsPath = path.join(
  outputDirectory,
  "v15-review-decisions.json"
);
const reviewTemplatePath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v15-targeted-redos/TARGETED_CONSONANT_ALTERNATIVES_V15_REVIEW.html"
);
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const targetLufs = -25.3;
const expectedPatterns = Object.freeze(["ct", "nd", "pt", "xt"]);
const voiceAlternatives = Object.freeze([
  {
    variant: "A",
    voice: "en-US-Studio-O",
    method: "Google Studio-O",
    engine: "Google Cloud Text-to-Speech Studio"
  },
  {
    variant: "B",
    voice: "en-US-Neural2-F",
    method: "Google Neural2-F",
    engine: "Google Cloud Text-to-Speech Neural2"
  }
]);

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

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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

function processAndNormalize(sourcePath, outputPath, intermediatePath) {
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
        "silenceremove=start_periods=1:start_threshold=-52dB:start_silence=0.02",
        "afade=t=in:st=0:d=0.12:curve=tri",
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
    `Mild support-vowel treatment for ${sourcePath}`
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
  const integratedLufs = Number(finalMeasurement.input_i);
  const truePeakDbtp = Number(finalMeasurement.input_tp);
  if (
    !Number.isFinite(integratedLufs) ||
    Math.abs(integratedLufs - targetLufs) > 0.5 ||
    !Number.isFinite(truePeakDbtp) ||
    truePeakDbtp > -1.8
  ) {
    throw new Error(
      `${outputPath} missed target: ${integratedLufs} LUFS, ${truePeakDbtp} dBTP.`
    );
  }
  return { integratedLufs, truePeakDbtp };
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

async function synthesize(accessToken, voice, ipa, cue) {
  const ssml =
    `<speak><phoneme alphabet="ipa" ph="${escapeXml(ipa)}">` +
    `${escapeXml(cue)}</phoneme></speak>`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { ssml },
      voice: {
        languageCode: "en-US",
        name: voice
      },
      audioConfig: {
        audioEncoding: "MP3"
      }
    })
  });
  if (!response.ok) {
    throw new Error(
      `${voice} failed with ${response.status}: ${(await response.text()).slice(0, 1400)}`
    );
  }
  const result = await response.json();
  if (!result.audioContent) {
    throw new Error(`${voice} returned no audioContent.`);
  }
  return {
    audio: Buffer.from(result.audioContent, "base64"),
    ssml
  };
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function buildReviewHtml(templateHtml, records) {
  const embeddedRecords = JSON.stringify(records).replaceAll("<", "\\u003c");
  const recordBlock =
    /const records = \[[\s\S]*?\];\n[ ]{4}const storageKey = "literacypath-targeted-clusters-v15-review";/u;
  if (!recordBlock.test(templateHtml)) {
    throw new Error("Could not locate the V15 review record block.");
  }

  return templateHtml
    .replace(
      "<title>Targeted Consonant Alternatives V15 — Human Review</title>",
      "<title>Alternate-Engine Ending Clusters V16 — Human Review</title>"
    )
    .replace(
      "<h1>Remaining consonants — A/B alternatives</h1>",
      "<h1>Final ending clusters — alternate voices</h1>"
    )
    .replace(
      "18 candidates · two materially different treatments for each unresolved sound",
      "8 candidates · Studio-O versus Neural2-F, all volume-matched"
    )
    .replaceAll("0 of 18 rated", "0 of 8 rated")
    .replace(
      `<strong>A/B review rule:</strong> compare both versions of each pattern. Mark Yes only when the
      consonants are joined, clear and easy for a child to imitate. For ending clusters, the opening
      support vowel must be barely noticeable. Both versions may be No; do not approve the better one
      unless it is genuinely production-ready.`,
      `<strong>Alternate-model review:</strong> A is Google Studio-O and B is Google Neural2-F.
      Every clip is level-matched to the production set. Mark Yes only when the complete ending cluster
      is clear and easy for a child to imitate, with only a very quiet opening support vowel. Both may
      be No; approve only genuinely production-ready audio.`
    )
    .replace(
      recordBlock,
      `const records = ${embeddedRecords};\n    ` +
        `const storageKey = "literacypath-alternate-engine-clusters-v16-review";`
    )
    .replace(
      'link.download = "targeted-consonant-alternatives-v15-review.csv";',
      'link.download = "alternate-engine-ending-clusters-v16-review.csv";'
    );
}

const [v14Manifest, v15Decisions, reviewTemplate] = await Promise.all([
  readFile(v14ManifestPath, "utf8").then(JSON.parse),
  readFile(v15ReviewDecisionsPath, "utf8").then(JSON.parse),
  readFile(reviewTemplatePath, "utf8")
]);

const decisionsByPattern = new Map();
for (const decision of v15Decisions.records) {
  const pattern = String(decision.pattern || "").toLowerCase();
  if (!decisionsByPattern.has(pattern)) decisionsByPattern.set(pattern, []);
  decisionsByPattern.get(pattern).push(decision.rating || "");
}
const unresolvedPatterns = [...decisionsByPattern.entries()]
  .filter(([, ratings]) => ratings.length > 0 && ratings.every(rating => rating === "No"))
  .map(([pattern]) => pattern)
  .sort();
if (
  unresolvedPatterns.length !== expectedPatterns.length ||
  expectedPatterns.some(pattern => !unresolvedPatterns.includes(pattern))
) {
  throw new Error(
    `Expected unresolved patterns ${expectedPatterns.join(", ")}, got ${unresolvedPatterns.join(", ")}.`
  );
}

await Promise.all([
  mkdir(audioDirectory, { recursive: true }),
  mkdir(rawAudioDirectory, { recursive: true })
]);
const accessToken = run(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  "Google Application Default Credentials"
).stdout.trim();
if (!accessToken) {
  throw new Error("Google Application Default Credentials returned no access token.");
}

const generatedRecords = [];
for (const pattern of unresolvedPatterns) {
  const sourceRecord = v14Manifest.records.find(record => record.pattern === pattern);
  if (!sourceRecord) {
    throw new Error(`No V14 source record found for ${pattern}.`);
  }
  for (const alternative of voiceAlternatives) {
    const clipId =
      `lp_pattern_${sha256(`v16:${pattern}:${alternative.voice}`).slice(0, 10)}`;
    const fileStem =
      `${clipId}-${pattern}-${alternative.variant.toLowerCase()}-alternate-engine`;
    const rawPath = path.join(rawAudioDirectory, `${fileStem}-raw.mp3`);
    const intermediatePath = path.join(rawAudioDirectory, `${fileStem}-treated.wav`);
    const outputPath = path.join(audioDirectory, `${fileStem}.mp3`);
    const synthesis = await synthesize(
      accessToken,
      alternative.voice,
      sourceRecord.ipa,
      sourceRecord.cue
    );
    await writeFile(rawPath, synthesis.audio);
    const loudness = processAndNormalize(rawPath, outputPath, intermediatePath);
    const audioBuffer = await readFile(outputPath);
    const probe = probeAudio(outputPath);
    if (
      probe.codecName !== "mp3" ||
      probe.sampleRate !== 24000 ||
      probe.channels !== 1 ||
      !Number.isFinite(probe.durationSeconds) ||
      probe.durationSeconds <= 0 ||
      probe.bytes <= 0
    ) {
      throw new Error(`${pattern} ${alternative.variant} produced an invalid MP3.`);
    }

    generatedRecords.push({
      number: generatedRecords.length + 1,
      clipId,
      displayText: `${sourceRecord.displayText} · ${alternative.variant}`,
      pattern,
      variant: alternative.variant,
      ipa: sourceRecord.ipa,
      anchor: sourceRecord.anchor,
      cue: sourceRecord.cue,
      group: sourceRecord.group,
      method: alternative.method,
      specification:
        `Direct /${sourceRecord.ipa}/ IPA with a mild 120 ms opening fade; ` +
        `normalized to ${targetLufs} LUFS.`,
      ssml: synthesis.ssml,
      audioUrl: `audio/${fileStem}.mp3`,
      audioPath: outputPath,
      rawAudioPath: rawPath,
      voice: alternative.voice,
      languageCode: "en-US",
      engine: alternative.engine,
      generationMethod: "direct IPA with mild support-vowel reduction",
      targetLufs,
      ...loudness,
      durationSeconds: probe.durationSeconds,
      bytes: probe.bytes,
      sha256: sha256(audioBuffer),
      productionOutputPath: sourceRecord.productionOutputPath
    });

    console.log(
      `${String(generatedRecords.length).padStart(2, "0")}/8 ` +
      `${pattern} ${alternative.variant} ${alternative.voice} ` +
      `${loudness.integratedLufs.toFixed(2)} LUFS`
    );
  }
}

if (
  generatedRecords.length !== 8 ||
  new Set(generatedRecords.map(record => record.clipId)).size !== 8 ||
  new Set(generatedRecords.map(record => record.sha256)).size !== 8
) {
  throw new Error("The V16 batch must contain eight distinct candidate clips.");
}

const manifestPath = path.join(
  outputDirectory,
  "alternate-engine-ending-clusters-v16-manifest.json"
);
const reviewHtmlPath = path.join(
  outputDirectory,
  "ALTERNATE_ENGINE_ENDING_CLUSTERS_V16_REVIEW.html"
);
const blankCsvPath = path.join(
  outputDirectory,
  "alternate-engine-ending-clusters-v16-review-blank.csv"
);
await writeFile(
  manifestPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId,
    targetLufs,
    v14ManifestPath,
    v15ReviewDecisionsPath,
    unresolvedPatterns,
    voices: voiceAlternatives,
    count: generatedRecords.length,
    records: generatedRecords
  }, null, 2)}\n`,
  "utf8"
);
await writeFile(
  reviewHtmlPath,
  buildReviewHtml(reviewTemplate, generatedRecords),
  "utf8"
);

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
  generated: generatedRecords.length
}));
