#!/usr/bin/env node

import { constants } from "node:fs";
import fs from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRESENT_VOCABULARY, PRESENT_CHILD_READING_SENTENCES } from "../src/data/presentVocabulary.js";
import { PRESENT_RETELL_STORY } from "../src/data/presentTeachingContent.js";
import { getLedaInstructionAudioPath } from "../src/data/ledaProductionAudio.js";
import { normalizeLedaAudioText } from "../src/data/normalizeLedaAudioText.js";
import { LEDA_PRODUCTION_VOICE } from "../src/data/ledaProductionVoice.js";
import {
  CYCLE_PRACTICE_INSTRUCTION_AUDIO,
  CYCLE_PRACTICE_WORD_AUDIO,
  CYCLE_PRACTICE_AUDIO_METADATA
} from "../src/data/generated/cyclePracticeInstructionAudio.generated.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactDirectory = path.join(root, ".artifacts/present-completion");
const worklistPath = path.join(artifactDirectory, "narration-worklist.json");
const statePath = path.join(artifactDirectory, "narration-generation-state.json");
const manifestPath = path.join(root, "src/data/generated/presentNarration.generated.js");
const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
export const PRESENT_NARRATION_MAX_ATTEMPT_CHARACTERS = 8333;
export const PRESENT_NARRATION_MAX_ATTEMPTS_PER_SCRIPT = 2;
const configuration = Object.freeze({
  voice: LEDA_PRODUCTION_VOICE,
  languageCode: "en-US",
  audioEncoding: "LINEAR16",
  sampleRateHertz: 24000,
  speakingRate: 0.94,
  pitch: 0
});
const sentenceAssetRoles = new Set(["instruction", "guided_page", "story_page", "assessment_passage", "assessment_prompt", "report", "supplemental"]);
const digest = value => createHash("sha256").update(value).digest("hex");
const exists = file => fs.stat(file).then(stat => stat.isFile()).catch(() => false);
const countCharacters = text => [...text].length;

export function presentNarrationId(text, role = "sentence") {
  return `present-${role}-${digest(`${role}|${text}`).slice(0, 20)}`;
}

export function collectPresentNarrationScripts({ vocabulary = PRESENT_VOCABULARY, childSentences = PRESENT_CHILD_READING_SENTENCES, retellStory = PRESENT_RETELL_STORY } = {}) {
  return [
    ...Object.entries(vocabulary).flatMap(([cycle, rows]) => rows.map(row => ({
      text: row.sentence, role: "sentence",
      source: `src/data/presentVocabulary.js:PRESENT_VOCABULARY:${cycle}:${row.word}`
    }))),
    ...childSentences.map(row => ({
      text: row.sentence, role: "sentence",
      source: `src/data/presentVocabulary.js:PRESENT_CHILD_READING_SENTENCES:${row.id}`
    })),
    ...retellStory.events.map(row => ({
      text: row.text, role: "sentence",
      source: `src/data/presentTeachingContent.js:PRESENT_RETELL_STORY:${retellStory.id}:${row.id}`
    }))
  ];
}

export function resolveSharedPresentNarration(text) {
  const normalized = normalizeLedaAudioText(text);
  const cyclePath = CYCLE_PRACTICE_INSTRUCTION_AUDIO[normalized] || CYCLE_PRACTICE_WORD_AUDIO[normalized];
  const cycleMetadata = CYCLE_PRACTICE_AUDIO_METADATA[normalized];
  if (cyclePath && cycleMetadata?.text === text && cycleMetadata.voice === LEDA_PRODUCTION_VOICE && sentenceAssetRoles.has(cycleMetadata.role)) {
    return { audio: cyclePath, sourceManifest: "src/data/generated/cyclePracticeInstructionAudio.generated.js", transcriptEvidence: "exact-text-metadata", productionRole: cycleMetadata.role };
  }
  const audio = getLedaInstructionAudioPath(text);
  const productionRole = audio?.split("/")[4];
  if (audio && sentenceAssetRoles.has(productionRole)) {
    return { audio, sourceManifest: "src/data/ledaProductionAudio.js", transcriptEvidence: "exact-normalized-text-production-registry", productionRole };
  }
  return null;
}

