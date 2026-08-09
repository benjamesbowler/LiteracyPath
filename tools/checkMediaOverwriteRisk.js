import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, ".artifacts", "audits", "media_overwrite_risk_audit.md");

const LIVE_ROOTS = [
  "public/images",
  "public/audio",
  "public/guided-reading",
  "public/media"
];

const IMAGE_ROOTS = [
  "public/images",
  "public/guided-reading",
  "public/media"
];

const MEDIA_EXTENSIONS = new Set([
  ".aac",
  ".aif",
  ".aiff",
  ".avif",
  ".gif",
  ".m4a",
  ".mp3",
  ".ogg",
  ".svg",
  ".wav",
  ".webm",
  ".webp"
]);

const NON_WEBP_IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg"
]);

const TEMP_SOURCE_EXTENSIONS = new Set([
  ".ai",
  ".ase",
  ".bak",
  ".cr2",
  ".jpeg",
  ".jpg",
  ".json~",
  ".md",
  ".pdf",
  ".png",
  ".psb",
  ".psd",
  ".sketch",
  ".tmp",
  ".tif",
  ".tiff",
  ".zip"
]);

const TEMP_SOURCE_BASENAMES = new Set([
  ".ds_store",
  "plan.md",
  "reference.md",
  "references.md"
]);

function runGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
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
  return LIVE_ROOTS.some(root => isUnderRoot(filePath, root));
}

function isLiveImagePath(filePath) {
  return IMAGE_ROOTS.some(root => isUnderRoot(filePath, root));
}

function statusLabel(code) {
  if (code === "A") return "added";
  if (code === "D") return "deleted";
  if (code === "M") return "modified";
  if (code === "R") return "renamed";
  if (code === "C") return "copied";
  if (code === "T") return "typechanged";
  return code || "changed";
}

function parseDiffNameStatus(output) {
  const tokens = output.split("\0").filter(Boolean);
  const entries = [];

  for (let index = 0; index < tokens.length;) {
    const status = tokens[index++];
    if (!status) break;
    const code = status[0];

    if (code === "R" || code === "C") {
      const oldPath = normalizePath(tokens[index++] || "");
      const newPath = normalizePath(tokens[index++] || "");
      if (oldPath) entries.push({ status: code === "R" ? "D" : "M", path: oldPath, source: "git diff" });
      if (newPath) entries.push({ status: code === "R" ? "A" : "A", path: newPath, source: "git diff" });
      continue;
    }

    const filePath = normalizePath(tokens[index++] || "");
    if (filePath) entries.push({ status: code, path: filePath, source: "git diff" });
  }

  return entries;
}

function parseUntracked(output) {
  return output
    .split("\0")
    .filter(Boolean)
    .map(filePath => ({
      status: "A",
      path: normalizePath(filePath),
      source: "git untracked"
    }));
}

function collectChangedPaths() {
  const diffEntries = parseDiffNameStatus(runGit([
    "diff",
    "--name-status",
    "-z",
    "HEAD",
    "--",
    ...LIVE_ROOTS
  ]));

  const untrackedEntries = parseUntracked(runGit([
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
    "--",
    ...LIVE_ROOTS
  ]));

  const byKey = new Map();
  [...diffEntries, ...untrackedEntries]
    .filter(entry => isLiveMediaPath(entry.path))
    .forEach(entry => {
      const key = `${entry.status}:${entry.path}`;
      if (!byKey.has(key)) byKey.set(key, entry);
    });

  return [...byKey.values()].sort((a, b) => a.path.localeCompare(b.path) || a.status.localeCompare(b.status));
}

function getExtension(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".json~")) return ".json~";
  return path.posix.extname(lower);
}

function isTempOrSourcePath(filePath) {
  const basename = path.posix.basename(filePath).toLowerCase();
  const ext = getExtension(filePath);

  return (
    TEMP_SOURCE_BASENAMES.has(basename) ||
    TEMP_SOURCE_EXTENSIONS.has(ext) ||
    basename.includes("reference") ||
    basename.includes("source") ||
    basename.includes("temp") ||
    basename.includes("tmp")
  );
}

function isNonWebpImagePath(filePath) {
  return isLiveImagePath(filePath) && NON_WEBP_IMAGE_EXTENSIONS.has(getExtension(filePath));
}

