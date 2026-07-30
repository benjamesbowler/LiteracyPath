import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const sourceManifestPath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v10/phonetic-cue-trial-manifest.json"
);
const v12DecisionsPath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v13-bluh-cues/v12-review-decisions.json"
);
const sourceReviewHtmlPath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v12-direct-ipa/DIRECT_IPA_MISSING_PHONEMES_REVIEW.html"
);
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v13-bluh-cues"
);
const audioDirectory = path.join(outputDirectory, "audio");
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const expectedClusterPatterns = new Set([
  "bl",
  "cl",
  "cr",
  "ct",
  "dr",
  "fl",
  "fr",
  "ft",
  "gl",
  "gr",
  "lb",
  "lp",
  "nd",
  "nk",
  "pl",
  "pr",
  "pt",
  "rk",
  "scr",
  "sl",
  "sm",
  "sn",
  "sp",
  "spl",
  "st",
  "sw",
  "tr",
  "tw",
  "xt"
]);

function patternFromDisplayText(displayText) {
  return String(displayText).split(/\s+—\s+/u)[0].trim().toLowerCase();
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function probeAudio(filePath) {
  const result = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size",
      "-of",
      "json",
      filePath
    ],
    { encoding: "utf8" }
  );
  const parsed = JSON.parse(result);
  return {
    durationSeconds: Number(parsed.format.duration),
    bytes: Number(parsed.format.size)
  };
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function buildReviewHtml(templateHtml, records) {
  const embeddedRecords = JSON.stringify(records).replaceAll("<", "\\u003c");
  const recordsPattern =
    /const records = \[[\s\S]*?\];\n[ ]{4}const storageKey = "literacypath-direct-ipa-v12-review";/u;
  const replacement =
    `const records = ${embeddedRecords};\n` +
    `    const storageKey = "literacypath-bluh-cues-v13-review";`;

  if (!recordsPattern.test(templateHtml)) {
    throw new Error("Could not locate the embedded V12 record block in the review template.");
  }

  return templateHtml
    .replace(
      "<title>Direct IPA Missing Phonemes — Human Review</title>",
      "<title>Bluh-style Consonant Clusters — Human Review</title>"
    )
    .replace(
      "<h1>Missing phonemes — direct IPA review</h1>",
      "<h1>Consonant clusters — “bluh” cue review</h1>"
    )
    .replace(
      "33 Google Chirp 3 HD Leda candidates · generated from exact IPA",
      "29 Google Chirp 3 HD Leda candidates · compact cues such as bluh, gruh and truh"
    )
    .replaceAll("0 of 33 rated", "0 of 29 rated")
    .replace(
      `<strong>Human-ear rule:</strong> approve only if the clip says the isolated sound shown in IPA,
      clearly and without a letter name, extra word, or added “uh” sound. The anchor word is a reference
      only; it should not be spoken. Blank ratings remain unreviewed.`,
      `<strong>Human-ear rule:</strong> approve when the compact cue produces a clear, useful consonant
      blend rather than separate letter names. A short trailing “uh” is expected in this experiment,
      but reject anything exaggerated, robotic or difficult for a child to imitate. Blank ratings remain unreviewed.`
    )
    .replace(recordsPattern, replacement)
    .replace(
      `record.voice + " · " + record.durationSeconds.toFixed(2) + " seconds · direct IPA";`,
      `record.voice + " · " + record.durationSeconds.toFixed(2) + " seconds · cue “" + record.cue + "”";`
    )
    .replace(
      `        "anchor",
        "rating",`,
      `        "anchor",
        "cue",
        "rating",`
    )
    .replace(
      `          record.anchor,
          saved.rating || "",`,
      `          record.anchor,
          record.cue,
          saved.rating || "",`
    )
    .replace(
      'link.download = "direct-ipa-missing-phonemes-v12-review.csv";',
      'link.download = "bluh-cue-consonant-clusters-v13-review.csv";'
    );
}

