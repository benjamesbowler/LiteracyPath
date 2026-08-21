import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECKER_PATH = "tools/checkLiteracyOnlyDomain.mjs";
const CHECKER_TEST_PATH = "tests/unit/literacyOnlyDomain.test.js";
const CLEANUP_TOMBSTONE = "supabase/migrations/20260821220000_retired_domain_cleanup.sql";
const TEXT_EXTENSION = /\.(?:c?js|mjs|jsx|ts|tsx|json|md|html|css|csv|sql|py|toml|ya?ml|txt)$/i;
const RETIRED_CONTENT = /\b(?:maths?|mathematics|mathematical(?:ly)?|numeracy)\b|shapes_and_math/i;
const RETIRED_PATH = /(?:^|[/_.-])(?:maths?|mathematics|numeracy)(?:$|[/_.-])/i;
const FIRST_PARTY_PATH = /^(?:src|public|docs|tools|tests|supabase\/migrations)\//;

function trackedAndUntrackedFiles(root) {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  ).split("\0").filter(Boolean);
}

function withoutProgrammingPrimitives(content) {
  return content
    .replace(/\b(?:Phaser\.)?Math\.[A-Za-z_$][\w$]*/g, "")
    .replace(/\bMath\\\.[A-Za-z_$][\w$]*/g, "")
    .replace(/\bPhaser\.Math\b/g, "")
    .replace(/node_modules\/phaser\/src\/math\//g, "");
}

function tombstoneIssues(content) {
  const issues = [];
  if (!/drop\s+(?:table|function)/i.test(content)) {
    issues.push(`${CLEANUP_TOMBSTONE}: must remain a deletion-only cleanup tombstone`);
  }
  if (/create\s+(?:table|function|view)[\s\S]{0,160}?maths?/i.test(content)) {
    issues.push(`${CLEANUP_TOMBSTONE}: must never recreate a retired domain object`);
  }
  return issues;
}

export function validateLiteracyOnlyDomain({ root = repoRoot, files } = {}) {
  const issues = [];
  const candidates = files || trackedAndUntrackedFiles(root);
  for (const relativePath of candidates) {
    const normalized = relativePath.split(path.sep).join("/");
    if ([CHECKER_PATH, CHECKER_TEST_PATH].includes(normalized)) continue;
    if (!FIRST_PARTY_PATH.test(normalized) && !["package.json", "vite.config.js", "README.md"].includes(normalized)) continue;
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) continue;
    if (normalized === CLEANUP_TOMBSTONE) {
      issues.push(...tombstoneIssues(fs.readFileSync(absolutePath, "utf8")));
      continue;
    }
    if (RETIRED_PATH.test(normalized)) issues.push(`${normalized}: retired domain term remains in its path`);
    if (!TEXT_EXTENSION.test(normalized)) continue;
    const content = withoutProgrammingPrimitives(fs.readFileSync(absolutePath, "utf8"));
    const match = RETIRED_CONTENT.exec(content);
    if (match) {
      const line = content.slice(0, match.index).split("\n").length;
      issues.push(`${normalized}:${line}: retired domain term "${match[0]}" remains`);
    }
  }
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = validateLiteracyOnlyDomain();
  if (issues.length) {
    console.error(`Literacy-only domain verification failed with ${issues.length} issue(s):`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log("Literacy-only domain verified: no retired domain feature, content, media path, or schema object remains.");
  }
}
