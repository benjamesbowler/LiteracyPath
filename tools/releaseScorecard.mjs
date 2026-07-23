import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(repoRoot, "docs", "release");
const scorecardDir = path.join(releaseDir, "scorecards");
const CREDIT_STATUSES = new Set(["DONE", "WAIVED", "EXTERNAL-READY", "EXTERNAL-CLOSED"]);
const VALID_WAIVER_STATUSES = new Set(["ACTIVE", "APPROVED"]);

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
  } catch {
    return "";
  }
}

function readJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch {
    return null;
  }
}

export function parseMarkdownTable(text) {
  return text
    .split(/\r?\n/)
    .filter(line => /^\|.+\|$/.test(line.trim()))
    .map(line => line.trim().slice(1, -1).split("|").map(cell => cell.trim()))
    .filter(cells => cells.length > 1)
    .filter(cells => !cells.every(cell => /^:?-{3,}:?$/.test(cell)))
    .slice(1);
}

export function parseTraceability(text) {
  return parseMarkdownTable(text).map(cells => ({
    item: cells[0],
    area: Number(cells[1]),
    priority: cells[2],
    status: cells[3],
    gate: cells[4],
    evidence: cells[5]
  })).filter(row => /^A\d+\.\d+$/.test(row.item) && row.area >= 1 && row.area <= 10);
}

export function parseDiscoveredTraceability(text) {
  return parseMarkdownTable(text).map(cells => ({
    id: cells[0],
    areas: [...new Set(String(cells[1] || "")
      .match(/\d+/g)
      ?.map(Number)
      .filter(area => area >= 1 && area <= 10) || [])],
    severity: cells[2],
    status: cells[3],
    gate: cells[4],
    evidence: cells[5]
  })).filter(row => /^D-\d{3}$/.test(row.id) && row.areas.length > 0);
}

function parseWaivers(text, now = new Date()) {
  return parseMarkdownTable(text).map(cells => ({
    item: cells[0],
    reason: cells[1],
    owner: cells[2],
    expires: cells[3],
    approved: cells[4],
    status: cells[5],
    evidence: cells[6]
  })).filter(row => /^A\d+\.\d+$/.test(row.item)).map(row => {
    const expiry = Date.parse(row.expires);
    return {
      ...row,
      valid: row.owner === "Ben"
        && /^yes$/i.test(row.approved)
        && VALID_WAIVER_STATUSES.has(row.status)
        && Number.isFinite(expiry)
        && expiry > now.getTime()
    };
  });
}

function externalRows(text) {
  return parseMarkdownTable(text).map(cells => ({
    item: cells[0],
    dependency: cells[1],
    status: cells[2],
    owner: cells[3],
    preparedEvidence: cells[4],
    closureEvidence: cells[5]
  })).filter(row => /^A\d+/.test(row.item));
}

function cleanReauditCount() {
  const auditDir = path.join(releaseDir, "audits");
  if (!fs.existsSync(auditDir)) return 0;
  return fs.readdirSync(auditDir)
    .filter(file => /^RE_AUDIT_\d+\.md$/.test(file))
    .sort()
    .slice(-2)
    .length;
}

function previousScorecard(currentName) {
  if (!fs.existsSync(scorecardDir)) return null;
  const names = fs.readdirSync(scorecardDir)
    .filter(name => name.endsWith(".md") && name !== currentName)
    .sort();
  if (!names.length) return null;
  const text = fs.readFileSync(path.join(scorecardDir, names.at(-1)), "utf8");
  const scores = {};
  for (const match of text.matchAll(/^\|\s*(\d+)\s*\|[^|]*\|\s*(\d+)(?:\/10)?\s*\|/gm)) {
    scores[Number(match[1])] = Number(match[2]);
  }
  return { name: names.at(-1), scores };
}

