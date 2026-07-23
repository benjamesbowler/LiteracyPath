import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalManifestPath = path.join(repoRoot, "docs", "release", "manifest.json");
const strictAuditJsonPath = path.join(
  repoRoot,
  "docs", "release", "artifacts", "audits",
  "auditAllSkillsStrictProductionReadiness", "repo", "docs", "validation",
  "all_skills_strict_production_audit.json"
);

export const RELEASE_GATES = Object.freeze([
  {
    id: "lint",
    label: "Lint with zero warnings",
    command: ["npm", "run", "lint", "--", "--max-warnings=0"],
    areas: [4, 10]
  },
  {
    id: "unit-tests",
    label: "Full unit suite",
    command: ["npm", "test"],
    areas: [4, 8, 9, 10]
  },
  {
    id: "build",
    label: "Production build",
    command: ["npm", "run", "build"],
    areas: [3, 8, 9, 10]
  },
  {
    id: "smoke",
    label: "Reachable-product smoke tests",
    command: ["npm", "run", "test:smoke"],
    areas: [1, 2, 3, 5, 6, 7, 9, 10]
  },
  {
    id: "assessment-question-integrity",
    label: "Assessment question integrity",
    command: ["npm", "run", "check:assessment-question-integrity", "--", "--check"],
    areas: [1, 4, 10]
  },
  {
    id: "assessment-runtime-variation",
    label: "Assessment runtime variation",
    command: ["npm", "run", "check:assessment-runtime-variation", "--", "--check"],
    areas: [1, 4, 10]
  },
  {
    id: "strict-curriculum",
    label: "Strict production curriculum audit",
    command: [
      "node", "tools/runAuditScript.mjs", "--check",
      "tools/auditAllSkillsStrictProductionReadiness.js"
    ],
    areas: [1, 4, 10]
  },
  {
    id: "skill-progression",
    label: "Skill progression without warnings",
    command: ["npm", "run", "check:skill-progression", "--", "--check"],
    areas: [1, 4, 10],
    failOnPositiveCount: "warnings"
  },
  {
    id: "teacher-dashboard-data",
    label: "Reachable teacher dashboard contracts",
    command: ["npm", "run", "check:teacher-dashboard-data"],
    areas: [4, 5, 6, 7, 9, 10]
  },
  {
    id: "teacher-ia",
    label: "Five-intention teacher information architecture",
    command: ["npm", "run", "check:teacher-ia"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-today",
    label: "Seeded Today evidence briefing and actions",
    command: ["npm", "run", "check:teacher-today"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-urgency-order",
    label: "Teacher page urgency order and collapsed roster administration",
    command: ["npm", "run", "check:teacher-urgency-order"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-context",
    label: "Persistent class, group, and learner teacher context",
    command: ["npm", "run", "check:teacher-context"],
    areas: [5, 6, 10]
  },
  {
    id: "audit-school-live",
    label: "Audit school Auth, fixtures, and RLS isolation",
    command: ["npm", "run", "check:audit-school-live"],
    areas: [6, 8, 10]
  },
  {
    id: "teacher-onboarding",
    label: "Fresh-teacher setup and first-check golden path",
    command: ["npm", "run", "check:teacher-onboarding"],
    areas: [5, 6, 8, 9, 10]
  },
  {
    id: "teacher-roster-scale",
    label: "Real-class roster import, bulk cards, archive, and transfer",
    command: ["npm", "run", "check:teacher-roster-scale"],
    areas: [5, 6, 8, 9, 10]
  },
  {
    id: "teacher-roster-device-matrix",
    label: "Configurable teacher roster and learner drawer at Chromebook and tablet sizes",
    command: ["npm", "run", "check:teacher-roster-device-matrix"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-contextual-help",
    label: "Searchable question-type help reachable from learner evidence",
    command: ["npm", "run", "check:teacher-contextual-help"],
    areas: [4, 5, 6, 10]
  },
  {
    id: "teacher-class-code",
    label: "Accessible class-code copy and regeneration",
    command: ["npm", "run", "check:teacher-class-code"],
    areas: [3, 5, 6, 8, 10]
  },
  {
    id: "teacher-login-cards",
    label: "Page-sized login-card route without document stream writes",
    command: ["npm", "run", "check:teacher-login-cards"],
    areas: [3, 5, 6, 8, 10]
  },
  {
    id: "teacher-student-preview",
    label: "Read-only student preview with exact teacher return",
    command: ["npm", "run", "check:teacher-student-preview"],
    areas: [3, 5, 6, 8, 10]
  },
  {
    id: "teacher-interventions",
    label: "Trackable intervention lifecycle and Today follow-up",
    command: ["npm", "run", "check:teacher-interventions"],
    areas: [4, 5, 6, 7, 8, 10]
  },
  {
    id: "teacher-dashboard-consolidation",
    label: "Single teacher product and parity matrix",
    command: ["npm", "run", "check:teacher-dashboard-consolidation"],
    areas: [5, 9, 10]
  },
  {
    id: "product-finish-surface",
    label: "Reachable product finish contracts",
    command: ["npm", "run", "check:product-finish-surface"],
    areas: [4, 5, 6, 7, 10]
  },
  {
    id: "release-readiness-surface",
    label: "Report and release-readiness contracts",
    command: ["npm", "run", "check:release-readiness-surface"],
    areas: [4, 7, 10]
  },
  {
    id: "bundle-size",
    label: "Enforced bundle budgets",
    command: ["npm", "run", "check:bundle-size"],
    areas: [9, 10]
  },
  {
    id: "dependency-audit",
    label: "Dependency audit (high and critical)",
    command: ["npm", "audit", "--json", "--audit-level=high"],
    areas: [8, 10],
    outputFormat: "npm-audit-json"
  },
  {
    id: "export-compatibility",
    label: "Export compatibility, lazy loading, and 500-item memory",
    command: ["npm", "run", "check:export-compatibility"],
    areas: [8, 9, 10]
  },
  {
    id: "repo-hygiene",
    label: "Baselined repository hygiene",
    command: ["npm", "run", "check:repo-hygiene", "--", "--check"],
    areas: [10]
  },
  {
    id: "audit-read-only",
    label: "Read-only audit mode contract",
    command: ["npm", "run", "check:audit-read-only"],
    areas: [10]
  },
  {
    id: "database-bootstrap-schema",
    label: "Reconstructable core database schema",
    command: ["npm", "run", "check:database-bootstrap-schema"],
    areas: [8, 10]
  },
  {
    id: "audit-school-seed",
    label: "Deterministic non-production audit school",
    command: ["npm", "run", "check:audit-school-seed"],
    areas: [6, 10]
  },
  {
    id: "a11y-routes",
    label: "All-route accessibility",
    command: ["npm", "run", "check:a11y-routes"],
    areas: [3, 10],
    planned: true
  },
  {
    id: "a11y-teacher",
    label: "Authenticated teacher accessibility",
    command: ["npm", "run", "check:a11y-teacher"],
    areas: [6, 10],
    planned: true
  },
  {
    id: "db-policies",
    label: "Database policy integration",
    command: ["npm", "run", "check:db-policies"],
    areas: [8, 10],
    planned: true
  },
  {
    id: "e2e-teacher",
    label: "Authenticated teacher end-to-end",
    command: ["npm", "run", "check:e2e-teacher"],
    areas: [5, 6, 7, 10],
    planned: true
  },
  {
    id: "csp",
    label: "Enforced content security policy",
    command: ["npm", "run", "check:csp"],
    areas: [8, 10],
    planned: true
  },
  {
    id: "runtime-variation-simulation",
    label: "500-session-per-skill variation simulation",
    command: ["npm", "run", "check:runtime-variation-simulation"],
    areas: [1, 4, 10],
    planned: true
  },
  {
    id: "media-runtime-resolution",
    label: "Built-app media runtime resolution",
    command: ["npm", "run", "check:media-runtime-resolution"],
    areas: [1, 3, 4, 10],
    planned: true
  },
  {
    id: "device-matrix",
    label: "Student device matrix",
    command: ["npm", "run", "check:device-matrix"],
    areas: [2, 3, 10],
    planned: true
  },
  {
    id: "sync-chaos",
    label: "Progress sync chaos suite",
    command: ["npm", "run", "check:sync-chaos"],
    areas: [4, 9, 10],
    planned: true
  }
]);

const CURRICULUM_DIMENSIONS = Object.freeze({
  correctness: ["assessment-question-integrity"],
  depth: ["strict-curriculum"],
  variation: [
    "assessment-runtime-variation",
    "skill-progression",
    "runtime-variation-simulation"
  ],
  media: ["strict-curriculum", "media-runtime-resolution"],
  runtimeSelectability: [
    "strict-curriculum",
    "assessment-question-integrity",
    "runtime-variation-simulation"
  ]
});

function isoFilePart(date = new Date()) {
  return date.toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function commandText(command) {
  return command.map(part => (
    /[\s"'`$]/.test(part) ? JSON.stringify(part) : part
  )).join(" ");
}

function readPackageScripts() {
  const packagePath = path.join(repoRoot, "package.json");
  return JSON.parse(fs.readFileSync(packagePath, "utf8")).scripts || {};
}

export function isGateImplemented(gate, scripts = readPackageScripts()) {
  if (gate.command[0] !== "npm" || gate.command[1] !== "run") return true;
  return Boolean(scripts[gate.command[2]]);
}

function collectRegexCounts(output) {
  const patterns = {
    tests: /(?:#\s*)?tests[:\s]+(\d+)/i,
    passed: /(?:#\s*)?pass(?:ed)?[:\s]+(\d+)|(\d+)\s+passed\b/i,
    failed: /(?:#\s*)?fail(?:ed|ures?)?[:\s]+(\d+)|(\d+)\s+failed\b/i,
    warnings: /warnings?[:\s]+(\d+)/i,
    productionReadySkills: /production-ready skills[:\s]+(\d+)/i,
    auditedSkills: /strict assessment skills audited[:\s]+(\d+)/i,
    missingImages: /true missing images[:\s]+(\d+)/i,
    missingAudio: /true missing audio[:\s]+(\d+)/i,
    mediaWiringFixes: /media wiring fixes[:\s]+(\d+)/i,
    newQuestionsNeeded: /new questions needed[:\s]+(\d+)/i
  };
  const counts = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matches = [...output.matchAll(new RegExp(pattern.source, flags))];
    const match = matches.at(-1);
    if (!match) continue;
    const value = match.slice(1).find(part => part !== undefined);
    counts[key] = Number(value);
  }
  return counts;
}

export function extractGateCounts(gate, output) {
  if (gate.outputFormat === "npm-audit-json") {
    try {
      const parsed = JSON.parse(output);
      return {
        ...(parsed.metadata?.vulnerabilities || {}),
        dependencies: parsed.metadata?.dependencies?.total ?? null
      };
    } catch {
      return { parseError: 1 };
    }
  }
  return collectRegexCounts(output);
}

function tail(value, maxCharacters = 4000) {
  if (value.length <= maxCharacters) return value;
  return value.slice(-maxCharacters);
}

async function runCommand(gate, logPath) {
  const startedAt = new Date();
  const startedMs = Date.now();
  let combinedOutput = "";

  const result = await new Promise(resolve => {
    const child = spawn(gate.command[0], gate.command.slice(1), {
      cwd: repoRoot,
      env: {
        ...process.env,
        CI: process.env.CI || "1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    const onData = chunk => {
      const value = chunk.toString();
      combinedOutput += value;
      process.stdout.write(value);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", error => {
      combinedOutput += `\nFailed to start command: ${error.message}\n`;
      resolve({ exitCode: 1, signal: null, spawnError: error.message });
    });
    child.on("close", (exitCode, signal) => {
      resolve({
        exitCode: Number.isInteger(exitCode) ? exitCode : 1,
        signal: signal || null,
        spawnError: null
      });
    });
  });

  fs.writeFileSync(logPath, combinedOutput);
  const counts = extractGateCounts(gate, combinedOutput);
  const warningFailure = gate.failOnPositiveCount
    && Number(counts[gate.failOnPositiveCount] || 0) > 0;
  const status = result.exitCode === 0 && !warningFailure ? "pass" : "fail";

  return {
    id: gate.id,
    label: gate.label,
    areas: gate.areas,
    command: commandText(gate.command),
    status,
    exitCode: result.exitCode,
    signal: result.signal,
    durationMs: Date.now() - startedMs,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    counts,
    logPath: path.relative(repoRoot, logPath).replaceAll(path.sep, "/"),
    outputTail: status === "fail" ? tail(combinedOutput) : "",
    reason: warningFailure
      ? `${gate.failOnPositiveCount} must be zero`
      : result.spawnError
  };
}

function statusForDependencies(dependencies, resultsById) {
  const statuses = dependencies.map(id => resultsById.get(id)?.status || "not-run");
  if (statuses.every(status => status === "pass")) return "pass";
  if (statuses.some(status => status === "fail" || status === "not-implemented")) return "fail";
  return "not-run";
}

function readStrictAudit() {
  try {
    return JSON.parse(fs.readFileSync(strictAuditJsonPath, "utf8"));
  } catch {
    return null;
  }
}

export function composeCurriculumResult(results, strictAudit = readStrictAudit()) {
  const resultsById = new Map(results.map(result => [result.id, result]));
  const dimensions = Object.fromEntries(
    Object.entries(CURRICULUM_DIMENSIONS).map(([dimension, dependencies]) => [
      dimension,
      {
        status: statusForDependencies(dependencies, resultsById),
        dependencies
      }
    ])
  );

  const globalDimensionsPass = Object.values(dimensions).every(item => item.status === "pass");
  const skills = (strictAudit?.perSkill || []).map(skill => {
    const depthPass = Number(skill.level1MissingTo30 || 0) === 0
      && Number(skill.level2MissingTo30 || 0) === 0;
    const mediaPass = Number(skill.missingImageCount || 0) === 0
      && Number(skill.missingAudioCount || 0) === 0
      && Number(skill.mediaWiringFixCount || 0) === 0;
    const strictRuntimePass = Number(skill.strictUsableQuestionCount || 0)
      >= Number(strictAudit?.strictStandard?.minimumTotal || 60);
    const skillDimensions = {
      correctness: dimensions.correctness.status,
      depth: depthPass ? "pass" : "fail",
      variation: dimensions.variation.status,
      media: mediaPass && dimensions.media.status === "pass" ? "pass" : "fail",
      runtimeSelectability: strictRuntimePass
        && dimensions.runtimeSelectability.status === "pass"
        ? "pass"
        : "fail"
    };
    return {
      skillId: skill.skillId,
      skillName: skill.skillName,
      dimensions: skillDimensions,
      releaseReady: Object.values(skillDimensions).every(status => status === "pass")
    };
  });

  const releaseReadySkills = skills.filter(skill => skill.releaseReady).length;
  const status = globalDimensionsPass
    && skills.length > 0
    && releaseReadySkills === skills.length
    ? "pass"
    : "fail";

  return {
    id: "curriculum-composed",
    label: "Composed curriculum release gate",
    areas: [1, 4, 10],
    command: "synthetic: correctness ∧ depth ∧ variation ∧ media ∧ runtime-selectability",
    status,
    exitCode: status === "pass" ? 0 : 1,
    durationMs: 0,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    counts: {
      skillsAudited: skills.length,
      releaseReadySkills
    },
    dimensions,
    skills,
    reason: status === "pass"
      ? null
      : "Every curriculum dimension must pass for every audited skill."
  };
}

function parseArguments(argv) {
  const args = [...argv];
  const onlyIndex = args.indexOf("--only");
  const only = onlyIndex >= 0
    ? new Set(String(args[onlyIndex + 1] || "").split(",").map(value => value.trim()).filter(Boolean))
    : null;
  return {
    list: args.includes("--list"),
    only
  };
}

async function readGitMetadata() {
  const run = command => new Promise(resolve => {
    const child = spawn("git", command, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"]
    });
    let output = "";
    child.stdout.on("data", chunk => {
      output += chunk.toString();
    });
    child.on("close", code => resolve(code === 0 ? output.trim() : "unknown"));
    child.on("error", () => resolve("unknown"));
  });
  return {
    commitSha: await run(["rev-parse", "HEAD"]),
    branch: await run(["branch", "--show-current"])
  };
}

export async function runReleaseGate(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const scripts = readPackageScripts();

  if (options.list) {
    for (const gate of RELEASE_GATES) {
      const implemented = isGateImplemented(gate, scripts);
      console.log(`${gate.id}\t${implemented ? "implemented" : "not-implemented"}\t${commandText(gate.command)}`);
    }
    console.log("curriculum-composed\tsynthetic\tfive required dimensions");
    return 0;
  }

  const unknownOnly = options.only
    ? [...options.only].filter(id => !RELEASE_GATES.some(gate => gate.id === id))
    : [];
  if (unknownOnly.length) {
    console.error(`Unknown release gate(s): ${unknownOnly.join(", ")}`);
    return 2;
  }

  const selectedGates = options.only
    ? RELEASE_GATES.filter(gate => options.only.has(gate.id))
    : RELEASE_GATES;
  const fullRun = !options.only;
  const runStartedAt = new Date();
  const artifactDir = path.join(repoRoot, "docs", "release", "artifacts", isoFilePart(runStartedAt));
  fs.mkdirSync(artifactDir, { recursive: true });
  const git = await readGitMetadata();
  const results = [];

  for (const gate of selectedGates) {
    const implemented = isGateImplemented(gate, scripts);
    console.log(`\n=== ${gate.id}: ${gate.label} ===`);
    if (!implemented) {
      const now = new Date().toISOString();
      const result = {
        id: gate.id,
        label: gate.label,
        areas: gate.areas,
        command: commandText(gate.command),
        status: "not-implemented",
        exitCode: 1,
        durationMs: 0,
        startedAt: now,
        finishedAt: now,
        counts: {},
        logPath: null,
        reason: `Missing package script: ${gate.command[2]}`
      };
      results.push(result);
      console.error(result.reason);
      continue;
    }
    results.push(await runCommand(gate, path.join(artifactDir, `${gate.id}.log`)));
  }

  if (fullRun) {
    results.push(composeCurriculumResult(results));
  }

  const summary = {
    total: results.length,
    passed: results.filter(result => result.status === "pass").length,
    failed: results.filter(result => result.status === "fail").length,
    notImplemented: results.filter(result => result.status === "not-implemented").length,
    notRun: results.filter(result => result.status === "not-run").length
  };
  const manifest = {
    schemaVersion: 1,
    partial: !fullRun,
    generatedAt: new Date().toISOString(),
    startedAt: runStartedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    commitSha: git.commitSha,
    branch: git.branch,
    summary,
    gates: results
  };
  const manifestPath = fullRun
    ? canonicalManifestPath
    : path.join(artifactDir, "manifest.partial.json");
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nRelease manifest: ${path.relative(repoRoot, manifestPath)}`);
  console.log(`Passed ${summary.passed}/${summary.total}; failed ${summary.failed}; not implemented ${summary.notImplemented}.`);
  return summary.failed === 0 && summary.notImplemented === 0 ? 0 : 1;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  process.exitCode = await runReleaseGate();
}
