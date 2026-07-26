import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const RECOVERY_TABLES = Object.freeze([
  "classes",
  "students",
  "answers",
  "mastery",
  "item_mastery",
  "assessment_attempts",
  "el_assessment_reports"
]);

const safeTargetPattern = /(?:restore|recovery)[_-]drill/i;

export function parseDatabaseIdentity(value) {
  const url = new URL(String(value || ""));
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("Recovery drill databases must use a PostgreSQL URL.");
  }
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!url.hostname || !database) {
    throw new Error("Recovery drill database URL must include a host and database name.");
  }
  return {
    protocol: url.protocol,
    hostname: url.hostname.toLowerCase(),
    port: url.port || "5432",
    database
  };
}

function identityText(identity) {
  return `${identity.protocol}//${identity.hostname}:${identity.port}/${identity.database}`;
}

export function validateRecoveryTargets({
  sourceUrl,
  targetUrl,
  targetMarker,
  confirmation
}) {
  const source = parseDatabaseIdentity(sourceUrl);
  const target = parseDatabaseIdentity(targetUrl);
  if (identityText(source) === identityText(target)) {
    throw new Error("Recovery source and target must be different databases.");
  }
  if (!safeTargetPattern.test(target.database)) {
    throw new Error("Recovery target database name must contain restore-drill or recovery-drill.");
  }
  if (String(targetMarker || "") !== target.database) {
    throw new Error("LP_RECOVERY_DRILL_TARGET_MARKER must exactly match the isolated target database name.");
  }
  if (String(confirmation || "") !== `RESTORE:${target.database}`) {
    throw new Error(`LP_RECOVERY_DRILL_CONFIRM must equal RESTORE:${target.database}.`);
  }
  return { source, target };
}

