import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Focused local checks. Product thresholds remain in their existing authorities.
// Deliberately exclude commands that seed, migrate, deploy or mutate hosted data.
export const TASK_GATES = {
  instructions: [
    ["node", "tools/checkAgentInstructions.mjs"],
    ["node", "--test", "tests/unit/agentVerification.test.js"]
  ],
  "question-contracts": [
    ["npm", "run", "check:question-design-policy"],
    ["npm", "run", "check:assessment-skill-contracts"]
  ],
  "image-integrity": [
    ["npm", "run", "check:media-quality"],
    ["npm", "run", "check:assessment-media-sizes"],
    ["npm", "run", "check:assessment-media-evidence"],
    ["npm", "run", "check:media-overwrite-risk"]
  ],
  "audio-integrity": [
    ["npm", "run", "check:assessment-audio-audibility"],
    ["node", "--test", "tests/unit/cueAudioLifecycle.test.js", "tests/unit/ipadChildAudioPolicy.test.js"]
  ],
  "mobile-layout": [
    ["npm", "run", "check:device-matrix", "--", "--max-failures=1"],
    ["npm", "run", "check:child-surface-rules"]
  ],
  "supabase-local": [
    ["npm", "run", "check:domain-boundaries"],
    ["node", "--test", "tests/unit/databasePolicyContract.test.js", "tests/unit/hostedSchemaDriftContract.test.js", "tests/unit/studentLoginPolicy.test.js"]
  ],
  regression: [
    ["npm", "test"],
    ["npm", "run", "lint", "--", "--max-warnings=0"],
    ["npm", "run", "build"],
    ["npm", "run", "check:repo-hygiene"]
  ]
};

export function planTaskVerification(profiles) {
  if (!profiles.length) throw new Error(`Choose a profile: ${Object.keys(TASK_GATES).join(", ")}`);
  for (const profile of profiles) {
    if (!Object.hasOwn(TASK_GATES, profile)) throw new Error(`Unknown verification profile: ${profile}`);
  }
  const seen = new Set();
  return profiles.flatMap(profile => TASK_GATES[profile]).filter(command => {
    const key = JSON.stringify(command);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(command => [...command]);
}

export function executeVerificationPlan(plan, {
  execute = spawnSync,
  cwd = repositoryRoot,
  log = console.log
} = {}) {
  for (const [command, ...args] of plan) {
    log(`> ${[command, ...args].join(" ")}`);
    const result = execute(command, args, { cwd, stdio: "inherit", shell: false });
    if (result.error || result.signal || result.status !== 0) {
      log(`Failed: ${command}${result.error ? ` (${result.error.message})` : ""}${result.signal ? ` (${result.signal})` : ""}`);
      return Number.isInteger(result.status) && result.status > 0 ? result.status : 1;
    }
  }
  return 0;
}

export function runTaskVerification(argv, options = {}) {
  const log = options.log || console.log;
  if (argv.length === 1 && argv[0] === "--list") {
    log(Object.keys(TASK_GATES).join("\n"));
    return 0;
  }
  try {
    const plan = planTaskVerification(argv.filter(arg => arg !== "--plan"));
    if (argv.includes("--plan")) {
      log(JSON.stringify(plan, null, 2));
      return 0;
    }
    return executeVerificationPlan(plan, options);
  } catch (error) {
    log(error.message);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runTaskVerification(process.argv.slice(2));
}
