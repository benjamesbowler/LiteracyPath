import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  activeRuntimeSourceFiles,
  bannedRuntimePhrases,
  isFakeTextCardImage,
  legacyCandidateFiles
} from "../src/data/sourceOfTruthRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, "docs", "validation", "repo_hygiene_audit.md");
const reportRelativePath = normalizePath(path.relative(repoRoot, reportPath));

const LIVE_MEDIA_ROOTS = [
  "public/images",
  "public/audio",
  "public/media",
  "public/guided-reading"
];

const APPROVED_LARGE_ROOTS = LIVE_MEDIA_ROOTS;
const ROOT_PREVIEW_RE = /preview.*\.html$/i;
const BACKUP_EXTENSIONS = new Set([".bak", ".tmp", ".old"]);
const ZIP_EXTENSIONS = new Set([".zip"]);
const SOURCE_MEDIA_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".psd", ".ai", ".zip", ".md"]);
const HARD_SOURCE_EXTENSIONS = new Set([".psd", ".ai", ".zip", ".md"]);
const TEMP_ROOT_NAMES = new Set([".tmp", "tmp", "temp", "temporary"]);
const SKIP_DIRS = new Set([".cache", ".git", "node_modules", "dist", "playwright-report", "test-results"]);

const ACTIVE_REQUEST_PATTERNS = [
  /docs\/assets\/[^/]*kimi[^/]*request[^/]*\.md$/i,
  /docs\/assets\/[^/]*media[^/]*request[^/]*\.md$/i,
  /docs\/assets\/[^/]*image[^/]*replacement[^/]*request[^/]*\.md$/i,
  /docs\/assets\/[^/]*audio[^/]*replacement[^/]*request[^/]*\.md$/i,
  /docs\/assets\/[^/]*missing[^/]*media[^/]*\.md$/i,
  /docs\/assets\/[^/]*replacement[^/]*request[^/]*\.md$/i
];

const ALLOWED_NEW_REQUEST_DOCS = new Set([
  "docs/assets/kimi_story_quest_last_two_books_image_redo_request.md"
]);

const GENERATED_NOISE_PATTERNS = [
  /^docs\/validation\/.*\.(md|json)$/i,
  /^docs\/guided-reading\/.*audit.*\.md$/i,
  /^docs\/assets\/story_quest_asset_audit\.md$/i,
  /^src\/data\/generated\/.*\.js$/i
];
const RUNTIME_ENTRY_FILES = [
  "src/App.jsx",
  "src/data/loadAssessmentSkillBank.js",
  "tools/phonicsRuntimeUtils.js"
];
const IMPORT_RE = /import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\(["']([^"']+)["']\)|require\(["']([^"']+)["']\)/g;

function runGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function normalizePath(filePath = "") {
  return filePath.split(path.sep).join("/");
}

function isUnderRoot(filePath, root) {
  return filePath === root || filePath.startsWith(`${root}/`);
}

function isLiveMediaPath(filePath) {
  return LIVE_MEDIA_ROOTS.some(root => isUnderRoot(filePath, root));
}

function isApprovedLargePath(filePath) {
  return APPROVED_LARGE_ROOTS.some(root => isUnderRoot(filePath, root));
}

function isArchivedAssetDoc(filePath) {
  return isUnderRoot(filePath, "docs/assets/archive");
}

function isActiveRequestDoc(filePath) {
  return !isArchivedAssetDoc(filePath) && ACTIVE_REQUEST_PATTERNS.some(pattern => pattern.test(filePath));
}

function isGeneratedNoise(filePath) {
  return GENERATED_NOISE_PATTERNS.some(pattern => pattern.test(filePath));
}

function isRootFile(filePath) {
  return !filePath.includes("/");
}

function isRootPreviewHtml(filePath) {
  return isRootFile(filePath) && ROOT_PREVIEW_RE.test(filePath);
}

function isTempRootPath(filePath) {
  const [firstSegment] = filePath.split("/");
  const lower = firstSegment.toLowerCase();
  return TEMP_ROOT_NAMES.has(lower) || lower.startsWith("temp-") || lower.startsWith("tmp-");
}