function isMediaFile(filePath) {
  return MEDIA_EXTENSIONS.has(getExtension(filePath));
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

function ensureReportDirectory() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
}

function renderReport({ changedEntries, deletedEntries, tempSourceEntries, nonWebpEntries, mediaEntries, warnings, failures }) {
  const summaryRows = [
    ["Changed paths in live media roots", changedEntries.length],
    ["Changed media files", mediaEntries.length],
    ["Deleted paths", deletedEntries.length],
    ["Temp/source paths", tempSourceEntries.length],
    ["Non-webp image paths changed", nonWebpEntries.length],
    ["Warnings", warnings.length],
    ["Failures", failures.length]
  ];

  const changedRows = changedEntries.map(entry => [
    statusLabel(entry.status),
    entry.path,
    isMediaFile(entry.path) ? "media" : "non-media/live-folder",
    [
      entry.status === "D" ? "deleted" : "",
      isTempOrSourcePath(entry.path) ? "temp/source" : "",
      isNonWebpImagePath(entry.path) ? "non-webp image" : ""
    ].filter(Boolean).join(", ") || "review"
  ]);

  return `# Media Overwrite Risk Audit

Date: ${new Date().toISOString()}

This guardrail checks current Git changes under:

${LIVE_ROOTS.map(root => `- ${root}`).join("\n")}

## Summary

${markdownTable(["Metric", "Count"], summaryRows)}

## Result

${failures.length ? "FAIL" : "PASS"}

## Warnings

${warnings.length ? warnings.map(warning => `- ${warning}`).join("\n") : "_None._"}

## Failures

${failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "_None._"}

## Changed Live Media Paths

${markdownTable(["Status", "Path", "Kind", "Risk"], changedRows)}
`;
}

function main() {
  const changedEntries = collectChangedPaths();
  const mediaEntries = changedEntries.filter(entry => isMediaFile(entry.path));
  const deletedEntries = changedEntries.filter(entry => entry.status === "D");
  const tempSourceEntries = changedEntries.filter(entry => isTempOrSourcePath(entry.path));
  const nonWebpEntries = changedEntries.filter(entry => isNonWebpImagePath(entry.path));

  const warnings = [];
  const failures = [];

  if (changedEntries.length > 0) {
    warnings.push("Live media folder changes detected. Review before committing to avoid overwriting approved media.");
    changedEntries.forEach(entry => warnings.push(`${statusLabel(entry.status)}: ${entry.path}`));
  }

  if (mediaEntries.length > 20) {
    warnings.push(`${mediaEntries.length} media files changed. This should be a dedicated media import commit.`);
  }

  if (deletedEntries.length) {
    failures.push(`Deleted live media paths detected: ${deletedEntries.length}.`);
  }

  if (tempSourceEntries.length) {
    failures.push(`Temp/source files detected in live media folders: ${tempSourceEntries.length}.`);
  }

  if (nonWebpEntries.length) {
    failures.push(`Non-webp image files detected in live image folders: ${nonWebpEntries.length}.`);
  }

  const summary = [
    {
      changedPaths: changedEntries.length,
      mediaFiles: mediaEntries.length,
      deleted: deletedEntries.length,
      tempSource: tempSourceEntries.length,
      nonWebpImages: nonWebpEntries.length,
      result: failures.length ? "FAIL" : "PASS"
    }
  ];

  console.table(summary);

  if (changedEntries.length) {
    console.log("\nChanged live media paths:");
    console.table(changedEntries.map(entry => ({
      status: statusLabel(entry.status),
      path: entry.path,
      risk: [
        entry.status === "D" ? "deleted" : "",
        isTempOrSourcePath(entry.path) ? "temp/source" : "",
        isNonWebpImagePath(entry.path) ? "non-webp image" : ""
      ].filter(Boolean).join(", ") || "review"
    })));
  }

  if (warnings.length) {
    console.log("\nWarnings:");
    warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (failures.length) {
    console.error("\nFailures:");
    failures.forEach(failure => console.error(`- ${failure}`));
  }

  ensureReportDirectory();
  fs.writeFileSync(reportPath, renderReport({
    changedEntries,
    deletedEntries,
    tempSourceEntries,
    nonWebpEntries,
    mediaEntries,
    warnings,
    failures
  }));

  console.log(`\nWrote ${path.relative(repoRoot, reportPath)}`);

  if (failures.length) {
    process.exitCode = 1;
  }
}

main();
