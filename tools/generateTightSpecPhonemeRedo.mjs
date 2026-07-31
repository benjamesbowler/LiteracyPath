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
const v13DecisionsPath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v14-tight-spec/v13-review-decisions.json"
);
const sourceReviewHtmlPath = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v13-bluh-cues/BLUH_CUE_CONSONANT_CLUSTERS_REVIEW.html"
);
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v14-tight-spec"
);
const rawAudioDirectory = path.join(outputDirectory, "raw-audio");
const audioDirectory = path.join(outputDirectory, "audio");
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const quietOnsetFadeSeconds = 0.18;

const specifications = Object.freeze({
  ct: {
    cue: "ukt",
    ipa: "əkt",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /kt/; first 180 ms faded quieter."
  },
  fl: {
    cue: "fluh",
    ipa: "flə",
    group: "onset-blend",
    instruction: "One syllable /flə/; never letter names and never /fluː/."
  },
  fr: {
    cue: "fruh",
    ipa: "fɹə",
    group: "onset-blend",
    instruction: "One syllable /fɹə/; never letter names and never /fɹuː/."
  },
  ft: {
    cue: "uft",
    ipa: "əft",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /ft/; first 180 ms faded quieter."
  },
  lb: {
    cue: "ulb",
    ipa: "əlb",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /lb/; first 180 ms faded quieter."
  },
  lp: {
    cue: "ulp",
    ipa: "əlp",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /lp/; first 180 ms faded quieter."
  },
  nd: {
    cue: "und",
    ipa: "ənd",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /nd/; first 180 ms faded quieter."
  },
  nk: {
    cue: "unk",
    ipa: "əŋk",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /ŋk/; first 180 ms faded quieter."
  },
  pt: {
    cue: "upt",
    ipa: "əpt",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /pt/; first 180 ms faded quieter."
  },
  rk: {
    cue: "urk",
    ipa: "əɹk",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /ɹk/; first 180 ms faded quieter."
  },
  scr: {
    cue: "scruh",
    ipa: "skɹə",
    group: "onset-blend",
    instruction: "One syllable /skɹə/; never 'ess–see–are' or separated sounds."
  },
  sm: {
    cue: "smuh",
    ipa: "smə",
    group: "onset-blend",
    instruction: "One syllable /smə/; explicitly schwa, never 'smoo' /smuː/."
  },
  sn: {
    cue: "snuh",
    ipa: "snə",
    group: "onset-blend",
    instruction: "One syllable /snə/; never separated letter names."
  },
  sp: {
    cue: "spuh",
    ipa: "spə",
    group: "onset-blend",
    instruction: "One syllable /spə/; never 'ess–pee' or separated sounds."
  },
  spl: {
    cue: "spluh",
    ipa: "splə",
    group: "onset-blend",
    instruction: "One syllable /splə/; never 'ess–pee–ell' or separated sounds."
  },
  sw: {
    cue: "swuh",
    ipa: "swə",
    group: "onset-blend",
    instruction: "One syllable /swə/; explicitly schwa, never /swuː/."
  },
  tr: {
    cue: "truh",
    ipa: "tɹə",
    group: "onset-blend",
    instruction: "One syllable /tɹə/; explicitly schwa, never 'troo' /tɹuː/."
  },
  tw: {
    cue: "twuh",
    ipa: "twə",
    group: "onset-blend",
    instruction: "One syllable /twə/; explicitly schwa, never /twuː/."
  },
  xt: {
    cue: "ukst",
    ipa: "əkst",
    group: "ending-cluster",
    instruction: "Reduced initial schwa, then /kst/; first 180 ms faded quieter."
  }
});

