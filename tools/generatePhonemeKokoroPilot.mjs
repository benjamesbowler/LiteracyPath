import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PHONEME_RECORDING_TARGETS } from "../src/data/phonemeRecordingSpec.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT = path.join(ROOT, ".artifacts", "phoneme-kokoro-pilot");
const DEFAULT_TAKES = ["b", "s", "sh", "th-unvoiced", "th-voiced", "a", "or", "tion"];
const PYTHON = path.join(ROOT, ".artifacts", "kokoro-venv", "bin", "python");
const SYNTHESIZER = path.join(ROOT, "tools", "synthesizeKokoroPhonemes.py");
const VOICES = Object.freeze([
  Object.freeze({ id: "af_heart", name: "Heart", speed: 1.0 }),
  Object.freeze({ id: "af_bella", name: "Bella", speed: 1.0 }),
  Object.freeze({ id: "am_adam", name: "Adam", speed: 1.0 })
]);

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    options[token.slice(2)] = argv[index + 1];
    index += 1;
  }
  return options;
}

function stripSlashes(value) {
  return String(value).replace(/^\//, "").replace(/\/$/, "");
}

function allTakes() {
  return PHONEME_RECORDING_TARGETS.flatMap(item => item.takeIds.map((takeId, takeIndex) => ({
    ...item,
    takeId,
    ipa: stripSlashes(item.ipa.includes(" and ") ? item.ipa.split(" and ")[takeIndex] : item.ipa),
    anchor: item.anchor.includes(";") ? item.anchor.split(";")[takeIndex].trim() : item.anchor
  })));
}

function soundClass(take) {
  if (/stop|affricate/i.test(take.direction)) return "brief";
  if (/continuous/i.test(take.direction) || take.takeId.startsWith("th-")) return "continuous";
  return "natural";
}

function normalizeAudio(inputPath, outputPath, take) {
  const className = soundClass(take);
  const maxDuration = className === "brief" ? "0.65" : className === "continuous" ? "1.20" : "1.35";
  const stretch = className === "continuous"
    ? "atempo=0.5,atempo=0.5,"
    : take.kind === "vowel"
      ? "atempo=0.5,"
      : "";
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", inputPath,
    "-af",
    `${stretch}silenceremove=start_periods=1:start_silence=0.015:start_threshold=-55dB:stop_periods=1:stop_silence=0.04:stop_threshold=-55dB,loudnorm=I=-20:TP=-3:LRA=4,afade=t=in:st=0:d=0.004,adelay=55,apad=pad_dur=0.08`,
    "-t", maxDuration,
    "-ar", "48000", "-ac", "1", "-c:a", "pcm_s24le", outputPath
  ]);
}

function probeAudio(filePath) {
  const raw = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "a:0",
    "-show_entries", "stream=sample_rate,channels,bits_per_sample:format=duration",
    "-of", "json", filePath
  ], { encoding: "utf8" });
  const parsed = JSON.parse(raw);
  return {
    duration: Number(parsed.format?.duration || 0),
    sampleRate: Number(parsed.streams?.[0]?.sample_rate || 0),
    channels: Number(parsed.streams?.[0]?.channels || 0),
    bitsPerSample: Number(parsed.streams?.[0]?.bits_per_sample || 0)
  };
}

function automaticCheck(take, metrics) {
  const className = soundClass(take);
  const ranges = { brief: [0.08, 0.65], continuous: [0.18, 1.20], natural: [0.12, 1.35] };
  const [minimum, maximum] = ranges[className];
  const formatPass = metrics.sampleRate === 48000 && metrics.channels === 1 && metrics.bitsPerSample === 24;
  const durationPass = metrics.duration >= minimum && metrics.duration <= maximum;
  return {
    verdict: formatPass && durationPass ? "listen" : "reject",
    formatPass,
    durationPass,
    note: formatPass && durationPass
      ? "Technical checks passed. Listen for exact target, clean isolation and no trailing vowel."
      : "Technical format or duration is outside the acceptance range."
  };
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"
  })[character]);
}

