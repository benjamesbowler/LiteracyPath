import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";

import {
  SOUND_SEEKERS_CONTENT_DECK_SQL_FILES,
  assertNoSqlSelftestCliArguments,
  runSoundSeekersContentDeckSqlSelftest,
  sanitizedPostgresEnvironment,
  soundSeekersContentDeckSqlSelftestMain
} from "../../tools/runSoundSeekersContentDeckSqlSelftest.mjs";

const EXPECTED_FILES = [
  "supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql",
  "supabase/migrations/20260614090000_progress_forward_merge.sql",
  "supabase/migrations/20260715090000_phonics_quest_merge.sql",
  "supabase/migrations/20260901120000_sound_seekers_learning_v2.sql",
  "supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql",
  "supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql"
];

const POSTGRES_BINARIES = Object.freeze(["initdb", "pg_ctl", "psql", "createdb", "dropdb"]);
const CLEANUP_STAGES = Object.freeze(["terminate", "drop", "stop", "remove"]);
const COMMAND_FAILURE_MODES = Object.freeze(["throw", "status1", "status:null"]);

function failureEntries(value, defaultMode = "throw") {
  if (value instanceof Map) return [...value.entries()];
  if (value instanceof Set) return [...value].map(stage => [stage, defaultMode]);
  if (value && typeof value === "object") return Object.entries(value);
  return [];
}

function commandStage(binary, args) {
  if (args[0] === "--version") return `probe:${binary}`;
  if (binary === "initdb") return "initdb";
  if (binary === "createdb") return "createdb";
  if (binary === "dropdb") return "drop";
  if (binary === "pg_ctl") return args.at(-1) === "start" ? "start" : "stop";
  if (binary === "psql" && args.at(-1) === "-") return "terminate";
  if (binary === "psql") return args.at(-1);
  throw new Error(`unrecognised fixture command: ${binary}`);
}

/**
 * A deterministic, process-free fixture for every ephemeral PostgreSQL lifecycle edge.
 * It is exported only so this test contract can be reviewed or mutation-tested directly.
 */
export function createEphemeralPostgresFailureHarness({
  primaryStage = null,
  failureMode = "throw",
  cleanupFailures = new Set(),
  failures = new Map(),
  missingBinary = null,
  longRoot = false,
  mkdtempResult
} = {}) {
  const secret = "SQL_RUNNER_SECRET_SENTINEL";
  const temporaryDirectory = longRoot ? `/fixture/${"x".repeat(90)}` : "/fixture";
  const root = `${temporaryDirectory}/lp-ss-AbC123`;
  const port = "24660";
  const database = "literacypath_sound_seekers_test_00112233445566778899aabb";
  const failurePlan = new Map(failureEntries(failures));
  if (primaryStage) failurePlan.set(primaryStage, failureMode);
  for (const [stage, mode] of failureEntries(cleanupFailures)) failurePlan.set(stage, mode);

  const calls = [];
  const cleanupStages = [];
  const stdoutMessages = [];
  const stderrMessages = [];
  const capturedErrors = [];
  let removedPath;
  let randomOrdinal = 0;

  const inject = stage => {
    const mode = failurePlan.get(stage);
    if (!mode) return null;
    if (mode === "throw") throw Object.assign(new Error(`${secret}:${stage}`), { code: "EACCES" });
    if (mode === "status1") {
      return { status: 1, stdout: secret, stderr: secret, error: new Error(secret) };
    }
    if (mode === "status:null") {
      return {
        status: null,
        stdout: secret,
        stderr: secret,
        error: Object.assign(new Error(secret), { code: "EACCES" })
      };
    }
    throw new Error(`invalid fixture failure mode: ${mode}`);
  };

  const runCommand = (binary, args, options = {}) => {
    const stage = commandStage(binary, args);
    calls.push(Object.freeze({
      kind: "command",
      stage,
      binary,
      args: Object.freeze([...args]),
      options: Object.freeze({ ...options, env: Object.freeze({ ...(options.env || {}) }) })
    }));
    if (CLEANUP_STAGES.includes(stage)) cleanupStages.push(stage);
    if (missingBinary === binary && stage === `probe:${binary}`) {
      return {
        status: null,
        stdout: "",
        stderr: "",
        error: Object.assign(new Error("missing"), { code: "ENOENT" })
      };
    }
    return inject(stage) || { status: 0, stdout: "", stderr: "" };
  };

  const dependencies = {
    args: [],
    env: {
      PATH: "/fixture/bin",
      LANG: "C",
      PGHOST: secret,
      PGPASSWORD: secret,
      DATABASE_URL: secret,
      SOUND_SEEKERS_LOCAL_POSTGRES_ADMIN_URL: secret,
      SOUND_SEEKERS_TEST_DATABASE_URL: secret
    },
    runCommand,
    randomBytes: size => {
      calls.push(Object.freeze({ kind: "random", size }));
      const value = randomOrdinal++ === 0
        ? Buffer.from([0x12, 0x34])
        : Buffer.from("00112233445566778899aabb", "hex");
      assert.equal(value.length, size);
      return value;
    },
    tmpdir: () => temporaryDirectory,
    mkdtemp: prefix => {
      calls.push(Object.freeze({ kind: "filesystem", stage: "mkdtemp", path: prefix }));
      inject("mkdtemp");
      return mkdtempResult !== undefined ? mkdtempResult : root;
    },
    mkdir: (path, options) => {
      calls.push(Object.freeze({ kind: "filesystem", stage: "mkdir", path, options }));
      inject("mkdir");
    },
    remove: (path, options) => {
      removedPath = path;
      cleanupStages.push("remove");
      calls.push(Object.freeze({ kind: "filesystem", stage: "remove", path, options }));
      inject("remove");
    },
    stdout: message => stdoutMessages.push(String(message)),
    stderr: message => stderrMessages.push(String(message))
  };

  return {
    secret,
    root,
    port,
    database,
    calls,
    cleanupStages,
    dependencies,
    captureError(error) {
      capturedErrors.push(JSON.stringify({
        name: error?.name,
        message: error?.message,
        stage: error?.stage,
        binary: error?.binary,
        status: error?.status,
        cleanupStages: error?.cleanupStages
      }));
      return error;
    },
    get removedPath() { return removedPath; },
    get output() { return stdoutMessages.join("\n"); },
    get redactedOutput() {
      return [...stdoutMessages, ...stderrMessages, ...capturedErrors].join("\n");
    }
  };
}