export function buildPresentNarrationWorklist(scripts = collectPresentNarrationScripts(), sharedResolver = resolveSharedPresentNarration) {
  const byIdentity = new Map();
  const normalizedTexts = new Map();
  for (const script of scripts) {
    if (script.role !== "sentence" || typeof script.text !== "string" || !script.text.trim() || script.text !== script.text.trim()) {
      throw new Error("Present narration only accepts current, nonempty exact sentence scripts.");
    }
    const normalized = normalizeLedaAudioText(script.text);
    if (normalizedTexts.has(normalized) && normalizedTexts.get(normalized) !== script.text) {
      throw new Error(`Two exact Present transcripts collide after normalization: ${normalized}`);
    }
    normalizedTexts.set(normalized, script.text);
    const identity = `${script.role}|${script.text}`;
    if (byIdentity.has(identity)) {
      byIdentity.get(identity).sources.push(script.source);
      continue;
    }
    const shared = sharedResolver(script.text);
    const id = presentNarrationId(script.text, script.role);
    const slug = script.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
    const audio = shared?.audio || `/audio/production/en-US/instruction/present-${slug}-${digest(JSON.stringify([configuration, script.role, script.text])).slice(0, 12)}.mp3`;
    byIdentity.set(identity, {
      id, text: script.text, role: script.role, normalized,
      characters: countCharacters(script.text), sources: [script.source],
      audio, reused: Boolean(shared),
      productionRole: shared?.productionRole || "instruction",
      sourceManifest: shared?.sourceManifest || "tools/generatePresentNarration.mjs",
      transcriptEvidence: shared?.transcriptEvidence || "exact-request-script"
    });
  }
  const rows = [...byIdentity.values()].map(row => ({ ...row, sources: [...new Set(row.sources)].sort() })).sort((a, b) => a.id.localeCompare(b.id));
  const approvedContent = { version: 1, configuration, rows };
  return {
    ...approvedContent, worklistHash: digest(JSON.stringify(approvedContent)),
    totalScripts: rows.length,
    reusedScripts: rows.filter(row => row.reused).length,
    ownedScripts: rows.filter(row => !row.reused).length,
    oneAttemptCharacters: rows.filter(row => !row.reused).reduce((sum, row) => sum + row.characters, 0),
    maximumAttemptsPerScript: PRESENT_NARRATION_MAX_ATTEMPTS_PER_SCRIPT,
    maximumPermittedAttemptCharacters: PRESENT_NARRATION_MAX_ATTEMPT_CHARACTERS
  };
}

export function validatePresentNarrationApproval(current, approved, hash, maxCharacters) {
  const calculated = buildPresentNarrationWorklist(current.rows.flatMap(row => row.sources.map(source => ({ text: row.text, role: row.role, source }))));
  if (!/^[a-f0-9]{64}$/.test(hash || "") || hash !== current.worklistHash || hash !== approved?.worklistHash || calculated.worklistHash !== hash) {
    throw new Error("Generation requires the explicit matching --approved-worklist-hash from the current saved dry run.");
  }
  const approvedContent = { version: approved.version, configuration: approved.configuration, rows: approved.rows };
  if (digest(JSON.stringify(approvedContent)) !== hash || JSON.stringify(approvedContent) !== JSON.stringify({ version: current.version, configuration: current.configuration, rows: current.rows })) {
    throw new Error("The approved script whitelist differs from the current Present source.");
  }
  if (!Number.isSafeInteger(maxCharacters) || maxCharacters <= 0 || maxCharacters > PRESENT_NARRATION_MAX_ATTEMPT_CHARACTERS) {
    throw new Error(`Explicit --max-total-attempt-characters must be between 1 and ${PRESENT_NARRATION_MAX_ATTEMPT_CHARACTERS}.`);
  }
  if (current.oneAttemptCharacters > maxCharacters) throw new Error("The approved character budget cannot cover one attempt for every owned script.");
}

