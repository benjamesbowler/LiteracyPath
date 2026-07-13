import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* Sound Seekers world music ships as mono MP3 (see generateQuestMusicLoops.mjs).
   The generator guards loudness on the raw PCM before encoding; this check guards
   what actually reaches a child's device: format, loop length and download size.
   Pure Node MP3 frame parsing - the gate must run without ffmpeg installed. */

const FILES = [
  "meadow-morning-loop.mp3",
  "fossil-footsteps-loop.mp3",
  "moonwood-lanterns-loop.mp3"
];
const ROOT = "public/audio/music/quest";
const MAX_BYTES = 800_000; // a world theme must stay small enough for a school iPad on wifi
const MPEG2_LAYER3_BITRATES = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const MPEG2_SAMPLE_RATES = [22050, 24000, 16000];
const SAMPLES_PER_FRAME = 576; // MPEG2 Layer III

const hashes = new Set();

function skipId3(bytes) {
  if (bytes.toString("ascii", 0, 3) !== "ID3") return 0;
  const size =
    (bytes[6] & 0x7f) * 0x200000 +
    (bytes[7] & 0x7f) * 0x4000 +
    (bytes[8] & 0x7f) * 0x80 +
    (bytes[9] & 0x7f);
  return 10 + size;
}

function readMp3(filename) {
  const path = join(ROOT, filename);
  const bytes = readFileSync(path);
  let offset = skipId3(bytes);
  let frames = 0;
  let duration = 0;
  let sampleRate = 0;
  let channels = 0;
  let maxBitrate = 0;

  while (offset < bytes.length - 4) {
    if (bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) {
      offset += 1;
      continue;
    }
    const version = (bytes[offset + 1] >> 3) & 0x03; // 2 = MPEG2
    const layer = (bytes[offset + 1] >> 1) & 0x03; // 1 = Layer III
    const bitrateIndex = (bytes[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (bytes[offset + 2] >> 2) & 0x03;
    const padding = (bytes[offset + 2] >> 1) & 0x01;
    const channelMode = (bytes[offset + 3] >> 6) & 0x03; // 3 = mono

    const bitrate = MPEG2_LAYER3_BITRATES[bitrateIndex];
    const rate = MPEG2_SAMPLE_RATES[sampleRateIndex];
    if (version !== 2 || layer !== 1 || !bitrate || !rate) {
      offset += 1;
      continue;
    }

    const frameLength = Math.floor((72 * bitrate * 1000) / rate) + padding;
    if (frameLength <= 4) {
      offset += 1;
      continue;
    }

    frames += 1;
    duration += SAMPLES_PER_FRAME / rate;
    sampleRate = rate;
    channels = channelMode === 3 ? 1 : 2;
    maxBitrate = Math.max(maxBitrate, bitrate);
    offset += frameLength;
  }

  if (!frames) throw new Error(`${filename} has no readable MPEG2 Layer III frames`);
  return { bytes, frames, duration, sampleRate, channels, bitrate: maxBitrate };
}

for (const filename of FILES) {
  const info = readMp3(filename);
  if (info.channels !== 1) throw new Error(`${filename} should be mono for child-device download size`);
  if (info.sampleRate !== 22050) throw new Error(`${filename} has ${info.sampleRate} Hz audio`);
  if (info.bitrate > 128) throw new Error(`${filename} is encoded at ${info.bitrate}kbps - too fat to ship`);
  if (info.duration < 38 || info.duration > 58) throw new Error(`${filename} has an unsuitable ${info.duration.toFixed(1)}s loop`);
  if (info.bytes.length > MAX_BYTES) {
    throw new Error(`${filename} is ${(info.bytes.length / 1024).toFixed(0)}KB - over the ${MAX_BYTES / 1024}KB budget`);
  }
  const hash = createHash("sha256").update(info.bytes).digest("hex");
  if (hashes.has(hash)) throw new Error(`${filename} duplicates another world track`);
  hashes.add(hash);
  console.log(
    `${filename}: ${info.duration.toFixed(2)}s ${info.sampleRate}Hz ${info.bitrate}kbps mono ${(info.bytes.length / 1024).toFixed(0)}KB`
  );
}

console.log(`OK: ${FILES.length} distinct Sound Seekers world themes`);