export function compareRecoverySnapshots(source, restored) {
  const mismatches = [];
  for (const table of RECOVERY_TABLES) {
    const sourceRow = source?.[table];
    const restoredRow = restored?.[table];
    if (!sourceRow || !restoredRow) {
      mismatches.push(`${table}: missing snapshot`);
      continue;
    }
    if (Number(sourceRow.rows) !== Number(restoredRow.rows)) {
      mismatches.push(`${table}: row count ${sourceRow.rows} != ${restoredRow.rows}`);
    }
    if (sourceRow.fingerprint !== restoredRow.fingerprint) {
      mismatches.push(`${table}: fingerprint mismatch`);
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}

function snapshotSql() {
  return RECOVERY_TABLES.map(table => `
    select '${table}' as table_name,
      count(*)::bigint as row_count,
      encode(
        extensions.digest(
          coalesce(
            string_agg(
              encode(extensions.digest(to_jsonb(row_value)::text, 'sha256'), 'hex'),
              '' order by encode(extensions.digest(to_jsonb(row_value)::text, 'sha256'), 'hex')
            ),
            ''
          ),
          'sha256'
        ),
        'hex'
      ) as fingerprint
    from public.${table} row_value
  `).join("\nunion all\n");
}

function parseSnapshot(output) {
  const snapshot = {};
  for (const line of String(output || "").trim().split("\n")) {
    if (!line.trim()) continue;
    const [table, rows, fingerprint] = line.split("\t");
    if (!RECOVERY_TABLES.includes(table)
      || !/^\d+$/.test(rows || "")
      || !/^[a-f0-9]{64}$/.test(fingerprint || "")) {
      throw new Error("Recovery snapshot returned an unexpected row.");
    }
    snapshot[table] = { rows: Number(rows), fingerprint };
  }
  return snapshot;
}

async function command(binary, args, options = {}) {
  return execFileAsync(binary, args, {
    cwd: repoRoot,
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
    ...options
  });
}

async function assertBinary(binary) {
  try {
    await command(binary, ["--version"]);
  } catch {
    throw new Error(`${binary} is required for the recovery drill.`);
  }
}

async function readSnapshot(databaseUrl) {
  const result = await command("psql", [
    databaseUrl,
    "--no-psqlrc",
    "--tuples-only",
    "--no-align",
    "--field-separator",
    "\t",
    "--set",
    "ON_ERROR_STOP=1",
    "--command",
    snapshotSql()
  ]);
  return parseSnapshot(result.stdout);
}

async function targetHasRecoverySchema(databaseUrl) {
  const result = await command("psql", [
    databaseUrl,
    "--no-psqlrc",
    "--tuples-only",
    "--no-align",
    "--set",
    "ON_ERROR_STOP=1",
    "--command",
    "select case when to_regclass('public.classes') is null then 'no' else 'yes' end;"
  ]);
  return result.stdout.trim() === "yes";
}

function opaqueIdentity(identity) {
  return createHash("sha256").update(identityText(identity)).digest("hex").slice(0, 16);
}

export async function runRecoveryDrill({
  sourceUrl = process.env.LP_RECOVERY_SOURCE_DATABASE_URL,
  targetUrl = process.env.LP_RECOVERY_TARGET_DATABASE_URL,
  targetMarker = process.env.LP_RECOVERY_DRILL_TARGET_MARKER,
  confirmation = process.env.LP_RECOVERY_DRILL_CONFIRM,
  now = new Date()
} = {}) {
  const { source, target } = validateRecoveryTargets({
    sourceUrl,
    targetUrl,
    targetMarker,
    confirmation
  });
  await Promise.all(["pg_dump", "pg_restore", "psql"].map(assertBinary));

  const startedAt = new Date();
  const workingDirectory = await mkdtemp(path.join(tmpdir(), "literacypath-recovery-drill-"));
  const dumpPath = path.join(workingDirectory, "backup.dump");
  try {
    const sourceSnapshot = await readSnapshot(sourceUrl);
    await command("pg_dump", [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "--schema=public",
      "--schema=auth",
      "--file",
      dumpPath,
      sourceUrl
    ]);
    await command("pg_restore", ["--list", dumpPath]);
    // A clean restore emits object-specific DROP statements. PostgreSQL cannot
    // apply some of those (notably DROP POLICY) to a brand-new empty database,
    // even with --if-exists. Establish the source schema once, without data, so
    // the same strict clean-and-restore path works for both first and later drills.
    if (!(await targetHasRecoverySchema(targetUrl))) {
      await command("psql", [
        targetUrl,
        "--no-psqlrc",
        "--set",
        "ON_ERROR_STOP=1",
        "--command",
        "drop schema if exists public cascade; drop schema if exists auth cascade;"
      ]);
      await command("pg_restore", [
        "--schema-only",
        "--no-owner",
        "--no-privileges",
        "--exit-on-error",
        "--dbname",
        targetUrl,
        dumpPath
      ]);
    }
    await command("pg_restore", [
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-privileges",
      "--exit-on-error",
      "--dbname",
      targetUrl,
      dumpPath
    ]);
    await command("psql", [
      targetUrl,
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--command",
      "create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions;"
    ]);
    const restoredSnapshot = await readSnapshot(targetUrl);
    const comparison = compareRecoverySnapshots(sourceSnapshot, restoredSnapshot);
    if (!comparison.ok) {
      throw new Error(`Recovery verification failed: ${comparison.mismatches.join("; ")}`);
    }

    const finishedAt = new Date();
    const artifact = {
      schemaVersion: 1,
      status: "pass",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationSeconds: Math.max(0, Math.round((finishedAt - startedAt) / 1000)),
      sourceIdentity: opaqueIdentity(source),
      isolatedTargetIdentity: opaqueIdentity(target),
      backupFormat: "PostgreSQL custom",
      backupListVerified: true,
      tables: Object.fromEntries(
        RECOVERY_TABLES.map(table => [table, {
          rows: sourceSnapshot[table].rows,
          fingerprint: sourceSnapshot[table].fingerprint
        }])
      )
    };
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const artifactDirectory = path.join(
      repoRoot,
      "docs",
      "release",
      "artifacts",
      "recovery",
      timestamp
    );
    await mkdir(artifactDirectory, { recursive: true });
    const artifactPath = path.join(artifactDirectory, "restore-drill.json");
    await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, { mode: 0o600 });
    return { artifact, artifactPath };
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

function preflightMessage(environment = process.env) {
  const required = [
    "LP_RECOVERY_SOURCE_DATABASE_URL",
    "LP_RECOVERY_TARGET_DATABASE_URL",
    "LP_RECOVERY_DRILL_TARGET_MARKER",
    "LP_RECOVERY_DRILL_CONFIRM"
  ];
  const missing = required.filter(name => !String(environment[name] || "").trim());
  return missing.length
    ? `Recovery drill preflight failed: missing ${missing.join(", ")}.`
    : "Recovery drill environment is present.";
}

const isMain = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const preflight = preflightMessage();
  if (!process.argv.includes("--execute")) {
    console.error(`${preflight} Pass --execute only for an explicitly isolated target.`);
    process.exitCode = 2;
  } else if (preflight.includes("failed")) {
    console.error(preflight);
    process.exitCode = 2;
  } else {
    try {
      const result = await runRecoveryDrill();
      console.log(`Recovery drill passed. Artifact: ${path.relative(repoRoot, result.artifactPath)}`);
    } catch (error) {
      console.error(`Recovery drill failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
