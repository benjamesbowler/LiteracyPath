#!/usr/bin/env node
// Creates a local-only review pack. This tool never writes public audio or a manifest.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SOUND_SEEKERS_WORDS, collectPronunciationAudioBlockers } from "../src/features/soundSeekers/content/pronunciationLexicon.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".artifacts/sound-seekers-contextual-unit-candidates");
const candidateDirectory = path.join(output, "candidates");
const projectId = process.env.GOOGLE_CLOUD_PROJECT || "project-3c66c1c8-cc9e-4d6d-bdf";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const voice = "en-US-Chirp3-HD-Leda";
const targets = Object.freeze({
  schwa: { ipa: "ə", arpabet: "AH0", anchor: "again, about", direction: "Use a light unstressed vowel; do not include an anchor word or letter name." },
  ear_lax: { ipa: "ɪr", arpabet: "IH R", anchor: "clear, dear", direction: "Use the rhotic lax-ear value in an original anchor context." },
  ed_id: { ipa: "ɪd", arpabet: "IH D", anchor: "landed, wanted", direction: "Keep the complete syllabic ending; do not reduce it to /d/ or /t/." },
  ure_no_y: { ipa: "ʊr", arpabet: "UH R", anchor: "sure, manure", direction: "Use the no-/j/ rhotic vowel value in an original anchor context." },
  once_onset: { ipa: "w", arpabet: "W", anchor: "one, once", direction: "Isolate the initial /w/ onset only; do not speak the full word." }
});
const variants = Object.freeze([
  Object.freeze({ id: "slow-low", rate: "85%", pitch: -1 }),
  Object.freeze({ id: "standard", rate: "100%", pitch: 0 }),
  Object.freeze({ id: "bright", rate: "110%", pitch: 1 })
]);