export function chargePresentNarrationAttempt(state, row) {
  const approved = state.approvedRows.find(item => item.id === row.id);
  if (!approved || approved.text !== row.text || approved.role !== "sentence" || approved.characters !== countCharacters(row.text)) {
    throw new Error("Attempt refused: script is outside the exact approved sentence whitelist.");
  }
  const attempts = state.attempts.filter(attempt => attempt.id === row.id);
  if (attempts.length >= PRESENT_NARRATION_MAX_ATTEMPTS_PER_SCRIPT) throw new Error(`Attempt limit reached for ${row.id}.`);
  if (state.submittedCharacters + approved.characters > state.maxTotalAttemptCharacters) throw new Error("Attempt refused before submission: the approved total character budget is exhausted.");
  state.submittedCharacters += approved.characters;
  const attempt = { id: row.id, number: attempts.length + 1, characters: approved.characters, status: "submitting" };
  state.attempts.push(attempt);
  return attempt;
}

export function validatePresentNarrationState(state, worklist, maxCharacters) {
  const approvedRows = worklist.rows.filter(row => !row.reused).map(({ id, text, role, characters }) => ({ id, text, role, characters }));
  if (state.version !== 1 || state.worklistHash !== worklist.worklistHash || state.maxTotalAttemptCharacters !== maxCharacters || JSON.stringify(state.approvedRows) !== JSON.stringify(approvedRows)) {
    throw new Error("Resume journal approval, whitelist or character ceiling differs.");
  }
  if (!Array.isArray(state.attempts) || !state.completed || typeof state.completed !== "object") throw new Error("Generation journal structure is invalid.");
  const counts = new Map();
  let total = 0;
  for (const attempt of state.attempts) {
    const row = approvedRows.find(item => item.id === attempt.id);
    const expectedNumber = (counts.get(attempt.id) || 0) + 1;
    if (!row || attempt.characters !== row.characters || attempt.number !== expectedNumber || expectedNumber > PRESENT_NARRATION_MAX_ATTEMPTS_PER_SCRIPT || !["submitting", "unknown-outcome", "http-failed", "response-received", "installed"].includes(attempt.status)) {
      throw new Error("Generation journal has an unapproved, reordered or excessive attempt.");
    }
    counts.set(attempt.id, expectedNumber);
    total += row.characters;
  }
  if (!Number.isSafeInteger(state.submittedCharacters) || total !== state.submittedCharacters || total > maxCharacters) throw new Error("Generation journal character accounting is inconsistent.");
  for (const [key, entry] of Object.entries(state.completed)) {
    const row = worklist.rows.find(item => item.normalized === key && !item.reused);
    if (!row || entry.id !== row.id || entry.text !== row.text || entry.role !== row.role || entry.audio !== row.audio || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error("Generation journal contains stale or unapproved completed audio.");
    }
  }
}

export function validatePresentNarrationResume(state, worklist, maxCharacters) {
  validatePresentNarrationState(state, worklist, maxCharacters);
  const uncertain = state.attempts.filter(attempt => ["submitting", "unknown-outcome"].includes(attempt.status));
  if (uncertain.length) throw new Error(`Journal contains ${uncertain.length} unresolved response(s); restore the concrete received audio or reconcile the provider outcome before another submission.`);
}

