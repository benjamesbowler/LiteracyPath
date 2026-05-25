import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { publicDomainBooks } from "../src/content/books/publicDomainBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bookRoot = path.join(repoRoot, "public", "books", "public-domain");
const reportPath = path.join(repoRoot, "docs", "guided-reading", "public_domain_processing_report.md");
const runtimeManifestPath = path.join(repoRoot, "src", "content", "books", "publicDomainRuntimeManifest.js");

function commandExists(command) {
  try {
    execFileSync("which", [command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const hasPdfToPpm = commandExists("pdftoppm");
const hasMagick = commandExists("magick");
const hasConvert = commandExists("convert");
const lines = [
  "# Public-Domain Book Page Processing Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Renderer availability: pdftoppm=${hasPdfToPpm}, magick=${hasMagick}, convert=${hasConvert}`,
  ""
];

if (!hasPdfToPpm && !hasMagick && !hasConvert) {
  lines.push("No PDF/page rendering tool is available in this environment.");
  lines.push("");
  lines.push("Install on macOS:");
  lines.push("");
  lines.push("```bash");
  lines.push("brew install poppler imagemagick");
  lines.push("npm run process:public-domain-books");
  lines.push("npm run audit:book-library");
  lines.push("```");
  lines.push("");
}

let processed = 0;
let pending = 0;
let activated = 0;
const runtimeManifest = {};

function readManifest(bookDir) {
  const manifestPath = path.join(bookDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) return {};
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function writeManifest(bookDir, manifest) {
  fs.writeFileSync(path.join(bookDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

function getRenderedPages(pagesDir) {
  if (!fs.existsSync(pagesDir)) return [];
  return fs.readdirSync(pagesDir)
    .filter(file => /^page-\d+\.webp$/i.test(file))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));
}

function normalizePageNames(pagesDir) {
  const files = fs.readdirSync(pagesDir)
    .filter(file => /^page-\d+\.webp$/i.test(file))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));

  files.forEach((file, index) => {
    const expected = `page-${String(index + 1).padStart(3, "0")}.webp`;
    if (file === expected) return;
    fs.renameSync(path.join(pagesDir, file), path.join(pagesDir, expected));
  });

  return getRenderedPages(pagesDir);
}

for (const book of publicDomainBooks) {
  const bookDir = path.join(bookRoot, book.id);
  const pdfPath = path.join(bookDir, "original.pdf");
  const pagesDir = path.join(bookDir, "pages");
  fs.mkdirSync(pagesDir, { recursive: true });
  const manifest = readManifest(bookDir);

  if (!fs.existsSync(pdfPath)) {
    pending += 1;
    lines.push(`- ${path.basename(bookDir)}: skipped, original.pdf is missing.`);
    continue;
  }

  if (!hasPdfToPpm) {
    pending += 1;
    lines.push(`- ${path.basename(bookDir)}: original.pdf exists but pdftoppm is unavailable for webp page rendering.`);
    continue;
  }

  try {
    execFileSync("pdftoppm", ["-webp", "-r", "144", pdfPath, path.join(pagesDir, "page")], { stdio: "ignore" });
    const renderedPages = normalizePageNames(pagesDir);
    const coverPath = path.join(bookDir, "cover.webp");
    if (renderedPages.length && !fs.existsSync(coverPath)) {
      fs.copyFileSync(path.join(pagesDir, renderedPages[0]), coverPath);
    }

    const pages = renderedPages.map((file, index) => ({
      pageNumber: index + 1,
      image: `/books/public-domain/${book.id}/pages/${file}`,
      text: "",
      audio: null
    }));

    const ready = fs.existsSync(coverPath) && pages.length > 0;
    writeManifest(bookDir, {
      ...manifest,
      ...book,
      sourceUrl: manifest.sourceUrl || book.sourceUrl,
      pdfUrl: manifest.pdfUrl || book.pdfUrl || "",
      localPdfPath: `/books/public-domain/${book.id}/original.pdf`,
      cover: `/books/public-domain/${book.id}/cover.webp`,
      pageCount: pages.length,
      estimatedPages: pages.length,
      pages,
      active: ready,
      libraryStatus: ready ? "available" : "needs_review",
      downloadStatus: "downloaded",
      processingStatus: ready ? "processed" : "needs_review"
    });
    if (ready) activated += 1;
    if (ready) {
      runtimeManifest[book.id] = {
        active: true,
        cover: `/books/public-domain/${book.id}/cover.webp`,
        pageCount: pages.length,
        estimatedPages: pages.length,
        libraryStatus: "available",
        downloadStatus: "downloaded",
        processingStatus: "processed",
        pages
      };
    }
    processed += 1;
    lines.push(`- ${path.basename(bookDir)}: rendered ${renderedPages.length} pages with pdftoppm${ready ? " and activated." : "."}`);
  } catch (error) {
    pending += 1;
    lines.push(`- ${path.basename(bookDir)}: rendering failed (${error.message}).`);
  }
}

lines.splice(4, 0, `Summary: ${processed} processed, ${pending} pending, ${activated} activated.`);
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
fs.writeFileSync(
  runtimeManifestPath,
  `export const publicDomainRuntimeManifest = ${JSON.stringify(runtimeManifest, null, 2)};\n`
);

console.log(`Public-domain processing complete. Processed: ${processed}; pending: ${pending}; activated: ${activated}`);
