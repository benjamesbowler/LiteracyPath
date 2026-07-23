import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseAuditInvocation(argv) {
  const [modeFlag, script, ...scriptArgs] = argv;
  if (!["--check", "--write-report"].includes(modeFlag) || !script) {
    throw new Error(
      "Usage: node tools/runAuditScript.mjs <--check|--write-report> <script> [...args]"
    );
  }
  const absoluteScript = path.resolve(repoRoot, script);
  if (!absoluteScript.startsWith(`${repoRoot}${path.sep}`)) {
    throw new Error("Audit script must be inside the repository.");
  }
  return {
    mode: modeFlag.slice(2),
    script,
    absoluteScript,
    scriptArgs
  };
}

export function runAuditScript(argv = process.argv.slice(2), environment = process.env) {
  const invocation = parseAuditInvocation(argv);
  const scriptId = path.basename(invocation.script, path.extname(invocation.script));
  const guardPath = path.join(repoRoot, "tools", "auditWriteGuard.mjs");
  const artifactRoot = path.join(
    repoRoot,
    "docs",
    "release",
    "artifacts",
    "audits",
    scriptId
  );
  const tempRoot = path.resolve(environment.TMPDIR || os.tmpdir());
  const inheritedNodeOptions = String(environment.NODE_OPTIONS || "").trim();
  const nodeOptions = invocation.mode === "check"
    ? [inheritedNodeOptions, `--import=${guardPath}`].filter(Boolean).join(" ")
    : inheritedNodeOptions;
  const permissionArgs = invocation.mode === "check"
    ? [
        "--permission",
        "--allow-fs-read=*",
        `--allow-fs-write=${artifactRoot}`,
        `--allow-fs-write=${tempRoot}`,
        "--allow-addons",
        "--allow-child-process",
        "--allow-worker"
      ]
    : [];
  const child = spawnSync(
    process.execPath,
    [
      ...permissionArgs,
      invocation.absoluteScript,
      invocation.mode === "check" ? "--check" : "--write-report",
      ...invocation.scriptArgs
    ],
    {
      cwd: repoRoot,
      env: {
        ...environment,
        NODE_OPTIONS: nodeOptions,
        LP_AUDIT_OUTPUT_MODE: invocation.mode,
        LP_AUDIT_REPO_ROOT: repoRoot,
        LP_AUDIT_ARTIFACT_ROOT: artifactRoot
      },
      stdio: "inherit"
    }
  );
  if (child.error) throw child.error;
  return Number.isInteger(child.status) ? child.status : 1;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    process.exitCode = runAuditScript();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