export function analysePresentNarrationPcm(pcm, text, sampleRate = 24000) {
  if (!pcm.length || pcm.length % 4) throw new Error("Decoded narration has incomplete float samples.");
  const samples = pcm.length / 4;
  const frameSize = Math.round(sampleRate / 100);
  let peak = 0, sumSquares = 0, clippedSamples = 0, invalidSamples = 0;
  const activeFrames = [];
  for (let offset = 0; offset < samples; offset += frameSize) {
    let frameSquares = 0;
    const end = Math.min(samples, offset + frameSize);
    for (let index = offset; index < end; index += 1) {
      const value = pcm.readFloatLE(index * 4);
      if (!Number.isFinite(value)) { invalidSamples += 1; continue; }
      peak = Math.max(peak, Math.abs(value));
      if (Math.abs(value) >= 0.999) clippedSamples += 1;
      sumSquares += value * value;
      frameSquares += value * value;
    }
    activeFrames.push(frameSquares / (end - offset) > 0.00001);
  }
  const firstActive = activeFrames.indexOf(true);
  const lastActive = activeFrames.lastIndexOf(true);
  let quietRun = 0, longestInternalQuiet = 0;
  for (let index = firstActive; index <= lastActive; index += 1) {
    quietRun = activeFrames[index] ? 0 : quietRun + 1;
    longestInternalQuiet = Math.max(longestInternalQuiet, quietRun);
  }
  const durationSeconds = samples / sampleRate;
  const peakDb = peak ? 20 * Math.log10(peak) : null;
  const activeSpeechMilliseconds = activeFrames.filter(Boolean).length * 10;
  const trailingQuietMilliseconds = Math.max(0, durationSeconds * 1000 - (lastActive + 1) * 10);
  const words = text.trim().split(/\s+/).length;
  const problems = [];
  if (invalidSamples || clippedSamples) problems.push("invalid-or-clipped-samples");
  if (durationSeconds < Math.max(0.12, words / 10) || activeSpeechMilliseconds < Math.max(50, words * 40) || peakDb === null || peakDb <= -40) problems.push("missing-or-insufficient-spoken-signal");
  const endingScreen = trailingQuietMilliseconds < 20 ? "short-tail-listening-check" : "no-short-tail-flag";
  return {
    durationSeconds, peakDb, wholeFileRmsDb: sumSquares ? 10 * Math.log10(sumSquares / samples) : null,
    activeSpeechMilliseconds, leadingQuietMilliseconds: Math.max(0, firstActive * 10),
    trailingQuietMilliseconds, longestInternalQuietMilliseconds: longestInternalQuiet * 10,
    clippedSamples, invalidSamples, endingScreen, problems,
    measurement: "Full mono 24 kHz float decode; 10 ms RMS windows throughout the clip.",
    limitation: "Signal and ending screens do not prove transcript accuracy, pronunciation or human listening."
  };
}

export async function inspectPresentNarrationAudio(file, text) {
  const bytes = await fs.readFile(file);
  const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels:format=duration", "-of", "json", file], { encoding: "utf8" });
  if (probe.status !== 0) throw new Error(`Undecodable recording: ${path.basename(file)}`);
  const info = JSON.parse(probe.stdout);
  const decoded = spawnSync("ffmpeg", ["-v", "error", "-xerror", "-i", file, "-f", "f32le", "-ac", "1", "-ar", "24000", "pipe:1"], { maxBuffer: 32 * 1024 * 1024 });
  if (decoded.status !== 0) throw new Error(`Full recording decode failed: ${path.basename(file)}`);
  const signal = analysePresentNarrationPcm(decoded.stdout, text);
  const stream = info.streams?.[0];
  if (!stream || !Number.isFinite(Number(info.format?.duration)) || Math.abs(Number(info.format.duration) - signal.durationSeconds) > 0.10) {
    throw new Error(`Container and decoded duration disagree: ${path.basename(file)}`);
  }
  if (signal.problems.length) throw new Error(`Recording integrity failed (${signal.problems.join(", ")}): ${path.basename(file)}`);
  return { sha256: digest(bytes), durationSeconds: signal.durationSeconds, codec: stream.codec_name, sampleRate: Number(stream.sample_rate), channels: stream.channels, signal };
}

async function readPreviousManifest() {
  const imported = await import(`${new URL("../src/data/generated/presentNarration.generated.js", import.meta.url).href}?present-narration=${Date.now()}`);
  return { audio: imported.PRESENT_NARRATION_AUDIO, metadata: imported.PRESENT_NARRATION_METADATA, worklistHash: imported.PRESENT_NARRATION_WORKLIST_HASH };
}

function absoluteAudioPath(row) {
  if (!/^\/audio\/production\/en-US\/(instruction|guided_page|story_page|assessment_passage|assessment_prompt|report|supplemental)\/[a-z0-9-]+\.mp3$/.test(row.audio)) throw new Error(`Unsafe or non-sentence recording path for ${row.id}.`);
  return path.join(root, "public", row.audio.slice(1));
}