function formatDelta(score, previous) {
  if (!Number.isFinite(previous)) return "—";
  const delta = score - previous;
  return delta > 0 ? `+${delta}` : String(delta);
}

export function calculateScorecard({
  traceRows,
  manifest,
  waivers,
  discovered,
  externals,
  loopCAuditCount
}) {
  const gateRows = manifest?.gates || [];
  const invalidWaivers = waivers.filter(waiver => !waiver.valid);
  const validWaiverItems = new Set(waivers.filter(waiver => waiver.valid).map(waiver => waiver.item));
  const openExternalByArea = new Map();
  for (const external of externals) {
    const match = external.item.match(/^A(\d+)/);
    if (!match || external.status === "EXTERNAL-CLOSED") continue;
    const area = Number(match[1]);
    if (!openExternalByArea.has(area)) openExternalByArea.set(area, []);
    openExternalByArea.get(area).push(external.item);
  }

  const areas = [];
  for (let area = 1; area <= 10; area += 1) {
    const items = traceRows.filter(row => row.area === area);
    const credited = items.filter(row => (
      CREDIT_STATUSES.has(row.status)
      && (row.status !== "WAIVED" || validWaiverItems.has(row.item))
    ));
    const openOriginalP01 = items.filter(row => (
      !CREDIT_STATUSES.has(row.status)
      && /\bP[01]\b/.test(row.priority)
    ));
    const openDiscoveredP01 = discovered.filter(row => (
      row.areas.includes(area)
      && /^P[01]$/.test(row.severity)
      && !["DONE", "CLOSED", "WAIVED"].includes(row.status)
    ));
    const mappedGates = gateRows.filter(gate => gate.areas?.includes(area));
    const failingGates = mappedGates.filter(gate => gate.status !== "pass");
    let score = Math.min(10, credited.length);
    const blockers = [];
    if (items.length !== 10) blockers.push(`traceability has ${items.length}/10 items`);
    if (openOriginalP01.length) blockers.push(`${openOriginalP01.length} open original P0/P1`);
    if (openDiscoveredP01.length) blockers.push(`${openDiscoveredP01.length} open discovered P0/P1`);
    if (failingGates.length) blockers.push(`${failingGates.length} mapped gate(s) not green`);
    if (invalidWaivers.some(waiver => items.some(item => item.item === waiver.item))) {
      blockers.push("invalid waiver");
    }
    if (score === 10 && blockers.length) score = 9;
    if (score === 10 && loopCAuditCount < 2) {
      score = 9;
      blockers.push(`Loop C ${loopCAuditCount}/2`);
    }
    const openExternals = openExternalByArea.get(area) || [];
    const pendingExternal = score === 10 && openExternals.length > 0;
    areas.push({
      area,
      score,
      credited: credited.length,
      items: items.length,
      failingGates: failingGates.map(gate => gate.id),
      openOriginalP01: openOriginalP01.map(row => row.item),
      openDiscoveredP01: openDiscoveredP01.map(row => row.id),
      openExternals,
      pendingExternal,
      blockers
    });
  }

  const manifestGreen = Boolean(manifest)
    && manifest.partial === false
    && gateRows.length > 0
    && gateRows.every(gate => gate.status === "pass");
  const victory = manifestGreen
    && waivers.length === 0
    && areas.every(area => area.score === 10 && !area.pendingExternal)
    && loopCAuditCount >= 2;
  return {
    areas,
    victory,
    manifestGreen,
    invalidWaivers: invalidWaivers.map(waiver => waiver.item),
    openWaivers: waivers.length,
    loopCAuditCount
  };
}

