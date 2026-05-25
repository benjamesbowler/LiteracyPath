import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const repoRoot = path.resolve(__dirname, "../..");
export const rawRoot = path.join(repoRoot, "raw/public-domain");
export const publicGuidedReadingRoot = path.join(repoRoot, "public/guided-reading");
export const coversDir = path.join(publicGuidedReadingRoot, "covers");
export const pagesRoot = path.join(publicGuidedReadingRoot, "pages");
export const audioRoot = path.join(publicGuidedReadingRoot, "audio");
export const manifestsDir = path.join(publicGuidedReadingRoot, "manifests");
export const generatedRegistryPath = path.join(repoRoot, "src/data/generated/publicDomainGuidedReadingBooks.generated.js");

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
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

export function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function publicPathFromAbsolute(filePath) {
  const relative = path.relative(path.join(repoRoot, "public"), filePath).split(path.sep).join("/");
  return `/${relative}`;
}

export function commandExists(command) {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], { encoding: "utf8" });
  return result.status === 0;
}

export function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    stdio: options.quiet ? "pipe" : "inherit"
  });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} failed${output ? `:\n${output}` : ""}`);
  }
  return result;
}

export function listFilesRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dirPath, entry.name);
    return entry.isDirectory() ? listFilesRecursive(fullPath) : [fullPath];
  });
}

export function findFirstFile(dirPath, extensions) {
  const normalizedExtensions = new Set(extensions.map(extension => extension.toLowerCase()));
  return listFilesRecursive(dirPath).find(filePath =>
    normalizedExtensions.has(path.extname(filePath).toLowerCase())
  ) || "";
}

export function copyFilePreservingDir(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

export function emptyDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

export function getBookRawDir(bookId) {
  return path.join(rawRoot, bookId);
}

export function getBookPagesDir(bookId) {
  return path.join(pagesRoot, bookId);
}

export function getBookManifestPath(bookId) {
  return path.join(manifestsDir, `${bookId}.json`);
}

export function getMetadataForBook(bookId) {
  const rawDir = getBookRawDir(bookId);
  const metadata = readJson(path.join(rawDir, "metadata.json"), {});
  const inferredTitle = metadata.title || bookId.split("-").map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ");
  return {
    id: bookId,
    title: inferredTitle,
    author: "",
    source: "",
    publicDomain: true,
    readingLevel: "early",
    guidedReadingLevel: "A",
    tags: [],
    active: false,
    qaStatus: "needs_processing",
    ...metadata,
    id: metadata.id || bookId
  };
}

export function discoverBookIds() {
  if (!fs.existsSync(rawRoot)) return [];
  return fs.readdirSync(rawRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(Boolean)
    .sort();
}

export function expectedInstallHelp() {
  return [
    "PDF/image processing tools are not fully available.",
    "Recommended macOS install:",
    "  brew install poppler imagemagick",
    "Then rerun the same command."
  ].join("\n");
}

