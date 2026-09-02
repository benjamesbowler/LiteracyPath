import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  constants as fsConstants,
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  promises as fs
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import { SOUND_SEEKERS_BIOME_KITS } from
  "../src/features/soundSeekers/content/biomeKits.js";
import {
  SOUND_SEEKERS_V2_AGENT_CHECKS,
  SOUND_SEEKERS_V2_BACKGROUND_ORDER,
  SOUND_SEEKERS_V2_PROFILE_ORDER,
  SOUND_SEEKERS_V2_PUBLIC_ROOT,
  assertSoundSeekersV2AssetManifest,
  buildSoundSeekersV2BackgroundPrompt,
  canonicalStringify,
  sha256Bytes,
  sha256Canonical,
  sha256Text,
  task4BriefSetSha256,
  task4BriefSha256
} from "./lib/soundSeekersV2AssetManifest.mjs";

export const SOUND_SEEKERS_V2_CALLS_LEDGER =
  ".artifacts/sound-seekers-v2/generation/calls.json";
export const SOUND_SEEKERS_V2_PREPARATION_LEDGER =
  ".artifacts/sound-seekers-v2/generation/preparation.json";
export const SOUND_SEEKERS_V2_SOURCE_CANDIDATE_ROOT =
  ".artifacts/sound-seekers-v2/generation/source";
export const SOUND_SEEKERS_V2_PREPARED_CANDIDATE_ROOT =
  ".artifacts/sound-seekers-v2/generation/prepared";
export const SOUND_SEEKERS_V2_CROP_REVIEW_ROOT =
  ".artifacts/sound-seekers-v2/crop-review";

export const SOUND_SEEKERS_V2_CALL_ERROR_CODES = Object.freeze([
  "TOOL_CALL_FAILED",
  "INTERRUPTED_AFTER_RESERVATION",
  "RESULT_SCHEMA_INVALID",
  "RESULT_IMAGE_URL_INVALID",
  "RESULT_IMAGE_DATA_INVALID",
  "RESULT_IMAGE_MIME_MISMATCH"
]);

const CALL_STATES = Object.freeze([
  "planned", "reserved", "succeeded", "failed", "unknown"
]);
const PREPARATION_STAGES = Object.freeze([
  "awaiting_call",
  "source_ready",
  "source_accepted",
  "prepared",
  "final_accepted",
  "crop_accepted",
  "rejected",
  "cleaned"
]);
const CALL_KEYS = Object.freeze([
  "ordinal",
  "chapterId",
  "promptSha256",
  "state",
  "requestedAt",
  "completedAt",
  "resultMetadata",
  "resultMetadataSha256",
  "sourcePath",
  "sourceSha256",
  "errorCode"
]);
const PREPARATION_KEYS = Object.freeze([
  "ordinal",
  "chapterId",
  "terminalCallEntrySha256",
  "stage",
  "sourceCandidate",
  "preparedCandidate",
  "agentInspection",
  "cropReview",
  "humanReviews",
  "cleanup"
]);
const LEDGER_KEYS = Object.freeze([
  "schemaVersion", "runId", "task4Commit", "task4BriefSetSha256", "entries"
]);
const CANDIDATE_KEYS = Object.freeze([
  "path", "format", "width", "height", "byteLength", "sha256"
]);
const INSPECTION_KEYS = Object.freeze([
  "scope", "candidateSha256", "inspectedAt", "method", "decision", "checks"
]);
const INSPECTION_CHECK_KEYS = Object.freeze(
  Object.keys(SOUND_SEEKERS_V2_AGENT_CHECKS)
    .filter(key => key !== "profileQuietZones")
);
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const UTC_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/u;
const SOURCE_EXTENSIONS = Object.freeze({ png: "png", jpeg: "jpeg", webp: "webp" });

function isPlainObject(value) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function same(left, right) {
  return canonicalStringify(left) === canonicalStringify(right);
}

function assertExactKeys(value, keys, label) {
  if (!isPlainObject(value) || !same(Object.keys(value), keys)) {
    throw new TypeError(`${label} has an invalid shape`);
  }
}

function assertDenseArray(value, length, label) {
  if (!Array.isArray(value) || value.length !== length
    || Reflect.ownKeys(value).length !== length + 1) {
    throw new TypeError(`${label} has an invalid shape`);
  }
}

function assertHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 hash`);
  }
}

function assertUtc(value, label) {
  if (typeof value !== "string" || !UTC_PATTERN.test(value)
    || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${label} must be an RFC 3339 UTC instant`);
  }
}

function resolveNow(now) {
  const value = typeof now === "function" ? now() : (now ?? new Date().toISOString());
  assertUtc(value, "timestamp");
  return value;
}

function normalizeRoot(root = process.cwd()) {
  if (typeof root !== "string" || !path.isAbsolute(root)) {
    throw new TypeError("root must be an absolute path");
  }
  return realpathSync(path.resolve(root));
}

function canonicalPathWithExistingAncestor(value) {
  let cursor = path.resolve(value);
  const suffix = [];
  while (!existsSync(cursor)) {
    const parent = path.dirname(cursor);
    if (parent === cursor) throw new TypeError(`cannot resolve owned path ${value}`);
    suffix.unshift(path.basename(cursor));
    cursor = parent;
  }
  return path.join(realpathSync(cursor), ...suffix);
}

function assertStrictDescendant(parent, candidate, label) {
  const relative = path.relative(parent, candidate);
  if (relative === "" || relative.startsWith(`..${path.sep}`) || relative === ".."
    || path.isAbsolute(relative)) {
    throw new TypeError(`${label} must be a strict descendant of its owned root`);
  }
}

function resolveOwnedPath(root, input, fallback, ownedRoot = root) {
  const candidate = canonicalPathWithExistingAncestor(path.resolve(root, input ?? fallback));
  const canonicalOwnedRoot = canonicalPathWithExistingAncestor(ownedRoot);
  assertStrictDescendant(canonicalOwnedRoot, candidate, "owned path");
  return candidate;
}