const [sourceManifest, v12Decisions, sourceReviewHtml] = await Promise.all([
  readFile(sourceManifestPath, "utf8").then(JSON.parse),
  readFile(v12DecisionsPath, "utf8").then(JSON.parse),
  readFile(sourceReviewHtmlPath, "utf8")
]);
const v12NoIds = new Set(
  v12Decisions.records
    .filter(record => record.rating === "No")
    .map(record => record.clip_id)
);
const clusterRecords = sourceManifest.records
  .filter(record => {
    const pattern = patternFromDisplayText(record.displayText);
    return v12NoIds.has(record.clipId) && expectedClusterPatterns.has(pattern);
  })
  .sort((left, right) => left.displayText.localeCompare(right.displayText));

if (
  clusterRecords.length !== 29 ||
  new Set(clusterRecords.map(record => patternFromDisplayText(record.displayText))).size !== 29
) {
  throw new Error(`Expected exactly 29 rejected consonant clusters; found ${clusterRecords.length}.`);
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
for (const [index, record] of clusterRecords.entries()) {
  const pattern = patternFromDisplayText(record.displayText);
  const cue = `${pattern}uh`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text: cue },
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
    const errorBody = await response.text();
    throw new Error(
      `${record.clipId} failed with ${response.status}: ${errorBody.slice(0, 1200)}`
    );
  }

  const result = await response.json();
  if (!result.audioContent) {
    throw new Error(`${record.clipId} returned no audioContent.`);
  }

  const audioBuffer = Buffer.from(result.audioContent, "base64");
  const audioFileName = `${record.clipId}-${cue}.mp3`;
  const audioPath = path.join(audioDirectory, audioFileName);
  await writeFile(audioPath, audioBuffer);
  const probe = probeAudio(audioPath);

  if (
    !Number.isFinite(probe.durationSeconds) ||
    probe.durationSeconds <= 0 ||
    probe.bytes <= 0
  ) {
    throw new Error(`${record.clipId} produced an invalid MP3.`);
  }

  generatedRecords.push({
    number: index + 1,
    clipId: record.clipId,
    displayText: record.displayText,
    pattern,
    ipa: String(record.pronunciation || "").trim(),
    anchor: record.anchorExample,
    cue,
    audioUrl: `audio/${audioFileName}`,
    audioPath,
    voice: voiceName,
    languageCode: "en-US",
    engine: "Google Cloud Text-to-Speech Chirp 3 HD",
    generationMethod: "literal compact consonant cue",
    durationSeconds: probe.durationSeconds,
    bytes: probe.bytes,
    sha256: sha256(audioBuffer),
    sourceReviewRating: "No",
    productionOutputPath: record.proposedOutputPath
  });
  console.log(
    `${String(index + 1).padStart(2, "0")}/29 ${record.displayText} ` +
    `cue=${cue} ${probe.durationSeconds.toFixed(2)}s`
  );
}

const manifestOutputPath = path.join(
  outputDirectory,
  "bluh-cue-consonant-clusters-v13-manifest.json"
);
const reviewHtmlPath = path.join(
  outputDirectory,
  "BLUH_CUE_CONSONANT_CLUSTERS_REVIEW.html"
);
const blankCsvPath = path.join(
  outputDirectory,
  "bluh-cue-consonant-clusters-v13-review-blank.csv"
);

await writeFile(
  manifestOutputPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId,
    voice: voiceName,
    sourceManifestPath,
    v12DecisionsPath,
    count: generatedRecords.length,
    excludedPassedTargets: ["ar — as in car", "ew — as in grew"],
    excludedNonClusterFailures: ["er — as in her", "oo — as in book"],
    records: generatedRecords
  }, null, 2)}\n`,
  "utf8"
);
await writeFile(
  reviewHtmlPath,
  buildReviewHtml(sourceReviewHtml, generatedRecords),
  "utf8"
);

const blankCsvHeaders = [
  "clip_id",
  "display_text",
  "ipa",
  "anchor",
  "cue",
  "rating",
  "notes",
  "voice",
  "audio_file"
];
const blankCsvRows = generatedRecords.map(record => [
  record.clipId,
  record.displayText,
  `/${record.ipa}/`,
  record.anchor,
  record.cue,
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
  manifestOutputPath,
  blankCsvPath,
  generated: generatedRecords.length
}));