function renderScorecard({ result, manifest, previous, filename }) {
  const generatedAt = new Date().toISOString();
  const rows = result.areas.map(area => {
    const displayScore = area.pendingExternal ? "10/10 pending external" : `${area.score}/10`;
    const blockerText = area.blockers.length ? area.blockers.join("; ") : "none";
    return `| ${area.area} | ${area.credited}/10 | ${area.score} | ${displayScore} | ${formatDelta(area.score, previous?.scores?.[area.area])} | ${area.failingGates.join(", ") || "none"} | ${blockerText} |`;
  });
  return `# Release scorecard

Generated: ${generatedAt}

Commit: \`${manifest?.commitSha || "unknown"}\`  
Manifest: \`docs/release/manifest.json\`  
Previous scorecard: ${previous ? `\`${previous.name}\`` : "none"}

## Verdict

${result.victory ? "**VICTORY — all mechanical and external closure conditions are met.**" : "**NOT COMPLETE — the table below is the current honest state.**"}

- Canonical release manifest green: ${result.manifestGreen ? "yes" : "no"}
- Loop C clean audit evidence: ${result.loopCAuditCount}/2
- Open waiver rows: ${result.openWaivers}
- Invalid waivers: ${result.invalidWaivers.join(", ") || "none"}
- Scorecard file: \`docs/release/scorecards/${filename}\`

## Areas

| Area | Credited items | Numeric score | Display | Delta | Failing mapped gates | Blockers |
|---:|---:|---:|---|---:|---|---|
${rows.join("\n")}

## Gate summary

- Total: ${manifest?.summary?.total ?? 0}
- Passed: ${manifest?.summary?.passed ?? 0}
- Failed: ${manifest?.summary?.failed ?? 0}
- Not implemented: ${manifest?.summary?.notImplemented ?? 0}
- Partial manifest: ${manifest?.partial === true ? "yes" : "no"}

Scores are generated, never hand-edited. Credited statuses are DONE, valid WAIVED, EXTERNAL-READY, and EXTERNAL-CLOSED. A 10 is capped when mapped gates, open P0/P1 findings, invalid waivers, or the two-audit Loop C condition remain unresolved.
`;
}

export function generateScorecard() {
  const manifest = readJson("docs/release/manifest.json");
  if (!manifest || manifest.partial !== false) {
    throw new Error("A complete canonical docs/release/manifest.json is required before generating a scorecard.");
  }
  const traceabilityText = readText("docs/release/TRACEABILITY.md");
  const traceRows = parseTraceability(traceabilityText);
  if (traceRows.length !== 100) {
    throw new Error(`TRACEABILITY.md must contain exactly 100 A-item rows; found ${traceRows.length}.`);
  }
  const discovered = parseDiscoveredTraceability(traceabilityText);
  const discoveredDetails = readText("docs/release/DISCOVERED.md");
  const missingDiscoveredDetails = discovered
    .filter(row => !discoveredDetails.includes(`## ${row.id} `))
    .map(row => row.id);
  if (missingDiscoveredDetails.length) {
    throw new Error(`Discovered trace rows are missing detailed findings: ${missingDiscoveredDetails.join(", ")}.`);
  }
  const now = new Date();
  const waivers = parseWaivers(readText("docs/release/WAIVERS.md"), now);
  const externals = externalRows(readText("docs/release/EXTERNAL.md"));
  const loopCAuditCount = cleanReauditCount();
  const result = calculateScorecard({
    traceRows,
    manifest,
    waivers,
    discovered,
    externals,
    loopCAuditCount
  });
  const sha = String(manifest.commitSha || "unknown").slice(0, 12);
  const date = String(manifest.generatedAt || now.toISOString()).slice(0, 10);
  const filename = `${date}-${sha}.md`;
  fs.mkdirSync(scorecardDir, { recursive: true });
  const previous = previousScorecard(filename);
  const output = renderScorecard({ result, manifest, previous, filename });
  fs.writeFileSync(path.join(scorecardDir, filename), output);
  console.log(`Wrote docs/release/scorecards/${filename}`);
  console.log(`Score vector: ${result.areas.map(area => area.score).join(",")}`);
  if (!result.victory) process.exitCode = 1;
  return result;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    generateScorecard();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
