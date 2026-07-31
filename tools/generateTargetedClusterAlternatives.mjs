import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v15-targeted-redos"
);
const audioDirectory = path.join(outputDirectory, "audio");
const v14Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v14-tight-spec"
);
const v14ManifestPath = path.join(
  v14Directory,
  "tight-spec-consonant-redos-v14-manifest.json"
);
const v14ReviewDecisionsPath = path.join(
  outputDirectory,
  "v14-review-decisions.json"
);
const reviewTemplatePath = path.join(
  v14Directory,
  "TIGHT_SPEC_CONSONANT_REDOS_REVIEW.html"
);
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";

const expectedUnresolvedPatterns = Object.freeze([
  "ct",
  "fr",
  "ft",
  "lp",
  "nd",
  "pt",
  "tr",
  "tw",
  "xt"
]);

const onsetAlternatives = Object.freeze({
  fr: [
    {
      variant: "A",
      ipa: "fɹʌ",
      cue: "fruh",
      method: "short STRUT vowel",
      specification: "Joined /fɹ/ plus a short American /ʌ/; never 'eff–are' or 'froo'."
    },
    {
      variant: "B",
      ipa: "fɹɐ",
      cue: "fruh",
      method: "open central vowel",
      specification: "Joined /fɹ/ plus a very short open-central /ɐ/; no letter names."
    }
  ],
  tr: [
    {
      variant: "A",
      ipa: "tɹʌ",
      cue: "truh",
      method: "short STRUT vowel",
      specification: "Joined /tɹ/ plus a short American /ʌ/; never 'tee–are' or 'troo'."
    },
    {
      variant: "B",
      ipa: "tʃɹʌ",
      cue: "truh",
      method: "natural American affrication",
      specification: "Natural American joined [tʃɹ] onset plus short /ʌ/; one syllable."
    }
  ],
  tw: [
    {
      variant: "A",
      ipa: "twʌ",
      cue: "twuh",
      method: "short STRUT vowel",
      specification: "Joined /tw/ plus a short American /ʌ/; never 'tee–double-u' or 'two'."
    },
    {
      variant: "B",
      ipa: "twɐ",
      cue: "twuh",
      method: "open central vowel",
      specification: "Joined /tw/ plus a very short open-central /ɐ/; no letter names."
    }
  ]
});

const endingAlternatives = Object.freeze([
  {
    variant: "A",
    method: "extra-deep quiet support",
    fadeSeconds: 0.34,
    highpassHz: null,
    specification:
      "Same complete ending syllable, but with a 340 ms exponential fade so the support vowel is barely present."
  },
  {
    variant: "B",
    method: "quiet support plus vowel reduction",
    fadeSeconds: 0.27,
    highpassHz: 260,
    specification:
      "A 270 ms exponential fade plus low-frequency reduction to suppress the opening vowel and preserve the consonants."
  }
]);

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

function probeAudio(filePath) {
  const result = execFileSync(
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
  const parsed = JSON.parse(result);
  return {
    codecName: parsed.streams?.[0]?.codec_name,
    sampleRate: Number(parsed.streams?.[0]?.sample_rate),
    channels: Number(parsed.streams?.[0]?.channels),
    durationSeconds: Number(parsed.format?.duration),
    bytes: Number(parsed.format?.size)
  };
}

function applyEndingTreatment(sourcePath, outputPath, alternative) {
  const filters = [
    "silenceremove=start_periods=1:start_threshold=-52dB:start_silence=0.02"
  ];
  if (alternative.highpassHz) {
    filters.push(`highpass=f=${alternative.highpassHz}`);
  }
  filters.push(
    `afade=t=in:st=0:d=${alternative.fadeSeconds}:curve=exp`,
    "apad=pad_dur=0.08",
    "aresample=24000",
    "aformat=sample_fmts=fltp:channel_layouts=mono"
  );

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-i",
      sourcePath,
      "-af",
      filters.join(","),
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
    { stdio: "pipe" }
  );
}

