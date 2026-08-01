import "dotenv/config";

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import OpenAI from "openai";

import { PHONEME_RECORDING_TARGETS } from "../src/data/phonemeRecordingSpec.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT = path.join(ROOT, ".artifacts", "phoneme-ai-pilot");
const DEFAULT_TAKES = [
  "b",
  "s",
  "sh",
  "th-unvoiced",
  "th-voiced",
  "a",
  "or",
  "tion"
];
const DEFAULT_VOICES = ["marin", "cedar", "coral"];

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

function allTakes() {
  return PHONEME_RECORDING_TARGETS.flatMap(item => item.takeIds.map((takeId, takeIndex) => ({
    ...item,
    takeId,
    ipa: item.ipa.includes(" and ") ? item.ipa.split(" and ")[takeIndex] : item.ipa
  })));
}

function soundClass(take) {
  if (/stop|affricate/i.test(take.direction)) return "brief";
  if (/continuous/i.test(take.direction)) return "continuous";
  return "natural";
}

function generationPrompt(take, variant) {
  const duration = soundClass(take) === "brief"
    ? "Make it one clean, very brief articulation."
    : soundClass(take) === "continuous"
      ? "Hold it steadily for about 500 milliseconds."
      : "Use a natural teaching length of about 450 milliseconds.";
  const variantDirection = [
    "Use a neutral, calm adult US-English teaching voice.",
    "Use an exceptionally clean studio articulation with a gentle onset.",
    "Prioritize phonetic accuracy over expressiveness; keep the vocal tract steady."
  ][variant % 3];

  return `Create one isolated phonics sound for a young child.

Target IPA: ${take.ipa}
Anchor word for pronunciation only: ${take.anchor}
Specific direction: ${take.direction}

The AUDIO must contain only the target sound. Do not say the letter name, the IPA symbols, the anchor word, an instruction, or any other speech. Do not add a count-in, introductory breath, click, echo, or musical tone. Do not add a trailing schwa or “uh.” ${duration} Leave a short clean silence before and after the sound. ${variantDirection}`;
}

function judgePrompt(take) {
  return `Evaluate this candidate as an isolated US-English phonics cue for a child.
Expected IPA: ${take.ipa}
Anchor: ${take.anchor}
Direction: ${take.direction}

Return JSON only with these fields:
{
  "score": integer 0-100,
  "heard_as": short IPA or plain-English description,
  "target_match": boolean,
  "contains_letter_name": boolean,
  "contains_anchor_word": boolean,
  "contains_other_speech": boolean,
  "trailing_schwa": boolean,
  "clean_isolation": boolean,
  "child_teaching_quality": "pass" | "review" | "reject",
  "notes": short string
}
Reject a stop consonant with a trailing vowel. Reject any spoken word, letter name, explanation, or extra sound.`;
}

function normalizeAudio(inputPath, outputPath) {
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", inputPath,
    "-af",
    "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-50dB:stop_periods=1:stop_silence=0.06:stop_threshold=-50dB,loudnorm=I=-20:TP=-3:LRA=4,afade=t=in:st=0:d=0.005,adelay=60,apad=pad_dur=0.08",
    "-t", "2.5", "-ar", "48000", "-ac", "1", outputPath
  ]);
}

function probeAudio(filePath) {
  const raw = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "a:0",
    "-show_entries", "stream=sample_rate,channels:format=duration",
    "-of", "json", filePath
  ], { encoding: "utf8" });
  const parsed = JSON.parse(raw);
  return {
    duration: Number(parsed.format?.duration || 0),
    sampleRate: Number(parsed.streams?.[0]?.sample_rate || 0),
    channels: Number(parsed.streams?.[0]?.channels || 0)
  };
}

async function generateCandidate(client, take, { model, voice, variant }) {
  const completion = await client.chat.completions.create({
    model,
    modalities: ["text", "audio"],
    audio: { voice, format: "wav" },
    temperature: 0.35 + variant * 0.15,
    messages: [
      {
        role: "system",
        content: "You are a precision speech-production model. Follow the requested audio form exactly. The audible response must never include commentary."
      },
      { role: "user", content: generationPrompt(take, variant) }
    ]
  });
  const audio = completion.choices?.[0]?.message?.audio;
  if (!audio?.data) throw new Error(`No audio data returned for ${take.takeId}`);
  return {
    bytes: Buffer.from(audio.data, "base64"),
    transcript: String(audio.transcript || completion.choices?.[0]?.message?.content || "")
  };
}

async function judgeCandidate(client, take, filePath, model) {
  const data = readFileSync(filePath).toString("base64");
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{
      role: "user",
      content: [
        { type: "text", text: judgePrompt(take) },
        { type: "input_audio", input_audio: { data, format: "wav" } }
      ]
    }]
  });
  return JSON.parse(completion.choices?.[0]?.message?.content || "{}");
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"
  })[character]);
}

