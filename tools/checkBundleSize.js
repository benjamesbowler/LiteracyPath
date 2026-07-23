import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultAssetDir = path.join(repoRoot, "dist", "assets");
const defaultMetadataPath = path.join(repoRoot, "dist", "bundle-metadata.json");
const defaultConfigPath = path.join(repoRoot, "tools", "bundle-budgets.json");
const defaultArtifactDir = path.join(repoRoot, "docs", "release", "artifacts");

export function normalizeChunkId(fileName) {
  return path.basename(fileName).replace(/-[A-Za-z0-9_-]{8}\.js$/, "");
}

export function activeRatchet(schedule, dateValue = new Date()) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const eligible = schedule
    .filter(step => new Date(`${step.effectiveDate}T00:00:00.000Z`) <= date)
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  if (!eligible.length) {
    throw new Error("Bundle budget schedule has no step effective for this date.");
  }
  return eligible.at(-1);
}

function validApproval(approval) {
  return Boolean(
    approval
    && Number.isFinite(approval.rawBytes)
    && Number.isFinite(approval.gzipBytes)
    && typeof approval.checkChange === "string"
    && approval.checkChange.trim().startsWith("CHECK-CHANGE:")
    && typeof approval.commit === "string"
    && approval.commit.trim()
  );
}

export function evaluateBundleBudget({ rows, config, now = new Date() }) {
  const ratchet = activeRatchet(config.ratchetSchedule, now);
  const failures = [];
  const evaluatedRows = rows.map(row => {
    const baseline = config.largeChunkBaselines[row.id];
    const approval = config.approvedNewLargeChunks[row.id];
    const isLarge = row.rawBytes > config.newLargeChunkThresholdBytes;
    let rawBudget = baseline?.rawBytes ?? config.newLargeChunkThresholdBytes;
    let gzipBudget = baseline?.gzipBytes ?? null;
    let budgetSource = baseline ? "baseline" : "new-chunk threshold";

    if (isLarge && !baseline) {
      if (!validApproval(approval)) {
        failures.push(
          `${row.id} is a new ${row.rawBytes}-byte chunk over `
          + `${config.newLargeChunkThresholdBytes} bytes without a registered CHECK-CHANGE approval.`
        );
      } else {
        rawBudget = approval.rawBytes;
        gzipBudget = approval.gzipBytes;
        budgetSource = "CHECK-CHANGE approval";
      }
    }

    if (row.isEntry) {
      rawBudget = Math.min(rawBudget, ratchet.mainEntryRawBytes);
      gzipBudget = Math.min(gzipBudget ?? Infinity, ratchet.mainEntryGzipBytes);
      budgetSource = `${budgetSource} + ${ratchet.milestone}`;
    } else if (row.isDynamicEntry) {
      rawBudget = Math.min(rawBudget, ratchet.routeChunkRawBytes);
      budgetSource = `${budgetSource} + ${ratchet.milestone}`;
    }

    if (row.rawBytes > rawBudget) {
      failures.push(`${row.id} raw size ${row.rawBytes} exceeds ${rawBudget} bytes.`);
    }
    if (Number.isFinite(gzipBudget) && row.gzipBytes > gzipBudget) {
      failures.push(`${row.id} gzip size ${row.gzipBytes} exceeds ${gzipBudget} bytes.`);
    }

    return {
      ...row,
      rawBudget,
      gzipBudget: Number.isFinite(gzipBudget) ? gzipBudget : null,
      budgetSource,
      status: row.rawBytes <= rawBudget
        && (!Number.isFinite(gzipBudget) || row.gzipBytes <= gzipBudget)
        && (!isLarge || baseline || validApproval(approval))
        ? "pass"
        : "fail"
    };
  });

  return {
    ratchet,
    rows: evaluatedRows,
    failures,
    newLargeChunkThresholdBytes: config.newLargeChunkThresholdBytes
  };
}

function formatKb(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  return `${(bytes / 1000).toFixed(2)} kB`;
}

export function buildTrendMarkdown(result, generatedAt = new Date().toISOString()) {
  const visibleRows = result.rows
    .filter(row => row.rawBytes > result.newLargeChunkThresholdBytes || row.isEntry)
    .sort((a, b) => b.rawBytes - a.rawBytes);
  const lines = [
    "# Bundle budget trend",
    "",
    `Generated: ${generatedAt}`,
    `Active ratchet: ${result.ratchet.effectiveDate} — ${result.ratchet.milestone}`,
    "",
    "| Chunk | Kind | Raw | Raw budget | Raw headroom | Gzip | Gzip budget | Status |",
    "|---|---|---:|---:|---:|---:|---:|---|"
  ];
  for (const row of visibleRows) {
    const kind = row.isEntry ? "main entry" : row.isDynamicEntry ? "route/data" : "shared";
    lines.push(
      `| ${row.id} | ${kind} | ${formatKb(row.rawBytes)} | ${formatKb(row.rawBudget)} `
      + `| ${formatKb(row.rawBudget - row.rawBytes)} | ${formatKb(row.gzipBytes)} `
      + `| ${formatKb(row.gzipBudget)} | ${row.status} |`
    );
  }
  lines.push(
    "",
    result.failures.length
      ? `Result: FAIL — ${result.failures.length} budget violation(s).`
      : "Result: PASS — all active bundle budgets are enforced."
  );
  return `${lines.join("\n")}\n`;
}

export function readBundleRows({
  assetDir = defaultAssetDir,
  metadataPath = defaultMetadataPath
} = {}) {
  if (!existsSync(assetDir)) {
    throw new Error("No dist/assets JavaScript output found. Run npm run build first.");
  }
  if (!existsSync(metadataPath)) {
    throw new Error("dist/bundle-metadata.json is missing. Run the current production build first.");
  }
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  const metadataByFile = new Map(
    metadata.chunks.map(chunk => [path.basename(chunk.fileName), chunk])
  );
  return readdirSync(assetDir)
    .filter(file => file.endsWith(".js"))
    .map(file => {
      const bytes = readFileSync(path.join(assetDir, file));
      const chunkMetadata = metadataByFile.get(file);
      if (!chunkMetadata) {
        throw new Error(`Bundle metadata is missing JavaScript chunk ${file}.`);
      }
      return {
        id: normalizeChunkId(file),
        file,
        rawBytes: bytes.length,
        gzipBytes: gzipSync(bytes).length,
        isEntry: Boolean(chunkMetadata.isEntry),
        isDynamicEntry: Boolean(chunkMetadata.isDynamicEntry)
      };
    });
}

export function runBundleSizeCheck({
  configPath = defaultConfigPath,
  artifactDir = defaultArtifactDir,
  now = process.env.LP_BUNDLE_BUDGET_DATE || new Date()
} = {}) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const result = evaluateBundleBudget({
    rows: readBundleRows(),
    config,
    now
  });
  const generatedAt = new Date().toISOString();
  const markdown = buildTrendMarkdown(result, generatedAt);
  const payload = {
    schemaVersion: 1,
    generatedAt,
    activeRatchet: result.ratchet,
    failures: result.failures,
    chunks: result.rows
  };

  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(path.join(artifactDir, "bundle-size.json"), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(path.join(artifactDir, "bundle-size.md"), markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${markdown}`);
  }

  console.log(markdown.trim());
  if (result.failures.length) {
    for (const failure of result.failures) console.error(`- ${failure}`);
    return 1;
  }
  return 0;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    process.exitCode = runBundleSizeCheck();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
