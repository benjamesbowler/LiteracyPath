import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, "public/audio/production/en-US/supplemental");
const generatedModulePath = path.join(
  repositoryRoot,
  "src/data/generated/ledaRuntimeSupplement.generated.js"
);
const assessmentMediaRequestPath = path.join(
  repositoryRoot,
  "docs/skills-assessment-rebuild/MEDIA_REQUEST.json"
);
const projectId = "project-3c66c1c8-cc9e-4d6d-bdf";
const voiceName = "en-US-Chirp3-HD-Leda";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const batchSize = 6;

// These are active runtime words that were represented only by a legacy
// recording and therefore were not present in the first corpus extraction.
const fixedTexts = Object.freeze([
  "a blanket fort", "arrange", "athlete", "backpack", "balance", "bathe",
  "borrow", "bow", "cape", "chat", "cheer", "chop", "close", "color",
  "concrete", "connect", "copy", "crib", "decorate", "describe", "divide",
  "dome", "dull", "flip", "fold", "fond", "friendly", "gather", "gray",
  "grin", "guess", "hike", "honest", "invite", "join", "label", "library",
  "lightweight", "listen and find", "lonely", "march", "mole", "patient",
  "pete", "pine", "pretend", "quicksand", "read", "repeat", "rip", "screen",
  "separate", "shadow", "soccer", "sort", "spill", "sprinkle", "stale",
  "stove", "tame", "tickle", "use", "vegetable", "wind",
  // Active arcade/quest words caught by recorded-audio playthrough tests.
  "ax", "string", "tonight", "track", "twist",
  // Human-ear replacements requested during the assessment QA pass. Keeping
  // these in the highest-priority supplement map guarantees every surface
  // stops resolving the earlier production take.
  "hat", "sun",
  "listen to the word. what sound does it start with?",
  "what digraph makes the sh sound as in ship",
  "what digraph makes the ch sound as in chip",
  "what digraph makes the th sound as in think",
  "ask your teacher for the class code",
  "who are you",
  "tap your three secret pictures",
  "that did not match",
  "ask your teacher for help",
  "watch me first",
  "start at the top",
  "now you try",
  "amazing work",
  "build the word you hear",
  "listen then tap the matching word",
  "find the matching sight words"
]);

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
}

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/^hfw:/i, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, "\"")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();
}

async function assessmentGapTexts() {
  const request = JSON.parse(await readFile(assessmentMediaRequestPath, "utf8"));
  return [
    ...(request.prompts || []).map(row => ({ text: row.text, file: row.file, exists: row.exists })),
    ...(request.sentences || []).map(row => ({ text: row.text, file: row.file, exists: row.exists })),
    ...(request.passages || []).map(row => ({ text: row.text, file: row.file, exists: row.exists })),
    ...(request.words || []).map(row => ({ text: row.word, file: row.file, exists: row.exists })),
    ...(request.phrases || []).map(row => ({ text: row.text, file: row.file, exists: row.exists }))
  ]
    .filter(row => row.text && (
      row.exists === false ||
      String(row.file || "").startsWith("/audio/production/en-US/supplemental/")
    ))
    .map(row => row.text);
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function run(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let errorText = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", chunk => {
      errorText = `${errorText}${chunk}`.slice(-1600);
    });
    child.once("error", reject);
    child.once("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed: ${errorText}`));
    });
  });
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function hasNonEmptyFile(filePath) {
  try {
    return (await stat(filePath)).size > 0;
  } catch {
    return false;
  }
}

async function normalizeWave(record) {
  await run(
    "ffmpeg",
    [
      "-y", "-hide_banner", "-loglevel", "error", "-i", record.wavPath,
      "-af", "loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015",
      "-codec:a", "libmp3lame", "-b:a", "128k", record.mp3Path
    ],
    `Normalize ${record.text}`
  );
  await unlink(record.wavPath);
}

async function synthesize(accessToken, record, attempt = 0) {
  if (await hasNonEmptyFile(record.mp3Path)) return false;
  if (await hasNonEmptyFile(record.wavPath)) {
    await normalizeWave(record);
    return true;
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text: record.text },
      voice: { languageCode: "en-US", name: voiceName },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 }
    })
  });
  if (!response.ok) {
    const responseText = await response.text();
    if (response.status === 429 && attempt < 10) {
      const retryAfterSeconds = Number(response.headers.get("retry-after") || 0);
      const delay = Math.min(
        45_000,
        Math.max(retryAfterSeconds * 1000, 5_000 * (2 ** attempt))
      );
      await wait(delay);
      return synthesize(accessToken, record, attempt + 1);
    }
    throw new Error(`${record.text} failed with ${response.status}: ${responseText.slice(0, 1000)}`);
  }
  const result = await response.json();
  await writeFile(record.wavPath, Buffer.from(result.audioContent, "base64"));
  await normalizeWave(record);
  return true;
}

await mkdir(outputDirectory, { recursive: true });
const textByKey = new Map();
for (const text of [...fixedTexts, ...(await assessmentGapTexts())]) {
  const key = normalizeText(text);
  if (key && !textByKey.has(key)) textByKey.set(key, String(text).trim());
}
const accessToken = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" }
).trim();

const records = [...textByKey].map(([key, text]) => {
  const id = `${slug(key)}-${hash(`${voiceName}|${key}`)}`;
  return {
    key,
    text,
    wavPath: path.join(outputDirectory, `${id}.wav`),
    mp3Path: path.join(outputDirectory, `${id}.mp3`),
    publicPath: `/audio/production/en-US/supplemental/${id}.mp3`
  };
});

for (let offset = 0; offset < records.length; offset += batchSize) {
  const generatedInBatch = await Promise.all(
    records.slice(offset, offset + batchSize).map(async record => {
      const generated = await synthesize(accessToken, record);
      record.generated = generated;
      return generated;
    })
  );
  if (offset + batchSize < records.length && generatedInBatch.some(Boolean)) await wait(1_000);
}

const map = Object.fromEntries(records.map(record => [record.key, record.publicPath]));
const moduleText = `// AUTO-GENERATED by tools/generateLedaRuntimeSupplement.mjs - do not edit.\n` +
  `export const LEDA_RUNTIME_SUPPLEMENT_AUDIO = Object.freeze(${JSON.stringify(map, null, 2)});\n`;
await writeFile(generatedModulePath, moduleText);
console.log(`Installed ${records.length} Leda runtime supplement clips.`);