async function synthesizeOnset(accessToken, alternative) {
  const ssml =
    `<speak><phoneme alphabet="ipa" ph="${escapeXml(alternative.ipa)}">` +
    `${escapeXml(alternative.cue)}</phoneme></speak>`;
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
        name: voiceName
      },
      audioConfig: {
        audioEncoding: "MP3"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Google TTS failed with ${response.status}: ${(await response.text()).slice(0, 1200)}`);
  }
  const result = await response.json();
  if (!result.audioContent) {
    throw new Error("Google TTS returned no audioContent.");
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
    /const records = \[[\s\S]*?\];\n[ ]{4}const storageKey = "literacypath-tight-spec-v14-review";/u;
  if (!recordBlock.test(templateHtml)) {
    throw new Error("Could not locate the V14 review record block.");
  }

  return templateHtml
    .replace(
      "<title>Tight-Spec Consonant Redos — Human Review</title>",
      "<title>Targeted Consonant Alternatives V15 — Human Review</title>"
    )
    .replace(
      "<h1>Consonant clusters — tight-spec redo</h1>",
      "<h1>Remaining consonants — A/B alternatives</h1>"
    )
    .replace(
      "19 exact-syllable candidates · forced schwa, joined blends and quiet ending vowels",
      "18 candidates · two materially different treatments for each unresolved sound"
    )
    .replaceAll("0 of 19 rated", "0 of 18 rated")
    .replace(
      `<strong>Tight review rule:</strong> onset blends must be one joined syllable ending in a short
      schwa—not letter names and not “oo.” Ending clusters may begin with a tiny support vowel, but it
      must be much quieter than the consonants. Reject separated sounds, a prominent opening vowel,
      or anything difficult for a child to imitate.`,
      `<strong>A/B review rule:</strong> compare both versions of each pattern. Mark Yes only when the
      consonants are joined, clear and easy for a child to imitate. For ending clusters, the opening
      support vowel must be barely noticeable. Both versions may be No; do not approve the better one
      unless it is genuinely production-ready.`
    )
    .replace(
      recordBlock,
      `const records = ${embeddedRecords};\n    ` +
        `const storageKey = "literacypath-targeted-clusters-v15-review";`
    )
    .replace(
      `        "display_text",
        "ipa",`,
      `        "display_text",
        "pattern",
        "variant",
        "method",
        "ipa",`
    )
    .replace(
      `          record.displayText,
          "/" + record.ipa + "/",`,
      `          record.displayText,
          record.pattern,
          record.variant,
          record.method,
          "/" + record.ipa + "/",`
    )
    .replace(
      'link.download = "tight-spec-consonant-redos-v14-review.csv";',
      'link.download = "targeted-consonant-alternatives-v15-review.csv";'
    );
}

const [v14Manifest, v14Decisions, reviewTemplate] = await Promise.all([
  readFile(v14ManifestPath, "utf8").then(JSON.parse),
  readFile(v14ReviewDecisionsPath, "utf8").then(JSON.parse),
  readFile(reviewTemplatePath, "utf8")
]);

const unresolvedDecisionRecords = v14Decisions.records
  .filter(record => record.rating !== "Yes")
  .sort((left, right) => left.display_text.localeCompare(right.display_text));
const unresolvedPatterns = unresolvedDecisionRecords.map(record =>
  String(record.display_text).split(/\s+—\s+/u)[0].trim().toLowerCase()
);

if (
  unresolvedPatterns.length !== expectedUnresolvedPatterns.length ||
  expectedUnresolvedPatterns.some(pattern => !unresolvedPatterns.includes(pattern)) ||
  unresolvedPatterns.some(pattern => !expectedUnresolvedPatterns.includes(pattern))
) {
  throw new Error(
    `Expected unresolved patterns ${expectedUnresolvedPatterns.join(", ")}, got ${unresolvedPatterns.join(", ")}.`
  );
}

await mkdir(audioDirectory, { recursive: true });

const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();
if (!accessToken) {
  throw new Error("Google Application Default Credentials did not return an access token.");
}

const generatedRecords = [];
for (const decision of unresolvedDecisionRecords) {
  const pattern = String(decision.display_text)
    .split(/\s+—\s+/u)[0]
    .trim()
    .toLowerCase();
  const sourceRecord = v14Manifest.records.find(record => record.pattern === pattern);
  if (!sourceRecord) {
    throw new Error(`No V14 source record found for ${pattern}.`);
  }

  const alternatives = onsetAlternatives[pattern] || endingAlternatives;
  for (const alternative of alternatives) {
    const clipId = `lp_pattern_${sha256(`v15:${pattern}:${alternative.variant}`).slice(0, 10)}`;
    const fileName =
      `${clipId}-${pattern}-${alternative.variant.toLowerCase()}-targeted.mp3`;
    const outputPath = path.join(audioDirectory, fileName);
    let ssml = null;
    let generationMethod;

    if (onsetAlternatives[pattern]) {
      const synthesis = await synthesizeOnset(accessToken, alternative);
      await writeFile(outputPath, synthesis.audio);
      ssml = synthesis.ssml;
      generationMethod = `direct IPA onset alternative: ${alternative.method}`;
    } else {
      applyEndingTreatment(sourceRecord.rawAudioPath, outputPath, alternative);
      generationMethod = `V14 raw syllable reprocessed: ${alternative.method}`;
    }

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
      ipa: onsetAlternatives[pattern] ? alternative.ipa : sourceRecord.ipa,
      anchor: sourceRecord.anchor,
      cue: onsetAlternatives[pattern] ? alternative.cue : sourceRecord.cue,
      group: sourceRecord.group,
      method: alternative.method,
      specification: alternative.specification,
      ssml,
      audioUrl: `audio/${fileName}`,
      audioPath: outputPath,
      voice: voiceName,
      languageCode: "en-US",
      engine: "Google Cloud Text-to-Speech Chirp 3 HD",
      generationMethod,
      durationSeconds: probe.durationSeconds,
      bytes: probe.bytes,
      sha256: sha256(audioBuffer),
      sourceReviewRating: decision.rating,
      productionOutputPath: sourceRecord.productionOutputPath
    });

    console.log(
      `${String(generatedRecords.length).padStart(2, "0")}/18 ` +
      `${pattern} ${alternative.variant} /${generatedRecords.at(-1).ipa}/ ` +
      `${alternative.method} ${probe.durationSeconds.toFixed(2)}s`
    );
  }
}

if (
  generatedRecords.length !== 18 ||
  new Set(generatedRecords.map(record => record.clipId)).size !== 18 ||
  new Set(generatedRecords.map(record => record.sha256)).size !== 18
) {
  throw new Error("The V15 batch must contain 18 distinct candidate clips.");
}

const manifestPath = path.join(
  outputDirectory,
  "targeted-consonant-alternatives-v15-manifest.json"
);
const reviewHtmlPath = path.join(
  outputDirectory,
  "TARGETED_CONSONANT_ALTERNATIVES_V15_REVIEW.html"
);
const blankCsvPath = path.join(
  outputDirectory,
  "targeted-consonant-alternatives-v15-review-blank.csv"
);

await writeFile(
  manifestPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId,
    voice: voiceName,
    v14ManifestPath,
    v14ReviewDecisionsPath,
    unresolvedPatterns,
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
