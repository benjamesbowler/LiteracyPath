#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mathsAudioRequests } from "../src/maths/media/mathsAudioSourceManifest.js";
import { mathsLedaAudioManifest, MATHS_LEDA_VOICE } from "../src/maths/media/generated/mathsLedaAudio.generated.js";
import { mathsSongs } from "../src/maths/music/mathsSongs.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
if (MATHS_LEDA_VOICE !== "en-US-Chirp3-HD-Leda") failures.push(`wrong voice: ${MATHS_LEDA_VOICE}`);
if (mathsLedaAudioManifest.length !== mathsAudioRequests.length) failures.push(`manifest has ${mathsLedaAudioManifest.length}; expected ${mathsAudioRequests.length}`);
for (const row of mathsLedaAudioManifest) {
  const source = mathsAudioRequests.find(request => request.id === row.id);
  if (!source || source.exactText !== row.exactText) failures.push(`${row.id}: exact text drift`);
  const absolute = path.join(root, "public", row.publicPath);
  if (!fs.existsSync(absolute)) { failures.push(`${row.id}: file missing`); continue; }
  const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate,channels,bit_rate", "-of", "json", absolute], { encoding: "utf8" });
  if (probe.status !== 0) { failures.push(`${row.id}: cannot decode`); continue; }
  const stream = JSON.parse(probe.stdout).streams?.[0] || {};
  if (stream.sample_rate !== "44100" || stream.channels !== 1) failures.push(`${row.id}: expected mono 44.1 kHz`);
  if (row.status === "planned") failures.push(`${row.id}: generated file cannot remain planned`);
}
for (const song of mathsSongs) {
  const absolute = path.join(root, "public/audio/music/maths/songs", `${song.id}-instrumental.mp3`);
  const credits = path.join(root, "public/audio/music/maths/songs", `${song.id}-credits.json`);
  if (!fs.existsSync(absolute)) { failures.push(`${song.id}: instrumental missing`); continue; }
  if (!fs.existsSync(credits)) failures.push(`${song.id}: credits missing`);
  const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate,channels,bit_rate,duration", "-of", "json", absolute], { encoding: "utf8" });
  if (probe.status !== 0) { failures.push(`${song.id}: instrumental cannot decode`); continue; }
  const stream = JSON.parse(probe.stdout).streams?.[0] || {};
  if (stream.sample_rate !== "44100" || stream.channels !== 2 || Number(stream.duration || 0) < 30) failures.push(`${song.id}: instrumental must be stereo 44.1 kHz and at least 30 seconds`);
}
if (failures.length) { console.error("Maths audio gate failed:\n" + failures.map(item => `- ${item}`).join("\n")); process.exit(1); }
console.log(`Maths audio release gate passed: ${mathsLedaAudioManifest.length} mappings, ${new Set(mathsLedaAudioManifest.map(row => row.publicPath)).size} exact Leda files and ${mathsSongs.length} owned instrumentals. Clips are accepted until individually flagged.`);
