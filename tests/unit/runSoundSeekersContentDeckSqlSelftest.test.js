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

function harness({ failBinary = null, missingBinary = null, longRoot = false } = {}) {
  const calls = [];
  const writes = [];
  const temporaryDirectory = longRoot ? `/tmp/${"x".repeat(100)}` : "/tmp";
  const root = `${temporaryDirectory}/lp-ss-test`;
  const runCommand = (binary, args, options) => {
    calls.push({ binary, args, options });
    if (missingBinary === binary && args[0] === "--version") {
      return { status: null, stdout: "", stderr: "", error: { code: "ENOENT" } };
    }
    if (failBinary === binary) return { status: 1, stdout: "secret", stderr: "secret" };
    return { status: 0, stdout: "", stderr: "" };
  };
  return {
    calls, writes, root,
    dependencies: {
      args: [], env: { PATH: "/bin", PGHOST: "secret", DATABASE_URL: "secret" }, runCommand,
      randomBytes: size => Buffer.alloc(size, 7), mkdtemp: prefix => { calls.push({ mkdtemp: prefix }); return root; },
      mkdir: path => { calls.push({ mkdir: path }); },
      remove: (path, options) => { calls.push({ remove: path, options }); },
      tmpdir: () => temporaryDirectory, stdout: { write: text => writes.push(text) }, stderr: { write: text => writes.push(text) }
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
  assert.deepEqual(run.calls.at(-1), { remove: run.root, options: { recursive: true, force: true } });
  for (const call of run.calls.filter(item => item.options?.env)) {
    assert.equal(Object.keys(call.options.env).some(key => key.startsWith("PG")), false);
    assert.equal("DATABASE_URL" in call.options.env, false);
  }
});

test("missing tools block before mutation while hard failures remain redacted errors", async () => {
  const blocked = harness({ missingBinary: "initdb" });
  assert.deepEqual(await runSoundSeekersContentDeckSqlSelftest(blocked.dependencies), {
    status: "blocked", reason: "SQL_DIRECT_GATE_UNAVAILABLE"
  });
  assert.equal(blocked.calls.some(call => call.mkdtemp), false);
  assert.equal(blocked.writes.join(""), "BLOCKED: SQL_DIRECT_GATE_UNAVAILABLE\n");

  const failed = harness({ failBinary: "initdb" });
  assert.throws(() => runSoundSeekersContentDeckSqlSelftest(failed.dependencies), error => {
    assert.equal(String(error).includes("secret"), false);
    return true;
  });
  assert.equal(failed.calls.some(call => call.mkdtemp || call.remove), false);
});

test("the Darwin socket ceiling fails before initdb and still removes the exact owned root", async () => {
  const run = harness({ longRoot: true });
  assert.throws(() => runSoundSeekersContentDeckSqlSelftest(run.dependencies), /socket|path/i);
  assert.equal(run.calls.some(call => call.binary === "initdb" && call.args[0] === "-D"), false);
  assert.ok(run.calls.some(call => call.remove === run.root));
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
