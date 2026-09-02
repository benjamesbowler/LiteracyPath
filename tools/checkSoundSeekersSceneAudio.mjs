#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CONNECTED_TEXT_RECORDS } from "../src/features/soundSeekers/content/connectedTextRecords.js";
import { MEANING_SUPPORT_RECORDS } from "../src/features/soundSeekers/content/meaningSupportRecords.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repositoryRoot, "public/audio/quest-v2/SOURCE.md");
const fixedRoots = [
  path.join(repositoryRoot, "public/audio/quest-v2/scenes"),
  path.join(repositoryRoot, "public/audio/quest-v2/meaning")
];
const recordFields = [
  "assetId", "kind", "ownerId", "text", "textSha256", "voice", "model", "locale",
  "generatorVersion", "generatedAt", "path", "byteLength", "durationSeconds", "codec",
  "sampleRateHz", "channels", "bitrateBps", "meanVolumeDb", "peakDb", "sha256",
  "humanListeningApproved", "humanListeningReview"
];

export function expectedSoundSeekersSceneAudio() {
  return [
    ...CONNECTED_TEXT_RECORDS.flatMap(scene => [
      { assetId: `${scene.id}:text`, kind: "scene_text", ownerId: scene.id, text: scene.text,
        path: `/audio/quest-v2/scenes/${scene.id}-text.mp3` },
      { assetId: `${scene.id}:prompt`, kind: "scene_prompt", ownerId: scene.id,
        text: scene.prompt.text, path: `/audio/quest-v2/scenes/${scene.id}-prompt.mp3` }
    ]),
    ...MEANING_SUPPORT_RECORDS.map(record => ({
      assetId: `meaning:${record.wordId}`,
      kind: "meaning_support",
      ownerId: record.wordId,
      text: `${record.childDefinition} ${record.ellSupport.oralBridge} ${record.actionPrompt}`,
      path: `/audio/quest-v2/meaning/${record.wordId}.mp3`
    }))
  ].sort((left, right) => left.assetId.localeCompare(right.assetId));
}

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${label}: ${result.stderr || result.stdout || "failed"}`);
  return result.stdout.trim();
}

export function probeSoundSeekersAudio(filePath) {
  const stream = JSON.parse(run("ffprobe", [
    "-v", "error", "-select_streams", "a:0",
    "-show_entries", "stream=codec_name,sample_rate,channels,bit_rate:format=duration",
    "-of", "json", filePath
  ], "ffprobe failed"));
  const audio = stream.streams?.[0];
  const durationSeconds = Number(stream.format?.duration);
  const volume = spawnSync("ffmpeg", [
    "-hide_banner", "-i", filePath, "-af", "volumedetect", "-f", "null", "-"
  ], { encoding: "utf8" });
  const output = `${volume.stdout}\n${volume.stderr}`;
  const meanVolumeDb = Number(/mean_volume:\s*(-?[\d.]+) dB/u.exec(output)?.[1]);
  const peakDb = Number(/max_volume:\s*(-?[\d.]+) dB/u.exec(output)?.[1]);
  const probe = {
    codec: audio?.codec_name,
    sampleRateHz: Number(audio?.sample_rate),
    channels: Number(audio?.channels),
    bitrateBps: Number(audio?.bit_rate),
    durationSeconds: Number(durationSeconds.toFixed(3)),
    meanVolumeDb: Number(meanVolumeDb.toFixed(2)),
    peakDb: Number(peakDb.toFixed(2))
  };
  if (volume.status !== 0 || !Number.isFinite(durationSeconds) || durationSeconds <= 0
    || durationSeconds > 90 || !Number.isFinite(meanVolumeDb) || meanVolumeDb <= -70
    || !Number.isFinite(peakDb) || probe.codec !== "mp3" || probe.sampleRateHz !== 44100
    || probe.channels !== 1 || probe.bitrateBps !== 128000) {
    throw new Error(`${filePath}: audio does not match the accepted technical profile`);
  }
  return probe;
}

function parseManifest() {
  const markdown = readFileSync(sourcePath, "utf8");
  const fences = [...markdown.matchAll(/```json\n([\s\S]+?)\n```/gu)];
  if (fences.length !== 1) throw new Error("SOURCE.md must contain exactly one JSON fence");
  const manifest = JSON.parse(fences[0][1]);
  if (!manifest || Object.getPrototypeOf(manifest) !== Object.prototype
    || Object.keys(manifest).join(",") !== "schemaVersion,assets"
    || manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) {
    throw new Error("SOURCE.md manifest shape is invalid");
  }
  return manifest;
}

function filesBelow(root) {
  const output = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const filePath = path.join(root, entry.name);
    const stat = lstatSync(filePath);
    if (stat.isSymbolicLink()) throw new Error(`${filePath}: symlinks are forbidden`);
    if (stat.isDirectory()) output.push(...filesBelow(filePath));
    else output.push(filePath);
  }
  return output;
}

export function assertSoundSeekersSceneAudio() {
  const expected = expectedSoundSeekersSceneAudio();
  const expectedById = new Map(expected.map(record => [record.assetId, record]));
  const manifest = parseManifest();
  if (manifest.assets.length !== expected.length
    || new Set(manifest.assets.map(record => record.assetId)).size !== expected.length
    || manifest.assets.some((record, index) => record.assetId !== expected[index].assetId)) {
    throw new Error("SOURCE.md assets must be exact, unique, and sorted by assetId");
  }
  const expectedPaths = new Set(expected.map(record => record.path));
  for (const asset of manifest.assets) {
    const want = expectedById.get(asset.assetId);
    if (!want || Object.keys(asset).join(",") !== recordFields.join(",")) {
      throw new Error(`${asset.assetId || "asset"}: manifest field shape is invalid`);
    }
    for (const field of ["kind", "ownerId", "text", "path"]) {
      if (asset[field] !== want[field]) throw new Error(`${asset.assetId}: ${field} drift`);
    }
    if (asset.voice !== "en-US-Chirp3-HD-Leda"
      || asset.model !== "Google Cloud Text-to-Speech Chirp3 HD"
      || asset.locale !== "en-US" || !/^\d+\.\d+\.\d+$/u.test(asset.generatorVersion)
      || !Number.isFinite(Date.parse(asset.generatedAt))) {
      throw new Error(`${asset.assetId}: generation provenance is invalid`);
    }
    const filePath = path.join(repositoryRoot, "public", asset.path.replace(/^\//u, ""));
    const stat = lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size !== asset.byteLength) {
      throw new Error(`${asset.assetId}: final file identity is invalid`);
    }
    const bytes = readFileSync(filePath);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const textSha256 = createHash("sha256").update(asset.text, "utf8").digest("hex");
    if (asset.sha256 !== sha256 || asset.textSha256 !== textSha256) {
      throw new Error(`${asset.assetId}: byte or source hash mismatch`);
    }
    const probe = probeSoundSeekersAudio(filePath);
    for (const field of [
      "codec", "sampleRateHz", "channels", "bitrateBps", "durationSeconds", "meanVolumeDb", "peakDb"
    ]) {
      if (typeof asset[field] !== typeof probe[field] || asset[field] !== probe[field]) {
        throw new Error(`${asset.assetId}: probed ${field} mismatch`);
      }
    }
    if (typeof asset.humanListeningApproved !== "boolean") {
      throw new Error(`${asset.assetId}: listening approval must be explicit`);
    }
    if (!asset.humanListeningApproved && asset.humanListeningReview !== null) {
      throw new Error(`${asset.assetId}: unapproved bytes cannot carry a review`);
    }
    if (asset.humanListeningApproved) {
      const review = asset.humanListeningReview;
      const keys = ["sha256", "textSha256", "reviewedAt", "reviewerRole", "environment", "decision", "evidenceRef"];
      if (!review || Object.keys(review).join(",") !== keys.join(",")
        || review.sha256 !== sha256 || review.textSha256 !== textSha256
        || !Number.isFinite(Date.parse(review.reviewedAt)) || review.decision !== "approved"
        || ![review.reviewerRole, review.environment, review.evidenceRef].every(value =>
          typeof value === "string" && value.trim().length > 0)) {
        throw new Error(`${asset.assetId}: listening review does not bind current bytes and text`);
      }
    }
  }
  const actualPaths = fixedRoots.flatMap(filesBelow).map(filePath =>
    `/${path.relative(path.join(repositoryRoot, "public"), filePath).split(path.sep).join("/")}`);
  if (actualPaths.some(filePath => !filePath.endsWith(".mp3"))
    || actualPaths.length !== expectedPaths.size
    || actualPaths.some(filePath => !expectedPaths.has(filePath))) {
    throw new Error("Sound Seekers scene audio roots contain missing, orphaned, or temporary files");
  }
  return Object.freeze({
    assetCount: expected.length,
    listeningApprovedCount: manifest.assets.filter(asset => asset.humanListeningApproved).length
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = assertSoundSeekersSceneAudio();
  console.log(`PASS mechanical Sound Seekers scene audio: ${result.assetCount} assets`);
  console.log(`Direct listening gate: ${result.listeningApprovedCount === result.assetCount
    ? "closed" : `open for ${result.assetCount - result.listeningApprovedCount} assets`}`);
}
