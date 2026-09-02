#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  unlink,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertSoundSeekersSceneAudio,
  expectedSoundSeekersSceneAudio,
  probeSoundSeekersAudio
} from "./checkSoundSeekersSceneAudio.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repositoryRoot, "public/audio/quest-v2/SOURCE.md");
const voice = "en-US-Chirp3-HD-Leda";
const model = "Google Cloud Text-to-Speech Chirp3 HD";
const locale = "en-US";
const generatorVersion = "1.0.0";
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
const projectId = process.env.GOOGLE_CLOUD_PROJECT || "project-3c66c1c8-cc9e-4d6d-bdf";
const args = process.argv.slice(2);
const generate = args.includes("--generate");
const replace = args.includes("--replace");
const all = args.includes("--all");
const assetFlag = args.indexOf("--asset");
const assetId = assetFlag >= 0 ? args[assetFlag + 1] : null;
const consumed = new Set(["--generate", "--replace", "--all"]);
if (assetFlag >= 0) {
  consumed.add("--asset");
  consumed.add(assetId);
}
if (args.some(argument => !consumed.has(argument))
  || args.filter(argument => argument === "--generate").length > 1
  || args.filter(argument => argument === "--replace").length > 1
  || args.filter(argument => argument === "--all").length > 1
  || args.filter(argument => argument === "--asset").length > 1
  || (generate && all === Boolean(assetId))
  || (!generate && (all || assetId || replace))
  || (assetFlag >= 0 && (!assetId || assetId.startsWith("--")))) {
  throw new Error("Usage: generateSoundSeekersSceneAudio.mjs [--generate (--all | --asset ID) [--replace]]");
}

const expected = expectedSoundSeekersSceneAudio();
const expectedById = new Map(expected.map(record => [record.assetId, record]));
if (assetId && !expectedById.has(assetId)) throw new Error(`Unknown Sound Seekers audio asset: ${assetId}`);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function existingManifest() {
  return readFile(sourcePath, "utf8").then(markdown => {
    const match = /```json\n([\s\S]+?)\n```/u.exec(markdown);
    const manifest = match ? JSON.parse(match[1]) : null;
    return new Map((manifest?.assets || []).map(record => [record.assetId, record]));
  }).catch(() => new Map());
}

function run(command, commandArgs, label) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${label}: ${result.stderr || result.stdout || "failed"}`);
}

function normalize(source, output) {
  run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", source,
    "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", output
  ], "Sound Seekers audio normalization failed");
}

function accessToken() {
  return execFileSync("gcloud", ["auth", "application-default", "print-access-token"], {
    encoding: "utf8", timeout: 30000
  }).trim();
}

async function synthesize(token, text) {
  const response = await fetch(endpoint, {
    method: "POST",
    signal: AbortSignal.timeout(60000),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: locale, name: voice },
      audioConfig: { audioEncoding: "MP3", speakingRate: 0.94, pitch: 0 }
    })
  });
  if (!response.ok) {
    throw new Error(`Google Text-to-Speech returned ${response.status}`);
  }
  const body = await response.json();
  if (typeof body.audioContent !== "string" || !body.audioContent) {
    throw new Error("Google Text-to-Speech returned no audio bytes");
  }
  return Buffer.from(body.audioContent, "base64");
}

async function assertSafeDestination(filePath) {
  const relative = path.relative(repositoryRoot, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)
    || !relative.startsWith("public/audio/quest-v2/scenes/")
      && !relative.startsWith("public/audio/quest-v2/meaning/")) {
    throw new Error("Sound Seekers audio output escaped its fixed roots");
  }
  const parent = path.dirname(filePath);
  await mkdir(parent, { recursive: true });
  if ((await lstat(parent)).isSymbolicLink()) throw new Error("Sound Seekers audio root may not be a symlink");
  const destination = await lstat(filePath).catch(() => null);
  if (destination?.isSymbolicLink()) throw new Error("Sound Seekers audio destination may not be a symlink");
}

async function writeSource(records) {
  const manifest = { schemaVersion: 1, assets: records.sort((left, right) => left.assetId.localeCompare(right.assetId)) };
  const markdown = `# Sound Seekers connected-text audio provenance

These are production-path Leda assets. Mechanical checks validate the exact bytes and source text. Direct human listening remains a separate release gate.

\`\`\`json
${JSON.stringify(manifest, null, 2)}
\`\`\`
`;
  const temporary = `${sourcePath}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, markdown, { flag: "wx" });
    await rename(temporary, sourcePath);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

if (!generate) {
  assertSoundSeekersSceneAudio();
  console.log("Sound Seekers scene audio check passed; direct listening status is reported by the checker.");
} else {
  const selected = all ? expected : [expectedById.get(assetId)];
  const previous = await existingManifest();
  const records = new Map(previous);
  const jobs = [];
  for (const asset of selected) {
    const filePath = path.join(repositoryRoot, "public", asset.path.replace(/^\//u, ""));
    await assertSafeDestination(filePath);
    const fileStat = await stat(filePath).catch(() => null);
    const old = previous.get(asset.assetId);
    if (fileStat?.isFile() && old) {
      const bytes = await readFile(filePath);
      const exact = old.path === asset.path && old.text === asset.text
        && old.textSha256 === sha256(Buffer.from(asset.text, "utf8"))
        && old.sha256 === sha256(bytes) && old.byteLength === bytes.length;
      if (exact) {
        probeSoundSeekersAudio(filePath);
        continue;
      }
    }
    if (fileStat && !replace) {
      throw new Error(`${asset.assetId}: replacing existing bytes requires --replace`);
    }
    jobs.push(asset);
  }
  const token = jobs.length ? accessToken() : null;
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "sound-seekers-scene-audio-"));
  try {
    for (const asset of jobs) {
      const source = path.join(temporaryRoot, `${asset.assetId.replaceAll(":", "-")}.source.mp3`);
      const normalized = path.join(temporaryRoot, `${asset.assetId.replaceAll(":", "-")}.mp3`);
      await writeFile(source, await synthesize(token, asset.text), { flag: "wx" });
      normalize(source, normalized);
      const probe = probeSoundSeekersAudio(normalized);
      const bytes = await readFile(normalized);
      const filePath = path.join(repositoryRoot, "public", asset.path.replace(/^\//u, ""));
      await assertSafeDestination(filePath);
      await rename(normalized, filePath);
      records.set(asset.assetId, {
        assetId: asset.assetId,
        kind: asset.kind,
        ownerId: asset.ownerId,
        text: asset.text,
        textSha256: sha256(Buffer.from(asset.text, "utf8")),
        voice,
        model,
        locale,
        generatorVersion,
        generatedAt: new Date().toISOString(),
        path: asset.path,
        byteLength: bytes.length,
        durationSeconds: probe.durationSeconds,
        codec: probe.codec,
        sampleRateHz: probe.sampleRateHz,
        channels: probe.channels,
        bitrateBps: probe.bitrateBps,
        meanVolumeDb: probe.meanVolumeDb,
        peakDb: probe.peakDb,
        sha256: sha256(bytes),
        humanListeningApproved: false,
        humanListeningReview: null
      });
      console.log(`generated ${asset.assetId}`);
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
  if (records.size !== expected.length || [...records].some(([id]) => !expectedById.has(id))) {
    throw new Error("Generate --all before committing the complete Sound Seekers audio manifest");
  }
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeSource([...records.values()]);
  assertSoundSeekersSceneAudio();
  console.log(`Sound Seekers scene audio current: ${expected.length} assets; direct listening remains open.`);
}
