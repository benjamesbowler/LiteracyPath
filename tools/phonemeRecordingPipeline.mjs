import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PHONEME_RECORDING_TARGETS } from "../src/data/phonemeRecordingSpec.js";
import { NEEDS_AUDIO } from "../src/data/questSequence.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutput = path.join(root, ".artifacts", "phoneme-recording");
const audioExtensions = [".wav", ".flac", ".m4a", ".mp3"];

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseArgs(argv) {
  const [command = "prepare", ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    options[token.slice(2)] = rest[index + 1];
    index += 1;
  }
  return { command, options };
}

function selectedTargets(scope = "all") {
  if (scope === "all") return PHONEME_RECORDING_TARGETS;
  if (scope !== "missing-human") {
    throw new Error(`Unknown recording scope: ${scope}. Use all or missing-human.`);
  }
  const requested = new Set(NEEDS_AUDIO);
  const selected = PHONEME_RECORDING_TARGETS.filter(item => requested.has(item.key));
  const missingSpecs = NEEDS_AUDIO.filter(key => !selected.some(item => item.key === key));
  if (missingSpecs.length) throw new Error(`Missing recording specifications for: ${missingSpecs.join(", ")}`);
  return selected;
}

function allTakes(targets) {
  return targets.flatMap(item => item.takeIds.map((takeId, takeIndex) => ({
    ...item,
    takeId,
    variant: item.takeIds.length > 1 ? takeIndex + 1 : ""
  })));
}

function prepare(outputDirectory, targets) {
  mkdirSync(outputDirectory, { recursive: true });
  const rows = [["take_id", "curriculum_key", "kind", "ipa", "anchor_for_performer_only", "direction", "review_status", "review_notes"]];
  for (const item of allTakes(targets)) {
    rows.push([item.takeId, item.key, item.kind, item.ipa, item.anchor, item.direction, "pending", ""]);
  }
  writeFileSync(path.join(outputDirectory, "recording-session.csv"), `${rows.map(row => row.map(csvCell).join(",")).join("\n")}\n`);

  const rights = {
    performer: "",
    recordingOwner: "",
    recordedAt: "",
    commercialUseGranted: false,
    performerConsentConfirmed: false,
    syntheticVoiceUsed: false,
    thirdPartyAudioUsed: false,
    notes: "Complete this before technical review. Keep the signed performer release outside the public app repository."
  };
  writeFileSync(path.join(outputDirectory, "rights.json"), `${JSON.stringify(rights, null, 2)}\n`);
  writeFileSync(path.join(outputDirectory, "README.md"), `# LiteracyPath phoneme recording session

Record each take as its own file named by the \`take_id\` in \`recording-session.csv\`.

- Record the isolated sound only. The anchor word is pronunciation guidance and must not be spoken.
- Use one adult phonics specialist, one quiet room and one microphone position for the whole set.
- Stop consonants are brief; continuous consonants may be held naturally. Never add a trailing “uh”.
- Record lossless WAV or FLAC where possible. Leave processing, denoising and loudness matching until after recording.
- Use an original performance. Do not copy, trim, transform or imitate any third-party recording.
- Complete \`rights.json\`; retain the signed performer release privately.
- Place source files in an \`incoming\` directory, then run the check command.

No file produced by this preparation command is runtime-approved audio.
`);
  console.log(`Prepared ${allTakes(targets).length} takes for ${targets.length} curriculum cues in ${outputDirectory}`);
}

function resolveTakeFile(inputDirectory, takeId) {
  for (const extension of audioExtensions) {
    const candidate = path.join(inputDirectory, `${takeId}${extension}`);
    if (existsSync(candidate)) return candidate;
  }
  return "";
}

function probe(filePath) {
  const raw = execFileSync("ffprobe", [
    "-v", "error",
    "-select_streams", "a:0",
    "-show_entries", "stream=codec_name,sample_rate,channels:format=duration",
    "-of", "json",
    filePath
  ], { encoding: "utf8" });
  const parsed = JSON.parse(raw);
  const stream = parsed.streams?.[0] || {};
  return {
    codec: stream.codec_name || "",
    sampleRate: Number(stream.sample_rate || 0),
    channels: Number(stream.channels || 0),
    duration: Number(parsed.format?.duration || 0)
  };
}