function basename(filePath) {
  return path.posix.basename(filePath).toLowerCase();
}

function extension(filePath) {
  return path.posix.extname(filePath).toLowerCase();
}

function isBackupFile(filePath) {
  return BACKUP_EXTENSIONS.has(extension(filePath));
}

function isZipFile(filePath) {
  return ZIP_EXTENSIONS.has(extension(filePath));
}

function isWebpFile(filePath) {
  return extension(filePath) === ".webp";
}

function isDsStore(filePath) {
  return basename(filePath) === ".ds_store";
}

function isSourceName(filePath) {
  const name = basename(filePath);
  const startsWithMarker = (marker) => (
    name === marker ||
    name.startsWith(`${marker}.`) ||
    name.startsWith(`${marker}-`) ||
    name.startsWith(`${marker}_`)
  );

  return (
    name === "plan.md" ||
    startsWithMarker("reference") ||
    startsWithMarker("source") ||
    startsWithMarker("temp") ||
    startsWithMarker("draft")
  );
}

function isSourceMediaCandidate(filePath) {
  if (!isLiveMediaPath(filePath)) return false;
  const ext = extension(filePath);
  if (SOURCE_MEDIA_EXTENSIONS.has(ext)) return true;
  return isSourceName(filePath) && !isWebpFile(filePath);
}

function isHardTrackedMediaSource(filePath) {
  if (!isLiveMediaPath(filePath)) return false;
  const ext = extension(filePath);
  if (HARD_SOURCE_EXTENSIONS.has(ext)) return true;
  return isSourceName(filePath) && !isWebpFile(filePath);
}

function isSuspiciousWebpMediaName(filePath) {
  return isLiveMediaPath(filePath) && isWebpFile(filePath) && isSourceName(filePath);
}

function parseStatus(output) {
  const tokens = output.split("\0").filter(Boolean);
  const entries = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const x = token[0] || " ";
    const y = token[1] || " ";
    const filePath = normalizePath(token.slice(3));
    if (!filePath) continue;

    entries.push({
      path: filePath,
      indexStatus: x,
      worktreeStatus: y,
      staged: x !== " " && x !== "?",
      untracked: x === "?" && y === "?",
      deleted: x === "D" || y === "D",
      added: x === "A" || x === "?" || y === "A",
      modified: x === "M" || y === "M"
    });

    if (x === "R" || x === "C") index += 1;
  }

  return entries;
}

function collectGitContext() {
  const statusEntries = parseStatus(runGit(["status", "--porcelain=v1", "-z"]));
  const tracked = runGit(["ls-files", "-z"]).split("\0").filter(Boolean).map(normalizePath);
  const untracked = runGit(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .map(normalizePath);

  return {
    statusEntries,
    statusByPath: new Map(statusEntries.map(entry => [entry.path, entry])),
    tracked: new Set(tracked),
    untracked: new Set(untracked),
    allGitPaths: [...new Set([...tracked, ...untracked])].sort()
  };
}

function readRepoText(filePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
  } catch {
    return "";
  }
}

function resolveLocalImport(importer, specifier) {
  if (!specifier) return "";
  const normalizedSpecifier = specifier.startsWith("@/")
    ? specifier.replace(/^@\//, "src/")
    : specifier;
  if (!normalizedSpecifier.startsWith(".") && !normalizedSpecifier.startsWith("src/")) return "";
  const base = normalizedSpecifier.startsWith("src/")
    ? path.join(repoRoot, normalizedSpecifier)
    : path.resolve(repoRoot, path.dirname(importer), normalizedSpecifier);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    path.join(base, "index.js")
  ];
  const found = candidates.find(candidate => fs.existsSync(candidate));
  return found ? normalizePath(path.relative(repoRoot, found)) : "";
}