function harness({ failBinary = null, missingBinary = null, longRoot = false } = {}) {
  const primaryStage = failBinary ? `probe:${failBinary}` : null;
  const fixture = createEphemeralPostgresFailureHarness({
    primaryStage,
    failureMode: "status1",
    missingBinary,
    longRoot
  });
  return {
    ...fixture,
    writes: {
      join: () => fixture.output ? `${fixture.output}\n` : ""
    }
  };
}

test("the SQL gate owns one literal bootstrap and prerequisite chain", () => {
  assert.equal(Object.isFrozen(SOUND_SEEKERS_CONTENT_DECK_SQL_FILES), true);
  assert.deepEqual(SOUND_SEEKERS_CONTENT_DECK_SQL_FILES, EXPECTED_FILES);
  assert.doesNotThrow(() => assertNoSqlSelftestCliArguments([]));
  assert.throws(() => assertNoSqlSelftestCliArguments(["--url=x"]), /arguments/i);
  const clean = sanitizedPostgresEnvironment({ PATH: "/bin", HOME: "/tmp", PGHOST: "secret",
    PGTZ: "secret", DATABASE_URL: "secret", SOUND_SEEKERS_TEST_DATABASE_URL: "secret" });
  assert.deepEqual(clean, { PATH: "/bin", HOME: "/tmp" });
});

test("the runner creates and removes one isolated socket-only cluster", async () => {
  const run = harness();
  assert.deepEqual(await runSoundSeekersContentDeckSqlSelftest(run.dependencies), { status: "passed" });
  assert.equal(run.writes.join(""), "PASS: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST\n");
  const psqlFiles = run.calls.filter(call => call.binary === "psql" && call.args.includes("-f")
    && call.args.at(-1) !== "-")
    .map(call => call.args.at(-1));
  assert.deepEqual(psqlFiles, EXPECTED_FILES);
  assert.ok(run.calls.some(call => call.binary === "pg_ctl"
    && call.args.includes("-o") && call.args.some(value => value.includes("listen_addresses=''"))));
  const terminate = run.calls.find(call => call.binary === "psql"
    && call.args.at(-1) === "-" && call.options?.input);
  assert.ok(terminate);
  assert.ok(terminate.options.input.includes(":'database_name'"));
  assert.equal(terminate.options.input.includes("literacypath_sound_seekers_test_"), false,
    "the generated database name remains a bound psql variable");
  assert.deepEqual(run.calls.at(-1), {
    kind: "filesystem",
    stage: "remove",
    path: run.root,
    options: { recursive: true, force: true }
  });
  for (const call of run.calls.filter(item => item.options?.env)) {
    assert.equal(Object.keys(call.options.env).some(key => key.startsWith("PG")), false);
    assert.equal("DATABASE_URL" in call.options.env, false);
  }
});