function renderReview(results, outputDirectory) {
  const groups = Object.groupBy(results, result => result.takeId);
  const sections = Object.entries(groups).map(([takeId, candidates]) => {
    const first = candidates[0];
    const cards = candidates.map(candidate => `<article class="candidate ${candidate.check.verdict}"><header><strong>${esc(candidate.voice.name)}</strong><span>${candidate.metrics.duration.toFixed(3)}s</span></header><audio controls preload="metadata" src="${esc(path.relative(outputDirectory, candidate.processedPath))}"></audio><label><input type="radio" name="${esc(takeId)}" value="${esc(candidate.voice.id)}"> Best candidate</label><p>${esc(candidate.check.note)}</p></article>`).join("\n");
    return `<section class="take"><div class="take-heading"><div><h2>${esc(takeId)}</h2><p class="ipa">/${esc(first.ipa)}/</p></div><p><strong>Anchor:</strong> ${esc(first.anchor)}<br>${esc(first.direction)}</p></div><div class="candidate-grid">${cards}</div></section>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kokoro phoneme pilot</title><style>:root{font-family:Inter,ui-rounded,system-ui,sans-serif;color:#14271f;background:#f5f0e6}*{box-sizing:border-box}body{max-width:1120px;margin:auto;padding:32px}h1{margin:0 0 6px}.intro{max-width:76ch;color:#506059;line-height:1.5}.take{margin:28px 0;padding:22px;border:1px solid #d7d1c3;border-radius:20px;background:#fff}.take-heading{display:flex;justify-content:space-between;gap:20px;align-items:start}.take-heading h2{margin:0;font-size:28px}.take-heading p{margin:0;max-width:60ch}.ipa{font-size:19px;color:#7a5b20}.candidate-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.candidate{padding:14px;border:2px solid #bed8c7;border-radius:14px;background:#f8fcf9}.candidate.reject{border-color:#d99b9b;background:#fff8f8}.candidate header{display:flex;justify-content:space-between;gap:10px}.candidate header span,.candidate p{color:#5e6e66;font-size:12px}.candidate audio{width:100%;margin:12px 0}.candidate label{font-size:13px;font-weight:700}@media(max-width:760px){body{padding:18px}.candidate-grid{grid-template-columns:1fr}.take-heading{display:block}.take-heading>p{margin-top:10px}}</style></head><body><h1>Kokoro phoneme pilot</h1><p class="intro">These candidates were generated directly from phoneme tokens by the Apache-licensed Kokoro model. They are not ordinary text-to-speech readings. Technical checks do not approve pronunciation: listen for the exact isolated sound, no word or letter name, and no trailing “uh” on stop consonants.</p>${sections}</body></html>`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(PYTHON)) throw new Error("Local Kokoro environment is missing. Create .artifacts/kokoro-venv and install kokoro + soundfile first.");
  const outputDirectory = path.resolve(options.output || DEFAULT_OUTPUT);
  const requested = String(options.keys || DEFAULT_TAKES.join(",")).split(",").map(value => value.trim()).filter(Boolean);
  const candidateCount = Math.max(1, Math.min(VOICES.length, Number(options.candidates || VOICES.length)));
  const takeMap = new Map(allTakes().map(item => [item.takeId, item]));
  const takes = requested.map(takeId => {
    const take = takeMap.get(takeId);
    if (!take) throw new Error(`Unknown phoneme take: ${takeId}`);
    return take;
  });

  mkdirSync(outputDirectory, { recursive: true });
  const jobs = takes.flatMap(take => VOICES.slice(0, candidateCount).map(voice => ({
    takeId: take.takeId,
    phonemes: take.ipa,
    targetPhonemes: take.ipa,
    anchor: take.anchor,
    anchorOutput: path.join(outputDirectory, "anchors", `${take.takeId}--${voice.id}.wav`),
    voice: voice.id,
    speed: voice.speed,
    output: path.join(outputDirectory, "raw", `${take.takeId}--${voice.id}.wav`)
  })));
  const manifestPath = path.join(outputDirectory, "synthesis-manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(jobs, null, 2)}\n`);
  execFileSync(PYTHON, [SYNTHESIZER, "--manifest", manifestPath], { stdio: "inherit" });

  const results = [];
  for (const job of jobs) {
    const take = takeMap.get(job.takeId);
    const voice = VOICES.find(item => item.id === job.voice);
    const processedPath = path.join(outputDirectory, "candidates", `${take.takeId}--${voice.id}.wav`);
    mkdirSync(path.dirname(processedPath), { recursive: true });
    normalizeAudio(job.output, processedPath, take);
    const metrics = probeAudio(processedPath);
    results.push({
      takeId: take.takeId,
      ipa: take.ipa,
      anchor: take.anchor,
      direction: take.direction,
      voice,
      rawPath: job.output,
      anchorPath: job.anchorOutput,
      processedPath,
      metrics,
      check: automaticCheck(take, metrics)
    });
  }

  writeFileSync(path.join(outputDirectory, "pilot-summary.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    generator: "hexgrad/Kokoro-82M 1.0",
    license: "Apache-2.0",
    generatedFromRawPhonemes: true,
    installedInRuntime: false,
    results: results.map(result => ({
      ...result,
      rawPath: path.relative(ROOT, result.rawPath),
      anchorPath: path.relative(ROOT, result.anchorPath),
      processedPath: path.relative(ROOT, result.processedPath)
    }))
  }, null, 2)}\n`);
  const reviewPath = path.join(outputDirectory, "index.html");
  writeFileSync(reviewPath, renderReview(results, outputDirectory));
  console.log(`Pilot complete: ${results.length} candidates. Nothing was installed into the app.`);
  console.log(reviewPath);
}

try {
  main();
} catch (error) {
  console.error(`Kokoro phoneme pilot failed: ${error.message}`);
  process.exitCode = 1;
}