function collectStaticImports(filePath) {
  const text = readRepoText(filePath);
  const imports = [];
  let match;
  while ((match = IMPORT_RE.exec(text))) {
    const specifier = match[1] || match[2] || match[3] || "";
    const resolved = resolveLocalImport(filePath, specifier);
    if (resolved) imports.push(resolved);
  }
  return imports;
}

function packageScriptTargets() {
  const packageJson = JSON.parse(readRepoText("package.json") || "{}");
  return Object.entries(packageJson.scripts || {}).flatMap(([scriptName, command]) =>
    [...String(command).matchAll(/\bnode\s+([^\s]+)/g)].map(match => ({
      scriptName,
      target: normalizePath(match[1])
    }))
  );
}

function walkFilesAndDirs(relativeDir = ".") {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];

  const rows = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = normalizePath(path.join(relativeDir, entry.name).replace(/^\.\//, ""));
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;

    rows.push({
      path: relativePath,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    });

    if (entry.isDirectory()) {
      rows.push(...walkFilesAndDirs(relativePath));
    }
  }
  return rows;
}

function escapeMarkdown(value = "") {
  return String(value).replaceAll("|", "\\|").replace(/\n+/g, " ").trim();
}

function markdownTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => escapeMarkdown(value)).join(" | ")} |`)
  ].join("\n");
}

function addFinding(collection, severity, pathValue, reason, suggestion = "") {
  const key = `${severity}:${pathValue}:${reason}`;
  if (collection.some(item => item.key === key)) return;
  collection.push({ key, severity, path: pathValue, reason, suggestion });
}

function restoreOrRemoveSuggestion(filePath, gitContext) {
  if (gitContext.untracked.has(filePath)) return `rm -f ${filePath}`;
  return `git restore ${filePath}`;
}

function removeSuggestion(filePath, isDirectory = false) {
  return isDirectory ? `rm -rf ${filePath}` : `rm -f ${filePath}`;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function collectLargeFiles(gitPaths) {
  return gitPaths
    .map(filePath => {
      const absolutePath = path.join(repoRoot, filePath);
      if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;
      const size = fs.statSync(absolutePath).size;
      return { path: filePath, size };
    })
    .filter(Boolean)
    .filter(entry => entry.size > 5 * 1024 * 1024 || entry.size > 20 * 1024 * 1024)
    .sort((a, b) => b.size - a.size);
}

function renderFindings(items) {
  return markdownTable(
    ["Path", "Reason", "Suggested cleanup"],
    items.map(item => [item.path, item.reason, item.suggestion || "Review manually"])
  );
}

function renderReport({ failures, warnings, ignored, summaryRows }) {
  return `# Repo Hygiene Audit

Date: ${new Date().toISOString()}

This guardrail reports temporary, preview, stale request, generated, or accidental files that may be risky to commit. It does not delete or restore anything.

## Summary

${markdownTable(["Metric", "Count"], summaryRows)}

## Result

${failures.length ? "FAIL" : "PASS"}

## Failures

${renderFindings(failures)}

## Warnings

${renderFindings(warnings)}

## Ignored Or Allowed Items

${renderFindings(ignored)}

## Safe Cleanup Examples

