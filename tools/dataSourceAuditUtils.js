import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  activeRuntimeSourceFiles,
  bannedRuntimePhrases,
  legacyCandidateFiles,
  sourceOfTruthRegistry
} from "../src/data/sourceOfTruthRegistry.js";

export { sourceOfTruthRegistry };

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const AUDITED_ROOTS = [
  "src/data",
  "src/data/generated",
  "tools",
  "docs/assets",
  "docs/imports",
  "docs/validation",
  "public/media",
  "public/images",
  "public/audio"
];

export const BAD_PATTERN_DEFINITIONS = [
  ["direct_hfw_tap_word", /Tap the word/i],
  ["direct_hfw_find_word", /Find the word/i],
  ["direct_hfw_which_word_says", /Which word says/i],
  ["banned_before_snack", /before snack/i],
  ["banned_with_a_smile", /with a smile/i],
  ["banned_train_slowed", /When the train slowed/i],
  ["banned_ball_bounced", /When the ball bounced/i],
  ["banned_may_choose_book", /may choose a book/i],
  ["banned_truck_gate", /truck stopped by the gate/i],
  ["inline_svg_image", /data:image\/svg|<svg|%3Csvg/i],
  ["fake_text_card_image", /text-card|fake[_-]?image|placeholder[_-]?card/i],
  ["photorealistic", /photorealistic/i],
  ["rainbow_or_pride_flag", /rainbow flag|pride flag/i],
  ["legacy_marker", /deprecated|legacy|old|archive|rejected/i],
  ["file_existence_as_approval", /file exists|fs\.existsSync|publicPathExists|pathExists/i]
];

const IMPORT_RE = /import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\(["']([^"']+)["']\)|require\(["']([^"']+)["']\)/g;
const PACKAGE_SCRIPT_RE = /"([^"]+)":\s*"([^"]+)"/g;
const TEXT_EXTENSIONS = new Set([
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".md", ".txt", ".csv", ".html", ".css", ".svg"
]);
const MAX_TEXT_SCAN_BYTES = 512 * 1024;

export function normalizePath(filePath = "") {
  return filePath.split(path.sep).join("/");
}

export function repoPath(absolutePath = "") {
  return normalizePath(path.relative(repoRoot, absolutePath));
}

export function readText(filePath) {
  try {
    const absolutePath = path.join(repoRoot, filePath);
    if (!TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return "";
    const stat = fs.statSync(absolutePath);
    const fd = fs.openSync(absolutePath, "r");
    const buffer = Buffer.alloc(Math.min(stat.size, MAX_TEXT_SCAN_BYTES));
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    return buffer.toString("utf8");
  } catch {
    return "";
  }
}

export function walkFiles(root) {
  const absoluteRoot = path.join(repoRoot, root);
  if (!fs.existsSync(absoluteRoot)) return [];
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if ([".git", "node_modules", "dist", "playwright-report", "test-results"].includes(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile()) {
        files.push(repoPath(absolute));
      }
    }
  };
  walk(absoluteRoot);
  return files;
}

export function auditedFiles() {
  return [...new Set(AUDITED_ROOTS.flatMap(walkFiles))].sort();
}

export function gitTrackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .map(normalizePath);
}

export function gitStatusEntries() {
  return execFileSync("git", ["status", "--porcelain=v1", "-z"], { cwd: repoRoot, encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .map(token => ({
      status: token.slice(0, 2),
      path: normalizePath(token.slice(3))
    }))
    .filter(entry => entry.path);
}

export function resolveImport(importer, specifier) {
  if (!specifier || specifier.startsWith("@/")) {
    specifier = specifier.replace(/^@\//, "src/");
    const absolute = path.resolve(repoRoot, specifier);
    return resolveExisting(absolute);
  }
  if (!specifier.startsWith(".")) return "";
  return resolveExisting(path.resolve(repoRoot, path.dirname(importer), specifier));
}

function resolveExisting(base) {
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    path.join(base, "index.js")
  ];
  const found = candidates.find(candidate => fs.existsSync(candidate));
  return found ? repoPath(found) : "";
}

export function collectImportGraph(files = auditedFiles()) {
  const fileSet = new Set(files);
  const importsFrom = new Map(files.map(file => [file, new Set()]));
  const importedBy = new Map(files.map(file => [file, new Set()]));

  for (const file of files) {
    if (!/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(file)) continue;
    const text = readText(file);
    let match;
    while ((match = IMPORT_RE.exec(text))) {
      const specifier = match[1] || match[2] || match[3] || "";
      const resolved = resolveImport(file, specifier);
      if (!resolved) continue;
      importsFrom.get(file)?.add(resolved);
      if (!importedBy.has(resolved)) importedBy.set(resolved, new Set());
      importedBy.get(resolved).add(file);
      if (!fileSet.has(resolved)) {
        importsFrom.set(resolved, importsFrom.get(resolved) || new Set());
      }
    }
  }

  return { importsFrom, importedBy };
}

export function packageScriptTargets() {
  const packageText = readText("package.json");
  const targets = new Map();
  let match;
  while ((match = PACKAGE_SCRIPT_RE.exec(packageText))) {
    const [, scriptName, command] = match;
    const commandTargets = [...command.matchAll(/\b(?:node|vite-node)\s+([^\s]+)/g)]
      .map(item => item[1])
      .filter(Boolean)
      .map(normalizePath);
    targets.set(scriptName, commandTargets);
  }
  return targets;
}

export function scanBadPatterns(filePath) {
  const text = readText(filePath);
  if (!text) return [];
  const hits = BAD_PATTERN_DEFINITIONS
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name);
  for (const phrase of bannedRuntimePhrases) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) hits.push(`banned_phrase:${phrase}`);
  }
  return [...new Set(hits)];
}