function validateRights(inputDirectory) {
  const rightsPath = path.join(inputDirectory, "rights.json");
  if (!existsSync(rightsPath)) return ["rights.json is missing"];
  const rights = JSON.parse(readFileSync(rightsPath, "utf8"));
  const problems = [];
  if (!String(rights.performer || "").trim()) problems.push("rights.json needs the performer name");
  if (!String(rights.recordingOwner || "").trim()) problems.push("rights.json needs the recording owner");
  if (!rights.commercialUseGranted) problems.push("commercial use has not been granted");
  if (!rights.performerConsentConfirmed) problems.push("performer consent has not been confirmed");
  if (rights.syntheticVoiceUsed) problems.push("synthetic voice audio is not accepted for this bank");
  if (rights.thirdPartyAudioUsed) problems.push("third-party source audio is not accepted for this bank");
  return problems;
}

function check(inputDirectory, outputDirectory, targets) {
  if (!inputDirectory || !existsSync(inputDirectory)) throw new Error("Pass an existing source directory with --input");
  mkdirSync(outputDirectory, { recursive: true });
  const problems = validateRights(inputDirectory);
  const expected = new Set(allTakes(targets).flatMap(item => audioExtensions.map(extension => `${item.takeId}${extension}`)));
  const unexpected = readdirSync(inputDirectory).filter(file => audioExtensions.includes(path.extname(file).toLowerCase()) && !expected.has(file));
  if (unexpected.length) problems.push(`unexpected audio files: ${unexpected.join(", ")}`);

  const rows = [["take_id", "curriculum_key", "file", "sha256", "duration_seconds", "sample_rate", "channels", "technical_status", "human_phonics_review", "notes"]];
  for (const item of allTakes(targets)) {
    const filePath = resolveTakeFile(inputDirectory, item.takeId);
    if (!filePath) {
      problems.push(`missing take: ${item.takeId}`);
      rows.push([item.takeId, item.key, "", "", "", "", "", "missing", "pending", ""]);
      continue;
    }
    const metadata = probe(filePath);
    const technicalNotes = [];
    if (metadata.duration < 0.12) technicalNotes.push("too short to review reliably");
    if (metadata.duration > 2.5) technicalNotes.push("too long for an isolated cue");
    if (metadata.sampleRate < 44100) technicalNotes.push("sample rate below 44.1 kHz");
    if (metadata.channels < 1) technicalNotes.push("no audio channel");
    const digest = createHash("sha256").update(readFileSync(filePath)).digest("hex");
    const status = technicalNotes.length ? "needs_attention" : "pass";
    if (technicalNotes.length) problems.push(`${item.takeId}: ${technicalNotes.join("; ")}`);
    rows.push([
      item.takeId,
      item.key,
      path.basename(filePath),
      digest,
      metadata.duration.toFixed(3),
      metadata.sampleRate,
      metadata.channels,
      status,
      "pending",
      technicalNotes.join("; ")
    ]);
  }
  writeFileSync(path.join(outputDirectory, "technical-review.csv"), `${rows.map(row => row.map(csvCell).join(",")).join("\n")}\n`);
  writeFileSync(path.join(outputDirectory, "check-summary.json"), `${JSON.stringify({
    checkedAt: new Date().toISOString(),
    inputDirectory: path.resolve(inputDirectory),
    cueCount: targets.length,
    takeCount: allTakes(targets).length,
    passed: problems.length === 0,
    problems
  }, null, 2)}\n`);
  if (problems.length) {
    console.error(`Phoneme recording check found ${problems.length} problem(s). Review ${path.join(outputDirectory, "check-summary.json")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Technical intake passed for ${allTakes(targets).length} takes. Human phonics review is still required.`);
}

function recordNoMissingTargets(outputDirectory, scope) {
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(path.join(outputDirectory, "check-summary.json"), `${JSON.stringify({
    checkedAt: new Date().toISOString(),
    inputDirectory: null,
    scope,
    cueCount: 0,
    takeCount: 0,
    passed: true,
    problems: []
  }, null, 2)}\n`);
  console.log(`No ${scope} phoneme recording gaps remain; no private intake directory is needed.`);
}

const { command, options } = parseArgs(process.argv.slice(2));
const outputDirectory = path.resolve(options.output || defaultOutput);
const targets = selectedTargets(options.scope || "all");

if (command === "prepare") {
  prepare(outputDirectory, targets);
} else if (command === "check") {
  if (targets.length === 0) {
    recordNoMissingTargets(outputDirectory, options.scope || "all");
  } else {
    if (!options.input) throw new Error("Pass the private source directory with --input /absolute/path/to/incoming");
    check(path.resolve(options.input), outputDirectory, targets);
  }
} else {
  throw new Error(`Unknown command: ${command}. Use prepare or check.`);
}