${failures.length ? [...new Set(failures.map(item => item.suggestion).filter(Boolean))].map(command => `- ${command}`).join("\n") : "_None needed._"}
`;
}

function main() {
  const gitContext = collectGitContext();
  const fsEntries = walkFilesAndDirs(".");
  const fsByPath = new Map(fsEntries.map(entry => [entry.path, entry]));
  const failures = [];
  const warnings = [];
  const ignored = [];

  for (const entry of fsEntries) {
    const filePath = entry.path;

    if (isDsStore(filePath)) {
      addFinding(failures, "failure", filePath, ".DS_Store file found.", removeSuggestion(filePath));
    }

    if (isRootPreviewHtml(filePath)) {
      addFinding(failures, "failure", filePath, "Root preview HTML file found.", removeSuggestion(filePath));
    }

    if (isZipFile(filePath)) {
      addFinding(failures, "failure", filePath, "Zip file found in repo working tree.", removeSuggestion(filePath));
    }

    if (isBackupFile(filePath)) {
      addFinding(failures, "failure", filePath, "Backup/temp extension found.", removeSuggestion(filePath));
    }

    if (isTempRootPath(filePath)) {
      addFinding(failures, "failure", filePath, "Temporary path found at repo root.", removeSuggestion(filePath, entry.isDirectory));
    }
  }

  for (const riskyDir of [
    "public/test_audio",
    "public/audio/story-quests/sam-alf",
    "public/images/story-quests/sam-alf"
  ]) {
    if (fsByPath.has(riskyDir) || gitContext.allGitPaths.some(filePath => isUnderRoot(filePath, riskyDir))) {
      addFinding(failures, "failure", riskyDir, "Legacy/test public media folder found.", `rm -rf ${riskyDir}`);
    }
  }

  for (const entry of gitContext.statusEntries) {
    if (isSourceMediaCandidate(entry.path)) {
      addFinding(
        failures,
        "failure",
        entry.path,
        "Changed source/reference/temp file in live public media folder.",
        restoreOrRemoveSuggestion(entry.path, gitContext)
      );
    } else if (isSuspiciousWebpMediaName(entry.path)) {
      addFinding(
        warnings,
        "warning",
        entry.path,
        "Changed .webp media file has a source/reference/temp/draft-style name.",
        "Review before committing."
      );
    } else if (entry.untracked && isWebpFile(entry.path) && isSourceName(entry.path) && !isLiveMediaPath(entry.path)) {
      addFinding(
        failures,
        "failure",
        entry.path,
        "New source/reference/temp/draft-named .webp file is outside expected media folders.",
        removeSuggestion(entry.path)
      );
    }
  }

  for (const filePath of gitContext.tracked) {
    if (isHardTrackedMediaSource(filePath)) {
      addFinding(
        failures,
        "failure",
        filePath,
        "Tracked source/reference/temp file in live public media folder.",
        "Review manually; move source files outside live public media folders."
      );
    } else if (isSuspiciousWebpMediaName(filePath)) {
      addFinding(
        ignored,
        "allowed",
        filePath,
        "Existing tracked .webp media file has a source/reference/temp/draft-style name.",
        "Allowed unless changed."
      );
    } else if (isLiveMediaPath(filePath) && SOURCE_MEDIA_EXTENSIONS.has(extension(filePath))) {
      addFinding(
        ignored,
        "allowed",
        filePath,
        "Existing tracked legacy non-webp public media file.",
        "Allowed in this pass unless changed."
      );
    }
  }

  for (const filePath of gitContext.allGitPaths) {
    const status = gitContext.statusByPath.get(filePath);

    if (isActiveRequestDoc(filePath)) {
      if (ALLOWED_NEW_REQUEST_DOCS.has(filePath)) {
        addFinding(ignored, "allowed", filePath, "Approved active request document for current Story Quest image replacement pass.", "Allowed.");
      } else if (status?.added || gitContext.untracked.has(filePath)) {
        addFinding(failures, "failure", filePath, "New active docs/assets media request document found.", removeSuggestion(filePath));
      } else {
        addFinding(warnings, "warning", filePath, "Existing active docs/assets media request document may be stale.", "Review or archive if stale.");
      }
    }

    if (filePath !== reportRelativePath && isGeneratedNoise(filePath) && status && !status.staged) {
      addFinding(warnings, "warning", filePath, "Generated/audit file has unstaged working-tree noise.", restoreOrRemoveSuggestion(filePath, gitContext));
    }

    if (filePath.startsWith("docs/implementation/") && gitContext.untracked.has(filePath)) {
      addFinding(warnings, "warning", filePath, "Untracked implementation doc.", `git add ${filePath} or rm -f ${filePath}`);
    }
  }

  for (const { scriptName, target } of packageScriptTargets()) {
    if (!fs.existsSync(path.join(repoRoot, target))) {
      addFinding(
        failures,
        "failure",
        target,
        `Package script "${scriptName}" points to a missing file.`,
        "Create the script file, correct package.json, or remove the stale script."
      );
    }
  }

  for (const runtimeFile of RUNTIME_ENTRY_FILES) {
    for (const imported of collectStaticImports(runtimeFile)) {
      if (legacyCandidateFiles.has(imported) || /\/(?:archive|legacy)\//i.test(imported)) {
        addFinding(
          failures,
          "failure",
          runtimeFile,
          `Runtime entry imports legacy/archive source: ${imported}.`,
          "Remove the runtime import or move it behind validation-only tooling."
        );
      }
    }
  }

  for (const filePath of activeRuntimeSourceFiles) {
    const text = readRepoText(filePath);
    if (!text) continue;
    const phrase = bannedRuntimePhrases.find(item => text.toLowerCase().includes(item.toLowerCase()));
    if (phrase) {
      addFinding(
        warnings,
        "warning",
        filePath,
        `Runtime source contains banned phrase "${phrase}".`,
        "Review whether this is validation-only text or selectable content."
      );
    }
    if (isFakeTextCardImage(text)) {
      addFinding(
        warnings,
        "warning",
        filePath,
        "Runtime source contains inline SVG/text-card image data.",
        "Ensure source-of-truth guards block this from selectable runtime."
      );
    }
    if (/photorealistic/i.test(text)) {
      addFinding(
        warnings,
        "warning",
        filePath,
        "Runtime source mentions photorealistic assessment imagery.",
        "Review asset style and QA status."
      );
    }
  }

  for (const entry of collectLargeFiles(gitContext.allGitPaths)) {
    if (entry.size > 20 * 1024 * 1024) {
      addFinding(
        warnings,
        "warning",
        entry.path,
        `Large file over 20 MB: ${formatBytes(entry.size)}.`,
        "Review before committing."
      );
    } else if (!isApprovedLargePath(entry.path)) {
      addFinding(
        warnings,
        "warning",
        entry.path,
        `Large file over 5 MB outside approved media folders: ${formatBytes(entry.size)}.`,
        "Review before committing."
      );
    } else {
      addFinding(
        ignored,
        "allowed",
        entry.path,
        `Large file in approved media location: ${formatBytes(entry.size)}.`,
        "Allowed media location."
      );
    }
  }

  const summaryRows = [
    ["Failures", failures.length],
    ["Warnings", warnings.length],
    ["Ignored/allowed items", ignored.length],
    ["Git status entries", gitContext.statusEntries.length],
    ["Tracked files inspected", gitContext.tracked.size],
    ["Untracked files inspected", gitContext.untracked.size]
  ];

  console.table([{
    failures: failures.length,
    warnings: warnings.length,
    ignoredAllowed: ignored.length,
    result: failures.length ? "FAIL" : "PASS"
  }]);

  console.log("\nFailures");
  failures.length ? console.table(failures.map(({ path: filePath, reason, suggestion }) => ({ path: filePath, reason, suggestion }))) : console.log("None.");

  console.log("\nWarnings");
  warnings.length ? console.table(warnings.map(({ path: filePath, reason, suggestion }) => ({ path: filePath, reason, suggestion }))) : console.log("None.");

  console.log("\nIgnored/allowed items");
  ignored.length ? console.table(ignored.slice(0, 30).map(({ path: filePath, reason }) => ({ path: filePath, reason }))) : console.log("None.");
  if (ignored.length > 30) console.log(`...and ${ignored.length - 30} more ignored/allowed items.`);

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderReport({ failures, warnings, ignored, summaryRows }));
  console.log(`\nWrote ${path.relative(repoRoot, reportPath)}`);

  if (!failures.length && !warnings.length) {
    console.log("Repo hygiene check passed.");
  } else if (!failures.length) {
    console.log(`Repo hygiene check passed with ${warnings.length} warning(s).`);
  } else {
    console.error(`Repo hygiene check failed with ${failures.length} failure(s).`);
    process.exitCode = 1;
  }
}

main();