function metadataFor(row, inspection) {
  return {
    id: row.id, text: row.text, transcript: row.text, role: row.role,
    productionRole: row.productionRole, audio: row.audio,
    voice: LEDA_PRODUCTION_VOICE, provider: "Google Cloud Text-to-Speech", aiGenerated: true,
    reused: row.reused, sourceManifest: row.sourceManifest, sourceReferences: row.sources,
    transcriptEvidence: row.transcriptEvidence,
    provenance: row.reused ? "Existing canonical production recording; exact text registry and actual bytes verified." : "Repository-authored exact script; canonical Google Cloud TTS production pipeline.",
    rightsSource: row.reused ? "Inherited from the referenced production catalogue; no external recording copied or transformed." : "Original repository script and synthesized production recording; no external recording copied or transformed.",
    ...inspection, humanListening: "unknown"
  };
}

function manifestSource(worklist, metadata) {
  const sorted = Object.fromEntries(Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b)));
  const audio = Object.fromEntries(Object.entries(sorted).map(([key, entry]) => [key, entry.audio]));
  return [
    "// AUTO-GENERATED by tools/generatePresentNarration.mjs. Do not edit.",
    `export const PRESENT_NARRATION_VOICE = ${JSON.stringify(LEDA_PRODUCTION_VOICE)};`,
    `export const PRESENT_NARRATION_WORKLIST_HASH = ${JSON.stringify(worklist.worklistHash)};`,
    `export const PRESENT_NARRATION_AUDIO = Object.freeze(${JSON.stringify(audio, null, 2)});`,
    `export const PRESENT_NARRATION_METADATA = Object.freeze(${JSON.stringify(sorted, null, 2)});`,
    ""
  ].join("\n");
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  // The journal is replaced atomically before requests, so interruptions retain
  // the charge and cannot silently re-submit an uncertain paid attempt.
  const temporary = `${file}.tmp-${process.pid}`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
    await fs.rename(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}

async function inspectInstalledRows(worklist, previous, { requireEveryRow = false } = {}) {
  const metadata = {};
  const errors = [];
  const missing = [];
  for (const row of worklist.rows) {
    const file = absoluteAudioPath(row);
    if (!await exists(file)) {
      missing.push(row.id);
      if (requireEveryRow || row.reused) errors.push(`Missing exact recording: ${row.id} (${row.text})`);
      continue;
    }
    try {
      const known = previous.metadata?.[row.normalized];
      if (!row.reused && (!known || known.text !== row.text || known.role !== row.role || known.audio !== row.audio)) {
        throw new Error(`Unregistered owned recording exists; refuse adoption or overwrite: ${row.id}`);
      }
      const inspection = await inspectPresentNarrationAudio(file, row.text);
      if (known && (known.audio !== row.audio || known.text !== row.text || known.sha256 !== inspection.sha256)) {
        throw new Error(`Transcript or byte provenance changed: ${row.id}`);
      }
      metadata[row.normalized] = metadataFor(row, inspection);
    } catch (error) { errors.push(error.message); }
  }
  return { metadata, errors, missing };
}

export async function installPresentNarrationWithoutOverwrite(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination, constants.COPYFILE_EXCL);
}

function normalizeGeneratedAudio(wav, mp3) {
  const probed = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wav], { encoding: "utf8" });
  const duration = Number(probed.stdout?.trim());
  if (probed.status !== 0 || !Number.isFinite(duration) || duration <= 0) throw new Error("Generated narration has no decodable duration.");
  const converted = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-xerror", "-i", wav,
    "-af", `highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,afade=t=out:st=${Math.max(0, duration - 0.025)}:d=0.025,apad=pad_dur=0.10`,
    "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", mp3
  ], { encoding: "utf8" });
  if (converted.status !== 0) throw new Error("Present narration normalization failed.");
}