function renderReview(results, outputDirectory) {
  const rows = results.map(result => `<article class="candidate ${esc(result.verdict)}">
    <header><strong>${esc(result.takeId)}</strong><span>${esc(result.ipa)} · ${esc(result.voice)} · take ${result.variant + 1}</span></header>
    <audio controls preload="metadata" src="${esc(path.relative(outputDirectory, result.processedPath))}"></audio>
    <dl>
      <div><dt>Model score</dt><dd>${esc(result.judge.score ?? "—")}</dd></div>
      <div><dt>Decision</dt><dd>${esc(result.verdict)}</dd></div>
      <div><dt>Heard as</dt><dd>${esc(result.judge.heard_as || "—")}</dd></div>
      <div><dt>Duration</dt><dd>${result.metrics.duration.toFixed(3)}s</dd></div>
    </dl>
    <p>${esc(result.judge.notes || "No notes returned.")}</p>
  </article>`).join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phoneme AI pilot</title><style>
  :root{font-family:system-ui,sans-serif;color:#14271f;background:#f5f0e6}body{max-width:1100px;margin:auto;padding:32px}h1{margin-bottom:4px}.intro{max-width:72ch;color:#44544d}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px;margin-top:24px}.candidate{padding:18px;border:2px solid #c7c3b6;border-radius:18px;background:#fff}.candidate.pass{border-color:#4e9b6c}.candidate.reject{border-color:#c76767}.candidate header{display:flex;justify-content:space-between;gap:12px}.candidate header span{font-size:12px;color:#64716c;text-align:right}audio{width:100%;margin:14px 0}dl{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:0}dl div{padding:8px;background:#f4f5f1;border-radius:8px}dt{font-size:11px;color:#64716c}dd{margin:2px 0 0;font-weight:700}p{font-size:13px;line-height:1.4}</style></head><body><h1>Phoneme AI pilot</h1><p class="intro">Candidates only. A model score helps reject obvious failures; it does not make a sound production-approved. Listen for the exact isolated sound, especially trailing “uh” on stop consonants.</p><main class="grid">${rows}</main></body></html>`;
}

function verdictFor(judge, metrics) {
  if (metrics.duration < 0.08 || metrics.duration > 2.2) return "reject";
  if (judge.contains_letter_name || judge.contains_anchor_word || judge.contains_other_speech || judge.trailing_schwa) return "reject";
  if (judge.target_match && judge.clean_isolation && Number(judge.score) >= 82) return "pass";
  return "review";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");

  const outputDirectory = path.resolve(options.output || DEFAULT_OUTPUT);
  const requested = String(options.keys || DEFAULT_TAKES.join(",")).split(",").map(value => value.trim()).filter(Boolean);
  const candidatesPerTake = Math.max(1, Math.min(5, Number(options.candidates || 3)));
  const generationModel = options.model || process.env.OPENAI_PHONEME_AUDIO_MODEL || "gpt-audio-1.5";
  const judgeModel = options.judge || process.env.OPENAI_PHONEME_JUDGE_MODEL || "gpt-audio-1.5";
  const takeMap = new Map(allTakes().map(item => [item.takeId, item]));
  const takes = requested.map(takeId => {
    const take = takeMap.get(takeId);
    if (!take) throw new Error(`Unknown phoneme take: ${takeId}`);
    return take;
  });

  mkdirSync(outputDirectory, { recursive: true });
  const client = new OpenAI({ apiKey });
  const results = [];

  for (const take of takes) {
    for (let variant = 0; variant < candidatesPerTake; variant += 1) {
      const voice = DEFAULT_VOICES[variant % DEFAULT_VOICES.length];
      const baseName = `${take.takeId}--${voice}--${variant + 1}`;
      const rawPath = path.join(outputDirectory, `${baseName}.raw.wav`);
      const processedPath = path.join(outputDirectory, `${baseName}.wav`);
      console.log(`Generate ${take.takeId} candidate ${variant + 1}/${candidatesPerTake} (${voice})`);

      let transcript = "";
      if (!existsSync(processedPath)) {
        const generated = await generateCandidate(client, take, { model: generationModel, voice, variant });
        transcript = generated.transcript;
        writeFileSync(rawPath, generated.bytes);
        normalizeAudio(rawPath, processedPath);
      }
      const metrics = probeAudio(processedPath);
      let judge;
      try {
        judge = await judgeCandidate(client, take, processedPath, judgeModel);
      } catch (error) {
        judge = { score: 0, child_teaching_quality: "review", notes: `Automated judge unavailable: ${error.message}` };
      }
      results.push({
        takeId: take.takeId,
        ipa: take.ipa,
        anchor: take.anchor,
        voice,
        variant,
        transcript,
        rawPath,
        processedPath,
        metrics,
        judge,
        verdict: verdictFor(judge, metrics)
      });
    }
  }

  results.sort((left, right) => left.takeId.localeCompare(right.takeId) || Number(right.judge.score || 0) - Number(left.judge.score || 0));
  writeFileSync(path.join(outputDirectory, "pilot-summary.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    generationModel,
    judgeModel,
    disclosureRequired: true,
    results: results.map(result => ({ ...result, rawPath: path.relative(ROOT, result.rawPath), processedPath: path.relative(ROOT, result.processedPath) }))
  }, null, 2)}\n`);
  writeFileSync(path.join(outputDirectory, "index.html"), renderReview(results, outputDirectory));

  const counts = Object.groupBy(results, result => result.verdict);
  console.log(`Pilot complete: ${results.length} candidates; pass ${counts.pass?.length || 0}, review ${counts.review?.length || 0}, reject ${counts.reject?.length || 0}`);
  console.log(path.join(outputDirectory, "index.html"));
}

main().catch(error => {
  console.error(`Phoneme AI pilot failed: ${error.message}`);
  process.exitCode = 1;
});
