#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mathsSongs } from "../src/maths/music/mathsSongs.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public/audio/music/maths/songs");
const roots = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392, 440];
fs.mkdirSync(outputDir, { recursive: true });
for (const [index, song] of mathsSongs.entries()) {
  const duration = 36;
  const base = roots[index % roots.length];
  const third = base * (index % 3 === 1 ? 1.1892 : 1.2599);
  const fifth = base * 1.4983;
  const output = path.join(outputDir, `${song.id}-instrumental.mp3`);
  const beat = song.tempo / 60;
  const filter = `[0:a]volume=0.032,tremolo=f=${beat}:d=0.68[root];[1:a]volume=0.019,tremolo=f=${beat / 2}:d=0.52[third];[2:a]volume=0.017,tremolo=f=${beat / 2}:d=0.48[fifth];[3:a]lowpass=f=320,volume=0.032,tremolo=f=${beat}:d=0.9[bass];[4:a]highpass=f=6500,lowpass=f=11000,volume=0.018,tremolo=f=${beat * 2}:d=0.96[hat];[root][third][fifth][bass][hat]amix=inputs=5:normalize=0,acompressor=threshold=0.08:ratio=3:attack=8:release=90,loudnorm=I=-20:TP=-2:LRA=7,afade=t=in:d=0.35,afade=t=out:st=${duration - 1}:d=1[out]`;
  const result = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", `sine=frequency=${base}:sample_rate=44100:duration=${duration}`,
    "-f", "lavfi", "-i", `sine=frequency=${third}:sample_rate=44100:duration=${duration}`,
    "-f", "lavfi", "-i", `sine=frequency=${fifth}:sample_rate=44100:duration=${duration}`,
    "-f", "lavfi", "-i", `sine=frequency=${base / 2}:sample_rate=44100:duration=${duration}`,
    "-f", "lavfi", "-i", `anoisesrc=color=pink:sample_rate=44100:duration=${duration}`,
    "-filter_complex", filter, "-map", "[out]", "-ac", "2", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "192k", output], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `failed to generate ${song.id}`);
  const performed = song.media.performed;
  const fallback = song.media.fallback;
  const credits = {
    schemaVersion: 2,
    songId: song.id,
    title: song.title,
    tempo: song.tempo,
    lyrics: "Original LiteracyPath lyrics",
    childVoiceOrImage: false,
    performed: {
      publicPath: performed.publicPath,
      captionsPath: performed.captionsPath,
      releaseStatus: performed.releaseStatus,
      provider: performed.provider,
      ...performed.provenance
    },
    fallback: {
      publicPath: fallback.instrumentalPath,
      composition: "Original LiteracyPath five-layer classroom chant bed",
      generatedBy: "LiteracyPath deterministic synthesis",
      rootFrequency: base,
      guideVoice: "en-US-Chirp3-HD-Leda",
      releaseStatus: fallback.releaseStatus
    }
  };
  fs.writeFileSync(path.join(outputDir, `${song.id}-credits.json`), `${JSON.stringify(credits, null, 2)}\n`);
  console.log(`${song.id}: ${output}`);
}
