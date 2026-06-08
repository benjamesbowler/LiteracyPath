import fs from "node:fs";
import path from "node:path";

import {
  auditedFiles,
  classifyFile,
  collectImportGraph,
  markdownTable,
  packageScriptTargets,
  repoRoot,
  sourceOfTruthRegistry
} from "./dataSourceAuditUtils.js";

const outputJson = path.join(repoRoot, "docs/validation/repo_data_source_audit.json");
const outputMd = path.join(repoRoot, "docs/validation/repo_data_source_audit.md");

const files = auditedFiles();
const graph = collectImportGraph(files);
const packageScripts = packageScriptTargets();
const rows = files.map(file => classifyFile(file, graph, packageScripts));
const categoryCounts = rows.reduce((counts, row) => {
  counts[row.category] = (counts[row.category] || 0) + 1;
  return counts;
}, {});
const actionCounts = rows.reduce((counts, row) => {
  counts[row.recommendedAction] = (counts[row.recommendedAction] || 0) + 1;
  return counts;
}, {});
const legacyFindings = rows.filter(row =>
  row.category === "legacy_candidate" ||
  row.recommendedAction === "block_from_runtime" ||
  row.badPatterns.length
);

const report = {
  generatedAt: new Date().toISOString(),
  sourceOfTruthRegistry,
  summary: {
    filesAudited: rows.length,
    categoryCounts,
    actionCounts,
    legacyFindings: legacyFindings.length
  },
  files: rows
};

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);

const md = [
  "# Repo Data Source Audit",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Summary",
  "",
  markdownTable(
    ["Metric", "Value"],
    [
      ["Files audited", rows.length],
      ["Legacy / stale findings", legacyFindings.length],
      ["Recommended keep", actionCounts.keep || 0],
      ["Recommended archive", actionCounts.archive || 0],
      ["Recommended delete", actionCounts.delete || 0],
      ["Recommended block_from_runtime", actionCounts.block_from_runtime || 0],
      ["Recommended manual review", actionCounts.review_manually || 0]
    ]
  ),
  "",
  "## Category Counts",
  "",
  markdownTable(["Category", "Count"], Object.entries(categoryCounts).sort()),
  "",
  "## Legacy / Stale Pattern Findings",
  "",
  legacyFindings.length
    ? markdownTable(
      ["File", "Category", "Bad patterns", "Imported by", "Action", "Reason"],
      legacyFindings.slice(0, 250).map(row => [
        row.filePath,
        row.category,
        row.badPatterns.join(", "),
        row.importedBy.slice(0, 8).join("<br>"),
        row.recommendedAction,
        row.reason
      ])
    )
    : "None.",
  legacyFindings.length > 250 ? `\n\n_Only first 250 findings shown; see JSON for all ${legacyFindings.length}._` : "",
  "",
  "## Source Of Truth Areas",
  "",
  markdownTable(
    ["Area", "Role", "Active runtime files"],
    Object.entries(sourceOfTruthRegistry).map(([area, entry]) => [
      area,
      entry.role,
      (entry.activeRuntimeFiles || []).join("<br>")
    ])
  )
].join("\n");

fs.writeFileSync(outputMd, md);

console.log(JSON.stringify({
  filesAudited: rows.length,
  legacyFindings: legacyFindings.length,
  outputs: [
    "docs/validation/repo_data_source_audit.json",
    "docs/validation/repo_data_source_audit.md"
  ]
}, null, 2));