export function currentRuntimeEntryFiles() {
  return [
    "src/App.jsx",
    "src/data/loadAssessmentSkillBank.js",
    "src/data/questionMediaResolver.js",
    "src/data/assessmentMediaPicker.js",
    "src/data/assessmentMediaRegistry.js",
    ...Array.from(activeRuntimeSourceFiles)
  ];
}

export function reachableFrom(entries, importsFrom) {
  const seen = new Set();
  const stack = entries.filter(Boolean);
  while (stack.length) {
    const file = stack.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    for (const next of importsFrom.get(file) || []) {
      if (!seen.has(next)) stack.push(next);
    }
  }
  return seen;
}

export function classifyFile(filePath, graph, scriptTargets) {
  const importsFrom = Array.from(graph.importsFrom.get(filePath) || []);
  const importedBy = Array.from(graph.importedBy.get(filePath) || []);
  const packageScripts = Array.from(scriptTargets.entries())
    .filter(([, targets]) => targets.includes(filePath))
    .map(([name]) => name);
  const badPatterns = scanBadPatterns(filePath);
  const referencedByRuntimeLoader = importedBy.includes("src/data/loadAssessmentSkillBank.js") ||
    currentRuntimeEntryFiles().includes(filePath) ||
    activeRuntimeSourceFiles.has(filePath);
  const referencedByGenerator = importedBy.some(item => item.startsWith("tools/generate") || item.startsWith("tools/import"));
  const referencedByValidationScript = importedBy.some(item => item.startsWith("tools/check") || item.startsWith("tools/audit"));
  const referencedByPackageScript = packageScripts.length > 0;

  let category = "unknown";
  let recommendedAction = "review_manually";
  let reason = "No clear source-of-truth classification.";

  if (activeRuntimeSourceFiles.has(filePath) || referencedByRuntimeLoader) {
    category = "active_runtime";
    recommendedAction = "keep";
    reason = "Listed as active runtime source or imported by runtime loader.";
  } else if (filePath.startsWith("tools/generate") || filePath.startsWith("tools/import")) {
    category = "generator_source";
    recommendedAction = "keep";
    reason = "Generator/import tooling.";
  } else if (filePath.startsWith("tools/") || filePath.startsWith("docs/validation/")) {
    category = "validation_only";
    recommendedAction = "keep";
    reason = "Validation or audit tooling/output.";
  } else if (filePath.startsWith("docs/")) {
    category = "docs_only";
    recommendedAction = badPatterns.length ? "archive" : "keep";
    reason = badPatterns.length ? "Docs contain stale/legacy markers." : "Documentation only.";
  } else if (filePath.startsWith("public/")) {
    category = "media_asset";
    recommendedAction = importedBy.length ? "keep" : "review_manually";
    reason = importedBy.length ? "Referenced by source file." : "Media asset not directly imported; manifest/reference audit needed.";
  } else if (legacyCandidateFiles.has(filePath) || badPatterns.some(hit => /legacy|direct_hfw|inline_svg|fake_text_card/.test(hit))) {
    category = "legacy_candidate";
    recommendedAction = referencedByRuntimeLoader ? "block_from_runtime" : "archive";
    reason = "Matches legacy/outdated source patterns.";
  } else if (!importedBy.length && !referencedByPackageScript) {
    category = "unused_candidate";
    recommendedAction = "review_manually";
    reason = "No imports or package script references found.";
  }

  return {
    filePath,
    category,
    importedBy,
    importsFrom,
    referencedByRuntimeLoader,
    referencedByGenerator,
    referencedByValidationScript,
    referencedByPackageScript,
    packageScripts,
    badPatterns,
    lastMeaningfulRole: reason,
    recommendedAction,
    reason
  };
}

export function markdownTable(headers, rows) {
  const escape = value => String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(escape).join(" | ")} |`)
  ].join("\n");
}
