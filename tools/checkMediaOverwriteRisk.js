import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { canonicalVisibleText, sameSpokenWords } from "./guidedReadingAudioPipelineLib.mjs";
import { normalizeLedaAudioText } from "../src/data/normalizeLedaAudioText.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, ".artifacts", "audits", "media_overwrite_risk_audit.md");
const coverManifestPath = "src/data/generated/guidedReadingCoverRenditions.generated.js";
const retirementRegistryPath = "tools/manifests/guided-reading-book-retirements.json";
const narrationClearancePath = "src/data/generated/guidedReadingNarrationClearance.generated.js";
const narrationGapsPath = "src/data/generated/guidedReadingLedaGaps.generated.js";
const narrationEnumerationPaths = new Set([
  "src/data/generated/audioFilePaths.generated.js",
  "src/data/generated/audioGuidedReadingPaths.generated.js",
  "src/data/generated/audioQuestPaths.generated.js",
  "src/data/generated/audioPhonemePaths.generated.js"
]);
const cardCoverUrlPattern = /^\/guided-reading\/card-covers\/([a-f0-9]{24})\.webp$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const digest = bytes => createHash("sha256").update(bytes).digest("hex");

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
    maxBuffer: 50 * 1024 * 1024,
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

// While a merge is pending, compare the resolved worktree with the incoming
// tree. Otherwise files merely inherited from that tree look like new source
// imports. This does not exempt any difference from the media checks below.
export function selectMediaBaseline(resolve = ref => runGit(["rev-parse", "--verify", ref]).trim()) {
  try {
    const incoming = resolve("MERGE_HEAD");
    if (/^[a-f0-9]{40}$/.test(incoming)) return incoming;
    throw new Error("Expected one incoming merge commit");
  } catch (error) {
    if (error.message === "Expected one incoming merge commit") throw error;
    return "HEAD";
  }
}

