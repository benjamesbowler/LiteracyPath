#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mathsSongs } from "../src/maths/music/mathsSongs.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public/audio/music/maths/songs");
fs.mkdirSync(outputDir, { recursive: true });
for (const [index, song] of mathsSongs.entries()) {
  const duration = 32;
  const base = [220, 246.94, 261.63][index];
  const output = path.join(outputDir, `${song.id}-instrumental.mp3`);
  const filter = `[0:a]volume=0.055,tremolo=f=${song.tempo / 60}:d=0.72[pad];[1:a]volume=0.025,tremolo=f=${song.tempo / 30}:d=0.88[bass];[2:a]highpass=f=7000,volume=0.08,afade=t=in:d=0.02[hat];[pad][bass][hat]amix=inputs=3:normalize=0,loudnorm=I=-20:TP=-2:LRA=7,afade=t=in:d=0.4,afade=t=out:st=${duration - 1}:d=1[out]`;
  const result = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", `sine=frequency=${base}:sample_rate=44100:duration=${duration}`, "-f", "lavfi", "-i", `sine=frequency=${base / 2}:sample_rate=44100:duration=${duration}`, "-f", "lavfi", "-i", `anoisesrc=color=white:sample_rate=44100:duration=${duration}`, "-filter_complex", filter, "-map", "[out]", "-ac", "2", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "192k", output], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `failed to generate ${song.id}`);
  fs.writeFileSync(path.join(outputDir, `${song.id}-credits.json`), JSON.stringify({ title: song.title, tempo: song.tempo, composition: "Original LiteracyPath classroom chant bed", generatedBy: "LiteracyPath deterministic synthesis", childVoiceOrImage: false, adultVocalStatus: "not-produced-human-vocal-required", guideVoice: "en-US-Chirp3-HD-Leda" }, null, 2));
  console.log(`${song.id}: ${output}`);
}
