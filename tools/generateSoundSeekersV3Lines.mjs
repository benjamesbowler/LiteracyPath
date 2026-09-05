#!/usr/bin/env node
// Sound Seekers v3 — voices the Meet ("problem") and Fix lines for the 40
// trail stops via Google's Gemini TTS ("gemini-2.5-flash-tts") REST API.
// Must run on the Mac where `gcloud auth application-default login` has
// been done against a project with the Text-to-Speech API enabled.
//
// Usage: node tools/generateSoundSeekersV3Lines.mjs [--dry-run] [--force] [--only s1,s2] [--sheet]
//   --dry-run     print the plan (id, character, voice, text); no network call.
//   --force       regenerate every line even if a matching file exists.
//   --only s1,s7  limit generation to these stop ids (comma separated).
//   --sheet       also write ../tmp/ss-v3-lines-listening.html (outside the repo) for review.
//
// Writes public/audio/sound-seekers/v3/lines/<stop>-<kind>-<hash>.mp3, its
// manifest.json, and src/features/soundSeekers/v3/content/lines.generated.js.
// Idempotent: a line is skipped once the manifest's file (named from a hash
// of the model, voice, rate, prompt and text) exists on disk with content.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { CAST } from "../src/features/soundSeekers/v3/content/cast.js";
import { TRAIL } from "../src/features/soundSeekers/v3/content/trail.js";
import { VOICE_MODEL, voiceFor } from "../src/features/soundSeekers/v3/content/voices.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "public/audio/sound-seekers/v3/lines");
const manifestPath = path.join(outDir, "manifest.json");
const linesModulePath = path.join(repoRoot, "src/features/soundSeekers/v3/content/lines.generated.js");
const sheetPath = path.join(repoRoot, "..", "tmp", "ss-v3-lines-listening.html"); // beside the repo, never inside it
const webRoot = "/audio/sound-seekers/v3/lines";
const endpoint = "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const BACKOFFS_MS = [1000, 2000, 4000, 8000];
const CONCURRENCY = 3;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const wantSheet = args.includes("--sheet");
const onlyIndex = args.indexOf("--only");
const only = onlyIndex >= 0 ? new Set(args[onlyIndex + 1].split(",").map(s => s.trim()).filter(Boolean)) : null;

const sha256 = value => createHash("sha256").update(value).digest("hex");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function buildLines() {
  const lines = [];
  TRAIL.forEach((stop, stopIndex) => {
    for (const kind of ["problem", "fix"]) {
      const text = stop[kind];
      const v = voiceFor(stop.character);
      const textHash = sha256(`${VOICE_MODEL}|${v.voice}|${v.rate}|${v.prompt}|${text}`);
      const file = `${stop.id}-${kind}-${textHash.slice(0, 10)}.mp3`;
      lines.push({
        id: `${stop.id}-${kind}`, stopIndex, stopId: stop.id, kind, land: stop.land,
        character: stop.character, voice: v.voice, rate: v.rate, prompt: v.prompt, text, textHash, file
      });
    }
  });
  return lines;
}

