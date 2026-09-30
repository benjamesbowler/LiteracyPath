import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { storyQuests } from "../src/data/storyQuests.js";
import { storyQuestSpokenItems } from "../src/data/storyQuestReaderCopy.js";
import { normalizeLedaAudioText } from "../src/data/ledaProductionAudio.js";
import { getStoryQuestLedaAudioPath } from "../src/data/storyQuestLedaAudio.js";

const root = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await fs.readFile(path.join(root, "src/content/storyQuestNarrationManifest.generated.json"), "utf8"));
const byKey = new Map(manifest.clips.map(clip => [clip.key, clip]));
const errors = [];
const items = storyQuestSpokenItems(storyQuests);
for (const item of items) {
  const key = normalizeLedaAudioText(item.text);
  const resolved = getStoryQuestLedaAudioPath(item.text);
  if (!resolved || byKey.get(key)?.audioPath !== resolved) errors.push(`${item.questId}/${item.pageId}: missing exact spoken mapping for ${item.text}`);
}
for (const key of byKey.keys()) {
  if (!items.some(item => normalizeLedaAudioText(item.text) === key)) errors.push(`Stale manifest key: ${key}`);
}

function decode(file) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-v", "error", "-i", file, "-f", "f32le", "-ac", "1", "-ar", "24000", "pipe:1"]);
    const chunks = [];
    let stderr = "";
    child.stdout.on("data", data => chunks.push(data));
    child.stderr.on("data", data => { stderr += data; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(stderr)));
  });
}

function signal(pcm) {
  const samples = pcm.length / 4;
  let peak = 0, sum = 0, frameSum = 0, activeFrames = 0, lastActiveFrame = -1;
  let clippedSamples = 0, invalidSamples = 0;
  for (let index = 0; index < samples; index += 1) {
    const value = pcm.readFloatLE(index * 4);
    if (!Number.isFinite(value)) { invalidSamples += 1; continue; }
    peak = Math.max(peak, Math.abs(value));
    sum += value * value;
    frameSum += value * value;
    if (Math.abs(value) >= 0.999) clippedSamples += 1;
    if ((index + 1) % 240 === 0 || index === samples - 1) {
      if (frameSum / Math.min(240, (index % 240) + 1) > 0.00001) {
        activeFrames += 1;
        lastActiveFrame = Math.floor(index / 240);
      }
      frameSum = 0;
    }
  }
  return {
    durationSeconds: samples / 24000,
    peakDb: peak ? 20 * Math.log10(peak) : null,
    wholeFileRmsDb: sum ? 10 * Math.log10(sum / samples) : null,
    activeSpeechMilliseconds: activeFrames * 10,
    trailingQuietMilliseconds: Math.max(0, samples / 24 - (lastActiveFrame + 1) * 10),
    clippedSamples, invalidSamples
  };
}

const results = [];
let cursor = 0;
async function worker() {
  while (cursor < manifest.clips.length) {
    const clip = manifest.clips[cursor++];
    try {
      const file = path.join(root, "public", clip.audioPath.replace(/^\//, ""));
      const digest = createHash("sha256").update(await fs.readFile(file)).digest("hex");
      if (digest !== clip.audioSha256) throw new Error("byte provenance changed");
      const metrics = signal(await decode(file));
      const problems = [];
      if (metrics.durationSeconds < 0.12 || metrics.activeSpeechMilliseconds < 50 || metrics.peakDb === null || metrics.peakDb < -40) problems.push("missing audible speech signal");
      if (metrics.invalidSamples || metrics.clippedSamples) problems.push("invalid or clipped samples");
      if (problems.length) errors.push(`${clip.key}: ${problems.join(", ")}`);
      results.push({ key: clip.key, path: clip.audioPath, sha256: digest, ...metrics, problems });
    } catch (error) { errors.push(`${clip.key}: ${error.message}`); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
const report = {
  method: "Exact runtime resolution, byte provenance and full mono 24kHz float decoding; signal measured in 10ms windows throughout each clip.",
  limitation: "Signal is not a transcription or human listening claim. Very short trailing silence is a screening flag, not proof of truncation.",
  references: items.length, uniqueClips: manifest.clips.length,
  endingScreens: results.filter(row => row.trailingQuietMilliseconds < 20).map(row => row.key),
  errors, results: results.sort((a, b) => a.key.localeCompare(b.key))
};
const outputFlag = process.argv.indexOf("--output");
const output = path.resolve(root, outputFlag >= 0 ? process.argv[outputFlag + 1] : ".artifacts/story-quests/audio-integrity.json");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2) + "\n");
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
console.log(`Story Quest audio: ${manifest.clips.length} clips, ${items.length} spoken references, ${errors.length} integrity failures, ${report.endingScreens.length} short-tail screens.`);
