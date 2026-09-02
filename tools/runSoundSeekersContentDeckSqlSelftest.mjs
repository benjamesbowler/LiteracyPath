import { randomBytes as nodeRandomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir as nodeTmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const SOUND_SEEKERS_CONTENT_DECK_SQL_FILES = Object.freeze([
  "supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql",
  "supabase/migrations/20260614090000_progress_forward_merge.sql",
  "supabase/migrations/20260715090000_phonics_quest_merge.sql",
  "supabase/migrations/20260901120000_sound_seekers_learning_v2.sql",
  "supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql",
  "supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql"
]);

const REQUIRED_BINARIES = Object.freeze(["initdb", "pg_ctl", "psql", "createdb", "dropdb"]);
const URL_ENVIRONMENT_KEYS = new Set([
  "SOUND_SEEKERS_LOCAL_POSTGRES_ADMIN_URL",
  "SOUND_SEEKERS_TEST_DATABASE_URL",
  "DATABASE_URL"
]);

function emit(stream, message) {
  if (typeof stream === "function") stream(message);
  else if (stream && typeof stream.write === "function") stream.write(`${message}\n`);
}

function commandResult(binary, args, { env, input } = {}) {
  const result = spawnSync(binary, args, {
    env,
    shell: false,
    ...(typeof input === "string"
      ? { input, encoding: "utf8", stdio: ["pipe", "ignore", "ignore"] }
      : { stdio: "ignore" })
  });
  return { ...result, stdout: "", stderr: "" };
}

function gateError(stage, binary = null, status = null, label = null) {
  const error = new Error(
    `Sound Seekers SQL ${label || stage} failed${binary ? ` (${binary})` : ""}`
  );
  error.name = "SoundSeekersSqlSelftestError";
  error.stage = stage;
  if (binary) error.binary = binary;
  if (Number.isInteger(status)) error.status = status;
  return error;
}

function runChecked(runCommand, binary, args, env, { stage, label = stage, input } = {}) {
  let result;
  try {
    result = runCommand(binary, args, { env, ...(typeof input === "string" ? { input } : {}) });
  } catch {
    throw gateError(stage, binary, null, label);
  }
  if (!result || result.status === null || result.status !== 0) {
    throw gateError(stage, binary, result?.status, label);
  }
  return result;
}

function assertOwnedRoot(root, prefix, dataDirectory, socketDirectory) {
  const resolvedPrefixParent = resolve(dirname(prefix));
  const resolvedRoot = resolve(root);
  if (dirname(resolvedRoot) !== resolvedPrefixParent
    || !/^lp-ss-[A-Za-z0-9_-]+$/u.test(basename(resolvedRoot))) {
    throw gateError("cleanup", null, null, "owned temporary root validation");
  }
  for (const child of [dataDirectory, socketDirectory]) {
    if (dirname(resolve(child)) !== resolvedRoot) {
      throw gateError("cleanup", null, null, "owned temporary descendant validation");
    }
  }
}

export function assertNoSqlSelftestCliArguments(args) {
  if (!Array.isArray(args) || args.length !== 0) {
    throw gateError("arguments", null, null, "caller target arguments are not accepted");
  }
  return true;
}

export function sanitizedPostgresEnvironment(environment = {}) {
  return Object.fromEntries(Object.entries(environment).filter(([key]) =>
    !key.startsWith("PG") && !URL_ENVIRONMENT_KEYS.has(key)));
}

export function runSoundSeekersContentDeckSqlSelftest({
  args = [],
  env = process.env,
  runCommand = commandResult,
  randomBytes = nodeRandomBytes,
  mkdtemp = mkdtempSync,
  mkdir = mkdirSync,
  remove = rmSync,
  tmpdir = nodeTmpdir,
  stdout = process.stdout,
  stderr: _stderr = process.stderr
} = {}) {
  assertNoSqlSelftestCliArguments(args);
  const commandEnvironment = sanitizedPostgresEnvironment(env);

  for (const binary of REQUIRED_BINARIES) {
    let result;
    try {
      result = runCommand(binary, ["--version"], { env: commandEnvironment });
    } catch {
      throw gateError("preflight", binary, null, "PostgreSQL binary probe");
    }
    if (result?.status === null && result?.error?.code === "ENOENT") {
      emit(stdout, "BLOCKED: SQL_DIRECT_GATE_UNAVAILABLE");
      return Object.freeze({ status: "blocked", reason: "SQL_DIRECT_GATE_UNAVAILABLE" });
    }
    if (!result || result.status === null || result.status !== 0) {
      throw gateError("preflight", binary, result?.status, "PostgreSQL binary probe");
    }
  }

  const prefix = join(tmpdir(), "lp-ss-");
  let root;
  try {
    root = mkdtemp(prefix);
  } catch {
    throw gateError("mkdtemp");
  }
  if (root && typeof root.then === "function") {
    throw gateError("mkdtemp", null, null, "synchronous mkdtemp contract");
  }

  const dataDirectory = join(root, "d");
  const socketDirectory = join(root, "s");
  let port;
  let database;
  let startAttempted = false;
  let createAttempted = false;
  let primaryError = null;
  const cleanupFailures = [];

  try {
    assertOwnedRoot(root, prefix, dataDirectory, socketDirectory);
    const portBytes = randomBytes(2);
    if (!Buffer.isBuffer(portBytes) || portBytes.length !== 2) {
      throw gateError("random", null, null, "port entropy");
    }
    port = String(20000 + (portBytes.readUInt16BE(0) % 41000));
    const longestSocketPath = join(socketDirectory, `.s.PGSQL.${port}.lock`);
    if (Buffer.byteLength(longestSocketPath, "utf8") > 103) {
      throw gateError("socket_path", null, null, "socket path exceeds the 103-byte sun_path ceiling");
    }
    const databaseBytes = randomBytes(12);
    if (!Buffer.isBuffer(databaseBytes) || databaseBytes.length !== 12) {
      throw gateError("random", null, null, "database entropy");
    }
    database = `literacypath_sound_seekers_test_${databaseBytes.toString("hex")}`;

    try {
      mkdir(socketDirectory, { recursive: false, mode: 0o700 });
    } catch {
      throw gateError("mkdir");
    }
    runChecked(runCommand, "initdb", [
      "-D", dataDirectory,
      "--auth=trust",
      "--username=postgres",
      "--no-locale",
      "--encoding=UTF8"
    ], commandEnvironment, { stage: "initdb" });

    startAttempted = true;
    runChecked(runCommand, "pg_ctl", [
      "-D", dataDirectory,
      "-w",
      "-o", `-k ${socketDirectory} -p ${port} -c listen_addresses='' -c unix_socket_permissions=0700`,
      "start"
    ], commandEnvironment, { stage: "start" });

    createAttempted = true;
    runChecked(runCommand, "createdb", [
      "-h", socketDirectory,
      "-p", port,
      "-U", "postgres",
      database
    ], commandEnvironment, { stage: "createdb" });

    for (const file of SOUND_SEEKERS_CONTENT_DECK_SQL_FILES) {
      const isSelftest = file === SOUND_SEEKERS_CONTENT_DECK_SQL_FILES.at(-1);
      runChecked(runCommand, "psql", [
        "-X",
        "--set=ON_ERROR_STOP=1",
        "-h", socketDirectory,
        "-p", port,
        "-U", "postgres",
        "-d", database,
        "-f", file
      ], commandEnvironment, {
        stage: isSelftest ? "selftest" : "migration",
        label: basename(file)
      });
    }
  } catch (error) {
    primaryError = error?.name === "SoundSeekersSqlSelftestError"
      ? error
      : gateError("execution");
  } finally {
    const safeCleanup = (stage, operation) => {
      try {
        operation();
      } catch {
        cleanupFailures.push(stage);
      }
    };
    if (createAttempted) {
      safeCleanup("terminate", () => runChecked(runCommand, "psql", [
        "-X",
        "--set=ON_ERROR_STOP=1",
        "-h", socketDirectory,
        "-p", port,
        "-U", "postgres",
        "-d", "postgres",
        `--set=database_name=${database}`,
        "-f", "-"
      ], commandEnvironment, {
        stage: "cleanup",
        label: "terminate",
        input: "select pg_terminate_backend(pid) from pg_stat_activity where datname = :'database_name' and pid <> pg_backend_pid();\n"
      }));
      safeCleanup("drop", () => runChecked(runCommand, "dropdb", [
        "-h", socketDirectory,
        "-p", port,
        "-U", "postgres",
        "--if-exists",
        database
      ], commandEnvironment, { stage: "cleanup", label: "drop" }));
    }
    if (startAttempted) {
      safeCleanup("stop", () => runChecked(runCommand, "pg_ctl", [
        "-D", dataDirectory,
        "-m", "immediate",
        "-w",
        "stop"
      ], commandEnvironment, { stage: "cleanup", label: "stop" }));
    }
    safeCleanup("remove", () => {
      assertOwnedRoot(root, prefix, dataDirectory, socketDirectory);
      const result = remove(root, { recursive: true, force: true });
      if (result && typeof result.then === "function") {
        throw gateError("cleanup", null, null, "synchronous remove contract");
      }
    });
  }

  if (primaryError) {
    if (cleanupFailures.length) primaryError.cleanupStages = Object.freeze([...cleanupFailures]);
    throw primaryError;
  }
  if (cleanupFailures.length) {
    const error = gateError("cleanup");
    error.cleanupStages = Object.freeze([...cleanupFailures]);
    throw error;
  }

  emit(stdout, "PASS: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST");
  return Object.freeze({ status: "passed" });
}

function exitCodeFor(result) {
  if (result?.status === "passed") return 0;
  if (result?.status === "blocked" && result.reason === "SQL_DIRECT_GATE_UNAVAILABLE") return 2;
  return 1;
}

export function soundSeekersContentDeckSqlSelftestMain({
  argv = process.argv,
  env = process.env,
  run = runSoundSeekersContentDeckSqlSelftest,
  stdout = process.stdout,
  stderr = process.stderr
} = {}) {
  try {
    const args = Array.isArray(argv) && argv.length >= 2 ? argv.slice(2) : argv;
    assertNoSqlSelftestCliArguments(args);
    const result = run({ args, env, stdout, stderr });
    if (result && typeof result.then === "function") {
      return result.then(exitCodeFor, () => {
        emit(stderr, "ERROR: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST_FAILED");
        return 1;
      });
    }
    return exitCodeFor(result);
  } catch {
    emit(stderr, "ERROR: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST_FAILED");
    return 1;
  }
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (entryPath && fileURLToPath(import.meta.url) === entryPath) {
  const result = soundSeekersContentDeckSqlSelftestMain();
  if (result && typeof result.then === "function") {
    result.then(code => { process.exitCode = code; });
  } else {
    process.exitCode = result;
  }
}