function escape(value) {
  return String(value).replace(/[&<>"']/gu, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function command(commandName, args) {
  const result = spawnSync(commandName, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${commandName} failed`);
  return result.stdout;
}

function durationSeconds(filePath) {
  return Number(Number(command("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath])).toFixed(3));
}

function meanVolumeDb(filePath) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-i", filePath, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
  const match = /mean_volume:\s*(-?[\d.]+) dB/u.exec(`${result.stdout}\n${result.stderr}`);
  const value = Number(match?.[1]);
  if (result.status !== 0 || !Number.isFinite(value) || value <= -70) throw new Error(`Candidate has no measurable signal: ${filePath}`);
  return Number(value.toFixed(2));
}

async function accessToken() {
  return execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8" }).trim();
}

function ssml(soundKey, target, variant) {
  const fallbackText = { schwa: "uh", ear_lax: "ear", ed_id: "id", ure_no_y: "oor", once_onset: "w" }[soundKey];
  if (!fallbackText) throw new Error(`No SSML fallback text for ${soundKey}`);
  return `<speak><prosody rate="${variant.rate}"><phoneme alphabet="ipa" ph="${target.ipa}">${fallbackText}</phoneme></prosody></speak>`;
}

async function synthesize(token, soundKey, target, variant) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}`, "x-goog-user-project": projectId },
    body: JSON.stringify({
      input: { ssml: ssml(soundKey, target, variant) },
      voice: { languageCode: "en-US", name: voice },
      audioConfig: { audioEncoding: "MP3", speakingRate: 1 }
    })
  });
  if (!response.ok) throw new Error(`Google Text-to-Speech ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const audio = (await response.json()).audioContent;
  if (!audio) throw new Error("Google Text-to-Speech returned no candidate audio");
  return Buffer.from(audio, "base64");
}

function renderPitchVariant(sourcePath, outputPath, semitones) {
  if (semitones === 0) return rename(sourcePath, outputPath);
  const factor = 2 ** (semitones / 12);
  command("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", sourcePath, "-af", `asetrate=24000*${factor},aresample=24000`, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  return unlink(sourcePath).catch(() => {});
}

const blocked = collectPronunciationAudioBlockers(SOUND_SEEKERS_WORDS);
const grouped = Object.groupBy(blocked, item => item.soundKey);
const unknown = Object.keys(grouped).filter(key => !targets[key]);
if (unknown.length || Object.keys(grouped).length !== 5 || blocked.length !== 21) {
  throw new Error(`Expected exactly 21 blockers for five contextual units; received ${blocked.length} across ${[...Object.keys(grouped), ...unknown].join(", ")}`);
}

const jobs = Object.entries(targets).flatMap(([soundKey, target]) => variants.map(variant => ({
  soundKey,
  voice,
  variant,
  method: "Google Cloud Text-to-Speech Chirp3 HD Leda with explicit IPA SSML phoneme element",
  anchorWords: grouped[soundKey].map(item => item.word),
  ipa: target.ipa,
  arpabet: target.arpabet,
  direction: target.direction,
  runtimeInstall: false,
  reviewRequired: true
})));

const force = process.argv.includes("--force");

await mkdir(output, { recursive: true });
await mkdir(candidateDirectory, { recursive: true });
const token = await accessToken();
const candidates = [];
for (const job of jobs) {
  const target = targets[job.soundKey];
  const filePath = path.join(candidateDirectory, `${job.soundKey}--leda--${job.variant.id}.mp3`);
  const existing = await stat(filePath).catch(() => null);
  if (!existing || force) {
    const sourcePath = `${filePath}.source.mp3`;
    try {
      await writeFile(sourcePath, await synthesize(token, job.soundKey, target, job.variant));
      await renderPitchVariant(sourcePath, filePath, job.variant.pitch);
    } finally {
      await unlink(sourcePath).catch(() => {});
    }
  }
  const fileStat = existing || await stat(filePath);
  const bytes = await readFile(filePath);
  candidates.push({
    ...job,
    path: path.relative(output, filePath),
    generationMethod: "Google Cloud Text-to-Speech Chirp3 HD Leda with explicit IPA SSML phoneme element",
    ssml: ssml(job.soundKey, target, job.variant),
    audioConfig: { audioEncoding: "MP3", speakingRate: 1, googlePitchSupported: false },
    pitchSemitonesPostProcess: job.variant.pitch,
    generatedAt: fileStat.mtime.toISOString(),
    durationSeconds: durationSeconds(filePath),
    meanVolumeDb: meanVolumeDb(filePath),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    automatedSignalChecks: ["ffprobe-duration", "ffmpeg-volumedetect", "sha256"],
    humanListeningApproved: false,
    installedInRuntime: false
  });
}
const reviewRows = Object.entries(targets).map(([soundKey, target]) => {
  const cards = candidates.filter(candidate => candidate.soundKey === soundKey).map(candidate => `<audio controls preload="metadata" src="${escape(candidate.path)}"></audio>`).join("");
  return `<section><h2>${escape(soundKey)} — /${escape(target.ipa)}/ (${escape(target.arpabet)})</h2><p><strong>Anchor words:</strong> ${escape(grouped[soundKey].map(item => item.word).join(", "))}</p>${cards}<p>${escape(target.direction)}</p><p><strong>Review:</strong> reject any candidate with a spoken letter name, whole anchor word, trailing vowel, wrong contextual value, unclear isolation, or unsuitable accent. A phonics specialist must select a rights-cleared master before any later installation.</p></section>`;
}).join("\n");
const review = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Sound Seekers contextual unit review</title><style>body{max-width:760px;margin:32px auto;font:16px/1.5 system-ui;color:#17312a}section{border:1px solid #b9cbc0;border-radius:12px;padding:16px;margin:14px 0}h1,h2{margin-top:0}code{background:#edf3ef;padding:2px 4px}audio{display:block;width:100%;margin:8px 0}</style><body><h1>Contextual sound-unit candidate review</h1><p>These are unapproved local review candidates. No clip is production-ready and nothing here is in the public audio bank. Direct listening remains required.</p>${reviewRows}<p>Open gate: five sound keys and 21 word-unit records remain release-blocked pending human phonics listening review and rights clearance.</p></body></html>`;
if (candidates.length !== 15 || new Set(candidates.map(candidate => candidate.soundKey)).size !== 5 || candidates.some(candidate => candidate.ssml.includes("undefined") || !candidate.sha256 || candidate.durationSeconds <= 0 || candidate.meanVolumeDb <= -70)) {
  throw new Error("Contextual candidate pack is incomplete or has invalid provenance");
}
await writeFile(path.join(output, "candidate-manifest.json"), `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  outputIsPublicAudio: false,
  humanListeningApproved: false,
  candidateGenerationMethod: "Google Cloud Text-to-Speech Chirp3 HD Leda with explicit IPA SSML phoneme elements; see docs/audio/SOUND_SEEKERS_CONTEXTUAL_UNIT_REVIEW.md",
  kokoroFallbackBlocker: "Kokoro 0.9.4 could not initialize espeakng-loader because its wheel requested inaccessible build path /Users/runner/work/espeakng-loader/espeakng-loader/espeak-ng/_dynamic/share/espeak-ng-data/phontab.",
  blockers: blocked,
  candidates
}, null, 2)}\n`);
await writeFile(path.join(output, "index.html"), review);
console.log(`Contextual-unit review pack: ${blocked.length} blockers, ${Object.keys(targets).length} sound keys, ${candidates.length} unapproved audio candidates.`);
console.log(output);