async function fileHasContent(filePath) {
  const info = await stat(filePath).catch(() => null);
  return Boolean(info && info.size > 0);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/gu, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

async function writeSheet(lines) {
  const byLand = new Map();
  for (const line of lines) {
    if (!byLand.has(line.land)) byLand.set(line.land, []);
    byLand.get(line.land).push(line);
  }
  const sections = [...byLand.entries()].map(([land, group]) => {
    const rows = group.map(line => {
      const src = pathToFileURL(path.resolve(outDir, line.file)).href;
      return `<tr><td>${escapeHtml(line.id)}</td><td>${escapeHtml(CAST[line.character]?.name || line.character)}</td>`
        + `<td>${escapeHtml(line.voice)}</td><td>${line.rate}</td><td>${escapeHtml(line.text)}</td>`
        + `<td><audio controls preload="none" src="${src}"></audio></td></tr>`;
    }).join("\n");
    return `<h2>${escapeHtml(land)}</h2>\n<table border="1" cellpadding="4">\n`
      + "<tr><th>id</th><th>character</th><th>voice</th><th>rate</th><th>text</th><th>audio</th></tr>\n"
      + `${rows}\n</table>`;
  }).join("\n");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Sound Seekers v3 lines</title></head><body>\n`
    + `<h1>Sound Seekers v3 lines — ${lines.length} lines (model ${escapeHtml(VOICE_MODEL)})</h1>\n${sections}\n</body></html>\n`;
  await mkdir(path.dirname(sheetPath), { recursive: true });
  await writeFile(sheetPath, html);
  console.log(`Listening sheet: ${sheetPath}`);
}

const lines = buildLines();

if (dryRun) {
  console.log(`Sound Seekers v3 lines: ${lines.length} lines across ${TRAIL.length} stops (model ${VOICE_MODEL}). Dry run, nothing written.`);
  for (const line of lines) console.log(`${line.id}\t${line.character}\t${line.voice}\t${line.text}`);
  if (wantSheet) await writeSheet(lines);
  process.exit(0);
}

async function loadManifest() {
  const raw = await readFile(manifestPath, "utf8").catch(() => null);
  const parsed = raw ? JSON.parse(raw) : {};
  return new Map((parsed.lines || []).map(entry => [entry.id, entry]));
}

let token = "";
let project = "";
const gcloudValue = cliArgs => execFileSync("gcloud", cliArgs, { encoding: "utf8", timeout: 30000 }).trim();
const getProject = () => (project ||= gcloudValue(["config", "get-value", "project"]));
const getToken = (refresh = false) => (token && !refresh ? token : (token = gcloudValue(["auth", "application-default", "print-access-token"])));

// POST one line to the synthesize endpoint, retrying 429/5xx and network
// errors with backoff, and refreshing the access token once on a 401.
async function synthesize(line) {
  let attempt = 0;
  let refreshedToken = false;
  for (;;) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(60000),
        headers: { Authorization: `Bearer ${getToken()}`, "x-goog-user-project": getProject(), "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: line.text, prompt: line.prompt },
          voice: { languageCode: "en-US", name: line.voice, modelName: VOICE_MODEL },
          audioConfig: { audioEncoding: "MP3", speakingRate: line.rate }
        })
      });
    } catch (networkError) {
      if (attempt >= BACKOFFS_MS.length) throw networkError;
      await sleep(BACKOFFS_MS[attempt]);
      attempt += 1;
      continue;
    }
    if (response.ok) {
      const body = await response.json();
      if (!body.audioContent) throw new Error("Google Text-to-Speech returned no audioContent");
      return Buffer.from(body.audioContent, "base64");
    }
    if (response.status === 401 && !refreshedToken) { refreshedToken = true; getToken(true); continue; }
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= BACKOFFS_MS.length) throw new Error(`Google Text-to-Speech ${response.status}: ${(await response.text()).slice(0, 200)}`);
    await sleep(BACKOFFS_MS[attempt]);
    attempt += 1;
  }
}

async function runPool(items, worker, concurrency) {
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runner));
}

await mkdir(outDir, { recursive: true });
const manifestMap = await loadManifest();
const resultById = new Map();
const toGenerate = [];
let reusedCount = 0;
for (const line of lines) {
  const previous = manifestMap.get(line.id);
  const reusable = Boolean(previous) && previous.file === line.file && await fileHasContent(path.join(outDir, line.file));
  const selected = !only || only.has(line.stopId);
  if (selected && (force || !reusable)) toGenerate.push(line);
  else if (reusable) { resultById.set(line.id, { ...line, bytes: previous.bytes, sha256: previous.sha256 }); reusedCount += 1; }
}

const failures = [];
let generatedCount = 0;
await runPool(toGenerate, async line => {
  try {
    const audio = await synthesize(line);
    await writeFile(path.join(outDir, line.file), audio);
    resultById.set(line.id, { ...line, bytes: audio.length, sha256: sha256(audio) });
    generatedCount += 1;
  } catch (error) {
    failures.push({ id: line.id, error: error.message });
  }
}, CONCURRENCY);

const manifestLines = lines.filter(line => resultById.has(line.id)).map(({ id }) => {
  const r = resultById.get(id);
  return {
    id: r.id, stopId: r.stopId, kind: r.kind, character: r.character, voice: r.voice,
    rate: r.rate, prompt: r.prompt, text: r.text, textHash: r.textHash, file: r.file, bytes: r.bytes, sha256: r.sha256
  };
});
await writeFile(manifestPath, `${JSON.stringify({ model: VOICE_MODEL, generatedAt: new Date().toISOString(), lines: manifestLines }, null, 2)}\n`);

const byStop = new Map();
for (const entry of manifestLines) {
  const stopEntries = byStop.get(entry.stopId) || {};
  stopEntries[entry.kind] = `${webRoot}/${entry.file}`;
  byStop.set(entry.stopId, stopEntries);
}
const stopLines = TRAIL.filter(stop => byStop.has(stop.id)).map(stop => {
  const fields = Object.entries(byStop.get(stop.id)).map(([kind, webPath]) => `${kind}: ${JSON.stringify(webPath)}`).join(", ");
  return `  ${stop.id}: Object.freeze({ ${fields} }),`;
});
const linesModule = [
  "// GENERATED by tools/generateSoundSeekersV3Lines.mjs — do not edit; run the tool.",
  "export const LINE_AUDIO = Object.freeze({", ...stopLines, "});",
  `export const LINE_AUDIO_MODEL = ${JSON.stringify(VOICE_MODEL)};`, ""
].join("\n");
await writeFile(linesModulePath, linesModule);

const dirFiles = (await readdir(outDir).catch(() => [])).filter(name => name.endsWith(".mp3"));
const referenced = new Set(manifestLines.map(line => line.file));
const stale = dirFiles.filter(name => !referenced.has(name));
if (stale.length) console.log(`Stale MP3 files not referenced by the manifest (not deleted): ${stale.join(", ")}`);
if (wantSheet) await writeSheet(lines);

console.log(`Sound Seekers v3 lines: generated ${generatedCount}, skipped ${reusedCount}, failed ${failures.length}.`);
for (const failure of failures) console.log(`  FAILED ${failure.id}: ${failure.error}`);
console.log(`Manifest: ${manifestPath}`);
process.exitCode = failures.length ? 1 : 0;
