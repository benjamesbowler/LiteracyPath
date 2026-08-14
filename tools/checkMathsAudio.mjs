#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mathsAudioRequests } from "../src/maths/media/mathsAudioSourceManifest.js";
import { mathsLedaAudioManifest, MATHS_LEDA_VOICE } from "../src/maths/media/generated/mathsLedaAudio.generated.js";
import { mathsSongs, MATHS_PERFORMED_SONG_RELEASE_STATUSES } from "../src/maths/music/mathsSongs.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const supportedPerformanceStatuses = new Set([
  "planned",
  "generated-awaiting-technical-check",
  "accepted-until-flagged",
  "approved",
  "quarantined",
  "replaced"
]);
const normalize = value => String(value || "").replace(/\s+/g, " ").trim();
const absolutePublicPath = publicPath => path.join(root, "public", String(publicPath || "").replace(/^\/+/, ""));
const sha256 = absolute => createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");

function readJson(id, absolute) {
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    failures.push(`${id}: credits cannot be read (${error.message})`);
    return null;
  }
}

function probeAudio(id, absolute, { channels, minimumDuration = 0 }) {
  const probe = spawnSync("ffprobe", [
    "-v", "error", "-select_streams", "a:0",
    "-show_entries", "stream=sample_rate,channels,bit_rate,duration",
    "-of", "json", absolute
  ], { encoding: "utf8" });
  if (probe.status !== 0) {
    failures.push(`${id}: audio cannot decode`);
    return;
  }
  const stream = JSON.parse(probe.stdout).streams?.[0] || {};
  if (stream.sample_rate !== "44100" || stream.channels !== channels) {
    failures.push(`${id}: expected ${channels === 2 ? "stereo" : "mono"} 44.1 kHz audio`);
  }
  if (Number(stream.duration || 0) < minimumDuration) failures.push(`${id}: audio is shorter than the released backing-track contract`);
}

function validateVtt(song, absolute) {
  const vtt = fs.readFileSync(absolute, "utf8");
  if (!/^WEBVTT(?:\s|$)/.test(vtt)) {
    failures.push(`${song.id}: performed-song captions must be WebVTT`);
    return;
  }
  const cueText = normalize(vtt
    .split(/\r?\n/)
    .filter(line => line && !line.includes("-->") && !/^WEBVTT/.test(line) && !/^NOTE(?:\s|$)/.test(line) && !/^\d+$/.test(line.trim()))
    .join(" ")
    .replace(/<[^>]+>/g, ""));
  for (const line of song.lyrics.split("\n").map(normalize).filter(Boolean)) {
    if (!cueText.includes(line)) failures.push(`${song.id}: captions omit exact lyric line: ${line}`);
  }
}

if (MATHS_LEDA_VOICE !== "en-US-Chirp3-HD-Leda") failures.push(`wrong voice: ${MATHS_LEDA_VOICE}`);
if (mathsLedaAudioManifest.length !== mathsAudioRequests.length) failures.push(`manifest has ${mathsLedaAudioManifest.length}; expected ${mathsAudioRequests.length}`);

const probedLedaPaths = new Set();
for (const row of mathsLedaAudioManifest) {
  const source = mathsAudioRequests.find(request => request.id === row.id);
  if (!source || source.exactText !== row.exactText) failures.push(`${row.id}: exact text drift`);
  const absolute = absolutePublicPath(row.publicPath);
  if (!fs.existsSync(absolute)) {
    failures.push(`${row.id}: file missing`);
    continue;
  }
  if (!probedLedaPaths.has(row.publicPath)) {
    probeAudio(row.id, absolute, { channels: 1 });
    probedLedaPaths.add(row.publicPath);
  }
  if (row.status === "planned") failures.push(`${row.id}: generated file cannot remain planned`);
}

