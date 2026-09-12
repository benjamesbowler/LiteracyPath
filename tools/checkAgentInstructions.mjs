import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { repositoryRoot } from "./agentVerification.mjs";

export function checkAgentInstructions(root = repositoryRoot) {
  const failures = [];
  const read = file => readFileSync(path.join(root, file), "utf8");
  const pkg = JSON.parse(read("package.json"));
  const skillRoot = ".agents/skills";
  const skills = readdirSync(path.join(root, skillRoot), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `${skillRoot}/${entry.name}/SKILL.md`);
  const names = new Set();
  let skillBytes = 0;
  let metadataBytes = 0;

  for (const file of skills) {
    if (!existsSync(path.join(root, file))) { failures.push(`Missing ${file}`); continue; }
    const body = read(file);
    const frontmatter = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    // Repository skills deliberately use simple single-line discovery metadata.
    const name = frontmatter?.match(/^name: (.+)$/m)?.[1]?.trim();
    const description = frontmatter?.match(/^description: (.+)$/m)?.[1]?.trim();
    if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name !== path.basename(path.dirname(file))) {
      failures.push(`Skill name must match its directory: ${file}`);
    }
    if (!description || /^[>|]/.test(description)) failures.push(`Use a single-line description: ${file}`);
    if (names.has(name)) failures.push(`Duplicate skill name: ${name}`);
    names.add(name);
    skillBytes += Buffer.byteLength(body);
    metadataBytes += Buffer.byteLength(frontmatter || "");
  }

  const documents = [
    "AGENTS.md", "docs/brain/START-HERE.md", "docs/brain/AGENT_TASK_BRIEF.md",
    "docs/engineering/AGENT_WORKFLOW.md", "docs/verification/TASK_GATES.md",
    "docs/brain/decisions/2026-09-12-selective-agent-guidance.md", ...skills
  ];
  for (const file of documents) {
    if (!existsSync(path.join(root, file))) { failures.push(`Missing ${file}`); continue; }
    const body = read(file);
    for (const match of body.matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
      const resolved = path.resolve(root, path.dirname(file), decodeURIComponent(target));
      const relative = path.relative(root, resolved);
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !existsSync(resolved)) {
        failures.push(`Broken or external local reference in ${file}: ${target}`);
      }
    }
    for (const match of body.matchAll(/npm run ([a-z][a-z0-9:-]*)/g)) {
      if (!pkg.scripts[match[1]]) failures.push(`Unknown npm script in ${file}: ${match[1]}`);
    }
  }

  const cases = JSON.parse(read("tests/fixtures/agent-instructions/cases.json"));
  const ids = new Set();
  for (const item of cases) {
    if (!item.id || ids.has(item.id) || !item.prompt || !item.acceptance?.length || !Array.isArray(item.expectedSkills)) {
      failures.push(`Invalid or duplicate evaluation case: ${item.id}`);
    }
    ids.add(item.id);
    for (const name of item.expectedSkills || []) {
      if (!names.has(name)) failures.push(`Evaluation ${item.id} references missing skill: ${name}`);
    }
  }
  return {
    failures, skillCount: skills.length, skillBytes, metadataBytes,
    bootstrapBytes: Buffer.byteLength(read("AGENTS.md")) + Buffer.byteLength(read("docs/brain/START-HERE.md")),
    evaluationCases: cases.length
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = checkAgentInstructions();
    console.log(JSON.stringify(result, null, 2));
    console.log("Fixture validation is structural; skill selection and outcomes require the documented model evaluation.");
    process.exitCode = result.failures.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
