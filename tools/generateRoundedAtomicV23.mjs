import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { renameSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const v21Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v21-targeted-atomic-redos"
);
const v22Directory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v22-manually-tightened-atomic"
);
const outputDirectory = path.join(
  repositoryRoot,
  "outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v23-rounded-atomic"
);
const rawDirectory = path.join(outputDirectory, "raw");
const audioDirectory = path.join(outputDirectory, "audio");
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const targetMeanDb = -27.0;

const targets = Object.freeze([
  { key: "e", displayText: "e — natural “eh”", ipa: "ɛ", cue: "eh", anchor: "eh", text: "Eh.", segment: { mode: "full" }, fadeOut: 0.04, method: "Fresh natural Leda “eh” take with a rounded ending" },
  { key: "nk", displayText: "nk — from “uhnk”", ipa: "ŋk", cue: "nk", anchor: "uhnk", text: "unk", segment: { mode: "suffix", seconds: 0.16 }, fadeOut: 0.025, method: "Leda “uhnk” source with the opening vowel removed" },
  { key: "th", displayText: "th — longer breath sound", ipa: "θ", cue: "th", anchor: "thin", sourceKey: "th", segment: { mode: "prefix", seconds: 0.08 }, stretch: 2, fadeOut: 0.025, method: "The clean breath-only TH physically lengthened; no vowel added" },
  { key: "zz", displayText: "zz — longer bumblebee sound", ipa: "z", cue: "zzz", anchor: "buzz", sourceKey: "zz", segment: { mode: "suffix", seconds: 0.09 }, stretch: 2, fadeOut: 0.03, method: "The clean final Z physically lengthened so it no longer glitches" },
  { key: "b", displayText: "b — natural “buh”", ipa: "bʌ", cue: "buh", anchor: "but", text: "but", segment: { mode: "prefix", seconds: 0.24 }, fadeOut: 0.045, method: "Natural Leda “but” with the final T removed and a rounded fade" },
  { key: "j", displayText: "j — natural “juh”", ipa: "dʒʌ", cue: "juh", anchor: "just", text: "just", segment: { mode: "prefix", seconds: 0.27 }, fadeOut: 0.045, method: "Natural Leda “just” cut before S/T with a rounded fade" },
  { key: "r", displayText: "r — softly rounded “ruh”", ipa: "ɹʌ", cue: "ruh", anchor: "run", sourceKey: "r", segment: { mode: "prefix", seconds: 0.22 }, fadeOut: 0.055, method: "The approved-style Leda cue keeps more room tone and a soft tail" },
  { key: "ch", displayText: "ch — softly rounded “chuh”", ipa: "tʃʌ", cue: "chuh", anchor: "chip", sourceKey: "ch", segment: { mode: "prefix", seconds: 0.25 }, fadeOut: 0.065, method: "The same Leda cue with a longer, rounded vowel tail" },
  { key: "sh", displayText: "sh — softly rounded “shuh”", ipa: "ʃʌ", cue: "shuh", anchor: "ship", sourceKey: "sh", segment: { mode: "prefix", seconds: 0.28 }, fadeOut: 0.075, method: "The same Leda cue with a longer, rounded vowel tail" }
]);

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${String(result.stderr || result.stdout).slice(-1600)}`);
  }
  return { stdout: String(result.stdout || ""), stderr: String(result.stderr || "") };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function probe(filePath) {
  const { stdout } = run(
    "ffprobe",
    [
      "-v", "error", "-select_streams", "a:0",
      "-show_entries", "stream=sample_rate,channels:format=duration,size",
      "-of", "json", filePath
    ],
    `Audio probe for ${filePath}`
  );
  const parsed = JSON.parse(stdout);
  return {
    sampleRate: Number(parsed.streams?.[0]?.sample_rate),
    channels: Number(parsed.streams?.[0]?.channels),
    durationSeconds: Number(parsed.format?.duration),
    bytes: Number(parsed.format?.size)
  };
}

function analyzeVolume(filePath) {
  const { stderr } = run(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", filePath, "-af", "volumedetect", "-f", "null", "-"],
    `Volume analysis for ${filePath}`
  );
  const mean = stderr.match(/mean_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/u);
  const max = stderr.match(/max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/u);
  if (!mean || !max) throw new Error(`Could not read volume for ${filePath}.`);
  return { meanVolumeDb: Number(mean[1]), maxVolumeDb: Number(max[1]) };
}

async function synthesize(accessToken, target, outputPath) {
  try {
    if ((await stat(outputPath)).size > 0) return;
  } catch {
    // Generate a new source take.
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text: target.text },
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
    })
  });
  if (!response.ok) {
    throw new Error(`${target.key} failed with ${response.status}: ${(await response.text()).slice(0, 1000)}`);
  }
  const result = await response.json();
  await writeFile(outputPath, Buffer.from(result.audioContent, "base64"));
}

function sourcePathFor(target, v21Manifest) {
  if (target.text) {
    return path.join(rawDirectory, `${target.key}-${target.text.toLowerCase().replaceAll(/[^a-z]+/gu, "-")}-raw.wav`);
  }
  const sourceRecord = v21Manifest.records.find(record => record.key === target.sourceKey);
  if (!sourceRecord) throw new Error(`Missing V21 source for ${target.key}.`);
  return path.join(v21Directory, "raw", `${sourceRecord.clipId}-${target.sourceKey}-raw.wav`);
}

function editAndNormalize(sourcePath, outputPath, target) {
  const contentPath = outputPath.replace(/\.mp3$/u, ".content.wav");
  const cutPath = outputPath.replace(/\.mp3$/u, ".cut.wav");
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", sourcePath,
      "-af", [
        "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB",
        "areverse",
        "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB",
        "areverse",
        "aresample=24000",
        "aformat=sample_fmts=fltp:channel_layouts=mono"
      ].join(","),
      "-ar", "24000", "-ac", "1", "-codec:a", "pcm_s16le", contentPath
    ],
    `Silence trim for ${sourcePath}`
  );
  const contentDuration = probe(contentPath).durationSeconds;
  const filters = [];
  if (target.segment.mode === "prefix") {
    filters.push(`atrim=start=0:end=${Math.min(target.segment.seconds, contentDuration).toFixed(4)}`);
  } else if (target.segment.mode === "suffix") {
    filters.push(`atrim=start=${Math.max(0, contentDuration - target.segment.seconds).toFixed(4)}:end=${contentDuration.toFixed(4)}`);
  }
  filters.push("asetpts=PTS-STARTPTS");
  if (target.stretch === 2) filters.push("atempo=0.5");
  const selectedDuration = target.segment.mode === "full"
    ? contentDuration
    : Math.min(target.segment.seconds, contentDuration) * (target.stretch || 1);
  filters.push(
    "afade=t=in:st=0:d=0.004",
    `afade=t=out:st=${Math.max(0.015, selectedDuration - target.fadeOut).toFixed(4)}:d=${target.fadeOut.toFixed(4)}`,
    "adelay=65",
    "apad=whole_dur=0.76",
    "aresample=24000",
    "aformat=sample_fmts=fltp:channel_layouts=mono"
  );
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", contentPath,
      "-af", filters.join(","),
      "-ar", "24000", "-ac", "1", "-codec:a", "pcm_s16le", cutPath
    ],
    `Rounded edit for ${sourcePath}`
  );
  const initial = analyzeVolume(cutPath);
  run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-nostats", "-i", cutPath,
      "-af", `volume=${(targetMeanDb - initial.meanVolumeDb).toFixed(3)}dB`,
      "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k",
      outputPath
    ],
    `Level match for ${sourcePath}`
  );
  let final = analyzeVolume(outputPath);
  for (let attempt = 0; attempt < 3 && Math.abs(final.meanVolumeDb - targetMeanDb) > 0.1; attempt += 1) {
    const corrected = outputPath.replace(/\.mp3$/u, ".corrected.mp3");
    run(
      "ffmpeg",
      [
        "-y", "-hide_banner", "-nostats", "-i", outputPath,
        "-af", `volume=${(targetMeanDb - final.meanVolumeDb).toFixed(3)}dB`,
        "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k",
        corrected
      ],
      `Level correction for ${sourcePath}`
    );
    renameSync(corrected, outputPath);
    final = analyzeVolume(outputPath);
  }
  return { contentDuration, selectedDuration, ...final };
}

function buildHtml(records) {
  const templatePath = path.join(v22Directory, "MANUALLY_TIGHTENED_ATOMIC_V22_REVIEW.html");
  return readFile(templatePath, "utf8").then(template => {
    const embedded = JSON.stringify(records).replaceAll("<", "\\u003c");
    return template
      .replaceAll("Manually tightened atomic sounds V22", "Rounded atomic sounds V23")
      .replace("13 unresolved sounds only · approved V21 sounds are already installed", "9 unresolved sounds only · approved V22 sounds are already installed")
      .replace(
        /<div class="instructions">[\s\S]*?<\/div><div id="cards"/u,
        '<div class="instructions"><strong>Method changed from hard cuts to natural tails.</strong> E, NK, B and J use new Leda source words. TH and ZZ keep only their pure sound but are physically lengthened. R, CH and SH retain more natural tail and fade softly instead of ending abruptly.</div><div id="cards"'
      )
      .replace(/const records=\[[\s\S]*?\],storageKey=/u, `const records=${embedded},storageKey=`)
      .replace("literacypath-manually-tightened-atomic-v22", "literacypath-rounded-atomic-v23")
      .replace("manually-tightened-atomic-v22-review.csv", "rounded-atomic-v23-review.csv");
  });
}

await Promise.all([mkdir(rawDirectory, { recursive: true }), mkdir(audioDirectory, { recursive: true })]);
const v21Manifest = JSON.parse(
  await readFile(path.join(v21Directory, "targeted-atomic-redos-v21-manifest.json"), "utf8")
);
const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();
for (const target of targets.filter(candidate => candidate.text)) {
  await synthesize(accessToken, target, sourcePathFor(target, v21Manifest));
}

const records = [];
for (const [index, target] of targets.entries()) {
  const clipId = `lp_atomic_v23_${sha256(`${target.key}|${target.anchor}|${target.method}|${voiceName}`).slice(0, 10)}`;
  const outputPath = path.join(audioDirectory, `${clipId}-${target.key}.mp3`);
  const sourcePath = sourcePathFor(target, v21Manifest);
  const measurement = editAndNormalize(sourcePath, outputPath, target);
  const audio = await readFile(outputPath);
  const audioProbe = probe(outputPath);
  if (
    audioProbe.sampleRate !== 24000 ||
    audioProbe.channels !== 1 ||
    audioProbe.durationSeconds <= 0 ||
    Math.abs(measurement.meanVolumeDb - targetMeanDb) > 1.1 ||
    measurement.maxVolumeDb > -1.5
  ) {
    throw new Error(`${target.key} failed the technical audio gate.`);
  }
  records.push({
    number: index + 1,
    clipId,
    key: target.key,
    displayText: target.displayText,
    group: "rounded-source repair",
    ipa: target.ipa,
    cue: target.cue,
    anchor: target.anchor,
    method: target.method,
    audioUrl: `audio/${clipId}-${target.key}.mp3`,
    audioPath: outputPath,
    voice: voiceName,
    sourceContentSeconds: measurement.contentDuration,
    selectedSoundSeconds: measurement.selectedDuration,
    durationSeconds: audioProbe.durationSeconds,
    bytes: audioProbe.bytes,
    meanVolumeDb: measurement.meanVolumeDb,
    maxVolumeDb: measurement.maxVolumeDb,
    sha256: sha256(audio)
  });
  console.log(`${index + 1}/${targets.length} ${target.key}: ${audioProbe.durationSeconds.toFixed(2)}s, ${measurement.meanVolumeDb.toFixed(1)} dB mean`);
}
if (
  records.length !== targets.length ||
  new Set(records.map(record => record.clipId)).size !== targets.length ||
  new Set(records.map(record => record.sha256)).size !== targets.length
) {
  throw new Error("V23 output is incomplete or contains duplicate audio.");
}
const manifestPath = path.join(outputDirectory, "rounded-atomic-v23-manifest.json");
const htmlPath = path.join(outputDirectory, "ROUNDED_ATOMIC_V23_REVIEW.html");
await writeFile(
  manifestPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId,
    voice: voiceName,
    targetMeanDb,
    recordCount: records.length,
    records
  }, null, 2)}\n`,
  "utf8"
);
await writeFile(htmlPath, await buildHtml(records), "utf8");
console.log(JSON.stringify({ outputDirectory, manifestPath, htmlPath, recordCount: records.length }, null, 2));
