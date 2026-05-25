import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicDomainBooks } from "../src/content/books/publicDomainBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repoRoot, "public", "books", "public-domain");
const reportPath = path.join(repoRoot, "docs", "guided-reading", "public_domain_download_report.md");
const manualDownloadPath = path.join(repoRoot, "docs", "guided-reading", "manual_public_domain_downloads.md");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function createManifest(book) {
  const existingPath = path.join(outputRoot, book.id, "manifest.json");
  const existing = fs.existsSync(existingPath)
    ? JSON.parse(fs.readFileSync(existingPath, "utf8"))
    : {};

  return {
    ...existing,
    id: book.id,
    title: book.title,
    author: book.author || "",
    illustrator: book.illustrator || "",
    sourceUrl: book.sourceUrl,
    sourcePdfUrl: book.sourcePdfUrl,
    pdfUrl: book.pdfUrl || "",
    downloadPageUrl: book.downloadPageUrl || book.sourceUrl,
    localPdfPath: book.localPdfPath,
    publicDomain: true,
    licenseNote: book.licenseNote,
    gradeBand: book.gradeBand,
    readingType: book.readingType,
    difficulty: book.difficulty,
    estimatedPages: book.estimatedPages || 0,
    tags: book.tags || [],
    skills: book.skills || [],
    pilot: Boolean(book.pilot),
    pages: existing.pages || book.pages || [],
    comprehension: book.comprehension || [],
    active: Boolean(existing.active && existing.pages?.length),
    libraryStatus: existing.libraryStatus === "available"
      ? "available"
      : book.libraryStatus || (book.pdfUrl ? "needs_pdf" : "needs_pdf_url"),
    downloadStatus: existing.downloadStatus === "downloaded"
      ? "downloaded"
      : (book.pdfUrl ? "needs_pdf" : "needs_pdf_url"),
    processingStatus: existing.processingStatus === "processed" ? "processed" : "not_processed"
  };
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "";
  const isPdf = contentType.includes("pdf") || bytes.subarray(0, 4).toString("utf8") === "%PDF";
  if (!isPdf) {
    throw new Error(`download was not a PDF (content-type: ${contentType || "unknown"})`);
  }
  fs.writeFileSync(destination, bytes);
}

ensureDir(outputRoot);
ensureDir(path.dirname(reportPath));

const lines = [
  "# Public-Domain Book Download Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "This script creates book folders and manifests first, then attempts downloads when a verified source URL is available.",
  ""
];

const manualLines = [
  "# Manual Public-Domain Downloads",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "Use this when the local environment cannot reach external hosts. Save each file exactly as shown, then run:",
  "",
  "```bash",
  "npm run process:public-domain-books",
  "npm run audit:book-library",
  "```",
  "",
  "PDF rendering requires local tools on macOS:",
  "",
  "```bash",
  "brew install poppler imagemagick",
  "```",
  ""
];

let downloaded = 0;
let pending = 0;
let failed = 0;
let exactUrlCount = 0;

for (const book of publicDomainBooks) {
  const bookDir = path.join(outputRoot, book.id);
  ensureDir(bookDir);
  const manifestPath = path.join(bookDir, "manifest.json");
  const manifest = createManifest(book);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const pdfUrl = book.pdfUrl || "";
  const localPdfPath = path.join(bookDir, "original.pdf");
  if (!pdfUrl) {
    pending += 1;
    lines.push(`- ${book.title}: manifest created, PDF URL pending exact edition verification.`);
    continue;
  }

  exactUrlCount += 1;
  manualLines.push(`## ${book.title}`);
  manualLines.push("");
  manualLines.push(`- Source page: ${book.downloadPageUrl || book.sourceUrl}`);
  manualLines.push(`- Direct PDF/download URL: ${pdfUrl}`);
  manualLines.push(`- Local save path: ${localPdfPath}`);
  manualLines.push("- Expected filename: original.pdf");
  manualLines.push("");

  if (fs.existsSync(localPdfPath)) {
    downloaded += 1;
    lines.push(`- ${book.title}: original.pdf already exists locally; skipped download.`);
    continue;
  }

  try {
    await downloadFile(pdfUrl, localPdfPath);
    manifest.downloadStatus = "downloaded";
    manifest.libraryStatus = "needs_processing";
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    downloaded += 1;
    lines.push(`- ${book.title}: downloaded ${pdfUrl}`);
  } catch (error) {
    failed += 1;
    lines.push(`- ${book.title}: download failed from ${pdfUrl} (${error.message})`);
  }
}

lines.splice(4, 0, `Summary: ${downloaded} downloaded/already local, ${pending} pending exact URLs, ${failed} failed, ${exactUrlCount} exact pilot URL(s) available.`);
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
fs.writeFileSync(manualDownloadPath, `${manualLines.join("\n")}\n`);

console.log(`Public-domain book folders prepared: ${publicDomainBooks.length}`);
console.log(`Downloaded: ${downloaded}; pending exact URLs: ${pending}; failed: ${failed}`);