test("missing tools block before mutation while hard failures remain redacted errors", async () => {
  for (const binary of POSTGRES_BINARIES) {
    const blocked = harness({ missingBinary: binary });
    assert.deepEqual(await runSoundSeekersContentDeckSqlSelftest(blocked.dependencies), {
      status: "blocked", reason: "SQL_DIRECT_GATE_UNAVAILABLE"
    }, binary);
    assert.equal(blocked.calls.every(call =>
      call.kind === "command" && call.stage.startsWith("probe:")), true, binary);
    assert.equal(blocked.calls.some(call =>
      call.kind === "filesystem" || call.kind === "random"), false, binary);
    assert.deepEqual(blocked.cleanupStages, [], binary);
    assert.equal(blocked.removedPath, undefined, binary);
    assert.equal(blocked.writes.join(""), "BLOCKED: SQL_DIRECT_GATE_UNAVAILABLE\n", binary);
  }

  const failed = harness({ failBinary: "initdb" });
  assert.throws(() => runSoundSeekersContentDeckSqlSelftest(failed.dependencies), error => {
    assert.equal(String(error).includes("secret"), false);
    return true;
  });
  assert.equal(failed.calls.every(call =>
    call.kind === "command" && call.stage.startsWith("probe:")), true);
  assert.deepEqual(failed.cleanupStages, []);
  assert.equal(failed.removedPath, undefined);
});

test("the Darwin socket ceiling fails before initdb and still removes the exact owned root", async () => {
  const run = harness({ longRoot: true });
  assert.throws(() => runSoundSeekersContentDeckSqlSelftest(run.dependencies), /socket|path/i);
  assert.equal(run.calls.some(call => call.binary === "initdb" && call.args[0] === "-D"), false);
  assert.ok(run.calls.some(call => call.stage === "remove" && call.path === run.root));
});

test("the CLI maps passed, unavailable, and failures to 0, 2, and 1", async () => {
  const out = [];
  const io = { write: value => out.push(value) };
  assert.equal(await soundSeekersContentDeckSqlSelftestMain({ argv: ["node", "script"], env: {},
    run: async () => ({ status: "passed" }), stdout: io, stderr: io }), 0);
  assert.equal(await soundSeekersContentDeckSqlSelftestMain({ argv: ["node", "script"], env: {},
    run: async () => ({ status: "blocked", reason: "SQL_DIRECT_GATE_UNAVAILABLE" }), stdout: io, stderr: io }), 2);
  assert.equal(await soundSeekersContentDeckSqlSelftestMain({ argv: ["node", "script", "x"], env: {},
    run: async () => ({ status: "passed" }), stdout: io, stderr: io }), 1);
  assert.ok(out.includes("ERROR: SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST_FAILED\n"));
  assert.equal(join("/tmp", "lp-ss-"), "/tmp/lp-ss-");
});

function invokeExpectedFailure(fixture) {
  let error;
  assert.throws(
    () => runSoundSeekersContentDeckSqlSelftest(fixture.dependencies),
    candidate => {
      error = fixture.captureError(candidate);
      return true;
    }
  );
  assert.ok(error);
  assert.equal(fixture.output, "");
  assert.equal(fixture.redactedOutput, JSON.stringify({
    name: error?.name,
    message: error?.message,
    stage: error?.stage,
    binary: error?.binary,
    status: error?.status,
    cleanupStages: error?.cleanupStages
  }));
  assert.equal(fixture.redactedOutput.includes(fixture.secret), false);
  assert.equal(JSON.stringify(fixture.calls).includes(fixture.secret), false);
  return error;
}

test("the exported failure harness injects all three hard modes at every binary probe", () => {
  for (const binary of POSTGRES_BINARIES) {
    for (const mode of COMMAND_FAILURE_MODES) {
      const fixture = createEphemeralPostgresFailureHarness({
        primaryStage: `probe:${binary}`,
        failureMode: mode
      });
      const error = invokeExpectedFailure(fixture);
      assert.equal(error.stage, "preflight", `${binary}:${mode}`);
      assert.equal(error.binary, binary, `${binary}:${mode}`);
      assert.equal(error.status, mode === "status1" ? 1 : undefined, `${binary}:${mode}`);
      assert.equal(fixture.calls.some(call => call.stage === "mkdtemp"), false, `${binary}:${mode}`);
      assert.deepEqual(fixture.cleanupStages, [], `${binary}:${mode}`);
      assert.equal(fixture.removedPath, undefined, `${binary}:${mode}`);
    }
  }
});

