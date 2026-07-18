import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* Sound Seekers world music ships as stereo MP3 (see generateQuestMusicLoops.mjs).
   The generator guards loudness on the raw PCM before encoding; this check guards
   what actually reaches a child's device: format, loop length and download size.
   Pure Node MP3 frame parsing - the gate must run without ffmpeg installed. */

const FILES = [
  "meadow-morning-loop.mp3",
  "seedwake-action-loop.mp3",
  "seedwake-ceremony-loop.mp3",
  "fossil-footsteps-loop.mp3",
  "moonwood-lanterns-loop.mp3",
  "river-garden-paddle-loop.mp3",
  "forge-yard-stomp-loop.mp3",
  "glass-marsh-drift-loop.mp3",
  "storm-coast-skip-loop.mp3",
  "lantern-forest-prowl-loop.mp3",
  "star-reach-finale-loop.mp3"
];
const AMBIENCE_FILES = [
  "seedwake-meadow-ambience-loop.mp3",
  "river-gardens-ambience-loop.mp3",
  "fossil-canyon-ambience-loop.mp3",
  "forge-settlement-ambience-loop.mp3",
  "glass-marsh-ambience-loop.mp3",
  "storm-coast-ambience-loop.mp3",
  "lantern-forest-ambience-loop.mp3",
  "star-reach-ambience-loop.mp3"
];
const ROOT = "public/audio/music/quest";
const MAX_BYTES = 1_300_000; // chapter files are lazy and must still suit school wifi
const MPEG1_LAYER3_BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const MPEG2_LAYER3_BITRATES = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const MPEG1_SAMPLE_RATES = [44100, 48000, 32000];
const MPEG2_SAMPLE_RATES = [22050, 24000, 16000];

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
    const version = (bytes[offset + 1] >> 3) & 0x03; // 3 = MPEG1, 2 = MPEG2
    const layer = (bytes[offset + 1] >> 1) & 0x03; // 1 = Layer III
    const bitrateIndex = (bytes[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (bytes[offset + 2] >> 2) & 0x03;
    const padding = (bytes[offset + 2] >> 1) & 0x01;
    const channelMode = (bytes[offset + 3] >> 6) & 0x03; // 3 = mono

    const mpeg1 = version === 3;
    const bitrate = (mpeg1 ? MPEG1_LAYER3_BITRATES : MPEG2_LAYER3_BITRATES)[bitrateIndex];
    const rate = (mpeg1 ? MPEG1_SAMPLE_RATES : MPEG2_SAMPLE_RATES)[sampleRateIndex];
    if (![2, 3].includes(version) || layer !== 1 || !bitrate || !rate) {
      offset += 1;
      continue;
    }

    const frameLength = Math.floor(((mpeg1 ? 144 : 72) * bitrate * 1000) / rate) + padding;
    if (frameLength <= 4) {
      offset += 1;
      continue;
    }

    frames += 1;
    duration += (mpeg1 ? 1152 : 576) / rate;
    sampleRate = rate;
    channels = channelMode === 3 ? 1 : 2;
    maxBitrate = Math.max(maxBitrate, bitrate);
    offset += frameLength;
  }

  if (!frames) throw new Error(`${filename} has no readable MPEG2 Layer III frames`);
  return { bytes, frames, duration, sampleRate, channels, bitrate: maxBitrate };
}

for (const filename of [...FILES, ...AMBIENCE_FILES]) {
  const info = readMp3(filename);
  if (info.channels !== 2) throw new Error(`${filename} should be stereo for spatial clarity`);
  if (info.sampleRate !== 44100) throw new Error(`${filename} has ${info.sampleRate} Hz audio`);
  if (info.bitrate > 160) throw new Error(`${filename} is encoded at ${info.bitrate}kbps - too fat to ship`);
  const ambience = AMBIENCE_FILES.includes(filename);
  if (info.duration < (ambience ? 26 : 34) || info.duration > (ambience ? 30 : 62)) {
    throw new Error(`${filename} has an unsuitable ${info.duration.toFixed(1)}s loop`);
  }
  if (info.bytes.length > MAX_BYTES) {
    throw new Error(`${filename} is ${(info.bytes.length / 1024).toFixed(0)}KB - over the ${MAX_BYTES / 1024}KB budget`);
  }
  const hash = createHash("sha256").update(info.bytes).digest("hex");
  if (hashes.has(hash)) throw new Error(`${filename} duplicates another world track`);
  hashes.add(hash);
  console.log(
    `${filename}: ${info.duration.toFixed(2)}s ${info.sampleRate}Hz ${info.bitrate}kbps stereo ${(info.bytes.length / 1024).toFixed(0)}KB`
  );
}

console.log(`OK: ${FILES.length} score arrangements and ${AMBIENCE_FILES.length} distinct high-resolution quest soundscapes`);