function rootRelative(root, absolutePath) {
  assertStrictDescendant(root, absolutePath, "candidate path");
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

async function lstatOrNull(filePath) {
  try {
    return await fs.lstat(filePath);
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

async function assertRegularFile(filePath, label) {
  const stat = await fs.lstat(filePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new TypeError(`${label} must be a non-symlink regular file`);
  }
  return stat;
}

async function fsyncDirectory(directory) {
  const handle = await fs.open(directory, fsConstants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeBytesDurably(filePath, bytes, { refuseExisting = false } = {}) {
  if (!(Buffer.isBuffer(bytes) || bytes instanceof Uint8Array)) {
    throw new TypeError("durable writer requires bytes");
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (refuseExisting && await lstatOrNull(filePath)) {
    throw new TypeError(`${filePath} already exists`);
  }
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`
  );
  let handle;
  try {
    handle = await fs.open(temporary, fsConstants.O_CREAT | fsConstants.O_EXCL
      | fsConstants.O_WRONLY, 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
    if (refuseExisting && await lstatOrNull(filePath)) {
      throw new TypeError(`${filePath} already exists`);
    }
    await fs.rename(temporary, filePath);
    await fsyncDirectory(path.dirname(filePath));
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await fs.unlink(temporary).catch(() => {});
    throw error;
  }
}

async function writeJsonDurably(filePath, value, options) {
  await writeBytesDurably(filePath,
    Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"), options);
}

async function readJsonFile(filePath, label) {
  await assertRegularFile(filePath, label);
  let value;
  try {
    value = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    throw new TypeError(`${label} is not valid JSON`);
  }
  return value;
}

function deriveTask4Commit(root, override) {
  if (override !== undefined) {
    if (typeof override !== "string" || !COMMIT_PATTERN.test(override)) {
      throw new TypeError("task4Commit must be a lowercase Git commit ID");
    }
    return override;
  }
  const value = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();
  if (!COMMIT_PATTERN.test(value)) throw new TypeError("could not derive Task 4 commit");
  return value;
}

function resultMetadataIsValid(value) {
  return isPlainObject(value)
    && same(Object.keys(value), ["returnedModel", "outputHintSha256"])
    && (value.returnedModel === null
      || (typeof value.returnedModel === "string" && value.returnedModel.length > 0))
    && (value.outputHintSha256 === null
      || (typeof value.outputHintSha256 === "string"
        && HASH_PATTERN.test(value.outputHintSha256)));
}

function validateCallEntry(entry, index) {
  assertExactKeys(entry, CALL_KEYS, `call entry ${index + 1}`);
  const kit = SOUND_SEEKERS_BIOME_KITS[index];
  const promptSha256 = sha256Text(buildSoundSeekersV2BackgroundPrompt(kit));
  if (entry.ordinal !== index + 1 || entry.chapterId !== kit.id
    || entry.promptSha256 !== promptSha256 || !CALL_STATES.includes(entry.state)) {
    throw new TypeError(`call entry ${index + 1} drifted from canonical order`);
  }
  const allNull = keys => keys.every(key => entry[key] === null);
  if (entry.state === "planned") {
    if (!allNull(CALL_KEYS.slice(4))) throw new TypeError("planned call has terminal fields");
  } else if (entry.state === "reserved") {
    assertUtc(entry.requestedAt, `${entry.chapterId} requestedAt`);
    if (!allNull(CALL_KEYS.slice(5))) throw new TypeError("reserved call has terminal fields");
  } else if (entry.state === "succeeded") {
    assertUtc(entry.requestedAt, `${entry.chapterId} requestedAt`);
    assertUtc(entry.completedAt, `${entry.chapterId} completedAt`);
    if (Date.parse(entry.completedAt) < Date.parse(entry.requestedAt)
      || !resultMetadataIsValid(entry.resultMetadata)
      || entry.resultMetadataSha256 !== sha256Canonical(entry.resultMetadata)
      || typeof entry.sourcePath !== "string"
      || entry.sourcePath.length === 0
      || entry.errorCode !== null) {
      throw new TypeError(`${entry.chapterId} succeeded call has invalid facts`);
    }
    assertHash(entry.sourceSha256, `${entry.chapterId} sourceSha256`);
  } else if (entry.state === "failed") {
    assertUtc(entry.requestedAt, `${entry.chapterId} requestedAt`);
    assertUtc(entry.completedAt, `${entry.chapterId} completedAt`);
    if (!allNull(["resultMetadata", "resultMetadataSha256", "sourcePath", "sourceSha256"])
      || !SOUND_SEEKERS_V2_CALL_ERROR_CODES.includes(entry.errorCode)
      || entry.errorCode === "INTERRUPTED_AFTER_RESERVATION") {
      throw new TypeError(`${entry.chapterId} failed call has invalid facts`);
    }
  } else {
    assertUtc(entry.requestedAt, `${entry.chapterId} requestedAt`);
    assertUtc(entry.completedAt, `${entry.chapterId} completedAt`);
    if (!allNull(["resultMetadata", "resultMetadataSha256", "sourcePath", "sourceSha256"])
      || entry.errorCode !== "INTERRUPTED_AFTER_RESERVATION") {
      throw new TypeError(`${entry.chapterId} unknown call has invalid facts`);
    }
  }
}

export function validateCallsLedger(ledger, { root = process.cwd() } = {}) {
  normalizeRoot(root);
  assertExactKeys(ledger, LEDGER_KEYS, "call ledger");
  if (ledger.schemaVersion !== 1
    || typeof ledger.runId !== "string" || ledger.runId.length === 0
    || typeof ledger.task4Commit !== "string" || !COMMIT_PATTERN.test(ledger.task4Commit)
    || ledger.task4BriefSetSha256 !== task4BriefSetSha256()) {
    throw new TypeError("call ledger header drifted");
  }
  assertDenseArray(ledger.entries, 8, "call ledger entries");
  ledger.entries.forEach(validateCallEntry);
  return true;
}

function ledgerPath(root, input, fallback) {
  return resolveOwnedPath(root, input, fallback,
    path.join(root, ".artifacts/sound-seekers-v2"));
}

function rejectWriterInjection(options) {
  for (const key of ["atomicWriter", "writeLedger", "writer", "fsAdapter"]) {
    if (Object.hasOwn(options, key)) {
      throw new TypeError(`${key} injection is not permitted`);
    }
  }
}

export function readCallsLedger({
  root = process.cwd(),
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER
} = {}) {
  const normalizedRoot = normalizeRoot(root);
  const absolute = ledgerPath(normalizedRoot, callsLedgerPath,
    SOUND_SEEKERS_V2_CALLS_LEDGER);
  const source = readFileSyncStrict(absolute, "call ledger");
  let ledger;
  try {
    ledger = JSON.parse(source);
  } catch {
    throw new TypeError("call ledger is not valid JSON");
  }
  validateCallsLedger(ledger, { root: normalizedRoot });
  return ledger;
}

function readFileSyncStrict(filePath, label) {
  const stat = lstatSync(filePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new TypeError(`${label} must be a non-symlink regular file`);
  }
  return readFileSync(filePath, "utf8");
}

function createPlannedEntry(kit, index) {
  return {
    ordinal: index + 1,
    chapterId: kit.id,
    promptSha256: sha256Text(buildSoundSeekersV2BackgroundPrompt(kit)),
    state: "planned",
    requestedAt: null,
    completedAt: null,
    resultMetadata: null,
    resultMetadataSha256: null,
    sourcePath: null,
    sourceSha256: null,
    errorCode: null
  };
}

export async function initCallsLedger({
  root = process.cwd(),
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER,
  task4Commit,
  runId = randomUUID(),
  now,
  ...unknown
} = {}) {
  rejectWriterInjection(unknown);
  if (Object.keys(unknown).length > 0) {
    throw new TypeError(`unknown init-calls-ledger option: ${Object.keys(unknown)[0]}`);
  }
  void now;
  const normalizedRoot = normalizeRoot(root);
  const absolute = ledgerPath(normalizedRoot, callsLedgerPath,
    SOUND_SEEKERS_V2_CALLS_LEDGER);
  const ledger = {
    schemaVersion: 1,
    runId,
    task4Commit: deriveTask4Commit(normalizedRoot, task4Commit),
    task4BriefSetSha256: task4BriefSetSha256(),
    entries: SOUND_SEEKERS_BIOME_KITS.map(createPlannedEntry)
  };
  validateCallsLedger(ledger, { root: normalizedRoot });
  await writeJsonDurably(absolute, ledger, { refuseExisting: true });
  return ledger;
}

function terminalEntryHashes(ledger) {
  return ledger.entries.map(entry => CALL_STATES.slice(2).includes(entry.state)
    ? canonicalStringify(entry) : null);
}

function assertUnchangedTerminalEntries(before, after) {
  const receipts = terminalEntryHashes(before);
  for (const [index, receipt] of receipts.entries()) {
    if (receipt !== null && canonicalStringify(after.entries[index]) !== receipt) {
      throw new TypeError(`terminal call ${index + 1} is immutable`);
    }
  }
}

async function mutateCallsLedger(options, mutate) {
  rejectWriterInjection(options);
  const normalizedRoot = normalizeRoot(options.root ?? process.cwd());
  const absolute = ledgerPath(normalizedRoot,
    options.callsLedgerPath ?? SOUND_SEEKERS_V2_CALLS_LEDGER,
    SOUND_SEEKERS_V2_CALLS_LEDGER);
  const ledger = await readJsonFile(absolute, "call ledger");
  validateCallsLedger(ledger, { root: normalizedRoot });
  const next = structuredClone(ledger);
  await mutate(next, normalizedRoot);
  assertUnchangedTerminalEntries(ledger, next);
  validateCallsLedger(next, { root: normalizedRoot });
  await writeJsonDurably(absolute, next);
  return next;
}

export async function reserveCall({ ordinal, now, ...options } = {}) {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1 || ordinal > 8) {
    throw new TypeError("ordinal must be an integer from 1 through 8");
  }
  return mutateCallsLedger(options, ledger => {
    if (ledger.entries.some(entry => entry.state === "reserved")) {
      throw new TypeError("resume the reserved call before another reservation");
    }
    const nextPlanned = ledger.entries.find(entry => entry.state === "planned");
    if (!nextPlanned || nextPlanned.ordinal !== ordinal) {
      throw new TypeError("only the next canonical planned ordinal may be reserved");
    }
    Object.assign(nextPlanned, {
      state: "reserved",
      requestedAt: resolveNow(now)
    });
  });
}

export async function resumeCallsLedger({ now, ...options } = {}) {
  return mutateCallsLedger(options, ledger => {
    const completedAt = resolveNow(now);
    for (const entry of ledger.entries) {
      if (entry.state === "reserved") {
        entry.state = "unknown";
        entry.completedAt = completedAt;
        entry.errorCode = "INTERRUPTED_AFTER_RESERVATION";
      }
    }
  });
}

function magicMatches(bytes, format) {
  if (format === "png") {
    return bytes.length >= 8
      && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (format === "jpeg") {
    return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8
      && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  }
  return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF"
    && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

function decodeReturnedImage(result) {
  if (!isPlainObject(result)
    || !same(Object.keys(result), ["image_url", "output_hint", "returnedModel"])) {
    throw Object.assign(new TypeError("tool result has an invalid safe capture shape"), {
      errorCode: "RESULT_SCHEMA_INVALID"
    });
  }
  if (!(result.output_hint === null || typeof result.output_hint === "string")
    || !(result.returnedModel === null || typeof result.returnedModel === "string")) {
    throw Object.assign(new TypeError("tool result metadata is invalid"), {
      errorCode: "RESULT_SCHEMA_INVALID"
    });
  }
  if (typeof result.image_url !== "string") {
    throw Object.assign(new TypeError("tool result image_url is invalid"), {
      errorCode: "RESULT_IMAGE_URL_INVALID"
    });
  }
  const match = DATA_URL_PATTERN.exec(result.image_url);
  if (!match) {
    throw Object.assign(new TypeError("tool result must contain one supported image data URL"), {
      errorCode: "RESULT_IMAGE_URL_INVALID"
    });
  }
  const [, format, payload] = match;
  if (payload.length % 4 !== 0) {
    throw Object.assign(new TypeError("tool result image data is malformed"), {
      errorCode: "RESULT_IMAGE_DATA_INVALID"
    });
  }
  const bytes = Buffer.from(payload, "base64");
  if (bytes.length === 0
    || bytes.toString("base64").replace(/=+$/u, "") !== payload.replace(/=+$/u, "")) {
    throw Object.assign(new TypeError("tool result image data is malformed"), {
      errorCode: "RESULT_IMAGE_DATA_INVALID"
    });
  }
  if (!magicMatches(bytes, format)) {
    throw Object.assign(new TypeError("tool result image MIME and magic bytes disagree"), {
      errorCode: "RESULT_IMAGE_MIME_MISMATCH"
    });
  }
  return { format, bytes };
}

async function terminateReservedCall(options, ordinal, state, errorCode, facts = {}) {
  return mutateCallsLedger(options, ledger => {
    const entry = ledger.entries[ordinal - 1];
    if (!entry || entry.state !== "reserved") {
      throw new TypeError("only a reserved call may become terminal");
    }
    Object.assign(entry, {
      state,
      completedAt: resolveNow(options.now),
      resultMetadata: facts.resultMetadata ?? null,
      resultMetadataSha256: facts.resultMetadataSha256 ?? null,
      sourcePath: facts.sourcePath ?? null,
      sourceSha256: facts.sourceSha256 ?? null,
      errorCode
    });
  });
}

export async function captureCallResult({
  ordinal,
  result,
  now,
  afterSourceRename,
  ...options
} = {}) {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1 || ordinal > 8) {
    throw new TypeError("ordinal must be an integer from 1 through 8");
  }
  const normalizedRoot = normalizeRoot(options.root ?? process.cwd());
  let decoded;
  try {
    decoded = decodeReturnedImage(result);
  } catch (error) {
    const ledger = readCallsLedger({ ...options, root: normalizedRoot });
    if (ledger.entries[ordinal - 1]?.state === "reserved") {
      await terminateReservedCall({ ...options, root: normalizedRoot, now }, ordinal,
        "failed", error.errorCode ?? "RESULT_SCHEMA_INVALID");
    }
    throw error;
  }
  const chapterId = SOUND_SEEKERS_V2_BACKGROUND_ORDER[ordinal - 1];
  const sourceRoot = path.join(normalizedRoot, SOUND_SEEKERS_V2_SOURCE_CANDIDATE_ROOT);
  const sourcePath = path.join(sourceRoot,
    `${chapterId}.${SOURCE_EXTENSIONS[decoded.format]}`);
  assertStrictDescendant(sourceRoot, sourcePath, "source candidate");
  const ledgerBefore = readCallsLedger({ ...options, root: normalizedRoot });
  if (ledgerBefore.entries[ordinal - 1]?.state !== "reserved") {
    throw new TypeError("only a reserved call may capture a result");
  }
  await writeBytesDurably(sourcePath, decoded.bytes, { refuseExisting: true });
  await assertRegularFile(sourcePath, "captured source");
  const verifiedBytes = await fs.readFile(sourcePath);
  const sourceSha256 = sha256Bytes(verifiedBytes);
  if (sourceSha256 !== sha256Bytes(decoded.bytes)) {
    throw new TypeError("captured source hash changed after atomic rename");
  }
  if (afterSourceRename !== undefined) {
    if (typeof afterSourceRename !== "function") {
      throw new TypeError("afterSourceRename must be a function");
    }
    await afterSourceRename({
      ordinal,
      chapterId,
      sourceSha256
    });
  }
  const resultMetadata = {
    returnedModel: result.returnedModel,
    outputHintSha256: result.output_hint === null ? null : sha256Text(result.output_hint)
  };
  return terminateReservedCall({ ...options, root: normalizedRoot, now }, ordinal,
    "succeeded", null, {
      resultMetadata,
      resultMetadataSha256: sha256Canonical(resultMetadata),
      sourcePath: rootRelative(normalizedRoot, sourcePath),
      sourceSha256
    });
}

export async function recordCallFailure({ ordinal, code, now, ...options } = {}) {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1 || ordinal > 8
    || !SOUND_SEEKERS_V2_CALL_ERROR_CODES.includes(code)
    || code === "INTERRUPTED_AFTER_RESERVATION") {
    throw new TypeError("call failure uses an invalid ordinal or error code");
  }
  return terminateReservedCall({ ...options, now }, ordinal, "failed", code);
}

function emptyPreparationEntry(callEntry) {
  const terminal = CALL_STATES.slice(2).includes(callEntry.state);
  return {
    ordinal: callEntry.ordinal,
    chapterId: callEntry.chapterId,
    terminalCallEntrySha256: terminal ? sha256Canonical(callEntry) : null,
    stage: "awaiting_call",
    sourceCandidate: null,
    preparedCandidate: null,
    agentInspection: { source: null, final: null },
    cropReview: null,
    humanReviews: { crop: null, semantic: null },
    cleanup: { completedAt: null, removedCandidatePaths: [] }
  };
}

function assertCandidate(candidate, label) {
  assertExactKeys(candidate, CANDIDATE_KEYS, label);
  if (typeof candidate.path !== "string" || candidate.path.length === 0
    || path.isAbsolute(candidate.path) || candidate.path.split("/").includes("..")
    || !["png", "jpeg", "webp"].includes(candidate.format)) {
    throw new TypeError(`${label} has an invalid identity`);
  }
  for (const key of ["width", "height", "byteLength"]) {
    if (!Number.isSafeInteger(candidate[key]) || candidate[key] <= 0) {
      throw new TypeError(`${label}.${key} is invalid`);
    }
  }
  assertHash(candidate.sha256, `${label}.sha256`);
}

function validateInspection(value, scope, candidateSha256, label) {
  if (value === null) return;
  assertExactKeys(value, INSPECTION_KEYS, label);
  if (value.scope !== scope || value.candidateSha256 !== candidateSha256
    || value.method !== `view_image:original-${scope}`
    || !["accepted", "rejected"].includes(value.decision)) {
    throw new TypeError(`${label} is not bound to the current candidate`);
  }
  assertUtc(value.inspectedAt, `${label}.inspectedAt`);
  assertExactKeys(value.checks, INSPECTION_CHECK_KEYS, `${label}.checks`);
  const expected = Object.fromEntries(INSPECTION_CHECK_KEYS.map(key => [
    key, SOUND_SEEKERS_V2_AGENT_CHECKS[key]
  ]));
  const matches = same(value.checks, expected);
  if ((value.decision === "accepted") !== matches) {
    throw new TypeError(`${label} decision does not match its checks`);
  }
}

export function validatePreparationLedger(ledger, {
  root = process.cwd(),
  callsLedger
} = {}) {
  normalizeRoot(root);
  assertExactKeys(ledger, LEDGER_KEYS, "preparation ledger");
  if (ledger.schemaVersion !== 1 || typeof ledger.runId !== "string"
    || ledger.runId.length === 0 || !COMMIT_PATTERN.test(ledger.task4Commit)
    || ledger.task4BriefSetSha256 !== task4BriefSetSha256()) {
    throw new TypeError("preparation ledger header drifted");
  }
  if (callsLedger) {
    validateCallsLedger(callsLedger, { root });
    if (ledger.runId !== callsLedger.runId
      || ledger.task4Commit !== callsLedger.task4Commit
      || ledger.task4BriefSetSha256 !== callsLedger.task4BriefSetSha256) {
      throw new TypeError("call and preparation ledgers are from different runs");
    }
  }
  assertDenseArray(ledger.entries, 8, "preparation entries");
  for (const [index, entry] of ledger.entries.entries()) {
    assertExactKeys(entry, PREPARATION_KEYS, `preparation entry ${index + 1}`);
    const callEntry = callsLedger?.entries[index];
    if (entry.ordinal !== index + 1
      || entry.chapterId !== SOUND_SEEKERS_V2_BACKGROUND_ORDER[index]
      || !PREPARATION_STAGES.includes(entry.stage)) {
      throw new TypeError(`preparation entry ${index + 1} drifted from canonical order`);
    }
    if (entry.terminalCallEntrySha256 !== null) {
      assertHash(entry.terminalCallEntrySha256,
        `${entry.chapterId} terminalCallEntrySha256`);
      if (!callEntry || !CALL_STATES.slice(2).includes(callEntry.state)
        || entry.terminalCallEntrySha256 !== sha256Canonical(callEntry)) {
        throw new TypeError(`${entry.chapterId} terminal receipt hash is stale`);
      }
    }
    if (entry.sourceCandidate !== null) {
      assertCandidate(entry.sourceCandidate, `${entry.chapterId} sourceCandidate`);
    }
    if (entry.preparedCandidate !== null) {
      assertCandidate(entry.preparedCandidate, `${entry.chapterId} preparedCandidate`);
      if (entry.preparedCandidate.format !== "webp"
        || entry.preparedCandidate.width !== 1536
        || entry.preparedCandidate.height !== 864) {
        throw new TypeError(`${entry.chapterId} prepared candidate is invalid`);
      }
    }
    assertExactKeys(entry.agentInspection, ["source", "final"],
      `${entry.chapterId} agentInspection`);
    validateInspection(entry.agentInspection.source, "source",
      entry.sourceCandidate?.sha256, `${entry.chapterId} source inspection`);
    validateInspection(entry.agentInspection.final, "final",
      entry.preparedCandidate?.sha256, `${entry.chapterId} final inspection`);
    assertExactKeys(entry.humanReviews, ["crop", "semantic"],
      `${entry.chapterId} humanReviews`);
    if (entry.humanReviews.crop !== null || entry.humanReviews.semantic !== null) {
      throw new TypeError("Task 5 may not record human reviews");
    }
    assertExactKeys(entry.cleanup, ["completedAt", "removedCandidatePaths"],
      `${entry.chapterId} cleanup`);
    if (!Array.isArray(entry.cleanup.removedCandidatePaths)
      || new Set(entry.cleanup.removedCandidatePaths).size
        !== entry.cleanup.removedCandidatePaths.length) {
      throw new TypeError(`${entry.chapterId} cleanup paths are invalid`);
    }
    if (entry.cleanup.completedAt !== null) {
      assertUtc(entry.cleanup.completedAt, `${entry.chapterId} cleanup.completedAt`);
    }
    if (callEntry && CALL_STATES.slice(2).includes(callEntry.state)
      && entry.terminalCallEntrySha256 === null
      && entry.stage !== "awaiting_call") {
      throw new TypeError(`${entry.chapterId} stage lacks its terminal receipt`);
    }
    const sourceAccepted = entry.agentInspection.source?.decision === "accepted";
    const finalAccepted = entry.agentInspection.final?.decision === "accepted";
    if (entry.stage === "awaiting_call") {
      if (entry.sourceCandidate !== null || entry.preparedCandidate !== null
        || entry.agentInspection.source !== null || entry.agentInspection.final !== null
        || entry.cropReview !== null || entry.cleanup.completedAt !== null) {
        throw new TypeError(`${entry.chapterId} awaiting stage contains later work`);
      }
    } else if (entry.stage === "source_ready") {
      if (callEntry?.state !== "succeeded" || entry.sourceCandidate === null
        || entry.preparedCandidate !== null || entry.agentInspection.source !== null
        || entry.agentInspection.final !== null || entry.cropReview !== null) {
        throw new TypeError(`${entry.chapterId} source_ready stage is inconsistent`);
      }
    } else if (entry.stage === "source_accepted") {
      if (callEntry?.state !== "succeeded" || entry.sourceCandidate === null
        || entry.preparedCandidate !== null || !sourceAccepted
        || entry.agentInspection.final !== null || entry.cropReview !== null) {
        throw new TypeError(`${entry.chapterId} source_accepted stage is inconsistent`);
      }
    } else if (entry.stage === "prepared") {
      if (callEntry?.state !== "succeeded" || entry.sourceCandidate === null
        || entry.preparedCandidate === null || !sourceAccepted
        || entry.agentInspection.final !== null || entry.cropReview !== null) {
        throw new TypeError(`${entry.chapterId} prepared stage is inconsistent`);
      }
    } else if (entry.stage === "final_accepted") {
      if (callEntry?.state !== "succeeded" || entry.sourceCandidate === null
        || entry.preparedCandidate === null || !sourceAccepted || !finalAccepted
        || entry.cropReview !== null) {
        throw new TypeError(`${entry.chapterId} final_accepted stage is inconsistent`);
      }
    } else if (entry.stage === "crop_accepted") {
      if (callEntry?.state !== "succeeded" || entry.sourceCandidate === null
        || entry.preparedCandidate === null || !sourceAccepted || !finalAccepted
        || entry.cropReview === null) {
        throw new TypeError(`${entry.chapterId} crop_accepted stage is inconsistent`);
      }
    } else if (entry.stage === "rejected") {
      const callRejected = ["failed", "unknown"].includes(callEntry?.state);
      const inspectionRejected = entry.agentInspection.source?.decision === "rejected"
        || entry.agentInspection.final?.decision === "rejected"
        || entry.cropReview?.decision === "rejected";
      if (!callRejected && !inspectionRejected) {
        throw new TypeError(`${entry.chapterId} rejected stage has no rejection evidence`);
      }
    } else if (entry.stage === "cleaned" && entry.cleanup.completedAt === null) {
      throw new TypeError(`${entry.chapterId} cleaned stage lacks cleanup evidence`);
    }
    validateCropProjection(entry.cropReview, entry, index);
  }
  return true;
}

export function readPreparationLedger({
  root = process.cwd(),
  preparationLedgerPath = SOUND_SEEKERS_V2_PREPARATION_LEDGER,
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER
} = {}) {
  const normalizedRoot = normalizeRoot(root);
  const absolute = ledgerPath(normalizedRoot, preparationLedgerPath,
    SOUND_SEEKERS_V2_PREPARATION_LEDGER);
  const source = readFileSyncStrict(absolute, "preparation ledger");
  let ledger;
  try {
    ledger = JSON.parse(source);
  } catch {
    throw new TypeError("preparation ledger is not valid JSON");
  }
  let callsLedger;
  try {
    callsLedger = readCallsLedger({ root: normalizedRoot, callsLedgerPath });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  validatePreparationLedger(ledger, { root: normalizedRoot, callsLedger });
  return ledger;
}

async function candidateFromSucceededCall(root, callEntry) {
  if (callEntry.state !== "succeeded") return null;
  const absolute = path.resolve(root, callEntry.sourcePath);
  const sourceRoot = path.join(root, SOUND_SEEKERS_V2_SOURCE_CANDIDATE_ROOT);
  assertStrictDescendant(sourceRoot, absolute, "source candidate");
  const stat = await assertRegularFile(absolute, "source candidate");
  const bytes = await fs.readFile(absolute);
  if (sha256Bytes(bytes) !== callEntry.sourceSha256) {
    throw new TypeError(`${callEntry.chapterId} source candidate hash drifted`);
  }
  const metadata = await sharp(bytes, { animated: true, failOn: "error" }).metadata();
  const width = metadata.autoOrient?.width
    ?? ([5, 6, 7, 8].includes(metadata.orientation) ? metadata.height : metadata.width);
  const height = metadata.autoOrient?.height
    ?? ([5, 6, 7, 8].includes(metadata.orientation) ? metadata.width : metadata.height);
  const format = metadata.format === "jpg" ? "jpeg" : metadata.format;
  if (!SOURCE_EXTENSIONS[format] || !width || !height) {
    throw new TypeError(`${callEntry.chapterId} source candidate cannot be decoded`);
  }
  return {
    path: callEntry.sourcePath,
    format,
    width,
    height,
    byteLength: stat.size,
    sha256: callEntry.sourceSha256
  };
}

export async function initPreparationLedger({
  root = process.cwd(),
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER,
  preparationLedgerPath = SOUND_SEEKERS_V2_PREPARATION_LEDGER,
  now,
  ...unknown
} = {}) {
  rejectWriterInjection(unknown);
  if (Object.keys(unknown).length > 0) {
    throw new TypeError(`unknown init-preparation-ledger option: ${Object.keys(unknown)[0]}`);
  }
  void now;
  const normalizedRoot = normalizeRoot(root);
  const callsLedger = readCallsLedger({ root: normalizedRoot, callsLedgerPath });
  const ledger = {
    schemaVersion: 1,
    runId: callsLedger.runId,
    task4Commit: callsLedger.task4Commit,
    task4BriefSetSha256: callsLedger.task4BriefSetSha256,
    entries: callsLedger.entries.map(emptyPreparationEntry)
  };
  validatePreparationLedger(ledger, { root: normalizedRoot, callsLedger });
  const absolute = ledgerPath(normalizedRoot, preparationLedgerPath,
    SOUND_SEEKERS_V2_PREPARATION_LEDGER);
  await writeJsonDurably(absolute, ledger, { refuseExisting: true });
  return ledger;
}

async function mutatePreparationLedger(options, mutate) {
  rejectWriterInjection(options);
  const normalizedRoot = normalizeRoot(options.root ?? process.cwd());
  const callsPath = ledgerPath(normalizedRoot,
    options.callsLedgerPath ?? SOUND_SEEKERS_V2_CALLS_LEDGER,
    SOUND_SEEKERS_V2_CALLS_LEDGER);
  const preparationPath = ledgerPath(normalizedRoot,
    options.preparationLedgerPath ?? SOUND_SEEKERS_V2_PREPARATION_LEDGER,
    SOUND_SEEKERS_V2_PREPARATION_LEDGER);
  const callsBytesBefore = await fs.readFile(callsPath);
  const callsLedger = JSON.parse(callsBytesBefore.toString("utf8"));
  validateCallsLedger(callsLedger, { root: normalizedRoot });
  const ledger = await readJsonFile(preparationPath, "preparation ledger");
  validatePreparationLedger(ledger, { root: normalizedRoot, callsLedger });
  const next = structuredClone(ledger);
  const result = await mutate(next, callsLedger, normalizedRoot);
  validatePreparationLedger(next, { root: normalizedRoot, callsLedger });
  await writeJsonDurably(preparationPath, next);
  if (!(await fs.readFile(callsPath)).equals(callsBytesBefore)) {
    throw new TypeError("preparation work may not mutate the call ledger");
  }
  return { ledger: next, result };
}

async function synchronizePreparationEntry(options, chapterId) {
  const index = SOUND_SEEKERS_V2_BACKGROUND_ORDER.indexOf(chapterId);
  if (index < 0) throw new TypeError("chapter is not in canonical Task 5 order");
  const current = readPreparationLedger(options);
  if (current.entries[index].stage !== "awaiting_call") return current;
  const outcome = await mutatePreparationLedger(options,
    async (ledger, callsLedger, root) => {
      const entry = ledger.entries[index];
      const callEntry = callsLedger.entries[index];
      if (!["succeeded", "failed", "unknown"].includes(callEntry.state)) {
        throw new TypeError(`${chapterId} call is not terminal`);
      }
      const receiptSha256 = sha256Canonical(callEntry);
      if (entry.terminalCallEntrySha256 !== null
        && entry.terminalCallEntrySha256 !== receiptSha256) {
        throw new TypeError(`${chapterId} terminal receipt hash is stale`);
      }
      entry.terminalCallEntrySha256 = receiptSha256;
      if (callEntry.state === "succeeded") {
        entry.sourceCandidate = await candidateFromSucceededCall(root, callEntry);
        entry.stage = "source_ready";
      } else {
        entry.stage = "rejected";
      }
    });
  return outcome.ledger;
}

export async function recordAgentInspection({
  root = process.cwd(),
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER,
  preparationLedgerPath = SOUND_SEEKERS_V2_PREPARATION_LEDGER,
  chapterId,
  scope,
  inspection,
  ...unknown
} = {}) {
  rejectWriterInjection(unknown);
  if (Object.keys(unknown).length > 0) {
    throw new TypeError(`unknown inspection option: ${Object.keys(unknown)[0]}`);
  }
  if (!SOUND_SEEKERS_V2_BACKGROUND_ORDER.includes(chapterId)
    || !["source", "final"].includes(scope)) {
    throw new TypeError("inspection needs a canonical chapter and source/final scope");
  }
  const options = { root, callsLedgerPath, preparationLedgerPath };
  if (scope === "source") await synchronizePreparationEntry(options, chapterId);
  const index = SOUND_SEEKERS_V2_BACKGROUND_ORDER.indexOf(chapterId);
  const outcome = await mutatePreparationLedger(options, ledger => {
    const entry = ledger.entries[index];
    const candidate = scope === "source" ? entry.sourceCandidate : entry.preparedCandidate;
    const requiredStage = scope === "source" ? "source_ready" : "prepared";
    if (entry.stage !== requiredStage || !candidate) {
      throw new TypeError(`${chapterId} ${scope} candidate is not ready for inspection`);
    }
    validateInspection(inspection, scope, candidate.sha256,
      `${chapterId} ${scope} inspection`);
    entry.agentInspection[scope] = structuredClone(inspection);
    if (inspection.decision === "accepted") {
      entry.stage = scope === "source" ? "source_accepted" : "final_accepted";
    } else {
      entry.stage = "rejected";
    }
  });
  return outcome.ledger;
}

function sourceCrop(sourceCandidate, kit) {
  const scale = Math.floor(Math.min(
    sourceCandidate.width / 16,
    sourceCandidate.height / 9
  ));
  const width = 16 * scale;
  const height = 9 * scale;
  if (width < 1536 || height < 864) {
    throw new TypeError(`${kit.id} source is too small for a 1536x864 crop`);
  }
  const [fx, fy] = kit.background.cropProfiles.landscape.focalPoint;
  const left = Math.max(0, Math.min(
    Math.round((fx * sourceCandidate.width) - (width / 2)),
    sourceCandidate.width - width
  ));
  const top = Math.max(0, Math.min(
    Math.round((fy * sourceCandidate.height) - (height / 2)),
    sourceCandidate.height - height
  ));
  return { left, top, width, height, anchorProfile: "landscape" };
}

function transformRecord(crop, finalSha256) {
  return {
    orientation: "auto",
    crop,
    resize: {
      width: 1536,
      height: 864,
      kernel: "lanczos3",
      withoutEnlargement: true
    },
    encode: {
      format: "webp",
      quality: 82,
      effort: 6,
      smartSubsample: true,
      metadata: "stripped",
      colourspace: "srgb",
      sharpVersion: sharp.versions.sharp,
      libvipsVersion: sharp.versions.vips,
      doubleEncodeSha256: finalSha256
    }
  };
}

async function encodePrepared(bytes, crop) {
  return sharp(bytes, { animated: false, failOn: "error" })
    .rotate()
    .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
    .resize(1536, 864, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: true
    })
    .toColourspace("srgb")
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toBuffer();
}

async function assertSourceTransformInput(root, entry) {
  const candidate = entry.sourceCandidate;
  if (!candidate) throw new TypeError(`${entry.chapterId} has no source candidate`);
  const absolute = path.resolve(root, candidate.path);
  const sourceRoot = path.join(root, SOUND_SEEKERS_V2_SOURCE_CANDIDATE_ROOT);
  assertStrictDescendant(sourceRoot, absolute, "source candidate");
  const stat = await assertRegularFile(absolute, "source candidate");
  const bytes = await fs.readFile(absolute);
  if (stat.size !== candidate.byteLength || sha256Bytes(bytes) !== candidate.sha256) {
    throw new TypeError(`${entry.chapterId} source candidate bytes drifted`);
  }
  const metadata = await sharp(bytes, { animated: true, failOn: "error" }).metadata();
  const pages = metadata.pages ?? 1;
  const orientedWidth = metadata.autoOrient?.width
    ?? ([5, 6, 7, 8].includes(metadata.orientation) ? metadata.height : metadata.width);
  const orientedHeight = metadata.autoOrient?.height
    ?? ([5, 6, 7, 8].includes(metadata.orientation) ? metadata.width : metadata.height);
  const format = metadata.format === "jpg" ? "jpeg" : metadata.format;
  if (format !== candidate.format || orientedWidth !== candidate.width
    || orientedHeight !== candidate.height || pages !== 1 || metadata.hasAlpha === true) {
    throw new TypeError(`${entry.chapterId} source must be opaque, single-frame, and hash-bound`);
  }
  return bytes;
}

async function assertPreparedOutput(bytes, chapterId) {
  if (!magicMatches(bytes, "webp")) {
    throw new TypeError(`${chapterId} prepared output is not WebP`);
  }
  const metadata = await sharp(bytes, { animated: true, failOn: "error" }).metadata();
  if (metadata.format !== "webp" || metadata.width !== 1536 || metadata.height !== 864
    || (metadata.pages ?? 1) !== 1 || metadata.hasAlpha === true
    || metadata.space !== "srgb"
    || [metadata.exif, metadata.icc, metadata.iptc, metadata.xmp].some(Boolean)) {
    throw new TypeError(`${chapterId} prepared output failed its raster contract`);
  }
}

export async function prepareBackground({
  root = process.cwd(),
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER,
  preparationLedgerPath = SOUND_SEEKERS_V2_PREPARATION_LEDGER,
  chapterId,
  now,
  ...unknown
} = {}) {
  void now;
  rejectWriterInjection(unknown);
  if (Object.keys(unknown).length > 0) {
    throw new TypeError(`unknown prepare option: ${Object.keys(unknown)[0]}`);
  }
  const normalizedRoot = normalizeRoot(root);
  if (!SOUND_SEEKERS_V2_BACKGROUND_ORDER.includes(chapterId)) {
    throw new TypeError("prepare requires a canonical chapter");
  }
  const options = {
    root: normalizedRoot,
    callsLedgerPath,
    preparationLedgerPath
  };
  const index = SOUND_SEEKERS_V2_BACKGROUND_ORDER.indexOf(chapterId);
  const before = readPreparationLedger(options);
  const entry = before.entries[index];
  if (entry.stage !== "source_accepted"
    || entry.agentInspection.source?.decision !== "accepted") {
    throw new TypeError(`${chapterId} source inspection is not accepted`);
  }
  const bytes = await assertSourceTransformInput(normalizedRoot, entry);
  const crop = sourceCrop(entry.sourceCandidate, SOUND_SEEKERS_BIOME_KITS[index]);
  const firstBytes = await encodePrepared(bytes, crop);
  const secondBytes = await encodePrepared(bytes, crop);
  const firstHash = sha256Bytes(firstBytes);
  const secondHash = sha256Bytes(secondBytes);
  if (firstHash !== secondHash || !firstBytes.equals(secondBytes)) {
    throw new TypeError(`${chapterId} double encode was not byte-identical`);
  }
  await assertPreparedOutput(firstBytes, chapterId);
  const preparedRoot = path.join(normalizedRoot,
    SOUND_SEEKERS_V2_PREPARED_CANDIDATE_ROOT, chapterId);
  const firstPath = path.join(preparedRoot, "background.webp");
  const secondPath = path.join(preparedRoot, "background.double.webp");
  assertStrictDescendant(path.join(normalizedRoot,
    SOUND_SEEKERS_V2_PREPARED_CANDIDATE_ROOT), firstPath, "prepared candidate");
  await writeBytesDurably(firstPath, firstBytes, { refuseExisting: true });
  await writeBytesDurably(secondPath, secondBytes, { refuseExisting: true });
  const verified = await fs.readFile(firstPath);
  if (sha256Bytes(verified) !== firstHash) {
    throw new TypeError(`${chapterId} prepared candidate changed after durable write`);
  }
  const preparedCandidate = {
    path: rootRelative(normalizedRoot, firstPath),
    format: "webp",
    width: 1536,
    height: 864,
    byteLength: verified.length,
    sha256: firstHash
  };
  const outcome = await mutatePreparationLedger(options, ledger => {
    const mutable = ledger.entries[index];
    if (mutable.stage !== "source_accepted"
      || mutable.sourceCandidate.sha256 !== entry.sourceCandidate.sha256) {
      throw new TypeError(`${chapterId} preparation state changed during transform`);
    }
    mutable.preparedCandidate = preparedCandidate;
    mutable.stage = "prepared";
  });
  return {
    ledger: outcome.ledger,
    transform: transformRecord(crop, firstHash)
  };
}

function cropProjectionForEntry(manifest, entryIndex) {
  const panels = manifest.panels.slice(entryIndex * 3, (entryIndex + 1) * 3);
  if (panels.length !== 3) throw new TypeError("crop manifest is incomplete");
  return panels.map((panel, profileIndex) => {
    const profileId = SOUND_SEEKERS_V2_PROFILE_ORDER[profileIndex];
    if (panel.profileId !== profileId) {
      throw new TypeError("crop profiles are out of canonical order");
    }
    return {
      id: profileId,
      targetSize: [...panel.targetSize],
      focalPoint: [...panel.focalPoint],
      quietZone: { ...panel.quietZone },
      retainedRect: { ...panel.retainedRect },
      panelSha256: panel.panelSha256,
      quietZoneRetained: true
    };
  });
}

function validateCropProjection(value, entry, index) {
  if (value === null) return;
  assertExactKeys(value, [
    "inspectedAt", "method", "decision", "manifestSha256", "profiles"
  ], `${entry.chapterId} cropReview`);
  assertUtc(value.inspectedAt, `${entry.chapterId} cropReview.inspectedAt`);
  if (value.method !== "view_image:original-crops" || value.decision !== "accepted") {
    throw new TypeError(`${entry.chapterId} crop review is not accepted`);
  }
  assertHash(value.manifestSha256, `${entry.chapterId} crop manifest hash`);
  assertDenseArray(value.profiles, 3, `${entry.chapterId} crop profiles`);
  const kit = SOUND_SEEKERS_BIOME_KITS[index];
  for (const [profileIndex, profile] of value.profiles.entries()) {
    const profileId = SOUND_SEEKERS_V2_PROFILE_ORDER[profileIndex];
    const task4 = kit.background.cropProfiles[profileId];
    assertExactKeys(profile, [
      "id", "targetSize", "focalPoint", "quietZone", "retainedRect",
      "panelSha256", "quietZoneRetained"
    ], `${entry.chapterId} ${profileId} crop profile`);
    if (profile.id !== profileId || !same(profile.targetSize, task4.targetSize)
      || !same(profile.focalPoint, task4.focalPoint)
      || !same(profile.quietZone, task4.quietZone)
      || profile.quietZoneRetained !== true) {
      throw new TypeError(`${entry.chapterId} ${profileId} crop projection drifted`);
    }
    assertHash(profile.panelSha256, `${entry.chapterId} ${profileId} panelSha256`);
  }
}

export async function recordCropReview({
  root = process.cwd(),
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER,
  preparationLedgerPath = SOUND_SEEKERS_V2_PREPARATION_LEDGER,
  manifestPath = `${SOUND_SEEKERS_V2_CROP_REVIEW_ROOT}/manifest.json`,
  now,
  ...unknown
} = {}) {
  rejectWriterInjection(unknown);
  if (Object.keys(unknown).length > 0) {
    throw new TypeError(`unknown crop-review option: ${Object.keys(unknown)[0]}`);
  }
  const normalizedRoot = normalizeRoot(root);
  const resolvedManifest = canonicalPathWithExistingAncestor(
    path.resolve(normalizedRoot, manifestPath)
  );
  const cropRoot = canonicalPathWithExistingAncestor(
    path.join(normalizedRoot, SOUND_SEEKERS_V2_CROP_REVIEW_ROOT)
  );
  assertStrictDescendant(cropRoot, resolvedManifest, "crop-review manifest");
  const {
    readSoundSeekersV2CropReviewManifest
  } = await import("./buildSoundSeekersV2CropReview.mjs");
  const manifest = readSoundSeekersV2CropReviewManifest({
    root: normalizedRoot,
    manifestPath: resolvedManifest,
    kits: SOUND_SEEKERS_BIOME_KITS
  });
  const manifestSha256 = sha256Canonical(manifest);
  const inspectedAt = resolveNow(now);
  const options = { root: normalizedRoot, callsLedgerPath, preparationLedgerPath };
  const outcome = await mutatePreparationLedger(options, ledger => {
    for (const [index, entry] of ledger.entries.entries()) {
      if (entry.stage !== "final_accepted"
        || entry.agentInspection.source?.decision !== "accepted"
        || entry.agentInspection.final?.decision !== "accepted") {
        throw new TypeError(`${entry.chapterId} is not ready for crop acceptance`);
      }
      const panels = manifest.panels.slice(index * 3, (index + 1) * 3);
      if (panels.some(panel => panel.chapterId !== entry.chapterId
        || panel.sourceSha256 !== entry.sourceCandidate.sha256
        || panel.finalSha256 !== entry.preparedCandidate.sha256)) {
        throw new TypeError(`${entry.chapterId} crop review is stale`);
      }
    }
    for (const [index, entry] of ledger.entries.entries()) {
      entry.cropReview = {
        inspectedAt,
        method: "view_image:original-crops",
        decision: "accepted",
        manifestSha256,
        profiles: cropProjectionForEntry(manifest, index)
      };
      entry.stage = "crop_accepted";
    }
  });
  return outcome.ledger;
}

function buildSourceManifest(callsLedger, preparationLedger) {
  const assets = SOUND_SEEKERS_BIOME_KITS.map((kit, index) => {
    const call = callsLedger.entries[index];
    const preparation = preparationLedger.entries[index];
    if (call.state !== "succeeded" || preparation.stage !== "crop_accepted"
      || preparation.terminalCallEntrySha256 !== sha256Canonical(call)
      || preparation.humanReviews.crop !== null
      || preparation.humanReviews.semantic !== null) {
      throw new TypeError(`${kit.id} is not ready for finalization`);
    }
    const source = preparation.sourceCandidate;
    const final = preparation.preparedCandidate;
    const crop = sourceCrop(source, kit);
    const sourceInspection = preparation.agentInspection.source;
    const finalInspection = preparation.agentInspection.final;
    if (sourceInspection.decision !== "accepted"
      || finalInspection.decision !== "accepted"
      || !same(sourceInspection.checks, finalInspection.checks)) {
      throw new TypeError(`${kit.id} inspections do not form one accepted record`);
    }
    return {
      id: kit.background.provenanceId,
      chapterId: kit.id,
      path: kit.background.src,
      task4: {
        briefSha256: task4BriefSha256(kit),
        styleId: kit.backgroundGenerationBrief.styleId,
        requiredBackdropElements: [...kit.backgroundGenerationBrief.requiredBackdropElements],
        backdropReviewSemanticIds: [...kit.backdropReviewSemanticIds],
        forbiddenSemanticIds: [...kit.backgroundGenerationBrief.forbiddenSemanticIds]
      },
      generation: {
        mode: "builtin_image_gen",
        tool: "image_gen.imagegen",
        callOrdinal: call.ordinal,
        requestedAt: call.requestedAt,
        completedAt: call.completedAt,
        prompt: buildSoundSeekersV2BackgroundPrompt(kit),
        promptSha256: call.promptSha256,
        resultMetadata: structuredClone(call.resultMetadata),
        resultMetadataSha256: call.resultMetadataSha256
      },
      source: {
        format: source.format,
        width: source.width,
        height: source.height,
        sha256: source.sha256
      },
      transform: transformRecord(crop, final.sha256),
      final: {
        format: "webp",
        width: 1536,
        height: 864,
        byteLength: final.byteLength,
        sha256: final.sha256,
        opaque: true,
        pages: 1
      },
      agentInspection: {
        sourceSha256: source.sha256,
        finalSha256: final.sha256,
        inspectedAt: {
          source: sourceInspection.inspectedAt,
          final: finalInspection.inspectedAt,
          crops: preparation.cropReview.inspectedAt
        },
        methods: [
          "view_image:original-source",
          "view_image:original-final",
          "view_image:original-crops"
        ],
        decision: "accepted",
        checks: {
          ...sourceInspection.checks,
          profileQuietZones: "retained"
        }
      },
      cropReview: {
        manifestSha256: preparation.cropReview.manifestSha256,
        profiles: structuredClone(preparation.cropReview.profiles)
      },
      humanReviews: { crop: null, semantic: null }
    };
  });
  const manifest = {
    schemaVersion: 2,
    project: "LiteracyPath Sound Seekers v2",
    generatorContract: "task4-immutable-background-brief-v1",
    assets
  };
  assertSoundSeekersV2AssetManifest(manifest, SOUND_SEEKERS_BIOME_KITS);
  return manifest;
}

function sourceDocument(manifest) {
  return [
    "# Sound Seekers v2 biome background provenance",
    "",
    "These eight candidate backdrops were generated from the immutable Task 4 biome briefs, inspected by the agent at original resolution, transformed deterministically, and crop-reviewed mechanically. Human crop and semantic reviews remain unclaimed.",
    "",
    "```json",
    JSON.stringify(manifest, null, 2),
    "```",
    ""
  ].join("\n");
}

async function verifyPreparedCandidate(root, entry) {
  const candidate = entry.preparedCandidate;
  const absolute = path.resolve(root, candidate.path);
  const preparedRoot = path.join(root, SOUND_SEEKERS_V2_PREPARED_CANDIDATE_ROOT);
  assertStrictDescendant(preparedRoot, absolute, "prepared candidate");
  const stat = await assertRegularFile(absolute, "prepared candidate");
  const bytes = await fs.readFile(absolute);
  if (stat.size !== candidate.byteLength || sha256Bytes(bytes) !== candidate.sha256) {
    throw new TypeError(`${entry.chapterId} prepared candidate bytes drifted`);
  }
  await assertPreparedOutput(bytes, entry.chapterId);
  const doublePath = path.join(path.dirname(absolute), "background.double.webp");
  await assertRegularFile(doublePath, "second deterministic encode");
  if (sha256Bytes(await fs.readFile(doublePath)) !== candidate.sha256) {
    throw new TypeError(`${entry.chapterId} second deterministic encode drifted`);
  }
  return bytes;
}

export async function finalizeSoundSeekersV2Assets({
  root = process.cwd(),
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER,
  preparationLedgerPath = SOUND_SEEKERS_V2_PREPARATION_LEDGER,
  publicRoot = SOUND_SEEKERS_V2_PUBLIC_ROOT,
  ...unknown
} = {}) {
  rejectWriterInjection(unknown);
  if (Object.keys(unknown).length > 0) {
    throw new TypeError(`unknown finalize option: ${Object.keys(unknown)[0]}`);
  }
  const normalizedRoot = normalizeRoot(root);
  const destination = canonicalPathWithExistingAncestor(
    path.resolve(normalizedRoot, publicRoot)
  );
  const expectedDestination = path.join(normalizedRoot, SOUND_SEEKERS_V2_PUBLIC_ROOT);
  if (destination !== expectedDestination) {
    throw new TypeError("finalization destination must be the exact public v2 root");
  }
  if (await lstatOrNull(destination)) {
    throw new TypeError("public Sound Seekers v2 root already exists");
  }
  const callsLedger = readCallsLedger({ root: normalizedRoot, callsLedgerPath });
  const preparationLedger = readPreparationLedger({
    root: normalizedRoot,
    callsLedgerPath,
    preparationLedgerPath
  });
  const manifest = buildSourceManifest(callsLedger, preparationLedger);
  const parent = path.dirname(destination);
  await fs.mkdir(parent, { recursive: true });
  const stage = path.join(parent, `.v2-staging-${callsLedger.runId}`);
  assertStrictDescendant(parent, stage, "finalization staging directory");
  if (await lstatOrNull(stage)) {
    throw new TypeError("finalization staging directory already exists");
  }
  let stageCreated = false;
  try {
    await fs.mkdir(stage, { mode: 0o700 });
    stageCreated = true;
    for (const [index, kit] of SOUND_SEEKERS_BIOME_KITS.entries()) {
      const bytes = await verifyPreparedCandidate(normalizedRoot,
        preparationLedger.entries[index]);
      const relative = kit.background.src.replace(/^\/game-assets\/sound-seekers\/v2\//u, "");
      if (relative === kit.background.src) {
        throw new TypeError(`${kit.id} public path is outside the v2 root`);
      }
      const output = path.join(stage, relative);
      assertStrictDescendant(stage, output, "staged public asset");
      await writeBytesDurably(output, bytes, { refuseExisting: true });
    }
    await writeBytesDurably(path.join(stage, "SOURCE.md"),
      Buffer.from(sourceDocument(manifest), "utf8"), { refuseExisting: true });
    const { assertSoundSeekersV2AssetTree } = await import("./checkSoundSeekersV2Assets.mjs");
    await assertSoundSeekersV2AssetTree({
      assetRoot: stage,
      kits: SOUND_SEEKERS_BIOME_KITS
    });
    await fs.rename(stage, destination);
    await fsyncDirectory(parent);
    stageCreated = false;
    return { manifest, publicRoot: destination };
  } catch (error) {
    if (stageCreated) await fs.rm(stage, { recursive: true, force: true });
    throw error;
  }
}

async function walkCandidateFiles(candidateRoot) {
  const stat = await lstatOrNull(candidateRoot);
  if (!stat) return { files: [], directories: [] };
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new TypeError(`${candidateRoot} must be a non-symlink directory`);
  }
  const files = [];
  const directories = [candidateRoot];
  async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new TypeError(`cleanup refuses symlink ${absolute}`);
      }
      if (entry.isDirectory()) {
        directories.push(absolute);
        await visit(absolute);
      } else if (entry.isFile()) {
        files.push(absolute);
      } else {
        throw new TypeError(`cleanup refuses non-regular candidate ${absolute}`);
      }
    }
  }
  await visit(candidateRoot);
  return { files, directories };
}

function expectedCropPanelNames() {
  return new Set(SOUND_SEEKERS_V2_BIOME_PANEL_NAMES());
}

function SOUND_SEEKERS_V2_BIOME_PANEL_NAMES() {
  return SOUND_SEEKERS_V2_BACKGROUND_ORDER.flatMap((chapterId, index) =>
    SOUND_SEEKERS_V2_PROFILE_ORDER.map(profileId =>
      `${String(index + 1).padStart(2, "0")}-${chapterId}--${profileId}--crop-review.png`));
}

async function assertCleanupInventory({ root, callsLedger, preparationLedger }) {
  const sourceRoot = path.join(root, SOUND_SEEKERS_V2_SOURCE_CANDIDATE_ROOT);
  const preparedRoot = path.join(root, SOUND_SEEKERS_V2_PREPARED_CANDIDATE_ROOT);
  const cropRoot = path.join(root, SOUND_SEEKERS_V2_CROP_REVIEW_ROOT);
  const sourceWalk = await walkCandidateFiles(sourceRoot);
  const preparedWalk = await walkCandidateFiles(preparedRoot);
  const cropWalk = await walkCandidateFiles(cropRoot);
  const allowedSource = new Set();
  for (const call of callsLedger.entries) {
    if (call.sourcePath !== null) {
      allowedSource.add(path.resolve(root, call.sourcePath));
    } else if (call.state === "unknown") {
      for (const extension of Object.values(SOURCE_EXTENSIONS)) {
        allowedSource.add(path.join(sourceRoot, `${call.chapterId}.${extension}`));
      }
    }
  }
  for (const file of sourceWalk.files) {
    if (!allowedSource.has(file)) {
      throw new TypeError(`cleanup found undeclared source candidate ${file}`);
    }
    const call = callsLedger.entries.find(item => item.sourcePath !== null
      && path.resolve(root, item.sourcePath) === file);
    if (call && sha256Bytes(await fs.readFile(file)) !== call.sourceSha256) {
      throw new TypeError(`${call.chapterId} source candidate changed before cleanup`);
    }
  }
  const allowedPrepared = new Set();
  for (const chapterId of SOUND_SEEKERS_V2_BACKGROUND_ORDER) {
    allowedPrepared.add(path.join(preparedRoot, chapterId, "background.webp"));
    allowedPrepared.add(path.join(preparedRoot, chapterId, "background.double.webp"));
  }
  for (const file of preparedWalk.files) {
    if (!allowedPrepared.has(file)) {
      throw new TypeError(`cleanup found undeclared prepared candidate ${file}`);
    }
  }
  for (const entry of preparationLedger.entries) {
    if (!entry.preparedCandidate) continue;
    const first = path.resolve(root, entry.preparedCandidate.path);
    const second = path.join(path.dirname(first), "background.double.webp");
    for (const file of [first, second]) {
      if (!preparedWalk.files.includes(file)
        || sha256Bytes(await fs.readFile(file)) !== entry.preparedCandidate.sha256) {
        throw new TypeError(`${entry.chapterId} prepared candidate changed before cleanup`);
      }
    }
  }
  const allowedCrop = expectedCropPanelNames();
  allowedCrop.add("manifest.json");
  for (const file of cropWalk.files) {
    if (!allowedCrop.has(path.basename(file)) || path.dirname(file) !== cropRoot) {
      throw new TypeError(`cleanup found undeclared crop-review candidate ${file}`);
    }
  }
  const cropManifestPath = path.join(cropRoot, "manifest.json");
  if (cropWalk.files.includes(cropManifestPath)) {
    const { readSoundSeekersV2CropReviewManifest } = await import(
      "./buildSoundSeekersV2CropReview.mjs"
    );
    readSoundSeekersV2CropReviewManifest({
      root,
      manifestPath: cropManifestPath,
      kits: SOUND_SEEKERS_BIOME_KITS
    });
  }
  return {
    files: [...sourceWalk.files, ...preparedWalk.files, ...cropWalk.files],
    directories: [
      ...sourceWalk.directories,
      ...preparedWalk.directories,
      ...cropWalk.directories
    ]
  };
}

export async function cleanupCandidates({
  root = process.cwd(),
  callsLedgerPath = SOUND_SEEKERS_V2_CALLS_LEDGER,
  preparationLedgerPath = SOUND_SEEKERS_V2_PREPARATION_LEDGER,
  expectPublic,
  now,
  ...unknown
} = {}) {
  rejectWriterInjection(unknown);
  if (Object.keys(unknown).length > 0) {
    throw new TypeError(`unknown cleanup option: ${Object.keys(unknown)[0]}`);
  }
  if (!["absent", "complete"].includes(expectPublic)) {
    throw new TypeError("cleanup requires expectPublic absent or complete");
  }
  const normalizedRoot = normalizeRoot(root);
  const options = { root: normalizedRoot, callsLedgerPath, preparationLedgerPath };
  const callsLedger = readCallsLedger(options);
  let preparationLedger = readPreparationLedger(options);
  for (const call of callsLedger.entries) {
    const entry = preparationLedger.entries[call.ordinal - 1];
    if (["succeeded", "failed", "unknown"].includes(call.state)
      && entry.terminalCallEntrySha256 === null) {
      preparationLedger = await synchronizePreparationEntry(options, call.chapterId);
    }
  }
  const publicRoot = path.join(normalizedRoot, SOUND_SEEKERS_V2_PUBLIC_ROOT);
  const publicStat = await lstatOrNull(publicRoot);
  if (expectPublic === "absent") {
    if (publicStat) throw new TypeError("cleanup expected the public v2 root to be absent");
  } else {
    const { assertSoundSeekersV2Assets } = await import("./checkSoundSeekersV2Assets.mjs");
    await assertSoundSeekersV2Assets({
      root: normalizedRoot,
      kits: SOUND_SEEKERS_BIOME_KITS
    });
  }
  const inventory = await assertCleanupInventory({
    root: normalizedRoot,
    callsLedger,
    preparationLedger
  });
  const removed = inventory.files
    .map(file => rootRelative(normalizedRoot, file))
    .sort();
  for (const file of inventory.files) await fs.unlink(file);
  for (const directory of inventory.directories
    .toSorted((left, right) => right.length - left.length)) {
    await fs.rmdir(directory).catch(error => {
      if (!error || !["ENOENT", "ENOTEMPTY"].includes(error.code)) throw error;
    });
  }
  const completedAt = resolveNow(now);
  const outcome = await mutatePreparationLedger(options, ledger => {
    for (const entry of ledger.entries) {
      if (entry.terminalCallEntrySha256 === null) continue;
      const chapterPaths = removed.filter(candidate =>
        candidate.includes(`/${entry.chapterId}.`)
        || candidate.includes(`/${entry.chapterId}/`)
        || candidate.includes(`-${entry.chapterId}--`));
      if (entry.ordinal === 1 && removed.includes(
        `${SOUND_SEEKERS_V2_CROP_REVIEW_ROOT}/manifest.json`
      )) {
        chapterPaths.push(`${SOUND_SEEKERS_V2_CROP_REVIEW_ROOT}/manifest.json`);
      }
      entry.cleanup = {
        completedAt,
        removedCandidatePaths: chapterPaths.toSorted()
      };
      entry.stage = "cleaned";
    }
  });
  return { ledger: outcome.ledger, removedCandidatePaths: removed };
}

const CLI_MODES = Object.freeze([
  "--init-calls-ledger",
  "--resume-calls-ledger",
  "--reserve-call",
  "--capture-call-result",
  "--record-call-failure",
  "--init-preparation-ledger",
  "--record-agent-inspection",
  "--prepare",
  "--record-crop-review",
  "--finalize",
  "--cleanup-candidates"
]);

const CLI_VALUE_FLAGS = Object.freeze([
  "--calls-ledger",
  "--preparation-ledger",
  "--ordinal",
  "--chapter",
  "--scope",
  "--code",
  "--manifest",
  "--expect-public"
]);

const CLI_ALLOWED_BY_MODE = Object.freeze({
  "--init-calls-ledger": ["--calls-ledger"],
  "--resume-calls-ledger": ["--calls-ledger"],
  "--reserve-call": ["--ordinal", "--calls-ledger"],
  "--capture-call-result": ["--ordinal", "--calls-ledger"],
  "--record-call-failure": ["--ordinal", "--code", "--calls-ledger"],
  "--init-preparation-ledger": ["--calls-ledger", "--preparation-ledger"],
  "--record-agent-inspection": ["--chapter", "--scope", "--preparation-ledger"],
  "--prepare": ["--chapter", "--calls-ledger", "--preparation-ledger"],
  "--record-crop-review": ["--manifest", "--preparation-ledger"],
  "--finalize": ["--calls-ledger", "--preparation-ledger"],
  "--cleanup-candidates": [
    "--calls-ledger", "--preparation-ledger", "--expect-public"
  ]
});

function parseCliArguments(argv) {
  if (!Array.isArray(argv) || argv.length === 0) {
    throw new TypeError("one exact Task 5 mode is required");
  }
  const modes = argv.filter(argument => CLI_MODES.includes(argument));
  if (modes.length !== 1) {
    throw new TypeError("exactly one Task 5 mode is required");
  }
  const mode = modes[0];
  const values = {};
  const seen = new Set([mode]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === mode) continue;
    if (CLI_MODES.includes(argument)) {
      throw new TypeError("Task 5 modes cannot be combined");
    }
    if (!CLI_VALUE_FLAGS.includes(argument)
      || !CLI_ALLOWED_BY_MODE[mode].includes(argument) || seen.has(argument)) {
      throw new TypeError(`unknown or repeated argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      throw new TypeError(`${argument} requires one value`);
    }
    values[argument] = value;
    seen.add(argument);
    index += 1;
  }
  for (const required of CLI_ALLOWED_BY_MODE[mode]) {
    if (!Object.hasOwn(values, required)) {
      throw new TypeError(`${mode} requires ${required}`);
    }
  }
  return { mode, values };
}

async function readStrictStdinJson() {
  const chunks = [];
  let byteLength = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk);
    byteLength += bytes.length;
    if (byteLength > 128 * 1024 * 1024) {
      throw new TypeError("stdin JSON exceeds the bounded capture limit");
    }
    chunks.push(bytes);
  }
  if (byteLength === 0) throw new TypeError("stdin must contain one JSON object");
  let value;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new TypeError("stdin must contain one valid JSON object");
  }
  if (!isPlainObject(value)) throw new TypeError("stdin must contain one JSON object");
  return value;
}

function cliPaths(values) {
  return {
    ...(values["--calls-ledger"]
      ? { callsLedgerPath: values["--calls-ledger"] } : {}),
    ...(values["--preparation-ledger"]
      ? { preparationLedgerPath: values["--preparation-ledger"] } : {})
  };
}

function cliOrdinal(values) {
  if (!/^\d+$/u.test(values["--ordinal"] ?? "")) {
    throw new TypeError("--ordinal must be an integer from 1 through 8");
  }
  return Number(values["--ordinal"]);
}

async function main(argv = process.argv.slice(2)) {
  const { mode, values } = parseCliArguments(argv);
  const paths = cliPaths(values);
  let result;
  if (mode === "--init-calls-ledger") {
    result = await initCallsLedger(paths);
  } else if (mode === "--resume-calls-ledger") {
    result = await resumeCallsLedger(paths);
  } else if (mode === "--reserve-call") {
    result = await reserveCall({ ...paths, ordinal: cliOrdinal(values) });
  } else if (mode === "--capture-call-result") {
    const ordinal = cliOrdinal(values);
    let capture;
    try {
      capture = await readStrictStdinJson();
    } catch (error) {
      await recordCallFailure({
        ...paths,
        ordinal,
        code: "RESULT_SCHEMA_INVALID"
      });
      throw error;
    }
    result = await captureCallResult({ ...paths, ordinal, result: capture });
  } else if (mode === "--record-call-failure") {
    result = await recordCallFailure({
      ...paths,
      ordinal: cliOrdinal(values),
      code: values["--code"]
    });
  } else if (mode === "--init-preparation-ledger") {
    result = await initPreparationLedger(paths);
  } else if (mode === "--record-agent-inspection") {
    result = await recordAgentInspection({
      ...paths,
      chapterId: values["--chapter"],
      scope: values["--scope"],
      inspection: await readStrictStdinJson()
    });
  } else if (mode === "--prepare") {
    result = await prepareBackground({
      ...paths,
      chapterId: values["--chapter"]
    });
  } else if (mode === "--record-crop-review") {
    result = await recordCropReview({
      ...paths,
      manifestPath: values["--manifest"]
    });
  } else if (mode === "--finalize") {
    result = await finalizeSoundSeekersV2Assets(paths);
  } else {
    result = await cleanupCandidates({
      ...paths,
      expectPublic: values["--expect-public"]
    });
  }
  const callsLedger = result?.entries ? result
    : result?.ledger?.entries ? result.ledger : null;
  const safeSummary = {
    mode: mode.slice(2),
    ...(callsLedger?.runId ? { runId: callsLedger.runId } : {}),
    ...(callsLedger ? {
      states: callsLedger.entries.map(entry => entry.state ?? entry.stage)
    } : {}),
    ...(mode === "--resume-calls-ledger" ? {
      plannedOrdinals: result.entries
        .filter(entry => entry.state === "planned")
        .map(entry => entry.ordinal)
    } : {})
  };
  process.stdout.write(`${JSON.stringify(safeSummary)}\n`);
}

if (process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