async function finishReceivedAudio(row, attempt, state, temporaryDirectory) {
  const expectedResponse = path.join(artifactDirectory, "received", `${row.id}-${attempt.number}.wav`);
  if (attempt.responseFile !== path.relative(root, expectedResponse) || !/^[a-f0-9]{64}$/.test(attempt.responseSha256 || "")) throw new Error("Received audio recovery reference is invalid.");
  const bytes = await fs.readFile(expectedResponse);
  if (digest(bytes) !== attempt.responseSha256) throw new Error(`Received audio provenance changed for ${row.id}.`);
  const wav = path.join(temporaryDirectory, `${row.id}.wav`);
  const mp3 = path.join(temporaryDirectory, `${row.id}.mp3`);
  await fs.writeFile(wav, bytes, { flag: "wx" });
  normalizeGeneratedAudio(wav, mp3);
  const inspection = await inspectPresentNarrationAudio(mp3, row.text);
  if (state.completed[row.normalized] && state.completed[row.normalized].sha256 !== inspection.sha256) throw new Error(`Recovered normalized bytes differ for ${row.id}.`);
  const entry = metadataFor(row, inspection);
  state.completed[row.normalized] = entry;
  await writeJson(statePath, state);
  await installPresentNarrationWithoutOverwrite(mp3, absoluteAudioPath(row));
  attempt.status = "installed";
  await writeJson(statePath, state);
  // The installed bytes and journal now preserve the paid response. The
  // intermediate lossless response is disposable after this verified transfer.
  await fs.rm(expectedResponse);
  attempt.responseRemovedAfterVerifiedInstall = true;
  await writeJson(statePath, state);
  return entry;
}

export async function requestPresentNarrationAudio(row, token, state, { fetcher = fetch, persist = current => writeJson(statePath, current) } = {}) {
    const attempt = chargePresentNarrationAttempt(state, row);
    await persist(state);
    let response;
    try {
      response = await fetcher(endpoint, {
        method: "POST", signal: AbortSignal.timeout(45000),
        headers: {
          Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8",
          "x-goog-user-project": process.env.GOOGLE_CLOUD_PROJECT || "project-3c66c1c8-cc9e-4d6d-bdf"
        },
        body: JSON.stringify({ input: { text: row.text }, voice: { languageCode: configuration.languageCode, name: configuration.voice }, audioConfig: { audioEncoding: configuration.audioEncoding, sampleRateHertz: configuration.sampleRateHertz, speakingRate: configuration.speakingRate, pitch: configuration.pitch } })
      });
    } catch {
      attempt.status = "unknown-outcome";
      await persist(state);
      throw new Error(`Synthesis outcome is uncertain for ${row.id}; no automatic resubmission is allowed.`);
    }
    if (!response.ok) {
      attempt.status = "http-failed";
      attempt.httpStatus = response.status;
      await persist(state);
      // Never expose response bodies, request headers or captured credentials.
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt.number >= PRESENT_NARRATION_MAX_ATTEMPTS_PER_SCRIPT) {
        throw new Error(`Present synthesis failed (HTTP ${response.status}).`);
      }
      return { retryable: true, httpStatus: response.status };
    }
    let result;
    try { result = await response.json(); } catch {
      attempt.status = "unknown-outcome";
      await persist(state);
      throw new Error(`Synthesis response could not be recovered for ${row.id}; no automatic resubmission is allowed.`);
    }
    if (typeof result.audioContent !== "string" || !result.audioContent.length) {
      attempt.status = "unknown-outcome";
      await persist(state);
      throw new Error(`Synthesis returned no recoverable audio for ${row.id}; no automatic resubmission is allowed.`);
    }
    return { bytes: Buffer.from(result.audioContent, "base64"), attempt };
}

async function synthesize(row, token, state, temporaryDirectory) {
  const received = state.attempts.findLast(attempt => attempt.id === row.id && attempt.status === "response-received");
  if (received) return finishReceivedAudio(row, received, state, temporaryDirectory);
  while (state.attempts.filter(attempt => attempt.id === row.id).length < PRESENT_NARRATION_MAX_ATTEMPTS_PER_SCRIPT) {
    const result = await requestPresentNarrationAudio(row, token, state);
    if (result.retryable) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      continue;
    }
    const { bytes, attempt } = result;
    const responseFile = path.join(artifactDirectory, "received", `${row.id}-${attempt.number}.wav`);
    await fs.mkdir(path.dirname(responseFile), { recursive: true });
    await fs.writeFile(responseFile, bytes, { flag: "wx" });
    attempt.responseFile = path.relative(root, responseFile);
    attempt.responseSha256 = digest(bytes);
    attempt.status = "response-received";
    await writeJson(statePath, state);
    return finishReceivedAudio(row, attempt, state, temporaryDirectory);
  }
  throw new Error(`Attempt limit reached for ${row.id}.`);
}