for (const song of mathsSongs) {
  const performed = song.media?.performed;
  const fallback = song.media?.fallback;
  if (!performed || !fallback) {
    failures.push(`${song.id}: authoritative song media contract missing`);
    continue;
  }
  if (!supportedPerformanceStatuses.has(performed.releaseStatus)) failures.push(`${song.id}: unsupported performed-song status ${performed.releaseStatus}`);
  if (performed.provider !== "Suno") failures.push(`${song.id}: performed-song provider must be Suno`);
  if (performed.provenance?.childVoiceOrImage !== false) failures.push(`${song.id}: performed-song provenance must prohibit child voice and image`);
  if (!performed.publicPath.endsWith(`/${song.id}-performed.mp3`)) failures.push(`${song.id}: performed-song path drift`);
  if (!performed.captionsPath.endsWith(`/${song.id}-lyrics.vtt`)) failures.push(`${song.id}: performed-song captions path drift`);
  if (fallback.guideRequestId !== `song:${song.id}:guide`) failures.push(`${song.id}: adult guide request ID drift`);

  const instrumentalAbsolute = absolutePublicPath(fallback.instrumentalPath);
  const creditsAbsolute = absolutePublicPath(performed.creditsPath);
  if (!fs.existsSync(instrumentalAbsolute)) failures.push(`${song.id}: backing track missing`);
  else probeAudio(`${song.id}:backing`, instrumentalAbsolute, { channels: 2, minimumDuration: 30 });
  if (!fs.existsSync(creditsAbsolute)) {
    failures.push(`${song.id}: credits missing`);
    continue;
  }

  const credits = readJson(song.id, creditsAbsolute);
  if (!credits) continue;
  if (credits.schemaVersion !== 2 || credits.songId !== song.id || credits.title !== song.title || credits.tempo !== song.tempo) failures.push(`${song.id}: credits identity drift`);
  if (credits.childVoiceOrImage !== false || credits.performed?.vocals !== "adult-or-synthetic-adult") failures.push(`${song.id}: credits violate the no-child-media policy`);
  if (credits.performed?.publicPath !== performed.publicPath || credits.performed?.captionsPath !== performed.captionsPath) failures.push(`${song.id}: credits do not match authoritative performed-song paths`);
  if (credits.performed?.releaseStatus !== performed.releaseStatus || credits.performed?.provider !== performed.provider) failures.push(`${song.id}: credits do not match authoritative performed-song selection`);
  if (credits.fallback?.publicPath !== fallback.instrumentalPath || credits.fallback?.releaseStatus !== fallback.releaseStatus || credits.fallback?.guideVoice !== MATHS_LEDA_VOICE) failures.push(`${song.id}: credits do not match the released fallback`);

  const provenance = performed.provenance || {};
  const creditsProvenanceFields = ["providerTrackId", "modelVersion", "generatedAt", "selectedAt", "sourceFileSha256", "rightsBasis"];
  for (const field of creditsProvenanceFields) {
    if (credits.performed?.[field] !== provenance[field]) failures.push(`${song.id}: credits ${field} does not match authoritative provenance`);
  }

  const performanceAbsolute = absolutePublicPath(performed.publicPath);
  const captionsAbsolute = absolutePublicPath(performed.captionsPath);
  const generatedStatus = performed.releaseStatus === "generated-awaiting-technical-check";
  const released = MATHS_PERFORMED_SONG_RELEASE_STATUSES.includes(performed.releaseStatus);
  if (generatedStatus || released) {
    if (!fs.existsSync(performanceAbsolute)) failures.push(`${song.id}: declared ${performed.releaseStatus} but performed audio is missing`);
    if (!fs.existsSync(captionsAbsolute)) failures.push(`${song.id}: declared ${performed.releaseStatus} but lyric captions are missing`);
    for (const field of creditsProvenanceFields) {
      if (!String(provenance[field] || "").trim()) failures.push(`${song.id}: declared ${performed.releaseStatus} without ${field}`);
    }
  }
  if (released && fs.existsSync(performanceAbsolute)) {
    probeAudio(`${song.id}:performed`, performanceAbsolute, { channels: 2 });
    if (!/^[a-f0-9]{64}$/.test(provenance.sourceFileSha256) || sha256(performanceAbsolute) !== provenance.sourceFileSha256) failures.push(`${song.id}: performed-song SHA-256 does not match the selected file`);
  }
  if (released && fs.existsSync(captionsAbsolute)) validateVtt(song, captionsAbsolute);
}

if (failures.length) {
  console.error("Maths audio gate failed:\n" + failures.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}

const releasedPerformances = mathsSongs.filter(song => MATHS_PERFORMED_SONG_RELEASE_STATUSES.includes(song.media.performed.releaseStatus)).length;
console.log(`Maths audio release gate passed: ${mathsLedaAudioManifest.length} Leda mappings, ${mathsSongs.length} backing tracks and ${releasedPerformances} complete performed songs. Planned performances stay out of runtime until their audio, captions and provenance are released.`);