function collectChangedPaths(baseline) {
  const diffEntries = parseDiffNameStatus(runGit([
    "diff",
    "--name-status",
    "-z",
    baseline,
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

export function isTempOrSourcePath(filePath) {
  const basename = path.posix.basename(filePath).toLowerCase();
  const ext = getExtension(filePath);
  // Speech filenames contain real words such as "attempt" and "temperature".
  // Only a separate temp/tmp marker denotes staging; include directory names
  // so a clean-looking filename inside a staging folder remains blocked.
  const hasTemporaryMarker = /(?:^|[/._\s-])(?:temp|tmp)(?=$|[/._\s-])/i.test(filePath);
  const hasSourceDirectory = /(?:^|[/._\s-])(?:source|sources|reference|references)(?=$|[/._\s-])/i.test(path.posix.dirname(filePath));
  // Canonical speech names describe the spoken words and end in a content
  // hash. "Preference" and "which source" are valid prompt text; they are not
  // source-art markers. Keep source/staging directories and unhashed files
  // subject to the same protections as other live media.
  const isCanonicalSpeech = /^public\/audio\/production\/[^/]+\/[^/]+\/[^/]+-[a-f0-9]{10}\.mp3$/i.test(filePath);
  const hasSourceFilename = basename.includes("reference") || basename.includes("source");

  return (
    TEMP_SOURCE_BASENAMES.has(basename) ||
    TEMP_SOURCE_EXTENSIONS.has(ext) ||
    hasSourceDirectory ||
    (hasSourceFilename && !isCanonicalSpeech) ||
    hasTemporaryMarker
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

// Format-only replacements must preserve every decoded pixel. A missing,
// resized, lossy or still-referenced replacement remains a deletion failure.
export async function isLosslessWebpReplacement(before, after, { referenced = false } = {}) {
  if (referenced || !before || !after) return false;
  try {
    if ((await sharp(after).metadata()).format !== "webp") return false;
    const decoded = await Promise.all([before, after].map(buffer => sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
    const [a, b] = decoded;
    return a.info.width === b.info.width && a.info.height === b.info.height && a.info.channels === b.info.channels && a.data.equals(b.data);
  } catch { return false; }
}

const canonicalImageUrl = url => typeof url === "string" && url.startsWith("/guided-reading/") &&
  !url.startsWith("/guided-reading/card-covers/") && !url.includes("\\") &&
  path.posix.normalize(url) === url && url.endsWith(".webp");
const samePaths = (a, b) => a.length === b.length && new Set(a).size === a.length &&
  new Set(b).size === b.length && a.every(value => b.includes(value));

// A retirement is atomic: a complete, explicitly bound replacement book must
// exist before any one of its old canonical paths may disappear. Registry rows
// are evidence to verify, never a deletion allowlist.
export async function isVerifiedBookRetirement({
  retirement, previousFiles = {}, historicalFiles = {}, currentFiles = {},
  previousAssetPaths = [], currentAssetPaths = [], runtimeBooks = [],
  approvedAssets = [], referenced = false, oldFilesPresent = false
} = {}) {
  try {
    const r = retirement;
    if (!r || referenced || oldFilesPresent || typeof r.oldBookId !== "string" || typeof r.newBookId !== "string" ||
        !/^[a-z0-9-]+$/.test(r.oldBookId) || !/^[a-z0-9-]+$/.test(r.newBookId) || r.oldBookId === r.newBookId ||
        !Number.isInteger(r.assetCount) || r.assetCount < 2 || !Array.isArray(r.assets) ||
        r.assets.length !== r.assetCount || !Array.isArray(r.sourceRevisions) || !r.sourceRevisions.length ||
        new Set(r.sourceRevisions).size !== r.sourceRevisions.length ||
        r.sourceRevisions.some(ref => !/^[a-f0-9]{40}$/.test(ref))) return false;
    const oldPaths = r.assets.map(a => a.oldPath), newPaths = r.assets.map(a => a.newPath);
    if (!samePaths(oldPaths, previousAssetPaths) || !samePaths(newPaths, currentAssetPaths) ||
        oldPaths.some(p => newPaths.includes(p)) ||
        !samePaths(r.assets.map(a => a.page), Array.from({ length: r.assetCount }, (_, i) => i))) return false;
    const oldPrefix = r.oldAssetPrefix, newPrefix = r.newAssetPrefix;
    if (![oldPrefix, newPrefix].every(p => typeof p === "string" && p.endsWith("/") && canonicalImageUrl(`${p}cover.webp`)) ||
        oldPrefix === newPrefix) return false;
    const newBooks = runtimeBooks.filter(b => b.id === r.newBookId);
    if (newBooks.length !== 1 || runtimeBooks.some(b => b.id === r.oldBookId) ||
        JSON.stringify(runtimeBooks).includes(oldPrefix)) return false;
    const book = newBooks[0];
    if (!Array.isArray(book.pages) || !samePaths([book.coverImage, ...book.pages.map(p => p.image)], newPaths) ||
        book.pages.length !== r.assetCount - 1) return false;
    for (const a of r.assets) {
      const name = path.posix.basename(a.oldPath);
      if (!canonicalImageUrl(a.oldPath) || !canonicalImageUrl(a.newPath) ||
          a.oldPath !== `${oldPrefix}${name}` || a.newPath !== `${newPrefix}${name}` ||
          (a.page === 0 ? name !== "cover.webp" : !/^page-\d+\.webp$/.test(name) || Number(name.slice(5, -5)) !== a.page) ||
          (a.page === 0 ? book.coverImage !== a.newPath : !book.pages.some(p => p.pageNumber === a.page && p.image === a.newPath)) ||
          !a.oldSha256 || !samePaths(Object.keys(a.oldSha256), r.sourceRevisions) || !sha256Pattern.test(a.newSha256)) return false;
      const previous = previousFiles[a.oldPath], current = currentFiles[a.newPath];
      if (!Buffer.isBuffer(previous) || !Buffer.isBuffer(current) ||
          !Object.values(a.oldSha256).includes(digest(previous)) || digest(current) !== a.newSha256) return false;
      for (const revision of r.sourceRevisions) {
        const historical = historicalFiles[`${revision}:${a.oldPath}`];
        if (!sha256Pattern.test(a.oldSha256[revision]) || !Buffer.isBuffer(historical) ||
            digest(historical) !== a.oldSha256[revision]) return false;
      }
      const reviews = approvedAssets.filter(review => review.path === a.newPath);
      if (reviews.length !== 1 || reviews[0].status !== "approved" || reviews[0].sha256 !== a.newSha256) return false;
      const metadata = await sharp(current).metadata();
      if (metadata.format !== "webp" || !metadata.width || !metadata.height) return false;
      await sharp(current).raw().toBuffer();
    }
    return true;
  } catch { return false; }
}

function hasSourceReference(needles) {
  const roots = ["src", "preview", "demos"].filter(root => fs.existsSync(path.join(repoRoot, root)));
  if (!roots.length) return true; // Missing reference scope cannot establish absence.
  try {
    execFileSync("rg", ["-l", "--hidden", "--no-ignore", "-F", ...needles.flatMap(value => ["-e", value]), ...roots], { cwd: repoRoot, stdio: "pipe" });
    return true;
  } catch (error) { if (error.status !== 1) throw error; return false; }
}

// These generated modules enumerate files which exist on disk. They do not
// request speech. Exempt only an occurrence inside their JSON filename list;
// an executable reference added to the same file still blocks retirement.
export function isAudioEnumerationOnlyReference({ referencePath, source, audioPath } = {}) {
  if (!narrationEnumerationPaths.has(referencePath) || typeof source !== "string" ||
      !source.startsWith("// AUTO-GENERATED by tools/generateAudioManifest.js - do not edit.")) return false;
  try {
    const match = /Object\.entries\((\{[^\n]*\})\)/.exec(source);
    if (!match) return false;
    const inventory = JSON.parse(match[1]), filename = path.posix.basename(audioPath);
    const remainder = source.slice(0, match.index) + source.slice(match.index + match[0].length);
    if (remainder.includes(audioPath) || remainder.includes(filename)) return false;
    return typeof inventory[path.posix.dirname(audioPath)] === "string" &&
      inventory[path.posix.dirname(audioPath)].split("\n").includes(filename);
  } catch { return false; }
}

function narrationSourceReferences(audioPath) {
  const roots = ["src", "preview", "demos"].filter(root => fs.existsSync(path.join(repoRoot, root)));
  if (!roots.length) throw new Error("Missing narration reference scope");
  let hits;
  try {
    hits = execFileSync("rg", ["-l", "--hidden", "--no-ignore", "-F", "-e", audioPath,
      "-e", path.posix.basename(audioPath), ...roots], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" }).trim().split("\n").filter(Boolean);
  } catch (error) { if (error.status !== 1) throw error; hits = []; }
  return hits.filter(referencePath => !isAudioEnumerationOnlyReference({ referencePath,
    source: fs.readFileSync(path.join(repoRoot, referencePath), "utf8"), audioPath }));
}

export function isDecodableNarrationAudio(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length) return false;
  try {
    const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=format_name:stream=codec_name,codec_type,sample_rate,channels", "-of", "json", "pipe:0"], { input: bytes, stdio: ["pipe", "pipe", "pipe"] }));
    if (probe.format?.format_name !== "mp3" || probe.streams?.length !== 1 ||
        probe.streams[0].codec_type !== "audio" || probe.streams[0].codec_name !== "mp3" ||
        Number(probe.streams[0].sample_rate) < 8000 || ![1, 2].includes(probe.streams[0].channels)) return false;
    const pcm = execFileSync("ffmpeg", ["-v", "error", "-xerror", "-i", "pipe:0", "-map", "0:a:0",
      "-f", "s16le", "-ac", "1", "-ar", "8000", "pipe:1"], { input: bytes, stdio: ["pipe", "pipe", "pipe"], maxBuffer: 50 * 1024 * 1024 });
    return pcm.length > 0;
  } catch { return false; }
}

const narrationAudioUrl = url => typeof url === "string" &&
  /^\/audio\/production\/en-US\/guided_page\/[a-z0-9-]+-[a-f0-9]{10}\.mp3$/.test(url);

export function isVerifiedNarrationSupersession({ retirement, previousBytes, historicalEvidence = [],
  currentBytes, currentOldBytes, currentPages = [], runtimeBooks = [], clearance = {}, provenancePassed = false,
  meaningfulReferences = [], oldTextResolutionPath = "" } = {}) {
  try {
    const r = retirement;
    if (!r || !provenancePassed || meaningfulReferences.length || oldTextResolutionPath ||
        !narrationAudioUrl(r.oldAudioPath) || !narrationAudioUrl(r.newAudioPath) || r.oldAudioPath === r.newAudioPath ||
        typeof r.oldBookId !== "string" || typeof r.newBookId !== "string" ||
        !/^[a-z0-9-]+$/.test(r.oldBookId) || !/^[a-z0-9-]+$/.test(r.newBookId) ||
        !Number.isInteger(r.oldPageNumber) || r.oldPageNumber < 1 || !Number.isInteger(r.newPageNumber) || r.newPageNumber < 1 ||
        !r.oldText || !r.newText || canonicalVisibleText(r.oldText) !== r.oldText || canonicalVisibleText(r.newText) !== r.newText ||
        sameSpokenWords(r.oldText, r.newText) || !sha256Pattern.test(r.newSha256) ||
        !Array.isArray(r.sourceRevisions) || !r.sourceRevisions.length ||
        r.sourceRevisions.some(ref => !/^[a-f0-9]{40}$/.test(ref)) ||
        !samePaths(Object.keys(r.oldSha256 || {}), r.sourceRevisions) ||
        !samePaths(historicalEvidence.map(e => e.revision), r.sourceRevisions) ||
        !Buffer.isBuffer(previousBytes) || !Object.values(r.oldSha256).includes(digest(previousBytes)) ||
        (currentOldBytes !== undefined && (!Buffer.isBuffer(currentOldBytes) || !Object.values(r.oldSha256).includes(digest(currentOldBytes)))) ||
        !Buffer.isBuffer(currentBytes) || digest(currentBytes) !== r.newSha256) return false;
    for (const evidence of historicalEvidence) {
      if (!Buffer.isBuffer(evidence.bytes) || !sha256Pattern.test(r.oldSha256[evidence.revision]) ||
          digest(evidence.bytes) !== r.oldSha256[evidence.revision] ||
          evidence.bookId !== r.oldBookId || evidence.pageNumber !== r.oldPageNumber ||
          evidence.displayedText !== r.oldText || evidence.audioPath !== r.oldAudioPath || evidence.voice !== r.voice) return false;
    }
    if (r.voice !== "en-US-Chirp3-HD-Leda" || currentPages.some(row =>
      row.audioPath === r.oldAudioPath || sameSpokenWords(row.displayedText, r.oldText))) return false;
    const rows = currentPages.filter(row => row.bookId === r.newBookId && row.pageNumber === r.newPageNumber);
    const books = runtimeBooks.filter(book => book.id === r.newBookId);
    if (rows.length !== 1 || books.length !== 1 ||
        (r.oldBookId !== r.newBookId && runtimeBooks.some(book => book.id === r.oldBookId))) return false;
    const row = rows[0], pages = books[0].pages.filter(page => page.pageNumber === r.newPageNumber);
    const approval = clearance[`${r.newBookId}::${r.newPageNumber}`];
    if (pages.length !== 1 || canonicalVisibleText(pages[0].text) !== r.newText ||
        canonicalVisibleText(pages[0].pageAudioText) !== r.newText ||
        row.displayedText !== r.newText || row.audioPath !== r.newAudioPath || row.audioSha256 !== r.newSha256 ||
        !row.audioExists || !row.pageAudioTextMatches || !row.transcriptMatches || !row.exactLedaAudioResolves ||
        approval?.displayedText !== r.newText || approval?.voice !== r.voice) return false;
    return isDecodableNarrationAudio(currentBytes);
  } catch { return false; }
}

function parseFrozenJsonModule(source, name) {
  const marker = `export const ${name} = Object.freeze(`;
  const start = source.indexOf(marker), end = source.lastIndexOf(");");
  if (start < 0 || end < start) throw new Error(`Unrecognized ${name} module`);
  return JSON.parse(source.slice(start + marker.length, end));
}

async function verifiedNarrationSupersessions(entries, baseline, { validateAll = false } = {}) {
  const paths = new Set(), failures = [], rows = [];
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, retirementRegistryPath), "utf8"));
    if (registry.schemaVersion !== 1 || !Array.isArray(registry.narrationSupersessions)) throw new Error("Invalid narration retirement registry");
    const bindings = registry.narrationSupersessions;
    if (new Set(bindings.map(r => r.oldAudioPath)).size !== bindings.length ||
        new Set(bindings.map(r => `${r.newBookId}::${r.newPageNumber}`)).size !== bindings.length) throw new Error("Duplicate narration retirement binding");
    const wanted = bindings.filter(r => validateAll || entries.some(e => e.status === "D" && e.path === `public${r.oldAudioPath}`));
    if (!wanted.length) return { paths, failures, rows };
    const { auditGuidedReadingNarrationProvenance } = await import("./checkGuidedReadingNarrationProvenance.mjs");
    const { getRuntimeGuidedReadingBooks } = await import("../src/utils/guidedReading/runtimeBooks.js");
    const { GUIDED_READING_NARRATION_CLEARANCE: clearance } = await import("../src/data/generated/guidedReadingNarrationClearance.generated.js");
    const { resolveGuidedReadingPageAudio } = await import("./guidedReadingAudioPipelineLib.mjs");
    const audit = auditGuidedReadingNarrationProvenance(), runtimeBooks = getRuntimeGuidedReadingBooks();
    const history = new Map();
    for (const r of wanted) {
      try {
        const previousBytes = execFileSync("git", ["show", `${baseline}:public${r.oldAudioPath}`], { cwd: repoRoot, maxBuffer: 50 * 1024 * 1024 });
        const historicalEvidence = r.sourceRevisions.map(revision => {
          if (!history.has(revision)) history.set(revision, {
            clearance: parseFrozenJsonModule(runGit(["show", `${revision}:${narrationClearancePath}`]), "GUIDED_READING_NARRATION_CLEARANCE"),
            gaps: parseFrozenJsonModule(runGit(["show", `${revision}:${narrationGapsPath}`]), "GUIDED_READING_LEDA_GAPS") });
          const prior = history.get(revision), approval = prior.clearance[`${r.oldBookId}::${r.oldPageNumber}`];
          return { revision, bookId: r.oldBookId, pageNumber: r.oldPageNumber,
            bytes: execFileSync("git", ["show", `${revision}:public${r.oldAudioPath}`], { cwd: repoRoot, maxBuffer: 50 * 1024 * 1024 }),
            displayedText: approval?.displayedText, voice: approval?.voice, audioPath: prior.gaps.guided_page?.[normalizeLedaAudioText(r.oldText)] };
        });
        const meaningfulReferences = narrationSourceReferences(r.oldAudioPath);
        const valid = isVerifiedNarrationSupersession({ retirement: r, previousBytes, historicalEvidence,
          currentOldBytes: fs.existsSync(path.join(repoRoot, "public", r.oldAudioPath)) ? fs.readFileSync(path.join(repoRoot, "public", r.oldAudioPath)) : undefined,
          currentBytes: fs.readFileSync(path.join(repoRoot, "public", r.newAudioPath)), currentPages: audit.pages, runtimeBooks, clearance,
          provenancePassed: audit.failures.length === 0 && audit.snapshotMatches,
          meaningfulReferences, oldTextResolutionPath: resolveGuidedReadingPageAudio(r.oldText).audioPath });
        if (!valid) throw new Error(`exact-text/runtime/provenance/lineage/decode/reference proof failed (${meaningfulReferences.join(", ") || "no meaningful old references"}; ${audit.failures.length} provenance failures)`);
        paths.add(`public${r.oldAudioPath}`);
        rows.push({ oldBookId: r.oldBookId, oldPageNumber: r.oldPageNumber, oldAudioPath: r.oldAudioPath,
          oldText: r.oldText, previousSha256: digest(previousBytes), sourceRevisions: r.sourceRevisions, oldSha256: r.oldSha256,
          currentOldSha256: fs.existsSync(path.join(repoRoot, "public", r.oldAudioPath)) ? digest(fs.readFileSync(path.join(repoRoot, "public", r.oldAudioPath))) : null,
          newBookId: r.newBookId, newPageNumber: r.newPageNumber,
          newText: r.newText, newAudioPath: r.newAudioPath, newSha256: r.newSha256,
          currentExactTextProvenanceVerified: true, replacementFullyDecoded: true, meaningfulReferences, verified: true });
      } catch (error) { failures.push(`Unverified narration retirement ${r.oldAudioPath}: ${error.message}`); }
    }
  } catch (error) { failures.push(`Cannot validate narration retirements: ${error.message}`); }
  return { paths, failures, rows };
}

async function verifiedBookRetirements(entries, baseline) {
  const paths = new Set(), sourceBindings = {}, failures = [];
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(path.join(repoRoot, retirementRegistryPath), "utf8"));
    if (registry.schemaVersion !== 1 || !Array.isArray(registry.retirements)) throw new Error("Invalid retirement registry schema");
    for (const key of ["oldBookId", "newBookId"]) {
      if (new Set(registry.retirements.map(r => r[key])).size !== registry.retirements.length) throw new Error(`Duplicate retirement ${key}`);
    }
    const boundPaths = registry.retirements.flatMap(r => (r.assets || []).flatMap(a => [a.oldPath, a.newPath]));
    if (new Set(boundPaths).size !== boundPaths.length) throw new Error("Overlapping retirement path bindings");
  } catch (error) { return { paths, sourceBindings, failures: [`Cannot validate book retirements: ${error.message}`] }; }
  for (const retirement of registry.retirements) {
    if (!entries.some(entry => entry.status === "D" && retirement.assets?.some(a => `public${a.oldPath}` === entry.path))) continue;
    try {
      const previousAssetPaths = runGit(["ls-tree", "-r", "--name-only", baseline, "--", `public${retirement.oldAssetPrefix}`]).trim().split("\n").filter(Boolean).map(p => p.slice(6));
      const newDirectory = path.join(repoRoot, "public", retirement.newAssetPrefix);
      const currentAssetPaths = fs.readdirSync(newDirectory).map(name => `${retirement.newAssetPrefix}${name}`);
      const previousFiles = {}, historicalFiles = {}, currentFiles = {};
      for (const a of retirement.assets) {
        previousFiles[a.oldPath] = execFileSync("git", ["show", `${baseline}:public${a.oldPath}`], { cwd: repoRoot, maxBuffer: 50 * 1024 * 1024 });
        currentFiles[a.newPath] = fs.readFileSync(path.join(repoRoot, "public", a.newPath));
        for (const revision of retirement.sourceRevisions) historicalFiles[`${revision}:${a.oldPath}`] = execFileSync("git", ["show", `${revision}:public${a.oldPath}`], { cwd: repoRoot, maxBuffer: 50 * 1024 * 1024 });
      }
      const { getRuntimeGuidedReadingBooks } = await import("../src/utils/guidedReading/runtimeBooks.js");
      const { appVisualAssetReview } = await import("../src/content/appVisualAssetReviews.generated.js");
      const valid = await isVerifiedBookRetirement({ retirement, previousFiles, historicalFiles, currentFiles,
        previousAssetPaths, currentAssetPaths, runtimeBooks: getRuntimeGuidedReadingBooks(), approvedAssets: appVisualAssetReview.assets,
        oldFilesPresent: fs.existsSync(path.join(repoRoot, "public", retirement.oldAssetPrefix)) && fs.readdirSync(path.join(repoRoot, "public", retirement.oldAssetPrefix)).length > 0,
        referenced: hasSourceReference([retirement.oldBookId, retirement.oldAssetPrefix, ...retirement.assets.map(a => a.oldPath)]) });
      if (!valid) throw new Error("whole-book inventory, lineage, runtime, approval, decoding or reference proof failed");
      for (const a of retirement.assets) {
        paths.add(`public${a.oldPath}`);
        sourceBindings[a.oldPath] = { newPath: a.newPath, oldSha256: digest(previousFiles[a.oldPath]), newSha256: a.newSha256 };
      }
    } catch (error) { failures.push(`Unverified book retirement ${retirement.oldBookId}: ${error.message}`); }
  }
  return { paths, sourceBindings, failures };
}

// A card rendition is disposable only after its complete provenance chain is
// verified. Canonical artwork and other deleted media never enter this path.
export async function isSupersededCardCoverVariant({
  deletedPath,
  previousManifest,
  currentManifest,
  previousBytes,
  currentFiles = {},
  retiredSourceBindings = {},
  referenced = false
} = {}) {
  if (referenced || typeof deletedPath !== "string" || !deletedPath.startsWith("public/")) return false;
  const oldUrl = deletedPath.slice("public".length);
  if (!cardCoverUrlPattern.test(oldUrl) || !Buffer.isBuffer(previousBytes)) return false;
  if (!previousManifest || !currentManifest || Array.isArray(previousManifest) || Array.isArray(currentManifest)) return false;
  try {
    if (JSON.stringify(currentManifest).includes(oldUrl)) return false;
    const priorMappings = Object.entries(previousManifest).filter(([, entry]) => entry?.src === oldUrl);
    if (!priorMappings.length) return false;
    for (const [source, prior] of priorMappings) {
      const retired = !Object.hasOwn(currentManifest, source) && retiredSourceBindings[source];
      const replacementSource = Object.hasOwn(currentManifest, source) ? source : retired?.newPath;
      if (!canonicalImageUrl(source) || !canonicalImageUrl(replacementSource) ||
          !Object.hasOwn(currentManifest, replacementSource)) return false;
      const replacement = currentManifest[replacementSource];
      if (retired && (!sha256Pattern.test(retired.oldSha256) || !sha256Pattern.test(retired.newSha256) ||
          prior.sourceSha256 !== retired.oldSha256 || replacement.sourceSha256 !== retired.newSha256)) return false;
      const match = cardCoverUrlPattern.exec(replacement?.src);
      if (!sha256Pattern.test(prior.deliverySha256) || oldUrl !== `/guided-reading/card-covers/${prior.deliverySha256.slice(0, 24)}.webp` ||
          digest(previousBytes) !== prior.deliverySha256 || !match || replacement.src === oldUrl ||
          !sha256Pattern.test(replacement.deliverySha256) || match[1] !== replacement.deliverySha256.slice(0, 24) ||
          !sha256Pattern.test(replacement.sourceSha256)) return false;
      const delivery = currentFiles[replacement.src], canonical = currentFiles[replacementSource];
      if (!Buffer.isBuffer(delivery) || !Buffer.isBuffer(canonical) ||
          digest(delivery) !== replacement.deliverySha256 || digest(canonical) !== replacement.sourceSha256 ||
          delivery.length !== replacement.bytes) return false;
      const [metadata, sourceMetadata] = await Promise.all([sharp(delivery).metadata(), sharp(canonical).metadata()]);
      if (metadata.format !== "webp" || !metadata.width || !metadata.height ||
          metadata.width > 512 || metadata.height > 512 ||
          metadata.width !== replacement.width || metadata.height !== replacement.height ||
          sourceMetadata.width !== replacement.sourceWidth || sourceMetadata.height !== replacement.sourceHeight) return false;
      await sharp(delivery).raw().toBuffer(); // Header metadata alone does not prove decoding.
    }
    return true;
  } catch { return false; }
}

// Read the generator's JSON literals without executing a historical JS module.
function parseCoverManifest(source) {
  const match = /^export const GUIDED_READING_COVER_RENDITIONS = Object\.freeze\(\{\n([\s\S]*?)\n\}\);$/m.exec(source);
  if (!match) throw new Error("Unrecognized card-cover manifest");
  return JSON.parse(`{${match[1].replace(/Object\.freeze\((\{[^\n]*\})\)/g, "$1")}}`);
}

async function supersededCardCoverPaths(entries, baseline, retiredSourceBindings) {
  const valid = new Set();
  const deleted = entries.filter(row => row.status === "D" && cardCoverUrlPattern.test(row.path.replace(/^public/, "")));
  if (!deleted.length) return valid;
  let previousManifest, currentManifest;
  try {
    previousManifest = parseCoverManifest(runGit(["show", `${baseline}:${coverManifestPath}`]));
    currentManifest = parseCoverManifest(fs.readFileSync(path.join(repoRoot, coverManifestPath), "utf8"));
  } catch { return valid; }
  for (const entry of deleted) {
    try {
      const oldUrl = entry.path.slice("public".length);
      const referenced = hasSourceReference([oldUrl, path.posix.basename(oldUrl)]);
      const currentFiles = {};
      for (const [source, prior] of Object.entries(previousManifest)) {
        if (prior.src !== oldUrl) continue;
        const replacementSource = Object.hasOwn(currentManifest, source) ? source : retiredSourceBindings[source]?.newPath;
        const replacement = currentManifest[replacementSource];
        if (!replacement?.src || !cardCoverUrlPattern.test(replacement.src) ||
            !canonicalImageUrl(source) || !canonicalImageUrl(replacementSource)) continue;
        for (const url of [replacementSource, replacement.src]) currentFiles[url] = fs.readFileSync(path.join(repoRoot, "public", url));
      }
      const previousBytes = execFileSync("git", ["show", `${baseline}:${entry.path}`], { cwd: repoRoot, maxBuffer: 50 * 1024 * 1024 });
      if (await isSupersededCardCoverVariant({ deletedPath: entry.path, previousManifest, currentManifest, previousBytes, currentFiles, retiredSourceBindings, referenced })) valid.add(entry.path);
    } catch { /* Missing files, references or provenance fail closed. */ }
  }
  return valid;
}

async function losslessReplacementPaths(entries, baseline) {
  const valid = new Set();
  for (const entry of entries.filter(row => row.status === "D" && isNonWebpImagePath(row.path))) {
    const replacement = entry.path.replace(/\.[^.]+$/, ".webp");
    if (!entries.some(row => row.path === replacement && row.status === "A")) continue;
    let before, referenced;
    try {
      before = execFileSync("git", ["show", `${baseline}:${entry.path}`], { cwd: repoRoot, maxBuffer: 50 * 1024 * 1024 });
      const ref = entry.path.replace(/^public/, "");
      try { execFileSync("rg", ["-l", "-F", ref, "src", "preview", "demos"], { cwd: repoRoot, stdio: "pipe" }); referenced = true; }
      catch (error) { if (error.status !== 1) throw error; referenced = false; }
    } catch { continue; }
    if (await isLosslessWebpReplacement(before, fs.readFileSync(path.join(repoRoot, replacement)), { referenced })) valid.add(entry.path);
  }
  return valid;
}

async function main() {
  const baseline = selectMediaBaseline();
  if (process.argv.includes("--validate-narration-retirements")) {
    const narration = await verifiedNarrationSupersessions([], baseline, { validateAll: true });
    const result = { baseline, verified: narration.rows.length, failures: narration.failures, rows: narration.rows,
      passed: narration.failures.length === 0 && narration.rows.length > 0, mode: "read-only-pre-deletion-validation" };
    const receipt = path.join(repoRoot, ".artifacts", "audits", "narration_retirement_validation.json");
    ensureReportDirectory(); fs.writeFileSync(receipt, JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
    return;
  }
  const changedEntries = collectChangedPaths(baseline);
  const replacements = await losslessReplacementPaths(changedEntries, baseline);
  const retirements = await verifiedBookRetirements(changedEntries, baseline);
  const narration = await verifiedNarrationSupersessions(changedEntries, baseline);
  const supersededCovers = await supersededCardCoverPaths(changedEntries, baseline, retirements.sourceBindings);
  const mediaEntries = changedEntries.filter(entry => isMediaFile(entry.path));
  const deletedEntries = changedEntries.filter(entry => entry.status === "D" && !replacements.has(entry.path) && !supersededCovers.has(entry.path) && !retirements.paths.has(entry.path) && !narration.paths.has(entry.path));
  const tempSourceEntries = changedEntries.filter(entry => entry.status !== "D" && isTempOrSourcePath(entry.path));
  const nonWebpEntries = changedEntries.filter(entry => entry.status !== "D" && isNonWebpImagePath(entry.path));

  const warnings = [`Comparison baseline: ${baseline}${baseline !== "HEAD" ? " (pending merge: incoming tree; all worktree differences remain checked)" : ""}.`];
  const failures = [...retirements.failures, ...narration.failures];
  for (const file of replacements) warnings.push(`Pixel-identical WebP replacement verified; old runtime reference absent: ${file}`);
  for (const file of supersededCovers) warnings.push(`Superseded card-cover delivery verified against prior/current manifests, source bytes and decoded replacement; old runtime reference absent: ${file}`);
  for (const file of retirements.paths) warnings.push(`Whole-book retirement verified against explicit old/new bindings, historical bytes, runtime, approvals and decoded replacements; old runtime reference absent: ${file}`);
  for (const file of narration.paths) warnings.push(`Narration supersession verified against historical text/page/bytes, exact current text/runtime/provenance and decoded replacement; old cue and mapping absent: ${file}`);

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
      supersededCardCovers: supersededCovers.size,
      retiredBookAssets: retirements.paths.size,
      retiredNarrationClips: narration.paths.size,
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
