import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "public/game-assets/quest-pixel/seedwake/audio";
const NAMES = ["discover", "hop", "interact", "lift", "place", "build", "pulse", "wait"];
const MATERIALS = ["meadow", "river", "fossil", "forge", "glass", "storm", "forest", "star"];
const hashes = new Set();

for (const name of NAMES) {
  const bytes = readFileSync(join(ROOT, `action-${name}.wav`));
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`action-${name}.wav is not a PCM wave file`);
  }
  const channels = bytes.readUInt16LE(22);
  const sampleRate = bytes.readUInt32LE(24);
  const bits = bytes.readUInt16LE(34);
  const dataBytes = bytes.readUInt32LE(40);
  const duration = dataBytes / (sampleRate * channels * (bits / 8));
  if (channels !== 2 || sampleRate !== 44100 || bits !== 16) {
    throw new Error(`action-${name}.wav must be 44.1kHz, stereo, 16-bit PCM`);
  }
  if (duration < 0.16 || duration > 0.55 || bytes.length > 100_000) {
    throw new Error(`action-${name}.wav has an unsuitable ${duration.toFixed(2)}s / ${bytes.length} byte footprint`);
  }
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hashes.has(hash)) throw new Error(`action-${name}.wav duplicates another action cue`);
  hashes.add(hash);
  console.log(`action-${name}.wav: ${duration.toFixed(2)}s ${(bytes.length / 1024).toFixed(1)}KB`);
}

console.log(`OK: ${NAMES.length} distinct physical action cues`);

for (const name of MATERIALS) {
  const bytes = readFileSync(join(ROOT, `material-${name}.wav`));
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`material-${name}.wav is not a PCM wave file`);
  }
  const channels = bytes.readUInt16LE(22);
  const sampleRate = bytes.readUInt32LE(24);
  const bits = bytes.readUInt16LE(34);
  const dataBytes = bytes.readUInt32LE(40);
  const duration = dataBytes / (sampleRate * channels * (bits / 8));
  if (channels !== 2 || sampleRate !== 44100 || bits !== 16 || duration < 0.25 || duration > 0.55 || bytes.length > 100_000) {
    throw new Error(`material-${name}.wav has invalid format, duration, or size`);
  }
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hashes.has(hash)) throw new Error(`material-${name}.wav duplicates another quest cue`);
  hashes.add(hash);
  console.log(`material-${name}.wav: ${duration.toFixed(2)}s ${(bytes.length / 1024).toFixed(1)}KB`);
}

console.log(`OK: ${MATERIALS.length} distinct chapter material layers`);