test("every primary filesystem and command failure gets its exact applicable cleanup", () => {
  const commandStages = [
    "initdb",
    "start",
    "createdb",
    ...SOUND_SEEKERS_CONTENT_DECK_SQL_FILES
  ];
  const cases = [
    { stage: "mkdtemp", modes: ["throw"], cleanup: [] },
    { stage: "mkdir", modes: ["throw"], cleanup: ["remove"] },
    { stage: "initdb", modes: COMMAND_FAILURE_MODES, cleanup: ["remove"] },
    { stage: "start", modes: COMMAND_FAILURE_MODES, cleanup: ["stop", "remove"] },
    { stage: "createdb", modes: COMMAND_FAILURE_MODES, cleanup: CLEANUP_STAGES },
    ...SOUND_SEEKERS_CONTENT_DECK_SQL_FILES.map(stage => ({
      stage,
      modes: COMMAND_FAILURE_MODES,
      cleanup: CLEANUP_STAGES
    }))
  ];
  assert.deepEqual(cases.filter(({ stage }) => commandStages.includes(stage)).map(({ stage }) => stage),
    commandStages);

  for (const { stage, modes, cleanup } of cases) {
    for (const mode of modes) {
      const fixture = createEphemeralPostgresFailureHarness({
        primaryStage: stage,
        failureMode: mode
      });
      const error = invokeExpectedFailure(fixture);
      const expectedStage = stage === "mkdtemp" || stage === "mkdir"
        ? stage
        : stage === "start" || stage === "createdb" || stage === "initdb"
          ? stage
          : stage === SOUND_SEEKERS_CONTENT_DECK_SQL_FILES.at(-1) ? "selftest" : "migration";
      assert.equal(error.stage, expectedStage, `${stage}:${mode}`);
      assert.equal(error.status, mode === "status1" ? 1 : undefined, `${stage}:${mode}`);
      assert.deepEqual(fixture.cleanupStages, cleanup, `${stage}:${mode}`);
      assert.equal(fixture.removedPath, stage === "mkdtemp" ? undefined : fixture.root,
        `${stage}:${mode}`);
      if (stage !== "mkdtemp") assert.match(fixture.removedPath, /\/lp-ss-[A-Za-z0-9_-]+$/u);
    }
  }
});

test("terminate, drop, and stop independently hard-fail in every command mode while removal still runs", () => {
  for (const cleanupStage of ["terminate", "drop", "stop"]) {
    for (const mode of COMMAND_FAILURE_MODES) {
      const fixture = createEphemeralPostgresFailureHarness({
        cleanupFailures: new Map([[cleanupStage, mode]])
      });
      const error = invokeExpectedFailure(fixture);
      assert.equal(error.stage, "cleanup", `${cleanupStage}:${mode}`);
      assert.deepEqual(error.cleanupStages, [cleanupStage], `${cleanupStage}:${mode}`);
      assert.deepEqual(fixture.cleanupStages, CLEANUP_STAGES, `${cleanupStage}:${mode}`);
      assert.equal(fixture.removedPath, fixture.root, `${cleanupStage}:${mode}`);
    }
  }

  const removal = createEphemeralPostgresFailureHarness({
    cleanupFailures: new Map([["remove", "throw"]])
  });
  const removalError = invokeExpectedFailure(removal);
  assert.equal(removalError.stage, "cleanup");
  assert.deepEqual(removalError.cleanupStages, ["remove"]);
  assert.deepEqual(removal.cleanupStages, CLEANUP_STAGES);
  assert.equal(removal.removedPath, removal.root);
});

test("combined primary and cleanup failures preserve the primary and redact every injected secret", () => {
  const primaryStage = SOUND_SEEKERS_CONTENT_DECK_SQL_FILES.at(-1);
  const fixture = createEphemeralPostgresFailureHarness({
    failures: new Map([
      [primaryStage, "status1"],
      ["terminate", "throw"],
      ["drop", "status1"],
      ["stop", "status:null"],
      ["remove", "throw"]
    ])
  });
  const error = invokeExpectedFailure(fixture);
  assert.equal(error.stage, "selftest");
  assert.equal(error.status, 1);
  assert.deepEqual(error.cleanupStages, CLEANUP_STAGES);
  assert.deepEqual(fixture.cleanupStages, CLEANUP_STAGES);
  assert.equal(fixture.removedPath, fixture.root);
  assert.deepEqual(Object.keys(error).sort(),
    ["binary", "cleanupStages", "name", "stage", "status"].sort());
});

test("every validation after mkdtemp is cleanup-protected", () => {
  const thenableRoot = createEphemeralPostgresFailureHarness({
    mkdtempResult: Promise.resolve("/fixture/lp-ss-AbC123")
  });
  const error = invokeExpectedFailure(thenableRoot);
  assert.equal(error.stage, "mkdtemp");
  assert.deepEqual(error.cleanupStages, ["remove"]);
  assert.deepEqual(thenableRoot.cleanupStages, []);
  assert.equal(thenableRoot.removedPath, undefined);
});