function patternFromDisplayText(displayText) {
  return String(displayText).split(/\s+—\s+/u)[0].trim().toLowerCase();
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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

function applyQuietOnsetEnvelope(sourcePath, outputPath) {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-i",
      sourcePath,
      "-af",
      `silenceremove=start_periods=1:start_threshold=-52dB:start_silence=0.02,` +
        `afade=t=in:st=0:d=${quietOnsetFadeSeconds},apad=pad_dur=0.08`,
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

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function buildReviewHtml(templateHtml, records) {
  const embeddedRecords = JSON.stringify(records).replaceAll("<", "\\u003c");
  const recordsPattern =
    /const records = \[[\s\S]*?\];\n[ ]{4}const storageKey = "literacypath-bluh-cues-v13-review";/u;
  const replacement =
    `const records = ${embeddedRecords};\n` +
    `    const storageKey = "literacypath-tight-spec-v14-review";`;

  if (!recordsPattern.test(templateHtml)) {
    throw new Error("Could not locate the embedded V13 record block in the review template.");
  }

  return templateHtml
    .replace(
      "<title>Bluh-style Consonant Clusters — Human Review</title>",
      "<title>Tight-Spec Consonant Redos — Human Review</title>"
    )
    .replace(
      "<h1>Consonant clusters — “bluh” cue review</h1>",
      "<h1>Consonant clusters — tight-spec redo</h1>"
    )
    .replace(
      "29 Google Chirp 3 HD Leda candidates · compact cues such as bluh, gruh and truh",
      "19 exact-syllable candidates · forced schwa, joined blends and quiet ending vowels"
    )
    .replaceAll("0 of 29 rated", "0 of 19 rated")
    .replace(
      `<strong>Human-ear rule:</strong> approve when the compact cue produces a clear, useful consonant
      blend rather than separate letter names. A short trailing “uh” is expected in this experiment,
      but reject anything exaggerated, robotic or difficult for a child to imitate. Blank ratings remain unreviewed.`,
      `<strong>Tight review rule:</strong> onset blends must be one joined syllable ending in a short
      schwa—not letter names and not “oo.” Ending clusters may begin with a tiny support vowel, but it
      must be much quieter than the consonants. Reject separated sounds, a prominent opening vowel,
      or anything difficult for a child to imitate.`
    )
    .replace(recordsPattern, replacement)
    .replace(
      `record.voice + " · " + record.durationSeconds.toFixed(2) + " seconds · cue “" + record.cue + "”";`,
      `record.voice + " · " + record.durationSeconds.toFixed(2) + " seconds · " + record.specification;`
    )
    .replace(
      `        "cue",
        "rating",`,
      `        "cue",
        "specification",
        "rating",`
    )
    .replace(
      `          record.cue,
          saved.rating || "",`,
      `          record.cue,
          record.specification,
          saved.rating || "",`
    )
    .replace(
      'link.download = "bluh-cue-consonant-clusters-v13-review.csv";',
      'link.download = "tight-spec-consonant-redos-v14-review.csv";'
    );
}

const [sourceManifest, v13Decisions, sourceReviewHtml] = await Promise.all([
  readFile(sourceManifestPath, "utf8").then(JSON.parse),
  readFile(v13DecisionsPath, "utf8").then(JSON.parse),
  readFile(sourceReviewHtmlPath, "utf8")
]);
const v13NoIds = new Set(
  v13Decisions.records
    .filter(record => record.rating === "No")
    .map(record => record.clip_id)
);
const redoRecords = sourceManifest.records
  .filter(record => v13NoIds.has(record.clipId))
  .sort((left, right) => left.displayText.localeCompare(right.displayText));
const redoPatterns = new Set(
  redoRecords.map(record => patternFromDisplayText(record.displayText))
);
const specifiedPatterns = new Set(Object.keys(specifications));

if (
  redoRecords.length !== 19 ||
  redoPatterns.size !== 19 ||
  specifiedPatterns.size !== 19 ||
  [...redoPatterns].some(pattern => !specifiedPatterns.has(pattern)) ||
  [...specifiedPatterns].some(pattern => !redoPatterns.has(pattern))
) {
  throw new Error("The 19-row failure set does not exactly match the tight specification.");
}

await Promise.all([
  mkdir(rawAudioDirectory, { recursive: true }),
  mkdir(audioDirectory, { recursive: true })
]);
const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();

if (!accessToken) {
  throw new Error("Google Application Default Credentials did not return an access token.");
}

const generatedRecords = [];
for (const [index, record] of redoRecords.entries()) {
  const pattern = patternFromDisplayText(record.displayText);
  const specification = specifications[pattern];
  const ssml =
    `<speak><phoneme alphabet="ipa" ph="${escapeXml(specification.ipa)}">` +
    `${escapeXml(specification.cue)}</phoneme></speak>`;
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
    const errorBody = await response.text();
    throw new Error(
      `${record.clipId} failed with ${response.status}: ${errorBody.slice(0, 1200)}`
    );
  }

  const result = await response.json();
  if (!result.audioContent) {
    throw new Error(`${record.clipId} returned no audioContent.`);
  }

  const rawAudioBuffer = Buffer.from(result.audioContent, "base64");
  const rawAudioFileName = `${record.clipId}-${specification.cue}-raw.mp3`;
  const finalAudioFileName = `${record.clipId}-${specification.cue}-tight.mp3`;
  const rawAudioPath = path.join(rawAudioDirectory, rawAudioFileName);
  const finalAudioPath = path.join(audioDirectory, finalAudioFileName);
  await writeFile(rawAudioPath, rawAudioBuffer);

  if (specification.group === "ending-cluster") {
    applyQuietOnsetEnvelope(rawAudioPath, finalAudioPath);
  } else {
    await writeFile(finalAudioPath, rawAudioBuffer);
  }

  const finalAudioBuffer = await readFile(finalAudioPath);
  const probe = probeAudio(finalAudioPath);
  if (
    !Number.isFinite(probe.durationSeconds) ||
    probe.durationSeconds <= 0 ||
    probe.bytes <= 0
  ) {
    throw new Error(`${record.clipId} produced an invalid final MP3.`);
  }

  generatedRecords.push({
    number: index + 1,
    clipId: record.clipId,
    displayText: record.displayText,
    pattern,
    ipa: specification.ipa,
    anchor: record.anchorExample,
    cue: specification.cue,
    group: specification.group,
    specification: specification.instruction,
    quietOnsetEnvelope:
      specification.group === "ending-cluster"
        ? {
            type: "linear fade-in after leading-silence trim",
            durationSeconds: quietOnsetFadeSeconds
          }
        : null,
    ssml,
    audioUrl: `audio/${finalAudioFileName}`,
    audioPath: finalAudioPath,
    rawAudioPath,
    voice: voiceName,
    languageCode: "en-US",
    engine: "Google Cloud Text-to-Speech Chirp 3 HD",
    generationMethod: "complete IPA syllable in SSML phoneme tag",
    durationSeconds: probe.durationSeconds,
    bytes: probe.bytes,
    sha256: sha256(finalAudioBuffer),
    sourceReviewRating: "No",
    productionOutputPath: record.proposedOutputPath
  });
  console.log(
    `${String(index + 1).padStart(2, "0")}/19 ${record.displayText} ` +
    `cue=${specification.cue} ipa=/${specification.ipa}/ ` +
    `${specification.group} ${probe.durationSeconds.toFixed(2)}s`
  );
}

const manifestOutputPath = path.join(
  outputDirectory,
  "tight-spec-consonant-redos-v14-manifest.json"
);
const reviewHtmlPath = path.join(
  outputDirectory,
  "TIGHT_SPEC_CONSONANT_REDOS_REVIEW.html"
);
const blankCsvPath = path.join(
  outputDirectory,
  "tight-spec-consonant-redos-v14-review-blank.csv"
);

await writeFile(
  manifestOutputPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId,
    voice: voiceName,
    sourceManifestPath,
    v13DecisionsPath,
    count: generatedRecords.length,
    specification: {
      onsetBlend:
        "Complete pronounceable syllable with exact joined consonants and final schwa /ə/.",
      endingCluster:
        "Complete syllable beginning with unstressed schwa /ə/ plus a 180 ms quiet-onset envelope."
    },
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
  "group",
  "specification",
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
  record.group,
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
  manifestOutputPath,
  blankCsvPath,
  generated: generatedRecords.length
}));
