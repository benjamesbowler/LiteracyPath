import "dotenv/config";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

import { audioManifest } from "../src/data/audioManifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "public/audio/choices");

const PILOT_LIMIT = 100;
const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const voice = process.env.OPENAI_TTS_VOICE || "alloy";

function choiceOutputPath(key) {
  return path.join(outputDir, `${key}.mp3`);
}

function getPilotChoices() {
  return Object.entries(audioManifest)
    .filter(([, entry]) => entry.kinds?.includes("choice"))
    .sort(([, a], [, b]) => {
      if (b.useCount !== a.useCount) return b.useCount - a.useCount;
      return a.text.localeCompare(b.text);
    })
    .slice(0, PILOT_LIMIT);
}

async function generateSpeech(client, text) {
  const response = await client.audio.speech.create({
    model,
    voice,
    input: text,
    format: "mp3"
  });

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const pilotChoices = getPilotChoices();
  const apiKey = process.env.OPENAI_API_KEY;

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Audio pilot target: ${pilotChoices.length} reusable choice texts`);
  console.log(`Output folder: ${path.relative(rootDir, outputDir)}`);
  console.log(`Model: ${model}`);
  console.log(`Voice: ${voice}`);

  if (!apiKey) {
    console.log("OPENAI_API_KEY is not set. No audio files were generated.");
    console.log("Top pilot choices:");
    pilotChoices.forEach(([key, entry], index) => {
      console.log(`${index + 1}. ${entry.text} (${entry.useCount} uses) -> choices/${key}.mp3`);
    });
    return;
  }

  const client = new OpenAI({ apiKey });
  let generated = 0;
  let skipped = 0;

  for (const [key, entry] of pilotChoices) {
    const outputPath = choiceOutputPath(key);
    const relativePath = path.relative(rootDir, outputPath);
    const position = generated + skipped + 1;

    if (fs.existsSync(outputPath)) {
      skipped += 1;
      console.log(`[${position}/${pilotChoices.length}] Skip existing ${relativePath}`);
      continue;
    }

    console.log(`[${position}/${pilotChoices.length}] Generate "${entry.text}" -> ${relativePath}`);
    const audioBuffer = await generateSpeech(client, entry.text);
    fs.writeFileSync(outputPath, audioBuffer);
    generated += 1;
  }

  console.log(`Generated files: ${generated}`);
  console.log(`Skipped existing files: ${skipped}`);
}

main().catch(error => {
  console.error("Audio batch failed.");
  console.error(error);
  process.exitCode = 1;
});