function argumentValue(args, key) {
  const index = args.indexOf(key);
  if (index < 0) return undefined;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Missing value for ${key}.`);
  return args[index + 1];
}

export async function withPresentNarrationGenerationLock(operation, directory = artifactDirectory) {
  await fs.mkdir(directory, { recursive: true });
  const lockPath = path.join(directory, "narration-generation.lock");
  let lock;
  try { lock = await fs.open(lockPath, "wx"); } catch (error) {
    if (error.code === "EEXIST") throw new Error("A Present narration generation lock exists. Reconcile its process and journal before submitting another paid request.", { cause: error });
    throw error;
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }) + "\n");
    return await operation();
  } finally {
    await lock.close();
    await fs.rm(lockPath);
  }
}

async function runMode(args) {
  const modes = ["--dry-run", "--refresh-reuse", "--generate", "--verify"].filter(mode => args.includes(mode));
  if (modes.length !== 1) throw new Error("Choose exactly one mode: --dry-run, --refresh-reuse, --generate or --verify.");
  const worklist = buildPresentNarrationWorklist();
  if (modes[0] === "--dry-run") {
    const rows = await Promise.all(worklist.rows.map(async row => ({ ...row, installed: await exists(absoluteAudioPath(row)) })));
    await writeJson(worklistPath, { ...worklist, rows: worklist.rows, availability: rows.map(row => ({ id: row.id, installed: row.installed })) });
    console.log(`Present narration: ${worklist.totalScripts} exact sentence scripts; ${worklist.reusedScripts} shared; ${worklist.ownedScripts} owned.`);
    for (const row of rows) console.log(`${row.reused ? "reuse" : row.installed ? "installed" : "generate"}: ${row.id} | ${row.characters} characters | ${row.text}`);
    console.log(`One attempt: ${worklist.oneAttemptCharacters} submitted characters; two attempts maximum: ${worklist.oneAttemptCharacters * PRESENT_NARRATION_MAX_ATTEMPTS_PER_SCRIPT}. Hard ceiling: ${PRESENT_NARRATION_MAX_ATTEMPT_CHARACTERS}.`);
    console.log(`Worklist SHA-256: ${worklist.worklistHash}`);
    console.log(`Saved ${path.relative(root, worklistPath)}. No credentials loaded or external requests made.`);
    return;
  }
  const previous = await readPreviousManifest();
  if (modes[0] === "--refresh-reuse" || modes[0] === "--verify") {
    const result = await inspectInstalledRows(worklist, previous, { requireEveryRow: modes[0] === "--verify" });
    const source = manifestSource(worklist, result.metadata);
    if (modes[0] === "--verify" && await fs.readFile(manifestPath, "utf8") !== source) result.errors.push("Present narration manifest is stale or contains missing/stale transcripts.");
    await writeJson(path.join(artifactDirectory, "narration-integrity.json"), {
      worklistHash: worklist.worklistHash, totalScripts: worklist.totalScripts,
      installedScripts: Object.keys(result.metadata).length, missing: result.missing, errors: result.errors,
      results: result.metadata, humanListening: "unknown",
      limitation: "Exact source/request parity, full decode and signal checks; no listening or independent transcription claim. Short-tail screens are advisory and require listening."
    });
    if (result.errors.length) throw new Error(result.errors.join("\n"));
    if (modes[0] === "--refresh-reuse") await fs.writeFile(manifestPath, source);
    console.log(`${Object.keys(result.metadata).length}/${worklist.totalScripts} narration scripts passed actual-byte, full-decode and signal checks; ${result.missing.length} missing. Human listening: unknown.`);
    return;
  }
  const approved = JSON.parse(await fs.readFile(worklistPath, "utf8"));
  const maxCharacters = Number(argumentValue(args, "--max-total-attempt-characters"));
  validatePresentNarrationApproval(worklist, approved, argumentValue(args, "--approved-worklist-hash"), maxCharacters);
  let state;
  if (await exists(statePath)) {
    const bytes = await fs.readFile(statePath, "utf8");
    state = JSON.parse(bytes);
    if (argumentValue(args, "--resume-state-hash") !== digest(bytes)) {
      throw new Error(`A generation journal exists. Explicit resume requires --resume-state-hash ${digest(bytes)} with the same approved worklist and budget.`);
    }
    validatePresentNarrationResume(state, worklist, maxCharacters);
  } else {
    if (args.includes("--resume-state-hash")) throw new Error("There is no concrete generation journal to resume.");
    state = { version: 1, worklistHash: worklist.worklistHash, maxTotalAttemptCharacters: maxCharacters, submittedCharacters: 0, approvedRows: worklist.rows.filter(row => !row.reused).map(({ id, text, role, characters }) => ({ id, text, role, characters })), attempts: [], completed: {} };
  }
  const recoveredPrevious = { ...previous, metadata: { ...previous.metadata, ...state.completed } };
  const existing = await inspectInstalledRows(worklist, recoveredPrevious);
  if (existing.errors.length) throw new Error(existing.errors.join("\n"));
  const remaining = worklist.rows.filter(row => !row.reused && !existing.metadata[row.normalized]);
  const recoveredRows = remaining.filter(row => state.attempts.some(attempt => attempt.id === row.id && attempt.status === "response-received"));
  if (remaining.some(row => state.completed[row.normalized] && !recoveredRows.includes(row))) throw new Error("A completed paid response has lost its installed asset; recover that asset instead of synthesizing again.");
  const rowsToSubmit = remaining.filter(row => !recoveredRows.includes(row));
  if (rowsToSubmit.some(row => state.attempts.filter(attempt => attempt.id === row.id).length >= PRESENT_NARRATION_MAX_ATTEMPTS_PER_SCRIPT)) throw new Error("A script has exhausted its two paid attempts; no automatic restart is allowed.");
  for (const row of worklist.rows.filter(item => existing.metadata[item.normalized])) {
    const received = state.attempts.findLast(attempt => attempt.id === row.id && attempt.status === "response-received");
    if (received && state.completed[row.normalized]?.sha256 === existing.metadata[row.normalized].sha256) {
      received.status = "installed";
      await writeJson(statePath, state);
      const responseFile = path.join(artifactDirectory, "received", `${row.id}-${received.number}.wav`);
      await fs.rm(responseFile, { force: true });
      received.responseRemovedAfterVerifiedInstall = true;
    }
  }
  const minimumRemainingCharacters = rowsToSubmit.reduce((total, row) => total + row.characters, 0);
  if (state.submittedCharacters + minimumRemainingCharacters > maxCharacters) throw new Error("The remaining approved budget cannot cover every outstanding script.");
  await writeJson(statePath, state);
  let token = "";
  if (rowsToSubmit.length) {
    try { token = execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); } catch { throw new Error("Google production credentials could not be obtained; no synthesis was submitted."); }
    if (!token) throw new Error("Google production credentials were empty; no synthesis was submitted.");
  }
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "present-narration-"));
  const metadata = { ...existing.metadata };
  try {
    for (const row of remaining) {
      metadata[row.normalized] = await synthesize(row, token, state, temporaryDirectory);
      await fs.writeFile(manifestPath, manifestSource(worklist, metadata));
      console.log(`Installed ${row.id}; ${state.submittedCharacters}/${maxCharacters} submitted characters.`);
    }
    await fs.writeFile(manifestPath, manifestSource(worklist, metadata));
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
  console.log(`Installed ${Object.keys(metadata).length}/${worklist.totalScripts} exact narration scripts. Run --verify. Human listening: unknown.`);
}

export async function main(args = process.argv.slice(2)) {
  return args.includes("--generate")
    ? withPresentNarrationGenerationLock(() => runMode(args))
    : runMode(args);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
