import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedRoots = [
  path.join(repoRoot, "public", "media"),
  path.join(repoRoot, "public", "guided-reading")
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizePublicPath(input = "") {
  const value = String(input || "").trim();
  if (!value) return "";
  if (value.startsWith("/")) return value;
  if (value.startsWith("public/")) return `/${value.replace(/^public\//, "")}`;
  return `/${value.replace(/^\/+/, "")}`;
}

function absolutePublicPath(publicPath = "") {
  return path.join(repoRoot, "public", publicPath.replace(/^\/+/, ""));
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function assertAllowed(filePath) {
  const resolved = path.resolve(filePath);
  if (!allowedRoots.some(root => resolved === root || isInside(resolved, root))) {
    throw new Error(`Refusing to delete outside allowed media roots: ${resolved}`);
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadDeletedManifest() {
  const manifestPath = path.join(repoRoot, "src/data/deletedMediaManifest.js");
  const source = fs.readFileSync(manifestPath, "utf8");
  const match = source.match(/export const deletedMediaManifest = (\[[\s\S]*?\]);/);
  if (!match) return { manifestPath, source, records: [] };
  try {
    return { manifestPath, source, records: JSON.parse(match[1]) };
  } catch {
    return { manifestPath, source, records: [] };
  }
}

function saveDeletedManifest(entry) {
  const { manifestPath, source, records } = loadDeletedManifest();
  const nextRecords = [...records, entry];
  const nextSource = source.replace(
    /export const deletedMediaManifest = \[[\s\S]*?\];/,
    `export const deletedMediaManifest = ${JSON.stringify(nextRecords, null, 2)};`
  );
  fs.writeFileSync(manifestPath, nextSource);
}

function appendAudit(entry) {
  const auditPath = path.join(repoRoot, "docs/assets/deleted_media_audit.md");
  if (!fs.existsSync(auditPath)) {
    ensureDir(path.dirname(auditPath));
    fs.writeFileSync(auditPath, [
      "# Deleted Media Audit",
      "",
      "Assets listed here are blocked from runtime. Default deletion moves files into `public/_deleted/YYYY-MM-DD/` rather than erasing them.",
      "",
      "| Deleted At | Asset Type | Path | Quarantine Path | Permanent | Book ID | Word | Skill | Reason |",
      "|---|---|---|---|---:|---|---|---|---|",
      ""
    ].join("\n"));
  }
  fs.appendFileSync(
    auditPath,
    `| ${entry.deletedAt} | ${entry.assetType} | ${entry.path} | ${entry.quarantinePath || ""} | ${entry.permanent ? "yes" : "no"} | ${entry.bookId || ""} | ${entry.word || ""} | ${entry.skillId || ""} | ${String(entry.reason || "").replace(/\|/g, "\\|")} |\n`
  );
}

const args = parseArgs(process.argv.slice(2));
const publicPath = normalizePublicPath(args.path || args.asset || "");

if (!publicPath || !args.type) {
  console.error("Usage: node tools/deleteQaAsset.js --type image|audio|guided-reading-page|guided-reading-cover|guided-reading-book --path /media/... [--bookId id] [--word word] [--skillId skill] [--reason reason] [--permanent]");
  process.exit(1);
}

const sourcePath = absolutePublicPath(publicPath);
assertAllowed(sourcePath);

const exists = fs.existsSync(sourcePath);
let quarantinePath = "";

if (exists) {
  if (args.permanent) {
    fs.rmSync(sourcePath, { force: true, recursive: false });
  } else {
    const relative = path.relative(path.join(repoRoot, "public"), sourcePath);
    const targetPath = path.join(repoRoot, "public", "_deleted", today(), relative);
    ensureDir(path.dirname(targetPath));
    fs.renameSync(sourcePath, targetPath);
    quarantinePath = `/${path.relative(path.join(repoRoot, "public"), targetPath).replace(/\\/g, "/")}`;
  }
}

const entry = {
  deletedAt: new Date().toISOString(),
  deletedBy: "admin",
  assetType: args.type,
  path: publicPath,
  bookId: args.bookId || "",
  word: args.word || "",
  skillId: args.skillId || "",
  reason: args.reason || (exists ? "Deleted by QA admin tool." : "Marked deleted; source file was already missing."),
  replacementNeeded: args.replacementNeeded === "false" ? false : true,
  quarantinePath,
  permanent: Boolean(args.permanent)
};

saveDeletedManifest(entry);
appendAudit(entry);

console.log(exists
  ? `${args.permanent ? "Permanently deleted" : "Moved to quarantine"}: ${publicPath}`
  : `Marked missing asset deleted: ${publicPath}`);
console.log("Updated src/data/deletedMediaManifest.js");
console.log("Updated docs/assets/deleted_media_audit.md");
